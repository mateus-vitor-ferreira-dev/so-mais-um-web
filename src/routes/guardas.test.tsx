/**
 * Os guardas de rota quando não deu para verificar a sessão (web#346).
 *
 * O teste do `AuthContext` prova que a **marca** não some. Este prova o que a
 * pessoa vê — que era o defeito de verdade: o sintoma não é "erro ao carregar",
 * é **tela de login**, e quem a vê conclui que a sessão expirou e digita a
 * senha de novo.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { lightTheme } from '../styles/theme'
import { AuthProvider } from '../contexts/AuthContext'
import { AdminRoute, OwnerRoute, PrivateRoute } from './shells'
import { SESSION_HINT_KEY } from '../services/api'
import * as authService from '../services/auth'

vi.mock('../services/auth')
const getMe = vi.mocked(authService.getMe)

const erroComStatus = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), { response: { status } })

function monta(Guarda: typeof PrivateRoute) {
  return render(
    <ThemeProvider theme={lightTheme}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/privada']}>
          <Routes>
            <Route path="/privada" element={<Guarda><span>conteúdo privado</span></Guarda>} />
            <Route path="/login" element={<span>tela de login</span>} />
            <Route path="/home" element={<span>home</span>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  localStorage.setItem(SESSION_HINT_KEY, '1')
})

describe('guardas com a verificação falhando', () => {
  it.each([
    ['PrivateRoute', PrivateRoute],
    ['AdminRoute', AdminRoute],
    ['OwnerRoute', OwnerRoute],
  ])('%s mostra a falha, e NÃO manda ao login', async (_nome, Guarda) => {
    getMe.mockRejectedValue(erroComStatus(429))
    monta(Guarda as typeof PrivateRoute)

    expect(await screen.findByText(/Não deu para verificar sua sessão/)).toBeInTheDocument()
    expect(screen.queryByText('tela de login')).not.toBeInTheDocument()

    // A frase que muda o que a pessoa faz: sem ela, vai procurar a senha.
    expect(screen.getByText(/Sua sessão continua válida/)).toBeInTheDocument()
  })

  it('401 continua mandando ao login — a sessão realmente não vale', async () => {
    getMe.mockRejectedValue(erroComStatus(401))
    monta(PrivateRoute)

    expect(await screen.findByText('tela de login')).toBeInTheDocument()
    expect(screen.queryByText(/Não deu para verificar/)).not.toBeInTheDocument()
  })

  it('o botão tenta de novo, e o conteúdo aparece quando dá certo', async () => {
    getMe.mockRejectedValueOnce(erroComStatus(503))
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    monta(PrivateRoute)
    await screen.findByText(/Não deu para verificar sua sessão/)

    getMe.mockResolvedValue({ data: { id: 'u1', name: 'Ana' } } as never)
    await user.click(screen.getByRole('button', { name: /Tentar de novo/ }))

    await waitFor(() => expect(screen.getByText('conteúdo privado')).toBeInTheDocument())
  })

  it('o retry que leva 401 apaga a marca, em vez de prender na tela de erro', async () => {
    getMe.mockRejectedValueOnce(erroComStatus(503))
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    monta(PrivateRoute)
    await screen.findByText(/Não deu para verificar sua sessão/)

    // Um retry que só tentasse de novo deixaria a pessoa presa aqui com uma
    // sessão que de fato expirou.
    getMe.mockRejectedValue(erroComStatus(401))
    await user.click(screen.getByRole('button', { name: /Tentar de novo/ }))

    await waitFor(() => expect(screen.getByText('tela de login')).toBeInTheDocument())
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull()
  })
})
