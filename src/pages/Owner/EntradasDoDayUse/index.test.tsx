/**
 * Quem está no day use, na tela do dono (web#415, api#505).
 *
 * ## O que estes testes carregam
 *
 * O principal é uma **ausência**, e ausência não se testa por acaso: a tela
 * mostra o `valor` que a api congelou na entrada, e **não** o preço atual do
 * day use.
 *
 * A api garante que subir o preço não muda quem já entrou. Exibir o preço de
 * hoje ao lado do valor pago desfaria essa garantia visualmente — o dono veria
 * dois números e concluiria que um está errado. O teste do preço congelado é o
 * que impede alguém de "melhorar" a tela nessa direção.
 *
 * Os outros dois:
 *
 * - **nome e contato bastam** — day use é o formato de quem chega para jogar, e
 *   um cadastro na porta perde essa pessoa;
 * - **remover apaga**, ao contrário da matrícula, e quem esteve sem pagar se
 *   registra com "Em aberto" — não sumindo da lista.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders } from '../../../test/render'
import { dayUsesService } from '../../../services/dayUses'
import OwnerEntradasDoDayUse from './index'
import type { EntradaNoDayUse, EntradasDoDayUse } from '../../../types/api'

vi.mock('../../../services/dayUses')
const servico = vi.mocked(dayUsesService)

function entrada(over: Partial<EntradaNoDayUse> = {}): EntradaNoDayUse {
  return {
    id: 'e1',
    nome: 'João da Esquina',
    contato: '35 99999-0000',
    userId: null,
    faixa: 'GERAL',
    valor: '20',
    pagoEm: null,
    entrouEm: '2026-09-11T12:00:00.000Z',
    user: null,
    ...over,
  }
}

const lista = (entradas: EntradaNoDayUse[], resumo?: EntradasDoDayUse['resumo']): EntradasDoDayUse => ({
  entradas,
  resumo: resumo ?? {
    pessoas: entradas.length,
    recebido: entradas.filter((e) => e.pagoEm).reduce((t, e) => t + Number(e.valor), 0),
    emAberto: entradas.filter((e) => !e.pagoEm).reduce((t, e) => t + Number(e.valor), 0),
  },
})

const monta = (query = '?placeId=ltc') =>
  renderWithProviders(<OwnerEntradasDoDayUse />, {
    route: `/owner/day-uses/d1/entradas${query}`,
    path: '/owner/day-uses/:dayUseId/entradas',
  })

beforeEach(() => {
  vi.clearAllMocks()
  servico.entradas.mockResolvedValue(lista([]))
  servico.registrarEntrada.mockResolvedValue(entrada())
  servico.atualizarEntrada.mockResolvedValue(entrada({ pagoEm: '2026-09-11T13:00:00.000Z' }))
  servico.removerEntrada.mockResolvedValue(undefined)
})

describe('OwnerEntradasDoDayUse', () => {
  /**
   * O bloco de resumo de um rótulo.
   *
   * Ancorado no `<dt>`, e não em `getByText`: "Em aberto" é rótulo aqui **e**
   * texto do botão de pagamento em cada linha, e os valores em reais se
   * repetem entre o resumo e as linhas.
   */
  const resumoDe = (rotulo: string) => {
    const dt = screen.getAllByText(rotulo).find((el) => el.tagName === 'DT')
    expect(dt).toBeDefined()
    return dt!.closest('div') as HTMLElement
  }

  it('mostra o resumo do dinheiro que a api calculou', async () => {
    // Valores diferentes de propósito: com 20 e 20, "recebido" e "em aberto"
    // ficariam indistinguíveis e o teste passaria sem provar nada.
    servico.entradas.mockResolvedValue(
      lista([entrada(), entrada({ id: 'e2', nome: 'Ana', valor: '35', pagoEm: '2026-09-11T13:00:00.000Z' })]),
    )
    monta()

    expect(await screen.findByText('Pessoas')).toBeInTheDocument()
    expect(within(resumoDe('Pessoas')).getByText('2')).toBeInTheDocument()
    expect(within(resumoDe('Recebido')).getByText(/R\$\s*35,00/)).toBeInTheDocument()
    expect(within(resumoDe('Em aberto')).getByText(/R\$\s*20,00/)).toBeInTheDocument()
  })

  it('mostra o valor CONGELADO, e não o preço de hoje', async () => {
    // A pessoa entrou pagando 12 como aluna. Se a tela buscasse o preço atual
    // do day use, mostraria outro número — e é isso que não pode acontecer.
    servico.entradas.mockResolvedValue(lista([entrada({ faixa: 'ALUNO', valor: '12' })]))
    monta()

    const linha = (await screen.findByText('João da Esquina')).closest('li') as HTMLElement
    expect(within(linha).getByText('Aluno')).toBeInTheDocument()
    expect(within(linha).getByText(/R\$\s*12,00/)).toBeInTheDocument()

    // A tela não pede o day use: ela não tem de onde tirar um preço atual.
    expect(servico.listar).not.toHaveBeenCalled()
  })

  it('registra quem chegou com nome e contato, sem conta', async () => {
    const { user } = monta()
    await user.click(await screen.findByRole('button', { name: /Registrar entrada/ }))

    await user.type(screen.getByLabelText('Nome'), 'João da Esquina')
    await user.type(screen.getByLabelText('Contato'), '35 99999-0000')
    await user.click(screen.getByRole('button', { name: /^Registrar$/ }))

    await waitFor(() => expect(servico.registrarEntrada).toHaveBeenCalled())
    expect(servico.registrarEntrada.mock.calls[0][2]).toMatchObject({
      nome: 'João da Esquina',
      contato: '35 99999-0000',
      faixa: 'GERAL',
    })
  })

  it('o dono escolhe a faixa quando a pessoa não tem conta', async () => {
    const { user } = monta()
    await user.click(await screen.findByRole('button', { name: /Registrar entrada/ }))

    await user.type(screen.getByLabelText('Nome'), 'Ana')
    await user.type(screen.getByLabelText('Contato'), 'ana@test.com')
    await user.selectOptions(screen.getByLabelText('Faixa'), 'ALUNO')
    await user.click(screen.getByRole('button', { name: /^Registrar$/ }))

    await waitFor(() => expect(servico.registrarEntrada).toHaveBeenCalled())
    expect(servico.registrarEntrada.mock.calls[0][2]).toMatchObject({ faixa: 'ALUNO' })
  })

  it('marca e desmarca o pagamento pelo mesmo botão', async () => {
    servico.entradas.mockResolvedValue(lista([entrada()]))
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: 'Em aberto' }))
    await waitFor(() => expect(servico.atualizarEntrada).toHaveBeenCalled())
    expect(servico.atualizarEntrada.mock.calls[0][3]).toEqual({ pago: true })
  })

  it('quem já pagou desmarca de volta', async () => {
    servico.entradas.mockResolvedValue(lista([entrada({ pagoEm: '2026-09-11T13:00:00.000Z' })]))
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: 'Pago' }))
    await waitFor(() => expect(servico.atualizarEntrada).toHaveBeenCalled())
    expect(servico.atualizarEntrada.mock.calls[0][3]).toEqual({ pago: false })
  })

  it('remove a entrada lançada por engano', async () => {
    servico.entradas.mockResolvedValue(lista([entrada()]))
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: /Remover João da Esquina/ }))
    await waitFor(() => expect(servico.removerEntrada).toHaveBeenCalledWith('ltc', 'd1', 'e1'))
  })

  it('sem placeId na URL, explica em vez de chamar a api sem espaço', async () => {
    monta('')

    expect(await screen.findByText(/Faltou saber de qual espaço/)).toBeInTheDocument()
    expect(servico.entradas).not.toHaveBeenCalled()
  })

  it('ninguém dentro ainda diz isso, e não parece erro', async () => {
    monta()
    expect(await screen.findByText(/Ninguém entrou ainda/)).toBeInTheDocument()
  })
})
