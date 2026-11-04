// SPDX-License-Identifier: AGPL-3.0-only
//
// PBKDF2 and KMAC-128 from NIST ACVP-Server reference samples (remediation
// plan 2026-09-24, WS-E), per engine:
//
//  - PBKDF 1.0 (PBKDF2, HMAC-SHA2-224 PRF — the pinned sample's only PRF):
//    C_DeriveKey(CKM_PKCS5_PBKD2) into a generic secret of keyLen/8 bytes, its
//    CKA_VALUE byte-compared to derivedKey. One case uses 1 iteration: the Rust
//    engine refuses fewer than 1000 by policy (open gap
//    pbkdf2-min-iterations-divergence), so that Rust row stays red — no NIST
//    expected value was produced;
//  - KMAC-128 1.0 MVT (non-XOF, hex customization): the only byte-aligned cases
//    in the sample, verified with the vendor CKM_KMAC_128 and its customization
//    / output-length parameter block, AND again with the PKCS#11 v3.3 working
//    draft's CKM_KMAC128 and CK_KMAC_PARAMS (rows marked "draft"; present only on an
//    engine build that advertises the mechanism, see the note where they are skipped);
//    CKR_OK / CKR_SIGNATURE_INVALID per the upstream testPassed.
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName, hsm_pbkdf2, Pkcs11Error } from '@/wasm/softhsm'
import { CKK_GENERIC_SECRET } from '@/wasm/softhsm/constants'
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
import {
  hexUp,
  importSecretRv,
  rawMech,
  runRow,
  skipRow,
  verifyRaw,
  type ClassicalSectionCtx,
  type ParamBlock,
  type RowOutcome,
} from './classicalRaw'

const CKM_PKCS5_PBKD2 = 0x3b0
const CKP_PKCS5_PBKD2_HMAC_SHA224 = 0x3
/** Vendor-defined (pqctoday-hsm), not PKCS#11 v3.2. */
const CKM_KMAC_128 = 0x80000100
/**
 * The committee's number for KMAC128: PKCS#11 v3.3 working draft (kmac.md;
 * header c55388c; `approved` in the TC identifier database). Not in the v3.2
 * standard, and not yet in every engine build.
 */
const CKM_KMAC128 = 0x0000001e

/** CK_PQCTODAY_KMAC_PARAMS {pCustomization, ulCustomizationLen, ulOutputLen}. */
function pKmac(M: SoftHSMModule, customization: Uint8Array, outputLen: number): ParamBlock {
  const allocs: number[] = []
  let cp = 0
  if (customization.length > 0) {
    cp = M._malloc(customization.length)
    M.HEAPU8.set(customization, cp)
    allocs.push(cp)
  }
  const ptr = M._malloc(12)
  allocs.push(ptr)
  M.setValue(ptr, cp, 'i32')
  M.setValue(ptr + 4, customization.length, 'i32')
  M.setValue(ptr + 8, outputLen, 'i32')
  return { ptr, len: 12, allocs }
}

/**
 * CK_KMAC_PARAMS of the v3.3 working draft: {hKey, ulMacLength,
 * pCustomizationString, ulCustomizationStringLen}. The key handle comes first and
 * the output length before the customization string, unlike the vendor block
 * above. 16 bytes on wasm32.
 */
export function pKmacDraft(
  M: SoftHSMModule,
  hKey: number,
  customization: Uint8Array,
  macLength: number
): ParamBlock {
  const allocs: number[] = []
  let cp = 0
  if (customization.length > 0) {
    cp = M._malloc(customization.length)
    M.HEAPU8.set(customization, cp)
    allocs.push(cp)
  }
  const ptr = M._malloc(16)
  allocs.push(ptr)
  M.setValue(ptr, hKey, 'i32')
  M.setValue(ptr + 4, macLength, 'i32')
  M.setValue(ptr + 8, cp, 'i32')
  M.setValue(ptr + 12, customization.length, 'i32')
  return { ptr, len: 16, allocs }
}

interface PbkdfCase {
  tcId: number
  iterationCount: number
  keyLen: number
  password: string
  salt: string
  derivedKey: string
}
interface KmacCase {
  tcId: number
  testPassed: boolean
  key: string
  keyLen: number
  msg: string
  msgLen: number
  mac: string
  macLen: number
  customizationHex: string
}

export async function runPbkdf2AcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/pbkdf2_acvp_test.json')).default as unknown as {
    _provenance: Provenance
    testGroups: { tgId: number; hmacAlg: string; tests: PbkdfCase[] }[]
  }
  const P = f._provenance
  const why = unsupportedReason(mechs, CKM_PKCS5_PBKD2, 'CKM_PKCS5_PBKD2')
  for (const g of f.testGroups) {
    for (const t of g.tests) {
      const id = `pbkdf2-nist-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `PBKDF2-HMAC-${g.hmacAlg} (${eName})`
      const testCase = `Derive · NIST PBKDF tg${g.tgId}/tc${t.tcId} · ${t.iterationCount} iteration(s) · password ${t.password.length}B · salt ${t.salt.length / 2}B · dk ${t.keyLen / 8}B · expect byte-match`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'none',
        localOperation: 'key-import',
        parameterSet: `PBKDF2-${g.hmacAlg}`,
        hashAlg: g.hmacAlg,
        parameters: { iterationCount: t.iterationCount, keyLen: t.keyLen },
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
        exec: (compare): RowOutcome => {
          const handle = { current: 0 }
          try {
            const dk = hsm_pbkdf2(
              M,
              h,
              new TextEncoder().encode(t.password),
              hexToBytes(t.salt),
              t.iterationCount,
              t.keyLen / 8,
              CKP_PKCS5_PBKD2_HMAC_SHA224,
              handle
            )
            const out = new Uint8Array(dk)
            const ok = compare(out, t.derivedKey, 'derived test key')
            return {
              ok,
              observed: ok ? 'byte-equal' : `dk ${hexUp(out)}`,
              details: ok
                ? `derived key [${out.length}B] byte-equal to NIST expected`
                : `derived key mismatch: got ${hexUp(out)}, expected ${t.derivedKey}`,
            }
          } catch (e: unknown) {
            const o =
              e instanceof Pkcs11Error
                ? `C_DeriveKey → ${rvName(e.rv)}`
                : e instanceof Error
                  ? e.message
                  : String(e)
            const policy =
              t.iterationCount < 1000
                ? ' — no NIST expected value produced (iterations < 1000: see open gap pbkdf2-min-iterations-divergence)'
                : ''
            return { ok: false, observed: o, details: `${o}${policy}` }
          } finally {
            destroy(M, h, handle.current)
          }
        },
      })
    }
  }
}

export async function runKmacAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/kmac_acvp_test.json')).default as unknown as {
    _provenance: Provenance
    testGroups: { tgId: number; testType: string; tests: KmacCase[] }[]
  }
  const P = f._provenance
  // The same NIST cases, run under both numbers (show the way that
  // works today and the v3.3 draft's way side by side). The vendor rows keep the
  // ids and text they always had; the draft rows add `draft-` and say so.
  const variants = [
    {
      draft: false,
      mech: CKM_KMAC_128,
      why: unsupportedReason(mechs, CKM_KMAC_128, 'vendor CKM_KMAC_128'),
      idPart: '',
      label: 'KMAC-128',
      numberText: '',
    },
    {
      draft: true,
      mech: CKM_KMAC128,
      // An engine build without the committee's number gets no draft rows (see below).
      why: unsupportedReason(mechs, CKM_KMAC128, 'v3.3 draft CKM_KMAC128 (not in this engine yet)'),
      idPart: 'draft-',
      label: 'KMAC-128 (v3.3 draft number)',
      numberText: ' · CKM_KMAC128 + CK_KMAC_PARAMS',
    },
  ]
  for (const v of variants) {
    for (const g of f.testGroups) {
      for (const t of g.tests) {
        const id = `kmac128-nist-${v.idPart}tg${g.tgId}-tc${t.tcId}-${eName}`
        const algorithm = `${v.label} (${eName})`
        const testCase = `MAC verify · NIST KMAC-128 ${g.testType} tg${g.tgId}/tc${t.tcId} · key ${t.keyLen / 8}B · msg ${t.msgLen / 8}B · MAC ${t.macLen / 8}B · customization ${t.customizationHex.length / 2}B · expect ${t.testPassed ? 'valid' : 'invalid'}${v.numberText}`
        const meta: AcvpCaseMeta = {
          origin: 'nist-acvp-server',
          upstreamOperation: 'mac-verify',
          localOperation: 'mac-verify',
          parameterSet: 'KMAC-128',
          messageBytes: t.msgLen / 8,
          parameters: {
            keyLen: t.keyLen,
            macLen: t.macLen,
            customizationBytes: t.customizationHex.length / 2,
          },
          expected: t.testPassed ? 'valid' : 'invalid',
          tgId: g.tgId,
          tcId: t.tcId,
          source: srcOf(P),
        }
        if (v.why) {
          // The committee-number rows exist only on an engine that advertises
          // CKM_KMAC128. They are not emitted as skipped placeholders: the coverage
          // registry lists a row only for a mechanism a shipped engine has. When an
          // engine build with the committee's KMAC numbers ships, register these ids
          // (kmac128-nist-draft-<tg>-<tc>-{engine}) and regenerate the evidence.
          if (v.draft) continue
          await skipRow(ctx, { id, algorithm, testCase, meta, why: v.why })
          continue
        }
        await runRow(ctx, {
          id,
          algorithm,
          testCase,
          meta,
          source: srcTag(P),
          exec: (): RowOutcome => {
            const k = importSecretRv(M, h, CKK_GENERIC_SECRET, hexToBytes(t.key), {
              sign: true,
              verify: true,
            })
            if (k.rv !== CKR_OK) {
              const o = `C_CreateObject(key) → ${rvName(k.rv)}`
              return { ok: false, observed: o, details: o }
            }
            const custom = hexToBytes(t.customizationHex)
            const m = rawMech(
              M,
              v.mech,
              v.draft
                ? pKmacDraft(M, k.handle, custom, t.macLen / 8)
                : pKmac(M, custom, t.macLen / 8)
            )
            try {
              const r = verifyRaw(M, h, m, k.handle, hexToBytes(t.msg), hexToBytes(t.mac))
              const o = rvName(r.initRv !== CKR_OK ? r.initRv : r.rv)
              const ok =
                r.initRv === CKR_OK &&
                (t.testPassed ? r.rv === CKR_OK : r.rv === CKR_SIGNATURE_INVALID)
              return {
                ok,
                observed: o,
                details: ok
                  ? `C_Verify → ${o}${t.testPassed ? '' : ' (rejected)'}`
                  : `${r.initRv !== CKR_OK ? 'C_VerifyInit' : 'C_Verify'} → ${o} — expected ${t.testPassed ? 'CKR_OK' : 'CKR_SIGNATURE_INVALID'}`,
              }
            } finally {
              m.free()
              destroy(M, h, k.handle)
            }
          },
        })
      }
    }
  }
}
