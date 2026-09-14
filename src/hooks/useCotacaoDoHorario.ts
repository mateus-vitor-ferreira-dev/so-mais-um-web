import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cotarHorario } from '../services/courts'
import { chaves } from '../lib/queryClient'
import { DURACAO_PADRAO_MINUTOS } from '../utils/agenda'
import type { CotacaoDoHorario } from '../types/api'

/**
 * O preço do horário que o organizador está escolhendo (web#475, api#577).
 *
 * ## A conta é da api
 *
 * A tela pergunta e mostra. O preço proporcional por minuto, a faixa que
 * atravessa a meia-noite e a hora de parede moram num lugar só, e é lá.
 *
 * ## Não cota a cada tecla
 *
 * Hora e duração mudam aos poucos — "1", "19", "19:3", "19:30". Um pequeno
 * atraso antes de perguntar, e a chave do react-query faz a resposta mais
 * recente vencer: a de "19:3" chega depois e não é a que a tela está olhando.
 *
 * ## Falhar aqui é silencioso
 *
 * Ao contrário da agenda. A cotação é conforto: o valor total continua
 * obrigatório e digitável, e uma cotação que falhou só some da tela.
 */

const ATRASO_MS = 400

export interface EstadoDaCotacao {
  cotacao: CotacaoDoHorario | null
  carregando: boolean
  /** A duração que a api cotou: a digitada, ou os 60 minutos padrão. */
  duracaoCotada: number
  /** A duração veio vazia e a cotação usou o padrão — a tela diz isso. */
  usouDuracaoPadrao: boolean
}

export function useCotacaoDoHorario(
  courtId: string | undefined,
  dataLocal: string | undefined,
  duracaoMinutos: number | string | undefined,
  habilitada: boolean,
): EstadoDaCotacao {
  const duracao = Number(duracaoMinutos) > 0 ? Number(duracaoMinutos) : undefined
  const inicio = dataLocal && !Number.isNaN(new Date(dataLocal).getTime()) ? new Date(dataLocal).toISOString() : null

  const [pedido, setPedido] = useState<{ inicio: string; duracao: number | undefined } | null>(null)
  useEffect(() => {
    const temporizador = setTimeout(() => setPedido(inicio ? { inicio, duracao } : null), ATRASO_MS)
    return () => clearTimeout(temporizador)
  }, [inicio, duracao])

  const ativa = Boolean(habilitada && courtId && pedido)
  const { data, isFetching } = useQuery({
    queryKey: chaves.cotacaoDoHorario(courtId ?? '', pedido?.inicio ?? '', pedido?.duracao ?? 0),
    queryFn: () => cotarHorario(courtId!, pedido!.inicio, pedido!.duracao),
    enabled: ativa,
    retry: false,
    staleTime: 60_000,
  })

  return {
    cotacao: ativa ? (data?.data ?? null) : null,
    carregando: ativa && isFetching,
    duracaoCotada: pedido?.duracao ?? DURACAO_PADRAO_MINUTOS,
    usouDuracaoPadrao: Boolean(pedido && pedido.duracao === undefined),
  }
}
