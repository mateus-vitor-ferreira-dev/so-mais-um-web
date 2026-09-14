import api from './api'
import type { AgendaDaQuadra, ApiEnvelope, CotacaoDoHorario, Court, CourtStatus, CourtType, FaixaDeExpediente, FaixaDePrecoDaQuadra } from '../types/api'

/** ⚠️ Devolve o ENVELOPE da API — quem consome escreve `res.data`. */

export interface CourtFilters {
  type?: CourtType
  status?: CourtStatus
  minPrice?: number
  maxPrice?: number
  availableAt?: string
  city?: string
  neighborhood?: string
}

export interface CourtInput {
  name: string
  type: CourtType
  pricePerHour?: number | null
  /** `null` volta a quadra para "não informado" (api#581). */
  coberta?: boolean | null
  precoVariaPorHorario?: boolean
}

export function searchCourts(filters?: CourtFilters): Promise<ApiEnvelope<Court[]>> {
  return api.get('/courts', { params: filters }).then((r) => r.data)
}

export function getCourtsByPlace(placeId: string): Promise<ApiEnvelope<Court[]>> {
  return api.get(`/places/${placeId}/courts`).then((r) => r.data)
}

export function createCourt(placeId: string, data: CourtInput): Promise<ApiEnvelope<Court>> {
  return api.post(`/places/${placeId}/courts`, data).then((r) => r.data)
}

export function updateCourt(
  placeId: string,
  courtId: string,
  data: Partial<CourtInput>,
): Promise<ApiEnvelope<Court>> {
  return api.patch(`/places/${placeId}/courts/${courtId}`, data).then((r) => r.data)
}

/** A quadra sozinha, que é a única resposta que traz as faixas de preço (api#576). */
export function getCourt(placeId: string, courtId: string): Promise<ApiEnvelope<Court>> {
  return api.get(`/places/${placeId}/courts/${courtId}`).then((r) => r.data)
}

/**
 * Substitui a semana inteira de faixas (api#576). Lista vazia é válida: é a
 * opção ligada com todo horário no preço padrão.
 *
 * A api recusa sobreposição com 422 `FAIXAS_DE_PRECO_SOBREPOSTAS`, dizendo as
 * posições das duas **na ordem desta lista** ("As faixas 2 e 5 se sobrepõem").
 */
export function substituirFaixasDePreco(
  placeId: string,
  courtId: string,
  faixas: Array<Omit<FaixaDePrecoDaQuadra, 'valorPorHora'> & { valorPorHora: number }>,
): Promise<ApiEnvelope<Court>> {
  return api.put(`/places/${placeId}/courts/${courtId}/faixas-de-preco`, { faixas }).then((r) => r.data)
}

/**
 * O preço deste horário, com o detalhamento por trecho (api#577). Pública.
 *
 * Sem `duracaoMinutos`, a api cota os 60 minutos padrão da partida — e quem
 * chama precisa dizer isso na tela.
 */
export function cotarHorario(courtId: string, inicio: string, duracaoMinutos?: number): Promise<ApiEnvelope<CotacaoDoHorario>> {
  return api
    .get(`/courts/${courtId}/preco`, { params: { inicio, ...(duracaoMinutos ? { duracaoMinutos } : {}) } })
    .then((r) => r.data)
}

/** O expediente do espaço (api#454). Público; lista vazia é espaço sem horário cadastrado. */
export function getExpediente(placeId: string): Promise<ApiEnvelope<FaixaDeExpediente[]>> {
  return api.get(`/places/${placeId}/opening-hours`).then((r) => r.data)
}

export function deleteCourt(placeId: string, courtId: string): Promise<ApiEnvelope<Court>> {
  return api.delete(`/places/${placeId}/courts/${courtId}`).then((r) => r.data)
}

export function updateCourtStatus(
  placeId: string,
  courtId: string,
  status: CourtStatus,
): Promise<ApiEnvelope<Court>> {
  return api.patch(`/places/${placeId}/courts/${courtId}/status`, { status }).then((r) => r.data)
}

/**
 * O que já ocupa esta quadra entre `de` e `ate` (api#443).
 *
 * Os dois são opcionais na api — sem eles ela responde as próximas 24 horas —,
 * e obrigatórios aqui: quem chama esta função está olhando um dia específico, e
 * deixar a janela implícita esconderia qual.
 */
export function getAgendaDaQuadra(
  courtId: string,
  de: string,
  ate: string,
): Promise<ApiEnvelope<AgendaDaQuadra>> {
  return api.get(`/courts/${courtId}/agenda`, { params: { de, ate } }).then((r) => r.data)
}
