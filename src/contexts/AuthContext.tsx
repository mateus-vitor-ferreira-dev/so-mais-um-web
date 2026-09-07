import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import * as authService from '../services/auth'
import type {
  LoginInput,
  RegisterInput,
  RegisterOwnerInput,
} from '../services/auth'
import { marcarSessao, esquecerSessao, temSessao } from '../services/api'
import type { ApiEnvelope, AuthResult, UserMe } from '../types/api'

export interface AuthContextValue {
  user: UserMe | null
  loading: boolean
  isAuthenticated: boolean
  /**
   * O boot tinha marca de sessão e **não conseguiu verificar** — 429, 5xx,
   * queda de rede. É diferente de não estar autenticado (web#346).
   *
   * Quem guarda rota usa isto para não mandar ao login quem provavelmente está
   * logado: o cookie continua no navegador, e o que faltou foi resposta.
   */
  verificacaoFalhou: boolean
  /** Tenta verificar de novo. É o botão da tela de falha. */
  tentarNovamente: () => Promise<void>
  register: (data: RegisterInput) => Promise<ApiEnvelope<AuthResult>>
  registerOwner: (data: RegisterOwnerInput) => Promise<ApiEnvelope<AuthResult>>
  login: (data: LoginInput) => Promise<ApiEnvelope<AuthResult>>
  googleLogin: (idToken: string) => Promise<ApiEnvelope<AuthResult>>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Provedor de autenticação da aplicação.
 *
 * A sessão vive num cookie `httpOnly` que este código não lê — quem a envia é o
 * navegador, em toda requisição, por causa do `withCredentials` em services/api.
 * Aqui só se guarda a marca de que ela existe, para saber se vale a pena
 * perguntar quem é o usuário ao abrir o app.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<UserMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [verificacaoFalhou, setVerificacaoFalhou] = useState(false)

  /**
   * Restaura a sessão ao montar — e **só apaga a marca quando a api diz que ela
   * não vale** (web#346).
   *
   * O `.catch(esquecerSessao)` que estava aqui não olhava o erro: rate limit,
   * timeout, DNS, Wi-Fi que caiu no elevador — todos apagavam a marca, e a
   * navegação seguinte mandava a pessoa para o login. O cookie continuava
   * válido; o que se perdeu foi a marca que o app usa para decidir se vale a
   * pena perguntar quem é.
   *
   * E o sintoma não é "erro ao carregar": é **tela de login**. A pessoa acha
   * que a sessão expirou e digita a senha de novo.
   *
   * O interceptor do `api.ts` já fazia a distinção certa — só desloga em 401 —,
   * e o comentário dele explica por quê. A regra existia; o boot é que não a
   * seguia.
   */
  const verificarSessao = useCallback(async () => {
    if (!temSessao()) { setLoading(false); return }

    setLoading(true)
    setVerificacaoFalhou(false)
    try {
      const res = await authService.getMe()
      setUser(res.data)
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status

      if (status === 401 || status === 403) {
        // A api disse que a sessão não vale. É o único caso em que apagar é
        // certo — e o 403 entra junto porque sessão sem permissão de ler o
        // próprio perfil também não é sessão utilizável.
        esquecerSessao()
      } else {
        // 429, 5xx, erro sem `response`. A sessão pode estar boa: a marca fica,
        // e quem guarda rota mostra falha em vez de login.
        setVerificacaoFalhou(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void verificarSessao() }, [verificarSessao])

  /**
   * Fecha a autenticação: marca a sessão e popula o usuário pelo GET /auth/me.
   *
   * Não há token para guardar — o cookie já veio na resposta do login. O que se
   * anota é só a marca, e ela existe para o app não sair perguntando `/auth/me`
   * para visitante que nunca entrou.
   *
   * O payload de login traz só os campos públicos da conta (`UserSessao`), sem
   * o `pixKey` que o formulário de perfil precisa. Buscar o perfil aqui deixa
   * uma forma só de `user` no app — a mesma que a restauração de sessão ali em
   * cima já usa. Custa uma requisição a mais num evento que acontece uma vez
   * por sessão, e em troca não existe mais um `user` pela metade circulando.
   */
  const concluirAutenticacao = useCallback(async () => {
    marcarSessao()

    try {
      const me = await authService.getMe()
      setUser(me.data)
    } catch (err) {
      // Sem o perfil não há sessão utilizável. Falhar visível, e deixar a
      // pessoa tentar de novo, é melhor do que ficar autenticado pela metade.
      esquecerSessao()
      throw err
    }
  }, [])

  const register = useCallback(async (data: RegisterInput) => {
    const res = await authService.register(data)
    await concluirAutenticacao()
    return res
  }, [concluirAutenticacao])

  const registerOwner = useCallback(async (data: RegisterOwnerInput) => {
    const res = await authService.registerOwner(data)
    await concluirAutenticacao()
    return res
  }, [concluirAutenticacao])

  const login = useCallback(async (data: LoginInput) => {
    const res = await authService.login(data)
    await concluirAutenticacao()
    return res
  }, [concluirAutenticacao])

  /** `idToken` é o credential retornado pelo componente GoogleLogin. */
  const googleLogin = useCallback(async (idToken: string) => {
    const res = await authService.googleAuth(idToken)
    await concluirAutenticacao()
    return res
  }, [concluirAutenticacao])

  /** Recarrega os dados do usuário autenticado (uso após editar perfil) */
  const refreshUser = useCallback(async () => {
    const res = await authService.getMe()
    setUser(res.data)
  }, [])

  /**
   * O botão da tela de falha.
   *
   * Repete o mesmo caminho do boot — inclusive a distinção de 401 —, em vez de
   * um `getMe` solto: se a segunda tentativa levar 401, a marca precisa sair,
   * e um retry que só tentasse de novo deixaria a pessoa presa numa tela de
   * erro com sessão que de fato expirou.
   */
  const tentarNovamente = useCallback(() => verificarSessao(), [verificarSessao])

  /**
   * Encerra a sessão: estado local primeiro, pedido à API depois.
   *
   * A ordem importa. Quem chama faz `logout(); navigate('/login')` sem esperar,
   * e /login manda usuário autenticado de volta para /home — se o `setUser(null)`
   * ficasse atrás de um await de rede, a pessoa clicaria em sair e voltaria para
   * dentro do app.
   *
   * O cookie é `httpOnly`, então quem o apaga é a API. Se essa chamada falhar —
   * sem rede, por exemplo —, o app já está deslogado e o cookie sobrevive até
   * expirar ou até o próximo login sobrescrevê-lo. É o melhor esforço possível
   * daqui, e não vale segurar a saída por causa dele.
   */
  const logout = useCallback(() => {
    esquecerSessao()
    setUser(null)
    void authService.logout().catch(() => {})
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      verificacaoFalhou,
      tentarNovamente,
      register,
      registerOwner,
      login,
      googleLogin,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para consumir o contexto de autenticação.
 * Deve ser usado dentro de um `AuthProvider`.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
