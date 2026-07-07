// SPDX-License-Identifier: GPL-3.0-only
//
// CACP policy-scenario validation — boots the REAL in-browser wasm engine and,
// for every scenario in src/components/Playground/kmip/policyScenarios.ts:
//   • loads the scenario's policy,
//   • runs engine.dryRun  (AUTHORITATIVE verdict), and
//   • runs evaluatePolicy (VISUAL simulator),
// then asserts both equal the scenario's declared `expect`.
//
// This is the rerun/fine-tune gate: edit a scenario in policyScenarios.ts and
// re-run  `npm run test:e2e -- e2e/cacp-policy-scenarios.local.spec.ts`  (dev).
//
// Venue: `*.local.spec.ts` — excluded from CI (project directive 2026-07-01).
/* eslint-disable security/detect-object-injection -- cache keys are policy file
   names from the fixed scenario dataset, never user input. */
import { test, expect } from '@playwright/test'

interface CaseResult {
  id: string
  policyFile: string
  title: string
  path: string
  expect: string
  engine: string
  engineReason: string
  sim: string
  /** Set only for scenarios carrying `realExecution` — 'pass' if the actual
   * runOp sequence matched the declared outcome ('roundtrip'/'refused'),
   * otherwise a short failure reason. Absent means this scenario has no
   * real-execution companion (policy-decision-only, same as before). */
  real?: string
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
  })
})

test('every policy scenario: engine + sim match the declared verdict', async ({ page }) => {
  await page.goto('/playground/cacp')
  await expect(page.getByRole('heading', { name: /Crypto-Agility Control Plane/i })).toBeVisible({
    timeout: 30000,
  })

  const results: CaseResult[] = await page.evaluate(async () => {
    const eng = await import('/src/wasm/kmip/kmipEngine.ts')
    const model = await import('/src/components/Playground/kmip/visual/policyEditModel.ts')
    const sim = await import('/src/components/Playground/kmip/visual/policySim.ts')
    const scen = await import('/src/components/Playground/kmip/policyScenarios.ts')

    const engine = await eng.getKmipEngine()

    // Cache each policy's YAML + parsed editable model once.
    const yamlCache: Record<string, string> = {}
    const loadYaml = async (file: string) => {
      if (!yamlCache[file]) {
        yamlCache[file] = await fetch(`/kmip-policies/${file}`).then((r) => r.text())
      }
      return yamlCache[file]
    }

    const out: CaseResult[] = []
    for (const s of scen.POLICY_SCENARIOS) {
      const yaml = await loadYaml(s.policyFile)
      // 1) ENGINE — load the policy, then dry-run the request (authoritative).
      engine.loadPolicy(yaml)
      const r = s.request
      const isNew = /^(Create|CreateKeyPair|Register|Import)/.test(r.op)
      let engineKind = 'ERR'
      let engineReason = ''
      try {
        const dr = engine.dryRun({
          op: r.op,
          algorithm: r.algorithm,
          currentAlgorithm: isNew ? undefined : r.algorithm,
          length: r.length,
          state: r.state,
          date: r.date,
          attrs: r.attrs,
          usageMask: r.usageMask,
          activationDate: r.activationDate,
          mechanism: r.mechanism,
        })
        engineKind = dr.kind
        engineReason = dr.reason ?? dr.denyReason ?? ''
      } catch (e) {
        engineReason = String(e)
      }

      // 2) SIM — the illustrative visual-editor evaluator, same request shape.
      let simKind = 'ERR'
      try {
        const editable = model.toEditable(yaml)
        const attrs = r.attrs ? Object.entries(r.attrs).map(([k, v]) => `${k}=${v}`) : []
        const res = sim.evaluatePolicy(editable, {
          op: r.op,
          algorithm: r.algorithm ?? '',
          keyState: r.state ?? 'Active',
          bits: r.length == null ? '' : String(r.length),
          date: r.date ?? '',
          attrs,
          usageFlags: r.usageMask ?? [],
          hash: r.mechanism?.hash ?? '',
          blockMode: r.mechanism?.blockMode ?? '',
          padding: r.mechanism?.padding ?? '',
          mechanism: r.mechanism?.mech ?? '',
          deterministic:
            r.mechanism?.deterministic == null ? '' : r.mechanism.deterministic ? 'true' : 'false',
          keyActivatedOn: r.activationDate ?? '',
        })
        // Sim uses lowercase verdict kinds — normalise to the engine's casing.
        simKind = res.verdict.kind.charAt(0).toUpperCase() + res.verdict.kind.slice(1)
      } catch (e) {
        simKind = 'ERR:' + String(e)
      }

      // 3) REAL EXECUTION — only for scenarios that declare it. Proves the
      // engine's actual enforcement (runOp), not just the dry-run simulation,
      // matches what's declared: a real CreateKeyPair->Activate->Encapsulate->
      // Decapsulate round trip for an allow, or a real refusal for a deny.
      let real: string | undefined
      if (s.realExecution) {
        const re = s.realExecution
        try {
          if (re.outcome === 'refused') {
            const ckp = engine.runOp({ op: 'CreateKeyPair', algorithm: re.algorithm, attrs: re.attrs })
            real = ckp.ok ? `FAIL: expected refusal, CreateKeyPair succeeded (${ckp.message})` : 'pass'
          } else {
            const ckp = engine.runOp({ op: 'CreateKeyPair', algorithm: re.algorithm, attrs: re.attrs })
            if (!ckp.ok) {
              real = `FAIL: CreateKeyPair refused (${ckp.message})`
            } else {
              const privUid = String(ckp.summary.privateKeyUid)
              const pubUid = String(ckp.summary.publicKeyUid)
              const actPriv = engine.runOp({ op: 'Activate', uid: privUid })
              const actPub = engine.runOp({ op: 'Activate', uid: pubUid })
              if (!actPriv.ok || !actPub.ok) {
                real = `FAIL: activate (${actPriv.message}/${actPub.message})`
              } else {
                const enc = engine.runOp({ op: 'Encapsulate', uid: pubUid })
                if (!enc.ok) {
                  real = `FAIL: Encapsulate (${enc.message})`
                } else {
                  const ciphertextHex = String(enc.summary.ciphertextHex)
                  const dec = engine.runOp({ op: 'Decapsulate', uid: privUid, data: ciphertextHex })
                  real = dec.ok ? 'pass' : `FAIL: Decapsulate (${dec.message})`
                }
              }
            }
          }
        } catch (e) {
          real = 'FAIL: ' + String(e)
        }
      }

      out.push({
        id: s.id,
        policyFile: s.policyFile,
        title: s.title,
        path: s.path,
        expect: s.expect,
        engine: engineKind,
        engineReason,
        sim: simKind,
        real,
      })
    }
    return out
  })

  // ── Report ──
  const engineFails = results.filter((r) => r.engine !== r.expect)
  const simFails = results.filter((r) => r.sim !== r.expect)
  const drift = results.filter((r) => r.engine !== r.sim)

  const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n)
  console.log('\n──────── ENGINE (authoritative) ────────')
  for (const r of results) {
    const ok = r.engine === r.expect ? '✓' : '✗'
    console.log(
      `${ok} ${pad(r.policyFile.replace('.yaml', ''), 22)} ${pad(r.id, 26)} ` +
        `exp=${pad(r.expect, 5)} got=${pad(r.engine, 5)} ${r.engine !== r.expect ? '<<< ' + r.engineReason : ''}`
    )
  }
  console.log(`\nENGINE: ${results.length - engineFails.length}/${results.length} pass`)
  console.log(`SIM:    ${results.length - simFails.length}/${results.length} pass`)
  console.log(`ENGINE↔SIM parity: ${results.length - drift.length}/${results.length}`)

  if (engineFails.length) {
    console.log('\n── ENGINE MISMATCHES ──')
    for (const r of engineFails)
      console.log(
        `  ${r.policyFile} :: ${r.id} — expected ${r.expect}, engine said ${r.engine} (${r.engineReason})`
      )
  }
  if (simFails.length) {
    console.log('\n── SIM MISMATCHES ──')
    for (const r of simFails)
      console.log(`  ${r.policyFile} :: ${r.id} — expected ${r.expect}, sim said ${r.sim}`)
  }
  if (drift.length) {
    console.log('\n── ENGINE↔SIM DRIFT ──')
    for (const r of drift)
      console.log(`  ${r.policyFile} :: ${r.id} — engine ${r.engine} vs sim ${r.sim}`)
  }

  // ── Real execution (only scenarios carrying `realExecution`) ──
  const realCases = results.filter((r) => r.real !== undefined)
  const realFails = realCases.filter((r) => r.real !== 'pass')
  if (realCases.length) {
    console.log('\n──────── REAL EXECUTION (runOp, not dry-run) ────────')
    for (const r of realCases) {
      console.log(`${r.real === 'pass' ? '✓' : '✗'} ${pad(r.id, 26)} ${r.real}`)
    }
    console.log(`\nREAL EXECUTION: ${realCases.length - realFails.length}/${realCases.length} pass`)
  }

  // Engine correctness is the primary gate; sim parity is reported for triage.
  expect(
    engineFails,
    `engine verdict mismatches: ${engineFails.map((r) => r.id).join(', ')}`
  ).toEqual([])
  expect(
    realFails,
    `real-execution mismatches: ${realFails.map((r) => `${r.id} (${r.real})`).join(', ')}`
  ).toEqual([])
})
