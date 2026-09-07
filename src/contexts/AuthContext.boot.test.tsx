/**
 * O boot com `/auth/me` falhando (web#346).
 *
 * ## O que estes testes travam
 *
 * A distinção entre **"a sessão não vale"** e **"não deu para verificar"**.
 *
 * O `.catch(esquecerSessao)` que estava aqui não olhava o erro: rate limit,
 * timeout, DNS, Wi-Fi que caiu no elevador — todos apagavam a marca, e a
 * navegação seguinte mandava a pessoa para o login com o cookie válido no
 * navegador.
 *
 * O sintoma não era "erro ao carregar", era **tela de login** — e a pessoa
 * concluía que a sessão tinha expirado e digitava a senha de novo.
 *
 * A issue foi explícita: *"nenhum dos 594 atuais cobre o boot com erro que não
 * seja 401"*. Estes cobrem.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import { lightTheme } from '../styles/theme'
import { AuthProvider, useAuth } from './AuthContext'
import { SESSION_HINT_KEY } from '../services/api'
import * as authService from '../services/auth'

vi.mock('../services/auth')
const getMe = vi.mocked(authService.getMe)

function erroComStatus(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), { response: { status } })
}

function Sonda() {
  const { user, loading, verificacaoFalhou, isAuthenticated } = useAuth()
  if (loading) return <span>carregando</span>
  return (
    <span>
      {`user=${user ? user.name : 'null'} auth=${isAuthenticated} falhou=${verificacaoFalhou}`}
    </span>
  )
}

const monta = () =>
  render(
    <ThemeProvider theme={lightTheme}>
      <AuthProvider><Sonda /></AuthProvider>
    </ThemeProvider>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  // Quem tinha sessão: é o cenário inteiro da issue.
  localStorage.setItem(SESSION_HINT_KEY, '1')
})

describe('boot com marca de sessão', () => {
  it('401 apaga a marca — a api disse que ela não vale', async () => {
    getMe.mockRejectedValue(erroComStatus(401))
    monta()

    await waitFor(() => expect(screen.getByText(/falhou=false/)).toBeInTheDocument())
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull()
    expect(screen.getByText(/auth=false/)).toBeInTheDocument()
  })

  it('403 também apaga: sessão que não lê o próprio perfil não é utilizável', async () => {
    getMe.mockRejectedValue(erroComStatus(403))
    monta()

    await waitFor(() => expect(screen.getByText(/falhou=false/)).toBeInTheDocument())
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull()
  })

  it('429 NÃO apaga a marca — foi o caso que a issue reproduziu', async () => {
    getMe.mockRejectedValue(erroComStatus(429))
    monta()

    await waitFor(() => expect(screen.getByText(/falhou=true/)).toBeInTheDocument())
    // O cookie continua no navegador; o que faltou foi resposta.
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBe('1')
  })

  it('5xx não apaga', async () => {
    getMe.mockRejectedValue(erroComStatus(503))
    monta()

    await waitFor(() => expect(screen.getByText(/falhou=true/)).toBeInTheDocument())
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBe('1')
  })

  it('erro de rede — sem `response` — não apaga', async () => {
    // É o caso mais provável em produção: 4G ruim, elevador, vestiário.
    getMe.mockRejectedValue(new Error('Network Error'))
    monta()

    await waitFor(() => expect(screen.getByText(/falhou=true/)).toBeInTheDocument())
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBe('1')
  })

  it('sucesso popula o usuário e não marca falha', async () => {
    getMe.mockResolvedValue({ data: { id: 'u1', name: 'Ana' } } as never)
    monta()

    await waitFor(() => expect(screen.getByText(/user=Ana/)).toBeInTheDocument())
    expect(screen.getByText(/falhou=false/)).toBeInTheDocument()
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBe('1')
  })

  it('sem marca de sessão, nem pergunta', async () => {
    localStorage.clear()
    monta()

    await waitFor(() => expect(screen.getByText(/user=null/)).toBeInTheDocument())
    expect(getMe).not.toHaveBeenCalled()
    expect(screen.getByText(/falhou=false/)).toBeInTheDocument()
  })
})
