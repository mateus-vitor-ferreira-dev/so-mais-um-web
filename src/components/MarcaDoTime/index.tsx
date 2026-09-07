import { corDoTime, iniciaisDoTime, NOME_DA_COR } from '../../constants/coresDeTime'
import type { CorDeTime } from '../../constants/coresDeTime'
import { Marca } from './styles'
import type { TamanhoDaMarca } from './styles'

export interface MarcaDoTimeProps {
  nome: string
  /** A cor escolhida. Nula quando o time nunca escolheu — deriva-se do nome. */
  cor?: CorDeTime | null
  tamanho?: TamanhoDaMarca
}

/**
 * A marca visual de um time: as iniciais dele, num quadrado da cor dele (#314).
 *
 * ## Por que iniciais com cor, e não escudo
 *
 * A #314 pedia que a decisão **fosse tomada**, e listava três saídas. Ficou
 * esta. Escudo por upload é o que mais parece time de verdade, e traz junto o
 * que nenhuma das outras traz: armazenamento, recorte, peso na listagem e
 * **moderação de conteúdo enviado por usuário** — que a issue exigia definir
 * *antes* de a rota existir. Cor sozinha distingue pior: dois times de cor
 * parecida na mesma lista voltam a exigir leitura, que é exatamente o problema.
 *
 * As iniciais já existiam na tela, reaproveitando o avatar de jogador. O que
 * faltava era a cor — e é ela que faz o reconhecimento acontecer antes da
 * leitura.
 *
 * ## Ela não é lida em voz alta
 *
 * `aria-hidden`, sempre. A marca fica **ao lado** do nome do time em todos os
 * três lugares onde aparece, e anunciá-la faria o leitor de tela dizer "O B, Os
 * Boleiros". As iniciais são um atalho para os olhos; para quem ouve, o atalho
 * é o nome inteiro, que já está lá.
 *
 * O nome da cor entra no `title`, e não no rótulo acessível, pelo mesmo motivo:
 * ele serve a quem está escolhendo, na tela de edição, não a quem está lendo a
 * lista.
 */
export default function MarcaDoTime({ nome, cor, tamanho = 'md' }: MarcaDoTimeProps) {
  const escolhida = corDoTime(nome, cor)

  return (
    <Marca $cor={escolhida} $tamanho={tamanho} aria-hidden="true" title={NOME_DA_COR[escolhida]}>
      {iniciaisDoTime(nome)}
    </Marca>
  )
}
