import { createRequire } from 'module'
import { writeFileSync } from 'fs'
const require = createRequire('/home/gedai/.npm/_npx/705bc6b22212b352/node_modules/')
const { chromium } = require('playwright')
const DIR = '' + (process.env.SAIDA ?? '.') + ''
const ADMIN = ['mateus.ferreira10profissional@gmail.com', 'admin123']
const DONO = ['contato@napraialavras.com.br', 'senha123']
const TELAS = [
  { area: 'Admin', nome: 'Gestão de Usuários', rota: '/admin/users', login: ADMIN },
  { area: 'Admin', nome: 'Visão Geral', rota: '/admin/dashboard', login: ADMIN },
  { area: 'Admin', nome: 'Estabelecimentos', rota: '/admin/places', login: ADMIN },
  { area: 'Admin', nome: 'Solicitações', rota: '/admin/requests', login: ADMIN, mock: true },
  { area: 'Dono', nome: 'Visão Geral', rota: '/owner/dashboard', login: DONO },
  { area: 'Dono', nome: 'Turmas', rota: '/owner/turmas', login: DONO },
  { area: 'Dono', nome: 'Meus Estabelecimentos', rota: '/owner/places', login: DONO },
  { area: 'Dono', nome: 'Quadras', rota: '/owner/places/cmu2qp3bk004vpk1xajo58ucp/courts', login: DONO },
  { area: 'Dono', nome: 'Estoque', rota: '/owner/inventory', login: DONO },
]
const VERSOES = { antes: 'http://localhost:5175', depois: 'http://localhost:5176' }
const MOCK = { success: true, data: [
  { id: 'm1', name: 'Arena Beach Poliesportiva Rafael Salustiano do Vale', status: 'PENDING', owner: { name: 'Fernanda Albuquerque Monteiro', email: 'fernanda.albuquerque.monteiro@arenabeachpoliesportiva.com.br' }, createdAt: '2026-09-15T12:00:00Z' },
  { id: 'm2', name: 'Quadra do Zé', status: 'APPROVED', owner: { name: 'José', email: 'ze@quadra.com' }, createdAt: '2026-09-10T12:00:00Z' },
  { id: 'm3', name: 'Society Lavras', status: 'REJECTED', owner: { name: 'Ana', email: 'ana@society.com' }, createdAt: '2026-09-01T12:00:00Z' },
] }

function medir(toque) {
  const W = innerWidth
  const fechada = (el) => { const a = el.closest('aside'); return a && a.getBoundingClientRect().right <= 0 }
  const naFaixa = (el) => { const f = el.closest('[role=region][tabindex]'); return f && f !== el }
  const visivel = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const rgba = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; return [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]] }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const fundo = (el) => {
    const camadas = []
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e)
      if (s.backgroundImage !== 'none') return null
      const c = rgba(s.backgroundColor)
      if (c && c[3] > 0) { camadas.push(c); if (c[3] >= 1) break }
    }
    let cor = [255, 255, 255]
    for (const c of camadas.reverse()) cor = cor.map((v, i) => c[i] * c[3] + v * (1 - c[3]))
    return cor
  }
  const r = { vazando: 0, controlesFora: 0, alvosPequenos: 0, textoMenor12: 0, camposMenor16: 0, contrasteBaixo: 0, textos: 0, exemplos: { vazando: [], alvos: [], contraste: [] } }
  for (const el of document.querySelectorAll('body *')) {
    if (fechada(el) || naFaixa(el) || !visivel(el)) continue
    const b = el.getBoundingClientRect(); const s = getComputedStyle(el)
    const controle = el.matches('button, a[href], input, select, textarea, [role=button]')
    if (b.right > W + 1 || b.left < -1) { r.vazando++; if (controle) r.controlesFora++; if (r.exemplos.vazando.length < 3) r.exemplos.vazando.push((el.textContent || el.tagName).trim().slice(0, 30)) }
    if (toque && controle && !el.classList.contains('alvo-do-cartao')) {
      let pequeno = b.height < 44 || b.width < 44
      if (pequeno && el.matches('input[type=checkbox], input[type=radio]')) { const l = el.closest('label'); if (l && l.getBoundingClientRect().height >= 44) pequeno = false }
      if (pequeno) { r.alvosPequenos++; if (r.exemplos.alvos.length < 4) r.exemplos.alvos.push(`${(el.textContent || el.getAttribute('aria-label') || el.type || '').trim().slice(0, 20)} ${Math.round(b.width)}×${Math.round(b.height)}`) }
    }
    if (toque && el.matches('input:not([type=checkbox]):not([type=radio]), select, textarea') && parseFloat(s.fontSize) < 16) r.camposMenor16++
    const temTexto = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (!temTexto) continue
    r.textos++
    const fs = parseFloat(s.fontSize)
    if (fs > 0 && fs < 12) r.textoMenor12++
    const fg = rgba(s.color); const bg = fundo(el)
    if (!fg || !bg || +s.opacity < 1 || el.closest('[disabled], [aria-disabled=true]') || el.closest('button:disabled')) continue
    const cor = fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]))
    const [a, c] = [lum(cor), lum(bg)]; const razao = (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05)
    const grande = fs >= 24 || (fs >= 18.66 && +s.fontWeight >= 700)
    if (razao < (grande ? 3 : 4.5)) { r.contrasteBaixo++; if (r.exemplos.contraste.length < 4) r.exemplos.contraste.push(`"${el.textContent.trim().slice(0, 22)}" ${razao.toFixed(2)}:1`) }
  }
  return r
}

const b = await chromium.launch()
const sessoes = {}
async function estado(base, login) {
  const k = base + login[0]; if (sessoes[k]) return sessoes[k]
  const c = await b.newContext(); const p = await c.newPage()
  await p.goto(base + '/login'); await p.fill('input[type=email]', login[0]); await p.fill('input[type=password]', login[1])
  await p.keyboard.press('Enter'); await p.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 })
  sessoes[k] = await c.storageState(); await c.close(); return sessoes[k]
}
const saida = []
for (const tela of TELAS) for (const [versao, base] of Object.entries(VERSOES)) {
  for (const [largura, tema] of [[360, 'light'], [390, 'light'], [768, 'light'], [1280, 'light'], [390, 'dark'], [1280, 'dark']]) {
    const toque = largura < 1024
    const c = await b.newContext({ viewport: { width: largura, height: 800 }, hasTouch: toque, isMobile: toque, colorScheme: tema, storageState: await estado(base, tela.login) })
    await c.addInitScript((t) => { try { localStorage.setItem('só+1:theme', t) } catch {} }, tema)
    const p = await c.newPage()
    if (tela.mock) await p.route(/:3000\/place-requests(\?|$)/, (rt) => rt.fulfill({ json: MOCK }))
    await p.goto(base + tela.rota, { waitUntil: 'load' }); await p.waitForTimeout(2500)
    const m = await p.evaluate(medir, toque)
    if (largura === 390 && tema === 'light') await p.screenshot({ path: `${DIR}/metricas/${tela.area}-${tela.nome}-${versao}.png`.replace(/ /g, '_') })
    saida.push({ ...tela, login: undefined, versao, largura, tema, ...m })
    console.log(tela.area, tela.nome, versao, largura, tema, JSON.stringify({ v: m.vazando, a: m.alvosPequenos, t: m.textoMenor12, f: m.camposMenor16, c: m.contrasteBaixo }))
    await c.close()
  }
}
writeFileSync(`${DIR}/metricas.json`, JSON.stringify(saida, null, 1))
await b.close()
