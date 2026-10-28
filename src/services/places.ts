import type { AxiosResponse } from 'axios'
import api from './api'
import type { ApiEnvelope, ApiPaginada, InfoDaPagina, PedidoDePagina, Place, PlaceStatus } from '../types/api'

/**
 * ⚠️ Convenção deste arquivo: devolve a RESPOSTA BRUTA do axios, então quem
 * consome escreve `res.data.data`. Difere de auth.ts/events.ts (que devolvem o
 * envelope) e de sports.ts (que devolve o conteúdo já desembrulhado).
 * Comportamento preservado da versão em JS.
 */

export interface PlaceInput {
  name: string
  street: string
  number: string
  complement?: string | null
  neighborhood: string
  city: string
  state: string
  zipCode: string
  country?: string
}

/**
 * Uma página da lista pública de espaços, por nome (api#618). A busca olha
 * nome, cidade e bairro.
 */
/** A `pagina` da lista de espaços: os números da plataforma, que não mudam com a busca. */
export interface PaginaDeEspacos extends InfoDaPagina {
  porStatus: Record<PlaceStatus, number>
  semDono: number
}

export const list = (busca = '', pagina: PedidoDePagina = {}): Promise<ApiPaginada<Place, PaginaDeEspacos>> =>
  api
    .get('/places', { params: { ...(busca.trim() ? { busca: busca.trim() } : {}), ...pagina } })
    .then((r) => r.data)

/**
 * Os espaços de quem está logado — ou todos, para o admin (api#618).
 *
 * É o seletor "qual espaço" das telas do painel. Até a api#618 cada uma pedia a
 * lista pública inteira e filtrava pelo `ownerId` no navegador; com a lista
 * paginada, o espaço do dono podia não estar na primeira página.
 */
export const mine = (): Promise<AxiosResponse<ApiEnvelope<Place[]>>> =>
  api.get('/places/mine')

export const getOne = (id: string): Promise<AxiosResponse<ApiEnvelope<Place>>> =>
  api.get(`/places/${id}`)

export const create = (data: PlaceInput): Promise<AxiosResponse<ApiEnvelope<Place>>> =>
  api.post('/places', data)

export const update = (
  id: string,
  data: Partial<PlaceInput>,
): Promise<AxiosResponse<ApiEnvelope<Place>>> => api.patch(`/places/${id}`, data)

export const updateStatus = (
  id: string,
  status: PlaceStatus,
): Promise<AxiosResponse<ApiEnvelope<Place>>> => api.patch(`/places/${id}/status`, { status })

export const assignOwner = (
  id: string,
  ownerId: string,
): Promise<AxiosResponse<ApiEnvelope<Place>>> => api.patch(`/places/${id}/owner`, { ownerId })
