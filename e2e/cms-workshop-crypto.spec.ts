// SPDX-License-Identifier: GPL-3.0-only
/**
 * S/MIME & CMS Workshop — comprehensive crypto E2E sweep.
 *
 * Drives every live crypto demo in
 *   Playground → Email Signing → All Tools → OpenSSL Studio
 *   → S/MIME & CMS Workshop → Step 4 — Live HSM Demos
 *
 * coupled to the UI only by:
 *   - a single algorithm dropdown per demo (scoped to the demo's container
 *     by its <h3> heading text, so a header re-skin doesn't break tests),
 *   - the run button ("Sign + Verify" / "Encrypt + Decrypt" / "Dual-sign
 *     + Verify"),
 *   - the verify-success / verify-failure text in the result card.
 *
 * Every test attaches a console listener that mirrors all browser AND
 * worker console output into a per-test array. The cms.worker.ts wrapper
 * forwards openssl.wasm stderr (including the LAMPS composite shim
 * `[composite-bridge]` / `[composite-mkcert]` diagnostics) to
 * `console.error`, so when a test fails the THROW message contains the
 * full forensic trail — no need to chase logs in DevTools.
 *
 * Test matrix (one Playwright `test()` per row — failures are isolated):
 *
 *   Smoke
 *     S0    workshop renders + provider init reaches terminal state
 *
 *   MLDSASignDemo (sign + verify)
 *     M1    ML-DSA-65 software
 *     M2    ML-DSA-65 HSM        (skips if provider missing)
 *     M3    ML-DSA-87 software   (alt parameter set)
 *     M4    SLH-DSA-SHA2-128s software (alt PQ family)
 *     M5    EC software          (classical baseline)
 *     M6    RSA-PSS software     (classical baseline)
 *
 *   MLDSASignDemo — LAMPS draft-19 composite (HSM auto-forced)
 *     C1    id-MLDSA65-ECDSA-P256-SHA512
 *     C2    id-MLDSA44-RSA2048-PSS-SHA256
 *     C3    id-MLDSA87-ECDSA-P384-SHA512
 *
 *   MLKEMEncryptDemo (encrypt + decrypt)
 *     K1    ML-KEM-768 software
 *     K2    ML-KEM-768 HSM       (skips if provider missing)
 *
 *   DualSignDemo (multi-SignerInfo)
 *     D1    ML-DSA-65 + EC software
 *
 * Failing tests dump the captured worker console (filtered for crypto
 * relevance) + the visible body text, so the test output IS the diagnostic.
 */
import { test, expect, type Page, type Locator, type ConsoleMessage } from '@playwright/test'

const WORKSHOP_URL = '/learn/email-signing?tab=workshop&step=3'
const PROVIDER_INIT_TIMEOUT = 120_000
const PIPELINE_TIMEOUT = 240_000

// LAMPS draft-19 §6 — fixed sizes (FIPS 204 Table 1 for ML-DSA half).
const COMPOSITE_PROFILES = [
  {
    alg: 'id-MLDSA65-ECDSA-P256-SHA512',
    oid: '1.3.6.1.5.5.7.6.45',
    mldsaSize: 3309,
    classicalLabel: 'ECDSA-P256',
  },
  {
    alg: 'id-MLDSA44-RSA2048-PSS-SHA256',
    oid: '1.3.6.1.5.5.7.6.37',
    mldsaSize: 2420,
    classicalLabel: 'RSA-2048-PSS',
  },
  {
    alg: 'id-MLDSA87-ECDSA-P384-SHA512',
    oid: '1.3.6.1.5.5.7.6.49',
    mldsaSize: 4627,
    classicalLabel: 'ECDSA-P384',
  },
] as const

// ── helpers ──────────────────────────────────────────────────────────────────

async function suppressToast(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    } catch {
      /* ignore */
    }
  })
}

interface CapturedLog {
  type: ReturnType<ConsoleMessage['type']>
  text: string
}

/** Hook console + pageerror → captured array. Returns the array; the caller
 *  reads it after running the demo. The cms.worker.ts mirror lines appear
 *  here verbatim. */
function captureConsole(page: Page): CapturedLog[] {
  const lines: CapturedLog[] = []
  page.on('console', (msg) => {
    try {
      lines.push({ type: msg.type() as CapturedLog['type'], text: msg.text() })
    } catch {
      /* ignore */
    }
  })
  page.on('pageerror', (err) => {
    lines.push({ type: 'error', text: `pageerror: ${err.message}` })
  })
  return lines
}

/** Filter + flatten captured console for inclusion in a failure message.
 *  Keeps lines that look crypto-relevant; falls back to last 80 if none match. */
function formatLogs(lines: CapturedLog[]): string {
  const interesting = lines.filter((l) => {
    const t = l.text
    return (
      t.includes('composite') ||
      t.includes('cms.worker') ||
      t.includes('rc=') ||
      t.includes('pkcs11') ||
      t.includes('CKR_') ||
      t.includes('softhsm') ||
      t.includes('openssl') ||
      t.toLowerCase().includes('fail') ||
      t.toLowerCase().includes('error') ||
      l.type === 'error' ||
      l.type === 'warning'
    )
  })
  const pool = interesting.length > 0 ? interesting : lines
  return pool
    .slice(-200)
    .map((l) => `[${l.type}] ${l.text}`)
    .join('\n')
}

/** Find the demo container that DIRECTLY contains a heading matching `heading`.
 *
 * The heading h3 sits inside `<header> → <div.space-y-4>` (the demo root).
 * LiveHSMProvider's root is also `div.space-y-4` and transitively contains
 * all three demo headings — a descendant filter would match it first, giving
 * the wrong scope (all selects, not just the target demo's).
 *
 * Fix: start from the heading element itself and walk up two levels via xpath:
 *   h3 → header.space-y-1 → div.space-y-4 (demo root)
 */
function demoByHeading(page: Page, heading: RegExp): Locator {
  return page
    .getByRole('heading', { name: heading })
    .first()
    .locator('xpath=..') // h3 → <header>
    .locator('xpath=..') // <header> → demo root div.space-y-4
}

async function waitForProviderInit(page: Page): Promise<string> {
  await expect(
    page.getByText(/Loading openssl\.wasm and registering pkcs11-provider/i).first()
  ).not.toBeVisible({ timeout: PROVIDER_INIT_TIMEOUT })
  await expect(
    page
      .getByText(
        /Provider registered|Provider already registered|does not export pqctoday_cms_init|Provider init failed/i
      )
      .first()
  ).toBeVisible({ timeout: 10_000 })
  return page.evaluate(() => document.body.innerText)
}

async function isProviderRegistered(page: Page): Promise<boolean> {
  const body = await page.evaluate(() => document.body.innerText)
  return body.includes('Provider registered') || body.includes('Provider already registered')
}

/**
 * Drive the MLDSASignDemo with the given algorithm + HSM mode. Returns a
 * `{ ok, bodyText }` pair so the caller can assert success and optionally
 * inspect the result panel. Throws if neither the success nor failure
 * marker appears within PIPELINE_TIMEOUT.
 */
async function runSignDemo(
  page: Page,
  opts: { alg: string; useHsm: boolean }
): Promise<{ outcome: 'ok' | 'fail' | 'timeout'; bodyText: string }> {
  const demo = demoByHeading(page, /ML-DSA CMS sign \+ verify/i)
  await expect(demo).toBeVisible({ timeout: 10_000 })

  const select = demo.locator('select').first()
  await expect(select).toBeVisible({ timeout: 5_000 })
  await select.selectOption(opts.alg)

  // HSM mode handling. Composite OIDs auto-force HSM; for non-composite the
  // checkbox starts checked when the provider is ready, so we may need to
  // uncheck it for software-mode tests.
  const hsmCheckbox = demo.getByRole('checkbox', { name: /Use HSM key/i }).first()
  const composite = opts.alg.startsWith('id-MLDSA')
  if (!composite) {
    const checked = await hsmCheckbox.isChecked().catch(() => false)
    if (opts.useHsm && !checked) await hsmCheckbox.check()
    if (!opts.useHsm && checked) await hsmCheckbox.uncheck()
  }

  await demo
    .getByRole('button', { name: /Sign \+ Verify/i })
    .first()
    .click()

  const success = page
    .getByText(
      /(?:Both halves \(ML-DSA \+ classical\) verified|Signature verifies against signer cert)/i
    )
    .first()
  const failure = page.getByText(/Signature did NOT verify|composite.*(failed|rc=)/i).first()

  const outcome = (await Promise.race([
    success.waitFor({ state: 'visible', timeout: PIPELINE_TIMEOUT }).then(() => 'ok' as const),
    failure.waitFor({ state: 'visible', timeout: PIPELINE_TIMEOUT }).then(() => 'fail' as const),
  ]).catch(() => 'timeout' as const)) as 'ok' | 'fail' | 'timeout'

  // brief settle for the worker stderr mirror
  await page.waitForTimeout(250)

  const bodyText = await page.evaluate(() => document.body.innerText)
  return { outcome, bodyText }
}

async function runKemDemo(
  page: Page,
  opts: { alg: string; useHsm: boolean }
): Promise<{ outcome: 'ok' | 'fail' | 'timeout'; bodyText: string }> {
  const demo = demoByHeading(page, /ML-KEM CMS encrypt \+ decrypt/i)
  await expect(demo).toBeVisible({ timeout: 10_000 })

  const select = demo.locator('select').first()
  await expect(select).toBeVisible({ timeout: 5_000 })
  await select.selectOption(opts.alg)

  const hsmCheckbox = demo.getByRole('checkbox', { name: /Use HSM key/i }).first()
  const checked = await hsmCheckbox.isChecked().catch(() => false)
  if (opts.useHsm && !checked) await hsmCheckbox.check()
  if (!opts.useHsm && checked) await hsmCheckbox.uncheck()

  await demo
    .getByRole('button', { name: /Encrypt \+ Decrypt/i })
    .first()
    .click()

  const success = page.getByText(/Plaintext recovered via (?:software|HSM) key/i).first()
  const failure = page.getByText(/decrypt.*(failed|rc=)|Decryption failed/i).first()

  const outcome = (await Promise.race([
    success.waitFor({ state: 'visible', timeout: PIPELINE_TIMEOUT }).then(() => 'ok' as const),
    failure.waitFor({ state: 'visible', timeout: PIPELINE_TIMEOUT }).then(() => 'fail' as const),
  ]).catch(() => 'timeout' as const)) as 'ok' | 'fail' | 'timeout'

  await page.waitForTimeout(250)
  const bodyText = await page.evaluate(() => document.body.innerText)
  return { outcome, bodyText }
}

async function runDualDemo(
  page: Page,
  opts: { pqAlg: string; clAlg: string; useHsm: boolean }
): Promise<{ outcome: 'ok' | 'fail' | 'timeout'; bodyText: string }> {
  const demo = demoByHeading(page, /PQ \+ classical dual signature/i)
  await expect(demo).toBeVisible({ timeout: 10_000 })

  const selects = demo.locator('select')
  // First select = PQ alg, second select = classical alg
  await selects.nth(0).selectOption(opts.pqAlg)
  await selects.nth(1).selectOption(opts.clAlg)

  const hsmCheckbox = demo.getByRole('checkbox', { name: /Use HSM key/i }).first()
  const checked = await hsmCheckbox.isChecked().catch(() => false)
  if (opts.useHsm && !checked) await hsmCheckbox.check()
  if (!opts.useHsm && checked) await hsmCheckbox.uncheck()

  await demo
    .getByRole('button', { name: /Dual-sign \+ Verify/i })
    .first()
    .click()

  const success = page.getByText(/SignerInfos? verified —/i).first()
  const failure = page.getByText(/Verification failed|dual.*(failed|rc=)/i).first()

  const outcome = (await Promise.race([
    success.waitFor({ state: 'visible', timeout: PIPELINE_TIMEOUT }).then(() => 'ok' as const),
    failure.waitFor({ state: 'visible', timeout: PIPELINE_TIMEOUT }).then(() => 'fail' as const),
  ]).catch(() => 'timeout' as const)) as 'ok' | 'fail' | 'timeout'

  await page.waitForTimeout(250)
  const bodyText = await page.evaluate(() => document.body.innerText)
  return { outcome, bodyText }
}

/** Standard failure reporter — assembles the throw with captured console +
 *  visible body so test output is the diagnostic. */
function fail(label: string, outcome: string, logs: CapturedLog[], body: string): never {
  throw new Error(
    `${label}: did not reach a verified state (outcome=${outcome}).\n\n` +
      `=== Captured console (worker stderr mirror, OpenSSL ERR stack, page errors) ===\n` +
      `${formatLogs(logs)}\n\n` +
      `=== Visible body (first 4000) ===\n${body.slice(0, 4000)}`
  )
}

// ── tests ────────────────────────────────────────────────────────────────────

test.describe('S/MIME & CMS Workshop — comprehensive crypto E2E', () => {
  test.beforeEach(async ({ page }) => {
    await suppressToast(page)
  })

  // ── S0 — smoke: workshop renders + provider terminal ────────────────────────

  test('S0: workshop renders and pkcs11-provider reaches terminal state', async ({ page }) => {
    test.setTimeout(PROVIDER_INIT_TIMEOUT + 30_000)
    const logs = captureConsole(page)
    await page.goto(WORKSHOP_URL)
    await expect(page.getByText(/Step 4/i).first()).toBeVisible({ timeout: 60_000 })

    const body = await waitForProviderInit(page)
    const terminal = [
      'Provider registered',
      'Provider already registered',
      'does not export pqctoday_cms_init',
      'Provider init failed',
    ].some((p) => body.includes(p))
    if (!terminal) {
      fail('S0', 'no-terminal-banner', logs, body)
    }

    console.log('[cms-workshop] S0 PASS — provider init terminal')
  })

  // ── MLDSASignDemo: software + HSM × multiple algorithms ─────────────────────

  const SIGN_CASES = [
    { id: 'M1', alg: 'ML-DSA-65', useHsm: false, skipIfNoProvider: false },
    { id: 'M2', alg: 'ML-DSA-65', useHsm: true, skipIfNoProvider: true },
    { id: 'M3', alg: 'ML-DSA-87', useHsm: false, skipIfNoProvider: false },
    { id: 'M4', alg: 'SLH-DSA-SHA2-128s', useHsm: false, skipIfNoProvider: false },
    { id: 'M5', alg: 'EC', useHsm: false, skipIfNoProvider: false },
    { id: 'M6', alg: 'RSA-PSS', useHsm: false, skipIfNoProvider: false },
  ] as const

  for (const c of SIGN_CASES) {
    test(`${c.id}: MLDSASignDemo · ${c.alg} · ${c.useHsm ? 'HSM' : 'software'}`, async ({
      page,
    }) => {
      test.setTimeout(PROVIDER_INIT_TIMEOUT + PIPELINE_TIMEOUT)
      const logs = captureConsole(page)
      await page.goto(WORKSHOP_URL)
      await waitForProviderInit(page)
      if (c.skipIfNoProvider && !(await isProviderRegistered(page))) {
        test.skip(true, 'pkcs11-provider not registered')
        return
      }

      const r = await runSignDemo(page, { alg: c.alg, useHsm: c.useHsm })
      if (r.outcome !== 'ok') fail(`${c.id} (${c.alg})`, r.outcome, logs, r.bodyText)
      // outcome='ok' already required the success marker visible in the DOM.
      // The recovered-payload <pre> lives in a collapsed <details> + textarea
      // values aren't in innerText, so we don't dredge for the payload here.
      // The exact-bytes KAT lives in cms-hsm-sign.spec.ts (T2/T3).
      console.log(`[cms-workshop] ${c.id} PASS — ${c.alg} ${c.useHsm ? 'HSM' : 'sw'}`)
    })
  }

  // ── LAMPS composite (HSM auto-forced) ───────────────────────────────────────

  for (const profile of COMPOSITE_PROFILES) {
    test(`composite: ${profile.alg} mkcert + sign + verify`, async ({ page }) => {
      test.setTimeout(PROVIDER_INIT_TIMEOUT + PIPELINE_TIMEOUT)
      const logs = captureConsole(page)
      await page.goto(WORKSHOP_URL)
      await waitForProviderInit(page)
      if (!(await isProviderRegistered(page))) {
        test.skip(true, 'pkcs11-provider not registered — composite requires it')
        return
      }

      const r = await runSignDemo(page, { alg: profile.alg, useHsm: true })
      if (r.outcome !== 'ok') {
        fail(`composite ${profile.alg}`, r.outcome, logs, r.bodyText)
      }

      // Composite breakdown rows must be visible — a placeholder fallback to
      // pure ML-DSA wouldn't display the composite OID or the classical half.
      const missing: string[] = []
      if (!r.bodyText.includes(profile.oid)) missing.push(`OID ${profile.oid}`)
      if (!r.bodyText.includes(String(profile.mldsaSize)))
        missing.push(`ML-DSA size ${profile.mldsaSize} B`)
      if (!r.bodyText.includes(profile.classicalLabel))
        missing.push(`classical label ${profile.classicalLabel}`)
      if (missing.length > 0) {
        throw new Error(
          `composite ${profile.alg}: verify succeeded but breakdown rows missing.\n` +
            `Missing: ${JSON.stringify(missing)}\n\n` +
            `=== Captured console ===\n${formatLogs(logs)}\n\n` +
            `=== Body (first 4000) ===\n${r.bodyText.slice(0, 4000)}`
        )
      }

      console.log(
        `[cms-workshop] composite ${profile.alg} PASS — oid=${profile.oid} ` +
          `mldsa=${profile.mldsaSize}B classical=${profile.classicalLabel}`
      )
    })
  }

  // ── MLKEMEncryptDemo: software + HSM ────────────────────────────────────────

  test('K1: MLKEMEncryptDemo · ML-KEM-768 · software', async ({ page }) => {
    test.setTimeout(PROVIDER_INIT_TIMEOUT + PIPELINE_TIMEOUT)
    const logs = captureConsole(page)
    await page.goto(WORKSHOP_URL)
    await waitForProviderInit(page)

    const r = await runKemDemo(page, { alg: 'ML-KEM-768', useHsm: false })
    if (r.outcome !== 'ok') fail('K1 (ML-KEM-768 sw)', r.outcome, logs, r.bodyText)
    // outcome='ok' required "Plaintext recovered via … key" to be in DOM.
    console.log('[cms-workshop] K1 PASS — ML-KEM-768 software')
  })

  test('K2: MLKEMEncryptDemo · ML-KEM-768 · HSM', async ({ page }) => {
    test.setTimeout(PROVIDER_INIT_TIMEOUT + PIPELINE_TIMEOUT)
    const logs = captureConsole(page)
    await page.goto(WORKSHOP_URL)
    await waitForProviderInit(page)
    if (!(await isProviderRegistered(page))) {
      test.skip(true, 'pkcs11-provider not registered')
      return
    }

    const r = await runKemDemo(page, { alg: 'ML-KEM-768', useHsm: true })
    if (r.outcome !== 'ok') fail('K2 (ML-KEM-768 HSM)', r.outcome, logs, r.bodyText)
    // outcome='ok' required "Plaintext recovered via … key" to be in DOM.
    console.log('[cms-workshop] K2 PASS — ML-KEM-768 HSM')
  })

  // ── DualSignDemo: software multi-SignerInfo ─────────────────────────────────

  test('D1: DualSignDemo · ML-DSA-65 + EC · software', async ({ page }) => {
    test.setTimeout(PROVIDER_INIT_TIMEOUT + PIPELINE_TIMEOUT)
    const logs = captureConsole(page)
    await page.goto(WORKSHOP_URL)
    await waitForProviderInit(page)

    const r = await runDualDemo(page, { pqAlg: 'ML-DSA-65', clAlg: 'EC', useHsm: false })
    if (r.outcome !== 'ok') fail('D1 (dual ML-DSA-65 + EC sw)', r.outcome, logs, r.bodyText)
    // outcome='ok' required the "SignerInfos verified —" marker in the DOM.
    expect(r.bodyText).toMatch(/SignerInfos? verified —/i)
    console.log('[cms-workshop] D1 PASS — dual sign+verify')
  })
})
