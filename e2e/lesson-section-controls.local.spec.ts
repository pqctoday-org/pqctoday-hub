// SPDX-License-Identifier: AGPL-3.0-only
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from './fixtures/blockAnalytics'
import { WIDE, seedHub } from './fixtures/assistantDrawer'

/**
 * Every lesson, every required section: exactly one "Mark section as read" control, and it sits at
 * the end of the section body, not inside a heading row or a small card. Local tier: it reads the
 * lesson manifests from the dev server (`E2E_SERVER=dev`), so it needs no list kept in step.
 */
test.use({ viewport: WIDE, serviceWorkers: 'block' })
test.describe.configure({ mode: 'parallel' })

const MODULES_DIR = join(
  fileURLToPath(new URL('.', import.meta.url)),
  '../src/components/PKILearning/modules'
)
const LESSON_IDS = readdirSync(MODULES_DIR)
  .map((dir) => {
    try {
      const text = readFileSync(join(MODULES_DIR, dir, 'manifest.ts'), 'utf8')
      return /^ {2}id: '([^']+)'/m.exec(text)?.[1]
    } catch {
      return undefined
    }
  })
  .filter((id): id is string => Boolean(id))

interface Report {
  required: string[]
  /** section id -> number of controls */
  counts: Record<string, number>
  /** control placements that read as wrong: inside a heading row or a small card */
  misplaced: string[]
}

for (const lessonId of LESSON_IDS) {
  test(`${lessonId}: one control per required section, at the end of its body`, async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await seedHub(page, { persona: 'developer' })
    await page.goto(`/learn/${lessonId}`)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 60_000 })
    // Collapsed accordions draw their control only when open, and sections arrive as the lesson loads:
    // open what is closed until the page stops changing.
    await page
      .locator('[data-section-id], section[id]')
      .first()
      .waitFor({ state: 'attached', timeout: 40_000 })
      .catch(() => undefined)
    let last = ''
    for (let round = 0; round < 12; round++) {
      await page
        .locator('section[data-section-read="own"] > button[aria-expanded="false"]')
        .evaluateAll((els) => els.forEach((b) => (b as HTMLButtonElement).click()))
      await page.waitForTimeout(800)
      const now = await page.evaluate(
        () =>
          `${document.querySelectorAll('[data-testid="section-read-control"]').length}/${document.querySelectorAll('[data-section-id], section[id]').length}/${document.querySelectorAll('section[data-section-read="own"] > button[aria-expanded="false"]').length}`
      )
      if (now === last && round > 2) break
      last = now
    }

    // Some lessons show one section at a time: look at every step, and keep the worst count of each section.
    const views: Report[] = []
    for (let step = 0; step < 12; step++) {
      views.push(await page.evaluate(readControls, lessonId))
      const next = page.locator('[data-workshop-target="learn-stepper-next"]')
      if (!(await next.count()) || !(await next.first().isEnabled())) break
      await next.first().click()
      await page.waitForTimeout(500)
    }
    const counts: Record<string, number> = {}
    const misplaced: string[] = []
    const stepped = views.length > 1
    for (const v of views) {
      for (const [id, n] of Object.entries(v.counts)) {
        // In a stepped lesson only the section on screen has a control; elsewhere every section must have one.
        const seen = counts[id] // eslint-disable-line security/detect-object-injection
        counts[id] = stepped ? Math.max(seen ?? 0, n) : n // eslint-disable-line security/detect-object-injection
        if (n > 1) misplaced.push(`${id}: ${n} controls at once`)
      }
      misplaced.push(...v.misplaced)
    }
    const wrong = Object.entries(counts).filter(([, n]) => n !== 1)
    expect(wrong, `sections without exactly one control: ${JSON.stringify(wrong)}`).toEqual([])
    expect(misplaced).toEqual([])
  })
}

/** Runs in the page: the controls of the lesson on screen, and where each one sits. */
async function readControls(lessonId: string): Promise<Report> {
  const base = '/src/components/PKILearning/manifest/'
  const scope = await import(/* @vite-ignore */ `${base}learnPathScope.ts`)
  const store = await import(/* @vite-ignore */ '/src/store/useModuleStore.ts')
  const activePath = store.useModuleStore.getState().modules[lessonId]?.activeLearnPath // eslint-disable-line security/detect-object-injection
  const required: string[] = scope.requiredLearnSectionIdsFor(lessonId, activePath)
  const controls = Array.from(
    document.querySelectorAll<HTMLElement>('[data-testid="section-read-control"]')
  )
  const present = (id: string) =>
    document.querySelector(`[data-section-id="${CSS.escape(id)}"], section[id="${CSS.escape(id)}"]`)
  const counts: Record<string, number> = {}
  const misplaced: string[] = []
  for (const id of required) if (present(id)) counts[id] = 0 // eslint-disable-line security/detect-object-injection
  for (const c of controls) {
    const id = c.dataset.sectionControl ?? ''
    counts[id] = (counts[id] ?? 0) + 1 // eslint-disable-line security/detect-object-injection
    const anchors = Array.from(
      document.querySelectorAll<HTMLElement>(
        `[data-section-id="${CSS.escape(id)}"], section[id="${CSS.escape(id)}"]`
      )
    )
    const anchor = anchors.find((a) => !anchors.some((o) => o !== a && o.contains(a)))
    if (!anchor) {
      misplaced.push(`${id}: no section for the control`)
      continue
    }
    // The section is the anchor, or, when the anchor is only a heading row, the row and what follows it.
    const inside = anchor.contains(c)
    const sectionRoot = inside ? anchor : (anchor.parentElement ?? anchor)
    if (!inside && !sectionRoot.contains(c)) misplaced.push(`${id}: control is outside its section`)
    // Nothing of the section may come after the control, and a control must not sit in a heading row.
    let node: HTMLElement = c
    while (node.parentElement && node !== sectionRoot) {
      for (let sib = node.nextElementSibling; sib; sib = sib.nextElementSibling) {
        if (
          sib.matches('[data-section-id], section[id]') ||
          sib.querySelector('[data-section-id], section[id]')
        )
          break
        if ((sib.textContent ?? '').trim()) {
          misplaced.push(`${id}: more of the section follows the control`)
          break
        }
      }
      node = node.parentElement
    }
    const own = (sectionRoot.textContent ?? '').replace(c.textContent ?? '', '').trim()
    const heading = anchor.matches('h1,h2,h3,h4,h5,h6')
      ? anchor
      : anchor.querySelector('h1,h2,h3,h4,h5,h6')
    if (inside && heading && own.length <= (heading.textContent ?? '').trim().length)
      misplaced.push(`${id}: inside a heading row`)
    if (inside && own.length < 200)
      misplaced.push(`${id}: inside a very small block (${own.length} characters)`)
  }
  return { required, counts, misplaced }
}
