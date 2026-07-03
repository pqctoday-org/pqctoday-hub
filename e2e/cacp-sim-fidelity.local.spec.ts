// SPDX-License-Identifier: GPL-3.0-only
//
// CACP visual-sim FIDELITY audit — beyond verdict parity, does what the graph
// SHOWS match what the engine DOES? For every scenario we compare, engine vs
// sim: verdict kind, resolved algorithm, rekey from→to, deny reason, and the
// DECIDER rule (engine `rule` index vs the sim's deciderId position — that's the
// node the graph ring-highlights and branches to the sink).
/* eslint-disable security/detect-object-injection -- indices/keys from the fixed scenario dataset. */
import { test, expect } from '@playwright/test'

interface Row {
  id: string
  policyFile: string
  eKind: string
  sKind: string
  eAlgo: string
  sAlgo: string
  eFrom: string
  eTo: string
  sFrom: string
  sTo: string
  eRule: number | null
  sDecider: number | null
  eReason: string
  sReason: string
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
  })
})

test('visual sim fidelity vs engine — verdict, algorithm, rekey, decider, reason', async ({
  page,
}) => {
  await page.goto('/playground/cacp')
  await expect(page.getByRole('heading', { name: /Crypto-Agility Control Plane/i })).toBeVisible({
    timeout: 30000,
  })

  const rows: Row[] = await page.evaluate(async () => {
    const eng = await import('/src/wasm/kmip/kmipEngine.ts')
    const model = await import('/src/components/Playground/kmip/visual/policyEditModel.ts')
    const sim = await import('/src/components/Playground/kmip/visual/policySim.ts')
    const scen = await import('/src/components/Playground/kmip/policyScenarios.ts')
    const engine = await eng.getKmipEngine()

    const yamlCache: Record<string, string> = {}
    const loadYaml = async (f: string) => {
      if (!yamlCache[f]) yamlCache[f] = await fetch(`/kmip-policies/${f}`).then((r) => r.text())
      return yamlCache[f]
    }

    const out: Row[] = []
    for (const s of scen.POLICY_SCENARIOS) {
      const yaml = await loadYaml(s.policyFile)
      engine.loadPolicy(yaml)
      const r = s.request
      const isNew = /^(Create|CreateKeyPair|Register|Import)/.test(r.op)

      let dr: {
        kind: string
        algorithm?: string | null
        from?: string
        to?: string
        rule?: number | null
        reason?: string
        denyReason?: string
      } = { kind: 'ERR' }
      try {
        dr = engine.dryRun({
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
      } catch (e) {
        dr = { kind: 'ERR:' + String(e) }
      }

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
      const sDecider =
        res.deciderId == null ? null : editable.rules.findIndex((x) => x.id === res.deciderId)

      out.push({
        id: s.id,
        policyFile: s.policyFile.replace('.yaml', ''),
        eKind: dr.kind,
        sKind: res.verdict.kind.charAt(0).toUpperCase() + res.verdict.kind.slice(1),
        eAlgo: dr.algorithm ?? '',
        sAlgo: res.verdict.algorithm ?? '',
        eFrom: dr.from ?? '',
        eTo: dr.to ?? '',
        sFrom: res.verdict.from ?? '',
        sTo: res.verdict.to ?? '',
        eRule: dr.rule ?? null,
        sDecider,
        eReason: dr.reason ?? dr.denyReason ?? '',
        sReason: res.verdict.reason ?? '',
      })
    }
    return out
  })

  // ── Compare each fidelity dimension ──
  const lc = (s: string) => s.toLowerCase()
  const algoFail = rows.filter(
    (r) =>
      r.eKind === 'Allow' && r.sKind === 'Allow' && lc(r.eAlgo) !== lc(r.sAlgo) && r.eAlgo !== ''
  )
  const rekeyFail = rows.filter(
    (r) =>
      r.eKind === 'Rekey' &&
      r.sKind === 'Rekey' &&
      (lc(r.eFrom) !== lc(r.sFrom) || lc(r.eTo) !== lc(r.sTo))
  )
  // Decider: engine `rule` (1-based rule number) vs sim decider position
  // (0-based array index). The UI shows nodes 1-based (#index+1), so a sim node
  // at index i is displayed as #(i+1) and should equal the engine's rule number.
  // A "consistent" decider therefore means engine.rule === sim.index + 1.
  const deciderChecked = rows.filter((r) => r.eRule != null && r.sDecider != null)
  const deciderConsistent = deciderChecked.filter((r) => r.eRule === (r.sDecider as number) + 1)
  const deciderReal = deciderChecked.filter((r) => r.eRule !== (r.sDecider as number) + 1)
  const deciderNull = rows.filter((r) => r.eRule == null)

  // Deny reason text shown by the sim vs the engine's reason.
  const reasonFail = rows.filter(
    (r) => r.eKind === 'Deny' && r.sKind === 'Deny' && lc(r.eReason.trim()) !== lc(r.sReason.trim())
  )

  const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n)
  console.log('\n──────── FIDELITY MATRIX ────────')
  console.log(
    pad('scenario', 28) +
      pad('kind', 12) +
      pad('algo(e/s)', 30) +
      pad('rekey(e/s)', 26) +
      'decider(e/s)'
  )
  for (const r of rows) {
    const kind = r.eKind === r.sKind ? r.eKind : `${r.eKind}!=${r.sKind}`
    const algo = r.eKind === 'Allow' ? `${r.eAlgo || '—'} / ${r.sAlgo || '—'}` : ''
    const rk = r.eKind === 'Rekey' ? `${r.eFrom}->${r.eTo} / ${r.sFrom}->${r.sTo}` : ''
    const dec = `${r.eRule ?? 'null'} / ${r.sDecider ?? 'null'}`
    console.log(pad(r.id, 28) + pad(kind, 12) + pad(algo, 30) + pad(rk, 26) + dec)
  }

  console.log('\n── DIMENSION RESULTS ──')
  console.log(`resolved-algorithm mismatches: ${algoFail.length}`)
  algoFail.forEach((r) => console.log(`   ${r.id}: engine ${r.eAlgo} vs sim ${r.sAlgo}`))
  console.log(`rekey from→to mismatches: ${rekeyFail.length}`)
  rekeyFail.forEach((r) =>
    console.log(`   ${r.id}: engine ${r.eFrom}→${r.eTo} vs sim ${r.sFrom}→${r.sTo}`)
  )
  console.log(
    `decider (engine 1-based == sim 0-based +1): ${deciderConsistent.length}/${deciderChecked.length} consistent`
  )
  console.log(`  REAL decider mismatches (not off-by-one): ${deciderReal.length}`)
  deciderReal.forEach((r) =>
    console.log(`   ${r.id}: engine rule ${r.eRule} vs sim node ${r.sDecider}`)
  )
  console.log(`  engine gave no rule index (Allow/Rekey — decider N/A): ${deciderNull.length}`)
  console.log(`deny-reason text mismatches: ${reasonFail.length}`)
  reasonFail.forEach((r) => console.log(`   ${r.id}: engine "${r.eReason}" vs sim "${r.sReason}"`))

  console.log('\n── VERDICT ──')
  console.log(
    `Every engine-observable dimension matches the sim: ` +
      `algo=${algoFail.length === 0}, rekey=${rekeyFail.length === 0}, ` +
      `decider=${deciderReal.length === 0}, reason=${reasonFail.length === 0}`
  )

  // Hard-gate the dimensions the engine actually exposes.
  expect(algoFail, 'resolved-algorithm mismatches').toEqual([])
  expect(rekeyFail, 'rekey from→to mismatches').toEqual([])
  expect(deciderReal, 'real decider mismatches (beyond 0/1-based numbering)').toEqual([])
  expect(reasonFail, 'deny-reason text mismatches').toEqual([])
})
