/**
 * A prévia do link da partida (#229).
 *
 * É o código mais fácil de quebrar sem ninguém notar do repositório inteiro:
 * ele não aparece na tela de ninguém, só no cartão que o WhatsApp desenha. Os
 * testes aqui são o único lugar onde isso falha alto.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

import { montaPrevia } from './partida.js'

const PARTIDA = {
  id: 'partida-1',
  date: '2026-08-24T22:00:00.000Z',
  maxPlayers: 10,
  totalValue: '200.00',
  _count: { participations: 6 },
  court: { name: 'Quadra 2', place: { name: 'Arena Central' } },
}

const PEDIDO = { origem: 'https://app.so-mais-um.com', base: 'https://api.so-mais-um.com' }

async function roda(entrada, resposta) {
  globalThis.fetch = vi.fn().mockResolvedValue(resposta)
  return montaPrevia({ ...PEDIDO, ...entrada })
}

const ok = (data) => ({ ok: true, json: async () => ({ success: true, data }) })
const recusa = { ok: false, json: async () => ({}) }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('prévia do link — a partida no cartão', () => {
  it('põe data, local, vagas e preço no título e na descrição', async () => {
    const res = await roda({ id: 'partida-1' }, ok(PARTIDA))

    expect(res.corpo).toContain('og:title')
    // Data em horário de Brasília, não em UTC: 22:00Z é 19:00 aqui.
    expect(res.corpo).toMatch(/og:title" content="Partida [^"]*19:00/)
    expect(res.corpo).toContain('Arena Central · Quadra 2')
    expect(res.corpo).toContain('4 vagas')
    expect(res.corpo).toContain('por pessoa')
  })

  it('diz "Lotada" quando não há vaga, em vez de "0 vagas"', async () => {
    const res = await roda({ id: 'partida-1' }, ok({ ...PARTIDA, _count: { participations: 10 } }))

    expect(res.corpo).toContain('Lotada')
    expect(res.corpo).not.toContain('0 vagas')
  })

  it('usa o singular quando resta uma vaga só', async () => {
    const res = await roda({ id: 'partida-1' }, ok({ ...PARTIDA, _count: { participations: 9 } }))

    expect(res.corpo).toContain('1 vaga ')
  })

  it('repassa o convite para a API', async () => {
    await roda({ id: 'partida-1', convite: 'token-abc' }, ok(PARTIDA))

    const [url] = globalThis.fetch.mock.calls[0]
    expect(String(url)).toContain('/events/partida-1')
    expect(String(url)).toContain('convite=token-abc')
  })

  it('aponta a imagem e a URL para a origem do pedido', async () => {
    const res = await roda({ id: 'partida-1', convite: 'token-abc' }, ok(PARTIDA))

    expect(res.corpo).toContain('content="https://app.so-mais-um.com/og-image.png"')
    // A URL da prévia leva o convite: é ela que o cartão abre ao ser tocado, e
    // sem o token a partida por link responderia 404.
    expect(res.corpo).toContain('/partida/partida-1?convite=token-abc')
  })
})

describe('prévia do link — quando não dá para saber da partida', () => {
  it('cai na prévia genérica quando a API recusa', async () => {
    // Partida privada sem convite, convite morto, partida inexistente: todos
    // caem aqui. **A regra de quem pode ver continua sendo a da API** — esta
    // função não tem uma segunda cópia dela.
    const res = await roda({ id: 'partida-1' }, recusa)

    expect(res.corpo).toContain('Só+1 — Achou jogo.')
    expect(res.corpo).not.toContain('Arena Central')
  })

  it('cai na genérica quando a rede falha, sem estourar', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('sem rede'))

    const res = await montaPrevia({ ...PEDIDO, id: 'partida-1' })

    // Prévia é enfeite, e enfeite não pode derrubar nada.
    expect(res.corpo).toContain('Só+1 — Achou jogo.')
  })

  it('cai na genérica quando o endereço da API não está configurado', async () => {
    globalThis.fetch = vi.fn()

    const res = await montaPrevia({ ...PEDIDO, base: '', id: 'partida-1' })

    expect(res.corpo).toContain('Só+1 — Achou jogo.')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})

describe('prévia do link — as garantias do documento', () => {
  it('escapa o que vem da API, que vai parar dentro de um atributo', async () => {
    const res = await roda({ id: 'partida-1' }, ok({
      ...PARTIDA,
      court: { name: 'Quadra "A"', place: { name: '<script>alert(1)</script>' } },
    }))

    // Nome de quadra é texto que o dono digitou. Sem escapar, uma aspa fecha o
    // atributo e o resto vira marcação.
    expect(res.corpo).not.toContain('<script>alert(1)</script>')
    expect(res.corpo).toContain('&lt;script&gt;')
    expect(res.corpo).toContain('Quadra &quot;A&quot;')
  })

  it('leva um refresh e um link visível, para o humano que cair aqui por engano', async () => {
    const res = await roda({ id: 'partida-1' }, ok(PARTIDA))

    // A lista de rastreadores pode errar para mais. Quando
    // errar, a pessoa chega ao app do mesmo jeito.
    expect(res.corpo).toContain('http-equiv="refresh"')
    expect(res.corpo).toContain('<a href=')
  })

  it('deixa o cartão no cache da borda, e não no do navegador', async () => {
    const res = await roda({ id: 'partida-1' }, ok(PARTIDA))

    expect(res.cabecalhos['Content-Type']).toContain('text/html')
    expect(res.cabecalhos['Cache-Control']).toContain('s-maxage=300')
  })
})
