// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

// 18-7: with a finished ML-DSA + ML-KEM run (395 rows) the results table used to be squeezed
// to about 134 px at 1440 x 900, one row at a time. The table now keeps a floor height (the
// canvas scrolls instead) and the status / evidence chips stay in view while it does.
test.describe('ACVP workbench results table layout', () => {
  test.setTimeout(240000)

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem(
          'pqc-version-storage',
          JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
        )
      } catch {
        // ignore
      }
    })
  })

  for (const height of [900, 1200]) {
    test(`results table keeps a usable height at 1440 x ${height}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height })
      await page.goto('/playground/hsm?tab=build&dtab=acvp')
      await page.getByRole('tab', { name: 'Validation' }).click()
      await page.waitForFunction(
        () =>
          typeof (window as unknown as { __e2e_hsm_autoinit?: unknown }).__e2e_hsm_autoinit ===
          'function',
        undefined,
        { timeout: 30000 }
      )
      const ok = await page.evaluate(async () => {
        const fn = (
          window as unknown as { __e2e_hsm_autoinit?: (engine?: string) => Promise<boolean> }
        ).__e2e_hsm_autoinit
        return fn ? await fn('rust') : false
      })
      expect(ok, 'HSM autoInit failed').toBeTruthy()

      await page.getByTestId('acvp-select-none').click()
      await page.getByTestId('acvp-category-checkbox-ml_dsa').check()
      await page.getByTestId('acvp-category-checkbox-ml_kem').check()
      const run = page.getByTestId('acvp-run-selected')
      await run.click()
      await expect(run).toHaveAttribute('aria-busy', 'false', { timeout: 200000 })

      const scroller = page.getByTestId('acvp-results-scroller')
      await scroller.scrollIntoViewIfNeeded()
      const box = await scroller.evaluate((el) => ({
        client: el.clientHeight,
        scroll: el.scrollHeight,
      }))
      // eslint-disable-next-line no-console
      console.log(`1440x${height}: results table clientHeight ${box.client}px of ${box.scroll}px`)
      // 28rem floor = 448 px at the default font size; the old layout gave 134 px at 900.
      expect(box.client).toBeGreaterThanOrEqual(440)

      // At least three whole rows fit in the table's visible area.
      const fitting = await scroller.evaluate((el) => {
        const top = el.getBoundingClientRect().top
        const bottom = el.getBoundingClientRect().bottom
        return [...el.querySelectorAll('[data-testid="acvp-result-row"]')].filter((r) => {
          const b = r.getBoundingClientRect()
          return b.top >= top && b.bottom <= bottom
        }).length
      })
      expect(fitting).toBeGreaterThanOrEqual(3)

      // The chips stay inside the workbench's visible area after the canvas scrolls to its end.
      const chips = page.getByTestId('acvp-result-filters')
      await chips.evaluate((el) => {
        let p: HTMLElement | null = el.parentElement
        while (p && !/(auto|scroll)/.test(getComputedStyle(p).overflowY)) p = p.parentElement
        if (p) p.scrollTop = p.scrollHeight
      })
      const chipsTop = await chips.evaluate((el) => el.getBoundingClientRect().top)
      const shellTop = await page
        .getByTestId('acvp-suite-workbench')
        .evaluate((el) => el.getBoundingClientRect().top)
      const shellBottom = await page
        .getByTestId('acvp-suite-workbench')
        .evaluate((el) => el.getBoundingClientRect().bottom)
      // eslint-disable-next-line no-console
      console.log(`1440x${height}: chips top ${chipsTop}px, shell ${shellTop}-${shellBottom}px`)
      expect(chipsTop).toBeGreaterThanOrEqual(shellTop)
      expect(chipsTop).toBeLessThan(shellBottom)
    })
  }
})
