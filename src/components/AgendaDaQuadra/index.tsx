import { Ban, TriangleAlert } from 'lucide-react'
import { faixaDeHorario } from '../../utils/agenda'
import { motivosPorExtenso, riscoDaOcupacao } from '../../utils/previsao'
import FaixaDoTempo from '../FaixaDoTempo'
import type { HoraDoTempo, OcupacaoDaQuadra } from '../../types/api'
import { Bloco, Titulo, Lista, Item, Faixa, Descricao, Vazio, Aviso, MotivoDoRisco } from './styles'

/**
 * O que já ocupa a quadra no dia escolhido (api#443, web#368).
 *
 * ## O que ela mostra, e o que não mostra
 *
 * A lista do **dia**, e não da semana: a tela de criar partida já pede quadra,
 * data, hora, duração, vagas, valor, Pix e regras de acesso, e uma semana de
 * marcações ali dentro compete com a única coisa que a pessoa está decidindo.
 *
 * Cada linha traz horário e descrição, e a descrição é a que a api entregou —
 * `partida de Fulano`, `2ª rodada, jogo 3`, ou `horário reservado` quando a
 * partida é `LINK` ou `PRIVATE`. **A tela não sabe de quem é uma marcação
 * reservada, e é assim de propósito:** quem esconde é a api, para o mesmo
 * segredo não depender de cada tela lembrar de guardá-lo.
 *
 * ## Por que a lista aparece mesmo sem conflito
 *
 * Ela não é uma mensagem de erro: é o que faltava para escolher. Mostrá-la só
 * quando dá conflito devolveria a pessoa ao "tente de novo até acertar" — que é
 * exatamente o que esta issue veio tirar.
 *
 * ## O tempo, quando quem chama o tem (web#477)
 *
 * Na agenda do dono, cada quadra recebe as horas da previsão do dia. A faixa
 * aparece em cima da lista, e a marcação que atravessa uma hora de risco `ALTO`
 * ganha destaque com o motivo por escrito. Sem `horasDoTempo` — dia além do
 * alcance, quadra coberta, previsão fora do ar —, a agenda é a de sempre.
 */

export interface AgendaDaQuadraProps {
  ocupacoes: OcupacaoDaQuadra[]
  carregando: boolean
  /** A agenda não pôde ser lida — a tela diz que não conferiu, e não que está livre. */
  erro: boolean
  /** A ocupação que cruza o horário escolhido agora, quando há uma. */
  conflito: OcupacaoDaQuadra | null
  /** `false` enquanto não há data escolhida: não há dia sobre o que falar. */
  temData: boolean
  /** O título do bloco. Na agenda do dono é o nome da quadra. */
  titulo?: string
  /**
   * As horas da previsão do dia, já avaliadas pela api **para esta quadra**.
   * Só vêm quando a quadra é descoberta e o dia está no alcance por hora.
   */
  horasDoTempo?: HoraDoTempo[]
  /**
   * O que dizer quando a agenda não carrega. O padrão é o da criação de partida,
   * onde a api ainda barra o horário ocupado; no painel do dono não há nada
   * sendo criado, e a frase de lá não faz sentido (web#491).
   */
  mensagemDeErro?: string
}

export function AgendaDaQuadra({
  ocupacoes,
  carregando,
  erro,
  conflito,
  temData,
  titulo,
  horasDoTempo,
  mensagemDeErro = 'Não foi possível carregar a agenda. Você pode criar assim mesmo — se o horário estiver ocupado, o servidor vai avisar.',
}: AgendaDaQuadraProps) {
  if (!temData) {
    return (
      <Bloco>
        <Titulo>{titulo ?? 'Agenda da quadra'}</Titulo>
        <Vazio>Escolha a data para ver o que já está marcado.</Vazio>
      </Bloco>
    )
  }

  return (
    <Bloco>
      <Titulo>{titulo ?? 'Agenda da quadra neste dia'}</Titulo>

      {horasDoTempo && <FaixaDoTempo horas={horasDoTempo} />}

      {carregando && <Vazio>Consultando a agenda...</Vazio>}

      {/*
        Erro NÃO vira silêncio, ao contrário da estimativa de alcance.
        Uma agenda que não carregou é a tela deixando de barrar horário
        ocupado — e deixar a lista vazia diria "a quadra está livre", que é
        a única coisa que ela não pode afirmar aqui.
      */}
      {erro && (
        <Aviso $tom="atencao">
          <TriangleAlert size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            {mensagemDeErro}
          </span>
        </Aviso>
      )}

      {!carregando && !erro && ocupacoes.length === 0 && (
        <Vazio>Nada marcado neste dia. A quadra está livre.</Vazio>
      )}

      {ocupacoes.length > 0 && (
        <Lista>
          {ocupacoes.map((ocupacao, i) => {
            const atropela = conflito != null && conflito.inicio === ocupacao.inicio
            const risco = horasDoTempo ? riscoDaOcupacao(ocupacao, horasDoTempo) : null
            return (
              // A chave inclui o índice porque `id` é `null` em toda marcação
              // reservada — duas delas no mesmo dia colidiriam numa chave só.
              <Item key={`${ocupacao.inicio}-${ocupacao.id ?? i}`} $atropela={atropela || risco !== null}>
                <Faixa>{faixaDeHorario(ocupacao)}</Faixa>
                <Descricao>{ocupacao.descricao}</Descricao>
                {risco && <MotivoDoRisco>Risco de {motivosPorExtenso(risco.motivos)}</MotivoDoRisco>}
              </Item>
            )
          })}
        </Lista>
      )}

      {conflito && (
        <Aviso $tom="erro" role="alert">
          <Ban size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            O horário escolhido cruza com {conflito.descricao},{' '}
            {faixaDeHorario(conflito)}. Escolha outro horário ou outra quadra.
          </span>
        </Aviso>
      )}
    </Bloco>
  )
}
