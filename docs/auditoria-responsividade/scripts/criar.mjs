// uso: node criar.mjs <prefixo> <porta> <tema>
import { createRequire } from 'module'
const require = createRequire('/home/gedai/.npm/_npx/705bc6b22212b352/node_modules/')
const { chromium } = require('playwright')
const [prefixo, porta = '5173', tema = 'light'] = process.argv.slice(2)
const b = await chromium.launch()
const c = await b.newContext({ viewport: { width: 360, height: 800 }, colorScheme: tema, hasTouch: true, isMobile: true })
const p = await c.newPage()
const base = 'http://localhost:' + porta
await p.goto(base + '/login'); await p.fill('input[type=email]', 'mateus@player.com'); await p.fill('input[type=password]', 'senha123'); await p.keyboard.press('Enter'); await p.waitForURL(u => !u.pathname.startsWith('/login'))
await p.evaluate((t) => localStorage.setItem('só+1:theme', t), tema)
await p.goto(base + '/criar-partida'); await p.waitForTimeout(2500)
const medir = async (nome) => {
  const r = await p.evaluate(() => {
    const W = innerWidth, a = []; let v = 0
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('aside')) continue
      const x = el.getBoundingClientRect(); if (!x.width) continue
      if (x.right > W + 1) v++
      if (el.matches('button, a[href], input:not([type=hidden]), select, textarea, [role=button]') && (x.height < 44 || x.width < 44)) {
        const l = el.closest('label'); if (el.matches('[type=checkbox],[type=radio]') && l && l.getBoundingClientRect().height >= 44) continue
        a.push(`${el.tagName} ${Math.round(x.width)}x${Math.round(x.height)} ${(el.textContent || el.placeholder || el.type || '').trim().slice(0, 18)}`)
      }
    }
    return { v, a }
  })
  console.log(nome, 'vazando', r.v, 'alvos', r.a.length, r.a.slice(0, 6).join(' | '))
  await p.screenshot({ path: `shots/${prefixo}-${nome}.png` })
}
await medir('1-modalidade')
await p.getByText('Beach Tennis').first().click(); await p.waitForTimeout(1500); await medir('2-local')
await p.getByText('Na Praia FTV Lavras').first().click(); await p.waitForTimeout(1500); await medir('3-quadra')
const el = await p.evaluateHandle(() => [...document.querySelectorAll('main, div')].find(e => /auto|scroll/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 10 && e.clientHeight > 400))
await el.evaluate(e => { if (e) e.scrollTop = e.scrollHeight }); await p.waitForTimeout(500); await medir('4-detalhes-fim')
await p.getByLabel('Adicionar uma regra de entrada').selectOption({ index: 1 }).catch(() => {}); await p.waitForTimeout(800); await el.evaluate(e => { if (e) e.scrollTop = e.scrollHeight }); await p.waitForTimeout(500); await medir('5-com-regra')
await b.close()
