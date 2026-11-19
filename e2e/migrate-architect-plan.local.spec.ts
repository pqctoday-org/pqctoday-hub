// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`migration architect records and exports a scoped transition draft at ${width}px`, async ({
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
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({
          state: {
            selectedPersona: 'architect',
            selectedRegion: 'global',
            experienceLevel: 'expert',
            viewAccess: { allowed: [] },
          },
          version: 0,
        })
      )
    })

    await page.goto('/migrate?domain=tls')
    await expect(page.getByText(/Educational planning exercise/i)).toBeVisible()
    await expect(page.getByText(/not a readiness or compliance assessment/i)).toBeVisible()
    if (width === 390) {
      await page.getByRole('button', { name: 'Add to plan', exact: true }).click()
    } else {
      await page.getByRole('checkbox', { name: /Add TLS key exchange to plan/i }).click()
    }
    if (width === 390) {
      await expect(page.getByRole('button', { name: 'In your plan' })).toBeVisible()
    } else {
      await expect(page.getByText('Planning coverage')).toBeVisible()
    }

    const openPlan = async () => {
      if (width === 390) await page.getByRole('button', { name: /^Plan/ }).click()
      else await page.getByRole('tab', { name: /Plan/ }).click()
    }
    await openPlan()
    const planPanel =
      width === 390
        ? page
            .locator('main')
            .filter({ has: page.getByRole('button', { name: /Export planning draft/ }) })
        : page
            .getByRole('tabpanel')
            .filter({ has: page.getByRole('button', { name: /Export planning draft/ }) })
    await expect(planPanel.getByText('TLS key exchange', { exact: true })).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      planPanel.getByRole('button', { name: /Export planning draft \(JSON\)/ }).click(),
    ])
    expect(await download.suggestedFilename()).toBe('pqc-migration-planning-draft.json')
    const draft = JSON.parse(await text(await download.createReadStream()))
    expect(draft.format).toBe('pqctoday-migration-planning-draft')
    expect(draft.disclaimer).toMatch(/not a discovered inventory, CBOM, readiness assessment/)
    expect(draft.items.map((item: { id: string }) => item.id)).toEqual(['tls'])
    expect(draft.items[0].targetDiscussion).toContain('X25519 + ML-KEM-768')

    await page.reload()
    await openPlan()
    await expect(
      (width === 390 ? page.locator('main') : page.getByRole('tabpanel'))
        .filter({ has: page.getByRole('button', { name: /Export planning draft/ }) })
        .getByText('TLS key exchange', { exact: true })
    ).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    ).toBeLessThanOrEqual(1)
  })
}
