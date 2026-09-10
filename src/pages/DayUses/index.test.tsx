import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSearchParams } from 'react-router-dom'
import { renderWithProviders, screen } from '../../test/render'
import DayUses from './index'
import type { FiltrosDeDayUse } from '../../types/api'

const auth = vi.hoisted(() => ({ user: { address: { city: 'Lavras' } as { city: string | null } } }))

const localizacao = vi.hoisted(() => ({
  atual: {
    origem: null as { latitude: number; longitude: number; fonte: string } | null,
    estado: 'sem-origem' as string,
    pedindo: false,
    podePedir: true,
    pedirLocalizacao: vi.fn(),
  },
}))

vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => auth,
}))
vi.mock('../../hooks/useSports', () => ({
  useSports: () => ({ sports: [{ id: 'BEACH_TENNIS', label: 'Beach tennis' }] }),
}))
vi.mock('../../hooks/useOrigemDeLocalizacao', () => ({
  useOrigemDeLocalizacao: () => localizacao.atual,
}))
// O convite tem teste próprio; aqui só interessa que ele é chamado.
vi.mock('../../components/ConviteDeLocalizacao', () => ({
  default: ({ contexto }: { contexto: string }) => <div data-testid="convite">{contexto}</div>,
}))

/** A lista devolve os filtros que recebeu, para as asserções olharem o que foi pedido. */
vi.mock('../../components/DayUsesDoDia', () => ({
  default: ({ filtros, vazio }: { filtros?: FiltrosDeDayUse; vazio?: React.ReactNode }) => (
    <div>
      <div data-testid="filtros">{JSON.stringify(filtros)}</div>
      <div data-testid="vazio">{vazio}</div>
    </div>
  ),
}))

const filtrosPedidos = (): FiltrosDeDayUse => JSON.parse(screen.getByTestId('filtros').textContent!)

/**
 * A query string de dentro do router.
 *
 * O helper monta um `MemoryRouter`, então `window.location` nunca muda — uma
 * asserção contra ele passaria por estar sempre vazio, que é o pior tipo de
 * teste verde.
 */
function SondaDaUrl() {
  const [params] = useSearchParams()
  return <div data-testid="url">{params.toString()}</div>
}

const urlAtual = () => screen.getByTestId('url').textContent

const renderizar = (route = '/day-uses') =>
  renderWithProviders(
    <>
      <DayUses />
      <SondaDaUrl />
    </>,
    { route },
  )

describe('DayUses', () => {
  beforeEach(() => {
    auth.user = { address: { city: 'Lavras' } }
    localizacao.atual = {
      origem: null,
      estado: 'sem-origem',
      pedindo: false,
      podePedir: true,
      pedirLocalizacao: vi.fn(),
    }
  })

  describe('abre mostrando, e o filtro é refinamento', () => {
    it('pergunta a lista inteira, sem filtro nenhum', () => {
      // O defeito que abriu o épico: a tela exigia cidade ou modalidade antes
      // de consultar, e ficava vazia com day uses acontecendo.
      renderWithProviders(<DayUses />)

      expect(filtrosPedidos()).toEqual({})
      expect(screen.queryByText(/Informe uma cidade ou modalidade/)).not.toBeInTheDocument()
    })

    it('não promete "hoje" no título, porque a lista não corta em hoje', () => {
      renderWithProviders(<DayUses />)

      expect(screen.getByRole('heading', { name: 'Day uses' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /de hoje/i })).not.toBeInTheDocument()
    })

    it('nem a cidade do perfil entra sozinha — ela é só a sugestão do campo', () => {
      renderWithProviders(<DayUses />)

      expect(filtrosPedidos().city).toBeUndefined()
      expect(screen.getByLabelText('Cidade')).toHaveAttribute('placeholder', 'Ex.: Lavras')
    })
  })

  describe('os quatro filtros', () => {
    it('modalidade', async () => {
      const { user } = renderWithProviders(<DayUses />)

      await user.selectOptions(screen.getByLabelText('Modalidade'), 'BEACH_TENNIS')

      expect(filtrosPedidos().courtType).toBe('BEACH_TENNIS')
    })

    it('quando vira faixa de horário, e "qualquer dia" não manda faixa', async () => {
      const { user } = renderWithProviders(<DayUses />)

      await user.selectOptions(screen.getByLabelText('Quando'), 'hoje')
      const comHoje = filtrosPedidos()
      expect(comHoje.from).toBeDefined()
      expect(comHoje.to).toBeDefined()

      await user.selectOptions(screen.getByLabelText('Quando'), 'qualquer')
      expect(filtrosPedidos().from).toBeUndefined()
    })

    it('preço vira precoMax numérico, e vazio não vira zero', async () => {
      const { user } = renderWithProviders(<DayUses />)

      await user.type(screen.getByLabelText('Preço até'), '30')
      expect(filtrosPedidos().precoMax).toBe(30)

      await user.clear(screen.getByLabelText('Preço até'))
      // Zero é "só o que for de graça" na api: campo vazio não pode virar isso.
      expect(filtrosPedidos().precoMax).toBeUndefined()
    })

    it('cidade', async () => {
      const { user } = renderWithProviders(<DayUses />)

      await user.type(screen.getByLabelText('Cidade'), 'Perdões')

      expect(filtrosPedidos().city).toBe('Perdões')
    })

    it('combinam entre si', async () => {
      const { user } = renderWithProviders(<DayUses />)

      await user.selectOptions(screen.getByLabelText('Modalidade'), 'BEACH_TENNIS')
      await user.type(screen.getByLabelText('Preço até'), '40')

      expect(filtrosPedidos()).toMatchObject({ courtType: 'BEACH_TENNIS', precoMax: 40 })
    })
  })

  describe('localização', () => {
    it('sem origem nenhuma, convida — e o "perto de mim" fica desabilitado', () => {
      renderWithProviders(<DayUses />)

      expect(screen.getByTestId('convite')).toHaveTextContent(/mais perto de você/i)
      expect(screen.getByRole('button', { name: /perto de mim/i })).toBeDisabled()
    })

    it('com origem, manda o trio e larga a cidade', async () => {
      localizacao.atual = { ...localizacao.atual, origem: { latitude: -21.2, longitude: -45, fonte: 'endereco' }, estado: 'pronto' }
      const { user } = renderWithProviders(<DayUses />)

      await user.type(screen.getByLabelText('Cidade'), 'Perdões')
      await user.click(screen.getByRole('button', { name: /perto de mim/i }))

      const filtros = filtrosPedidos()
      expect(filtros).toMatchObject({ latitude: -21.2, longitude: -45, radiusKm: 25 })
      // Cidade E raio juntos é E na api: daria lista vazia sem a tela saber por quê.
      expect(filtros.city).toBeUndefined()
    })

    it('o raio é escolhido, e troca a busca', async () => {
      localizacao.atual = { ...localizacao.atual, origem: { latitude: -21.2, longitude: -45, fonte: 'navegador' }, estado: 'pronto' }
      const { user } = renderWithProviders(<DayUses />)

      await user.click(screen.getByRole('button', { name: /perto de mim/i }))
      await user.selectOptions(screen.getByLabelText('Raio da busca'), '50')

      expect(filtrosPedidos().radiusKm).toBe(50)
    })

    it('recusar a localização NÃO esvazia a tela — era o defeito que abriu o épico', () => {
      localizacao.atual = { ...localizacao.atual, origem: null, estado: 'negado', podePedir: false }
      renderWithProviders(<DayUses />)

      // Segue perguntando tudo, sem raio.
      expect(filtrosPedidos()).toEqual({})
      expect(screen.getByTestId('filtros')).toBeInTheDocument()
    })

    it('"perto de mim" não viaja na URL', async () => {
      // Link compartilhado mediria a partir de outro ponto, ou de nenhum.
      localizacao.atual = { ...localizacao.atual, origem: { latitude: -21.2, longitude: -45, fonte: 'endereco' }, estado: 'pronto' }
      const { user } = renderizar('/day-uses?city=Perdões')

      await user.click(screen.getByRole('button', { name: /perto de mim/i }))

      // A URL guarda a cidade e nada mais: a distância até você não viaja.
      expect(urlAtual()).toBe('city=Perd%C3%B5es')
      expect(filtrosPedidos().radiusKm).toBe(25)
    })
  })

  describe('a busca mora na URL', () => {
    it('chegar com filtros na URL já aplica — é o que faz o atalho do Quero Jogar levar a algum lugar', () => {
      renderizar('/day-uses?city=Perdões&courtType=BEACH_TENNIS&precoMax=25&quando=amanha')

      const filtros = filtrosPedidos()
      expect(filtros).toMatchObject({ city: 'Perdões', courtType: 'BEACH_TENNIS', precoMax: 25 })
      expect(filtros.from).toBeDefined()
    })

    it('faixa inválida na URL não quebra a tela: cai em qualquer dia', () => {
      renderizar('/day-uses?quando=ontem')

      expect(filtrosPedidos().from).toBeUndefined()
    })

    it('filtrar muda a URL, e limpar devolve tudo', async () => {
      const { user } = renderizar()

      await user.selectOptions(screen.getByLabelText('Modalidade'), 'BEACH_TENNIS')
      expect(urlAtual()).toContain('courtType=BEACH_TENNIS')

      await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
      expect(urlAtual()).toBe('')
      expect(filtrosPedidos()).toEqual({})
    })

    it('sem filtro nenhum não oferece limpar', () => {
      renderWithProviders(<DayUses />)

      expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()
    })
  })

  describe('o vazio diz o que afrouxar', () => {
    it('com filtro, aponta o filtro — e não pede para informar uma cidade', async () => {
      const { user } = renderWithProviders(<DayUses />)

      await user.type(screen.getByLabelText('Preço até'), '5')

      const vazio = screen.getByTestId('vazio')
      expect(vazio).toHaveTextContent(/Nenhum day use com esses filtros/)
      expect(vazio).toHaveTextContent(/outra cidade/)
    })

    it('sem filtro, o vazio é sobre o produto, e não sobre a busca', () => {
      renderWithProviders(<DayUses />)

      expect(screen.getByTestId('vazio')).toHaveTextContent(/Nenhum day use acontecendo agora/)
    })
  })
})
