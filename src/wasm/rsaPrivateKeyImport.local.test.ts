// SPDX-License-Identifier: GPL-3.0-only
// Verifies hsm_importRSAPrivateKey and RSA-OAEP decryption against both real
// engines on NIST's own vectors: rsa_oaep_test.json is the ACVP KTS-IFC
// (SP 800-56B rev 2) sample, tgId 1 (OAEP SHA2-512) and tgId 3 (OAEP SHA-1),
// 20 cases (scripts/acvp/build_kts_oaep_subset.py). Each case's ciphertext must
// decrypt to NIST's plaintext.
//
// hsm_importRSAPrivateKey sends exactly the PKCS#11 v3.2 Table 39 template (no
// CKA_VALUE blob, no retry), so every import here is the standard template on
// both engines: this is the test that the Rust engine accepts it (hsm #278).
//
// It also PINS a known engine difference (maintainer decision 2026-09-26: the
// Rust limit stays, and the hub shows it). 18 of the 20 keys have public
// exponents of 34-56 bits: OpenSSL (C++) accepts them, while the Rust engine
// refuses any public exponent >= 2^33 by design (open gap
// rust-rsa-private-import-requires-cka-value). The counts below are fixed, so a
// crate upgrade or a corpus change that moves them fails here and forces the
// decision to be made again, instead of drifting silently.
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import * as S from './softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import rsaOaepTestVectors from '../data/acvp/rsa_oaep_test.json'

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
  const createSoftHSMModule = require_(gluePath) as (
    arg?: Record<string, unknown>
  ) => Promise<SoftHSMModule>
  return createSoftHSMModule({
    locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p),
  })
}

const hex = (s: string) => {
  const m = s.match(/.{1,2}/g) ?? []
  return new Uint8Array(m.map((b) => parseInt(b, 16)))
}

type Case = {
  tcId: number
  n: string
  e: string
  d: string
  p: string
  q: string
  dp: string
  dq: string
  qi: string
  ct: string
  pt: string
}
const OAEP_HASH: Record<string, 'sha1' | 'sha512'> = { 'SHA-1': 'sha1', 'SHA2-512': 'sha512' }
const CASES = rsaOaepTestVectors.testGroups.flatMap((g) =>
  (g.tests as Case[]).map((t) => ({ ...t, tgId: g.tgId, hash: OAEP_HASH[g.hashAlg] }))
)
const eBits = (e: string) => BigInt('0x' + e).toString(2).length
const SMALL = CASES.filter((c) => eBits(c.e) <= 33)
const WIDE = CASES.filter((c) => eBits(c.e) > 33)

const openSession = (M: SoftHSMModule) => {
  S.hsm_initialize(M)
  const slot = S.hsm_getFirstFreeSlot(M)
  const slotId = S.hsm_initToken(M, slot, '12345678', 'RSAImport')
  return S.hsm_openUserSession(M, slotId, '12345678', 'user1234')
}

/** Import one NIST key and decrypt its ciphertext; resolves to the plaintext hex, or throws. */
const decryptCase = async (M: SoftHSMModule, hSession: number, c: (typeof CASES)[number]) => {
  const privHandle = await S.hsm_importRSAPrivateKey(M, hSession, {
    n: hex(c.n),
    e: hex(c.e),
    d: hex(c.d),
    p: hex(c.p),
    q: hex(c.q),
    dp: hex(c.dp),
    dq: hex(c.dq),
    qi: hex(c.qi),
  })
  const plaintext = S.hsm_rsaDecrypt(M, hSession, privHandle, hex(c.ct), c.hash)
  return Array.from(plaintext)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

describe('the NIST KTS-IFC OAEP corpus', () => {
  it('has the shape the pinned counts below assume', () => {
    expect(CASES).toHaveLength(20)
    expect(CASES.every((c) => c.hash)).toBe(true)
    expect(SMALL.map((c) => eBits(c.e)).sort()).toEqual([31, 32])
    expect(WIDE).toHaveLength(18)
  })
})

describe('C++ engine (OpenSSL): every NIST case', () => {
  it('decrypts all 20 ciphertexts to NIST plaintexts, wide exponents included', async () => {
    const M = await loadCppEngineInNode()
    const hSession = openSession(M)
    for (const c of CASES) {
      expect(await decryptCase(M, hSession, c), `tgId ${c.tgId} tcId ${c.tcId}`).toBe(
        c.pt.toLowerCase()
      )
    }
    S.hsm_finalize(M, hSession)
  }, 120000)
})

describe('Rust engine: two documented refusals, so no NIST OAEP case decrypts', () => {
  // Measured 2026-09-26, and read from the source (pqctoday-hsm rust/src/ffi.rs,
  // oaep_padding): every Rust OAEP path supports hashAlg SHA-256/384/512 only.
  // The two small-exponent keys are both in the SHA-1 group (tgId 3), so Rust
  // refuses them at C_DecryptInit with CKR_MECHANISM_PARAM_INVALID; the other 18
  // are refused at import for their exponent. Net: 0 of NIST's 20 OAEP cases
  // decrypt on Rust, while C++ decrypts all 20. Both refusals are pinned so a
  // change to either fails here (open gap rust-rsa-private-import-requires-cka-value).
  it('refuses SHA-1 OAEP for the 2 small-exponent NIST cases (CKR_MECHANISM_PARAM_INVALID)', async () => {
    const M = (await S.getSoftHSMRustModule()) as SoftHSMModule
    const hSession = openSession(M)
    expect(SMALL.every((c) => c.hash === 'sha1')).toBe(true)
    for (const c of SMALL) {
      await expect(decryptCase(M, hSession, c), `tgId ${c.tgId} tcId ${c.tcId}`).rejects.toThrow(
        /CKR_MECHANISM_PARAM_INVALID/
      )
    }
    S.hsm_finalize(M, hSession)
  }, 120000)

  it('refuses all 18 wide-exponent NIST keys (public exponent >= 2^33)', async () => {
    const M = (await S.getSoftHSMRustModule()) as SoftHSMModule
    const hSession = openSession(M)
    let refused = 0
    for (const c of WIDE) {
      await decryptCase(M, hSession, c).then(
        () => undefined,
        () => {
          refused++
        }
      )
    }
    expect(refused).toBe(18)
    S.hsm_finalize(M, hSession)
  }, 120000)
})
