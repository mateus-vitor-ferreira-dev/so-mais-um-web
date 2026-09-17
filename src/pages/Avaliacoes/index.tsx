import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlvoDoCartao } from '../../styles/cartaoClicavel'
import { Star } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService } from '../../services/playerService'
import type { Review, ReviewTag, UserStats } from '../../types/api'
import {
  Container, StatsCard, Section, TagsGrid, TagChip, ReviewList, ReviewCard,
  ReviewHeader, TagBadge, ReviewComment,
} from './styles'
import EmptyState from '../../components/EmptyState'
import { dataCurta } from '../../utils/datas'
import { formatarNota } from '../../utils/numeros'
import { usePageHeader } from '../../components/DashboardLayout/pageHeader'

const TAG_LABELS: Record<string, string> = {
  CRAQUE_DA_PARTIDA: 'Craque da Partida',
  JOGA_FACIL:       'Joga Fácil',
  PASSA_DE_ANO:     'Passa de Ano',
  PONTUAL:          'Pontual',
  FAIR_PLAY:        'Fair Play',
  BOA_COMUNICACAO:  'Boa Comunicação',
}

/**
 * As estrelas da avaliação, em ícone e não em emoji (#511): o ⭐ saía com a cor
 * e o peso de cada sistema. Para o leitor de tela, uma frase só.
 */
function Estrelas({ count }: { count: number }) {
  const n = Math.min(Math.max(count, 1), 5)
  return (
    <span className="stars" role="img" aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}>
      {Array.from({ length: n }, (_, i) => <Star key={i} size={16} fill="currentColor" aria-hidden="true" />)}
    </span>
  )
}

function formatDate(dateStr: string) {
  return dateStr ? dataCurta(dateStr) : ''
}

export default function Avaliacoes() {
  usePageHeader('Minhas Avaliações')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary]           = useState<Partial<UserStats>>({})
  const [reviews, setReviews]           = useState<Review[]>([])
  const [reviewsGiven, setReviewsGiven] = useState<Review[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const fetch = async () => {
      try {
        setLoading(true)
        const [received, given] = await Promise.all([
          playerService.getUserReviews(user.id),
          playerService.getUserReviewsGiven(user.id),
        ])
        setSummary(received.data?.summary || {})
        setReviews(received.data?.reviews || [])
        setReviewsGiven(given.data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user])

  const avgStars = summary.averageStars
    ? formatarNota(summary.averageStars)
    : 'N/A'

  return (
    <>
      <Container>
        <StatsCard>
          <div className="stat-item">
            <h2><Star size={22} fill="currentColor" aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {avgStars}</h2>
            <p>Nota Média</p>
          </div>
          <div className="stat-item">
            <h2>{summary.totalReviews ?? 0}</h2>
            <p>Avaliações Recebidas</p>
          </div>
          <div className="stat-item">
            <h2>{reviewsGiven.length}</h2>
            <p>Avaliações Feitas</p>
          </div>
        </StatsCard>

        {loading ? (
          <p>Carregando...</p>
        ) : (
          <>
            {(summary.tags?.length ?? 0) > 0 && (
              <Section>
                <h3>Tags Recebidas</h3>
                <TagsGrid>
                  {(summary.tags ?? []).map(({ tag, count }: { tag: ReviewTag; count: number }) => (
                    <TagChip key={tag}>
                      <span className="label">{TAG_LABELS[tag] || tag}</span>
                      <span className="count">×{count}</span>
                    </TagChip>
                  ))}
                </TagsGrid>
              </Section>
            )}

            {/* Avaliações recebidas */}
            <Section>
              <h3>Avaliações Recebidas</h3>

              {reviews.length === 0 ? (
                <EmptyState>
                  <p>Você ainda não recebeu nenhuma avaliação.</p>
                  <p>Participe de partidas e peça aos colegas para te avaliarem!</p>
                </EmptyState>
              ) : (
                <ReviewList>
                  {reviews.map((review: Review) => (
                    <ReviewCard key={review.id} $clicavel={Boolean(review.reviewer?.id)} onClick={review.reviewer?.id ? () => navigate(`/jogador/${review.reviewer!.id}`) : undefined}>
                      <ReviewHeader>
                        <div className="avatar">
                          {review.reviewer?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="meta">
                          <div className="reviewer-name">
                            {review.reviewer?.id ? <AlvoDoCartao>{review.reviewer.name}</AlvoDoCartao> : review.reviewer?.name}
                          </div>
                          <div className="game-info">
                            {review.match?.court?.place?.name && (
                              <>{review.match.court.place.name} &mdash; </>
                            )}
                            {formatDate(review.createdAt)}
                          </div>
                        </div>
                        <Estrelas count={review.stars} />
                      </ReviewHeader>

                      <TagBadge>{TAG_LABELS[review.tag] || review.tag}</TagBadge>

                      {review.comment && (
                        <ReviewComment>"{review.comment}"</ReviewComment>
                      )}
                    </ReviewCard>
                  ))}
                </ReviewList>
              )}
            </Section>

            {/* Avaliações feitas pelo usuário */}
            <Section>
              <h3>Avaliações que Fiz</h3>

              {reviewsGiven.length === 0 ? (
                <EmptyState>
                  <p>Você ainda não avaliou nenhum jogador.</p>
                  <p>Após uma partida finalizada, avalie quem jogou com você!</p>
                </EmptyState>
              ) : (
                <ReviewList>
                  {reviewsGiven.map((review: Review) => (
                    <ReviewCard key={review.id} $clicavel={Boolean(review.reviewed?.id)} onClick={review.reviewed?.id ? () => navigate(`/jogador/${review.reviewed!.id}`) : undefined}>
                      <ReviewHeader>
                        <div className="avatar">
                          {review.reviewed?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="meta">
                          <div className="reviewer-name">
                            {review.reviewed?.id ? <AlvoDoCartao>{review.reviewed.name}</AlvoDoCartao> : review.reviewed?.name}
                          </div>
                          <div className="game-info">
                            {review.match?.court?.place?.name && (
                              <>{review.match.court.place.name} &mdash; </>
                            )}
                            {formatDate(review.createdAt)}
                          </div>
                        </div>
                        <Estrelas count={review.stars} />
                      </ReviewHeader>

                      <TagBadge>{TAG_LABELS[review.tag] || review.tag}</TagBadge>

                      {review.comment && (
                        <ReviewComment>"{review.comment}"</ReviewComment>
                      )}
                    </ReviewCard>
                  ))}
                </ReviewList>
              )}
            </Section>
          </>
        )}
      </Container>
    </>
  )
}
