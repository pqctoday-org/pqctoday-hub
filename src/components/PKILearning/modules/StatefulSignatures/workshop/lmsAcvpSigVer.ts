// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Runs the NIST ACVP-Server LMS sigVer samples (../data/lmsAcvpSigVerSample.json)
 * through the module's own PKCS#11 engine and compares each answer with NIST's
 * expected result (testPassed).
 *
 * The engine verifies LMS through CKM_HSS (PKCS#11 v3.2 has no separate LMS
 * mechanism). A one-level HSS key and signature are the LMS ones with a 4-byte
 * prefix (RFC 8554 Section 3.3: HSS public key = u32str(L) || pub[0]; HSS
 * signature = u32str(Nspk) || ..., Nspk = L-1 = 0), so each NIST key is sent as
 * 00000001 || publicKey and each NIST signature as 00000000 || signature. The
 * LMS bytes themselves, and the message, are NIST's, unchanged.
 *
 * A case passes only when the engine's accept/reject answer equals NIST's
 * testPassed. "Reject" means the engine said the signature is invalid
 * (CKR_SIGNATURE_INVALID, or CKR_SIGNATURE_LEN_RANGE for a malformed length);
 * any other return value is an error, never a successful rejection.
 *
 * These are public reference samples, not vectors issued by an ACVTS session:
 * a pass here establishes no validation.
 */
import { hexToBytes } from '@/utils/dataInputUtils'
import { hsm_importStatefulPublicKey, hsm_statefulVerifyBytes, rvName } from '@/wasm/softhsm'
import {
  CKK_HSS,
  CKM_HSS,
  CKR_SIGNATURE_INVALID,
  CKR_SIGNATURE_LEN_RANGE,
} from '@/wasm/softhsm/constants'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import type { KatStatus } from '@/utils/katRunner'

export interface LmsSigVerCase {
  /** NIST's file revision: "SP800-208" or "1.0". Case ids repeat across revisions. */
  revision: string
  tgId: number
  tcId: number
  lmsMode: string
  lmOtsMode: string
  /** NIST's expected result: true = the signature must verify. */
  testPassed: boolean
  /** NIST's label for what was done to the signature or message ("no modification" when nothing). */
  reason: string
  messageBytes: number
  signatureBytes: number
}

export interface LmsSigVerResult extends LmsSigVerCase {
  /** The engine's answer: true = accepted, false = rejected as invalid, null = any other return value. */
  accepted: boolean | null
  /** The PKCS#11 return value of C_Verify, by name. */
  returned: string
  status: KatStatus
  details: string
}

/** One-level HSS framing (RFC 8554 Section 3.3). */
const HSS_ONE_LEVEL_KEY_PREFIX = Uint8Array.of(0, 0, 0, 1)
const HSS_ONE_LEVEL_SIG_PREFIX = Uint8Array.of(0, 0, 0, 0)

const withPrefix = (prefix: Uint8Array, body: Uint8Array): Uint8Array => {
  const out = new Uint8Array(prefix.length + body.length)
  out.set(prefix, 0)
  out.set(body, prefix.length)
  return out
}

/** The vendored sample, loaded on demand (about 185 KB of hex). */
export async function loadLmsSigVerSample() {
  return (await import('../data/lmsAcvpSigVerSample.json')).default
}

export async function runLmsSigVerSample(
  M: SoftHSMModule,
  hSession: number,
  onResult?: (r: LmsSigVerResult) => void
): Promise<LmsSigVerResult[]> {
  const sample = await loadLmsSigVerSample()
  const out: LmsSigVerResult[] = []
  for (const g of sample.testGroups) {
    for (const t of g.tests) {
      const base: LmsSigVerCase = {
        revision: g.revision,
        tgId: g.tgId,
        tcId: t.tcId,
        lmsMode: g.lmsMode,
        lmOtsMode: g.lmOtsMode,
        testPassed: t.testPassed,
        reason: t.reason,
        messageBytes: t.message.length / 2,
        signatureBytes: t.signature.length / 2,
      }
      let pub = 0
      let result: LmsSigVerResult
      try {
        pub = hsm_importStatefulPublicKey(
          M,
          hSession,
          CKK_HSS,
          withPrefix(HSS_ONE_LEVEL_KEY_PREFIX, hexToBytes(g.publicKey))
        )
        const rv = hsm_statefulVerifyBytes(
          M,
          hSession,
          CKM_HSS,
          pub,
          hexToBytes(t.message),
          withPrefix(HSS_ONE_LEVEL_SIG_PREFIX, hexToBytes(t.signature))
        )
        const accepted =
          rv === 0
            ? true
            : rv === CKR_SIGNATURE_INVALID || rv === CKR_SIGNATURE_LEN_RANGE
              ? false
              : null
        const returned = rvName(rv)
        if (accepted === null) {
          result = {
            ...base,
            accepted,
            returned,
            status: 'error',
            details: `Engine returned ${returned}, which is neither acceptance nor an invalid-signature answer`,
          }
        } else {
          const ok = accepted === t.testPassed
          result = {
            ...base,
            accepted,
            returned,
            status: ok ? 'pass' : 'fail',
            details: ok
              ? `${accepted ? 'Accepted' : 'Rejected'}, as NIST expects`
              : `${accepted ? 'ACCEPTED' : 'REJECTED'}, but NIST expects ${t.testPassed ? 'acceptance' : 'rejection'}`,
          }
        }
      } catch (e) {
        result = {
          ...base,
          accepted: null,
          returned: 'engine error',
          status: 'error',
          details: `Engine error: ${e instanceof Error ? e.message : String(e)}`,
        }
      } finally {
        if (pub) {
          try {
            M._C_DestroyObject(hSession, pub)
          } catch {
            // best effort: the key is a session object and dies with the session
          }
        }
      }
      out.push(result)
      onResult?.(result)
    }
  }
  return out
}
