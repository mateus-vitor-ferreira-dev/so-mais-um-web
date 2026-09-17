import type { AppTheme } from '../styles/theme'
import type { UserRole } from '../types/api'

type Cor = keyof AppTheme['colors']

/** O par de tokens de cada papel: o fundo claro e o texto que passa dos 4,5:1 sobre ele. */
export interface TomDoPapel {
  fundo: Cor
  texto: Cor
}

interface Papel extends TomDoPapel {
  label: string
}

/**
 * O rótulo e o tom de cada papel, para o `RoleBadge` e o avatar da Gestão de
 * Usuários desenharem a mesma cor.
 *
 * A chave USER não corresponde a nenhum papel da API — os papéis são PLAYER,
 * OWNER e ADMIN. Ela é o rótulo genérico de fallback, e é o que o PLAYER acaba
 * exibindo ("Usuário"). Partial deixa claro que nem todo UserRole tem entrada
 * própria.
 *
 * Tokens, e não hexadecimal (#511): o azul antigo dava 4,24 sobre o próprio
 * fundo, e no escuro o selo continuava claro no meio da tabela escura.
 */
const PAPEIS: Partial<Record<UserRole | 'USER', Papel>> = {
  ADMIN: { label: 'Admin',   fundo: 'warningLight', texto: 'warningText' },
  OWNER: { label: 'Owner',   fundo: 'primaryLight', texto: 'primaryDark' },
  USER:  { label: 'Usuário', fundo: 'infoLight',    texto: 'infoText' },
}

export function papel(role: UserRole): Papel {
  return PAPEIS[role] ?? (PAPEIS.USER as Papel)
}
