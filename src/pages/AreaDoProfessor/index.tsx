import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import { Skeleton } from '../../components/Skeleton'
import { chaves } from '../../lib/queryClient'
import { professorService } from '../../services/professor'
import { aulasService } from '../../services/aulas'
import { getSportMeta } from '../../hooks/useSports'
import { mensagemDeErro } from '../../utils/apiError'
import { toastErroDeApi } from '../../utils/toastErro'
import type { AulaDoProfessor } from '../../types/api'
import {
  Aluno, Botao, BotaoSecundario, CartaoDaAula, CartaoDaTurma, Chamada, Container,
  Dia, Horario, LinhaDaAula, Onde, Opcoes, Secao, Selo, Subtitulo, Titulo,
} from './styles'

/** A agenda abre na semana. Mais que isso vira lista que ninguém percorre. */
const JANELA_DIAS = 7

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const rotuloDoDia = (iso: string) => {
  const d = new Date(iso)
  const hoje = new Date()
  const mesmoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  const amanha = new Date(hoje.getTime() + 86_400_000)

  if (mesmoDia(d, hoje)) return 'Hoje'
  if (mesmoDia(d, amanha)) return 'Amanhã'
  return `${DIAS[d.getDay()]}, ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
}

/** Agrupa por dia preservando a ordem que a api já entregou (por tempo). */
function porDia(aulas: AulaDoProfessor[]): [string, AulaDoProfessor[]][] {
  const mapa = new Map<string, AulaDoProfessor[]>()
  for (const aula of aulas) {
    const chave = new Date(aula.inicio).toDateString()
    mapa.set(chave, [...(mapa.get(chave) ?? []), aula])
  }
  return [...mapa.values()].map((doDia) => [rotuloDoDia(doDia[0].inicio), doDia])
}

/**
 * A chamada de uma aula, aberta dentro do cartão dela.
 *
 * **Dentro, e não noutra rota.** A api#451 descreve a tela do professor como
 * *"a lista de aulas — hoje, esta semana —, e dentro de cada aula a chamada"*, e
 * a razão aparece no uso: ele abre isto com o celular na mão, em quadra, com a
 * turma esperando. Uma navegação a mais é uma chance a mais de perder o lugar
 * na lista.
 */
function ChamadaDaAula({ aula }: { aula: AulaDoProfessor }) {
  const placeId = aula.turma.court.place.id
  const cliente = useQueryClient()
  const [marcacoes, setMarcacoes] = useState<Record<string, boolean | null>>({})

  const chamada = useQuery({
    queryKey: chaves.chamada(aula.id),
    queryFn: () => aulasService.chamada(placeId, aula.id),
  })

  useEffect(() => {
    if (chamada.data) {
      setMarcacoes(Object.fromEntries(chamada.data.alunos.map((a) => [a.matriculaId, a.presente])))
    }
  }, [chamada.data])

  const salvar = useMutation({
    mutationFn: () =>
      aulasService.registrar(
        placeId,
        aula.id,
        Object.entries(marcacoes)
          .filter(([, presente]) => presente !== null)
          .map(([matriculaId, presente]) => ({ matriculaId, presente: presente as boolean })),
      ),
    onSuccess: () => {
      toast.success('Chamada salva.')
      void cliente.invalidateQueries({ queryKey: chaves.chamada(aula.id) })
    },
    onError: toastErroDeApi,
  })

  const marcados = Object.values(marcacoes).filter((v) => v !== null).length

  if (chamada.isPending) return <Chamada><Skeleton height={64} /></Chamada>
  if (chamada.isError) {
    return (
      <Chamada>
        <ErrorState role="alert">
          {mensagemDeErro(chamada.error, 'Não deu para carregar a chamada desta aula.')}
        </ErrorState>
      </Chamada>
    )
  }

  const alunos = chamada.data?.alunos ?? []

  return (
    <Chamada>
      {alunos.length === 0 ? (
        <EmptyState>Nenhum aluno matriculado nesta turma.</EmptyState>
      ) : (
        <>
          {alunos.map((a) => (
            <Aluno key={a.matriculaId}>
              <span className="nome">
                {a.nome}
                {marcacoes[a.matriculaId] === null && <span className="pendente"> · não chamado</span>}
              </span>
              <Opcoes>
                <label>
                  <input
                    type="radio"
                    name={`presenca-${a.matriculaId}`}
                    checked={marcacoes[a.matriculaId] === true}
                    onChange={() => setMarcacoes((m) => ({ ...m, [a.matriculaId]: true }))}
                  />
                  Veio
                </label>
                <label>
                  <input
                    type="radio"
                    name={`presenca-${a.matriculaId}`}
                    checked={marcacoes[a.matriculaId] === false}
                    onChange={() => setMarcacoes((m) => ({ ...m, [a.matriculaId]: false }))}
                  />
                  Faltou
                </label>
              </Opcoes>
            </Aluno>
          ))}

          <Botao
            type="button"
            style={{ marginTop: 16 }}
            disabled={marcados === 0 || salvar.isPending}
            onClick={() => salvar.mutate(undefined)}
          >
            {salvar.isPending ? 'Salvando…' : 'Salvar chamada'}
          </Botao>
        </>
      )}
    </Chamada>
  )
}

/**
 * A área do professor (api#451).
 *
 * ## O que ela é, e o que ela deliberadamente não é
 *
 * A api#451 é explícita: *"A do professor não é o painel do dono. Ela é a lista
 * de aulas — hoje, esta semana —, e dentro de cada aula a chamada. Nada de
 * quadras, solicitações, estoque, plano ou faturamento."*
 *
 * Isso não depende só de disciplina aqui: as rotas `/me/turmas` e `/me/aulas`
 * **não devolvem** o valor da mensalidade, então a tela não teria como mostrar
 * faturamento nem se quisesse. O critério é sustentado pela api, e o teste
 * desta página o prende do lado de cá.
 *
 * ## Uma lista só, com as academias misturadas
 *
 * A #451 previa a dúvida — *"com dois espaços, o que aparece primeiro?"* — e a
 * api já respondeu montando as rotas sob `/me`: quem dá aula às 18h numa
 * academia e às 20h noutra quer ver as duas, em ordem de horário. Por isso cada
 * linha diz de qual espaço é; sem o nome, a lista fica ambígua justamente para
 * quem ela existe.
 */
export default function AreaDoProfessor() {
  const janela = useMemo(() => {
    const de = new Date()
    const ate = new Date(de.getTime() + JANELA_DIAS * 86_400_000)
    return { de: de.toISOString(), ate: ate.toISOString() }
  }, [])

  const [aulaAberta, setAulaAberta] = useState<string | null>(null)

  const agenda = useQuery({
    queryKey: chaves.professor.agenda(janela.de, janela.ate),
    queryFn: () => professorService.minhasAulas(janela.de, janela.ate),
  })

  const turmas = useQuery({
    queryKey: chaves.professor.turmas(),
    queryFn: () => professorService.minhasTurmas(),
  })

  return (
    <Container>
      <Titulo>Minhas aulas</Titulo>
      <Subtitulo>O que você dá nos próximos sete dias, em todos os espaços em que dá aula.</Subtitulo>

      <Secao aria-labelledby="titulo-agenda">
        <h2 id="titulo-agenda">Agenda</h2>

        {agenda.isPending && <Skeleton height={88} />}

        {agenda.isError && (
          <ErrorState role="alert">
            {mensagemDeErro(agenda.error, 'Não deu para carregar sua agenda.')}
          </ErrorState>
        )}

        {agenda.data?.length === 0 && (
          <EmptyState icone={<CalendarDays />} titulo="Nenhuma aula nos próximos sete dias">
            Quando o espaço agendar as aulas das suas turmas, elas aparecem aqui.
          </EmptyState>
        )}

        {porDia(agenda.data ?? []).map(([dia, aulas]) => (
          <div key={dia}>
            <Dia>{dia}</Dia>
            {aulas.map((aula) => {
              const modalidade = getSportMeta(aula.turma.modalidade)
              const cancelada = aula.status === 'CANCELADA'
              const aberta = aulaAberta === aula.id

              return (
                <CartaoDaAula key={aula.id} $cancelada={cancelada}>
                  <LinhaDaAula>
                    <div>
                      <Horario>{hora(aula.inicio)}–{hora(aula.fim)}</Horario>
                      {' '}
                      <span>{modalidade.label}</span>
                      {cancelada && <> <Selo>Cancelada</Selo></>}
                      <Onde>
                        <MapPin size={14} aria-hidden="true" />
                        {aula.turma.court.place.name} · {aula.turma.court.name}
                      </Onde>
                    </div>

                    {/*
                      Aula cancelada não abre chamada: não houve aula, e oferecer
                      o botão convidaria a registrar presença em algo que não
                      aconteceu.
                    */}
                    {!cancelada && (
                      <BotaoSecundario
                        type="button"
                        aria-expanded={aberta}
                        onClick={() => setAulaAberta(aberta ? null : aula.id)}
                      >
                        {aberta ? 'Fechar chamada' : 'Fazer chamada'}
                      </BotaoSecundario>
                    )}
                  </LinhaDaAula>

                  {aberta && <ChamadaDaAula aula={aula} />}
                </CartaoDaAula>
              )
            })}
          </div>
        ))}
      </Secao>

      <Secao aria-labelledby="titulo-turmas">
        <h2 id="titulo-turmas">Minhas turmas</h2>

        {turmas.isPending && <Skeleton height={64} />}

        {turmas.isError && (
          <ErrorState role="alert">
            {mensagemDeErro(turmas.error, 'Não deu para carregar suas turmas.')}
          </ErrorState>
        )}

        {turmas.data?.length === 0 && (
          <EmptyState>Você ainda não tem turma em nenhum espaço.</EmptyState>
        )}

        {turmas.data?.map((turma) => {
          const modalidade = getSportMeta(turma.modalidade)
          return (
            <CartaoDaTurma key={turma.id}>
              <div className="titulo">
                {modalidade.label} · {DIAS[turma.diaDaSemana]} às {turma.horario}
              </div>
              <Onde>
                <MapPin size={14} aria-hidden="true" />
                {turma.court.place.name} · {turma.court.name}
              </Onde>
              <Onde>
                {turma.alunosMatriculados} de {turma.vagas} vagas ocupadas
              </Onde>
            </CartaoDaTurma>
          )
        })}
      </Secao>
    </Container>
  )
}
