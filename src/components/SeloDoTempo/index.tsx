import type { LeituraDoTempo } from '../../types/api'
import { graus, iconeDaCondicao, motivosPorExtenso } from '../../utils/previsao'
import { Risco, Selo } from './styles'

export interface SeloDoTempoProps {
  leitura?: LeituraDoTempo
  /**
   * Só o risco, sem a temperatura. É o do jogo de torneio: numa chave com
   * dezesseis cartões, dezesseis temperaturas viram ruído, e o que precisa
   * saltar aos olhos é o jogo em risco.
   */
  soRisco?: boolean
}

/**
 * O tempo numa linha, para cartão (web#476).
 *
 * No cartão de day use vai a temperatura e, com risco, o selo. A leitura
 * inteira — a faixa das horas, o "a partir de quando" — é da página da
 * atividade: num cartão, ela disputaria espaço com o preço e a lotação.
 *
 * Sem leitura, fora do alcance ou em quadra coberta, o selo não aparece: um
 * "sem previsão" em cada cartão diria nada, vinte vezes.
 */
export default function SeloDoTempo({ leitura, soRisco = false }: SeloDoTempoProps) {
  if (!leitura) return null

  if (leitura.alcance !== 'HORA' && leitura.alcance !== 'DIA') return null

  const risco = leitura.risco !== 'NENHUM' && (
    <Risco $risco={leitura.risco}>
      {leitura.risco === 'ALTO' ? 'Risco' : 'Atenção'}: {motivosPorExtenso(leitura.motivos)}
    </Risco>
  )

  if (soRisco) return risco || null

  const primeiraHora = leitura.alcance === 'HORA' ? leitura.horas?.[0] : undefined
  const dia = leitura.alcance === 'DIA' ? leitura.dia : undefined
  if (!primeiraHora && !dia) return null

  return (
    <Selo>
      {primeiraHora && (
        <span>
          <span aria-hidden="true">{iconeDaCondicao(primeiraHora.condicao)}</span> {graus(primeiraHora.temperatura)}
        </span>
      )}
      {dia && (
        <span>
          <span aria-hidden="true">{iconeDaCondicao(dia.condicao)}</span> {graus(dia.maxima)} / {graus(dia.minima)}
        </span>
      )}
      {risco}
    </Selo>
  )
}
