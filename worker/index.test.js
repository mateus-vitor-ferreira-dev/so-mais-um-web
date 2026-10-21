/**
 * A prévia do link no Worker do Cloudflare: quem recebe o cartão e quem segue para
 * o app. O conteúdo do cartão já é testado em `api/partida.test.js`.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

import worker from './index.js'

const PARTIDA = {
  id: 'partida-1',
  date: '2026-08-24T22:00:00.000Z',
  maxPlayers: 10,
  totalValue: '200.00',
  _count: { participations: 6 },
  court: { name: 'Quadra 2', place: { name: 'Arena Central' } },
}

function chama(userAgent, caminho = '/partida/partida-1', vars = { API_URL: 'https://api.so-mais-um.com' }) {
  const ASSETS = { fetch: vi.fn().mockResolvedValue(new Response('<div id="root"></div>')) }
  const request = new Request(`https://app.so-mais-um.com${caminho}`, { headers: { 'user-agent': userAgent } })
  return { ASSETS, resposta: worker.fetch(request, { ...vars, ASSETS }) }
}

afterEach(() => vi.restoreAllMocks())

describe('prévia do link no Cloudflare', () => {
  it('gente de verdade segue para o app, sem chamar a API', async () => {
    globalThis.fetch = vi.fn()
    const { ASSETS, resposta } = chama('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')

    await resposta

    expect(ASSETS.fetch).toHaveBeenCalled()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('o rastreador do WhatsApp recebe o cartão com os dados da partida', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: PARTIDA }) })
    const { ASSETS, resposta } = chama('WhatsApp/2.23.20.0')

    const r = await resposta
    const corpo = await r.text()

    expect(ASSETS.fetch).not.toHaveBeenCalled()
    expect(r.status).toBe(200)
    expect(r.headers.get('Content-Type')).toContain('text/html')
    expect(corpo).toContain('Arena Central · Quadra 2')
    expect(corpo).toContain('content="https://app.so-mais-um.com/og-image.png"')
  })

  it('lê o endereço da API das variáveis do Worker e repassa o convite', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: PARTIDA }) })
    const { resposta } = chama('facebookexternalhit/1.1', '/partida/partida-1?convite=token-abc', {
      API_URL: 'https://outra-api.exemplo',
    })

    const corpo = await (await resposta).text()

    const [url] = globalThis.fetch.mock.calls[0]
    expect(String(url)).toBe('https://outra-api.exemplo/events/partida-1?convite=token-abc')
    expect(corpo).toContain('/partida/partida-1?convite=token-abc')
  })

  it('sem API configurada, o rastreador recebe a prévia genérica', async () => {
    globalThis.fetch = vi.fn()
    const { resposta } = chama('Twitterbot/1.0', '/partida/partida-1', {})

    const corpo = await (await resposta).text()

    expect(corpo).toContain('Só+1 — Achou jogo.')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('link malformado segue para o app em vez de derrubar o Worker', async () => {
    globalThis.fetch = vi.fn()
    const { ASSETS, resposta } = chama('WhatsApp/2.23.20.0', '/partida/%E0%A4%A')

    await resposta

    expect(ASSETS.fetch).toHaveBeenCalled()
  })

  it('outras rotas dentro de /partida, como subpáginas, seguem para o app', async () => {
    globalThis.fetch = vi.fn()
    const { ASSETS, resposta } = chama('WhatsApp/2.23.20.0', '/partida/partida-1/editar')

    await resposta

    expect(ASSETS.fetch).toHaveBeenCalled()
  })
})
