// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * CACP KMIP control-plane acceptance — /playground/cacp.
 *
 * Closes the e2e gap left by the workbench spec: this drives a *real* KMIP 3.0
 * operation through the in-browser engine (pqctoday-kmip + softhsmrustv3 compiled
 * to WASM). Default algorithm is ML-DSA-65, so the deterministic lifecycle is
 * Create → Activate → Sign → Verify. We assert the engine boots, the ops succeed,
 * real TTLV bytes come back on the wire, and a switched policy still resolves a
 * decision — i.e. the three planes (Agility / KMIP / PKCS#11) are actually live.
 */

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
    // Drive the page in Expert mode so the KMIP Wire panel + raw-bytes view are
    // rendered (Guided mode hides them behind the progressive-disclosure toggle).
    localStorage.setItem('cacp-mode', 'expert')
  })
})

test('boots the in-browser engine and runs a real Create → Activate → Sign → Verify', async ({
  page,
}) => {
  await page.goto('/playground/cacp')

  // Engine boot: the "Booting…" loader is replaced by the control-plane header.
  // wasm instantiate + engine init can take a moment, so allow generous time.
  await expect(page.getByRole('heading', { name: /KMIP Control Plane/i })).toBeVisible({
    timeout: 30000,
  })

  // Default algorithm is the PQC signer ML-DSA-65 → signing lifecycle. The
  // algorithm picker is now a FilterDropdown (button trigger), wrapped in a
  // testid hook; its trigger shows the selected label.
  await expect(page.getByTestId('kmip-algo')).toContainText('ML-DSA-65')

  const result = page.getByRole('heading', { name: 'Result' }).locator('..')

  // 1 · Create — a real KMIP CreateKeyPair request.
  await page.getByRole('button', { name: /Create signing key pair/i }).click()
  await expect(result.getByText(/Success/i)).toBeVisible({ timeout: 15000 })

  // 2 · Activate (enabled only once a private key exists).
  const activate = page.getByRole('button', { name: '2 · Activate' })
  await expect(activate).toBeEnabled()
  await activate.click()
  await expect(result.getByText(/Success/i)).toBeVisible({ timeout: 15000 })

  // 3 · Sign a message — the headline real crypto op.
  await page.getByPlaceholder('message to sign').fill('hello pqc')
  await page.getByRole('button', { name: '3 · Sign' }).click()
  await expect(result.getByText('Sign', { exact: true })).toBeVisible({ timeout: 15000 })

  // The KMIP Wire response lives in the Inspector's "KMIP Wire" tab (Expert).
  await page.getByRole('button', { name: 'KMIP Wire' }).click()
  // Real TTLV came back on the wire (non-zero byte count in the wire panel).
  await expect(page.getByText(/\d+ bytes on the wire/i)).toBeVisible()
  // The raw bytes are actually shown (not just claimed) — the literal hex view.
  await expect(page.getByText(/Raw bytes \(hex\)/i)).toBeVisible()

  // 4 · Verify the signature we just produced.
  const verify = page.getByRole('button', { name: '4 · Verify' })
  await expect(verify).toBeEnabled()
  await verify.click()
  await expect(result.getByText('SignatureVerify', { exact: true })).toBeVisible({ timeout: 15000 })
})

test('rekey-on-use policy migrates a classical key to PQC on first Sign, and the "migrated" claim is backed by a real Rekey decision', async ({
  page,
}) => {
  // The single-button "Run the agility scenario" narrative this test used to
  // drive was replaced by the "Test scenarios" dry-run panel (PolicyScenario.tsx,
  // feat/cacp-policy-scenarios) — deliberately read-only ("nothing is created"),
  // so it can't stand in for what this test actually needs: proof that a REAL,
  // side-effecting rekey happens end to end.
  //
  // `auto-migrate-on-use.yaml` only rekeys an EXISTING classical key at Sign —
  // it defaults new Auto keys straight to ML-DSA-65 and outright denies
  // creating a NEW classical key. So the legacy key has to be made under a
  // DIFFERENT, more permissive policy (Classical) first, then carried over —
  // that hand-off, not a same-policy flip, is the actual "no flag day" story.
  await page.goto('/playground/cacp')
  await expect(page.getByRole('heading', { name: /KMIP Control Plane/i })).toBeVisible({
    timeout: 30000,
  })

  // Classical: Auto resolves to ECDSA-P256 — exactly what the rekey-on-use
  // policy's substitution rule watches for later.
  await page.getByRole('button', { name: /Classical \(the "before"\)/i }).click()
  await page.getByTestId('kmip-algo').getByRole('button').click()
  await page.getByText('Auto — let the policy decide').click()
  await expect(page.getByTestId('kmip-algo')).toContainText('Auto')

  const result = page.getByRole('heading', { name: 'Result' }).locator('..')
  await page.getByRole('button', { name: /Create signing key pair/i }).click()
  await expect(result.getByText(/policy: Allow/i)).toBeVisible({ timeout: 15000 })

  const activate = page.getByRole('button', { name: '2 · Activate' })
  await expect(activate).toBeEnabled()
  await activate.click()
  // onActivate (KmipPlaygroundView.tsx) awaits two sequential engine calls —
  // activate the private key, then the public key. The Result panel's
  // "Success" badge text is reused across every op (StatusBadge), so it's
  // not a reliable signal that BOTH activations actually landed: switching
  // tabs right after the click was observed to leave the keystore with both
  // keys still in PreActive (a fresh error-context.md snapshot 2026-08-29
  // showed "WrongKeyLifecycleState ... is in PreActive — op requires
  // Active" at Sign time). Wait on the keystore table's own state cells
  // instead — the actual ground truth, not a proxy.
  await expect(page.getByRole('cell', { name: 'PreActive', exact: true })).toHaveCount(0, {
    timeout: 15000,
  })

  // Hand the now-Active classical key over to the rekey-on-use policy — not
  // in the featured quick-switch strip, so go through the full library.
  await page.getByRole('tab', { name: 'Policy', exact: true }).click()
  // The catalog button's accessible name is the whole card (label + rule
  // count + blurb), so match on the label as a substring, not exactly.
  await page.getByRole('button', { name: /^Auto-migrate on use\b/ }).click()
  await expect(page.getByRole('heading', { name: 'Auto-migrate on use' })).toBeVisible()
  await page.getByRole('tab', { name: 'Agility & Workbench', exact: true }).click()

  // The moment you Sign, the policy rekeys the legacy key to its PQC
  // equivalent and signs with the new key — the "migrated" claim's actual
  // engine-backed proof, not just UI copy.
  await page.getByPlaceholder('message to sign').fill('hello pqc')
  await page.getByRole('button', { name: '3 · Sign' }).click()
  await expect(result.getByText(/policy: Rekey/i)).toBeVisible({ timeout: 15000 })
})

test('switching policy resolves a decision on the agility plane', async ({ page }) => {
  await page.goto('/playground/cacp')
  await expect(page.getByRole('heading', { name: /KMIP Control Plane/i })).toBeVisible({
    timeout: 30000,
  })

  // The Active-Policy strip lists the presets as chips; clicking one loads it and
  // marks the chip active.
  await expect(page.getByRole('heading', { name: /Plane 1 · Active Policy/i })).toBeVisible()
  const pqcChip = page.getByRole('button', { name: /PQC \(the "after"\)/i })
  await pqcChip.click()
  await expect(pqcChip.getByText('active', { exact: true })).toBeVisible({ timeout: 15000 })
})

// WP7-b/e (cert-ops plan revision) — the two existing specs above predate
// the pure-Rust Certificate Services port; neither touches the Commands
// tab or the "Set up demo CA" affordance. This closes the core of that
// gap: a real browser (Playwright/Chromium, headless — genuinely
// available in this session, contrary to an earlier assumption; verified
// by running it, not by re-asserting the standing caveat) driving the
// actual Commands tab UI end to end (Set up demo CA → Validate → a real
// "(Valid)" answer rendered on screen), not just the vitest-against-real-
// wasm-engine harness the rest of this session's coverage uses (Node, not
// a browser DOM).
//
// A second test attempting the CreateKeyPair → Certify-by-UID path (the
// WP-R/R1 fix specifically) was attempted and dropped: the Commands tab's
// per-operation response tree — unlike Validate's, which renders inline
// under the expanded op panel — didn't surface via the same selector
// pattern after several targeted DOM probes (not in the panel, not in a
// separate "Execution Log" entry with content visible before its one
// button turned out to be "Clear", which discarded it). WP-R/R1 itself is
// still solidly proven — natively (certify.rs's per-algorithm tests) and
// in-browser-equivalent (the wasm/vitest tests in opTemplates.local.test.
// ts, which drive the identical wasm engine this e2e spec's browser
// loads, just from Node instead of a browser DOM) — this is specifically
// about the raw UI-click path, not about whether the fix works.
test.describe('Certificate Services (Commands tab)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/playground/cacp')
    await expect(page.getByRole('heading', { name: /KMIP Control Plane/i }).first()).toBeVisible({
      timeout: 30000,
    })
    await page.getByRole('tab', { name: 'KMIP3.0', exact: true }).click()
    await page.locator('[data-tour="kmip3-subtabs"] button', { hasText: 'Commands' }).click()
  })

  test('Set up demo CA mints a real self-signed cert that Validates Valid', async ({ page }) => {
    await page.getByRole('button', { name: 'Set up demo CA', exact: true }).click()
    const caReady = page.getByText(/CA ready: /)
    await expect(caReady).toBeVisible({ timeout: 15000 })
    const caUid = ((await caReady.textContent()) ?? '').replace('CA ready: ', '').trim()
    expect(caUid).toMatch(/^urn:/)

    await page
      .getByRole('button', { name: /Validate\s*§/ })
      .first()
      .click()
    const uidInput = page
      .locator('label', { hasText: 'Stored Certificate UIDs' })
      .locator('..')
      .locator('input')
    await uidInput.fill(caUid)
    await page.getByRole('button', { name: 'Run', exact: true }).first().click()

    const indicatorRow = page.locator('span', { hasText: 'ValidityIndicator' }).locator('../..')
    await expect(indicatorRow.getByText('(Valid)')).toBeVisible({ timeout: 15000 })
  })
})
