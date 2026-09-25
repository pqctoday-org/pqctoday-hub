// SPDX-License-Identifier: GPL-3.0-only
// WS-H H-4/H-5/H-6 comparator. Runs on the COMMITTED evidence run (so the
// committed matrix must be reproducible) and on in-memory COPIES of it for
// every sabotage: a flipped verdict, a flipped shared-secret byte, a tampered
// file, different inputs, an omitted target, a semantic comparator. Never
// writes to the evidence directory.
import { describe, expect, it } from 'vitest'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { sha256Hex } from '../acvp/ir'
import {
  compareCell,
  compareTargets,
  headline,
  policyFor,
  STATUSES,
  type FixtureRef,
  type TargetInput,
} from './compare'
import {
  checkRun,
  loadFixtureRefs,
  loadTargetInputs,
  generateRun,
  replayHint,
  type FixtureLoadNote,
} from './node/runDir'

const repo = process.cwd()
const RUN = path.join(repo, 'evidence/acvp-xplat/2026-09-24')

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

type Doc = {
  vsId: number
  testGroups: Array<{ tgId: number; tests: Array<Record<string, unknown>> }>
}

/** A copy of one target's files with the response edited and (optionally) the evidence hash re-sealed. */
const mutate = async (
  input: TargetInput,
  fixture: string,
  edit: (doc: Doc) => void,
  reseal: boolean
): Promise<TargetInput> => {
  const copy = clone(input)
  const files = copy.fixtures[fixture]!
  const doc = JSON.parse(files.responseText) as Doc
  edit(doc)
  files.responseText = `${JSON.stringify(doc, null, 2)}\n`
  if (reseal) {
    ;(files.evidence as { response: { sha256: string } }).response.sha256 = await sha256Hex(
      files.responseText
    )
  }
  return copy
}

const loadAll = async () => {
  const fixtures = await loadFixtureRefs(repo, RUN)
  const inputs = loadTargetInputs(RUN)
  return { fixtures, inputs }
}

const byName = (fixtures: FixtureRef[], name: string) => fixtures.find((f) => f.name === name)!
const target = (inputs: TargetInput[], id: string) => inputs.find((i) => i.target.id === id)!

describe('acvp-xplat comparator (WS-H)', () => {
  it.each(['2026-09-24', '2026-09-24b', '2026-09-25-native'])(
    'frozen run %s: the committed matrix and divergence set are exactly what its evidence produces',
    async (runId) => {
      const dir = path.join(repo, 'evidence/acvp-xplat', runId)
      expect(checkRun(dir, await generateRun(repo, dir, runId))).toEqual([])
    }
  )

  it('each frozen run is judged under its own pinned formats', async () => {
    const v1 = await generateRun(repo, RUN, '2026-09-24')
    const dirB = path.join(repo, 'evidence/acvp-xplat/2026-09-24b')
    const v2 = await generateRun(repo, dirB, '2026-09-24b')
    expect(v1.output.matrix.comparatorPolicyVersion).toBe('pqctoday.acvp-comparator-policy/1')
    expect(v2.output.matrix.comparatorPolicyVersion).toBe('pqctoday.acvp-comparator-policy/2')
    expect(v1.output.matrix.totals['linux-arm64-cpp'].pass).toBe(112)
    expect(v2.output.matrix.totals['linux-arm64-cpp'].pass).toBe(157)
  })

  it('run 2026-09-25-native: every run target (WASM, macOS, x86-64, Arm64) is publishable with 157 passes', async () => {
    const dir = path.join(repo, 'evidence/acvp-xplat/2026-09-25-native')
    const { matrix } = (await generateRun(repo, dir, '2026-09-25-native')).output
    const run = matrix.targets.filter((t) => t.declaredStatus === 'run').map((t) => t.id)
    expect(run.sort()).toEqual(
      [
        'wasm-cpp',
        'wasm-rust',
        'macos-arm64-cpp',
        'macos-arm64-rust',
        'linux-x86_64-cpp',
        'linux-x86_64-rust',
        'linux-arm64-cpp',
        'linux-arm64-rust',
      ].sort()
    )
    for (const t of matrix.targets.filter((x) => x.declaredStatus === 'run')) {
      expect(t.publishable, t.id).toBe(true)
      expect(matrix.totals[t.id], t.id).toMatchObject({ pass: 157, fail: 0, 'not comparable': 0 })
    }
    expect(matrix.divergences).toEqual([])
  })

  it('keeps all five statuses separate in every total', async () => {
    const { fixtures, inputs } = await loadAll()
    const { matrix } = await compareTargets('t', fixtures, inputs, replayHint(RUN))
    expect(matrix.statuses).toEqual(STATUSES)
    for (const counts of Object.values(matrix.totals)) {
      expect(Object.keys(counts).sort()).toEqual([...STATUSES].sort())
    }
    // Declared-not-run targets are "not run", never pass or unsupported.
    expect(matrix.totals['imx95-cpp']).toMatchObject({ pass: 0, unsupported: 0, 'not run': 345 })
    // Unsupported cases never count as pass.
    expect(matrix.totals['wasm-cpp'].unsupported).toBeGreaterThan(0)
  })

  it('SABOTAGE: a flipped sigVer verdict in a copy is a fail with an exportable minimal case', async () => {
    const { fixtures, inputs } = await loadAll()
    const fx = byName(fixtures, 'ML-DSA-sigVer-FIPS204')
    const orig = target(inputs, 'linux-arm64-rust')
    const flipped = await mutate(
      orig,
      fx.name,
      (d) => {
        const t = d.testGroups[0].tests[0]
        t.testPassed = !t.testPassed
      },
      true
    )
    const others = inputs.filter((i) => i.target.id !== orig.target.id)
    const { matrix, divergences } = await compareTargets(
      't',
      fixtures,
      [...others, flipped],
      replayHint(RUN)
    )
    const cell = matrix.fixtures.find((f) => f.name === fx.name)!.cells['linux-arm64-rust']
    expect(cell.status).toBe('fail')
    expect(cell.counts.fail).toBe(1)
    expect(divergences).toHaveLength(1)
    const d = divergences[0].doc
    expect(d).toMatchObject({
      target: 'linux-arm64-rust',
      fixture: fx.name,
      operation: 'ml-dsa.verify',
    })
    expect(d.firstDifference).toMatchObject({ field: 'testPassed', kind: 'boolean' })
    expect(d.expected).toBe(!d.actual)
    // Public NIST sample → inputs exported verbatim, plus hashes.
    expect((d.input.values as Record<string, string>).pk.length).toBeGreaterThan(0)
    expect(d.environmentDiffVsBaseline.baseline).toBe('wasm-cpp')
    expect(d.environmentDiffVsBaseline.diff.map((x) => x.path)).toContain('arch.machine')
    // The untouched original still passes.
    expect((await compareCell(fx, orig.declared, orig.fixtures[fx.name])).counts.fail).toBe(0)
  })

  it('SABOTAGE: one flipped shared-secret byte is a fail naming the byte offset', async () => {
    const { fixtures, inputs } = await loadAll()
    const fx = byName(fixtures, 'ML-KEM-encapDecap-FIPS203')
    const orig = target(inputs, 'linux-x86_64-cpp')
    let expectedByte = ''
    const bad = await mutate(
      orig,
      fx.name,
      (d) => {
        const t = d.testGroups[0].tests[0]
        const k = t.k as string
        expectedByte = k.slice(10, 12)
        const flippedByte = (Number.parseInt(expectedByte, 16) ^ 0x01).toString(16).padStart(2, '0')
        t.k = `${k.slice(0, 10)}${flippedByte.toUpperCase()}${k.slice(12)}`
      },
      true
    )
    const cell = await compareCell(fx, bad.declared, bad.fixtures[fx.name])
    expect(cell.counts.fail).toBe(1)
    const others = inputs.filter((i) => i.target.id !== orig.target.id)
    const { divergences } = await compareTargets('t', fixtures, [...others, bad], replayHint(RUN))
    expect(divergences[0].doc.firstDifference).toMatchObject({
      field: 'k',
      kind: 'hex',
      byteOffset: 5,
      expectedByte,
      expectedLengthBytes: 32,
    })
  })

  it('SABOTAGE: editing response.json without re-sealing evidence is an integrity failure, not a pass', async () => {
    const { fixtures, inputs } = await loadAll()
    const fx = byName(fixtures, 'ML-DSA-sigVer-FIPS204')
    const bad = await mutate(
      target(inputs, 'wasm-rust'),
      fx.name,
      (d) => {
        d.testGroups[0].tests[0].testPassed = !d.testGroups[0].tests[0].testPassed
      },
      false
    )
    const cell = await compareCell(fx, bad.declared, bad.fixtures[fx.name])
    expect(cell.status).toBe('not comparable')
    expect(cell.counts.pass).toBe(0)
    expect(cell.reason).toMatch(/response\.json SHA-256 differs/)
  })

  it('SABOTAGE: a tampered execution-environment.json (envId no longer recomputes) is not comparable', async () => {
    const { fixtures, inputs } = await loadAll()
    const fx = byName(fixtures, 'ML-KEM-encapDecap-FIPS203')
    const bad = clone(target(inputs, 'linux-arm64-cpp'))
    ;(
      bad.fixtures[fx.name]!.environment as { emulation: { emulated: boolean } }
    ).emulation.emulated = true
    const cell = await compareCell(fx, bad.declared, bad.fixtures[fx.name])
    expect(cell.status).toBe('not comparable')
    expect(cell.reason).toMatch(/envId does not recompute/)
  })

  it('a run on a different fixture bundle is not comparable', async () => {
    const { fixtures, inputs } = await loadAll()
    const fx = {
      ...byName(fixtures, 'ML-KEM-encapDecap-FIPS203'),
      bundleManifestSha256: '0'.repeat(64),
    }
    const t = target(inputs, 'wasm-cpp')
    const cell = await compareCell(fx, t.declared, t.fixtures[fx.name])
    expect(cell.status).toBe('not comparable')
    expect(cell.reason).toMatch(/different inputs/)
  })

  it('a semantic-comparator operation is never a pass without a semantic verdict', async () => {
    const { fixtures, inputs } = await loadAll()
    const real = byName(fixtures, 'ML-DSA-sigVer-FIPS204')
    const fx: FixtureRef = {
      ...real,
      planIndex: real.planIndex.map((i) =>
        i.kind === 'execute' ? { ...i, operation: 'ml-dsa.sign.hedged' } : i
      ),
    }
    const t = target(inputs, 'wasm-cpp')
    const cell = await compareCell(fx, t.declared, t.fixtures[fx.name])
    expect(cell.counts.pass).toBe(0)
    expect(cell.counts['not comparable']).toBe(82)
    expect(policyFor('ml-dsa.sign.hedged').comparator).toBe('semantic')
    expect(() => policyFor('ml-kem.keygen')).toThrow(/no entry/)
  })

  it('a missing evidence file set is "not run", and an undeclared Q3 target is refused', async () => {
    const { fixtures, inputs } = await loadAll()
    const fx = byName(fixtures, 'ML-KEM-encapDecap-FIPS203')
    const t = target(inputs, 'linux-arm64-rust')
    const cell = await compareCell(fx, t.declared, undefined)
    expect(cell).toMatchObject({ status: 'not run', counts: { 'not run': 165, pass: 0 } })
    const withoutKv260 = inputs.filter((i) => i.target.id !== 'kv260-rust')
    await expect(compareTargets('t', fixtures, withoutKv260, replayHint(RUN))).rejects.toThrow(
      /kv260-rust" is not declared/
    )
  })

  it('a frozen run stays loadable when the live plan changes; a tampered plan-index is refused', async () => {
    const tmp = mkdtempSync(path.join(os.tmpdir(), 'acvp-xplat-run-'))
    try {
      cpSync(RUN, tmp, { recursive: true })
      const fx = 'ML-DSA-sigVer-FIPS204'
      // 1. live pipeline reproduces the manifest's plan → plan-index must match it exactly.
      const idxPath = path.join(tmp, 'bundles', fx, 'plan-index.json')
      const index = JSON.parse(readFileSync(idxPath, 'utf8')) as Array<Record<string, unknown>>
      index[0] = { ...index[0], kind: index[0].kind === 'execute' ? 'unsupported' : 'execute' }
      writeFileSync(idxPath, `${JSON.stringify(index, null, 2)}\n`)
      await expect(loadFixtureRefs(repo, tmp)).rejects.toThrow(/plan-index\.json does not match/)
      // ...also for a fixture today's live pipeline no longer reproduces (ML-DSA, after externalMu).
      cpSync(path.join(RUN, 'bundles', fx, 'plan-index.json'), idxPath)
      const kemIdx = path.join(tmp, 'bundles', 'ML-KEM-encapDecap-FIPS203', 'plan-index.json')
      const kem = JSON.parse(readFileSync(kemIdx, 'utf8')) as Array<Record<string, unknown>>
      kem[0] = { ...kem[0], kind: kem[0].kind === 'execute' ? 'unsupported' : 'execute' }
      writeFileSync(kemIdx, `${JSON.stringify(kem, null, 2)}\n`)
      await expect(loadFixtureRefs(repo, tmp)).rejects.toThrow(/plan-index\.json does not match/)
      cpSync(path.join(RUN, 'bundles', 'ML-KEM-encapDecap-FIPS203', 'plan-index.json'), kemIdx)
      // 2. manifest pins a plan today's rules no longer produce → frozen index is used, noted.
      cpSync(path.join(RUN, 'bundles', fx, 'plan-index.json'), idxPath)
      const mPath = path.join(tmp, 'bundles', fx, 'manifest.json')
      const m = JSON.parse(readFileSync(mPath, 'utf8')) as { canonicalSha256: { plan: string } }
      m.canonicalSha256.plan = 'f'.repeat(64)
      writeFileSync(mPath, `${JSON.stringify(m, null, 2)}\n`)
      const notes: FixtureLoadNote[] = []
      const refs = await loadFixtureRefs(repo, tmp, notes)
      expect(notes.find((n) => n.fixture === fx)?.livePlanReproducible).toBe(false)
      expect(refs.find((r) => r.name === fx)?.planIndex).toHaveLength(180)
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('headline never hides a fail and never turns unsupported-only into pass', () => {
    const z = { pass: 0, fail: 0, unsupported: 0, 'not run': 0, 'not comparable': 0 }
    expect(headline({ ...z, pass: 99, fail: 1 })).toBe('fail')
    expect(headline({ ...z, unsupported: 5 })).toBe('unsupported')
    expect(headline({ ...z, pass: 3, 'not comparable': 1 })).toBe('not comparable')
    expect(headline(z)).toBe('not run')
  })
})
