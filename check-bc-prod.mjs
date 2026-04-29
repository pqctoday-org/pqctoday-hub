import { chromium } from '@playwright/test'

const b = await chromium.launch()
const ctx = await b.newContext()
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) =>
  errs.push('PAGEERROR: ' + e.message + ' :: ' + (e.stack || '').slice(0, 600))
)
p.on('console', (m) => {
  if (m.type() === 'error') errs.push('CONSOLE: ' + m.text())
})
await p.goto('http://localhost:4173/business', { waitUntil: 'networkidle', timeout: 30000 })
await p.waitForTimeout(8000)
const fullBody = await p.locator('body').innerText()
console.log('BODY (first 400):', fullBody.slice(0, 400))
const wipMatch = fullBody.match(/Work in progress[^\n]*/)
console.log('WIP banner:', wipMatch ? wipMatch[0].slice(0, 200) : '(not found)')
console.log('ERRORS:')
errs.forEach((e) => console.log('  ' + e.slice(0, 600)))
await b.close()
