// SPDX-License-Identifier: GPL-3.0-only
//
// ECDSA / EdDSA key validation and signature generation from NIST ACVP-Server
// reference samples (gap-closure plan 2026-09-25, P5 item 2 — WS-E remainder),
// per engine:
//
//  - KeyVer (ECDSA-KeyVer-FIPS186-5 P-256/384/521, EDDSA-KeyVer-1.0): PKCS#11
//    has no key-validation call, so the key is USED — the upstream d signs a
//    fixed message (CKM_ECDSA_SHA256 / CKM_EDDSA) and the imported public point
//    verifies it. A NIST-valid key must give CKR_OK. A NIST-invalid point must
//    be refused at C_CreateObject, C_VerifyInit or C_Verify with a code other
//    than CKR_SIGNATURE_INVALID / CKR_SIGNATURE_LEN_RANGE (a signature error
//    means the point was never validated).
//  - ECDSA SigGen verify-back (ECDSA-SigGen-FIPS186-5, P-256/384/521 × the
//    eight CKM_ECDSA_<hash> mechanisms): the NIST key signs the NIST message;
//    C_Sign draws its own nonce, so NIST r, s cannot be reproduced. The
//    signature is verified by the same engine with the NIST public key
//    (functional round-trip) and, in its own row, by @noble/curves over the
//    @noble/hashes digest (independent oracle — agreement, not a NIST value).
//  - EdDSA SigGen (EDDSA-SigGen-1.0): EdDSA is deterministic — C_Sign with the
//    NIST d (and CK_EDDSA_PARAMS phFlag / context) must byte-match NIST.
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName } from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_SIGN,
  CKA_VALUE,
} from '@/wasm/softhsm/constants'
import {
  destroy,
  srcOf,
  srcTag,
  unsupportedReason,
  CKR_OK,
  CKR_SIGNATURE_INVALID,
  type AcvpCaseMeta,
  type Provenance,
} from './mldsaAcvp'
import { createObjectRv, sha256Tag } from './pkcs11Raw'
import {
  WSE_CK,
  WSE_MECH,
  hexUp,
  pEddsa,
  rawMech,
  runRow,
  signRaw,
  skipRow,
  verifyRaw,
  type ClassicalSectionCtx,
  type RowOutcome,
} from './classicalRaw'
import { CURVE_BYTES, CURVE_OID, importPublicRv } from './ecSigVerAcvp'

const CKR_SIGNATURE_LEN_RANGE = 0xc1

/** ACVP hashAlg → CKM_ECDSA_<hash> (PKCS#11 v3.2 §6.3.13). */
export const ECDSA_SIGGEN_MECH: Readonly<Record<string, keyof typeof WSE_MECH>> = {
  'SHA2-224': 'CKM_ECDSA_SHA224',
  'SHA2-256': 'CKM_ECDSA_SHA256',
  'SHA2-384': 'CKM_ECDSA_SHA384',
  'SHA2-512': 'CKM_ECDSA_SHA512',
  'SHA3-224': 'CKM_ECDSA_SHA3_224',
  'SHA3-256': 'CKM_ECDSA_SHA3_256',
  'SHA3-384': 'CKM_ECDSA_SHA3_384',
  'SHA3-512': 'CKM_ECDSA_SHA3_512',
}

/** The oracle identity every ECDSA oracle row names. */
export const ECDSA_ORACLE =
  '@noble/curves 2.x p256/p384/p521 ECDSA verify over a @noble/hashes digest (FIPS 186-5 §6.4.2)'

/** Fixed message the KeyVer rows sign (ASCII "PQC Today KeyVer"). */
const KEYVER_MSG = new TextEncoder().encode('PQC Today KeyVer')

const leftPad = (hex: string, n: number): string => hex.padStart(2 * n, '0').slice(-2 * n)

function importEcPrivate(
  M: SoftHSMModule,
  h: number,
  keyType: number,
  oid: number[],
  d: Uint8Array
): { rv: number; handle: number } {
  return createObjectRv(
    M,
    h,
    [
      { type: CKA_CLASS, ulongVal: WSE_CK.CKO_PRIVATE_KEY },
      { type: CKA_KEY_TYPE, ulongVal: keyType },
      { type: CKA_TOKEN, boolVal: false },
      { type: CKA_PRIVATE, boolVal: true },
      { type: CKA_SENSITIVE, boolVal: true },
      { type: CKA_SIGN, boolVal: true },
    ],
    [
      { type: WSE_CK.CKA_EC_PARAMS, bytes: new Uint8Array(oid) },
      { type: CKA_VALUE, bytes: d },
    ]
  )
}

/** Ed25519 pure with an empty context takes no parameter (§6.3.15); every other scheme uses CK_EDDSA_PARAMS. */
const eddsaMech = (M: SoftHSMModule, curve: string, preHash: boolean, context: Uint8Array) =>
  rawMech(
    M,
    WSE_MECH.CKM_EDDSA,
    curve === 'ED-25519' && !preHash && context.length === 0 ? null : pEddsa(M, preHash, context)
  )

/** KeyVer verdict from the import / sign / verify observations. */
function keyVerOutcome(
  valid: boolean,
  reason: string,
  imp: { rv: number },
  sign: { rv: number; step: string; out: Uint8Array | null } | null,
  ver: { initRv: number; rv: number } | null
): RowOutcome {
  if (imp.rv !== CKR_OK) {
    const o = `C_CreateObject → ${rvName(imp.rv)}`
    return valid
      ? { ok: false, observed: o, details: `${o} — REFUSED a public key NIST marks valid` }
      : { ok: true, observed: o, details: `${o} (invalid point refused at import: ${reason})` }
  }
  if (!sign?.out) {
    const o = `${sign?.step ?? 'C_Sign'} → ${rvName(sign?.rv ?? 0)}`
    return { ok: false, observed: o, details: `${o} — could not sign with the NIST d` }
  }
  const at = ver!.initRv !== CKR_OK ? 'C_VerifyInit' : 'C_Verify'
  const rv = ver!.initRv !== CKR_OK ? ver!.initRv : ver!.rv
  const o = `${at} → ${rvName(rv)}`
  if (valid)
    return rv === CKR_OK
      ? { ok: true, observed: o, details: `${o} (NIST-valid key usable: signature by d verifies)` }
      : {
          ok: false,
          observed: o,
          details: `${o} — a NIST-valid key did not verify its own signature`,
        }
  const sigErr = rv === CKR_OK || rv === CKR_SIGNATURE_INVALID || rv === CKR_SIGNATURE_LEN_RANGE
  return sigErr
    ? {
        ok: false,
        observed: o,
        details: `${o} — the invalid point (${reason}) was ACCEPTED and used; no public-key validation (FIPS 186-5 / SP 800-56A partial validation)`,
      }
    : {
        ok: true,
        observed: o,
        details: `${o} (invalid point refused when used: ${reason})${at === 'C_Verify' ? ' — note: C_Verify (§5.15.2) does not list this code' : ''}`,
      }
}

interface EcKeyVerCase {
  tcId: number
  testPassed: boolean
  reason: string
  d: string
  qx?: string
  qy?: string
  q?: string
}
interface KeyVerGroup {
  tgId: number
  curve: string
  tests: EcKeyVerCase[]
}

export async function runEcKeyVerAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const [ecMod, edMod] = await Promise.all([
    import('@/data/acvp/ecdsa_keyver_acvp_test.json'),
    import('@/data/acvp/eddsa_keyver_acvp_test.json'),
  ])
  for (const [f, family] of [
    [ecMod.default, 'ECDSA'],
    [edMod.default, 'EdDSA'],
  ] as const) {
    const file = f as unknown as { _provenance: Provenance; testGroups: KeyVerGroup[] }
    const P = file._provenance
    const mechType = family === 'ECDSA' ? WSE_MECH.CKM_ECDSA_SHA256 : WSE_MECH.CKM_EDDSA
    const why = unsupportedReason(
      mechs,
      mechType,
      family === 'ECDSA' ? 'CKM_ECDSA_SHA256' : 'CKM_EDDSA'
    )
    for (const g of file.testGroups) {
      for (const t of g.tests) {
        const id = `${family.toLowerCase()}-keyver-nist-${g.curve}-tg${g.tgId}-tc${t.tcId}-${eName}`
        const algorithm = `${family} ${g.curve} (${eName})`
        const testCase = `KeyVer · NIST ${family} keyVer tg${g.tgId}/tc${t.tcId} · ${g.curve} · ${t.reason === 'none' ? 'valid point' : t.reason} · expect ${t.testPassed ? 'key usable (sign with d, verify → CKR_OK)' : 'point refused with a key error'}`
        const meta: AcvpCaseMeta = {
          origin: 'nist-acvp-server',
          upstreamOperation: 'keyVer',
          localOperation: 'sigVer',
          parameterSet: g.curve,
          parameters: { curve: g.curve },
          expected: t.testPassed ? 'accepted' : 'rejected',
          expectedReason: t.reason,
          tgId: g.tgId,
          tcId: t.tcId,
          source: srcOf(P),
        }
        if (why) {
          await skipRow(ctx, { id, algorithm, testCase, meta, why })
          continue
        }
        await runRow(ctx, {
          id,
          algorithm,
          testCase,
          meta,
          source: srcTag(P),
          exec: () => {
            const ec = family === 'ECDSA'
            const n = CURVE_BYTES[g.curve] ?? 0
            const point = ec
              ? hexToBytes('04' + leftPad(t.qx!, n) + leftPad(t.qy!, n))
              : hexToBytes(t.q!)
            const keyType = ec ? WSE_CK.CKK_EC : WSE_CK.CKK_EC_EDWARDS
            const oid = CURVE_OID[g.curve]
            const pub = importPublicRv(M, h, keyType, oid, point)
            const priv = importEcPrivate(M, h, keyType, oid, hexToBytes(ec ? leftPad(t.d, n) : t.d))
            const m = ec ? rawMech(M, mechType) : eddsaMech(M, g.curve, false, new Uint8Array())
            try {
              if (pub.rv !== CKR_OK) return keyVerOutcome(t.testPassed, t.reason, pub, null, null)
              const s =
                priv.rv === CKR_OK
                  ? signRaw(M, h, m, priv.handle, KEYVER_MSG)
                  : { rv: priv.rv, step: 'C_CreateObject(d)', out: null }
              const v = s.out ? verifyRaw(M, h, m, pub.handle, KEYVER_MSG, s.out) : null
              return keyVerOutcome(t.testPassed, t.reason, pub, s, v)
            } finally {
              m.free()
              destroy(M, h, pub.handle)
              destroy(M, h, priv.handle)
            }
          },
        })
      }
    }
  }
}

interface EcdsaSigGenGroup {
  tgId: number
  curve: string
  hashAlg: string
  d: string
  qx: string
  qy: string
  tests: { tcId: number; message: string }[]
}

/** noble digest + curve for the oracle rows (loaded lazily, inside the section). */
async function ecdsaOracle() {
  const [{ p256, p384, p521 }, sha2, sha3] = await Promise.all([
    import('@noble/curves/nist.js'),
    import('@noble/hashes/sha2.js'),
    import('@noble/hashes/sha3.js'),
  ])
  const curves: Record<string, typeof p256> = { 'P-256': p256, 'P-384': p384, 'P-521': p521 }
  const hashes: Record<string, (m: Uint8Array) => Uint8Array> = {
    'SHA2-224': sha2.sha224,
    'SHA2-256': sha2.sha256,
    'SHA2-384': sha2.sha384,
    'SHA2-512': sha2.sha512,
    'SHA3-224': sha3.sha3_224,
    'SHA3-256': sha3.sha3_256,
    'SHA3-384': sha3.sha3_384,
    'SHA3-512': sha3.sha3_512,
  }
  return (curve: string, hashAlg: string, sig: Uint8Array, msg: Uint8Array, pub: Uint8Array) => {
    const c = curves[curve] // eslint-disable-line security/detect-object-injection
    const hf = hashes[hashAlg] // eslint-disable-line security/detect-object-injection
    if (!c || !hf) throw new Error(`no oracle for ${curve}/${hashAlg}`)
    return c.verify(sig, hf(msg), pub, { prehash: false, lowS: false, format: 'compact' })
  }
}

export async function runEcdsaSigGenAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/ecdsa_siggen_acvp_test.json')).default as unknown as {
    _provenance: Provenance
    testGroups: EcdsaSigGenGroup[]
  }
  const P = f._provenance
  const verifyOracle = await ecdsaOracle()
  for (const g of f.testGroups) {
    const mechName = ECDSA_SIGGEN_MECH[g.hashAlg]
    const mech = mechName ? WSE_MECH[mechName] : undefined // eslint-disable-line security/detect-object-injection
    const why = unsupportedReason(mechs, mech, mechName ?? `ECDSA/${g.hashAlg}`)
    const n = CURVE_BYTES[g.curve] ?? 0
    const pubPoint = hexToBytes('04' + leftPad(g.qx, n) + leftPad(g.qy, n))
    for (const t of g.tests) {
      const base = `ecdsa-siggen-${g.curve}-${g.hashAlg.toLowerCase()}-tg${g.tgId}-tc${t.tcId}`
      const algorithm = `ECDSA ${g.curve} ${g.hashAlg} (${eName})`
      const msg = hexToBytes(t.message)
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'sigGen',
        localOperation: 'sigGen-verify-back',
        parameterSet: g.curve,
        hashAlg: g.hashAlg,
        messageBytes: msg.length,
        parameters: { curve: g.curve, hashAlg: g.hashAlg },
        expected: 'valid',
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(P),
      }
      const tcBase = `SigGen verify-back · NIST ECDSA sigGen tg${g.tgId}/tc${t.tcId} key + message · ${g.curve} · ${g.hashAlg} · msg ${msg.length}B`
      if (why) {
        for (const kind of ['rt', 'oracle'])
          await skipRow(ctx, {
            id: `${base}-${kind}-${eName}`,
            algorithm,
            testCase: tcBase,
            meta,
            why,
          })
        continue
      }
      // One signature, two rows: the engine's own verification and the oracle's.
      let sig: Uint8Array | null = null
      let signObs = ''
      await runRow(ctx, {
        id: `${base}-rt-${eName}`,
        algorithm,
        testCase: `${tcBase} · C_Sign then C_Verify with the NIST public key (round-trip; NIST r, s not reproducible — C_Sign draws its own nonce)`,
        meta,
        source: srcTag(P),
        exec: () => {
          const priv = importEcPrivate(
            M,
            h,
            WSE_CK.CKK_EC,
            CURVE_OID[g.curve],
            hexToBytes(leftPad(g.d, n))
          )
          const pub = importPublicRv(M, h, WSE_CK.CKK_EC, CURVE_OID[g.curve], pubPoint)
          const m = rawMech(M, mech!)
          try {
            if (priv.rv !== CKR_OK || pub.rv !== CKR_OK) {
              signObs = `C_CreateObject → ${rvName(priv.rv !== CKR_OK ? priv.rv : pub.rv)}`
              return { ok: false, observed: signObs, details: signObs }
            }
            const s = signRaw(M, h, m, priv.handle, msg)
            if (!s.out) {
              signObs = `${s.step} → ${rvName(s.rv)}`
              return { ok: false, observed: signObs, details: signObs }
            }
            sig = s.out
            const v = verifyRaw(M, h, m, pub.handle, msg, s.out)
            const rv = v.initRv !== CKR_OK ? v.initRv : v.rv
            const o = `C_Verify → ${rvName(rv)}`
            return {
              ok: rv === CKR_OK && s.out.length === 2 * n,
              observed: o,
              details: `${o}; sig ${s.out.length}B (${sha256Tag(s.out)}) · functional round-trip: no external expected value`,
            }
          } finally {
            m.free()
            destroy(M, h, priv.handle)
            destroy(M, h, pub.handle)
          }
        },
      })
      await runRow(ctx, {
        id: `${base}-oracle-${eName}`,
        algorithm,
        testCase: `${tcBase} · the engine signature verified by an independent implementation`,
        meta,
        source: srcTag(P),
        exec: () => {
          if (!sig) {
            const o = `no signature to check (${signObs})`
            return { ok: false, observed: o, details: o }
          }
          const ok = verifyOracle(g.curve, g.hashAlg, sig, msg, pubPoint)
          const o = `${ECDSA_ORACLE} → ${ok ? 'valid' : 'INVALID'}`
          return {
            ok,
            observed: o,
            details: `${o} · agreement with that oracle for this case, not a NIST expected value`,
          }
        },
      })
    }
  }
}

interface EddsaSigGenGroup {
  tgId: number
  testType: string
  curve: string
  d: string
  q: string
  preHash: boolean
  tests: { tcId: number; message: string; context?: string; signature: string }[]
}

export async function runEddsaSigGenAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/eddsa_siggen_acvp_test.json')).default as unknown as {
    _provenance: Provenance
    testGroups: EddsaSigGenGroup[]
  }
  const P = f._provenance
  const why = unsupportedReason(mechs, WSE_MECH.CKM_EDDSA, 'CKM_EDDSA')
  for (const g of f.testGroups) {
    const scheme = `${g.curve === 'ED-25519' ? 'Ed25519' : 'Ed448'}${g.preHash ? 'ph' : ''}`
    for (const t of g.tests) {
      const ctxBytes = hexToBytes(t.context ?? '')
      const id = `eddsa-siggen-nist-${scheme}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `${scheme} (${eName})`
      const testCase = `SigGen · NIST EdDSA sigGen ${g.testType} tg${g.tgId}/tc${t.tcId} · ${scheme} (phFlag ${g.preHash}) · ctx ${ctxBytes.length}B · msg ${t.message.length / 2}B · byte-match (EdDSA is deterministic)`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'sigGen',
        localOperation: 'sigGen-deterministic',
        parameterSet: g.curve,
        mode: g.preHash ? 'preHash' : 'pure',
        contextBytes: ctxBytes.length,
        messageBytes: t.message.length / 2,
        parameters: { curve: g.curve, preHash: g.preHash, testType: g.testType },
        expected: 'byte-match',
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(P),
      }
      if (why) {
        await skipRow(ctx, { id, algorithm, testCase, meta, why })
        continue
      }
      await runRow(ctx, {
        id,
        algorithm,
        testCase,
        meta,
        source: srcTag(P),
        exec: (): RowOutcome => {
          const priv = importEcPrivate(
            M,
            h,
            WSE_CK.CKK_EC_EDWARDS,
            CURVE_OID[g.curve],
            hexToBytes(g.d)
          )
          const m = eddsaMech(M, g.curve, g.preHash, ctxBytes)
          try {
            if (priv.rv !== CKR_OK) {
              const o = `C_CreateObject → ${rvName(priv.rv)}`
              return { ok: false, observed: o, details: o }
            }
            const s = signRaw(M, h, m, priv.handle, hexToBytes(t.message))
            if (!s.out) {
              const o = `${s.step} → ${rvName(s.rv)}`
              return { ok: false, observed: o, details: o }
            }
            const ok = hexUp(s.out) === t.signature.toUpperCase()
            return {
              ok,
              observed: ok ? 'byte-equal' : 'differs',
              details: ok
                ? `sig[${s.out.length}B] byte-equal to NIST expected`
                : `sig[${s.out.length}B] differs from NIST expected${ctxBytes.length ? ` (context ${ctxBytes.length}B, phFlag ${g.preHash})` : ''}`,
            }
          } finally {
            m.free()
            destroy(M, h, priv.handle)
          }
        },
      })
    }
  }
}
