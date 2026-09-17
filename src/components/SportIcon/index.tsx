import { useId } from 'react'
import { LayoutGrid } from 'lucide-react'
import { DESENHOS, GENERICO, type Id } from './desenhos'

interface SportIconProps {
  icon: string
  /**
   * O emoji que a api serve. Não é mais desenhado aqui (#511): fica no dado para
   * onde só cabe texto, como o `<option>` (ver `sportTextLabel`).
   */
  fallback?: string | null
  title?: string
}

/**
 * Os `icon` que não são uma modalidade: o grupo "futebol" tem a bola do society,
 * e o "todos" das abas do Início é a grade, e não uma bola a mais.
 */
const APELIDOS: Record<string, string> = {
  futebol: 'society',
}

/**
 * O desenho da modalidade, do tamanho do texto em volta (`1em`).
 *
 * Todas as modalidades têm desenho próprio desde a #511 (ver `desenhos.tsx`). O
 * `icon` que a api passar a servir antes de ganhar desenho vira uma bola neutra,
 * e não um buraco no cartão.
 */
export default function SportIcon({ icon, title }: SportIconProps) {
  // O `useId` do React traz caracteres que não valem dentro de `url(#…)`, e dois
  // gradientes com o mesmo id na tela fazem o segundo desenho herdar o primeiro.
  const base = `modalidade-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  const desenho = icon === 'todos'
    ? <LayoutGrid width="1em" height="1em" aria-hidden="true" focusable="false" data-modalidade="todos" />
    : (() => {
        const d = DESENHOS[APELIDOS[icon] ?? icon] ?? GENERICO
        const id: Id = (nome) => `${base}-${nome}`
        return (
          <svg viewBox={d.viewBox} width="1em" height="1em" aria-hidden="true" focusable="false" data-modalidade={icon}>
            {d.conteudo(id)}
          </svg>
        )
      })()

  return title ? <span role="img" title={title} aria-label={title}>{desenho}</span> : desenho
}
