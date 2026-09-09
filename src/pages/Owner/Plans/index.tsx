import { useState, useEffect, useCallback } from 'react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { Check, Loader2, AlertTriangle, CalendarClock, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { plansService } from '../../../services/plansService'
import { subscriptionService } from '../../../services/subscriptionService'
import { formatarPrecoCentavos } from '../../../utils/formatCurrency'
import {
  ROTULOS_DE_FUNCIONALIDADE,
  INCLUSO_EM_TODO_PLANO,
  ORDEM_DAS_FUNCIONALIDADES,
} from '../../../constants/planFeatures'
import { ehErroDeStripeIndisponivel, mensagemDeErro } from '../../../utils/apiError'
import { linkDeAssinaturaNoWhatsApp } from '../../../constants/contato'
import type { Plan, SubscriptionStatus, SwitchPlanPreview } from '../../../types/api'
import {
  Container, UsageCard, UsageGrid, UsageItem, UsageLabel, UsageValue,
  PlansGrid, PlanCard, CurrentBadge, PlanName, PlanPrice, PlanFeatures, PlanButton,
  Modal, ModalOverlay, ModalBox, ModalTitle, EffectRow, WarningBox, ModalActions, CancelBtn, ConfirmBtn,
  CenteredSpinner, ScheduledBox, CancelScheduleBtn, PaymentWarning, PixBox, PixLink,
} from './styles'

const STATUS_COM_TROCA = ['active', 'trialing', 'past_due']

/**
 * O desconto do Pix, em pontos percentuais inteiros.
 *
 * **Derivado dos dois preços, nunca digitado.** O bruto do cartão é
 * `líquido ÷ (1 − taxa)` (api#539), então a razão entre eles devolve exatamente
 * a taxa de volta — 5% cravado nos três planos da grade. Escrever "5%" à mão
 * aqui daria o mesmo número hoje e um número errado no dia em que a taxa mudar,
 * porque o preço viria certo da api e o rótulo continuaria mentindo.
 */
const descontoDoPix = (plano: Plan) =>
  Math.round((1 - plano.precoCentavos / plano.precoNoCartaoCentavos) * 100)

/** A conversa já começa dizendo o que a pessoa quer, para ninguém repetir. */
const mensagemDoPix = (plano: Plan) =>
  `Olá! Quero assinar o ${plano.nome} do Só+1 pagando no Pix ` +
  `(${formatarPrecoCentavos(plano.precoCentavos)} por mês).`

/** `null` quando não há número configurado — aí o atalho não aparece. */
const linkDoPix = (plano: Plan) => linkDeAssinaturaNoWhatsApp(mensagemDoPix(plano))

/** Mesma formatação do resto do painel — ver Admin/Dashboard e Owner/Requests. */
function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

const DIAS_DE_ALERTA_DO_TESTE = 7

/** A API ainda entrega a data, não um contador pronto; esta conta só decide o destaque visual. */
function testeEstaPertoDoFim(fim: string | null): boolean {
  if (!fim) return false
  return new Date(fim).getTime() - Date.now() <= DIAS_DE_ALERTA_DO_TESTE * 86_400_000
}

function testeEstaVencido(fim: string | null): boolean {
  return fim !== null && new Date(fim).getTime() < Date.now()
}

export default function OwnerPlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [sub, setSub] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)
  const [stripeIndisponivel, setStripeIndisponivel] = useState(false)

  const [trocaPlano, setTrocaPlano] = useState<Plan | null>(null)
  const [preview, setPreview] = useState<SwitchPlanPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [cancelandoAgendamento, setCancelandoAgendamento] = useState(false)

  const carregar = useCallback(() => {
    setLoading(true)
    return Promise.all([
      plansService.getAll(),
      subscriptionService.getStatus(),
    ]).then(([plansData, subData]) => {
      setPlans(plansData)
      setSub(subData)
      /*
        O cartão nasce indisponível quando não dá para pagar nele (#451).

        Antes este estado só existia depois de um clique falhar: a tela oferecia
        o cartão, o dono clicava, levava o 503 e só então lia o aviso. Com a
        api#544 a resposta já diz, e a tela deixa de anunciar um caminho que não
        leva a lugar nenhum.

        `=== false` de propósito: api sem o campo manda `undefined`, e aí o
        certo é continuar oferecendo o cartão — só a negativa explícita impede.
      */
      setStripeIndisponivel(subData.stripeDisponivel === false)
    }).catch(() => {
      toast.error('Não foi possível carregar os planos. Tente novamente.')
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  useEffect(() => {
    if (!trocaPlano) return
    const fecharComEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !confirmando) setTrocaPlano(null)
    }
    window.addEventListener('keydown', fecharComEsc)
    return () => window.removeEventListener('keydown', fecharComEsc)
  }, [trocaPlano, confirmando])

  const podeTrocar = sub ? STATUS_COM_TROCA.includes(sub.status) && !!sub.stripeSubscriptionId : false
  const emTeste = sub?.ehCortesia === true
  const testePertoDoFim = emTeste && testeEstaPertoDoFim(sub?.currentPeriodEnd ?? null)

  const handleAssinar = async (planId: string) => {
    try {
      setPaying(planId)
      const { url } = await subscriptionService.createCheckout(planId)
      if (!url) throw new Error('O pagamento não retornou um endereço de checkout.')
      window.location.assign(url)
    } catch (err) {
      if (ehErroDeStripeIndisponivel(err)) {
        setStripeIndisponivel(true)
      } else {
        toast.error(mensagemDeErro(err, 'Erro ao iniciar pagamento. Tente novamente.'))
      }
      setPaying(null)
    }
  }

  const abrirTroca = async (plano: Plan) => {
    setTrocaPlano(plano)
    setPreview(null)
    setPreviewLoading(true)
    try {
      const result = await subscriptionService.previewSwitch(plano.id)
      setPreview(result)
    } catch (err) {
      if (ehErroDeStripeIndisponivel(err)) {
        setStripeIndisponivel(true)
      } else {
        toast.error(mensagemDeErro(err, 'Não foi possível calcular o efeito da troca.'))
      }
      setTrocaPlano(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const confirmarTroca = async () => {
    if (!trocaPlano) return
    try {
      setConfirmando(true)
      const resultado = await subscriptionService.switchPlan(trocaPlano.id)

      /*
        Downgrade não troca nada agora — é agendado para a virada do ciclo.
        Dizer "plano trocado" aqui e recarregar a tela mostrando o plano antigo
        fazia o dono concluir que o clique não tinha pegado.
      */
      if (resultado.efetivaImediatamente) {
        toast.success(`Plano trocado para ${trocaPlano.nome}.`)
      } else {
        toast.success(
          resultado.valeAPartirDe
            ? `Troca para ${trocaPlano.nome} agendada para ${formatarData(resultado.valeAPartirDe)}.`
            : `Troca para ${trocaPlano.nome} agendada para o fim do ciclo atual.`,
        )
      }

      setTrocaPlano(null)
      setPreview(null)
      carregar()
    } catch (err) {
      if (ehErroDeStripeIndisponivel(err)) {
        setStripeIndisponivel(true)
        setTrocaPlano(null)
        setPreview(null)
      } else {
        toast.error(mensagemDeErro(err, 'Não foi possível trocar de plano. Tente novamente.'))
      }
    } finally {
      setConfirmando(false)
    }
  }

  /**
   * Cancelar um downgrade agendado é trocar de volta para o plano em vigor —
   * a API não tem rota própria para isso, e não precisa: `switch` com o plano
   * atual solta o agendamento sem cobrar nada.
   */
  const cancelarAgendamento = async () => {
    const planoEmVigor = sub?.plan
    if (!planoEmVigor) return
    try {
      setCancelandoAgendamento(true)
      await subscriptionService.switchPlan(planoEmVigor.id)
      toast.success(`Troca cancelada. Você continua no ${planoEmVigor.nome}.`)
      carregar()
    } catch (err) {
      if (ehErroDeStripeIndisponivel(err)) {
        setStripeIndisponivel(true)
      } else {
        toast.error(mensagemDeErro(err, 'Não foi possível cancelar a troca. Tente novamente.'))
      }
    } finally {
      setCancelandoAgendamento(false)
    }
  }

  usePageHeader("Planos", "Compare, assine ou troque de plano.")

  return (
    <>
      <Container>
        {stripeIndisponivel && (
          <PaymentWarning role="alert">
            <AlertTriangle size={20} />
            <div>
              <strong>Pagamento no cartão indisponível</strong>
              <span>
                Ainda não dá para assinar nem trocar de plano no cartão. O Pix, pelo WhatsApp,
                continua funcionando normalmente — e sai mais barato.
              </span>
            </div>
          </PaymentWarning>
        )}

        {testePertoDoFim && sub?.plan && (
          <PaymentWarning role="alert">
            <AlertTriangle size={20} />
            <div>
              <strong>
                {testeEstaVencido(sub.currentPeriodEnd)
                  ? 'Seu teste terminou'
                  : `Seu teste termina em ${formatarData(sub.currentPeriodEnd!)}`}
              </strong>
              <span>Escolha um plano para continuar usando todos os recursos do seu espaço.</span>
            </div>
          </PaymentWarning>
        )}

        {/*
          Sem isto, quem agenda um downgrade volta para uma tela idêntica à de
          antes — plano antigo em vigor, nenhum sinal do agendamento — e conclui
          que a troca falhou.
        */}
        {sub?.trocaAgendada && (
          <ScheduledBox>
            <CalendarClock size={18} />
            <div>
              <strong>Troca agendada para {formatarData(sub.trocaAgendada.valeAPartirDe)}</strong>
              <p>
                Você passa para o {sub.trocaAgendada.plan.nome}
                {' '}({formatarPrecoCentavos(sub.trocaAgendada.plan.precoCentavos)} / mês) nessa data.
                Até lá continua no {sub.plan?.nome ?? 'plano atual'}, com o acesso que já paga.
              </p>
            </div>
            <CancelScheduleBtn
              type="button"
              onClick={cancelarAgendamento}
              disabled={stripeIndisponivel || cancelandoAgendamento}
            >
              {cancelandoAgendamento ? 'Cancelando...' : 'Cancelar troca'}
            </CancelScheduleBtn>
          </ScheduledBox>
        )}

        {/* Sem barra de progresso: barra pressupõe um teto, e nenhum plano tem teto
            desde a api#278. O número segue útil como retrato do espaço — "seis quadras
            em dois estabelecimentos" — e não como cota a estourar. */}
        {sub?.usage && (
          <UsageCard>
            <h2>Seu espaço hoje</h2>
            <UsageGrid>
              <Numero label="Quadras" valor={sub.usage.quadras} />
              <Numero label="Estabelecimentos" valor={sub.usage.estabelecimentos} />
            </UsageGrid>
          </UsageCard>
        )}

        {loading ? (
          <CenteredSpinner>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          </CenteredSpinner>
        ) : (
          plans.length === 0 ? (
            <CenteredSpinner>Nenhum plano está disponível no momento.</CenteredSpinner>
          ) : <PlansGrid>
            {plans.map((plano) => {
              const éAtual = sub?.plan?.id === plano.id
              const éPlanoEmTeste = éAtual && emTeste
              const carregandoEsse = paying === plano.id
              const pix = linkDoPix(plano)

              return (
                <PlanCard key={plano.id} $current={éAtual}>
                  {éAtual && <CurrentBadge>{éPlanoEmTeste && sub?.currentPeriodEnd ? `Teste até ${formatarData(sub.currentPeriodEnd)}` : 'Seu plano atual'}</CurrentBadge>}
                  <PlanName>{plano.nome}</PlanName>
                  {/* O preço em destaque é o do cartão porque é o que o botão
                      logo abaixo cobra: o número maior tem que ser o número que
                      sai da fatura. O do Pix vem em seguida, com o desconto. */}
                  {/* O preço do cartão fica à vista mesmo indisponível: é
                      informação — quanto custará quando der para pagar assim —, e
                      escondê-lo faria a comparação com o Pix sumir junto. O que
                      muda é o peso: sem cartão, o destaque vai para o caminho que
                      funciona. */}
                  <PlanPrice $esmaecido={stripeIndisponivel}>
                    {formatarPrecoCentavos(plano.precoNoCartaoCentavos)}
                    <span> / mês no cartão{stripeIndisponivel ? ' (indisponível)' : ''}</span>
                  </PlanPrice>
                  <PixBox $destaque={stripeIndisponivel}>
                    <strong>
                      {formatarPrecoCentavos(plano.precoCentavos)} / mês no Pix
                    </strong>
                    <span>
                      desconto de {descontoDoPix(plano)}% · confirmação em até 24h
                    </span>
                  </PixBox>
                  {/* O incluso vem primeiro, e depois o que este degrau abre. Sem as
                      duas primeiras linhas o Básico apareceria como um cartão vazio —
                      ele é o plano de entrada, não um plano sem nada. */}
                  <PlanFeatures>
                    {INCLUSO_EM_TODO_PLANO.map((item) => (
                      <li key={item}><Check size={16} /> {item}</li>
                    ))}
                    {ORDEM_DAS_FUNCIONALIDADES.filter((f) => plano.funcionalidades.includes(f)).map((f) => (
                      <li key={f}><Check size={16} /> {ROTULOS_DE_FUNCIONALIDADE[f]}</li>
                    ))}
                  </PlanFeatures>

                  {éPlanoEmTeste ? (
                    <PlanButton
                      onClick={() => handleAssinar(plano.id)}
                      disabled={stripeIndisponivel || carregandoEsse}
                    >
                      {stripeIndisponivel
                        ? 'Cartão indisponível'
                        : carregandoEsse
                          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Aguarde...</>
                          : 'Assinar'}
                    </PlanButton>
                  ) : éAtual ? (
                    <PlanButton $variant="current" disabled>Plano atual</PlanButton>
                  ) : podeTrocar ? (
                    <PlanButton
                      onClick={() => abrirTroca(plano)}
                      disabled={stripeIndisponivel || previewLoading || confirmando}
                    >
                      {/* Desabilitado e mudo faria a pessoa procurar o que ela fez
                          de errado. O rótulo diz o motivo onde ela está olhando. */}
                      {stripeIndisponivel ? 'Cartão indisponível' : 'Trocar para este plano'}
                    </PlanButton>
                  ) : (
                    <PlanButton
                      onClick={() => handleAssinar(plano.id)}
                      disabled={stripeIndisponivel || carregandoEsse}
                    >
                      {stripeIndisponivel
                        ? 'Cartão indisponível'
                        : carregandoEsse
                          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Aguarde...</>
                          : 'Assinar'}
                    </PlanButton>
                  )}

                  {/* O Pix não tem botão de pagamento porque não é pagamento na
                      tela: é conversa. O link some quando não há número
                      configurado — atalho que abre o WhatsApp sem destino faz a
                      pessoa achar que mandou mensagem. */}
                  {(!éAtual || éPlanoEmTeste) && pix && (
                    <PixLink
                      href={pix}
                      target="_blank"
                      rel="noopener noreferrer"
                      $destaque={stripeIndisponivel}
                    >
                      <MessageCircle size={15} aria-hidden />
                      Assinar no Pix pelo WhatsApp
                    </PixLink>
                  )}
                </PlanCard>
              )
            })}
          </PlansGrid>
        )}
      </Container>

      {trocaPlano && (
        <Modal>
          <ModalOverlay onClick={() => !confirmando && setTrocaPlano(null)} />
          <ModalBox role="dialog" aria-modal="true" aria-labelledby="titulo-troca-plano">
            <ModalTitle id="titulo-troca-plano">Trocar para {trocaPlano.nome}</ModalTitle>

            {previewLoading ? (
              <CenteredSpinner>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              </CenteredSpinner>
            ) : preview && (
              <>
                <EffectRow>
                  <span className="label">Quando passa a valer</span>
                  <span className="value">
                    {preview.efetivaImediatamente
                      ? 'Imediatamente'
                      : preview.valeAPartirDe
                        ? `Em ${formatarData(preview.valeAPartirDe)}`
                        : 'No fim do ciclo atual'}
                  </span>
                </EffectRow>
                <EffectRow>
                  <span className="label">Cobrança imediata</span>
                  <span className="value">Nenhuma</span>
                </EffectRow>

                {/*
                  No downgrade não há linha de valor: a troca só vale no fim do
                  ciclo, então nada é cobrado nem creditado. A tela anunciava
                  "crédito estimado na próxima fatura" — prometia um estorno que
                  não acontece.
                */}
                {preview.efetivaImediatamente && (
                  <EffectRow>
                    <span className="label">
                      {preview.tipo === 'upgrade' ? 'Ajuste estimado na próxima fatura' : 'Ajuste na próxima fatura'}
                    </span>
                    <span className="value">
                      {preview.tipo === 'mesmo_preco'
                        ? formatarPrecoCentavos(0)
                        : `≈ ${formatarPrecoCentavos(Math.abs(preview.estimativaCobrancaCentavos))}`}
                    </span>
                  </EffectRow>
                )}

                {!preview.efetivaImediatamente && (
                  <EffectRow>
                    <span className="label">Cobrança ou crédito agora</span>
                    <span className="value">Nenhum</span>
                  </EffectRow>
                )}

                {!preview.efetivaImediatamente && (
                  <WarningBox>
                    <AlertTriangle size={18} />
                    <span>
                      Você continua no {sub?.plan?.nome ?? 'plano atual'} até lá, com o acesso que já paga.
                      Enquanto a troca não valer, dá para cancelá-la voltando para o plano atual.
                    </span>
                  </WarningBox>
                )}

                {/* O que fecha ao descer de degrau. Antes este aviso falava de uso
                    excedendo teto; não há mais teto, e o que o dono precisa saber é
                    qual porta do painel deixa de abrir. */}
                {preview.funcionalidadesPerdidas.length > 0 && (
                  <WarningBox>
                    <AlertTriangle size={18} />
                    <span>
                      No {trocaPlano.nome} você deixa de acessar{' '}
                      {listar(preview.funcionalidadesPerdidas.map((f) => ROTULOS_DE_FUNCIONALIDADE[f].toLowerCase()))}.
                      {' '}Nada é apagado: os dados continuam guardados e voltam a aparecer se você subir de plano de novo.
                    </span>
                  </WarningBox>
                )}
              </>
            )}

            <ModalActions>
              <CancelBtn type="button" onClick={() => setTrocaPlano(null)} disabled={confirmando}>
                Cancelar
              </CancelBtn>
              <ConfirmBtn
                type="button"
                onClick={confirmarTroca}
                disabled={stripeIndisponivel || confirmando || previewLoading}
              >
                {confirmando ? 'Trocando...' : 'Confirmar troca'}
              </ConfirmBtn>
            </ModalActions>
          </ModalBox>
        </Modal>
      )}
    </>
  )
}

/** "a, b e c" — a vírgula do meio e o "e" no fim, como se escreve. */
function listar(itens: string[]): string {
  if (itens.length <= 1) return itens.join('')
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
}

function Numero({ label, valor }: { label: string; valor: number }) {
  return (
    <UsageItem>
      <UsageLabel>{label}</UsageLabel>
      <UsageValue $exceeded={false}>{valor}</UsageValue>
    </UsageItem>
  )
}
