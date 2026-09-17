/**
 * As telas que a checagem mede, uma amostra de cada área (web#511).
 *
 * Cada `id` dá nome a dois arquivos: `respostas/<id>.json`, com o que a api
 * respondeu quando a tela foi gravada, e `conhecidos/<id>.json`, com as
 * ocorrências que já existiam e ainda não foram corrigidas.
 *
 * Para acrescentar uma tela: ponha aqui, grave (`GRAVAR=1`) e gere a lista de
 * conhecidos (`ATUALIZAR_CONHECIDOS=1`). Ver o topo do `responsividade.spec.ts`.
 */
export type Sessao = 'admin' | 'dono' | 'jogador' | 'visitante'

export interface Tela {
  id: string
  sessao: Sessao
  rota: string
}

/**
 * Logins da seed de desenvolvimento, que é fictícia. Só a gravação os usa, e
 * nela o login é feito pelo Node: o cookie de sessão fica na memória do
 * processo e nunca chega a arquivo.
 */
export const LOGINS: Record<Exclude<Sessao, 'visitante'>, { email: string; senha: string }> = {
  admin: { email: 'mateus.ferreira10profissional@gmail.com', senha: 'admin123' },
  dono: { email: 'contato@napraialavras.com.br', senha: 'senha123' },
  jogador: { email: 'mateus@player.com', senha: 'senha123' },
}

export const TELAS: Tela[] = [
  { id: 'admin-usuarios', sessao: 'admin', rota: '/admin/users' },
  { id: 'admin-visao-geral', sessao: 'admin', rota: '/admin/dashboard' },
  { id: 'admin-assinaturas', sessao: 'admin', rota: '/admin/subscriptions' },
  { id: 'admin-suporte', sessao: 'admin', rota: '/admin/suporte' },

  { id: 'dono-visao-geral', sessao: 'dono', rota: '/owner/dashboard' },
  { id: 'dono-turmas', sessao: 'dono', rota: '/owner/turmas' },
  { id: 'dono-quadras', sessao: 'dono', rota: '/owner/places/cmu2qp3bk004vpk1xajo58ucp/courts' },
  { id: 'dono-estoque', sessao: 'dono', rota: '/owner/inventory' },
  { id: 'dono-solicitacoes', sessao: 'dono', rota: '/owner/requests' },

  { id: 'jogador-inicio', sessao: 'jogador', rota: '/home' },
  { id: 'jogador-minhas-partidas', sessao: 'jogador', rota: '/minhas-partidas' },
  { id: 'jogador-torneios', sessao: 'jogador', rota: '/torneios' },
  { id: 'jogador-perfil', sessao: 'jogador', rota: '/perfil' },
  { id: 'jogador-criar-partida', sessao: 'jogador', rota: '/criar-partida' },
  { id: 'jogador-avaliacoes', sessao: 'jogador', rota: '/avaliacoes' },

  { id: 'visitante-login', sessao: 'visitante', rota: '/login' },
  { id: 'visitante-cadastro', sessao: 'visitante', rota: '/register' },
]

/** As larguras de celular da #511: a menor comum (360) e a do iPhone atual (390). */
export const LARGURAS = [360, 390] as const
