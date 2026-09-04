// SPDX-License-Identifier: GPL-3.0-only
//
// Regression for commit 285ca5d3f ("stop fabricating ACVP error code"):
// useAcvpSuite's ML-KEM Decapsulate KAT step used to log a fabricated
// CKR_GENERAL_ERROR PKCS#11 entry whenever the recovered shared secret
// didn't match NIST's expected value — but C_DecapsulateKey itself had
// already returned CKR_OK; the mismatch is a data-comparison failure, not
// a failed PKCS#11 call. The fix logs the real CKR_OK outcome with the
// mismatch flagged in the log entry's `args` text instead.
//
// That fix has never been exercised by a REAL mismatch: every genuine NIST
// vector matches by construction, so the "else" branch (useAcvpSuite.ts
// ~L1107-1138) was correct on paper but unproven at runtime. This test
// forces one: it runs the real hook against the real Rust engine and a
// real NIST private key + ciphertext (so C_DecapsulateKey is a completely
// genuine, unmodified call), but swaps in a deliberately wrong expected
// secret — done by mocking the imported JSON test-vector MODULE in this
// test's own module graph (vi.mock), never by touching the tracked
// src/data/acvp/mlkem_test.json file on disk.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'

const REAL_VECTORS_PATH = path.resolve(__dirname, '../../../../data/acvp/mlkem_test.json')

/** The real ML-KEM ACVP vectors, with test group 0's expected shared secret
 * flipped by one bit. `sk` and `ct` are untouched — decapsulation runs for
 * real against a genuine NIST private key and ciphertext; only the value
 * it gets COMPARED against is wrong. This object never touches disk. */
function loadVectorsWithCorruptedExpectedSecret() {
  const real = JSON.parse(readFileSync(REAL_VECTORS_PATH, 'utf8'))
  const corrupted = structuredClone(real)
  const ss = corrupted.testGroups[0].tests[0].ss as string
  const lastByte = ss.slice(-2)
  const flipped = (parseInt(lastByte, 16) ^ 0xff).toString(16).padStart(2, '0')
  corrupted.testGroups[0].tests[0].ss = ss.slice(0, -2) + flipped
  expect(corrupted.testGroups[0].tests[0].ss).not.toBe(ss)
  return corrupted
}

vi.mock('@/data/acvp/mlkem_test.json', () => ({
  default: loadVectorsWithCorruptedExpectedSecret(),
}))

vi.mock('../HsmContext', async () => {
  const actual = await vi.importActual<typeof import('../HsmContext')>('../HsmContext')
  return {
    ...actual,
    useHsmContext: () => ({
      moduleRef,
      rawModuleRef: moduleRef,
      crossCheckModuleRef: { current: null },
      hSessionRef: { current: 0 },
      slotRef: { current: 0 },
      engineMode: 'rust' as const,
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
      addHsmLog: addHsmLogSpy,
      addHsmStepLog: vi.fn(),
      autoInit: vi.fn().mockResolvedValue(true),
    }),
  }
})

// Populated in beforeAll; referenced by the HsmContext mock factory above
// (hoisted, so these must be `let`-declared before vi.mock runs them).
const moduleRef: { current: SoftHSMModule | null } = { current: null }
let addHsmLogSpy: ReturnType<typeof vi.fn>

describe('useAcvpSuite ML-KEM Decapsulate KAT — real mismatch (285ca5d3f regression)', () => {
  beforeAll(async () => {
    const M = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    moduleRef.current = M
    addHsmLogSpy = vi.fn()
  }, 30_000)

  it('logs the real CKR_OK outcome, not a fabricated error, when the recovered secret genuinely mismatches', async () => {
    const { useAcvpSuite } = await import('./useAcvpSuite')
    const { result } = renderHook(() => useAcvpSuite())

    const results = await result.current.runTests(new Set(['ml_kem']))

    const decapResult = results.find(
      (r) => r.testCase === 'Decapsulate KAT' && r.algorithm.includes('ML-KEM-512')
    )
    expect(decapResult, 'ML-KEM-512 Decapsulate KAT result must be present').toBeDefined()

    // The corrupted expectation must actually cause a detected mismatch —
    // otherwise this test would pass vacuously without exercising the
    // branch under test at all.
    expect(decapResult!.status).toBe('fail')
    expect(decapResult!.details).toMatch(/SS mismatch/)

    // The regression itself: find the HSM log entry addHsmLog received for
    // this decapsulation and confirm it reports the REAL outcome.
    const decapLogCalls = addHsmLogSpy.mock.calls
      .map((args) => args[0])
      .filter((entry) => typeof entry.fn === 'string' && entry.fn.includes('C_DecapsulateKey'))
    expect(decapLogCalls.length, 'expected exactly one C_DecapsulateKey HSM log entry').toBe(1)

    const logEntry = decapLogCalls[0]
    // This is the exact claim 285ca5d3f makes: the PKCS#11 call succeeded.
    expect(logEntry.rvName).toBe('CKR_OK')
    expect(logEntry.rvHex).toBe('0x00000000')
    expect(logEntry.ok).toBe(true)
    // The mismatch must still be visible somewhere in the log entry — the
    // fix moved it into `args`, it must not simply vanish.
    expect(logEntry.args).toMatch(/MISMATCH/i)
  }, 60_000)
})
