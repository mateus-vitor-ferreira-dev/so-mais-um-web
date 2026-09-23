import { keepPreviousData, useQuery } from '@tanstack/react-query'
import * as adminService from '../services/admin'
import { chaves } from '../lib/queryClient'
import { useValorAtrasado } from './useValorAtrasado'
import type { UserRole } from '../types/api'

interface Opcoes {
  /** O que a pessoa digitou. Vai ao servidor depois do debounce. */
  termo: string
  papel?: UserRole
  /** Quantos trazer. Poucos para sugestão; mais quando a tela filtra por cima. */
  limite?: number
  habilitada?: boolean
}

/**
 * Busca de usuários no servidor, para os campos do admin que escolhem alguém
 * (api#618).
 *
 * Até a api#618 esses campos baixavam a base inteira — todos os donos, ou
 * todos os usuários — e filtravam no navegador. Agora cada tecla (depois do
 * debounce) pergunta à api, que devolve só os que casam.
 *
 * `buscando` inclui o intervalo do debounce: enquanto o termo digitado ainda
 * não virou pergunta, o que está na tela é a resposta de um termo anterior, e
 * quem decide algo com base nela (a previsão da cortesia) precisa saber disso.
 */
export function useBuscaDeUsuarios({ termo, papel, limite = 8, habilitada = true }: Opcoes) {
  const limpo = termo.trim()
  const atrasado = useValorAtrasado(limpo)

  const consulta = useQuery({
    queryKey: chaves.buscaDeUsuarios(papel ?? 'TODOS', atrasado, limite),
    queryFn: () => adminService.listUsers({ role: papel, busca: atrasado }, { limite }),
    enabled: habilitada,
    placeholderData: keepPreviousData,
  })

  return {
    pessoas: consulta.data?.data ?? [],
    buscando: habilitada && (consulta.isFetching || limpo !== atrasado),
    carregando: habilitada && consulta.isPending,
  }
}
