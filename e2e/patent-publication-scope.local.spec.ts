// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const examples = [
  {
    number: 'US20260189535',
    title: 'Hybrid Cryptography Virtual Private Networks',
    label: /^Published application\.?$/,
    scope:
      'Check the application history to see whether it later issued, was abandoned, or remains pending.',
  },
  {
    number: 'US12470376',
    title: 'Cryptographic system for post-quantum cryptographic operations',
    label: /^Granted patent\.?$/,
    scope: 'Check the official record for later changes to its status.',
  },
]
for (const width of [1280, 390]) {
  test(`patent details distinguish document type from current status at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    for (const record of examples) {
      await page.goto(`/patents?patent=${record.number}`)
      const detail = page.getByRole('dialog').filter({ hasText: record.title })
      await expect(detail.getByRole('heading', { name: record.title, exact: true })).toBeVisible()
      await expect(detail.getByText(record.label).first()).toBeVisible()
      await expect(detail.getByText(record.scope, { exact: false })).toBeVisible()
      await expect(detail.getByText(/claims are still under examination/i)).toHaveCount(0)
      const lookup = detail.getByRole('link', { name: `Look up ${record.number} at USPTO` })
      await expect(lookup).toHaveAttribute(
        'href',
        'https://www.uspto.gov/patents/search/patent-public-search'
      )
      await expect(lookup).toHaveAttribute('target', '_blank')
      await lookup.focus()
      await expect(lookup).toBeFocused()
    }
  })
}
