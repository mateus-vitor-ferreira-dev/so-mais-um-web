import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Faixa, Trilho } from './styles'

interface Props {
  children: ReactNode
  /** O nome da faixa para o leitor de tela: "Previsão do tempo por hora". */
  rotulo: string
  className?: string
}

/**
 * O conteúdo que é mais largo que a tela **de propósito** (web#511): a previsão
 * hora a hora, a fileira de filtros, a chave do torneio.
 *
 * Antes, esse conteúdo vazava para fora do cartão, e o `Content` do painel
 * rolava de lado inteiro — com o título da página junto e sem nada dizendo que
 * havia mais à direita. Aqui a rolagem é só da faixa, e um esmaecido na borda
 * aparece enquanto houver mais para ver daquele lado.
 *
 * O esmaecido é decidido pela posição da rolagem, e não desenhado sempre: um
 * esmaecido fixo apagaria o último item mesmo com a faixa inteira à vista.
 */
export default function RolagemHorizontal({ children, rotulo, className }: Props) {
  const trilho = useRef<HTMLDivElement>(null)
  const [mais, setMais] = useState({ antes: false, depois: false })

  const medir = useCallback(() => {
    const el = trilho.current
    if (!el) return
    // 1px de folga: zoom e subpixel deixam o fim da rolagem a uma fração do máximo.
    const antes = el.scrollLeft > 1
    const depois = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    setMais((atual) => (atual.antes === antes && atual.depois === depois ? atual : { antes, depois }))
  }, [])

  useEffect(() => {
    const el = trilho.current
    if (!el) return
    medir()
    // O conteúdo muda de largura quando os dados chegam, e a tela quando gira.
    const observador = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(medir)
    observador?.observe(el)
    if (el.firstElementChild) observador?.observe(el.firstElementChild)
    return () => observador?.disconnect()
  }, [medir])

  return (
    <Faixa className={className} $antes={mais.antes} $depois={mais.depois}>
      <Trilho ref={trilho} onScroll={medir} role="region" aria-label={rotulo} tabIndex={0}>
        {children}
      </Trilho>
    </Faixa>
  )
}
