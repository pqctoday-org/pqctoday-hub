// SPDX-License-Identifier: GPL-3.0-only
//
// PROJECT WYCHEPROOF (Google / C2SP) adversarial vectors, driven through the REAL
// useAcvpSuite hook in dual-engine mode — sections/wycheproofNegative.ts.
// Source: https://github.com/C2SP/wycheproof @ 3fa63dd0 (Apache-2.0).
//
// What this test is for: the corpus is worthless if nothing executes it, and a
// reject-path result is only evidence if the engine's actual behaviour is pinned.
// So every engine finding is pinned as a NUMBER per file and per Wycheproof
// result class: a fixed engine turns the pin red instead of silently changing
// published evidence.
//
// Venue: `*.local.test.ts` — run by `npm run test:local` (local gate only).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { CategoryId, TestResult } from './useAcvpSuite'
import { WYCHEPROOF_ATTRIBUTION } from './sections/wycheproofNegative'

const require_ = createRequire(import.meta.url)
const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  // process.cwd()-relative, NOT require.resolve('@pqctoday/softhsm-wasm/...'):
  // in a worktree whose node_modules is symlinked to a sibling worktree, that
  // resolution silently lands on the sibling's C++ binary.
  const gluePath = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
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

const run = async (cats: CategoryId[]): Promise<TestResult[]> => {
  const { useAcvpSuite } = await import('./useAcvpSuite')
  const { result } = renderHook(() => useAcvpSuite())
  const out = await result.current.runTests(new Set(cats))
  await waitFor(() =>
    expect(result.current.logs.at(-1)).toMatch(/Validation Workbench run completed/)
  )
  const critical = result.current.logs.filter((l) => /Critical Error/.test(l))
  if (critical.length > 0) throw new Error(critical.join('\n'))
  return out
}

/** The seven vendored files, their row-id key and their upstream name. */
const FILES = [
  { key: 'x25519', file: 'wycheproof_x25519_test.json' },
  { key: 'x448', file: 'wycheproof_x448_test.json' },
  { key: 'ed25519', file: 'wycheproof_ed25519_test.json' },
  { key: 'ed448', file: 'wycheproof_ed448_test.json' },
  { key: 'aeskw', file: 'wycheproof_aes_wrap_test.json' },
  { key: 'aeskwp', file: 'wycheproof_aes_kwp_test.json' },
  { key: 'rsapss', file: 'wycheproof_rsa_pss_2048_sha256_mgf1_32_test.json' },
] as const

type WycResult = 'valid' | 'invalid' | 'acceptable'
interface Census {
  total: number
  byResult: Record<WycResult, number>
}
const censusOf = (name: string): Census => {
  const v = readVectors(name) as { testGroups: { tests: { result: WycResult }[] }[] }
  const c: Census = { total: 0, byResult: { valid: 0, invalid: 0, acceptable: 0 } }
  for (const g of v.testGroups)
    for (const t of g.tests) {
      c.total += 1
      c.byResult[t.result] += 1
    }
  return c
}

describe('Project Wycheproof (Google / C2SP) adversarial vectors, both engines', () => {
  let rows: TestResult[] = []

  beforeAll(async () => {
    rustRef.current = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    cppRef.current = await loadCppEngineInNode()
    rows = (await run(['classical', 'symmetric'])).filter((r) => r.id.startsWith('wyc-'))
  }, 1_800_000)

  const of = (key: string, engine: string) =>
    rows.filter((r) => r.id.startsWith(`wyc-${key}-`) && r.id.endsWith(`-${engine}`))

  it('attributes every row to Google / C2SP with a link to the source', () => {
    expect(WYCHEPROOF_ATTRIBUTION).toContain('Google / C2SP')
    expect(WYCHEPROOF_ATTRIBUTION).toContain('https://github.com/C2SP/wycheproof')
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      // The visible source tag names Wycheproof and the pinned commit, and never
      // presents Google's vectors as NIST's.
      expect(r.details).toMatch(/Wycheproof\(Google\/C2SP\)@3fa63dd0 \S+\.json$/)
      expect(r.details).not.toMatch(/ACVP-Server@/)
      expect(r.referenceUrl).toBe('https://github.com/C2SP/wycheproof')
      expect(r.caseMeta?.origin).toBe('third-party-oracle')
      expect(r.caseMeta?.source.repo).toBe('https://github.com/C2SP/wycheproof')
      expect(r.caseMeta?.source.commit).toBe('3fa63dd0344abb611f1fb1d77e119938603ea230')
    }
  })

  it('executes every case of every vendored file, on both engines, with no skips', () => {
    for (const { key, file } of FILES) {
      const census = censusOf(file)
      for (const engine of ['C++', 'Rust']) {
        const got = of(key, engine)
        expect(got.length, `${file} / ${engine}`).toBe(census.total)
        expect(
          got.filter((r) => r.status === 'skip').length,
          `${file} / ${engine} skipped rows`
        ).toBe(0)
      }
    }
  })

  it('SUMMARY (pinned below): pass/fail per file per engine per Wycheproof result', () => {
    const lines: string[] = []
    for (const { key } of FILES)
      for (const engine of ['C++', 'Rust']) {
        const got = of(key, engine)
        for (const res of ['valid', 'invalid', 'acceptable'] as WycResult[]) {
          const sub = got.filter((r) => r.caseMeta?.parameters?.wycheproofResult === res)
          if (!sub.length) continue
          lines.push(
            `${key}\t${engine}\t${res}\tn=${sub.length}\tpass=${sub.filter((r) => r.status === 'pass').length}\tfail=${sub.filter((r) => r.status === 'fail').length}`
          )
        }
      }
    console.warn('\n[WYCHEPROOF SUMMARY]\n' + lines.join('\n'))
    const flagLines: string[] = []
    for (const flag of ['LowOrderPublic', 'ZeroSharedSecret', 'Twist', 'ModifiedPadding'])
      for (const engine of ['C++', 'Rust']) {
        const sub = rows.filter(
          (r) => String(r.caseMeta?.parameters?.flags ?? '').includes(flag) && r.id.endsWith(engine)
        )
        if (!sub.length) continue
        const refused = sub.filter((r) => !/byte-equal|CKR_OK/.test(r.caseMeta?.observed ?? ''))
        flagLines.push(
          `${flag}\t${engine}\tn=${sub.length}\trefused=${refused.length}\taccepted=${sub.length - refused.length}\tpass=${sub.filter((r) => r.status === 'pass').length}`
        )
      }
    console.warn('\n[WYCHEPROOF FLAG BEHAVIOUR]\n' + flagLines.join('\n'))
    const firstFailures = rows
      .filter((r) => r.status === 'fail')
      .slice(0, 12)
      .map((r) => `${r.id}: ${r.caseMeta?.observed} | ${r.testCase}`)
    console.warn('\n[WYCHEPROOF FIRST FAILURES]\n' + firstFailures.join('\n'))
    expect(lines.length).toBeGreaterThan(0)
  })

  // ── PINNED ENGINE FINDINGS (measured 2026-09-26, Wycheproof @ 3fa63dd0) ────

  it('pins the ONLY hard reject-path failure: Rust verifies 3 invalid-encoding Ed448 signatures', () => {
    // Wycheproof ed448_test tg4/tc63-65: bits 448-454 of R are unused and MUST
    // be zero (RFC 8032 §5.2.3), so a signature with one of them set is an
    // invalid encoding. C++ refuses all 70 invalid Ed448 cases; Rust accepts
    // these 3. Pinned as a FAILURE, not waived: fixing the Rust engine turns
    // this red and the gap row must then be closed.
    const failed = rows.filter((r) => r.status === 'fail').map((r) => r.id)
    expect(failed.sort()).toEqual([
      'wyc-ed448-tg4-tc63-Rust',
      'wyc-ed448-tg4-tc64-Rust',
      'wyc-ed448-tg4-tc65-Rust',
    ])
    for (const id of failed) {
      const r = rows.find((x) => x.id === id)!
      expect(r.caseMeta?.observed).toBe('C_Verify → CKR_OK')
      expect(r.details).toMatch(/VERIFIED a signature Wycheproof marks invalid/)
    }
  })

  it('pins how each engine treats low-order X25519/X448 public keys', () => {
    // These are Wycheproof `acceptable` cases — refusing them and accepting them
    // are both defensible, so the ROW passes either way. The numbers below are
    // the security-relevant fact the row alone does not tell you, and they are
    // pinned so a change in either engine is visible. They back the open gap
    // rows reported with this change.
    const behaviour = (flag: string, engine: string) => {
      const sub = rows.filter(
        (r) => String(r.caseMeta?.parameters?.flags ?? '').includes(flag) && r.id.endsWith(engine)
      )
      const refused = sub.filter((r) => !/byte-equal|CKR_OK/.test(r.caseMeta?.observed ?? ''))
      return { n: sub.length, refused: refused.length, accepted: sub.length - refused.length }
    }
    // C++ refuses nearly every low-order key; Rust accepts most of them.
    expect(behaviour('LowOrderPublic', 'C++')).toEqual({ n: 45, refused: 42, accepted: 3 })
    expect(behaviour('LowOrderPublic', 'Rust')).toEqual({ n: 45, refused: 9, accepted: 36 })
    // ZeroSharedSecret: the derived secret is all-zero. C++ refuses all 42;
    // Rust returns the all-zero secret for 33 of them (contributory-behaviour
    // check absent — RFC 7748 §6.1 "check whether the output is all-zero").
    expect(behaviour('ZeroSharedSecret', 'C++')).toEqual({ n: 42, refused: 42, accepted: 0 })
    expect(behaviour('ZeroSharedSecret', 'Rust')).toEqual({ n: 42, refused: 9, accepted: 33 })
    // Points on the twist: both engines compute with them (RFC 7748 allows it
    // for X25519/X448 by design — the twist is secure).
    expect(behaviour('Twist', 'C++')).toEqual({ n: 455, refused: 9, accepted: 446 })
    expect(behaviour('Twist', 'Rust')).toEqual({ n: 455, refused: 3, accepted: 452 })
  })

  it('pins RSA-PSS SHA-256 (rsa_pss_2048_sha256_mgf1_32): both engines pass all 108 cases', () => {
    // 63 valid must verify, 45 invalid must be refused. Measured 2026-09-26 on
    // the bundles built from hsm d1f74a52: no divergence on either engine.
    for (const engine of ['C++', 'Rust']) {
      const got = of('rsapss', engine)
      expect(got.length).toBe(108)
      expect(got.filter((r) => r.status !== 'pass').map((r) => r.id)).toEqual([])
      const invalid = got.filter((r) => r.caseMeta?.parameters?.wycheproofResult === 'invalid')
      expect(invalid.length).toBe(45)
      expect(invalid.every((r) => !/→ CKR_OK$/.test(r.caseMeta?.observed ?? ''))).toBe(true)
    }
  })

  it('pins that both engines reject every AES-KWP modified-padding case', () => {
    for (const engine of ['C++', 'Rust']) {
      const sub = rows.filter(
        (r) =>
          String(r.caseMeta?.parameters?.flags ?? '').includes('ModifiedPadding') &&
          r.id.endsWith(engine)
      )
      expect(sub.length).toBe(177)
      expect(sub.every((r) => r.status === 'pass')).toBe(true)
      expect(sub.every((r) => /C_UnwrapKey → CKR_/.test(r.caseMeta?.observed ?? ''))).toBe(true)
    }
  })

  it('pins the per-file, per-engine reject-path outcome', () => {
    const count = (key: string, engine: string, res: WycResult) =>
      of(key, engine).filter((r) => r.caseMeta?.parameters?.wycheproofResult === res)
    // Every Wycheproof `invalid` case is refused by both engines, except the 3
    // Ed448 encodings pinned above.
    for (const key of ['x448', 'ed25519', 'aeskw', 'aeskwp'])
      for (const engine of ['C++', 'Rust'])
        expect(
          count(key, engine, 'invalid').filter((r) => r.status === 'fail').length,
          `${key}/${engine}`
        ).toBe(0)
    expect(count('ed448', 'C++', 'invalid').filter((r) => r.status === 'fail').length).toBe(0)
    expect(count('ed448', 'Rust', 'invalid').filter((r) => r.status === 'fail').length).toBe(3)
    // x25519_test carries no `invalid` case at all at this commit: every
    // low-order / zero-shared-secret / twist case there is `acceptable`.
    expect(count('x25519', 'C++', 'invalid').length).toBe(0)
    expect(count('x25519', 'C++', 'valid').length).toBe(264)
    expect(count('x25519', 'C++', 'acceptable').length).toBe(254)
  })

  it('never reports a Wycheproof `valid` case as a failure without saying so', () => {
    // A `valid` case that fails means the engine refused input Wycheproof marks
    // good — always a discrepancy row with an explicit detail string, never a
    // silent pass.
    for (const r of rows.filter(
      (x) => x.caseMeta?.parameters?.wycheproofResult === 'valid' && x.status === 'fail'
    ))
      expect(r.details).toMatch(/REFUSED|failed a signature|mismatch/)
  })
})

describe('Wycheproof sections — sabotaged expectations fail', () => {
  it('detects a changed shared secret, a flipped result and a changed wrapped plaintext', async () => {
    const flipHex = (h: string) =>
      (parseInt(h.slice(0, 2), 16) ^ 0x80).toString(16).padStart(2, '0') + h.slice(2)

    // 1. a `valid` X25519 case whose expected shared secret no longer matches
    const x = readVectors('wycheproof_x25519_test.json')
    const xt = x.testGroups[0].tests[0]
    xt.shared = flipHex(xt.shared)
    // 2. an Ed25519 signature Wycheproof marks valid, relabelled `invalid`:
    //    the engine verifies it, so the row must go red.
    const ed = readVectors('wycheproof_ed25519_test.json')
    const et = ed.testGroups[0].tests[0]
    et.result = 'invalid'
    // 3. a `valid` AES-KWP case whose expected plaintext no longer matches
    const kwp = readVectors('wycheproof_aes_kwp_test.json')
    const kt = kwp.testGroups[0].tests[0]
    kt.msg = flipHex(kt.msg)

    vi.resetModules()
    vi.doMock('@/data/acvp/wycheproof_x25519_test.json', () => ({ default: x }))
    vi.doMock('@/data/acvp/wycheproof_ed25519_test.json', () => ({ default: ed }))
    vi.doMock('@/data/acvp/wycheproof_aes_kwp_test.json', () => ({ default: kwp }))
    try {
      const results = await run(['classical', 'symmetric'])
      const row = (id: string) => results.find((r) => r.id === id)
      for (const engine of ['C++', 'Rust']) {
        expect(row(`wyc-x25519-tg1-tc${xt.tcId}-${engine}`)?.status, engine).toBe('fail')
        expect(row(`wyc-ed25519-tg1-tc${et.tcId}-${engine}`)?.status, engine).toBe('fail')
        expect(row(`wyc-aeskwp-tg1-tc${kt.tcId}-${engine}`)?.status, engine).toBe('fail')
      }
    } finally {
      vi.doUnmock('@/data/acvp/wycheproof_x25519_test.json')
      vi.doUnmock('@/data/acvp/wycheproof_ed25519_test.json')
      vi.doUnmock('@/data/acvp/wycheproof_aes_kwp_test.json')
    }
  }, 900_000)
})
