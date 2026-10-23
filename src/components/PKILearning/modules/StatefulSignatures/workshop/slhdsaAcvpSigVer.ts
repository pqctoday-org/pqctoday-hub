// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Runs the small NIST ACVP-Server SLH-DSA sigVer sample
 * (../data/slhdsaAcvpSigVerSample.json) through the module's own SLH-DSA engine
 * and compares each answer with NIST's expected result (testPassed).
 *
 * Each case imports the NIST public key and verifies the NIST message and
 * signature under the NIST context (pure SLH-DSA, external interface). A case
 * passes only when the engine's accept/reject answer equals NIST's testPassed;
 * an engine error is reported as an error, never as a successful rejection.
 *
 * These are public reference samples, not vectors issued by an ACVTS session:
 * a pass here establishes no validation.
 */
import { hexToBytes } from '@/utils/dataInputUtils'
import {
  hsm_importSLHDSAPublicKey,
  hsm_slhdsaVerifyBytes,
  CKP_SLH_DSA_SHA2_128S,
  CKP_SLH_DSA_SHAKE_128S,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import type { KatStatus } from '@/utils/katRunner'

export interface SigVerSampleCase {
  tgId: number
  tcId: number
  parameterSet: string
  /** NIST's expected result: true = the signature must verify. */
  testPassed: boolean
  /** NIST's label for what was done to the signature or message ("valid signature ..." when nothing). */
  reason: string
  contextBytes: number
  messageBytes: number
  signatureBytes: number
}

export interface SigVerSampleResult extends SigVerSampleCase {
  /** The engine's answer: true = accepted, false = rejected, null = the engine raised an error. */
  accepted: boolean | null
  status: KatStatus
  details: string
}

// A lazy function, not a top-level literal: the production build wraps the
// softhsm import in vite-plugin-top-level-await, so a top-level literal here
// would capture CKP_SLH_DSA_* as `undefined` (see SLHDSALiveDemo.tsx).
const paramCkp = (): Record<string, number> => ({
  'SLH-DSA-SHA2-128s': CKP_SLH_DSA_SHA2_128S,
  'SLH-DSA-SHAKE-128s': CKP_SLH_DSA_SHAKE_128S,
})

/** The vendored sample, loaded on demand (about 150 KB of hex). */
export async function loadSigVerSample() {
  return (await import('../data/slhdsaAcvpSigVerSample.json')).default
}

export async function runSigVerSample(
  M: SoftHSMModule,
  hSession: number,
  onResult?: (r: SigVerSampleResult) => void
): Promise<SigVerSampleResult[]> {
  const sample = await loadSigVerSample()
  const ckp = paramCkp()
  const out: SigVerSampleResult[] = []
  for (const g of sample.testGroups) {
    for (const t of g.tests) {
      const base: SigVerSampleCase = {
        tgId: g.tgId,
        tcId: t.tcId,
        parameterSet: g.parameterSet,
        testPassed: t.testPassed,
        reason: t.reason,
        contextBytes: t.context.length / 2,
        messageBytes: t.message.length / 2,
        signatureBytes: t.signature.length / 2,
      }
      let pub = 0
      let result: SigVerSampleResult
      try {
        pub = hsm_importSLHDSAPublicKey(M, hSession, ckp[g.parameterSet], hexToBytes(t.pk))
        const accepted = hsm_slhdsaVerifyBytes(
          M,
          hSession,
          pub,
          hexToBytes(t.message),
          hexToBytes(t.signature),
          { context: hexToBytes(t.context) }
        )
        const ok = accepted === t.testPassed
        result = {
          ...base,
          accepted,
          status: ok ? 'pass' : 'fail',
          details: ok
            ? `${accepted ? 'Accepted' : 'Rejected'}, as NIST expects`
            : `${accepted ? 'ACCEPTED' : 'REJECTED'}, but NIST expects ${t.testPassed ? 'acceptance' : 'rejection'}`,
        }
      } catch (e) {
        result = {
          ...base,
          accepted: null,
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
