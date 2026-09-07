/**
 * A paleta fechada da marca do time (#314).
 *
 * Espelha o enum `TeamColor` do Prisma. Se a api ganhar uma cor e este arquivo
 * não, o time que a escolher cai no desfecho seguro — a cor derivada do nome —
 * em vez de desenhar um quadrado transparente.
 */
export const CORES_DE_TIME = [
  'VERDE', 'AZUL', 'ROXO', 'ROSA', 'VERMELHO', 'LARANJA', 'AMARELO', 'CIANO',
] as const

export type CorDeTime = (typeof CORES_DE_TIME)[number]

/** Como cada cor se chama para quem escolhe, e para quem ouve. */
export const NOME_DA_COR: Record<CorDeTime, string> = {
  VERDE:     'Verde',
  AZUL:      'Azul',
  ROXO:      'Roxo',
  ROSA:      'Rosa',
  VERMELHO:  'Vermelho',
  LARANJA:   'Laranja',
  AMARELO:   'Amarelo',
  CIANO:     'Ciano',
}

/**
 * Os tons, por tema.
 *
 * **O banco guarda o nome da cor, não o hexadecimal**, e é por isso que esta
 * tabela existe aqui: o tom que funciona no claro some no escuro. No claro, cor
 * cheia com texto branco; no escuro, cor mais clara com texto quase preto —
 * bloco saturado sobre fundo `#111` é agressivo, e texto branco sobre amarelo
 * não se lê em tema nenhum.
 */
export const TONS: Record<'light' | 'dark', Record<CorDeTime, { fundo: string; texto: string }>> = {
  light: {
    VERDE:    { fundo: '#16a34a', texto: '#ffffff' },
    AZUL:     { fundo: '#2563eb', texto: '#ffffff' },
    ROXO:     { fundo: '#7c3aed', texto: '#ffffff' },
    ROSA:     { fundo: '#db2777', texto: '#ffffff' },
    VERMELHO: { fundo: '#dc2626', texto: '#ffffff' },
    LARANJA:  { fundo: '#ea580c', texto: '#ffffff' },
    // Âmbar escuro, e não amarelo: sobre amarelo puro o branco não se lê.
    AMARELO:  { fundo: '#a16207', texto: '#ffffff' },
    CIANO:    { fundo: '#0891b2', texto: '#ffffff' },
  },
  dark: {
    VERDE:    { fundo: '#4ade80', texto: '#0b1f14' },
    AZUL:     { fundo: '#60a5fa', texto: '#0b1626' },
    ROXO:     { fundo: '#a78bfa', texto: '#160e26' },
    ROSA:     { fundo: '#f472b6', texto: '#26101b' },
    VERMELHO: { fundo: '#f87171', texto: '#260e0e' },
    LARANJA:  { fundo: '#fb923c', texto: '#26150a' },
    AMARELO:  { fundo: '#facc15', texto: '#231d05' },
    CIANO:    { fundo: '#22d3ee', texto: '#062026' },
  },
}

/**
 * A cor de um time que não escolheu nenhuma.
 *
 * Derivada do **nome**, e não sorteada: precisa ser a mesma em toda tela, em
 * toda sessão e em todo aparelho. Um `Math.random` daria a cada recarga um time
 * diferente, e a marca deixaria de marcar — que é a única coisa que ela existe
 * para fazer.
 *
 * É também o que cumpre "time criado antes desta mudança continua legível, sem
 * migração manual de ninguém": eles nascem com cor sem que ninguém escreva nada
 * no banco.
 *
 * A soma dos códigos dos caracteres basta. Não é hash criptográfico e não
 * precisa ser: o requisito é ser estável e espalhar razoavelmente entre oito.
 */
export function corDerivadaDoNome(nome: string): CorDeTime {
  let soma = 0
  for (let i = 0; i < nome.length; i++) soma = (soma + nome.charCodeAt(i) * (i + 1)) % 100000
  return CORES_DE_TIME[soma % CORES_DE_TIME.length]
}

/** A cor escolhida, ou a derivada do nome quando não há escolha. */
export function corDoTime(nome: string, cor?: CorDeTime | null): CorDeTime {
  return cor && CORES_DE_TIME.includes(cor) ? cor : corDerivadaDoNome(nome)
}

/**
 * As iniciais que vão dentro da marca.
 *
 * Até duas letras, das duas primeiras palavras **que contam**. Palavras de
 * ligação são descartadas porque aparecem em quase todo nome de time e não
 * distinguem nada: sem isso, "Time de Futsal do Bairro" viraria `TD`, e metade
 * dos times da lista começaria pela mesma letra.
 *
 * A consequência que surpreende, e que é a certa: **"Os Boleiros" vira `B`, e
 * não `OB`.** "Os" é artigo, e dois times chamados "Os ..." teriam a mesma
 * primeira letra — exatamente a colisão que a marca existe para evitar. Uma
 * letra só é marca legítima; letra errada não é.
 */
const LIGACOES = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'o', 'a', 'os', 'as'])

export function iniciaisDoTime(nome: string): string {
  const palavras = nome.trim().split(/\s+/).filter(Boolean)
  const relevantes = palavras.filter((p) => !LIGACOES.has(p.toLowerCase()))

  // Nome feito só de ligações ("Os Da Casa" já filtrado a zero) ainda precisa
  // de marca: nesse caso valem as palavras cruas.
  const base = relevantes.length > 0 ? relevantes : palavras

  return base.slice(0, 2).map((p) => [...p][0]?.toUpperCase() ?? '').join('') || '?'
}
