// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

const cases = [
  ['quantum-threats', 4, /offline verifier/, /date the verifier stopped accepting/],
  ['exec-quantum-impact', 2, /sample customer archive/, /confidentiality lifetime/],
  ['arch-quantum-impact', 2, /an architecture decision/i, /Key agreement met the requirement/],
  ['ops-quantum-impact', 2, /peer supporting only X25519/, /legacy-peer test failed/],
  ['migration-program', 2, /12 of 20/, /^50%,/],
  ['vendor-risk', 2, /firmware 7.2/, /evidence for the delivered firmware/],
  ['network-security-pqc', 1, /client-to-proxy connection/, /Only the client-to-proxy leg passes/],
  ['automotive-pqc', 3, /a new fleet plan/i, /^70 minutes$/],
  ['crypto-mgmt-modernization', 3, /sample investment estimates/, /^\$420,000/],
  ['data-asset-sensitivity', 0, /arrival estimate from 2034 to 2032/, /^2025$/],
  [
    'secrets-management-pqc',
    0,
    /cold backup from before rotation/,
    /A restore of the retained backup/,
  ],
  [
    'pqc-testing-validation',
    1,
    /captured server selected X25519/,
    /observed connection used classical/,
  ],
  ['skills-team-structure', 0, /add 0.5 FTE to the PMO/, /^4 delivery and 3 coordination$/],
  ['slh-dsa', 1, /context release-v1/, /verifier is supposed to require release-v2/],
  ['aerospace-pqc', 5, /mission moves launch/, /^2029$/],
  ['ot-pqc', 5, /standby signer is restored/, /Block signing on the restored state/],
  [
    'platform-eng-pqc',
    4,
    /encoded envelope adds 700 bytes/,
    /exceeds the receiver limit by 364 bytes/,
  ],
  [
    'soc-implementation-pqc',
    4,
    /application returned 200/,
    /negotiated group violated the endpoint policy/,
  ],
  ['crypto-product-certification', 1, /worker that opens TLS/, /Trace which implementation/],
  [
    'crypto-product-certification',
    4,
    /upload.*passed schema checks/,
    /exact approved bytes have not been reconciled/,
  ],
] as const

for (const [moduleId, step, scenario, correct] of cases) {
  for (const width of [1280, 390]) {
    test(`${moduleId} step ${step + 1} explains a different workshop decision at ${width}px`, async ({
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
      await page.goto(`/learn/${moduleId}?tab=workshop&step=${step}`)
      if (moduleId === 'skills-team-structure') {
        const allocation = page.getByRole('region', { name: 'Staffing allocation' })
        await expect(allocation).toHaveCount(1)
        page.once('dialog', (dialog) => dialog.accept())
        await page.getByRole('button', { name: 'Reset', exact: true }).click()
        await expect(allocation).toHaveCount(1)
        await page.getByRole('switch', { name: 'OT in scope' }).click()
        await allocation.getByRole('button', { name: 'Reset sample allocations' }).click()
        await expect(allocation.getByText('Allocated programme FTE:')).toHaveText(
          'Allocated programme FTE: 6.5'
        )
        await allocation
          .getByRole('spinbutton', { name: /PMO Analyst allocated FTE/i })
          .fill('1.25')
        await expect(allocation.getByText('Allocated programme FTE:')).toHaveText(
          'Allocated programme FTE: 7'
        )
        await expect(allocation.getByText('Delivery:')).toHaveText(
          'Delivery: 4 FTE + coordination: 3 FTE'
        )
      }
      const exercise = page.getByTestId('step-exercise')
      const answers = exercise.getByRole('group', { name: 'Answers' })
      const feedback = exercise.getByRole('status')
      const another = exercise.getByRole('button', { name: 'Apply it to another case' })
      const original = answers.getByRole('button').first()
      const originalName = (await original.textContent())?.trim()
      expect(originalName).toBeTruthy()
      await expect(another).toHaveCount(0)
      await original.press('Space')
      const firstFeedback = await feedback.textContent()
      await another.click()
      await expect(exercise.getByText(scenario)).toBeVisible()
      await expect(feedback).toHaveCount(0)

      const rightAnswer = answers.getByRole('button', { name: correct })
      const wrongAnswer = answers.getByRole('button').filter({ hasNotText: correct }).first()
      await wrongAnswer.press('Space')
      await expect(feedback).toContainText('Not quite')
      await rightAnswer.press('Space')
      await expect(feedback).toHaveText(/^Right\./)
      if (moduleId === 'pqc-testing-validation') {
        await expect(feedback.getByRole('link', { name: 'TLS 1.3 key share' })).toHaveAttribute(
          'href',
          'https://www.ietf.org/ietf-ftp/rfc/rfc9846.html#section-4.3.8'
        )
      }

      await exercise.getByRole('button', { name: 'Back to the first question' }).click()
      await expect(feedback).toHaveText(firstFeedback ?? '')
      await another.click()
      await expect(rightAnswer).toHaveAttribute('aria-pressed', 'true')
      await page.reload()
      await expect(feedback).toHaveText(firstFeedback ?? '')
      await another.click()
      await expect(rightAnswer).toHaveAttribute('aria-pressed', 'true')
      await expect(feedback).toHaveText(/^Right\./)
    })
  }
}
