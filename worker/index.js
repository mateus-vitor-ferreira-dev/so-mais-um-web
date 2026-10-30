/**
 * O Worker do app no Cloudflare. Só roda nas rotas `/partida/*` (`run_worker_first`
 * no `wrangler.jsonc`); o resto do app são os arquivos estáticos, servidos sem
 * passar por aqui.
 *
 * Só rastreador recebe o documento com as meta tags da prévia; gente de verdade
 * segue para o `index.html` do app. A lógica da prévia mora em `api/partida.js`.
 */
import { ROBOS, montaPrevia } from '../api/partida.js'

const PARTIDA = /^\/partida\/([^/]+)\/?$/

/** O id da URL decodificado; link malformado ("%E0") vira null em vez de derrubar o Worker */
function idDaPartida(pathname) {
  const bruto = pathname.match(PARTIDA)?.[1]
  if (!bruto) return null
  try {
    return decodeURIComponent(bruto)
  } catch {
    return null
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const id = idDaPartida(url.pathname)
    if (request.method !== 'GET' || !id || !ROBOS.test(request.headers.get('user-agent') ?? '')) {
      return env.ASSETS.fetch(request)
    }

    const { corpo, cabecalhos } = await montaPrevia({
      id,
      convite: url.searchParams.get('convite'),
      origem: url.origin,
      // No Cloudflare, as variáveis chegam no `env` de cada pedido, e não em `process.env`
      base: env.API_URL || '',
    })
    return new Response(corpo, { status: 200, headers: cabecalhos })
  },
}
