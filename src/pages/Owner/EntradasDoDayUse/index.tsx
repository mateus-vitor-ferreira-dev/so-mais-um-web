import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { dayUsesService } from '../../../services/dayUses'
import { chaves } from '../../../lib/queryClient'
import { toastErroDeApi } from '../../../utils/toastErro'
import { Skeleton } from '../../../components/Skeleton'
import type { EntradaNoDayUse, FaixaDoDayUse } from '../../../types/api'
import {
  AcoesDoForm, Botao, BotaoLeve, Caixa, Campo, Erro, ErroDoCampo, Explicacao, Faixa, Form,
  Input, LinhaDaPessoa, Lista, Resumo, Rotulo, Select, TituloDaCaixa, Topo, Vazio,
} from '../DayUses/styles'

const schema = yup.object({
  nome: yup.string().trim().min(2, 'Nome muito curto').required('Informe o nome'),
  contato: yup.string().trim().required('Informe o contato'),
  /**
   * A faixa é escolha do dono, e só vale para quem **não** tem conta.
   *
   * Com `userId`, a api calcula pela matrícula e ignora o que vier aqui — o
   * formulário desta tela não coleta `userId`, então a escolha sempre vale.
   * Quando o seletor de usuário existir, este campo tem de sumir junto.
   */
  faixa: yup.mixed<FaixaDoDayUse>().oneOf(['GERAL', 'ALUNO']).defined(),
})

type Formulario = yup.InferType<typeof schema>
const VAZIO: Formulario = { nome: '', contato: '', faixa: 'GERAL' }

const emReais = (valor: string | number) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/**
 * Quem está dentro de um day use, para o dono (web#415, api#505).
 *
 * ## O que esta tela NÃO faz, e é decisão
 *
 * Ela **não mostra o preço atual do day use ao lado do nome de ninguém.** Cada
 * linha traz o `valor` que a api gravou na entrada, e só ele.
 *
 * A api congela `faixa` e `valor` no momento em que a pessoa entra: quem sai da
 * turma depois não passa a dever a diferença, e subir o preço no meio da tarde
 * não muda quem entrou às 14h. Exibir o preço de hoje ao lado do valor pago
 * desfaria essa garantia visualmente — o dono veria dois números e concluiria
 * que um deles está errado.
 *
 * ## Remover apaga, e é diferente da matrícula
 *
 * A matrícula carimba `saiuEm` porque a mensalidade a referencia. A entrada é
 * um fato pontual e nada aponta para ela: entrada errada não é história, é
 * digitação. Quem esteve e **não** pagou já tem registro — é o "Em aberto".
 */
export default function OwnerEntradasDoDayUse() {
  const { dayUseId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const placeId = searchParams.get('placeId') ?? ''
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [abrindo, setAbrindo] = useState(false)

  usePageHeader('Quem está no day use', 'Quem entrou, por qual faixa, e quem já pagou')

  const entradas = useQuery({
    queryKey: chaves.entradasDoDayUse(dayUseId),
    queryFn: () => dayUsesService.entradas(placeId, dayUseId),
    enabled: Boolean(placeId && dayUseId),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Formulario>({
    resolver: yupResolver(schema),
    defaultValues: VAZIO,
  })

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: chaves.entradasDoDayUse(dayUseId) })
    /* A lista de day uses mostra `pessoasDentro`, e ela acabou de mudar. */
    void queryClient.invalidateQueries({ queryKey: ['espacos', placeId, 'day-uses'] })
  }

  const registrar = useMutation({
    mutationFn: (dados: Formulario) => dayUsesService.registrarEntrada(placeId, dayUseId, dados),
    onSuccess: (entrada) => {
      toast.success(`${entrada.nome} entrou — ${emReais(entrada.valor)}.`)
      reset(VAZIO)
      invalidar()
    },
    onError: (err) => toastErroDeApi(err),
  })

  const alternarPago = useMutation({
    mutationFn: (entrada: EntradaNoDayUse) =>
      dayUsesService.atualizarEntrada(placeId, dayUseId, entrada.id, { pago: entrada.pagoEm === null }),
    onSuccess: (entrada) => {
      toast.success(entrada.pagoEm ? 'Pagamento registrado.' : 'Voltou para em aberto.')
      invalidar()
    },
    onError: (err) => toastErroDeApi(err),
  })

  const remover = useMutation({
    mutationFn: (entrada: EntradaNoDayUse) =>
      dayUsesService.removerEntrada(placeId, dayUseId, entrada.id),
    onSuccess: () => {
      toast.success('Entrada removida.')
      invalidar()
    },
    onError: (err) => toastErroDeApi(err),
  })

  if (!placeId) {
    return (
      <Vazio>
        <p>Faltou saber de qual espaço é este day use.</p>
        <Botao type="button" onClick={() => navigate('/owner/day-uses')}>Voltar para os day uses</Botao>
      </Vazio>
    )
  }

  if (entradas.isLoading) return <Skeleton />
  if (entradas.isError) return <Erro>Não deu para carregar quem está no day use.</Erro>

  const { entradas: lista, resumo } = entradas.data ?? {
    entradas: [],
    resumo: { pessoas: 0, recebido: 0, emAberto: 0 },
  }

  return (
    <>
      <BotaoLeve type="button" onClick={() => navigate(`/owner/day-uses?placeId=${placeId}`)}>
        <ArrowLeft size={15} /> Day uses
      </BotaoLeve>

      {/* Os números vêm da api: somar `Decimal` de dinheiro no cliente é onde o
          centavo se perde. */}
      <Resumo>
        <div><dt>Pessoas</dt><dd>{resumo.pessoas}</dd></div>
        <div><dt>Recebido</dt><dd>{emReais(resumo.recebido)}</dd></div>
        <div><dt>Em aberto</dt><dd>{emReais(resumo.emAberto)}</dd></div>
      </Resumo>

      <Caixa>
        <Topo>
          <div>
            <TituloDaCaixa>Registrar quem chegou</TituloDaCaixa>
            <Explicacao>
              Nome e contato bastam — não é preciso ter conta no Só+1.
            </Explicacao>
          </div>
          <Botao type="button" onClick={() => setAbrindo((a) => !a)}>
            {abrindo ? <X size={16} /> : <Plus size={16} />}
            {abrindo ? 'Fechar' : 'Registrar entrada'}
          </Botao>
        </Topo>

        {abrindo && (
          <Form onSubmit={handleSubmit((dados) => registrar.mutate(dados))}>
            <Campo>
              <Rotulo htmlFor="nome">Nome</Rotulo>
              <Input id="nome" {...register('nome')} />
              {errors.nome && <ErroDoCampo>{errors.nome.message}</ErroDoCampo>}
            </Campo>

            <Campo>
              <Rotulo htmlFor="contato">Contato</Rotulo>
              <Input id="contato" placeholder="Telefone ou e-mail" {...register('contato')} />
              {errors.contato && <ErroDoCampo>{errors.contato.message}</ErroDoCampo>}
            </Campo>

            <Campo>
              <Rotulo htmlFor="faixa">Faixa</Rotulo>
              <Select id="faixa" {...register('faixa')}>
                <option value="GERAL">Geral</option>
                <option value="ALUNO">Aluno da casa</option>
              </Select>
              <Explicacao>
                O valor é congelado agora e não muda depois — nem se o preço do day use mudar.
              </Explicacao>
            </Campo>

            <AcoesDoForm>
              <Botao type="submit" disabled={registrar.isPending}>
                {registrar.isPending ? 'Registrando…' : 'Registrar'}
              </Botao>
            </AcoesDoForm>
          </Form>
        )}
      </Caixa>

      {lista.length === 0 && <Vazio><p>Ninguém entrou ainda.</p></Vazio>}

      <Lista>
        {lista.map((entrada) => (
          <LinhaDaPessoa key={entrada.id} $pago={entrada.pagoEm !== null}>
            <div className="quem">
              <span className="nome">{entrada.nome}</span>
              <span className="contato">{entrada.contato}</span>
            </div>

            <div className="dinheiro">
              <Faixa $aluno={entrada.faixa === 'ALUNO'}>
                {entrada.faixa === 'ALUNO' ? 'Aluno' : 'Geral'}
              </Faixa>
              <strong>{emReais(entrada.valor)}</strong>
              <BotaoLeve type="button" onClick={() => alternarPago.mutate(entrada)}>
                {entrada.pagoEm ? 'Pago' : 'Em aberto'}
              </BotaoLeve>
              <BotaoLeve
                type="button"
                aria-label={`Remover ${entrada.nome}`}
                onClick={() => remover.mutate(entrada)}
              >
                <Trash2 size={15} />
              </BotaoLeve>
            </div>
          </LinhaDaPessoa>
        ))}
      </Lista>
    </>
  )
}
