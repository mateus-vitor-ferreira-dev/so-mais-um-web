import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MessagesSquare } from 'lucide-react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import EmptyState from '../../../components/EmptyState'
import ErrorState from '../../../components/ErrorState'
import ConversaDeSuporte from '../../../components/ConversaDeSuporte'
import { useAuth } from '../../../contexts/AuthContext'
import { useEventoDoStream, useReconexaoDoStream } from '../../../hooks/useEventoDoStream'
import { chaves } from '../../../lib/queryClient'
import { suporteDaEquipe } from '../../../services/suporte'
import { avisarSuporteLido } from '../../../utils/suporteLido'
import { horaDaMensagem, rotuloDaTela } from '../../../constants/suporte'
import type { AssinaturaNoSuporte, ConversaParaEquipe, MensagemDeSuporte } from '../../../types/api'
import {
  Layout, Caixa, ItemDaCaixa, NomeDoDono, Quando, Trecho, NaoLidas, Painel, Escolha, Voltar,
  Dono, DonoNome, DonoEmail, DonoLinha, Situacao, Carregando,
} from './styles'

/**
 * A caixa do suporte, do lado da equipe (web#473, épico api#570).
 *
 * **A lista e a conversa na mesma tela.** No desktop, lado a lado; no celular,
 * uma de cada vez, com "voltar". A conversa é a mesma do dono
 * (`ConversaDeSuporte`), com três diferenças que só a equipe precisa:
 *
 * - **quem é o dono** antes de qualquer mensagem: nome, e-mail, plano e se a
 *   assinatura está em dia. Sem isso, o admin abriria `/admin/subscriptions`
 *   em outra aba antes de responder;
 * - **qual admin mandou cada resposta** — o dono não vê, mas quem responde
 *   precisa saber quem já falou o quê;
 * - **de que tela o dono escreveu**, quando ele mandou.
 *
 * Dois admins na mesma conversa veem a resposta um do outro sem recarregar: a
 * api manda o evento a todos os admins, e é isso que evita duas respostas para a
 * mesma pergunta.
 */
export default function AdminSuporte() {
  usePageHeader('Suporte', 'As conversas dos donos com a equipe')

  const { conversaId } = useParams<{ conversaId?: string }>()
  const queryClient = useQueryClient()

  const caixa = useQuery({ queryKey: chaves.caixaDoSuporte(), queryFn: suporteDaEquipe.caixa })

  // Mensagem nova, de qualquer conversa, muda a ordem e a contagem. A api já
  // manda a caixa ordenada — relê-la é mais barato do que reordenar aqui.
  const recarregarCaixa = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: chaves.caixaDoSuporte() })
  }, [queryClient])

  useEventoDoStream('suporte', recarregarCaixa)
  useReconexaoDoStream(recarregarCaixa)

  return (
    <Layout $comConversa={!!conversaId}>
      <Caixa aria-label="Conversas de suporte">
        {caixa.isPending ? (
          <Carregando role="status">Carregando as conversas…</Carregando>
        ) : caixa.isError ? (
          <ErrorState>Não foi possível carregar as conversas.</ErrorState>
        ) : caixa.data.length === 0 ? (
          <EmptyState icone={<MessagesSquare size={28} aria-hidden="true" />} titulo="Nenhuma conversa ainda">
            Quando um dono escrever pelo painel, a conversa aparece aqui — e no sino.
          </EmptyState>
        ) : (
          caixa.data.map(c => (
            <ItemDaCaixa key={c.id} to={`/admin/suporte/${c.id}`} $naoLida={c.naoLidas > 0}>
              <NomeDoDono>{c.dono.name}</NomeDoDono>
              <Quando dateTime={c.ultimaMensagemEm}>{horaDaMensagem(c.ultimaMensagemEm)}</Quando>
              <Trecho>
                {c.ultimaMensagem
                  ? `${c.ultimaMensagem.daEquipe ? 'Equipe: ' : ''}${c.ultimaMensagem.texto}`
                  : 'Sem mensagens'}
              </Trecho>
              {c.naoLidas > 0 && (
                <NaoLidas aria-label={`${c.naoLidas} não ${c.naoLidas === 1 ? 'lida' : 'lidas'}`}>
                  {c.naoLidas}
                </NaoLidas>
              )}
            </ItemDaCaixa>
          ))
        )}
      </Caixa>

      <Painel>
        {conversaId ? (
          // `key`: trocar de conversa recomeça do zero — rascunho, pendentes e
          // rolagem são de uma conversa, e não podem vazar para a próxima.
          <ConversaAberta key={conversaId} conversaId={conversaId} aoLer={recarregarCaixa} />
        ) : (
          <Escolha>Escolha uma conversa na lista para ler e responder.</Escolha>
        )}
      </Painel>
    </Layout>
  )
}

/** A situação da assinatura, na língua de quem vai responder. */
function situacao(assinatura: AssinaturaNoSuporte | null): { rotulo: string; tom: 'ok' | 'erro' | 'neutro' } {
  if (!assinatura) return { rotulo: 'Sem assinatura', tom: 'neutro' }
  const teste = assinatura.origem === 'CORTESIA'
  if (assinatura.emDia) return { rotulo: teste ? 'Em teste' : 'Em dia', tom: 'ok' }
  return { rotulo: teste ? 'Teste acabado' : 'Vencida', tom: 'erro' }
}

const dataCivil = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' })

function ConversaAberta({ conversaId, aoLer }: { conversaId: string; aoLer: () => void }) {
  const { user } = useAuth()

  const autor = (m: MensagemDeSuporte) => {
    if (!m.daEquipe) return m.autor?.name ?? 'Dono'
    if (m.autor && m.autor.id === user?.id) return 'Você'
    return `${m.autor?.name ?? 'Equipe'} · equipe`
  }

  return (
    <>
      <Voltar to="/admin/suporte">
        <ArrowLeft size={16} aria-hidden="true" />
        Conversas
      </Voltar>
      <ConversaDeSuporte
        chave={chaves.conversaDoSuporte(conversaId)}
        buscar={antes => suporteDaEquipe.conversa(conversaId, antes)}
        enviar={texto => suporteDaEquipe.enviar(conversaId, texto)}
        marcarLida={() => suporteDaEquipe.marcarLida(conversaId)}
        aoMarcarLida={() => {
          aoLer()
          avisarSuporteLido(conversaId)
        }}
        ehDestaConversa={evento => evento.conversaId === conversaId}
        doMeuLado={m => m.daEquipe}
        autor={autor}
        detalhe={m => (!m.daEquipe && m.tela ? `escrito de: ${rotuloDaTela(m.tela)}` : null)}
        cabecalho={(pagina: ConversaParaEquipe) => {
          const { dono } = pagina
          const { rotulo, tom } = situacao(dono.assinatura)
          return (
            <Dono aria-label="Quem é o dono">
              <DonoNome>{dono.name}</DonoNome>
              <DonoEmail href={`mailto:${dono.email}`}>{dono.email}</DonoEmail>
              <DonoLinha>
                {dono.assinatura?.plano?.nome ?? 'Sem plano'}
                {' · '}
                <Situacao $tom={tom}>{rotulo}</Situacao>
                {dono.assinatura?.currentPeriodEnd && ` · até ${dataCivil(dono.assinatura.currentPeriodEnd)}`}
              </DonoLinha>
            </Dono>
          )
        }}
        vazio={<Escolha>Esta conversa ainda não tem mensagens.</Escolha>}
        rotuloDaLista="Conversa com o dono"
        rotuloDoCampo="Resposta para o dono"
        placeholder="Escreva a resposta. Enter envia; Shift+Enter quebra a linha."
      />
    </>
  )
}
