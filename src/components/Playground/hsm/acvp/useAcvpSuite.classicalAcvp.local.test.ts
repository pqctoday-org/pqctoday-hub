// SPDX-License-Identifier: GPL-3.0-only
//
// KAT for the WS-E classical / symmetric / MAC reference-sample sections
// (sections/aesGcmAcvp.ts, hmacAcvp.ts, ecSigVerAcvp.ts), driven through the
// REAL useAcvpSuite hook in dual-engine mode (C++ Emscripten engine in Node +
// Rust wasm-bindgen).
//
// What it proves (and pins — a change in either direction fails here):
//  - AES-GCM: every NIST ACVP-AES-GCM-1.0 case byte-matches / is rejected on
//    C++; Rust passes every 96-bit-IV case and refuses the 120-bit-IV groups at
//    C_EncryptInit/C_DecryptInit with CKR_MECHANISM_PARAM_INVALID (open gap
//    rust-gcm-iv-96-only) — its 120-bit-IV authentication failures therefore
//    FAIL (refused before the tag check), never pass by accident;
//  - HMAC: every NIST HMAC 2.0 case (11 digests) byte-matches and verifies on
//    both engines; bit-flipped MACs return CKR_SIGNATURE_INVALID and one-byte-
//    short MACs CKR_SIGNATURE_LEN_RANGE;
//  - ECDSA / EdDSA SigVer: every upstream valid/invalid case agrees on both
//    engines except Rust P-224, which refuses every signature with
//    CKR_SIGNATURE_LEN_RANGE (open gap rust-ecdsa-p224-unsupported);
//  - the literal mechanism numbers the sections use equal the generated
//    mechanism inventory's;
//  - sabotage on a COPY of the vectors (vi.doMock) turns exactly those rows red.
//
// Venue: `*.local.test.ts` — run by `npm run test:local` (local gate only).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { TestResult } from './useAcvpSuite'
import { WSE_MECH } from './sections/classicalRaw'
import inventory from '@/data/validation/mechanism-inventory.generated.json'
import { evidenceForRowId } from '@/data/validation/acvpRowEvidence'

/** Manifest evidence classes of a row (generated per-case records; [] = no record). */
const classesOf = (rowId: string) =>
  [...new Set(evidenceForRowId(rowId).map((e) => e.evidenceClass))].sort()

const require_ = createRequire(import.meta.url)
const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  const gluePath = require_.resolve('@pqctoday/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const create = require_(gluePath) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p) })
}

const DATA = path.resolve(__dirname, '../../../../data/acvp')
const readVectors = (name: string) => JSON.parse(readFileSync(path.join(DATA, name), 'utf8'))

const cppRef: { current: SoftHSMModule | null } = { current: null }
const rustRef: { current: SoftHSMModule | null } = { current: null }

vi.mock('../HsmContext', async () => {
  const actual = await vi.importActual<typeof import('../HsmContext')>('../HsmContext')
  return {
    ...actual,
    useHsmContext: () => ({
      moduleRef: cppRef,
      rawModuleRef: cppRef,
      crossCheckModuleRef: rustRef,
      hSessionRef: { current: 0 },
      slotRef: { current: 0 },
      engineMode: 'dual' as const,
      setEngineMode: vi.fn(),
      phase: 'session_open' as const,
      setPhase: vi.fn(),
      tokenCreated: true,
      setTokenCreated: vi.fn(),
      isReady: true,
      hsmKeys: [],
      hsmKeysRef: { current: [] },
      addHsmKey: vi.fn((k) => k),
      registerKey: vi.fn((_M, _s, partial) => ({
        ...partial,
        uniqueId: 'test',
        slotId: 0,
        generatedAt: '',
      })),
      removeHsmKey: vi.fn(),
      clearHsmKeys: vi.fn(),
      addHsmLog: vi.fn(),
      addHsmStepLog: vi.fn(),
      autoInit: vi.fn().mockResolvedValue(true),
    }),
  }
})

const CATS = ['symmetric', 'hashing_mac', 'classical']
const runSuite = async (): Promise<TestResult[]> => {
  const { useAcvpSuite } = await import('./useAcvpSuite')
  const { result } = renderHook(() => useAcvpSuite())
  const out = await result.current.runTests(new Set(CATS as never[]))
  await waitFor(() =>
    expect(result.current.logs.at(-1)).toMatch(/Validation Workbench run completed/)
  )
  const critical = result.current.logs.filter((l) => /Critical Error/.test(l))
  if (critical.length > 0) throw new Error(critical.join('\n'))
  return out
}

const engineOf = (r: TestResult) => (r.id.endsWith('-C++') ? 'C++' : 'Rust')
const caseKey = (r: TestResult) => r.id.replace(/-(C\+\+|Rust)$/, '')
const ENGINES = ['C++', 'Rust'] as const

interface Vec {
  testGroups: {
    tgId: number
    [k: string]: unknown
    tests: { tcId: number; [k: string]: unknown }[]
  }[]
}

describe('WS-E classical reference samples — both engines, real vectors', () => {
  let results: TestResult[] = []
  const row = (id: string) => results.find((r) => r.id === id)

  beforeAll(async () => {
    cppRef.current = await loadCppEngineInNode()
    rustRef.current = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    results = await runSuite()
  }, 300_000)

  it('uses mechanism numbers equal to the generated inventory', () => {
    const byName = new Map<string, number>()
    for (const e of Object.values(inventory.engines))
      for (const m of e.inventory.mechanisms) byName.set(m.name, m.type)
    for (const [name, value] of Object.entries(WSE_MECH)) expect(byName.get(name), name).toBe(value)
  })

  it('runs every WS-E section on both engines with identical case sets', () => {
    for (const pre of [
      'aesgcm-nist-',
      'hmac-nist-',
      'hmac-probe-',
      'ecdsa-sigver-nist-',
      'eddsa-sigver-nist-',
    ]) {
      const cpp = results.filter((r) => r.id.startsWith(pre) && engineOf(r) === 'C++')
      const rust = results.filter((r) => r.id.startsWith(pre) && engineOf(r) === 'Rust')
      expect(cpp.length, pre).toBeGreaterThan(0)
      expect(rust.map(caseKey), pre).toEqual(cpp.map(caseKey))
    }
  })

  it('AES-GCM: every NIST case on C++; Rust refuses non-96-bit IVs at init (pinned finding)', () => {
    const v = readVectors('aesgcm_acvp_test.json') as Vec
    for (const g of v.testGroups)
      for (const t of g.tests)
        for (const e of ENGINES) {
          const r = row(`aesgcm-nist-k${g.keyLen}-tg${g.tgId}-tc${t.tcId}-${e}`)!
          const rustIvGap = e === 'Rust' && g.ivLen !== 96
          expect(r.status, `${r.id}: ${r.details}`).toBe(rustIvGap ? 'fail' : 'pass')
          if (rustIvGap) expect(r.caseMeta?.observed).toMatch(/CKR_MECHANISM_PARAM_INVALID/)
          else if (g.direction === 'decrypt' && !t.testPassed)
            expect(r.caseMeta?.observed).toBe('CKR_ENCRYPTED_DATA_INVALID')
          else expect(r.caseMeta?.observed).toBe('byte-equal')
          expect(classesOf(r.id)).toEqual(['nist-acvp-reference-sample'])
        }
    // the upstream authentication failures are all present, on both engines
    const upstreamNegs = v.testGroups.flatMap((g) =>
      g.direction === 'decrypt' ? g.tests.filter((t) => !t.testPassed) : []
    )
    const negs = results.filter(
      (r) => r.id.startsWith('aesgcm-nist-') && r.caseMeta?.expected === 'invalid'
    )
    expect(upstreamNegs.length).toBeGreaterThan(0)
    expect(negs.length).toBe(2 * upstreamNegs.length)
  })

  it('HMAC: every NIST case byte-matches and verifies; invalid MACs are rejected', () => {
    const v = readVectors('hmac_acvp_matrix_test.json') as Vec
    expect(v.testGroups).toHaveLength(11)
    for (const g of v.testGroups) {
      const slug = String(g.hashAlg).toLowerCase().replace('/', '-')
      for (const e of ENGINES) {
        for (const t of g.tests) {
          const r = row(`hmac-nist-${slug}-tc${t.tcId}-${e}`)!
          expect(r.status, `${r.id}: ${r.details}`).toBe('pass')
          expect(r.caseMeta?.observed).toBe('byte-equal; verify CKR_OK')
          expect(classesOf(r.id)).toEqual(['nist-acvp-reference-sample'])
        }
        const flip = row(`hmac-probe-flip-${slug}-${e}`)!
        expect(flip.status, flip.details).toBe('pass')
        expect(flip.caseMeta?.observed).toBe('CKR_SIGNATURE_INVALID')
        const short = row(`hmac-probe-short-${slug}-${e}`)!
        expect(short.status, short.details).toBe('pass')
        expect(short.caseMeta?.observed).toBe('CKR_SIGNATURE_LEN_RANGE')
        for (const p of [flip, short]) {
          expect(classesOf(p.id)).toEqual(['product-mechanism-probe'])
          expect(p.caseMeta?.origin).toBe('product-authored-mutation')
        }
      }
    }
    // the matrix spans the upstream extremes: 1-byte keys, empty messages, 80- and 160-bit MACs
    const meta = results
      .filter((r) => r.id.startsWith('hmac-nist-'))
      .map((r) => r.caseMeta!.parameters!)
    expect(meta.some((p) => p.keyLen === 8)).toBe(true)
    expect(meta.some((p) => p.msgLen === 0)).toBe(true)
    expect(meta.map((p) => p.macLen)).toEqual(expect.arrayContaining([80, 160]))
  })

  it('ECDSA SigVer: upstream disposition on every curve/hash; Rust P-224 refuses every signature (pinned finding)', () => {
    const v = readVectors('ecdsa_sigver_acvp_test.json') as Vec & { notExecuted: unknown[] }
    let negatives = 0
    for (const g of v.testGroups)
      for (const t of g.tests)
        for (const e of ENGINES) {
          const r = row(`ecdsa-sigver-nist-${g.curve}-${g.hashAlg}-tg${g.tgId}-tc${t.tcId}-${e}`)!
          const gap = e === 'Rust' && g.curve === 'P-224'
          expect(r.status, `${r.id}: ${r.details}`).toBe(gap ? 'fail' : 'pass')
          if (gap) expect(r.caseMeta?.observed).toBe('CKR_SIGNATURE_LEN_RANGE')
          else if (t.testPassed) expect(r.caseMeta?.observed).toBe('CKR_OK')
          else {
            negatives += 1
            expect(r.caseMeta?.observed, r.id).toMatch(
              /CKR_SIGNATURE_INVALID|C_CreateObject|C_VerifyInit/
            )
          }
          expect(classesOf(r.id)).toEqual(['nist-acvp-reference-sample'])
        }
    expect(negatives).toBeGreaterThan(0)
    const skips = results.filter((r) => r.id.startsWith('ecdsa-sigver-nist-skip-'))
    expect(skips).toHaveLength(2 * v.notExecuted.length)
    for (const s of skips) {
      expect(s.status).toBe('skip')
      expect(classesOf(s.id)).toEqual([])
    }
  })

  it('EdDSA SigVer: every upstream case (Ed25519/Ed448, pure and preHash) on both engines', () => {
    const v = readVectors('eddsa_sigver_acvp_test.json') as Vec
    for (const g of v.testGroups) {
      const scheme = `${g.curve === 'ED-25519' ? 'Ed25519' : 'Ed448'}${g.preHash ? 'ph' : ''}`
      for (const t of g.tests)
        for (const e of ENGINES) {
          const r = row(`eddsa-sigver-nist-${scheme}-tg${g.tgId}-tc${t.tcId}-${e}`)!
          expect(r.status, `${r.id}: ${r.details}`).toBe('pass')
          expect(r.caseMeta?.expected).toBe(t.testPassed ? 'valid' : 'invalid')
          expect(classesOf(r.id)).toEqual(['nist-acvp-reference-sample'])
        }
    }
  })
})

describe('WS-E classical reference samples — sabotaged expectations fail', () => {
  it('a changed expected byte / a valid tuple made invalid turns exactly those rows red', async () => {
    const flipHex = (h: string) =>
      h.slice(0, -2) +
      (parseInt(h.slice(-2), 16) ^ 0x01).toString(16).padStart(2, '0').toUpperCase()
    const gcm = readVectors('aesgcm_acvp_test.json')
    const gcmG = gcm.testGroups[0]
    const gcmT = gcmG.tests[0]
    gcmT.tag = flipHex(gcmT.tag)
    const hmac = readVectors('hmac_acvp_matrix_test.json')
    const hmacG = hmac.testGroups[2]
    // not the longest-MAC case: that one also feeds the invalid-MAC probes
    const hmacT = [...hmacG.tests].sort(
      (a: { macLen: number }, b: { macLen: number }) => a.macLen - b.macLen
    )[0]
    hmacT.mac = flipHex(hmacT.mac)
    const ec = readVectors('ecdsa_sigver_acvp_test.json')
    const ecG = ec.testGroups.find((g: { curve: string }) => g.curve === 'P-256')
    const ecT = ecG.tests.find((t: { testPassed: boolean }) => t.testPassed)
    ecT.message = flipHex(ecT.message)

    vi.resetModules()
    vi.doMock('@/data/acvp/aesgcm_acvp_test.json', () => ({ default: gcm }))
    vi.doMock('@/data/acvp/hmac_acvp_matrix_test.json', () => ({ default: hmac }))
    vi.doMock('@/data/acvp/ecdsa_sigver_acvp_test.json', () => ({ default: ec }))
    try {
      const out = await runSuite()
      const failedNew = out
        .filter(
          (r) => r.status === 'fail' && /^(aesgcm|hmac|ecdsa-sigver|eddsa-sigver)-/.test(r.id)
        )
        .filter((r) => !(engineOf(r) === 'Rust' && /-P-224-|aesgcm-nist-k128-tg[24]-/.test(r.id)))
      const slug = String(hmacG.hashAlg).toLowerCase().replace('/', '-')
      expect(failedNew.map((r) => r.id).sort()).toEqual(
        ENGINES.flatMap((e) => [
          `aesgcm-nist-k${gcmG.keyLen}-tg${gcmG.tgId}-tc${gcmT.tcId}-${e}`,
          `hmac-nist-${slug}-tc${hmacT.tcId}-${e}`,
          `ecdsa-sigver-nist-${ecG.curve}-${ecG.hashAlg}-tg${ecG.tgId}-tc${ecT.tcId}-${e}`,
        ]).sort()
      )
    } finally {
      vi.doUnmock('@/data/acvp/aesgcm_acvp_test.json')
      vi.doUnmock('@/data/acvp/hmac_acvp_matrix_test.json')
      vi.doUnmock('@/data/acvp/ecdsa_sigver_acvp_test.json')
    }
  }, 300_000)
})
