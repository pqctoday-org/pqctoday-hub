// SPDX-License-Identifier: GPL-3.0-only
// WS-H H-1: the ExecutionEnvironment record. Missing identity ⇒ non-publishable;
// a tampered record ⇒ envId no longer recomputes ⇒ non-publishable; the
// CSP-safe schema interpreter agrees with ajv on the schema file.
import { describe, expect, it } from 'vitest'
import Ajv2020 from 'ajv/dist/2020'
import schema from './executionEnvironment.schema.json'
import {
  computeEnvId,
  diffEnvironments,
  IDENTITY_REQUIREMENTS,
  validateExecutionEnvironment,
  withEnvId,
  type ExecutionEnvironment,
} from './executionEnvironment'

const ajv = new Ajv2020({ strict: true, allErrors: true, allowUnionTypes: true })
const ajvValidate = ajv.compile(schema)

const base = (): Omit<ExecutionEnvironment, 'envId'> => ({
  envVersion: 'pqctoday.execution-environment/1',
  recordedAt: '2026-09-24T12:00:00.000Z',
  target: { id: 'linux-arm64-cpp', label: 'Linux Arm64 native (C++)', class: 'native' },
  os: {
    name: 'Debian GNU/Linux 13 (trixie)',
    version: '13',
    kernel: '7.0.14',
    image: { name: 'rust:1', id: null },
  },
  arch: { machine: 'aarch64', pointerBits: 64, endianness: 'little' },
  cpu: { model: 'Apple (implementer 0x61)', board: null, features: 'asimd sha3' },
  emulation: { emulated: false, mechanism: null, hostMachine: 'arm64', detection: 'test' },
  engine: {
    id: 'cpp',
    implementation: 'softhsmv3 C++',
    artifactKind: 'shared-library',
    artifactPath: '/tmp/libsofthsmv3.so',
    artifactSha256: 'a'.repeat(64),
    sourceRepository: 'pqctoday-org/pqctoday-hsm',
    sourceCommit: '7795799b91c61097cb6cd28704c0ca1ab114a4c7',
    sourceCommitEvidence: 'detached worktree at the commit',
    builtAt: '2026-09-24',
  },
  build: {
    buildSystem: 'cmake 3.31.6',
    compiler: 'c++ (Debian 14.2.0-19) 14.2.0',
    flags: '-O3 -DNDEBUG',
    profile: 'Release',
    features: null,
    location: 'pqc-rust container',
  },
  dependencies: {
    openssl: { linked: true, version: 'OpenSSL 3.6.3 9 Jun 2026', source: 'OpenSSL_version()' },
    cryptoBackend: { name: 'OpenSSL libcrypto', version: '3.6.3' },
    runtime: [{ name: 'python', version: '3.13.5' }],
  },
  acceleration: { state: 'none', detail: 'CPU only' },
  entropy: { source: 'OpenSSL DRBG (getrandom)', exercisedByTestedOperations: false },
  runner: { name: 'acvp-native', version: '1.0.0', language: 'python', languageVersion: '3.13.5' },
  fixtureBundle: {
    manifestSha256: 'b'.repeat(64),
    schemaId: 'ML-KEM/encapDecap/FIPS203',
    vsId: 42,
  },
  notes: [],
})

describe('ExecutionEnvironment (WS-H H-1)', () => {
  it('a complete record is publishable, and ajv agrees on its shape', async () => {
    const rec = await withEnvId(base())
    const v = await validateExecutionEnvironment(rec)
    expect(v.schemaDiagnostics).toEqual([])
    expect(v.envIdValid).toBe(true)
    expect(v.unmetIdentity).toEqual([])
    expect(v.publishable).toBe(true)
    expect(ajvValidate(rec)).toBe(true)
  })

  const breakers: Array<[string, (r: Omit<ExecutionEnvironment, 'envId'>) => void]> = [
    ['os.name', (r) => (r.os.name = null)],
    ['arch.machine', (r) => (r.arch.machine = null)],
    ['cpu.model', (r) => (r.cpu.model = '  ')],
    ['emulation.emulated', (r) => (r.emulation.emulated = null)],
    [
      'emulation.mechanism',
      (r) => {
        r.emulation.emulated = true
        r.emulation.mechanism = null
      },
    ],
    ['engine.artifactSha256', (r) => (r.engine.artifactSha256 = null)],
    ['engine.sourceCommit', (r) => (r.engine.sourceCommit = null)],
    ['engine.sourceCommit', (r) => (r.engine.sourceCommit = '417c47a2')],
    ['build.compiler', (r) => (r.build.compiler = null)],
    ['dependencies.openssl', (r) => (r.dependencies.openssl.linked = null)],
    ['dependencies.openssl', (r) => (r.dependencies.openssl.version = null)],
    ['dependencies.cryptoBackend', (r) => (r.dependencies.cryptoBackend.version = null)],
    ['acceleration.state', (r) => (r.acceleration.state = 'unknown')],
    ['entropy.source', (r) => (r.entropy.source = null)],
    ['runner.identity', (r) => (r.runner.version = null)],
    ['fixtureBundle.manifestSha256', (r) => (r.fixtureBundle.manifestSha256 = null)],
  ]

  it.each(breakers)(
    'missing %s ⇒ non-publishable, naming exactly that requirement',
    async (id, f) => {
      const r = base()
      f(r)
      const v = await validateExecutionEnvironment(await withEnvId(r))
      expect(v.schemaDiagnostics).toEqual([])
      expect(v.envIdValid).toBe(true)
      expect(v.unmetIdentity).toEqual([id])
      expect(v.publishable).toBe(false)
    }
  )

  it('every identity requirement has a breaker test', () => {
    const tested = new Set(breakers.map(([id]) => id))
    expect(IDENTITY_REQUIREMENTS.map((r) => r.id).filter((id) => !tested.has(id))).toEqual([])
  })

  it('an OpenSSL-free engine is publishable when linkage is stated false', async () => {
    const r = base()
    r.dependencies.openssl = { linked: false, version: null, source: 'ldd: no libcrypto' }
    const v = await validateExecutionEnvironment(await withEnvId(r))
    expect(v.publishable).toBe(true)
  })

  it('tampering after stamping breaks envId ⇒ non-publishable', async () => {
    const rec = await withEnvId(base())
    const tampered = JSON.parse(JSON.stringify(rec)) as ExecutionEnvironment
    tampered.emulation.emulated = true
    tampered.emulation.mechanism = 'Rosetta 2'
    const v = await validateExecutionEnvironment(tampered)
    expect(v.unmetIdentity).toEqual([])
    expect(v.envIdValid).toBe(false)
    expect(v.publishable).toBe(false)
    expect(v.recomputedEnvId).toBe(
      await computeEnvId(tampered as unknown as Record<string, unknown>)
    )
  })

  it('a shape violation is reported by both the interpreter and ajv', async () => {
    const rec = (await withEnvId(base())) as unknown as Record<string, unknown>
    ;(rec.acceleration as Record<string, unknown>).state = 'fpga'
    delete (rec.engine as Record<string, unknown>).sourceCommit
    const v = await validateExecutionEnvironment(rec)
    expect(v.schemaDiagnostics.map((d) => d.path).sort()).toEqual([
      '$.acceleration.state',
      '$.engine.sourceCommit',
    ])
    expect(v.publishable).toBe(false)
    expect(ajvValidate(rec)).toBe(false)
  })

  it('diffEnvironments names the differing leaves and ignores envId/recordedAt', async () => {
    const a = await withEnvId(base())
    const bRec = base()
    bRec.recordedAt = '2026-09-25T00:00:00.000Z'
    bRec.arch.machine = 'x86_64'
    bRec.emulation = { ...bRec.emulation, emulated: true, mechanism: 'Rosetta 2' }
    const b = await withEnvId(bRec)
    expect(
      diffEnvironments(
        a as unknown as Record<string, unknown>,
        b as unknown as Record<string, unknown>
      ).map((d) => d.path)
    ).toEqual(['arch.machine', 'emulation.emulated', 'emulation.mechanism'])
  })
})
