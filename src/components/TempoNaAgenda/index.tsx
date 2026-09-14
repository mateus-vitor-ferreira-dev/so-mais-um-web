import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useAgendaDaQuadra } from '../../hooks/useAgendaDaQuadra'
import { chaves } from '../../lib/queryClient'
import * as placesService from '../../services/places'
import * as courtsService from '../../services/courts'
import { previsaoService } from '../../services/previsao'
import { hojeLocal } from '../../utils/previsao'
import { AgendaDaQuadra } from '../AgendaDaQuadra'
import AtribuicaoDoTempo from '../AtribuicaoDoTempo'
import { Skeleton } from '../Skeleton'
import type { Court, LeituraDoTempo } from '../../types/api'
import { Aviso, Campo, Controles, Explicacao, Quadras, Secao, Titulo, Topo } from './styles'

/**
 * A agenda do dia do dono, com o tempo hora a hora (web#477, épico api#580).
 *
 * ## O que ela responde
 *
 * *"Quais horários de hoje, em quadra descoberta, estão em risco?"* Cada quadra
 * mostra a faixa de horas da previsão e o que está marcado nela; a marcação que
 * atravessa uma hora de risco alto fica em destaque, com o motivo.
 *
 * ## A previsão é um extra, e a agenda não espera por ela
 *
 * As duas vêm de rotas separadas. Com a previsão fora do ar — a Google caiu, ou
 * a chave da Weather API ainda não foi configurada, e aí a api responde 503 —,
 * a tela diz que a previsão está indisponível e a agenda continua a de sempre.
 *
 * ## Por que só hoje e amanhã têm faixa
 *
 * A previsão por hora vai até 48 horas (api#582). Do terceiro dia em diante a
 * api só tem a previsão do dia, e uma faixa de 24 células repetindo o mesmo
 * "70% de chuva" diria uma precisão que o dado não tem. Nesses dias a faixa
 * some, e a agenda fica como sempre foi.
 */
export default function TempoNaAgenda() {
  const { user } = useAuth()
  const [escolhido, setEscolhido] = useState('')
  const [dia, setDia] = useState(() => hojeLocal())

  const espacos = useQuery({
    queryKey: chaves.meusEspacos(user?.id ?? ''),
    queryFn: () =>
      placesService.list().then((r) => r.data.data.filter((espaco) => espaco.ownerId === user?.id)),
    enabled: Boolean(user?.id),
  })

  const lista = espacos.data ?? []
  const placeId = lista.some((e) => e.id === escolhido) ? escolhido : lista[0]?.id ?? ''

  const quadras = useQuery({
    queryKey: chaves.quadrasDoEspaco(placeId),
    queryFn: () => courtsService.getCourtsByPlace(placeId).then((envelope) => envelope.data),
    enabled: Boolean(placeId),
  })

  const previsao = useQuery({
    queryKey: chaves.previsaoDoEspaco(placeId, dia),
    queryFn: () => previsaoService.doEspaco(placeId, dia),
    enabled: Boolean(placeId && dia),
    // A api guarda a previsão por uma hora; reler antes disso é pedir o mesmo cache.
    staleTime: 10 * 60_000,
    // O 503 é a chave que falta ou a Google fora do ar: repetir não resolve, só atrasa o aviso.
    retry: false,
  })

  // Quem não tem espaço vê os "Próximos passos" no dashboard; aqui não há o que mostrar.
  if (lista.length === 0) return null

  const leituras = new Map(previsao.data?.quadras.map((q) => [q.courtId, q.leitura]) ?? [])
  const alcances = [...leituras.values()].map((l) => l.alcance)
  const temFaixa = alcances.includes('HORA')
  const semLocal = alcances.length > 0 && alcances.every((a) => a === 'SEM_LOCAL')
  const alemDoAlcance = alcances.some((a) => a === 'DIA' || a === 'AINDA_LONGE')

  return (
    <Secao aria-labelledby="tempo-na-agenda">
      <Topo>
        <div>
          <Titulo id="tempo-na-agenda">A agenda do dia, com o tempo</Titulo>
          <Explicacao>
            O que está marcado em cada quadra, e a previsão hora a hora das descobertas.
          </Explicacao>
        </div>
        <Controles>
          {lista.length > 1 && (
            <Campo>
              Espaço
              <select value={placeId} onChange={(e) => setEscolhido(e.target.value)}>
                {lista.map((espaco) => (
                  <option key={espaco.id} value={espaco.id}>{espaco.name}</option>
                ))}
              </select>
            </Campo>
          )}
          <Campo>
            Dia
            <input type="date" value={dia} onChange={(e) => e.target.value && setDia(e.target.value)} />
          </Campo>
        </Controles>
      </Topo>

      {previsao.isPending && placeId && <Skeleton height={64} />}

      {previsao.isError && (
        <Aviso>Previsão do tempo indisponível agora. A agenda abaixo continua valendo.</Aviso>
      )}

      {semLocal && (
        <Aviso>
          O endereço deste espaço não foi localizado no mapa, e sem a localização não há previsão do tempo.
        </Aviso>
      )}

      {!temFaixa && !semLocal && alemDoAlcance && (
        <Explicacao>A previsão hora a hora aparece para hoje e amanhã.</Explicacao>
      )}

      <Quadras>
        {(quadras.data ?? []).map((quadra) => (
          <AgendaDoDiaDaQuadra key={quadra.id} quadra={quadra} dia={dia} leitura={leituras.get(quadra.id)} />
        ))}
      </Quadras>

      {temFaixa && <AtribuicaoDoTempo />}
    </Secao>
  )
}

function AgendaDoDiaDaQuadra({ quadra, dia, leitura }: { quadra: Court; dia: string; leitura?: LeituraDoTempo }) {
  // `T00:00` sem fuso é meia-noite **local**; `AAAA-MM-DD` puro seria meia-noite
  // em UTC, e a agenda viria do dia anterior para quem está em UTC-3.
  const agenda = useAgendaDaQuadra(quadra.id, `${dia}T00:00`)

  return (
    <AgendaDaQuadra
      titulo={quadra.coberta ? `${quadra.name} · coberta` : quadra.name}
      ocupacoes={agenda.ocupacoes}
      carregando={agenda.carregando}
      erro={agenda.erro}
      conflito={null}
      temData
      horasDoTempo={leitura?.alcance === 'HORA' ? leitura.horas : undefined}
      mensagemDeErro="Não foi possível carregar o que está marcado nesta quadra. Recarregue a página para tentar de novo."
    />
  )
}
