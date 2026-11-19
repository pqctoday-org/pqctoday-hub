// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`simulation previews a valid save before applying it at ${width}px`, async ({ page }) => {
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
      if (!localStorage.getItem('pqc-simulation')) {
        localStorage.setItem(
          'pqc-simulation',
          JSON.stringify({ state: { tourSeen: true }, version: 17 })
        )
      }
    })
    await page.goto('/simulation')
    const fileInput = page.locator('input[aria-label="Saved simulation file"]')
    const importDialog = page.getByRole('alertdialog', { name: 'Restore this simulation run?' })
    const openActions = page.getByRole('button', { name: 'More run actions' })
    await page.getByRole('button', { name: 'Explore with a sample organization' }).click()
    const runMenu = page.getByRole('menu', { name: 'More run actions' })
    const getSave = async () => {
      await openActions.click()
      const [file] = await Promise.all([
        page.waitForEvent('download'),
        runMenu.getByRole('menuitem', { name: /^Export / }).click(),
      ])
      return text(await file.createReadStream())
    }
    const firstSave = await getSave()
    const first = JSON.parse(firstSave).state
    expect(first.sel).not.toBe('p1')

    await page.goto('/simulation?phase=p1')
    await expect(page).toHaveURL((url) => !url.searchParams.has('phase'))
    const changed = JSON.parse(await getSave()).state
    expect(changed.sel).toBe('p1')

    await openActions.click()
    await runMenu.getByRole('menuitem', { name: /^Import / }).click()
    await fileInput.setInputFiles({
      name: 'malformed.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"not a simulation save":true}'),
    })
    await expect(page.getByText(/Save could not be imported/)).toBeVisible()
    await expect(importDialog).toHaveCount(0)
    expect(JSON.parse(await getSave()).state).toEqual(changed)

    const validSave = {
      name: 'original-run.json',
      mimeType: 'application/json',
      buffer: Buffer.from(firstSave),
    }
    await openActions.click()
    await runMenu.getByRole('menuitem', { name: /^Import / }).click()
    await fileInput.setInputFiles(validSave)
    await expect(importDialog).toContainText(`Q${first.q} ${first.year} · ${first.difficulty}`)
    await expect(importDialog).toContainText('Restoring replaces the current simulation run.')
    await expect(importDialog.getByRole('button', { name: 'Cancel' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(importDialog).toHaveCount(0)
    await expect(openActions).toBeFocused()
    expect(JSON.parse(await getSave()).state).toEqual(changed)

    await openActions.click()
    await runMenu.getByRole('menuitem', { name: /^Import / }).click()
    await fileInput.setInputFiles(validSave)
    await importDialog.getByRole('button', { name: 'Restore run' }).click()
    await expect(importDialog).toHaveCount(0)
    await page.reload()
    expect(JSON.parse(await getSave()).state).toEqual(first)
  })
}
