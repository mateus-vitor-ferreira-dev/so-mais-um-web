import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'styled-components'
import { toast } from 'sonner'
import { Gift, Plus } from 'lucide-react'
import { PageActions, usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import StatCard from '../../../components/StatCard'
import { assinaturasDoAdmin } from '../../../services/assinaturasDoAdmin'
import { plansService } from '../../../services/plansService'
import * as adminService from '../../../services/admin'
import { chaves } from '../../../lib/queryClient'
import { ehCortesiaJaConcedida, mensagemDeErro } from '../../../utils/apiError'
import type { AssinaturaDoAdmin } from '../../../types/api'
import {
  Acoes, Ajuda, Aviso, Botao, BotaoConceder, BotaoRegistrar, Campo, Cancelar, Confirmar, Contagem,
  Data, Detalhe, Estado, Filtro, Filtros, Grupo, ModalAcoes, ModalCaixa, ModalFundo, ModalTexto,
  ModalTitulo, Nome, NotaDoFiltro, Numeros, RotuloDeCampo, Selecao, Selo, SemQuebra, Tabela,
} from './styles'
import BuscaDeDono from './BuscaDeDono'
import { FILTROS, numeros, situacao, venceuPorData } from './situacao'
import type { Filtro as IdDoFiltro } from './situacao'
import { formatarPrecoCentavos } from '../../../utils/formatCurrency'
import { dataCurta } from '../../../utils/datas'

const DIA_MS = 24 * 60 * 60 * 1000

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

const dia = (iso: string) => dataCurta(iso)

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

const ORIGEM = {
  MANUAL: { tom: 'manual', rotulo: 'Manual (Pix)' },
  STRIPE: { tom: 'stripe', rotulo: 'Stripe' },
  CORTESIA: { tom: 'cortesia', rotulo: 'Cortesia' },
} as const

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
 * divergência. Em vez de botão desabilitado, a tela diz o motivo por escrito:
 * desabilitado mudo faz quem opera procurar defeito onde há decisão.
 *
 * ## Uma tabela com filtros (web#502)
 *
 * Era uma lista longa de cartões, com o que pede atenção misturado ao que está
 * em dia e o motivo da Stripe repetido em cada linha. Agora os números ficam no
 * topo, a lista abre no filtro do que precisa de atenção quando há alguma, e o
 * motivo da Stripe é dito uma vez, em cima da lista.
 */
export default function AdminSubscriptions() {
  const queryClient = useQueryClient()
  const theme = useTheme()
  const [registrando, setRegistrando] = useState(false)
  const [concedendo, setConcedendo] = useState(false)
  const [renovando, setRenovando] = useState<AssinaturaDoAdmin | null>(null)
  const [encerrando, setEncerrando] = useState<AssinaturaDoAdmin | null>(null)
  const [filtroEscolhido, setFiltroEscolhido] = useState<IdDoFiltro | null>(null)
  const [donoId, setDonoId] = useState('')
  const [erroDoDono, setErroDoDono] = useState('')
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
    setErroDoDono('')
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

  const lista = useMemo(() => assinaturas.data ?? [], [assinaturas.data])
  const total = useMemo(() => numeros(lista), [lista])

  /**
   * O filtro aberto: o que a pessoa escolheu, ou o de atenção quando há alguma.
   *
   * Derivado, e não um `useState` com valor inicial: a lista chega depois da
   * primeira renderização, e um estado inicial decidido antes dela abriria
   * sempre em "Todas".
   */
  const filtro = filtroEscolhido ?? (total.atencao > 0 ? 'atencao' : 'todas')
  const visiveis = useMemo(
    () => lista.filter(FILTROS.find((f) => f.id === filtro)!.aplica),
    [lista, filtro],
  )
  const temStripe = visiveis.some((a) => a.origem === 'STRIPE')

  /**
   * Os donos que ainda cabem numa assinatura nova.
   *
   * Filtrado por e-mail porque a lista de assinaturas não devolve o id do dono
   * — e o e-mail é único na base. Sem isso, o formulário ofereceria alguém que
   * a api recusa com 409 `SUBSCRIPTION_ALREADY_EXISTS`: o erro está certo, mas
   * descobri-lo depois de preencher três campos não.
   */
  const donosDisponiveis = useMemo(() => {
    const jaAssinam = new Set(lista.map((a) => a.owner.email))
    return (donos.data ?? []).filter((dono) => !jaAssinam.has(dono.email))
  }, [donos.data, lista])

  const abrirRenovacao = (assinatura: AssinaturaDoAdmin) => {
    setValidoAte(proximaValidade(assinatura.currentPeriodEnd))
    setRenovando(assinatura)
  }

  const escolherDono = (id: string) => {
    setDonoId(id)
    setErroDoDono('')
  }

  /** O dono não é campo nativo, então o `required` do navegador não o cobre. */
  const donoFaltando = () => {
    if (donoId) return false
    setErroDoDono('Escolha um dono da lista.')
    return true
  }

  const enviarRegistro = (evento: FormEvent) => {
    evento.preventDefault()
    if (!donoFaltando()) registrar.mutate()
  }

  const enviarConcessao = (evento: FormEvent) => {
    evento.preventDefault()
    if (!donoFaltando()) conceder.mutate()
  }

  const enviarRenovacao = (evento: FormEvent) => {
    evento.preventDefault()
    if (renovando) renovar.mutate(renovando.id)
  }

  const campoDoDono = (ajuda: ReactNode) => (
    <Grupo>
      <RotuloDeCampo aria-hidden>Dono</RotuloDeCampo>
      <BuscaDeDono
        donos={donosDisponiveis}
        carregando={donos.isPending}
        donoId={donoId}
        aoEscolher={escolherDono}
        erro={erroDoDono}
      />
      <Ajuda>{ajuda}</Ajuda>
    </Grupo>
  )

  return (
    <div>
      {/*
        Dois botões, e não um formulário com seletor de origem: registrar
        afirma que entrou dinheiro, conceder afirma o contrário, e um
        `<select>` entre as duas coisas é como se erra por um clique.
      */}
      <PageActions>
        <BotaoConceder type="button" onClick={() => setConcedendo(true)}>
          <Gift size={16} aria-hidden />
          Conceder cortesia
        </BotaoConceder>
        <BotaoRegistrar type="button" onClick={() => setRegistrando(true)}>
          <Plus size={16} aria-hidden />
          Registrar assinatura
        </BotaoRegistrar>
      </PageActions>

      <Aviso>
        O Só+1 <strong>não cobra por aqui</strong>: o pagamento é um Pix combinado por fora, e esta
        tela registra que ele chegou. Ela não gera cobrança, QR nem link.
      </Aviso>

      {assinaturas.isPending ? (
        <Estado>Carregando assinaturas…</Estado>
      ) : assinaturas.isError ? (
        <Estado role="alert">Não foi possível carregar as assinaturas.</Estado>
      ) : lista.length === 0 ? (
        <Estado>
          Nenhuma assinatura ainda. Quando o primeiro Pix chegar, registre-o aqui.
        </Estado>
      ) : (
        <>
          <Numeros>
            <StatCard label="Ativas" value={total.ativas} accent={theme.colors.primary} />
            <StatCard label="Precisam de atenção" value={total.atencao} accent={theme.colors.warning} />
            <StatCard label="Cortesias em curso" value={total.cortesias} accent={theme.colors.accent} />
            <StatCard
              label="Receita manual do mês"
              value={formatarPrecoCentavos(total.receitaManualCentavos)}
              accent={theme.colors.info}
            />
          </Numeros>

          <Filtros role="tablist" aria-label="Filtrar assinaturas">
            {FILTROS.map(({ id, rotulo, aplica }) => {
              const quantas = lista.filter(aplica).length
              return (
                <Filtro
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filtro === id}
                  $ativo={filtro === id}
                  onClick={() => setFiltroEscolhido(id)}
                >
                  {rotulo}
                  <Contagem $alerta={id === 'atencao' && quantas > 0}>{quantas}</Contagem>
                </Filtro>
              )
            })}
          </Filtros>

          <div role="tabpanel">
            {filtro === 'atencao' && visiveis.length > 0 && (
              <NotaDoFiltro $tom="alerta" role="status">
                Nem a manual nem a cortesia se renovam sozinhas: vencida, o dono perde o acesso sem
                ninguém ser avisado, e no fim de uma cortesia é a conversa de venda que passa junto.
              </NotaDoFiltro>
            )}
            {temStripe && (
              <NotaDoFiltro>
                As da Stripe não têm ações: o que vale é o que está lá. Mexer aqui criaria uma
                divergência que o próximo webhook desfaz sem avisar.
              </NotaDoFiltro>
            )}

            {visiveis.length === 0 ? (
              <Estado>
                {filtro === 'atencao'
                  ? 'Nada precisa de atenção agora.'
                  : 'Nenhuma assinatura neste filtro.'}
              </Estado>
            ) : (
              <Tabela>
                <thead>
                  <tr>
                    <th scope="col">Dono</th>
                    <th scope="col">Estabelecimento</th>
                    <th scope="col">Plano</th>
                    <th scope="col">Origem</th>
                    <th scope="col">Situação</th>
                    <th scope="col">Validade</th>
                    <th scope="col" aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((assinatura) => (
                    <LinhaDaAssinatura
                      key={assinatura.id}
                      assinatura={assinatura}
                      aoRenovar={abrirRenovacao}
                      aoEncerrar={setEncerrando}
                    />
                  ))}
                </tbody>
              </Tabela>
            )}
          </div>
        </>
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
              {campoDoDono('Só aparecem donos sem assinatura. Para estender a de quem já tem, use Renovar.')}

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
                        {plano.nome} — {formatarPrecoCentavos(plano.precoCentavos)}
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
              {campoDoDono(
                <>
                  Cortesia é <strong>uma por dono</strong>. Quem já teve é recusado, com a data da
                  primeira — e a busca só mostra quem ainda não tem assinatura nenhuma.
                </>,
              )}

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

interface PropsDaLinha {
  assinatura: AssinaturaDoAdmin
  aoRenovar: (assinatura: AssinaturaDoAdmin) => void
  aoEncerrar: (assinatura: AssinaturaDoAdmin) => void
}

/** Uma assinatura: linha da tabela no computador, cartão no celular. */
function LinhaDaAssinatura({ assinatura, aoRenovar, aoEncerrar }: PropsDaLinha) {
  const { tom, rotulo } = situacao(assinatura)
  const manual = assinatura.origem === 'MANUAL'
  const cortesia = assinatura.origem === 'CORTESIA'
  const origem = ORIGEM[assinatura.origem]

  return (
    <tr>
      <td className="dono">
        <Nome>{assinatura.owner.name}</Nome>
        <Detalhe title={assinatura.owner.email}>{assinatura.owner.email}</Detalhe>
      </td>
      <td data-rotulo="Estabelecimento">
        {assinatura.place?.name ?? 'Sem estabelecimento cadastrado'}
      </td>
      <td data-rotulo="Plano">
        <span>
          {assinatura.planName}
          {/*
            Três origens, três afirmações diferentes sobre dinheiro.

            Na cortesia o número não descreve dinheiro que entrou, e mostrá-lo
            do mesmo jeito faria a linha afirmar um recebimento que não houve. O
            plano continua dito porque é ele que decide o que o dono abre.

            Nas outras duas o número é sempre o LÍQUIDO — o que a plataforma
            recebe —, e desde a api#539 ele deixou de ser o único preço: o
            cartão cobra o bruto, para o líquido chegar inteiro depois da taxa.
            Na manual não há ambiguidade, o Pix cai inteiro e os dois números
            são o mesmo. Na Stripe, este painel diria R$ 189,90 enquanto a
            fatura do dono diz R$ 199,90 — dois números do mesmo produto, sem
            explicação.

            Rotular, não trocar: receita é o que entra, e é isso que se olha
            aqui. O bruto não aparece porque a taxa mora na api
            (`plans/precoNoCartao.ts`) — refazer a conta aqui é como os dois
            lados passam a discordar (#449).
          */}
          <Detalhe>
            {cortesia ? (
              'cortesia, sem cobrança'
            ) : (
              <>
                <SemQuebra>R$ {assinatura.monthlyValue}/mês</SemQuebra>
                {!manual && ' recebidos (o cartão cobra mais, com a taxa)'}
              </>
            )}
          </Detalhe>
        </span>
      </td>
      <td data-rotulo="Origem">
        <span><Selo $tom={origem.tom}>{origem.rotulo}</Selo></span>
      </td>
      <td data-rotulo="Situação">
        <span><Selo $tom={tom}>{rotulo}</Selo></span>
      </td>
      <td data-rotulo="Validade">
        <span>
          {assinatura.currentPeriodEnd
            ? <SemQuebra>{cortesia ? 'teste até' : 'vale até'} {dia(assinatura.currentPeriodEnd)}</SemQuebra>
            : venceuPorData(assinatura)
              /* Nunca vazio nas que vencem por data: sem data não valem acesso
                 nenhum, e um traço no lugar esconderia justamente o registro
                 que ficou pela metade. */
              ? 'sem validade registrada — assim ela não vale acesso'
              : 'a Stripe não informou vencimento'}
          {assinatura.registradaPor && (
            <Detalhe>
              {/* O mesmo campo, e a origem é que diz qual afirmação foi feita:
                  na manual alguém afirma ter recebido, na cortesia alguém
                  afirma ter concedido. */}
              {cortesia ? 'Concedida por' : 'Registrada por'} {assinatura.registradaPor}
              {assinatura.registradaEm && ` em ${dia(assinatura.registradaEm)}`}
            </Detalhe>
          )}
        </span>
      </td>
      <td className="acoes">
        {(manual || (cortesia && assinatura.status !== 'canceled')) && (
          <Acoes>
            {manual && (
              <Botao type="button" onClick={() => aoRenovar(assinatura)}>
                Renovar
              </Botao>
            )}
            {/*
              Cortesia não tem Renovar, e a api recusa: renovar um mês concedido
              é conceder mais tempo grátis, e cortesia é uma por dono. Encerrar
              ela tem — teste concedido por engano precisa ter volta.
            */}
            {assinatura.status !== 'canceled' && (
              <Botao type="button" $perigo onClick={() => aoEncerrar(assinatura)}>
                Encerrar
              </Botao>
            )}
          </Acoes>
        )}
      </td>
    </tr>
  )
}
