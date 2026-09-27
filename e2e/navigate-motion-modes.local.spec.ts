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

// Same reason as SLOW_ACTION, applied to the per-test budget rather than the
// per-action one: the global 45s (playwright.config.ts) was already close for a
// ~2,400-node software-rendered WebGL scene, and every interaction in this file
// now has to (re-)expand the filter panel first — see openPanel — which the
// spec's original 2026-08-29 shape did not have to pay. 120s is a timeout, not an
// assertion: nothing here is being masked, the same things are still asserted.
test.describe.configure({ timeout: 120_000 })

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

/**
 * MotionControls lives INSIDE the /navigate filter panel, and that panel is not
 * a static part of the page any more:
 *   • it starts COLLAPSED to a "Filters" pill so the graph gets the full screen
 *     (`useState(false)`, ForceClusterView.tsx), and
 *   • it RE-collapses after PANEL_IDLE_COLLAPSE_MS (3000ms) whenever the user
 *     stops touching the filter controls
 * — both from 58651ebb6 "fix(navigate): auto-collapse the filter panel to a pill
 * after idle" (2026-09-04), i.e. after this spec was written (2026-08-29). The
 * Off/Spin/Tour buttons, the speed slider, the "Stop N of M" line, "Paused" and
 * "Resume" are ALL inside it, so every one of those has to be reached through an
 * open panel.
 *
 * Note the idle effect's dependency list — [panelOpen, listOpen, filters,
 * labelBudget, expandedType] — deliberately does NOT include motion mode or
 * speed: changing those does not reset the 3s clock. So "open it once at the
 * start of the test" is not enough; anything that waits (a 2s speed sample, a
 * 20s tour poll) will have the panel collapse out from under it. Hence: call
 * this immediately before each panel read/click. It is a no-op when the panel is
 * already open.
 */
async function openPanel(page: Page) {
  const pill = page.getByRole('button', { name: 'Filters', exact: true })
  // Anchor on a control that only exists inside the EXPANDED panel, so a failure
  // here says "the panel never opened" rather than surfacing later as a confusing
  // missing-button timeout.
  const off = page.getByRole('button', { name: 'Off', exact: true })
  // POLLED, not "check once then click once". A single check loses a race that
  // really happens (seen live): the panel is still open when the pill is looked
  // for, so there is no pill to click, and it collapses a moment later — leaving
  // a 30s wait on a button that is now gone and nothing to re-open it. Polling
  // also absorbs the other end: the graph may still be mounting, so neither the
  // pill nor the panel exists yet (`{!loading && !error && …}` guards both).
  await expect
    .poll(
      async () => {
        if (await off.isVisible().catch(() => false)) return 'open'
        if (await pill.isVisible().catch(() => false)) {
          // Swallow a click that loses the same race — the next tick retries.
          await pill.click({ timeout: 5000 }).catch(() => {})
        }
        return 'closed'
      },
      { timeout: 45000, intervals: [250] }
    )
    .toBe('open')
}

/**
 * Sets the speed slider, retrying through the panel's idle collapse. `fill()`
 * resolves the element and THEN types into it; when the 3s collapse lands in
 * between, playwright reports "element was detached from the DOM, retrying" and
 * eventually times out (seen live). Re-opening the panel on each attempt, and
 * confirming the value actually stuck, removes that flake without weakening
 * anything — the assertion is still "the slider now reads this value".
 */
async function setSpeed(page: Page, value: string) {
  const slider = page.getByRole('slider', { name: 'Rotation and tour speed' })
  await expect
    .poll(
      async () => {
        await openPanel(page)
        try {
          await slider.fill(value, { timeout: 3000 })
          return await slider.inputValue({ timeout: 2000 })
        } catch {
          return null
        }
      },
      { timeout: 45000, intervals: [250] }
    )
    .toBe(value)
}

const progressText = (page: Page) => page.getByText(/Stop \d+ of \d+/)

async function currentStopIndex(page: Page): Promise<number | null> {
  // Re-open the panel and read in the SAME short loop. "Stop N of M" lives inside
  // MotionControls, i.e. inside the panel, and the panel auto-collapses after 3s
  // of filter idleness (see openPanel) — so `openPanel(); textContent()` with a
  // long default timeout loses the race whenever the collapse lands between the
  // two, then blocks for the full timeout with nothing left to re-open it.
  for (let attempt = 0; attempt < 10; attempt++) {
    await openPanel(page)
    const text = await progressText(page)
      .textContent({ timeout: 2000 })
      .catch(() => null)
    const match = text?.match(/Stop (\d+) of/)
    if (match) return parseInt(match[1], 10)
  }
  return null
}

test('defaults to Spin, and the mode buttons visibly change what the scene does', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await waitForGraph(page)
  await openPanel(page)

  const spinButton = page.getByRole('button', { name: 'Spin', exact: true })
  const offButton = page.getByRole('button', { name: 'Off', exact: true })
  const tourButton = page.getByRole('button', { name: 'Tour', exact: true })
  await expect(spinButton).toHaveAttribute('aria-pressed', 'true')

  // Off actually stops the group from rotating — read the canvas pixels
  // before/after a pause, they must be byte-identical once nothing animates
  // (a real assertion here: PNG re-encoding of an UNCHANGED frame is
  // deterministic, so any diff at all means something moved).
  await openPanel(page)
  await offButton.click(SLOW_ACTION)
  await expect(offButton).toHaveAttribute('aria-pressed', 'true')
  const canvas = page.locator('canvas').first()
  // Polled rather than one fixed pair 600ms apart: the first pair can straddle
  // the last in-flight animation frame (or a damping tail) after the Off click,
  // which made this flake. Still a real assertion of stillness and NOT a weaker
  // one — a rotating scene can never produce two byte-identical PNGs 600ms
  // apart, so this can only go green on a genuinely frozen canvas; the window
  // is bounded so "never settles" still fails.
  await expect
    .poll(
      async () => {
        const a = await canvas.screenshot()
        await page.waitForTimeout(600)
        const b = await canvas.screenshot()
        return Buffer.compare(a, b)
      },
      { timeout: 15000, intervals: [100] }
    )
    .toBe(0)

  // Spin resumes visible motion.
  await openPanel(page)
  await spinButton.click(SLOW_ACTION)
  await page.waitForTimeout(300)
  const spinning1 = await canvas.screenshot()
  await page.waitForTimeout(900)
  const spinning2 = await canvas.screenshot()
  expect(Buffer.compare(spinning1, spinning2)).not.toBe(0)

  await openPanel(page)
  await tourButton.click(SLOW_ACTION)
  await expect(tourButton).toHaveAttribute('aria-pressed', 'true')
  await openPanel(page)
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
  // 2026-09-26: scans BUTTONS, not divs. makeLabelDiv() in ForceClusterView.tsx
  // builds each CSS2D label as an <button type="button" aria-label="Focus the X
  // category"> (the a11y/label-budget work), and CSS2DRenderer writes its
  // `translate(Xpx,Ypx)` onto that button. The original `querySelectorAll('div')`
  // scan therefore matched ZERO elements and this helper always returned null —
  // verified live: 0 divs on /navigate carry an inline transform at all.
  const transform = await page.evaluate(() => {
    for (const el of Array.from(
      document.querySelectorAll<HTMLElement>('button[aria-label^="Focus the "]')
    )) {
      if (el.textContent?.trim() === 'Standard' && el.style.opacity === '1') {
        return el.style.transform
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
  const SAMPLE_WINDOW_MS = 2000

  await setSpeed(page, '0.25')
  await page.waitForTimeout(200)
  const slowStart = await readTypeLabelOffset(page)
  await page.waitForTimeout(SAMPLE_WINDOW_MS)
  const slowEnd = await readTypeLabelOffset(page)

  // The 2s sample window above outlives the panel's 3s idle clock, so setSpeed
  // re-opens the panel itself before touching the slider again.
  await setSpeed(page, '3')
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
  await openPanel(page)
  await page.getByRole('button', { name: 'Tour', exact: true }).click(SLOW_ACTION)

  // TourCaption renders outside the filter panel, so this needs no re-open.
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
  // `button[…]`, not `div[…]`: makeLabelDiv() returns an HTMLButtonElement (it
  // keeps the `pointer-events:none` in its cssText). The old `div[…]` selector
  // matched nothing, so this count was 0 and `<= 1` passed vacuously — the exact
  // shape of green-that-could-not-be-red this whole remediation is about.
  const visibleLabelCount = await page.evaluate(() => {
    const candidates = document.querySelectorAll<HTMLElement>(
      'button[style*="pointer-events:none"]'
    )
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
  await openPanel(page)
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

  // "· Paused" and the Resume button are both inside MotionControls, i.e. inside
  // the filter panel — which the 20s poll above let collapse.
  await openPanel(page)
  await expect(page.getByText(/Paused/)).toBeVisible()
  const resumeButton = page.getByRole('button', { name: 'Resume' })
  await expect(resumeButton).toBeVisible(SLOW_ACTION)

  const pausedIndex = await currentStopIndex(page)
  expect(pausedIndex).not.toBeNull()

  await openPanel(page)
  await resumeButton.click(SLOW_ACTION)
  // openPanel BEFORE the toBeHidden assertion, and not after: with the panel
  // proven open (openPanel anchors on the Off button), "Paused is gone" means
  // the tour really resumed — not merely that the panel collapsed away.
  await openPanel(page)
  await expect(page.getByText(/Paused/)).toBeHidden()

  const resumedIndex = await currentStopIndex(page)
  expect(resumedIndex).not.toBeNull()
  // Never resets to the beginning — it may have advanced further by the time
  // this reads (dwell timers keep running), but it must never go backward.
  expect(resumedIndex).toBeGreaterThanOrEqual(pausedIndex!)
})

test('mode and speed persist across a reload', async ({ page }) => {
  await waitForGraph(page)
  await openPanel(page)
  await page.getByRole('button', { name: 'Tour', exact: true }).click(SLOW_ACTION)
  await setSpeed(page, '2')
  await openPanel(page)
  await expect(progressText(page)).toBeVisible({ timeout: 5000 })

  await page.reload()
  await expect(page.getByText('Building the graph from live hub data...')).toBeHidden({
    timeout: 30000,
  })
  // `panelOpen` is deliberately NOT persisted — it is plain component state, so a
  // reload puts the panel back to its collapsed pill. The mode/speed under test
  // ARE persisted; open the panel to read them.
  await openPanel(page)
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
