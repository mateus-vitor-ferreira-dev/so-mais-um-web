// uso: node chamada.mjs <prefixo> <largura> <tema>
import { createRequire } from 'module'
const require = createRequire('/home/gedai/.npm/_npx/705bc6b22212b352/node_modules/')
const { chromium } = require('playwright')
const [prefixo, largura, tema] = process.argv.slice(2)
const b = await chromium.launch()
const c = await b.newContext({ viewport: { width: +largura, height: 800 }, colorScheme: tema, hasTouch: true, isMobile: true })
const p = await c.newPage()
await p.goto('http://localhost:5173/login')
await p.fill('input[type=email]', 'contato@napraialavras.com.br'); await p.fill('input[type=password]', 'senha123')
await p.keyboard.press('Enter'); await p.waitForURL(u => !u.pathname.startsWith('/login'))
await p.evaluate((t) => localStorage.setItem('só+1:theme', t), tema)
await p.goto('http://localhost:5173/owner/turmas'); await p.waitForTimeout(2500)
await p.getByRole('button', { name: /^Chamada$/ }).first().click(); await p.waitForTimeout(1500)
await p.fill('input[type=date]', '2026-09-08'); await p.waitForTimeout(1500)
await p.getByRole('button', { name: /chamada/i }).first().click(); await p.waitForTimeout(1500)
const r = await p.evaluate(() => {
  const W = innerWidth, vaza = [], alvos = []
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('aside')) continue
    const x = el.getBoundingClientRect(); if (!x.width) continue
    if (x.right > W + 1) vaza.push(el.tagName + ' ' + (el.textContent || '').trim().slice(0, 20))
    if (el.matches('button, input, select, label:has(input[type=radio])') && (x.height < 44 || x.width < 44)) {
      if (el.matches('input[type=radio]') && el.closest('label').getBoundingClientRect().height >= 44) continue
      alvos.push(`${el.tagName} ${Math.round(x.width)}x${Math.round(x.height)} ${(el.textContent || el.type).trim().slice(0, 16)}`)
    }
  }
  return { vaza: vaza.length, alvos }
})
console.log('vazando', r.vaza, 'alvos', r.alvos.length); r.alvos.forEach(a => console.log('  ', a))
await p.screenshot({ path: `shots/${prefixo}-${largura}-${tema}.png` })
await b.close()
