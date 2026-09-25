// SPDX-License-Identifier: GPL-3.0-only
//
// ECDSA and EdDSA dedicated SigVer from NIST ACVP-Server reference samples
// (remediation plan 2026-09-24, WS-E), per engine:
//
//  - ECDSA-SigVer-FIPS186-5: every case (1 valid + modify message / key / r /
//    s, zero r / s) on P-224/256/384/521 for the four hashes PKCS#11 v3.2 has a
//    CKM_ECDSA_<hash> mechanism for (SHA2-256/512, SHA3-256/512);
//  - EDDSA-SigVer-1.0: every case (1 valid + modify message / key / r / s) for
//    Ed25519/Ed448, pure and preHash (CK_EDDSA_PARAMS.phFlag).
//
// The expected disposition is the upstream's own testPassed. A valid case must
// return CKR_OK from C_Verify. An invalid case passes only when the engine
// refuses it FOR THE UPSTREAM REASON: C_Verify must return
// CKR_SIGNATURE_INVALID — or CKR_SIGNATURE_LEN_RANGE only when the upstream
// signature really has the wrong length (§5.15.2; several upstream Ed448
// "modify r/s" signatures are 113 bytes, not 114). ECDSA r and s are
// left-padded to the curve length, so there it is always a wrong-reason
// refusal. A refusal at
// C_CreateObject or C_VerifyInit counts only for the "modify key" class (key
// validation). An engine that refuses every signature on a curve therefore
// fails its negatives too, instead of passing them by accident.
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName } from '@/wasm/softhsm'
import { derOctetString } from '@/wasm/softhsm/helpers'
import {
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_VERIFY,
  CKA_VALUE,
  CKA_EC_PARAMS,
  CKA_EC_POINT,
  CKO_PUBLIC_KEY,
  CKK_EC,
  CKK_EC_EDWARDS,
} from '@/wasm/softhsm/constants'
import type { SoftHSMModule } from '@/wasm/softhsm'
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
import { createObjectRv } from './pkcs11Raw'
import {
  WSE_MECH,
  pEddsa,
  rawMech,
  runRow,
  skipRow,
  verifyRaw,
  type ClassicalSectionCtx,
  type RowOutcome,
} from './classicalRaw'

const CKR_ATTRIBUTE_TYPE_INVALID = 0x12
const CKR_SIGNATURE_LEN_RANGE = 0xc1

/** Named-curve OIDs (DER) for CKA_EC_PARAMS. */
export const CURVE_OID: Readonly<Record<string, number[]>> = {
  'P-224': [0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x21],
  'P-256': [0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07],
  'P-384': [0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x22],
  'P-521': [0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x23],
  'ED-25519': [0x06, 0x03, 0x2b, 0x65, 0x70],
  'ED-448': [0x06, 0x03, 0x2b, 0x65, 0x71],
}
/** Field-element byte length per curve (r, s and coordinates are left-padded to it). */
export const CURVE_BYTES: Readonly<Record<string, number>> = {
  'P-224': 28,
  'P-256': 32,
  'P-384': 48,
  'P-521': 66,
}
const ECDSA_MECH_BY_HASH: Readonly<Record<string, keyof typeof WSE_MECH>> = {
  'SHA2-256': 'CKM_ECDSA_SHA256',
  'SHA2-512': 'CKM_ECDSA_SHA512',
  'SHA3-256': 'CKM_ECDSA_SHA3_256',
  'SHA3-512': 'CKM_ECDSA_SHA3_512',
}

const leftPad = (hex: string, n: number): Uint8Array => {
  const b = hexToBytes(hex)
  if (b.length >= n) return b
  const out = new Uint8Array(n)
  out.set(b, n - b.length)
  return out
}

/** C_CreateObject(CKO_PUBLIC_KEY): CKA_VALUE is offered for the Rust engine and
 * dropped on CKR_ATTRIBUTE_TYPE_INVALID (the C++ engine rejects it), as the
 * hub's hsm_importECPublicKey / hsm_importEdDSAPublicKey do. */
function importPublicRv(
  M: SoftHSMModule,
  h: number,
  keyType: number,
  oid: number[],
  point: Uint8Array
): { rv: number; handle: number } {
  const defs = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: keyType },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
  ]
  const bytes = [
    { type: CKA_EC_PARAMS, bytes: new Uint8Array(oid) },
    { type: CKA_EC_POINT, bytes: derOctetString(point) },
  ]
  const full = createObjectRv(M, h, defs, [...bytes, { type: CKA_VALUE, bytes: point }])
  if (full.rv !== CKR_ATTRIBUTE_TYPE_INVALID) return full
  return createObjectRv(M, h, defs, bytes)
}

/** Verdict for one SigVer case given the upstream disposition and reason. */
function sigVerOutcome(
  expectValid: boolean,
  reason: string,
  sigLenOk: boolean,
  imp: { rv: number },
  r: { initRv: number; rv: number } | null
): RowOutcome {
  const keyClass = /modify key/i.test(reason)
  const early = imp.rv !== CKR_OK ? `C_CreateObject → ${rvName(imp.rv)}` : null
  const init = !early && r!.initRv !== CKR_OK ? `C_VerifyInit → ${rvName(r!.initRv)}` : null
  if (early || init) {
    const o = (early ?? init)!
    if (expectValid) return { ok: false, observed: o, details: `${o} — the NIST case is valid` }
    return keyClass
      ? { ok: true, observed: o, details: `${o} (modified key refused before C_Verify)` }
      : {
          ok: false,
          observed: o,
          details: `${o} — refused before the signature was checked; the upstream reason (${reason}) is a signature/message change`,
        }
  }
  const o = rvName(r!.rv)
  if (expectValid)
    return {
      ok: r!.rv === CKR_OK,
      observed: o,
      details: r!.rv === CKR_OK ? 'C_Verify → CKR_OK' : `C_Verify → ${o} — expected CKR_OK`,
    }
  const ok = r!.rv === CKR_SIGNATURE_INVALID || (!sigLenOk && r!.rv === CKR_SIGNATURE_LEN_RANGE)
  return {
    ok,
    observed: o,
    details: ok
      ? `C_Verify → ${o} (rejected${sigLenOk ? '' : '; the upstream signature has the wrong length'})`
      : `C_Verify → ${o} — expected CKR_SIGNATURE_INVALID${sigLenOk ? ' (the signature has the exact scheme length)' : ' or CKR_SIGNATURE_LEN_RANGE'}`,
  }
}

interface EcdsaCase {
  tcId: number
  testPassed: boolean
  reason: string
  message: string
  qx: string
  qy: string
  r: string
  s: string
}
interface EcdsaGroup {
  tgId: number
  curve: string
  hashAlg: string
  tests: EcdsaCase[]
}
interface EddsaCase {
  tcId: number
  testPassed: boolean
  reason: string
  message: string
  q: string
  signature: string
}
interface EddsaGroup {
  tgId: number
  curve: string
  preHash: boolean
  tests: EddsaCase[]
}
interface NotExecutedGroup {
  tgId: number
  curve: string
  hashAlg: string
  cases: number
  why: string
}

export async function runEcdsaSigVerAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/ecdsa_sigver_acvp_test.json')).default as unknown as {
    _provenance: Provenance
    testGroups: EcdsaGroup[]
    notExecuted: NotExecutedGroup[]
  }
  const P = f._provenance
  for (const g of f.testGroups) {
    const mechName = ECDSA_MECH_BY_HASH[g.hashAlg]
    const mech = mechName ? WSE_MECH[mechName] : undefined // eslint-disable-line security/detect-object-injection
    const why = unsupportedReason(mechs, mech, mechName ?? `ECDSA/${g.hashAlg}`)
    const n = CURVE_BYTES[g.curve]
    for (const t of g.tests) {
      const id = `ecdsa-sigver-nist-${g.curve}-${g.hashAlg}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `ECDSA ${g.curve} (${eName})`
      const testCase = `SigVer · NIST ECDSA sigVer tg${g.tgId}/tc${t.tcId} · ${g.curve} · ${g.hashAlg} · msg ${t.message.length / 2}B · expect ${t.testPassed ? 'valid' : `invalid (${t.reason})`}`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'sigVer',
        localOperation: 'sigVer',
        parameterSet: g.curve,
        hashAlg: g.hashAlg,
        messageBytes: t.message.length / 2,
        parameters: { curve: g.curve, hashAlg: g.hashAlg },
        expected: t.testPassed ? 'valid' : 'invalid',
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
          const point = new Uint8Array([0x04, ...leftPad(t.qx, n), ...leftPad(t.qy, n)])
          const imp = importPublicRv(M, h, CKK_EC, CURVE_OID[g.curve], point)
          if (imp.rv !== CKR_OK) return sigVerOutcome(t.testPassed, t.reason, true, imp, null)
          const m = rawMech(M, mech!)
          try {
            const sig = new Uint8Array([...leftPad(t.r, n), ...leftPad(t.s, n)])
            return sigVerOutcome(
              t.testPassed,
              t.reason,
              true,
              imp,
              verifyRaw(M, h, m, imp.handle, hexToBytes(t.message), sig)
            )
          } finally {
            m.free()
            destroy(M, h, imp.handle)
          }
        },
      })
    }
  }
  // Upstream groups PKCS#11 v3.2 cannot express: one visible skip per group.
  for (const ne of f.notExecuted) {
    await skipRow(ctx, {
      id: `ecdsa-sigver-nist-skip-${ne.curve}-${ne.hashAlg.replace('/', '-')}-tg${ne.tgId}-${eName}`,
      algorithm: `ECDSA ${ne.curve} (${eName})`,
      testCase: `SigVer · NIST ECDSA sigVer tg${ne.tgId} · ${ne.curve} · ${ne.hashAlg} · ${ne.cases} cases`,
      meta: {
        origin: 'not-executed',
        upstreamOperation: 'sigVer',
        localOperation: 'none',
        parameterSet: ne.curve,
        hashAlg: ne.hashAlg,
        expected: 'not-run',
        tgId: ne.tgId,
        source: srcOf(P),
      },
      why: `PKCS#11 v3.2 defines no CKM_ECDSA_<hash> mechanism for ${ne.hashAlg} · ${srcTag(P)}`,
    })
  }
}

export async function runEddsaSigVerAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/eddsa_sigver_acvp_test.json')).default as unknown as {
    _provenance: Provenance
    testGroups: EddsaGroup[]
  }
  const P = f._provenance
  const why = unsupportedReason(mechs, WSE_MECH.CKM_EDDSA, 'CKM_EDDSA')
  for (const g of f.testGroups) {
    const scheme =
      g.curve === 'ED-25519'
        ? g.preHash
          ? 'Ed25519ph'
          : 'Ed25519'
        : g.preHash
          ? 'Ed448ph'
          : 'Ed448'
    for (const t of g.tests) {
      const id = `eddsa-sigver-nist-${scheme}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `${scheme} (${eName})`
      const testCase = `SigVer · NIST EdDSA sigVer tg${g.tgId}/tc${t.tcId} · ${scheme} (phFlag ${g.preHash ? 'true' : 'false'}) · msg ${t.message.length / 2}B · expect ${t.testPassed ? 'valid' : `invalid (${t.reason})`}`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'sigVer',
        localOperation: 'sigVer',
        parameterSet: g.curve,
        mode: g.preHash ? 'preHash' : 'pure',
        messageBytes: t.message.length / 2,
        contextBytes: 0,
        parameters: { curve: g.curve, preHash: g.preHash },
        expected: t.testPassed ? 'valid' : 'invalid',
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
          const sigLenOk = t.signature.length / 2 === (g.curve === 'ED-25519' ? 64 : 114)
          const imp = importPublicRv(M, h, CKK_EC_EDWARDS, CURVE_OID[g.curve], hexToBytes(t.q))
          if (imp.rv !== CKR_OK) return sigVerOutcome(t.testPassed, t.reason, sigLenOk, imp, null)
          // Ed25519 pure takes no parameter (PKCS#11 v3.2 §6.3.15); every other
          // scheme is selected through CK_EDDSA_PARAMS (phFlag, empty context).
          const pure25519 = g.curve === 'ED-25519' && !g.preHash
          const m = rawMech(
            M,
            WSE_MECH.CKM_EDDSA,
            pure25519 ? null : pEddsa(M, g.preHash, new Uint8Array())
          )
          try {
            return sigVerOutcome(
              t.testPassed,
              t.reason,
              sigLenOk,
              imp,
              verifyRaw(M, h, m, imp.handle, hexToBytes(t.message), hexToBytes(t.signature))
            )
          } finally {
            m.free()
            destroy(M, h, imp.handle)
          }
        },
      })
    }
  }
}
