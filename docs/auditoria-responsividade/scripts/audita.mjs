// uso: node audita.mjs <rota> <prefixo> [tema]
import { createRequire } from 'module'
const require = createRequire('/home/gedai/.npm/_npx/705bc6b22212b352/node_modules/')
const { chromium } = require('playwright')
const [rota, prefixo, tema = 'light'] = process.argv.slice(2)
const DIR = '' + (process.env.SAIDA ?? '.') + '/shots'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: tema })
const page = await ctx.newPage()
await page.goto('http://localhost:5173/login')
await page.fill('input[type=email]', process.env.EMAIL ?? 'mateus.ferreira10profissional@gmail.com')
await page.fill('input[type=password]', process.env.SENHA ?? 'admin123')
await page.keyboard.press('Enter')
await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 15000 })
for (const w of [360, 390, 768, 1280]) {
  const touch = w < 1024
  const c = await browser.newContext({ viewport: { width: w, height: 800 }, colorScheme: tema, hasTouch: touch, isMobile: touch, storageState: await ctx.storageState() })
  const p = await c.newPage()
  if (process.env.MOCK_SOLIC) await p.route(/:3000\/place-requests(\?|$)/, r => r.fulfill({ json: { success: true, data: [
    { id: 'm1', name: 'Arena Beach Poliesportiva Rafael Salustiano do Vale', status: 'PENDING', owner: { name: 'Fernanda Albuquerque Monteiro', email: 'fernanda.albuquerque.monteiro@arenabeachpoliesportiva.com.br' }, createdAt: '2026-09-15T12:00:00Z' },
    { id: 'm2', name: 'Quadra do Zé', status: 'APPROVED', owner: { name: 'José', email: 'ze@quadra.com' }, createdAt: '2026-09-10T12:00:00Z' },
    { id: 'm3', name: 'Society Lavras', status: 'REJECTED', owner: { name: 'Ana', email: 'ana@society.com' }, createdAt: '2026-09-01T12:00:00Z' },
  ] } }))
  await p.goto('http://localhost:5173' + rota, { waitUntil: 'load' })
  await p.waitForTimeout(2500)
  const r = await p.evaluate(() => {
    const W = innerWidth, vaza = [], pequenos = []
    for (const el of document.querySelectorAll('body *')) {
      const b = el.getBoundingClientRect()
      const gaveta = el.closest('aside')
      if (gaveta && gaveta.getBoundingClientRect().right <= 0) continue
      // Conteúdo da RolagemHorizontal rola por dentro de propósito: conta só a faixa.
      const faixa = el.closest('[role=region][tabindex]')
      if (faixa && faixa !== el) continue
      if (!b.width || getComputedStyle(el).visibility === 'hidden') continue
      if (b.right > W + 1 || b.left < -1) vaza.push(`${el.tagName.toLowerCase()}.${(el.className?.baseVal ?? el.className ?? '').toString().split(' ').pop()} ${Math.round(b.left)}→${Math.round(b.right)} "${(el.textContent||'').trim().slice(0,30)}"`)
      if (el.matches('button, a, input, select, [role=button]') && !el.classList.contains('alvo-do-cartao') && (b.height < 44 || b.width < 44)) pequenos.push(`${el.tagName.toLowerCase()} ${Math.round(b.width)}x${Math.round(b.height)} "${(el.textContent||el.placeholder||'').trim().slice(0,20)}"`)
    }
    return { vaza, pequenos }
  })
  console.log(`\n== ${w}px: ${r.vaza.length} vazando, ${r.pequenos.length} alvos < 44`)
  r.vaza.slice(0, 8).forEach(x => console.log('  vaza', x))
  r.pequenos.slice(0, 6).forEach(x => console.log('  alvo', x))
  await p.screenshot({ path: `${DIR}/${prefixo}-${w}-${tema}.png` })
  if (process.env.MOCK_SOLIC && w === 360) { await p.getByRole('button', { name: /Rejeitar/ }).first().click(); await p.waitForTimeout(400); await p.screenshot({ path: `${DIR}/${prefixo}-modal-${w}-${tema}.png` }) }
  await c.close()
}
await browser.close()
