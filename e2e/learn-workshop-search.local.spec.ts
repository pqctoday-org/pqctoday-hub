// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`find the exact Learn workshop, return to its search and recover from a miss at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width, height: 900 })
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
    await page.goto('/learn/homomorphic-encryption?path=fhe-foundations')
    await page.goto('/learn?mode=browse&persona=developer')
    const search = page.getByLabel('Search modules', { exact: true })
    const results = page.getByRole('region', { name: 'Matching workshop steps' })
    const back = page.getByRole('link', { name: 'Back to workshop search' })

    await search.fill('response artifact')
    await results.getByRole('link', { name: /^Response Artifact Lab/ }).click()
    await expect(
      page.getByRole('heading', { name: 'A. Save a public sample prompt' })
    ).toBeVisible()
    await page.reload()
    await back.click()
    await expect(search).toHaveValue('response artifact')
    await expect(results.getByRole('link', { name: /^Response Artifact Lab/ })).toBeVisible()

    await search.fill('hybrid formats')
    await results.getByRole('link', { name: /^Hybrid Formats/ }).click()
    await expect(page).toHaveURL((url) => url.searchParams.get('sv') === '2')
    await expect(page.getByRole('region', { name: 'Certificate-to-TLS exercise' })).toBeVisible()
    await back.click()
    await expect(search).toHaveValue('hybrid formats')

    await search.fill('advanced hsm custody lab')
    await results.getByRole('link', { name: /^Advanced HSM custody lab/ }).click()
    await expect(page).toHaveURL((url) => url.searchParams.get('path') === 'hsm-custody')
    await expect(
      page.getByRole('heading', { name: /Step 2: Advanced HSM custody lab/i })
    ).toBeVisible()
    await back.click()
    await expect(search).toHaveValue('advanced hsm custody lab')

    await search.fill('no such workshop 7142')
    await expect(results).toHaveCount(0)
    await expect(page.getByText('No modules match your filters.')).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(search).toHaveValue('')
    await expect(page.getByText('No modules match your filters.')).toHaveCount(0)

    await search.fill('cryptography bill of materials')
    const cbomLink =
      width === 390
        ? page.getByRole('link', { name: /Cryptography Bill of Materials \(CBOM\)/ })
        : page.getByRole('link', { name: 'Open Cryptography Bill of Materials (CBOM)' })
    if (width === 1280) {
      await expect(
        page.getByRole('heading', { name: 'Cryptography Bill of Materials (CBOM)' })
      ).toBeVisible()
    }
    await cbomLink.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/learn\/cbom(?:\?|$)/)
    await expect(
      page.getByRole('heading', { name: 'Cryptography Bill of Materials (CBOM)' })
    ).toBeVisible()
    const roleGuidance = page.getByRole('region', { name: 'For your role' })
    await expect(roleGuidance).toContainText('Source Coverage Mapper')
    if (width === 390) {
      await page.getByRole('button', { name: 'Open this step' }).click()
    } else {
      await page.getByRole('button', { name: /Try the Source Coverage Mapper/i }).click()
    }
    await expect(
      page.getByRole('heading', { name: /Step 1: Source Coverage Mapper/i })
    ).toBeVisible()
    const coverage = page.getByText(/\d+\/\d+ assets discovered/)
    const before = await coverage.textContent()
    await page.getByRole('button', { name: /SBOM \/ SCA pipeline/ }).click()
    await expect(coverage).not.toHaveText(before)
    await expect(page.getByText(/Best next scanner/)).toBeVisible()
  })
}
