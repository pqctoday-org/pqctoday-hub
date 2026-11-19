// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { test, expect } from './fixtures/blockAnalytics'

const cohorts = [
  [
    'hybrid-crypto',
    /RFC 10024 hybrid key agreement/,
    'staging ingress A / client and server build 17',
    ['TLS-17-group', 'TLS-17-certverify', 'TLS-17-rejections'],
  ],
  [
    'dnssec-pqc',
    /ML-DSA-44 is registered as algorithm 18/,
    'lab signer A / resolver B rev 12',
    ['DNS-12-algorithm', 'DNS-12-rollover', 'DNS-12-transport'],
  ],
  [
    'pki-workshop',
    /Root, Intermediate, and Issuing CA/,
    'isolated CA v3 / validation profile A',
    ['PKI-3-chain', 'PKI-3-OCSP', 'PKI-3-renewal'],
  ],
  [
    'stateful-signatures',
    /non-rewindable one-time signature/,
    'lab token / firmware 8 / test key 2',
    ['LMS-8-counter', 'LMS-8-exhaustion', 'LMS-8-backup-policy'],
  ],
  [
    'kms-pqc',
    /Envelope encryption/,
    'staging KMS / policy rev 8',
    ['KMS-8-envelope', 'KMS-8-rotation', 'KMS-8-audit'],
  ],
  [
    'crypto-product-certification',
    /Traceable mapping between product versions/,
    'sample module / firmware 7.2 / approved mode',
    ['CERT-72-register', 'CERT-72-boundary', 'CERT-72-status'],
  ],
  [
    'pqc-testing-validation',
    /Automated known-answer tests/,
    'release candidate 12 / build profile 4',
    ['QA-12-vectors', 'QA-12-wire-size', 'QA-12-peer-matrix'],
  ],
  [
    'platform-eng-pqc',
    /Service mesh mTLS/,
    'staging mesh build 42 / namespace sample',
    ['MESH-42-peer', 'MESH-42-identity', 'MESH-42-SBOM'],
  ],
] as const

test.beforeEach(async ({ page }) => {
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

for (const [moduleId, firstRequirement, testedScope, evidenceIds] of cohorts) {
  for (const width of [1280, 390]) {
    test(`${moduleId} keeps worksheet evidence tied to the tested scope at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      const workshop = moduleId === 'hybrid-crypto' ? '?tab=workshop&step=5&sv=2' : ''
      await page.goto(`/learn/${moduleId}${workshop}`)

      if (moduleId === 'hybrid-crypto') {
        const exercise = page.getByRole('region', { name: 'Certificate-to-TLS exercise' })
        await exercise.getByRole('button', { name: 'Run certificate-to-TLS exercise' }).click()
        await expect(exercise.getByRole('row', { name: /Classical baseline/ })).toContainText(
          'rsa_pss_rsae_sha256',
          { timeout: 35_000 }
        )
        await expect(
          exercise.getByRole('row', { name: /Hybrid exchange \+ PQ authentication/ })
        ).toContainText('mldsa65')
      }

      const checklist = page.getByTestId('production-capability-checklist')
      const worksheet = checklist.locator('details')
      const openWorksheet = async () => {
        await checklist.locator('summary').first().click()
        await worksheet.getByText('Record evidence for your environment', { exact: true }).click()
      }
      await openWorksheet()
      if (moduleId === 'hybrid-crypto') {
        await expect(
          checklist.getByRole('link', { name: 'RFC 10073', exact: true })
        ).toHaveAttribute('href', 'https://www.rfc-editor.org/rfc/rfc10073.html')
      }
      const result = worksheet.getByRole('status')
      const scope = worksheet.getByRole('textbox', { name: 'Environment and build' })
      const observations = worksheet.getByRole('combobox', { name: 'Observation' })
      const references = worksheet.getByRole('textbox', { name: 'Evidence reference' })
      const first = worksheet.getByRole('group', { name: firstRequirement })
      await expect(first.getByRole('combobox')).toBeDisabled()
      await scope.fill(testedScope)
      await first.getByRole('combobox').selectOption('fail')
      await expect(result).toHaveText(/^Evidence missing/)
      await first.getByRole('textbox').fill('SAMPLE-REJECTION-RETEST-REQUIRED')
      await expect(result).toHaveText(/^A requirement failed/)

      for (const [index, evidence] of evidenceIds.entries()) {
        await observations.nth(index).selectOption('pass')
        await expect(references.nth(index)).toHaveValue('')
        await references.nth(index).fill(evidence)
      }
      await expect(result).toHaveText(/^Ready for review\. 3 of 3/)

      const download = async () => {
        const pending = page.waitForEvent('download')
        await worksheet.getByRole('button', { name: 'Download evidence worksheet' }).click()
        const file = await pending
        expect(file.suggestedFilename()).toBe(`production-evidence-${moduleId}.md`)
        return text(await file.createReadStream())
      }

      await page.reload()
      await openWorksheet()
      await expect(scope).toHaveValue(testedScope)
      await expect(result).toHaveText(/^Ready for review\. 3 of 3/)
      const report = await download()
      expect(report).toContain(`Workshop: ${moduleId}`)
      expect(report).toContain(`Environment and build: ${testedScope}`)
      expect(report).toContain('Learner-recorded observations')
      expect(report).toContain('Review status: Ready for review')
      for (const evidence of evidenceIds) expect(report).toContain(`Observed pass: ${evidence}`)
      expect(report).not.toContain('SAMPLE-REJECTION-RETEST-REQUIRED')

      await scope.fill(`${testedScope} changed`)
      await expect(result).toHaveText(/^Evidence missing\. 0 of 3/)
      await expect(first.getByRole('combobox')).toHaveValue('')
      await expect(first.getByText(/Prior observation applies to/)).toBeVisible()
      const changed = await download()
      expect(changed).toContain('Review status: Evidence missing')
      for (const evidence of evidenceIds) expect(changed).not.toContain(evidence)
      await scope.fill(testedScope)
      await expect(result).toHaveText(/^Ready for review\. 3 of 3/)
    })
  }
}

test('Reset on the first workshop step clears its existing practice answer', async ({ page }) => {
  await page.goto('/learn/skills-team-structure?tab=workshop&step=0')
  const exercise = page.getByTestId('step-exercise')
  await exercise.getByRole('button', { name: /6.5 allocated FTE/ }).click()
  await expect(exercise.getByRole('status')).toHaveText(/^Right\./)
  await exercise.getByRole('button', { name: 'Apply it to another case' }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(exercise.getByText(/Set 2,000 instances/)).toBeVisible()
  await expect(exercise.getByRole('status')).toHaveCount(0)
  await expect(exercise.getByRole('button', { name: 'Apply it to another case' })).toHaveCount(0)
})
