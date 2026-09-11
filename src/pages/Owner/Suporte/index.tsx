import { useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Clock, LifeBuoy } from 'lucide-react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import EmptyState from '../../../components/EmptyState'
import ConversaDeSuporte from '../../../components/ConversaDeSuporte'
import { chaves } from '../../../lib/queryClient'
import { suporteService } from '../../../services/suporte'
import { avisarSuporteLido } from '../../../utils/suporteLido'
import { HORARIO_DE_ATENDIMENTO, telaDeOrigem } from '../../../constants/suporte'
import type { MensagemDeSuporte } from '../../../types/api'
import { Pagina, Horario } from './styles'

/**
 * A conversa do dono com a equipe do Só+1 (web#472, épico api#570).
 *
 * As regras da conversa — nada do que se escreveu some, o banco é a verdade, o
 * eco não duplica — moram no `ConversaDeSuporte`, que a caixa da equipe
 * (web#473) também usa. Aqui fica o que é só do dono: o horário de atendimento,
 * a tela de onde ele veio, e a equipe como "Equipe Só+1".
 */
export default function OwnerSuporte() {
  usePageHeader('Suporte', 'Fale com a equipe do Só+1')

  const location = useLocation()

  /**
   * De que tela o dono veio — o link do menu manda no `state`. Vai **só na
   * primeira mensagem desta visita**: nas seguintes a equipe já sabe.
   */
  const origem = useRef(telaDeOrigem((location.state as { de?: unknown } | null)?.de))

  const telaDaMensagem = useCallback(() => {
    const tela = origem.current
    origem.current = undefined
    return tela
  }, [])

  return (
    <Pagina>
      <Horario>
        <Clock size={16} aria-hidden="true" />
        {HORARIO_DE_ATENDIMENTO}
      </Horario>

      <ConversaDeSuporte
        chave={chaves.suporteDoDono()}
        buscar={suporteService.conversa}
        enviar={(texto, tela) => suporteService.enviar(tela ? { texto, tela } : { texto })}
        telaDaMensagem={telaDaMensagem}
        marcarLida={suporteService.marcarLida}
        // O dono tem uma conversa só: lida, todo aviso de suporte do sino apaga.
        aoMarcarLida={() => avisarSuporteLido()}
        ehDestaConversa={() => true}
        doMeuLado={(m: MensagemDeSuporte) => !m.daEquipe}
        autor={(m: MensagemDeSuporte) => (m.daEquipe ? 'Equipe Só+1' : 'Você')}
        vazio={
          <EmptyState icone={<LifeBuoy size={28} aria-hidden="true" />} titulo="Fale com a equipe do Só+1">
            Escreva abaixo a sua dúvida ou o problema que encontrou. A resposta chega aqui
            mesmo, e também no sino.
          </EmptyState>
        }
        rotuloDaLista="Conversa com a equipe do Só+1"
        rotuloDoCampo="Mensagem para a equipe"
        placeholder="Escreva sua mensagem. Enter envia; Shift+Enter quebra a linha."
      />
    </Pagina>
  )
}
