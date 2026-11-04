// SPDX-License-Identifier: AGPL-3.0-only
/**
 * HPKE workshop and composite certificate screen, real browser, real engines
 * (local tier, never in CI). Runs against the production preview build.
 *
 *   PLAYWRIGHT_DEV_PORT=<free port> npx playwright test --project=local \
 *     e2e/hybrid-hpke-workshop.local.spec.ts
 *
 * Set HPKE_SHOTS_DIR=<dir> to also save a screenshot of each screen at desktop,
 * tablet and phone width, for reading by eye.
 *
 * What it proves, in a browser:
 *  - the three groups (Before 3.3 / Not part of any standard / After 3.3) are
 *    all visible at every width;
 *  - every sequence runs its six steps to "Round-trip: verified", and the
 *    protected-key probe reports the measured refusal (never a bare "expected");
 *  - choosing a KEM that leaves the v3.3 draft sequence resets step progress;
 *    (The C++ engine cannot be chosen from these two screens: the Live HSM
 *    toggle starts the Rust engine on mount. The "Not in this engine yet" paths
 *    are covered by the unit tests with a mocked engine answer.)
 *  - both ways to sign a composite certificate produce a certificate that
 *    verifies. (Which service each button calls is checked by
 *    HybridCertFormats.signingWay.test.tsx and, on the real engine, by
 *    services/compositeCertOneCall.local.test.ts; the page does not show it.)
 */
import { test, expect, type Locator, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const WORKSHOP = '/learn/hybrid-crypto?tab=workshop'
const SHOTS = process.env.HPKE_SHOTS_DIR

const GROUP_V32 = /PKCS#11 v3\.2 \(composed from standard pieces\)/
const GROUP_PROPOSAL = /PQCToday proposal — CKM_HPKE/
const GROUP_V33 = /PKCS#11 v3\.3 draft — CKM_COMP_KEM/

const STEPS = [
  'Generate Recipient Keypair',
  'Provision Sender Key + PSK',
  'Encapsulate',
  /^(Derive Keys & Seal|Seal)$/,
  'Decapsulate',
  /^(Derive Keys & Open|Open)$/,
] as const

/** Open the module's workshop and its HPKE step, the way a learner does. */
async function openHpke(page: Page): Promise<void> {
  await page.goto(WORKSHOP)
  await page.getByRole('button', { name: /^Step 3: HPKE/ }).click()
  await expect(page.getByText('Before 3.3 (standard, today)', { exact: true }).first()).toBeVisible(
    { timeout: 60_000 }
  )
}

async function prepare(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0', isFirstVisit: false }, version: 3 })
    )
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
  })
}

/** Live HSM mode persists across visits, so Enable is only clicked if shown. */
async function enableHsm(page: Page, engine?: 'Rust' | 'C++'): Promise<void> {
  const active = page.getByText('Live HSM Mode Active')
  const enable = page.getByRole('button', { name: 'Enable', exact: true })
  await expect(active.or(enable).first()).toBeVisible({ timeout: 60_000 })
  if (engine && (await enable.isVisible())) {
    await page.getByRole('radio', { name: new RegExp(`^${engine.replace('+', '\\+')}`) }).check()
  }
  if (await enable.isVisible()) await enable.click()
  await expect(active).toBeVisible({ timeout: 90_000 })
}

/** The workshop's own Reset (the module header has another one, which restarts the module). */
async function resetWorkshop(page: Page): Promise<void> {
  const controls = page
    .getByRole('button', { name: 'HPKE KEM' })
    .locator('xpath=ancestor::div[contains(@class,"px-6")][1]')
  await controls.getByRole('button', { name: /^Reset/ }).click()
}

async function chooseKem(page: Page, label: string): Promise<void> {
  await page.getByRole('button', { name: 'HPKE KEM' }).click()
  await page.getByRole('option', { name: label }).click()
}

/** Run every step to the end and return the text of the whole output area. */
async function runAllSteps(page: Page): Promise<string> {
  for (let i = 0; i < STEPS.length; i++) {
    const action = page.getByRole('button', { name: STEPS[i], exact: typeof STEPS[i] === 'string' })
    await action.first().click()
    if (i < STEPS.length - 1) {
      const next = page.getByRole('button', { name: 'Next Step', exact: true })
      await expect(next).toBeEnabled({ timeout: 90_000 })
      await next.click()
    } else {
      await expect(page.getByText(/Round-trip: ✓ verified/).first()).toBeVisible({
        timeout: 90_000,
      })
    }
  }
  return (await page.locator('body').textContent()) ?? ''
}

/** Screenshot of the section that holds a control (for reading by eye). */
async function shotSection(control: Locator, name: string): Promise<void> {
  if (!SHOTS) return
  fs.mkdirSync(SHOTS, { recursive: true })
  const section = control.locator('xpath=ancestor::div[contains(@class,"px-6")][1]')
  await section.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

async function shot(page: Page, name: string): Promise<void> {
  if (!SHOTS) return
  fs.mkdirSync(SHOTS, { recursive: true })
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true })
}

test.describe('HPKE workshop — three sequences in a real browser', () => {
  test.setTimeout(300_000)

  test('the three groups are visible at desktop, tablet and phone width', async ({ page }) => {
    await prepare(page)
    await openHpke(page)
    for (const [name, size] of [
      ['desktop', { width: 1280, height: 900 }],
      ['tablet', { width: 820, height: 1180 }],
      ['phone', { width: 390, height: 844 }],
    ] as const) {
      await page.setViewportSize(size)
      for (const label of [
        'Before 3.3 (standard, today)',
        'Not part of any standard',
        'After 3.3 (working draft)',
      ]) {
        await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
      }
      for (const group of [GROUP_V32, GROUP_PROPOSAL, GROUP_V33]) {
        const b = page.getByRole('button', { name: group })
        await expect(b).toBeVisible()
        // no clipped button: it must sit inside the viewport horizontally
        const box = await b.boundingBox()
        expect(box, `${group} has a box at ${name}`).not.toBeNull()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(size.width + 1)
      }
      await shotSection(
        page.getByRole('group', { name: 'HPKE engine mode' }),
        `hpke-groups-${name}`
      )
      await shotSection(page.getByRole('button', { name: 'HPKE KEM' }), `hpke-controls-${name}`)
    }
    expect((await page.locator('body').textContent()) ?? '').not.toMatch(/vNext/i)
  })

  test('v3.3 draft sequence runs to the end for each hybrid suite (Rust engine)', async ({
    page,
  }) => {
    await prepare(page)
    await openHpke(page)
    await enableHsm(page, 'Rust')
    await page.getByRole('button', { name: GROUP_V33 }).click()
    for (const kem of [
      'MLKEM768-X25519 (PQ-hybrid)',
      'MLKEM768-P256 (PQ-hybrid)',
      'MLKEM1024-P384 (PQ-hybrid)',
    ]) {
      await chooseKem(page, kem)
      await expect(page.getByText('CKK_COMP_KEM keypair').first()).toBeVisible()
      const text = await runAllSteps(page)
      expect(text).toContain('Sample plaintext-read refusal observed')
      expect(text).not.toContain('Protected-key read check')
      expect(text).not.toContain('MISMATCH')
      await shot(page, `hpke-v33-${kem.split(' ')[0]}-done`)
      // back to step 1 for the next suite
      await resetWorkshop(page)
    }
  })

  test('v3.2 composed sequence: pure ML-KEM and a hybrid suite, and the single-call proposal', async ({
    page,
  }) => {
    await prepare(page)
    await openHpke(page)
    await enableHsm(page, 'Rust')
    for (const [group, kem] of [
      [GROUP_V32, 'ML-KEM-512 (PQ only)'],
      [GROUP_V32, 'ML-KEM-768 (PQ only)'],
      [GROUP_V32, 'ML-KEM-1024 (PQ only)'],
      [GROUP_V32, 'MLKEM768-X25519 (PQ-hybrid)'],
      [GROUP_PROPOSAL, 'MLKEM768-X25519 (PQ-hybrid)'],
      [GROUP_PROPOSAL, 'ML-KEM-768 (PQ only)'],
    ] as const) {
      await page.getByRole('button', { name: group }).click()
      await chooseKem(page, kem)
      const text = await runAllSteps(page)
      expect(text, `${group} ${kem}`).toContain('Sample plaintext-read refusal observed')
      expect(text).not.toContain('MISMATCH')
      await resetWorkshop(page)
    }
  })

  test('leaving the v3.3 draft sequence by choosing pure ML-KEM resets the run', async ({
    page,
  }) => {
    await prepare(page)
    await openHpke(page)
    await enableHsm(page, 'Rust')
    await page.getByRole('button', { name: GROUP_V33 }).click()
    await page.getByRole('button', { name: 'Generate Recipient Keypair' }).click()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Provision Sender Key + PSK' })).toBeVisible()
    await chooseKem(page, 'ML-KEM-768 (PQ only)')
    // the sequence changed to the v3.2 one and the run starts again at step 1
    await expect(page.getByText('Its encapsulation key IS pkR').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Generate Recipient Keypair' })).toBeVisible()
    await expect(page.getByText('CKK_COMP_KEM keypair')).toHaveCount(0)
  })
})

test.describe('composite certificate screen — both ways to sign', () => {
  test.setTimeout(300_000)

  test('Before 3.3 (two signs) and After 3.3 (one CKM_COMP_SIG call) both verify', async ({
    page,
  }) => {
    await prepare(page)
    await page.goto('/playground/hybrid-certs')
    await enableHsm(page, 'Rust')
    for (const size of [
      { width: 1280, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(size)
      await expect(page.getByText('Before 3.3 (standard, today)').first()).toBeVisible()
      await expect(page.getByText('After 3.3 (working draft)').first()).toBeVisible()
      if (SHOTS) {
        const chooser = page
          .getByRole('group', { name: 'Composite signing way' })
          .locator('xpath=ancestor::div[2]')
        await chooser.scrollIntoViewIfNeeded()
        await chooser.screenshot({ path: path.join(SHOTS, `cert-ways-${size.width}.png`) })
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 })
    const oneCall = page.getByRole('button', { name: /One CKM_COMP_SIG call/ })
    const twoSigns = page.getByRole('button', { name: /Two HSM signs/ })
    // The composite card's own Generate button: the nearest ancestor of the way
    // chooser that holds one (other cards have their own Generate buttons).
    const generate = oneCall
      .locator('xpath=ancestor::div[.//button[normalize-space()="Generate"]][1]')
      .getByRole('button', { name: 'Generate', exact: true })
    for (const [name, way] of [
      ['two signs', twoSigns],
      ['one call', oneCall],
    ] as const) {
      // the way chooser belongs to a card that has no result yet: clear the last run first
      const clear = page.getByRole('button', { name: /Clear results/ })
      if (await clear.isVisible()) await clear.click()
      await way.click()
      await generate.click()
      // results were cleared before this run, so exactly one Verified line means this run
      await expect(page.getByText(/^Verified — \d+\/\d+ checks passed$/)).toHaveCount(1)
      await expect(page.getByText(/checks failed$/)).toHaveCount(0)
      await expect(page.getByText(/Not in this engine yet/)).toHaveCount(0)
      await shot(page, `cert-${name.replace(' ', '-')}`)
    }
  })
})
