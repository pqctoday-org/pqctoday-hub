// SPDX-License-Identifier: GPL-3.0-only
//
// KAT for the WS-E classical / symmetric / MAC reference-sample sections
// (sections/aesGcmAcvp.ts, hmacAcvp.ts, ecSigVerAcvp.ts, shaAcvp.ts, aesKwAcvp.ts, aesCbcCtrAcvp.ts, rsaSigVerAcvp.ts), driven through the
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
//  - SHA-2/SHA-3: empty / shortest / block-boundary / longest digests and the
//    standard-MCT first outer iteration byte-match on both engines;
//  - AES-KW/KWP: wrap and unwrap byte-match, upstream integrity failures are
//    refused with CKR_WRAPPED_KEY_INVALID on both engines;
//  - AES-CBC / AES-CTR: AFT and the MCT first outer iteration byte-match on
//    both engines; the product-authored CBC length probes return the pinned
//    codes; a 15-byte IV gets CKR_MECHANISM_PARAM_INVALID on C++ but
//    CKR_ARGUMENTS_BAD on Rust (not a C_EncryptInit return value — red row,
//    open gap rust-cbc-iv-length-arguments-bad);
//  - RSA SigVer: every upstream case on C++; Rust refuses public exponents
//    above 2^33-1 (CKR_KEY_TYPE_INCONSISTENT — open gap
//    rust-rsa-public-exponent-limit);
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

  it('SHA-2/SHA-3: every boundary digest and MCT outer iteration byte-matches on both engines', () => {
    const v = readVectors('sha_acvp_boundary_test.json') as Vec & { notExecuted: unknown[] }
    const lens = new Set<number>()
    for (const g of v.testGroups) {
      const slug = String(g.hashAlg).toLowerCase().replace('/', '-')
      for (const t of g.tests)
        for (const e of ENGINES) {
          const kind = g.testType === 'MCT' ? 'mct' : 'nist'
          const r = row(`sha-${kind}-${slug}-tg${g.tgId}-tc${t.tcId}-${e}`)!
          expect(r.status, `${r.id}: ${r.details}`).toBe('pass')
          expect(r.caseMeta?.observed).toBe('byte-equal')
          expect(classesOf(r.id)).toEqual(['nist-acvp-reference-sample'])
          if (kind === 'nist') lens.add(Number(t.len) / 8 - Number(g.blockBytes))
        }
    }
    // exact-block and block−1 messages are present (no upstream sample has a block+1 byte message)
    expect([...lens]).toEqual(expect.arrayContaining([-1, 0]))
    expect(v.testGroups.some((g) => g.tests.some((t) => t.len === 0 && g.testType === 'AFT'))).toBe(
      true
    )
    expect(v.testGroups.filter((g) => g.testType === 'MCT').length).toBeGreaterThanOrEqual(7)
    const skips = results.filter((r) => r.id.startsWith('sha-skip-'))
    expect(skips).toHaveLength(2 * v.notExecuted.length)
    for (const r of skips) expect(r.status).toBe('skip')
  })

  it('AES-KW/KWP: wrap and unwrap byte-match; upstream integrity failures refused on both engines', () => {
    const v = readVectors('aeskw_acvp_test.json') as Vec
    let negatives = 0
    for (const g of v.testGroups)
      for (const t of g.tests)
        for (const e of ENGINES) {
          const mode = String(g.mode).toLowerCase()
          const r = row(`aes${mode}-nist-k${g.keyLen}-tg${g.tgId}-tc${t.tcId}-${e}`)!
          expect(r.status, `${r.id}: ${r.details}`).toBe('pass')
          if (t.testPassed) expect(r.caseMeta?.observed).toBe('byte-equal')
          else {
            negatives += 1
            expect(r.caseMeta?.observed).toBe('CKR_WRAPPED_KEY_INVALID')
          }
          expect(classesOf(r.id)).toEqual(['nist-acvp-reference-sample'])
        }
    expect(negatives).toBe(2 * 6)
    // one-byte and non-64-bit-aligned KWP payloads are exercised
    expect(v.testGroups.some((g) => g.mode === 'KWP' && g.payloadLen === 8)).toBe(true)
    expect(
      v.testGroups.some(
        (g) => g.mode === 'KWP' && Number(g.payloadLen) % 64 !== 0 && Number(g.payloadLen) > 8
      )
    ).toBe(true)
  })

  it('AES-CBC/CTR: AFT and MCT outer iteration byte-match; length/IV probes pinned (Rust IV finding)', () => {
    const cbc = readVectors('aescbc_acvp_test.json') as Vec
    for (const g of cbc.testGroups)
      for (const t of g.tests)
        for (const e of ENGINES) {
          const kind = g.testType === 'MCT' ? 'mct' : 'nist'
          const r = row(`aescbc-${kind}-k${g.keyLen}-tg${g.tgId}-tc${t.tcId}-${e}`)!
          expect(r.status, `${r.id}: ${r.details}`).toBe('pass')
          expect(r.caseMeta?.observed).toBe('byte-equal')
          expect(classesOf(r.id)).toEqual(['nist-acvp-reference-sample'])
        }
    expect(new Set(cbc.testGroups.map((g) => g.keyLen))).toEqual(new Set([128, 192, 256]))
    expect(cbc.testGroups.filter((g) => g.testType === 'MCT')).toHaveLength(6)
    const ctr = readVectors('aesctr_acvp_test.json') as Vec
    for (const g of ctr.testGroups)
      for (const t of g.tests)
        for (const e of ENGINES) {
          const r = row(`aesctr-nist-k${g.keyLen}-tg${g.tgId}-tc${t.tcId}-${e}`)!
          expect(r.status, `${r.id}: ${r.details}`).toBe('pass')
          expect(classesOf(r.id)).toEqual(['nist-acvp-reference-sample'])
        }
    const want: Record<string, Record<string, string>> = {
      encLen15: { 'C++': 'CKR_DATA_LEN_RANGE', Rust: 'CKR_DATA_LEN_RANGE' },
      decLen17: { 'C++': 'CKR_ENCRYPTED_DATA_LEN_RANGE', Rust: 'CKR_ENCRYPTED_DATA_LEN_RANGE' },
      iv15: { 'C++': 'CKR_MECHANISM_PARAM_INVALID', Rust: 'CKR_ARGUMENTS_BAD' },
    }
    for (const [key, byEngine] of Object.entries(want))
      for (const e of ENGINES) {
        const r = row(`aescbc-probe-${key}-${e}`)!
        expect(r.caseMeta?.observed, r.id).toBe(byEngine[e])
        // Rust's CKR_ARGUMENTS_BAD is not a C_EncryptInit return value: the row stays red
        expect(r.status, r.details).toBe(key === 'iv15' && e === 'Rust' ? 'fail' : 'pass')
        expect(classesOf(r.id)).toEqual(['product-mechanism-probe'])
      }
  })

  it('RSA SigVer: upstream disposition on every case; Rust refuses exponents above 2^33-1 (pinned finding)', () => {
    const v = readVectors('rsa_sigver_acvp_test.json') as Vec & { notExecuted: unknown[] }
    for (const g of v.testGroups) {
      const bigE = BigInt(`0x${g.e}`) > 2n ** 33n - 1n
      for (const t of g.tests)
        for (const e of ENGINES) {
          const r = row(
            `rsa-sigver-nist-${g.modulo}-${g.sigType}-${g.hashAlg}-tg${g.tgId}-tc${t.tcId}-${e}`
          )!
          const gap = e === 'Rust' && bigE
          expect(r.status, `${r.id}: ${r.details}`).toBe(gap ? 'fail' : 'pass')
          expect(r.caseMeta?.observed).toBe(
            gap
              ? 'CKR_KEY_TYPE_INCONSISTENT'
              : t.testPassed === true
                ? 'CKR_OK'
                : 'CKR_SIGNATURE_INVALID'
          )
          expect(classesOf(r.id)).toEqual(['nist-acvp-reference-sample'])
        }
    }
    const skips = results.filter((r) => r.id.startsWith('rsa-sigver-nist-skip-'))
    expect(skips).toHaveLength(2 * v.notExecuted.length)
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
