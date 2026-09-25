// SPDX-License-Identifier: GPL-3.0-only
//
// AES-KW / AES-KWP (SP 800-38F) from NIST ACVP-Server reference samples
// (remediation plan 2026-09-24, WS-E), per engine:
//
//  - encrypt: the payload is imported as a generic secret (CKA_VALUE = pt) and
//    wrapped with C_WrapKey(CKM_AES_KEY_WRAP | CKM_AES_KEY_WRAP_KWP, default IV)
//    under the imported KEK — output byte-compared to ct (64-bit aligned KW
//    payloads; one-byte and unaligned KWP payloads);
//  - decrypt, testPassed=true: C_UnwrapKey(ct) into a generic secret whose
//    CKA_VALUE must equal pt;
//  - decrypt, testPassed=false (upstream integrity failures): C_UnwrapKey must
//    refuse and create no object — CK_RV pinned per engine (§5.18.4 lists
//    CKR_WRAPPED_KEY_INVALID).
// Inverse-cipher (KW-AE/KWP-AE with AES^-1) groups are skip rows: no PKCS#11
// mechanism exists for them. The RFC 3394 KAT (section 19) stays as it is.
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName } from '@/wasm/softhsm'
import { CKK_AES, CKK_GENERIC_SECRET } from '@/wasm/softhsm/constants'
import {
  destroy,
  srcOf,
  srcTag,
  unsupportedReason,
  CKR_OK,
  type AcvpCaseMeta,
  type Provenance,
} from './mldsaAcvp'
import { pinnedVerdict, type PinnedRv } from './pkcs11Raw'
import {
  WSE_MECH,
  eqHex,
  hexUp,
  importSecretRv,
  rawMech,
  runRow,
  skipRow,
  unwrapRv,
  valueOf,
  wrapRv,
  type ClassicalSectionCtx,
} from './classicalRaw'

/** C_UnwrapKey refusal for an upstream integrity failure, pinned per engine. */
export const KW_INTEGRITY_FAIL_PIN: PinnedRv = {
  cpp: 'CKR_WRAPPED_KEY_INVALID',
  rust: 'CKR_WRAPPED_KEY_INVALID',
  listed: ['CKR_WRAPPED_KEY_INVALID', 'CKR_WRAPPED_KEY_LEN_RANGE'],
  section: '§5.18.4 (C_UnwrapKey)',
}

interface KwCase {
  tcId: number
  testPassed: boolean
  key: string
  pt: string
  ct: string
}
interface KwGroup {
  tgId: number
  direction: 'encrypt' | 'decrypt'
  keyLen: number
  payloadLen: number
  algorithm: string
  mode: 'KW' | 'KWP'
  source_path: string
  source_sha256: string
  tests: KwCase[]
}
interface KwNotExecuted {
  algorithm: string
  direction: string
  tgIds: number[]
  cases: number
  why: string
}

export async function runAesKwAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/aeskw_acvp_test.json')).default as unknown as {
    _provenance: Provenance
    testGroups: KwGroup[]
    notExecuted: KwNotExecuted[]
  }
  for (const g of f.testGroups) {
    const P: Provenance = {
      ...f._provenance,
      source_path: g.source_path,
      source_sha256: g.source_sha256,
    }
    const mechName = g.mode === 'KW' ? 'CKM_AES_KEY_WRAP' : 'CKM_AES_KEY_WRAP_KWP'
    const mech = WSE_MECH[mechName]
    const why = unsupportedReason(mechs, mech, mechName)
    for (const t of g.tests) {
      const neg = !t.testPassed
      const wrap = g.direction === 'encrypt'
      const id = `aes${g.mode.toLowerCase()}-nist-k${g.keyLen}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `AES-${g.keyLen}-${g.mode} (${eName})`
      const aligned = g.payloadLen % 64 === 0
      const testCase =
        `${wrap ? 'Wrap' : 'Unwrap'} · NIST ${g.algorithm} tg${g.tgId}/tc${t.tcId} · payload ${g.payloadLen / 8}B${aligned ? '' : ' (not 64-bit aligned)'} · ` +
        (wrap
          ? 'expect ct byte-match'
          : neg
            ? 'expect integrity failure (C_UnwrapKey refused)'
            : 'expect unwrapped CKA_VALUE byte-match')
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: g.direction,
        localOperation: wrap ? 'wrap' : 'unwrap',
        parameterSet: `AES-${g.keyLen}`,
        parameters: { mode: g.mode, keyLen: g.keyLen, payloadLen: g.payloadLen },
        expected: neg ? 'invalid' : 'byte-match',
        ...(neg
          ? { expectedRv: eName === 'C++' ? KW_INTEGRITY_FAIL_PIN.cpp : KW_INTEGRITY_FAIL_PIN.rust }
          : {}),
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
          const kek = importSecretRv(M, h, CKK_AES, hexToBytes(t.key), { wrap: true, unwrap: true })
          if (kek.rv !== CKR_OK) {
            const o = `C_CreateObject(KEK) → ${rvName(kek.rv)}`
            return { ok: false, observed: o, details: o }
          }
          const m = rawMech(M, mech)
          let payload = 0
          try {
            if (wrap) {
              const p = importSecretRv(M, h, CKK_GENERIC_SECRET, hexToBytes(t.pt), {})
              if (p.rv !== CKR_OK) {
                const o = `C_CreateObject(payload ${g.payloadLen / 8}B) → ${rvName(p.rv)}`
                return { ok: false, observed: o, details: o }
              }
              payload = p.handle
              const r = wrapRv(M, h, m, kek.handle, payload)
              if (!r.out) {
                const o = `${r.step} → ${rvName(r.rv)}`
                return { ok: false, observed: o, details: o }
              }
              const ok = eqHex(r.out, t.ct)
              return {
                ok,
                observed: ok ? 'byte-equal' : `ct ${hexUp(r.out)}`,
                details: ok
                  ? `wrapped[${r.out.length}B] byte-equal to NIST expected`
                  : `wrap mismatch: got ${hexUp(r.out)}, expected ${t.ct}`,
              }
            }
            const u = unwrapRv(M, h, m, kek.handle, hexToBytes(t.ct), CKK_GENERIC_SECRET)
            payload = u.handle
            if (neg) {
              if (u.rv === CKR_OK) {
                const o = 'CKR_OK (key object created)'
                return {
                  ok: false,
                  observed: o,
                  details: `${o} — the NIST case must fail the integrity check`,
                }
              }
              const observed = rvName(u.rv)
              const v = pinnedVerdict(KW_INTEGRITY_FAIL_PIN, eName, observed)
              return { ok: v.ok, observed, details: `C_UnwrapKey refused · ${v.details}` }
            }
            if (u.rv !== CKR_OK) {
              const o = `C_UnwrapKey → ${rvName(u.rv)}`
              return { ok: false, observed: o, details: `${o} — the NIST case is valid` }
            }
            const value = valueOf(M, h, payload)
            const ok = eqHex(value, t.pt)
            return {
              ok,
              observed: ok ? 'byte-equal' : `value ${hexUp(value)}`,
              details: ok
                ? `unwrapped CKA_VALUE[${value.length}B] byte-equal to NIST expected`
                : `unwrap mismatch: got ${hexUp(value)}, expected ${t.pt}`,
            }
          } finally {
            m.free()
            destroy(M, h, payload)
            destroy(M, h, kek.handle)
          }
        },
      })
    }
  }
  for (const ne of f.notExecuted) {
    const mode = ne.algorithm.endsWith('KWP') ? 'KWP' : 'KW'
    await skipRow(ctx, {
      id: `aes${mode.toLowerCase()}-nist-skip-inverse-${ne.direction}-${eName}`,
      algorithm: `AES-${mode} (${eName})`,
      testCase: `${ne.direction === 'encrypt' ? 'Wrap' : 'Unwrap'} · NIST ${ne.algorithm} inverse-cipher groups (${ne.tgIds.length} groups, ${ne.cases} cases)`,
      meta: {
        origin: 'not-executed',
        upstreamOperation: ne.direction === 'encrypt' ? 'encrypt' : 'decrypt',
        localOperation: 'none',
        parameterSet: `AES-${mode}`,
        expected: 'not-run',
        source: srcOf(f._provenance),
      },
      why: `${mode}-AE with the inverse cipher (kwCipher=inverse) has no PKCS#11 v3.2 mechanism`,
    })
  }
}
