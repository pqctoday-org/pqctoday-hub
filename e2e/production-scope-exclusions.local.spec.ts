// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

const cases = [
  [
    'data-asset-sensitivity',
    /vulnerable key-transport envelopes/,
    'ASSET-8 covers signing-only verifier configuration',
    'NIST security life of data',
  ],
  [
    'aerospace-pqc',
    /mission using CCSDS SDLS/,
    'MISSION-8 defines an exclusively ground-based package verifier',
    'CCSDS 355.0-B-2',
  ],
  [
    'media-drm-pqc',
    /DRM license service/,
    'MEDIA-8 covers content signing without a license service',
    'C2PA 2.4 Content Credentials',
  ],
  [
    'trust-services-pqc',
    /significant-change notification/,
    'TRUST-8 identifies a non-qualified private test trust service',
    'Commission Implementing Regulation (EU) 2025/2530',
  ],
  [
    'government-defense-pqc',
    /For an NSS profile under CNSA 2.0/,
    'SCOPE-8 identifies a civilian system rather than an NSS',
    'NSA CNSA 2.0 FAQ v2.2',
  ],
  [
    'automotive-pqc',
    /In an Uptane rollout/,
    'ECU-8 covers a boot verifier bench with no Uptane distribution',
    'Uptane Standard 2.1.0',
  ],
] as const

for (const [moduleId, requirement, reason, source] of cases) {
  for (const width of [1280, 390]) {
    test(`${moduleId} keeps a proposed exclusion reviewable and build-specific at ${width}px`, async ({
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
      await page.goto(`/learn/${moduleId}`)
      const checklist = page.getByTestId('production-capability-checklist')
      const worksheet = checklist.locator('#production-evidence-worksheet')
      const open = async () => {
        await checklist.locator('summary').first().click()
        await worksheet.getByText('Record evidence for your environment').click()
      }
      await open()
      const scope = worksheet.getByRole('textbox', { name: 'Environment and build' })
      const target = worksheet.getByRole('group', { name: requirement })
      const result = worksheet.getByRole('status')
      const decision = target.getByRole('combobox', { name: 'Observation' })

      await scope.fill('Fictional baseline build 8')
      for (const row of await worksheet.getByRole('group').all()) {
        await row.getByRole('combobox').selectOption('pass')
        await row.getByRole('textbox', { name: 'Evidence reference' }).fill('SAMPLE-8-RECEIPT')
      }
      await expect(result).toContainText('Ready for review.')
      await decision.selectOption('excluded')
      await expect(result).toContainText('Evidence missing.')
      const rationale = target.getByRole('textbox', { name: 'Scope rationale and reference' })
      await rationale.fill(reason)
      await expect(result).toContainText('Scope exclusions require review.')

      await scope.fill('Fictional candidate build 9')
      await expect(decision).toHaveValue('')
      await expect(
        target.getByText(/Prior observation applies to Fictional baseline build 8/)
      ).toBeVisible()
      await decision.selectOption('fail')
      await target.getByRole('textbox', { name: 'Evidence reference' }).fill('SAMPLE-9-MISMATCH')
      await expect(result).toContainText('A requirement failed.')
      const comparison = worksheet.getByRole('region', { name: 'Compare builds' })
      await comparison.getByRole('combobox').selectOption('Fictional baseline build 8')
      await expect(
        comparison.getByText(`Baseline — Proposed scope exclusion: ${reason}`)
      ).toBeVisible()
      await expect(
        comparison.getByText('Current — Observed failure: SAMPLE-9-MISMATCH')
      ).toBeVisible()

      await page.reload()
      await open()
      await expect(scope).toHaveValue('Fictional candidate build 9')
      await expect(comparison).toContainText(reason)
      const [file] = await Promise.all([
        page.waitForEvent('download'),
        worksheet.getByRole('button', { name: 'Download evidence worksheet' }).click(),
      ])
      const report = await text(await file.createReadStream())
      expect(report).toContain(source)
      expect(report).toContain('Baseline review status: Scope exclusions require review')
      expect(report).toContain(`Baseline — Proposed scope exclusion: ${reason}`)
      expect(report).toContain('Current — Observed failure: SAMPLE-9-MISMATCH')
      await comparison.getByRole('button', { name: 'Open baseline as current build' }).click()
      await expect(scope).toBeFocused()
      await expect(rationale).toHaveValue(reason)
      await expect(result).toContainText('Scope exclusions require review.')
    })
  }
}
