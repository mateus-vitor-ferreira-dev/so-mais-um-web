import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { chaves } from '../lib/queryClient'
import * as placesService from '../services/places'
import { turmasService } from '../services/turmas'
import { dayUsesService } from '../services/dayUses'

/** O que a tela abre: uma turma (alunos, chamada, mensalidades) ou um day use (entradas). */
export type AlvoDoEndereco = { tipo: 'turma' | 'dayUse'; id: string }

export interface EspacoDoEndereco {
  /** O espaço do alvo, ou `''` enquanto não se sabe (ou quando não foi achado). */
  placeId: string
  /**
   * Procurando o espaço: o endereço veio sem `?placeId=`. Terminada a busca
   * sem `placeId`, o alvo não é de nenhum espaço de quem está logado.
   */
  procurando: boolean
}

/**
 * O espaço de uma subtela da turma ou do day use, mesmo sem `?placeId=` (web#520).
 *
 * As rotas da api pedem o espaço no caminho (`/places/:placeId/turmas/...`), e
 * a tela o lê da query string. Quem chega pelos botões de Turmas e Day use já
 * recebe o `?placeId=`. Quem chega por um link cortado ou um favorito antigo
 * parava em "Falta o espaço no endereço", embora a turma diga sozinha de que
 * espaço é.
 *
 * Sem o parâmetro, a busca passa pelas **listas** dos espaços de quem está
 * logado (todos, no admin) e acha o que contém o alvo. A api não tem detalhe de
 * turma nem de day use sem o espaço, e as listas usam as mesmas chaves de cache
 * das telas vizinhas: a de Alunos, que lê a lista de turmas logo depois, não
 * paga a requisição de novo. Achado o espaço, o endereço ganha o `?placeId=`
 * com `replace` — recarregar ou voltar não refaz a busca.
 */
export function useEspacoDoEndereco({ tipo, id }: AlvoDoEndereco): EspacoDoEndereco {
  const [params, setParams] = useSearchParams()
  const pedido = params.get('placeId') ?? ''
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const busca = useQuery({
    queryKey: ['espaco-do-endereco', tipo, id, user?.id] as const,
    enabled: !pedido && Boolean(id) && Boolean(user),
    staleTime: Infinity,
    queryFn: async (): Promise<string | null> => {
      const resposta = await placesService.mine()
      // Os do dono, ou todos para o admin: quem filtra é a api (api#618).
      const espacos = resposta.data.data

      // Um espaço que recusa a lista (sem plano, sem permissão) não é o dono do
      // alvo, e não pode derrubar a busca nos outros.
      const achados = await Promise.all(espacos.map(async (espaco) => {
        try {
          const itens = tipo === 'turma'
            ? await queryClient.fetchQuery({
              queryKey: chaves.turmas(espaco.id),
              queryFn: () => turmasService.listar(espaco.id),
            })
            : await queryClient.fetchQuery({
              queryKey: chaves.dayUses(espaco.id, true),
              queryFn: () => dayUsesService.listar(espaco.id, true),
            })
          return itens.some((item) => item.id === id) ? espaco.id : null
        } catch {
          return null
        }
      }))
      return achados.find((placeId) => placeId !== null) ?? null
    },
  })

  const achado = busca.data ?? ''

  useEffect(() => {
    if (pedido || !achado) return
    setParams((atuais) => {
      const novos = new URLSearchParams(atuais)
      novos.set('placeId', achado)
      return novos
    }, { replace: true })
  }, [pedido, achado, setParams])

  if (pedido) return { placeId: pedido, procurando: false }
  return {
    placeId: achado,
    procurando: Boolean(id) && (busca.isPending || busca.isFetching) && !achado,
  }
}
