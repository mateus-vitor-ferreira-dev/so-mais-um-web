import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useEffect } from 'react'
import { Inbox } from 'lucide-react'
import { Link, Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen } from '../test/render'
import DashboardLayout, { tituloPadrao } from './DashboardLayout'
import MainLayout from './MainLayout'
import { PageActions, usePageHeader } from './DashboardLayout/pageHeader'

/**
 * Regressão da #197.
 *
 * O layout ficava dentro de cada página, então trocar de rota o desmontava e
 * remontava: sidebar sumia e voltava, e tudo que ele monta — inclusive a
 * conexão SSE do sino — era refeito. Medido em produção, isso disparava
 * `GET /notifications` e `GET /sports` em toda navegação.
 *
 * O contador abaixo é o detector: ele conta montagens do layout. Se alguém
 * voltar a aninhar o layout dentro das páginas, ele passa de 1 e o teste cai.
 */
const montagens = vi.fn()

function SondaDeMontagem() {
  useEffect(() => {
    montagens()
  }, [])
  return null
}

function PaginaJogador({ nome }: { nome: string }) {
  return (
    <div>
      <h2>{nome}</h2>
      <Link to="/outra">ir para Outra</Link>
      <Link to="/home">ir para Home</Link>
    </div>
  )
}

function PaginaPainel({ titulo }: { titulo: string }) {
  usePageHeader(titulo, `sub de ${titulo}`)
  return <Link to="/painel/segunda">ir para Segunda</Link>
}

beforeEach(() => {
  montagens.mockClear()
})

describe('layout como rota-pai', () => {
  it('não remonta o MainLayout ao navegar entre páginas do jogador', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route
          element={
            <>
              <SondaDeMontagem />
              <MainLayout />
            </>
          }
        >
          <Route path="/home"  element={<PaginaJogador nome="Home" />} />
          <Route path="/outra" element={<PaginaJogador nome="Outra" />} />
        </Route>
      </Routes>,
      { route: '/home' },
    )

    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(montagens).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('link', { name: 'ir para Outra' }))
    expect(await screen.findByRole('heading', { name: 'Outra' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'ir para Home' }))
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument()

    // Duas navegações depois, o layout continua sendo a mesma instância.
    expect(montagens).toHaveBeenCalledTimes(1)
  })

  it('não remonta o DashboardLayout e troca o título ao navegar', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route
          path="/painel"
          element={
            <>
              <SondaDeMontagem />
              <DashboardLayout navItems={[]} tagline="Painel" accent="primary" />
            </>
          }
        >
          <Route index            element={<PaginaPainel titulo="Primeira" />} />
          <Route path="segunda"   element={<PaginaPainel titulo="Segunda"  />} />
        </Route>
      </Routes>,
      { route: '/painel' },
    )

    expect(await screen.findByText('Primeira')).toBeInTheDocument()
    expect(screen.getByText('sub de Primeira')).toBeInTheDocument()
    expect(montagens).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('link', { name: 'ir para Segunda' }))

    expect(await screen.findByText('Segunda')).toBeInTheDocument()
    expect(screen.queryByText('Primeira')).not.toBeInTheDocument()
    expect(montagens).toHaveBeenCalledTimes(1)
  })
})

describe('publicação da página na topbar', () => {
  it('renderiza as ações da página dentro da topbar do layout', async () => {
    function ComAcoes() {
      usePageHeader('Com ações')
      return (
        <>
          <PageActions><button type="button">Nova Quadra</button></PageActions>
          <p>corpo</p>
        </>
      )
    }

    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout navItems={[]} tagline="Painel" accent="primary" />}>
          <Route index element={<ComAcoes />} />
        </Route>
      </Routes>,
    )

    const botao = await screen.findByRole('button', { name: 'Nova Quadra' })
    // O portal precisa cair na topbar, ao lado do sino — não no corpo da página.
    expect(botao.closest('header')).not.toBeNull()
  })

  it('mostra no menu o contador que veio no item', async () => {
    // Desde a #356 o contador vem montado por quem constrói o menu, e não
    // publicado pela página de destino: era a publicação pela página que fazia
    // o número só existir depois de a pessoa já ter aberto a tela.
    const itens = [{ to: '/painel/pedidos', label: 'Pedidos', icon: Inbox, badge: 7 }]

    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout navItems={itens} tagline="Painel" accent="primary" />}>
          <Route index element={<p>corpo</p>} />
        </Route>
      </Routes>,
    )

    expect(await screen.findByText('7')).toBeInTheDocument()
  })
})

/**
 * O layout único (web#493): a área do jogador passou a usar a topbar do painel,
 * com o título publicado pela página.
 */
describe('a topbar na área do jogador', () => {
  function PaginaComTitulo() {
    usePageHeader('Título publicado', 'o subtítulo')
    return <Link to="/times/42">ir para um time</Link>
  }

  it('mostra o título que a página publica, e o do menu quando ela não publica nada', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/home"      element={<PaginaComTitulo />} />
          <Route path="/times/:id" element={<p>detalhe do time</p>} />
        </Route>
      </Routes>,
      { route: '/home' },
    )

    const topbar = () => screen.getByRole('heading', { level: 1 })
    expect(await screen.findByText('o subtítulo')).toBeInTheDocument()
    expect(topbar()).toHaveTextContent('Título publicado')

    await user.click(screen.getByRole('link', { name: 'ir para um time' }))

    // A página do time não publica título: fica o do item do menu, e nem o
    // título nem o subtítulo da página anterior sobram na topbar.
    expect(await screen.findByText('detalhe do time')).toBeInTheDocument()
    expect(topbar()).toHaveTextContent('Meus Times')
    expect(screen.queryByText('o subtítulo')).not.toBeInTheDocument()
  })

  it('o título padrão é o do item com o prefixo mais longo', () => {
    const itens = [
      { to: '/owner', label: 'Painel', icon: Inbox },
      { to: '/owner/places', label: 'Estabelecimentos', icon: Inbox },
    ]

    expect(tituloPadrao(itens, '/owner/places/1/courts')).toBe('Estabelecimentos')
    expect(tituloPadrao(itens, '/owner/plans')).toBe('Painel')
    // Prefixo de texto não é prefixo de rota: /owner-x não é filha de /owner.
    expect(tituloPadrao(itens, '/owner-x')).toBe('')
  })
})
