// SPDX-License-Identifier: GPL-3.0-only
import { test, expect, type Page } from '@playwright/test'

/**
 * /navigate motion modes — Off/Spin/Tour toggle, speed slider, persistence,
 * and the guided "spaceship" tour (navigate-motion-modes-plan-08292026.md).
 *
 * Venue: `*.local.spec.ts` — excluded from CI (directive 2026-07-01: new
 * suites are local-only). Run with:
 *   E2E_SERVER=dev npx playwright test --project=local navigate-motion-modes
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem('pqc-tour-completed', 'true')
  })
})

// Headless/software-rendered WebGL for a ~2,400-node scene is genuinely slow
// and gets slower as more tests run in the same worker (GPU-process/context
// pressure accumulates) — verified by hand against the dev server, where an
// identical click completed in ~1.2s standalone. Generous timeouts here are
// about the test environment, not the product; the default 15s
// `actionTimeout` isn't enough by the 4th/5th test in this file.
const SLOW_ACTION = { timeout: 30000 }

async function waitForGraph(page: Page) {
  await page.goto('/navigate')
  // Not asserting the loading text is visible FIRST — on a warm dev-server
  // cache the graph can build before this check ever runs, which made that
  // assertion flaky. Waiting for it to be absent (or never appear) is enough.
  await expect(page.getByText('Building the graph from live hub data...')).toBeHidden({
    timeout: 30000,
  })
  await expect(page.locator('canvas').first()).toBeVisible(SLOW_ACTION)
}

/** The tour caption bar (role="status") vs. the app's global toast/notification region (also role="status") — scoped by content, since both are on the page simultaneously. */
function tourCaption(page: Page) {
  return page.getByRole('status').filter({ hasText: 'connection' })
}

const progressText = (page: Page) => page.getByText(/Stop \d+ of \d+/)

async function currentStopIndex(page: Page): Promise<number | null> {
  const text = await progressText(page).textContent()
  const match = text?.match(/Stop (\d+) of/)
  return match ? parseInt(match[1], 10) : null
}

test('defaults to Spin, and the mode buttons visibly change what the scene does', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await waitForGraph(page)

  const spinButton = page.getByRole('button', { name: 'Spin', exact: true })
  const offButton = page.getByRole('button', { name: 'Off', exact: true })
  const tourButton = page.getByRole('button', { name: 'Tour', exact: true })
  await expect(spinButton).toHaveAttribute('aria-pressed', 'true')

  // Off actually stops the group from rotating — read the canvas pixels
  // before/after a pause, they must be byte-identical once nothing animates
  // (a real assertion here: PNG re-encoding of an UNCHANGED frame is
  // deterministic, so any diff at all means something moved).
  await offButton.click(SLOW_ACTION)
  await expect(offButton).toHaveAttribute('aria-pressed', 'true')
  await page.waitForTimeout(600)
  const canvas = page.locator('canvas').first()
  const still1 = await canvas.screenshot()
  await page.waitForTimeout(600)
  const still2 = await canvas.screenshot()
  expect(Buffer.compare(still1, still2)).toBe(0)

  // Spin resumes visible motion.
  await spinButton.click(SLOW_ACTION)
  await page.waitForTimeout(300)
  const spinning1 = await canvas.screenshot()
  await page.waitForTimeout(900)
  const spinning2 = await canvas.screenshot()
  expect(Buffer.compare(spinning1, spinning2)).not.toBe(0)

  await tourButton.click(SLOW_ACTION)
  await expect(tourButton).toHaveAttribute('aria-pressed', 'true')
  await expect(progressText(page)).toBeVisible({ timeout: 5000 })

  expect(consoleErrors, `console errors: ${consoleErrors.join('\n')}`).toEqual([])
})

/**
 * Reads the on-screen pixel offset (CSS2DRenderer's own `translate(Xpx,Ypx)`
 * inline style) of the 'Standard' type-label — a precise numeric proxy for
 * how far the (rotating) scene has moved, without going through a PNG
 * screenshot. Screenshot byte-diffing was tried first and rejected: PNG
 * deflate compression cascades from the first changed pixel, so ANY motion
 * (tiny or large) produces a similarly large byte-diff — useless for
 * comparing two speeds' MAGNITUDE against each other, even though it's a
 * clean 0-vs-nonzero signal for the Off/Spin test above.
 *
 * 'Standard' specifically, not "any type-label": computeLayout's fibonacci-
 * sphere placement (`y = 1 - i/(n-1)*2`) puts NODE_TYPES[0] and [8]
 * ('Certification body' / 'Protocol') exactly on the sphere's two poles —
 * i.e. exactly on the Y rotation axis, where a Y-axis spin produces ZERO
 * screen-position change. Found by hand while building this test: picking
 * "the first matching label" silently grabbed the pole-fixed one and made
 * every speed look like 0 movement. 'Standard' (index 5) isn't a pole.
 * Filtered to opacity:1 because a *sub*-category can coincidentally share a
 * type label's exact text (verified: a 'Standard' sub-label also exists,
 * permanently opacity:0 at this zoom level) — CSS2DRenderer still writes a
 * transform for opacity:0 elements, so text alone isn't a safe-enough match.
 */
async function readTypeLabelOffset(page: Page): Promise<{ x: number; y: number } | null> {
  const transform = await page.evaluate(() => {
    for (const div of Array.from(document.querySelectorAll<HTMLElement>('div'))) {
      if (div.textContent?.trim() === 'Standard' && div.style.opacity === '1') {
        return div.style.transform
      }
    }
    return null
  })
  if (!transform) return null
  const match = [...transform.matchAll(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/g)].pop()
  if (!match) return null
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
}

test('speed slider changes the rotation rate', async ({ page }) => {
  await waitForGraph(page)
  const speedSlider = page.getByRole('slider', { name: 'Rotation and tour speed' })
  const SAMPLE_WINDOW_MS = 2000

  await speedSlider.fill('0.25')
  await page.waitForTimeout(200)
  const slowStart = await readTypeLabelOffset(page)
  await page.waitForTimeout(SAMPLE_WINDOW_MS)
  const slowEnd = await readTypeLabelOffset(page)

  await speedSlider.fill('3')
  await page.waitForTimeout(200)
  const fastStart = await readTypeLabelOffset(page)
  await page.waitForTimeout(SAMPLE_WINDOW_MS)
  const fastEnd = await readTypeLabelOffset(page)

  expect(slowStart, 'no type-label found on screen at default camera distance').not.toBeNull()
  expect(slowEnd).not.toBeNull()
  expect(fastStart).not.toBeNull()
  expect(fastEnd).not.toBeNull()

  const slowMove = Math.hypot(slowEnd!.x - slowStart!.x, slowEnd!.y - slowStart!.y)
  const fastMove = Math.hypot(fastEnd!.x - fastStart!.x, fastEnd!.y - fastStart!.y)
  // 3x vs 0.25x is a 12x speed ratio; a 2x margin is generous headroom
  // against render-loop jitter while still catching "speed does nothing".
  expect(fastMove).toBeGreaterThan(slowMove * 2)
})

test('tour: reaches a node stop with exactly one label visible, shows the caption bar and opens its detail panel', async ({
  page,
}) => {
  await waitForGraph(page)
  await page.getByRole('button', { name: 'Tour', exact: true }).click(SLOW_ACTION)

  await expect(tourCaption(page)).toBeVisible({ timeout: 15000 })

  // Confirmed 2026-08-29 (revising the initial "caption only" plan): the
  // tour also opens the same right-hand NavigateDetailPanel a manual click
  // would, for whichever node the caption is currently showing.
  const captionTitle = await tourCaption(page).locator('p').first().textContent()
  // NavigateDetailPanel (a <div role="complementary">) vs. the persistent
  // left-rail <aside role="complementary"> — role alone is ambiguous.
  const detailPanel = page.locator('div[role="complementary"]')
  await expect(detailPanel).toBeVisible({ timeout: 5000 })
  await expect(detailPanel).toContainText(captionTitle?.trim() ?? '')

  // LOD-flood regression guard (plan §4.4): only one CSS2D label (the
  // makeLabelDiv() divs, identified by their own pointer-events:none inline
  // style) may be visible (opacity 1) while focused on a single node/category
  // — updateLod()'s normal distance tiering would otherwise show hundreds at
  // this camera distance.
  const visibleLabelCount = await page.evaluate(() => {
    const candidates = document.querySelectorAll<HTMLElement>('div[style*="pointer-events:none"]')
    return Array.from(candidates).filter(
      (el) => el.style.opacity === '1' && (el.textContent ?? '').trim().length > 0
    ).length
  })
  expect(visibleLabelCount).toBeLessThanOrEqual(1)
})

test('tour: dragging the canvas pauses it, and Resume continues from the same stop', async ({
  page,
}) => {
  await waitForGraph(page)
  await page.getByRole('button', { name: 'Tour', exact: true }).click(SLOW_ACTION)
  await expect(progressText(page)).toBeVisible({ timeout: 5000 })

  // Let the tour advance past its very first stop first, so "resume from the
  // same stop" is actually distinguishable from "restarted from the start".
  await expect
    .poll(async () => (await currentStopIndex(page)) ?? 0, { timeout: 20000 })
    .toBeGreaterThanOrEqual(2)

  const canvas = page.locator('canvas').first()
  const box = await canvas.boundingBox()
  if (!box) throw new Error('canvas has no bounding box')
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 40, cy + 20, { steps: 5 })
  await page.mouse.up()

  await expect(page.getByText(/Paused/)).toBeVisible()
  const resumeButton = page.getByRole('button', { name: 'Resume' })
  await expect(resumeButton).toBeVisible(SLOW_ACTION)

  const pausedIndex = await currentStopIndex(page)
  expect(pausedIndex).not.toBeNull()

  await resumeButton.click(SLOW_ACTION)
  await expect(page.getByText(/Paused/)).toBeHidden()

  const resumedIndex = await currentStopIndex(page)
  expect(resumedIndex).not.toBeNull()
  // Never resets to the beginning — it may have advanced further by the time
  // this reads (dwell timers keep running), but it must never go backward.
  expect(resumedIndex).toBeGreaterThanOrEqual(pausedIndex!)
})

test('mode and speed persist across a reload', async ({ page }) => {
  await waitForGraph(page)
  await page.getByRole('button', { name: 'Tour', exact: true }).click(SLOW_ACTION)
  await page.getByRole('slider', { name: 'Rotation and tour speed' }).fill('2')
  await expect(progressText(page)).toBeVisible({ timeout: 5000 })

  await page.reload()
  await expect(page.getByText('Building the graph from live hub data...')).toBeHidden({
    timeout: 30000,
  })
  await expect(page.getByRole('button', { name: 'Tour', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
    SLOW_ACTION
  )
  await expect(page.getByRole('slider', { name: 'Rotation and tour speed' })).toHaveValue(
    '2',
    SLOW_ACTION
  )
})
