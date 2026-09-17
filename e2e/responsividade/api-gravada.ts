import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { request, type APIRequestContext, type Page, type Route } from '@playwright/test'
import { LOGINS, type Sessao } from './telas'

/**
 * A api da checagem, sem api (web#511).
 *
 * O build da suíte aponta o `VITE_API_URL` para `/api-gravada`, na mesma
 * origem do app: sem CORS, sem cookie, e sem risco de uma chamada escapar para
 * uma api de verdade no CI.
 *
 * - **Tocando** (padrão): cada GET é respondido com o que está em
 *   `respostas/<tela>.json`. O que não estiver lá volta 404 e sai como aviso.
 * - **Gravando** (`GRAVAR=1`): cada GET é repassado à api local
 *   (`API_REAL`, padrão `http://localhost:3000`), com a sessão aberta pelo
 *   Node, e a resposta é guardada.
 *
 * Nos dois modos, **nada que muda estado sai daqui**: POST, PUT, PATCH e DELETE
 * respondem `{ success: true }` sem tocar a api. Gravar não pode escrever no
 * banco de desenvolvimento, que é compartilhado.
 *
 * A sessão do app é só a marca `só+1:sessao` no localStorage (o token vive num
 * cookie httpOnly, ver `src/services/api.ts`). A suíte põe a marca, e o
 * `/auth/me` gravado diz quem é a pessoa: nenhum token vai para arquivo.
 */
export const GRAVANDO = process.env.GRAVAR === '1'
const API_REAL = process.env.API_REAL ?? 'http://localhost:3000'

/** Origem que a CORS da api local aceita. Só importa na gravação. */
const ORIGEM_ACEITA = process.env.ORIGEM_ACEITA ?? 'http://localhost:5175'

const PREFIXO = '/api-gravada'

interface Resposta {
  status: number
  corpo: unknown
}

export interface Gravacao {
  /** O relógio da página fica parado aqui ao tocar: "hoje" e "próxima partida" dependem dele. */
  gravadoEm: string
  respostas: Record<string, Resposta>
}

export const arquivoDeRespostas = (tela: string) => new URL(`./respostas/${tela}.json`, import.meta.url)

export function leGravacao(tela: string): Gravacao {
  const arquivo = arquivoDeRespostas(tela)
  if (!existsSync(arquivo)) {
    throw new Error(`Sem respostas gravadas para "${tela}". Grave com a api local: GRAVAR=1 npm run test:responsividade -- -g ${tela}`)
  }
  return JSON.parse(readFileSync(arquivo, 'utf8')) as Gravacao
}

export function salvaGravacao(tela: string, gravacao: Gravacao) {
  const ordenadas = Object.fromEntries(Object.entries(gravacao.respostas).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(arquivoDeRespostas(tela), JSON.stringify({ ...gravacao, respostas: ordenadas }, null, 2) + '\n')
}

/** `GET /places?b=2&a=1` e `GET /places?a=1&b=2` são a mesma resposta. */
function chaveDa(url: URL) {
  const caminho = url.pathname.slice(PREFIXO.length) || '/'
  const busca = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b))
  const query = new URLSearchParams(busca).toString()
  return `GET ${caminho}${query ? `?${query}` : ''}`
}

/**
 * Nada com cara de credencial vai para arquivo versionado, mesmo que a api um
 * dia passe a devolver: o valor é trocado, a chave fica (a tela pode depender
 * de ela existir).
 */
const CAMPO_SENSIVEL = /token|secret|senha|password|hash|cookie/i
function limpa(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(limpa)
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([k, v]) => [k, CAMPO_SENSIVEL.test(k) && typeof v === 'string' ? 'removido-na-gravacao' : limpa(v)]),
    )
  }
  return valor
}

export async function abreSessaoReal(sessao: Sessao): Promise<APIRequestContext> {
  const ctx = await request.newContext({
    baseURL: API_REAL,
    extraHTTPHeaders: { Origin: ORIGEM_ACEITA, 'X-Requested-With': 'XMLHttpRequest' },
  })
  if (sessao === 'visitante') return ctx
  const { email, senha } = LOGINS[sessao]
  const res = await ctx.post('/auth/login', { data: { email, password: senha } })
  if (!res.ok()) throw new Error(`Login de ${sessao} na api local falhou: ${res.status()}`)
  return ctx
}

interface Opcoes {
  page: Page
  gravacao: Gravacao
  /** Só na gravação: a sessão aberta na api local (sem login, para visitante). */
  apiReal?: APIRequestContext
  faltando: Set<string>
}

/**
 * Instala as rotas e devolve uma função que espera a rede da api assentar.
 * Não dá para usar `networkidle`: o stream de notificações segura conexão.
 */
export async function instalaApi({ page, gravacao, apiReal, faltando }: Opcoes) {
  let pendentes = 0
  let ultimaMudanca = Date.now()
  const muda = (d: number) => { pendentes += d; ultimaMudanca = Date.now() }

  await page.route(`**${PREFIXO}/**`, async (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())

    // O stream de notificações: 204 faz o EventSource desistir sem reconectar.
    if (url.pathname.endsWith('/notifications/stream')) return route.fulfill({ status: 204 })

    if (req.method() !== 'GET') return route.fulfill({ json: { success: true } })

    const chave = chaveDa(url)
    muda(+1)
    try {
      if (GRAVANDO) {
        const alvo = API_REAL + url.pathname.slice(PREFIXO.length) + url.search
        if (!apiReal) throw new Error('Gravando sem sessão na api local')
        const res = await apiReal.get(alvo)
        const texto = await res.text()
        let corpo: unknown = texto
        try { corpo = JSON.parse(texto) } catch { /* corpo não-JSON fica como texto */ }
        corpo = limpa(corpo)
        gravacao.respostas[chave] = { status: res.status(), corpo }
        return await responde(route, gravacao.respostas[chave])
      }
      const gravada = gravacao.respostas[chave]
      if (!gravada) {
        faltando.add(chave)
        return await route.fulfill({ status: 404, json: { success: false, message: 'Resposta não gravada' } })
      }
      return await responde(route, gravada)
    } finally {
      muda(-1)
    }
  })

  return async function esperaAssentar(quietoPor = 800, limite = 15_000) {
    const inicio = Date.now()
    while (Date.now() - inicio < limite) {
      if (pendentes === 0 && Date.now() - ultimaMudanca >= quietoPor) return
      await page.waitForTimeout(100)
    }
  }
}

function responde(route: Route, { status, corpo }: Resposta) {
  return typeof corpo === 'string'
    ? route.fulfill({ status, body: corpo })
    : route.fulfill({ status, json: corpo })
}

/**
 * O que não é o app nem a api gravada (o script do Google, a lista de países,
 * azulejo de mapa, avatar no Cloudinary) não sai para a internet: imagem vira
 * um pixel transparente, o resto é abortado. Medição não pode depender de rede
 * alheia.
 */
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
export async function bloqueiaRedeExterna(page: Page, origemDoApp: string) {
  await page.route((url) => url.origin !== origemDoApp, (route) => {
    if (route.request().resourceType() === 'image') return route.fulfill({ contentType: 'image/png', body: PIXEL })
    return route.abort()
  })
}
