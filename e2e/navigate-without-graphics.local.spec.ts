// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`Navigate preserves record discovery without graphics at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
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
      Object.defineProperty(Navigator.prototype, 'gpu', { configurable: true, value: undefined })
      const getContext = HTMLCanvasElement.prototype.getContext
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        configurable: true,
        value(this: HTMLCanvasElement, type: string, ...options: unknown[]) {
          if (/^(webgl2?|experimental-webgl|webgpu)$/.test(type)) return null
          return Reflect.apply(getContext, this, [type, ...options])
        },
      })
    })
    await page.goto('/navigate?node=std-fips-203')
    const list = page.getByRole('region', { name: 'Graph list view' })
    const details = list.getByRole('complementary')
    const title = details.getByRole('heading', { level: 2 })
    const search = list.getByRole('combobox', { name: 'Find a record in the graph' })
    const library = details.getByRole('link', { name: 'Open in hub' })

    await expect(list.getByText(/3D graphics are unavailable/)).toBeVisible()
    await expect(library).toHaveAttribute('href', '/library?ref=FIPS%20203')
    await expect(title).toBeFocused()
    await expect(page).toHaveURL(/node=std-fips-203$/)
    await page.reload()
    await expect(library).toHaveAttribute('href', '/library?ref=FIPS%20203')
    await expect(page).toHaveURL(/node=std-fips-203$/)

    const mechanism = details.getByRole('button', { name: 'ML-KEM-768', exact: true })
    await mechanism.click()
    await expect(title).toHaveText('ML-KEM-768')
    await expect(title).toBeFocused()
    await expect(page).toHaveURL(/node=mech-ml-kem-768$/)

    await page.keyboard.press('Escape')
    await expect(details).toBeHidden()
    await expect(search).toBeFocused()
    await expect(page).toHaveURL(/\/navigate$/)
    await search.fill('xx-unlisted-graphql-example')
    await expect(list.getByText('No record matches.')).toBeVisible()
    await search.fill('ML-KEM-768')
    await expect(list.getByRole('option', { name: /ML-KEM-768/ }).first()).toBeVisible()
    await search.press('Enter')
    await expect(title).toHaveText('ML-KEM-768')
    await details.getByRole('button', { name: 'Close details' }).click()
    await expect(search).toBeFocused()
  })
}
