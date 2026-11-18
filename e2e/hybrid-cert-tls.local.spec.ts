// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

test('certificate playground runs classical and PQ TLS authentication with measured rejection checks', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0', isFirstVisit: false }, version: 3 })
    )
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
  })
  await page.goto('/playground/hybrid-certs')
  const exercise = page.getByRole('region', { name: 'Certificate-to-TLS exercise' })
  await expect(exercise).toBeVisible()
  const incorrect = exercise.getByRole('radio', { name: 'No, the server needs a new certificate' })
  const correct = exercise.getByRole('radio', { name: 'Yes, the same RSA certificate can be used' })
  await incorrect.check()
  await expect(
    exercise.getByText('Compare the first two rows and try the prediction again.')
  ).toHaveCount(0)
  await exercise
    .getByRole('button', { name: 'Run certificate-to-TLS exercise', exact: true })
    .click()
  await expect(exercise.getByText('All three handshakes and rejection checks passed.')).toBeVisible(
    { timeout: 90_000 }
  )
  await expect(
    exercise.getByText('Compare the first two rows and try the prediction again.')
  ).toBeVisible()
  await correct.check()
  await expect(exercise.getByText('Your prediction matches the measured handshakes.')).toBeVisible()
  await expect(exercise.getByRole('row', { name: /Classical baseline/ })).toContainText(
    'rsa_pss_rsae_sha256'
  )
  await expect(
    exercise.getByRole('row', { name: /Hybrid exchange \+ classical authentication/ })
  ).toContainText('X25519MLKEM768')
  await expect(
    exercise.getByRole('row', { name: /Hybrid exchange \+ PQ authentication/ })
  ).toContainText('mldsa65')
  await expect(
    exercise.getByText('Passed — Unrelated CA rejected by TLS', { exact: true })
  ).toBeVisible()
  await expect(
    exercise.getByText('Passed — Incompatible CertificateVerify scheme rejected', { exact: true })
  ).toBeVisible()
  // Repeat with fresh keys; the worker must not reuse old output or trust material.
  await exercise
    .getByRole('button', { name: 'Run certificate-to-TLS exercise', exact: true })
    .click()
  await expect(exercise.getByText('All three handshakes and rejection checks passed.')).toBeVisible(
    { timeout: 90_000 }
  )
})

test('the phone workshop connects the certificate prediction to measured TLS authentication', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 900 })
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0', isFirstVisit: false }, version: 3 })
    )
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
  })
  await page.goto('/learn/hybrid-crypto?tab=workshop&step=5&sv=2')
  const exercise = page.getByRole('region', { name: 'Certificate-to-TLS exercise' })
  await exercise.getByRole('radio', { name: 'Yes, the same RSA certificate can be used' }).check()
  await exercise
    .getByRole('button', { name: 'Run certificate-to-TLS exercise', exact: true })
    .click()
  await expect(exercise.getByText('Your prediction matches the measured handshakes.')).toBeVisible({
    timeout: 90_000,
  })
  await expect(
    exercise
      .getByRole('row', { name: /Classical baseline/ })
      .getByRole('cell')
      .first()
  ).toContainText(/x25519\s*$/i)
  await expect(
    exercise.getByRole('row', { name: /Hybrid exchange \+ classical authentication/ })
  ).toContainText('rsa_pss_rsae_sha256')
})
