import type { HoraDoTempo } from '../../types/api'
import { graus, horaCheia, iconeDaCondicao, motivosPorExtenso, porcento } from '../../utils/previsao'
import { Chuva, Faixa, Hora, Icone, Rotulo, Temperatura } from './styles'

export interface FaixaDoTempoProps {
  horas: HoraDoTempo[]
}

/**
 * O tempo hora a hora, numa faixa (épico api#580).
 *
 * Cada hora diz a hora, o céu, a temperatura e a chance de chuva. A que tem
 * risco ganha borda, e o motivo vai por escrito no `title` e no nome acessível:
 * quem não distingue a cor não fica sem a informação.
 *
 * **O risco é o que a api mandou.** A faixa não compara chance de chuva com
 * limiar nenhum — a mesma hora de vento é risco no beach tennis e nada no
 * society, e só a api sabe de que quadra é esta leitura.
 *
 * A faixa rola na horizontal em vez de quebrar linha: um dia inteiro são 24
 * células, e em duas linhas a hora das 13h deixaria de ficar ao lado da das 12h.
 */
export default function FaixaDoTempo({ horas }: FaixaDoTempoProps) {
  if (horas.length === 0) return null

  return (
    <Faixa aria-label="Previsão do tempo por hora">
      {horas.map((h) => {
        const motivo = h.risco === 'NENHUM' ? '' : `, risco de ${motivosPorExtenso(h.motivos)}`
        const descricao =
          `${horaCheia(h.inicio)}: ${graus(h.temperatura)}, ${porcento(h.chanceDeChuva)} de chuva${motivo}`
        return (
          <Hora key={h.inicio} $risco={h.risco} title={descricao} aria-label={descricao}>
            <Rotulo>{horaCheia(h.inicio)}</Rotulo>
            <Icone aria-hidden="true">{iconeDaCondicao(h.condicao)}</Icone>
            <Temperatura>{graus(h.temperatura)}</Temperatura>
            <Chuva>{porcento(h.chanceDeChuva)}</Chuva>
          </Hora>
        )
      })}
    </Faixa>
  )
}
