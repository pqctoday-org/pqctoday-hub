// SPDX-License-Identifier: GPL-3.0-only
/**
 * coverageModel — the capability × evidence coverage matrix (plan WS-C,
 * C-1..C-5, J-7). Pure functions only: the generator
 * (scripts/generate-coverage-matrix.ts), its tests and the public page all
 * share these definitions, so the rules printed on the page are the rules the
 * numbers were computed with.
 *
 * Inputs, all committed files:
 *  - mechanism-inventory.generated.json — what each engine ADVERTISES at
 *    runtime (C_GetMechanismList + C_GetMechanismInfo). DISCOVERED.
 *  - capability-map.json — reviewed mechanism → algorithm mapping (revision,
 *    PKCS #11 section, parameter sets, sign variants, boundaries). DECLARED.
 *  - testRegistry.ts — which registered test case exercises which capability
 *    cell, on which engines, with which evidence class and polarity.
 *  - vector-manifest.json — provenance/evidence class of every vector case.
 *  - coverage-waivers.json / open-gaps.json — reviewed dispositions.
 *  - run results (optional) — recorded pass/fail per engine/artifact. None are
 *    committed yet, so parity is "not established" everywhere.
 *
 * What a cell status means: the STRONGEST evidence class among REGISTERED test
 * cases that exercise that cell on that engine. It says a test exists and what
 * kind of expected value it checks. It does NOT say the test passed — only a
 * recorded run result can say that.
 */
import type { EvidenceClassId } from './evidenceClasses'

// ── Enumerations ─────────────────────────────────────────────────────────────

export type EngineId = 'cpp' | 'rust'
export const ENGINES: readonly EngineId[] = ['cpp', 'rust']
export const ENGINE_LABEL: Record<EngineId, string> = { cpp: 'C++', rust: 'Rust' }

/** Plan C-2 status vocabulary, strongest first. Generation fails on anything else. */
export const MATRIX_STATUSES = [
  'acvts-issued',
  'nist-reference',
  'standard-kat',
  'oracle',
  'differential',
  'round-trip',
  'behavior-only',
  'untested',
  'unsupported',
] as const
export type MatrixStatus = (typeof MATRIX_STATUSES)[number]

export const STATUS_LABEL: Record<MatrixStatus, string> = {
  'acvts-issued': 'ACVTS-issued vector',
  'nist-reference': 'NIST ACVP-Server reference sample',
  'standard-kat': 'Published standard KAT',
  oracle: 'Independent oracle',
  differential: 'Cross-implementation differential',
  'round-trip': 'Functional round-trip',
  'behavior-only': 'Behavior only (no expected output value)',
  untested: 'Untested',
  unsupported: 'Unsupported (not advertised)',
}

export const EVIDENCE_TO_STATUS: Record<EvidenceClassId, MatrixStatus> = {
  'acvts-issued-vector': 'acvts-issued',
  'nist-acvp-reference-sample': 'nist-reference',
  'published-standard-kat': 'standard-kat',
  'independent-oracle': 'oracle',
  'cross-implementation-differential': 'differential',
  'functional-round-trip': 'round-trip',
  'oasis-profile-case': 'behavior-only',
  'product-mechanism-probe': 'behavior-only',
}

/** Statuses whose expected value comes from outside the implementation under test. */
export const EXTERNAL_EXPECTED_STATUSES: ReadonlySet<MatrixStatus> = new Set([
  'acvts-issued',
  'nist-reference',
  'standard-kat',
  'oracle',
])

export const POLARITIES = ['positive', 'negative', 'boundary', 'state-error'] as const
export type Polarity = (typeof POLARITIES)[number]
/** Polarity a registered case declares; `boundary` is derived (see BOUNDARY rule). */
export type DeclaredPolarity = Exclude<Polarity, 'boundary'>

export const COVERAGE_LEVELS = ['covered', 'sampled', 'untested', 'unsupported'] as const
export type CoverageLevel = (typeof COVERAGE_LEVELS)[number]

export const ARTIFACT_KINDS = ['wasm', 'native', 'hardware'] as const
export type ArtifactKind = (typeof ARTIFACT_KINDS)[number]

export type ParityStatus = 'parity' | 'divergent' | 'not-established' | 'single-engine'

/** Minimum distinct registered cases for a polarity to be "covered" (plan Q5). */
export const COVERED_MIN_CASES = 2

/** The rules, verbatim, as they are printed on the page and in every export. */
export const MATRIX_RULES = {
  cell: 'A capability cell is one (mechanism, operation, parameter set, sign variant). Mechanism, operation (from CKF_ flags) and key-size range are DISCOVERED from the running engine (C_GetMechanismList + C_GetMechanismInfo); parameter sets, sign variants and boundaries are DECLARED in capability-map.json and kept only when the parameter set falls inside the engine-reported key-size range.',
  denominator:
    'Denominator (per engine) = advertised capability cells: the engine lists the mechanism, sets the CKF_ flag for the operation, and the declared parameter set falls inside its reported key-size range. Cells the engine does not advertise, and declared capabilities no PKCS #11 mechanism can express, are counted separately as unsupported and shown — never dropped.',
  status:
    'Cell status = the strongest evidence class among registered test cases that exercise the cell on that engine (order: acvts-issued > nist-reference > standard-kat > oracle > differential > round-trip > behavior-only). No registered case = untested. Not advertised = unsupported. A status says a test EXISTS; it is not a pass.',
  covered: `Covered (per polarity) = at least ${COVERED_MIN_CASES} distinct registered cases of that polarity exercise the cell AND, for positive, at least one of them checks an externally expected value (acvts-issued, nist-reference, standard-kat or oracle). A cell is covered overall only when positive, negative, boundary and state-error are all covered.`,
  sampled:
    'Sampled = at least one registered case, but the covered rule is not met. One happy-path case is always "sampled", never "covered" (plan Q5).',
  polarity:
    'Polarities are counted separately: a positive case never counts toward negative, boundary or state-error. Boundary = a registered case whose recorded parameters hit a declared boundary of the cell (e.g. context length 0 or 255, empty message); it may also be a positive or negative case. State-error = a case asserting a PKCS #11 state or argument error.',
  parity:
    'Parity = both engines have a RECORDED PASS of the same registered case on the same artifact kind. Skipped, unsupported and not-run never count as a pass, and a recorded result counts only for the exact artifact (sha256) the mechanism inventory records. Rows with no such pair are "not established".',
  artifacts:
    'Artifact kinds are reported separately: wasm (the two shipped WebAssembly engines — registered tests run in the browser), native, hardware. Native and hardware targets have not been run: they are "not run" and never counted as pass.',
} as const

// ── Capability map (declared) ────────────────────────────────────────────────

export interface ParameterSetDecl {
  id: string
  keySize: number
}

export interface ParameterSetGroup {
  keySizeMeaning: string
  sets: ParameterSetDecl[]
  source: string
}

export interface MechanismDecl {
  algorithm: string
  revision: string | null
  section: string | null
  vendorDefined?: boolean
  historical?: boolean
  parameterSets?: string
  signVariants?: string[]
  preHash?: string
  externalMu?: boolean
  context?: string
  tagBits?: number[]
  /** Parameter name → values that make a case a boundary case for this mechanism. */
  boundaries?: Record<string, number[]>
}

export interface DeclaredUnreachable {
  id: string
  algorithm: string
  revision: string | null
  operations: string[]
  parameterSets: string
  reason: string
  openGap: string
}

export interface CapabilityMap {
  schema: string
  specification: { title: string; edition: string; date: string }
  signVariantOperations: string[]
  parameterSetGroups: Record<string, ParameterSetGroup>
  mechanisms: Record<string, MechanismDecl>
  declaredUnreachable: DeclaredUnreachable[]
}

// ── Inventory (discovered) — the subset of mechanism-inventory.generated.json read here ──

export interface InventoryMechanism {
  typeHex: string
  name: string | null
  family: string | null
  ulMinKeySize: number
  ulMaxKeySize: number
  flagNames: string[]
  requiredOperations: string[]
}

export interface InventoryEngine {
  identity: {
    artifacts: { path: string; sha256: string }[]
    sourceCommit: string | null
    sourceRepo: string | null
    builtAt: string | null
  }
  inventory: { mechanismCount: number; inventorySha256: string; mechanisms: InventoryMechanism[] }
}

export interface InventoryFile {
  engines: Record<EngineId, InventoryEngine>
}

// ── Test registry ────────────────────────────────────────────────────────────

export interface CapabilityRef {
  mechanism: string
  operation: string
  parameterSet?: string
  variant?: string
}

export interface CaseExercise {
  capability: CapabilityRef
  /** Defaults to the case's evidence class. */
  evidenceClass?: EvidenceClassId
  /** Defaults to the case's polarity. */
  polarity?: DeclaredPolarity
}

export type CaseParams = Record<string, string | number | boolean | null>

export interface RegisteredCase {
  /** vector-manifest caseId (`file#pointer`) or `local:<test-id>/<n>` for inputs outside the manifest. */
  caseId: string
  /** Distinguishes one manifest case executed several times with different inputs (e.g. per parameter set). */
  instance?: string
  evidenceClass: EvidenceClassId
  polarity: DeclaredPolarity
  /** Recorded input parameters (manifest parameters are merged in for manifest cases). */
  parameters?: CaseParams
  exercises: CaseExercise[]
  /** Runtime result-row id, `{engine}` = C++ | Rust. */
  rowId?: string
  /** katRunner cases: the KatKind that executes this case — the join key the
   *  Algorithms KAT view and Learn panels use to find their evidence record. */
  katKind?: KatKindRef
  /** Local cases whose expected values come from a document outside the vector
   *  manifest (e.g. 3GPP TS 33.501 Annex C.4): what the case was checked against. */
  source?: { citation: string; url?: string }
  /** The operation this runner executes when it differs from the manifest's
   *  recorded local operation (e.g. MAC generation on a case the workbench verifies). */
  operation?: string
  note?: string
}

/** A katRunner KatKind as plain data (the registry does not import the runner). */
export type KatKindRef = { type: string } & Record<string, string | number | undefined>

export type RunnerId =
  'useAcvpSuite' | 'katRunner' | 'mechanismCoverageProbes' | 'profileConditions' | 'oasisProfileXml'

export interface RegisteredTest {
  id: string
  runner: RunnerId
  /** Where it lives: section number, KatKind, probe id… */
  ref: string
  title: string
  engines: EngineId[]
  cases: RegisteredCase[]
  note?: string
}

/** The subset of a manifest case the join needs. */
export interface ManifestCaseInfo {
  evidenceClass: string
  status: 'active' | 'quarantined'
  expectation: 'positive' | 'negative'
  parameters: CaseParams
  testType: string
}

// ── Waivers, open gaps, run results ──────────────────────────────────────────

export type WaiverStatus = 'approved' | 'baseline-pending-review'
export const WAIVER_STATUSES: readonly WaiverStatus[] = ['approved', 'baseline-pending-review']

export interface Waiver {
  id: string
  mechanism: string
  engines: EngineId[]
  /** `operation|parameterSet|variant` — exact cells, no wildcards. */
  cells: string[]
  reason: string
  owner: string
  date: string
  status: WaiverStatus
}

export interface WaiverFile {
  schema: string
  waivers: Waiver[]
}

export type GapStatus = 'open' | 'in-progress' | 'accepted-limitation'
export const GAP_STATUSES: readonly GapStatus[] = ['open', 'in-progress', 'accepted-limitation']

export interface OpenGap {
  id: string
  title: string
  detail: string
  planItem: string | null
  owner: string
  status: GapStatus
  /** Engines / artifact kinds / mechanisms the gap applies to, for display. */
  scope: string
  /** 'curated' = reviewed entry in open-gaps.json; 'generated' = derived from the matrix. */
  origin?: 'curated' | 'generated'
  /** Capability cells (row × engine) this gap stands for in the denominators. */
  cells?: number
}

export interface OpenGapFile {
  schema: string
  gaps: OpenGap[]
}

/** Where a set of run results came from (shown next to every parity number). */
export interface RunResultSource {
  file: string
  runner: string
  artifactKind: ArtifactKind
  host: string
  environment: Record<string, string>
  hubCommit: string
  recordedAt: string
  results: number
}

export interface RunResult {
  engine: EngineId
  artifactKind: ArtifactKind
  artifactSha256: string
  /** `${testId}#${caseKey}` — see caseKeyOf(). */
  registryCase: string
  status: 'pass' | 'fail' | 'skip'
}

// ── Output shape ─────────────────────────────────────────────────────────────

export interface PolarityCell {
  status: MatrixStatus
  level: CoverageLevel
  /** Distinct registered cases (indexes into matrix.cases). */
  cases: number[]
}

export interface EngineCell {
  advertised: boolean
  /** Why the engine does not advertise the cell (unsupported only). */
  reason?: string
  level: CoverageLevel
  polarity: Record<Polarity, PolarityCell>
  waiver?: string
  /** Recorded wasm run results over this cell's registered cases (absent = none recorded). */
  run?: { pass: number; fail: number }
}

export interface MatrixRow {
  key: string
  mechanism: string | null
  typeHex: string | null
  algorithm: string
  revision: string | null
  section: string | null
  family: string
  operation: string
  parameterSet: string
  variant: string
  source: {
    mechanism: 'discovered' | 'declared'
    parameterSet: 'declared' | 'not-enumerated'
    mapping: 'reviewed' | 'discovered-only'
  }
  testTypes: string[]
  engines: Record<EngineId, EngineCell>
  parity: Record<Polarity, ParityStatus>
}

export interface MatrixCaseRef {
  id: string
  test: string
  runner: RunnerId
  caseId: string
  instance?: string
  evidenceClass: EvidenceClassId
  status: MatrixStatus
  polarity: DeclaredPolarity
  engines: EngineId[]
  rowId?: string
}

export interface LevelCounts {
  covered: number
  sampled: number
  untested: number
}

export interface EngineTotals {
  advertisedCells: number
  unsupportedCells: number
  overall: LevelCounts
  byPolarity: Record<Polarity, LevelCounts & { byStatus: Record<MatrixStatus, number> }>
  byArtifact: Record<
    ArtifactKind,
    { status: string; registeredCells: number; passedCells: number; failedCells: number }
  >
}

export interface CoverageMatrix {
  $comment: string
  schema: 'pqctoday.coverage-matrix/v1'
  inputs: Record<string, string>
  statuses: readonly MatrixStatus[]
  statusLabels: Record<MatrixStatus, string>
  polarities: readonly Polarity[]
  rules: typeof MATRIX_RULES
  definitions: {
    numerator: string
    denominator: string
    coveredMinCases: number
  }
  engines: Record<
    EngineId,
    {
      label: string
      mechanismCount: number
      inventorySha256: string
      sourceCommit: string | null
      artifacts: { path: string; sha256: string }[]
    }
  >
  artifactKinds: Record<ArtifactKind, { status: string; note: string }>
  runResultSources: RunResultSource[]
  totals: {
    rows: number
    declaredUnreachableRows: number
    byEngine: Record<EngineId, EngineTotals>
    parity: Record<Polarity, Record<ParityStatus, number>>
    waivers: { waivedCells: number; pendingReviewCells: number; staleCells: number }
  }
  rows: MatrixRow[]
  cases: MatrixCaseRef[]
  openGaps: OpenGap[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const ANY = '*'

export const capabilityKey = (c: CapabilityRef): string =>
  `${c.mechanism}|${c.operation}|${c.parameterSet ?? ANY}|${c.variant ?? ANY}`

export const caseKeyOf = (c: Pick<RegisteredCase, 'caseId' | 'instance'>): string =>
  c.instance ? `${c.caseId}@${c.instance}` : c.caseId

const STATUS_RANK = new Map<MatrixStatus, number>(MATRIX_STATUSES.map((s, i) => [s, i]))

export const isMatrixStatus = (s: unknown): s is MatrixStatus =>
  typeof s === 'string' && (MATRIX_STATUSES as readonly string[]).includes(s)

/** Throws on a status outside the plan C-2 vocabulary (the "fail on unknown status" rule). */
export const assertStatus = (s: unknown, where: string): MatrixStatus => {
  if (!isMatrixStatus(s)) throw new Error(`unknown coverage status "${String(s)}" at ${where}`)
  return s
}

export const strongest = (statuses: MatrixStatus[]): MatrixStatus =>
  statuses.reduce<MatrixStatus>(
    (best, s) => ((STATUS_RANK.get(s) ?? 99) < (STATUS_RANK.get(best) ?? 99) ? s : best),
    'untested'
  )

export const levelFor = (polarity: Polarity, statuses: MatrixStatus[]): CoverageLevel => {
  if (statuses.length === 0) return 'untested'
  if (statuses.length < COVERED_MIN_CASES) return 'sampled'
  if (polarity === 'positive' && !statuses.some((s) => EXTERNAL_EXPECTED_STATUSES.has(s))) {
    return 'sampled'
  }
  return 'covered'
}

const emptyPolarity = (
  status: MatrixStatus,
  level: CoverageLevel
): Record<Polarity, PolarityCell> =>
  Object.fromEntries(POLARITIES.map((p) => [p, { status, level, cases: [] }])) as unknown as Record<
    Polarity,
    PolarityCell
  >

const OP_ORDER = [
  'generate-key',
  'generate-key-pair',
  'encrypt',
  'decrypt',
  'sign',
  'verify',
  'sign-recover',
  'verify-recover',
  'digest',
  'derive',
  'wrap',
  'unwrap',
  'encapsulate',
  'decapsulate',
  'message-encrypt',
  'message-decrypt',
  'message-sign',
  'message-verify',
  'message-encrypt-multipart',
  'message-decrypt-multipart',
  'message-sign-multipart',
  'message-verify-multipart',
]
const opRank = (op: string) => {
  const i = OP_ORDER.indexOf(op)
  return i < 0 ? OP_ORDER.length : i
}

// ── Build ────────────────────────────────────────────────────────────────────

export interface MatrixInputs {
  inventory: InventoryFile
  capabilityMap: CapabilityMap
  registry: RegisteredTest[]
  manifestCases: Map<string, ManifestCaseInfo>
  waivers: WaiverFile
  openGaps: OpenGapFile
  runResults?: RunResult[]
  runResultSources?: RunResultSource[]
  /** Input-file identities recorded in the output (paths + hashes). */
  inputIds?: Record<string, string>
}

export interface GateReport {
  errors: string[]
  warnings: string[]
}

export interface BuildResult {
  matrix: CoverageMatrix
  gate: GateReport
}

interface RowDraft {
  row: Omit<MatrixRow, 'engines' | 'parity' | 'testTypes'>
  advertised: Record<EngineId, { ok: boolean; reason?: string }>
  boundaries?: Record<string, number[]>
  order: [number, number, number, number]
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Build the matrix and evaluate the C-5 gate in one pass. Never throws for
 * data problems — they are returned as gate errors so the CLI can print them
 * all; throws only for a status outside the vocabulary (a programming error).
 */
export function buildCoverageMatrix(inp: MatrixInputs): BuildResult {
  const errors: string[] = []
  const warnings: string[] = []
  const cap = inp.capabilityMap
  const drafts = new Map<string, RowDraft>()

  const psGroup = (name: string | undefined) => (name ? cap.parameterSetGroups[name] : undefined) // eslint-disable-line security/detect-object-injection

  // 1. Capability rows from each engine's discovered inventory.
  const typeRank = (hex: string) => parseInt(hex, 16)
  for (const engine of ENGINES) {
    // eslint-disable-next-line security/detect-object-injection
    const inv = inp.inventory.engines[engine]
    if (!inv) {
      errors.push(`inventory has no "${engine}" engine`)
      continue
    }
    for (const m of inv.inventory.mechanisms) {
      if (!m.name) {
        errors.push(`${engine}: mechanism ${m.typeHex} has no name in MECH_TABLE — cannot map`)
        continue
      }
      const decl = cap.mechanisms[m.name]
      if (!decl)
        errors.push(`${engine}: advertised mechanism ${m.name} is not in capability-map.json`)
      const group = psGroup(decl?.parameterSets)
      if (decl?.parameterSets && !group) {
        errors.push(
          `capability-map: ${m.name} names unknown parameter-set group ${decl.parameterSets}`
        )
      }
      const rangeReported = !(m.ulMinKeySize === 0 && m.ulMaxKeySize === 0)
      const sets: { id: string; inRange: boolean; idx: number }[] = group
        ? group.sets.map((s, idx) => ({
            id: s.id,
            idx,
            inRange: !rangeReported || (s.keySize >= m.ulMinKeySize && s.keySize <= m.ulMaxKeySize),
          }))
        : [{ id: ANY, inRange: true, idx: 0 }]
      for (const op of m.requiredOperations) {
        const variants =
          decl?.signVariants && cap.signVariantOperations.includes(op) ? decl.signVariants : [ANY]
        for (const ps of sets) {
          variants.forEach((v, vi) => {
            const key = capabilityKey({
              mechanism: m.name!,
              operation: op,
              parameterSet: ps.id,
              variant: v,
            })
            let d = drafts.get(key)
            if (!d) {
              d = {
                row: {
                  key,
                  mechanism: m.name,
                  typeHex: m.typeHex,
                  algorithm: decl?.algorithm ?? m.name!,
                  revision: decl?.revision ?? null,
                  section: decl?.section ?? null,
                  family: m.family ?? 'other',
                  operation: op,
                  parameterSet: ps.id,
                  variant: v,
                  source: {
                    mechanism: 'discovered',
                    parameterSet: group ? 'declared' : 'not-enumerated',
                    mapping: decl ? 'reviewed' : 'discovered-only',
                  },
                },
                advertised: {
                  cpp: { ok: false, reason: 'mechanism not in C_GetMechanismList' },
                  rust: { ok: false, reason: 'mechanism not in C_GetMechanismList' },
                },
                boundaries: decl?.boundaries,
                order: [typeRank(m.typeHex), opRank(op), ps.idx, vi],
              }
              drafts.set(key, d)
            }
            // eslint-disable-next-line security/detect-object-injection
            d.advertised[engine] = ps.inRange
              ? { ok: true }
              : {
                  ok: false,
                  reason: `parameter set outside the engine-reported key-size range ${m.ulMinKeySize}..${m.ulMaxKeySize}`,
                }
          })
        }
      }
    }
    // Operation advertised by the other engine only → explain it.
  }
  for (const d of drafts.values()) {
    for (const engine of ENGINES) {
      // eslint-disable-next-line security/detect-object-injection
      const a = d.advertised[engine]
      if (a.ok || a.reason !== 'mechanism not in C_GetMechanismList') continue
      // eslint-disable-next-line security/detect-object-injection
      const listed = inp.inventory.engines[engine]?.inventory.mechanisms.some(
        (m) => m.name === d.row.mechanism
      )
      if (listed) a.reason = `CKF_ flag for "${d.row.operation}" not set by C_GetMechanismInfo`
    }
  }

  // 2. Declared capabilities no PKCS #11 mechanism can express.
  let unreachableRows = 0
  cap.declaredUnreachable.forEach((u, ui) => {
    const group = psGroup(u.parameterSets)
    const sets = group ? group.sets.map((s) => s.id) : [ANY]
    for (const op of u.operations) {
      sets.forEach((ps, pi) => {
        const key = capabilityKey({
          mechanism: `unreachable:${u.id}`,
          operation: op,
          parameterSet: ps,
        })
        unreachableRows += 1
        drafts.set(key, {
          row: {
            key,
            mechanism: null,
            typeHex: null,
            algorithm: u.algorithm,
            revision: u.revision,
            section: null,
            family: 'pqc',
            operation: op,
            parameterSet: ps,
            variant: ANY,
            source: { mechanism: 'declared', parameterSet: 'declared', mapping: 'reviewed' },
          },
          advertised: {
            cpp: { ok: false, reason: u.reason },
            rust: { ok: false, reason: u.reason },
          },
          order: [0x7fffffff + ui, opRank(op), pi, 0],
        })
      })
    }
  })

  // 3. Join registered cases.
  const cases: MatrixCaseRef[] = []
  const caseIndex = new Map<string, number>()
  /** rowKey → engine → polarity → [caseIdx, status][] */
  const hits = new Map<string, Record<EngineId, Record<Polarity, Map<number, MatrixStatus>>>>()
  const testTypes = new Map<string, Set<string>>()
  const seenTestIds = new Set<string>()

  const hitBucket = (rowKey: string) => {
    let b = hits.get(rowKey)
    if (!b) {
      const mk = () =>
        Object.fromEntries(POLARITIES.map((p) => [p, new Map<number, MatrixStatus>()])) as Record<
          Polarity,
          Map<number, MatrixStatus>
        >
      b = { cpp: mk(), rust: mk() }
      hits.set(rowKey, b)
    }
    return b
  }

  for (const t of inp.registry) {
    if (seenTestIds.has(t.id)) errors.push(`registry: duplicate test id ${t.id}`)
    seenTestIds.add(t.id)
    const caseKeysInTest = new Set<string>()
    for (const c of t.cases) {
      const ck = caseKeyOf(c)
      if (caseKeysInTest.has(ck)) errors.push(`registry ${t.id}: duplicate case ${ck}`)
      caseKeysInTest.add(ck)
      let params: CaseParams = { ...(c.parameters ?? {}) }
      let testType: string | undefined
      if (!c.caseId.startsWith('local:')) {
        const mc = inp.manifestCases.get(c.caseId)
        if (!mc) {
          errors.push(`registry ${t.id}: case ${c.caseId} is not in vector-manifest.json`)
          continue
        }
        if (mc.status !== 'active') {
          errors.push(
            `registry ${t.id}: case ${c.caseId} is quarantined — it cannot count as evidence`
          )
          continue
        }
        if (mc.evidenceClass !== c.evidenceClass) {
          errors.push(
            `registry ${t.id}: case ${c.caseId} claims ${c.evidenceClass} but the manifest says ${mc.evidenceClass}`
          )
        }
        if (mc.expectation !== c.polarity) {
          errors.push(
            `registry ${t.id}: case ${c.caseId} is ${c.polarity} but the manifest expectation is ${mc.expectation}`
          )
        }
        params = { ...mc.parameters, ...params }
        testType = mc.testType
      }
      if (!EVIDENCE_TO_STATUS[c.evidenceClass]) {
        errors.push(
          `registry ${t.id}: case ${ck} has unknown evidence class ${String(c.evidenceClass)}`
        )
        continue
      }
      const idx = cases.length
      const id = `${t.id}#${ck}`
      caseIndex.set(id, idx)
      cases.push({
        id,
        test: t.id,
        runner: t.runner,
        caseId: c.caseId,
        ...(c.instance ? { instance: c.instance } : {}),
        evidenceClass: c.evidenceClass,
        status: assertStatus(EVIDENCE_TO_STATUS[c.evidenceClass], id),
        polarity: c.polarity,
        engines: t.engines,
        ...(c.rowId ? { rowId: c.rowId } : {}),
      })
      for (const ex of c.exercises) {
        const rowKey = capabilityKey(ex.capability)
        const d = drafts.get(rowKey)
        if (!d) {
          errors.push(
            `registry ${t.id}: case ${ck} exercises ${rowKey}, which is not a capability cell of either engine`
          )
          continue
        }
        const cls = ex.evidenceClass ?? c.evidenceClass
        const st = assertStatus(EVIDENCE_TO_STATUS[cls], `${id} → ${rowKey}`)
        const pol = ex.polarity ?? c.polarity
        const isBoundary = Object.entries(d.boundaries ?? {}).some(([k, vals]) => {
          const v = params[k] // eslint-disable-line security/detect-object-injection
          return typeof v === 'number' && vals.includes(v)
        })
        const b = hitBucket(rowKey)
        for (const e of t.engines) {
          /* eslint-disable security/detect-object-injection */
          b[e][pol].set(idx, st)
          if (isBoundary) b[e].boundary.set(idx, st)
          /* eslint-enable security/detect-object-injection */
        }
        if (testType) {
          const s = testTypes.get(rowKey) ?? new Set<string>()
          s.add(testType)
          testTypes.set(rowKey, s)
        }
      }
    }
  }

  // Distinct-case identity is (caseId, instance), not (test, case): the same
  // vector run by two runners is ONE case for the covered threshold.
  const distinctByInput = (
    m: Map<number, MatrixStatus>
  ): { idxs: number[]; statuses: MatrixStatus[] } => {
    const byInput = new Map<string, { idx: number; st: MatrixStatus }>()
    for (const [idx, st] of m) {
      const c = cases[idx] // eslint-disable-line security/detect-object-injection
      const k = caseKeyOf(c)
      const prev = byInput.get(k)
      if (!prev || (STATUS_RANK.get(st) ?? 99) < (STATUS_RANK.get(prev.st) ?? 99)) {
        byInput.set(k, { idx, st })
      }
    }
    return {
      idxs: [...m.keys()].sort((a, b) => a - b),
      statuses: [...byInput.values()].map((v) => v.st),
    }
  }

  // 4. Waivers (C-5).
  const waiverIndex = new Map<string, Waiver>()
  for (const w of inp.waivers.waivers) {
    if (!w.id || !w.reason?.trim() || !w.owner?.trim() || !DATE_RE.test(w.date ?? '')) {
      errors.push(`waiver ${w.id || '(no id)'}: id, reason, owner and an ISO date are required`)
    }
    if (!WAIVER_STATUSES.includes(w.status)) {
      errors.push(`waiver ${w.id}: unknown status ${String(w.status)}`)
    }
    for (const e of w.engines) {
      for (const cell of w.cells) {
        const k = `${e}|${w.mechanism}|${cell}`
        if (waiverIndex.has(k))
          errors.push(`waiver ${w.id}: cell ${k} is already waived by ${waiverIndex.get(k)!.id}`)
        waiverIndex.set(k, w)
      }
    }
  }
  const usedWaivers = new Set<string>()

  // 5. Run results → parity.
  const results = new Map<string, Map<EngineId, Map<ArtifactKind, RunResult['status']>>>()
  let staleResults = 0
  for (const r of inp.runResults ?? []) {
    // A result only counts for the exact artifact the inventory records; a
    // rebuilt engine silently invalidates every older result.
    const recorded = inp.inventory.engines[r.engine]?.identity.artifacts.some(
      (a) => a.sha256 === r.artifactSha256
    )
    if (!recorded) {
      staleResults += 1
      continue
    }
    if (!caseIndex.has(r.registryCase)) {
      warnings.push(`run result for unknown registry case ${r.registryCase} ignored`)
      continue
    }
    let byEngine = results.get(r.registryCase)
    if (!byEngine) results.set(r.registryCase, (byEngine = new Map()))
    let byKind = byEngine.get(r.engine)
    if (!byKind) byEngine.set(r.engine, (byKind = new Map()))
    byKind.set(r.artifactKind, r.status)
  }
  const passed = (caseId: string, e: EngineId, k: ArtifactKind) =>
    results.get(caseId)?.get(e)?.get(k) === 'pass'
  const failed = (caseId: string, e: EngineId, k: ArtifactKind) =>
    results.get(caseId)?.get(e)?.get(k) === 'fail'

  // 6. Assemble rows.
  const rows: MatrixRow[] = []
  const ordered = [...drafts.values()].sort((a, b) => {
    for (let i = 0; i < 4; i++) {
      // eslint-disable-next-line security/detect-object-injection
      if (a.order[i] !== b.order[i]) return a.order[i] - b.order[i]
    }
    return 0
  })
  for (const d of ordered) {
    const b = hits.get(d.row.key)
    const engines = {} as Record<EngineId, EngineCell>
    for (const e of ENGINES) {
      // eslint-disable-next-line security/detect-object-injection
      const adv = d.advertised[e]
      if (!adv.ok) {
        // eslint-disable-next-line security/detect-object-injection
        engines[e] = {
          advertised: false,
          reason: adv.reason,
          level: 'unsupported',
          polarity: emptyPolarity('unsupported', 'unsupported'),
        }
        continue
      }
      const polarity = {} as Record<Polarity, PolarityCell>
      let anyCase = false
      let allCovered = true
      for (const p of POLARITIES) {
        // eslint-disable-next-line security/detect-object-injection
        const m = b?.[e][p] ?? new Map<number, MatrixStatus>()
        const { idxs, statuses } = distinctByInput(m)
        const status = statuses.length ? strongest(statuses) : 'untested'
        const level = levelFor(p, statuses)
        if (statuses.length) anyCase = true
        if (level !== 'covered') allCovered = false
        // eslint-disable-next-line security/detect-object-injection
        polarity[p] = { status: assertStatus(status, `${d.row.key}/${e}/${p}`), level, cases: idxs }
      }
      const cell: EngineCell = {
        advertised: true,
        level: allCovered ? 'covered' : anyCase ? 'sampled' : 'untested',
        polarity,
      }
      const cellCases = new Set(POLARITIES.flatMap((p) => polarity[p].cases)) // eslint-disable-line security/detect-object-injection
      let pass = 0
      let fail = 0
      for (const i of cellCases) {
        const id = cases[i].id // eslint-disable-line security/detect-object-injection
        if (passed(id, e, 'wasm')) pass += 1
        if (failed(id, e, 'wasm')) fail += 1
      }
      if (pass + fail > 0) cell.run = { pass, fail }
      if (!anyCase) {
        const w = waiverIndex.get(
          `${e}|${d.row.mechanism}|${d.row.operation}|${d.row.parameterSet}|${d.row.variant}`
        )
        if (w) {
          cell.waiver = w.id
          usedWaivers.add(
            `${e}|${d.row.mechanism}|${d.row.operation}|${d.row.parameterSet}|${d.row.variant}`
          )
        } else {
          errors.push(
            `${e}: advertised capability ${d.row.key} has no registered test and no approved waiver`
          )
        }
      }
      // eslint-disable-next-line security/detect-object-injection
      engines[e] = cell
    }
    const parity = {} as Record<Polarity, ParityStatus>
    for (const p of POLARITIES) {
      if (!engines.cpp.advertised || !engines.rust.advertised) {
        // eslint-disable-next-line security/detect-object-injection
        parity[p] = 'single-engine'
        continue
      }
      // eslint-disable-next-line security/detect-object-injection
      const shared = engines.cpp.polarity[p].cases.filter((i) =>
        engines.rust.polarity[p].cases.includes(i)
      )
      const ids = shared.map((i) => cases[i].id) // eslint-disable-line security/detect-object-injection
      const both = ids.some((id) => passed(id, 'cpp', 'wasm') && passed(id, 'rust', 'wasm'))
      const split = ids.some(
        (id) =>
          (passed(id, 'cpp', 'wasm') && failed(id, 'rust', 'wasm')) ||
          (passed(id, 'rust', 'wasm') && failed(id, 'cpp', 'wasm'))
      )
      // eslint-disable-next-line security/detect-object-injection
      parity[p] = split ? 'divergent' : both ? 'parity' : 'not-established'
    }
    rows.push({
      ...d.row,
      testTypes: [...(testTypes.get(d.row.key) ?? [])].sort(),
      engines,
      parity,
    })
  }

  if (staleResults > 0) {
    warnings.push(
      `${staleResults} run result(s) ignored: their artifact sha256 is not the one the mechanism inventory records`
    )
  }
  let staleCells = 0
  for (const k of waiverIndex.keys()) {
    if (!usedWaivers.has(k)) {
      staleCells += 1
      warnings.push(
        `stale waiver cell ${k} (${waiverIndex.get(k)!.id}): now tested or no longer advertised`
      )
    }
  }

  // 7. Open gaps — curated + generated.
  const gaps: OpenGap[] = []
  for (const g of inp.openGaps.gaps) {
    if (!g.id || !g.title || !g.owner?.trim() || !GAP_STATUSES.includes(g.status)) {
      errors.push(`open-gaps: ${g.id || '(no id)'} needs id, title, owner and a known status`)
    }
    gaps.push({ ...g, origin: 'curated' })
  }
  gaps.push(...generatedGaps(rows))
  for (const [id, byEngine] of results) {
    for (const [e, byKind] of byEngine) {
      if (byKind.get('wasm') !== 'fail') continue
      const c = cases[caseIndex.get(id)!]
      gaps.push({
        id: `recorded-fail:${id}:${e}`,
        title: `Recorded FAIL on ${ENGINE_LABEL[e]}: ${c.test} (${c.caseId}${c.instance ? ` @ ${c.instance}` : ''})`,
        detail: `The committed wasm run result for this registered case is fail${c.rowId ? ` (row ${c.rowId.replace('{engine}', ENGINE_LABEL[e])})` : ''}. Its cells keep their registered-evidence status but are never counted as passed.`,
        planItem: 'G-9 / J-2',
        owner: 'unassigned',
        status: 'open',
        scope: `${ENGINE_LABEL[e]} (wasm)`,
        origin: 'generated',
      })
    }
  }

  // 8. Totals.
  const byEngine = {} as Record<EngineId, EngineTotals>
  for (const e of ENGINES) {
    const zero = (): LevelCounts => ({ covered: 0, sampled: 0, untested: 0 })
    const t: EngineTotals = {
      advertisedCells: 0,
      unsupportedCells: 0,
      overall: zero(),
      byPolarity: Object.fromEntries(
        POLARITIES.map((p) => [
          p,
          { ...zero(), byStatus: Object.fromEntries(MATRIX_STATUSES.map((s) => [s, 0])) },
        ])
      ) as EngineTotals['byPolarity'],
      byArtifact: {
        wasm: { status: 'registered', registeredCells: 0, passedCells: 0, failedCells: 0 },
        native: { status: 'not-run', registeredCells: 0, passedCells: 0, failedCells: 0 },
        hardware: { status: 'not-run', registeredCells: 0, passedCells: 0, failedCells: 0 },
      },
    }
    for (const r of rows) {
      // eslint-disable-next-line security/detect-object-injection
      const c = r.engines[e]
      if (!c.advertised) {
        t.unsupportedCells += 1
        continue
      }
      t.advertisedCells += 1
      if (c.level !== 'unsupported') t.overall[c.level] += 1
      if (c.level !== 'untested') t.byArtifact.wasm.registeredCells += 1
      if (c.run?.pass) t.byArtifact.wasm.passedCells += 1
      if (c.run?.fail) t.byArtifact.wasm.failedCells += 1
      for (const p of POLARITIES) {
        const pc = c.polarity[p] // eslint-disable-line security/detect-object-injection
        const bucket = t.byPolarity[p] // eslint-disable-line security/detect-object-injection
        if (pc.level !== 'unsupported') bucket[pc.level] += 1
        bucket.byStatus[pc.status] += 1
      }
    }
    // eslint-disable-next-line security/detect-object-injection
    byEngine[e] = t
  }
  const parityTotals = Object.fromEntries(
    POLARITIES.map((p) => {
      const counts: Record<ParityStatus, number> = {
        parity: 0,
        divergent: 0,
        'not-established': 0,
        'single-engine': 0,
      }
      // eslint-disable-next-line security/detect-object-injection
      for (const r of rows) counts[r.parity[p]] += 1
      return [p, counts]
    })
  ) as CoverageMatrix['totals']['parity']

  let waivedCells = 0
  let pendingReviewCells = 0
  for (const k of usedWaivers) {
    waivedCells += 1
    if (waiverIndex.get(k)!.status === 'baseline-pending-review') pendingReviewCells += 1
  }

  const matrix: CoverageMatrix = {
    $comment:
      'GENERATED by scripts/generate-coverage-matrix.ts — do not edit; run npm run gen:coverage-matrix. A status says a registered test EXISTS for the cell and what kind of expected value it checks; it is not a pass. See rules.',
    schema: 'pqctoday.coverage-matrix/v1',
    inputs: inp.inputIds ?? {},
    statuses: MATRIX_STATUSES,
    statusLabels: STATUS_LABEL,
    polarities: POLARITIES,
    rules: MATRIX_RULES,
    definitions: {
      numerator:
        'Numerators (per engine, per polarity) = advertised cells whose level is covered, sampled or untested under the rules below; covered + sampled + untested = the denominator. Per-status numerators count advertised cells by their strongest registered evidence class.',
      denominator: MATRIX_RULES.denominator,
      coveredMinCases: COVERED_MIN_CASES,
    },
    engines: Object.fromEntries(
      ENGINES.map((e) => {
        const inv = inp.inventory.engines[e] // eslint-disable-line security/detect-object-injection
        return [
          e,
          {
            label: ENGINE_LABEL[e], // eslint-disable-line security/detect-object-injection
            mechanismCount: inv?.inventory.mechanismCount ?? 0,
            inventorySha256: inv?.inventory.inventorySha256 ?? '',
            sourceCommit: inv?.identity.sourceCommit ?? null,
            artifacts: inv?.identity.artifacts ?? [],
          },
        ]
      })
    ) as CoverageMatrix['engines'],
    artifactKinds: {
      wasm: {
        status: (inp.runResultSources ?? []).length ? 'registered; partly recorded' : 'registered',
        note: (inp.runResultSources ?? []).length
          ? `Registered tests target the shipped WebAssembly engines. Recorded results: ${(inp.runResultSources ?? []).map((r) => `${r.results} from ${r.runner} (${r.host}, ${r.recordedAt}, hub ${r.hubCommit.slice(0, 9)})`).join('; ')}. Tests without a recorded result are never reported as passed.`
          : 'Registered tests target the shipped WebAssembly engines. No run results are committed, so no cell is reported as passed.',
      },
      native: {
        status: 'not-run',
        note: 'macOS, Linux x86-64 and Linux Arm64 native builds have not been run through these tests (plan H-2). Never counted as pass.',
      },
      hardware: {
        status: 'not-run',
        note: 'i.MX 95 and KV260 targets have not been run through these tests (plan H-3). Never counted as pass.',
      },
    },
    runResultSources: inp.runResultSources ?? [],
    totals: {
      rows: rows.length,
      declaredUnreachableRows: unreachableRows,
      byEngine,
      parity: parityTotals,
      waivers: { waivedCells, pendingReviewCells, staleCells },
    },
    rows,
    cases,
    openGaps: gaps,
  }
  return { matrix, gate: { errors, warnings } }
}

/** J-7: one generated gap per mechanism with untested advertised cells, plus per-polarity aggregates. */
function generatedGaps(rows: MatrixRow[]): OpenGap[] {
  const out: OpenGap[] = []
  const byMech = new Map<
    string,
    { cells: number; ops: Set<string>; engines: Set<EngineId>; waivers: Set<string> }
  >()
  for (const r of rows) {
    if (!r.mechanism) continue
    for (const e of ENGINES) {
      const c = r.engines[e] // eslint-disable-line security/detect-object-injection
      if (c.level !== 'untested') continue
      const g = byMech.get(r.mechanism) ?? {
        cells: 0,
        ops: new Set(),
        engines: new Set(),
        waivers: new Set(),
      }
      g.cells += 1
      g.ops.add(r.operation)
      g.engines.add(e)
      if (c.waiver) g.waivers.add(c.waiver)
      byMech.set(r.mechanism, g)
    }
  }
  for (const [mech, g] of byMech) {
    out.push({
      id: `untested:${mech}`,
      title: `${mech}: advertised, no registered test`,
      detail: `${g.cells} advertised cell(s) with no registered test in any polarity — operations: ${[...g.ops].join(', ')}.${g.waivers.size ? ` Disposition: waiver ${[...g.waivers].join(', ')}.` : ''}`,
      planItem: 'C-5 / G-2',
      owner: 'unassigned',
      status: 'open',
      scope: [...g.engines].map((e) => ENGINE_LABEL[e]).join(' + '), // eslint-disable-line security/detect-object-injection
      origin: 'generated',
      cells: g.cells,
    })
  }
  for (const p of POLARITIES) {
    if (p === 'positive') continue
    let n = 0
    let d = 0
    for (const r of rows) {
      for (const e of ENGINES) {
        const c = r.engines[e] // eslint-disable-line security/detect-object-injection
        if (!c.advertised) continue
        d += 1
        if (c.polarity[p].level === 'untested') n += 1 // eslint-disable-line security/detect-object-injection
      }
    }
    out.push({
      id: `polarity-untested:${p}`,
      title: `${p} coverage missing on ${n} of ${d} advertised cells`,
      detail: `No registered ${p} case exists for ${n} advertised (row × engine) cells. Positive tests never count toward this column.`,
      planItem:
        p === 'state-error' ? 'G-8' : p === 'negative' ? 'D1-4 / D2-2 / D3-2 / G-8' : 'D2-6 / D3-3',
      owner: 'unassigned',
      status: 'open',
      scope: 'C++ + Rust',
      origin: 'generated',
      cells: n,
    })
  }
  let unsupported = 0
  for (const r of rows) {
    for (const e of ENGINES) if (!r.engines[e].advertised) unsupported += 1 // eslint-disable-line security/detect-object-injection
  }
  out.push({
    id: 'unsupported-cells',
    title: `${unsupported} unsupported (row × engine) cells kept in the denominator`,
    detail:
      'Cells one engine does not advertise (mechanism absent, CKF_ flag not set, or parameter set outside its key-size range) and declared capabilities no PKCS #11 mechanism can express. Listed per row in the matrix; never dropped.',
    planItem: 'J-7 / G-9',
    owner: 'unassigned',
    status: 'open',
    scope: 'C++ + Rust',
    origin: 'generated',
    cells: unsupported,
  })
  return out
}

// ── Serialized form ──────────────────────────────────────────────────────────
//
// The in-memory matrix repeats per-mechanism metadata on every row and spells
// out all four polarities of every cell; serialized, that is several MB. The
// committed/public file keeps one metadata record per capability, lists only
// the polarities that have registered cases, and writes one row per line so a
// diff shows exactly which cells moved. expandMatrix() restores the full shape
// (round-trip pinned by coverageModel.test.ts).

export interface CompactCapability {
  mechanism: string | null
  typeHex: string | null
  algorithm: string
  revision: string | null
  section: string | null
  family: string
  source: MatrixRow['source']
}

/** [status, level, case indexes] */
export type CompactPolarity = [MatrixStatus, CoverageLevel, number[]]

export type CompactEngineCell =
  | { adv: false; why: number }
  | {
      adv: true
      lvl: CoverageLevel
      pol?: Partial<Record<Polarity, CompactPolarity>>
      waiver?: string
      /** [pass, fail] recorded wasm results */
      run?: [number, number]
    }

export interface CompactRow {
  /** capabilityKey: mechanism|operation|parameterSet|variant */
  k: string
  /** Key into CoverageMatrixFile.capabilities. */
  c: string
  tt?: string[]
  e: Record<EngineId, CompactEngineCell>
  par: ParityStatus | Record<Polarity, ParityStatus>
}

export type CoverageMatrixFile = Omit<CoverageMatrix, 'rows'> & {
  capabilities: Record<string, CompactCapability>
  unsupportedReasons: string[]
  rows: CompactRow[]
}

const capabilityOf = (r: MatrixRow): string => r.key.split('|')[0]

export function compactMatrix(m: CoverageMatrix): CoverageMatrixFile {
  const capabilities: Record<string, CompactCapability> = {}
  const reasons: string[] = []
  const reasonIdx = (s: string) => {
    let i = reasons.indexOf(s)
    if (i < 0) i = reasons.push(s) - 1
    return i
  }
  const rows: CompactRow[] = m.rows.map((r) => {
    const c = capabilityOf(r)
    capabilities[c] ??= {
      mechanism: r.mechanism,
      typeHex: r.typeHex,
      algorithm: r.algorithm,
      revision: r.revision,
      section: r.section,
      family: r.family,
      source: r.source,
    }
    const e = {} as Record<EngineId, CompactEngineCell>
    for (const eng of ENGINES) {
      const cell = r.engines[eng] // eslint-disable-line security/detect-object-injection
      if (!cell.advertised) {
        e[eng] = { adv: false, why: reasonIdx(cell.reason ?? '') } // eslint-disable-line security/detect-object-injection
        continue
      }
      const pol: Partial<Record<Polarity, CompactPolarity>> = {}
      for (const p of POLARITIES) {
        const pc = cell.polarity[p] // eslint-disable-line security/detect-object-injection
        if (pc.level !== 'untested') pol[p] = [pc.status, pc.level, pc.cases] // eslint-disable-line security/detect-object-injection
      }
      // eslint-disable-next-line security/detect-object-injection
      e[eng] = {
        adv: true,
        lvl: cell.level,
        ...(Object.keys(pol).length ? { pol } : {}),
        ...(cell.waiver ? { waiver: cell.waiver } : {}),
        ...(cell.run ? { run: [cell.run.pass, cell.run.fail] as [number, number] } : {}),
      }
    }
    const pars = POLARITIES.map((p) => r.parity[p]) // eslint-disable-line security/detect-object-injection
    return {
      k: r.key,
      c,
      ...(r.testTypes.length ? { tt: r.testTypes } : {}),
      e,
      par: pars.every((p) => p === pars[0]) ? pars[0] : r.parity,
    }
  })
  const { rows: _rows, ...rest } = m
  void _rows
  return { ...rest, capabilities, unsupportedReasons: reasons, rows }
}

export function expandMatrix(f: CoverageMatrixFile): CoverageMatrix {
  const rows: MatrixRow[] = f.rows.map((cr) => {
    const cap = f.capabilities[cr.c]
    const [, operation, parameterSet, variant] = cr.k.split('|')
    const engines = {} as Record<EngineId, EngineCell>
    for (const eng of ENGINES) {
      const ce = cr.e[eng] // eslint-disable-line security/detect-object-injection
      if (!ce.adv) {
        // eslint-disable-next-line security/detect-object-injection
        engines[eng] = {
          advertised: false,
          reason: f.unsupportedReasons[ce.why],
          level: 'unsupported',
          polarity: emptyPolarity('unsupported', 'unsupported'),
        }
        continue
      }
      const polarity = emptyPolarity('untested', 'untested')
      for (const p of POLARITIES) {
        const cp = ce.pol?.[p] // eslint-disable-line security/detect-object-injection
        if (cp) polarity[p] = { status: assertStatus(cp[0], cr.k), level: cp[1], cases: cp[2] } // eslint-disable-line security/detect-object-injection
      }
      // eslint-disable-next-line security/detect-object-injection
      engines[eng] = {
        advertised: true,
        level: ce.lvl,
        polarity,
        ...(ce.waiver ? { waiver: ce.waiver } : {}),
        ...(ce.run ? { run: { pass: ce.run[0], fail: ce.run[1] } } : {}),
      }
    }
    const parity =
      typeof cr.par === 'string'
        ? (Object.fromEntries(POLARITIES.map((p) => [p, cr.par])) as Record<Polarity, ParityStatus>)
        : cr.par
    return {
      key: cr.k,
      mechanism: cap.mechanism,
      typeHex: cap.typeHex,
      algorithm: cap.algorithm,
      revision: cap.revision,
      section: cap.section,
      family: cap.family,
      operation,
      parameterSet,
      variant,
      source: cap.source,
      testTypes: cr.tt ?? [],
      engines,
      parity,
    }
  })
  const { capabilities: _c, unsupportedReasons: _u, rows: _r, ...rest } = f
  void _c
  void _u
  void _r
  return { ...rest, rows }
}

/**
 * Stable text form: the header pretty-printed, then one row / one case per
 * line. Not prettier-formatted on purpose (listed in .prettierignore) — a
 * prettier pass would explode every row across ~20 lines.
 */
export function serializeMatrixFile(f: CoverageMatrixFile): string {
  const { rows, cases, capabilities, ...head } = f
  const headText = JSON.stringify(head, null, 2)
  const lines = (arr: unknown[]) => arr.map((x) => `    ${JSON.stringify(x)}`).join(',\n')
  const caps = Object.entries(capabilities)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(',\n')
  return (
    headText.slice(0, -2) +
    `,\n  "capabilities": {\n${caps}\n  },\n  "cases": [\n${lines(cases)}\n  ],\n  "rows": [\n${lines(rows)}\n  ]\n}\n`
  )
}
