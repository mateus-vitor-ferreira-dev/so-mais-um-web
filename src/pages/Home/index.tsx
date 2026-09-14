import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Zap, Trophy, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService } from '../../services/playerService'
import { chaves } from '../../lib/queryClient'
import { useSports } from '../../hooks/useSports'
import CartaoDePartida, { type PartidaDoCartao } from '../../components/CartaoDePartida'
import SportIcon from '../../components/SportIcon'
import type { CourtType } from '../../types/api'
import { PartidasPerto } from '../../components/PartidasPerto'
import {
  PageWrapper, CompactHeader, GreetingBlock, GreetingText, GreetingTitle,
  StatsRow, StatBox, StatIconBox, StatInfo, StatValue, StatLabel,
  TabsWrapper, TabsRow, TabsFade, TabsSeta, Tab, SectionBlock, SectionHeader,
  SectionTitle, SectionSubtitle, GamesGrid, CTARow,
  CTAPrimary, CTASecondary,
} from './styles'
import EmptyState from '../../components/EmptyState'
import { SkeletonCard } from '../../components/Skeleton'
import { formatarNota } from '../../utils/numeros'

interface FiltroTab {
  id: string
  label: string
  icon: string
  iconFallback: string | null
  /** null = sem restrição de modalidade. */
  types: CourtType[] | null
}

const ALL_TAB: FiltroTab = { id: 'ALL', label: 'Todos', icon: 'todos', iconFallback: '🎯', types: null }

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

/**
 * Estes helpers testam vários nomes de campo alternativos (scheduledAt,
 * startTime, startsAt, court.address, price...). A maioria não existe no
 * contrato atual da API — são resquícios de formatos anteriores. Tipados de
 * forma permissiva para preservar exatamente o comportamento defensivo.
 */
type EventoSolto = Record<string, unknown> & {
  participations?: unknown
  _count?: { participations?: number }
  court?: Record<string, unknown> & { place?: Record<string, unknown> }
}

function normalizeList(result: unknown): EventoSolto[] {
  if (Array.isArray(result)) return result as EventoSolto[]
  const r = result as { data?: { events?: unknown } | unknown; events?: unknown; items?: unknown } | null
  const data = (r as { data?: { events?: unknown } })?.data
  if (data && Array.isArray((data as { events?: unknown }).events)) return (data as { events: EventoSolto[] }).events
  if (Array.isArray(data)) return data as EventoSolto[]
  if (Array.isArray(r?.events)) return r!.events as EventoSolto[]
  if (Array.isArray(r?.items)) return r!.items as EventoSolto[]
  return []
}

function getParticipationCount(event: EventoSolto): number {
  if (typeof event.participations === 'number') return event.participations
  if (Array.isArray(event.participations)) return event.participations.length
  if (typeof event._count?.participations === 'number') return event._count.participations
  return 0
}

/**
 * O evento solto no formato do `CartaoDePartida` (web#492). Os nomes
 * alternativos de campo continuam aceitos, pelo mesmo motivo do comentário
 * acima: a Home ainda recebe listas de mais de uma origem.
 */
function paraOCartao(event: EventoSolto): PartidaDoCartao {
  return {
    id: String(event.id),
    date: String(event.scheduledAt || event.startTime || event.date || event.startsAt || ''),
    maxPlayers: Number(event.maxPlayers) || 0,
    totalValue: String(event.totalValue ?? event.price ?? 0),
    _count: { participations: getParticipationCount(event) },
    court: event.court as PartidaDoCartao['court'],
  }
}

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { sports: allSports } = useSports()
  const SPORT_TABS = [ALL_TAB, ...allSports]

  const [activeSport, setActiveSport] = useState('ALL')
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  /*
   * ⚠️ Dois filtros aqui eram no-op e foram removidos:
   *
   * 1. `date: today` — o searchEventsQuerySchema da API aceita `from` e `to`,
   *    não `date`. Com stripUnknown o campo era descartado, então este bloco
   *    NUNCA restringiu a busca ao dia de hoje. O efeito real sempre foi
   *    "partidas futuras", que é o default do backend quando nenhuma faixa é
   *    informada.
   *
   * 2. `city: user.city` — o model User não tem coluna `city`, então
   *    user.city era sempre undefined e o spread condicional jamais
   *    adicionava o filtro.
   *
   * Comportamento preservado de propósito: restringir a hoje mudaria o que a
   * home exibe. Para filtrar por hoje de fato, usar { from, to }.
   */
  const filtro = { status: 'WAITING' as const }

  const { data: events = [], isPending: loadingEvents } = useQuery({
    queryKey: chaves.eventos.busca(filtro),
    queryFn: () => playerService.searchEvents(filtro).then(normalizeList),
  })

  const { data: participando = [] } = useQuery({
    queryKey: chaves.eventos.participando(),
    queryFn: () => playerService.getMyParticipatingEvents({}).then(normalizeList),
  })

  const totalGames = participando.length

  const filteredEvents = activeSport === 'ALL'
    ? events
    : events.filter(e => e.court?.type === activeSport)

  const updateFades = useCallback(() => {
    const el = tabsRef.current
    if (!el) return
    setShowLeftFade(el.scrollLeft > 4)
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  const rolarModalidades = (lado: 1 | -1) => {
    const el = tabsRef.current
    el?.scrollBy({ left: lado * el.clientWidth * 0.6, behavior: 'smooth' })
  }

  useEffect(() => {
    updateFades()
    window.addEventListener('resize', updateFades)
    return () => window.removeEventListener('resize', updateFades)
  }, [updateFades, allSports])

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
  }, [activeSport])

  const firstName = user?.name?.split(' ')[0] || 'Jogador'

  return (
    <>
      <PageWrapper>

        {/* Saudação compacta */}
        <CompactHeader>
          <GreetingBlock>
            <GreetingText>👋 {getGreeting()}, {firstName}!</GreetingText>
            <GreetingTitle>E aí, bora jogar hoje?</GreetingTitle>
          </GreetingBlock>
        </CompactHeader>

        {/* Ações — encontrar ou criar uma partida, lado a lado, sem precisar rolar a tela */}
        <CTARow>
          <CTAPrimary onClick={() => navigate('/quero-jogar')}>
            <Search size={18} />
            Encontrar uma partida
          </CTAPrimary>
          <CTASecondary onClick={() => navigate('/minhas-partidas?action=criar')}>
            <Zap size={18} />
            Criar partida
          </CTASecondary>
        </CTARow>

        {/* Métricas do jogador */}
        <StatsRow>
          <StatBox>
            <StatIconBox><Trophy size={22} aria-hidden /></StatIconBox>
            <StatInfo>
              <StatValue>{totalGames}</StatValue>
              <StatLabel>Partidas</StatLabel>
            </StatInfo>
          </StatBox>
          <StatBox>
            <StatIconBox><Star size={22} aria-hidden /></StatIconBox>
            <StatInfo>
              {/*
                * Era user.rating — campo inexistente na API, então o ternário
                * sempre caía no '—'. O valor real é stats.averageStars, que
                * /auth/me passou a devolver na api#239.
                */}
              <StatValue>{user?.stats?.averageStars != null ? formatarNota(user.stats.averageStars) : '—'}</StatValue>
              <StatLabel>Nota</StatLabel>
            </StatInfo>
          </StatBox>
        </StatsRow>

        {/* Seletor único de modalidades */}
        <TabsWrapper>
          <TabsRow ref={tabsRef} onScroll={updateFades} role="group" aria-label="Filtrar por modalidade">
            {SPORT_TABS.map(tab => {
              const active = activeSport === tab.id
              return (
                <Tab
                  key={tab.id}
                  ref={active ? activeTabRef : null}
                  $active={active}
                  aria-pressed={active}
                  onClick={() => setActiveSport(tab.id)}
                >
                  <span><SportIcon icon={tab.icon} fallback={tab.iconFallback} /></span>
                  {tab.label}
                </Tab>
              )
            })}
          </TabsRow>
          <TabsFade $side="left" $visible={showLeftFade} />
          <TabsFade $side="right" $visible={showRightFade} />
          {showLeftFade && (
            <TabsSeta type="button" $side="left" aria-label="Modalidades anteriores" onClick={() => rolarModalidades(-1)}>
              <ChevronLeft size={18} aria-hidden />
            </TabsSeta>
          )}
          {showRightFade && (
            <TabsSeta type="button" $side="right" aria-label="Mais modalidades" onClick={() => rolarModalidades(1)}>
              <ChevronRight size={18} aria-hidden />
            </TabsSeta>
          )}
        </TabsWrapper>

        {/* Partidas disponíveis — conteúdo dominante */}
        {/* Antes das partidas em destaque (#223): o que está perto interessa mais
            que o que está em destaque, e enterrá-la embaixo faria a seção
            valer o mesmo que a busca — que é justamente o caminho que ela
            veio encurtar. */}
        <PartidasPerto />

        <SectionBlock>
          <SectionHeader>
            <div>
              <SectionTitle>Partidas em destaque</SectionTitle>
              <SectionSubtitle>
                {filteredEvents.length} disponíve{filteredEvents.length !== 1 ? 'is' : 'l'} agora
              </SectionSubtitle>
            </div>
          </SectionHeader>

          {loadingEvents ? (
            /* Carregando não é vazio: um pede espera, o outro pede ação, e o
               mesmo desenho para os dois fazia a pessoa agir na hora de
               esperar. O esqueleto ainda mostra a forma do que vem (#315). */
            <GamesGrid><SkeletonCard count={4} /></GamesGrid>
          ) : filteredEvents.length === 0 ? (
            <EmptyState>Nenhuma partida disponível no momento.</EmptyState>
          ) : (
            <GamesGrid>
              {filteredEvents.slice(0, 4).map((event: EventoSolto) => (
                <CartaoDePartida
                  key={String(event.id)}
                  partida={paraOCartao(event)}
                  aoAbrir={() => navigate(`/partida/${String(event.id)}`)}
                />
              ))}
            </GamesGrid>
          )}
        </SectionBlock>

      </PageWrapper>
    </>
  )
}
