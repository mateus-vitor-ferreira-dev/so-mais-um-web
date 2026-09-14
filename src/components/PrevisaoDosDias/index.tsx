import type { LeituraDoTempo } from '../../types/api'
import { diaEMes, graus, iconeDaCondicao, motivosPorExtenso, porcento } from '../../utils/previsao'
import AtribuicaoDoTempo from '../AtribuicaoDoTempo'
import { Skeleton } from '../Skeleton'
import { Bloco, Data, Dia, Dias, Leitura, Neutro, Risco, Titulo } from './styles'

export interface PrevisaoDosDiasProps {
  /** Um item por dia do torneio, na ordem. Indefinido enquanto carrega ou quando falhou. */
  dias?: Array<{ data: string; leitura: LeituraDoTempo }>
  carregando: boolean
  erro: boolean
}

const DIA_DA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

/** `sáb, 20/09` — pela data civil, montada em UTC para o fuso de quem olha não trocar o dia. */
function rotuloDoDia(data: string): string {
  const [ano, mes, dia] = data.split('-').map(Number)
  return `${DIA_DA_SEMANA[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()]}, ${diaEMes(data)}`
}

/**
 * A previsão de cada dia de um torneio (web#476).
 *
 * O torneio dura dias, e a pergunta de quem organiza é *"que dia vai chover?"*.
 * Por isso a leitura aqui é a do dia, uma linha por dia: a api pede a previsão
 * diária para cada um (`soDoDia`), e o risco por horário fica no selo de cada
 * jogo da chave.
 *
 * Some inteira quando nenhum dia tem o que dizer — torneio encerrado, espaço
 * sem coordenada —, em vez de listar dias vazios.
 */
export default function PrevisaoDosDias({ dias, carregando, erro }: PrevisaoDosDiasProps) {
  if (carregando) {
    return (
      <Bloco aria-busy="true">
        <Titulo>Previsão do tempo</Titulo>
        <Skeleton height={48} />
      </Bloco>
    )
  }

  if (erro) {
    return (
      <Bloco>
        <Titulo>Previsão do tempo</Titulo>
        <Neutro>Previsão indisponível agora.</Neutro>
      </Bloco>
    )
  }

  const comAlgo = (dias ?? []).filter(
    ({ leitura }) => leitura.alcance === 'DIA' || leitura.alcance === 'AINDA_LONGE',
  )
  if (comAlgo.length === 0) return null

  return (
    <Bloco>
      <Titulo>Previsão do tempo</Titulo>
      <Dias>
        {comAlgo.map(({ data, leitura }) => (
          <Dia key={data}>
            <Data>{rotuloDoDia(data)}</Data>
            {leitura.alcance === 'DIA' && leitura.dia ? (
              <Leitura>
                <span aria-hidden="true">{iconeDaCondicao(leitura.dia.condicao)}</span>
                {graus(leitura.dia.maxima)} / {graus(leitura.dia.minima)}, {porcento(leitura.dia.chanceDeChuva)} de chuva
                {leitura.risco !== 'NENHUM' && (
                  <Risco>Atenção: {motivosPorExtenso(leitura.motivos)}</Risco>
                )}
              </Leitura>
            ) : (
              <Neutro>
                {leitura.disponivelEm
                  ? `A previsão aparece a partir de ${diaEMes(leitura.disponivelEm)}`
                  : 'Ainda sem previsão'}
              </Neutro>
            )}
          </Dia>
        ))}
      </Dias>
      {comAlgo.some(({ leitura }) => leitura.alcance === 'DIA') && <AtribuicaoDoTempo />}
    </Bloco>
  )
}
