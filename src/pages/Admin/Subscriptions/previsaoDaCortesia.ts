import type { UserRole } from '../../../types/api'

export interface ContaDaBusca {
  id: string
  name: string
  email: string
  role: UserRole
}

interface Contexto {
  /** Todas as contas, de qualquer papel. */
  contas: ContaDaBusca[]
  /** Os e-mails que já têm assinatura, em minúsculas. */
  assinam: Set<string>
  /** Os e-mails com convite de cortesia esperando o cadastro, em minúsculas. */
  pendentes: Set<string>
  dias: number
}

const pareceEmail = (texto: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto)

export type OQueAcontece =
  | { tipo: 'concede'; texto: string }
  | { tipo: 'convite'; texto: string }
  | { tipo: 'recusa'; texto: string }

/**
 * O que a api vai fazer com este e-mail, dito **antes** de confirmar (web#503).
 *
 * É uma previsão, e não a regra: quem decide é a api, e a tela mostra a recusa
 * dela se a lista daqui estiver velha. A previsão existe para o convite — o
 * admin precisa saber que vai mandar um e-mail a alguém, e não conceder na hora.
 */
export function oQueAcontece(
  email: string,
  { contas, assinam, pendentes, dias }: Contexto,
): OQueAcontece | null {
  const alvo = email.trim().toLowerCase()
  if (!pareceEmail(alvo)) return null

  const conta = contas.find((c) => c.email.toLowerCase() === alvo)
  if (!conta) {
    if (pendentes.has(alvo)) {
      return { tipo: 'recusa', texto: 'Este e-mail já tem um convite com cortesia esperando o cadastro.' }
    }
    return {
      tipo: 'convite',
      texto: `Ninguém tem conta com este e-mail. Vamos mandar um convite de dono, e os ${dias} ${dias === 1 ? 'dia' : 'dias'} de cortesia começam quando a conta for criada.`,
    }
  }
  if (conta.role === 'PLAYER') {
    return {
      tipo: 'recusa',
      texto: `${conta.name} é jogador. Cortesia é para dono de espaço: se ele vai ser dono, troque o papel dele em Usuários antes.`,
    }
  }
  if (conta.role !== 'OWNER') {
    return { tipo: 'recusa', texto: `${conta.name} é administrador. Cortesia é para dono de espaço.` }
  }
  if (assinam.has(alvo)) {
    return { tipo: 'recusa', texto: `${conta.name} já tem assinatura. Para estender, use Renovar.` }
  }
  return { tipo: 'concede', texto: `${conta.name} já é dono: a cortesia vale na hora.` }
}
