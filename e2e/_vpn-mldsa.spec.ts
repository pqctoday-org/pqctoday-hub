// E2E test for ML-DSA dual-auth VPN (pure-pqc + ML-DSA cert auth).
// Bypasses the broken `?vpnAutostart=1` URL handler. Drives the UI directly:
//   1. Configure pure-pqc + dual auth via URL params
//   2. Both clientAlg + serverAlg → ML-DSA via dropdown
//   3. Click Generate Certs → wait for completion
//   4. Click Start Daemon
//   5. Race: ESTABLISHED with C_Sign(CKM_ML_DSA) (success) vs PSK fallback (failure)
//
// PSK fallback is the regression we're hunting: charon was falling back to
// pre-shared-key auth at IKE_AUTH instead of using the ML-DSA cert.

import { test, expect, type Page } from '@playwright/test'

const BASE = '/playground/hsm?tab=vpn_sim'
const HANDSHAKE_TIMEOUT = 90_000
const CERTGEN_TIMEOUT = 60_000

async function suppressWhatsNew(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    // Aggressively unregister any service worker + clear caches so the test
    // never serves a stale WASM binary from a prior dev session. The SW
    // precaches /wasm/strongswan.wasm and can serve old code even after a
    // rebuild → makes WASM debugging deeply confusing.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister())
      })
    }
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
    }
  })
}

test('VPN pure-pqc + ML-DSA dual auth — reaches ESTABLISHED via cert (NOT PSK fallback)', async ({
  page,
}) => {
  test.setTimeout(240_000)
  await suppressWhatsNew(page)

  await page.goto(`${BASE}&vpnMode=pure-pqc&vpnAuth=dual&vpnRpc=1`, {
    waitUntil: 'networkidle',
    timeout: 30_000,
  })

  // Switch client to ML-DSA (default is RSA). The Client tab is the
  // default; pick the first select with options "ML-DSA (PQC)" / "RSA
  // (Classical)" — that's clientAlg.
  const clientAlgSelect = page.locator('select').filter({ hasText: 'ML-DSA (PQC)' }).first()
  await clientAlgSelect.selectOption('ML-DSA')

  // Switch to Server tab
  await page
    .getByRole('button', { name: /Server Token/i })
    .first()
    .click()
  // Server alg defaults to ML-DSA, but assert + set explicitly to be safe.
  const serverAlgSelect = page.locator('select').filter({ hasText: 'ML-DSA (PQC)' }).first()
  await serverAlgSelect.selectOption('ML-DSA')

  // Click Generate Certs
  const genBtn = page.locator('[data-testid="vpn-gen-certs"]')
  await expect(genBtn).toBeVisible({ timeout: 5_000 })
  await expect(genBtn).toBeEnabled({ timeout: 5_000 })
  await genBtn.click()

  // Wait for Start Daemon to become enabled (cert gen complete)
  const startBtn = page.locator('[data-testid="vpn-start-daemon"]')
  await expect(startBtn).toBeEnabled({ timeout: CERTGEN_TIMEOUT })

  // Snapshot pre-Start state for diagnostics
  const preStart = await page.evaluate(() => {
    const keep: string[] = []
    document.querySelectorAll('div').forEach((el) => {
      const t = (el.textContent || '').slice(0, 250)
      if (/\[(CERT-WORKER|BRIDGE|CERT)\]/.test(t)) keep.push(t)
    })
    return [...new Set(keep)].slice(-15)
  })
  console.log('=== Pre-StartDaemon CERT logs ===')
  preStart.forEach((l) => console.log('  ' + l))

  await startBtn.click()

  // Race: ESTABLISHED+ML-DSA (success) vs PSK fallback (failure) vs handshake error
  const established = page.locator('text=/IKE_SA wasm\\[\\d+\\] state change.*ESTABLISHED/').first()
  const pskFallback = page.locator('text=/authentication of .* with pre-shared key/').first()
  const errorMarker = page
    .locator('text=/no private key found|key derivation failed|ABORTED/')
    .first()

  const result = await Promise.race([
    established.waitFor({ timeout: HANDSHAKE_TIMEOUT }).then(() => 'established' as const),
    pskFallback.waitFor({ timeout: HANDSHAKE_TIMEOUT }).then(() => 'psk_fallback' as const),
    errorMarker.waitFor({ timeout: HANDSHAKE_TIMEOUT }).then(() => 'error' as const),
  ]).catch(() => 'timeout' as const)

  // Capture diagnostic logs regardless of outcome
  const charonLines = await page.evaluate(() => {
    const out: string[] = []
    document.querySelectorAll('div').forEach((el) => {
      const t = (el.textContent || '').slice(0, 250)
      if (
        /\[(ENG|CFG|RPC|IKE|CHD|NET|CERT|BRIDGE|PKCS|ENC|JOB|MGR|LIB|CERT-WORKER)\]/.test(t) ||
        /CONNECTING|ESTABLISHED|shared secret|ABORTED|pre-shared|ID_KEY_ID|CKM_ML_DSA|no private key/.test(
          t
        )
      ) {
        if (!out.includes(t)) out.push(t)
      }
    })
    return out.slice(-40)
  })
  console.log(`\n=== Result: ${result} ===`)
  console.log('=== charon log (last 40 candidate lines) ===')
  charonLines.forEach((l) => console.log('  ' + l))

  // Diagnostic markers we EXPECT to see for a true ML-DSA cert-auth success:
  const body = await page.evaluate(() => document.body.innerText)
  const sawIdKeyId = /WASM: local identity = ID_KEY_ID/.test(body)
  const sawCkmMlDsa = /C_SignInit mech=CKM_ML_DSA/.test(body)
  const sawCertProv = /\[CERT-WORKER\] ML-DSA-\d+ certs provisioned/.test(body)
  const sawWorkersReady = /\[CERT\] Workers already provisioned/.test(body)
  const sawWasmEnvStart = /\[WASM ENV\] START set WASM_LOCAL_KEYID/.test(body)
  const sawBridgeStartDeferred = /\[BRIDGE\] Starting charon daemons \(deferred\)/.test(body)
  const sawWasmAuthDual = /\[WASM-AUTH\] authMode='dual'/.test(body)

  console.log('\n=== ML-DSA expected markers ===')
  console.log(`[CERT-WORKER] cert provisioned: ${sawCertProv}`)
  console.log(`[CERT] Workers already provisioned: ${sawWorkersReady}`)
  console.log(`[BRIDGE] Starting charon daemons (deferred): ${sawBridgeStartDeferred}`)
  console.log(`[WASM ENV] START set WASM_LOCAL_KEYID: ${sawWasmEnvStart}`)
  console.log(`[WASM-AUTH] authMode='dual': ${sawWasmAuthDual}`)
  console.log(`WASM ID_KEY_ID identity: ${sawIdKeyId}`)
  console.log(`C_SignInit CKM_ML_DSA: ${sawCkmMlDsa}`)

  // Print all [BRIDGE]/[WASM*]/[CERT*] lines from body for full ordering
  const ordered = body
    .split('\n')
    .filter((l) => /\[(BRIDGE|WASM[\s-]|WASM ENV|WASM-AUTH|CERT|CERT-WORKER|START)\]/.test(l))
    .slice(-40)
  console.log('\n=== chronological [BRIDGE]/[WASM*]/[CERT*] lines (last 40) ===')
  ordered.forEach((l) => console.log('  ' + l.trim().slice(0, 250)))

  // Show ALL "WASM:" prefixed log lines from wasm_backend.c — these tell us
  // which code paths inside wasm_setup_config are being entered
  const wasmCLines = body
    .split('\n')
    .filter((l) => /WASM:/.test(l))
    .slice(0, 60)
  console.log('\n=== "WASM:" lines from wasm_backend.c (first 60) ===')
  wasmCLines.forEach((l) => console.log('  ' + l.trim().slice(0, 250)))

  // pkcs11_manager / pkcs11_library trace
  const pkcs11Lines = body
    .split('\n')
    .filter((l) =>
      /found token|loaded PKCS#11|loaded module|opening PKCS|PQC VPN Tokens|PUR/.test(l)
    )
    .slice(0, 30)
  console.log('\n=== pkcs11_manager / pkcs11_library logs ===')
  pkcs11Lines.forEach((l) => console.log('  ' + l.trim().slice(0, 250)))

  // Print ALL WASM-DIAG lines (full text). fprintf(stderr) lines arrive
  // through Emscripten's printErr → worker postMessage → panel logs, but
  // they're not "[CFG]"-tagged so my mech-dump filter regex doesn't catch
  // them. Walk the body and pull out every DIAG occurrence with its full
  // context up to the next [WASM ... ] tag.
  const diagSplit = body.split('WASM-DIAG').slice(1)
  console.log(`\n=== ALL WASM-DIAG occurrences (${diagSplit.length}) ===`)
  diagSplit.forEach((seg, i) => {
    // Trim at next bracket-tag or 300 chars max
    const end = seg.search(/\s\[(?:CFG|IKE|ENC|NET|WASM|CERT|BRIDGE|RPC|JOB|MGR|LIB|HSM)\b/)
    const trimmed = seg.slice(0, end > 0 ? end : 300).trim()
    console.log(`  [${i}] WASM-DIAG${trimmed}`)
  })

  // The test is the actual assertion: must reach ESTABLISHED via cert auth path
  expect(result, `Expected ESTABLISHED via ML-DSA cert auth, got: ${result}`).toBe('established')

  // PSK fallback indicates the regression we're hunting
  expect(
    body.includes('with pre-shared key'),
    'Charon fell back to PSK auth — ML-DSA cert auth path failed'
  ).toBe(false)
})
