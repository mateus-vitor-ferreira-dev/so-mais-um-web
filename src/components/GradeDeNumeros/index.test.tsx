/**
 * A grade de números (web#511). O desenho em cada degrau é CSS, que o jsdom não
 * calcula; o que se prende aqui é que ela renderiza os cartões como filhos
 * diretos, que é do que a grade depende.
 */
import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import StatCard from '../StatCard'
import { GradeDeNumeros } from './index'

describe('GradeDeNumeros', () => {
  it('põe os cartões como filhos diretos da grade', () => {
    renderWithProviders(
      <GradeDeNumeros data-testid="grade">
        <StatCard label="Ativas" value={3} accent="green" />
        <StatCard label="Vencendo" value={1} accent="orange" />
      </GradeDeNumeros>,
    )

    const grade = screen.getByTestId('grade')
    expect(grade.children).toHaveLength(2)
    expect(screen.getByText('Ativas')).toBeInTheDocument()
  })
})
