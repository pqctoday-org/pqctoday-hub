// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`published TLS share sizes drive the correct buffer decision at ${width}px`, async ({
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
    await page.goto('/learn/tls-basics?tab=learn')
    const exercise = page.getByRole('region', { name: 'Check the TLS key-share field capacity' })
    const status = exercise.getByRole('status', { name: 'TLS share capacity result' })
    const selector = exercise.getByRole('combobox', { name: 'Hybrid group' })
    const client = exercise.getByRole('spinbutton', { name: 'Client share capacity (bytes)' })
    const server = exercise.getByRole('spinbutton', { name: 'Server share capacity (bytes)' })
    await expect(status).toContainText('Both field sizes fit')
    await expect(exercise.getByText('1,216 bytes', { exact: true })).toBeVisible()
    await expect(exercise.getByText('1,120 bytes', { exact: true })).toBeVisible()
    await expect(exercise.getByText('64 bytes', { exact: true })).toBeVisible()

    await selector.selectOption('SecP256r1MLKEM768')
    await expect(status).toHaveText('The server share exceeds the selected capacity.')
    await expect(exercise.getByText('1,249 bytes', { exact: true })).toBeVisible()
    await expect(exercise.getByText('1,153 bytes', { exact: true })).toBeVisible()
    await server.fill('1153')
    await expect(status).toContainText('Both field sizes fit')

    await selector.selectOption('SecP384r1MLKEM1024')
    await expect(status).toHaveText('The client and server shares exceed the selected capacity.')
    await expect(exercise.getByText('1,665 bytes', { exact: true })).toHaveCount(2)
    await expect(exercise.getByText('80 bytes', { exact: true })).toBeVisible()
    await server.fill('')
    await expect(status).toHaveText('Enter whole capacities from 0 to 65,535 bytes.')
    await server.fill('1665')
    await client.fill('1664')
    await expect(status).toHaveText('The client share exceeds the selected capacity.')
    await client.fill('1665')
    await expect(status).toContainText('Both field sizes fit')
  })
}
