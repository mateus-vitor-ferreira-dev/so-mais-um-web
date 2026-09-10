/**
 * Os atalhos de horário da busca de day use (#469).
 *
 * ## Por que atalhos, e não dois campos de data
 *
 * Day use se decide no dia. "Hoje à tarde" e "sábado" são as duas perguntas
 * reais, e as duas viram dois cliques em vez de dois calendários — que é o
 * componente que mais custa acertar e o que menos gente usa.
 *
 * ## `qualquer` devolve `{}`, e isso é o padrão da tela
 *
 * Sem `from`/`to` a api corta por `fim >= agora`: tudo que ainda não acabou.
 * É a lista que a tela abre mostrando, e o motivo de o título não prometer
 * "hoje" — ele promete day uses, e "hoje" é um destes atalhos.
 *
 * ## O corte de hoje começa AGORA, e não à meia-noite
 *
 * Um day use que terminou às 11h não é onde jogar às 15h. Já o `fim de semana`
 * começa no sábado às 00h mesmo quando se pergunta na quarta: ali a pessoa
 * está se programando, e o que ela quer é a grade inteira.
 */
export type Faixa = 'qualquer' | 'hoje' | 'amanha' | 'fim-de-semana'

export const FAIXAS: { valor: Faixa; rotulo: string }[] = [
  { valor: 'qualquer', rotulo: 'Qualquer dia' },
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'amanha', rotulo: 'Amanhã' },
  { valor: 'fim-de-semana', rotulo: 'Fim de semana' },
]

export const ehFaixa = (v: string): v is Faixa => FAIXAS.some((f) => f.valor === v)

const fimDoDia = (d: Date) => {
  const fim = new Date(d)
  fim.setHours(23, 59, 59, 999)
  return fim
}

const inicioDoDia = (d: Date) => {
  const inicio = new Date(d)
  inicio.setHours(0, 0, 0, 0)
  return inicio
}

const somandoDias = (d: Date, dias: number) => {
  const outro = new Date(d)
  outro.setDate(outro.getDate() + dias)
  return outro
}

/**
 * A faixa em `from`/`to` ISO, como a api espera.
 *
 * `agora` é parâmetro para o teste poder cravar o relógio — sem isso, um teste
 * de "fim de semana" passaria de segunda a sexta e falharia no sábado.
 */
export function faixaDeHorario(faixa: Faixa, agora = new Date()): { from?: string; to?: string } {
  if (faixa === 'hoje') {
    // Começa agora: o que terminou de manhã não é onde jogar à tarde.
    return { from: agora.toISOString(), to: fimDoDia(agora).toISOString() }
  }

  if (faixa === 'amanha') {
    const amanha = somandoDias(agora, 1)
    return { from: inicioDoDia(amanha).toISOString(), to: fimDoDia(amanha).toISOString() }
  }

  if (faixa === 'fim-de-semana') {
    // 6 = sábado. No próprio sábado ou domingo, é ESTE fim de semana — quem
    // pergunta no sábado quer hoje, e não daqui a sete dias.
    const diaDaSemana = agora.getDay()
    const ateSabado = diaDaSemana === 0 ? -1 : 6 - diaDaSemana
    const sabado = somandoDias(agora, ateSabado)
    const domingo = somandoDias(sabado, 1)

    return { from: inicioDoDia(sabado).toISOString(), to: fimDoDia(domingo).toISOString() }
  }

  return {}
}
