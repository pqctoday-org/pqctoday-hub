// SPDX-License-Identifier: GPL-3.0-only
/**
 * Non-vacuity proof for the vector reachability check.
 *
 * The failure this gate exists to eliminate is a green "0 orphans" that could
 * not have been red. So the checker's own tracing is proven HERE in both
 * directions — a vector file something loads must be reported reached, and a
 * vector file nothing loads must be reported orphaned — and so is the specific
 * confusion that produced the hsm eddsa miss: a filename in a COMMENT must
 * never look like a read.
 *
 * `assertNonVacuous` is itself exercised against a deliberately-broken report,
 * because a guard that cannot fail is not a guard.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ALLOWLIST,
  NON_EXECUTING_READERS,
  NON_VECTOR_SIDECARS,
  RUNTIME_LOADERS,
  VECTOR_ROOTS,
  assertNonVacuous,
  computeReport,
  countCases,
  enumerateVectorUniverse,
  parseModule,
  resolveSpecifier,
  stringLiterals,
  type Declarations,
  type Report,
  type VectorFacts,
} from './check-vector-reachability'

const ROOT = path.resolve(import.meta.dirname, '..', '..')

const LOADED = 'src/data/acvp/mlkem_test.json'
const SYNTHETIC = 'src/data/acvp/__reachability_probe__/synthetic-orphan_test.json'

const declarations = (over: Partial<Declarations> = {}): Declarations => ({
  manifestCases: new Map([[LOADED, 3]]),
  vectorRoot: 'src/data/acvp',
  registeredCases: new Map([[LOADED, 3]]),
  ...over,
})

const facts = (entries: Partial<VectorFacts>[]): Map<string, VectorFacts> =>
  new Map(
    entries.map((e) => [
      e.file!,
      {
        file: e.file!,
        casesOnDisk: e.casesOnDisk ?? 1,
        casesBasis: e.casesBasis ?? 'tcId',
        declaredCases: e.declaredCases ?? null,
        registeredCases: e.registeredCases ?? 0,
        reached: e.reached ?? [],
        mockedOnlyBy: e.mockedOnlyBy ?? [],
      },
    ])
  )

describe('computeReport — both directions', () => {
  it('reports a vector file an executing test loads as REACHED, not orphaned', () => {
    const report = computeReport(
      [LOADED],
      facts([
        {
          file: LOADED,
          declaredCases: 3,
          registeredCases: 3,
          reached: [
            { mechanism: 'module-graph import', via: 'src/utils/katRunner.test.ts', tier: 'ci' },
          ],
        },
      ]),
      declarations(),
      []
    )
    expect(report.orphans).toEqual([])
    expect(report.states.inManifestExecuted).toEqual([LOADED])
    expect(report.states.inManifestNotExecuted).toEqual([])
  })

  it('reports a vector file nothing loads as an ORPHAN, with its case count and a reason', () => {
    const report = computeReport(
      [SYNTHETIC],
      facts([{ file: SYNTHETIC, casesOnDisk: 20 }]),
      declarations(),
      []
    )
    expect(report.orphans).toHaveLength(1)
    expect(report.orphans[0]?.file).toBe(SYNTHETIC)
    // The count is what makes the loss legible — an orphan without one is a shrug.
    expect(report.orphans[0]?.cases).toBe(20)
    expect(report.orphans[0]?.reason).toMatch(/no executing test loads it/)
  })

  it('names the hsm failure mode when a file is DECLARED but unexecuted', () => {
    const report = computeReport(
      ['src/data/acvp/eddsa_test.json'],
      facts([
        {
          file: 'src/data/acvp/eddsa_test.json',
          casesOnDisk: 20,
          declaredCases: 20,
          registeredCases: 4,
        },
      ]),
      declarations({ manifestCases: new Map([['src/data/acvp/eddsa_test.json', 20]]) }),
      []
    )
    expect(report.states.inManifestNotExecuted).toEqual(['src/data/acvp/eddsa_test.json'])
    expect(report.orphans[0]?.reason).toMatch(/declares 20 case\(s\) for it/)
    expect(report.orphans[0]?.reason).toMatch(/a declaration is not an execution/)
  })

  it('explains a mocked-away vector differently from an unreferenced one', () => {
    const report = computeReport(
      [LOADED],
      facts([{ file: LOADED, mockedOnlyBy: ['src/utils/katRunner.test.ts'] }]),
      declarations(),
      []
    )
    expect(report.orphans[0]?.reason).toMatch(/vi\.mock\(\) it away/)
    expect(report.orphans[0]?.reason).toContain('src/utils/katRunner.test.ts')
  })

  it('separates the manifest states that mean different things', () => {
    const report = computeReport(
      ['src/data/acvp/undeclared_test.json', 'public/kmip-corpus/pqc/x.xml'],
      facts([
        {
          file: 'src/data/acvp/undeclared_test.json',
          reached: [{ mechanism: 'm', via: 't', tier: 'ci' }],
        },
        {
          file: 'public/kmip-corpus/pqc/x.xml',
          reached: [{ mechanism: 'm', via: 't', tier: 'ci' }],
        },
      ]),
      declarations({ manifestCases: new Map() }),
      []
    )
    // Inside the manifest's own root but missing from it: a real gap.
    expect(report.states.onDiskNotInManifestInRoot).toEqual(['src/data/acvp/undeclared_test.json'])
    expect(report.states.executedNotInManifest).toEqual(['src/data/acvp/undeclared_test.json'])
    // Outside the domain the manifest ever claimed: a scope fact, not drift.
    expect(report.states.onDiskOutsideManifestDomain).toEqual(['public/kmip-corpus/pqc/x.xml'])
  })

  it('flags a file executed but with no registered case, without calling it an orphan', () => {
    const report = computeReport(
      [LOADED],
      facts([
        {
          file: LOADED,
          declaredCases: 3,
          registeredCases: 0,
          reached: [{ mechanism: 'm', via: 't', tier: 'ci' }],
        },
      ]),
      declarations(),
      []
    )
    expect(report.states.executedNotInRegistry).toEqual([LOADED])
    expect(report.orphans).toEqual([])
  })

  it('records a local-tier-only execution as a warning, not a failure, and defers to the other gate', () => {
    const report = computeReport(
      [LOADED],
      facts([
        {
          file: LOADED,
          declaredCases: 3,
          reached: [{ mechanism: 'm', via: 'src/x.local.test.ts', tier: 'local' }],
        },
      ]),
      declarations(),
      []
    )
    expect(report.orphans).toEqual([])
    expect(report.localTierOnly[0]?.file).toBe(LOADED)
    expect(report.localTierOnly[0]?.reason).toMatch(/check-test-reachability/)
  })

  it('reports cases present on disk that the manifest does not declare', () => {
    const report = computeReport(
      [LOADED],
      facts([
        {
          file: LOADED,
          casesOnDisk: 72,
          declaredCases: 60,
          reached: [{ mechanism: 'm', via: 't', tier: 'ci' }],
        },
      ]),
      declarations(),
      []
    )
    expect(report.undeclaredCasesInDeclaredFile).toEqual([
      { file: LOADED, onDisk: 72, declared: 60 },
    ])
  })
})

describe('the allowlist and the sidecar exclusions cannot rot quietly', () => {
  it('an allowlist entry suppresses the orphan…', () => {
    const report = computeReport(
      [SYNTHETIC],
      facts([{ file: SYNTHETIC }]),
      declarations(),
      [{ file: SYNTHETIC, reason: 'test' }],
      []
    )
    expect(report.orphans).toEqual([])
    expect(report.staleAllowlist).toEqual([])
  })

  it('…but a STALE allowlist entry is reported: reached anyway', () => {
    const report = computeReport(
      [LOADED],
      facts([{ file: LOADED, reached: [{ mechanism: 'm', via: 'src/a.test.ts', tier: 'ci' }] }]),
      declarations(),
      [{ file: LOADED, reason: 'test' }],
      []
    )
    expect(report.staleAllowlist.map((s) => s.file)).toEqual([LOADED])
    expect(report.staleAllowlist[0]?.reason).toMatch(/actually executed by/)
  })

  it('…and a STALE allowlist entry is reported: file is gone', () => {
    const report = computeReport([LOADED], facts([{ file: LOADED }]), declarations(), [
      { file: 'src/data/acvp/gone_test.json', reason: 'x' },
    ])
    expect(report.staleAllowlist.map((s) => s.file)).toEqual(['src/data/acvp/gone_test.json'])
    expect(report.staleAllowlist[0]?.reason).toMatch(/does not exist/)
  })

  it('a sidecar exclusion whose shape changed is reported — it may hold cases now', () => {
    const report = computeReport(
      [],
      new Map(),
      declarations(),
      [],
      [
        {
          file: 'public/kmip-corpus/manifest.json',
          expectedBasis: 'none',
          reason: 'wrongly judged',
        },
      ],
      new Map([['public/kmip-corpus/manifest.json', 'tests[]']])
    )
    expect(report.staleSidecars[0]?.file).toBe('public/kmip-corpus/manifest.json')
    expect(report.staleSidecars[0]?.reason).toMatch(/re-judge it/)
  })

  it('every allowlist entry carries a real reason', () => {
    for (const a of ALLOWLIST) expect(a.reason.length).toBeGreaterThan(40)
  })

  it('every sidecar exclusion carries a real reason and an expected shape', () => {
    for (const s of NON_VECTOR_SIDECARS) {
      expect(s.reason.length).toBeGreaterThan(40)
      expect(s.expectedBasis.length).toBeGreaterThan(0)
    }
  })
})

describe('a filename in a COMMENT is not a read — the hsm eddsa lesson', () => {
  it('strips line and block comments before looking for path literals', () => {
    const src = [
      '// vectors live in src/data/acvp/eddsa_test.json',
      '/* and in src/data/acvp/eddsa_ed448_test.json */',
      "const p = 'src/data/acvp/mlkem_test.json'",
    ].join('\n')
    const literals = stringLiterals(src)
    expect(literals).toContain('src/data/acvp/mlkem_test.json')
    expect(literals.join(' ')).not.toContain('eddsa_test.json')
    expect(literals.join(' ')).not.toContain('eddsa_ed448_test.json')
  })

  it('keeps a URL literal intact (the `//` in https:// must not eat the string)', () => {
    expect(stringLiterals("fetch('https://example.test/a.json')")).toContain(
      'https://example.test/a.json'
    )
  })
})

describe('the specifier resolver is real', () => {
  it('resolves the vite `@` alias to src/', () => {
    expect(resolveSpecifier('src/x/y.ts', '@/data/acvp/mlkem_test.json')).toBe(
      'src/data/acvp/mlkem_test.json'
    )
  })

  it('resolves a relative specifier and strips a ?raw suffix', () => {
    expect(
      resolveSpecifier(
        'src/wasm/pkcs11ConformanceRunner/x.ts',
        '../../data/pkcs11-profiles/test-cases/BL-M-1-32.xml?raw'
      )
    ).toBe('src/data/pkcs11-profiles/test-cases/BL-M-1-32.xml')
  })

  it('returns null for anything outside this repo rather than inventing a path', () => {
    expect(resolveSpecifier('src/x.ts', 'vitest')).toBeNull()
    expect(resolveSpecifier('src/x.ts', 'node:fs')).toBeNull()
    expect(resolveSpecifier('src/x.ts', '@sdk/whatever')).toBeNull()
    expect(resolveSpecifier('src/x.ts', './does-not-exist')).toBeNull()
  })
})

describe('parseModule sees every way a vector is pulled in', () => {
  const src = [
    "import a from '@/data/acvp/mlkem_test.json'",
    "const b = await import('@/data/acvp/mldsa_test.json')",
    "const c = require('@/data/acvp/aesgcm_test.json')",
    "import xml from '@/data/pkcs11-profiles/test-cases/BL-M-1-32.xml?raw'",
    "import { thing } from '@/utils/katRunner'",
    "vi.mock('@/data/acvp/sha256_test.json', () => ({ default: {} }))",
  ].join('\n')
  const edges = parseModule('src/a.test.ts', src)

  it('collects static, dynamic, require and ?raw data references', () => {
    expect(edges.dataRefs).toEqual(
      expect.arrayContaining([
        'src/data/acvp/mlkem_test.json',
        'src/data/acvp/mldsa_test.json',
        'src/data/acvp/aesgcm_test.json',
        'src/data/pkcs11-profiles/test-cases/BL-M-1-32.xml',
      ])
    )
  })

  it('follows source modules as graph children, not as data', () => {
    expect(edges.children).toContain('src/utils/katRunner.ts')
    expect(edges.dataRefs).not.toContain('src/utils/katRunner.ts')
  })

  it('records a vi.mock()ed path separately from a real load', () => {
    expect(edges.mocked).toContain('src/data/acvp/sha256_test.json')
    expect(edges.dataRefs).not.toContain('src/data/acvp/sha256_test.json')
  })
})

describe('countCases', () => {
  it('counts ACVP cases by tcId', () => {
    const text = JSON.stringify({ testGroups: [{ tests: [{ tcId: 1 }, { tcId: 2 }] }] })
    expect(countCases('x.json', text)).toEqual({ count: 2, basis: 'tcId' })
  })

  it('falls back to a vectors[] / tests[] array when there is no tcId', () => {
    expect(countCases('x.json', JSON.stringify({ vectors: [1, 2, 3] }))).toEqual({
      count: 3,
      basis: 'vectors[]',
    })
    expect(countCases('x.json', JSON.stringify({ testGroups: [{ tests: [{}, {}] }] }))).toEqual({
      count: 2,
      basis: 'tests[]',
    })
  })

  it('reports basis "none" for an index/provenance sidecar, which is how an exclusion is validated', () => {
    expect(countCases('x.json', JSON.stringify({ sha256: 'ab', retrieved: '2026-01-01' }))).toEqual(
      {
        count: 0,
        basis: 'none',
      }
    )
  })

  it('treats a transcript as one case', () => {
    expect(countCases('a/b.xml', '<KMIP/>')).toEqual({ count: 1, basis: 'transcript-or-blob' })
  })

  it('never claims more cases than the manifest declares for a real vector file', async () => {
    const manifest = JSON.parse(
      readFileSync(path.join(ROOT, 'src/data/validation/vector-manifest.json'), 'utf8')
    ) as { files: { path: string; cases: unknown[] }[] }
    for (const f of manifest.files) {
      const { count } = countCases(f.path, readFileSync(path.join(ROOT, f.path), 'utf8'))
      // The manifest may deliberately declare a SUBSET of a file's cases, so
      // on-disk >= declared. on-disk < declared would mean the counter is blind
      // to a shape, which would understate every orphan it ever reports.
      expect(
        count,
        `${f.path}: counter found fewer cases than the manifest declares`
      ).toBeGreaterThanOrEqual(f.cases.length)
    }
  })
})

describe('the declared tables stay honest', () => {
  it('has unique root ids, each with a reason', () => {
    expect(new Set(VECTOR_ROOTS.map((r) => r.id)).size).toBe(VECTOR_ROOTS.length)
    for (const r of VECTOR_ROOTS) {
      expect(r.patterns.length).toBeGreaterThan(0)
      expect(r.reason.length).toBeGreaterThan(40)
    }
  })

  it('every runtime loader cites the code it mirrors and says why a static scan cannot see it', () => {
    expect(new Set(RUNTIME_LOADERS.map((l) => l.id)).size).toBe(RUNTIME_LOADERS.length)
    for (const l of RUNTIME_LOADERS) {
      expect(l.modules.length, `${l.id} must name the module(s) doing the reading`).toBeGreaterThan(
        0
      )
      expect(l.citation, `${l.id} must cite a file:line`).toMatch(/\.(ts|tsx):\d+/)
      expect(l.reason.length).toBeGreaterThan(40)
    }
  })

  it('every runtime loader actually resolves files that exist in the universe', async () => {
    const universe = new Set(await enumerateVectorUniverse())
    for (const l of RUNTIME_LOADERS) {
      const resolved = l.resolve()
      expect(
        resolved.length,
        `${l.id} resolved nothing — its replay of the loader rule is broken`
      ).toBeGreaterThan(0)
      for (const f of resolved) {
        expect(universe.has(f), `${l.id} resolved ${f}, which is not in the vector universe`).toBe(
          true
        )
      }
    }
  })

  it('no module is both a runtime loader and a non-executing reader', () => {
    const loaders = new Set(RUNTIME_LOADERS.flatMap((l) => l.modules))
    for (const r of NON_EXECUTING_READERS) expect(loaders.has(r.module)).toBe(false)
  })

  it('every non-executing reader says which kind of non-execution it is, and why', () => {
    for (const r of NON_EXECUTING_READERS) {
      expect(['provenance', 'spec-table', 'app-runtime']).toContain(r.kind)
      expect(r.reason.length).toBeGreaterThan(40)
    }
  })
})

describe('the vector universe is real', () => {
  it('finds the files we know are there, and excludes the declared sidecars', async () => {
    const universe = await enumerateVectorUniverse()
    expect(universe).toContain('src/data/acvp/eddsa_test.json')
    expect(universe).toContain('src/data/acvp/eddsa_ed448_test.json')
    expect(universe).toContain('src/test/kat/fixtures/ml-kem-768.json')
    expect(universe).toContain('public/kmip-corpus/oasis/mandatory/QS-M-1-30.xml')
    // Sanity floor: a universe that collapsed would make "0 orphans" meaningless.
    expect(universe.length).toBeGreaterThan(150)
    for (const s of NON_VECTOR_SIDECARS) expect(universe).not.toContain(s.file)
    expect(universe).not.toContain(SYNTHETIC)
  })
})

describe('assertNonVacuous can itself fail', () => {
  const emptyReport = (): Report => ({
    facts: new Map(),
    orphans: [],
    localTierOnly: [],
    states: {
      inManifestExecuted: [],
      inManifestNotExecuted: [],
      onDiskNotInManifestInRoot: [],
      onDiskOutsideManifestDomain: [],
      executedNotInManifest: [],
      executedNotInRegistry: [],
    },
    undeclaredCasesInDeclaredFile: [],
    staleAllowlist: [],
    staleSidecars: [],
  })

  it('direction 1: a sentinel that resolved to nothing is a hard failure', () => {
    const problems = assertNonVacuous(emptyReport(), [], declarations(), {
      modules: new Set(),
      loaderResolved: new Map(),
    })
    expect(problems.join('\n')).toMatch(/direction 1.*static import/s)
    expect(problems.join('\n')).toMatch(/direction 1.*runtime loader/s)
  })

  it('direction 3: a loader resolving a file outside the universe is a hard failure', () => {
    const problems = assertNonVacuous(emptyReport(), [], declarations(), {
      modules: new Set(),
      loaderResolved: new Map([['x', ['not/in/universe.xml']]]),
    })
    expect(problems.join('\n')).toMatch(/direction 3.*roots are too narrow/s)
  })

  it('direction 3: a loader resolving nothing at all is a hard failure', () => {
    const problems = assertNonVacuous(emptyReport(), [], declarations(), {
      modules: new Set(),
      loaderResolved: new Map([['x', []]]),
    })
    expect(problems.join('\n')).toMatch(/direction 3.*resolved 0 files/s)
  })

  it('direction 4: a collapsed module graph is a hard failure, not a quiet "0 orphans"', () => {
    const problems = assertNonVacuous(emptyReport(), [], declarations(), {
      modules: new Set(['src/a.ts']),
      loaderResolved: new Map(),
    })
    expect(problems.join('\n')).toMatch(/direction 4.*resolving nothing/s)
    expect(problems.join('\n')).toMatch(
      /src\/utils\/katRunner\.ts is not in the traced module graph/
    )
  })
})
