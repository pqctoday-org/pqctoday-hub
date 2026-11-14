// SPDX-License-Identifier: AGPL-3.0-only
/**
 * pki-enrollment-protocols.spec.ts
 *
 * E2E tests for the PKI Enrollment Protocols workshop.
 * Every assertion here is a CRYPTOGRAPHIC property — byte sizes, PEM headers,
 * algorithm OIDs in decoded cert text, and the key update's accepted confirmation
 * or its refusal.
 * No colour, layout, or smoke-only assertions.
 *
 * Crypto operations are real:
 *   - KeyGen: OpenSSL 3.6 WASM `genpkey` (EVP backend)
 *   - CMP IR: in-process OSSL_CMP_CTX client ↔ OSSL_CMP_SRV_CTX server via C shim
 *   - EST: CSR from `openssl req -new` + issuance via CMP shim + PKCS#7 via crl2pkcs7
 *   - CMP key update: signed KUR to a fresh ML-KEM key, encrypted-certificate
 *     recovery and explicit hash confirmation via the same C shim
 */
import { test, expect, type Page } from '@playwright/test'

const ROUTE = '/learn/pki-enrollment-protocols'

// All WASM operations: WASM init + CA provisioning + C shim + cert decode.
// The openssl.wasm cold-load plus ML-DSA-65 CA root generation can together
// take ~30 s on a slow CI runner.
const WASM_TIMEOUT = 90_000

async function suppressWhatsNew(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({
        state: { lastSeenVersion: '99.0.0', isFirstVisit: false },
        version: 3,
      })
    )
  })
}

async function openWorkshop(page: Page) {
  await suppressWhatsNew(page)
  await page.goto(ROUTE)
  // The Tabs component uses custom <button> elements, not role="tab".
  await page.getByRole('tab', { name: 'Workshop', exact: true }).first().click()
}

// Navigate the step indicator (the pill-button row at the top of the workshop pane).
// Each button's visible label is step.title.split(':')[0] = "Step 1" … "Step 6".
async function goToStep(page: Page, n: 1 | 2 | 3 | 4 | 5 | 6) {
  // WorkshopStepper's `aria-label` is the FULL step title ("Step 3: EST
  // simpleenroll"), optionally suffixed " (current)"/" (completed)" — an exact
  // 'Step 3' match therefore finds nothing. Anchor on the "Step N" prefix so the
  // query holds under either labelling, and take the first of the two steppers
  // rendered (desktop rail + workshop header); the first is the enabled one.
  await page
    .getByRole('button', { name: new RegExp(`^Step ${n}\\b`) })
    .first()
    .click()
}

// Helper: wait for the KeyGen step to produce a key. The PEM lives inside a
// <details> element (collapsed by default), so we assert the always-visible
// "Keypair ready:" banner that appears alongside it.
async function generateKey(page: Page) {
  await page.getByRole('button', { name: 'Generate keypair (OpenSSL WASM)' }).click()
  // "Keypair ready: ML-DSA-65 written to /ee.key.pem" — always visible, not inside details.
  await expect(page.getByText(/Keypair ready:/)).toBeVisible({ timeout: WASM_TIMEOUT })
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. KeyGen — verify real PEM output from OpenSSL genpkey
// ─────────────────────────────────────────────────────────────────────────────
test('Step 1: ML-DSA-65 genpkey produces a real PKCS#8 private key (PEM inside details)', async ({
  page,
}) => {
  test.setTimeout(WASM_TIMEOUT)
  await openWorkshop(page)

  // Workshop opens at Step 1 (KeyGen). The default algorithm is ML-DSA-65.
  await generateKey(page)

  // "Keypair ready:" confirms a file was produced. Open the details panel to
  // read the PEM and assert both guards are present (real genpkey output).
  await page.getByText('Inspect PEM').click()
  await expect(page.getByText(/-----BEGIN PRIVATE KEY-----/)).toBeVisible()
  await expect(page.getByText(/-----END PRIVATE KEY-----/)).toBeVisible()
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. CMP IR — real PKIMessage exchange, real X.509 cert, ML-DSA signature algo
// ─────────────────────────────────────────────────────────────────────────────
test('Step 2: CMP IR issues a real X.509 cert with ML-DSA-65 CA signature (openssl x509 -text)', async ({
  page,
}) => {
  test.setTimeout(WASM_TIMEOUT)
  await openWorkshop(page)

  // KeyGen is a prerequisite: CMP IR enrolls the key generated in Step 1.
  await generateKey(page)

  await goToStep(page, 2)

  // The CmpInitialReq component runs ensureMockCA() on mount (ML-DSA-65 CA root
  // generation via the C shim). Wait for the status indicator to confirm CA ready.
  await expect(page.getByText('✓ Mock CA ready')).toBeVisible({ timeout: WASM_TIMEOUT })

  await page.getByRole('button', { name: 'Send CMP Initial Request' }).click()

  // Success banner appears once the in-process CMP exchange completes and the cert
  // is decoded with `openssl x509 -text -noout`.
  await expect(page.getByText(/Certificate issued/)).toBeVisible({ timeout: WASM_TIMEOUT })

  // The decoded cert renders via the shared <CopyableOutput> component, which is
  // a readOnly <textarea> (component/ui/CopyableOutput.tsx), not a <pre> -- a
  // controlled textarea's value lives in the DOM `.value` property, not its
  // textContent, so neither a `pre` locator nor `hasText` can ever match it.
  // This was a 100%-reproducible stale selector (not the load/timing issue
  // TRIAGE.md previously assumed), scoped via the "Decoded certificate"
  // <details> block since a second CopyableOutput (raw cert PEM) also renders
  // on this page.
  const decodedCertBox = page.locator('details', { hasText: 'Decoded certificate' })
  const decodedCert = decodedCertBox.locator('textarea')
  await expect(decodedCert).toBeVisible()
  await expect(decodedCert).toHaveValue(/Certificate:/)

  // Subject DN contains "Workshop EE" (the default Subject input value).
  const certText = await decodedCert.inputValue()
  expect(certText).toMatch(/Certificate:/)
  expect(certText).toMatch(/Workshop EE/)

  // Signature algorithm OID: the mock CA signs with ML-DSA-65. OpenSSL 3.6+
  // renders this as "id-ML-DSA-65" or "ML-DSA-65" in the Signature Algorithm line.
  expect(certText).toMatch(/ML-DSA/)

  // Exchange transcript must list at least 2 events (IR sent + IP received).
  await expect(page.getByText(/CMP exchange transcript \(\d+ events\)/)).toBeVisible()
  const transcriptText =
    (await page.getByText(/CMP exchange transcript \(\d+ events\)/).textContent()) ?? ''
  const evtCount = parseInt(transcriptText.match(/(\d+) events/)?.[1] ?? '0', 10)
  expect(evtCount).toBeGreaterThanOrEqual(2)
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. ML-KEM-768 certificate key update — encrypted certificate + explicit confirmation (RFC 9810)
// ─────────────────────────────────────────────────────────────────────────────
test('Step 4: ML-KEM-768 key update recovers the encrypted certificate and confirms it', async ({
  page,
}) => {
  test.setTimeout(WASM_TIMEOUT)
  await openWorkshop(page)

  // CmpKemKeyUpdate has no dependency on Steps 1-3 — it provisions its own
  // fictional CA, signing identity and prior enrollment inside the button handler.
  await goToStep(page, 4)
  await expect(page.getByText('ML-KEM certificate key update', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Run key update', exact: true }).click()
  await expect(
    page.getByText('New-key possession and explicit confirmation verified for this sample.', {
      exact: true,
    })
  ).toBeVisible({ timeout: WASM_TIMEOUT })

  // The server accepts completion only after the client confirms the certificate hash.
  await page.getByText('Actual transaction events', { exact: true }).click()
  await expect(page.getByText('server: confirmation_accepted', { exact: true })).toBeVisible()
})

test('Step 4: key update for a different prior enrollment is rejected with no certificate', async ({
  page,
}) => {
  test.setTimeout(WASM_TIMEOUT)
  await openWorkshop(page)
  await goToStep(page, 4)

  await page.getByRole('button', { name: /Sample prior-certificate authorization/ }).click()
  await page
    .getByRole('option', { name: 'Different prior enrollment — expect rejection', exact: true })
    .click()
  await page.getByRole('button', { name: 'Run key update', exact: true }).click()

  await expect(
    page.getByText('prior certificate is not authorized for the sample identity', { exact: true })
  ).toBeVisible({ timeout: WASM_TIMEOUT })
  await expect(page.getByText('Recovered certificate', { exact: true })).toHaveCount(0)
  await expect(
    page.getByText('New-key possession and explicit confirmation verified for this sample.', {
      exact: true,
    })
  ).toHaveCount(0)
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. EST simpleenroll — real PKCS#7 SignedData response (RFC 7030 §4.2.3)
// ─────────────────────────────────────────────────────────────────────────────
test('Step 3: EST simpleenroll returns a real PKCS#7 SignedData envelope (crl2pkcs7 output)', async ({
  page,
}) => {
  test.setTimeout(WASM_TIMEOUT)
  await openWorkshop(page)

  // EST step requires an EE key from Step 1.
  await generateKey(page)

  await goToStep(page, 3)

  // EST simpleenroll: CSR build + CMP-shim issuance + crl2pkcs7 wrap.
  await page.getByRole('button', { name: 'Run simpleenroll (CSR → PKCS#7)' }).click()

  // The PKCS#7 response body (RFC 7030 §4.2.3) is a PEM-encoded degenerate SignedData.
  await expect(page.getByText(/-----BEGIN PKCS7-----/)).toBeVisible({ timeout: WASM_TIMEOUT })
  await expect(page.getByText(/-----END PKCS7-----/)).toBeVisible()
})
