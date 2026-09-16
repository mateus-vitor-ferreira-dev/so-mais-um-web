import { Suspense, lazy, useState, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Search, CheckCircle, SlidersHorizontal, X, Navigation, Sunrise, Sun, Moon, LayoutGrid, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService } from '../../services/playerService'
import { chaves } from '../../lib/queryClient'
import { useOrigemDeLocalizacao } from '../../hooks/useOrigemDeLocalizacao'
import ConviteDeLocalizacao from '../../components/ConviteDeLocalizacao'
import DayUsesDoDia from '../../components/DayUsesDoDia'
import { pontosDaBusca } from '../../components/MapaDaBusca/pontos'
import { temDistancia } from '../../types/api'
import { useSports } from '../../hooks/useSports'
import { SkeletonCard } from '../../components/Skeleton'
import { EtiquetaDeRequisitos } from '../../components/RequisitosDaPartida'
import CartaoDePartida from '../../components/CartaoDePartida'
import { sportTextLabel } from '../../utils/sportText'
import { mensagemDeErro } from '../../utils/apiError'
import type { EventFilters } from '../../services/events'
import type { CourtType, Partida } from '../../types/api'
import type { SportOption } from '../../hooks/useSports'
import { formatarNumero } from '../../utils/numeros'
import {
  Container, BackBtn, FiltersArea, SearchInput, ChipsContainer, Chip, ResultsCount, SportBtnsRow, SportAllBtn, SportSelectWrapper, Grid, ActionButton, AdvancedFilters, FilterRow, FilterGroup, FilterLabel, FilterSelect, FilterToggle, FiltersBtn, ActiveFilterBadge, ClearBtn, PriceSliderWrapper, RaioLinha, RaioChip, RaioExplicacao, DistanciaBadge, MapaCarregando, CarregarMais,
} from './styles'
import { usePageHeader } from '../../components/DashboardLayout/pageHeader'

function buildGoogleMapsUrl(event: Partida): string | null {
  const parts = [
    // `street` não vem no select de place deste endpoint.
    event.court?.place?.name,
    event.court?.place?.neighborhood,
    event.court?.place?.city,
    'Brasil',
  ].filter(Boolean)
  if (parts.length === 0) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
}

const TIME_OPTIONS = [
  { id: 'manha',  label: 'Manhã', Icone: Sunrise, from: 5,  to: 12 },
  { id: 'tarde',  label: 'Tarde', Icone: Sun,     from: 12, to: 18 },
  { id: 'noite',  label: 'Noite', Icone: Moon,    from: 18, to: 24 },
]

const MAX_PRICE = 200

/**
 * O mapa é o único pedaço da busca que desce sob demanda (#325).
 *
 * Ele carrega Leaflet — 236 KiB — e a #317 tirou isso do carregamento inicial
 * do app inteiro. Estático aqui, ele voltaria para o chunk desta tela, que é a
 * primeira que muita gente abre depois de entrar.
 */
const MapaDaBusca = lazy(() => import('../../components/MapaDaBusca'))

export default function QueroJogar() {
  usePageHeader('Quero Jogar', 'Encontre a partida perfeita para você participar hoje.')
  const { user } = useAuth()
  const { sports: allSports } = useSports()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * Dá para voltar dentro do app?
   *
   * `key === 'default'` é a primeira entrada da pilha do router: a pessoa abriu
   * esta URL direto, recarregou, ou chegou por um link de fora. Nesse caso
   * `navigate(-1)` sairia do Só+1 — e um "Voltar" que fecha o produto não é
   * voltar.
   *
   * Diferente das telas de detalhe, esta é de primeiro nível: dá para cair nela
   * sem ter passado por nenhuma outra. Por isso a checagem existe aqui e não lá.
   *
   * Lido do `location` do router, e não de `window.history.state.idx`: o
   * MemoryRouter dos testes não mexe no histórico do navegador, e a checagem
   * pelo `window` responderia uma coisa no teste e outra no produto.
   */
  const podeVoltar = location.key !== 'default'
  const queryClient = useQueryClient()

  const [search, setSearch]             = useState('')
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || '')
  const [showFilters, setShowFilters]   = useState(false)
  const [filterTime, setFilterTime]     = useState('')
  const [filterMaxPrice, setFilterMaxPrice] = useState(MAX_PRICE)
  const [filterArena, setFilterArena]   = useState('')
  const [filterCity, setFilterCity]     = useState('')
  const [filterVagas, setFilterVagas]   = useState(false)

  /**
   * O raio da busca (#224). `0` quer dizer "sem raio", e não "raio zero".
   *
   * Ele é filtro de servidor: a api é quem sabe as coordenadas de cada espaço,
   * e quem devolve os resultados já ordenados por distância. Filtrar aqui
   * exigiria trazer a cidade inteira para o navegador.
   */
  const [raioKm, setRaioKm] = useState(0)
  const localizacao = useOrigemDeLocalizacao()
  const { origem, estado: estadoDaOrigem, pedirLocalizacao, podePedir } = localizacao
  const temOrigem = origem !== null
  const raioAtivo = temOrigem && raioKm > 0

  /*
   * courtType e city são filtros server-side: entram na chave de cache, então
   * mudar de filtro busca do zero e voltar a um filtro já visto vem do cache,
   * sem rede. O `useInfiniteQuery` guarda as páginas acumuladas — antes elas
   * viviam num useState que sumia ao trocar de rota, e voltar para cá recomeçava
   * da página 1.
   */
  const filtrosServidor = {
    courtType: selectedSport || undefined,
    city: filterCity || undefined,
    // A origem entra na chave junto do raio: a mesma busca a partir de outro
    // ponto é outra busca, e reaproveitar o cache mostraria distâncias de onde
    // a pessoa não está.
    ...(raioAtivo && { latitude: origem.latitude, longitude: origem.longitude, radiusKm: raioKm }),
  }

  const {
    data: paginas,
    isPending: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: chaves.eventos.busca(filtrosServidor),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const params: EventFilters = { status: 'WAITING', page: pageParam, limit: 20 }
      if (selectedSport) params.courtType = selectedSport as CourtType
      if (filterCity)    params.city      = filterCity
      if (raioAtivo) {
        // Os três juntos, sempre: `radiusKm` sem origem é 422 na api, e não
        // uma busca sem raio.
        params.latitude  = origem.latitude
        params.longitude = origem.longitude
        params.radiusKm  = raioKm
      }
      const res = await playerService.searchEvents(params)
      return {
        eventos: (res.data?.events ?? res.data ?? []) as Partida[],
        temMais: res.data?.hasMore ?? false,
      }
    },
    // `undefined` diz ao react-query que acabou — é o que apaga o botão.
    getNextPageParam: (ultima, todas) => (ultima.temMais ? todas.length + 1 : undefined),
  })

  const events = useMemo(() => paginas?.pages.flatMap((p) => p.eventos) ?? [], [paginas])

  const cities = useMemo(() =>
    [...new Set(events.map(e => e.court?.place?.city).filter(Boolean))].sort(),
    [events]
  )

  const arenas = useMemo(() =>
    [...new Set(events.map(e => e.court?.place?.name).filter(Boolean))].sort(),
    [events]
  )

  const filteredEvents = events.filter(e => {
    const matchesSearch =
      e.court?.place?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.court?.place?.neighborhood?.toLowerCase().includes(search.toLowerCase())

    const matchesSport = selectedSport ? e.court?.type === selectedSport : true

    const hour = new Date(e.date).getHours()
    const matchesTime =
      !filterTime ? true :
      filterTime === 'manha' ? hour >= 5 && hour < 12 :
      filterTime === 'tarde' ? hour >= 12 && hour < 18 :
      hour >= 18 || hour < 5

    const pricePerPerson = Number(e.totalValue) / e.maxPlayers
    const matchesPrice = filterMaxPrice >= MAX_PRICE ? true : pricePerPerson <= filterMaxPrice

    const matchesArena = !filterArena ? true : e.court?.place?.name === filterArena
    const matchesCity = !filterCity ? true : e.court?.place?.city === filterCity

    const currentPlayers = e._count?.participations || 0
    const matchesVagas = !filterVagas ? true : currentPlayers < e.maxPlayers

    return matchesSearch && matchesSport && matchesTime && matchesPrice && matchesArena && matchesCity && matchesVagas
  })

  const activeFilterCount = [
    selectedSport,
    filterTime,
    filterMaxPrice < MAX_PRICE ? String(filterMaxPrice) : '',
    filterArena,
    filterCity,
    filterVagas,
    raioAtivo,
  ].filter(Boolean).length

  function clearFilters() {
    setSelectedSport('')
    setFilterTime('')
    setFilterMaxPrice(MAX_PRICE)
    setFilterArena('')
    setFilterCity('')
    setFilterVagas(false)
    setRaioKm(0)
  }

  const handleJoin = async (courtId: string, eventId: string) => {
    try {
      await playerService.joinEvent(courtId, eventId)
      queryClient.invalidateQueries({ queryKey: ['eventos'] })
    } catch (error) {
      toast.error(mensagemDeErro(error, 'Erro ao entrar na partida'))
    }
  }

  return (
    <>
      <Container>
        <BackBtn onClick={() => (podeVoltar ? navigate(-1) : navigate('/home'))}>
          <ArrowLeft size={16} /> Voltar
        </BackBtn>

        <FiltersArea>
          {/* Busca + botão de filtros */}
          <div style={{ display: 'flex', gap: 12 }}>
            <SearchInput style={{ flex: 1 }}>
              <Search size={20} />
              <input
                // "Pesquisar por local ou bairro..." saía cortado a 360; o nome inteiro fica no rótulo.
                aria-label="Pesquisar por local ou bairro"
                placeholder="Local ou bairro"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </SearchInput>
            <FiltersBtn
              $active={activeFilterCount > 0}
              onClick={() => setShowFilters(v => !v)}
            >
              <SlidersHorizontal size={16} />
              Filtros
              {activeFilterCount > 0 && (
                <ActiveFilterBadge>{activeFilterCount}</ActiveFilterBadge>
              )}
            </FiltersBtn>
          </div>

          {/* Esporte — 2 botões */}
          <SportBtnsRow>
            <SportAllBtn
              $active={selectedSport === ''}
              onClick={() => setSelectedSport('')}
            >
              <LayoutGrid size={16} aria-hidden /> Todas as modalidades
            </SportAllBtn>
            <SportSelectWrapper $active={selectedSport !== ''}>
              <span>
                {selectedSport
                  ? sportTextLabel(allSports.find(s => s.id === selectedSport) ?? { label: '' })
                  : 'Selecionar modalidade'}
                <ChevronDown size={16} aria-hidden />
              </span>
              <select
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
              >
                <option value="">Selecionar modalidade</option>
                {allSports.map((sport: SportOption) => (
                  <option key={sport.id} value={sport.id}>{sportTextLabel(sport)}</option>
                ))}
              </select>
            </SportSelectWrapper>
          </SportBtnsRow>

          {/* Filtros avançados */}
          {showFilters && (
            <AdvancedFilters>
              <FilterRow>
                <FilterGroup>
                  <FilterLabel>Modalidade</FilterLabel>
                  <FilterSelect
                    value={selectedSport}
                    onChange={e => setSelectedSport(e.target.value)}
                  >
                    <option value="">Todas as modalidades</option>
                    {allSports.map((sport: SportOption) => (
                      <option key={sport.id} value={sport.id}>{sportTextLabel(sport)}</option>
                    ))}
                  </FilterSelect>
                </FilterGroup>

                <FilterGroup>
                  <FilterLabel>Horário</FilterLabel>
                  <ChipsContainer style={{ paddingBottom: 0 }}>
                    {TIME_OPTIONS.map(t => (
                      <Chip
                        key={t.id}
                        $active={filterTime === t.id}
                        onClick={() => setFilterTime(filterTime === t.id ? '' : t.id)}
                      >
                        <t.Icone size={14} aria-hidden /> {t.label}
                      </Chip>
                    ))}
                  </ChipsContainer>
                </FilterGroup>

                <FilterGroup>
                  <FilterLabel>Preço máximo / pessoa</FilterLabel>
                  <PriceSliderWrapper $pct={filterMaxPrice >= MAX_PRICE ? 100 : (filterMaxPrice / MAX_PRICE) * 100}>
                    <input
                      type="range"
                      min={0}
                      max={MAX_PRICE}
                      step={5}
                      value={filterMaxPrice}
                      onChange={e => setFilterMaxPrice(Number(e.target.value))}
                    />
                    <span>
                      {filterMaxPrice >= MAX_PRICE
                        ? 'Qualquer preço'
                        : `Até R$ ${filterMaxPrice}`}
                    </span>
                  </PriceSliderWrapper>
                </FilterGroup>
              </FilterRow>

              <FilterRow>
                <FilterGroup>
                  <FilterLabel>Arena / Estabelecimento</FilterLabel>
                  <FilterSelect
                    value={filterArena}
                    onChange={e => setFilterArena(e.target.value)}
                  >
                    <option value="">Todos os estabelecimentos</option>
                    {arenas.map(arena => (
                      <option key={arena} value={arena}>{arena}</option>
                    ))}
                  </FilterSelect>
                </FilterGroup>

                <FilterGroup>
                  <FilterLabel>Cidade</FilterLabel>
                  <FilterSelect
                    value={filterCity}
                    onChange={e => setFilterCity(e.target.value)}
                  >
                    <option value="">Todas as cidades</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </FilterSelect>
                </FilterGroup>

                <FilterGroup style={{ justifyContent: 'flex-end' }}>
                  <FilterToggle
                    $active={filterVagas}
                    onClick={() => setFilterVagas(v => !v)}
                  >
                    <span className="toggle-track">
                      <span className="toggle-thumb" />
                    </span>
                    Com vagas disponíveis
                  </FilterToggle>
                </FilterGroup>

                {activeFilterCount > 0 && (
                  <ClearBtn onClick={clearFilters}>
                    <X size={14} /> Limpar filtros
                  </ClearBtn>
                )}
              </FilterRow>

              {/* Distância (#224). Linha própria: ele muda de ONDE a busca
                  parte, e é o único filtro que pode estar indisponível. */}
              <FilterRow>
                <FilterGroup style={{ flexBasis: '100%' }}>
                  <FilterLabel>Distância de você</FilterLabel>
                  <RaioLinha>
                    {[0, 5, 10, 25, 50].map((km) => (
                      <RaioChip
                        key={km}
                        type="button"
                        $ativo={raioKm === km}
                        disabled={!temOrigem}
                        aria-pressed={raioKm === km}
                        onClick={() => setRaioKm(km)}
                      >
                        {km === 0 ? 'Qualquer' : `${km} km`}
                      </RaioChip>
                    ))}

                    {!temOrigem && (
                      <RaioExplicacao>
                        Precisamos saber de onde você sai para medir a distância.{' '}
                        {podePedir ? (
                          <button type="button" onClick={pedirLocalizacao}>
                            usar minha localização
                          </button>
                        ) : estadoDaOrigem === 'indisponivel' ? (
                          'Este navegador não informa localização — '
                        ) : (
                          'Você não liberou a localização — '
                        )}
                        {!podePedir && (
                          <button type="button" onClick={() => navigate('/perfil')}>
                            salve seu endereço no perfil
                          </button>
                        )}
                      </RaioExplicacao>
                    )}
                  </RaioLinha>
                </FilterGroup>
              </FilterRow>
            </AdvancedFilters>
          )}
        </FiltersArea>

        {/* Fora dos filtros avançados de propósito: eles nascem fechados, e o
            convite que só aparece depois de a pessoa abrir um painel não
            alcança quem nem sabe que a distância existe como filtro. A
            explicação dentro do painel continua lá — ela diz por que os chips
            de raio estão desabilitados, que é outro assunto (#328). */}
        <ConviteDeLocalizacao
          contexto="Para filtrar por distância, precisamos saber de onde você sai."
          localizacao={localizacao}
        />

        {/*
          O mapa só existe quando há de onde medir, e desce por `import()`
          (#325). Sem origem ele não aparece — mapa sem centro mostraria uma
          cidade qualquer e faria parecer que a busca é de lá.

          Quem entra na busca e não abre o mapa não baixa Leaflet nenhum, que é
          a condição que a #317 deixou e a #354 confirmou apagando o componente
          morto.
        */}
        {origem && (
          <Suspense fallback={<MapaCarregando aria-hidden="true" />}>
            <MapaDaBusca origem={origem} raioKm={raioKm} partidas={pontosDaBusca(filteredEvents)} />
          </Suspense>
        )}

        {/*
          O day use entra ANTES da contagem de partidas, e não depois do grid.

          Ele é o formato de quem quer jogar hoje sem combinar nada — se ficasse
          no fim, quem rolasse até lá já teria decidido. E some sozinho quando
          não há nenhum: um "nenhum day use encontrado" no meio da busca de
          partida pareceria que a busca falhou.

          Os filtros são os mesmos do grid, de propósito: o jogador filtrou uma
          vez e espera que valha para o que a tela mostra.
        */}
        <DayUsesDoDia
          filtros={{ city: filterCity || undefined, courtType: selectedSport || undefined }}
          modo="atalho"
        />

        <ResultsCount>
          {loading
            ? 'Buscando partidas...'
            : `${filteredEvents.length} partida${filteredEvents.length !== 1 ? 's' : ''} encontrada${filteredEvents.length !== 1 ? 's' : ''}`
          }
        </ResultsCount>

        <Grid>
          {loading ? <SkeletonCard count={3} /> : filteredEvents.map((event: Partida) => {
            const isFull = (event._count?.participations || 0) >= event.maxPlayers
            const isJoined = event.participations?.some(p => p.userId === user?.id)

            return (
              <CartaoDePartida
                key={event.id}
                partida={event}
                aoAbrir={() => navigate(`/partida/${event.id}`)}
                mapaUrl={buildGoogleMapsUrl(event)}
                selos={
                  /* Só na busca por raio: sem origem não há distância a mostrar,
                     e um "—" no lugar seria ruído em toda busca textual. */
                  temDistancia(event) && (
                    <DistanciaBadge>
                      <Navigation size={11} aria-hidden /> {formatarNumero(event.distanceKm)} km
                    </DistanciaBadge>
                  )
                }
                extra={
                  /*
                   * Uma linha só dizendo que a partida TEM regra (#230). O card
                   * não diz se este jogador passa: a busca não consulta o portão
                   * por partida. O detalhe é que responde essa pergunta.
                   */
                  <EtiquetaDeRequisitos requirements={event.requirements ?? []} />
                }
                rodape={
                  <ActionButton
                    disabled={isFull || isJoined}
                    $isJoined={isJoined}
                    onClick={(e) => { e.stopPropagation(); handleJoin(event.courtId, event.id) }}
                  >
                    {isJoined
                      ? <><CheckCircle size={18} /> Você entrou</>
                      : isFull ? 'Partida lotada' : 'Entrar na partida'}
                  </ActionButton>
                }
              />
            )
          })}
          </Grid>

        {hasMore && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
            <CarregarMais onClick={() => fetchNextPage()} disabled={loadingMore}>
              {loadingMore ? 'Carregando...' : 'Carregar mais partidas'}
            </CarregarMais>
          </div>
        )}
      </Container>
    </>
  )
}
