// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`PIN device evidence follows firmware and deployment scope at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/pci-certification?tab=workshop')
    const exercise = page.getByRole('region', {
      name: 'Check the device evidence for PIN translation',
    })
    await expect(exercise).toBeVisible({ timeout: 10_000 })
    const result = exercise.getByRole('status', { name: 'Sample PIN device evidence' })
    const check = exercise.getByRole('button', { name: 'Check sample device evidence' })
    const firmware = exercise.getByRole('combobox', { name: 'Deployed Orrin N7 firmware' })
    const controlled = exercise.getByRole('checkbox', {
      name: 'Controlled environment documented for this site',
    })
    const memo = page.getByRole('region', { name: 'Your evidence-review memo' })
    await expect(firmware).toHaveValue('3.2.1')
    await check.click()
    await expect(result).toContainText(
      'Provide evidence that the site meets the controlled-environment requirement'
    )
    await expect(result).toContainText('FIPS certificate FICT-0008 covers 3.1.0')

    await controlled.focus()
    await controlled.press('Space')
    await expect(controlled).toBeFocused()
    await expect(result).toBeEmpty()
    await check.click()
    await expect(result).toContainText(
      'deployment evidence addresses its controlled-environment condition'
    )
    await expect(memo).toContainText('PTS listing FICT-0007 names firmware 3.2.1')

    await firmware.selectOption('4.0.0')
    await expect(result).toBeEmpty()
    await expect(memo).not.toContainText('Fictional PIN translation device evidence')
    await check.click()
    await expect(result).toContainText('PTS listing FICT-0007 omits firmware 4.0.0')
    await expect(result).toContainText('FIPS certificate FICT-0008 covers 3.1.0')
    await memo.getByRole('button', { name: 'Copy memo', exact: true }).click()
    await expect(memo.getByRole('button', { name: 'Copied!', exact: true })).toBeVisible()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toContain('Fictional PIN translation device evidence')
    expect(copied).toContain('PTS listing FICT-0007 omits firmware 4.0.0')
    expect(copied).not.toContain('PTS listing FICT-0007 names firmware 3.2.1')

    await firmware.selectOption('3.1.0')
    await expect(result).toBeEmpty()
    await check.click()
    await expect(result).toContainText('Confirm the listed hardware and approved mode')
    await expect(result).toContainText('PTS listing FICT-0007 omits firmware 3.1.0')
    const approvedMode = exercise.getByRole('checkbox', {
      name: /Listed hardware and approved mode/,
    })
    await approvedMode.press('Space')
    await check.click()
    await expect(result).toContainText(
      'The deployment evidence matches the listed hardware and approved mode'
    )
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      memo.getByRole('button', { name: 'Download memo' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('pci-pin-evidence.md')
    const markdown = await text(await download.createReadStream())
    expect(markdown).toContain('FIPS certificate FICT-0008 covers 3.1.0 at Level 3')
    expect(markdown).toContain('requirements 1-3 and 1-4 (pages 24–25)')
    expect(markdown).toContain('PCI_PIN_v3.1_ROC_Reporting_Template.pdf')
    expect(markdown).not.toContain('PTS listing FICT-0007 omits firmware 4.0.0')

    await firmware.selectOption('3.2.1')
    await check.click()
    await expect(result).toContainText(
      'deployment evidence addresses its controlled-environment condition'
    )
  })
}
