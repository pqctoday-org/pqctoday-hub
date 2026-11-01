// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Alternative key combiners for the Step 2 comparison panel. They run on the
 * same two shared secrets the workshop already produced, in the browser, so a
 * learner can see what each design feeds into the final key.
 *
 * - Concatenation only: the 64-byte ML-KEM_ss || X25519_ss used directly as the
 *   key. ETSI TR 103 966 warns that this naive construction "will not be secure
 *   against active adversaries, regardless of the security of the component
 *   algorithms". Shown only as the counter-example.
 * - X-Wing: SHA3-256(ss_M || ss_X || ct_X || pk_X || XWingLabel)
 *   (draft-connolly-cfrg-xwing-kem-11 section 5.3). Composite ML-KEM's
 *   MLKEM768-X25519 entry (draft-ietf-lamps-pq-composite-kem-23) uses the same
 *   formula and the same 6-byte label, so it gives the same output.
 */
import { sha3_256 } from '@noble/hashes/sha3.js'

/** XWingLabel, the 6 ASCII bytes "\./" "/^\" (hex 5c2e2f2f5e5c). */
export const XWING_LABEL = Uint8Array.from([0x5c, 0x2e, 0x2f, 0x2f, 0x5e, 0x5c])

const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

const require32 = (name: string, v: Uint8Array) => {
  if (v.length !== 32) throw new Error(`${name} must be 32 bytes, got ${v.length}`)
}

/** ML-KEM_ss || X25519_ss, used as-is: the naive construction. */
export const concatenationOnly = (ssM: Uint8Array, ssX: Uint8Array): Uint8Array => {
  require32('ss_M', ssM)
  require32('ss_X', ssX)
  return concat(ssM, ssX)
}

/** The X-Wing preimage, ss_M || ss_X || ct_X || pk_X || XWingLabel (134 bytes). */
export const xwingPreimage = (
  ssM: Uint8Array,
  ssX: Uint8Array,
  ctX: Uint8Array,
  pkX: Uint8Array
): Uint8Array => {
  for (const [n, v] of [
    ['ss_M', ssM],
    ['ss_X', ssX],
    ['ct_X', ctX],
    ['pk_X', pkX],
  ] as const)
    require32(n, v)
  return concat(ssM, ssX, ctX, pkX, XWING_LABEL)
}

/** SHA3-256 over the X-Wing preimage. */
export const xwingCombiner = (
  ssM: Uint8Array,
  ssX: Uint8Array,
  ctX: Uint8Array,
  pkX: Uint8Array
): Uint8Array => sha3_256(xwingPreimage(ssM, ssX, ctX, pkX))
