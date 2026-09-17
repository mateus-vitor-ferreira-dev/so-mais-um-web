import type { ReactNode } from 'react'

/**
 * O desenho de cada modalidade, casado pelo `icon` que a api serve (#511).
 *
 * É o mesmo conjunto da landing (landing#109), e de propósito: o esporte que a
 * pessoa vê na landing é o que ela encontra no app. Até a #511 nove das doze
 * eram emoji — o `iconFallback` da api — e só futevôlei, vôlei de areia e
 * peteca tinham SVG próprio (#46). Emoji não é desenho, é fonte: a mesma
 * fileira de modalidades tinha uma cara no iPhone, outra no Android e outra no
 * Windows, e a medição do relatório da #511 contava 86 deles como ícone.
 *
 * O `iconFallback` continua no dado: é o contrato com a api, e é o que vai onde
 * só cabe texto (o `<option>` de um `<select>`, pelo `sportTextLabel`).
 *
 * As regras da #46, para as doze: volume com luz de cima à esquerda,
 * enquadramento apertado, silhueta intocável, e duas bolas nunca com a mesma
 * cara (vôlei branco, tênis verde-limão, futsal é a chuteira).
 */

export type Id = (nome: string) => string

export interface Desenho {
  viewBox: string
  conteudo: (id: Id) => ReactNode
}

const VIEWBOX_BOLA = '2.6 2.6 26.8 26.8'

/** Luz de cima à esquerda e sombra na borda oposta, por cima de toda bola. */
function esfera(id: Id) {
  return (
    <>
      <defs>
        <radialGradient id={id('esfera')} cx="34%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="52%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="13" fill={`url(#${id('esfera')})`} />
    </>
  )
}

/** Couro da bola: gradiente radial com a luz no mesmo ponto da `esfera`. */
function couro(id: Id, cores: [string, string, string]) {
  return (
    <defs>
      <radialGradient id={id('couro')} cx="34%" cy="28%" r="80%">
        <stop offset="0%" stopColor={cores[0]} />
        <stop offset="55%" stopColor={cores[1]} />
        <stop offset="100%" stopColor={cores[2]} />
      </radialGradient>
      <clipPath id={id('recorte')}>
        <circle cx="16" cy="16" r="13" />
      </clipPath>
    </defs>
  )
}

/** Os cinco vértices de um pentágono de raio `r` em volta de (cx, cy). */
function pentagono(cx: number, cy: number, r: number, giro = -90) {
  return Array.from({ length: 5 }, (_, i) => {
    const a = ((giro + i * 72) * Math.PI) / 180
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
  }).join(' ')
}

export const DESENHOS: Record<string, Desenho> = {
  // A bola de gomos: pentágono preto no centro e cinco cortados pela borda.
  society: {
    viewBox: VIEWBOX_BOLA,
    conteudo: (id) => {
      const vizinhos = [-90, -18, 54, 126, 198].map((graus) => {
        const a = (graus * Math.PI) / 180
        return { x: 16 + 11.6 * Math.cos(a), y: 16 + 11.6 * Math.sin(a), graus }
      })
      return (
        <>
          {couro(id, ['#ffffff', '#f1f1f1', '#b9bcc4'])}
          <circle cx="16" cy="16" r="13" fill={`url(#${id('couro')})`} />
          <g clipPath={`url(#${id('recorte')})`}>
            <g stroke="#9ca3af" strokeWidth="0.8">
              {vizinhos.map((v) => (
                <line key={v.graus} x1={16 + 4.4 * Math.cos((v.graus * Math.PI) / 180)} y1={16 + 4.4 * Math.sin((v.graus * Math.PI) / 180)} x2={v.x} y2={v.y} />
              ))}
            </g>
            <polygon points={pentagono(16, 16, 4.6)} fill="#1f2937" />
            {vizinhos.map((v) => (
              <polygon key={v.graus} points={pentagono(v.x, v.y, 4, v.graus + 90)} fill="#1f2937" />
            ))}
          </g>
          {esfera(id)}
        </>
      )
    },
  },

  // O campo visto de cima, com as linhas das ilustrações da `CourtsSection`.
  'futebol-campo': {
    viewBox: '1.5 5 29 22',
    conteudo: (id) => (
      <>
        <defs>
          <linearGradient id={id('grama')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="55%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
        </defs>
        <rect x="2" y="5.5" width="28" height="21" rx="2.5" fill={`url(#${id('grama')})`} />
        {/* faixas de corte da grama */}
        <g fill="#000000" opacity="0.1">
          <rect x="6.2" y="5.5" width="3.9" height="21" />
          <rect x="14" y="5.5" width="3.9" height="21" />
          <rect x="21.8" y="5.5" width="3.9" height="21" />
        </g>
        <g fill="none" stroke="#ffffff" strokeWidth="1.1" opacity="0.95">
          <rect x="4" y="7.5" width="24" height="17" rx="0.6" />
          <line x1="16" y1="7.5" x2="16" y2="24.5" />
          <circle cx="16" cy="16" r="3.2" />
          <path d="M4 12 h3.4 v8 H4" />
          <path d="M28 12 h-3.4 v8 H28" />
        </g>
        <circle cx="16" cy="16" r="0.8" fill="#ffffff" />
      </>
    ),
  },

  // A chuteira de futsal, de perfil: a bola redonda já é do society.
  futsal: {
    viewBox: '1.8 5.6 28.4 20.8',
    conteudo: (id) => (
      <>
        <defs>
          <linearGradient id={id('cabedal')} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <linearGradient id={id('sola')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>
        <path
          d="M3.2 21.4 L3.4 10.6 C3.5 8.9 5 8.2 6.4 8.9 L9.6 10.5 C11 11.2 12.5 10.9 13.4 9.7 L14.6 8.1 C15.3 7.2 16.5 7.1 17.3 7.9 L22.4 13.3 C23.9 14.8 25.7 15.5 27.4 15.9 C29.2 16.4 29.8 18.2 29.6 21.4 Z"
          fill={`url(#${id('cabedal')})`}
        />
        {/* a faixa lateral e o cadarço */}
        <path d="M5.6 18.6 C11 19 17.6 17.6 23.4 15.2" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <g stroke="#ffffff" strokeWidth="1" strokeLinecap="round">
          <line x1="15.6" y1="10.2" x2="17.6" y2="9.4" />
          <line x1="17.2" y1="11.9" x2="19.2" y2="11.1" />
          <line x1="18.8" y1="13.6" x2="20.8" y2="12.8" />
        </g>
        <path d="M2.8 21 H29.8 C30.3 21 30.4 24.9 29.4 24.9 H3.6 C2.6 24.9 2.3 21 2.8 21 Z" fill={`url(#${id('sola')})`} />
        <path d="M3.2 23.6 H30 C29.9 24.4 29.7 24.9 29.4 24.9 H3.6 C3.4 24.9 3.3 24.4 3.2 23.6 Z" fill="#94a3b8" />
      </>
    ),
  },

  // Os losangos da bola de futevôlei, em coluna do polo ao polo (#46).
  futevolei: {
    viewBox: VIEWBOX_BOLA,
    conteudo: (id) => (
      <>
        {couro(id, ['#ffe273', '#f5c518', '#b8860a'])}
        <circle cx="16" cy="16" r="13" fill={`url(#${id('couro')})`} />
        {/*
          Antes havia dois losangos a leste e a oeste, na parte mais larga da
          bola, e o preto encostava na borda: a 30px o contorno redondo sumia e
          sobrava um losango amarelo. Aqui a coluna atravessa a bola pelo eixo
          curto, onde a ponta do losango é estreita e a silhueta sobrevive.
        */}
        <g clipPath={`url(#${id('recorte')})`} fill="#1e1e1e">
          <path d="M16 11.4 L19.6 16 L16 20.6 L12.4 16 Z" />
          <path d="M16 2.6 L19.6 7.2 L16 11.8 L12.4 7.2 Z" />
          <path d="M16 20.2 L19.6 24.8 L16 29.4 L12.4 24.8 Z" />
        </g>
        <g clipPath={`url(#${id('recorte')})`} fill="none" stroke="#7a5c07" strokeWidth="0.7" opacity="0.55">
          <path d="M7.4 4.4 C10.6 10.4 10.6 21.6 7.4 27.6" />
          <path d="M24.6 4.4 C21.4 10.4 21.4 21.6 24.6 27.6" />
        </g>
        {esfera(id)}
      </>
    ),
  },

  // Branca com a costura em três gomos curvos: o azul e amarelo é da areia.
  volei: {
    viewBox: VIEWBOX_BOLA,
    conteudo: (id) => (
      <>
        {couro(id, ['#ffffff', '#f4f4f5', '#b9bcc4'])}
        <circle cx="16" cy="16" r="13" fill={`url(#${id('couro')})`} />
        <g clipPath={`url(#${id('recorte')})`} fill="none" stroke="#6b7280" strokeWidth="1" strokeLinecap="round">
          {[0, 120, 240].map((giro) => (
            <g key={giro} transform={`rotate(${giro} 16 16)`}>
              <path d="M16 16 C16 10.4 19.6 5.6 25.4 4.6" />
              <path d="M12.2 13.8 C12.9 8.6 16.2 4.6 21 2.9" />
            </g>
          ))}
        </g>
        {esfera(id)}
      </>
    ),
  },

  // Gomos curvos de polo a polo, o desenho da bola de praia (#46).
  'volei-areia': {
    viewBox: VIEWBOX_BOLA,
    conteudo: (id) => (
      <>
        {couro(id, ['#ffffff', '#f2f2f2', '#b9bcc4'])}
        <circle cx="16" cy="16" r="13" fill={`url(#${id('couro')})`} />
        <g clipPath={`url(#${id('recorte')})`}>
          <path d="M16 3 C0 9, 0 23, 16 29 C8 23, 8 9, 16 3 Z" fill="#2a5fe0" />
          <path d="M16 3 C12 9, 12 23, 16 29 C20 23, 20 9, 16 3 Z" fill="#f5c518" />
          <path d="M16 3 C24 9, 24 23, 16 29 C32 23, 32 9, 16 3 Z" fill="#2a5fe0" />
        </g>
        {esfera(id)}
      </>
    ),
  },

  // Vermelha com duas faixas curvas: a laranja de linhas pretas é do basquete.
  handebol: {
    viewBox: VIEWBOX_BOLA,
    conteudo: (id) => (
      <>
        {couro(id, ['#f87171', '#dc2626', '#991b1b'])}
        <circle cx="16" cy="16" r="13" fill={`url(#${id('couro')})`} />
        <g clipPath={`url(#${id('recorte')})`}>
          <path d="M2 11.6 C9 15.4 21 15.4 30 9.4 L30 13.6 C21 19.4 9 19.6 2 15.8 Z" fill="#ffffff" />
          <path d="M4 22.2 C11 24.6 20 24 28 19.8 L28 22.4 C20 26.6 11 27.2 4 24.8 Z" fill="#1d4ed8" />
        </g>
        {esfera(id)}
      </>
    ),
  },

  // A pena em leque sobre a base de borracha (#46).
  peteca: {
    viewBox: '2.5 1.6 27 27',
    conteudo: (id) => (
      <>
        <defs>
          <linearGradient id={id('pena')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#efece0" />
            <stop offset="100%" stopColor="#cbc7b6" />
          </linearGradient>
          <linearGradient id={id('base')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4a4a52" />
            <stop offset="38%" stopColor="#2d2d33" />
            <stop offset="100%" stopColor="#141418" />
          </linearGradient>
          <linearGradient id={id('fita')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffdc5e" />
            <stop offset="45%" stopColor="#f5c518" />
            <stop offset="100%" stopColor="#c08d05" />
          </linearGradient>
        </defs>
        <g stroke="#b8b4a3" strokeWidth="0.25" fill={`url(#${id('pena')})`}>
          {[-17, 17, -6, 6].map((giro) => (
            <path key={giro} d="M16 19 C13.4 13 13.2 7.5 16 2.8 C18.8 7.5 18.6 13 16 19 Z" transform={`rotate(${giro} 16 19)`} />
          ))}
        </g>
        <path d="M12.2 17.6 h7.6 v3.4 h-7.6 z" fill={`url(#${id('fita')})`} />
        <ellipse cx="16" cy="21.2" rx="6.4" ry="2.3" fill="#4d4d56" />
        <path d="M9.6 21.2 h12.8 v4.4 h-12.8 z" fill={`url(#${id('base')})`} />
        <ellipse cx="16" cy="25.6" rx="6.4" ry="2.3" fill="#141418" />
        <path d="M9.6 24.3 h12.8 v1.5 h-12.8 z" fill={`url(#${id('fita')})`} />
      </>
    ),
  },

  // A raquete maciça com furos, e a bola ao pé dela: o tênis é só a bola.
  'beach-tennis': {
    viewBox: '2 2 28 28',
    conteudo: (id) => (
      <>
        <defs>
          <linearGradient id={id('face')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#bef264" />
            <stop offset="50%" stopColor="#65a30d" />
            <stop offset="100%" stopColor="#3f6212" />
          </linearGradient>
          <linearGradient id={id('cabo')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f4f4f5" />
            <stop offset="100%" stopColor="#a1a1aa" />
          </linearGradient>
          <radialGradient id={id('bolinha')} cx="34%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="55%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </radialGradient>
        </defs>
        {/* Cabo claro: em cinza-escuro ele sumia no fundo da página. */}
        <g transform="rotate(-45 16 16)">
          <rect x="14.4" y="20" width="3.2" height="9.6" rx="1.5" fill={`url(#${id('cabo')})`} />
          <g fill="#6b7280">
            <rect x="14.4" y="23.4" width="3.2" height="0.7" />
            <rect x="14.4" y="25.6" width="3.2" height="0.7" />
          </g>
          <ellipse cx="16" cy="11" rx="8.6" ry="9.6" fill={`url(#${id('face')})`} stroke="#365314" strokeWidth="1.2" />
          <g fill="#1a2e05" opacity="0.65">
            {[
              [16, 5], [12.6, 7.8], [19.4, 7.8], [16, 10.6], [12.6, 13.4], [19.4, 13.4], [16, 16.2],
            ].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.05" />
            ))}
          </g>
        </g>
        <circle cx="6.8" cy="25.2" r="3.3" fill={`url(#${id('bolinha')})`} />
      </>
    ),
  },

  // Laranja com as quatro linhas pretas acompanhando a curvatura.
  basquete: {
    viewBox: VIEWBOX_BOLA,
    conteudo: (id) => (
      <>
        {couro(id, ['#fdba74', '#f97316', '#c2410c'])}
        <circle cx="16" cy="16" r="13" fill={`url(#${id('couro')})`} />
        <g clipPath={`url(#${id('recorte')})`} fill="none" stroke="#3b1a07" strokeWidth="0.9">
          <path d="M16 3 C14.6 9 14.6 23 16 29" />
          <path d="M3 16 C9 14.6 23 14.6 29 16" />
          <path d="M6.6 6 C11.6 11 11.6 21 6.6 26" />
          <path d="M25.4 6 C20.4 11 20.4 21 25.4 26" />
        </g>
        {esfera(id)}
      </>
    ),
  },

  // Verde-limão com a costura branca em S: o amarelo já é do futevôlei.
  tenis: {
    viewBox: VIEWBOX_BOLA,
    conteudo: (id) => (
      <>
        {couro(id, ['#f7fee7', '#d9f252', '#84a911'])}
        <circle cx="16" cy="16" r="13" fill={`url(#${id('couro')})`} />
        <g clipPath={`url(#${id('recorte')})`} fill="none" stroke="#ffffff" strokeWidth="1.5">
          <path d="M5.6 5.4 C11.6 10 11.6 22 5.6 26.6" />
          <path d="M26.4 5.4 C20.4 10 20.4 22 26.4 26.6" />
        </g>
        {esfera(id)}
      </>
    ),
  },

  // Duas cartas em leque: o verso roxo atrás e o ás de copas na frente.
  poker: {
    viewBox: '2.4 2.4 27.2 27.2',
    conteudo: (id) => (
      <>
        <defs>
          <linearGradient id={id('verso')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="55%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#6b21a8" />
          </linearGradient>
          <linearGradient id={id('frente')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f4f4f5" />
            <stop offset="100%" stopColor="#d4d4d8" />
          </linearGradient>
        </defs>
        <g transform="rotate(-14 16 16)">
          <rect x="4.6" y="5.2" width="14.4" height="20" rx="2.2" fill={`url(#${id('verso')})`} />
          <rect x="6.6" y="7.2" width="10.4" height="16" rx="1.2" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
        </g>
        <g transform="rotate(12 16 16)">
          <rect x="12.4" y="6.4" width="14.4" height="20" rx="2.2" fill={`url(#${id('frente')})`} stroke="#a1a1aa" strokeWidth="0.4" />
          <path
            d="M19.6 20.6 C16.3 18.2 15 16.4 15 14.8 C15 13.4 16 12.4 17.2 12.4 C18.2 12.4 19 13 19.6 13.8 C20.2 13 21 12.4 22 12.4 C23.2 12.4 24.2 13.4 24.2 14.8 C24.2 16.4 22.9 18.2 19.6 20.6 Z"
            fill="#dc2626"
          />
        </g>
      </>
    ),
  },
}

/**
 * Modalidade que a api passar a servir antes de ganhar desenho aqui: uma bola
 * neutra, e não um buraco no cartão. O `contrato:check` reprova antes de isso
 * chegar ao ar.
 */
export const GENERICO: Desenho = {
  viewBox: VIEWBOX_BOLA,
  conteudo: (id) => (
    <>
      {couro(id, ['#e5e7eb', '#9ca3af', '#4b5563'])}
      <circle cx="16" cy="16" r="13" fill={`url(#${id('couro')})`} />
      {esfera(id)}
    </>
  ),
}
