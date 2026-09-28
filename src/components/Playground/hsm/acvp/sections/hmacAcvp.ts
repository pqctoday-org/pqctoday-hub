// SPDX-License-Identifier: GPL-3.0-only
//
// HMAC key / message / tag-length matrix (remediation plan 2026-09-24, WS-E).
// Per engine, for all 11 HMAC digests both engines advertise:
//
//  1. NIST ACVP-Server HMAC 2.0 AFT cases (shortest/longest key, empty/longest
//     message, shortest/longest truncated MAC): C_Sign with
//     CKM_<hash>_HMAC_GENERAL (CK_MAC_GENERAL_PARAMS = macLen/8) must byte-match
//     the upstream mac, and C_Verify of that mac must return CKR_OK. The row
//     says whether the key length lies inside the engine's advertised
//     C_GetMechanismInfo range (the advertisement is recorded, not enforced).
//  2. Product-authored invalid MACs derived from the longest-MAC NIST case of
//     each digest — never NIST vectors:
//       - last bit flipped → C_Verify must return CKR_SIGNATURE_INVALID;
//       - one byte short of the CK_MAC_GENERAL_PARAMS length → C_Verify must
//         refuse on length (PKCS#11 v3.2 §5.15.2: CKR_SIGNATURE_LEN_RANGE),
//         code pinned per engine.
//
// The pinned upstream samples register macLen 80..160 bits only: no full-length
// tag, so CKM_<hash>_HMAC (non-general) has no NIST case here.
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName, hsm_getMechanismInfo } from '@/wasm/softhsm'
import { CKK_GENERIC_SECRET } from '@/wasm/softhsm/constants'
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
import { pinnedVerdict, type PinnedRv } from './pkcs11Raw'
import {
  WSE_MECH,
  eqHex,
  flipLastBit,
  hexUp,
  importSecretRv,
  pUlong,
  rawMech,
  runRow,
  signRaw,
  skipRow,
  verifyRaw,
  type ClassicalSectionCtx,
  type WseMechName,
} from './classicalRaw'

/** ACVP hashAlg → CKM_<hash>_HMAC_GENERAL (PKCS#11 v3.2 §6.x HMAC mechanisms). */
export const HMAC_GENERAL_BY_HASH: Readonly<Record<string, WseMechName>> = {
  'SHA-1': 'CKM_SHA_1_HMAC_GENERAL',
  'SHA2-224': 'CKM_SHA224_HMAC_GENERAL',
  'SHA2-256': 'CKM_SHA256_HMAC_GENERAL',
  'SHA2-384': 'CKM_SHA384_HMAC_GENERAL',
  'SHA2-512': 'CKM_SHA512_HMAC_GENERAL',
  'SHA2-512/224': 'CKM_SHA512_224_HMAC_GENERAL',
  'SHA2-512/256': 'CKM_SHA512_256_HMAC_GENERAL',
  'SHA3-224': 'CKM_SHA3_224_HMAC_GENERAL',
  'SHA3-256': 'CKM_SHA3_256_HMAC_GENERAL',
  'SHA3-384': 'CKM_SHA3_384_HMAC_GENERAL',
  'SHA3-512': 'CKM_SHA3_512_HMAC_GENERAL',
}

/** C_Verify with a MAC one byte shorter than CK_MAC_GENERAL_PARAMS says. */
export const HMAC_SHORT_MAC_PIN: PinnedRv = {
  cpp: 'CKR_SIGNATURE_LEN_RANGE',
  rust: 'CKR_SIGNATURE_LEN_RANGE',
  listed: ['CKR_SIGNATURE_LEN_RANGE', 'CKR_SIGNATURE_INVALID'],
  section: '§5.15.2 (C_Verify)',
}

export const hashSlug = (h: string) => h.toLowerCase().replace('/', '-')

interface HmacCase {
  tcId: number
  key: string
  keyLen: number
  msg: string
  msgLen: number
  mac: string
  macLen: number
}
interface HmacGroup {
  tgId: number
  algorithm: string
  revision: string
  hashAlg: string
  source_path: string
  source_sha256: string
  tests: HmacCase[]
}
interface HmacFile {
  _provenance: Provenance
  testGroups: HmacGroup[]
}

export async function runHmacAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs, slot } = ctx
  const f = (await import('@/data/acvp/hmac_acvp_matrix_test.json')).default as unknown as HmacFile

  for (const g of f.testGroups) {
    // Each group was copied from its own upstream file (one per digest).
    const P: Provenance = {
      ...f._provenance,
      source_path: g.source_path,
      source_sha256: g.source_sha256,
    }
    const mechName = HMAC_GENERAL_BY_HASH[g.hashAlg]
    const mech = mechName ? WSE_MECH[mechName] : undefined // eslint-disable-line security/detect-object-injection
    const why = unsupportedReason(mechs, mech, mechName ?? `HMAC-${g.hashAlg}`)
    const info = mech !== undefined ? hsm_getMechanismInfo(M, slot, mech) : null
    const slug = hashSlug(g.hashAlg)
    const algorithm = `HMAC-${g.hashAlg} (${eName})`

    const withKey = <T>(key: Uint8Array, fn: (k: number) => T): T | string => {
      const k = importSecretRv(M, h, CKK_GENERIC_SECRET, key, { sign: true, verify: true })
      if (k.rv !== CKR_OK) return `C_CreateObject(generic secret) → ${rvName(k.rv)}`
      try {
        return fn(k.handle)
      } finally {
        destroy(M, h, k.handle)
      }
    }

    // ── 1. NIST AFT: generate byte-match + verify ─────────────────────────
    for (const t of g.tests) {
      const id = `hmac-nist-${slug}-tc${t.tcId}-${eName}`
      const keyBytes = t.keyLen / 8
      const inRange = info ? keyBytes >= info.ulMinKeySize && keyBytes <= info.ulMaxKeySize : null
      const testCase = `MAC generate + verify · NIST ${g.algorithm} tc${t.tcId} · key ${keyBytes}B · msg ${t.msgLen / 8}B · MAC ${t.macLen} bits (truncated) · expect byte-match`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'mac-generate',
        localOperation: 'mac-generate',
        parameterSet: g.hashAlg,
        hashAlg: g.hashAlg,
        messageBytes: t.msgLen / 8,
        parameters: {
          keyLen: t.keyLen,
          msgLen: t.msgLen,
          macLen: t.macLen,
          ...(inRange === null ? {} : { keyInAdvertisedRange: inRange }),
        },
        expected: 'byte-match',
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(P),
      }
      if (why) {
        await skipRow(ctx, { id, algorithm, testCase, meta, why })
        continue
      }
      const range = info
        ? `key ${keyBytes}B ${inRange ? 'inside' : 'OUTSIDE'} the advertised ulMinKeySize..ulMaxKeySize ${info.ulMinKeySize}..${info.ulMaxKeySize}`
        : 'C_GetMechanismInfo unavailable'
      await runRow(ctx, {
        id,
        algorithm,
        testCase,
        meta,
        source: srcTag(P),
        exec: () => {
          const r = withKey(hexToBytes(t.key), (k) => {
            const m = rawMech(M, mech!, pUlong(M, t.macLen / 8))
            try {
              const s = signRaw(M, h, m, k, hexToBytes(t.msg))
              if (!s.out) return { ok: false, observed: `${s.step} → ${rvName(s.rv)}` }
              if (!eqHex(s.out, t.mac))
                return { ok: false, observed: `mac ${hexUp(s.out)} ≠ expected ${t.mac}` }
              const v = verifyRaw(M, h, m, k, hexToBytes(t.msg), hexToBytes(t.mac))
              if (v.rv !== CKR_OK)
                return { ok: false, observed: `byte-equal; C_Verify → ${rvName(v.rv)}` }
              return { ok: true, observed: 'byte-equal; verify CKR_OK' }
            } finally {
              m.free()
            }
          })
          if (typeof r === 'string') return { ok: false, observed: r, details: `${r} · ${range}` }
          return {
            ok: r.ok,
            observed: r.observed,
            details: `${r.ok ? `MAC[${t.macLen / 8}B] byte-equal to NIST expected; C_Verify CKR_OK` : r.observed} · ${range}`,
          }
        },
      })
    }

    // ── 2. Product-authored invalid MACs (longest-MAC NIST case) ─────────
    const base = [...g.tests].sort((a, b) => b.macLen - a.macLen || a.tcId - b.tcId)[0]
    if (!base || why) continue
    const baseMeta = {
      upstreamOperation: 'mac-generate' as const,
      localOperation: 'mac-verify' as const,
      parameterSet: g.hashAlg,
      hashAlg: g.hashAlg,
      messageBytes: base.msgLen / 8,
      tgId: g.tgId,
      tcId: base.tcId,
      source: srcOf(P),
    }
    for (const kind of ['flip', 'short'] as const) {
      const id = `hmac-probe-${kind}-${slug}-${eName}`
      const testCase =
        kind === 'flip'
          ? `Invalid MAC · product-authored mutation of NIST tc${base.tcId} · last bit flipped (${base.macLen} bits) · expect CKR_SIGNATURE_INVALID`
          : `Invalid MAC · product-authored mutation of NIST tc${base.tcId} · MAC ${base.macLen / 8 - 1}B against a ${base.macLen / 8}B CK_MAC_GENERAL_PARAMS length · expect length refusal`
      const pin = kind === 'short' ? HMAC_SHORT_MAC_PIN : null
      await runRow(ctx, {
        id,
        algorithm,
        testCase,
        meta: {
          ...baseMeta,
          origin: 'product-authored-mutation',
          parameters: {
            macLen: base.macLen,
            mutation: kind === 'flip' ? 'bit-flip' : 'truncated-by-1-byte',
          },
          expected: kind === 'flip' ? 'invalid' : 'return-code',
          expectedRv:
            kind === 'flip'
              ? 'CKR_SIGNATURE_INVALID'
              : eName === 'C++'
                ? HMAC_SHORT_MAC_PIN.cpp
                : HMAC_SHORT_MAC_PIN.rust,
          expectedReason: kind === 'flip' ? 'modified MAC' : 'MAC shorter than ulMacLength',
        },
        source: `key/message from ${srcTag(P)} tc${base.tcId} · PQC Today-authored mutation, not a NIST vector`,
        exec: () => {
          const mac = hexToBytes(base.mac)
          const bad = kind === 'flip' ? flipLastBit(mac) : mac.slice(0, mac.length - 1)
          const r = withKey(hexToBytes(base.key), (k) => {
            const m = rawMech(M, mech!, pUlong(M, base.macLen / 8))
            try {
              return verifyRaw(M, h, m, k, hexToBytes(base.msg), bad)
            } finally {
              m.free()
            }
          })
          if (typeof r === 'string') return { ok: false, observed: r, details: r }
          const observed = rvName(r.initRv !== CKR_OK ? r.initRv : r.rv)
          if (!pin) {
            const ok = r.initRv === CKR_OK && r.rv === CKR_SIGNATURE_INVALID
            return {
              ok,
              observed,
              details: `C_Verify → ${observed}${ok ? ' (bit-flipped MAC rejected)' : ' — expected CKR_SIGNATURE_INVALID'}`,
            }
          }
          const v = pinnedVerdict(pin, eName, observed)
          return { ok: v.ok && r.initRv === CKR_OK, observed, details: v.details }
        },
      })
    }
  }
}
