import { useQuery } from '@tanstack/react-query'
import { Clock, MapPin, Users } from 'lucide-react'
import { dayUsesService } from '../../services/dayUses'
import { chaves } from '../../lib/queryClient'
import type { CourtType, DayUsePublico } from '../../types/api'
import { Atalho, Aviso, Cabecalho, Cartao, Grade, Precos, Secao, Selo } from './styles'

const emReais = (valor: string) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const dia = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })

interface Props {
  /** Os mesmos filtros do grid de partidas — os dois olham a mesma busca. */
  city?: string
  courtType?: CourtType | ''
  /** A página própria só consulta depois que a pessoa delimitou a busca. */
  habilitado?: boolean
  /** Na busca de partidas sobra só a porta de descoberta, não a grade inteira. */
  modo?: 'lista' | 'atalho'
}

/**
 * Os day uses acontecendo, dentro do Quero Jogar (web#420, api#519).
 *
 * ## Seção própria, e não linhas no grid de partidas
 *
 * O grid de lá desenha `Partida`: organizador, barra de vagas, rateio, botão
 * de entrar. Day use não tem nenhum desses. Um card de day use no meio deles
 * herdaria affordances que não existem — a começar pela que sugere que dá para
 * entrar dali.
 *
 * É a mesma decisão que a api tomou ao dar rota própria ao day use em vez de
 * misturá-lo no `GET /events` (api#519).
 *
 * ## A tela NÃO oferece botão de entrar, e diz por quê
 *
 * "3 de 16" se lê como *ainda tem vaga para mim*. Quem registra a entrada é o
 * dono, na porta — a api#519 decidiu isso, e o épico #505 já tinha posto
 * reserva com vaga garantida fora de escopo.
 *
 * Sem a linha que diz *chegue e pague no local*, esta seção promete reserva. É
 * a diferença entre informar e enganar, e é por isso que o aviso não é enfeite.
 *
 * ## `lotado` vem da api
 *
 * Não é recalculado aqui: `maxPessoas` nulo é sem teto, e
 * `pessoasDentro >= maxPessoas` com nulo compara com zero e diz lotado para
 * todo day use sem limite — o caso mais comum.
 *
 * ## Some quando não há nada
 *
 * Sem day use, a seção não renderiza — nem título, nem vazio. Ela é um extra
 * na tela de busca de partida, e um "nenhum day use encontrado" no meio dela
 * pareceria que a busca falhou.
 */
export default function DayUsesDoDia({ city, courtType, habilitado = true, modo = 'lista' }: Props) {
  const filtros = { city: city || undefined, courtType: courtType || undefined }

  const { data } = useQuery({
    queryKey: chaves.buscaDeDayUses(filtros),
    queryFn: () => dayUsesService.buscar(filtros),
    enabled: habilitado,
    /* A falha não pode derrubar a busca de partida: esta seção é um extra, e o
       `useQuery` já isola o erro — o `data` fica indefinido e a seção some. */
  })

  const dayUses = data?.dayUses ?? []
  if (dayUses.length === 0) return null

  if (modo === 'atalho') {
    const destino = new URLSearchParams(
      Object.entries(filtros).flatMap(([chave, valor]) => valor ? [[chave, valor]] : []),
    ).toString()
    const quantidade = dayUses.length

    return (
      <Atalho to={`/day-uses${destino ? `?${destino}` : ''}`}>
        <span>
          <strong>{quantidade} day use{quantidade === 1 ? '' : 's'} acontecendo hoje perto de você</strong>
          <small>Chegue, pague no local e jogue. Não há reserva.</small>
        </span>
        Ver day uses
      </Atalho>
    )
  }

  return (
    <Secao aria-labelledby="day-uses-do-dia">
      <Cabecalho>
        <h2 id="day-uses-do-dia">Day use</h2>
      </Cabecalho>
      <Aviso>
        Chegue, pague no local e jogue até o espaço fechar. Não precisa combinar com ninguém — e
        <strong> não há reserva</strong>: a vaga é de quem chega.
      </Aviso>

      <Grade>
        {dayUses.map((dayUse: DayUsePublico) => (
          <Cartao key={dayUse.id} $lotado={dayUse.lotado}>
            <header>
              <span className="quadra">{dayUse.court.name}</span>
              <span className="lugar">
                {dayUse.court.place.name}
                {dayUse.court.place.city && ` · ${dayUse.court.place.city}`}
              </span>
            </header>

            <span className="linha">
              <Clock size={14} /> {dia(dayUse.inicio)} · {hora(dayUse.inicio)} às {hora(dayUse.fim)}
            </span>

            {dayUse.court.place.neighborhood && (
              <span className="linha">
                <MapPin size={14} /> {dayUse.court.place.neighborhood}
              </span>
            )}

            <Precos>
              <span className="geral">{emReais(dayUse.precoGeral)}</span>
              {/* Nulo é preço único — repetir o geral desenharia duas faixas
                  iguais e inventaria um desconto que não existe. */}
              {dayUse.precoAluno !== null && (
                <span className="aluno">alunos {emReais(dayUse.precoAluno)}</span>
              )}
            </Precos>

            <Selo $lotado={dayUse.lotado}>
              <Users size={12} />{' '}
              {dayUse.lotado
                ? 'Lotado'
                : dayUse.maxPessoas !== null
                  ? `${dayUse.pessoasDentro} de ${dayUse.maxPessoas}`
                  : `${dayUse.pessoasDentro} ${dayUse.pessoasDentro === 1 ? 'pessoa' : 'pessoas'}`}
            </Selo>
          </Cartao>
        ))}
      </Grade>
    </Secao>
  )
}
