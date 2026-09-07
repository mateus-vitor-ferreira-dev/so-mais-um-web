const base = {
  fonts: {
    sans: "'Inter', 'Segoe UI', sans-serif",
  },

  fontSizes: {
    xs:   '0.75rem',
    sm:   '0.875rem',
    md:   '1rem',
    lg:   '1.125rem',
    xl:   '1.25rem',
    '2xl':'1.5rem',
    '3xl':'1.875rem',
  },

  fontWeights: {
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },

  spacing: {
    1:  '4px',
    2:  '8px',
    3:  '12px',
    4:  '16px',
    5:  '20px',
    6:  '24px',
    8:  '32px',
    10: '40px',
    12: '48px',
  },

  radii: {
    sm:   '6px',
    md:   '10px',
    lg:   '14px',
    xl:   '20px',
    full: '9999px',
  },

  shadows: {
    sm:  '0 1px 3px rgba(0,0,0,0.08)',
    md:  '0 4px 12px rgba(0,0,0,0.08)',
    lg:  '0 8px 24px rgba(0,0,0,0.1)',
  },

  sidebar: {
    width: '220px',
  },
}

export const lightTheme = {
  ...base,
  mode: 'light',
  colors: {
    primary:       '#22c55e',
    primaryHover:  '#16a34a',
    primaryDark:   '#166534',
    primaryLight:  '#dcfce7',
    primarySubtle: '#f0fdf4',

    bgApp:         '#f0fdf4',
    bgPage:        '#f9fafb',
    bgSidebar:     '#ffffff',
    bgCard:        '#ffffff',
    bgInput:       '#ffffff',
    bgOverlay:     'rgba(0, 0, 0, 0.4)',

    /*
     * A escala de texto, e por que estes três valores (#435).
     *
     * Todos os três precisam alcançar 4,5:1 contra a superfície mais escura em
     * que aparecem — `bgApp`, que é o verde palha da área do jogador. Não é
     * refinamento: `textMuted` carrega "Nenhuma partida disponível no momento",
     * que é a única coisa na tela quando a lista está vazia, e ele estava em
     * 2,43:1 — pouco mais da metade do mínimo.
     *
     * Corrigir só o `textMuted` não dava: o `textSecondary` estava em 4,62, e
     * abaixo dele não sobrava degrau nenhum acima de 4,5. Os dois desceram um
     * passo juntos, e o `textMuted` herdou o valor que era do `textSecondary` —
     * então nada CLAREOU: os três níveis só ganharam contraste, e a hierarquia
     * entre eles continua visível.
     *
     * `styles/contraste.test.ts` mede isto a cada suíte. Trocar um destes
     * valores por um mais claro reprova lá, com o número.
     */
    textPrimary:   '#111827',
    textSecondary: '#4b5563',
    textMuted:     '#6b7280',
    textOnPrimary: '#ffffff',

    border:        '#e5e7eb',
    borderLight:   '#f3f4f6',

    success:       '#22c55e',
    successLight:  '#dcfce7',
    warning:       '#f59e0b',
    warningLight:  '#fef3c7',
    warningText:   '#92400e',
    warningBorder: '#fde68a',
    error:         '#ef4444',
    errorLight:    '#fee2e2',
    info:          '#3b82f6',
    infoLight:     '#dbeafe',

    white:         '#ffffff',
    black:         '#000000',
  },
}

export const darkTheme = {
  ...base,
  mode: 'dark',
  shadows: {
    sm:  '0 1px 3px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.35)',
    md:  '0 4px 12px rgba(0,0,0,0.65), 0 2px 4px rgba(0,0,0,0.45)',
    lg:  '0 8px 24px rgba(0,0,0,0.75), 0 4px 8px rgba(0,0,0,0.55)',
  },
  colors: {
    // Verde só como acento, nunca como fundo — mesmo padrão do Recanto Vila Rica
    primary:       '#3ecf8e',
    primaryHover:  '#2db87a',
    primaryDark:   '#1da066',
    primaryLight:  '#0d1f15',
    primarySubtle: '#163d26',

    bgApp:         '#111111',
    bgPage:        '#111111',
    bgSidebar:     '#1c1c1c',
    bgCard:        '#1c1c1c',
    bgInput:       '#0e0e0e',
    bgOverlay:     'rgba(0, 0, 0, 0.7)',

    textPrimary:   '#e8e8e8',
    textSecondary: '#a0a0a0',
    /* 2,97:1 contra o bgCard antes da #435 — abaixo até do piso de 3:1 que
       vale para elemento não-texto. Aqui o `textSecondary` já passava com
       folga, então só este subiu. */
    textMuted:     '#8a8a8a',
    textOnPrimary: '#ffffff',

    border:        '#2c2c2c',
    borderLight:   '#272727',

    success:       '#4ade80',
    successLight:  '#0a2018',
    warning:       '#fbbf24',
    warningLight:  '#1a1000',
    warningText:   '#f59e0b',
    warningBorder: '#78350f',
    error:         '#f87171',
    errorLight:    '#1a0808',
    info:          '#93c5fd',
    infoLight:     '#080f1c',

    white:         '#ffffff',
    black:         '#000000',
  },
} satisfies AppTheme

/**
 * O tipo do tema é DERIVADO do lightTheme, e o darkTheme é obrigado a
 * satisfazê-lo (ver `satisfies` acima). Assim as duas variantes não podem
 * divergir: uma cor presente em uma e ausente na outra vira erro de compilação
 * em vez de `undefined` no CSS em runtime.
 *
 * É este tipo que styled.d.ts injeta em DefaultTheme.
 */
export type AppTheme = typeof lightTheme

// backward compat — componentes que importam { theme } continuam funcionando
export const theme = lightTheme
