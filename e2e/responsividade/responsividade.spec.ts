import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { abreSessaoReal, bloqueiaRedeExterna, GRAVANDO, instalaApi, leGravacao, salvaGravacao, type Gravacao } from './api-gravada'
import { diferenca, medir, type Ocorrencias } from './medir'
import { LARGURAS, TELAS } from './telas'

/**
 * A checagem de responsividade no CI (web#511).
 *
 * Mede cada tela de `telas.ts` a 360 e 390px, como celular (toque), e compara
 * com `conhecidos/<tela>.json`:
 * - **ocorrência nova** (fora da lista) reprova;
 * - **conhecida que sumiu** só avisa, pedindo para tirá-la da lista. A lista só
 *   encolhe.
 *
 * Variáveis:
 * - `GRAVAR=1`: grava de novo as respostas da api (precisa da api local, com
 *   a seed, em `API_REAL`, padrão `http://localhost:3000`);
 * - `ATUALIZAR_CONHECIDOS=1`: reescreve a lista de conhecidos com o que foi
 *   medido. Serve para a primeira gravação de uma tela e para tirar o que
 *   sumiu; acrescentar ocorrência nova à lista precisa de justificativa no PR.
 */
const ATUALIZANDO = process.env.ATUALIZAR_CONHECIDOS === '1'

type Conhecidos = Record<string, Ocorrencias>
interface ArquivoDeConhecidos {
  rota: string
  larguras: Record<string, Ocorrencias>
}

const arquivoDeConhecidos = (tela: string) => new URL(`./conhecidos/${tela}.json`, import.meta.url)

function leConhecidos(tela: string): Conhecidos {
  const arquivo = arquivoDeConhecidos(tela)
  if (!existsSync(arquivo)) return {}
  return (JSON.parse(readFileSync(arquivo, 'utf8')) as ArquivoDeConhecidos).larguras
}

const avisa = (mensagem: string) => {
  test.info().annotations.push({ type: 'aviso', description: mensagem })
  // O GitHub Actions transforma esta linha em aviso no resumo do job.
  console.log(process.env.CI ? `::warning::${mensagem.replace(/\n/g, '%0A')}` : `AVISO: ${mensagem}`)
}

const lista = (itens: string[]) => itens.map((i) => `  - ${i}`).join('\n')

for (const tela of TELAS) {
  test(tela.id, async ({ browser, baseURL }) => {
    const gravacao: Gravacao = GRAVANDO ? { gravadoEm: new Date().toISOString(), respostas: {} } : leGravacao(tela.id)
    const apiReal = GRAVANDO ? await abreSessaoReal(tela.sessao) : undefined
    const conhecidos = leConhecidos(tela.id)
    const medido: Record<string, Ocorrencias> = {}
    const falhas: string[] = []

    try {
      for (const largura of LARGURAS) {
        await test.step(`${largura}px`, async () => {
          const contexto = await browser.newContext({
            viewport: { width: largura, height: 800 },
            isMobile: true,
            hasTouch: true,
            deviceScaleFactor: 2,
          })
          const logado = tela.sessao !== 'visitante'
          await contexto.addInitScript((logado) => {
            try {
              localStorage.setItem('só+1:theme', 'light')
              if (logado) localStorage.setItem('só+1:sessao', '1')
            } catch { /* sem storage, a tela abre como visitante e a checagem de rota acusa */ }
          }, logado)

          const page = await contexto.newPage()
          await page.clock.setFixedTime(new Date(gravacao.gravadoEm))
          await bloqueiaRedeExterna(page, new URL(baseURL!).origin)
          const faltando = new Set<string>()
          const esperaAssentar = await instalaApi({ page, gravacao, apiReal, faltando })

          await page.goto(tela.rota, { waitUntil: 'load' })
          await esperaAssentar()
          await page.evaluate(() => document.fonts.ready.then(() => undefined))
          await page.waitForTimeout(300)

          if (logado) {
            expect(new URL(page.url()).pathname, `a sessão de ${tela.sessao} não abriu: a tela caiu no login`).not.toBe('/login')
          }
          if (faltando.size) {
            avisa(`${tela.id} ${largura}px: pedidos sem resposta gravada (a tela foi medida com 404 neles). Grave de novo com GRAVAR=1:\n${lista([...faltando])}`)
          }

          const atual = await page.evaluate(medir, largura)
          medido[largura] = atual
          const conhecido = conhecidos[largura] ?? { vazando: [], alvos: [] }

          for (const [tipo, titulo] of [['vazando', 'passando da borda'], ['alvos', 'alvo de toque < 44px']] as const) {
            const novos = diferenca(atual[tipo], conhecido[tipo])
            const sumidos = diferenca(conhecido[tipo], atual[tipo])
            if (novos.length) falhas.push(`${largura}px, ${titulo}:\n${lista(novos)}`)
            if (sumidos.length && !ATUALIZANDO) {
              avisa(`${tela.id} ${largura}px: ${sumidos.length} conhecido(s) de "${titulo}" sumiram. Tire da lista com ATUALIZAR_CONHECIDOS=1:\n${lista(sumidos)}`)
            }
          }

          if (falhas.length) await test.info().attach(`${tela.id}-${largura}.png`, { body: await page.screenshot(), contentType: 'image/png' })
          await contexto.close()
        })
      }
    } finally {
      await apiReal?.dispose()
    }

    if (GRAVANDO) salvaGravacao(tela.id, gravacao)

    if (ATUALIZANDO) {
      const arquivo: ArquivoDeConhecidos = { rota: tela.rota, larguras: medido }
      writeFileSync(arquivoDeConhecidos(tela.id), JSON.stringify(arquivo, null, 2) + '\n')
      return
    }

    expect(
      falhas,
      `${tela.id} (${tela.rota}) tem ocorrência nova fora de conhecidos/${tela.id}.json. ` +
      'Corrija a tela; só acrescente à lista com justificativa no PR.',
    ).toEqual([])
  })
}
