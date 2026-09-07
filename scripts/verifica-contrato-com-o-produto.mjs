/**
 * Falha quando um tipo do web deixa de descrever o que a api serve.
 *
 * Por que isto existe
 * -------------------
 * O `OcupacaoDaQuadra.tipo` ficou atrasado **duas** vezes, pelo mesmo motivo
 * nas duas: a api ganhou um valor (`AULA` na api#473, `DAY_USE` na api#515) e
 * ninguém veio aqui somar.
 *
 * A defasagem não quebra nada, e é por isso que ela dura. O `AgendaDaQuadra`
 * mostra a `descricao` que a api manda e nunca ramifica por `tipo`, então o
 * valor desconhecido aparece certo na tela. O tipo só deixa de ser verdade.
 *
 * O preço aparece depois: quem escrever o primeiro `switch` sobre esse campo
 * vai ter o TypeScript garantindo exaustividade sobre uma união incompleta — e
 * concordando com quem estiver errado.
 *
 * De onde vem a verdade
 * ---------------------
 * Do `/docs.json` da api, que é o mesmo contrato que qualquer integrador lê.
 * Não é uma segunda fonte que pode divergir do código: a api tem teste próprio
 * comparando esse enum com o `TipoDeOcupacao` dela (`agenda.test.ts`).
 *
 * Sem rede, o script **não reprova** — avisa e sai em 0. A api fora do ar não é
 * defeito do web, e transformar indisponibilidade em CI vermelho ensina todo
 * mundo a ignorar o vermelho.
 *
 * Sobra é aviso; falta nunca é
 * ----------------------------
 * Os dois desvios são opostos, e confundi-los custaria uma dança de release.
 *
 * - **Falta** — a api serve um tipo e a união não o tem. É a defasagem, e é o
 *   defeito que esta issue veio corrigir. Fatal em todo evento.
 * - **Sobra** — a união tem um tipo que produção ainda não serve. É o estado
 *   NORMAL entre o merge daqui e o deploy da api, e não é defeito de ninguém:
 *   o web pode saber do valor novo antes de ele estar no ar.
 *
 * Com `--sobra-como-aviso`, a sobra avisa e sai em 0. É o que o CI passa em PR
 * e na `develop`; no release para a `main` a chamada vem sem a flag, e aí a
 * sobra reprova — porque ali o estado é publicado e a api já devia ter subido.
 *
 * É a mesma assimetria do `verifica-cobertura.py` da collection, pelo mesmo
 * motivo: sem ela, todo valor novo travaria os dois repositórios até alguém
 * acertar a ordem do release.
 *
 * O que ele NÃO cobre
 * -------------------
 * Só a fatia enumerável, como o da landing. Campo que some, tipo que muda de
 * `string` para `number`, resposta que ganha nível — nada disso está aqui.
 * Começou pelo caso que já falhou duas vezes.
 */
import { readFileSync } from 'node:fs'

const API = process.env.API_URL ?? 'https://api.so-mais-um.com'
const sobraComoAviso = process.argv.includes('--sobra-como-aviso')

const problemas = []
const avisos = []
const conferido = []

function arquivo(caminho) {
  return readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf-8')
}

let spec
try {
  const resposta = await fetch(`${API}/docs.json`, { signal: AbortSignal.timeout(20_000) })
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
  spec = await resposta.json()
} catch (erro) {
  console.log(`\n⚠️  Não deu para ler o contrato da api (${erro.message}); nada conferido.`)
  console.log(`    A api fora do ar não é defeito daqui — este check não reprova por isso.\n`)
  process.exit(0)
}

// ── Os tipos de ocupação da agenda da quadra ────────────────────────────────
//
// O enum mora na resposta do `GET /courts/{courtId}/agenda`. É o mesmo que o
// `TipoDeOcupacao` da api, e a api tem teste garantindo que os dois batem.
{
  const fonte = 'src/types/api.ts'
  const agenda = spec.paths?.['/courts/{courtId}/agenda']

  const enums = [...JSON.stringify(agenda ?? {}).matchAll(/"enum":\s*\[([^\]]*)\]/g)]

  // Sem isto, uma mudança de forma no spec faria o script achar zero e aprovar
  // em silêncio — o mesmo modo de falhar que ele existe para evitar.
  if (enums.length !== 1) {
    problemas.push(
      `${fonte}: esperava um enum na resposta de /courts/{courtId}/agenda e achei ${enums.length} — ` +
        'a forma do spec mudou e este script deixou de enxergá-la',
    )
  } else {
    const naApi = [...enums[0][1].matchAll(/"([A-Z_]+)"/g)].map((m) => m[1]).sort()

    // Ancorado na interface, e não no primeiro `tipo:` do arquivo: hoje só há
    // uma união assim aqui, e é justamente por isso que a busca solta passaria
    // despercebida no dia em que houver duas.
    const bloco = arquivo(fonte).match(/export interface OcupacaoDaQuadra \{([\s\S]*?)\n\}/)
    const declarado = bloco?.[1].match(/tipo:\s*((?:'[^']*'|"[^"]*")(?:\s*\|\s*(?:'[^']*'|"[^"]*"))*)\s*;/)
    const noWeb = declarado
      ? [...declarado[1].matchAll(/['"]([A-Z_]+)['"]/g)].map((m) => m[1]).sort()
      : []

    if (noWeb.length === 0) {
      problemas.push(
        `${fonte}: não achei a união de \`tipo\` dentro de \`OcupacaoDaQuadra\` — ` +
          'a interface mudou de nome ou de forma, e este script deixou de enxergá-la',
      )
    }

    for (const t of naApi.filter((t) => !noWeb.includes(t))) {
      problemas.push(`${fonte}: a api serve \`${t}\` na agenda e a união do web não o tem`)
    }
    for (const t of noWeb.filter((t) => !naApi.includes(t))) {
      const linha =
        `${fonte}: a união do web tem \`${t}\` e a api não o serve` +
        (sobraComoAviso ? ' — normal entre o merge daqui e o deploy de lá' : '')
      ;(sobraComoAviso ? avisos : problemas).push(linha)
    }

    conferido.push(`${naApi.length} tipos de ocupação da quadra`)
  }
}

for (const a of avisos) console.log(`⚠ ${a}`)

if (problemas.length > 0) {
  console.error(`\n✗ O web diz sobre a api algo que ela desmente (${problemas.length}):\n`)
  for (const p of problemas) console.error(`  ${p}`)
  console.error('')
  process.exit(1)
}

const resumo = conferido.join(' · ')
console.log(
  avisos.length > 0
    ? `\n✓ Conferido em modo de aviso: ${resumo}; o estado publicado continua fatal.\n`
    : `\n✓ O web bate com o contrato da api: ${resumo}\n`,
)
