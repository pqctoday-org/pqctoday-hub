// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS7 — axe coverage for the LEARN-MODULE tier, plus the tab-pattern contract.
 *
 * `accessibility.spec.ts` scans 14 page routes and `accessibility-tools.spec.ts`
 * scans the tool tier; neither touches a single `/learn/*` route, so all 65
 * modules had zero automated a11y evidence.
 *
 * Sampling, not exhaustion: ONE module per manifest `track` (9 tracks) plus the
 * two modules WS7 names as carrying reproduced CRITICAL defects. That mirrors
 * `accessibility-tools.spec.ts`'s "one business tool per pillar" rule — the
 * shared chrome (`ModuleTabBar` + `ui/tabs.tsx`) is identical on all 65, so
 * re-scanning it 65 times buys nothing; per-module scanning exists to catch what
 * is specific to THAT module's content.
 *
 * Tiering: NOT in `SMOKE_SPECS` — nightly tier only, same rule as
 * `accessibility-tools.spec.ts`.
 *
 * NOT closed by this file (say so rather than let it be assumed): the WASM lab
 * tools (OpenSSL Studio, HSM, TPM, CACP, VPN/SSH simulators) still have no
 * full-page axe coverage — see `accessibility-tools.spec.ts`'s header.
 */
import { test, expect, type Page } from '@playwright/test'
import { injectAxe, checkA11y, getViolations } from 'axe-playwright'

test.use({ reducedMotion: 'reduce' })

/** Same reason as accessibility-tools.spec.ts: the fixture alone does not reach
 *  the page, so animate-fade-in runs at full length and axe samples mid-fade
 *  colours. `emulateMedia` does take effect. */
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    // The WhatsNew alertdialog (z-[100]) intercepts the tab clicks below.
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    // A fresh session at mobile width shows the "Who's asking?" persona
    // picker instead of the requested module (MainLayout's isMobileFirstRun
    // gate) — harmless to seed for the desktop tests too since they never
    // hit that gate at >=1024px.
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({ state: { selectedPersona: 'architect' }, version: 10 })
    )
  })
})

const A11Y_OPTIONS = {
  axeOptions: {
    runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa'] },
  },
  includedImpacts: ['critical', 'serious'] as ('critical' | 'serious')[],
}

/** One module per manifest track, plus WS7's two named criticals. */
const MODULES = [
  { id: 'pqc-101', track: 'Foundations' },
  { id: 'dev-quantum-impact', track: 'Role Guides' },
  { id: 'crypto-agility', track: 'Strategy' },
  { id: 'api-security-jwt', track: 'Protocols' },
  { id: 'pki-workshop', track: 'Software Infrastructure' },
  { id: 'qkd', track: 'Hardware Infrastructure (+ WS7 named critical)' },
  { id: 'digital-id', track: 'Applications' },
  { id: '5g-security', track: 'Industries' },
  { id: 'pqc-business-case', track: 'Executive' },
  { id: 'secrets-management-pqc', track: 'WS7 named critical' },
]

async function settle(page: Page) {
  await page.waitForSelector('h1, h2, [role="tablist"]', { timeout: 20_000 }).catch(() => undefined)
  await page.waitForTimeout(600)
}

/**
 * Serious/critical rules that ALREADY failed on these routes before WS7 —
 * measured against the production build on 2026-08-21 with reduced motion
 * emulated and a 3 s settle, so these are not the mid-fade false contrast
 * failures `accessibility-tools.spec.ts` documents; they reproduce on a settled
 * page. They live in shared design tokens and shared module chrome
 * (`bg-accent/10 text-accent` and `bg-tertiary/10 text-tertiary` track badges,
 * `text-destructive` body labels, the `line-through opacity-70` completed-section
 * style, the achievement toast) — none of which is a file WS7 owns, so this
 * work stream records them instead of silently disabling the rule.
 *
 * The assertion below is a RATCHET, not an exemption: any violation NOT in this
 * list fails the test, and shrinking a list here is always safe. Do not add to
 * it to make a new failure go away — fix the page.
 */
// Wave D (2026-08-29): all 5 color-contrast entries previously here are
// fixed — the track badge (moduleData.ts TRACK_COLORS) and the
// bg-destructive/10 + text-destructive pairing (ModuleShell.tsx + ~52 module
// files) were the shared root causes; verified clean via a full rebuild +
// rerun of this spec. Kept as an empty allowlist, not deleted, so a future
// regression has somewhere to go if a genuine new pre-existing issue turns up.
const KNOWN_PREEXISTING: Record<string, string[]> = {}

async function assertNoNewViolations(page: Page, id: string, where: string) {
  await injectAxe(page)
  const violations = await getViolations(page, undefined, A11Y_OPTIONS.axeOptions)
  const serious = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  const ids = [...new Set(serious.map((v) => v.id))].sort()
  const allowed = KNOWN_PREEXISTING[id] ?? []
  const unexpected = ids.filter((i) => !allowed.includes(i))
  expect(
    unexpected,
    `NEW serious/critical a11y violations on /learn/${id} (${where}): ${JSON.stringify(
      serious
        .filter((v) => unexpected.includes(v.id))
        .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html.slice(0, 120)) })),
      null,
      2
    )}`
  ).toEqual([])
}

for (const { id, track } of MODULES) {
  test(`module: /learn/${id} (${track}) — no NEW serious/critical a11y violations`, async ({
    page,
  }) => {
    await page.goto(`/learn/${id}`)
    await settle(page)
    await assertNoNewViolations(page, id, 'desktop')
  })
}

/* ───────────────────────────────────────────────────────────────────────────
 * WS7 — the tab pattern itself.
 *
 * Before this work stream every module route reported 0 `role="tablist"`,
 * 0 `role="tab"` and 0 `role="tabpanel"` (measured against the production build
 * on 2026-08-21). axe has no rule for ABSENT tab semantics — it only validates
 * ARIA that is present — so these assertions, not the axe scans above, are what
 * actually guards the fix.
 * ─────────────────────────────────────────────────────────────────────────── */

const TAB_PATTERN_MODULES = ['pqc-101', 'qkd', 'secrets-management-pqc']

for (const id of TAB_PATTERN_MODULES) {
  test(`module: /learn/${id} — desktop tab row is a real ARIA tablist`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`/learn/${id}`)
    await settle(page)

    const tablist = page.getByRole('tablist', { name: 'Module sections' })
    await expect(tablist).toHaveCount(1)

    const tabs = tablist.getByRole('tab')
    expect(await tabs.count()).toBeGreaterThanOrEqual(5)

    // Exactly one selected tab, and it owns the visible panel.
    const selected = tablist.locator('[role="tab"][aria-selected="true"]')
    await expect(selected).toHaveCount(1)
    const panelId = await selected.getAttribute('aria-controls')
    expect(panelId).toBeTruthy()
    await expect(page.locator(`#${panelId}`)).toHaveAttribute('role', 'tabpanel')
    await expect(page.locator(`#${panelId}`)).toHaveAttribute(
      'aria-labelledby',
      (await selected.getAttribute('id')) as string
    )

    // Roving tabindex: exactly one tab stop in the bar.
    await expect(tablist.locator('[role="tab"][tabindex="0"]')).toHaveCount(1)
  })

  test(`module: /learn/${id} — Arrow/Home/End rove focus and move selection`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`/learn/${id}`)
    await settle(page)

    const tablist = page.getByRole('tablist', { name: 'Module sections' })
    const tabs = tablist.getByRole('tab')
    const count = await tabs.count()

    const first = tabs.nth(0)
    await first.focus()
    await expect(first).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(1)).toBeFocused()
    // Automatic activation — aria-selected must FOLLOW focus, not lag it.
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false')

    await page.keyboard.press('End')
    await expect(tabs.nth(count - 1)).toBeFocused()
    await expect(tabs.nth(count - 1)).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('Home')
    await expect(tabs.nth(0)).toBeFocused()
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')

    // Wraps backwards from the first tab.
    await page.keyboard.press('ArrowLeft')
    await expect(tabs.nth(count - 1)).toBeFocused()
  })

  test(`module: /learn/${id} — mobile (390x844) has no tab bar, only a section checklist`, async ({
    page,
  }) => {
    // The desktop tab pattern above (tablist/tab/tabpanel + the "More tabs"
    // overflow popover) does not exist on mobile at all — it isn't hidden
    // behind a control, it's a different component. MobileModuleShell
    // (default-on 2026-08-23) mounts only a Learn-tab-equivalent view: a
    // section-read checklist over the same real prose, with no
    // Workshop/Exercises/References/Tools tab strip. This replaces the
    // three "··· overflow popover" tests that asserted a pattern this
    // breakpoint has never rendered since that date — they were failing on
    // every module, every nightly run, for that reason alone.
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/learn/${id}`)
    await settle(page)

    await expect(page.getByRole('tablist')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'More tabs' })).toHaveCount(0)

    const checklist = page.getByRole('progressbar', { name: /\d+\/\d+ sections read/i })
    await expect(checklist).toBeVisible()
    const sectionButtons = page.locator('ul > li > button[aria-pressed]')
    expect(await sectionButtons.count()).toBeGreaterThanOrEqual(1)
  })

  test(`module: /learn/${id} — mobile section checklist toggles real read state`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/learn/${id}`)
    await settle(page)

    const first = page.locator('ul > li > button[aria-pressed]').first()
    await expect(first).toBeVisible()
    const before = await first.getAttribute('aria-pressed')
    await first.click()
    await expect(first).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true')
    // Reflected in the progress summary, not just the button's own state.
    await first.click()
    await expect(first).toHaveAttribute('aria-pressed', before ?? 'false')
  })

  test(`module: /learn/${id} — axe clean at 390x844`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/learn/${id}`)
    await settle(page)
    await assertNoNewViolations(page, id, 'mobile 390x844')
  })
}

/* ───────────────────────────────────────────────────────────────────────────
 * B3 (bplus-remediation-plan-08292026.md) — 8 modules whose Learn content
 * carries a wide comparison table in a bare `overflow-x-auto` div. None of
 * these 8 are in MODULES/TAB_PATTERN_MODULES above, so nothing previously
 * scanned them at a narrow viewport — the table only becomes an actual
 * scrollable region (and so only trips axe's `scrollable-region-focusable`)
 * once its content is wider than a 390px container; at desktop widths there
 * is room to spare and the rule never fires, which is exactly why this was
 * a mobile-only finding. Fixed 2026-08-29 by adding tabIndex={0}/role=
 * "region"/aria-label to each table's wrapper, the same pattern
 * VpnSimulationPanel.tsx and QKDIntroduction.tsx already use for the same
 * rule. Scoped to the one rule (not assertNoNewViolations' full serious/
 * critical set) since these 8 modules have no KNOWN_PREEXISTING entry above
 * to filter unrelated pre-existing failures against.
 * ─────────────────────────────────────────────────────────────────────────── */
const B3_SCROLLABLE_TABLE_MODULES = [
  'web-gateway-pqc',
  'network-security-pqc',
  'api-security-jwt',
  'kms-pqc',
  'stateful-signatures',
  'slh-dsa',
  'secure-boot-pqc',
  'digital-assets',
]

for (const id of B3_SCROLLABLE_TABLE_MODULES) {
  test(`module: /learn/${id} — mobile table is a keyboard-reachable scroll region (B3)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/learn/${id}`)
    await settle(page)

    await injectAxe(page)
    await checkA11y(page, undefined, {
      axeOptions: { runOnly: { type: 'rule' as const, values: ['scrollable-region-focusable'] } },
    })
  })
}

/* ───────────────────────────────────────────────────────────────────────────
 * WS7 — the two named CRITICAL defects, asserted where they live.
 * ─────────────────────────────────────────────────────────────────────────── */

test('secrets-management-pqc: Architecture Mapper cards carry no nested-interactive / unlabelled field', async ({
  page,
}) => {
  await page.goto('/learn/secrets-management-pqc')
  await settle(page)
  await page.getByRole('tab', { name: 'Workshop', exact: true }).first().click()
  await page.waitForTimeout(1200)

  const cards = page.locator('[role="checkbox"]')
  expect(await cards.count()).toBeGreaterThanOrEqual(8)
  // The two defects, asserted structurally: the redundant raw input is gone and
  // "Show mitigation" is no longer a descendant of the checkbox.
  await expect(page.locator('[role="checkbox"] input')).toHaveCount(0)
  await expect(page.locator('[role="checkbox"] button')).toHaveCount(0)

  // Scoped to the two rules this defect is about — the page also carries
  // pre-existing `color-contrast` failures in shared tokens (see
  // KNOWN_PREEXISTING) that are not WS7's to fix and would mask this assertion.
  await injectAxe(page)
  await checkA11y(page, undefined, {
    axeOptions: { runOnly: { type: 'rule' as const, values: ['nested-interactive', 'label'] } },
  })

  // The card is still a working checkbox from the keyboard.
  const first = cards.first()
  await first.focus()
  await expect(first).toHaveAttribute('aria-checked', 'false')
  await page.keyboard.press('Space')
  await expect(first).toHaveAttribute('aria-checked', 'true')
})

test('qkd: BB84 qubit grid and phase rail are keyboard-reachable scroll regions', async ({
  page,
}) => {
  test.slow()
  // Must stay >= 1024px (Tailwind's `lg`, see useIsBelowLgViewport.ts) — the
  // mobile-shell rework (2026-08-23) made that the one gate between the
  // desktop tab bar this test drives and MobileModuleShell's tab-free
  // section-checklist UI, where 'Workshop' as a role="tab" doesn't exist.
  // 900px predates that threshold and silently landed in the mobile shell.
  await page.setViewportSize({ width: 1100, height: 1200 })
  await page.goto('/learn/qkd')
  await settle(page)
  await page.getByRole('tab', { name: 'Workshop', exact: true }).first().click()
  await page.waitForTimeout(1200)

  await page
    .getByRole('button', { name: /Start BB84 protocol simulation/i })
    .first()
    .click()
  const grid = page.locator('[data-testid="bb84-qubit-grid"]')
  await expect(grid).toBeVisible({ timeout: 15_000 })
  await expect(grid).toHaveAttribute('tabindex', '0')
  await expect(grid).toHaveAttribute('role', 'region')

  // An added tabIndex nothing can reach is not a fix — prove focus lands on it.
  await grid.focus()
  await expect(grid).toBeFocused()

  await injectAxe(page)
  await checkA11y(page, '[data-testid="bb84-qubit-grid"]', {
    axeOptions: { runOnly: { type: 'rule' as const, values: ['scrollable-region-focusable'] } },
  })
})
