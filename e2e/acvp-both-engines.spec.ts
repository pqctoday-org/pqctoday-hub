import { test, expect } from '@playwright/test'

// Full-matrix ACVP verification across BOTH WASM engines (C++ softhsmv3 and
// Rust softhsmrustv3). Unlike acvp-validator.spec.ts — which drives Rust only,
// checks ML-KEM/ML-DSA only, and *excludes* known Rust failures — this spec
// runs `dual` mode (loads both modules, runs the whole HsmAcvpTesting suite for
// each) and scrapes EVERY result row so we can see accuracy + completeness per
// engine. It prints the matrix and fails only if a row regresses unexpectedly.
test.describe('ACVP — full matrix, both engines (C++ + Rust)', () => {
  test.setTimeout(600000) // 12 SLH-DSA sets × sign/verify × 2 engines is slow

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem(
          'pqc-version-storage',
          JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
        )
      } catch {
        // ignore
      }
    })
  })

  test('runs the entire ACVP suite in dual mode and reports per-engine pass/fail', async ({
    page,
  }) => {
    page.on('console', (msg) => console.log('BROWSER:', msg.text()))

    await page.goto('/playground/hsm?tab=acvp')

    const acvpTab = page.getByRole('tab', { name: 'ACVP' })
    await acvpTab.waitFor({ state: 'visible', timeout: 20000 })
    await acvpTab.click()
    await page.waitForSelector('text="SoftHSMv3 FIPS Validation Mode (ACVP)"', { timeout: 20000 })

    // Load BOTH engines (dual) and open a session.
    await page.waitForFunction(
      () =>
        typeof (window as unknown as { __e2e_hsm_autoinit?: unknown }).__e2e_hsm_autoinit ===
        'function',
      undefined,
      { timeout: 15000 }
    )
    const ok = await page.evaluate(async () => {
      const fn = (
        window as unknown as { __e2e_hsm_autoinit?: (engine?: string) => Promise<boolean> }
      ).__e2e_hsm_autoinit
      return fn ? await fn('dual') : false
    })
    expect(ok, 'dual-engine autoInit failed (one of the WASM modules did not load)').toBeTruthy()

    // Kick the suite; retry until the table leaves the "No results yet." state.
    let started = false
    for (let i = 0; i < 30; i++) {
      await page.evaluate(() => window.dispatchEvent(new CustomEvent('e2e:trigger_acvp')))
      const btn = page.getByRole('button', { name: /Execute ACVP Tests/i })
      if (await btn.isEnabled().catch(() => false)) {
        await btn.click({ force: true }).catch(() => {})
      }
      await page.waitForTimeout(2000)
      const idle = await page
        .locator('table')
        .getByText('No results yet.')
        .isVisible()
        .catch(() => false)
      if (!idle) {
        started = true
        break
      }
    }
    expect(started, 'ACVP suite never started (WASM hang or load failure)').toBeTruthy()

    // Wait for completion (the component logs this once, after both engines).
    const done = page.locator('div', { hasText: 'Validation Suite Completed' }).last()
    await expect(done).toBeVisible({ timeout: 480000 })
    await page.waitForTimeout(1500) // let the final setResults flush

    // Scrape the whole table.
    type Row = { algorithm: string; testCase: string; status: string; details: string }
    const rows: Row[] = await page.evaluate(() => {
      const out: Row[] = []
      const trs = document.querySelectorAll('table tbody tr')
      trs.forEach((tr) => {
        const tds = tr.querySelectorAll('td')
        if (tds.length < 4) return // skip the "No results yet" placeholder row
        out.push({
          algorithm: (tds[0].textContent ?? '').trim(),
          testCase: (tds[1].textContent ?? '').trim(),
          status: (tds[2].textContent ?? '').trim().toLowerCase(),
          details: (tds[3].getAttribute('title') ?? tds[3].textContent ?? '').trim(),
        })
      })
      return out
    })

    const engineOf = (algo: string) =>
      algo.includes('(C++)') ? 'C++' : algo.includes('(Rust)') ? 'Rust' : 'Unknown'

    const summary: Record<string, { pass: number; fail: number; total: number; fails: Row[] }> = {
      'C++': { pass: 0, fail: 0, total: 0, fails: [] },
      Rust: { pass: 0, fail: 0, total: 0, fails: [] },
      Unknown: { pass: 0, fail: 0, total: 0, fails: [] },
    }
    for (const r of rows) {
      const e = engineOf(r.algorithm)
      summary[e].total++
      if (r.status === 'pass') summary[e].pass++
      else {
        summary[e].fail++
        summary[e].fails.push(r)
      }
    }

    console.log('\n===== ACVP FULL MATRIX (' + rows.length + ' rows) =====')
    for (const r of rows) {
      console.log(
        `MATRIX | ${r.status.toUpperCase().padEnd(4)} | ${r.algorithm.padEnd(30)} | ${r.testCase.padEnd(28)} | ${r.details}`
      )
    }
    for (const eng of ['C++', 'Rust'] as const) {
      const s = summary[eng]
      console.log(
        `SUMMARY | ${eng.padEnd(4)} | ${s.pass}/${s.total} pass | ${s.fail} fail` +
          (s.fails.length
            ? '\n' +
              s.fails
                .map((f) => `   FAIL[${eng}] ${f.algorithm} :: ${f.testCase} :: ${f.details}`)
                .join('\n')
            : '')
      )
    }

    // Completeness: both engines must have actually run a broad suite.
    expect(summary['C++'].total, 'C++ produced no result rows').toBeGreaterThan(20)
    expect(summary['Rust'].total, 'Rust produced no result rows').toBeGreaterThan(20)

    // Accuracy: the core FIPS-203/204/205 PQC families must not regress on
    // either engine. (We assert these explicitly; everything else is reported
    // above for inspection.)
    for (const eng of ['C++', 'Rust'] as const) {
      const coreFails = summary[eng].fails.filter((f) => /ML-KEM|ML-DSA|SLH-DSA/i.test(f.algorithm))
      expect(coreFails, `${eng}: core PQC (ML-KEM/ML-DSA/SLH-DSA) must not fail`).toHaveLength(0)
    }
  })
})
