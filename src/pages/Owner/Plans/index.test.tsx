import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../../test/render'
import { erroDaApi } from '../../../test/factories'
import type { Plan, SubscriptionStatus, SwitchPlanPreview } from '../../../types/api'
import OwnerPlans from './index'

vi.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: { role: 'OWNER' } }),
}))

vi.mock('../../../components/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))

vi.mock('../../../services/plansService')
vi.mock('../../../services/subscriptionService')
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
// O número do WhatsApp vem do ambiente; o teste da tela controla só o que ele
// produz. Que o link em si é montado certo — e some sem número — é assunto do
// `constants/contato.test.ts`.
vi.mock('../../../constants/contato', () => ({
  linkDeAssinaturaNoWhatsApp: vi.fn(() => 'https://wa.me/5535999999999?text=oi'),
}))

import { linkDeAssinaturaNoWhatsApp } from '../../../constants/contato'
import { plansService } from '../../../services/plansService'
import { subscriptionService } from '../../../services/subscriptionService'
import { toast } from 'sonner'

const basico: Plan = {
  id: 'basico', nome: 'Só+1 Básico', precoCentavos: 3990, precoNoCartaoCentavos: 4200,
  funcionalidades: [],
}

const pro: Plan = {
  id: 'pro', nome: 'Só+1 Pro', precoCentavos: 7990, precoNoCartaoCentavos: 8411,
  funcionalidades: ['ESTATISTICAS', 'EQUIPAMENTOS', 'ESTOQUE'],
}

const assinaturaPro: SubscriptionStatus = {
  status: 'active',
  currentPeriodEnd: '2026-09-01T12:00:00.000Z',
  stripeSubscriptionId: 'sub_123',
  plan: pro,
  usage: { quadras: 6, estabelecimentos: 2 },
}

const getPlans = vi.mocked(plansService.getAll)
const getStatus = vi.mocked(subscriptionService.getStatus)
const checkout = vi.mocked(subscriptionService.createCheckout)
const previewSwitch = vi.mocked(subscriptionService.previewSwitch)
const switchPlan = vi.mocked(subscriptionService.switchPlan)
const toastDeErro = vi.mocked(toast.error)
const linkDoWhatsApp = vi.mocked(linkDeAssinaturaNoWhatsApp)

function erroDeStripeIndisponivel() {
  const err = erroDaApi('Pagamentos indisponíveis', 503)
  ;(err.response!.data as { code?: string }).code = 'STRIPE_NOT_CONFIGURED'
  return err
}

beforeEach(() => {
  vi.clearAllMocks()
  getPlans.mockResolvedValue([basico, pro])
  getStatus.mockResolvedValue(assinaturaPro)
  linkDoWhatsApp.mockReturnValue('https://wa.me/5535999999999?text=oi')
})

describe('OwnerPlans', () => {
  it('compara os planos, destaca o atual e mostra o tamanho do espaço', async () => {
    renderWithProviders(<OwnerPlans />)

    expect(await screen.findByText('Seu plano atual')).toBeInTheDocument()
    // O preço em destaque é o do cartão — é o que o botão ao lado cobra.
    expect(screen.getByText(/R\$ 42,00/)).toBeInTheDocument()
    expect(screen.getByText(/R\$ 84,11/)).toBeInTheDocument()

    // Número seco, sem "de N": nenhum plano tem teto desde a api#278, e "6 de 10"
    // prometeria uma cota que não existe mais.
    const espaco = screen.getByText('Seu espaço hoje').parentElement!
    expect(espaco).toHaveTextContent('Quadras')
    expect(espaco).toHaveTextContent('6')
    expect(espaco).toHaveTextContent('Estabelecimentos')
    expect(espaco).toHaveTextContent('2')
    expect(espaco).not.toHaveTextContent(/\bde 10\b/)
  })

  it('compara por funcionalidade, e o plano de entrada não aparece vazio', async () => {
    renderWithProviders(<OwnerPlans />)

    await screen.findByText('Seu plano atual')

    // Todo degrau mostra o que está incluso; só o Pro mostra as três funcionalidades.
    expect(screen.getAllByText('Cadastrar a arena e as quadras')).toHaveLength(2)
    expect(screen.getByText('Controle de estoque')).toBeInTheDocument()
    expect(screen.getByText('Controle de equipamento')).toBeInTheDocument()

    // E nada de teto de quantidade em lugar nenhum da tela.
    expect(screen.queryByText(/modalidades/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/ilimitad/i)).not.toBeInTheDocument()
  })

  it('envia ao checkout exatamente o plano escolhido', async () => {
    getStatus.mockResolvedValue({
      status: 'inactive', currentPeriodEnd: null, plan: null,
      usage: { quadras: 1, estabelecimentos: 1 },
    })
    checkout.mockRejectedValue(new Error('checkout indisponível no teste'))

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click((await screen.findAllByRole('button', { name: 'Assinar' }))[0])

    expect(checkout).toHaveBeenCalledWith('basico')
  })

  it('mantém aviso e bloqueia assinaturas quando a Stripe está indisponível', async () => {
    getStatus.mockResolvedValue({
      status: 'inactive', currentPeriodEnd: null, plan: null,
      usage: { quadras: 1, estabelecimentos: 1 },
    })
    checkout.mockRejectedValue(erroDeStripeIndisponivel())

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click((await screen.findAllByRole('button', { name: 'Assinar' }))[0])

    expect(await screen.findByRole('alert')).toHaveTextContent('Pagamentos temporariamente indisponíveis')
    expect(
      screen.getAllByRole('button', { name: 'Assinar' }).every((button) => button.hasAttribute('disabled')),
    ).toBe(true)
    expect(toastDeErro).not.toHaveBeenCalled()
  })

  /**
   * Downgrade vale no fim do ciclo, não na hora. A tela precisa dizer isso, e
   * não pode prometer crédito: a API devolve `estimativaCobrancaCentavos: 0`
   * justamente porque nada é cobrado nem creditado agora.
   */
  const previewDowngrade: SwitchPlanPreview = {
    planoAtual: { id: pro.id, nome: pro.nome, precoCentavos: pro.precoCentavos, precoNoCartaoCentavos: pro.precoNoCartaoCentavos },
    planoNovo: { id: basico.id, nome: basico.nome, precoCentavos: basico.precoCentavos, precoNoCartaoCentavos: basico.precoNoCartaoCentavos },
    tipo: 'downgrade',
    estimativaCobrancaCentavos: 0,
    efetivaImediatamente: false,
    valeAPartirDe: '2026-09-01T12:00:00.000Z',
    funcionalidadesPerdidas: ['EQUIPAMENTOS', 'ESTOQUE'],
  }

  it('explica o downgrade antes de confirmar e só então efetiva a troca', async () => {
    previewSwitch.mockResolvedValue(previewDowngrade)
    switchPlan.mockResolvedValue({
      plan: pro, planoAgendado: basico, efetivaImediatamente: false,
      valeAPartirDe: '2026-09-01T12:00:00.000Z',
    })

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click(await screen.findByRole('button', { name: 'Trocar para este plano' }))

    const dialogo = await screen.findByRole('dialog')
    expect(dialogo).toHaveTextContent('Em 01/09/2026')
    expect(dialogo).toHaveTextContent('Nada é apagado')
    expect(switchPlan).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirmar troca' }))
    await waitFor(() => expect(switchPlan).toHaveBeenCalledWith('basico'))
  })

  it('não promete crédito num downgrade — nada é cobrado nem creditado agora', async () => {
    previewSwitch.mockResolvedValue(previewDowngrade)

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click(await screen.findByRole('button', { name: 'Trocar para este plano' }))

    const dialogo = await screen.findByRole('dialog')
    // A tela anunciava "Crédito estimado na próxima fatura" com um valor.
    expect(dialogo).not.toHaveTextContent(/cr[ée]dito estimado/i)
    expect(dialogo).toHaveTextContent('Cobrança ou crédito agoraNenhum')
    expect(dialogo).not.toHaveTextContent('Imediatamente')
  })

  it('upgrade segue anunciando efeito imediato e o ajuste da fatura', async () => {
    previewSwitch.mockResolvedValue({
      planoAtual: { id: basico.id, nome: basico.nome, precoCentavos: basico.precoCentavos, precoNoCartaoCentavos: basico.precoNoCartaoCentavos },
      planoNovo: { id: pro.id, nome: pro.nome, precoCentavos: pro.precoCentavos, precoNoCartaoCentavos: pro.precoNoCartaoCentavos },
      tipo: 'upgrade',
      estimativaCobrancaCentavos: 2000,
      efetivaImediatamente: true,
      valeAPartirDe: null,
      funcionalidadesPerdidas: [],
    })
    getStatus.mockResolvedValue({ ...assinaturaPro, plan: basico })

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click((await screen.findAllByRole('button', { name: 'Trocar para este plano' }))[0])

    const dialogo = await screen.findByRole('dialog')
    expect(dialogo).toHaveTextContent('Imediatamente')
    expect(dialogo).toHaveTextContent('Ajuste estimado na próxima fatura')
  })

  /**
   * Sem este aviso, quem agenda um downgrade volta para uma tela idêntica à de
   * antes — plano antigo em vigor, nenhum sinal do agendamento — e conclui que
   * a troca não pegou.
   */
  it('avisa que há troca agendada, sem trocar o plano em vigor', async () => {
    getStatus.mockResolvedValue({
      ...assinaturaPro,
      trocaAgendada: { plan: basico, valeAPartirDe: '2026-09-01T12:00:00.000Z' },
    })

    renderWithProviders(<OwnerPlans />)

    expect(await screen.findByText(/Troca agendada para 01\/09\/2026/)).toBeInTheDocument()
    // O plano em vigor continua sendo o Pro, e é ele que rege os limites.
    expect(screen.getByText('Seu plano atual').closest('div')).toHaveTextContent('Só+1 Pro')
  })

  it('cancela a troca agendada voltando para o plano em vigor', async () => {
    getStatus.mockResolvedValue({
      ...assinaturaPro,
      trocaAgendada: { plan: basico, valeAPartirDe: '2026-09-01T12:00:00.000Z' },
    })
    switchPlan.mockResolvedValue({
      plan: pro, efetivaImediatamente: true, valeAPartirDe: null,
    })

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click(await screen.findByRole('button', { name: 'Cancelar troca' }))

    // Não há rota própria para cancelar: trocar para o plano em vigor solta o
    // agendamento, e é o que a API espera.
    await waitFor(() => expect(switchPlan).toHaveBeenCalledWith('pro'))
  })

  it('não mostra aviso de agendamento quando não há nenhum', async () => {
    renderWithProviders(<OwnerPlans />)

    await screen.findByText('Seu plano atual')
    expect(screen.queryByText(/Troca agendada/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar troca' })).not.toBeInTheDocument()
  })

  it('trata a indisponibilidade ao abrir a troca de plano', async () => {
    previewSwitch.mockRejectedValue(erroDeStripeIndisponivel())

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click(await screen.findByRole('button', { name: 'Trocar para este plano' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Pagamentos temporariamente indisponíveis')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trocar para este plano' })).toBeDisabled()
    expect(toastDeErro).not.toHaveBeenCalled()
  })

  it('trata a indisponibilidade também na confirmação da troca', async () => {
    previewSwitch.mockResolvedValue(previewDowngrade)
    switchPlan.mockRejectedValue(erroDeStripeIndisponivel())

    const { user } = renderWithProviders(<OwnerPlans />)
    await user.click(await screen.findByRole('button', { name: 'Trocar para este plano' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar troca' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Tente novamente mais tarde')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trocar para este plano' })).toBeDisabled()
    expect(toastDeErro).not.toHaveBeenCalled()
  })

  describe('os dois preços (api#539)', () => {
    it('mostra o do cartão em destaque e o do Pix com o desconto', async () => {
      renderWithProviders(<OwnerPlans />)

      await screen.findByText('Seu plano atual')

      // Básico: recebemos R$ 39,90, e o cartão cobra R$ 42,00 para chegar lá.
      expect(screen.getByText(/R\$ 42,00/)).toBeInTheDocument()
      expect(screen.getByText(/R\$ 39,90 \/ mês no Pix/)).toBeInTheDocument()
      // Pro: R$ 79,90 líquido, R$ 84,11 no cartão.
      expect(screen.getByText(/R\$ 84,11/)).toBeInTheDocument()
      expect(screen.getByText(/R\$ 79,90 \/ mês no Pix/)).toBeInTheDocument()
    })

    it('nomeia o meio de pagamento de cada preço', async () => {
      renderWithProviders(<OwnerPlans />)

      await screen.findByText('Seu plano atual')

      expect(screen.getAllByText(/\/ mês no cartão/)).toHaveLength(2)
      expect(screen.getAllByText(/\/ mês no Pix/)).toHaveLength(2)
    })

    it('o desconto sai da razão entre os dois preços, e não de um número digitado', async () => {
      // Um plano de taxa diferente prova que o rótulo acompanha: 100 líquido
      // cobrado a 125 no cartão é 20% de desconto, não os 5% da grade de hoje.
      getPlans.mockResolvedValue([{ ...basico, precoCentavos: 10000, precoNoCartaoCentavos: 12500 }])
      getStatus.mockResolvedValue({
        status: 'inactive', currentPeriodEnd: null, plan: null,
        usage: { quadras: 1, estabelecimentos: 1 },
      })
      renderWithProviders(<OwnerPlans />)

      expect(await screen.findByText(/desconto de 20%/)).toBeInTheDocument()
      expect(screen.queryByText(/desconto de 5%/)).not.toBeInTheDocument()
    })

    it('avisa que a confirmação do Pix leva até 24h', async () => {
      renderWithProviders(<OwnerPlans />)

      await screen.findByText('Seu plano atual')

      // Vem junto do desconto de propósito: a espera é o preço do desconto.
      expect(screen.getAllByText(/desconto de 5% · confirmação em até 24h/)).toHaveLength(2)
    })
  })

  describe('o caminho do Pix', () => {
    it('leva ao WhatsApp, e não gera QR nem link de pagamento', async () => {
      renderWithProviders(<OwnerPlans />)

      await screen.findByText('Seu plano atual')

      const atalho = screen.getByRole('link', { name: /assinar no pix pelo whatsapp/i })
      expect(atalho).toHaveAttribute('href', 'https://wa.me/5535999999999?text=oi')
      expect(screen.queryByRole('button', { name: /qr|copiar código|gerar pix/i })).not.toBeInTheDocument()
    })

    it('a mensagem já diz o plano e o valor, para ninguém repetir', async () => {
      renderWithProviders(<OwnerPlans />)

      await screen.findByText('Seu plano atual')

      expect(linkDoWhatsApp).toHaveBeenCalledWith(
        expect.stringContaining('Só+1 Básico'))
      // `\s`, e não um espaço literal: o `Intl.NumberFormat` pt-BR separa o
      // "R$" do número com espaço não-quebrável. A Testing Library normaliza
      // isso ao casar texto na tela, mas aqui a asserção é sobre a string crua.
      expect(linkDoWhatsApp).toHaveBeenCalledWith(
        expect.stringMatching(/R\$\s39,90/))
    })

    it('sem número configurado o atalho some, em vez de abrir o WhatsApp sem destino', async () => {
      linkDoWhatsApp.mockReturnValue(null)
      renderWithProviders(<OwnerPlans />)

      await screen.findByText('Seu plano atual')

      expect(screen.queryByRole('link', { name: /whatsapp/i })).not.toBeInTheDocument()
      // O preço do Pix continua: ele informa mesmo sem atalho.
      expect(screen.getByText(/R\$ 39,90 \/ mês no Pix/)).toBeInTheDocument()
    })

    it('o plano atual não oferece o atalho — não há o que assinar de novo', async () => {
      renderWithProviders(<OwnerPlans />)

      await screen.findByText('Seu plano atual')

      const atalhos = screen.getAllByRole('link', { name: /assinar no pix pelo whatsapp/i })
      expect(atalhos).toHaveLength(1)
    })
  })
})
