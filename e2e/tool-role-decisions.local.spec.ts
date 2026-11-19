// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

const cases = [
  ['playground', 'slh-dsa', /requires update-v2/, /fails under update-v2/],
  ['playground', 'lms-hss', /one unused leaf/, /One request consumed the last leaf/],
  [
    'playground',
    'hybrid-encrypt',
    /recovered post-quantum contribution is different/,
    /authenticated open should fail/,
  ],
  [
    'playground',
    'envelope-encrypt',
    /wrapping key while the data-encryption key/,
    /Re-wrap the existing data key/,
  ],
  ['playground', 'hybrid-sigs', /both-components policy/, /failed under the selected policy/],
  [
    'playground',
    'cacp-kmip',
    /service refuses to sign/,
    /Object visibility with signing still refused/,
  ],
  [
    'playground',
    'pqc-ssh-sim',
    /does not match the trusted key/,
    /until the server identity is verified/,
  ],
  [
    'playground',
    'qrng-demo',
    /reproducible characterization/,
    /collection method and health-test evidence/,
  ],
  [
    'playground',
    'pki-workshop',
    /gateway\.example\.test/,
    /requester’s authorization for the name/,
  ],
  [
    'playground',
    'bitcoin-flow',
    /accepts that spending condition/,
    /under that network’s consensus rules/,
  ],
  [
    'playground',
    'solana-flow',
    /program still rejects/,
    /separate authorization or execution check failed/,
  ],
  [
    'playground',
    'hd-wallet',
    /different first receiving addresses/,
    /scheme, account path and address index/,
  ],
  [
    'playground',
    'openssl-studio',
    /uses a different provider configuration/,
    /altered-message rejection/,
  ],
  [
    'business',
    'board-pitch',
    /one limited experimental rollout/,
    /two-gateway pilot with a spending limit/,
  ],
  [
    'business',
    'breach-simulator',
    /must stay secret for eight years/,
    /eleven-year confidentiality and migration window/,
  ],
  ['business', 'crqc-scenario', /published customer delivery date/, /modeled exposure window/],
  [
    'business',
    'risk-register',
    /assigns an owner and review date/,
    /stated risk score stays the same/,
  ],
  ['business', 'risk-treatment-plan', /chooses Mitigate/, /until test and rollout evidence exist/],
  [
    'business',
    'compliance-checklist',
    /affected service or jurisdiction/,
    /request scoped evidence/,
  ],
  [
    'business',
    'compliance-timeline',
    /before the chosen reference year/,
    /delivery evidence still required/,
  ],
  ['business', 'policy-generator', /classical-only peer to connect/, /pilot did not enforce it/],
  ['business', 'contract-clause', /different firmware version/, /for the delivered firmware/],
  [
    'business',
    'supply-chain-matrix',
    /replaces the cryptography library/,
    /new build’s dependency inventory/,
  ],
  [
    'business',
    'crypto-architecture-diagram',
    /moves TLS termination/,
    /Both connections and their independently negotiated/,
  ],
  [
    'business',
    'crypto-cbom-builder',
    /signed inventory correctly lists/,
    /handshake result tied to the matching build/,
  ],
  ['business', 'skills-team-plan', /extra half-time coordinator/, /Delivery stays at four FTE/],
] as const

for (const [family, toolId, prompt, correct] of cases) {
  for (const width of [1280, 390]) {
    test(`${family}/${toolId} gives feedback for a role decision at ${width}px`, async ({
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
      await page.goto(family === 'business' ? `/business/tools/${toolId}` : `/playground/${toolId}`)
      const exercise = page.getByTestId('tool-exercise')
      const scenario = exercise.getByRole('group', { name: prompt })
      const answers = scenario.getByRole('group', { name: 'Answers' })
      const right = answers.getByRole('button', { name: correct })
      const wrong = answers.getByRole('button').filter({ hasNotText: correct }).first()
      const feedback = scenario.getByRole('status')
      await expect(scenario).toBeVisible()
      const originalQuestion = exercise.locator('[role="group"][aria-labelledby]').first()
      if ((await exercise.locator('[role="group"][aria-labelledby]').count()) > 1) {
        await originalQuestion.getByRole('button').first().press('Space')
        await expect(originalQuestion.getByRole('status')).toBeVisible()
      }
      await expect(feedback).toHaveCount(0)
      await wrong.press('Space')
      await expect(feedback).toContainText('Not quite')
      await right.press('Space')
      await expect(feedback).toContainText('Right.')
      await expect(right).toHaveAttribute('aria-pressed', 'true')
      await expect(wrong).toHaveAttribute('aria-pressed', 'false')
    })
  }
}
