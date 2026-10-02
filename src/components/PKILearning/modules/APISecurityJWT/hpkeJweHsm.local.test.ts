// SPDX-License-Identifier: GPL-3.0-only
/**
 * PQ JWE with the whole HPKE operation inside SoftHSM3 (PKCS#11 CKM_HPKE with
 * the SHAKE256 KDF, hsm #310), against:
 *   - the draft-ietf-jose-hpke-pq-pqt-01 Appendix A examples — the published
 *     JWK "priv" seed imported into the token, the token derives "pub", and the
 *     published compact JWE opens inside the token;
 *   - the noble/`hpke` browser path, in both directions (a token-sealed JWE
 *     opens in the browser path and vice versa) — two implementations that
 *     share no HPKE code;
 *   - the -22 rejection rules, which the token path shares with the browser one.
 * Plus the D3 guardrail: no workshop code passes the test-only `ephemeralSeed`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from '@/wasm/softhsm'
import examples from '@/data/acvp/jose-hpke-pq-pqt-01-examples.json'
import { base64urlDecode, base64urlEncode } from './jwtUtils'
import {
  HPKE_JWE_AEAD_ID,
  HPKE_JWE_ALGS,
  HPKE_JWE_KDF_ID,
  HPKE_JWE_SUITES,
  HpkeJweError,
  type HpkeJweAlg,
  type HsmHpkeOps,
  hpkeJweDecrypt,
  hpkeJweDecryptInHsm,
  hpkeJweEncrypt,
  hpkeJweEncryptInHsm,
} from './hpkeJwe'
import { hsmHpkeRecipient, softHsmHpkeOps } from './hpkeJweHsm'

const enc = new TextEncoder()
const dec = new TextDecoder()
const PLAINTEXT = enc.encode('{"sub":"in-token HPKE JWE"}')

describe('HPKE JWE inside SoftHSM3 (CKM_HPKE, SHAKE256 KDF)', () => {
  let M: SoftHSM.SoftHSMModule
  let hSession: number
  let ops: HsmHpkeOps

  beforeAll(async () => {
    M = (await SoftHSM.getSoftHSMRustModule()) as SoftHSM.SoftHSMModule
    SoftHSM.hsm_initialize(M)
    const freeSlot = SoftHSM.hsm_getFirstFreeSlot(M)
    const slotId = SoftHSM.hsm_initToken(M, freeSlot, '1234', 'HPKE JWE in token')
    hSession = SoftHSM.hsm_openUserSession(M, slotId, '1234', '1234')
    ops = softHsmHpkeOps(M, hSession)
  }, 60_000)

  it('the JOSE suite ids are the PKCS#11 CK_HPKE ids', () => {
    expect(HPKE_JWE_KDF_ID).toBe(SoftHSM.CKD_HPKE_SHAKE256)
    expect(HPKE_JWE_AEAD_ID).toBe(SoftHSM.CKZ_HPKE_AEAD_256_GCM)
    expect(HPKE_JWE_SUITES['HPKE-12'].kemId).toBe(SoftHSM.CKP_HPKE_KEM_ML_KEM_768)
    expect(HPKE_JWE_SUITES['HPKE-9'].kemId).toBe(SoftHSM.CKP_HPKE_KEM_MLKEM768_X25519)
  })

  describe.each(examples.vectors.map((v) => [v.alg as HpkeJweAlg, v] as const))(
    '%s published example',
    (alg, v) => {
      it('the token derives the published "pub" from the imported "priv" seed', () => {
        const r = hsmHpkeRecipient(M, hSession, alg, base64urlDecode(v.jwk.priv))
        expect(base64urlEncode(r.publicKey)).toBe(v.jwk.pub)
      })

      it('the published compact JWE opens inside the token', () => {
        const r = hsmHpkeRecipient(M, hSession, alg, base64urlDecode(v.jwk.priv))
        const { plaintext, header } = hpkeJweDecryptInHsm({
          token: v.compact,
          alg,
          hsm: ops,
          privHandle: r.privHandle,
        })
        expect(dec.decode(plaintext)).toBe(examples.plaintext)
        expect(header.alg).toBe(alg)
      })

      it('a modified ciphertext is rejected inside the token', () => {
        const r = hsmHpkeRecipient(M, hSession, alg, base64urlDecode(v.jwk.priv))
        const parts = v.compact.split('.')
        const ct = base64urlDecode(parts[3])
        ct[0] ^= 1
        parts[3] = base64urlEncode(ct)
        expect(() =>
          hpkeJweDecryptInHsm({ token: parts.join('.'), alg, hsm: ops, privHandle: r.privHandle })
        ).toThrow(HpkeJweError)
      })
    }
  )

  describe.each(HPKE_JWE_ALGS)('%s', (alg) => {
    it('token-generated key: seal and open both inside the token', () => {
      const r = hsmHpkeRecipient(M, hSession, alg)
      expect(r.publicKey).toHaveLength(HPKE_JWE_SUITES[alg].Npk)
      const sealed = hpkeJweEncryptInHsm({
        alg,
        plaintext: PLAINTEXT,
        hsm: ops,
        pubHandle: r.pubHandle,
        kid: 'k1',
      })
      expect(sealed.encapsulatedKey).toHaveLength(HPKE_JWE_SUITES[alg].Nenc)
      const [, , iv, , tag] = sealed.token.split('.')
      expect([iv, tag]).toEqual(['', ''])
      const { plaintext } = hpkeJweDecryptInHsm({
        token: sealed.token,
        alg,
        hsm: ops,
        privHandle: r.privHandle,
      })
      expect(dec.decode(plaintext)).toBe(dec.decode(PLAINTEXT))
    })

    it('interop: token seals → browser (noble + hpke) opens, and browser seals → token opens', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(HPKE_JWE_SUITES[alg].Nsk))
      const r = hsmHpkeRecipient(M, hSession, alg, seed)

      const fromToken = hpkeJweEncryptInHsm({
        alg,
        plaintext: PLAINTEXT,
        hsm: ops,
        pubHandle: r.pubHandle,
      })
      const opened = await hpkeJweDecrypt({ token: fromToken.token, alg, privateKey: seed })
      expect(dec.decode(opened.plaintext)).toBe(dec.decode(PLAINTEXT))

      const fromBrowser = await hpkeJweEncrypt({
        alg,
        plaintext: PLAINTEXT,
        publicKey: r.publicKey,
      })
      const inToken = hpkeJweDecryptInHsm({
        token: fromBrowser.token,
        alg,
        hsm: ops,
        privHandle: r.privHandle,
      })
      expect(dec.decode(inToken.plaintext)).toBe(dec.decode(PLAINTEXT))
    })
  })

  it('the token path applies the -22 header rules before touching the key', () => {
    const r = hsmHpkeRecipient(M, hSession, 'HPKE-12')
    const v9 = examples.vectors.find((v) => v.alg === 'HPKE-9')!
    expect(() =>
      hpkeJweDecryptInHsm({ token: v9.compact, alg: 'HPKE-12', hsm: ops, privHandle: r.privHandle })
    ).toThrow(/not an allowed HPKE algorithm/)
  })
})

/** Every non-test source file under `dir`. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return sourceFiles(p)
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : []
  })
}

describe('D3 guardrail: the deterministic-encapsulation hook stays in known-answer code', () => {
  it('no non-test source file except the binding itself sets ephemeralSeed', () => {
    const src = join(__dirname, '../../../..')
    const binding = join(src, 'wasm/softhsm.ts')
    const files = sourceFiles(src)
    expect(files).toContain(binding)
    expect(files).toContain(join(__dirname, 'hpkeJweHsm.ts'))
    const offenders = files.filter(
      (f) => f !== binding && readFileSync(f, 'utf8').includes('ephemeralSeed')
    )
    expect(offenders).toEqual([])
  })
})
