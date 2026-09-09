/**
 * O day use na busca do jogador (web#420, api#519).
 *
 * ## O que estes testes carregam
 *
 * O principal é uma **promessa que a tela não pode fazer**. "3 de 16" se lê
 * como *ainda tem vaga para mim*, e quem registra a entrada é o dono, na porta.
 * Sem o aviso e sem botão, a seção informa; com um botão de entrar, ela
 * prometeria reserva — que o épico api#505 pôs fora de escopo por escrito.
 *
 * Os outros três são coisas que a tela erraria sozinha e ninguém veria:
 *
 * 1. **`lotado` vem da api** e não se recalcula: `pessoasDentro >= maxPessoas`
 *    com `maxPessoas` nulo compara com zero e diz lotado para todo day use sem
 *    teto — que é o caso mais comum;
 * 2. **lotado aparece**, e não some;
 * 3. **preço único não vira duas faixas iguais**.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import { dayUsesService } from '../../services/dayUses'
import DayUsesDoDia from './index'
import type { BuscaDeDayUse, DayUsePublico } from '../../types/api'

vi.mock('../../services/dayUses')
const servico = vi.mocked(dayUsesService)

function dayUse(over: Partial<DayUsePublico> = {}): DayUsePublico {
  return {
    id: 'd1',
    inicio: '2026-09-11T11:00:00.000Z',
    fim: '2026-09-12T01:00:00.000Z',
    precoGeral: '20',
    precoAluno: '12',
    maxPessoas: null,
    pessoasDentro: 0,
    lotado: false,
    court: {
      id: 'q1',
      name: 'Quadra 1',
      type: 'BEACH_TENNIS',
      place: { id: 'p1', name: 'Arena Sul', city: 'Lavras', neighborhood: 'Centro' },
    },
    ...over,
  }
}

const resposta = (dayUses: DayUsePublico[]): BuscaDeDayUse => ({
  dayUses,
  total: dayUses.length,
  page: 1,
  hasMore: false,
})

beforeEach(() => {
  vi.clearAllMocks()
  servico.buscar.mockResolvedValue(resposta([dayUse()]))
})

describe('DayUsesDoDia', () => {
  it('mostra quadra, espaço, horário e preço', async () => {
    renderWithProviders(<DayUsesDoDia />)

    expect(await screen.findByText('Quadra 1')).toBeInTheDocument()
    expect(screen.getByText(/Arena Sul/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*20,00/)).toBeInTheDocument()
    expect(screen.getByText(/alunos.*R\$\s*12,00/)).toBeInTheDocument()
  })

  describe('a tela informa, e não promete reserva', () => {
    it('diz que se paga no local e que não há reserva', async () => {
      renderWithProviders(<DayUsesDoDia />)

      expect(await screen.findByText(/pague no local/)).toBeInTheDocument()
      expect(screen.getByText(/não há reserva/)).toBeInTheDocument()
    })

    it('NÃO oferece botão de entrar', async () => {
      renderWithProviders(<DayUsesDoDia />)
      await screen.findByText('Quadra 1')

      // Quem registra a entrada é o dono, na porta. Um botão aqui prometeria
      // vaga garantida — que o épico api#505 pôs fora de escopo por escrito.
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByText(/entrar/i)).not.toBeInTheDocument()
    })
  })

  describe('lotado', () => {
    it('aparece marcado, e não some da lista', async () => {
      servico.buscar.mockResolvedValue(
        resposta([dayUse({ lotado: true, maxPessoas: 16, pessoasDentro: 16 })]),
      )
      renderWithProviders(<DayUsesDoDia />)

      expect(await screen.findByText('Lotado')).toBeInTheDocument()
      expect(screen.getByText('Quadra 1')).toBeInTheDocument()
    })

    it('sem teto, mostra só quantas pessoas — e não inventa lotação', async () => {
      // Se a tela recalculasse `pessoasDentro >= maxPessoas` com nulo, este
      // caso — o mais comum — apareceria como lotado.
      servico.buscar.mockResolvedValue(
        resposta([dayUse({ maxPessoas: null, pessoasDentro: 4, lotado: false })]),
      )
      renderWithProviders(<DayUsesDoDia />)

      expect(await screen.findByText(/4 pessoas/)).toBeInTheDocument()
      expect(screen.queryByText('Lotado')).not.toBeInTheDocument()
    })

    it('com teto e vaga, mostra o par', async () => {
      servico.buscar.mockResolvedValue(
        resposta([dayUse({ maxPessoas: 16, pessoasDentro: 3, lotado: false })]),
      )
      renderWithProviders(<DayUsesDoDia />)

      expect(await screen.findByText(/3 de 16/)).toBeInTheDocument()
    })
  })

  it('preço único não vira duas faixas iguais', async () => {
    servico.buscar.mockResolvedValue(resposta([dayUse({ precoAluno: null })]))
    renderWithProviders(<DayUsesDoDia />)

    expect(await screen.findByText(/R\$\s*20,00/)).toBeInTheDocument()
    expect(screen.queryByText(/alunos/)).not.toBeInTheDocument()
  })

  describe('some quando não tem o que mostrar', () => {
    it('sem day use, não renderiza nem o título', async () => {
      servico.buscar.mockResolvedValue(resposta([]))
      const { container } = renderWithProviders(<DayUsesDoDia />)

      // Um "nenhum day use encontrado" no meio da busca de partida pareceria
      // que a busca falhou.
      expect(screen.queryByText('Day use')).not.toBeInTheDocument()
      expect(container.querySelector('section')).toBeNull()
    })

    it('falha da api não derruba a busca de partida', async () => {
      servico.buscar.mockRejectedValue(new Error('rede'))
      renderWithProviders(<DayUsesDoDia />)

      // Esta seção é um extra. O `useQuery` isola o erro, o `data` fica
      // indefinido, e a seção simplesmente não aparece.
      expect(screen.queryByText('Day use')).not.toBeInTheDocument()
    })
  })

  it('repassa os filtros da tela para a api', async () => {
    renderWithProviders(<DayUsesDoDia city="Lavras" courtType="BEACH_TENNIS" />)

    await screen.findByText('Quadra 1')
    expect(servico.buscar).toHaveBeenCalledWith({ city: 'Lavras', courtType: 'BEACH_TENNIS' })
  })

  it('filtro vazio não vira string vazia na query', async () => {
    renderWithProviders(<DayUsesDoDia city="" courtType="" />)

    await screen.findByText('Quadra 1')
    expect(servico.buscar).toHaveBeenCalledWith({ city: undefined, courtType: undefined })
  })

  it('na busca de partidas deixa só o atalho de descoberta', async () => {
    renderWithProviders(<DayUsesDoDia city="Lavras" modo="atalho" />)

    const atalho = await screen.findByRole('link', { name: /1 day use acontecendo hoje perto de você/i })
    expect(atalho).toHaveAttribute('href', '/day-uses?city=Lavras')
    expect(screen.queryByRole('heading', { name: 'Day use' })).not.toBeInTheDocument()
  })

  it('sem day use não deixa atalho morto na busca', async () => {
    servico.buscar.mockResolvedValue(resposta([]))
    renderWithProviders(<DayUsesDoDia modo="atalho" />)

    expect(screen.queryByRole('link', { name: /ver day uses/i })).not.toBeInTheDocument()
  })
})
