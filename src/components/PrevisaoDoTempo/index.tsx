import type { LeituraDoTempo } from '../../types/api'
import { diaEMes, fraseDoRisco, graus, iconeDaCondicao, motivosPorExtenso, porcento } from '../../utils/previsao'
import AtribuicaoDoTempo from '../AtribuicaoDoTempo'
import FaixaDoTempo from '../FaixaDoTempo'
import { Skeleton } from '../Skeleton'
import { Bloco, Frase, Neutro, Risco, Titulo } from './styles'

export interface PrevisaoDoTempoProps {
  /** A leitura da api. Indefinida enquanto carrega ou quando falhou. */
  leitura?: LeituraDoTempo
  carregando: boolean
  /** A rota respondeu erro — 503 da Google, 429 do limite. A página segue. */
  erro: boolean
}

/**
 * A previsão do tempo de uma atividade, na página dela (web#476, épico api#580).
 *
 * ## Mostra, e não calcula
 *
 * O componente recebe a leitura e escolhe o texto pelo `alcance`. Risco,
 * motivos e até "quão longe está o jogo" vêm decididos da api (achado 6 do
 * épico): conta que mora em dois lugares acaba discordando.
 *
 * | alcance | a tela diz |
 * |---|---|
 * | `HORA` | a faixa das horas do jogo e, com risco, a frase ("Risco de tempestade às 19h") |
 * | `DIA` | "Previsão do dia: 24° / 15°, 70% de chuva", e que a por hora vem dois dias antes |
 * | `AINDA_LONGE` | "A previsão aparece a partir de DD/MM" |
 * | `COBERTA` | "Quadra coberta" |
 * | `SEM_LOCAL`, `PASSOU` | nada |
 *
 * ## O erro não é vermelho
 *
 * Previsão indisponível não é defeito da página, e um erro vermelho no meio do
 * detalhe da partida faria a pessoa achar que a partida é que está com problema.
 */
export default function PrevisaoDoTempo({ leitura, carregando, erro }: PrevisaoDoTempoProps) {
  if (carregando) {
    return (
      <Bloco aria-busy="true">
        <Titulo>Previsão do tempo</Titulo>
        <Skeleton height={56} />
      </Bloco>
    )
  }

  if (erro || !leitura) {
    if (!erro) return null
    return (
      <Bloco>
        <Titulo>Previsão do tempo</Titulo>
        <Neutro>Previsão indisponível agora.</Neutro>
      </Bloco>
    )
  }

  if (leitura.alcance === 'SEM_LOCAL' || leitura.alcance === 'PASSOU') return null

  return (
    <Bloco>
      <Titulo>Previsão do tempo</Titulo>
      <Conteudo leitura={leitura} />
    </Bloco>
  )
}

function Conteudo({ leitura }: { leitura: LeituraDoTempo }) {
  switch (leitura.alcance) {
    case 'HORA': {
      const horas = leitura.horas ?? []
      const frase = fraseDoRisco(horas, leitura.risco)
      return (
        <>
          {frase && (
            <Risco $risco={leitura.risco} role="status">
              <span aria-hidden="true">{leitura.risco === 'ALTO' ? '⛈️' : '⚠️'}</span>
              {frase}
            </Risco>
          )}
          <FaixaDoTempo horas={horas} />
          <AtribuicaoDoTempo />
        </>
      )
    }
    case 'DIA': {
      const dia = leitura.dia
      return (
        <>
          {dia && (
            <Frase>
              <span aria-hidden="true">{iconeDaCondicao(dia.condicao)}</span>
              Previsão do dia: {graus(dia.maxima)} / {graus(dia.minima)}, {porcento(dia.chanceDeChuva)} de chuva
            </Frase>
          )}
          {/* O dia nunca passa de atenção na api: "70% no sábado" não diz se chove às 19h. */}
          {leitura.risco !== 'NENHUM' && (
            <Risco $risco={leitura.risco} role="status">
              <span aria-hidden="true">⚠️</span>
              Atenção: {motivosPorExtenso(leitura.motivos)} no dia
            </Risco>
          )}
          <Neutro>A previsão por hora aparece dois dias antes.</Neutro>
          <AtribuicaoDoTempo />
        </>
      )
    }
    case 'AINDA_LONGE':
      return leitura.disponivelEm ? (
        <Neutro>A previsão aparece a partir de {diaEMes(leitura.disponivelEm)}.</Neutro>
      ) : null
    case 'COBERTA':
      return <Neutro>Quadra coberta.</Neutro>
    default:
      return null
  }
}
