import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { renderWithProviders, screen } from '../../test/render'
import SportSelect from './index'
import type { CourtType } from '../../types/api'
import type { SportOption } from '../../hooks/useSports'

const ESPORTES = [
  { id: 'SOCIETY', label: 'Society', icon: 'society', iconFallback: null },
  { id: 'FUTSAL', label: 'Futsal', icon: 'futsal', iconFallback: null },
] as unknown as SportOption[]

function Controlado({ aoMudar }: { aoMudar: (ids: CourtType[]) => void }) {
  const [valor, setValor] = useState<CourtType[]>([])
  return (
    <SportSelect
      sports={ESPORTES}
      value={valor}
      onChange={(ids) => { setValor(ids); aoMudar(ids) }}
    />
  )
}

describe('<SportSelect />', () => {
  it('o teclado abre a lista, marca uma opção e fecha com Esc (#511)', async () => {
    const aoMudar = vi.fn()
    const { user } = renderWithProviders(<Controlado aoMudar={aoMudar} />)

    const gatilho = screen.getByRole('button', { name: /selecione as modalidades/i })
    expect(gatilho).toHaveAttribute('aria-expanded', 'false')

    gatilho.focus()
    await user.keyboard('{Enter}')
    expect(gatilho).toHaveAttribute('aria-expanded', 'true')

    await user.tab()
    expect(screen.getByRole('button', { name: /society/i })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(aoMudar).toHaveBeenLastCalledWith(['SOCIETY'])
    expect(screen.getByRole('button', { name: /society/i, pressed: true })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: /futsal/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { expanded: false })).toHaveFocus()
  })
})
