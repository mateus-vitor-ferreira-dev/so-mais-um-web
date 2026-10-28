import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import type { ApiPaginada, InfoDaPagina } from '../types/api'

/**
 * Uma lista que a api entrega por página, com cursor (api#618).
 *
 * As páginas se acumulam: "Carregar mais" acrescenta a próxima embaixo, e a
 * pessoa não perde de vista o que já estava lendo. É o desenho que o cursor
 * pede — ele sabe ir para a próxima, não pular para a sétima.
 *
 * Trocar o filtro (a chave) recomeça da primeira página, mas **a lista de antes
 * fica na tela até a nova chegar** (`keepPreviousData`): digitar na busca não
 * faz a tabela sumir e voltar a cada letra.
 *
 * A `pagina` devolvida é a da **última** página carregada. O `total` e o que a
 * rota manda a mais (a contagem por papel, por exemplo) valem para a lista
 * inteira, então tanto faz de qual página vêm — e a última é a mais fresca.
 */
export function useListaPaginada<T, P extends InfoDaPagina = InfoDaPagina>(
  chave: QueryKey,
  buscar: (cursor: string | undefined) => Promise<ApiPaginada<T, P>>,
  opcoes: { habilitada?: boolean } = {},
) {
  const consulta = useInfiniteQuery({
    queryKey: chave,
    queryFn: ({ pageParam }) => buscar(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (ultima) => ultima.pagina?.proximo ?? undefined,
    placeholderData: keepPreviousData,
    enabled: opcoes.habilitada ?? true,
  })

  const paginas = consulta.data?.pages ?? []
  const itens = paginas.flatMap((pagina) => pagina.data)
  const pagina = paginas.at(-1)?.pagina

  return {
    itens,
    pagina,
    /** Quantos há no total, com o filtro — ou quantos vieram, se a rota não conta. */
    total: pagina?.total ?? itens.length,
    carregando: consulta.isPending,
    /** Buscando outra coisa com a lista antiga ainda na tela (troca de filtro). */
    atualizando: consulta.isFetching && !consulta.isFetchingNextPage && !consulta.isPending,
    erro: consulta.isError,
    temMais: consulta.hasNextPage,
    carregandoMais: consulta.isFetchingNextPage,
    carregarMais: () => void consulta.fetchNextPage(),
    recarregar: () => consulta.refetch(),
  }
}
