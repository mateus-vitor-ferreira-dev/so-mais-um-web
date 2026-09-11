import { QueryClient } from '@tanstack/react-query'
import type { FiltrosDeDayUse } from '../types/api'

/**
 * Cliente de cache de estado de servidor (#198).
 *
 * Antes, cada página buscava tudo do zero na montagem: três visitas seguidas à
 * Home custavam 200 / 202 / 200 ms a 180 ms de RTT — constante morto, porque o
 * dado que tinha chegado segundos antes era descartado.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Um minuto de frescor. Cobre a navegação de ida e volta, que é o caso
       * que dói, sem deixar a tela mentir por muito tempo: dado de partida
       * muda com gente entrando e saindo.
       */
      staleTime: 60_000,
      /**
       * A API responde em 2–3 ms; quando falha, é rede ou 4xx, e repetir três
       * vezes só adia o erro na cara de quem está olhando. Uma tentativa extra
       * cobre o soluço de rede e para por aí.
       */
      retry: 1,
      /**
       * Desligado de propósito: com `staleTime` de um minuto isto só
       * dispararia rajada de refetch em quem alterna entre abas, sem ganho —
       * o dado ainda está fresco.
       */
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * Chaves de cache em um lugar só.
 *
 * Chave montada à mão no meio do componente é como o cache passa a errar:
 * a query grava em `['events']` e a invalidação procura `['event']`, ninguém
 * percebe, e a tela fica velha em silêncio.
 */
export const chaves = {
  modalidades: ['modalidades'] as const,
  formatosDeCampeonato: ['formatos-de-campeonato'] as const,
  eventos: {
    busca:       (filtros: unknown) => ['eventos', 'busca', filtros] as const,
    participando: () => ['eventos', 'participando'] as const,
    criados:      () => ['eventos', 'criados'] as const,
    /**
     * As recomendadas dependem da ORIGEM e do raio (#223).
     *
     * A origem entra na chave porque a resposta muda com ela: quem estava em
     * casa e abriu o app na quadra precisa de outra lista, e reaproveitar o
     * cache mostraria distâncias de onde a pessoa não está mais.
     */
    recomendadas: (origem: { latitude: number; longitude: number } | null, raioKm: number) =>
      ['eventos', 'recomendadas', origem?.latitude ?? null, origem?.longitude ?? null, raioKm] as const,
  },
  times: {
    meus:    () => ['times', 'meus'] as const,
    porId:   (teamId: string) => ['times', teamId] as const,
    partidas: (teamId: string) => ['times', teamId, 'partidas'] as const,
    convites: () => ['times', 'convites'] as const,
  },
  quadras: () => ['quadras'] as const,
  /**
   * Os convites de professor de um espaço (api#451).
   *
   * Por espaço, e não uma lista só: o dono com dois estabelecimentos tem duas
   * listas que não se misturam, e uma chave única faria a segunda tela mostrar
   * os convites da primeira até revalidar.
   */
  convitesDeProfessor: (placeId: string) => ['espacos', placeId, 'convites-de-professor'] as const,
  linksDoEspaco: (placeId: string) => ['espacos', placeId, 'links-de-convite'] as const,
  /**
   * As turmas de um espaço (api#472), e quem pode dar aula nelas (api#461).
   *
   * Por espaço, pelo mesmo motivo dos convites: o dono com dois
   * estabelecimentos tem duas listas que não se misturam.
   */
  turmas: (placeId: string) => ['espacos', placeId, 'turmas'] as const,
  membrosDoEspaco: (placeId: string) => ['espacos', placeId, 'membros'] as const,
  quadrasDoEspaco: (placeId: string) => ['espacos', placeId, 'quadras'] as const,

  /**
   * Os day uses de um espaço (api#505), e quem está dentro de cada um.
   *
   * O `incluirCancelados` entra na chave porque muda o **conjunto** devolvido,
   * não a ordem: sem ele na chave, ligar o filtro serviria a lista de antes do
   * cache e o cancelado só apareceria no refetch seguinte.
   */
  dayUses: (placeId: string, incluirCancelados: boolean) =>
    ['espacos', placeId, 'day-uses', incluirCancelados] as const,
  entradasDoDayUse: (dayUseId: string) => ['day-uses', dayUseId, 'entradas'] as const,

  /** A busca pública de day use, do jogador (api#519). */
  /**
   * A busca de day use, com todos os filtros na chave (web#469).
   *
   * Cada filtro é uma pergunta diferente e tem resposta diferente: deixar
   * qualquer um de fora faria a tela reaproveitar o cache de uma busca que não
   * é esta — trocar o raio e ver a lista antiga é o sintoma.
   */
  buscaDeDayUses: (filtros: FiltrosDeDayUse) =>
    [
      'day-uses',
      'busca',
      filtros.city ?? '',
      filtros.courtType ?? '',
      filtros.from ?? '',
      filtros.to ?? '',
      filtros.precoMax ?? '',
      filtros.latitude ?? '',
      filtros.longitude ?? '',
      filtros.radiusKm ?? '',
    ] as const,
  /**
   * Os alunos de uma turma (api#474).
   *
   * O histórico entra na chave: a resposta com quem saiu é outra lista, e
   * reaproveitar o cache faria a tela mostrar só os ativos depois de o dono
   * pedir o histórico — ou o contrário, que é pior.
   */
  matriculas: (turmaId: string, comHistorico: boolean) =>
    ['turmas', turmaId, 'matriculas', comHistorico] as const,
  aulasDaTurma: (turmaId: string, dia: string) => ['turmas', turmaId, 'aulas', dia] as const,
  chamada: (aulaId: string) => ['aulas', aulaId, 'chamada'] as const,
  mensalidades: (turmaId: string, competencia: string) =>
    ['turmas', turmaId, 'mensalidades', competencia] as const,
  /**
   * A agenda entra no cache por quadra **e por dia** (api#443).
   *
   * O dia faz parte da chave porque a resposta muda com ele: quem olhou terça e
   * foi para quarta veria as marcações de terça desenhadas sobre a quarta.
   */
  agendaDaQuadra: (courtId: string, dia: string) => ['quadras', courtId, 'agenda', dia] as const,
  /**
   * A rede social (api#387).
   *
   * `seguindo` e `amigos` do próprio usuário entram separados das listas de
   * terceiros porque são **estado do botão**, e não conteúdo de tela: quem
   * segue quem decide o rótulo de "Seguir" em qualquer lugar que mostre uma
   * pessoa, e o mesmo cache serve a todos eles.
   */
  rede: {
    seguidores: (userId: string) => ['rede', userId, 'seguidores'] as const,
    seguindo:   (userId: string) => ['rede', userId, 'seguindo'] as const,
    meusAmigos: () => ['rede', 'eu', 'amigos'] as const,
  },
  /**
   * As solicitações de estabelecimento ainda pendentes, para o contador do
   * menu lateral (#356).
   *
   * O escopo entra na chave porque a resposta é outra: o admin conta a fila
   * inteira, o dono conta só o que ele mesmo pediu. Uma chave única faria o
   * painel do owner mostrar o número do admin — ou o contrário, que é pior,
   * porque revelaria a fila de todo mundo a quem só devia ver a própria.
   */
  solicitacoesPendentes: (escopo: 'todas' | 'minhas') =>
    ['solicitacoes', 'pendentes', escopo] as const,
  /**
   * A área do professor (api#451, api#484).
   *
   * Fora de `espacos/<placeId>`, e é a mesma razão da api ter montado estas
   * rotas sob `/me`: a agenda dele mistura as academias, então uma chave por
   * espaço obrigaria a escolher um antes de ver qualquer coisa.
   */
  professor: {
    turmas: () => ['professor', 'turmas'] as const,
    /** A janela entra na chave: outra janela é outra resposta. */
    agenda: (de: string, ate: string) => ['professor', 'agenda', de, ate] as const,
  },
  jogador: (userId: string) => ['jogador', userId] as const,
  perfisEsportivos: () => ['perfis-esportivos'] as const,
  estatisticas: () => ['estatisticas'] as const,
  /**
   * As assinaturas, na tela do admin (api#537).
   *
   * Uma chave só, sem filtro: a lista é curta por natureza — são as arenas que
   * assinam o Só+1, não os clientes delas — e quem opera precisa das vencidas
   * junto das em dia, que é justamente o que um filtro na chave separaria.
   */
  assinaturasDoAdmin: () => ['admin', 'assinaturas'] as const,
  /**
   * Os donos e os planos que o formulário de assinatura manual oferece (api#537).
   *
   * Separados da lista de assinaturas porque são carregados só quando o modal
   * abre: quem só veio conferir vencimentos não precisa da base de usuários.
   */
  usuariosDoAdmin: (papel: string) => ['admin', 'usuarios', papel] as const,
  planos: () => ['planos'] as const,
  /**
   * A conversa de suporte do dono logado (web#472). Sem id: a conversa é sempre
   * a de quem chama. É uma `useInfiniteQuery` — as páginas anteriores entram
   * quando o dono sobe a rolagem.
   */
  suporteDoDono: () => ['suporte', 'dono'] as const,
}
