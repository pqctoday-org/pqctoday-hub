// SPDX-License-Identifier: GPL-3.0-only
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
//    / output-length parameter block; CKR_OK / CKR_SIGNATURE_INVALID per the
//    upstream testPassed.
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
  eqHex,
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
        exec: (): RowOutcome => {
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
            const ok = eqHex(out, t.derivedKey)
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
  const why = unsupportedReason(mechs, CKM_KMAC_128, 'vendor CKM_KMAC_128')
  for (const g of f.testGroups) {
    for (const t of g.tests) {
      const id = `kmac128-nist-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `KMAC-128 (${eName})`
      const testCase = `MAC verify · NIST KMAC-128 ${g.testType} tg${g.tgId}/tc${t.tcId} · key ${t.keyLen / 8}B · msg ${t.msgLen / 8}B · MAC ${t.macLen / 8}B · customization ${t.customizationHex.length / 2}B · expect ${t.testPassed ? 'valid' : 'invalid'}`
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
          const k = importSecretRv(M, h, CKK_GENERIC_SECRET, hexToBytes(t.key), {
            sign: true,
            verify: true,
          })
          if (k.rv !== CKR_OK) {
            const o = `C_CreateObject(key) → ${rvName(k.rv)}`
            return { ok: false, observed: o, details: o }
          }
          const m = rawMech(M, CKM_KMAC_128, pKmac(M, hexToBytes(t.customizationHex), t.macLen / 8))
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
