// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  MATRIX_STATUSES,
  assertStatus,
  buildCoverageMatrix,
  compactMatrix,
  dimensionLevels,
  dimensionOf,
  expandMatrix,
  levelFor,
  serializeMatrixFile,
  type CoverageMatrix,
  type MatrixCaseRef,
  type RunResult,
} from './coverageModel'
import { FIXTURE_ARTIFACT, fixtureInputs } from './coverageFixture'

const row = (m: CoverageMatrix, key: string) => {
  const r = m.rows.find((x) => x.key === key)
  if (!r) throw new Error(`no row ${key}`)
  return r
}

const pass = (
  registryCase: string,
  engine: 'cpp' | 'rust',
  status: RunResult['status'] = 'pass'
): RunResult => ({
  engine,
  artifactKind: 'wasm',
  artifactSha256: FIXTURE_ARTIFACT[engine], // eslint-disable-line security/detect-object-injection
  registryCase,
  status,
})

describe('coverage matrix — golden fixture (every number derivable by hand)', () => {
  const { matrix, gate } = buildCoverageMatrix(fixtureInputs())

  it('passes the gate with no errors or warnings', () => {
    expect(gate.errors).toEqual([])
    expect(gate.warnings).toEqual([])
  })

  it('builds the expected rows in inventory order, including declared-unreachable ones', () => {
    expect(matrix.rows.map((r) => r.key)).toEqual([
      'CKM_TEST_SIG|sign|P-A|hedged',
      'CKM_TEST_SIG|sign|P-A|deterministic',
      'CKM_TEST_SIG|sign|P-B|hedged',
      'CKM_TEST_SIG|sign|P-B|deterministic',
      'CKM_TEST_SIG|verify|P-A|*',
      'CKM_TEST_SIG|verify|P-B|*',
      'CKM_TEST_HASH|digest|*|*',
      'CKM_TEST_KDF|derive|*|*',
      'unreachable:no-mech|sign|*|*',
    ])
    expect(matrix.totals.declaredUnreachableRows).toBe(1)
  })

  it('keeps a declared parameter set only inside the engine-reported key-size range', () => {
    const r = row(matrix, 'CKM_TEST_SIG|verify|P-B|*')
    expect(r.engines.cpp.advertised).toBe(true)
    expect(r.engines.rust.advertised).toBe(false)
    expect(r.engines.rust.reason).toMatch(/outside the engine-reported key-size range 10\.\.15/)
    expect(row(matrix, 'CKM_TEST_HASH|digest|*|*').engines.rust.reason).toBe(
      'mechanism not in C_GetMechanismList'
    )
  })

  it('pins the per-engine numerators and denominators', () => {
    const cpp = matrix.totals.byEngine.cpp
    const rust = matrix.totals.byEngine.rust
    expect([cpp.advertisedCells, cpp.unsupportedCells]).toEqual([8, 1])
    expect([rust.advertisedCells, rust.unsupportedCells]).toEqual([4, 5])
    const lv = (b: { covered: number; sampled: number; untested: number }) => [
      b.covered,
      b.sampled,
      b.untested,
    ]
    expect(lv(cpp.byPolarity.positive)).toEqual([1, 2, 5])
    expect(lv(cpp.byPolarity.negative)).toEqual([0, 1, 7])
    expect(lv(cpp.byPolarity.boundary)).toEqual([0, 1, 7])
    expect(lv(cpp.byPolarity['state-error'])).toEqual([0, 0, 8])
    expect(lv(cpp.overall)).toEqual([0, 3, 5])
    expect(lv(rust.byPolarity.positive)).toEqual([1, 1, 2])
    expect(lv(rust.overall)).toEqual([0, 2, 2])
    for (const t of [cpp, rust]) {
      for (const b of Object.values(t.byPolarity)) {
        expect(b.covered + b.sampled + b.untested).toBe(t.advertisedCells)
      }
    }
    expect(cpp.byPolarity.positive.byStatus['nist-reference']).toBe(1)
    expect(cpp.byPolarity.positive.byStatus['round-trip']).toBe(1)
    expect(cpp.byPolarity.positive.byStatus['behavior-only']).toBe(1)
    expect(matrix.totals.waivers).toEqual({ waivedCells: 7, pendingReviewCells: 5, staleCells: 0 })
  })

  it('covered needs two distinct cases with an external expected value; one case is only sampled', () => {
    const v = row(matrix, 'CKM_TEST_SIG|verify|P-A|*').engines.cpp.polarity
    expect(v.positive).toMatchObject({ status: 'nist-reference', level: 'covered' })
    expect(v.negative).toMatchObject({ status: 'nist-reference', level: 'sampled' })
    expect(row(matrix, 'CKM_TEST_SIG|sign|P-A|hedged').engines.cpp.polarity.positive).toMatchObject(
      {
        status: 'round-trip',
        level: 'sampled',
      }
    )
    expect(levelFor('positive', ['round-trip', 'round-trip'])).toBe('sampled')
    expect(levelFor('positive', ['round-trip', 'oracle'])).toBe('covered')
    expect(levelFor('negative', ['behavior-only'])).toBe('sampled')
    expect(levelFor('negative', [])).toBe('untested')
  })

  it('a positive round-trip never makes the negative, boundary or state-error column green', () => {
    const s = row(matrix, 'CKM_TEST_SIG|sign|P-A|hedged').engines.cpp.polarity
    expect(s.negative.level).toBe('untested')
    expect(s.boundary.level).toBe('untested')
    expect(s['state-error'].level).toBe('untested')
  })

  it('counts a boundary case only from recorded parameters that hit a declared boundary', () => {
    const v = row(matrix, 'CKM_TEST_SIG|verify|P-A|*').engines.rust.polarity.boundary
    expect(v.level).toBe('sampled')
    expect(v.cases.map((i) => matrix.cases[i].caseId)).toEqual(['v#/0']) // ctx 255, not ctx 3
  })

  it('a test registered for one engine never lends evidence to the other', () => {
    const h = row(matrix, 'CKM_TEST_HASH|digest|*|*')
    expect(h.engines.cpp.polarity.positive.status).toBe('behavior-only')
    expect(h.engines.rust.level).toBe('unsupported')
  })

  it('reports no parity and no pass without recorded run results', () => {
    expect(row(matrix, 'CKM_TEST_SIG|verify|P-A|*').parity.positive).toBe('not-established')
    expect(row(matrix, 'CKM_TEST_HASH|digest|*|*').parity.positive).toBe('single-engine')
    expect(matrix.totals.byEngine.cpp.byArtifact.wasm.passedCells).toBe(0)
    expect(matrix.totals.byEngine.cpp.byArtifact.native.status).toBe('not-run')
    expect(matrix.totals.byEngine.cpp.byArtifact.hardware.status).toBe('not-run')
  })

  it('appends generated open gaps to the curated register', () => {
    const ids = matrix.openGaps.map((g) => g.id)
    expect(ids[0]).toBe('g1')
    expect(ids).toContain('untested:CKM_TEST_KDF')
    expect(ids).toContain('polarity-untested:state-error')
    expect(matrix.openGaps.find((g) => g.id === 'unsupported-cells')?.cells).toBe(6)
    expect(matrix.openGaps.every((g) => g.owner && g.status)).toBe(true)
  })
})

describe('coverage matrix — parity and run results (C-4)', () => {
  it('parity only when both engines PASS the same case', () => {
    const { matrix } = buildCoverageMatrix(
      fixtureInputs([pass('t.nist#v#/0', 'cpp'), pass('t.nist#v#/0', 'rust')])
    )
    const r = row(matrix, 'CKM_TEST_SIG|verify|P-A|*')
    expect(r.parity.positive).toBe('parity')
    expect(r.parity.boundary).toBe('parity')
    expect(r.parity.negative).toBe('not-established')
    expect(r.engines.cpp.run).toEqual({ pass: 1, fail: 0 })
    expect(matrix.totals.parity.positive.parity).toBe(1)
  })

  it('a skip never counts as a pass, on either side', () => {
    const { matrix } = buildCoverageMatrix(
      fixtureInputs([pass('t.nist#v#/1', 'cpp', 'skip'), pass('t.nist#v#/1', 'rust', 'skip')])
    )
    const r = row(matrix, 'CKM_TEST_SIG|verify|P-A|*')
    expect(r.parity.negative).toBe('not-established')
    // A skip is its own recorded status: counted as skipped, never as a pass,
    // never folded into untested (plan §10.1 #6).
    expect(r.engines.cpp.run).toEqual({ pass: 0, fail: 0, skip: 1 })
    expect(matrix.totals.byEngine.cpp.byArtifact.wasm.passedCells).toBe(0)
    expect(matrix.totals.byEngine.cpp.byArtifact.wasm.skippedCells).toBe(1)
    expect(matrix.totals.byEngine.cpp.byArtifact.wasm.failedCells).toBe(0)
  })

  it('a pass on one engine and a fail on the other is divergent and becomes an open gap', () => {
    const { matrix } = buildCoverageMatrix(
      fixtureInputs([pass('t.nist#v#/0', 'cpp'), pass('t.nist#v#/0', 'rust', 'fail')])
    )
    expect(row(matrix, 'CKM_TEST_SIG|verify|P-A|*').parity.positive).toBe('divergent')
    expect(matrix.totals.byEngine.rust.byArtifact.wasm.failedCells).toBe(1)
    expect(matrix.openGaps.some((g) => g.id === 'recorded-fail:t.nist#v#/0:rust')).toBe(true)
  })

  it('ignores results recorded against a different artifact than the inventory records', () => {
    const stale: RunResult = { ...pass('t.nist#v#/0', 'cpp'), artifactSha256: 'f'.repeat(64) }
    const { matrix, gate } = buildCoverageMatrix(
      fixtureInputs([stale, pass('t.nist#v#/0', 'rust')])
    )
    expect(row(matrix, 'CKM_TEST_SIG|verify|P-A|*').parity.positive).toBe('not-established')
    expect(gate.warnings.some((w) => /1 run result\(s\) ignored/.test(w))).toBe(true)
  })
})

describe('coverage-diff gate (C-5) — sabotage on synthetic copies', () => {
  it('fails when an engine advertises a new mechanism with no test and no waiver', () => {
    const inp = fixtureInputs()
    inp.inventory.engines.rust.inventory.mechanisms.push({
      typeHex: '0x00000009',
      name: 'CKM_TEST_NEW',
      family: 'other',
      ulMinKeySize: 0,
      ulMaxKeySize: 0,
      flagNames: ['CKF_SIGN'],
      requiredOperations: ['sign'],
    })
    const { gate } = buildCoverageMatrix(inp)
    expect(gate.errors).toContain(
      'rust: advertised mechanism CKM_TEST_NEW is not in capability-map.json'
    )
    expect(gate.errors).toContain(
      'rust: advertised capability CKM_TEST_NEW|sign|*|* has no registered test and no approved waiver'
    )
  })

  it('fails when a new declared parameter set lands inside an advertised range', () => {
    const inp = fixtureInputs()
    inp.capabilityMap.parameterSetGroups.TEST.sets.push({ id: 'P-C', keySize: 11 })
    const { gate } = buildCoverageMatrix(inp)
    expect(gate.errors).toContain(
      'cpp: advertised capability CKM_TEST_SIG|verify|P-C|* has no registered test and no approved waiver'
    )
    expect(gate.errors).toContain(
      'rust: advertised capability CKM_TEST_SIG|verify|P-C|* has no registered test and no approved waiver'
    )
  })

  it('fails when a waiver is removed, or lacks reason/owner/date', () => {
    const inp = fixtureInputs()
    inp.waivers.waivers = inp.waivers.waivers.filter((w) => w.id !== 'w-kdf')
    expect(buildCoverageMatrix(inp).gate.errors).toContain(
      'cpp: advertised capability CKM_TEST_KDF|derive|*|* has no registered test and no approved waiver'
    )
    const bad = fixtureInputs()
    bad.waivers.waivers[2].owner = ''
    expect(
      buildCoverageMatrix(bad).gate.errors.some((e) => /w-kdf: id, reason, owner/.test(e))
    ).toBe(true)
  })

  it('warns (not fails) on a waiver whose cell is now tested', () => {
    const inp = fixtureInputs()
    inp.waivers.waivers[0].cells.push('verify|P-A|*')
    const { gate } = buildCoverageMatrix(inp)
    expect(gate.errors).toEqual([])
    expect(
      gate.warnings.some((w) => w.includes('stale waiver cell cpp|CKM_TEST_SIG|verify|P-A|*'))
    ).toBe(true)
  })

  it('refuses quarantined, unknown or misclassified manifest cases', () => {
    const inp = fixtureInputs()
    inp.registry[0].cases.push({
      caseId: 'v#/q',
      evidenceClass: 'published-standard-kat',
      polarity: 'positive',
      exercises: [
        { capability: { mechanism: 'CKM_TEST_SIG', operation: 'verify', parameterSet: 'P-A' } },
      ],
    })
    inp.registry[0].cases.push({
      caseId: 'v#/missing',
      evidenceClass: 'nist-acvp-reference-sample',
      polarity: 'positive',
      exercises: [],
    })
    inp.registry[0].cases[0].evidenceClass = 'published-standard-kat'
    const { gate } = buildCoverageMatrix(inp)
    expect(gate.errors).toEqual(
      expect.arrayContaining([
        'registry t.nist: case v#/q is quarantined — it cannot count as evidence',
        'registry t.nist: case v#/missing is not in vector-manifest.json',
        'registry t.nist: case v#/0 claims published-standard-kat but the manifest says nist-acvp-reference-sample',
      ])
    )
  })

  it('refuses a registry exercise that is not a capability cell (typo guard)', () => {
    const inp = fixtureInputs()
    inp.registry[1].cases[0].exercises.push({
      capability: { mechanism: 'CKM_TEST_SIG', operation: 'verify', parameterSet: 'P-Z' },
    })
    expect(
      buildCoverageMatrix(inp).gate.errors.some((e) => e.includes('CKM_TEST_SIG|verify|P-Z|*'))
    ).toBe(true)
  })

  it('fails on an unknown status', () => {
    expect(() => assertStatus('validated', 'x')).toThrow(/unknown coverage status "validated"/)
    expect(MATRIX_STATUSES).toEqual([
      'acvts-issued',
      'nist-reference',
      'standard-kat',
      'oracle',
      'differential',
      'round-trip',
      'behavior-only',
      'untested',
      'unsupported',
    ])
    const { matrix } = buildCoverageMatrix(fixtureInputs())
    const f = compactMatrix(matrix)
    const cell = f.rows[4].e.cpp
    if (!cell.adv || !cell.pol?.positive) throw new Error('fixture changed')
    cell.pol.positive[0] = 'validated' as never
    expect(() => expandMatrix(f)).toThrow(/unknown coverage status/)
  })
})

describe('serialized form', () => {
  it('round-trips losslessly and writes one row per line', () => {
    const { matrix } = buildCoverageMatrix(
      fixtureInputs([pass('t.nist#v#/0', 'cpp'), pass('t.nist#v#/0', 'rust', 'fail')])
    )
    const text = serializeMatrixFile(compactMatrix(matrix))
    expect(expandMatrix(JSON.parse(text))).toEqual(JSON.parse(JSON.stringify(matrix)))
    const rowLines = text.split('\n').filter((l) => l.startsWith('    {"k":'))
    expect(rowLines).toHaveLength(matrix.rows.length)
  })
})

describe('G-3 algorithm-correctness vs PKCS #11 API-behaviour columns', () => {
  const ref = (
    caseId: string,
    evidenceClass: MatrixCaseRef['evidenceClass'],
    polarity: MatrixCaseRef['polarity']
  ): MatrixCaseRef => ({
    id: `t#${caseId}`,
    test: 't',
    runner: 'errorPathProbes',
    caseId,
    evidenceClass,
    status: assertStatus(
      {
        'nist-acvp-reference-sample': 'nist-reference',
        'functional-round-trip': 'round-trip',
        'product-mechanism-probe': 'behavior-only',
      }[evidenceClass as string] ?? 'behavior-only',
      caseId
    ),
    polarity,
    engines: ['cpp'],
  })

  it('classifies value-checking cases as algorithm and behaviour/state-error cases as api', () => {
    expect(dimensionOf(ref('a', 'nist-acvp-reference-sample', 'positive'))).toBe('algorithm')
    expect(dimensionOf(ref('b', 'functional-round-trip', 'negative'))).toBe('algorithm')
    expect(dimensionOf(ref('c', 'product-mechanism-probe', 'positive'))).toBe('api')
    // a state-error case is API behaviour whatever its evidence class
    expect(dimensionOf(ref('d', 'functional-round-trip', 'state-error'))).toBe('api')
  })

  it('an API-behaviour column is covered only with ≥ 2 distinct cases incl. a state-error case', () => {
    const cases = [
      ref('p1', 'product-mechanism-probe', 'positive'),
      ref('p2', 'product-mechanism-probe', 'positive'),
      ref('s1', 'product-mechanism-probe', 'state-error'),
      ref('rt', 'functional-round-trip', 'positive'),
      ref('ni', 'nist-acvp-reference-sample', 'positive'),
    ]
    expect(dimensionLevels([0, 1], cases).api).toBe('sampled') // no state-error case
    expect(dimensionLevels([0, 2], cases).api).toBe('covered')
    expect(dimensionLevels([2], cases).api).toBe('sampled')
    // behaviour probes never lend evidence to the algorithm column, and vice versa
    expect(dimensionLevels([0, 1, 2], cases).algorithm).toBe('untested')
    expect(dimensionLevels([3], cases).api).toBe('untested')
  })

  it('an algorithm column needs ≥ 2 distinct cases and one externally expected value', () => {
    const cases = [
      ref('rt1', 'functional-round-trip', 'positive'),
      ref('rt2', 'functional-round-trip', 'positive'),
      ref('ni', 'nist-acvp-reference-sample', 'positive'),
    ]
    expect(dimensionLevels([0, 1], cases).algorithm).toBe('sampled')
    expect(dimensionLevels([0, 2], cases).algorithm).toBe('covered')
  })

  it('the golden fixture carries per-cell dimensions and per-engine dimension totals', () => {
    const { matrix } = buildCoverageMatrix(fixtureInputs())
    const t = matrix.totals.byEngine.cpp
    const sum = (d: 'algorithm' | 'api') =>
      t.byDimension[d].covered + t.byDimension[d].sampled + t.byDimension[d].untested
    expect(sum('algorithm')).toBe(t.advertisedCells)
    expect(sum('api')).toBe(t.advertisedCells)
    for (const r of matrix.rows)
      if (r.engines.cpp.advertised) expect(r.engines.cpp.dimensions).toBeDefined()
  })
})
