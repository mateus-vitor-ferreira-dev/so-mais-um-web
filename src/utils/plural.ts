/**
 * "1 vaga", "3 vagas", "0 vagas" (web#491).
 *
 * Era `{n} vagas` em toda tela, e o "1 vagas" aparecia exatamente no caso mais
 * importante: a última vaga da partida.
 */
export function contagem(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}
