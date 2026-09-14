/**
 * O que prende o catálogo (#430).
 *
 * O risco de um registro de design system não é quebrar — é **envelhecer em
 * silêncio**. Foi assim que a #315 nasceu: catorze `EmptyState` divergentes
 * porque não havia onde a decisão morar, e nada acusava a divergência.
 *
 * Três guardas, nesta ordem de importância:
 *
 * 1. **Componente novo obriga uma decisão.** Se alguém criar uma peça em
 *    `src/components` e não disser se ela é vocabulário visual, este arquivo
 *    reprova. A decisão pode ser qualquer uma — o que não pode é ficar
 *    implícita, que é exatamente como a dívida da #315 cresceu.
 * 2. **Cada peça renderiza nos dois temas.** O catálogo existe para mostrar os
 *    dois; um que quebre no escuro seria pior que não ter catálogo.
 * 3. **O que a #315 e a #314 promoveram está registrado.** Sumir daqui é a
 *    forma silenciosa de a peça deixar de ter dono.
 */
import { describe, it, expect, vi } from 'vitest'
import { ThemeProvider } from 'styled-components'
import { render, screen } from '@testing-library/react'
import { darkTheme, lightTheme } from '../../styles/theme'
import { PECAS } from './pecas'
import DesignSystem from './index'

/**
 * Componentes de `src/components` que **não** são vocabulário visual.
 *
 * São peças de funcionalidade: falam com a api, guardam estado de fluxo, ou só
 * existem dentro de uma tela. O catálogo é sobre como o app **diz** coisas —
 * vazio, erro, identidade, papel —, não sobre o que ele faz.
 *
 * Entrar aqui é uma decisão legítima e barata. O que o teste impede é a
 * terceira opção: não decidir.
 */
const NAO_SAO_VOCABULARIO = new Set([
  'AgendaDaQuadra', 'AuthLayout', 'BotaoSeguir', 'ChamarParaJogar',
  'CompartilharPartida', 'ConfiguracaoDeAcesso', 'ConfirmacaoDePresencas',
  'ContentLoader', 'ConviteDeLocalizacao', 'ConvitesDeTime', 'DashboardLayout',
  'ConversaDeSuporte', // a conversa de suporte: fala com a api e guarda o estado da conversa (web#472, web#473)
  'DayUsesDoDia', 'DivisionRegistration', 'EnderecoDoJogador', 'ErrorBoundary',
  'FalhaAoVerificarSessao', 'LancarPlacar', 'ListaDePessoas', 'LoginComGoogle',
  'LogoSvg', 'MainLayout', 'MapaDaBusca', 'MarcaDeVisibilidade',
  'NotificationBell', 'PartidasParaApitar', 'PartidasPerto', 'PasswordInput',
  'PerfilEsportivo', 'PhoneInput', 'PlanGate', 'RegrasDaPartida',
  'RequisitosDaPartida', 'SorteioDeTimes', 'SportIcon', 'SportSelect',
  'StatCard', 'SubscriptionGate', 'TournamentBracket', 'TournamentRegistrations',
  'VinculosDeProfessor',
])

/** Os diretórios de `src/components`, lidos em tempo de build pelo Vite. */
function componentesDoRepo(): string[] {
  const modulos = import.meta.glob('../../components/*/index.tsx')
  return Object.keys(modulos)
    .map((caminho) => caminho.split('/').at(-2) ?? '')
    .filter(Boolean)
    .sort()
}

describe('catálogo do design system', () => {
  it('todo componente é vocabulário ou está declarado como não sendo', () => {
    const registrados = new Set(PECAS.map((p) => p.nome))
    const semDono = componentesDoRepo().filter(
      (nome) => !registrados.has(nome) && !NAO_SAO_VOCABULARIO.has(nome),
    )

    expect(
      semDono,
      `Componente sem decisão: ${semDono.join(', ')}.\n` +
        'Se for peça do vocabulário visual, registre em pages/DesignSystem/pecas.tsx.\n' +
        'Se não for, acrescente a NAO_SAO_VOCABULARIO neste arquivo.',
    ).toEqual([])
  })

  it('a lista do que não é vocabulário não guarda componente que já sumiu', () => {
    // Lista de exclusão que acumula nome morto é lista que ninguém mais lê.
    const existentes = new Set(componentesDoRepo())
    const fantasmas = [...NAO_SAO_VOCABULARIO].filter((nome) => !existentes.has(nome))

    expect(fantasmas).toEqual([])
  })

  it.each(PECAS)('$nome renderiza em todos os estados, nos dois temas', ({ estados }) => {
    for (const tema of [lightTheme, darkTheme]) {
      for (const estado of estados) {
        const { unmount } = render(<ThemeProvider theme={tema}>{estado.render()}</ThemeProvider>)
        unmount()
      }
    }
  })

  it('registra o que a #315 e a #314 promoveram', () => {
    const nomes = PECAS.map((p) => p.nome)

    for (const promovido of ['EmptyState', 'ErrorState', 'CaptainBadge', 'MarcaDoTime']) {
      expect(nomes, promovido).toContain(promovido)
    }
  })

  it('a página abre, com índice e as duas colunas de tema por peça', () => {
    // O `matchMedia` do Skeleton e do tema não existe no jsdom.
    vi.stubGlobal('matchMedia', () => ({
      matches: false, addEventListener: () => {}, removeEventListener: () => {},
    }))

    render(<ThemeProvider theme={lightTheme}><DesignSystem /></ThemeProvider>)

    expect(screen.getByRole('heading', { name: /Vocabulário visual/ })).toBeInTheDocument()
    // Cada peça aparece uma vez como título e uma vez no índice.
    for (const peca of PECAS) {
      expect(screen.getByRole('heading', { name: peca.nome, level: 2 })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: peca.nome })).toBeInTheDocument()
    }
    expect(screen.getAllByText('Claro').length).toBe(PECAS.length + 1)
    expect(screen.getAllByText('Escuro').length).toBe(PECAS.length + 1)
  })
})
