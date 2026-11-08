// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test, type Page } from '@playwright/test'

// Vendors whose roadmap row links one page while their analysis was written
// from another show that analysis in its own "Analysis from another source"
// block, with a link to the page it came from. VND-341 is one of them on the
// shipped data; if its row is later pointed at the analysed page the block
// rightly disappears and this spec should move to another such vendor.
const VENDOR = 'VND-341'
const ROW_URL_PART = 'Migration-to-post-quantum-cryptography-WhitePaper_2025.pdf'
const ANALYSIS_URL_PART = 'post-quantum-cryptography-white-paper.html'

async function dismissOverlays(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
  })
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(1)
}

for (const viewport of [
  { label: 'desktop', width: 1280, height: 900 },
  { label: 'phone 390x844', width: 390, height: 844 },
]) {
  test(`roadmap with an analysis from another source (${viewport.label})`, async ({ page }) => {
    await dismissOverlays(page)
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/migrate?tab=roadmaps&vendor=${VENDOR}`)

    const block = page.getByRole('region', { name: 'Analysis from another source' })
    await expect(block).toBeVisible()
    await expect(block.getByText(/written from a different page than the roadmap/i)).toBeVisible()

    // The analysis link goes to the analysed page; the row's own link still goes to the row.
    const source = block.getByRole('link', { name: /^Analysis source:/ })
    await expect(source).toBeVisible()
    await expect(source).toHaveAttribute('href', new RegExp(ANALYSIS_URL_PART))
    await expect(source).toHaveAttribute('target', '_blank')
    const open = page.getByRole('link', { name: /PQC roadmap|Open the real roadmap/ }).first()
    await expect(open).toHaveAttribute('href', new RegExp(ROW_URL_PART))

    if (viewport.width < 600) {
      // Touch target of at least 44 px high.
      const box = await source.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5)
    }
    await expectNoHorizontalOverflow(page)
  })
}
