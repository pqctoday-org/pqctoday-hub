// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

const nistSource = 'https://csrc.nist.gov/pubs/ir/8547/final'

for (const surface of ['learn', 'business']) {
  for (const width of [1280, 390]) {
    test(`${surface} compares individual NIST milestones at ${width}px`, async ({ page }) => {
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
      await page.goto(
        surface === 'learn'
          ? '/learn/compliance-strategy?tab=workshop&step=0'
          : '/business/tools/compliance-timeline'
      )
      if (surface === 'learn') {
        await page.getByRole('checkbox', { name: /^United States \d+ frameworks/ }).check()
        await page.getByRole('button', { name: /Step 3: Compliance Timeline/ }).click()
      } else {
        await page.getByRole('button', { name: 'Load sample US + EU timeline' }).click()
      }

      const deprecateName = /NIST IR 8547 \(deprecate\) — reference year 2030/
      const disallowName = /NIST IR 8547 \(disallow\) — reference year 2035/
      const deprecate = page.getByRole('button', { name: /^NIST IR 8547 \(deprecate\) / })
      const disallow = page.getByRole('button', { name: /^NIST IR 8547 \(disallow\) / })
      const pin = page.getByRole('button', { name: 'Add NIST IR 8547 (deprecate) to timeline' })
      await expect(deprecate).toHaveAttribute('aria-expanded', 'false')
      await pin.press('Space')
      await expect(
        page.getByRole('button', { name: 'Remove NIST IR 8547 (deprecate) from timeline' })
      ).toHaveAttribute('aria-pressed', 'true')
      await expect(deprecate).toHaveAttribute('aria-expanded', 'false')
      await deprecate.press('Enter')
      await expect(deprecate).toHaveAttribute('aria-expanded', 'true')
      const detailId = await deprecate.getAttribute('aria-controls')
      const detail = page.locator(`[id="${detailId}"]`)
      await expect(detail.getByTestId('binding-force')).toHaveText('Official target')
      await expect(detail.getByRole('link', { name: 'Open framework source' })).toHaveAttribute(
        'href',
        nistSource
      )
      await expect(detail).toContainText('does not by itself oblige anyone')
      await deprecate.press('Enter')

      const form = page.getByRole('group', { name: /Link this milestone to obligations/ })
      await page
        .getByPlaceholder('e.g., Complete crypto inventory')
        .fill('Replace sample classical verifier')
      await page.getByRole('button', { name: /^Milestone year, currently/ }).click()
      await page.getByRole('option', { name: '2032', exact: true }).click()
      await form.getByRole('checkbox', { name: deprecateName }).check()
      await page.getByRole('button', { name: 'Add', exact: true }).click()
      await expect(deprecate).toContainText('planned or recorded after the reference year')
      await expect(disallow).toContainText('no milestone-to-obligation scope')
      const associations = page.getByRole('group', {
        name: 'Explicit reference associations for Replace sample classical verifier',
      })
      await associations.getByRole('checkbox', { name: disallowName }).check()
      await expect(disallow).toContainText('planned by the reference year')

      const [file] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: '.md', exact: true }).click(),
      ])
      const report = await text(await file.createReadStream())
      expect(report).toMatch(
        /NIST IR 8547 \(deprecate\) \| 2030 \| Late plan\/record \|.*official target/
      )
      expect(report).toMatch(
        /NIST IR 8547 \(disallow\) \| 2035 \| Planned by reference year \|.*official target/
      )
      expect(report).toContain(nistSource)
    })
  }
}
