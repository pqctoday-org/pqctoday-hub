// SPDX-License-Identifier: AGPL-3.0-only
//
// NIST KDA-HKDF (SP 800-56C r2) multi-expansion cases on BOTH real engines:
// the C++ engine (Emscripten, loaded in Node) and the Rust engine
// (wasm-bindgen).
//
// What it proves:
//  - every committed multi-expansion case passes on both engines: one
//    C_DeriveKey(CKM_HKDF_DERIVE) per expansion over the same Z ‖ T and salt,
//    each derived key byte-equal to NIST's dkm (AFT), and at least one
//    differing from the dkms NIST marks invalid (VAL testPassed=false);
//  - sabotage: one changed dkm on a COPY of an AFT case turns exactly that row
//    red on both engines.
//
// Full vectors: with PQC_ACVP_NIST_DIR naming a directory that holds the pinned
// upstream file (KDA-HKDF-Sp800-56Cr2.json, the internalProjection.json of
// gen-val/json-files/KDA-HKDF-Sp800-56Cr2 from usnistgov/ACVP-Server @ 975de31e;
// checked against the sha256 in the committed file's _provenance), the last test
// runs every multi-expansion case — 200 groups, 1,000 cases — on both engines.
// The browser workbench runs only the committed subset. Without the upstream
// file that one test is skipped and says so; it never counts as a pass.
//
// Venue: `*.local.test.ts` — local gate only.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { CKM_HKDF_DERIVE } from '@/wasm/softhsm/constants'
import type { TestResult } from './useAcvpSuite'
import type { Provenance } from './sections/classicalRaw'
import { runHkdfMultiGroup, type HkdfMultiGroup } from './sections/kdfDeriveAcvp'

const require_ = createRequire(import.meta.url)
const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  // cwd-relative on purpose (see useAcvpSuite.mlkemAcvp.local.test.ts).
  const gluePath = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const create = require_(gluePath) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p) })
}

const DATA = path.resolve(__dirname, '../../../../data/acvp')
const committed = JSON.parse(readFileSync(path.join(DATA, 'hkdf_acvp_test.json'), 'utf8')) as {
  _provenance: Provenance & { source_sha256: string }
  testGroups: ({ multiExpansion?: boolean } & Partial<HkdfMultiGroup>)[]
}
const multiGroups = (groups: typeof committed.testGroups): HkdfMultiGroup[] =>
  groups.filter((g) => g.multiExpansion === true) as HkdfMultiGroup[]
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T

interface Engine {
  name: 'C++' | 'Rust'
  M: SoftHSMModule
  h: number
  slot: number
  mechs: Set<number>
}
const engines: Engine[] = []

const openEngine = (name: Engine['name'], M: SoftHSMModule): Engine => {
  SoftHSM.hsm_initialize(M)
  const slot = SoftHSM.hsm_initToken(M, SoftHSM.hsm_getFirstFreeSlot(M), '1234', 'HKDF multi')
  const h = SoftHSM.hsm_openUserSession(M, slot, '1234', '1234')
  return { name, M, h, slot, mechs: new Set(SoftHSM.hsm_getMechanismList(M, slot)) }
}

const run = async (e: Engine, groups: HkdfMultiGroup[]): Promise<TestResult[]> => {
  const rows: TestResult[] = []
  const ctx = {
    M: e.M,
    hSession: e.h,
    slot: e.slot,
    eName: e.name,
    mechs: e.mechs,
    referenceUrl: 'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program',
    pushResult: async (r: Omit<TestResult, 'category'>) => {
      rows.push({ ...r, category: 'kdf' } as TestResult)
    },
    addLog: () => {},
  }
  const why = e.mechs.size > 0 && !e.mechs.has(CKM_HKDF_DERIVE) ? 'CKM_HKDF_DERIVE missing' : null
  for (const g of groups) await runHkdfMultiGroup(ctx, g, committed._provenance, why)
  return rows
}

describe('NIST HKDF multi-expansion, both engines', () => {
  const subset = multiGroups(committed.testGroups)
  const results = new Map<string, TestResult[]>()

  beforeAll(async () => {
    engines.push(openEngine('C++', await loadCppEngineInNode()))
    engines.push(openEngine('Rust', (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule))
    for (const e of engines) results.set(e.name, await run(e, subset))
  }, 600_000)

  it('carries 30 committed multi-expansion cases (AFT per hash and salt, VAL per hash)', () => {
    const cases = subset.flatMap((g) => g.tests)
    expect(cases).toHaveLength(30)
    expect(subset.filter((g) => g.testType === 'AFT').flatMap((g) => g.tests)).toHaveLength(20)
    expect(cases.filter((t) => t.testPassed === false)).toHaveLength(10)
  })

  it('every committed case passes on both engines, with identical row sets', () => {
    const [cpp, rust] = engines.map((e) => results.get(e.name)!)
    expect(cpp).toHaveLength(30)
    expect(rust.map((r) => r.id.replace(/-Rust$/, ''))).toEqual(
      cpp.map((r) => r.id.replace(/-C\+\+$/, ''))
    )
    for (const e of engines) {
      const bad = results.get(e.name)!.filter((r) => r.status !== 'pass')
      expect(bad.map((r) => `${r.id}: ${r.details}`), e.name).toEqual([])
    }
  })

  it('SABOTAGE: one changed dkm on a copy turns exactly that AFT row red on both engines', async () => {
    const copy = clone(subset)
    const g = copy.find((x) => x.testType === 'AFT')!
    const t = g.tests[0]!
    const last = t.dkms.length - 1
    const d = t.dkms[last]! // eslint-disable-line security/detect-object-injection
    t.dkms[last] = d.slice(0, -1) + (d.endsWith('0') ? '1' : '0') // eslint-disable-line security/detect-object-injection
    for (const e of engines) {
      const rows = await run(e, copy)
      const red = rows.filter((r) => r.status !== 'pass')
      expect(red.map((r) => r.id), e.name).toEqual([
        rows.find((r) => r.id.includes(`-tg${g.tgId}-tc${t.tcId}-`))!.id,
      ])
    }
  })

  const NIST_DIR = process.env.PQC_ACVP_NIST_DIR
  it.skipIf(!NIST_DIR)(
    'FULL: all 1,000 multi-expansion cases of the 200 NIST groups pass on both engines (PQC_ACVP_NIST_DIR)',
    async () => {
      const file = path.join(NIST_DIR!, 'KDA-HKDF-Sp800-56Cr2.json')
      expect(existsSync(file), file).toBe(true)
      const raw = readFileSync(file)
      expect(createHash('sha256').update(raw).digest('hex')).toBe(
        committed._provenance.source_sha256
      )
      const full = multiGroups(JSON.parse(raw.toString('utf8')).testGroups)
      expect(full).toHaveLength(200)
      for (const e of engines) {
        const rows = await run(e, full)
        const bad = rows.filter((r) => r.status !== 'pass')
        expect(
          bad.map((r) => `${r.id}: ${r.details}`),
          `${e.name}: ${rows.length - bad.length}/${rows.length}`
        ).toEqual([])
        expect(rows).toHaveLength(1000)
        console.warn(`[hkdf multi-expansion FULL] ${e.name}: ${rows.length - bad.length}/1000 pass`)
      }
    },
    7_200_000
  )
})
