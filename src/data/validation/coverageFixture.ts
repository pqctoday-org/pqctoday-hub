// SPDX-License-Identifier: GPL-3.0-only
/**
 * A tiny, fully synthetic coverage-matrix input set for unit tests (never
 * imported by app code). Two engines, three mechanisms:
 *
 *  - CKM_TEST_SIG  (sign + verify, parameter sets P-A / P-B; rust's key-size
 *                   range excludes P-B)
 *  - CKM_TEST_HASH (digest; advertised by cpp only)
 *  - CKM_TEST_KDF  (derive; untested, waived for cpp only)
 *
 * and a declared-unreachable capability. Every number the golden test pins is
 * derivable by hand from this file.
 */
import type {
  CapabilityMap,
  InventoryFile,
  ManifestCaseInfo,
  MatrixInputs,
  RegisteredTest,
  RunResult,
} from './coverageModel'

export const FIXTURE_ARTIFACT = { cpp: 'c'.repeat(64), rust: 'r'.repeat(64) }

const mech = (typeHex: string, name: string, requiredOperations: string[], min = 0, max = 0) => ({
  typeHex,
  name,
  family: 'other',
  ulMinKeySize: min,
  ulMaxKeySize: max,
  flagNames: [],
  requiredOperations,
})

export const fixtureInventory = (): InventoryFile => ({
  engines: {
    cpp: {
      identity: {
        artifacts: [{ path: 'cpp.wasm', sha256: FIXTURE_ARTIFACT.cpp }],
        sourceCommit: 'c0ffee',
        sourceRepo: 'test',
        builtAt: null,
      },
      inventory: {
        mechanismCount: 3,
        inventorySha256: 'i'.repeat(64),
        mechanisms: [
          mech('0x00000001', 'CKM_TEST_SIG', ['sign', 'verify'], 10, 30),
          mech('0x00000002', 'CKM_TEST_HASH', ['digest']),
          mech('0x00000003', 'CKM_TEST_KDF', ['derive']),
        ],
      },
    },
    rust: {
      identity: {
        artifacts: [{ path: 'rust.wasm', sha256: FIXTURE_ARTIFACT.rust }],
        sourceCommit: 'beef',
        sourceRepo: 'test',
        builtAt: null,
      },
      inventory: {
        mechanismCount: 2,
        inventorySha256: 'j'.repeat(64),
        mechanisms: [
          mech('0x00000001', 'CKM_TEST_SIG', ['sign', 'verify'], 10, 15),
          mech('0x00000003', 'CKM_TEST_KDF', ['derive']),
        ],
      },
    },
  },
})

export const fixtureCapabilityMap = (): CapabilityMap => ({
  schema: 'pqctoday.capability-map/v1',
  specification: { title: 't', edition: 't', date: '2026-01-01' },
  signVariantOperations: ['sign'],
  parameterSetGroups: {
    TEST: {
      keySizeMeaning: 'bytes',
      sets: [
        { id: 'P-A', keySize: 12 },
        { id: 'P-B', keySize: 20 },
      ],
      source: 'fixture',
    },
  },
  mechanisms: {
    CKM_TEST_SIG: {
      algorithm: 'TestSig',
      revision: 'T1',
      section: '§9.9',
      parameterSets: 'TEST',
      signVariants: ['hedged', 'deterministic'],
      boundaries: { contextBytes: [0, 255] },
    },
    CKM_TEST_HASH: { algorithm: 'TestHash', revision: null, section: '§9.8' },
    CKM_TEST_KDF: { algorithm: 'TestKdf', revision: null, section: '§9.7' },
  },
  declaredUnreachable: [
    {
      id: 'no-mech',
      algorithm: 'Unreachable thing',
      revision: null,
      operations: ['sign'],
      parameterSets: '',
      reason: 'no mechanism exists',
      openGap: 'g1',
    },
  ],
})

export const fixtureManifestCases = (): Map<string, ManifestCaseInfo> =>
  new Map<string, ManifestCaseInfo>([
    [
      'v#/0',
      {
        evidenceClass: 'nist-acvp-reference-sample',
        status: 'active',
        expectation: 'positive',
        parameters: { contextBytes: 255 },
        testType: 'AFT',
      },
    ],
    [
      'v#/1',
      {
        evidenceClass: 'nist-acvp-reference-sample',
        status: 'active',
        expectation: 'negative',
        parameters: { contextBytes: 3 },
        testType: 'AFT',
      },
    ],
    [
      'v#/q',
      {
        evidenceClass: 'published-standard-kat',
        status: 'quarantined',
        expectation: 'positive',
        parameters: {},
        testType: 'x',
      },
    ],
  ])

export const fixtureRegistry = (): RegisteredTest[] => [
  {
    id: 't.nist',
    runner: 'useAcvpSuite',
    ref: '§1',
    title: 'NIST verify',
    engines: ['cpp', 'rust'],
    cases: [
      {
        caseId: 'v#/0',
        evidenceClass: 'nist-acvp-reference-sample',
        polarity: 'positive',
        exercises: [
          { capability: { mechanism: 'CKM_TEST_SIG', operation: 'verify', parameterSet: 'P-A' } },
        ],
        rowId: 'nist-0-{engine}',
      },
      {
        caseId: 'v#/1',
        evidenceClass: 'nist-acvp-reference-sample',
        polarity: 'negative',
        exercises: [
          { capability: { mechanism: 'CKM_TEST_SIG', operation: 'verify', parameterSet: 'P-A' } },
        ],
        rowId: 'nist-1-{engine}',
      },
    ],
  },
  {
    id: 't.rt',
    runner: 'useAcvpSuite',
    ref: '§2',
    title: 'round-trip',
    engines: ['cpp', 'rust'],
    cases: [
      {
        caseId: 'local:t.rt/1',
        evidenceClass: 'functional-round-trip',
        polarity: 'positive',
        exercises: [
          {
            capability: {
              mechanism: 'CKM_TEST_SIG',
              operation: 'sign',
              parameterSet: 'P-A',
              variant: 'hedged',
            },
          },
          { capability: { mechanism: 'CKM_TEST_SIG', operation: 'verify', parameterSet: 'P-A' } },
        ],
      },
    ],
  },
  {
    id: 't.hash',
    runner: 'useAcvpSuite',
    ref: '§3',
    title: 'hash on cpp',
    engines: ['cpp'],
    cases: [
      {
        caseId: 'local:t.hash/1',
        evidenceClass: 'product-mechanism-probe',
        polarity: 'positive',
        exercises: [{ capability: { mechanism: 'CKM_TEST_HASH', operation: 'digest' } }],
      },
    ],
  },
]

/** Waivers covering exactly today's untested fixture cells. */
export const fixtureWaivers = (): MatrixInputs['waivers'] => ({
  schema: 'pqctoday.coverage-waivers/v1',
  waivers: [
    {
      id: 'w-sig',
      mechanism: 'CKM_TEST_SIG',
      engines: ['cpp'],
      cells: [
        'sign|P-A|deterministic',
        'sign|P-B|hedged',
        'sign|P-B|deterministic',
        'verify|P-B|*',
      ],
      reason: 'fixture',
      owner: 'unassigned',
      date: '2026-09-24',
      status: 'baseline-pending-review',
    },
    {
      id: 'w-sig-rust',
      mechanism: 'CKM_TEST_SIG',
      engines: ['rust'],
      cells: ['sign|P-A|deterministic'],
      reason: 'fixture',
      owner: 'unassigned',
      date: '2026-09-24',
      status: 'baseline-pending-review',
    },
    {
      id: 'w-kdf',
      mechanism: 'CKM_TEST_KDF',
      engines: ['cpp', 'rust'],
      cells: ['derive|*|*'],
      reason: 'fixture',
      owner: 'someone',
      date: '2026-09-24',
      status: 'approved',
    },
  ],
})

export const fixtureInputs = (runResults: RunResult[] = []): MatrixInputs => ({
  inventory: fixtureInventory(),
  capabilityMap: fixtureCapabilityMap(),
  registry: fixtureRegistry(),
  manifestCases: fixtureManifestCases(),
  waivers: fixtureWaivers(),
  openGaps: {
    schema: 'pqctoday.open-gaps/v1',
    gaps: [
      {
        id: 'g1',
        title: 'Curated gap',
        detail: 'd',
        planItem: 'X-1',
        owner: 'unassigned',
        status: 'open',
        scope: 'both',
      },
    ],
  },
  runResults,
})
