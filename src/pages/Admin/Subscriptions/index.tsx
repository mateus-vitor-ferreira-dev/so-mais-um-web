import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'styled-components'
import { toast } from 'sonner'
import { Copy, Gift, Plus } from 'lucide-react'
import { PageActions, usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import StatCard from '../../../components/StatCard'
import { assinaturasDoAdmin } from '../../../services/assinaturasDoAdmin'
import { plansService } from '../../../services/plansService'
import * as adminService from '../../../services/admin'
import { chaves } from '../../../lib/queryClient'
import { codigoDeErro, mensagemDeErro } from '../../../utils/apiError'
import type { AssinaturaDoAdmin, ConviteDeCortesia } from '../../../types/api'
import {
  Acoes, Ajuda, Aviso, Botao, BotaoConceder, BotaoRegistrar, Campo, Cancelar, Confirmar, Contagem,
  Data, Detalhe, Estado, Filtro, Filtros, Grupo, ModalAcoes, ModalCaixa, ModalFundo, ModalTexto,
  ModalTitulo, Nome, NotaDoFiltro, Numeros, RotuloDeCampo, Selecao, Selo, SemQuebra, Tabela,
} from './styles'
import BuscaDeDono from './BuscaDeDono'
import EmailDoDono from './EmailDoDono'
import { oQueAcontece } from './previsaoDaCortesia'
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
 * Quantos dias de cortesia a data do campo dá, contando de hoje.
 *
 * É a mesma conta da api (#597): no convite, a data vira duração, e a duração
 * recomeça no dia do cadastro. Fora do componente pelo `Date.now()`.
 */
const diasAteACampo = (campo: string) => {
  const [ano, mes, diaDoMes] = campo.split('-').map(Number)
  if (!ano || !mes || !diaDoMes) return 0
  const hoje = new Date(Date.now())
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime()
  return Math.round((new Date(ano, mes - 1, diaDoMes).getTime() - inicio) / DIA_MS)
}

/**
 * As recusas da cortesia que são resposta, e não falha (web#456, web#503).
 *
 * Todas pedem a mesma coisa de quem leu: trocar o e-mail ou o dono. Por isso
 * saem dentro do modal, com o formulário aberto, e a mensagem é a da api, que
 * sabe a data da primeira cortesia e até quando o convite pendente vale.
 */
const RECUSAS_DA_CORTESIA = [
  'CORTESIA_JA_CONCEDIDA',
  'USER_IS_NOT_OWNER',
  'CONVITE_DE_CORTESIA_PENDENTE',
  'SUBSCRIPTION_ALREADY_EXISTS',
]

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
  const [emailDoDono, setEmailDoDono] = useState('')
  const [recusaDaCortesia, setRecusaDaCortesia] = useState('')
  const [erroDoDono, setErroDoDono] = useState('')
  const [planoId, setPlanoId] = useState('')
  const [validoAte, setValidoAte] = useState(() => daquiADias(VALIDADE_PADRAO_DIAS))

  usePageHeader('Assinaturas', 'Quem assina o Só+1 — e o registro do Pix que chegou por fora')

  const assinaturas = useQuery({
    queryKey: chaves.assinaturasDoAdmin(),
    queryFn: assinaturasDoAdmin.listar,
  })

  const convites = useQuery({
    queryKey: chaves.convitesDeCortesia(),
    queryFn: assinaturasDoAdmin.convitesPendentes,
  })

  /**
   * A api já concede por e-mail? (web#503)
   *
   * Detectado pelo que ela devolve, e não por versão: a rota dos convites só
   * existe desde a api#597. Sem ela, a cortesia continua pela busca de dono —
   * e a web pode ir para a produção antes da api.
   */
  const porEmail = Array.isArray(convites.data)
  const pendentes = useMemo(() => convites.data ?? [], [convites.data])

  // Só quando o formulário abre: quem entrou para conferir vencimento não
  // precisa da base de usuários inteira.
  const donos = useQuery({
    queryKey: chaves.usuariosDoAdmin('OWNER'),
    queryFn: () => adminService.listUsers('OWNER').then((r) => r.data.data),
    enabled: registrando || (concedendo && !porEmail),
  })
  // Todos os papéis: é o que diz se o e-mail é de um jogador ou de ninguém.
  const contas = useQuery({
    queryKey: chaves.usuariosDoAdmin('TODOS'),
    queryFn: () => adminService.listUsers().then((r) => r.data.data),
    enabled: concedendo && porEmail,
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
    setEmailDoDono('')
    setRecusaDaCortesia('')
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
    mutationFn: () =>
      assinaturasDoAdmin.conceder({
        ...(porEmail ? { email: emailDoDono.trim() } : { userId: donoId }),
        planId: planoId,
        validoAte,
      }),
    onSuccess: (resultado) => {
      toast.success(
        resultado?.resultado === 'CONVITE_ENVIADO'
          ? `Convite enviado para ${resultado.convite.email}. A cortesia começa quando a conta for criada.`
          : 'Cortesia concedida.',
      )
      fecharFormulario()
      void invalidar()
    },
    /**
     * A recusa **não é falha** — é resposta, e a api já manda o motivo dentro
     * da mensagem (a data da primeira cortesia, até quando vale o convite).
     *
     * Por isso ela sai como aviso dentro do modal, e o formulário **fica
     * aberto**: a ação seguinte de quem leu é trocar o e-mail, e fechar o modal
     * a obrigaria a começar de novo.
     */
    onError: (erro: unknown) => {
      if (RECUSAS_DA_CORTESIA.includes(codigoDeErro(erro) ?? '')) {
        setRecusaDaCortesia(mensagemDeErro(erro, 'A cortesia não pôde ser concedida a este dono.'))
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
  /** O convite pendente é cortesia aguardando cadastro: entra onde a cortesia entra. */
  const mostraConvites = (id: IdDoFiltro) => id === 'todas' || id === 'cortesias'
  const convitesVisiveis = mostraConvites(filtro) ? pendentes : []
  const temStripe = visiveis.some((a) => a.origem === 'STRIPE')

  /**
   * Os donos que ainda cabem numa assinatura nova.
   *
   * Filtrado por e-mail porque a lista de assinaturas não devolve o id do dono
   * — e o e-mail é único na base. Sem isso, o formulário ofereceria alguém que
   * a api recusa com 409 `SUBSCRIPTION_ALREADY_EXISTS`: o erro está certo, mas
   * descobri-lo depois de preencher três campos não.
   */
  const jaAssinam = useMemo(() => new Set(lista.map((a) => a.owner.email.toLowerCase())), [lista])
  const donosDisponiveis = useMemo(
    () => (donos.data ?? []).filter((dono) => !jaAssinam.has(dono.email.toLowerCase())),
    [donos.data, jaAssinam],
  )
  const emailsPendentes = useMemo(() => new Set(pendentes.map((c) => c.email.toLowerCase())), [pendentes])
  const diasDeCortesia = diasAteACampo(validoAte)
  const previsao = oQueAcontece(emailDoDono, {
    contas: contas.data ?? [],
    assinam: jaAssinam,
    pendentes: emailsPendentes,
    dias: diasDeCortesia,
  })

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
    setRecusaDaCortesia('')
    // Por e-mail, o campo é nativo e o `required` do navegador o cobre.
    if (porEmail || !donoFaltando()) conceder.mutate()
  }

  const copiarConvite = async (convite: ConviteDeCortesia) => {
    try {
      await navigator.clipboard.writeText(convite.inviteUrl)
      toast.success('Link do convite copiado.')
    } catch {
      toast.error('Não foi possível copiar. O link foi mandado por e-mail para ' + convite.email + '.')
    }
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
      ) : lista.length === 0 && pendentes.length === 0 ? (
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
              const quantas = lista.filter(aplica).length + (mostraConvites(id) ? pendentes.length : 0)
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

            {visiveis.length === 0 && convitesVisiveis.length === 0 ? (
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
                  {convitesVisiveis.map((convite) => (
                    <LinhaDoConvite key={convite.id} convite={convite} aoCopiar={copiarConvite} />
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
              {porEmail ? (
                <Grupo>
                  <RotuloDeCampo aria-hidden>E-mail do dono</RotuloDeCampo>
                  <EmailDoDono
                    contas={contas.data ?? []}
                    carregando={contas.isPending}
                    assinam={jaAssinam}
                    pendentes={emailsPendentes}
                    email={emailDoDono}
                    aoMudar={(email) => {
                      setEmailDoDono(email)
                      setRecusaDaCortesia('')
                    }}
                    dias={diasDeCortesia}
                  />
                  <Ajuda>
                    Cortesia é <strong>uma por dono</strong>. Quem ainda não tem conta recebe um
                    convite de dono, e a cortesia vem junto no cadastro.
                  </Ajuda>
                </Grupo>
              ) : (
                campoDoDono(
                  <>
                    Cortesia é <strong>uma por dono</strong>. Quem já teve é recusado, com a data da
                    primeira — e a busca só mostra quem ainda não tem assinatura nenhuma.
                  </>,
                )
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
                  {previsao?.tipo === 'convite'
                    ? 'No convite, a data vira a duração: os dias contam a partir do cadastro, e ninguém perde dias esperando o e-mail.'
                    : 'Um mês por padrão, e dá para trocar. Depois desta data o dono perde o acesso — vale a pena falar com ele antes.'}
                </Ajuda>
              </Grupo>

              {recusaDaCortesia && (
                <NotaDoFiltro $tom="alerta" role="alert">
                  {recusaDaCortesia}
                </NotaDoFiltro>
              )}

              <ModalAcoes>
                <Cancelar type="button" onClick={fecharFormulario}>
                  Cancelar
                </Cancelar>
                <Confirmar type="submit" disabled={conceder.isPending}>
                  {porEmail && previsao?.tipo === 'convite'
                    ? conceder.isPending ? 'Enviando…' : 'Enviar convite'
                    : conceder.isPending ? 'Concedendo…' : 'Conceder'}
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

interface PropsDoConvite {
  convite: ConviteDeCortesia
  aoCopiar: (convite: ConviteDeCortesia) => void
}

/**
 * A cortesia mandada por e-mail a quem ainda não tem conta (web#503).
 *
 * Na mesma tabela, como cortesia aguardando cadastro, e não numa lista à parte:
 * para quem opera é a mesma venda, só que num passo anterior. As colunas dizem
 * o que ainda não existe — dono, estabelecimento — em vez de ficarem vazias.
 * Não tem Renovar nem Encerrar, porque ainda não há assinatura.
 */
function LinhaDoConvite({ convite, aoCopiar }: PropsDoConvite) {
  return (
    <tr>
      <td className="dono">
        <Nome>{convite.email}</Nome>
        <Detalhe>sem conta ainda</Detalhe>
      </td>
      <td data-rotulo="Estabelecimento">Criado depois do cadastro</td>
      <td data-rotulo="Plano">
        <span>
          {convite.planoNome}
          <Detalhe>cortesia, sem cobrança</Detalhe>
        </span>
      </td>
      <td data-rotulo="Origem">
        <span><Selo $tom="cortesia">Cortesia</Selo></span>
      </td>
      <td data-rotulo="Situação">
        <span><Selo $tom="neutro">Aguardando cadastro</Selo></span>
      </td>
      <td data-rotulo="Validade">
        <span>
          <SemQuebra>{convite.dias} {convite.dias === 1 ? 'dia' : 'dias'}</SemQuebra> a partir do cadastro
          <Detalhe>
            Convidado por {convite.convidadoPor} em {dia(convite.convidadoEm)}. O link vale até{' '}
            {dia(convite.expiresAt)}.
          </Detalhe>
        </span>
      </td>
      <td className="acoes">
        <Acoes>
          <Botao type="button" onClick={() => aoCopiar(convite)}>
            <Copy size={14} aria-hidden /> Copiar link
          </Botao>
        </Acoes>
      </td>
    </tr>
  )
}
