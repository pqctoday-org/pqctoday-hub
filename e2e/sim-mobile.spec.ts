import { test, expect } from './fixtures/blockAnalytics'
import type { Page, Locator } from '@playwright/test'

/**
 * sim-mobile-full-play WS-7 — the phone Simulation play-through, end to end,
 * at a real iPhone-13 viewport (this spec only runs under the `mobile-smoke`
 * Playwright project — see playwright.config.ts's MOBILE_SMOKE_SPECS list;
 * it is deliberately NOT added to smoke's desktop SMOKE_SPECS array, and
 * mobile-smoke itself is not yet CI-gated, matching the plan's WS-7 scope).
 *
 * Covers the plan's own acceptance bar (§6): every phase chip reachable,
 * "Play This Phase" routes to real Decide (not narrated), Executive Mandate
 * playable to L2 including at least one activity step's Brief + check, and
 * a mid-run reload resumes correctly.
 *
 * This drives REAL decisions rather than a scripted answer key, because the
 * card order is deterministic-but-derived (pickWrong in sections.tsx) and
 * asserting against it directly would couple this spec to that internal
 * detail. On Realistic (the default) a pick is first-answer-wins and is
 * persisted, so a wrong pick is NOT retried by reload — since 09-28 (WP1) the
 * wrong outcome exposes the sound move's own completion control, and the step
 * is completed through that, exactly as a player would.
 */

const seedUnlockedAssessment = async (page: Page) => {
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
    // IMPORTANT: addInitScript re-runs on EVERY navigation in this page,
    // INCLUDING page.reload() — this spec reloads mid-run (mobilePlayOpen,
    // sel, decisions) to test resume, so unconditionally overwriting
    // `pqc-simulation` here would silently wipe real, in-progress store
    // state on every reload (found the hard way: a fixed-value seed here
    // made every reload land back on the run-home screen with `mobilePlayOpen`
    // reset to false, looking exactly like a real persistence bug until the
    // localStorage writes were traced). Only seed it on the FIRST load, when
    // no simulation state exists yet.
    if (!localStorage.getItem('pqc-simulation')) {
      localStorage.setItem(
        'pqc-simulation',
        JSON.stringify({ state: { tourSeen: true }, version: 17 })
      )
    }
    // A persona is required for the /assess mobile entry to skip its "Who's
    // asking?" onboarding step straight to a resumed/complete wizard — not
    // needed here since we go through /report directly, but harmless to set
    // for parity with how a real unlocked visitor would arrive.
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: { selectedPersona: 'executive', hasAcknowledgedExecutiveGrcSplit: true },
        version: 10,
      })
    )
    localStorage.setItem(
      'pqc-assessment-form',
      JSON.stringify({
        state: {
          currentStep: 13,
          assessmentMode: 'comprehensive',
          industry: 'finance',
          country: 'US',
          currentCrypto: ['RSA-2048'],
          currentCryptoCategories: [],
          cryptoUnknown: false,
          dataSensitivity: ['high'],
          sensitivityUnknown: false,
          complianceRequirements: ['pci-dss'],
          complianceUnknown: false,
          migrationStatus: 'planning',
          migrationUnknown: false,
          cryptoUseCases: [],
          useCasesUnknown: false,
          dataRetention: [],
          retentionUnknown: false,
          credentialLifetime: [],
          credentialLifetimeUnknown: false,
          systemCount: '51-200',
          teamSize: '11-50',
          scaleUnknown: false,
          cryptoAgility: 'hardcoded',
          agilityUnknown: false,
          infrastructure: [],
          infrastructureUnknown: false,
          infrastructureSubCategories: {},
          vendorDependency: 'heavy-vendor',
          vendorUnknown: false,
          timelinePressure: 'within-2-3y',
          timelineUnknown: false,
          importComplianceSelection: true,
          importProductSelection: true,
          assessmentStatus: 'complete',
          lastWizardUpdate: '2026-01-01T00:00:00.000Z',
        },
        version: 0,
      })
    )
  })
  // /report computes + persists the assessment result → the sim unlocks off
  // it (same mechanism SimulationView's self-unlock effect reads) — the
  // same real seeding path e2e/sim-start-over.spec.ts already relies on.
  await page.goto('/report', { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('pqc-assessment-result')), {
      timeout: 30_000,
    })
    .toBeTruthy()
}

/** Answer whatever quiz dialog is currently open (learn gate or Brief check),
 *  trying each option in turn until Submit reveals a passing outcome. */
async function passAnyOpenQuiz(page: Page): Promise<void> {
  // The topmost dialog: since 09-28 (WP3.6) the Brief sheet is itself a
  // dialog, and its check (QuizGateModal) opens inside it.
  const dialog = page.getByRole('dialog').last()
  if ((await dialog.count()) === 0) return
  for (let attempt = 0; attempt < 8; attempt++) {
    const answerButtons: Locator[] = []
    for (const b of await dialog.locator('button').all()) {
      const text = (await b.innerText().catch(() => '')).trim()
      if (text && !/^(submit|try again|mark complete|cancel)$/i.test(text)) answerButtons.push(b)
    }
    if (answerButtons.length === 0) return
    await answerButtons[attempt % answerButtons.length]!.click().catch(() => {})
    await page.waitForTimeout(120)
    const submitBtn = dialog.getByRole('button', { name: /^Submit$/i })
    if (await submitBtn.count()) {
      await submitBtn.click()
      await page.waitForTimeout(250)
    }
    if (await dialog.getByRole('button', { name: /Mark complete/i }).count()) {
      await dialog.getByRole('button', { name: /Mark complete/i }).click()
      return
    }
    const retryBtn = dialog.getByRole('button', { name: /Try again/i })
    if (await retryBtn.count()) {
      await retryBtn.click()
      await page.waitForTimeout(120)
      continue
    }
  }
}

/** Makes the decision for the currently-open phone Decide view and returns
 *  once a way forward is on screen: "Right call", or (Realistic/Hard) the
 *  wrong-pick "Do the sound move to continue" panel. On Easy a wrong pick shows
 *  "try again" instead, so the next option is tried. Idempotent: if the
 *  decision was already made (persisted), it just reports the outcome. */
async function pickCorrect(page: Page, decide: Locator): Promise<boolean> {
  const outcomeShown = async () =>
    (await decide.getByText('Right call', { exact: false }).count()) > 0 ||
    (await decide.getByTestId('wrong-pick-continue').count()) > 0
  if (await outcomeShown()) return true
  for (const letter of ['A', 'B', 'C']) {
    const btn = decide.locator(`button[aria-label^="Option ${letter}:"]`)
    if ((await btn.count()) === 0 || (await btn.isDisabled())) continue
    await btn.click()
    await page.waitForTimeout(250)
    if (await outcomeShown()) return true
    const retry = decide.getByRole('button', { name: /try again/i })
    if (await retry.count()) {
      await retry.click()
      await page.waitForTimeout(150)
    }
  }
  return false
}

/** Drives ONE required step of the currently-open Decide view to genuine
 *  completion, covering every step kind the plan's Brief+check work added
 *  phone completion for. Returns a tag describing what kind of step this
 *  was, for the test to assert "at least one activity step" happened. */
async function completeOneStep(
  page: Page,
  decide: Locator,
  baseUrl: string
): Promise<'activity' | 'workshop' | 'architecture' | 'learn' | 'catalog' | 'reference' | 'stuck'> {
  // Every kind's own completion control (Mark complete / Read the brief /
  // See the result / the Hybrid-Pure PQC picker / the plain "open ->" link)
  // renders in the decision's outcome area — after a correct pick, or (since
  // 09-28, WP1) after a wrong pick that stands — so the decision must happen
  // FIRST, before dispatching on which control is present.
  const ok = await pickCorrect(page, decide)
  if (!ok) return 'stuck'
  // activity/workshop/architecture render their own completion control
  // alongside the plain "open ->" preview link — check for those FIRST.
  if (await decide.getByRole('button', { name: /Read the brief/i }).count()) {
    await decide.getByRole('button', { name: /Read the brief/i }).click()
    await page.waitForTimeout(400)
    const sheet = page.getByTestId('sim-brief-sheet')
    const checkBtn = sheet.getByRole('button', { name: /Take the check/i })
    const fileBtn = sheet.getByRole('button', { name: /File this brief/i })
    if (await checkBtn.count()) {
      await checkBtn.click()
      await page.waitForTimeout(300)
      await passAnyOpenQuiz(page)
    } else if (await fileBtn.count()) {
      await fileBtn.click()
    }
    await page.waitForTimeout(400)
    return 'activity'
  }
  if (await decide.getByRole('button', { name: /See the result/i }).count()) {
    await decide.getByRole('button', { name: /See the result/i }).click()
    await page.waitForTimeout(400)
    const sheet = page.getByTestId('sim-brief-sheet')
    const checkBtn = sheet.getByRole('button', { name: /Take the check/i })
    const fileBtn = sheet.getByRole('button', { name: /Log this result/i })
    if (await checkBtn.count()) {
      await checkBtn.click()
      await page.waitForTimeout(300)
      await passAnyOpenQuiz(page)
    } else if (await fileBtn.count()) {
      await fileBtn.click()
    }
    await page.waitForTimeout(400)
    return 'workshop'
  }
  if (await decide.getByText(/pick Hybrid or Pure PQC/i).count()) {
    const hybridBtn = decide.getByRole('button', { name: /^Hybrid$/i }).first()
    if (await hybridBtn.count()) {
      await hybridBtn.click()
      await page.waitForTimeout(300)
    }
    return 'architecture'
  }
  const markBtn = decide.getByRole('button', { name: /Mark complete/i })
  if (await markBtn.count()) {
    await markBtn.click()
    await page.waitForTimeout(300)
    await passAnyOpenQuiz(page)
    return 'learn'
  }
  const openLink = decide.getByRole('link', { name: /open/i }).first()
  if (await openLink.count()) {
    await openLink.click()
    await page.waitForTimeout(500)
    await page.goto(`${baseUrl}/simulation`, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    // The app boots through an "Initializing Secure Environment" (WASM
    // crypto) screen before the sim mounts — wait for the real Decide view
    // to reappear rather than a flat timeout, or the NEXT loop iteration
    // finds no option buttons yet and wrongly reports "stuck".
    await page
      .locator('[data-testid="sim-mobile-decide"]')
      .waitFor({ state: 'visible', timeout: 20_000 })
    return 'reference'
  }
  return 'stuck'
}

test.describe('Simulation — phone play (iPhone 13)', () => {
  test.setTimeout(180_000)

  test('every phase chip is reachable and shows a real Play CTA', async ({ page }) => {
    await seedUnlockedAssessment(page)
    await page.goto('/simulation', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    const group = page.getByRole('group', { name: /Choose a playable phase/i })
    await expect(group).toBeVisible({ timeout: 20_000 })
    const chipCount = await group.locator('button').count()
    // 9 lifecycle phases + Foundations.
    expect(chipCount).toBe(10)
    for (let i = 0; i < chipCount; i++) {
      await group.locator('button').nth(i).click()
      await page.waitForTimeout(150)
      await expect(page.getByRole('button', { name: /(Play|Resume) .* now/i })).toBeVisible()
    }
  })

  test('"Play This Phase" in the Watch chooser opens real Decide, not the narrated engine', async ({
    page,
  }) => {
    // Reached from the LOCKED screen's "Watch the full migration" button —
    // exercise it from a genuinely locked state (no seeded assessment).
    await page.goto('/simulation', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.getByRole('button', { name: /Watch the full migration/i }).click()
    await page
      .getByText(/Play This Phase/i)
      .first()
      .click()
    await expect(page.getByTestId('sim-mobile-decide')).toBeVisible({ timeout: 10_000 })
    // The narrated transport bar (■ Stop / speed controls) must NOT be
    // showing — this is real play, not a walkthrough.
    await expect(page.getByRole('button', { name: /■ Stop/i })).toHaveCount(0)
  })

  test('Executive Mandate plays to L2 on the phone, including a Brief + check, and a mid-run reload resumes', async ({
    page,
  }, testInfo) => {
    await seedUnlockedAssessment(page)
    const baseUrl = new URL(testInfo.project.use.baseURL ?? 'http://localhost:4173').origin
    await page.goto('/simulation', { waitUntil: 'domcontentloaded', timeout: 45_000 })

    const group = page.getByRole('group', { name: /Choose a playable phase/i })
    await group.getByRole('button', { name: /Executive Mandate/ }).click()
    await page.getByRole('button', { name: /(Play|Resume) Executive Mandate/i }).click()

    const decide = page.locator('[data-testid="sim-mobile-decide"]')
    await expect(decide).toBeVisible({ timeout: 10_000 })

    const kinds: string[] = []
    for (let i = 0; i < 25; i++) {
      const levelText = await decide
        .locator('text=/at L\\d/')
        .first()
        .innerText()
        .catch(() => '')
      const levelMatch = levelText.match(/at L(\d)/)
      if (levelMatch && Number(levelMatch[1]) >= 2) break
      // Also treat "PHASE CLEARED" (no next move left) as done.
      if (await decide.getByText('PHASE CLEARED', { exact: false }).count()) break
      const kind = await completeOneStep(page, decide, baseUrl)
      kinds.push(kind)
      if (kind === 'stuck') break

      // Mid-run reload check (WS-7): once at least one activity step has
      // been credited, reload and confirm the run resumes in the SAME
      // phase's Decide view with progress intact, then continue.
      if (kind === 'activity' && !kinds.slice(0, -1).includes('activity')) {
        const stepsBefore = await decide.locator('text=/\\d+\\/\\d+ · at L\\d/').first().innerText()
        await page.reload({ waitUntil: 'domcontentloaded' })
        await expect(page.locator('[data-testid="sim-mobile-decide"]')).toBeVisible({
          timeout: 20_000,
        })
        const stepsAfter = await page
          .locator('[data-testid="sim-mobile-decide"]')
          .locator('text=/\\d+\\/\\d+ · at L\\d/')
          .first()
          .innerText()
        expect(stepsAfter).toBe(stepsBefore)
      }
    }

    expect(kinds).toContain('activity')
    expect(kinds).not.toContain('stuck')
  })

  test('a wrong pick on Realistic is not a dead end — the sound move completes the step (09-28 WP1)', async ({
    page,
  }, testInfo) => {
    await seedUnlockedAssessment(page)
    const baseUrl = new URL(testInfo.project.use.baseURL ?? 'http://localhost:4173').origin
    await page.goto('/simulation', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    const group = page.getByRole('group', { name: /Choose a playable phase/i })
    await group.getByRole('button', { name: /Executive Mandate/ }).click()
    await page.getByRole('button', { name: /(Play|Resume) Executive Mandate/i }).click()
    const decide = page.locator('[data-testid="sim-mobile-decide"]')
    await expect(decide).toBeVisible({ timeout: 10_000 })

    const counter = async () =>
      Number(
        ((await decide.locator('text=/\\d+\\/\\d+ · at L\\d/').first().innerText()).match(
          /^(\d+)\//
        ) ?? [])[1] ?? -1
      )

    // Always pick option A; within a few steps one of them is a trap.
    let sawWrong = false
    for (let i = 0; i < 10 && !sawWrong; i++) {
      const before = await counter()
      await decide.locator('button[aria-label^="Option A:"]').click()
      await page.waitForTimeout(250)
      sawWrong = (await decide.getByTestId('wrong-pick-continue').count()) > 0
      if (sawWrong) {
        await expect(decide.getByTestId('wrong-pick-continue')).toContainText(
          /Do the sound move to continue/i
        )
        // no retry on Realistic — the pick stands
        await expect(decide.getByRole('button', { name: /try again/i })).toHaveCount(0)
      }
      const kind = await completeOneStep(page, decide, baseUrl)
      expect(kind).not.toBe('stuck')
      await expect.poll(counter, { timeout: 15_000 }).toBeGreaterThan(before)
    }
    expect(sawWrong).toBe(true)
  })

  test('phone: More menu (Mode, Reset, Terms), End quarter from Decide, Resources lists the current level (09-28 WP6)', async ({
    page,
  }) => {
    await seedUnlockedAssessment(page)
    await page.goto('/simulation', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    const group = page.getByRole('group', { name: /Choose a playable phase/i })
    await expect(group).toBeVisible({ timeout: 20_000 })

    // Overview: the menu exists and Terms opens + closes
    await page.getByRole('button', { name: 'More run actions' }).click()
    const menu = page.getByRole('menu', { name: 'More run actions' })
    await expect(menu.getByRole('menuitem', { name: /Mode: Realistic/ })).toBeVisible()
    await expect(menu.getByRole('menuitem', { name: /Reset run/ })).toBeVisible()
    await menu.getByRole('menuitem', { name: /Terms/ }).click()
    await page.keyboard.press('Escape')

    // Resources lists the CURRENT level, with no "desktop" dead labels
    await page.getByText(/Resources for this phase · L1 in any order/).click()
    await expect(page.getByText(/continue this task on desktop/i)).toHaveCount(0)

    // Decide: End quarter advances the turn without leaving Decide
    await group.getByRole('button', { name: /Executive Mandate/ }).click()
    await page.getByRole('button', { name: /(Play|Resume) Executive Mandate/i }).click()
    const decide = page.locator('[data-testid="sim-mobile-decide"]')
    await expect(decide).toBeVisible({ timeout: 10_000 })
    await expect(decide.getByText('Q1 2026')).toBeVisible()
    await decide.getByRole('button', { name: /End quarter/ }).click()
    // the quarter report opens over Decide; close it and the turn has moved
    await page.keyboard.press('Escape')
    // (a quarter's events can add a setback, so assert "moved on", not "Q2")
    await expect(decide.getByText('Q1 2026')).toHaveCount(0)

    // Decide: Reset from the menu, confirmed, brings the run back to Q1
    await decide.getByRole('button', { name: 'More run actions' }).click()
    await page.getByRole('menuitem', { name: /Reset run/ }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /Reset run/ })
      .click()
    // a reset lands on the Overview (a fresh run starts there), back at Q1
    await expect(decide).toHaveCount(0)
    await expect(page.getByText('Q1 2026', { exact: true })).toBeVisible()
  })

  test('phone: sector-track steps appear in Resources and can be completed (09-28)', async ({
    page,
  }) => {
    await seedUnlockedAssessment(page)
    await page.goto('/simulation', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    const group = page.getByRole('group', { name: /Choose a playable phase/i })
    await expect(group).toBeVisible({ timeout: 20_000 })
    // play as the government sector
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('pqc-simulation') ?? '{"state":{}}')
      s.state.sector = 'government'
      localStorage.setItem('pqc-simulation', JSON.stringify(s))
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(group).toBeVisible({ timeout: 20_000 })
    await group.getByRole('button', { name: /Executive Mandate/ }).click()
    await page.getByText(/Resources for this phase/).click()
    const sector = page.getByTestId('phone-sector-steps')
    await expect(sector).toContainText(/government & defense/i)
    await sector
      .getByRole('button', { name: /Mark complete/i })
      .first()
      .click()
    await expect(page.getByRole('dialog').last()).toBeVisible()
  })
})
