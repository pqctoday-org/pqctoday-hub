import { test, expect, type Page } from '@playwright/test'

/**
 * 09-28 simulation navigation remediation — desktop, local tier only
 * (`*.local.spec.ts`, never CI; run with `--project=local`).
 *
 *  - WP1: a wrong pick on Realistic (the default) is not a dead end — the
 *    sound move's own control and a Progress-tab escape are exposed.
 *  - WP3: an auto-run intro can be closed without advancing (Escape / ✕ used to
 *    mean "Begin", and the intro covered the transport bar's Stop).
 */

const seed = async (page: Page) => {
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
    if (!localStorage.getItem('pqc-simulation')) {
      localStorage.setItem(
        'pqc-simulation',
        JSON.stringify({ state: { tourSeen: true }, version: 17 })
      )
    }
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
  await page.goto('/report', { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('pqc-assessment-result')), {
      timeout: 30_000,
    })
    .toBeTruthy()
}

const openBoard = async (page: Page) => {
  await page.goto('/simulation', { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await expect(page.getByRole('button', { name: /End Quarter/i })).toBeVisible({ timeout: 45_000 })
}

test.describe('Simulation navigation (desktop) — 09-28 remediation', () => {
  test.setTimeout(150_000)

  test('WP1: a wrong pick on Realistic exposes the sound move and a Progress escape', async ({
    page,
  }) => {
    await seed(page)
    // Exactly one of the three cards is correct. Each attempt starts a fresh
    // decision (attempts cleared) and tries a different letter, so a wrong
    // pick is guaranteed within three tries whatever the card order is.
    let wrongShown = false
    for (let i = 0; i < 3 && !wrongShown; i++) {
      await page.evaluate(() =>
        localStorage.setItem(
          'pqc-simulation',
          JSON.stringify({ state: { tourSeen: true }, version: 17 })
        )
      )
      await openBoard(page)
      const letter = ['A', 'B', 'C'][i]
      await page.locator(`button[aria-label^="Option ${letter}:"]`).first().click()
      wrongShown = await page
        .getByTestId('wrong-pick-continue')
        .isVisible({ timeout: 2_000 })
        .catch(() => false)
    }
    expect(wrongShown).toBe(true)

    const panel = page.getByTestId('wrong-pick-continue')
    await expect(panel).toContainText(/Do the sound move to continue/i)
    await expect(page.getByRole('button', { name: /try again/i })).toHaveCount(0)
    // the step's own control is there (open in the sim, or a deep link)
    await expect(
      panel
        .getByRole('button', { name: /open here/i })
        .or(panel.getByRole('link', { name: /open/i }))
    ).toBeVisible()

    // the Progress-tab escape switches tabs to the any-order step list
    await panel.getByRole('button', { name: /choose any task on progress/i }).click()
    await expect(page.getByText(/Do these in any order/i).first()).toBeVisible()
  })

  test('WP3: an auto-run intro closes without advancing, and Stop is then reachable', async ({
    page,
  }) => {
    await seed(page)
    await openBoard(page)
    await page.getByRole('button', { name: '▶ PLAY' }).click()
    const chooser = page.getByRole('dialog', { name: /Choose how to play/i })
    await expect(chooser).toBeVisible()
    // Full Migration Journey opens on the one-time scenario card.
    await chooser
      .getByRole('button', { name: /▶ Play$/ })
      .nth(1)
      .click()

    const intro = page.getByRole('dialog').filter({ hasText: /Begin/ })
    await expect(intro).toBeVisible({ timeout: 10_000 })
    await page.keyboard.press('Escape')
    await expect(intro).toHaveCount(0)

    // Escape paused (did NOT begin): Resume is offered, and Stop is reachable.
    await expect(page.getByRole('button', { name: /▶ Resume/ })).toBeVisible()
    await page.getByRole('button', { name: /■ Stop/ }).click()
    await expect(page.getByRole('button', { name: /■ Stop/ })).toHaveCount(0, { timeout: 10_000 })
  })

  test('WP2: once the run has started, the Mode dial asks before starting a new run', async ({
    page,
  }) => {
    await seed(page)
    await openBoard(page)
    const mode = page.getByRole('button', { name: /^Mode:/i }).first()
    await expect(mode).toContainText(/Realistic/)

    // make a decision — the run has now started
    await page.locator('button[aria-label^="Option A:"]').first().click()

    await mode.click()
    const confirm = page.getByRole('alertdialog', { name: /Start a new run on Hard/i })
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: /cancel/i }).click()
    await expect(mode).toContainText(/Realistic/)

    await mode.click()
    await page
      .getByRole('alertdialog', { name: /Start a new run on Hard/i })
      .getByRole('button', { name: /Start new run/i })
      .click()
    await expect(mode).toContainText(/Hard/)
    // a clean run: the decision is open again
    await expect(page.locator('button[aria-label^="Option A:"]').first()).toBeEnabled()
  })

  test('WP5: browser Back closes an open resource and stays in the sim; Forward reopens it', async ({
    page,
  }) => {
    await seed(page) // ends on /report — the page before the sim in history
    await openBoard(page)
    await page.getByRole('tab', { name: 'Progress' }).click()
    await page
      .getByRole('button', { name: /open here/i })
      .first()
      .click()
    const back = page.getByRole('button', { name: /Back to board/i })
    await expect(back).toBeVisible()
    await expect(page).toHaveURL(/[?&]open=/)
    const resourceUrl = page.url()

    await page.goBack()
    await expect(page).toHaveURL(/\/simulation(?!.*open=)/)
    await expect(back).toHaveCount(0)
    await expect(page.getByRole('button', { name: /End Quarter/i })).toBeVisible()

    await page.goForward()
    await expect(back).toBeVisible()

    // the close button behaves like Back: same entry, no stacking
    await back.click()
    await expect(back).toHaveCount(0)
    await expect(page).toHaveURL(/\/simulation(?!.*open=)/)
    await page.goBack()
    await expect(page).toHaveURL(/\/report/)

    // a copied resource link opens the resource; closing it stays on /simulation
    await page.goto(resourceUrl, { waitUntil: 'domcontentloaded' })
    await expect(back).toBeVisible({ timeout: 45_000 })
    await back.click()
    await expect(page).toHaveURL(/\/simulation(?!.*open=)/)
    await expect(page.getByRole('button', { name: /End Quarter/i })).toBeVisible()
  })

  test('WP5: an unresolvable ?open= value is stripped, never followed', async ({ page }) => {
    await seed(page)
    await page.goto('/simulation?open=1~p0~reference~/admin', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /End Quarter/i })).toBeVisible({
      timeout: 45_000,
    })
    await expect(page).toHaveURL(/\/simulation(?!.*open=)/)
    await expect(page.getByRole('button', { name: /Back to board/i })).toHaveCount(0)
  })

  test('WP5/WP7a: a reload restores the open resource; the first open returns focus on close', async ({
    page,
  }) => {
    await seed(page)
    await openBoard(page)
    await page.getByRole('tab', { name: 'Progress' }).click()
    const opener = page.getByRole('button', { name: /open here/i }).first()
    const openerLabel = (await opener.textContent()) ?? ''
    await opener.click()
    const back = page.getByRole('button', { name: /Back to board/i })
    await expect(back).toBeVisible()

    // WP7a: the first open after load used to be opened twice, losing the
    // focus-return target — closing now returns focus to the button that opened it.
    await back.click()
    await expect(back).toHaveCount(0)
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.textContent ?? ''))
      .toBe(openerLabel)

    // reload with the resource open → it is restored, tied to the URL
    await opener.click()
    await expect(back).toBeVisible()
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(back).toBeVisible({ timeout: 45_000 })
    await expect(page).toHaveURL(/[?&]open=/)
    await back.click()
    await expect(page).toHaveURL(/\/simulation(?!.*open=)/)
    await expect(page.getByRole('button', { name: /End Quarter/i })).toBeVisible()
  })
})
