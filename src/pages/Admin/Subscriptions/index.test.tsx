/**
 * A tela do admin para a assinatura recebida por fora (web#445, api#537).
 *
 * O que ela precisa provar não é que renderiza uma tabela: é que **não cobra**,
 * que a assinatura da Stripe aparece sem se deixar tocar, e que uma manual
 * vencida salta aos olhos de quem não abre esta tela todo dia.
 *
 * Desde a web#502 a lista é uma tabela com filtros e números no topo, e o dono
 * se escolhe por busca, e não por um `<select>` com a base inteira.
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

const dono = (id: string, name: string, email: string) => ({
  id, name, email, role: 'OWNER' as const, badge: null, createdAt: emDias(-90),
  _count: { placesOwned: 1, matchesCreated: 0, participations: 0 },
})

type ContaDaBase = Omit<ReturnType<typeof dono>, 'role'> & { role: 'PLAYER' | 'OWNER' | 'ADMIN' }

/**
 * A api de usuários de mentira, com a base dada (api#618).
 *
 * Os campos de pessoa buscam no servidor desde a api#618, então o mock precisa
 * responder como a api responde: filtrando pelo papel e pelo pedaço de nome ou
 * e-mail, sem diferença de maiúscula — e **com** diferença de acento, que é o
 * que o `contains … insensitive` do Postgres faz.
 */
const donosDaBase = (...lista: ContaDaBase[]) =>
  ((filtro: adminService.FiltroDeUsuarios = {}) => {
    const busca = filtro.busca?.trim().toLowerCase() ?? ''
    const achados = lista
      .filter((c) => !filtro.role || c.role === filtro.role)
      .filter((c) => !busca || c.name.toLowerCase().includes(busca) || c.email.toLowerCase().includes(busca))
    return Promise.resolve({
      success: true as const,
      data: achados,
      pagina: { proximo: null, total: achados.length, porPapel: { PLAYER: 0, OWNER: 0, ADMIN: 0 } },
    })
  }) as typeof adminService.listUsers

const monta = () => renderWithProviders(<AdminSubscriptions />, { route: '/admin/subscriptions' })

const linhaDe = (nome: string) => screen.getByText(nome).closest('tr') as HTMLElement

const filtro = (nome: RegExp) => screen.getByRole('tab', { name: nome })

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
  admin.listUsers.mockImplementation(
    donosDaBase(dono('u1', 'Joana Ribeiro', 'joana@arena.com'), dono('u2', 'Carla Dias', 'carla@nova.com')),
  )
})

// ── Qual dos dois preços a linha mostra (#449) ────────────────────────────────

describe('o valor da linha', () => {
  /**
   * O número é o líquido nas duas origens. Na manual isso não é ambíguo — o Pix
   * cai inteiro —, então a linha não ganha explicação nenhuma: rótulo onde não
   * há dois números só faria ruído.
   */
  it('não explica nada na manual, onde os dois números são o mesmo', async () => {
    monta()

    await screen.findByText('Joana Ribeiro')
    const linha = linhaDe('Joana Ribeiro')
    expect(linha).toHaveTextContent('R$ 79,90/mês')
    expect(linha).not.toHaveTextContent(/recebidos/)
    expect(linha).not.toHaveTextContent(/o cartão cobra/)
  })

  /**
   * Na Stripe o painel diz o líquido e a fatura do dono diz o bruto. Sem rótulo,
   * quem confere o primeiro pagamento real vê dois números do mesmo produto e
   * nenhuma explicação — informação errada com a mesma confiança da certa.
   */
  it('diz que o valor é o recebido quando a origem é Stripe', async () => {
    servico.listar.mockResolvedValue([daStripe()])
    monta()

    await screen.findByText('Pedro Alves')
    expect(linhaDe('Pedro Alves')).toHaveTextContent('R$ 79,90/mês recebidos (o cartão cobra mais, com a taxa)')
  })

  /**
   * O bruto não é reconstruído aqui de propósito: a taxa mora na api
   * (`plans/precoNoCartao.ts`), e refazer a conta no front é como os dois lados
   * passam a discordar — foi a decisão da api#539.
   */
  it('não inventa o valor do cartão — nenhuma aritmética de taxa no front', async () => {
    servico.listar.mockResolvedValue([daStripe()])
    monta()

    await screen.findByText('Pedro Alves')
    // 79,90 ÷ 0,95 = 84,11. Se esse número aparecer, a conta foi refeita aqui.
    expect(linhaDe('Pedro Alves')).not.toHaveTextContent(/84,11/)
  })
})

describe('a lista', () => {
  it('diz quem, estabelecimento, plano, origem, situação e até quando vale', async () => {
    monta()

    await screen.findByText('Joana Ribeiro')
    const linha = within(linhaDe('Joana Ribeiro'))
    expect(linha.getByText('joana@arena.com')).toBeInTheDocument()
    expect(linha.getByText('Arena Lavras')).toBeInTheDocument()
    expect(linha.getByText('Pro')).toBeInTheDocument()
    expect(linha.getByText('Manual (Pix)')).toBeInTheDocument()
    expect(linha.getByText('Em dia')).toBeInTheDocument()
    expect(linha.getByText(/vale até/)).toBeInTheDocument()
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

describe('os números do topo (web#502)', () => {
  it('conta ativas, atenção, cortesias em curso e a receita manual', async () => {
    servico.listar.mockResolvedValue([
      manual(),
      manual({ id: 'a4', owner: { name: 'Rui', email: 'rui@x.com' }, monthlyValue: '100,00', currentPeriodEnd: emDias(3) }),
      daStripe(),
      cortesia(),
      manual({ id: 'a5', owner: { name: 'Lia', email: 'lia@x.com' }, emDia: false, currentPeriodEnd: emDias(-3) }),
    ])
    monta()

    const numero = async (rotulo: string) =>
      (await screen.findByText(rotulo, { selector: 'p' })).parentElement as HTMLElement

    // A da Stripe é ativa e não entra na receita manual; a cortesia é ativa e
    // não é dinheiro; a vencida não é ativa e não soma.
    expect(await numero('Ativas')).toHaveTextContent('4')
    expect(await numero('Cortesias em curso')).toHaveTextContent('1')
    expect(await numero('Receita manual do mês')).toHaveTextContent('R$ 179,90')
    expect(await numero('Precisam de atenção')).toHaveTextContent('2')
  })
})

describe('o que precisa de atenção salta aos olhos', () => {
  it('abre no filtro de atenção quando há alguma, só com ela na lista', async () => {
    servico.listar.mockResolvedValue([manual({ currentPeriodEnd: emDias(3) }), daStripe()])
    monta()

    expect(await screen.findByText('Vence em 3 dias')).toBeInTheDocument()
    expect(filtro(/Precisam de atenção/)).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Joana Ribeiro')).toBeInTheDocument()
    expect(screen.queryByText('Pedro Alves')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/Nem a manual nem a cortesia se renovam sozinhas/)
  })

  it('sem nada pedindo atenção, abre em Todas — e não num filtro vazio', async () => {
    servico.listar.mockResolvedValue([manual(), daStripe()])
    monta()

    await screen.findByText('Joana Ribeiro')
    expect(filtro(/Todas/)).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Pedro Alves')).toBeInTheDocument()
  })

  it('o filtro escolhido troca a lista', async () => {
    servico.listar.mockResolvedValue([manual(), daStripe(), cortesia()])
    const { user } = monta()

    await screen.findByText('Joana Ribeiro')
    await user.click(filtro(/Cortesias/))

    expect(screen.getByText('Marina Costa')).toBeInTheDocument()
    expect(screen.queryByText('Joana Ribeiro')).not.toBeInTheDocument()
    expect(screen.queryByText('Pedro Alves')).not.toBeInTheDocument()
  })

  it('vencida é vencida, mesmo com o status ainda dizendo active', async () => {
    // O caso que só existe na manual: ninguém vira o status quando o Pix não vem.
    servico.listar.mockResolvedValue([manual({ currentPeriodEnd: emDias(-2), emDia: false })])
    monta()

    expect(await screen.findByText('Vencida')).toBeInTheDocument()
    expect(filtro(/Precisam de atenção/)).toHaveAttribute('aria-selected', 'true')
  })

  it('não alarma pela da Stripe: aquela tem webhook', async () => {
    servico.listar.mockResolvedValue([daStripe({ emDia: false, status: 'past_due' })])
    monta()

    expect(await screen.findByText('Pagamento atrasado')).toBeInTheDocument()
    expect(filtro(/Precisam de atenção/)).toHaveTextContent('0')
    expect(filtro(/Todas/)).toHaveAttribute('aria-selected', 'true')
  })

  it('encerrada não pede atenção — alguém já decidiu que aquela acabou', async () => {
    servico.listar.mockResolvedValue([
      manual({ status: 'canceled', emDia: false, currentPeriodEnd: emDias(-30) }),
    ])
    monta()

    expect(await screen.findByText('Encerrada')).toBeInTheDocument()
    expect(filtro(/Precisam de atenção/)).toHaveTextContent('0')
  })
})

describe('a assinatura da Stripe não se toca', () => {
  it('não oferece ação, e diz por quê uma vez só, e não em cada linha', async () => {
    servico.listar.mockResolvedValue([
      daStripe(),
      daStripe({ id: 'a6', owner: { name: 'Beto Lima', email: 'beto@quadra.com' } }),
    ])
    monta()

    await screen.findByText('Pedro Alves')
    for (const nome of ['Pedro Alves', 'Beto Lima']) {
      expect(within(linhaDe(nome)).queryByRole('button', { name: /renovar|encerrar/i })).not.toBeInTheDocument()
    }
    expect(screen.getAllByText(/o próximo webhook desfaz sem avisar/i)).toHaveLength(1)
  })

  it('o motivo some quando o filtro não mostra nenhuma da Stripe', async () => {
    servico.listar.mockResolvedValue([manual(), daStripe()])
    const { user } = monta()

    await screen.findByText('Pedro Alves')
    await user.click(filtro(/Manuais/))
    expect(screen.queryByText(/o próximo webhook desfaz sem avisar/i)).not.toBeInTheDocument()
  })
})

describe('a busca de dono (web#502)', () => {
  const abreRegistro = async () => {
    const montado = monta()
    await montado.user.click(await screen.findByRole('button', { name: /registrar assinatura/i }))
    return montado
  }

  it('acha por e-mail e por nome, e escolhe', async () => {
    admin.listUsers.mockImplementation(
      donosDaBase(dono('u2', 'Carla Dias', 'carla@nova.com'), dono('u3', 'Tânia Brás', 'tania@beach.com')),
    )
    const { user } = await abreRegistro()

    const busca = await screen.findByRole('combobox', { name: 'Dono' })
    await user.type(busca, 'nova.com')
    expect(await screen.findByRole('option', { name: /Carla Dias/ })).toBeInTheDocument()
    // A busca vai ao servidor depois do debounce; até lá a lista de antes fica.
    await waitFor(() => expect(screen.queryByRole('option', { name: /Tânia/ })).not.toBeInTheDocument())
    expect(admin.listUsers).toHaveBeenLastCalledWith({ role: 'OWNER', busca: 'nova.com' }, expect.anything())

    await user.clear(busca)
    // Com o acento: a api compara sem diferença de maiúscula, mas não de
    // acento (api#618) — antes da busca no servidor, "tania bras" achava.
    await user.type(busca, 'tânia brás')
    await user.click(await screen.findByRole('option', { name: /Tânia Brás/ }))

    // Escolhido, o campo vira o nome, com o jeito de trocar.
    expect(screen.queryByRole('combobox', { name: 'Dono' })).not.toBeInTheDocument()
    expect(screen.getByText('tania@beach.com')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Trocar' }))
    expect(screen.getByRole('combobox', { name: 'Dono' })).toBeInTheDocument()
  })

  it('não oferece dono que já assina — a api recusaria com 409', async () => {
    const { user } = await abreRegistro()

    await user.click(await screen.findByRole('combobox', { name: 'Dono' }))
    expect(await screen.findByRole('option', { name: /Carla Dias/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Joana Ribeiro/ })).not.toBeInTheDocument()
  })

  it('setas e Enter escolhem sem enviar o formulário', async () => {
    const { user } = await abreRegistro()

    await user.click(await screen.findByRole('combobox', { name: 'Dono' }))
    await screen.findByRole('option', { name: /Carla Dias/ })
    await user.keyboard('{Enter}')

    expect(screen.getByText('carla@nova.com')).toBeInTheDocument()
    expect(servico.registrar).not.toHaveBeenCalled()
  })

  it('sem dono escolhido, diz o que falta e não chama a api', async () => {
    const { user } = await abreRegistro()

    await user.selectOptions(await screen.findByLabelText('Plano'), 'p-pro')
    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Escolha um dono da lista.')
    expect(servico.registrar).not.toHaveBeenCalled()
  })
})

describe('registrar', () => {
  it('grava dono, plano e validade', async () => {
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: /registrar assinatura/i }))
    await user.type(await screen.findByRole('combobox', { name: 'Dono' }), 'Carla')
    await user.click(await screen.findByRole('option', { name: /Carla Dias/ }))
    await user.selectOptions(await screen.findByLabelText('Plano'), 'p-pro')
    // `fireEvent`, e não `user.type`: campo de data é digitado por segmentos, e
    // o que o teclado produz depende da locale do navegador.
    fireEvent.change(screen.getByLabelText('Válido até'), { target: { value: '2027-01-31' } })

    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    await waitFor(() => expect(servico.registrar).toHaveBeenCalledWith({
      userId: 'u2', planId: 'p-pro', validoAte: '2027-01-31',
    }))
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
  const concedeParaMarina = async () => {
    servico.listar.mockResolvedValue([])
    admin.listUsers.mockImplementation(donosDaBase(dono('u9', 'Marina Costa', 'marina@arena.com')))

    const montado = monta()
    const { user } = montado
    await user.click(await screen.findByRole('button', { name: /Conceder cortesia/i }))

    const modal = within(await screen.findByRole('dialog', { name: /Conceder cortesia/i }))
    await user.type(modal.getByRole('combobox', { name: 'Dono' }), 'marina')
    await user.click(await modal.findByRole('option', { name: /Marina Costa/ }))
    await user.selectOptions(modal.getByLabelText(/Plano/i), 'p-pro')
    return { ...montado, modal }
  }

  it('concede por um caminho próprio, e não por um seletor de origem', async () => {
    servico.conceder.mockResolvedValue({ resultado: 'CONCEDIDA' })
    const { user, modal } = await concedeParaMarina()

    // Nenhum seletor de origem: a rota é que decide, e é o ponto de as duas
    // ações serem separadas.
    expect(modal.queryByText(/origem/i)).not.toBeInTheDocument()
    expect(modal.getByText(/não entra na Receita Mensal/i)).toBeInTheDocument()

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
  })

  it('cortesia vencendo entra na fila do que precisa de atenção', async () => {
    // É onde ela mais precisa estar: o fim do teste é a conversa de venda, e ela
    // passa sozinha se ninguém abrir esta tela.
    servico.listar.mockResolvedValue([cortesia({ currentPeriodEnd: emDias(2) })])
    monta()

    expect(await screen.findByText('Vence em 2 dias')).toBeInTheDocument()
    expect(filtro(/Precisam de atenção/)).toHaveAttribute('aria-selected', 'true')
    expect(within(screen.getByRole('tabpanel')).getByText('Marina Costa')).toBeInTheDocument()
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
    servico.conceder.mockRejectedValue(
      erroDaApi(
        'Este dono já teve um mês de cortesia em 12/03/2026. Cortesia é uma por dono.',
        409,
        'CORTESIA_JA_CONCEDIDA',
      ),
    )
    const { user, modal } = await concedeParaMarina()

    await user.click(modal.getByRole('button', { name: 'Conceder' }))

    await waitFor(() => expect(servico.conceder).toHaveBeenCalled())
    expect(await screen.findByRole('dialog', { name: /Conceder cortesia/i })).toBeInTheDocument()
  })
})

/**
 * A cortesia por e-mail (web#503, api#597).
 *
 * O que estes casos prendem: o mesmo campo concede e convida, a tela diz qual
 * dos dois vai acontecer **antes** de confirmar, as recusas da api ficam no
 * modal aberto, e sem a rota nova a tela continua como era.
 */
describe('cortesia por e-mail', () => {
  const conta = (id: string, name: string, email: string, role: 'PLAYER' | 'OWNER' | 'ADMIN') => ({
    ...dono(id, name, email),
    role,
  })

  const convite = {
    id: 'c1',
    email: 'nova@arena.com',
    planId: 'p-pro',
    planoNome: 'Pro',
    dias: 30,
    expiresAt: emDias(6),
    inviteUrl: 'https://app.so-mais-um.com/seja-parceiro?convite=abc',
    convidadoPor: 'Mateus',
    convidadoEm: emDias(-1),
  }

  beforeEach(() => {
    servico.convitesPendentes.mockResolvedValue([])
    servico.conceder.mockResolvedValue({ resultado: 'CONCEDIDA' })
    admin.listUsers.mockImplementation(
      donosDaBase(
        conta('u1', 'Joana Ribeiro', 'joana@arena.com', 'OWNER'),
        conta('u2', 'Carla Dias', 'carla@nova.com', 'OWNER'),
        conta('u5', 'Davi Jogador', 'davi@gmail.com', 'PLAYER'),
      ),
    )
  })

  const abreCortesia = async () => {
    const montado = monta()
    await montado.user.click(await screen.findByRole('button', { name: /Conceder cortesia/i }))
    const modal = within(await screen.findByRole('dialog', { name: /Conceder cortesia/i }))
    // As contas vêm da busca pelo e-mail digitado (api#618): nada é pedido
    // antes de a pessoa digitar.
    expect(admin.listUsers).not.toHaveBeenCalled()
    return { ...montado, modal }
  }

  it('com e-mail de dono sem assinatura, diz que vale na hora e concede pelo e-mail', async () => {
    const { user, modal } = await abreCortesia()

    await user.type(modal.getByRole('combobox', { name: 'E-mail do dono' }), 'Carla@Nova.com')
    expect(await modal.findByText(/Carla Dias já é dono: a cortesia vale na hora/)).toBeInTheDocument()
    await user.selectOptions(modal.getByLabelText('Plano'), 'p-pro')
    await user.click(modal.getByRole('button', { name: 'Conceder' }))

    await waitFor(() =>
      expect(servico.conceder).toHaveBeenCalledWith(expect.objectContaining({ email: 'Carla@Nova.com', planId: 'p-pro' })),
    )
    expect(servico.conceder).toHaveBeenCalledWith(expect.not.objectContaining({ userId: expect.anything() }))
  })

  it('com e-mail sem conta, avisa que vai mandar um convite antes de confirmar', async () => {
    servico.conceder.mockResolvedValue({ resultado: 'CONVITE_ENVIADO', convite })
    const { user, modal } = await abreCortesia()

    fireEvent.change(modal.getByLabelText('Teste até'), {
      target: { value: new Date(Date.now() + 10 * DIA_MS).toLocaleDateString('sv-SE') },
    })
    await user.type(modal.getByRole('combobox', { name: 'E-mail do dono' }), 'nova@arena.com')

    expect(await modal.findByText(/Ninguém tem conta com este e-mail\. Vamos mandar um convite de dono, e os 10 dias/))
      .toBeInTheDocument()
    await user.selectOptions(modal.getByLabelText('Plano'), 'p-pro')
    await user.click(modal.getByRole('button', { name: 'Enviar convite' }))

    await waitFor(() => expect(servico.conceder).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('avisa que o e-mail é de um jogador antes de a api recusar', async () => {
    const { user, modal } = await abreCortesia()

    await user.type(modal.getByRole('combobox', { name: 'E-mail do dono' }), 'davi@gmail.com')
    expect(await modal.findByText(/Davi Jogador é jogador/)).toBeInTheDocument()
  })

  it('a recusa da api fica no modal, com o formulário aberto', async () => {
    servico.conceder.mockRejectedValue(
      erroDaApi('Este e-mail já tem um convite com cortesia esperando o cadastro, válido até 21/09/2026.', 409, 'CONVITE_DE_CORTESIA_PENDENTE'),
    )
    const { user, modal } = await abreCortesia()

    await user.type(modal.getByRole('combobox', { name: 'E-mail do dono' }), 'outra@arena.com')
    await user.selectOptions(modal.getByLabelText('Plano'), 'p-pro')
    // O rótulo do convite espera a busca do e-mail responder (api#618).
    await user.click(await modal.findByRole('button', { name: 'Enviar convite' }))

    expect(await modal.findByRole('alert')).toHaveTextContent('válido até 21/09/2026')
    expect(screen.getByRole('dialog', { name: /Conceder cortesia/i })).toBeInTheDocument()

    // Trocar o e-mail tira o aviso velho.
    await user.type(modal.getByRole('combobox', { name: 'E-mail do dono' }), 'x')
    expect(modal.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('sugere os donos sem assinatura enquanto se digita', async () => {
    const { user, modal } = await abreCortesia()

    await user.type(modal.getByRole('combobox', { name: 'E-mail do dono' }), 'dias')
    await user.click(await modal.findByRole('option', { name: /Carla Dias/ }))

    expect(modal.getByRole('combobox', { name: 'E-mail do dono' })).toHaveValue('carla@nova.com')
    // Quem já assina e quem é jogador não viram sugestão.
    await user.clear(modal.getByRole('combobox', { name: 'E-mail do dono' }))
    await user.type(modal.getByRole('combobox', { name: 'E-mail do dono' }), 'a')
    expect(modal.queryByRole('option', { name: /Joana Ribeiro/ })).not.toBeInTheDocument()
    expect(modal.queryByRole('option', { name: /Davi/ })).not.toBeInTheDocument()
  })

  it('mostra o convite pendente na lista, como cortesia aguardando cadastro', async () => {
    servico.convitesPendentes.mockResolvedValue([convite])
    const { user } = monta()

    await screen.findByText('nova@arena.com')
    const linha = within(linhaDe('nova@arena.com'))
    expect(linha.getByText('Aguardando cadastro')).toBeInTheDocument()
    expect(linha.getByText('Cortesia')).toBeInTheDocument()
    expect(linha.getByText(/a partir do cadastro/)).toBeInTheDocument()
    expect(linha.queryByRole('button', { name: /Renovar|Encerrar/ })).not.toBeInTheDocument()
    expect(filtro(/Cortesias/)).toHaveTextContent('1')

    // No filtro das manuais ele não entra.
    await user.click(filtro(/Manuais/))
    expect(screen.queryByText('nova@arena.com')).not.toBeInTheDocument()
  })

  it('copia o link do convite', async () => {
    servico.convitesPendentes.mockResolvedValue([convite])
    const { user } = monta()

    await screen.findByText('nova@arena.com')
    const escrever = vi.spyOn(navigator.clipboard, 'writeText')
    await user.click(within(linhaDe('nova@arena.com')).getByRole('button', { name: /Copiar link/ }))

    expect(escrever).toHaveBeenCalledWith(convite.inviteUrl)
  })

  it('sem nenhuma assinatura, o convite pendente ainda aparece', async () => {
    servico.listar.mockResolvedValue([])
    servico.convitesPendentes.mockResolvedValue([convite])
    monta()

    expect(await screen.findByText('nova@arena.com')).toBeInTheDocument()
    expect(screen.queryByText(/Nenhuma assinatura ainda/)).not.toBeInTheDocument()
  })

  it('com a api antiga, sem a rota dos convites, concede pela busca de dono como antes', async () => {
    servico.convitesPendentes.mockResolvedValue(null)
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: /Conceder cortesia/i }))
    const modal = within(await screen.findByRole('dialog', { name: /Conceder cortesia/i }))

    expect(modal.queryByRole('combobox', { name: 'E-mail do dono' })).not.toBeInTheDocument()
    expect(modal.getByRole('combobox', { name: 'Dono' })).toBeInTheDocument()
  })
})
