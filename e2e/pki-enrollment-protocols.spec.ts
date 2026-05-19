// SPDX-License-Identifier: GPL-3.0-only
/**
 * pki-enrollment-protocols.spec.ts
 *
 * E2E tests for the PKI Enrollment Protocols workshop.
 * Every assertion here is a CRYPTOGRAPHIC property — byte sizes, PEM headers,
 * algorithm OIDs in decoded cert text, and byte-exact shared-secret equality.
 * No colour, layout, or smoke-only assertions.
 *
 * Crypto operations are real:
 *   - KeyGen: OpenSSL 3.6 WASM `genpkey` (EVP backend)
 *   - CMP IR: in-process OSSL_CMP_CTX client ↔ OSSL_CMP_SRV_CTX server via C shim
 *   - EST: CSR from `openssl req -new` + issuance via CMP shim + PKCS#7 via crl2pkcs7
 *   - ML-KEM POP: pkeyutl -encap / -decap byte comparison
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
  await page.getByRole('button', { name: 'Workshop', exact: true }).first().click()
}

// Navigate the step indicator (the pill-button row at the top of the workshop pane).
// Each button's visible label is step.title.split(':')[0] = "Step 1" … "Step 6".
async function goToStep(page: Page, n: 1 | 2 | 3 | 4 | 5 | 6) {
  await page.getByRole('button', { name: `Step ${n}`, exact: true }).click()
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

  // `openssl x509 -text -noout` always emits "Certificate:" as its first line.
  const decodedCert = page.locator('pre').filter({ hasText: 'Certificate:' }).first()
  await expect(decodedCert).toBeVisible()

  // Subject DN contains "Workshop EE" (the default Subject input value).
  const certText = (await decodedCert.textContent()) ?? ''
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
// 3. ML-KEM-768 encrCert POP — byte-exact shared secret equality (RFC 9810)
// ─────────────────────────────────────────────────────────────────────────────
test('Step 4: ML-KEM-768 encap → decap yields byte-identical 32-byte shared secrets (RFC 9810 POP)', async ({
  page,
}) => {
  test.setTimeout(WASM_TIMEOUT)
  await openWorkshop(page)

  // CmpKemKeyUpdate has no dependency on Steps 1-3 — it provisions the mock CA
  // internally via ensureMockCA() inside the button handler.
  await goToStep(page, 4)

  await page
    .getByRole('button', {
      name: 'Run ML-KEM-768 KUR (CMP IR + encrCert POP)',
    })
    .click()

  // POP success = encap and decap secrets match.
  await expect(page.getByText(/encrCert POP successful/)).toBeVisible({ timeout: WASM_TIMEOUT })

  // Extract the two hex-encoded 32-byte shared secrets.
  // Structure: <div label> followed immediately by <pre hex> as siblings inside the panel.
  // Use XPath following-sibling to avoid matching ancestor divs that also contain
  // the cert-decode <pre> (which uses colon-separated hex and would fail the regex).
  const encapHex = await page
    .getByText('CA-side shared secret (encap)', { exact: true })
    .locator('xpath=following-sibling::pre[1]')
    .textContent()

  const decapHex = await page
    .getByText('EE-side shared secret (decap)', { exact: true })
    .locator('xpath=following-sibling::pre[1]')
    .textContent()

  const encap = (encapHex ?? '').trim()
  const decap = (decapHex ?? '').trim()

  // ML-KEM-768 shared secret (FIPS 203) is exactly 32 bytes = 64 lower-case hex chars.
  expect(encap).toMatch(/^[0-9a-f]{64}$/)
  expect(decap).toMatch(/^[0-9a-f]{64}$/)

  // Byte-for-byte equality — this is the actual RFC 9810 proof-of-possession assertion.
  expect(encap).toBe(decap)
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
