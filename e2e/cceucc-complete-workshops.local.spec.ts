// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'
import {
  ASSURANCE_COMPONENTS,
  CC_DECODER_RECORDS,
  CLAIM_VERDICT_LABEL,
  EIDAS_TRACE_SCENARIOS,
} from '../src/components/PKILearning/modules/CcEuccCertification/data/ccEuData'

async function seed(page: import('@playwright/test').Page) {
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
}

async function expectNoSeriousAxeViolations(page: import('@playwright/test').Page) {
  await page.waitForTimeout(300)
  await injectAxe(page)
  const violations = await getViolations(page, 'main', {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  expect(
    violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical'
    )
  ).toEqual([])
}

for (const width of [1280, 390]) {
  test(`CC certificate decoder completes all three real records at ${width}px`, async ({
    page,
  }) => {
    await seed(page)
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/learn/cc-eucc-certification?tab=workshop&path=cc&step=0')
    await expect(page.getByRole('group', { name: 'Certificate record' })).toBeVisible({
      timeout: 20_000,
    })
    await expectNoSeriousAxeViolations(page)

    for (const [recordIndex, record] of CC_DECODER_RECORDS.entries()) {
      await page.getByRole('button', { name: record.shortName, exact: true }).click()
      for (const code of record.components) {
        const meaning = ASSURANCE_COMPONENTS.get(code)?.plain
        if (!meaning) throw new Error(`Missing assurance component ${code}`)
        const answer = page.getByRole('group', { name: `Meaning of ${code}` }).getByRole('button', {
          name: meaning,
          exact: true,
        })
        if (recordIndex === 0 && code === record.components[0]) {
          await answer.focus()
          await page.keyboard.press('Space')
        } else {
          await answer.click()
        }
        await expect(page.getByRole('status').filter({ hasText: `Right — ${code}` })).toBeVisible()
      }

      const verdictGroups = page.getByRole('group', { name: 'Your verdict' })
      await expect(verdictGroups).toHaveCount(record.claims.length)
      for (const [index, claim] of record.claims.entries()) {
        const label = CLAIM_VERDICT_LABEL.get(claim.verdict)
        if (!label) throw new Error(`Missing verdict label for ${claim.verdict}`)
        await verdictGroups.nth(index).getByRole('button', { name: label, exact: true }).click()
      }
      await expect(page.getByText(`Decoded ${recordIndex + 1} of 3 records.`)).toBeVisible()
    }

    await expect(page.getByText('Decoded 3 of 3 records.')).toBeVisible()
    await expectNoSeriousAxeViolations(page)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)
  })

  test(`eIDAS trace completes both selected evidence scenarios at ${width}px`, async ({ page }) => {
    await seed(page)
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/learn/cc-eucc-certification?tab=workshop&path=eucc-eidas&step=0')
    await expect(page.getByRole('group', { name: 'Answer options' })).toBeVisible({
      timeout: 20_000,
    })
    await expectNoSeriousAxeViolations(page)

    for (const scenario of EIDAS_TRACE_SCENARIOS) {
      await page.getByRole('button', { name: scenario.title, exact: true }).click()
      for (const [index, layer] of scenario.layers.entries()) {
        const correct = layer.options.find((option) => option.correct)
        if (!correct) throw new Error(`Missing correct answer for ${scenario.id}/${layer.id}`)
        const answer = page
          .getByRole('group', { name: 'Answer options' })
          .getByRole('button', { name: correct.label, exact: true })
        if (index === 0) {
          await answer.focus()
          await page.keyboard.press('Space')
        } else {
          await answer.click()
        }
        await expect(answer).toHaveAttribute('aria-pressed', 'true')
        if (index < scenario.layers.length - 1) {
          await page.getByRole('button', { name: 'Next layer' }).click()
        }
      }
      await expect(
        page.getByText(`Layers traced: ${scenario.layers.length} of ${scenario.layers.length}`)
      ).toBeVisible()
    }

    await expectNoSeriousAxeViolations(page)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)
  })
}
