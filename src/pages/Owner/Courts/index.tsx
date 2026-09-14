import { useState, useEffect, useCallback } from 'react'
import { usePageHeader, PageActions } from '../../../components/DashboardLayout/pageHeader'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { toastErroDeApi } from '../../../utils/toastErro'
import { codigoDeErro, mensagemDeErro } from '../../../utils/apiError'
import EditorDeFaixasDePreco from '../../../components/EditorDeFaixasDePreco'
import {
  faixasApontadasPelaApi, precoNaLista, semanaDaApi, semanaParaApi, semanaVazia, type SemanaDeFaixas,
} from '../../../utils/faixasDePreco'
import { ArrowLeft } from 'lucide-react'
import { useSubscription } from '../../../hooks/useSubscription'
import SubscriptionGate from '../../../components/SubscriptionGate'
import { getSportMeta } from '../../../hooks/useSports'
import SportIcon from '../../../components/SportIcon'
import * as courtsService from '../../../services/courts'
import * as placesService from '../../../services/places'
import type { Court, CourtType, FaixaDeExpediente, Place } from '../../../types/api'
import {
  BackBtn, CourtsGrid, CourtCard, CourtCardHeader, CourtIconBox, CourtInfo,
  CourtName, CourtMeta, StatusBadge, CourtActions, ActionBtn, ErrorMsg,
  NewBtn, Modal, ModalOverlay, ModalBox, ModalHeader, ModalTitle, Form,
  FormGroup, Label, Input, Select, FieldError, ModalActions, CancelBtn,
  SubmitBtn, SeloCoberta, AvisoSemCobertura, AtalhoDoAviso, GrupoDeOpcoes, Opcoes, Opcao, Nota,
  OpcaoDoPreco, ErroDasFaixas,
} from './styles'
import EmptyState from '../../../components/EmptyState'

const COURT_TYPES = [
  { value: 'SOCIETY',      label: 'Society' },
  { value: 'CAMPO',        label: 'Campo de Futebol' },
  { value: 'FUTSAL',       label: 'Futsal' },
  { value: 'AREIA',        label: 'Areia (Futevôlei)' },
  { value: 'VOLEI',        label: 'Vôlei Indoor' },
  { value: 'VOLEI_AREIA',  label: 'Vôlei de Areia' },
  { value: 'HANDBALL',     label: 'Handball' },
  { value: 'PETECA',       label: 'Peteca' },
  { value: 'BEACH_TENNIS', label: 'Beach Tennis' },
  { value: 'BASQUETE',     label: 'Basquete' },
  { value: 'TENIS',        label: 'Tênis' },
  { value: 'POKER',        label: 'Poker' },
]

const STATUS_LABEL = { OPEN: 'Aberta', CLOSED: 'Fechada' }
const STATUS_COLOR = { OPEN: '#16a34a', CLOSED: '#6b7280' }
const STATUS_BG    = { OPEN: '#dcfce7', CLOSED: '#f3f4f6' }

/**
 * Se a quadra tem teto, como o formulário guarda (api#581, web#477).
 *
 * Texto, e não booleano, porque há um terceiro estado que o formulário precisa
 * mostrar: `''` é a quadra que já existia antes da pergunta, com `coberta: null`
 * na api. Um `boolean` com `false` por padrão diria "descoberta" por ela.
 */
type Cobertura = 'coberta' | 'descoberta' | ''

const PARA_A_API: Record<Cobertura, boolean | null> = { coberta: true, descoberta: false, '': null }

const daApi = (coberta: boolean | null | undefined): Cobertura =>
  coberta === true ? 'coberta' : coberta === false ? 'descoberta' : ''

/** Poker não tem previsão em caso nenhum, e a pergunta não faz sentido para ele. */
const perguntaCobertura = (tipo: string | undefined) => tipo !== 'POKER'

const schema = yup.object({
  name:         yup.string().required('Nome obrigatório'),
  type:         yup.string().required('Modalidade obrigatória'),
  pricePerHour: yup.number().typeError('Valor inválido').min(0).nullable().transform((v, o) => (o === '' ? null : v)),
  /*
   * Obrigatória só na quadra nova. A que já existe com `null` pode ser salva
   * sem responder: travar a edição do preço por uma pergunta nova transformaria
   * "mudar o valor" em "descobrir um campo obrigatório que ninguém pediu".
   */
  coberta: yup
    .string<Cobertura>()
    .oneOf(['coberta', 'descoberta', ''])
    .default('')
    .test('obrigatoria-na-quadra-nova', 'Diga se a quadra é coberta', function (valor) {
      const { nova } = (this.options.context ?? {}) as { nova?: boolean }
      return !nova || !perguntaCobertura(this.parent.type) || Boolean(valor)
    }),
})

type FormValues = yup.InferType<typeof schema>

export default function OwnerCourts() {
  const { placeId } = useParams<{ placeId: string }>()
  const navigate = useNavigate()
  const { sub, isActive, loading: subLoading, podeAlterar } = useSubscription()

  const [place, setPlace]       = useState<Place | null>(null)
  const [courts, setCourts]     = useState<Court[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [showModal, setShowModal]       = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [toggling, setToggling]         = useState<string | null>(null)
  const [deleting, setDeleting]         = useState<string | null>(null)

  /*
   * O preço por horário (web#474). Fica fora do `react-hook-form` pelo mesmo
   * motivo das regras de acesso na criação de partida: a semana de faixas é uma
   * estrutura que o editor muda inteira, e não um campo.
   */
  const [variaPorHorario, setVariaPorHorario] = useState(false)
  const [semana, setSemana]                   = useState<SemanaDeFaixas>(semanaVazia)
  /** A quadra aberta já tinha faixas gravadas — é o que decide o aviso ao desmarcar. */
  const [tinhaFaixas, setTinhaFaixas]         = useState(false)
  const [carregandoFaixas, setCarregandoFaixas] = useState(false)
  const [expediente, setExpediente]           = useState<FaixaDeExpediente[]>([])
  const [destacadas, setDestacadas]           = useState<string[]>([])
  const [erroDasFaixas, setErroDasFaixas]     = useState<string | null>(null)

  /**
   * A api já serve preço por horário? Toda quadra dela devolve
   * `precoVariaPorHorario` desde a api#576; sem o campo, a opção não aparece.
   *
   * É o que deixa esta tela ir para produção antes da api sem oferecer um
   * editor cujo "Salvar" responderia 404. Espaço sem quadra nenhuma ainda não
   * tem de onde saber, e cria a primeira com preço único — que é o caso comum.
   */
  const apiTemFaixas = courts.some((court) => court.precoVariaPorHorario !== undefined)

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    context: { nova: editingCourt === null },
  })
  const tipoEscolhido = useWatch({ control, name: 'type' })
  const coberturaEscolhida = useWatch({ control, name: 'coberta' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [placeRes, courtsRes] = await Promise.all([
        placesService.getOne(placeId!),
        courtsService.getCourtsByPlace(placeId!),
      ])
      setPlace(placeRes.data?.data ?? placeRes.data)
      const raw = courtsRes?.data ?? courtsRes
      setCourts(Array.isArray(raw) ? raw : [])
    } catch {
      setError('Não foi possível carregar as quadras.')
    } finally {
      setLoading(false)
    }
  }, [placeId])

  useEffect(() => { fetchData() }, [fetchData])

  // O expediente só serve ao aviso de faixa fora do horário: sem ele, nenhum aviso, e nada quebra.
  useEffect(() => {
    if (!apiTemFaixas || !placeId) return
    let cancelado = false
    Promise.resolve(courtsService.getExpediente(placeId))
      .then((res) => { if (!cancelado) setExpediente(res?.data ?? []) })
      .catch(() => {})
    return () => { cancelado = true }
  }, [apiTemFaixas, placeId])

  function limparFaixas() {
    setSemana(semanaVazia())
    setTinhaFaixas(false)
    setDestacadas([])
    setErroDasFaixas(null)
  }

  function openCreate() {
    setEditingCourt(null)
    // pricePerHour usa null (não '') porque o schema o transforma de '' para
    // null e o tipo inferido é number | null | undefined.
    reset({ name: '', type: 'SOCIETY', pricePerHour: null, coberta: '' })
    setVariaPorHorario(false)
    limparFaixas()
    setShowModal(true)
  }

  function openEdit(court: Court) {
    setEditingCourt(court)
    reset({
      name: court.name,
      type: court.type,
      // Decimal do Prisma chega como string no JSON; o campo do form é number.
      pricePerHour: court.pricePerHour != null ? Number(court.pricePerHour) : null,
      coberta: daApi(court.coberta),
    })
    setVariaPorHorario(Boolean(court.precoVariaPorHorario))
    limparFaixas()
    setShowModal(true)
    if (apiTemFaixas) void carregarFaixas(court.id)
  }

  /** As listas trazem só o resumo do preço; a tabela vem da quadra sozinha (api#576). */
  async function carregarFaixas(courtId: string) {
    setCarregandoFaixas(true)
    try {
      const res = await courtsService.getCourt(placeId!, courtId)
      const faixas = res?.data?.faixasDePreco ?? []
      setSemana(semanaDaApi(faixas))
      setTinhaFaixas(faixas.length > 0)
    } catch (err) {
      setErroDasFaixas(`Não foi possível carregar as faixas desta quadra: ${mensagemDeErro(err, 'tente de novo')}.`)
    } finally {
      setCarregandoFaixas(false)
    }
  }

  function closeModal() {
    setShowModal(false)
    setEditingCourt(null)
    reset()
  }

  const onSubmit = async (data: FormValues) => {
    setDestacadas([])
    setErroDasFaixas(null)

    const salvarFaixas = apiTemFaixas && variaPorHorario
    const { faixas, chaves } = semanaParaApi(semana)
    if (salvarFaixas) {
      // Completude, e não regra: faixa sem valor não é faixa. Sobreposição é a api que diz.
      const incompletas = chaves.filter((_, i) => !faixas[i].inicio || !faixas[i].fim || !(faixas[i].valorPorHora > 0))
      if (incompletas.length > 0) {
        setDestacadas(incompletas)
        setErroDasFaixas('Preencha o início, o fim e um valor maior que zero em cada faixa, ou remova a que sobrou.')
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = {
        name: data.name,
        type: data.type as CourtType,
        ...(data.pricePerHour != null ? { pricePerHour: data.pricePerHour } : {}),
        // Sem resposta, o campo não vai: a quadra que já era `null` continua `null`.
        ...(perguntaCobertura(data.type) && data.coberta ? { coberta: PARA_A_API[data.coberta] } : {}),
        ...(apiTemFaixas ? { precoVariaPorHorario: variaPorHorario } : {}),
      }
      const salva = editingCourt
        ? (await courtsService.updateCourt(placeId!, editingCourt.id, payload)).data
        : (await courtsService.createCourt(placeId!, payload)).data

      /*
       * Salvar são duas chamadas: a opção vai na quadra, e a tabela no PUT.
       * A opção ligada sem faixa nenhuma é um estado válido — todo horário no
       * padrão —, então a falha entre as duas não quebra a quadra. Ela só não
       * pode sumir: o modal fica aberto, com as faixas recusadas em destaque, e
       * a quadra passa a ser a salva, para o próximo "Salvar" editar em vez de
       * criar outra.
       */
      if (salvarFaixas) {
        try {
          await courtsService.substituirFaixasDePreco(placeId!, salva.id, faixas)
        } catch (err) {
          const mensagem = mensagemDeErro(err, 'erro ao salvar as faixas')
          setEditingCourt(salva)
          setDestacadas(codigoDeErro(err) === 'FAIXAS_DE_PRECO_SOBREPOSTAS' ? faixasApontadasPelaApi(mensagem, chaves) : [])
          setErroDasFaixas(`A quadra foi salva, mas as faixas não: ${mensagem}.`)
          await fetchData()
          return
        }
      }

      toast.success(editingCourt ? 'Quadra atualizada!' : 'Quadra criada!')
      closeModal()
      await fetchData()
    } catch (err) {
      toastErroDeApi(err, 'Erro ao salvar quadra.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (court: Court) => {
    const next = court.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    setToggling(court.id)
    try {
      await courtsService.updateCourtStatus(placeId!, court.id, next)
      await fetchData()
    } catch (err) {
      toastErroDeApi(err, 'Erro ao alterar status.')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (court: Court) => {
    if (!window.confirm(`Excluir a quadra "${court.name}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(court.id)
    try {
      await courtsService.deleteCourt(placeId!, court.id)
      toast.success('Quadra excluída.')
      await fetchData()
    } catch (err) {
      toastErroDeApi(err, 'Erro ao excluir quadra.')
    } finally {
      setDeleting(null)
    }
  }

  const placeName = place?.name ?? 'Estabelecimento'

  // As que não disseram se têm teto: recebem previsão e aviso de chuva como descobertas.
  const semCobertura = courts.filter((c) => perguntaCobertura(c.type) && c.coberta == null)

  usePageHeader(`Quadras — ${placeName}`, "Gerencie as quadras deste estabelecimento")

  return (
    <>
      {/* Ficava clicável com a assinatura vencida, porque mora fora do
          portão: o conteúdo abaixo era apagado e este botão não. */}
      <PageActions>
        <NewBtn onClick={openCreate} disabled={!podeAlterar}>+ Nova Quadra</NewBtn>
      </PageActions>
      <SubscriptionGate isActive={isActive} loading={subLoading} sub={sub}>
        <BackBtn onClick={() => navigate('/owner/places')}>
          <ArrowLeft size={15} />
          Voltar
        </BackBtn>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        {semCobertura.length > 0 && (
          <AvisoSemCobertura>
            <span>
              {semCobertura.length === 1
                ? '1 quadra sem dizer se é coberta.'
                : `${semCobertura.length} quadras sem dizer se são cobertas.`}{' '}
              Até lá, a previsão do tempo e o aviso de chuva tratam como descoberta.
            </span>
            <AtalhoDoAviso
              variant="secondary"
              onClick={() => openEdit(semCobertura[0])}
              disabled={!podeAlterar}
            >
              Informar
            </AtalhoDoAviso>
          </AvisoSemCobertura>
        )}

        {!loading && courts.length === 0 && !error && (
          <EmptyState>
            Nenhuma quadra cadastrada ainda.
            <br />
            Clique em <strong>+ Nova Quadra</strong> para começar.
          </EmptyState>
        )}

        <CourtsGrid>
          {courts.map((court: Court) => {
            const sport = getSportMeta(court.type)
            return (
              <CourtCard key={court.id}>
                <CourtCardHeader>
                  <CourtIconBox><SportIcon icon={sport.icon} fallback={sport.iconFallback} /></CourtIconBox>
                  <CourtInfo>
                    <CourtName>
                      {court.name}
                      {court.coberta === true && <SeloCoberta>coberta</SeloCoberta>}
                    </CourtName>
                    <CourtMeta>
                      {sport.label}
                      {precoNaLista(court) && ` · ${precoNaLista(court)}`}
                    </CourtMeta>
                  </CourtInfo>
                  <StatusBadge bg={STATUS_BG[court.status]} color={STATUS_COLOR[court.status]}>
                    {STATUS_LABEL[court.status] ?? court.status}
                  </StatusBadge>
                </CourtCardHeader>

                <CourtActions>
                  <ActionBtn variant="secondary" onClick={() => openEdit(court)} disabled={!podeAlterar}>
                    Editar
                  </ActionBtn>
                  <ActionBtn
                    variant={court.status === 'OPEN' ? 'danger' : 'success'}
                    onClick={() => handleToggleStatus(court)}
                    disabled={toggling === court.id || !podeAlterar}
                  >
                    {toggling === court.id ? '...' : court.status === 'OPEN' ? 'Fechar' : 'Abrir'}
                  </ActionBtn>
                  <ActionBtn
                    variant="danger"
                    onClick={() => handleDelete(court)}
                    disabled={deleting === court.id || !podeAlterar}
                  >
                    {deleting === court.id ? '...' : 'Excluir'}
                  </ActionBtn>
                </CourtActions>
              </CourtCard>
            )
          })}
        </CourtsGrid>

        {showModal && (
          <Modal>
            <ModalOverlay onClick={closeModal} />
            <ModalBox $largo={apiTemFaixas && variaPorHorario}>
              <ModalHeader>
                <ModalTitle>{editingCourt ? 'Editar Quadra' : 'Nova Quadra'}</ModalTitle>
              </ModalHeader>

              <Form onSubmit={handleSubmit(onSubmit)}>
                <FormGroup>
                  <Label>Nome da Quadra *</Label>
                  <Input {...register('name')} placeholder="Ex.: Quadra 1" />
                  {errors.name && <FieldError>{errors.name.message}</FieldError>}
                </FormGroup>

                <FormGroup>
                  <Label>Modalidade *</Label>
                  <Select {...register('type')}>
                    {COURT_TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                  {errors.type && <FieldError>{errors.type.message}</FieldError>}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="preco-da-quadra">{variaPorHorario ? 'Valor padrão (R$/h)' : 'Preço por Hora (R$)'}</Label>
                  <Input
                    id="preco-da-quadra"
                    {...register('pricePerHour')}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex.: 120.00"
                  />
                  {errors.pricePerHour && <FieldError>{errors.pricePerHour.message}</FieldError>}
                  {/* Dito uma vez, aqui, e não em cada buraco da semana (web#474). */}
                  {variaPorHorario && <Nota>Vale nos horários que nenhuma faixa cobre.</Nota>}

                  {apiTemFaixas && (
                    <OpcaoDoPreco>
                      <input
                        type="checkbox"
                        checked={variaPorHorario}
                        onChange={(e) => setVariaPorHorario(e.target.checked)}
                      />
                      Valores diferentes por horário
                    </OpcaoDoPreco>
                  )}
                  {apiTemFaixas && !variaPorHorario && tinhaFaixas && (
                    <Nota>As faixas ficam guardadas e voltam se você marcar de novo.</Nota>
                  )}
                </FormGroup>

                {apiTemFaixas && variaPorHorario && (
                  carregandoFaixas ? (
                    <Nota>Carregando as faixas…</Nota>
                  ) : (
                    <EditorDeFaixasDePreco
                      semana={semana}
                      aoMudar={(nova) => { setSemana(nova); setDestacadas([]) }}
                      expediente={expediente}
                      destacadas={destacadas}
                      desabilitado={submitting}
                    />
                  )
                )}
                {erroDasFaixas && <ErroDasFaixas role="alert">{erroDasFaixas}</ErroDasFaixas>}

                {perguntaCobertura(tipoEscolhido) && (
                  <GrupoDeOpcoes>
                    <Label as="legend">A quadra é coberta?{editingCourt ? '' : ' *'}</Label>
                    <Opcoes>
                      <Opcao>
                        <input type="radio" value="coberta" {...register('coberta')} />
                        Coberta
                      </Opcao>
                      <Opcao>
                        <input type="radio" value="descoberta" {...register('coberta')} />
                        Descoberta
                      </Opcao>
                    </Opcoes>
                    {editingCourt && !coberturaEscolhida && (
                      <Nota>
                        Sem essa informação, a gente mostra a previsão do tempo e manda aviso de chuva para esta quadra.
                      </Nota>
                    )}
                    {errors.coberta && <FieldError>{errors.coberta.message}</FieldError>}
                  </GrupoDeOpcoes>
                )}

                <ModalActions>
                  <CancelBtn type="button" onClick={closeModal}>Cancelar</CancelBtn>
                  <SubmitBtn type="submit" disabled={submitting}>
                    {submitting ? 'Salvando...' : editingCourt ? 'Salvar Alterações' : 'Criar Quadra'}
                  </SubmitBtn>
                </ModalActions>
              </Form>
            </ModalBox>
          </Modal>
        )}
      </SubscriptionGate>
    </>
  )
}
