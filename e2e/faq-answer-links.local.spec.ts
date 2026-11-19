// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`a shared FAQ answer leads to actual deployment-scope practice at ${width}px`, async ({
    page,
  }) => {
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
    await page.goto('/faq?q=validation%20backlog')
    const question = page.getByRole('button', { name: /What is FIPS 140-3 and why/ })
    await question.press('Enter')
    await page.getByRole('link', { name: 'Open this answer on its own' }).press('Enter')
    await expect(page).toHaveURL(/faq\?answer=fips-module-scope$/)
    await expect(question).toBeFocused()
    await page.reload()
    await expect(question).toHaveAttribute('aria-expanded', 'true')
    await expect(question).toBeFocused()

    const reference = page.getByRole('link', { name: 'NIST CMVP validated module records' })
    await expect(reference).toHaveAttribute(
      'href',
      'https://csrc.nist.gov/Projects/Cryptographic-Module-Validation-Program/Validated-Modules'
    )
    await page
      .getByRole('link', { name: 'Check the boundary of a sample validated module' })
      .press('Enter')
    const exercise = page.getByRole('region', {
      name: 'Check whether the validation record covers a deployment',
    })
    const compare = exercise.getByRole('button', { name: 'Compare with the record' })
    const result = exercise.getByRole('status', { name: 'Deployment scope result' })
    await compare.click()
    await expect(result).toContainText('matches the tested configuration')
    await exercise.getByLabel('Operational environment').selectOption('Debian 12 on ARM64')
    await compare.click()
    await expect(result).toContainText('Operational environment differs.')

    await page.goto('/faq?answer=nis2-cryptography')
    await expect(page.getByText(/directive names no PQC algorithm/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'NIS2 Directive, Article 21' })).toHaveAttribute(
      'href',
      'https://eur-lex.europa.eu/eli/dir/2022/2555/oj/eng'
    )
    await page.goto('/faq?answer=dora-cryptography')
    await expect(page.getByText(/applied since 17 January 2025/)).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'DORA technical standards, Article 6' })
    ).toHaveAttribute('href', 'https://eur-lex.europa.eu/eli/reg_del/2024/1774/oj/eng')
    await page.getByRole('link', { name: 'All questions' }).press('Enter')
    await expect(page.getByRole('searchbox', { name: 'Search questions' })).toBeVisible()
    await page.goto('/faq?answer=unavailable')
    await expect(page.getByText(/answer link could not be found/)).toBeVisible()
    await page.getByRole('searchbox', { name: 'Search questions' }).fill('run Python')
    await expect(
      page.getByRole('button', { name: /edit and run Python crypto code/ })
    ).toBeVisible()
  })
}
