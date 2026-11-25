// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { ask, openDrawer, seedHub } from './fixtures/assistantDrawer'

/**
 * Where a resource comes from, and how settled it is, are said in words on its row: the kind chip,
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

    const library = answer.getByRole('listitem').filter({ hasText: 'Library document' }).first()
    await expect(library).toBeVisible()
    await expect(library.getByText('Final Standard', { exact: true })).toBeVisible()
    await expect(library.getByText('Source: NIST standard', { exact: true })).toBeVisible()
    await expect(library.getByText(/^LIB:/)).toBeVisible()

    const glossary = answer.getByRole('listitem').filter({ hasText: 'Glossary term' }).first()
    await expect(glossary.getByText('Source: Hub glossary', { exact: true })).toBeVisible()
    await expect(glossary.getByText(/^GL:/)).toBeVisible()

    // A trusted source says where it comes from and opens through the Hub's own short address.
    const trusted = answer.getByRole('listitem').filter({ hasText: 'Trusted source' }).first()
    await expect(trusted.getByText('Source: Hub trusted sources', { exact: true })).toBeVisible()
    await expect(trusted.getByText(/^SRC:/)).toBeVisible()
    await expect(trusted.getByRole('button', { name: /^Open reference: / })).toBeVisible()
    await expect(trusted.getByRole('button', { name: /^Copy link: / })).toBeVisible()
  })
}
