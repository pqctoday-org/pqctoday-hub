// SPDX-License-Identifier: AGPL-3.0-only
import { expect } from '@playwright/test'
import { getViolations, injectAxe } from 'axe-playwright'
import { test } from './fixtures/blockAnalytics'

test('SBOM lesson and both workshops pass axe and fit desktop and phone viewports', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
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

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    for (const route of [
      '/learn/sbom',
      '/learn/sbom?tab=workshop&step=0',
      '/learn/sbom?tab=workshop&step=1',
    ]) {
      await page.goto(route)
      await expect(page.locator('h1, h2').first()).toBeVisible()
      if (route === '/learn/sbom') {
        await expect(
          page.getByText(/should not be assumed to include every dependency/)
        ).toBeVisible()
        await expect(page.getByRole('link', { name: 'OMB M-22-18' })).toHaveAttribute(
          'href',
          'https://www.whitehouse.gov/wp-content/uploads/2022/09/M-22-18.pdf'
        )
        await expect(
          page.getByText(/not a blanket rule that every federal software vendor/)
        ).toBeVisible()
        await expect(page.getByText(/the first five fields to components/)).toBeVisible()
        await expect(page.getByText(/not a strict superset/)).toBeVisible()
        await expect(
          page.getByText(/known affected, known not affected, fixed, or under investigation/)
        ).toBeVisible()
      }
      if (route.includes('step=0')) {
        await expect(
          page.getByRole('heading', { name: /Example mappings for nine minimum elements/ })
        ).toBeVisible()
        await expect(page.getByText(/does not certify complete CISA conformance/)).toBeVisible()
      }
      if (route.includes('step=1')) {
        await page.getByRole('button', { name: 'npm / Node package' }).click()
        await expect(page.getByRole('link', { name: 'npm sbom documentation' })).toBeVisible()
        await expect(page.getByText(/not a compliance score/)).toBeVisible()
      }
      await injectAxe(page)
      const violations = await getViolations(page, undefined, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
      expect(
        violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')),
        `${route} at ${width}px: ${JSON.stringify(violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) })))}`
      ).toEqual([])
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }))
      expect(dimensions.content, `${route} at ${width}px`).toBeLessThanOrEqual(dimensions.viewport)
    }
  }
})
