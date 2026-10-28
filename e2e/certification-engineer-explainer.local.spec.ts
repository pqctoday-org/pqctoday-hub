// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from '@playwright/test'
import { getViolations, injectAxe } from 'axe-playwright'

async function seedCertificationEngineer(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem('pqc-tour-completed', 'true')
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'cert-engineer',
          hasAcknowledgedExecutiveGrcSplit: true,
          hasSeenPersonaPicker: true,
          selectedRegion: 'global',
          selectedIndustry: null,
          selectedIndustries: [],
          suppressSuggestion: true,
          experienceLevel: 'expert',
          viewAccess: 'unlocked',
          niceTier: 'awareness',
          niceTierOverridden: false,
          curiousGuideDismissed: true,
        },
        version: 11,
      })
    )
  })
}

async function expectNoPageOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(1)
}

/**
 * Executable counterpart to the certification-engineer recorder script in
 * pqctoday-plan. It follows only the role's core evidence journey and asserts
 * every screen/interaction the recorder is instructed to show.
 */
test('certification engineer explainer journey is recordable end to end', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('cert-engineer-recorder-seeded')) {
      localStorage.clear()
      sessionStorage.setItem('cert-engineer-recorder-seeded', 'true')
    }
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem('pqc-tour-completed', 'true')
  })

  // Scene 1 — choose the role at runtime and enter its dedicated home.
  await page.goto('/')
  const disclaimer = page.getByRole('button', { name: 'I Understand' })
  if (await disclaimer.isVisible()) await disclaimer.click()
  await page
    .getByRole('button', { name: /Certification & Validation Engineer/i })
    .scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: /Certification & Validation Engineer/i }).click()
  await expect(
    page.getByRole('heading', { name: /Run the vectors before the lab does/i })
  ).toBeVisible()

  // Scene 2 — run the browser validation evidence and read its boundary.
  await page.getByRole('button', { name: /Open the validation workbench/i }).click()
  await expect(page).toHaveURL(/\/playground\/hsm\?tab=build&dtab=acvp/)
  const workbench = page.getByRole('heading', { name: 'Cryptographic Validation Workbench' })
  await workbench.scrollIntoViewIfNeeded()
  await expect(workbench).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: /^Run all$/i }).click()
  await expect(page.getByText('Last run', { exact: true })).toBeVisible({ timeout: 60_000 })
  await expect(
    page.getByText(/evidence only|not.*(?:ACVTS|CAVP|CMVP|certificate)/i).first()
  ).toBeVisible()

  // Scene 3 — open the role-relevant Validation tab and inspect KAT evidence.
  await page.goto('/algorithms')
  await page.locator('[data-workshop-target="tab-validation"]').click()
  await expect(page.locator('[data-workshop-target="tab-validation"]')).toHaveAttribute(
    'data-state',
    'active',
    { timeout: 20_000 }
  )
  await expect(page.getByText('Implementation Attacks', { exact: true })).toBeVisible()
  const katSection = page.locator('[data-workshop-target="section-validation-kat"]')
  await katSection.scrollIntoViewIfNeeded()
  const katToggle = katSection.getByRole('button').first()
  if ((await katToggle.getAttribute('aria-expanded')) !== 'true') await katToggle.click()
  await expect(katToggle).toHaveAttribute('aria-expanded', 'true')
  await expect(
    katSection.getByText(/Passing checks is evidence, not a CAVP or CMVP validation/i)
  ).toBeVisible()

  // Scene 4 — learn which programme can substantiate each product claim.
  await page.goto('/learn/crypto-product-certification')
  await page.getByRole('tab', { name: 'Workshop' }).click()
  await expect(page.getByRole('heading', { name: /Part A — Customer applicability/i })).toBeVisible(
    {
      timeout: 20_000,
    }
  )
  await page.getByText('US federal agency', { exact: true }).click()
  await page.getByText('Appliance', { exact: true }).click()
  await page.getByRole('button', { name: '4 core claims' }).click()
  const answers = [
    ['FIPS 140-3 (CMVP)', 0],
    ['EUCC', 1],
    ['PCI PTS HSM approval', 2],
    ['PCI entity assessment (PIN / P2PE / KMO)', 3],
  ] as const
  for (const [label, occurrence] of answers) {
    await page.getByRole('button', { name: label, exact: true }).nth(occurrence).click()
  }
  await expect(page.getByText('4 of 4 matched · 4 answered', { exact: true })).toBeVisible()

  // Scene 5 — scope the education view, then distinguish record stages.
  await page.goto('/compliance?tab=foryou')
  await page.getByRole('button', { name: /Select industry/i }).click()
  await page.getByRole('option', { name: 'Technology', exact: true }).click()
  await page.getByRole('button', { name: 'Global', exact: true }).click()
  await page.getByRole('option', { name: 'United States', exact: true }).click()
  await expect(page.getByText('Showing applicability for:', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Technology', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'United States', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Certification schemes' })).toBeVisible()
  await page.getByRole('link', { name: 'Open the Records tab', exact: true }).click()
  await expect(page).toHaveURL(/\/compliance\?tab=records/)
  await expect(page.getByRole('heading', { name: 'Product Certification Records' })).toBeVisible()
  await expect(page.getByText('Algorithm validation', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/passed CAVP testing, commonly through ACVP/i).first()).toBeVisible()
  await expect(page.getByText('Module validation', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/holds a FIPS 140 certificate/i).first()).toBeVisible()
  await expect(page.getByText('Evaluated claim', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/not ACVP or FIPS validation/i).first()).toBeVisible()

  // Publication boundary: this journey never navigates to a Hub-hosted copy.
  expect(page.url()).not.toMatch(/\/library\/.*\.(?:pdf|docx?|pptx?)/i)
})

test('certification journey has no page spillover at 320px', async ({ page }) => {
  await seedCertificationEngineer(page)
  await page.setViewportSize({ width: 320, height: 720 })

  for (const path of ['/', '/learn/crypto-product-certification', '/compliance']) {
    await page.goto(path)
    await page.waitForSelector('main', { timeout: 20_000 })
    await expectNoPageOverflow(page)
    await expect(page.locator('a[href^="/library/"][href$=".pdf"]')).toHaveCount(0)
  }
})

test('certification journey remains readable at a 200%-zoom-equivalent viewport', async ({
  page,
}) => {
  await seedCertificationEngineer(page)
  // A 1440 × 900 browser at 200% zoom exposes approximately 720 × 450 CSS px.
  await page.setViewportSize({ width: 720, height: 450 })

  for (const path of [
    '/',
    '/algorithms?tab=validation',
    '/learn/crypto-product-certification',
    '/compliance?tab=records',
  ]) {
    await page.goto(path)
    await page.waitForSelector('main', { timeout: 20_000 })
    await expectNoPageOverflow(page)
  }
})

test('critical certification screens expose accessible structure and official source links', async ({
  page,
}) => {
  test.setTimeout(150_000)
  await seedCertificationEngineer(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })

  for (const path of [
    '/',
    '/algorithms?tab=validation',
    '/learn/crypto-product-certification',
    '/compliance?tab=records',
  ]) {
    await page.goto(path)
    await page.waitForSelector('main', { timeout: 20_000 })
    await page.addStyleTag({
      content:
        '*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important}',
    })
    await injectAxe(page)
    const violations = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(
      violations.filter((violation) =>
        violation.impact ? ['critical', 'serious'].includes(violation.impact) : false
      ),
      `${path} serious/critical accessibility violations`
    ).toEqual([])
  }

  await page.goto('/compliance?tab=cswp39')
  await page.waitForSelector('main', { timeout: 20_000 })
  // The tab waits for the ~10 MB compliance dataset; on a cold dev server with
  // four workers that alone can take over 30 s.
  await expect(page.getByText('Loading compliance data')).toHaveCount(0, { timeout: 60_000 })
  // The CSWP 39 explorer renders only once the compliance data has loaded,
  // which can take longer than the default expect timeout under gate load.
  const officialPdf = page.getByRole('link', { name: 'Official PDF' })
  await expect(officialPdf).toHaveAttribute(
    'href',
    'https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.39-upd1.pdf',
    { timeout: 30_000 }
  )
  await officialPdf.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(officialPdf).toBeFocused()
})
