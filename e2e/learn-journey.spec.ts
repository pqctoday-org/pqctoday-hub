// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect, type Page } from '@playwright/test'
import { injectAxe, getViolations } from 'axe-playwright'

/**
 * Learn › Your journey: objectives, steps, role map, role switch and the module page that knows
 * them. Runs on a wide screen and on a 390 px phone. Everything the journey keeps is on the device.
 */

const seed = async (page: Page, persona: string | null, level: string | null = 'basics') => {
  await page.addInitScript(
    ([p, lv]) => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
      if (p) {
        localStorage.setItem(
          'pqc-learning-persona',
          JSON.stringify({
            state: {
              selectedPersona: p,
              hasAcknowledgedExecutiveGrcSplit: true,
              selectedRegion: 'global',
              experienceLevel: lv,
              viewAccess: 'unlocked',
              hasSeenPersonaPicker: true,
              suppressSuggestion: true,
              niceTier: 'practitioner',
              niceTierOverridden: false,
              curiousGuideDismissed: true,
            },
            version: 7,
          })
        )
      }
    },
    [persona, level]
  )
}

const GOAL = 'Review our TLS migration design'

async function createObjective(page: Page) {
  await page.goto('/learn?mode=journey&new=1')
  await page.getByLabel('What do you want to be able to do?').fill(GOAL)
  await page.getByRole('button', { name: 'Preview' }).click()
  await expect(page.getByText('Preview · nothing is saved yet')).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Create objective' }).click()
  await expect(page.getByTestId('objective-workspace')).toBeVisible()
}

for (const [name, viewport] of [
  ['wide screen', { width: 1280, height: 800 }],
  ['390 px phone', { width: 390, height: 844 }],
] as const) {
  test.describe(`Your journey on a ${name}`, () => {
    test.use({ viewport })

    test('a first visit opens All modules with the "Want a path?" prompt', async ({ page }) => {
      await seed(page, null)
      await page.goto('/learn')
      await expect(page.getByTestId('first-visit-prompt')).toBeVisible({ timeout: 30_000 })
      await expect(
        page.getByText('Want a path? Tell us what you want to be able to do')
      ).toBeVisible()
    })

    test('a learner with a role opens on Your journey and sees "Start here"', async ({ page }) => {
      await seed(page, 'architect')
      await page.goto('/learn')
      await expect(page.getByTestId('your-journey')).toBeVisible({ timeout: 30_000 })
      await expect(page.getByTestId('no-objective')).toContainText('Security Architect')
      await expect(page.getByRole('link', { name: /^Start here:/ })).toBeVisible()
    })

    test('a preview saves nothing; Create saves exactly what it showed; a reload keeps it', async ({
      page,
    }) => {
      await seed(page, 'architect')
      await page.goto('/learn?mode=journey&new=1')
      const box = page.getByLabel('What do you want to be able to do?')
      await box.fill('quantum')
      await page.getByRole('button', { name: 'Preview' }).click()
      await expect(page.getByText('One question first.')).toBeVisible({ timeout: 30_000 })
      await box.fill('xyzzy plugh frobnicate')
      await page.getByRole('button', { name: 'Preview' }).click()
      await expect(page.getByText('Preview · coverage gap')).toBeVisible()
      await box.fill(GOAL)
      await page.getByRole('button', { name: 'Preview' }).click()
      await expect(page.getByText('Preview · nothing is saved yet')).toBeVisible()
      expect(await page.evaluate(() => localStorage.getItem('pqc-journey'))).toBeNull()
      await page.getByRole('button', { name: 'Create objective' }).click()
      await expect(page.getByTestId('objective-workspace')).toBeVisible()
      const stored = await page.evaluate(() => localStorage.getItem('pqc-journey'))
      expect(stored).not.toBeNull()
      await page.reload()
      await expect(page.getByTestId('objective-workspace')).toBeVisible({ timeout: 30_000 })
      await expect(page.getByTestId('now-box')).toContainText('Now · step 1 of')
    })

    test('the module page shows the step bar; Next stays off until the step is marked complete', async ({
      page,
    }) => {
      await seed(page, 'architect')
      await createObjective(page)
      await page
        .getByTestId('now-box')
        .getByRole('button', { name: /^Open / })
        .click()
      const bar = page.getByTestId('journey-step-bar')
      await expect(bar).toBeVisible({ timeout: 30_000 })
      await expect(page.getByTestId('module-fit-strip')).toHaveCount(1)
      await expect(bar.getByRole('button', { name: /^Next/ })).toBeDisabled()
      await expect(page.getByTestId('journey-next-hint')).toContainText(
        'Mark this step complete to unlock Next.'
      )
      await bar.getByRole('button', { name: 'Mark complete' }).click()
      await expect(bar.getByRole('button', { name: /^Next/ })).toBeEnabled()
    })

    test('"Before you complete" is blocked until the module steps are done', async ({ page }) => {
      await seed(page, 'architect')
      await createObjective(page)
      await page
        .getByRole('button', { name: /Complete…/ })
        .first()
        .click()
      const panel = page.getByTestId('complete-panel')
      await expect(panel).toBeVisible()
      await expect(panel).toContainText(
        'The module steps are not complete yet, so this objective cannot be completed.'
      )
      await expect(panel.getByRole('button', { name: 'Mark objective complete' })).toBeDisabled()
    })

    test('the role map lists the computed path and links to the stage and area filters', async ({
      page,
    }) => {
      await seed(page, 'architect')
      await page.goto('/learn?mode=journey&jview=role-map')
      await expect(page.getByTestId('role-map')).toBeVisible({ timeout: 30_000 })
      expect(await page.getByTestId('role-map-row').count()).toBe(10)
      await expect(page.locator('a[href^="/learn?stage="]').first()).toBeVisible()
      await expect(page.locator('a[href^="/learn?area="]').first()).toBeVisible()
    })

    test('switching role shows what changes, and Undo restores the earlier role', async ({
      page,
    }) => {
      await seed(page, 'architect')
      await page.goto('/learn?mode=journey&jview=role-map')
      await page.getByTestId('role-map').getByRole('button', { name: 'Change role' }).click()
      await page.getByRole('radio', { name: /Executive/ }).check()
      await expect(page.getByTestId('role-switch-preview')).toContainText(
        'Default level: Awareness level'
      )
      await page.getByRole('button', { name: /^Switch to / }).click()
      await expect(page.getByTestId('role-switch-notice')).toContainText('Now viewing as Executive')
      await page.getByRole('button', { name: 'Undo' }).click()
      const persona = await page.evaluate(
        () => JSON.parse(localStorage.getItem('pqc-learning-persona')!).state.selectedPersona
      )
      expect(persona).toBe('architect')
    })

    test('a module outside the role path shows the other-role lens, and nothing is hidden', async ({
      page,
    }) => {
      await seed(page, 'architect')
      await page.goto('/learn/exec-quantum-impact')
      await expect(page.getByTestId('other-role-lens')).toContainText(
        'Outside the Security Architect path',
        { timeout: 30_000 }
      )
      await expect(page.getByTestId('other-role-lens')).toContainText('Nothing is hidden.')
    })

    test('no serious or critical accessibility violations on Your journey, the role map and the module page', async ({
      page,
    }) => {
      await seed(page, 'architect')
      await createObjective(page)
      const check = async (where: string) => {
        await injectAxe(page)
        const violations = await getViolations(page, undefined, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        })
        const serious = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
        expect(
          serious.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html.slice(0, 140)) })),
          `serious or critical axe violations on ${where}`
        ).toEqual([])
      }
      await check('Your journey › Objectives')
      await page.getByRole('tab', { name: 'Role map' }).click()
      await expect(page.getByTestId('role-map')).toBeVisible()
      await check('Your journey › Role map')
      await page.goto('/learn?mode=journey')
      await page
        .getByTestId('now-box')
        .getByRole('button', { name: /^Open / })
        .click()
      await expect(page.getByTestId('journey-step-bar')).toBeVisible({ timeout: 30_000 })
      await check('a module page with the step bar')
    })

    test('the journey stays inside the screen', async ({ page }) => {
      await seed(page, 'architect')
      await createObjective(page)
      const w = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }))
      expect(w.scrollWidth).toBeLessThanOrEqual(w.innerWidth)
    })
  })
}

test.describe('what stays on the device', () => {
  test('the journey is written under its own key and sends no request to Google Drive', async ({
    page,
  }) => {
    const drive: string[] = []
    page.on('request', (r) => {
      if (/googleapis\.com\/(upload\/)?drive/.test(r.url())) drive.push(r.url())
    })
    await seed(page, 'architect')
    await createObjective(page)
    const keys = await page.evaluate(() => Object.keys(localStorage))
    expect(keys).toContain('pqc-journey')
    expect(drive).toEqual([])
  })
})
