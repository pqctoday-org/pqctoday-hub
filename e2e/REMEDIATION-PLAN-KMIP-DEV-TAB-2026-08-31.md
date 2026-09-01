# KMIP Dev-Tab Restructure — E2E Remediation Plan — 2026-08-31

One item. The 2026-08-31 KMIP navigation restructure (top-level "Developer"
plane folded into the KMIP3.0 tab's new "Dev" sub-tab, alongside a
newly-nested Corpus Replay — mirroring the PKCS#11 side's existing Developer
tab) broke one unrelated, pre-existing smoke spec that still assumes the old
flat tab layout. Confirmed by running it live against the current dev
server, not inferred from the diff.

---

## 1.1 — `wasm-refresh-smoke`: "Corpus Replay" is no longer a direct child of `kmip3-subtabs`

- **Symptom:** the test times out clicking `Corpus Replay` inside the
  `[data-tour="kmip3-subtabs"]` tablist:
  ```
  TimeoutError: locator.click: Timeout 15000ms exceeded.
  waiting for locator('[data-tour="kmip3-subtabs"]').getByRole('tab', { name: 'Corpus Replay' })
  ```
- **Root cause:** [wasm-refresh-smoke.local.spec.ts:61](wasm-refresh-smoke.local.spec.ts#L61)
  was written when the KMIP3.0 tab bar was Learn/Commands/**Corpus
  Replay**/Batch & Macros. The restructure changed that bar to
  Learn/Commands/**Dev**/Batch & Macros and moved Corpus Replay one level
  down, as a sibling of Pipeline inside Dev's own
  `[data-tour="kmip-dev-subtabs"]` tablist
  ([KmipDevTab.tsx](../src/components/Playground/kmip/KmipDevTab.tsx)). The
  spec still targets the old, now-absent direct child.
- **Why it wasn't caught during the restructure:** the migration swept
  [dev-tab-kmip.local.spec.ts](dev-tab-kmip.local.spec.ts) (the spec that
  actually owns this feature) but the initial repo-wide grep for stale
  references was scoped too narrowly to catch a one-off smoke spec outside
  that file. A fresh, wider grep across all of `e2e/` (`grep -rl "Corpus
Replay" e2e`) is what surfaced it.
- **Everything else in the file is unaffected** — the Policy plane
  assertion (line 47-48), the top-level `KMIP3.0` tab click (line 51), and
  the `Learn`/`Commands` sub-tab clicks (lines 55-59) all still target
  structure the restructure didn't touch.
- **Fix (test-only):** open Dev first, then scope the Corpus Replay click to
  its nested tablist — same pattern already used by
  [dev-tab-kmip.local.spec.ts](dev-tab-kmip.local.spec.ts)'s own
  `gotoKmipDevTab` helper:

  ```diff
     await subTabs.getByRole('tab', { name: 'Commands' }).click()
     await expect(page.getByText(/Register/).first()).toBeVisible({ timeout: 10000 })

  -  await subTabs.getByRole('tab', { name: 'Corpus Replay' }).click()
  -  await page.waitForTimeout(500)
  +  await subTabs.getByRole('tab', { name: 'Dev' }).click()
  +  const devSubTabs = page.locator('[data-tour="kmip-dev-subtabs"]')
  +  await devSubTabs.getByRole('tab', { name: 'Corpus Replay' }).click()
  +  await page.waitForTimeout(500)
  ```

- **Files:** [e2e/wasm-refresh-smoke.local.spec.ts](wasm-refresh-smoke.local.spec.ts).
  No app changes.
- **Verify:**
  `E2E_SERVER=dev npx playwright test e2e/wasm-refresh-smoke.local.spec.ts`
  → green, no console errors.
- **Effort:** trivial (~2 min, 4-line diff). **Risk:** none (test-only,
  isolated file). **Type:** test-only.

---

## Definition of done

- The diff above applied.
- `E2E_SERVER=dev npx playwright test e2e/wasm-refresh-smoke.local.spec.ts`
  passes.
- No other file needs touching — this is the only reference to the old
  flat Corpus-Replay-on-`kmip3-subtabs` layout found in a full `e2e/` sweep.
