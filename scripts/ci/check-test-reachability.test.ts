// SPDX-License-Identifier: GPL-3.0-only
/**
 * Non-vacuity proof for the test gate-reachability check.
 *
 * The failure mode this whole tool exists to eliminate is a green result that
 * could not have been red. So the checker's own matching is proven HERE in both
 * directions — a known-reached file must be reported reached, and a path no
 * gate can run must be reported orphaned — plus the invariants that keep the
 * gate table honest.
 *
 * This file is itself the reachability sentinel: it lives under the default
 * vitest include with no positional filter in front of it, so `ci:test` runs it.
 * If that stops being true, check-test-reachability.ts fails its own direction-1
 * assertion.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ALLOWLIST, GATES, computeReport, enumerateUniverse } from './check-test-reachability'

const ROOT = path.resolve(__dirname, '../..')

const SELF = 'scripts/ci/check-test-reachability.test.ts'
const SYNTHETIC = 'src/__reachability_probe__/synthetic-orphan.test.ts'

describe('computeReport — both directions', () => {
  const universe = [SELF, SYNTHETIC, 'src/components/Playground/kmip/thing.local.test.ts']

  it('reports a file a gate resolves as REACHED, not orphaned', () => {
    const resolved = new Map([['ci:test (vitest shards 1-2)', [SELF]]])
    const report = computeReport(universe, resolved, [])
    expect(report.reached.get(SELF)).toEqual(['ci:test (vitest shards 1-2)'])
    expect(report.orphans.map((o) => o.file)).not.toContain(SELF)
  })

  it('reports a file NO gate resolves as an ORPHAN, with a reason', () => {
    const resolved = new Map([['ci:test (vitest shards 1-2)', [SELF]]])
    const report = computeReport(universe, resolved, [])
    const orphan = report.orphans.find((o) => o.file === SYNTHETIC)
    expect(orphan).toBeDefined()
    expect(orphan?.reason).toMatch(/no enforced gate/i)
  })

  it('explains a local-tier orphan by naming the local-config scoping, not a generic message', () => {
    const report = computeReport(['src/wasm/softhsm/x.local.test.ts'], new Map(), [])
    expect(report.orphans[0]?.reason).toMatch(/vitest\.local\.config\.ts/)
    expect(report.orphans[0]?.reason).toMatch(/test:local:cacp/)
    // Since gate:local runs test:local unscoped, the reason must point the
    // reader at the config's own exclude/filename, not at a missing gate that
    // now exists — a stale reason sends whoever hits this down the wrong path.
    expect(report.orphans[0]?.reason).toMatch(/UNSCOPED/)
  })

  it('explains a local-tier e2e orphan by naming the playwright local project', () => {
    const report = computeReport(['e2e/x.local.spec.ts'], new Map(), [])
    expect(report.orphans[0]?.reason).toMatch(/playwright `local` project/)
    expect(report.orphans[0]?.reason).toMatch(/test:e2e:local-tier/)
  })

  it('an allowlist entry suppresses the orphan…', () => {
    const report = computeReport([SYNTHETIC], new Map(), [{ file: SYNTHETIC, reason: 'test' }])
    expect(report.orphans).toEqual([])
    // …and, because the file is in the universe and unreached, it is not stale.
    expect(report.staleAllowlist).toEqual([])
  })

  it('…but a STALE allowlist entry is reported: reached anyway', () => {
    const resolved = new Map([['ci:test (vitest shards 1-2)', [SELF]]])
    const report = computeReport([SELF], resolved, [{ file: SELF, reason: 'test' }])
    expect(report.staleAllowlist.map((s) => s.file)).toEqual([SELF])
    expect(report.staleAllowlist[0]?.reason).toMatch(/actually reached/)
  })

  it('…and a STALE allowlist entry is reported: file no longer exists', () => {
    const report = computeReport([SELF], new Map(), [{ file: 'e2e/gone.spec.ts', reason: 'x' }])
    expect(report.staleAllowlist.map((s) => s.file)).toEqual(['e2e/gone.spec.ts'])
    expect(report.staleAllowlist[0]?.reason).toMatch(/does not exist/)
  })
})

describe('the universe glob is real', () => {
  it('finds this very file (so the checker can never be vacuously green)', async () => {
    const universe = await enumerateUniverse()
    expect(universe).toContain(SELF)
    expect(universe).toContain('e2e/basic.spec.ts')
    // Sanity floor: this repo has hundreds of test files. A universe that
    // collapsed to a handful would make "0 orphans" meaningless.
    expect(universe.length).toBeGreaterThan(500)
    expect(universe).not.toContain(SYNTHETIC)
  })
})

describe('the gate table stays honest', () => {
  it('has unique ids and a cited source for every gate', () => {
    expect(new Set(GATES.map((g) => g.id)).size).toBe(GATES.length)
    for (const g of GATES) {
      // package.json counts as a citation ONLY for the local-release tier:
      // gate:release is not invoked from a workflow or a hook (it needs a
      // production build first), so package.json is genuinely where it is
      // written down. Every other tier must point at the workflow or hook that
      // actually invokes it — naming an npm script there would let an aggregate
      // that nothing calls masquerade as a gate, which is this tool's whole
      // subject matter.
      const expected =
        g.tier === 'local-release' ? /package\.json/ : /\.github\/workflows\/|\.husky\//
      expect(g.source, `gate ${g.id} must cite where it is written down`).toMatch(expected)
    }
  })

  it('gates the local unit tier and the local e2e tier, unscoped', () => {
    // The two holes this check found on its first run (2026-09-26): 69
    // *.local.test.* files and 18 *.local.spec.ts files that no gate ran.
    // Removing either gate below silently re-opens one of them, so assert they
    // are present AND unfiltered — a scoped version would look identical here
    // while covering only a fraction.
    const localUnit = GATES.find(
      (g) => g.kind === 'vitest' && g.config === 'vitest.local.config.ts' && g.filters.length === 0
    )
    expect(localUnit, 'gate:local must run `npm run test:local` UNSCOPED').toBeDefined()
    expect(localUnit?.source).toContain('test:local')

    const localE2e = GATES.find((g) => g.kind === 'playwright' && g.project === 'local')
    expect(localE2e, 'gate:release must run `playwright test --project=local`').toBeDefined()
    expect(localE2e?.tier).toBe('local-release')
  })

  it('gates the nightly unit tier, unscoped, from a workflow that really invokes it', () => {
    // *.nightly.test.* moved off pre-push on 2026-09-26 (the SLH-DSA vector suite
    // was 26 of test:local's 29 min). That only holds if something still runs the
    // tier: assert the gate is listed AND that the cited workflow contains the
    // command, so deleting the workflow step fails here instead of orphaning
    // the suite silently.
    const nightly = GATES.find(
      (g) =>
        g.kind === 'vitest' && g.config === 'vitest.nightly.config.ts' && g.filters.length === 0
    )
    expect(nightly, 'validation-nightly.yml must run `npm run test:nightly` UNSCOPED').toBeDefined()
    expect(nightly?.tier).toBe('nightly-ci')
    const wf = readFileSync(path.join(ROOT, '.github/workflows/validation-nightly.yml'), 'utf8')
    expect(wf).toMatch(/npm run test:nightly/)
    expect(wf).toMatch(/schedule:/)
  })

  it('contains the positive control: an unfiltered vitest run from ci.yml', () => {
    const control = GATES.find(
      (g) =>
        g.kind === 'vitest' && g.tier === 'github-ci' && g.config === null && g.filters.length === 0
    )
    expect(control, 'ci.yml runs `npx vitest run --shard` — the tracing must find it').toBeDefined()
    expect(control?.source).toContain('vitest run --shard')
  })

  it('every allowlist entry carries a reason', () => {
    for (const a of ALLOWLIST) expect(a.reason.length).toBeGreaterThan(20)
  })
})
