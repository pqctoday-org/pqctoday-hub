// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { ask, openDrawer, openTab, seedHub } from './fixtures/assistantDrawer'

/**
 * Where a resource comes from, and how settled it is, are said in words on the resource shown: the kind chip,
 * the plain origin ("Source: NIST standard"), the record's own status ("Final Standard") and its tag.
 * Nothing rests on colour.
 */
for (const viewport of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`rows state their source, status and tag in words at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await seedHub(page)
    await page.goto('/learn')
    const drawer = await openDrawer(page)
    const answer = await ask(page, drawer, 'What is FIPS 203?')

    const library = await openTab(answer, /^Library, \d+ resources?$/)
    await expect(library.getByText('Library document', { exact: true })).toBeVisible()
    await expect(library.getByText('Final Standard', { exact: true })).toBeVisible()
    await expect(library.getByText(/^Source: NIST standard/)).toBeVisible()
    await expect(library.getByText(/^LIB:/)).toBeVisible()

    const glossary = await openTab(answer, /^Glossary, \d+ resources?$/)
    await expect(glossary.getByText('Glossary term', { exact: true })).toBeVisible()
    await expect(glossary.getByText(/^Source: Hub glossary/)).toBeVisible()
    await expect(glossary.getByText(/^GL:/)).toBeVisible()

    // A trusted source says where it comes from and opens through the Hub's own short address.
    const trusted = await openTab(answer, /^More, \d+ resources?$/)
    await expect(trusted.getByText('Trusted source', { exact: true })).toBeVisible()
    await expect(trusted.getByText(/^Source: Hub trusted sources/)).toBeVisible()
    await expect(trusted.getByText(/^SRC:/)).toBeVisible()
    await expect(trusted.getByRole('button', { name: /^Open reference: / })).toBeVisible()
    await expect(trusted.getByRole('button', { name: /^Copy link: / })).toBeVisible()
  })
}
