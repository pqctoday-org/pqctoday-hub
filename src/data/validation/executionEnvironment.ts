// SPDX-License-Identifier: GPL-3.0-only
/**
 * ExecutionEnvironment — plan WS-H H-1. The identity of ONE execution target
 * for ONE run: where it ran (OS/image, arch, CPU/board, emulation), what ran
 * (engine artifact hash + source commit, compiler, flags, dependency versions
 * incl. OpenSSL), how (acceleration, entropy source, runner) and on which
 * inputs (fixture bundle manifest hash).
 *
 * executionEnvironment.schema.json is the machine contract (shape only; every
 * identity field is nullable so a runner never has to invent a value). This
 * module decides PUBLISHABILITY: a run whose record leaves any
 * IDENTITY_REQUIREMENTS entry unmet is `publishable: false`, with the exact
 * unmet requirement ids listed — never silently "good enough".
 *
 * Hash addressing: `envId` = SHA-256 of canonicalJson(record without envId).
 * The Python native runner (tools/acvp-native/acvp_native_runner.py) computes
 * the same value with json.dumps(sort_keys=True, separators=(',', ':')); a
 * record whose envId does not recompute is an integrity failure and is also
 * non-publishable. (Signing is not implemented; the hash makes tampering
 * detectable relative to a published envId, nothing more.)
 */
import schema from './executionEnvironment.schema.json'
import { canonicalJson, sha256Hex } from '../../services/acvp/ir'
import { validateAgainstSchema, type SchemaDiagnostic } from '../../services/acvp/schemaValidator'

export const EXECUTION_ENVIRONMENT_VERSION = 'pqctoday.execution-environment/1'

export type TargetClass = 'wasm' | 'native' | 'board'
export type AccelerationState = 'none' | 'enabled' | 'unknown'

export interface ExecutionEnvironment {
  envVersion: typeof EXECUTION_ENVIRONMENT_VERSION
  envId: string
  recordedAt: string
  target: { id: string; label: string; class: TargetClass }
  os: {
    name: string | null
    version: string | null
    kernel: string | null
    image: { name: string | null; id: string | null }
  }
  arch: { machine: string | null; pointerBits: number | null; endianness: 'little' | 'big' | null }
  cpu: { model: string | null; board: string | null; features: string | null }
  emulation: {
    emulated: boolean | null
    mechanism: string | null
    hostMachine: string | null
    detection: string
  }
  engine: {
    id: string
    implementation: string
    artifactKind: 'shared-library' | 'wasm'
    artifactPath: string | null
    artifactSha256: string | null
    sourceRepository: string | null
    sourceCommit: string | null
    /** How sourceCommit was established, or why it is null. */
    sourceCommitEvidence: string
    builtAt: string | null
  }
  build: {
    buildSystem: string | null
    compiler: string | null
    flags: string | null
    profile: string | null
    features: string | null
    location: string | null
  }
  dependencies: {
    openssl: { linked: boolean | null; version: string | null; source: string }
    cryptoBackend: { name: string | null; version: string | null }
    runtime: Array<{ name: string; version: string | null }>
  }
  acceleration: { state: AccelerationState; detail: string }
  entropy: { source: string | null; exercisedByTestedOperations: boolean | null }
  runner: {
    name: string | null
    version: string | null
    language: string | null
    languageVersion: string | null
  }
  fixtureBundle: { manifestSha256: string | null; schemaId: string; vsId: number }
  notes: string[]
}

export interface IdentityRequirement {
  id: string
  description: string
  met: (e: ExecutionEnvironment) => boolean
}

const present = (v: string | null | undefined): boolean =>
  typeof v === 'string' && v.trim().length > 0

/** Full 40-hex git SHA — an abbreviated or dirty-tree "commit" is not an identity. */
const FULL_SHA = /^[0-9a-f]{40}$/

/**
 * Every requirement a run must meet to be publishable (plan §2.4 + H-1).
 * Order is the order unmet ids are reported in.
 */
export const IDENTITY_REQUIREMENTS: readonly IdentityRequirement[] = [
  { id: 'os.name', description: 'OS / image name', met: (e) => present(e.os.name) },
  { id: 'arch.machine', description: 'CPU architecture', met: (e) => present(e.arch.machine) },
  { id: 'cpu.model', description: 'CPU model or board', met: (e) => present(e.cpu.model) },
  {
    id: 'emulation.emulated',
    description: 'emulated flag explicitly true or false',
    met: (e) => typeof e.emulation.emulated === 'boolean',
  },
  {
    id: 'emulation.mechanism',
    description: 'emulation mechanism named when emulated',
    met: (e) => e.emulation.emulated !== true || present(e.emulation.mechanism),
  },
  {
    id: 'engine.artifactSha256',
    description: 'SHA-256 of the exact engine artifact loaded',
    met: (e) => present(e.engine.artifactSha256),
  },
  {
    id: 'engine.sourceCommit',
    description: 'full 40-hex engine source commit',
    met: (e) => typeof e.engine.sourceCommit === 'string' && FULL_SHA.test(e.engine.sourceCommit),
  },
  { id: 'build.compiler', description: 'compiler identity', met: (e) => present(e.build.compiler) },
  {
    id: 'dependencies.openssl',
    description: 'OpenSSL linkage stated, with the runtime version when linked',
    met: (e) =>
      e.dependencies.openssl.linked === false ||
      (e.dependencies.openssl.linked === true && present(e.dependencies.openssl.version)),
  },
  {
    id: 'dependencies.cryptoBackend',
    description: 'crypto backend name and version',
    met: (e) =>
      present(e.dependencies.cryptoBackend.name) && present(e.dependencies.cryptoBackend.version),
  },
  {
    id: 'acceleration.state',
    description: 'acceleration state explicit (none or enabled, not unknown)',
    met: (e) => e.acceleration.state !== 'unknown',
  },
  { id: 'entropy.source', description: 'entropy source', met: (e) => present(e.entropy.source) },
  {
    id: 'runner.identity',
    description: 'runner name and version',
    met: (e) => present(e.runner.name) && present(e.runner.version),
  },
  {
    id: 'fixtureBundle.manifestSha256',
    description: 'fixture bundle manifest SHA-256',
    met: (e) => present(e.fixtureBundle.manifestSha256),
  },
]

export interface EnvironmentValidation {
  /** Shape violations against executionEnvironment.schema.json. */
  schemaDiagnostics: SchemaDiagnostic[]
  /** true iff envId equals the recomputed hash. */
  envIdValid: boolean
  recomputedEnvId: string
  /** Ids from IDENTITY_REQUIREMENTS the record does not meet. */
  unmetIdentity: string[]
  publishable: boolean
}

/** envId = SHA-256(canonicalJson(record without envId)). */
export const computeEnvId = async (record: Record<string, unknown>): Promise<string> => {
  const rest: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(record)) if (k !== 'envId') rest[k] = v
  return sha256Hex(canonicalJson(rest))
}

export const validateExecutionEnvironment = async (
  record: unknown
): Promise<EnvironmentValidation> => {
  const schemaDiagnostics = validateAgainstSchema(schema as Record<string, unknown>, record)
  const obj = (record ?? {}) as Record<string, unknown>
  const recomputedEnvId = await computeEnvId(obj)
  const envIdValid = obj.envId === recomputedEnvId
  // Identity rules only make sense on a well-shaped record.
  const unmetIdentity =
    schemaDiagnostics.length === 0
      ? IDENTITY_REQUIREMENTS.filter((r) => !r.met(record as ExecutionEnvironment)).map((r) => r.id)
      : IDENTITY_REQUIREMENTS.map((r) => r.id)
  return {
    schemaDiagnostics,
    envIdValid,
    recomputedEnvId,
    unmetIdentity,
    publishable: schemaDiagnostics.length === 0 && envIdValid && unmetIdentity.length === 0,
  }
}

/** Stamp envId onto a record (used by the Node WASM runner and tests). */
export const withEnvId = async (
  record: Omit<ExecutionEnvironment, 'envId'> & { envId?: string }
): Promise<ExecutionEnvironment> => {
  const { envId: _drop, ...rest } = record
  void _drop
  const envId = await computeEnvId(rest as Record<string, unknown>)
  return { ...(rest as Omit<ExecutionEnvironment, 'envId'>), envId }
}

/** Dotted paths whose values differ between two records (for divergence triage, H-5). */
export const diffEnvironments = (
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  prefix = ''
): Array<{ path: string; a: unknown; b: unknown }> => {
  const out: Array<{ path: string; a: unknown; b: unknown }> = []
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  for (const k of keys) {
    if (k === 'envId' || k === 'recordedAt') continue
    const p = prefix ? `${prefix}.${k}` : k
    const va = a[k]
    const vb = b[k]
    const isObj = (v: unknown) => v !== null && typeof v === 'object' && !Array.isArray(v)
    if (isObj(va) && isObj(vb)) {
      out.push(...diffEnvironments(va as Record<string, unknown>, vb as Record<string, unknown>, p))
    } else if (canonicalJson(va ?? null) !== canonicalJson(vb ?? null)) {
      out.push({ path: p, a: va ?? null, b: vb ?? null })
    }
  }
  return out
}
