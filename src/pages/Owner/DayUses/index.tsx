import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { Plus, Users, X } from 'lucide-react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { useAuth } from '../../../contexts/AuthContext'
import { dayUsesService } from '../../../services/dayUses'
import * as placesService from '../../../services/places'
import * as courtsService from '../../../services/courts'
import { chaves } from '../../../lib/queryClient'
import { toastErroDeApi } from '../../../utils/toastErro'
import { Skeleton } from '../../../components/Skeleton'
import type { DayUse, Place } from '../../../types/api'
import {
  Acoes, AcoesDoForm, Aviso, Botao, BotaoLeve, Caixa, Campo, Cartao, Dados, Detalhe, Erro,
  ErroDoCampo, Explicacao, Form, Horario, Input, Lado, Lista, Ocupacao, Rotulo, Select,
  Selo, SeletorDeEspaco, TituloDaCaixa, Topo, Valor, Vazio,
} from './styles'

const schema = yup.object({
  courtId: yup.string().required('Escolha a quadra'),
  inicio: yup.string().required('Informe quando começa'),
  /**
   * Vazio é legítimo, e quer dizer "copie do expediente".
   *
   * A api resolve isso e recusa com `SEM_FIM_E_SEM_EXPEDIENTE` quando não há
   * expediente para o dia. Exigir aqui tornaria o campo obrigatório e apagaria
   * a sugestão — que é justamente o que a decisão 6 do épico não quis.
   */
  fim: yup.string().defined(),
  precoGeral: yup.number().typeError('Informe o preço').min(0, 'Valor inválido').required('Informe o preço'),
  /**
   * Vazio é PREÇO ÚNICO, e não "faltou preencher".
   *
   * `''` vira `null` no `paraApi`. Um `yup.number()` puro trataria vazio como
   * `NaN` e reprovaria o caso simples, que é o mais comum.
   */
  precoAluno: yup.string().defined(),
  /** Vazio = sem teto. Mesma conversão do `precoAluno`. */
  maxPessoas: yup.string().defined(),
})

type Formulario = yup.InferType<typeof schema>

const VAZIO: Formulario = { courtId: '', inicio: '', fim: '', precoGeral: 0, precoAluno: '', maxPessoas: '' }

/** Os preços vêm string (são `Decimal` na api) — some com `Number` antes. */
const emReais = (valor: string | number) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const dia = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/**
 * `datetime-local` fala `"YYYY-MM-DDTHH:mm"` em hora local, e a api fala ISO
 * com fuso. Este par de conversões é a fronteira entre os dois.
 */
const paraCampo = (iso: string) => {
  const d = new Date(iso)
  const doisDigitos = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}T${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`
}

/**
 * O day use do espaço, para o dono (web#415, api#505).
 *
 * ## O fim é sugestão, e não obrigação
 *
 * Ao escolher o início, a tela pergunta à api a que horas o espaço fecha
 * naquele dia e **preenche** o campo. Quando vem `null` — espaço sem expediente
 * para aquele dia da semana —, o campo fica vazio e o dono digita.
 *
 * A criação **não** é bloqueada nesse caso. O expediente é recente (api#454) e
 * a maior parte dos espaços ainda não o tem; travar aqui seria prender o
 * produto novo numa peça que quase ninguém preencheu.
 *
 * ## Preço único é o caso simples, e a tela não exige os dois
 *
 * `precoAluno` vazio quer dizer preço único, e é assim que a api o entende —
 * com ele nulo, até quem tem matrícula entra como `GERAL`. Esvaziar o campo
 * numa edição **volta** ao preço único: a api aceita `null` no `PATCH`
 * justamente para o nulo não ser um estado só de ida.
 *
 * ## Cancelar não apaga
 *
 * O day use guarda quem pagou quanto naquele dia. O botão diz **Cancelar**, a
 * linha some da lista, e o filtro de cancelados a traz de volta.
 */
export default function OwnerDayUses() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [espacos, setEspacos] = useState<Place[]>([])
  const [placeId, setPlaceId] = useState('')
  /* Separa "ainda buscando os espaços" de "não tem nenhum": nos dois o
     `placeId` é `''`, e confundi-los pisca o vazio na cara de quem tem espaço. */
  const [carregandoEspacos, setCarregandoEspacos] = useState(true)
  const [abrindo, setAbrindo] = useState(false)
  const [incluirCancelados, setIncluirCancelados] = useState(false)
  const [semExpediente, setSemExpediente] = useState(false)

  usePageHeader('Day use', 'Um dia avulso: paga-se um valor fixo, por pessoa, e joga-se até o espaço fechar')

  useEffect(() => {
    placesService.list().then((resposta) => {
      const meus = user?.role === 'ADMIN'
        ? resposta.data.data
        : resposta.data.data.filter((espaco) => espaco.ownerId === user?.id)
      setEspacos(meus)
      const pedido = searchParams.get('placeId')
      setPlaceId(meus.some((espaco) => espaco.id === pedido) ? pedido! : meus[0]?.id ?? '')
    }).catch(() => setEspacos([])).finally(() => setCarregandoEspacos(false))
  }, [searchParams, user?.id, user?.role])

  const trocarEspaco = (id: string) => {
    setPlaceId(id)
    setSearchParams({ placeId: id })
    setAbrindo(false)
  }

  const dayUses = useQuery({
    queryKey: chaves.dayUses(placeId, incluirCancelados),
    queryFn: () => dayUsesService.listar(placeId, incluirCancelados),
    enabled: Boolean(placeId),
  })

  const quadras = useQuery({
    queryKey: chaves.quadrasDoEspaco(placeId),
    queryFn: () => courtsService.getCourtsByPlace(placeId).then((envelope) => envelope.data),
    enabled: Boolean(placeId),
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Formulario>({
    resolver: yupResolver(schema),
    defaultValues: VAZIO,
  })

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ['espacos', placeId, 'day-uses'] })
  }

  /**
   * Pergunta à api a que horas o espaço fecha, e preenche o campo.
   *
   * O `null` não é erro: é o espaço sem expediente para aquele dia. A tela
   * mostra o aviso e deixa o dono digitar, porque a api aceita o fim no corpo.
   */
  const sugerirFim = async (inicioLocal: string) => {
    if (!inicioLocal || !placeId) return
    try {
      const fim = await dayUsesService.sugestaoDeFim(placeId, new Date(inicioLocal).toISOString())
      setSemExpediente(fim === null)
      if (fim) setValue('fim', paraCampo(fim))
    } catch {
      /* A sugestão é conveniência. Se ela falhar, o campo continua editável e a
         criação segue possível — transformar isso em erro na tela travaria o
         dono por causa de um enfeite. */
      setSemExpediente(false)
    }
  }

  const paraApi = (dados: Formulario) => ({
    courtId: dados.courtId,
    inicio: new Date(dados.inicio).toISOString(),
    ...(dados.fim ? { fim: new Date(dados.fim).toISOString() } : {}),
    precoGeral: Number(dados.precoGeral),
    // `''` é preço único, e a api quer `null`.
    precoAluno: dados.precoAluno === '' ? null : Number(dados.precoAluno),
    maxPessoas: dados.maxPessoas === '' ? null : Number(dados.maxPessoas),
  })

  const criar = useMutation({
    mutationFn: (dados: Formulario) => dayUsesService.criar(placeId, paraApi(dados)),
    onSuccess: (dayUse) => {
      toast.success(`Day use de ${dia(dayUse.inicio)} criado.`)
      reset(VAZIO)
      setAbrindo(false)
      setSemExpediente(false)
      invalidar()
    },
    onError: (err) => toastErroDeApi(err),
  })

  const cancelar = useMutation({
    mutationFn: (dayUse: DayUse) => dayUsesService.cancelar(placeId, dayUse.id),
    onSuccess: () => {
      toast.success('Day use cancelado. Quem já entrou continua registrado.')
      invalidar()
    },
    onError: (err) => toastErroDeApi(err),
  })

  if (carregandoEspacos) return <Skeleton />

  if (espacos.length === 0) {
    return (
      <Vazio>
        <p>Você ainda não tem um espaço cadastrado.</p>
        <Botao type="button" onClick={() => navigate('/owner/places')}>Cadastrar espaço</Botao>
      </Vazio>
    )
  }

  const lista = dayUses.data ?? []

  return (
    <>
      {espacos.length > 1 && (
        <SeletorDeEspaco
          aria-label="Espaço"
          value={placeId}
          onChange={(e) => trocarEspaco(e.target.value)}
        >
          {espacos.map((espaco) => <option key={espaco.id} value={espaco.id}>{espaco.name}</option>)}
        </SeletorDeEspaco>
      )}

      <Caixa>
        <Topo>
          <div>
            <TituloDaCaixa>Novo day use</TituloDaCaixa>
            <Explicacao>
              Escolha a quadra e o dia. O horário de fim vem do expediente do espaço, e dá para
              mudar. Deixe o preço de aluno em branco se for preço único.
            </Explicacao>
          </div>
          <Botao type="button" onClick={() => setAbrindo((a) => !a)}>
            {abrindo ? <X size={16} /> : <Plus size={16} />}
            {abrindo ? 'Fechar' : 'Novo day use'}
          </Botao>
        </Topo>

        {abrindo && (
          <Form onSubmit={handleSubmit((dados) => criar.mutate(dados))}>
            <Campo>
              <Rotulo htmlFor="courtId">Quadra</Rotulo>
              <Select id="courtId" {...register('courtId')}>
                <option value="">Escolha…</option>
                {(quadras.data ?? []).map((quadra) => (
                  <option key={quadra.id} value={quadra.id}>{quadra.name}</option>
                ))}
              </Select>
              {errors.courtId && <ErroDoCampo>{errors.courtId.message}</ErroDoCampo>}
            </Campo>

            <Campo>
              <Rotulo htmlFor="inicio">Começa</Rotulo>
              <Input
                id="inicio"
                type="datetime-local"
                {...register('inicio', { onBlur: (e) => void sugerirFim(e.target.value) })}
              />
              {errors.inicio && <ErroDoCampo>{errors.inicio.message}</ErroDoCampo>}
            </Campo>

            <Campo>
              <Rotulo htmlFor="fim">Termina</Rotulo>
              <Input id="fim" type="datetime-local" {...register('fim')} />
              {semExpediente && (
                <Aviso>
                  Este espaço não tem expediente cadastrado para esse dia da semana — informe a que
                  horas o day use termina.
                </Aviso>
              )}
            </Campo>

            <Campo>
              <Rotulo htmlFor="precoGeral">Preço</Rotulo>
              <Input id="precoGeral" type="number" step="0.01" min="0" {...register('precoGeral')} />
              {errors.precoGeral && <ErroDoCampo>{errors.precoGeral.message}</ErroDoCampo>}
            </Campo>

            <Campo>
              <Rotulo htmlFor="precoAluno">Preço para alunos (opcional)</Rotulo>
              <Input id="precoAluno" type="number" step="0.01" min="0" {...register('precoAluno')} />
              <Explicacao>Em branco = preço único para todo mundo.</Explicacao>
            </Campo>

            <Campo>
              <Rotulo htmlFor="maxPessoas">Máximo de pessoas (opcional)</Rotulo>
              <Input id="maxPessoas" type="number" min="1" {...register('maxPessoas')} />
              <Explicacao>Em branco = sem limite.</Explicacao>
            </Campo>

            <AcoesDoForm>
              <Botao type="submit" disabled={criar.isPending}>
                {criar.isPending ? 'Criando…' : 'Criar day use'}
              </Botao>
            </AcoesDoForm>
          </Form>
        )}
      </Caixa>

      <Topo>
        <TituloDaCaixa>Day uses</TituloDaCaixa>
        <BotaoLeve type="button" onClick={() => setIncluirCancelados((v) => !v)}>
          {incluirCancelados ? 'Esconder cancelados' : 'Mostrar cancelados'}
        </BotaoLeve>
      </Topo>

      {dayUses.isLoading && <Skeleton />}
      {dayUses.isError && <Erro>Não deu para carregar os day uses.</Erro>}

      {!dayUses.isLoading && lista.length === 0 && (
        <Vazio><p>Nenhum day use por aqui ainda.</p></Vazio>
      )}

      <Lista>
        {lista.map((dayUse) => (
          <Cartao key={dayUse.id} $cancelado={dayUse.canceladoEm !== null}>
            <Lado>
              <Dados>
                <Horario>{dia(dayUse.inicio)} · {hora(dayUse.inicio)} – {hora(dayUse.fim)}</Horario>
                <Detalhe>{dayUse.court.name}</Detalhe>
                <Valor>
                  {emReais(dayUse.precoGeral)}
                  {dayUse.precoAluno !== null && <> · alunos {emReais(dayUse.precoAluno)}</>}
                </Valor>
              </Dados>
              <Ocupacao $lotado={dayUse.maxPessoas !== null && dayUse.pessoasDentro >= dayUse.maxPessoas}>
                {/* O par que responde "cabe mais alguém?", como `vagas` e
                    `matriculasAtivas` na turma. Sem teto, só o número. */}
                {dayUse.pessoasDentro}
                {dayUse.maxPessoas !== null && ` de ${dayUse.maxPessoas}`}
                {' '}
                {dayUse.pessoasDentro === 1 ? 'pessoa' : 'pessoas'}
              </Ocupacao>
              {dayUse.canceladoEm !== null && <Selo>Cancelado</Selo>}
            </Lado>

            <Acoes>
              <BotaoLeve
                type="button"
                onClick={() => navigate(`/owner/day-uses/${dayUse.id}/entradas?placeId=${placeId}`)}
              >
                <Users size={15} /> Quem está
              </BotaoLeve>
              {dayUse.canceladoEm === null && (
                <BotaoLeve type="button" onClick={() => cancelar.mutate(dayUse)}>Cancelar</BotaoLeve>
              )}
            </Acoes>
          </Cartao>
        ))}
      </Lista>
    </>
  )
}
