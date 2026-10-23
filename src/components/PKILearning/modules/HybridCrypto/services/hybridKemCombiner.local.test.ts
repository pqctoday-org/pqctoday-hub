// SPDX-License-Identifier: AGPL-3.0-only
//
// The Hybrid Key Establishment demo's combiner (hybridKemCombiner.ts) run on the
// REAL engines (the Rust wasm-bindgen engine as the browser uses it, and the C++
// Emscripten engine loaded in Node) and compared with an independent HKDF
// (node:crypto hkdfSync): the engine's 32-byte output must equal
// HKDF-SHA-256(IKM = ML-KEM_ss || X25519_ss, salt = none, info = label), and
// must differ from the salt-based form the demo used before.
//
// Venue: *.local.test.ts (real-wasm venue, run by `npm run test:local`).
import { createRequire } from 'node:module'
import path from 'node:path'
import { hkdfSync } from 'node:crypto'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as S from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { combineHybridSecrets, concatHybridSecrets, HYBRID_KEM_INFO } from './hybridKemCombiner'

const require_ = createRequire(import.meta.url)

const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  // process.cwd()-relative, NOT require.resolve('@pqctoday/softhsm-wasm/...'): in a
  // worktree whose node_modules is symlinked to a sibling worktree, the package
  // path would resolve to the sibling's binary (see keyLabelRoundTrip.local.test.ts).
  const gluePath = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const create = require_(gluePath) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p) })
}

// Fixed, non-secret test values (the demo draws both secrets at run time).
const kemSS = Uint8Array.from({ length: 32 }, (_, i) => 0x10 + i)
const ecdhSS = Uint8Array.from({ length: 32 }, (_, i) => 0xa0 + i)
const info = Buffer.from(HYBRID_KEM_INFO, 'utf8')

describe.each([
  ['rust', () => S.getSoftHSMRustModule()],
  ['cpp', () => loadCppEngineInNode()],
])('hybrid KEM combiner (%s engine)', (_name, getModule) => {
  let M: SoftHSMModule
  let hSession = 0

  beforeAll(async () => {
    M = (await getModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'HybridCombiner')
    hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')
  }, 60_000)

  afterAll(() => {
    S.hsm_finalize(M, hSession)
  })

  it('equals HKDF-SHA-256 over ML-KEM_ss || X25519_ss with no salt', () => {
    const r = combineHybridSecrets(M, hSession, kemSS, ecdhSS)
    const expected = new Uint8Array(
      hkdfSync('sha256', concatHybridSecrets(kemSS, ecdhSS), Buffer.alloc(0), info, 32)
    )
    expect(Array.from(r.key)).toEqual(Array.from(expected))
    expect(r.key).toHaveLength(32)
  })

  it('is not the old salt-based form and not the reverse concatenation order', () => {
    const r = combineHybridSecrets(M, hSession, kemSS, ecdhSS)
    // Old demo: IKM = X25519_ss, salt = ML-KEM_ss.
    const oldForm = new Uint8Array(hkdfSync('sha256', ecdhSS, kemSS, info, 32))
    const reversed = new Uint8Array(
      hkdfSync('sha256', concatHybridSecrets(ecdhSS, kemSS), Buffer.alloc(0), info, 32)
    )
    expect(Array.from(r.key)).not.toEqual(Array.from(oldForm))
    expect(Array.from(r.key)).not.toEqual(Array.from(reversed))
  })
})
