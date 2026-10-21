import { useState, useEffect } from 'react'
import CarregarMais from '../../components/CarregarMais'
import { useListaPaginada } from '../../hooks/useListaPaginada'
import { chaves } from '../../lib/queryClient'
import { toast } from 'sonner'
import { SkeletonList } from '../../components/Skeleton'
import { getSportMeta } from '../../hooks/useSports'
import SportIcon from '../../components/SportIcon'
import { useAuth } from '../../contexts/AuthContext'
import { BotaoSeguir } from '../../components/BotaoSeguir'
import { playerService } from '../../services/playerService'
import { mensagemDeErro } from '../../utils/apiError'
import type { ItemDoHistorico, ReviewProgress } from '../../services/playerService'
import type { Participation, Partida, ReviewTag, UserStats } from '../../types/api'
import {
  Container, StatsCard, HistoryList, HistoryCard,
  EvalModalOverlay, EvalModalContent, ParticipantRow,
  ProgressInfo, ProgressBarWrap, CommentTextarea, AcoesDaAvaliacao
} from './styles'
import { formatarNota } from '../../utils/numeros'
import { dataCurta, hora } from '../../utils/datas'
import { usePageHeader } from '../../components/DashboardLayout/pageHeader'

const TAG_OPTIONS = [
  { label: 'Craque da Partida', value: 'CRAQUE_DA_PARTIDA' },
  { label: 'Joga Fácil',       value: 'JOGA_FACIL'       },
  { label: 'Passa de Ano',     value: 'PASSA_DE_ANO'     },
  { label: 'Pontual',          value: 'PONTUAL'           },
  { label: 'Fair Play',        value: 'FAIR_PLAY'         },
  { label: 'Boa Comunicação',  value: 'BOA_COMUNICACAO'  },
]

interface AvaliacaoEmEdicao {
  /**
   * number | string de propósito: o valor inicial é o número 5, mas o <select>
   * de estrelas entrega string no onChange. A conversão é feita no envio.
   */
  stars: number | string
  tag: ReviewTag
  comment: string
}

export default function Historico() {
  usePageHeader('Meu Histórico')
  const { user } = useAuth()
  const [reviewSummary, setReviewSummary] = useState<Partial<UserStats>>({})

  /**
   * As partidas concluídas em que joguei, por página (api#618).
   *
   * Até ali eram todas as participações de uma vez, pela rota das "minhas
   * partidas". O histórico tem a rota dele, que pagina e conta: o `total` é o
   * "Partidas Disputadas", que antes era o tamanho da lista.
   */
  const historico = useListaPaginada<ItemDoHistorico>(
    chaves.historico('FINISHED'),
    (cursor) => playerService.getHistorico({ role: 'participant', status: 'FINISHED' }, { cursor }),
    { habilitada: Boolean(user?.id) },
  )
  const history = historico.itens

  // Modal de avaliação
  const [evalEvent, setEvalEvent] = useState<Partida | null>(null)
  const [participants, setParticipants] = useState<Participation[]>([])
  /** Avaliação em edição, indexada por userId do avaliado. */
  const [evaluations, setEvaluations] = useState<Record<string, AvaliacaoEmEdicao>>({})
  const [reviewProgress, setReviewProgress] = useState<ReviewProgress | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    playerService
      .getUserReviews(user.id)
      .then((revRes) => setReviewSummary(revRes.data?.summary ?? {}))
      .catch((error) => console.error(error))
  }, [user])

  const openEvaluation = async (partida: Partida) => {
    try {
      const [participantsRes, progressRes] = await Promise.all([
        playerService.getEventParticipants(partida.courtId, partida.id),
        playerService.getReviewProgress(partida.courtId, partida.id).catch(() => null),
      ])

      const others = (participantsRes.data || []).filter((p: Participation) => p.userId !== user?.id)
      setParticipants(others)
      setEvalEvent(partida)
      setReviewProgress(progressRes?.data || null)

      const initialEvals: Record<string, AvaliacaoEmEdicao> = {}
      others.forEach((p: Participation) => {
        initialEvals[p.userId] = { stars: 5, tag: 'JOGA_FACIL', comment: '' }
      })
      setEvaluations(initialEvals)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar participantes')
    }
  }

  const handleReviewChange = (userId: string, field: keyof AvaliacaoEmEdicao, value: string | number) => {
    setEvaluations(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] as AvaliacaoEmEdicao), [field]: value },
    }))
  }

  const submitEvaluations = async () => {
    try {
      setSubmitting(true)
      for (const p of participants) {
        const review = evaluations[p.userId]
        await playerService.submitReview(evalEvent!.courtId, evalEvent!.id, {
          reviewedId: p.userId,
          stars: Number(review!.stars),
          tag: review!.tag,
          comment: review!.comment || null,
        })
      }
      toast.success('Avaliações enviadas com sucesso!')
      setEvalEvent(null)
    } catch (error) {
      console.error(error)
      toast.error(mensagemDeErro(error, 'Erro ao enviar avaliações'))
    } finally {
      setSubmitting(false)
    }
  }

  const avgStars = reviewSummary.averageStars
    ? formatarNota(reviewSummary.averageStars)
    : 'N/A'

  const progressPct = reviewProgress
    ? Math.round((reviewProgress.reviewed / Math.max(reviewProgress.total, 1)) * 100)
    : 0

  return (
    <>
      <Container>
        <StatsCard>
          <div className="stat-item">
            <h2>⭐ {avgStars}</h2>
            <p>Sua Nota Média</p>
          </div>
          <div className="stat-item">
            <h2>{historico.total}</h2>
            <p>Partidas Disputadas</p>
          </div>
          <div className="stat-item">
            <h2>{reviewSummary.totalReviews ?? 0}</h2>
            <p>Avaliações Recebidas</p>
          </div>
        </StatsCard>

        <h3>Partidas Concluídas</h3>
        <HistoryList>
          {historico.carregando ? <SkeletonList count={4} /> : history.map((ev) => {
            const sport = ev.court ? getSportMeta(ev.court.type) : { icon: 'society', iconFallback: '⚽', label: '—' }
            return (
              <HistoryCard key={ev.id}>
                <div className="info">
                  <h4>{ev.court?.place?.name} — <SportIcon icon={sport.icon} fallback={sport.iconFallback} /> {sport.label}</h4>
                  <p>
                    {dataCurta(ev.date)} às{' '}
                    {hora(ev.date)}
                  </p>
                </div>
                <div className="action">
                  <button onClick={() => openEvaluation(ev)}>Avaliar Jogadores</button>
                </div>
              </HistoryCard>
            )
          })}
        </HistoryList>

        <CarregarMais
          mostrando={history.length}
          total={historico.pagina?.total}
          temMais={historico.temMais}
          carregando={historico.carregandoMais}
          aoCarregar={historico.carregarMais}
          rotulo="partidas"
        />

        {/* Modal de Avaliação Pós-Jogo */}
        {evalEvent && (
          <EvalModalOverlay>
            <EvalModalContent>
              <h2>Avaliar Partida</h2>

              {reviewProgress && (
                <ProgressInfo>
                  <span>
                    Avaliações: <strong>{reviewProgress.reviewed} de {reviewProgress.total}</strong>
                  </span>
                  <ProgressBarWrap $pct={progressPct}>
                    <div />
                  </ProgressBarWrap>
                </ProgressInfo>
              )}

              <p style={{ marginBottom: 16, color: '#6b7280' }}>
                Selecione a nota, classificação e deixe um comentário (opcional).
              </p>

              {participants.map(p => (
                <ParticipantRow key={p.userId}>
                  <div className="avatar">{p.user?.name?.charAt(0)}</div>
                  <div className="details">
                    <div className="name">{p.user?.name}</div>
                    {/*
                      Seguir, na única tela que enumera com quem você acabou de
                      jogar (web#375).

                      É o momento em que a pessoa sabe quem quer seguir — o jogo
                      acabou agora, e o nome está na frente dela. Sem isto, o
                      caminho até alguém que jogou com você é procurar a partida,
                      abrir a lista de participantes e clicar no nome; ninguém faz.

                      O botão fica **fora** dos `.controls` de propósito: aqueles
                      são a avaliação, que é sobre a partida e vai junto no envio.
                      Seguir grava na hora e não tem nada a ver com a nota — quem
                      segue não está avaliando melhor.
                    */}
                    <BotaoSeguir userId={p.userId} nome={p.user?.name ?? 'este jogador'} />
                  </div>
                  <div className="controls">
                    <select
                      value={evaluations[p.userId]?.stars}
                      onChange={e => handleReviewChange(p.userId, 'stars', e.target.value)}
                    >
                      <option value="5">⭐⭐⭐⭐⭐</option>
                      <option value="4">⭐⭐⭐⭐</option>
                      <option value="3">⭐⭐⭐</option>
                      <option value="2">⭐⭐</option>
                      <option value="1">⭐</option>
                    </select>
                    <select
                      value={evaluations[p.userId]?.tag}
                      onChange={e => handleReviewChange(p.userId, 'tag', e.target.value)}
                    >
                      {TAG_OPTIONS.map(tag => (
                        <option key={tag.value} value={tag.value}>{tag.label}</option>
                      ))}
                    </select>
                    <CommentTextarea
                      placeholder="Comentário (opcional, máx. 300 caracteres)"
                      maxLength={300}
                      value={evaluations[p.userId]?.comment || ''}
                      onChange={e => handleReviewChange(p.userId, 'comment', e.target.value)}
                    />
                  </div>
                </ParticipantRow>
              ))}

              <AcoesDaAvaliacao>
                <button type="button" className="cancelar" onClick={() => setEvalEvent(null)}>
                  Cancelar
                </button>
                <button type="button" className="salvar" onClick={submitEvaluations} disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Salvar Avaliações'}
                </button>
              </AcoesDaAvaliacao>
            </EvalModalContent>
          </EvalModalOverlay>
        )}
      </Container>
    </>
  )
}
