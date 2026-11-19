// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

const entries = ['/playground/hybrid-certs', '/learn/hybrid-crypto?tab=workshop&step=5&sv=2']

for (const width of [1280, 390]) {
  for (const entry of entries) {
    test(`certificate and handshake policies stay separate from ${entry} at ${width}px`, async ({
      page,
    }) => {
      test.setTimeout(90_000)
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
      await page.goto(entry)
      const exercise = page.getByRole('region', { name: 'Certificate-to-TLS exercise' })
      const decision = exercise.getByRole('status', { name: 'TLS authentication evidence' })
      const policy = exercise.getByRole('combobox', {
        name: 'Required authentication with X25519MLKEM768',
      })
      const run = exercise.getByRole('button', { name: 'Run certificate-to-TLS exercise' })
      await expect(exercise.getByRole('link', { name: /Composite ML-DSA draft/ })).toHaveAttribute(
        'href',
        'https://datatracker.ietf.org/doc/draft-ietf-tls-composite-mldsa/'
      )
      await expect(decision).toHaveCount(0)
      await run.click()
      await expect(decision).toHaveText(
        'Matching observed handshake: Hybrid exchange + classical authentication.',
        { timeout: 45_000 }
      )
      await policy.selectOption('single-pq')
      await expect(decision).toHaveText(
        'Matching observed handshake: Hybrid exchange + PQ authentication.'
      )
      await policy.selectOption('mixed-issuer')
      await expect(decision).toContainText('ML-DSA-65 issuer signature')
      await expect(decision).toContainText('CertificateVerify was RSA-PSS')
      const mixed = exercise.getByRole('row', {
        name: /Hybrid exchange \+ RSA leaf issued by ML-DSA CA/,
      })
      await expect(mixed.getByRole('cell').first()).toContainText('X25519MLKEM768')
      await expect(mixed.getByRole('cell').nth(1)).toContainText('rsaEncryption')
      await expect(mixed.getByRole('cell').nth(1)).toContainText('ML-DSA-65')
      await expect(mixed.getByRole('cell').nth(2)).toContainText('rsa_pss_rsae_sha256')
      await expect(mixed.getByRole('cell').last()).toHaveText('Passed')
      await policy.selectOption('composite')
      await expect(decision).toContainText(
        'Composite authentication is unverified in this exercise.'
      )
      await expect(decision).not.toContainText('Matching observed handshake')
      await policy.selectOption('kem-leaf')
      await expect(decision).toContainText('certificate passed the CA path and DNS checks')
      await expect(decision).toContainText('key could not sign')
      await expect(decision).toContainText('attempted TLS authentication failed')
      const kemRejection = exercise.getByText(
        /Passed — ML-KEM-768 leaf rejected as the TLS signing credential/
      )
      await kemRejection.click()
      await expect(kemRejection.locator('..')).toContainText(/operation not supported/i)
      await policy.selectOption('rsa')
      await expect(decision).toContainText('Hybrid exchange + classical authentication')

      const group = exercise.getByRole('combobox', { name: 'Required key exchange group' })
      for (const hybrid of ['SecP256r1MLKEM768', 'SecP384r1MLKEM1024']) {
        await group.selectOption(hybrid)
        await expect(decision).toHaveText(
          `Matching observed handshake: ${hybrid} + the same RSA certificate.`
        )
        const measured = exercise.getByRole('row', { name: new RegExp(`^${hybrid} \\+`) })
        await expect(measured.getByRole('cell').first()).toContainText(`Key Exchange: ${hybrid}`)
        await expect(measured.getByRole('cell').nth(1)).toContainText('rsaEncryption')
        await expect(measured.getByRole('cell').nth(2)).toContainText('rsa_pss_rsae_sha256')
        await expect(measured.getByRole('cell').last()).toHaveText('Passed')
      }
      const p384Auth = exercise.getByRole('combobox', {
        name: 'Required authentication with SecP384r1MLKEM1024',
      })
      await p384Auth.selectOption('single-pq')
      await expect(decision).toHaveText('No completed handshake matches this requirement.')
      await group.selectOption('X25519MLKEM768')
      await expect(decision).toContainText('Hybrid exchange + PQ authentication')
      const wrongPeer = exercise.getByText(/Passed — Peer limited to X25519MLKEM768 rejected/)
      await wrongPeer.click()
      await expect(wrongPeer.locator('..')).toContainText(
        /no suitable key share|no shared group|no common group/i
      )
    })
  }

  test(`certificate transparency explains who must supply public log evidence at ${width}px`, async ({
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
    const explanation = page
      .getByRole('heading', { name: 'Certificate Transparency (RFC 9162)' })
      .locator('..')
    await expect(explanation).toContainText('publicly trusted TLS server certificates')
    await expect(explanation).toContainText('An auditor verifies actual inclusion separately.')
    await expect(explanation).toContainText('Private trust anchors')
    await expect(explanation.getByRole('link', { name: 'Chrome CT policy' })).toHaveAttribute(
      'href',
      'https://googlechrome.github.io/CertificateTransparency/ct_policy.html'
    )
    await expect(explanation.getByRole('link', { name: 'Apple CT policy' })).toHaveAttribute(
      'href',
      'https://support.apple.com/en-us/103214'
    )
  })
}
