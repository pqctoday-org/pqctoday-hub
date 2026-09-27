// SPDX-License-Identifier: GPL-3.0-only
//
// Multi-part message signing (PKCS#11 v3.0 §5.15 / v3.2): C_MessageSignInit →
// C_SignMessageBegin → C_SignMessageNext × N, and the verify counterpart.
//
// WHY. Since hsm d4345f88 both engines advertise CKF_MULTI_MESSAGE on every
// signing mechanism (80 on Rust, 78 on C++), so the coverage matrix gained
// 1,092 message-sign-multipart / message-verify-multipart cells with no test.
// Maintainer ruling 2026-09-27: cover them with a round-trip test, not a waiver.
//
// WHAT each (mechanism, parameter set, engine) runs, over a 32-byte input sent
// in three parts (5 + 11 + 16 bytes; 32 bytes also suits the digest-input
// mechanisms CKM_ECDSA, CKM_RSA_PKCS_PSS, CKM_HASH_ML_DSA, CKM_HASH_SLH_DSA):
//   -sign row    the multi-part signature must verify with SINGLE-PART
//                C_Verify over the same 32 bytes; for a MAC it must also equal
//                the single-part C_Sign output byte for byte.
//   -verify row  multi-part verification must accept that signature, and must
//                REFUSE it when the last part is changed (negative control).
//
// EVIDENCE CLASS: functional round-trip. No external expected value exists for
// a fresh key and a randomized signature; these rows prove the multi-part
// path works and agrees with the single-part path on the same engine.
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  hsm_generateECKeyPair,
  hsm_generateHMACKey,
  hsm_generateMLDSAKeyPair,
  hsm_generateRSAKeyPair,
  hsm_generateSLHDSAKeyPair,
  rvName,
} from '@/wasm/softhsm'
import { MECH_TABLE } from '@/wasm/softhsm/mechanismTable'
import {
  HMAC_LEN,
  MULTIPART_TARGETS,
  multipartRowStem,
  type MultiPartFamily,
} from '@/data/validation/multipartTargets'
import { destroy, unsupportedReason, CKR_OK, type AcvpCaseMeta } from './mldsaAcvp'
import {
  hexUp,
  pPss,
  pUlong,
  rawMech,
  runRow,
  signRaw,
  skipRow,
  verifyRaw,
  type ClassicalSectionCtx,
  type ParamBlock,
  type RawMech,
  type RowOutcome,
} from './classicalRaw'

// Digest-family attributes: hash mechanism, CKG_MGF1_* and output length.
const HASH: Record<string, { mech: number; mgf: number; len: number }> = {
  SHA_1: { mech: 0x220, mgf: 0x1, len: 20 },
  SHA1: { mech: 0x220, mgf: 0x1, len: 20 },
  SHA224: { mech: 0x255, mgf: 0x5, len: 28 },
  SHA256: { mech: 0x250, mgf: 0x2, len: 32 },
  SHA384: { mech: 0x260, mgf: 0x3, len: 48 },
  SHA512: { mech: 0x270, mgf: 0x4, len: 64 },
  SHA3_224: { mech: 0x2b5, mgf: 0x6, len: 28 },
  SHA3_256: { mech: 0x2b0, mgf: 0x7, len: 32 },
  SHA3_384: { mech: 0x2c0, mgf: 0x8, len: 48 },
  SHA3_512: { mech: 0x2d0, mgf: 0x9, len: 64 },
}

const MECH_CODE: ReadonlyMap<string, number> = new Map(
  Object.entries(MECH_TABLE).map(([code, e]) => [e.name, Number(code)])
)

const INPUT = new Uint8Array(32).map((_, i) => (i * 37 + 11) & 0xff)
const PARTS = [INPUT.slice(0, 5), INPUT.slice(5, 16), INPUT.slice(16)]
const TAMPERED = (() => {
  const p = PARTS.map((x) => x.slice())
  p[2][p[2].length - 1] ^= 0x01
  return p
})()
const SLHDSA_CODE: Record<string, number> = {
  'SLH-DSA-SHA2-128s': 0x01,
  'SLH-DSA-SHAKE-128s': 0x02,
  'SLH-DSA-SHA2-128f': 0x03,
  'SLH-DSA-SHAKE-128f': 0x04,
  'SLH-DSA-SHA2-192s': 0x05,
  'SLH-DSA-SHAKE-192s': 0x06,
  'SLH-DSA-SHA2-192f': 0x07,
  'SLH-DSA-SHAKE-192f': 0x08,
  'SLH-DSA-SHA2-256s': 0x09,
  'SLH-DSA-SHAKE-256s': 0x0a,
  'SLH-DSA-SHA2-256f': 0x0b,
  'SLH-DSA-SHAKE-256f': 0x0c,
}
const SIG_BUF = 65536 // larger than any signature here (SLH-DSA-256f is 49,856 B)

/** CK_HASH_SIGN_ADDITIONAL_CONTEXT {hedgeVariant, no context, hash} for the
 *  generic CKM_HASH_ML_DSA / CKM_HASH_SLH_DSA (the input is a SHA-256 digest).
 *  hedge: 0 CKH_HEDGE_PREFERRED, 1 CKH_HEDGE_REQUIRED, 2 CKH_DETERMINISTIC_REQUIRED. */
function pHashSign(M: SoftHSMModule, hashMech: number, hedge = 0): ParamBlock {
  const ptr = M._malloc(16)
  M.setValue(ptr, hedge, 'i32')
  M.setValue(ptr + 4, 0, 'i32')
  M.setValue(ptr + 8, 0, 'i32')
  M.setValue(ptr + 12, hashMech, 'i32')
  return { ptr, len: 16, allocs: [ptr] }
}

/** The mechanism parameter block a target needs, or null. */
function paramFor(M: SoftHSMModule, mechanism: string): ParamBlock | null {
  if (mechanism.endsWith('_HMAC_GENERAL')) {
    const h = mechanism.slice(4, -'_HMAC_GENERAL'.length)
    return pUlong(M, HMAC_LEN[h]) // eslint-disable-line security/detect-object-injection
  }
  if (mechanism === 'CKM_RSA_PKCS_PSS') return pPss(M, HASH.SHA256.mech, HASH.SHA256.mgf, 32)
  if (mechanism.endsWith('_RSA_PKCS_PSS')) {
    const h = HASH[mechanism.slice(4, -'_RSA_PKCS_PSS'.length)]
    return pPss(M, h.mech, h.mgf, h.len)
  }
  if (mechanism === 'CKM_HASH_ML_DSA' || mechanism === 'CKM_HASH_SLH_DSA')
    return pHashSign(M, HASH.SHA256.mech)
  return null
}

const withBytes = <T>(M: SoftHSMModule, b: Uint8Array, f: (p: number) => T): T => {
  const p = M._malloc(Math.max(1, b.length))
  M.HEAPU8.set(b, p)
  try {
    return f(p)
  } finally {
    M._free(p)
  }
}

/** Multi-part C_SignMessageNext; the final part carries the output buffer. */
function signMultipart(
  M: SoftHSMModule,
  h: number,
  mech: RawMech,
  key: number,
  parts: Uint8Array[]
): { rv: number; step: string; sig: Uint8Array | null } {
  let rv = M._C_MessageSignInit(h, mech.ptr, key) >>> 0
  if (rv !== CKR_OK) return { rv, step: 'C_MessageSignInit', sig: null }
  const out = M._malloc(SIG_BUF)
  const lenPtr = M._malloc(4)
  try {
    rv = M._C_SignMessageBegin(h, 0, 0) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_SignMessageBegin', sig: null }
    for (let i = 0; i < parts.length; i++) {
      const last = i === parts.length - 1
      M.setValue(lenPtr, SIG_BUF, 'i32')
      // eslint-disable-next-line security/detect-object-injection
      rv = withBytes(
        M,
        parts[i],
        (dp) =>
          last
            ? M._C_SignMessageNext(h, 0, 0, dp, parts[i].length, out, lenPtr) >>> 0 // eslint-disable-line security/detect-object-injection
            : M._C_SignMessageNext(h, 0, 0, dp, parts[i].length, 0, 0) >>> 0 // eslint-disable-line security/detect-object-injection
      )
      if (rv !== CKR_OK) return { rv, step: `C_SignMessageNext(part ${i + 1})`, sig: null }
    }
    const n = M.getValue(lenPtr, 'i32') >>> 0
    return { rv, step: 'C_SignMessageNext', sig: M.HEAPU8.slice(out, out + n) }
  } finally {
    M._C_MessageSignFinal(h)
    M._free(out)
    M._free(lenPtr)
  }
}

/** Multi-part C_VerifyMessageNext; the final part carries the signature. */
function verifyMultipart(
  M: SoftHSMModule,
  h: number,
  mech: RawMech,
  key: number,
  parts: Uint8Array[],
  sig: Uint8Array
): { rv: number; step: string } {
  let rv = M._C_MessageVerifyInit(h, mech.ptr, key) >>> 0
  if (rv !== CKR_OK) return { rv, step: 'C_MessageVerifyInit' }
  try {
    rv = M._C_VerifyMessageBegin(h, 0, 0) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_VerifyMessageBegin' }
    for (let i = 0; i < parts.length; i++) {
      const last = i === parts.length - 1
      rv = withBytes(
        M,
        parts[i],
        (dp) =>
          // eslint-disable-line security/detect-object-injection
          last
            ? withBytes(
                M,
                sig,
                (sp) =>
                  // eslint-disable-next-line security/detect-object-injection
                  M._C_VerifyMessageNext(h, 0, 0, dp, parts[i].length, sp, sig.length) >>> 0
              )
            : M._C_VerifyMessageNext(h, 0, 0, dp, parts[i].length, 0, 0) >>> 0 // eslint-disable-line security/detect-object-injection
      )
      if (rv !== CKR_OK || last) return { rv, step: `C_VerifyMessageNext(part ${i + 1})` }
    }
    return { rv, step: 'C_VerifyMessageNext' }
  } finally {
    M._C_MessageVerifyFinal(h)
  }
}

/** Single-part C_SignMessage (two-call length query) → signature or refusal. */
function signMessageOnce(
  M: SoftHSMModule,
  h: number,
  mech: RawMech,
  key: number,
  data: Uint8Array
): { rv: number; step: string; sig: Uint8Array | null } {
  let rv = M._C_MessageSignInit(h, mech.ptr, key) >>> 0
  if (rv !== CKR_OK) return { rv, step: 'C_MessageSignInit', sig: null }
  const lenPtr = M._malloc(4)
  const out = M._malloc(SIG_BUF)
  try {
    M.setValue(lenPtr, SIG_BUF, 'i32')
    rv = withBytes(M, data, (dp) => M._C_SignMessage(h, 0, 0, dp, data.length, out, lenPtr) >>> 0)
    if (rv !== CKR_OK) return { rv, step: 'C_SignMessage', sig: null }
    const n = M.getValue(lenPtr, 'i32') >>> 0
    return { rv, step: 'C_SignMessage', sig: M.HEAPU8.slice(out, out + n) }
  } finally {
    M._C_MessageSignFinal(h)
    M._free(out)
    M._free(lenPtr)
  }
}

/** Single-part C_VerifyMessage → CK_RV. */
function verifyMessageOnce(
  M: SoftHSMModule,
  h: number,
  mech: RawMech,
  key: number,
  data: Uint8Array,
  sig: Uint8Array
): number {
  const rv = M._C_MessageVerifyInit(h, mech.ptr, key) >>> 0
  if (rv !== CKR_OK) return rv
  try {
    return withBytes(M, data, (dp) =>
      withBytes(M, sig, (sp) => M._C_VerifyMessage(h, 0, 0, dp, data.length, sp, sig.length) >>> 0)
    )
  } finally {
    M._C_MessageVerifyFinal(h)
  }
}

interface KeyPair {
  priv: number
  pub: number
}

/** One key (pair) per family and parameter set, generated lazily per engine. */
function keyFor(M: SoftHSMModule, h: number, family: MultiPartFamily, ps: string): KeyPair {
  switch (family) {
    case 'hmac': {
      const k = hsm_generateHMACKey(M, h, 32)
      return { priv: k, pub: k }
    }
    case 'rsa': {
      const k = hsm_generateRSAKeyPair(M, h, 2048)
      return { priv: k.privHandle, pub: k.pubHandle }
    }
    case 'ecdsa': {
      const k = hsm_generateECKeyPair(M, h, ps as 'P-256' | 'P-384' | 'P-521' | 'secp256k1')
      return { priv: k.privHandle, pub: k.pubHandle }
    }
    case 'mldsa': {
      const k = hsm_generateMLDSAKeyPair(M, h, Number(ps.slice(-2)) as 44 | 65 | 87)
      return { priv: k.privHandle, pub: k.pubHandle }
    }
    case 'slhdsa': {
      const k = hsm_generateSLHDSAKeyPair(M, h, SLHDSA_CODE[ps]) // eslint-disable-line security/detect-object-injection
      return { priv: k.privHandle, pub: k.pubHandle }
    }
  }
}

const FAMILY_LABEL: Record<MultiPartFamily, string> = {
  hmac: 'HMAC',
  rsa: 'RSA',
  ecdsa: 'ECDSA',
  mldsa: 'ML-DSA',
  slhdsa: 'SLH-DSA',
}

export async function runMultiMessageSignSection(
  ctx: ClassicalSectionCtx,
  families: readonly MultiPartFamily[]
): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const keys = new Map<string, KeyPair>()
  const source = 'PQC Today-authored round-trip (fresh key; no external expected value)'
  try {
    for (const t of MULTIPART_TARGETS) {
      if (!families.includes(t.family)) continue
      const code = MECH_CODE.get(t.mechanism)
      const why = unsupportedReason(mechs, code, t.mechanism)
      const isMac = t.family === 'hmac'
      for (const ps of t.paramSets) {
        const stem = multipartRowStem(t.mechanism, ps)
        const algorithm = `${FAMILY_LABEL[t.family]} ${t.mechanism}${ps === '*' ? '' : ` ${ps}`} multi-part (${eName})`
        const meta = (localOperation: AcvpCaseMeta['localOperation']): AcvpCaseMeta => ({
          origin: 'product-authored-probe',
          upstreamOperation: 'none',
          localOperation,
          parameterSet: ps,
          parameters: { mechanism: t.mechanism, parts: '5+11+16', family: t.family },
          expected: 'valid',
          source: {
            repo: 'https://github.com/pqctoday-org/pqctoday-hub',
            commit: 'working-tree',
            path: 'src/components/Playground/hsm/acvp/sections/multiMessageSign.ts',
            sha256: '',
          },
        })
        const signCase = `Multi-part sign · ${t.mechanism}${ps === '*' ? '' : ` · ${ps}`} · C_SignMessageBegin/Next (5+11+16 B) · expect a signature that single-part C_Verify accepts${isMac ? ' and equals the single-part C_Sign MAC' : ''}`
        const verifyCase = `Multi-part verify · ${t.mechanism}${ps === '*' ? '' : ` · ${ps}`} · C_VerifyMessageBegin/Next · expect CKR_OK for the signature and a refusal when the last part is changed`
        if (why) {
          await skipRow(ctx, {
            id: `${stem}-sign-${eName}`,
            algorithm,
            testCase: signCase,
            meta: meta('message-sign-multipart'),
            why,
          })
          await skipRow(ctx, {
            id: `${stem}-verify-${eName}`,
            algorithm,
            testCase: verifyCase,
            meta: meta('message-verify-multipart'),
            why,
          })
          continue
        }
        const keyId = `${t.family}:${ps}`
        let sig: Uint8Array | null = null
        let signObs = ''
        await runRow(ctx, {
          id: `${stem}-sign-${eName}`,
          algorithm,
          testCase: signCase,
          meta: meta('message-sign-multipart'),
          source,
          exec: (): RowOutcome => {
            if (!keys.has(keyId)) keys.set(keyId, keyFor(M, h, t.family, ps))
            const k = keys.get(keyId)!
            const m = rawMech(M, code!, paramFor(M, t.mechanism))
            try {
              const s = signMultipart(M, h, m, k.priv, PARTS)
              if (!s.sig) {
                signObs = `${s.step} → ${rvName(s.rv)}`
                return { ok: false, observed: signObs, details: signObs }
              }
              sig = s.sig
              if (isMac) {
                const one = signRaw(M, h, m, k.priv, INPUT)
                if (!one.out) {
                  const o = `single-part ${one.step} → ${rvName(one.rv)}`
                  return { ok: false, observed: o, details: o }
                }
                const same = hexUp(one.out) === hexUp(s.sig)
                const o = same ? 'MAC byte-equal to single-part' : 'MAC differs from single-part'
                return { ok: same, observed: o, details: `${o} (${s.sig.length} B)` }
              }
              const v = verifyRaw(M, h, m, k.pub, INPUT, s.sig)
              const rv = v.initRv !== CKR_OK ? v.initRv : v.rv
              const o = `single-part C_Verify → ${rvName(rv)}`
              return {
                ok: rv === CKR_OK,
                observed: o,
                details: `${o}; signature ${s.sig.length} B`,
              }
            } finally {
              m.free()
            }
          },
        })
        await runRow(ctx, {
          id: `${stem}-verify-${eName}`,
          algorithm,
          testCase: verifyCase,
          meta: meta('message-verify-multipart'),
          source,
          exec: (): RowOutcome => {
            if (!sig) {
              const o = `no signature to verify (${signObs || 'sign row failed'})`
              return { ok: false, observed: o, details: o }
            }
            const k = keys.get(keyId)!
            const m = rawMech(M, code!, paramFor(M, t.mechanism))
            try {
              const good = verifyMultipart(M, h, m, k.pub, PARTS, sig)
              const bad = verifyMultipart(M, h, m, k.pub, TAMPERED, sig)
              const ok = good.rv === CKR_OK && bad.rv !== CKR_OK
              const o = `${good.step} → ${rvName(good.rv)}; tampered → ${rvName(bad.rv)}`
              return {
                ok,
                observed: o,
                details: ok
                  ? `${o} (accepted, then refused the changed message)`
                  : good.rv !== CKR_OK
                    ? `${o} — REFUSED its own multi-part signature`
                    : `${o} — ACCEPTED a changed message`,
              }
            } finally {
              m.free()
            }
          },
        })
        // Generic CKM_HASH_SLH_DSA also advertises single-part message
        // signing; nothing else exercises it, so cover it here per hedge variant.
        if (t.mechanism === 'CKM_HASH_SLH_DSA') {
          for (const [variant, hedge] of [
            ['hedged', 1],
            ['deterministic', 2],
          ] as const) {
            const id = `${multipartRowStem(t.mechanism, ps)}-msg-${variant}-${eName}`
            const tc = `Single-part message sign + verify · ${t.mechanism} · ${ps} · ${variant} (CK_HASH_SIGN_ADDITIONAL_CONTEXT, SHA-256 digest) · expect C_VerifyMessage and C_Verify → CKR_OK${variant === 'deterministic' ? ' and two signatures byte-equal' : ''}`
            await runRow(ctx, {
              id,
              algorithm,
              testCase: tc,
              meta: meta(variant === 'hedged' ? 'sigGen-hedged' : 'sigGen-deterministic'),
              source,
              exec: (): RowOutcome => {
                if (!keys.has(keyId)) keys.set(keyId, keyFor(M, h, t.family, ps))
                const k = keys.get(keyId)!
                const m = rawMech(M, code!, pHashSign(M, HASH.SHA256.mech, hedge))
                try {
                  const a1 = signMessageOnce(M, h, m, k.priv, INPUT)
                  if (!a1.sig) {
                    const o = `${a1.step} → ${rvName(a1.rv)}`
                    return { ok: false, observed: o, details: o }
                  }
                  const vm = verifyMessageOnce(M, h, m, k.pub, INPUT, a1.sig)
                  const v = verifyRaw(M, h, m, k.pub, INPUT, a1.sig)
                  const vs = v.initRv !== CKR_OK ? v.initRv : v.rv
                  let det = true
                  if (variant === 'deterministic') {
                    const a2 = signMessageOnce(M, h, m, k.priv, INPUT)
                    det = !!a2.sig && hexUp(a2.sig) === hexUp(a1.sig)
                  }
                  const ok = vm === CKR_OK && vs === CKR_OK && det
                  const o = `C_VerifyMessage → ${rvName(vm)}; C_Verify → ${rvName(vs)}${variant === 'deterministic' ? `; repeat ${det ? 'byte-equal' : 'DIFFERS'}` : ''}`
                  return { ok, observed: o, details: `${o}; signature ${a1.sig.length} B` }
                } finally {
                  m.free()
                }
              },
            })
          }
        }
      }
    }
  } finally {
    for (const k of keys.values()) {
      destroy(M, h, k.priv)
      if (k.pub !== k.priv) destroy(M, h, k.pub)
    }
  }
}
