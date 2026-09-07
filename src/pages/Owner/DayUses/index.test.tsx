/**
 * O day use do espaço, na tela do dono (web#415, api#505).
 *
 * ## O que estes testes carregam
 *
 * Quatro coisas que a tela pode errar sozinha, e que nenhum typecheck pega:
 *
 * 1. **`fim` vazio é "copie do expediente", não campo esquecido.** A tela
 *    pergunta a sugestão à api ao escolher o início e preenche o campo.
 * 2. **`null` na sugestão não é erro.** É o espaço sem expediente para aquele
 *    dia, e a criação **continua possível** — travar aqui prenderia o produto
 *    novo numa peça que a maior parte dos espaços ainda não tem (api#454).
 * 3. **`precoAluno` vazio é preço único**, e vai como `null` para a api. Um
 *    `Number('')` viraria `NaN` e reprovaria o caso mais comum.
 * 4. **Cancelar não apaga.** Some da lista, e o filtro traz de volta.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/render'
import { dayUsesService } from '../../../services/dayUses'
import * as placesService from '../../../services/places'
import * as courtsService from '../../../services/courts'
import { ownerNavItems } from '../../../constants/navItems'
import OwnerDayUses from './index'
import type { AxiosResponse } from 'axios'
import type { ApiEnvelope, Court, DayUse, Place } from '../../../types/api'

vi.mock('../../../services/dayUses')
vi.mock('../../../services/places')
vi.mock('../../../services/courts')

const servico = vi.mocked(dayUsesService)
const espacos = vi.mocked(placesService)
const quadras = vi.mocked(courtsService)

function dayUse(over: Partial<DayUse> = {}): DayUse {
  return {
    id: 'd1',
    courtId: 'q1',
    inicio: '2026-09-11T11:00:00.000Z',
    fim: '2026-09-12T01:00:00.000Z',
    precoGeral: '20',
    precoAluno: '12',
    maxPessoas: null,
    canceladoEm: null,
    court: { id: 'q1', name: 'Quadra 1', type: 'FUTSAL' },
    pessoasDentro: 0,
    ...over,
  }
}

const monta = (query = '?placeId=ltc') =>
  renderWithProviders(<OwnerDayUses />, { route: `/owner/day-uses${query}`, path: '/owner/day-uses' })

const auth = vi.hoisted(() => ({ estado: { user: { id: 'dono', role: 'OWNER' } } }))
vi.mock('../../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

beforeEach(() => {
  vi.clearAllMocks()
  espacos.list.mockResolvedValue({
    data: { success: true, data: [{ id: 'ltc', name: 'Lavras Tênis Clube', ownerId: 'dono' }] as Place[] },
  } as AxiosResponse<ApiEnvelope<Place[]>>)
  quadras.getCourtsByPlace.mockResolvedValue({
    success: true,
    data: [{ id: 'q1', name: 'Quadra 1' }] as Court[],
  } as ApiEnvelope<Court[]>)
  servico.listar.mockResolvedValue([])
  servico.sugestaoDeFim.mockResolvedValue('2026-09-12T01:00:00.000Z')
  servico.criar.mockResolvedValue(dayUse())
  servico.cancelar.mockResolvedValue(dayUse({ canceladoEm: new Date().toISOString() }))
})

describe('OwnerDayUses', () => {
  it('está no menu do owner, ao lado de Turmas e sem cadeado', () => {
    const itens = ownerNavItems('OWNER')
    const item = itens.find((i) => i.to === '/owner/day-uses')

    expect(item).toBeDefined()
    // A api deixou estas rotas fora do `requireActiveSubscription`; um cadeado
    // aqui mandaria o dono para a tela de planos por algo que ele já pode fazer.
    expect(item).not.toHaveProperty('funcionalidade')
  })

  it('lista os day uses com preço, ocupação e quadra', async () => {
    servico.listar.mockResolvedValue([dayUse({ pessoasDentro: 3, maxPessoas: 16 })])
    monta()

    expect(await screen.findByText('Quadra 1')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*20,00/)).toBeInTheDocument()
    expect(screen.getByText(/alunos.*R\$\s*12,00/)).toBeInTheDocument()
    expect(screen.getByText(/3 de 16 pessoas/)).toBeInTheDocument()
  })

  it('sem preço de aluno, a lista não inventa uma segunda faixa', async () => {
    servico.listar.mockResolvedValue([dayUse({ precoAluno: null })])
    monta()

    expect(await screen.findByText(/R\$\s*20,00/)).toBeInTheDocument()
    expect(screen.queryByText(/alunos/)).not.toBeInTheDocument()
  })

  describe('o fim vem do expediente, e a ausência dele não trava', () => {
    it('escolher o início preenche o fim com a sugestão da api', async () => {
      const { user } = monta()
      await user.click(await screen.findByRole('button', { name: /Novo day use/ }))

      const inicio = screen.getByLabelText('Começa')
      await user.type(inicio, '2026-09-11T08:00')
      await user.tab()

      await waitFor(() => expect(servico.sugestaoDeFim).toHaveBeenCalled())

      /**
       * Compara o INSTANTE, e não o texto do campo.
       *
       * `datetime-local` fala hora local, então o mesmo instante vira
       * `22:00` numa máquina em -03 e `01:00` numa em UTC. A primeira versão
       * deste teste esperava o texto e passava aqui e falhava no CI — que roda
       * em UTC. O que a tela promete não é um texto: é mostrar a hora que a api
       * sugeriu, seja qual for o relógio de quem olha.
       */
      await waitFor(() => {
        const campo = screen.getByLabelText('Termina') as HTMLInputElement
        expect(campo.value).not.toBe('')
        expect(new Date(campo.value).toISOString()).toBe('2026-09-12T01:00:00.000Z')
      })
    })

    it('sugestão nula avisa e deixa o dono digitar — não bloqueia', async () => {
      servico.sugestaoDeFim.mockResolvedValue(null)
      const { user } = monta()
      await user.click(await screen.findByRole('button', { name: /Novo day use/ }))

      await user.type(screen.getByLabelText('Começa'), '2026-09-11T08:00')
      await user.tab()

      expect(await screen.findByText(/não tem expediente cadastrado para esse dia/)).toBeInTheDocument()
      // O botão continua lá: a api aceita o fim no corpo, e recusar aqui
      // prenderia o produto novo numa peça recente que quase ninguém preencheu.
      expect(screen.getByRole('button', { name: /Criar day use/ })).toBeEnabled()
    })

    it('falha na sugestão não vira erro na tela', async () => {
      servico.sugestaoDeFim.mockRejectedValue(new Error('rede'))
      const { user } = monta()
      await user.click(await screen.findByRole('button', { name: /Novo day use/ }))

      await user.type(screen.getByLabelText('Começa'), '2026-09-11T08:00')
      await user.tab()

      await waitFor(() => expect(servico.sugestaoDeFim).toHaveBeenCalled())
      expect(screen.queryByText(/não tem expediente/)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Criar day use/ })).toBeEnabled()
    })
  })

  describe('preço único é o caso simples', () => {
    it('deixar o preço de aluno em branco manda null', async () => {
      const { user } = monta()
      await user.click(await screen.findByRole('button', { name: /Novo day use/ }))

      await user.selectOptions(screen.getByLabelText('Quadra'), 'q1')
      await user.type(screen.getByLabelText('Começa'), '2026-09-11T08:00')
      await user.clear(screen.getByLabelText('Preço'))
      await user.type(screen.getByLabelText('Preço'), '15')
      await user.click(screen.getByRole('button', { name: /Criar day use/ }))

      await waitFor(() => expect(servico.criar).toHaveBeenCalled())
      expect(servico.criar.mock.calls[0][1]).toMatchObject({ precoGeral: 15, precoAluno: null, maxPessoas: null })
    })

    it('com as duas faixas, manda as duas', async () => {
      const { user } = monta()
      await user.click(await screen.findByRole('button', { name: /Novo day use/ }))

      await user.selectOptions(screen.getByLabelText('Quadra'), 'q1')
      await user.type(screen.getByLabelText('Começa'), '2026-09-11T08:00')
      await user.clear(screen.getByLabelText('Preço'))
      await user.type(screen.getByLabelText('Preço'), '20')
      await user.type(screen.getByLabelText(/Preço para alunos/), '12')
      await user.type(screen.getByLabelText(/Máximo de pessoas/), '16')
      await user.click(screen.getByRole('button', { name: /Criar day use/ }))

      await waitFor(() => expect(servico.criar).toHaveBeenCalled())
      expect(servico.criar.mock.calls[0][1]).toMatchObject({ precoGeral: 20, precoAluno: 12, maxPessoas: 16 })
    })
  })

  describe('cancelar não apaga', () => {
    it('o cancelado só aparece com o filtro ligado', async () => {
      servico.listar.mockImplementation((_placeId, incluirCancelados) =>
        Promise.resolve(incluirCancelados ? [dayUse({ canceladoEm: '2026-09-08T10:00:00.000Z' })] : []),
      )
      const { user } = monta()

      expect(await screen.findByText(/Nenhum day use por aqui ainda/)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /Mostrar cancelados/ }))

      expect(await screen.findByText('Cancelado')).toBeInTheDocument()
    })

    it('o day use cancelado não oferece o botão de cancelar de novo', async () => {
      servico.listar.mockResolvedValue([dayUse({ canceladoEm: '2026-09-08T10:00:00.000Z' })])
      monta()

      await screen.findByText('Cancelado')
      expect(screen.queryByRole('button', { name: /^Cancelar$/ })).not.toBeInTheDocument()
    })
  })

  it('sem espaço cadastrado, manda cadastrar em vez de mostrar lista vazia', async () => {
    espacos.list.mockResolvedValue({
      data: { success: true, data: [] as Place[] },
    } as AxiosResponse<ApiEnvelope<Place[]>>)
    monta()

    expect(await screen.findByText(/ainda não tem um espaço cadastrado/)).toBeInTheDocument()
  })
})
