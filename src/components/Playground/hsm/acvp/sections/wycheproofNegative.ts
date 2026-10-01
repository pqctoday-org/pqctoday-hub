// SPDX-License-Identifier: GPL-3.0-only
//
// PROJECT WYCHEPROOF adversarial test vectors, maintained by GOOGLE / C2SP.
// Source: https://github.com/C2SP/wycheproof (Apache-2.0, see
// src/data/acvp/WYCHEPROOF-LICENSE.txt). Pinned commit 3fa63dd0.
//
// WHY THESE EXIST HERE
// --------------------
// The rest of this suite is almost entirely positive derivation: given correct
// input, is the output correct. An engine that computes correctly but ACCEPTS a
// malformed key or a forged signature passes all of it. NIST publishes nothing
// for most of those reject paths (the ACVP key-disposition enums are closed at
// three values with no order member, and KAS-ECC puts key assurance "outside the
// scope of ACVP testing"). Wycheproof is the only broad public source.
//
// EVIDENCE CLASS — independent-oracle, NEVER published-standard-kat.
// Google/C2SP is not a standards body and no standard prints these values. The
// only claim a passing row supports is "agrees with Project Wycheproof <commit>
// for this case". Every row's visible source tag is built by `wycTag()` below so
// a reader can see the evidence is Google's, not NIST's.
//
// RESULT POLICY (upstream `result`, asserted exactly as upstream defines it)
//   valid       → the engine must succeed AND byte-match the upstream output.
//   invalid     → the engine must REFUSE. Accepting it is a discrepancy row.
//   acceptable  → upstream states either outcome is defensible, so the row
//                 asserts the honest disjunction: refuse, OR produce exactly the
//                 upstream value. A THIRD answer (a different shared secret, a
//                 different plaintext) is a real defect and fails. No case is
//                 skipped and no assertion is weakened to get green.
import { hexToBytes } from '@/utils/dataInputUtils'
import { buildECDH1DeriveParams, hsm_importRSAPublicKey, Pkcs11Error, rvName } from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  CKA_CLASS,
  CKA_EXTRACTABLE,
  CKA_KEY_TYPE,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_TOKEN,
  CKA_VALUE,
  CKK_AES,
  CKK_GENERIC_SECRET,
  CKO_SECRET_KEY,
  EC_OID_X25519,
} from '@/wasm/softhsm/constants'
import {
  destroy,
  srcOf,
  unsupportedReason,
  CKR_OK,
  type AcvpCaseMeta,
  type Provenance,
} from './mldsaAcvp'
import { createObjectRv, withTemplate } from './pkcs11Raw'
import {
  WSE_CK,
  WSE_MECH,
  eqHex,
  hexUp,
  importSecretRv,
  pPss,
  rawMech,
  runRow,
  skipRow,
  unwrapRv,
  valueOf,
  verifyRaw,
  type ClassicalSectionCtx,
  type RowOutcome,
} from './classicalRaw'
import { CURVE_OID, importPublicRv } from './ecSigVerAcvp'

/** OID of id-X448 (RFC 8410 §3); EC_OID_X25519 is already in constants.ts. */
const EC_OID_X448 = new Uint8Array([0x06, 0x03, 0x2b, 0x65, 0x6f])
const CKK_EC_MONTGOMERY = 0x41

/**
 * The attribution the user required on every Wycheproof-sourced claim. Kept as
 * one exported string so the section, the manifest citation and the tests
 * cannot drift into three different wordings.
 */
export const WYCHEPROOF_ATTRIBUTION =
  'Project Wycheproof, maintained by Google / C2SP — https://github.com/C2SP/wycheproof (Apache-2.0)'

/**
 * Visible per-row source tag, e.g.
 * "Wycheproof(Google/C2SP)@3fa63dd0 x25519_test.json".
 * Deliberately NOT srcTag() from mldsaAcvp: that one prints "ACVP-Server@…",
 * which would present Google's vectors as NIST's.
 */
export const wycTag = (p: Provenance): string =>
  `Wycheproof(Google/C2SP)@${p.source_commit.slice(0, 8)} ${p.source_path.split('/').pop()}`

export type WycResult = 'valid' | 'invalid' | 'acceptable'

/** Upstream `result` → the `expected` value the row records. */
export const expectedFor = (r: WycResult): AcvpCaseMeta['expected'] =>
  r === 'valid' ? 'byte-match' : r === 'invalid' ? 'rejected' : 'refuse-or-match'

export const flagsOf = (t: { flags?: string[] }) => (t.flags ?? []).join(',') || 'none'

/**
 * The shared verdict for a case whose engine call either refused (`rv`) or
 * produced `got`, against the upstream expectation.
 */
export function verdict(
  result: WycResult,
  refusedAs: string | null,
  got: Uint8Array | null,
  wantHex: string,
  what: string
): RowOutcome {
  if (refusedAs) {
    if (result === 'valid')
      return {
        ok: false,
        observed: refusedAs,
        details: `${refusedAs} — REFUSED a case Wycheproof marks valid`,
      }
    return {
      ok: true,
      observed: refusedAs,
      details: `refused (${refusedAs}); upstream result=${result}`,
    }
  }
  const match = eqHex(got, wantHex)
  if (result === 'invalid')
    return {
      ok: false,
      observed: match ? `accepted, ${what} byte-equal` : `accepted, ${what} ${hexUp(got!)}`,
      details:
        `ACCEPTED a case Wycheproof marks invalid — the engine performed the operation and returned ` +
        `${what}=${hexUp(got!)}; it must refuse`,
    }
  if (match)
    return {
      ok: true,
      observed: 'byte-equal',
      details: `${what}[${got!.length}B] byte-equal to the Wycheproof value; upstream result=${result}`,
    }
  return {
    ok: false,
    observed: `${what} ${hexUp(got!)}`,
    details:
      result === 'acceptable'
        ? `neither refused nor byte-equal: got ${what}=${hexUp(got!)}, Wycheproof value ${wantHex} — an 'acceptable' case permits refusing or the upstream value, not a third answer`
        : `mismatch: got ${what}=${hexUp(got!)}, expected ${wantHex}`,
  }
}

// ── XDH (x25519 / x448) ──────────────────────────────────────────────────────

interface XdhTest {
  tcId: number
  comment: string
  flags?: string[]
  public: string
  private: string
  shared: string
  result: WycResult
}
interface XdhGroup {
  curve: string
  tests: XdhTest[]
}
export interface WycFile<G> {
  _provenance: Provenance
  testGroups: G[]
}

/** C_CreateObject of a raw Montgomery private key → { rv, handle }. */
function importMontgomeryPrivate(
  M: SoftHSMModule,
  h: number,
  oid: Uint8Array,
  scalar: Uint8Array
): { rv: number; handle: number } {
  return createObjectRv(
    M,
    h,
    [
      { type: CKA_CLASS, ulongVal: WSE_CK.CKO_PRIVATE_KEY },
      { type: CKA_KEY_TYPE, ulongVal: CKK_EC_MONTGOMERY },
      { type: CKA_TOKEN, boolVal: false },
      { type: CKA_PRIVATE, boolVal: true },
      { type: CKA_SENSITIVE, boolVal: false },
      { type: CKA_EXTRACTABLE, boolVal: true },
      { type: WSE_CK.CKA_DERIVE, boolVal: true },
    ],
    [
      { type: WSE_CK.CKA_EC_PARAMS, bytes: oid },
      { type: CKA_VALUE, bytes: scalar },
    ]
  )
}

/** C_DeriveKey(CKM_ECDH1_DERIVE) with a raw peer value → { rv, handle }. */
function ecdhDeriveRv(
  M: SoftHSMModule,
  h: number,
  priv: number,
  peer: Uint8Array,
  valueLen: number
): { rv: number; handle: number } {
  const dp = buildECDH1DeriveParams(M, peer)
  const m = rawMech(M, WSE_MECH.CKM_ECDH1_DERIVE, {
    ptr: dp.ptr,
    len: dp.len,
    allocs: dp.allocPtrs,
  })
  const hPtr = M._malloc(4)
  M.setValue(hPtr, 0, 'i32')
  try {
    const rv = withTemplate(
      M,
      [
        { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
        { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
        { type: CKA_TOKEN, boolVal: false },
        { type: CKA_SENSITIVE, boolVal: false },
        { type: CKA_EXTRACTABLE, boolVal: true },
        { type: WSE_CK.CKA_VALUE_LEN, ulongVal: valueLen },
      ],
      [],
      (tpl, n) => M._C_DeriveKey(h, m.ptr, priv, tpl, n, hPtr) >>> 0
    )
    return { rv, handle: rv === CKR_OK ? M.getValue(hPtr, 'i32') >>> 0 : 0 }
  } finally {
    m.free()
    M._free(hPtr)
  }
}

const XDH_FILES = [
  { key: 'x25519', oid: EC_OID_X25519, len: 32, curve: 'X25519' },
  { key: 'x448', oid: EC_OID_X448, len: 56, curve: 'X448' },
] as const

export async function runWycheproofXdhSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const [m25519, m448] = await Promise.all([
    import('@/data/acvp/wycheproof_x25519_test.json'),
    import('@/data/acvp/wycheproof_x448_test.json'),
  ])
  const mods = [m25519.default, m448.default]
  const why = unsupportedReason(mechs, WSE_MECH.CKM_ECDH1_DERIVE, 'CKM_ECDH1_DERIVE')
  for (let i = 0; i < XDH_FILES.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const spec = XDH_FILES[i]
    // eslint-disable-next-line security/detect-object-injection
    const file = mods[i] as unknown as WycFile<XdhGroup>
    const P = file._provenance
    for (let gi = 0; gi < file.testGroups.length; gi++) {
      // eslint-disable-next-line security/detect-object-injection
      const g = file.testGroups[gi]
      for (const t of g.tests) {
        const id = `wyc-${spec.key}-tg${gi + 1}-tc${t.tcId}-${eName}`
        const algorithm = `${spec.curve} ECDH — Wycheproof (${eName})`
        const testCase =
          `Derive · Wycheproof ${spec.key}_test tg${gi + 1}/tc${t.tcId} · ${spec.curve} · ` +
          `flags ${flagsOf(t)} · ${t.comment || 'no comment'} · expect ` +
          (t.result === 'valid'
            ? 'shared byte-match'
            : t.result === 'invalid'
              ? 'C_DeriveKey refused'
              : "refusal OR the upstream shared value ('acceptable')")
        const meta: AcvpCaseMeta = {
          origin: 'third-party-oracle',
          upstreamOperation: 'derive',
          localOperation: 'derive',
          parameterSet: spec.curve,
          parameters: { curve: spec.curve, wycheproofResult: t.result, flags: flagsOf(t) },
          expected: expectedFor(t.result),
          expectedReason: t.comment || flagsOf(t),
          tgId: gi + 1,
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
          source: wycTag(P),
          exec: () => {
            const priv = importMontgomeryPrivate(M, h, spec.oid, hexToBytes(t.private))
            if (priv.rv !== CKR_OK)
              return verdict(
                t.result,
                `C_CreateObject(private) → ${rvName(priv.rv)}`,
                null,
                t.shared,
                'shared'
              )
            let derived = 0
            try {
              const d = ecdhDeriveRv(M, h, priv.handle, hexToBytes(t.public), spec.len)
              derived = d.handle
              if (d.rv !== CKR_OK)
                return verdict(t.result, `C_DeriveKey → ${rvName(d.rv)}`, null, t.shared, 'shared')
              return verdict(t.result, null, valueOf(M, h, derived), t.shared, 'shared')
            } finally {
              destroy(M, h, derived)
              destroy(M, h, priv.handle)
            }
          },
        })
      }
    }
  }
}

// ── EdDSA verify (ed25519 / ed448) ───────────────────────────────────────────

interface EdTest {
  tcId: number
  comment: string
  flags?: string[]
  msg: string
  sig: string
  result: WycResult
}
interface EdGroup {
  publicKey: { curve: string; pk: string }
  tests: EdTest[]
}

const ED_FILES = [
  { key: 'ed25519', oidName: 'ED-25519', curve: 'Ed25519' },
  { key: 'ed448', oidName: 'ED-448', curve: 'Ed448' },
] as const

export async function runWycheproofEddsaSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const [m25519, m448] = await Promise.all([
    import('@/data/acvp/wycheproof_ed25519_test.json'),
    import('@/data/acvp/wycheproof_ed448_test.json'),
  ])
  const mods = [m25519.default, m448.default]
  const why = unsupportedReason(mechs, WSE_MECH.CKM_EDDSA, 'CKM_EDDSA')
  for (let i = 0; i < ED_FILES.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const spec = ED_FILES[i]
    // eslint-disable-next-line security/detect-object-injection
    const file = mods[i] as unknown as WycFile<EdGroup>
    const P = file._provenance

    const oid = CURVE_OID[spec.oidName]
    for (let gi = 0; gi < file.testGroups.length; gi++) {
      // eslint-disable-next-line security/detect-object-injection
      const g = file.testGroups[gi]
      for (const t of g.tests) {
        const id = `wyc-${spec.key}-tg${gi + 1}-tc${t.tcId}-${eName}`
        const algorithm = `${spec.curve} EdDSA — Wycheproof (${eName})`
        const testCase =
          `Verify · Wycheproof ${spec.key}_test tg${gi + 1}/tc${t.tcId} · ${spec.curve} · ` +
          `msg ${t.msg.length / 2}B · flags ${flagsOf(t)} · ${t.comment || 'no comment'} · expect ` +
          (t.result === 'valid'
            ? 'CKR_OK'
            : t.result === 'invalid'
              ? 'C_Verify refused (signature must not verify)'
              : "refusal OR CKR_OK ('acceptable')")
        const meta: AcvpCaseMeta = {
          origin: 'third-party-oracle',
          upstreamOperation: 'sigVer',
          localOperation: 'sigVer',
          parameterSet: spec.curve,
          messageBytes: t.msg.length / 2,
          parameters: { curve: spec.curve, wycheproofResult: t.result, flags: flagsOf(t) },
          expected: expectedFor(t.result),
          expectedReason: t.comment || flagsOf(t),
          tgId: gi + 1,
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
          source: wycTag(P),
          exec: () => {
            const pub = importPublicRv(M, h, WSE_CK.CKK_EC_EDWARDS, oid, hexToBytes(g.publicKey.pk))
            if (pub.rv !== CKR_OK) {
              const o = `C_CreateObject(pk) → ${rvName(pub.rv)}`
              return t.result === 'valid'
                ? { ok: false, observed: o, details: `${o} — REFUSED a key Wycheproof marks valid` }
                : { ok: true, observed: o, details: `${o}; upstream result=${t.result}` }
            }
            const m = rawMech(M, WSE_MECH.CKM_EDDSA)
            try {
              const msg = hexToBytes(t.msg)
              const sig = hexToBytes(t.sig)
              const dp = M._malloc(Math.max(1, msg.length))
              M.HEAPU8.set(msg, dp)
              const sp = M._malloc(Math.max(1, sig.length))
              M.HEAPU8.set(sig, sp)
              let rv: number
              let at = 'C_VerifyInit'
              try {
                rv = M._C_VerifyInit(h, m.ptr, pub.handle) >>> 0
                if (rv === CKR_OK) {
                  at = 'C_Verify'
                  rv = M._C_Verify(h, dp, msg.length, sp, sig.length) >>> 0
                }
              } finally {
                M._free(dp)
                M._free(sp)
              }
              const o = `${at} → ${rvName(rv)}`
              if (rv === CKR_OK)
                return t.result === 'invalid'
                  ? {
                      ok: false,
                      observed: o,
                      details: `${o} — VERIFIED a signature Wycheproof marks invalid (${t.comment || flagsOf(t)})`,
                    }
                  : { ok: true, observed: o, details: `${o}; upstream result=${t.result}` }
              return t.result === 'valid'
                ? {
                    ok: false,
                    observed: o,
                    details: `${o} — failed a signature Wycheproof marks valid`,
                  }
                : { ok: true, observed: o, details: `${o} (refused); upstream result=${t.result}` }
            } finally {
              m.free()
              destroy(M, h, pub.handle)
            }
          },
        })
      }
    }
  }
}

// ── AES key wrap (aes_wrap = KW, aes_kwp = KWP) ──────────────────────────────

interface KwTest {
  tcId: number
  comment: string
  flags?: string[]
  key: string
  msg: string
  ct: string
  result: WycResult
}
interface KwGroup {
  keySize: number
  tests: KwTest[]
}

const KW_FILES = [
  { key: 'aeskw', mech: 'CKM_AES_KEY_WRAP', mode: 'KW' },
  { key: 'aeskwp', mech: 'CKM_AES_KEY_WRAP_KWP', mode: 'KWP' },
] as const

export async function runWycheproofKeywrapSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const [mKw, mKwp] = await Promise.all([
    import('@/data/acvp/wycheproof_aes_wrap_test.json'),
    import('@/data/acvp/wycheproof_aes_kwp_test.json'),
  ])
  const mods = [mKw.default, mKwp.default]
  for (let i = 0; i < KW_FILES.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const spec = KW_FILES[i]
    // eslint-disable-next-line security/detect-object-injection
    const file = mods[i] as unknown as WycFile<KwGroup>
    const P = file._provenance
    const mechType = WSE_MECH[spec.mech]
    const why = unsupportedReason(mechs, mechType, spec.mech)
    for (let gi = 0; gi < file.testGroups.length; gi++) {
      // eslint-disable-next-line security/detect-object-injection
      const g = file.testGroups[gi]
      for (const t of g.tests) {
        const id = `wyc-${spec.key}-tg${gi + 1}-tc${t.tcId}-${eName}`
        const algorithm = `AES-${g.keySize}-${spec.mode} — Wycheproof (${eName})`
        const testCase =
          `Unwrap · Wycheproof ${spec.key === 'aeskw' ? 'aes_wrap' : 'aes_kwp'}_test tg${gi + 1}/tc${t.tcId} · ` +
          `AES-${g.keySize} · wrapped ${t.ct.length / 2}B · flags ${flagsOf(t)} · ${t.comment || 'no comment'} · expect ` +
          (t.result === 'valid'
            ? 'unwrapped CKA_VALUE byte-match'
            : t.result === 'invalid'
              ? 'C_UnwrapKey refused'
              : "refusal OR the upstream plaintext ('acceptable')")
        const meta: AcvpCaseMeta = {
          origin: 'third-party-oracle',
          upstreamOperation: 'decrypt',
          localOperation: 'unwrap',
          parameterSet: `AES-${g.keySize}`,
          parameters: {
            mode: spec.mode,
            keyLen: g.keySize,
            wycheproofResult: t.result,
            flags: flagsOf(t),
          },
          expected: expectedFor(t.result),
          expectedReason: t.comment || flagsOf(t),
          tgId: gi + 1,
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
          source: wycTag(P),
          exec: () => {
            const kek = importSecretRv(M, h, CKK_AES, hexToBytes(t.key), {
              wrap: true,
              unwrap: true,
            })
            if (kek.rv !== CKR_OK) {
              const o = `C_CreateObject(KEK) → ${rvName(kek.rv)}`
              return {
                ok: false,
                observed: o,
                details: `${o} — the KEK is a plain AES-${g.keySize} key`,
              }
            }
            const m = rawMech(M, mechType)
            let payload = 0
            try {
              const u = unwrapRv(M, h, m, kek.handle, hexToBytes(t.ct), CKK_GENERIC_SECRET)
              payload = u.handle
              if (u.rv !== CKR_OK)
                return verdict(t.result, `C_UnwrapKey → ${rvName(u.rv)}`, null, t.msg, 'plaintext')
              return verdict(t.result, null, valueOf(M, h, payload), t.msg, 'plaintext')
            } finally {
              m.free()
              destroy(M, h, payload)
              destroy(M, h, kek.handle)
            }
          },
        })
      }
    }
  }
}

// ── RSASSA-PSS verify (rsa_pss_2048_sha256_mgf1_32) ──────────────────────────
//
// Replaces the single Node/OpenSSL-generated case of rsapss_test.json
// (maintainer ruling 2026-09-26; source priority NIST ACVP > Wycheproof >
// published standard > custom). The NIST RSA-SigVer-FIPS186-5 sample has no
// SHA2-256 PSS group (sections/rsaSigVerAcvp.ts runs its SHA3-256 ones), so
// Wycheproof is the highest-priority source for SHA-256 PSS.

interface PssTest {
  tcId: number
  comment: string
  flags?: string[]
  msg: string
  sig: string
  result: WycResult
}
interface PssGroup {
  keySize: number
  sha: string
  mgf: string
  mgfSha: string
  sLen: number
  publicKey: { modulus: string; publicExponent: string }
  tests: PssTest[]
}

/** Group hash → PKCS#11 mechanism, CK_RSA_PKCS_PSS_PARAMS hashAlg and MGF. Only
 *  what a vendored file needs; any other group becomes a skip row, not a guess. */
const PSS_HASH: Record<string, { mech: number; mechName: string; hashAlg: number; mgf: number }> = {
  'SHA-256': {
    mech: WSE_MECH.CKM_SHA256_RSA_PKCS_PSS,
    mechName: 'CKM_SHA256_RSA_PKCS_PSS',
    hashAlg: WSE_MECH.CKM_SHA256,
    mgf: 0x2 /* CKG_MGF1_SHA256 */,
  },
}

/** Wycheproof's modulus is an ASN.1 INTEGER (leading 00 when the top bit is
 *  set); CKA_MODULUS is an unsigned big integer, so the sign byte is dropped. */
const unsignedHex = (hex: string): string => hex.replace(/^(00)+(?=[0-9a-fA-F]{2})/, '')

export async function runWycheproofRsaPssSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const file = (await import('@/data/acvp/wycheproof_rsa_pss_2048_sha256_mgf1_32_test.json'))
    .default as unknown as WycFile<PssGroup>
  const P = file._provenance
  for (let gi = 0; gi < file.testGroups.length; gi++) {
    // eslint-disable-next-line security/detect-object-injection
    const g = file.testGroups[gi]
    const hs = g.mgf === 'MGF1' && g.mgfSha === g.sha ? PSS_HASH[g.sha] : undefined
    const why = hs
      ? unsupportedReason(mechs, hs.mech, hs.mechName)
      : `no PKCS#11 PSS mechanism wired for ${g.sha} with ${g.mgf}-${g.mgfSha}`
    for (const t of g.tests) {
      const id = `wyc-rsapss-tg${gi + 1}-tc${t.tcId}-${eName}`
      const algorithm = `RSA-${g.keySize} PSS ${g.sha} — Wycheproof (${eName})`
      const testCase =
        `Verify · Wycheproof rsa_pss_2048_sha256_mgf1_32_test tg${gi + 1}/tc${t.tcId} · ` +
        `${g.keySize}-bit · ${g.sha} · ${g.mgf}-${g.mgfSha} · sLen ${g.sLen} · msg ${t.msg.length / 2}B · ` +
        `flags ${flagsOf(t)} · ${t.comment || 'no comment'} · expect ` +
        (t.result === 'valid'
          ? 'CKR_OK'
          : t.result === 'invalid'
            ? 'C_Verify refused (signature must not verify)'
            : "refusal OR CKR_OK ('acceptable')")
      const meta: AcvpCaseMeta = {
        origin: 'third-party-oracle',
        upstreamOperation: 'sigVer',
        localOperation: 'sigVer',
        parameterSet: `RSA-${g.keySize}`,
        hashAlg: g.sha,
        messageBytes: t.msg.length / 2,
        parameters: {
          modulo: g.keySize,
          mgf: `${g.mgf}-${g.mgfSha}`,
          saltLen: g.sLen,
          wycheproofResult: t.result,
          flags: flagsOf(t),
        },
        expected: expectedFor(t.result),
        expectedReason: t.comment || flagsOf(t),
        tgId: gi + 1,
        tcId: t.tcId,
        source: srcOf(P),
      }
      if (why || !hs) {
        await skipRow(ctx, { id, algorithm, testCase, meta, why: why ?? 'unsupported' })
        continue
      }
      await runRow(ctx, {
        id,
        algorithm,
        testCase,
        meta,
        source: wycTag(P),
        exec: (): RowOutcome => {
          let pub = 0
          try {
            pub = hsm_importRSAPublicKey(
              M,
              h,
              hexToBytes(unsignedHex(g.publicKey.modulus)),
              hexToBytes(unsignedHex(g.publicKey.publicExponent)),
              false
            )
          } catch (e: unknown) {
            const o =
              e instanceof Pkcs11Error
                ? `C_CreateObject(pk) → ${rvName(e.rv)}`
                : e instanceof Error
                  ? e.message
                  : String(e)
            return { ok: false, observed: o, details: `${o} — REFUSED the Wycheproof public key` }
          }
          const m = rawMech(M, hs.mech, pPss(M, hs.hashAlg, hs.mgf, g.sLen))
          try {
            const r = verifyRaw(M, h, m, pub, hexToBytes(t.msg), hexToBytes(t.sig))
            const at = r.initRv !== CKR_OK ? 'C_VerifyInit' : 'C_Verify'
            const o = `${at} → ${rvName(r.rv)}`
            if (r.rv === CKR_OK)
              return t.result === 'invalid'
                ? {
                    ok: false,
                    observed: o,
                    details: `${o} — VERIFIED a signature Wycheproof marks invalid (${t.comment || flagsOf(t)})`,
                  }
                : { ok: true, observed: o, details: `${o}; upstream result=${t.result}` }
            if (r.initRv !== CKR_OK || t.result === 'valid')
              return {
                ok: false,
                observed: o,
                details:
                  r.initRv !== CKR_OK
                    ? `${o} — the mechanism with these PSS parameters was refused before the signature was checked`
                    : `${o} — failed a signature Wycheproof marks valid`,
              }
            return { ok: true, observed: o, details: `${o} (refused); upstream result=${t.result}` }
          } finally {
            m.free()
            destroy(M, h, pub)
          }
        },
      })
    }
  }
}
