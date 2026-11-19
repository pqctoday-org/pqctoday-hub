// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const records = [
  {
    domain: 'module',
    id: 'hybrid-crypto',
    scope: 'Content edit: hybrid-crypto',
    date: '2026-11-15',
    name: /Hybrid Cryptography/i,
    path: '/learn/hybrid-crypto',
  },
  {
    domain: 'tool',
    id: 'PT-016',
    scope: 'Baseline review — PT-016 v1.0.0',
    date: '2026-05-07',
    name: /Hybrid Certificates/i,
    path: '/playground/hybrid-certs',
  },
  {
    domain: 'library',
    id: 'FIPS 203',
    scope: 'Plans 03-06: concept_xwalks_05072026.csv',
    date: '2026-05-07',
    name: /Module-Lattice-Based Key-Encapsulation/i,
    path: '/library?ref=FIPS%20203',
  },
  {
    domain: 'compliance',
    id: 'NIST',
    scope: 'Compliance catalogue corrected: deadlines',
    date: '2026-11-08',
    name: /NIST$/i,
    path: '/compliance?framework=NIST',
  },
  {
    domain: 'threats',
    id: 'FIN-001',
    scope: 'Threat notes: internal review labels replaced',
    date: '2026-11-09',
    name: /FIN-001/,
    path: '/threats?id=FIN-001',
  },
  {
    domain: 'migrate',
    id: 'aws-certificate-manager',
    scope: 'Release 4.124.2 hotfix: restores pqc_support',
    date: '2026-09-27',
    name: /AWS Certificate Manager/i,
    path: '/migrate?product=aws-certificate-manager',
  },
] as const

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

for (const width of [1280, 390]) {
  for (const { domain, id, scope, date, name, path } of records) {
    test(`trace the ${id} revision to an active record at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      const entity = encodeURIComponent(id)
      // An exact entity link without a domain also works for known recorded IDs.
      const revisionUrl =
        domain === 'tool' ? `?entity=${entity}` : `?domain=${domain}&entity=${entity}`
      await page.goto(`/revisions${revisionUrl}`)
      const entry = page
        .getByRole('article')
        .filter({ hasText: scope })
        .filter({ has: page.locator(`time[datetime^="${date}T"]`) })
      const disclosure = entry.getByRole('button', { name: 'Inspect revision scope' })
      await expect(entry.locator('time')).toHaveText(date)
      await expect(entry.locator('time')).toHaveAttribute('datetime', new RegExp(`^${date}T`))
      await expect(
        entry.getByText(/Recorded reviewer:|Reviewer not recorded|Review metadata not recorded/)
      ).toBeVisible()
      await disclosure.press('Enter')
      const link = entry.getByRole('link', { name }).filter({ hasText: 'Open current record for' })
      await expect(link).toHaveAttribute('href', path)
      await expect(entry.getByRole('button', { name: 'Hide revision scope' })).toBeFocused()
      await link.press('Enter')
      await expect(page).toHaveURL(new URL(path, page.url()).href)
      if (domain === 'tool') {
        await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
      } else if (domain === 'module') {
        await expect(
          page.getByRole('heading', { level: 1, name: 'Hybrid & Composite Cryptography' })
        ).toBeVisible()
      }
      await page.goBack()
      await expect(entry).toBeVisible()
      expect(new URL(page.url()).searchParams.get('entity')).toBe(id)
    })
  }
  test(`an unknown revision scope recovers at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/revisions?entity=fictional-missing-record')
    await expect(page.getByText('No revision records match this scope.')).toBeVisible()
    await page.getByRole('button', { name: '← All revisions' }).press('Enter')
    await expect(page.getByRole('article').first()).toBeVisible()
  })
}
