// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

const cases = [
  ['dnssec-pqc', 1, /truncated UDP response/, /UDP required a transport retry/],
  [
    'entropy-randomness',
    4,
    /second device picked up the same measurement/,
    /do not justify adding/,
  ],
  [
    'government-defense-pqc',
    0,
    /fictional acceptance policy specifies/,
    /demonstrating the required ML-KEM-1024 profile/,
  ],
  [
    'emv-payment-pqc',
    3,
    /merchant pilot uses an EMV Payment Token/,
    /negotiated transport key exchange/,
  ],
  ['iam-pqc', 1, /the token names the payments API/i, /reports API is outside its audience/],
  [
    'dev-quantum-impact',
    2,
    /a developer upgrades a crypto library/i,
    /classical-only peer test that the application rejects/,
  ],
  [
    'cc-eucc-certification',
    0,
    /vendor quotes a Common Criteria certificate/,
    /evaluated version and configuration/,
  ],
  ['media-drm-pqc', 2, /signed provenance record/, /binding to the bytes of the displayed asset/],
  [
    'pqc-candidates',
    0,
    /cites selection in a research round/,
    /published specification and evidence/,
  ],
  [
    'standards-bodies',
    3,
    /requires both an algorithm standard/,
    /Cryptographic Module Validation Program’s record/,
  ],
  [
    'sbom',
    0,
    /two versions of the same cryptography package/,
    /dependency reference to the exact component/,
  ],
  [
    'vpn-ssh-pqc',
    1,
    /fingerprint differs from the trusted inventory/,
    /until the host key is verified/,
  ],
  ['stateful-signatures', 2, /it has used leaf 19/, /Block signing on the stale state/],
  ['qkd', 1, /authenticate their classical post-processing channel/, /came from the intended peer/],
  [
    'trust-services-pqc',
    0,
    /a time-stamp token over a signed sample file/i,
    /only for the original digest/,
  ],
  [
    'research-quantum-impact',
    2,
    /accelerator run on a different host/,
    /parameter set, workload, timing boundary/,
  ],
  ['pqc-hw-acceleration', 4, /7 ms of transfer and queue time/, /9 ms on the accelerator path/],
  ['pqc-grc', 1, /different gateway now needs/, /separate scope decision for the second gateway/],
  [
    'talking-about-pqc',
    0,
    /a slide calls a gateway quantum-safe/i,
    /hybrid key exchange and classical RSA-PSS authentication/,
  ],
] as const

for (const [moduleId, step, scenario, correct] of cases) {
  for (const width of [1280, 390]) {
    test(`${moduleId} explains a changed deployment decision at ${width}px`, async ({ page }) => {
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
      await page.goto(`/learn/${moduleId}?tab=workshop&step=${step}`)
      if (moduleId === 'dnssec-pqc') {
        await injectAxe(page)
        const violations = await getViolations(page, 'main', {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        })
        expect(violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual(
          []
        )
      }
      const exercise = page.getByTestId('step-exercise')
      const choices = exercise.getByRole('group', { name: 'Answers' })
      const feedback = exercise.getByRole('status')
      await expect(exercise).toBeVisible()
      const prompt = exercise.getByText(scenario)
      const hasFirstQuestion = !(await prompt.isVisible())
      if (hasFirstQuestion) {
        await choices.getByRole('button').first().press('Space')
        await exercise.getByRole('button', { name: 'Apply it to another case' }).click()
      }
      await expect(prompt).toBeVisible()
      await expect(feedback).toHaveCount(0)
      await choices.getByRole('button').filter({ hasNotText: correct }).first().press('Space')
      await expect(feedback).toHaveText(/^Not quite/)
      const decision = choices.getByRole('button', { name: correct })
      await decision.press('Space')
      await expect(feedback).toHaveText(/^Right\./)
      await expect(decision).toHaveAttribute('aria-pressed', 'true')
      if (moduleId === 'dnssec-pqc') {
        await expect(
          feedback.getByRole('link', { name: 'RFC 4035 DNSSEC validation' })
        ).toHaveAttribute('href', 'https://www.rfc-editor.org/rfc/rfc4035.html#section-5')
      }
      await page.reload()
      if (hasFirstQuestion) {
        await exercise.getByRole('button', { name: 'Apply it to another case' }).click()
      }
      await expect(decision).toHaveAttribute('aria-pressed', 'true')
      await expect(feedback).toHaveText(/^Right\./)
      await exercise.getByRole('button', { name: 'Clear practice answers' }).press('Space')
      await expect(feedback).toHaveCount(0)
      await expect(exercise.locator('p[aria-live="polite"]')).toBeFocused()
      await page.reload()
      await expect(feedback).toHaveCount(0)
    })
  }
}
