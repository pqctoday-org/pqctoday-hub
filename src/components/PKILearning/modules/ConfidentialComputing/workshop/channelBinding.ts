// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Channel binding between an attestation report and a post-quantum key transport.
 *
 * Pattern: the TEE places report_data = SHA-512(ML-KEM encapsulation key || challenge || context)
 * in the 64-byte report_data field. The verifier recomputes that digest from the key it is about
 * to encapsulate to, and a statement over the report_data and the full ciphertext is committed
 * (signed) before the receiver unwraps anything. A different recipient key or a different
 * ciphertext of the same length then fails a check of its own.
 *
 * SIMULATED on the page: a recorded AMD report cannot carry a key generated in this browser, so
 * the report_data used here is computed by this code, not signed by AMD hardware.
 */
import { sha256, sha512 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { equalBytes } from './amdSnpVerifier'

/** ML-KEM-768 encapsulation key length (FIPS 203). */
export const ML_KEM_768_EK_BYTES = 1184
export const CHALLENGE_BYTES = 64
const STATEMENT_DOMAIN = 'tee-hsm-channel-v1'

export const SIMULATED_LABEL = "simulated: a recorded report cannot carry this page's key"

const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s)

/**
 * SHA-512(encapsulation key || challenge || context). The two leading fields have fixed length,
 * so the concatenation is unambiguous; the context (free text) comes last.
 */
export function bindingDigest(ek: Uint8Array, challenge: Uint8Array, context: string): Uint8Array {
  if (ek.length !== ML_KEM_768_EK_BYTES)
    throw new Error(`ML-KEM-768 encapsulation key must be ${ML_KEM_768_EK_BYTES} bytes`)
  if (challenge.length !== CHALLENGE_BYTES)
    throw new Error(`challenge must be ${CHALLENGE_BYTES} bytes`)
  return sha512(Uint8Array.from([...ek, ...challenge, ...utf8(context)]))
}

/**
 * Text the sender commits to (signs): report_data and SHA-256 of the complete ciphertext. The
 * length of the ciphertext and any local handle are not part of it; they identify nothing.
 */
export function channelStatement(reportData: Uint8Array, ciphertext: Uint8Array): string {
  return `${STATEMENT_DOMAIN}|report_data=${bytesToHex(reportData)}|ct_sha256=${bytesToHex(sha256(ciphertext))}`
}

export interface BindingCheck {
  id: 'key-binding' | 'ciphertext-binding'
  label: string
  ran: boolean
  passed: boolean
  attributedTo: string
  detail: string
  simulated: true
}

export interface BindingInput {
  /** report_data as presented (in the page: computed by this code, simulated). */
  reportData: Uint8Array
  /** Key the verifier is about to encapsulate to, or the key the receiver holds. */
  recipientEk: Uint8Array
  challenge: Uint8Array
  context: string
  /** Ciphertext as received. */
  ciphertext: Uint8Array
  /** Statement the sender committed to when it produced the ciphertext. */
  committedStatement: string
}

export function checkChannelBinding(input: BindingInput): {
  checks: BindingCheck[]
  passed: boolean
} {
  let keyOk = false
  let keyDetail: string
  try {
    keyOk = equalBytes(
      bindingDigest(input.recipientEk, input.challenge, input.context),
      input.reportData
    )
    keyDetail = keyOk
      ? 'report_data equals SHA-512(recipient key || challenge || context)'
      : 'report_data does not equal SHA-512(recipient key || challenge || context): wrong recipient key, challenge or context'
  } catch (e) {
    keyDetail = (e as Error).message
  }
  const ctOk = channelStatement(input.reportData, input.ciphertext) === input.committedStatement
  const checks: BindingCheck[] = [
    {
      id: 'key-binding',
      label: 'Recipient key is the one the report_data commits to',
      ran: true,
      passed: keyOk,
      attributedTo: 'SHA-512 recomputation over key, challenge and context',
      detail: keyDetail,
      simulated: true,
    },
    {
      id: 'ciphertext-binding',
      label: 'Received ciphertext is the one the sender committed to',
      ran: true,
      passed: ctOk,
      attributedTo: 'SHA-256 of the full ciphertext inside the committed statement',
      detail: ctOk
        ? 'statement over report_data and SHA-256(ciphertext) matches the committed statement'
        : 'statement over report_data and SHA-256(ciphertext) differs from the committed statement: a different ciphertext, even of the same length',
      simulated: true,
    },
  ]
  return { checks, passed: checks.every((c) => c.passed) }
}
