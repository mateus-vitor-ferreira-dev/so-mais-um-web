import { describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen } from '../test/render'
import DashboardLayout from './DashboardLayout'
import MainLayout from './MainLayout'

// Os layouts viraram rota-pai na #197: renderizam `<Outlet />` em vez de
// receber `children`. Por isso o teste monta uma rota aninhada em volta deles.

describe('seletor de tema dos layouts', () => {
  it('alterna o tema no painel administrativo', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout navItems={[]} tagline="Painel" accent="#3baa34" />}>
          <Route index element={<p>Conteúdo</p>} />
        </Route>
      </Routes>,
    )

    await user.click(screen.getByRole('button', { name: 'Modo escuro' }))

    expect(screen.getByRole('button', { name: 'Modo claro' })).toBeInTheDocument()
    expect(localStorage.getItem('só+1:theme')).toBe('dark')
  })

  // Até a #493 a área do jogador tinha dois seletores, um na barra lateral e
  // outro na barra do celular. Com o layout único, é um só, no mesmo lugar do
  // painel.
  it('alterna o tema na área do jogador, com um seletor só', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<p>Conteúdo</p>} />
        </Route>
      </Routes>,
    )

    await user.click(screen.getByRole('button', { name: 'Modo escuro' }))

    expect(screen.getAllByTitle('Modo claro')).toHaveLength(1)
    expect(localStorage.getItem('só+1:theme')).toBe('dark')
  })
})
