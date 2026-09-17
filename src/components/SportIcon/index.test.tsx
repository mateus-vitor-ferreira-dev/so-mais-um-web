import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SportIcon from '.'
import { DESENHOS } from './desenhos'
import { getSportMeta } from '../../hooks/useSports'
import type { CourtType } from '../../types/api'
import { sportTextLabel } from '../../utils/sportText'

describe('SportIcon', () => {
  it('toda modalidade que o app conhece tem desenho próprio (#511)', () => {
    const tipos: CourtType[] = ['SOCIETY', 'CAMPO', 'FUTSAL', 'AREIA', 'VOLEI', 'VOLEI_AREIA', 'HANDBALL', 'PETECA', 'BEACH_TENNIS', 'BASQUETE', 'TENIS', 'POKER']
    const semDesenho = tipos.map((t) => getSportMeta(t).icon).filter((icon) => !DESENHOS[icon])
    expect(semDesenho).toEqual([])
  })

  it.each(['society', 'tenis', 'poker', 'futevolei'])('desenha %s em SVG, e não em emoji', (icon) => {
    const { container } = render(<SportIcon icon={icon} fallback="🎾" />)
    expect(container.querySelector(`svg[data-modalidade="${icon}"]`)).toBeTruthy()
    expect(container).not.toHaveTextContent('🎾')
  })

  it('o grupo futebol usa a bola do society, e o "todos" é a grade', () => {
    const { container } = render(<><SportIcon icon="futebol" /><SportIcon icon="todos" /></>)
    expect(container.querySelector('svg[data-modalidade="futebol"]')).toBeTruthy()
    expect(container.querySelector('svg[data-modalidade="todos"]')).toBeTruthy()
  })

  it('modalidade nova, sem desenho ainda, vira bola neutra e não some', () => {
    const { container } = render(<SportIcon icon="modalidade-nova" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('com título, é uma imagem com nome para o leitor de tela', () => {
    render(<SportIcon icon="tenis" title="Tênis" />)
    expect(screen.getByRole('img', { name: 'Tênis' })).toBeInTheDocument()
  })

  it('o emoji continua no texto, onde só cabe texto', () => {
    expect(sportTextLabel({ label: 'Tênis', iconFallback: '🥎' })).toContain('🥎')
    expect(sportTextLabel({ label: 'Peteca', iconFallback: null })).toBe('Peteca')
  })
})
