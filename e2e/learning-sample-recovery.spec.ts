// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { test, expect } from './fixtures/blockAnalytics'

test.beforeEach(async ({ page }) => {
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
})

for (const width of [1280, 390]) {
  test.describe(`sample recovery at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } })

    test('signature control, mutation and restoration execute in the workshop', async ({
      page,
    }) => {
      await page.goto('/learn/crypto-agility?tab=workshop&step=0')
      const sample = page
        .locator('section')
        .filter({ has: page.getByRole('heading', { name: 'Predict a one-byte change' }) })
        .last()
      await sample.getByRole('button', { name: 'Run valid → mutate → restore sample' }).click()
      const status = sample.getByRole('status')
      await expect(status).toContainText('original control true')
      await expect(status).toContainText(
        'Altered signature accepted: false. Restored original: true.'
      )
    })

    test('secret-envelope recovery and rejection results match the downloadable object', async ({
      page,
    }) => {
      await page.goto('/learn/secrets-management-pqc?tab=workshop&step=1')
      const sample = page
        .locator('section')
        .filter({ has: page.getByRole('heading', { name: 'Run a real PQC secret envelope' }) })
        .last()
      await sample.getByRole('button', { name: 'Encrypt, recover, tamper and restore' }).click()
      const status = sample.getByRole('status')
      await expect(status).toContainText('Original recovered: true.')
      await expect(status).toContainText('authenticated decryption: true.')
      await expect(status).toContainText(
        'Changed data/tag rejected: true. Original restored: true.'
      )
      const downloadPromise = page.waitForEvent('download')
      await sample.getByRole('button', { name: 'Download sample envelope' }).click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toBe('fictional-envelope.json')
      const raw = await text(await download.createReadStream())
      const envelope = JSON.parse(raw)
      expect(envelope).toMatchObject({
        version: 1,
        kem: 'ML-KEM-768',
        kdf: 'HKDF-SHA256',
        aead: 'AES-256-GCM',
      })
      expect(envelope.kemCiphertextHex).toHaveLength(2176)
      expect(envelope.nonceHex).toHaveLength(24)
      expect(envelope.saltHex).toHaveLength(64)
      expect(raw).not.toContain('Fictional portal token')
      expect(Object.keys(envelope)).not.toContain('secretKey')
      expect(Object.keys(envelope)).not.toContain('privateKey')
    })

    test('policy input errors recover and changed applicability changes the decision', async ({
      page,
    }) => {
      await page.goto('/business/tools/policy-generator')
      const sample = page.locator('details').filter({
        has: page.getByText('Practice: policy scope, algorithm use and retention risk', {
          exact: true,
        }),
      })
      await sample.locator('summary').click()
      await sample.getByLabel('Migration completion year').fill('')
      await sample.getByRole('button', { name: 'Evaluate the fictional scenario' }).click()
      await expect(sample.getByRole('alert')).toContainText('whole completion year')
      await sample.getByLabel('Migration completion year').fill('2030')
      await sample.getByRole('button', { name: 'Sample algorithm', exact: true }).click()
      await page.getByRole('option', { name: 'ML-KEM-768', exact: true }).click()
      await sample.getByLabel('Long-lived data:', { exact: false }).uncheck()
      await sample.getByRole('button', { name: 'Evaluate the fictional scenario' }).click()
      await expect(sample.getByRole('status', { name: 'Policy scenario result' })).toContainText(
        'No contradiction under these sample inputs.'
      )
      await sample.getByLabel('Long-lived data:', { exact: false }).check()
      await sample.getByLabel('The fictional portal policy applies').uncheck()
      await sample.getByRole('button', { name: 'Evaluate the fictional scenario' }).click()
      await expect(sample.getByRole('status', { name: 'Policy scenario result' })).toContainText(
        'out-of-scope'
      )
      await expect(sample.getByRole('status', { name: 'Policy scenario result' })).toContainText(
        'scenario-risk'
      )
    })

    test('audit scope identifies a mismatched record and accepts the matching sample', async ({
      page,
    }) => {
      await page.goto('/business/tools/audit-checklist')
      const sample = page.getByRole('region', {
        name: 'Practice: does the record cover the sample system?',
      })
      await sample.getByRole('button', { name: 'Check sample scope' }).click()
      await expect(sample.getByRole('status')).toContainText('Scope is unsupported')
      await sample.getByRole('radio').first().check()
      await sample.getByRole('button', { name: 'Check sample scope' }).click()
      await expect(sample.getByRole('status')).toContainText('scope correspondence')
      await expect(sample.getByRole('status')).toContainText('fictional fields')
    })

    test('Security Target interpretation corrects an overclaim and resets between cases', async ({
      page,
    }) => {
      await page.goto('/learn/cc-eucc-certification?tab=workshop&step=0')
      const sample = page
        .locator('details')
        .filter({ has: page.getByText('Read the exact Security Target scope', { exact: true }) })
      await sample.locator('summary').click()
      await sample.getByLabel('Supported', { exact: true }).check()
      await sample.getByRole('button', { name: 'Check interpretation' }).click()
      await expect(sample.getByRole('status')).toContainText('Review the scope.')
      await sample.getByLabel('Contradicted by the stated scope').check()
      await sample.getByRole('button', { name: 'Check interpretation' }).click()
      await expect(sample.getByRole('status')).toContainText('Correct.')
      await sample.getByRole('button', { name: 'Example 2' }).click()
      await expect(sample.getByRole('button', { name: 'Check interpretation' })).toBeDisabled()
      await sample.getByLabel('Supported', { exact: true }).check()
      await sample.getByRole('button', { name: 'Check interpretation' }).click()
      await expect(sample.getByRole('status')).toContainText('verification operation')
    })
  })
}

for (const width of [1280, 390]) {
  test(`DNS transport retry, signature corruption and recovery at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 })
    await page.goto('/learn/dnssec-pqc?tab=workshop&step=1')
    const sample = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Validate a signed MX answer' }) })
      .last()
    const udp = sample.getByRole('button', { name: 'Query over UDP' })
    const tcp = sample.getByRole('button', { name: 'Retry over TCP' })
    const status = sample.getByRole('status')
    await udp.click()
    await expect(status).toContainText('TC=1')
    await tcp.click()
    await expect(status).toContainText('AD=1')
    await sample.getByRole('checkbox').check()
    await udp.click()
    await expect(status).toContainText('TC=1')
    await tcp.click()
    await expect(status).toContainText('SERVFAIL')
    await sample.getByRole('radio', { name: '4096 bytes' }).check()
    await sample.getByRole('checkbox').uncheck()
    await udp.click()
    await expect(status).toContainText('AD=1')
  })
  test(`TPM update authorization and host signing are distinguished at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 })
    await page.goto('/learn/cc-eucc-certification?tab=workshop&step=0')
    const sample = page
      .locator('details')
      .filter({ has: page.getByText('Read the exact Security Target scope', { exact: true }) })
    await sample.locator('summary').click()
    await sample.getByRole('button', { name: 'Example 12' }).click()
    await expect(sample).toContainText('15.25.19744.00')
    await sample.getByLabel('Not established by the reviewed evidence').check()
    await sample.getByRole('button', { name: 'Check interpretation' }).click()
    await expect(sample.getByRole('status')).toContainText('Review the scope.')
    await sample.getByLabel('Supported', { exact: true }).check()
    await sample.getByRole('button', { name: 'Check interpretation' }).click()
    await expect(sample.getByRole('status')).toContainText('TPM2_Sign needs separate evidence')
  })
}
