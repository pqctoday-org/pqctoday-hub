// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y, getViolations } from 'axe-playwright'

// Scan with reduced motion so axe never samples a mid-fade/mid-pulse frame of a
// framer-motion or CSS `animate-*` transition (e.g. the RightPanel FAB's "Need
// Help?" bubble, the route-loading `animate-pulse` text) — those transient
// partial-opacity frames read as real color-contrast failures to axe even
// though the settled UI is fine. The app already honors this: framer-motion is
// wrapped in `<MotionConfig reducedMotion="user">` (src/AppRoot.tsx) and
// `styles/index.css` zeroes animation/transition durations under
// `prefers-reduced-motion: reduce`.
test.use({ reducedMotion: 'reduce' })

// Only fail on serious and critical violations; moderate/minor tracked separately.
// `detailedReport` ADDED 2026-08-02. Without it axe-playwright's default
// reporter prints only the per-rule summary table — rule id, impact, and a
// node COUNT — so a CI-only failure gives you no way to learn which elements
// failed or what their contrast ratios were. That is exactly the wall hit on
// 2026-08-02: the a11y smoke went red on the runner for 13-14 of 14 routes
// with `color-contrast`, while the identical spec against the identical local
// build passed 16/16, leaving nothing to diagnose from. This is diagnostic
// output only — it changes what a FAILING run prints, never whether a run
// passes, so it costs nothing on a green run.
const A11Y_OPTIONS = {
  axeOptions: {
    runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa'] },
  },
  includedImpacts: ['critical', 'serious'] as ('critical' | 'serious')[],
  detailedReport: true,
  detailedReportOptions: { html: true },
}

// Routes excluded from automated axe scanning:
// - /playground, /openssl, /playground/hsm: WASM-heavy; 60 s+ load can race axe injection.
//   Focus-trap and label issues are covered by manual test and unit tests instead.
const ROUTES = [
  { path: '/', name: 'Landing' },
  { path: '/timeline', name: 'Timeline' },
  { path: '/algorithms', name: 'Algorithms' },
  { path: '/library', name: 'Library' },
  { path: '/threats', name: 'Threats' },
  { path: '/leaders', name: 'Leaders' },
  { path: '/compliance', name: 'Compliance' },
  { path: '/changelog', name: 'Changelog' },
  { path: '/migrate', name: 'Migrate' },
  { path: '/about', name: 'About' },
  { path: '/assess', name: 'Assess' },
  { path: '/report', name: 'Report' },
  { path: '/business', name: 'Business Center' },
  { path: '/faq', name: 'FAQ' },
  { path: '/learn', name: 'Learn' },
]

// Navigation content is identical across all routes — the test focuses on
// page-level violations only; the nav landmark is handled by axe's default
// global checks. (Prior `SKIP_SELECTOR` constant was declared but never
// referenced; removed to satisfy @typescript-eslint/no-unused-vars.)

for (const { path, name } of ROUTES) {
  test(`${name} (${path}) — no serious/critical a11y violations`, async ({ page }) => {
    // 45s is the smoke suite's budget for an ACTION. This test's work is two
    // full-page axe passes, and on /library — every catalogue document on one
    // page — colour-contrast alone computes against enough text nodes that the
    // pair does not fit: CI run 31623163250 timed out three times inside the
    // second scan, reporting no violations at all, while the first scan had
    // completed. The freeze above did not cause that; it just added the last
    // fraction of a second.
    //
    // Both scans are kept. They are not redundant: axe scrolls elements into
    // view as it works, so the first pass leaves the page settled for the
    // second, and it is the second one that decides. Collapsing them to a
    // single scan was tried and made /algorithms fail on 288 contrast nodes
    // that the settled page does not have — the "wasteful" first pass is doing
    // real work.
    test.setTimeout(120_000)

    await page.goto(path)

    // Wait for the page's primary content to stabilise before running axe.
    // Most pages render an h1 or the PageHeader; waiting for that confirms hydration.
    await page.waitForSelector('h1, h2, [data-testid]', { timeout: 15000 }).catch(() => {
      // Some pages (Landing, Assess) may not have h1/h2 — that's fine, axe will catch it.
    })
    // Belt-and-suspenders on top of the real fix (2026-08-02, MainLayout.tsx's
    // route-content wrapper): `waitForSelector` resolves the INSTANT an
    // element mounts, which for the primary-content motion.div was also the
    // instant its (now-fixed) opacity fade started — this test previously ran
    // axe with zero settle time between mount and assertion. `networkidle`
    // gives any data-driven content one more beat to finish loading before
    // judging its accessibility, matching what manual local reproduction
    // always did (and why it could never reproduce the CI failure — see the
    // MainLayout.tsx comment for the full chain).
    await page.waitForLoadState('networkidle').catch(() => {})

    // THE actual cause of this spec's CI-only failures (measured 2026-08-12).
    // axe computes colour contrast from COMPUTED colours, so an element still
    // inside an opacity fade reports a washed-out foreground that does not
    // exist at rest. Measured on the production build, same page, seconds
    // apart: /migrate reported 85 serious/critical nodes immediately after
    // networkidle and 0 once its animations had finished.
    //
    // Waiting for animations is NOT sufficient, which is what the first
    // attempt at this got wrong. Running axe itself scrolls elements into
    // view, which STARTS the scroll-triggered fades — so a wait placed before
    // the scan is already stale by the time the scan reaches the lower half of
    // the page. That is how the two axe passes below managed to disagree in
    // both directions on a single run: /algorithms logged 33 violations then
    // passed, /timeline logged none then failed. Different frames of different
    // fades, not different pages.
    //
    // So the presentation is frozen instead of waited on. Contrast is judged
    // on the resting colours, which is the thing a contrast audit is actually
    // about — a fade's intermediate frames are not a state any reader sits in.
    // Nothing is excluded and no rule is relaxed: every element is still
    // scanned, and a genuinely low-contrast colour still fails.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addStyleTag({
      content: `*, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }`,
    })
    // One frame for the zeroed durations to land before anything is measured.
    await page.waitForTimeout(250)

    await injectAxe(page)

    // Diagnostic logging before the assertion (2026-08-02). The default
    // reporter prints only a summary table — rule id, impact, node COUNT — so a
    // CI-only failure gives you "color-contrast, serious, 1 node" and nothing
    // about WHICH node. /migrate failed three times that way while the same
    // commit passed locally against the same production build, and 18 repeated
    // local samples at this spec's exact timing could not reproduce it. Without
    // the element and its measured colours there is nothing to fix but a guess,
    // and guessing has already produced two wrong diagnoses here.
    //
    // This does not change what the test asserts — `checkA11y` below is
    // unchanged and still fails the build. It only makes a failure legible.
    const violations = await getViolations(page, 'html', A11Y_OPTIONS.axeOptions)
    const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    for (const v of blocking) {
      for (const node of v.nodes) {
        const contrast = [...node.any, ...node.all].find((c) => c.id === 'color-contrast')
        const d = contrast?.data as
          | { contrastRatio?: number; fgColor?: string; bgColor?: string; fontSize?: string }
          | undefined

        console.log(
          `[a11y] ${path} ${v.id} target=${JSON.stringify(node.target)}` +
            (d
              ? ` ratio=${d.contrastRatio} fg=${d.fgColor} bg=${d.bgColor} size=${d.fontSize}`
              : '') +
            `\n[a11y]   html=${node.html.slice(0, 200)}`
        )
      }
    }

    await checkA11y(page, 'html', A11Y_OPTIONS, false, 'default')
  })
}

// Persona-seeded scan (2026-09-08, Executive/GRC split gap-closure audit).
// Every route above is scanned with NO persona selected, so '/' only ever
// shows the role picker — the real personalized homeboard (PersonaBoardView)
// and /learn's path-depth view have never had an axe pass. That gap hid 3
// real serious color-contrast violations (PersonaBoardView's
// board-variant-chip and "sourced" proofChip text colors, MainLayout's
// "featured" nav-row tint, MyPathView's path-depth duration text) until a
// live scan under a seeded persona was run by hand. 'grc' is used here as a
// representative persona; the fixed styles are shared by every persona, not
// grc-specific.
const PERSONA_ROUTES = [
  { path: '/', name: 'Landing (persona board)' },
  { path: '/learn', name: 'Learn (persona path)' },
]

for (const { path, name } of PERSONA_ROUTES) {
  test(`${name} (${path}), grc persona seeded — no serious/critical a11y violations`, async ({
    page,
  }) => {
    test.setTimeout(45_000)
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({
          state: {
            selectedPersona: 'grc',
            hasAcknowledgedExecutiveGrcSplit: true,
            hasSeenPersonaPicker: true,
            selectedRegion: 'global',
            experienceLevel: 'expert',
            viewAccess: 'unlocked',
            suppressSuggestion: true,
            niceTier: 'awareness',
            niceTierOverridden: false,
            curiousGuideDismissed: true,
          },
          version: 11,
        })
      )
    })

    await page.goto(path)
    await page.waitForSelector('h1, h2, [data-testid]', { timeout: 15000 }).catch(() => {})
    await page.waitForLoadState('networkidle').catch(() => {})

    // Freeze animations before the scan — see the ROUTES loop above for why
    // (colour-contrast is measured against computed colour, which a
    // mid-fade frame reports as washed-out even though the settled UI is fine).
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addStyleTag({
      content: `*, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }`,
    })
    await page.waitForTimeout(250)

    await injectAxe(page)
    await checkA11y(page, 'html', A11Y_OPTIONS, false, 'default')
  })
}

test('RightPanel chat drawer — focus is trapped inside when open', async ({ page }) => {
  await page.goto('/')

  // Open the chat panel programmatically utilizing the ASR hook pattern we injected
  // This bypasses issues where the FAB button animation may block click listeners under high load
  await page.waitForFunction(
    () =>
      typeof (window as unknown as { __e2e_toggle_panel?: () => void }).__e2e_toggle_panel ===
      'function'
  )
  await page.evaluate(() => {
    const fn = (window as unknown as { __e2e_toggle_panel?: () => void }).__e2e_toggle_panel
    fn?.()
  })

  // Panel should be visible
  const panel = page.getByRole('dialog', { name: /pqc assistant/i })
  await expect(panel).toBeVisible({ timeout: 5000 })

  // Press Tab repeatedly; focus must cycle within the panel, never reach body or nav
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return false
      // Verify focused element is inside the dialog
      const dialog = document.querySelector('[role="dialog"]')
      return dialog ? dialog.contains(el) : false
    })
    expect(focused).toBe(true)
  }

  // Esc closes the panel
  await page.keyboard.press('Escape')
  await expect(panel).not.toBeVisible({ timeout: 3000 })
})

test('Assess wizard inputs — all labelled', async ({ page }) => {
  await page.goto('/assess')
  await page.waitForSelector('[data-testid="assess-view"], [role="form"], main', { timeout: 10000 })
  // PageMeta.tsx renders <title> via React 19's native document-metadata
  // hoisting — during hydration there is a real, brief window where the
  // prerendered <title> has been torn down and the client-rendered one has
  // not landed yet, and `main` (the wait above) resolves well before that
  // gap closes. `networkidle` is the same settle wait the passing per-route
  // a11y tests above already rely on for this exact class of hydration race.
  await page.waitForLoadState('networkidle').catch(() => {})
  await injectAxe(page)
  await checkA11y(
    page,
    'html',
    {
      axeOptions: { runOnly: { type: 'tag' as const, values: ['wcag2a'] } },
      includedImpacts: ['critical', 'serious'] as ('critical' | 'serious')[],
    },
    false,
    'default'
  )
})
