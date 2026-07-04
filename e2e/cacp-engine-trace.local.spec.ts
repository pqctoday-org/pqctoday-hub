// SPDX-License-Identifier: GPL-3.0-only
//
// Engine per-rule TRACE validation — the wasm engine now returns a `trace`
// (one entry per enabled rule: resolve/deny/pass/skip) that drives the visual
// simulator's node highlighting. This asserts the trace is well-formed and
// self-consistent with the engine's own verdict for every scenario, so what the
// graph highlights is engine-truth.
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
  })
})

test('engine dry_run returns a per-rule trace consistent with its verdict', async ({ page }) => {
  await page.goto('/playground/cacp')
  await expect(page.getByRole('heading', { name: /Crypto-Agility Control Plane/i })).toBeVisible({
    timeout: 30000,
  })

  const rows = await page.evaluate(async () => {
    const eng = await import('/src/wasm/kmip/kmipEngine.ts')
    const model = await import('/src/components/Playground/kmip/visual/policyEditModel.ts')
    const scen = await import('/src/components/Playground/kmip/policyScenarios.ts')
    const engine = await eng.getKmipEngine()

    const yamlCache: Record<string, string> = {}

    const loadYaml = async (f: string) => {
      // eslint-disable-next-line security/detect-object-injection
      if (!yamlCache[f]) yamlCache[f] = await fetch(`/kmip-policies/${f}`).then((r) => r.text())
      // eslint-disable-next-line security/detect-object-injection
      return yamlCache[f]
    }

    const out: {
      id: string
      kind: string
      rule: number | null
      traceLen: number
      ruleCount: number
      denyIndices: number[]
      effects: string[]
    }[] = []
    for (const s of scen.POLICY_SCENARIOS) {
      const yaml = await loadYaml(s.policyFile)
      engine.loadPolicy(yaml)
      const r = s.request
      const isNew = /^(Create|CreateKeyPair|Register|Import)/.test(r.op)
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
      const trace = dr.trace ?? []
      out.push({
        id: s.id,
        kind: dr.kind,
        rule: dr.rule ?? null,
        traceLen: trace.length,
        ruleCount: model.toEditable(yaml).rules.length,
        denyIndices: trace.filter((t) => t.effect === 'deny').map((t) => t.index),
        effects: trace.map((t) => t.effect),
      })
    }
    return out
  })

  const problems: string[] = []
  for (const r of rows) {
    // 1. A trace exists, one entry per enabled rule (shipped policies enable all).
    if (r.traceLen === 0 && r.ruleCount > 0)
      problems.push(`${r.id}: empty trace (expected ${r.ruleCount})`)
    if (r.traceLen !== r.ruleCount)
      problems.push(`${r.id}: trace len ${r.traceLen} != rule count ${r.ruleCount}`)
    // 2. Effects are from the known vocabulary.
    for (const e of r.effects)
      if (!['resolve', 'deny', 'pass', 'skip'].includes(e))
        problems.push(`${r.id}: unknown effect "${e}"`)
    // 3. Deny verdict ⇒ exactly one 'deny' entry, at the engine's fired rule.
    if (r.kind === 'Deny') {
      if (r.denyIndices.length !== 1)
        problems.push(`${r.id}: Deny but ${r.denyIndices.length} deny-trace entries`)
      else if (r.denyIndices[0] !== r.rule)
        problems.push(`${r.id}: deny-trace index ${r.denyIndices[0]} != verdict rule ${r.rule}`)
    } else {
      // 4. Allow/Rekey ⇒ no 'deny' entry.
      if (r.denyIndices.length > 0)
        problems.push(`${r.id}: ${r.kind} but has deny-trace entries ${r.denyIndices}`)
    }
  }

  console.log(`\nENGINE TRACE: ${rows.length} scenarios, ${problems.length} problems`)
  console.log(
    `  sample (fips-deny-frodo): ${JSON.stringify(rows.find((r) => r.id === 'fips-deny-frodo'))}`
  )
  console.log(
    `  sample (pqc-rekey-ecdsa): ${JSON.stringify(rows.find((r) => r.id === 'pqc-rekey-ecdsa'))}`
  )
  problems.forEach((p) => console.log(`  ✗ ${p}`))

  expect(problems, problems.join('; ')).toEqual([])
})
