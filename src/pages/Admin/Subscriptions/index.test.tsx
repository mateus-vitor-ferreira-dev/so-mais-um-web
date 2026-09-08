/**
 * A tela do admin para a assinatura recebida por fora (web#445, api#537).
 *
 * O que ela precisa provar não é que renderiza uma tabela: é que **não cobra**,
 * que a assinatura da Stripe aparece sem se deixar tocar, e que uma manual
 * vencida salta aos olhos de quem não abre esta tela todo dia.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, renderWithProviders, screen, waitFor, within } from '../../../test/render'
import { erroDaApi } from '../../../test/factories'
import { assinaturasDoAdmin } from '../../../services/assinaturasDoAdmin'
import { plansService } from '../../../services/plansService'
import * as adminService from '../../../services/admin'
import type { AssinaturaDoAdmin } from '../../../types/api'
import AdminSubscriptions from './index'

vi.mock('../../../services/assinaturasDoAdmin')
vi.mock('../../../services/plansService')
vi.mock('../../../services/admin')

const servico = vi.mocked(assinaturasDoAdmin)
const planos = vi.mocked(plansService)
const admin = vi.mocked(adminService)

const DIA_MS = 24 * 60 * 60 * 1000
const emDias = (dias: number) => new Date(Date.now() + dias * DIA_MS).toISOString()

const manual = (patch: Partial<AssinaturaDoAdmin> = {}): AssinaturaDoAdmin => ({
  id: 'a1',
  owner: { name: 'Joana Ribeiro', email: 'joana@arena.com' },
  place: { name: 'Arena Lavras' },
  planName: 'Pro',
  monthlyValue: '79,90',
  status: 'active',
  currentPeriodEnd: emDias(25),
  origem: 'MANUAL',
  emDia: true,
  registradaPor: 'Mateus',
  registradaEm: emDias(-5),
  ...patch,
})

const daStripe = (patch: Partial<AssinaturaDoAdmin> = {}): AssinaturaDoAdmin =>
  manual({
    id: 'a2',
    owner: { name: 'Pedro Alves', email: 'pedro@quadra.com' },
    place: { name: 'Quadra Central' },
    origem: 'STRIPE',
    registradaPor: null,
    registradaEm: null,
    ...patch,
  })

/**
 * O mês concedido (api#551, web#456).
 *
 * Tem a forma da manual — vence por data — e **não** é uma: ninguém pagou, e a
 * linha não pode afirmar que alguém pagou.
 */
const cortesia = (patch: Partial<AssinaturaDoAdmin> = {}): AssinaturaDoAdmin =>
  manual({
    id: 'a3',
    owner: { name: 'Marina Costa', email: 'marina@arena.com' },
    place: { name: 'Arena Marina' },
    origem: 'CORTESIA',
    registradaPor: 'Mateus',
    ...patch,
  })

const monta = () => renderWithProviders(<AdminSubscriptions />, { route: '/admin/subscriptions' })

const linhaDe = (nome: string) => screen.getByText(nome).closest('li') as HTMLElement

beforeEach(() => {
  vi.clearAllMocks()
  servico.listar.mockResolvedValue([manual()])
  servico.registrar.mockResolvedValue({})
  servico.renovar.mockResolvedValue({})
  servico.encerrar.mockResolvedValue({})
  planos.getAll.mockResolvedValue([
    // O bruto do cartão veio com a api#539. Esta tela não o usa — a
    // assinatura manual é Pix, e no Pix o líquido é o valor cheio —, mas o
    // tipo `Plan` o exige, e a fixture não pode inventar um plano que a api
    // não devolve mais.
    { id: 'p-pro', nome: 'Pro', precoCentavos: 7990, precoNoCartaoCentavos: 8411, funcionalidades: [] },
  ])
  const dono = (id: string, name: string, email: string) => ({
    id, name, email, role: 'OWNER' as const, badge: null, createdAt: emDias(-90),
    _count: { placesOwned: 1, matchesCreated: 0, participations: 0 },
  })
  admin.listUsers.mockResolvedValue({
    data: { data: [dono('u1', 'Joana Ribeiro', 'joana@arena.com'), dono('u2', 'Carla Dias', 'carla@nova.com')] },
  } as Awaited<ReturnType<typeof adminService.listUsers>>)
})

describe('a lista', () => {
  it('diz quem, plano, origem, situação e até quando vale', async () => {
    monta()

    await screen.findByText('Joana Ribeiro')
    const linha = within(linhaDe('Joana Ribeiro'))
    expect(linha.getByText(/Arena Lavras · joana@arena\.com/)).toBeInTheDocument()
    expect(linha.getByText(/Pro · R\$ 79,90\/mês · vale até/)).toBeInTheDocument()
    expect(linha.getByText('Manual (Pix)')).toBeInTheDocument()
    expect(linha.getByText('Em dia')).toBeInTheDocument()
  })

  it('mostra quem registrou o Pix — é a única memória desse dinheiro', async () => {
    monta()
    expect(await screen.findByText(/Registrada por Mateus em/)).toBeInTheDocument()
  })

  it('manual sem validade não aparece em branco', async () => {
    // Sem data ela não vale acesso nenhum; um traço esconderia o registro pela metade.
    servico.listar.mockResolvedValue([manual({ currentPeriodEnd: null, emDia: false })])
    monta()

    expect(await screen.findByText(/sem validade registrada — assim ela não vale acesso/))
      .toBeInTheDocument()
  })
})

describe('o que precisa de atenção salta aos olhos', () => {
  it('avisa no topo quando uma manual está vencendo, com o nome de quem é', async () => {
    servico.listar.mockResolvedValue([manual({ currentPeriodEnd: emDias(3) })])
    monta()

    expect(await screen.findByText(/1 assinatura precisa de atenção/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Joana Ribeiro')
    expect(screen.getByText('Vence em 3 dias')).toBeInTheDocument()
  })

  it('vencida é vencida, mesmo com o status ainda dizendo active', async () => {
    // O caso que só existe na manual: ninguém vira o status quando o Pix não vem.
    servico.listar.mockResolvedValue([manual({ currentPeriodEnd: emDias(-2), emDia: false })])
    monta()

    expect(await screen.findByText('Vencida')).toBeInTheDocument()
    expect(screen.getByText(/precisa de atenção/)).toBeInTheDocument()
  })

  it('não alarma pela da Stripe: aquela tem webhook', async () => {
    servico.listar.mockResolvedValue([daStripe({ emDia: false, status: 'past_due' })])
    monta()

    expect(await screen.findByText('Pagamento atrasado')).toBeInTheDocument()
    expect(screen.queryByText(/precisa de atenção/)).not.toBeInTheDocument()
  })

  it('encerrada não pede atenção — alguém já decidiu que aquela acabou', async () => {
    servico.listar.mockResolvedValue([
      manual({ status: 'canceled', emDia: false, currentPeriodEnd: emDias(-30) }),
    ])
    monta()

    expect(await screen.findByText('Encerrada')).toBeInTheDocument()
    expect(screen.queryByText(/precisa de atenção/)).not.toBeInTheDocument()
  })
})

describe('a assinatura da Stripe não se toca', () => {
  it('não oferece ação, e diz por quê', async () => {
    servico.listar.mockResolvedValue([daStripe()])
    monta()

    await screen.findByText('Pedro Alves')
    const linha = within(linhaDe('Pedro Alves'))
    expect(linha.queryByRole('button', { name: /renovar|encerrar/i })).not.toBeInTheDocument()
    expect(linha.getByText(/o próximo webhook desfaz sem avisar/i)).toBeInTheDocument()
  })
})

describe('registrar', () => {
  it('grava dono, plano e validade', async () => {
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: /registrar assinatura/i }))
    await user.selectOptions(await screen.findByLabelText('Dono'), 'u2')
    await user.selectOptions(await screen.findByLabelText('Plano'), 'p-pro')
    // `fireEvent`, e não `user.type`: campo de data é digitado por segmentos, e
    // o que o teclado produz depende da locale do navegador.
    fireEvent.change(screen.getByLabelText('Válido até'), { target: { value: '2027-01-31' } })

    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    await waitFor(() => expect(servico.registrar).toHaveBeenCalledWith({
      userId: 'u2', planId: 'p-pro', validoAte: '2027-01-31',
    }))
  })

  it('não oferece dono que já assina — a api recusaria com 409', async () => {
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: /registrar assinatura/i }))
    const dono = await screen.findByLabelText('Dono')

    await waitFor(() => expect(within(dono).getByRole('option', { name: /Carla Dias/ })).toBeInTheDocument())
    expect(within(dono).queryByRole('option', { name: /Joana Ribeiro/ })).not.toBeInTheDocument()
  })

  it('a validade não aceita data passada', async () => {
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: /registrar assinatura/i }))

    const hoje = new Date()
    const amanha = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1)
    const esperado = `${amanha.getFullYear()}-${String(amanha.getMonth() + 1).padStart(2, '0')}-${String(amanha.getDate()).padStart(2, '0')}`
    expect(screen.getByLabelText('Válido até')).toHaveAttribute('min', esperado)
  })
})

describe('renovar e encerrar', () => {
  it('renovar estende a validade e não pede plano', async () => {
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: 'Renovar' }))
    const modal = within(screen.getByRole('dialog'))
    fireEvent.change(screen.getByLabelText('Válido até'), { target: { value: '2027-03-15' } })
    await user.click(modal.getByRole('button', { name: 'Renovar' }))

    await waitFor(() => expect(servico.renovar).toHaveBeenCalledWith('a1', '2027-03-15'))
    expect(screen.queryByLabelText('Plano')).not.toBeInTheDocument()
  })

  it('encerrar avisa que o histórico fica, e encerra', async () => {
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: 'Encerrar' }))
    expect(screen.getByText(/única memória de que ele pagou/i)).toBeInTheDocument()

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Encerrar' }))
    await waitFor(() => expect(servico.encerrar).toHaveBeenCalledWith('a1'))
  })
})

describe('a tela nunca cobra', () => {
  it('não oferece cobrar, QR, boleto nem link de pagamento', async () => {
    monta()

    await screen.findByText('Joana Ribeiro')
    expect(screen.queryByRole('button', { name: /cobrar|boleto|qr|link de pagamento|gerar pix/i }))
      .not.toBeInTheDocument()
    expect(screen.getByText(/não gera cobrança, QR nem link/i)).toBeInTheDocument()
  })
})

/**
 * O mês concedido, no painel (web#456 / api#552).
 *
 * O que estes casos prendem é a **distinção**: cortesia tem a forma da manual e
 * não é uma, e a tela precisa dizer isso em cada lugar onde a diferença muda
 * uma decisão — o valor, o selo, as ações e a fila do que precisa de atenção.
 */
describe('cortesia', () => {
  it('concede por um caminho próprio, e não por um seletor de origem', async () => {
    servico.listar.mockResolvedValue([])
    servico.conceder.mockResolvedValue({})
    admin.listUsers.mockResolvedValue({
      data: { data: [{ id: 'u9', name: 'Marina Costa', email: 'marina@arena.com', role: 'OWNER' }] },
    } as never)

    const { user } = monta()
    await user.click(await screen.findByRole('button', { name: /Conceder cortesia/i }))

    const modal = within(await screen.findByRole('dialog', { name: /Conceder cortesia/i }))
    // Nenhum seletor de origem: a rota é que decide, e é o ponto de as duas
    // ações serem separadas.
    expect(modal.queryByText(/origem/i)).not.toBeInTheDocument()
    expect(modal.getByText(/não entra na Receita Mensal/i)).toBeInTheDocument()

    await user.selectOptions(modal.getByLabelText(/Dono/i), 'u9')
    await user.selectOptions(modal.getByLabelText(/Plano/i), 'p-pro')
    await user.click(modal.getByRole('button', { name: 'Conceder' }))

    await waitFor(() => expect(servico.conceder).toHaveBeenCalledTimes(1))
    expect(servico.conceder).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u9', planId: 'p-pro' }),
    )
    // E a rota de registrar Pix não foi chamada por engano.
    expect(servico.registrar).not.toHaveBeenCalled()
  })

  it('a linha não afirma que entrou dinheiro', async () => {
    servico.listar.mockResolvedValue([cortesia()])
    monta()

    await screen.findByText('Marina Costa')
    const linha = within(linhaDe('Marina Costa'))
    expect(linha.getByText('Cortesia')).toBeInTheDocument()
    expect(linha.getByText(/cortesia, sem cobrança/)).toBeInTheDocument()
    // O valor do plano não aparece: aqui ele descreveria um recebimento que não
    // houve. E o rastro diz "concedida", não "registrada".
    expect(linha.queryByText(/R\$ 79,90/)).not.toBeInTheDocument()
    expect(linha.getByText(/Concedida por Mateus/)).toBeInTheDocument()
    expect(linha.getByText(/teste até/)).toBeInTheDocument()
  })

  it('tem Encerrar e não tem Renovar', async () => {
    // Renovar seria conceder mais tempo grátis — a porta dos fundos da regra de
    // uma cortesia por dono, e a api recusa de qualquer jeito.
    servico.listar.mockResolvedValue([cortesia()])
    monta()

    await screen.findByText('Marina Costa')
    const linha = within(linhaDe('Marina Costa'))
    expect(await linha.findByRole('button', { name: 'Encerrar' })).toBeInTheDocument()
    expect(linha.queryByRole('button', { name: 'Renovar' })).not.toBeInTheDocument()
    // E não é a mensagem da Stripe: cortesia se toca, só não se renova.
    expect(linha.queryByText(/Cobrada pela Stripe/)).not.toBeInTheDocument()
  })

  it('cortesia vencendo entra na fila do que precisa de atenção', async () => {
    // É onde ela mais precisa estar: o fim do teste é a conversa de venda, e ela
    // passa sozinha se ninguém abrir esta tela.
    servico.listar.mockResolvedValue([cortesia({ currentPeriodEnd: emDias(2) })])
    monta()

    expect(await screen.findByText(/1 assinatura precisa de atenção/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Marina Costa')
  })

  it('teste acabado não se chama "vencida" — ninguém deixou de pagar', async () => {
    servico.listar.mockResolvedValue([
      cortesia({ currentPeriodEnd: emDias(-1), emDia: false }),
    ])
    monta()

    expect(await screen.findByText('Teste acabado')).toBeInTheDocument()
    expect(screen.queryByText('Vencida')).not.toBeInTheDocument()
  })

  it('já concedida vira frase com a data, e o formulário fica aberto', async () => {
    // Não é falha do sistema: é resposta, e a ação seguinte de quem leu é
    // escolher outro dono — fechar o modal a obrigaria a começar de novo.
    servico.listar.mockResolvedValue([])
    servico.conceder.mockRejectedValue(
      erroDaApi(
        'Este dono já teve um mês de cortesia em 12/03/2026. Cortesia é uma por dono.',
        409,
        'CORTESIA_JA_CONCEDIDA',
      ),
    )
    admin.listUsers.mockResolvedValue({
      data: { data: [{ id: 'u9', name: 'Marina Costa', email: 'marina@arena.com', role: 'OWNER' }] },
    } as never)

    const { user } = monta()
    await user.click(await screen.findByRole('button', { name: /Conceder cortesia/i }))

    const modal = within(await screen.findByRole('dialog', { name: /Conceder cortesia/i }))
    await user.selectOptions(modal.getByLabelText(/Dono/i), 'u9')
    await user.selectOptions(modal.getByLabelText(/Plano/i), 'p-pro')
    await user.click(modal.getByRole('button', { name: 'Conceder' }))

    await waitFor(() => expect(servico.conceder).toHaveBeenCalled())
    expect(await screen.findByRole('dialog', { name: /Conceder cortesia/i })).toBeInTheDocument()
  })
})
