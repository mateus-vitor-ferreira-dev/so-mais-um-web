// uso: EMAIL= SENHA= node rola.mjs <rota> <prefixo> <largura> [tema]
import { createRequire } from 'module'
const require = createRequire('/home/gedai/.npm/_npx/705bc6b22212b352/node_modules/')
const { chromium } = require('playwright')
const [rota, prefixo, largura = '360', tema = 'light'] = process.argv.slice(2)
const DIR = '' + (process.env.SAIDA ?? '.') + '/shots'
const b = await chromium.launch()
const c = await b.newContext({ viewport: { width: +largura, height: 800 }, colorScheme: tema, hasTouch: true, isMobile: true })
const p = await c.newPage()
await p.goto('http://localhost:5173/login')
await p.fill('input[type=email]', process.env.EMAIL); await p.fill('input[type=password]', process.env.SENHA)
await p.keyboard.press('Enter'); await p.waitForURL(u => !u.pathname.startsWith('/login'))
if (tema === 'dark') await p.evaluate(() => localStorage.setItem('só+1:theme', 'dark'))
await p.goto('http://localhost:5173' + rota); await p.waitForTimeout(3000)
for (let i = 0; i < 4; i++) {
  await p.screenshot({ path: `${DIR}/${prefixo}-rola${i}-${largura}-${tema}.png` })
  const fim = await p.evaluate(() => {
    const el = [...document.querySelectorAll('main, div')].find(e => { const s = getComputedStyle(e); return /auto|scroll/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 10 && e.clientHeight > 400 })
    if (!el) return true
    el.scrollTop += 700; return el.scrollTop + el.clientHeight >= el.scrollHeight - 2
  })
  await p.waitForTimeout(400)
  if (fim) { await p.screenshot({ path: `${DIR}/${prefixo}-rola${i + 1}-${largura}-${tema}.png` }); break }
}
await b.close()
