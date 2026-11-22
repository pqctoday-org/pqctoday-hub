// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Non-vacuity and wiring-truth proofs for the test gate-reachability check.
 *
 * Proves:
 * 1. `computeReport` catches orphans and stale allowlist entries in both directions.
 * 2. `GATES` matches the actual workflows, `.husky/pre-push`, and `package.json`
 *    in the live repository (`validateGateWiring(GATES, ROOT) === []`).
 * 3. Removing a workflow job, rerouting `.husky/pre-push`, or narrowing `test:local`
 *    to KMIP paths fails `validateGateWiring` for the exact affected venue — even
 *    when another venue still reaches the same test files.
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ALLOWLIST,
  GATES,
  computeReport,
  enumerateUniverse,
  validateGateWiring,
  type Gate,
} from './check-test-reachability'

const ROOT = path.resolve(__dirname, '../..')

const SELF = 'scripts/ci/check-test-reachability.test.ts'
const SYNTHETIC = 'src/__reachability_probe__/synthetic-orphan.test.ts'

describe('computeReport — both directions', () => {
  const universe = [SELF, SYNTHETIC, 'src/components/Playground/kmip/thing.local.test.ts']

  it('reports a file a gate resolves as REACHED, not orphaned', () => {
    const resolved = new Map([['ci:test (vitest shards 1-3)', [SELF]]])
    const report = computeReport(universe, resolved, [])
    expect(report.reached.get(SELF)).toEqual(['ci:test (vitest shards 1-3)'])
    expect(report.orphans.map((o) => o.file)).not.toContain(SELF)
  })

  it('reports a file NO gate resolves as an ORPHAN, with a reason', () => {
    const resolved = new Map([['ci:test (vitest shards 1-3)', [SELF]]])
    const report = computeReport(universe, resolved, [])
    const orphan = report.orphans.find((o) => o.file === SYNTHETIC)
    expect(orphan).toBeDefined()
    expect(orphan?.reason).toMatch(/no enforced gate/i)
  })

  it('explains a local-tier orphan accurately (release-only unscoped test:local, not pre-push/CI)', () => {
    const report = computeReport(['src/wasm/softhsm/x.local.test.ts'], new Map(), [])
    expect(report.orphans[0]?.reason).toMatch(/vitest\.local\.config\.ts/)
    expect(report.orphans[0]?.reason).toMatch(/gate:release/)
    expect(report.orphans[0]?.reason).toMatch(/UNSCOPED/)
    expect(report.orphans[0]?.reason).toMatch(/not invoked by `\.husky\/pre-push`/)
  })

  it('explains a local-tier e2e orphan by naming the playwright local project', () => {
    const report = computeReport(['e2e/x.local.spec.ts'], new Map(), [])
    expect(report.orphans[0]?.reason).toMatch(/playwright `local` project/)
    expect(report.orphans[0]?.reason).toMatch(/test:e2e:local-tier/)
  })

  it('an allowlist entry suppresses the orphan…', () => {
    const report = computeReport([SYNTHETIC], new Map(), [{ file: SYNTHETIC, reason: 'test' }])
    expect(report.orphans).toEqual([])
    expect(report.staleAllowlist).toEqual([])
  })

  it('…but a STALE allowlist entry is reported: reached anyway', () => {
    const resolved = new Map([['ci:test (vitest shards 1-3)', [SELF]]])
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
    expect(universe.length).toBeGreaterThan(500)
    expect(universe).not.toContain(SYNTHETIC)
  })
})

describe('the gate table stays honest against the real repo', () => {
  it('has unique ids and valid wiring for every declared gate', () => {
    expect(new Set(GATES.map((g) => g.id)).size).toBe(GATES.length)
    expect(validateGateWiring(GATES, ROOT)).toEqual([])
  })

  it('includes PR desktop, PR mobile, and PR module-a11y Playwright projects', () => {
    const projects = GATES.filter((g) => g.kind === 'playwright').map((g) => g.project)
    expect(projects).toContain('playground-pr-desktop')
    expect(projects).toContain('playground-pr-mobile')
    expect(projects).toContain('a11y-modules-pr')
  })

  it('labels local Vitest and local E2E gates as release-only (not local-pre-push)', () => {
    const localUnit = GATES.find(
      (g) => g.kind === 'vitest' && g.config === 'vitest.local.config.ts' && g.filters.length === 0
    )
    expect(localUnit).toBeDefined()
    expect(localUnit?.tier).toBe('local-release')

    const localE2e = GATES.find((g) => g.kind === 'playwright' && g.project === 'local')
    expect(localE2e).toBeDefined()
    expect(localE2e?.tier).toBe('local-release')

    // `.husky/pre-push` runs `gate:prepush` (no test suites), so no gate may claim `local-pre-push`.
    expect(GATES.filter((g) => g.tier === 'local-pre-push')).toEqual([])
  })

  it('gates the nightly unit tier, unscoped, from validation-nightly.yml', () => {
    const nightly = GATES.find(
      (g) =>
        g.kind === 'vitest' && g.config === 'vitest.nightly.config.ts' && g.filters.length === 0
    )
    expect(nightly).toBeDefined()
    expect(nightly?.tier).toBe('nightly-ci')
  })

  it('every allowlist entry carries a reason', () => {
    for (const a of ALLOWLIST) expect(a.reason.length).toBeGreaterThan(20)
  })
})

describe('validateGateWiring — fixture failure proofs', () => {
  const tempDirs: string[] = []

  function makeFixture(files: Record<string, string>): string {
    const dir = mkdtempSync(path.join(tmpdir(), 'reachability-wiring-'))
    tempDirs.push(dir)
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(dir, rel)
      mkdirSync(path.dirname(full), { recursive: true })
      writeFileSync(full, content, 'utf8')
    }
    return dir
  }

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop()
      if (dir) rmSync(dir, { recursive: true, force: true })
    }
  })

  it('fails specifically for the removed CI job even when another workflow still reaches default unit tests', () => {
    const fixtureDir = makeFixture({
      'package.json': JSON.stringify({ scripts: { test: 'vitest run' } }),
      '.github/workflows/pr-check.yml': [
        'jobs:',
        '  pr-test:',
        '    steps:',
        '      - run: npx vitest run --shard=1/3',
      ].join('\n'),
      // `test` job removed from ci.yml; only `checks` remains.
      '.github/workflows/ci.yml': [
        'jobs:',
        '  checks:',
        '    steps:',
        '      - run: npm run lint',
      ].join('\n'),
    })

    const gates: Gate[] = [
      {
        kind: 'vitest',
        id: 'pr:pr-test (vitest shards 1-3)',
        tier: 'github-ci',
        source: '.github/workflows/pr-check.yml job "pr-test"',
        wiring: { rootKind: 'workflow', file: '.github/workflows/pr-check.yml', job: 'pr-test' },
        config: null,
        filters: [],
      },
      {
        kind: 'vitest',
        id: 'ci:test (vitest shards 1-3)',
        tier: 'github-ci',
        source: '.github/workflows/ci.yml job "test"',
        wiring: { rootKind: 'workflow', file: '.github/workflows/ci.yml', job: 'test' },
        config: null,
        filters: [],
      },
    ]

    const problems = validateGateWiring(gates, fixtureDir)
    expect(problems).toHaveLength(1)
    expect(problems[0]?.gateId).toBe('ci:test (vitest shards 1-3)')
    expect(problems[0]?.reason).toMatch(/job "test" not found/)
  })

  it('fails when .husky/pre-push is rerouted away from gate:local to gate:prepush', () => {
    const fixtureDir = makeFixture({
      'package.json': JSON.stringify({
        scripts: {
          'gate:prepush': 'npm run audit:test-reachability',
          'gate:local': 'npm run test && npm run test:local',
          test: 'vitest run',
          'test:local': 'vitest run --config vitest.local.config.ts',
        },
      }),
      '.husky/pre-push': '#!/bin/sh\nnpm run gate:prepush\n',
    })

    const hookGate: Gate[] = [
      {
        kind: 'vitest',
        id: 'local:pre-push (npm run test)',
        tier: 'local-pre-push',
        source: '.husky/pre-push: npm run gate:local -> npm run test',
        wiring: { rootKind: 'hook', file: '.husky/pre-push' },
        config: null,
        filters: [],
      },
    ]

    const problems = validateGateWiring(hookGate, fixtureDir)
    expect(problems).toHaveLength(1)
    expect(problems[0]?.gateId).toBe('local:pre-push (npm run test)')
    expect(problems[0]?.reason).toMatch(/no matching vitest invocation/)
  })

  it('fails when test:local is narrowed to KMIP paths instead of running unscoped', () => {
    const fixtureDir = makeFixture({
      'package.json': JSON.stringify({
        scripts: {
          'gate:release-local': 'npm run test:local',
          'test:local':
            'vitest run --config vitest.local.config.ts src/components/Playground/kmip src/wasm/kmip',
        },
      }),
    })

    const unscopedLocalGate: Gate[] = [
      {
        kind: 'vitest',
        id: 'release:gate:release-local (vitest local config)',
        tier: 'local-release',
        source: 'package.json "gate:release-local": npm run test:local',
        wiring: { rootKind: 'package-script', file: 'package.json', script: 'gate:release-local' },
        config: 'vitest.local.config.ts',
        filters: [],
      },
    ]

    const problems = validateGateWiring(unscopedLocalGate, fixtureDir)
    expect(problems).toHaveLength(1)
    expect(problems[0]?.gateId).toBe('release:gate:release-local (vitest local config)')
    expect(problems[0]?.reason).toMatch(/unscoped/)
  })
})
