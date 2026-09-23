import type { AxiosResponse } from 'axios'
import api from './api'
import type { ApiEnvelope, ApiPaginada, InfoDaPagina, PedidoDePagina, UserRole } from '../types/api'

/** ⚠️ Devolve a resposta bruta do axios — quem consome escreve `res.data.data`. */

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  badge: string | null
  createdAt: string
  _count: { placesOwned: number; matchesCreated: number; participations: number }
}

export interface InviteResult {
  email: string
  expiresAt: string
  inviteUrl: string
}

export interface FiltroDeUsuarios {
  role?: UserRole
  /** Pedaço do nome ou do e-mail; a api busca sem diferença de maiúscula. */
  busca?: string
}

/** A `pagina` da Gestão de Usuários: além do cursor, os números dos cartões do topo. */
export interface PaginaDeUsuarios extends InfoDaPagina {
  total: number
  /** A base inteira por papel, sem o filtro. */
  porPapel: Record<UserRole, number>
}

/**
 * Uma página de usuários (api#618). Devolve o corpo, e não a resposta do axios:
 * é o que o `useListaPaginada` e a busca de pessoa consomem.
 */
export const listUsers = (
  filtro: FiltroDeUsuarios = {},
  pagina: PedidoDePagina = {},
): Promise<ApiPaginada<AdminUser, PaginaDeUsuarios>> =>
  api
    .get('/admin/users', {
      params: {
        ...(filtro.role ? { role: filtro.role } : {}),
        ...(filtro.busca?.trim() ? { busca: filtro.busca.trim() } : {}),
        ...pagina,
      },
    })
    .then((r) => r.data)

export const updateUserRole = (
  userId: string,
  role: UserRole,
): Promise<AxiosResponse<ApiEnvelope<AdminUser>>> =>
  api.patch(`/admin/users/${userId}/role`, { role })

export const inviteOwner = (email: string): Promise<AxiosResponse<ApiEnvelope<InviteResult>>> =>
  api.post('/admin/invite-owner', { email })
