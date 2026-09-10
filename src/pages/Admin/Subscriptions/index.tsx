import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, Gift, Plus } from 'lucide-react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { assinaturasDoAdmin } from '../../../services/assinaturasDoAdmin'
import { plansService } from '../../../services/plansService'
import * as adminService from '../../../services/admin'
import { chaves } from '../../../lib/queryClient'
import { ehCortesiaJaConcedida, mensagemDeErro } from '../../../utils/apiError'
import type { AssinaturaDoAdmin } from '../../../types/api'
import {
  Acoes, Ajuda, Atencao, Aviso, Botao, BotaoConceder, BotaoRegistrar, BotoesDoTopo, Campo,
  Cancelar, Confirmar, Dados, Data, Detalhe, Estado, Grupo, Linha, Lista, ModalAcoes, ModalCaixa,
  ModalFundo, ModalTexto, ModalTitulo, Nome, Selecao, Selo, Selos, Topo, Travado,
} from './styles'
import type { TomDeSelo } from './styles'

const DIA_MS = 24 * 60 * 60 * 1000

/**
 * A janela em que uma assinatura manual já conta como problema.
 *
 * Espelha o `ASSINATURA_EXPIRANDO_DIAS` do `admin.service` da api, que é o que
 * alimenta o "Vencendo" da Visão Geral. Se um mudar, o outro tem que mudar
 * junto — dois números diferentes fariam o painel contar quatro e esta tela
 * apontar três.
 */
const DIAS_DE_ALERTA = 7

/** Um mês, que é o combinado do Pix. Só o padrão do campo: dá para trocar. */
const VALIDADE_PADRAO_DIAS = 30

const doisDigitos = (n: number) => String(n).padStart(2, '0')

/**
 * `Date` → `"AAAA-MM-DD"` para o `input[type=date]`.
 *
 * Pelos campos **locais**, e não por `toISOString()`: o ISO é UTC, e às 21h de
 * Lavras ele já diz o dia seguinte — o campo abriria um dia à frente do que a
 * pessoa vê no calendário, e o `min` recusaria uma data que parece válida.
 */
const paraCampoDeData = (data: Date) =>
  `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`

const daquiADias = (dias: number) => paraCampoDeData(new Date(Date.now() + dias * DIA_MS))

const dia = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

/**
 * A validade que a renovação sugere: um mês a partir do que ainda vale.
 *
 * Renovar é somar um mês ao que foi pago, não recomeçar a contar de hoje —
 * quem paga com uma semana de sobra não pode perder a semana. Se a validade já
 * passou (ou nunca houve), a contagem recomeça de hoje mesmo.
 *
 * Fora do componente porque o `Date.now()` é impuro, e o lint recusa chamá-lo
 * lá dentro — com razão: aqui ele fica onde não corre a cada render.
 */
const proximaValidade = (validadeAtual: string | null) => {
  const fim = validadeAtual ? new Date(validadeAtual).getTime() : 0
  return paraCampoDeData(new Date(Math.max(fim, Date.now()) + VALIDADE_PADRAO_DIAS * DIA_MS))
}

const diasAte = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / DIA_MS)

/** Os status que vêm da Stripe, em português. */
const STATUS_DA_STRIPE: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Em teste',
  past_due: 'Pagamento atrasado',
  canceled: 'Cancelada',
  inactive: 'Inativa',
}

/**
 * O selo de situação de uma assinatura.
 *
 * Quem decide se ela vale é a api, no campo `emDia` — a regra depende da origem
 * e vive no `subscriptions/vigencia.ts`. Aqui só se escolhe a palavra e a cor;
 * recalcular a regra deixaria duas cópias dela para discordarem no primeiro
 * ajuste.
 */
/**
 * As origens em que quem manda é a data escrita à mão — espelha o
 * `VENCEM_POR_DATA` do `vigencia.ts` da api (#551).
 */
const venceuPorData = (a: AssinaturaDoAdmin) => a.origem === 'MANUAL' || a.origem === 'CORTESIA'

function situacao(assinatura: AssinaturaDoAdmin): { tom: TomDeSelo; rotulo: string } {
  if (!venceuPorData(assinatura)) {
    return {
      tom: assinatura.emDia ? 'ok' : 'erro',
      rotulo: STATUS_DA_STRIPE[assinatura.status] ?? assinatura.status,
    }
  }

  if (assinatura.status === 'canceled') return { tom: 'neutro', rotulo: 'Encerrada' }
  if (!assinatura.emDia) {
    // "Teste acabado" e não "Vencida": ninguém deixou de pagar nada, o mês
    // simplesmente terminou — e é o fim esperado de toda cortesia.
    return { tom: 'erro', rotulo: assinatura.origem === 'CORTESIA' ? 'Teste acabado' : 'Vencida' }
  }

  const dias = assinatura.currentPeriodEnd ? diasAte(assinatura.currentPeriodEnd) : null
  if (dias !== null && dias <= DIAS_DE_ALERTA) {
    return { tom: 'alerta', rotulo: `Vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}` }
  }

  return { tom: 'ok', rotulo: 'Em dia' }
}

/**
 * Precisa de alguém agora.
 *
 * A da Stripe fica de fora: ela tem webhook, e um cartão recusado lá vira
 * `past_due` sozinho e volta sozinho. A manual não tem ninguém — se a data
 * passar, o dono perde acesso e o primeiro a saber é ele.
 *
 * **A cortesia entra junto, e é a que mais precisa** (web#456): o fim do teste
 * é o único momento com data marcada em que a conversa de venda tem que
 * acontecer, e ele passa sozinho se ninguém abrir esta tela.
 *
 * Encerrada fica de fora de propósito: alguém já decidiu que aquela acabou.
 */
const precisaDeAtencao = (a: AssinaturaDoAdmin) =>
  venceuPorData(a) &&
  a.status !== 'canceled' &&
  (!a.emDia || (a.currentPeriodEnd !== null && diasAte(a.currentPeriodEnd) <= DIAS_DE_ALERTA))

/**
 * As assinaturas do Só+1, e o registro do Pix que chegou por fora (web#445, api#537).
 *
 * ## Esta tela não cobra
 *
 * Enquanto não há CNPJ não há Stripe, e a cobrança acontece por fora: Pix
 * combinado no WhatsApp, recebido no CPF. Não há QR, link de pagamento nem
 * conciliação aqui — alguém recebeu e está afirmando que recebeu; a tela grava
 * a afirmação, com o nome de quem afirmou. Mesma forma da mensalidade do aluno
 * (decisão 1 do épico api#444).
 *
 * ## A da Stripe aparece e não se toca
 *
 * Origem Stripe é espelho do que acontece lá. Editar daqui criaria divergência
 * que o próximo webhook desfaz sem avisar — e sem avisar é o problema, não a
 * divergência. Em vez de botão desabilitado, a linha diz o motivo por escrito:
 * desabilitado mudo faz quem opera procurar defeito onde há decisão.
 */
export default function AdminSubscriptions() {
  const queryClient = useQueryClient()
  const [registrando, setRegistrando] = useState(false)
  const [concedendo, setConcedendo] = useState(false)
  const [renovando, setRenovando] = useState<AssinaturaDoAdmin | null>(null)
  const [encerrando, setEncerrando] = useState<AssinaturaDoAdmin | null>(null)
  const [donoId, setDonoId] = useState('')
  const [planoId, setPlanoId] = useState('')
  const [validoAte, setValidoAte] = useState(() => daquiADias(VALIDADE_PADRAO_DIAS))

  usePageHeader('Assinaturas', 'Quem assina o Só+1 — e o registro do Pix que chegou por fora')

  const assinaturas = useQuery({
    queryKey: chaves.assinaturasDoAdmin(),
    queryFn: assinaturasDoAdmin.listar,
  })

  // Só quando o formulário abre: quem entrou para conferir vencimento não
  // precisa da base de usuários inteira.
  const donos = useQuery({
    queryKey: chaves.usuariosDoAdmin('OWNER'),
    queryFn: () => adminService.listUsers('OWNER').then((r) => r.data.data),
    enabled: registrando || concedendo,
  })
  const planos = useQuery({
    queryKey: chaves.planos(),
    queryFn: plansService.getAll,
    enabled: registrando || concedendo,
  })

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: chaves.assinaturasDoAdmin() })

  /**
   * `mensagemDeErro`, e não `toastErroDeApi`: aquele oferece um botão "Assinar"
   * que leva a `/owner/plans`. Quem está aqui é o admin registrando a
   * assinatura de outra pessoa — mandá-lo para a própria tela de planos seria
   * um beco.
   */
  const aoFalhar = (padrao: string) => (erro: unknown) =>
    toast.error(mensagemDeErro(erro, padrao))

  const fecharFormulario = () => {
    setRegistrando(false)
    setConcedendo(false)
    setDonoId('')
    setPlanoId('')
    setValidoAte(daquiADias(VALIDADE_PADRAO_DIAS))
  }

  const registrar = useMutation({
    mutationFn: () => assinaturasDoAdmin.registrar({ userId: donoId, planId: planoId, validoAte }),
    onSuccess: () => {
      toast.success('Assinatura registrada.')
      fecharFormulario()
      void invalidar()
    },
    onError: aoFalhar('Não foi possível registrar a assinatura.'),
  })

  const conceder = useMutation({
    mutationFn: () => assinaturasDoAdmin.conceder({ userId: donoId, planId: planoId, validoAte }),
    onSuccess: () => {
      toast.success('Cortesia concedida.')
      fecharFormulario()
      void invalidar()
    },
    /**
     * O 409 de cortesia já concedida **não é falha** — é resposta, e a api já
     * manda a data da primeira dentro da mensagem.
     *
     * Por isso ele sai como aviso e não como erro, e o formulário **fica
     * aberto**: a ação seguinte de quem leu isso é escolher outro dono, e
     * fechar o modal a obrigaria a começar de novo.
     */
    onError: (erro: unknown) => {
      if (ehCortesiaJaConcedida(erro)) {
        toast.warning(mensagemDeErro(erro, 'Este dono já teve um mês de cortesia.'))
        return
      }
      toast.error(mensagemDeErro(erro, 'Não foi possível conceder a cortesia.'))
    },
  })

  const renovar = useMutation({
    mutationFn: (id: string) => assinaturasDoAdmin.renovar(id, validoAte),
    onSuccess: () => {
      toast.success('Validade estendida.')
      setRenovando(null)
      void invalidar()
    },
    onError: aoFalhar('Não foi possível renovar a assinatura.'),
  })

  const encerrar = useMutation({
    mutationFn: (id: string) => assinaturasDoAdmin.encerrar(id),
    onSuccess: () => {
      toast.success('Assinatura encerrada.')
      setEncerrando(null)
      void invalidar()
    },
    onError: aoFalhar('Não foi possível encerrar a assinatura.'),
  })

  const atencao = useMemo(
    () => (assinaturas.data ?? []).filter(precisaDeAtencao),
    [assinaturas.data],
  )

  /**
   * Os donos que ainda cabem numa assinatura nova.
   *
   * Filtrado por e-mail porque a lista de assinaturas não devolve o id do dono
   * — e o e-mail é único na base. Sem isso, o formulário ofereceria alguém que
   * a api recusa com 409 `SUBSCRIPTION_ALREADY_EXISTS`: o erro está certo, mas
   * descobri-lo depois de preencher três campos não.
   */
  const donosDisponiveis = useMemo(() => {
    const jaAssinam = new Set((assinaturas.data ?? []).map((a) => a.owner.email))
    return (donos.data ?? []).filter((dono) => !jaAssinam.has(dono.email))
  }, [donos.data, assinaturas.data])

  const abrirRenovacao = (assinatura: AssinaturaDoAdmin) => {
    setValidoAte(proximaValidade(assinatura.currentPeriodEnd))
    setRenovando(assinatura)
  }

  const enviarRegistro = (evento: FormEvent) => {
    evento.preventDefault()
    registrar.mutate()
  }

  const enviarConcessao = (evento: FormEvent) => {
    evento.preventDefault()
    conceder.mutate()
  }

  const enviarRenovacao = (evento: FormEvent) => {
    evento.preventDefault()
    if (renovando) renovar.mutate(renovando.id)
  }

  return (
    <div>
      <Topo>
        <Aviso>
          O Só+1 <strong>não cobra por aqui</strong>. Enquanto não há gateway, o pagamento é um
          Pix combinado por fora; esta tela registra que ele chegou, e quem registrou. Ela não
          gera cobrança, QR nem link.
        </Aviso>
        {/*
          Dois botões, e não um formulário com seletor de origem: registrar
          afirma que entrou dinheiro, conceder afirma o contrário, e um
          `<select>` entre as duas coisas é como se erra por um clique.
        */}
        <BotoesDoTopo>
          <BotaoConceder type="button" onClick={() => setConcedendo(true)}>
            <Gift size={16} aria-hidden />
            Conceder cortesia
          </BotaoConceder>
          <BotaoRegistrar type="button" onClick={() => setRegistrando(true)}>
            <Plus size={16} aria-hidden />
            Registrar assinatura
          </BotaoRegistrar>
        </BotoesDoTopo>
      </Topo>

      {atencao.length > 0 && (
        <Atencao role="status">
          <AlertTriangle size={18} aria-hidden />
          <span>
            <strong>
              {atencao.length === 1
                ? '1 assinatura precisa de atenção'
                : `${atencao.length} assinaturas precisam de atenção`}
            </strong>
            {': '}
            {atencao.map((a) => a.owner.name).join(', ')}. Nem a manual nem a cortesia se
            renovam sozinhas — vencida, o dono perde o acesso sem ninguém ser avisado, e no
            fim de uma cortesia é a conversa de venda que passa junto.
          </span>
        </Atencao>
      )}

      {assinaturas.isPending ? (
        <Estado>Carregando assinaturas…</Estado>
      ) : assinaturas.isError ? (
        <Estado role="alert">Não foi possível carregar as assinaturas.</Estado>
      ) : assinaturas.data.length === 0 ? (
        <Estado>
          Nenhuma assinatura ainda. Quando o primeiro Pix chegar, registre-o aqui.
        </Estado>
      ) : (
        <Lista>
          {assinaturas.data.map((assinatura) => {
            const { tom, rotulo } = situacao(assinatura)
            const manual = assinatura.origem === 'MANUAL'
            const cortesia = assinatura.origem === 'CORTESIA'
            return (
              <Linha key={assinatura.id}>
                <Dados>
                  <Nome>{assinatura.owner.name}</Nome>
                  <Detalhe>
                    {assinatura.place?.name ?? 'Sem estabelecimento cadastrado'} ·{' '}
                    {assinatura.owner.email}
                  </Detalhe>
                  <Detalhe>
                    {assinatura.planName} ·{' '}
                    {/*
                      Três origens, três afirmações diferentes sobre dinheiro.

                      Na cortesia o número não descreve dinheiro que entrou, e
                      mostrá-lo do mesmo jeito faria a linha afirmar um
                      recebimento que não houve. O plano continua dito porque é
                      ele que decide o que o dono abre.

                      Nas outras duas o número é sempre o LÍQUIDO — o que a
                      plataforma recebe —, e desde a api#539 ele deixou de ser o
                      único preço: o cartão cobra o bruto, para o líquido chegar
                      inteiro depois da taxa. Na manual não há ambiguidade, o Pix
                      cai inteiro e os dois números são o mesmo. Na Stripe, este
                      painel diria R$ 189,90 enquanto a fatura do dono diz
                      R$ 199,90 — dois números do mesmo produto, sem explicação, e
                      quem opera não teria como saber se está vendo arredondamento,
                      plano antigo ou desconto.

                      Rotular, não trocar: receita é o que entra, e é isso que se
                      olha aqui. O bruto não aparece porque a taxa mora na api
                      (`plans/precoNoCartao.ts`) — refazer a conta aqui é como os
                      dois lados passam a discordar (#449).
                    */}
                    {cortesia
                      ? 'cortesia, sem cobrança'
                      : `R$ ${assinatura.monthlyValue}/mês${manual ? '' : ' recebidos (o cartão cobra mais, com a taxa)'}`}{' '}
                    ·{' '}
                    {assinatura.currentPeriodEnd
                      ? `${cortesia ? 'teste até' : 'vale até'} ${dia(assinatura.currentPeriodEnd)}`
                      : venceuPorData(assinatura)
                        /* Nunca vazio nas que vencem por data: sem data não valem
                           acesso nenhum, e um traço no lugar esconderia justamente o
                           registro que ficou pela metade. */
                        ? 'sem validade registrada — assim ela não vale acesso'
                        : 'a Stripe não informou vencimento'}
                  </Detalhe>
                  {assinatura.registradaPor && (
                    <Detalhe>
                      {/* O mesmo campo, e a origem é que diz qual afirmação foi
                          feita: na manual alguém afirma ter recebido, na cortesia
                          alguém afirma ter concedido. */}
                      {cortesia ? 'Concedida por' : 'Registrada por'} {assinatura.registradaPor}
                      {assinatura.registradaEm && ` em ${dia(assinatura.registradaEm)}`}
                    </Detalhe>
                  )}
                  <Selos>
                    <Selo $tom={cortesia ? 'cortesia' : manual ? 'manual' : 'stripe'}>
                      {cortesia ? 'Cortesia' : manual ? 'Manual (Pix)' : 'Stripe'}
                    </Selo>
                    <Selo $tom={tom}>{rotulo}</Selo>
                  </Selos>
                </Dados>

                <Acoes>
                  {manual && (
                    <Botao type="button" onClick={() => abrirRenovacao(assinatura)}>
                      Renovar
                    </Botao>
                  )}
                  {/*
                    Cortesia não tem Renovar, e a api recusa: renovar um mês
                    concedido é conceder mais tempo grátis, e cortesia é uma por
                    dono. Encerrar ela tem — teste concedido por engano precisa
                    ter volta.
                  */}
                  {venceuPorData(assinatura) && assinatura.status !== 'canceled' && (
                    <Botao type="button" $perigo onClick={() => setEncerrando(assinatura)}>
                      Encerrar
                    </Botao>
                  )}
                  {!venceuPorData(assinatura) && (
                    <Travado>
                      Cobrada pela Stripe: o que vale é o que está lá. Mexer aqui criaria uma
                      divergência que o próximo webhook desfaz sem avisar.
                    </Travado>
                  )}
                </Acoes>
              </Linha>
            )
          })}
        </Lista>
      )}

      {registrando && (
        <ModalFundo>
          <ModalCaixa role="dialog" aria-modal="true" aria-label="Registrar assinatura">
            <ModalTitulo>Registrar assinatura</ModalTitulo>
            <ModalTexto>
              Para o dono que já mandou o Pix. Nada é cobrado agora: isto grava que o dinheiro
              chegou, e o seu nome fica no registro.
            </ModalTexto>
            <form onSubmit={enviarRegistro}>
              <Grupo>
                <Campo>
                  Dono
                  <Selecao
                    required
                    value={donoId}
                    onChange={(evento) => setDonoId(evento.target.value)}
                  >
                    <option value="">
                      {donos.isPending ? 'Carregando donos…' : 'Escolha o dono'}
                    </option>
                    {donosDisponiveis.map((dono) => (
                      <option key={dono.id} value={dono.id}>
                        {dono.name} — {dono.email}
                      </option>
                    ))}
                  </Selecao>
                </Campo>
                <Ajuda>
                  Só aparecem donos sem assinatura. Para estender a de quem já tem, use Renovar.
                </Ajuda>
              </Grupo>

              <Grupo>
                <Campo>
                  Plano
                  <Selecao
                    required
                    value={planoId}
                    onChange={(evento) => setPlanoId(evento.target.value)}
                  >
                    <option value="">
                      {planos.isPending ? 'Carregando planos…' : 'Escolha o plano'}
                    </option>
                    {(planos.data ?? []).map((plano) => (
                      <option key={plano.id} value={plano.id}>
                        {plano.nome} — R$ {(plano.precoCentavos / 100).toFixed(2).replace('.', ',')}
                      </option>
                    ))}
                  </Selecao>
                </Campo>
              </Grupo>

              <Grupo>
                <Campo>
                  Válido até
                  <Data
                    type="date"
                    required
                    /* Amanhã, e não hoje: a api exige data no futuro, e uma data
                       de hoje chega lá como a meia-noite que já passou. */
                    min={daquiADias(1)}
                    value={validoAte}
                    onChange={(evento) => setValidoAte(evento.target.value)}
                  />
                </Campo>
                <Ajuda>
                  Assinatura manual vence por data — não há webhook para vencê-la. Depois desta
                  data o dono perde o acesso.
                </Ajuda>
              </Grupo>

              <ModalAcoes>
                <Cancelar type="button" onClick={fecharFormulario}>
                  Cancelar
                </Cancelar>
                <Confirmar type="submit" disabled={registrar.isPending}>
                  {registrar.isPending ? 'Registrando…' : 'Registrar'}
                </Confirmar>
              </ModalAcoes>
            </form>
          </ModalCaixa>
        </ModalFundo>
      )}

      {concedendo && (
        <ModalFundo>
          <ModalCaixa role="dialog" aria-modal="true" aria-label="Conceder cortesia">
            <ModalTitulo>Conceder cortesia</ModalTitulo>
            <ModalTexto>
              Um mês para o dono <strong>experimentar antes de pagar</strong>. Nada é cobrado, e
              isto <strong>não entra na Receita Mensal</strong> — o seu nome fica no registro de
              quem concedeu.
            </ModalTexto>
            <form onSubmit={enviarConcessao}>
              <Grupo>
                <Campo>
                  Dono
                  <Selecao
                    required
                    value={donoId}
                    onChange={(evento) => setDonoId(evento.target.value)}
                  >
                    <option value="">
                      {donos.isPending ? 'Carregando donos…' : 'Escolha o dono'}
                    </option>
                    {donosDisponiveis.map((dono) => (
                      <option key={dono.id} value={dono.id}>
                        {dono.name} — {dono.email}
                      </option>
                    ))}
                  </Selecao>
                </Campo>
                <Ajuda>
                  Cortesia é <strong>uma por dono</strong>. Quem já teve é recusado, com a data
                  da primeira — e a lista só mostra quem ainda não tem assinatura nenhuma.
                </Ajuda>
              </Grupo>

              <Grupo>
                <Campo>
                  Plano
                  <Selecao
                    required
                    value={planoId}
                    onChange={(evento) => setPlanoId(evento.target.value)}
                  >
                    <option value="">
                      {planos.isPending ? 'Carregando planos…' : 'Escolha o plano'}
                    </option>
                    {(planos.data ?? []).map((plano) => (
                      <option key={plano.id} value={plano.id}>
                        {plano.nome}
                      </option>
                    ))}
                  </Selecao>
                </Campo>
                <Ajuda>
                  O preço não aparece aqui de propósito: o plano decide o que o dono abre, e
                  nada será cobrado.
                </Ajuda>
              </Grupo>

              <Grupo>
                <Campo>
                  Teste até
                  <Data
                    type="date"
                    required
                    min={daquiADias(1)}
                    value={validoAte}
                    onChange={(evento) => setValidoAte(evento.target.value)}
                  />
                </Campo>
                <Ajuda>
                  Um mês por padrão, e dá para trocar. Depois desta data o dono perde o acesso —
                  vale a pena falar com ele antes.
                </Ajuda>
              </Grupo>

              <ModalAcoes>
                <Cancelar type="button" onClick={fecharFormulario}>
                  Cancelar
                </Cancelar>
                <Confirmar type="submit" disabled={conceder.isPending}>
                  {conceder.isPending ? 'Concedendo…' : 'Conceder'}
                </Confirmar>
              </ModalAcoes>
            </form>
          </ModalCaixa>
        </ModalFundo>
      )}

      {renovando && (
        <ModalFundo>
          <ModalCaixa role="dialog" aria-modal="true" aria-label="Renovar assinatura">
            <ModalTitulo>Renovar assinatura</ModalTitulo>
            <ModalTexto>
              Estender a validade de <strong>{renovando.owner.name}</strong>, no plano{' '}
              {renovando.planName}. O plano não muda aqui.
            </ModalTexto>
            <form onSubmit={enviarRenovacao}>
              <Campo>
                Válido até
                <Data
                  type="date"
                  required
                  min={daquiADias(1)}
                  value={validoAte}
                  onChange={(evento) => setValidoAte(evento.target.value)}
                />
              </Campo>
              <ModalAcoes>
                <Cancelar type="button" onClick={() => setRenovando(null)}>
                  Cancelar
                </Cancelar>
                <Confirmar type="submit" disabled={renovar.isPending}>
                  {renovar.isPending ? 'Renovando…' : 'Renovar'}
                </Confirmar>
              </ModalAcoes>
            </form>
          </ModalCaixa>
        </ModalFundo>
      )}

      {encerrando && (
        <ModalFundo>
          <ModalCaixa role="dialog" aria-modal="true" aria-label="Encerrar assinatura">
            <ModalTitulo>Encerrar assinatura</ModalTitulo>
            <ModalTexto>
              <strong>{encerrando.owner.name}</strong> perde o acesso às áreas do plano. O
              histórico fica: como o dinheiro não passou por gateway nenhum, este registro é a
              única memória de que ele pagou. Se o Pix voltar, é só renovar.
            </ModalTexto>
            <ModalAcoes>
              <Cancelar type="button" onClick={() => setEncerrando(null)}>
                Cancelar
              </Cancelar>
              <Confirmar
                type="button"
                $perigo
                disabled={encerrar.isPending}
                onClick={() => encerrar.mutate(encerrando.id)}
              >
                {encerrar.isPending ? 'Encerrando…' : 'Encerrar'}
              </Confirmar>
            </ModalAcoes>
          </ModalCaixa>
        </ModalFundo>
      )}
    </div>
  )
}
