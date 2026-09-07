import { CORES_DE_TIME, NOME_DA_COR, corDerivadaDoNome } from '../../constants/coresDeTime'
import type { CorDeTime } from '../../constants/coresDeTime'
import { Grupo, Limpar, Opcao } from './styles'

export interface SeletorDeCorDoTimeProps {
  /** A cor escolhida, ou `null` quando o time usa a derivada do nome. */
  valor: CorDeTime | null
  aoEscolher: (cor: CorDeTime | null) => void
  /** O nome do time, para dizer qual cor ele terá sem escolher nenhuma. */
  nome: string
}

/**
 * A escolha da cor do time (#314), nos formulários de criar e de editar.
 *
 * ## Por que é um grupo de rádio, e não um `<select>`
 *
 * O que se escolhe aqui é a **cor**, e num `<select>` ela viraria a palavra
 * "Roxo" numa lista — pedindo que a pessoa imagine o resultado. Os quadrados
 * mostram exatamente o que vai aparecer no cartão, no tom do tema em que ela
 * está.
 *
 * `role="radiogroup"` com `aria-checked` porque é isso que a coisa é: uma
 * escolha entre alternativas exclusivas. Cada botão tem o nome da cor como
 * rótulo acessível — quem não distingue as cores escolhe pelo nome, que é o
 * mesmo que o resto do produto usa.
 *
 * ## "Sem cor" é uma opção, e não a ausência de uma
 *
 * Quem não escolhe fica com a cor derivada do nome, e ela é mostrada aqui como
 * o estado inicial. O link de limpar existe para **desfazer** uma escolha: sem
 * ele, escolher seria irreversível, e a pessoa ficaria presa à primeira cor em
 * que clicou por curiosidade.
 */
export default function SeletorDeCorDoTime({ valor, aoEscolher, nome }: SeletorDeCorDoTimeProps) {
  const derivada = corDerivadaDoNome(nome)
  const efetiva = valor ?? derivada

  return (
    <div>
      <Grupo role="radiogroup" aria-label="Cor do time">
        {CORES_DE_TIME.map((cor) => (
          <Opcao
            key={cor}
            type="button"
            role="radio"
            aria-checked={efetiva === cor}
            aria-label={NOME_DA_COR[cor]}
            title={NOME_DA_COR[cor]}
            $cor={cor}
            $ativa={efetiva === cor}
            onClick={() => aoEscolher(cor)}
          />
        ))}
      </Grupo>

      {valor !== null && (
        <Limpar type="button" onClick={() => aoEscolher(null)}>
          Usar a cor do nome ({NOME_DA_COR[derivada]})
        </Limpar>
      )}
    </div>
  )
}
