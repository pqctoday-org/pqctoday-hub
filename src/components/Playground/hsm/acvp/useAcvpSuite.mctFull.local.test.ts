// SPDX-License-Identifier: GPL-3.0-only
//
// KAT for the full 100-iteration Monte Carlo sections (sections/mctFullAcvp.ts,
// gap-closure P5): SHA-2 / SHA-3 standard and alternate MCT and the AES-CBC
// AESAVS §6.4 MCT, run directly against both real engines.
//
// What it proves:
//  - every one of the 100 outer results of every case byte-matches NIST on the
//    C++ and the Rust engine;
//  - the runtime budget the plan set (≤ 30 s per engine) holds — measured here,
//    per engine, on every run;
//  - a single changed outer result (iteration 57) on a COPY of the vectors turns
//    exactly that row red, naming the iteration.
//
// Venue: `*.local.test.ts` — run by `npm run test:local` (local gate only).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { TestResult } from './useAcvpSuite'
import type { ClassicalSectionCtx } from './sections/classicalRaw'
import { evidenceForRowId } from '@/data/validation/acvpRowEvidence.static'

const classesOf = (rowId: string) =>
  [...new Set(evidenceForRowId(rowId).map((e) => e.evidenceClass))].sort()

const require_ = createRequire(import.meta.url)
const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  // process.cwd()-relative, NOT require.resolve('@pqctoday/softhsm-wasm/...'):
  // that file: package resolves through node_modules, and in a worktree whose
  // node_modules is itself symlinked to a SIBLING worktree (a real, supported
  // setup), a relative symlink one level inside that shared node_modules
  // resolves relative to where IT lives, silently landing on the sibling
  // worktree's src/vendor/softhsm-wasm instead of this one's -- probing the
  // wrong C++ binary with no error (found 2026-09-25, P3 combined rebuild).
  const gluePath = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const create = require_(gluePath) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p) })
}
const DATA = path.resolve(__dirname, '../../../../data/acvp')
const readVectors = (name: string) => JSON.parse(readFileSync(path.join(DATA, name), 'utf8'))

type Engine = { name: 'C++' | 'Rust'; M: SoftHSMModule; hSession: number; slot: number }
const engines: Engine[] = []

const open = (name: Engine['name'], M: SoftHSMModule): Engine => {
  SoftHSM.hsm_initialize(M)
  const slot0 = SoftHSM.hsm_getFirstSlot(M)
  const slot = SoftHSM.hsm_initToken(M, slot0, '12345678', `mct-${name}`)
  const hSession = SoftHSM.hsm_openUserSession(M, slot, '12345678', '1234')
  return { name, M, hSession, slot }
}

const runSections = async (e: Engine) => {
  const { runShaMctFullSection, runAesCbcMctFullSection } = await import('./sections/mctFullAcvp')
  const rows: Omit<TestResult, 'category'>[] = []
  const ctx: ClassicalSectionCtx = {
    M: e.M,
    hSession: e.hSession,
    eName: e.name,
    slot: e.slot,
    mechs: new Set(),
    referenceUrl: 'https://csrc.nist.gov/',
    pushResult: async (r) => {
      rows.push(r)
    },
    addLog: () => {},
  }
  const t0 = Date.now()
  await runShaMctFullSection(ctx)
  await runAesCbcMctFullSection(ctx)
  return { rows, ms: Date.now() - t0 }
}

describe('full 100-iteration MCT — both engines, real vectors', () => {
  const out = new Map<string, { rows: Omit<TestResult, 'category'>[]; ms: number }>()
  beforeAll(async () => {
    engines.push(open('C++', await loadCppEngineInNode()))
    engines.push(open('Rust', (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule))
    for (const e of engines) out.set(e.name, await runSections(e))
  }, 300_000)

  it('byte-matches every outer result of every SHA and AES-CBC MCT case on both engines', () => {
    const sha = readVectors('sha_mct_full_test.json')
    const cbc = readVectors('aescbc_mct_full_test.json')
    for (const e of engines) {
      const { rows } = out.get(e.name)!
      expect(rows).toHaveLength(sha.testGroups.length + cbc.testGroups.length)
      for (const r of rows) {
        expect(r.status, `${r.id}: ${r.details}`).toBe('pass')
        expect(r.caseMeta?.observed).toBe('byte-equal')
        expect(r.details).toMatch(/all 100 outer results byte-equal/)
        expect(classesOf(r.id)).toEqual(['nist-acvp-reference-sample'])
      }
    }
    expect(sha.testGroups.map((g: { mctVersion: string }) => g.mctVersion)).toContain('alternate')
  })

  it('stays within the 30 s per-engine runtime budget', () => {
    for (const e of engines) expect(out.get(e.name)!.ms, e.name).toBeLessThan(30_000)
  })

  it('a changed outer result on a copy of the vectors fails exactly that row, naming the iteration', async () => {
    const sha = readVectors('sha_mct_full_test.json')
    const g = sha.testGroups[0]
    const md = g.tests[0].resultsArray[57].md as string
    g.tests[0].resultsArray[57].md =
      (parseInt(md.slice(0, 2), 16) ^ 0x01).toString(16).padStart(2, '0').toUpperCase() +
      md.slice(2)
    vi.resetModules()
    vi.doMock('@/data/acvp/sha_mct_full_test.json', () => ({ default: sha }))
    try {
      for (const e of engines) {
        const { rows } = await runSections(e)
        const failed = rows.filter((r) => r.status === 'fail')
        expect(failed).toHaveLength(1)
        expect(failed[0].id).toMatch(new RegExp(`tg${g.tgId}-tc${g.tests[0].tcId}-`))
        expect(failed[0].details).toMatch(/outer iteration 57 of 100/)
      }
    } finally {
      vi.doUnmock('@/data/acvp/sha_mct_full_test.json')
    }
  }, 300_000)
})
