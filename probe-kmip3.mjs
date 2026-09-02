import { chromium } from '/Users/pqctoday/Antigravity/pqctoday-hub-kmip-workshop-redesign/node_modules/playwright/index.mjs'
const base = 'http://localhost:5186'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } })
await ctx.addInitScript(() => {
  localStorage.setItem(
    'pqc-version-storage',
    JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
  )
})
const page = await ctx.newPage()
const dismiss = async () => {
  const b = page.getByRole('button', { name: 'I Understand' })
  if (await b.count())
    await b
      .first()
      .click()
      .catch(() => {})
}
const sel = async () =>
  (
    await page
      .locator('[data-tour="kmip-tabs"] [role="tab"][aria-selected="true"]')
      .innerText()
      .catch(() => '?')
  ).trim()
await page.goto(base + '/playground/cacp', { waitUntil: 'networkidle' })
await dismiss()
await page.evaluate(() => {
  const k = 'pqc-learning-persona'
  const cur = JSON.parse(localStorage.getItem(k) || '{"state":{},"version":0}')
  cur.state.selectedPersona = 'curious'
  localStorage.setItem(k, JSON.stringify(cur))
})
await page.goto(base + '/playground/cacp?tab=dev', { waitUntil: 'networkidle' })
await dismiss()
await page.locator('[data-tour="kmip-tabs"]').waitFor({ timeout: 60000 })
await page.waitForTimeout(800)
console.log('curious + ?tab=dev → selected:', await sel(), '| url', page.url().replace(base, ''))
await page.evaluate(() => {
  const k = 'pqc-learning-persona'
  const cur = JSON.parse(localStorage.getItem(k))
  cur.state.selectedPersona = 'developer'
  localStorage.setItem(k, JSON.stringify(cur))
})
await page.goto(base + '/playground/cacp?tab=operate&op=CreateKeyPair', {
  waitUntil: 'networkidle',
})
await dismiss()
await page.locator('[data-tour="kmip-commands"]').waitFor({ timeout: 60000 })
await page.waitForTimeout(1500)
const expanded = await page.locator('[data-tour="kmip-commands"] [aria-expanded="true"]').count()
console.log(
  '?op=CreateKeyPair → selected:',
  await sel(),
  '| expanded op rows:',
  expanded,
  '| url',
  page.url().replace(base, '')
)
await browser.close()
