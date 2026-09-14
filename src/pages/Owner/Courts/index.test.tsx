/**
 * Assinatura inativa na tela de Quadras.
 *
 * Além de ser uma das quatro que escondiam tudo, esta tinha um detalhe próprio:
 * o **"+ Nova Quadra" mora fora do portão**. Com a assinatura vencida, o
 * conteúdo abaixo era apagado e o botão continuava clicável — abrindo um modal
 * dentro da parte apagada.
 *
 * A regra que vale aqui é a do servidor: leitura livre, escrita exigindo
 * assinatura. Estes casos travam as duas metades disso.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderWithProviders, screen, within } from '../../../test/render'
import { erroDaApi } from '../../../test/factories'
import OwnerCourts from './index'

const assinatura = vi.hoisted(() => ({ isActive: true, loading: false }))

vi.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ user: { id: 'owner-1', name: 'Dono', role: 'OWNER' } }),
}))
// `importOriginal` porque o SubscriptionGate importa `diasDeToleranciaRestantes`
// deste mesmo módulo.
vi.mock('../../../hooks/useSubscription', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../hooks/useSubscription')>()),
  useSubscription: () => ({
    sub: null,
    ...assinatura,
    podeAlterar: assinatura.isActive && !assinatura.loading,
  }),
}))
vi.mock('../../../components/DashboardLayout/pageHeader', () => ({
  usePageHeader: () => {},
  PageActions: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('../../../services/places')
vi.mock('../../../services/courts')

import * as placesService from '../../../services/places'
import * as courtsService from '../../../services/courts'

const quadra = {
  id: 'court-1',
  placeId: 'place-1',
  name: 'Quadra Coberta',
  type: 'FUTSAL',
  status: 'OPEN',
}

function renderiza() {
  return renderWithProviders(<OwnerCourts />, {
    route: '/owner/places/place-1/courts',
    path: '/owner/places/:placeId/courts',
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  assinatura.isActive = true
  assinatura.loading = false
  vi.mocked(placesService.getOne).mockResolvedValue({ data: { data: { id: 'place-1', name: 'Arena Um' } } } as never)
  vi.mocked(courtsService.getCourtsByPlace).mockResolvedValue({ data: [quadra] } as never)
})

describe('OwnerCourts — assinatura inativa', () => {
  it('mantém a quadra à vista e desabilita as ações que gravam', async () => {
    assinatura.isActive = false

    renderiza()

    expect(await screen.findByText('Quadra Coberta')).toBeInTheDocument()
    expect(screen.getByText(/pode consultar, mas precisa de uma assinatura ativa/i)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeDisabled()
  })

  it('desabilita o "+ Nova Quadra", que fica fora do portão', async () => {
    assinatura.isActive = false

    renderiza()

    await screen.findByText('Quadra Coberta')
    expect(screen.getByRole('button', { name: '+ Nova Quadra' })).toBeDisabled()
  })

  it('com assinatura em dia, nada é avisado nem desabilitado', async () => {
    renderiza()

    expect(await screen.findByText('Quadra Coberta')).toBeInTheDocument()
    expect(screen.queryByText(/pode consultar, mas precisa/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Nova Quadra' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeEnabled()
  })

  it('enquanto o status não chegou, ninguém grava', async () => {
    // A proteção da #119 precisa valer aqui também.
    assinatura.loading = true

    renderiza()

    expect(await screen.findByText('Verificando assinatura…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Nova Quadra' })).toBeDisabled()
  })
})

/**
 * A quadra diz se é coberta (web#477, api#581).
 *
 * `null` é "não informado", e a api o trata como descoberta: previsão e aviso de
 * chuva. Por isso o formulário tem três estados, e a quadra que já existia não
 * pode virar "descoberta" só por ter sido aberta e salva.
 */
describe('OwnerCourts — quadra coberta', () => {
  it('a quadra nova exige a escolha, e grava a que foi feita', async () => {
    vi.mocked(courtsService.createCourt).mockResolvedValue({ success: true, data: quadra } as never)
    const { user } = renderiza()
    await screen.findByText('Quadra Coberta')

    await user.click(screen.getByRole('button', { name: '+ Nova Quadra' }))
    await user.type(screen.getByPlaceholderText('Ex.: Quadra 1'), 'Areia 2')
    await user.click(screen.getByRole('button', { name: 'Criar Quadra' }))

    expect(await screen.findByText('Diga se a quadra é coberta')).toBeInTheDocument()
    expect(courtsService.createCourt).not.toHaveBeenCalled()

    await user.click(screen.getByLabelText('Descoberta'))
    await user.click(screen.getByRole('button', { name: 'Criar Quadra' }))

    await vi.waitFor(() =>
      expect(courtsService.createCourt).toHaveBeenCalledWith('place-1', {
        name: 'Areia 2',
        type: 'SOCIETY',
        coberta: false,
      }),
    )
  })

  it('a quadra sem a informação avisa no formulário, e salvar sem responder não a muda', async () => {
    vi.mocked(courtsService.updateCourt).mockResolvedValue({ success: true, data: quadra } as never)
    const { user } = renderiza()
    await screen.findByText('Quadra Coberta')

    await user.click(screen.getByRole('button', { name: 'Editar' }))

    expect(screen.getByText(/Sem essa informação, a gente mostra a previsão do tempo/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    await vi.waitFor(() => expect(courtsService.updateCourt).toHaveBeenCalled())
    expect(vi.mocked(courtsService.updateCourt).mock.calls[0][2]).not.toHaveProperty('coberta')
  })

  it('marca e desmarca a quadra como coberta', async () => {
    vi.mocked(courtsService.getCourtsByPlace).mockResolvedValue({ data: [{ ...quadra, coberta: true }] } as never)
    vi.mocked(courtsService.updateCourt).mockResolvedValue({ success: true, data: quadra } as never)
    const { user } = renderiza()
    await screen.findByText('Quadra Coberta')

    await user.click(screen.getByRole('button', { name: 'Editar' }))
    expect(screen.getByLabelText('Coberta')).toBeChecked()
    expect(screen.queryByText(/Sem essa informação/)).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Descoberta'))
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    await vi.waitFor(() =>
      expect(courtsService.updateCourt).toHaveBeenCalledWith('place-1', 'court-1', expect.objectContaining({ coberta: false })),
    )
  })

  it('a lista mostra o selo na coberta, e o espaço conta as que não disseram', async () => {
    vi.mocked(courtsService.getCourtsByPlace).mockResolvedValue({
      data: [
        { ...quadra, id: 'c1', name: 'Ginásio', coberta: true },
        { ...quadra, id: 'c2', name: 'Society', coberta: null },
        { ...quadra, id: 'c3', name: 'Areia', coberta: null },
        { ...quadra, id: 'c4', name: 'Mesa de poker', type: 'POKER', coberta: null },
      ],
    } as never)
    const { user } = renderiza()

    await screen.findByText('Ginásio')
    expect(screen.getByText('coberta')).toBeInTheDocument()
    // O poker não entra na conta: ele não tem previsão em caso nenhum.
    expect(screen.getByText(/2 quadras sem dizer se são cobertas/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Informar' }))
    expect(screen.getByDisplayValue('Society')).toBeInTheDocument()
  })

  it('poker não pergunta', async () => {
    const { user } = renderiza()
    await screen.findByText('Quadra Coberta')

    await user.click(screen.getByRole('button', { name: '+ Nova Quadra' }))
    expect(screen.getByLabelText('Coberta')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox'), 'POKER')
    expect(screen.queryByLabelText('Coberta')).not.toBeInTheDocument()
  })
})

/**
 * O preço por horário (web#474, api#576).
 *
 * A opção só aparece quando a api devolve `precoVariaPorHorario` — os testes
 * acima, com quadra sem o campo, são a garantia de que a tela antiga continua
 * a mesma enquanto a api não tem a funcionalidade.
 */
describe('OwnerCourts — preço por horário', () => {
  const comFaixas = { ...quadra, pricePerHour: '80', precoVariaPorHorario: false, precoMinimo: 80, precoMaximo: 80 }

  beforeEach(() => {
    vi.mocked(courtsService.getExpediente).mockResolvedValue({ success: true, data: [] })
    vi.mocked(courtsService.updateCourt).mockResolvedValue({ success: true, data: comFaixas } as never)
    vi.mocked(courtsService.createCourt).mockResolvedValue({ success: true, data: { ...comFaixas, id: 'court-nova' } } as never)
    vi.mocked(courtsService.substituirFaixasDePreco).mockResolvedValue({ success: true, data: comFaixas } as never)
  })

  it('sem o campo na api, a opção não aparece', async () => {
    const { user } = renderiza()
    await screen.findByText('Quadra Coberta')

    await user.click(screen.getByRole('button', { name: 'Editar' }))

    expect(screen.queryByLabelText('Valores diferentes por horário')).not.toBeInTheDocument()
    expect(courtsService.getCourt).not.toHaveBeenCalled()
  })

  it('desmarcada, o formulário é o de hoje, e salvar não mexe nas faixas', async () => {
    vi.mocked(courtsService.getCourtsByPlace).mockResolvedValue({ data: [comFaixas] } as never)
    vi.mocked(courtsService.getCourt).mockResolvedValue({ success: true, data: { ...comFaixas, faixasDePreco: [] } } as never)
    const { user } = renderiza()
    await screen.findByText('Quadra Coberta')

    await user.click(screen.getByRole('button', { name: 'Editar' }))
    expect(screen.getByLabelText('Preço por Hora (R$)')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Segunda' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    await vi.waitFor(() =>
      expect(courtsService.updateCourt).toHaveBeenCalledWith('place-1', 'court-1', expect.objectContaining({ precoVariaPorHorario: false })),
    )
    expect(courtsService.substituirFaixasDePreco).not.toHaveBeenCalled()
  })

  it('marcada, o campo vira valor padrão, e a faixa copiada para os dias úteis vai inteira no PUT', async () => {
    vi.mocked(courtsService.getCourtsByPlace).mockResolvedValue({ data: [comFaixas] } as never)
    vi.mocked(courtsService.getCourt).mockResolvedValue({ success: true, data: { ...comFaixas, faixasDePreco: [] } } as never)
    const { user } = renderiza()
    await screen.findByText('Quadra Coberta')

    await user.click(screen.getByRole('button', { name: 'Editar' }))
    await user.click(screen.getByLabelText('Valores diferentes por horário'))

    expect(screen.getByLabelText('Valor padrão (R$/h)')).toBeInTheDocument()
    expect(screen.getByText('Vale nos horários que nenhuma faixa cobre.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Adicionar faixa em Segunda' }))
    await user.type(screen.getByLabelText('Segunda: valor por hora'), '120')
    await user.click(within(screen.getByRole('region', { name: 'Segunda' })).getByRole('button', { name: 'dias úteis' }))
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    await vi.waitFor(() => expect(courtsService.substituirFaixasDePreco).toHaveBeenCalled())
    expect(courtsService.updateCourt).toHaveBeenCalledWith('place-1', 'court-1', expect.objectContaining({ precoVariaPorHorario: true }))
    const [, courtId, faixas] = vi.mocked(courtsService.substituirFaixasDePreco).mock.calls[0]
    expect(courtId).toBe('court-1')
    expect(faixas.map((f) => f.diaDaSemana)).toEqual([1, 2, 3, 4, 5])
    expect(faixas.every((f) => f.inicio === '18:00' && f.fim === '23:00' && f.valorPorHora === 120)).toBe(true)
  })

  it('a faixa que atravessa a meia-noite é aceita e dita por extenso', async () => {
    vi.mocked(courtsService.getCourtsByPlace).mockResolvedValue({ data: [{ ...comFaixas, precoVariaPorHorario: true }] } as never)
    vi.mocked(courtsService.getCourt).mockResolvedValue({
      success: true,
      data: { ...comFaixas, precoVariaPorHorario: true, faixasDePreco: [{ diaDaSemana: 6, inicio: '22:00', fim: '02:00', valorPorHora: '140' }] },
    } as never)
    const { user } = renderiza()
    await screen.findByText('Quadra Coberta')

    await user.click(screen.getByRole('button', { name: 'Editar' }))

    expect(await screen.findByText('até as 2h do dia seguinte')).toBeInTheDocument()
  })

  it('a sobreposição recusada pela api aparece com a mensagem dela, nas duas faixas', async () => {
    vi.mocked(courtsService.getCourtsByPlace).mockResolvedValue({ data: [{ ...comFaixas, precoVariaPorHorario: true }] } as never)
    vi.mocked(courtsService.getCourt).mockResolvedValue({
      success: true,
      data: {
        ...comFaixas,
        precoVariaPorHorario: true,
        faixasDePreco: [
          { diaDaSemana: 0, inicio: '00:00', fim: '10:00', valorPorHora: '90' },
          { diaDaSemana: 1, inicio: '18:00', fim: '23:00', valorPorHora: '120' },
          { diaDaSemana: 6, inicio: '22:00', fim: '02:00', valorPorHora: '140' },
        ],
      },
    } as never)
    vi.mocked(courtsService.substituirFaixasDePreco).mockRejectedValue(
      erroDaApi('As faixas 1 e 3 se sobrepõem', 422, 'FAIXAS_DE_PRECO_SOBREPOSTAS'),
    )
    const { user, container } = renderiza()
    await screen.findByText('Quadra Coberta')

    await user.click(screen.getByRole('button', { name: 'Editar' }))
    await screen.findByLabelText('Sábado: fim')
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('A quadra foi salva, mas as faixas não: As faixas 1 e 3 se sobrepõem.')
    const destacadas = container.ownerDocument.querySelectorAll('[data-destacada]')
    expect(destacadas).toHaveLength(2)
    expect(within(screen.getByRole('region', { name: 'Domingo' })).getByLabelText('Domingo: início').closest('[data-destacada]')).not.toBeNull()
    expect(within(screen.getByRole('region', { name: 'Sábado' })).getByLabelText('Sábado: início').closest('[data-destacada]')).not.toBeNull()
    // O modal fica aberto: a falha não pode sumir junto com ele.
    expect(screen.getByRole('button', { name: 'Salvar Alterações' })).toBeInTheDocument()
  })

  it('desmarcar avisa que as faixas ficam guardadas, e marcar de novo as traz de volta', async () => {
    vi.mocked(courtsService.getCourtsByPlace).mockResolvedValue({ data: [{ ...comFaixas, precoVariaPorHorario: true }] } as never)
    vi.mocked(courtsService.getCourt).mockResolvedValue({
      success: true,
      data: { ...comFaixas, precoVariaPorHorario: true, faixasDePreco: [{ diaDaSemana: 1, inicio: '18:00', fim: '23:00', valorPorHora: '120' }] },
    } as never)
    const { user } = renderiza()
    await screen.findByText('Quadra Coberta')

    await user.click(screen.getByRole('button', { name: 'Editar' }))
    await screen.findByLabelText('Segunda: valor por hora')

    await user.click(screen.getByLabelText('Valores diferentes por horário'))
    expect(screen.getByText('As faixas ficam guardadas e voltam se você marcar de novo.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Segunda: valor por hora')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Valores diferentes por horário'))
    expect(screen.getByLabelText('Segunda: valor por hora')).toHaveValue(120)
  })

  it('faixa sem valor não sai: a linha fica destacada e nada é gravado', async () => {
    vi.mocked(courtsService.getCourtsByPlace).mockResolvedValue({ data: [comFaixas] } as never)
    vi.mocked(courtsService.getCourt).mockResolvedValue({ success: true, data: { ...comFaixas, faixasDePreco: [] } } as never)
    const { user } = renderiza()
    await screen.findByText('Quadra Coberta')

    await user.click(screen.getByRole('button', { name: 'Editar' }))
    await user.click(screen.getByLabelText('Valores diferentes por horário'))
    await user.click(screen.getByRole('button', { name: 'Adicionar faixa em Terça' }))
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/valor maior que zero/)
    expect(courtsService.updateCourt).not.toHaveBeenCalled()
  })

  it('a quadra nova com faixas é criada e depois recebe a tabela, pelo id que voltou', async () => {
    vi.mocked(courtsService.getCourtsByPlace).mockResolvedValue({ data: [comFaixas] } as never)
    const { user } = renderiza()
    await screen.findByText('Quadra Coberta')

    await user.click(screen.getByRole('button', { name: '+ Nova Quadra' }))
    await user.type(screen.getByPlaceholderText('Ex.: Quadra 1'), 'Beach 3')
    await user.click(screen.getByLabelText('Descoberta'))
    await user.click(screen.getByLabelText('Valores diferentes por horário'))
    await user.click(screen.getByRole('button', { name: 'Adicionar faixa em Sábado' }))
    await user.type(screen.getByLabelText('Sábado: valor por hora'), '95')
    await user.click(screen.getByRole('button', { name: 'Criar Quadra' }))

    await vi.waitFor(() =>
      expect(courtsService.substituirFaixasDePreco).toHaveBeenCalledWith('place-1', 'court-nova', [
        { diaDaSemana: 6, inicio: '18:00', fim: '23:00', valorPorHora: 95 },
      ]),
    )
  })

  it('a lista mostra o intervalo de preço da quadra com faixas', async () => {
    vi.mocked(courtsService.getCourtsByPlace).mockResolvedValue({
      data: [{ ...comFaixas, precoVariaPorHorario: true, precoMinimo: 80, precoMaximo: 150 }],
    } as never)

    renderiza()

    expect(await screen.findByText(/R\$ 80,00 a 150,00\/h/)).toBeInTheDocument()
  })
})
