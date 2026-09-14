/**
 * Data, hora e número formatados à mão fora dos formatadores (web#492).
 *
 * O que esta conferência guarda
 * -----------------------------
 * Até a web#492, eram 50 chamadas a `toLocaleDateString` e `toLocaleTimeString`
 * espalhadas por 40 arquivos, cada uma com as próprias opções. O mesmo dia saía
 * "15/09/2026" num cartão e "ter., 15 de set" no outro, a nota média saía
 * "4.5" com ponto, e o preço saía "R$ 20.00".
 *
 * Os formatos passaram a ter nome em `src/utils/datas.ts`, `src/utils/numeros.ts`
 * e `src/utils/formatCurrency.ts`. Esta conferência reprova qualquer
 * `toLocaleDateString(`, `toLocaleTimeString(`, `toFixed(` ou
 * `toLocaleString('pt-BR'` fora desses três arquivos. Sem ela, a próxima tela
 * escreveria a própria data, e ninguém perceberia.
 *
 * Por que um script, e não um teste
 * ---------------------------------
 * Pela mesma razão do `verifica-primeira-tela.mjs`: ela lê arquivos, e não
 * módulos. Dentro da suíte, `node:fs` exigiria os tipos de Node no `src`
 * inteiro, e `import.meta.glob('?raw')` entraria no relatório de cobertura como
 * se o app todo tivesse rodado (medido: 74% viraram 83%).
 *
 * Uso: `npm run formatacao:check`
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const PERMITIDOS = new Set(['src/utils/datas.ts', 'src/utils/numeros.ts', 'src/utils/formatCurrency.ts'])
const PROIBIDO = /\.(toLocaleDateString|toLocaleTimeString|toFixed)\(|\.toLocaleString\('pt-BR'/

const soltos = readdirSync('src', { recursive: true })
  .map((relativo) => join('src', relativo))
  .filter((caminho) => /\.tsx?$/.test(caminho) && !/\.test\.tsx?$/.test(caminho) && !PERMITIDOS.has(caminho))
  .flatMap((caminho) =>
    readFileSync(caminho, 'utf8')
      .split('\n')
      .flatMap((linha, i) => (PROIBIDO.test(linha) ? [`  ${caminho}:${i + 1}  ${linha.trim()}`] : [])),
  )

if (soltos.length > 0) {
  console.error(`✗ Formatação à mão fora dos formatadores (${soltos.length}):\n`)
  console.error(soltos.join('\n'))
  console.error('\n  Use src/utils/datas.ts, src/utils/numeros.ts ou src/utils/formatCurrency.ts.')
  process.exit(1)
}

console.log('✓ Data, hora e número passam pelos formatadores')
