// SPDX-License-Identifier: GPL-3.0-only
//
// AES-GCM NIST ACVP-Server reference samples (remediation plan 2026-09-24,
// WS-E). Every case of the pinned ACVP-AES-GCM-1.0 sample, per engine:
//
//  - encrypt groups: C_Encrypt(CKM_AES_GCM, CK_GCM_PARAMS{iv, aad, ulTagBits})
//    must return ct||tag byte-equal to the upstream values;
//  - decrypt groups, testPassed=true: C_Decrypt(ct||tag) must return pt;
//  - decrypt groups, testPassed=false (upstream authentication failures): the
//    engine must refuse — no plaintext — with the CK_RV pinned per engine.
//    PKCS#11 v3.2 §5.10.2 lists CKR_ENCRYPTED_DATA_INVALID for C_Decrypt;
//    CKR_AEAD_DECRYPT_FAILED is listed only for the message-based API.
//
// The upstream sample registers AES-128, IV 96/120 bits, tag 128/32 bits,
// payload/AAD 0/120 bits. The older aesgcm_test.json (section 1) stays — it is
// an independent-oracle vector, labelled as such.
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName } from '@/wasm/softhsm'
import { CKK_AES, CKM_AES_GCM } from '@/wasm/softhsm/constants'
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
  cryptRv,
  eqHex,
  hexUp,
  importSecretRv,
  pGcm,
  rawMech,
  runRow,
  skipRow,
  type ClassicalSectionCtx,
} from './classicalRaw'

/** C_Decrypt refusal code for an upstream authentication failure, pinned per engine. */
export const GCM_AUTH_FAIL_PIN: PinnedRv = {
  cpp: 'CKR_ENCRYPTED_DATA_INVALID',
  rust: 'CKR_ENCRYPTED_DATA_INVALID',
  listed: ['CKR_ENCRYPTED_DATA_INVALID', 'CKR_ENCRYPTED_DATA_LEN_RANGE'],
  section: '§5.10.2 (C_Decrypt)',
}

interface GcmCase {
  tcId: number
  testPassed: boolean
  key: string
  iv: string
  aad: string
  pt: string
  ct: string
  tag: string
}
interface GcmGroup {
  tgId: number
  direction: 'encrypt' | 'decrypt'
  keyLen: number
  ivLen: number
  tagLen: number
  payloadLen: number
  aadLen: number
  tests: GcmCase[]
}
interface GcmFile {
  _provenance: Provenance
  testGroups: GcmGroup[]
}

export async function runAesGcmAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/aesgcm_acvp_test.json')).default as unknown as GcmFile
  const P = f._provenance
  const why = unsupportedReason(mechs, CKM_AES_GCM, 'CKM_AES_GCM')

  for (const g of f.testGroups) {
    for (const t of g.tests) {
      const neg = g.direction === 'decrypt' && !t.testPassed
      const id = `aesgcm-nist-k${g.keyLen}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `AES-${g.keyLen}-GCM (${eName})`
      const shape = `IV ${g.ivLen}b · tag ${g.tagLen}b · AAD ${g.aadLen}b · PT ${g.payloadLen}b`
      const testCase =
        `${g.direction === 'encrypt' ? 'Encrypt' : 'Decrypt'} · NIST AES-GCM tg${g.tgId}/tc${t.tcId} · ${shape} · ` +
        (g.direction === 'encrypt'
          ? 'expect ct||tag byte-match'
          : t.testPassed
            ? 'expect plaintext byte-match'
            : 'expect authentication failure (rejected)')
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: g.direction,
        localOperation: g.direction,
        parameterSet: `AES-${g.keyLen}`,
        parameters: {
          keyLen: g.keyLen,
          ivLen: g.ivLen,
          tagLen: g.tagLen,
          aadLen: g.aadLen,
          payloadLen: g.payloadLen,
        },
        expected: g.direction === 'encrypt' || t.testPassed ? 'byte-match' : 'invalid',
        ...(neg
          ? { expectedRv: eName === 'C++' ? GCM_AUTH_FAIL_PIN.cpp : GCM_AUTH_FAIL_PIN.rust }
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
          const k = importSecretRv(M, h, CKK_AES, hexToBytes(t.key), {
            encrypt: true,
            decrypt: true,
          })
          if (k.rv !== CKR_OK) {
            const o = `C_CreateObject(AES key) → ${rvName(k.rv)}`
            return { ok: false, observed: o, details: o }
          }
          const mech = rawMech(
            M,
            CKM_AES_GCM,
            pGcm(M, hexToBytes(t.iv), hexToBytes(t.aad), g.tagLen)
          )
          try {
            if (g.direction === 'encrypt') {
              const r = cryptRv(M, h, 'encrypt', mech, k.handle, hexToBytes(t.pt))
              if (!r.out) {
                const o = `${r.step} → ${rvName(r.rv)}`
                return { ok: false, observed: o, details: o }
              }
              const ok = eqHex(r.out, t.ct + t.tag)
              return {
                ok,
                observed: ok ? 'byte-equal' : `ct||tag ${hexUp(r.out)}`,
                details: ok
                  ? `ct||tag [${r.out.length}B] byte-equal to NIST expected`
                  : `ct||tag mismatch: got ${hexUp(r.out)}, expected ${t.ct}${t.tag}`,
              }
            }
            const r = cryptRv(M, h, 'decrypt', mech, k.handle, hexToBytes(t.ct + t.tag))
            if (!neg) {
              if (!r.out) {
                const o = `${r.step} → ${rvName(r.rv)}`
                return { ok: false, observed: o, details: `${o} — NIST case is valid` }
              }
              const ok = eqHex(r.out, t.pt)
              return {
                ok,
                observed: ok ? 'byte-equal' : `pt ${hexUp(r.out)}`,
                details: ok
                  ? `pt [${r.out.length}B] byte-equal to NIST expected`
                  : `plaintext mismatch: got ${hexUp(r.out)}, expected ${t.pt}`,
              }
            }
            if (r.out) {
              const o = `CKR_OK (plaintext ${hexUp(r.out)} released)`
              return {
                ok: false,
                observed: o,
                details: `${o} — the NIST case must fail authentication`,
              }
            }
            // The refusal must come from the tag check (C_Decrypt), not from a
            // parameter the engine does not support (C_DecryptInit).
            const observed = rvName(r.rv)
            const v = pinnedVerdict(GCM_AUTH_FAIL_PIN, eName, observed)
            const atDecrypt = r.step !== 'C_DecryptInit'
            return {
              ok: v.ok && atDecrypt,
              observed,
              details:
                `rejected at ${r.step} · ${v.details}` +
                (atDecrypt
                  ? ''
                  : ' · refused before the tag was checked (parameter rejected at init)'),
            }
          } finally {
            mech.free()
            destroy(M, h, k.handle)
          }
        },
      })
    }
  }
}
