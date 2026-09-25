// SPDX-License-Identifier: GPL-3.0-only
/**
 * SP 800-90 series source assembly and conditioning functions via SoftHSMv3 PKCS#11.
 *
 * Source assembly (SP 800-90C §3.1):
 *   Default: Concatenation (NIST-compliant)
 *   Educational alternatives: XOR, Hash, HMAC
 *
 * Vetted conditioning functions (SP 800-90C §3.2 / SP 800-90A §10.3.1):
 *   Hash_df (SP 800-90A §10.3.1), Hash (§3.2.1.2), HMAC (§3.2.1.2), AES-CMAC (§3.2.1.3)
 */
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  hsm_digest,
  hsm_hmac,
  hsm_aesCmac,
  hsm_importHMACKey,
  hsm_importAESKey,
  hsm_destroyObject,
  CKM_SHA256,
  CKM_SHA256_HMAC,
} from '@/wasm/softhsm'
import type { FilterDropdownItem } from '@/components/common/FilterDropdown'
import { xorBytes } from '../utils/outputFormatters'

// ── Types ────────────────────────────────────────────────────────────────────

export type CombinationMode = 'concat' | 'xor' | 'hash' | 'hmac'
export type ConditioningMode = 'hash-df' | 'hash' | 'hmac' | 'aes-cmac'

// ── UI metadata ──────────────────────────────────────────────────────────────

export const COMBINATION_MODES: FilterDropdownItem[] = [
  { id: 'concat', label: 'Concatenation (SP 800-90C)' },
  { id: 'xor', label: 'XOR (educational)' },
  { id: 'hash', label: 'Hash (educational)' },
  { id: 'hmac', label: 'HMAC (educational)' },
]

export const CONDITIONING_MODES: FilterDropdownItem[] = [
  { id: 'hash-df', label: 'Hash_df (SP 800-90A §10.3.1)' },
  { id: 'hash', label: 'Hash / SHA-256 (SP 800-90C §3.2.1.2)' },
  { id: 'hmac', label: 'HMAC-SHA-256 (SP 800-90C §3.2.1.2)' },
  { id: 'aes-cmac', label: 'AES-CMAC (SP 800-90C §3.2.1.3)' },
]

export const COMBINATION_DESCRIPTIONS: Record<CombinationMode, string> = {
  concat:
    'Concatenation is how SP 800-90C §3.1 (Get_entropy_bitstring, item 3) assembles entropy-source output: every source bit is kept. The entropy of the bitstring is the sum credited from each independent source (§2.6 item 8); with Method 1 only validated physical sources count (§2.3). Conditioning is optional, and yields full entropy only when its input carries output_len + 64 bits of entropy (§3.2.2.2).',
  xor: 'Educational: XOR keeps the entropy of the stronger input only when the inputs are independent. An adversary who controls one input and can see the other can cancel it — choosing A = B makes A ⊕ B all zeros. In SP 800-90C, XOR appears in RBG3(XOR), where entropy-source output is XORed with DRBG output (§6.4), not as a way to combine two entropy sources.',
  hash: 'Educational: Hash(A||B) applies SHA-256 to the concatenated sources via the HSM. Note: Hash is a vetted conditioning function (SP 800-90C §3.2.1.2), not a source assembly method — using it here applies conditioning twice when a separate conditioning step follows.',
  hmac: 'Educational: HMAC uses one source as the key and the other as the message. Note: HMAC is a vetted conditioning function (SP 800-90C §3.2.1.2), not a source assembly method — using it here applies conditioning twice when a separate conditioning step follows.',
}

export const CONDITIONING_DESCRIPTIONS: Record<ConditioningMode, string> = {
  'hash-df':
    'Hash_df (SP 800-90A Rev. 1 §10.3.1) is the derivation function Hash_DRBG uses (CTR_DRBG uses Block_Cipher_df instead), and SP 800-90B §3.1.5.1.1 lists it as a vetted conditioning component. It hashes a counter, the requested bit length and the input, producing a fixed-length output.',
  hash: 'Hash conditioning (SP 800-90C §3.2.1.2 item 1) applies SHA-256 directly to the entropy bitstring. The simplest vetted conditioning function — output length equals the hash digest length (256 bits).',
  hmac: 'HMAC conditioning (SP 800-90C §3.2.1.2 item 2) uses HMAC-SHA-256 with a fixed key (per §3.2.1.1, conditioning keys do not require secrecy and may be fixed or all zeros). Output length equals the hash output length (256 bits).',
  'aes-cmac':
    'SP 800-90C §3.2.1.3 item 1 specifies CMAC conditioning as conditioned_output_block = CMAC(Key, entropy_bitstring), a 128-bit output for AES, with a key that may be fixed (§3.2.1.1). To show 32 bytes, this demo concatenates two CMAC outputs over domain-separated inputs (0x01 || x and 0x02 || x) — a demo construction, not the single-block call SP 800-90C specifies.',
}

/** Short labels for pipeline visualization */
export const COMBINATION_LABELS: Record<CombinationMode, string> = {
  concat: 'Concat',
  xor: 'XOR',
  hash: 'Hash',
  hmac: 'HMAC',
}

export const CONDITIONING_LABELS: Record<ConditioningMode, string> = {
  'hash-df': 'Hash_df',
  hash: 'Hash',
  hmac: 'HMAC',
  'aes-cmac': 'AES-CMAC',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a)
  out.set(b, a.length)
  return out
}

/** Encode a 32-bit unsigned integer as 4 big-endian bytes */
function uint32BE(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff])
}

// ── Combination ──────────────────────────────────────────────────────────────

/** Whether a combination mode requires the HSM */
export function combinationNeedsHsm(mode: CombinationMode): boolean {
  return mode === 'hash' || mode === 'hmac'
}

/**
 * Combine two entropy sources using the selected SP 800-90C method.
 * XOR and concat are pure-JS; hash and hmac route through softhsmv3.
 */
export function combine(
  mode: CombinationMode,
  M: SoftHSMModule | null,
  hSession: number,
  sourceA: Uint8Array,
  sourceB: Uint8Array
): Uint8Array {
  switch (mode) {
    case 'xor':
      return xorBytes(sourceA, sourceB)

    case 'hash': {
      if (!M) throw new Error('HSM required for Hash combination')
      return hsm_digest(M, hSession, concat(sourceA, sourceB), CKM_SHA256)
    }

    case 'hmac': {
      if (!M) throw new Error('HSM required for HMAC combination')
      const keyHandle = hsm_importHMACKey(M, hSession, sourceA)
      try {
        return hsm_hmac(M, hSession, keyHandle, sourceB, CKM_SHA256_HMAC)
      } finally {
        hsm_destroyObject(M, hSession, keyHandle)
      }
    }

    case 'concat':
      return concat(sourceA, sourceB)
  }
}

// ── Conditioning ─────────────────────────────────────────────────────────────

/** Fixed 32-byte zero key for HMAC conditioning (SP 800-90C §3.2.1.1: keys may be all zeros) */
const HMAC_FIXED_KEY = new Uint8Array(32)

/** Fixed 16-byte zero key for AES-CMAC conditioning (SP 800-90C §3.2.1.1: keys may be all zeros) */
const CMAC_FIXED_KEY = new Uint8Array(16)

/**
 * Condition the assembled output using a vetted SP 800-90C §3.2 function.
 * All modes route through softhsmv3 PKCS#11.
 *
 * @param combined  Output from the assembly step
 * @returns 32-byte conditioned output
 */
export function condition(
  mode: ConditioningMode,
  M: SoftHSMModule,
  hSession: number,
  combined: Uint8Array
): Uint8Array {
  switch (mode) {
    case 'hash-df':
      return conditionHashDf(M, hSession, combined)
    case 'hash':
      return conditionHash(M, hSession, combined)
    case 'hmac':
      return conditionHmac(M, hSession, combined)
    case 'aes-cmac':
      return conditionAesCmac(M, hSession, combined)
  }
}

/**
 * Hash conditioning (SP 800-90C §3.2.1.2 item 1):
 *   conditioned_output_block = Hash(entropy_bitstring)
 */
function conditionHash(M: SoftHSMModule, hSession: number, combined: Uint8Array): Uint8Array {
  return hsm_digest(M, hSession, combined, CKM_SHA256)
}

/**
 * HMAC conditioning (SP 800-90C §3.2.1.2 item 2):
 *   conditioned_output_block = HMAC(Key, entropy_bitstring)
 * Key is a fixed 32-byte zero key per §3.2.1.1 (keys do not require secrecy).
 */
function conditionHmac(M: SoftHSMModule, hSession: number, combined: Uint8Array): Uint8Array {
  const keyHandle = hsm_importHMACKey(M, hSession, HMAC_FIXED_KEY)
  try {
    return hsm_hmac(M, hSession, keyHandle, combined, CKM_SHA256_HMAC)
  } finally {
    hsm_destroyObject(M, hSession, keyHandle)
  }
}

/**
 * Hash_df per SP 800-90A §10.3.1:
 *   temp = Hash(counter || no_of_bits_to_return || input_string)
 *   counter++, repeat until len(temp) >= requested_bits
 *   return leftmost(temp, no_of_bits_to_return)
 *
 * For 256-bit output with SHA-256, one iteration suffices.
 */
function conditionHashDf(M: SoftHSMModule, hSession: number, combined: Uint8Array): Uint8Array {
  const requestedBits = 256 // 32 bytes
  const iterations = Math.ceil(requestedBits / 256) // SHA-256 output = 256 bits
  let temp = new Uint8Array(0)

  for (let counter = 1; counter <= iterations; counter++) {
    // Build: counter (1 byte) || no_of_bits_to_return (4 bytes BE) || input_string
    const counterByte = new Uint8Array([counter])
    const noBitsBytes = uint32BE(requestedBits)
    const input = new Uint8Array(1 + 4 + combined.length)
    input.set(counterByte)
    input.set(noBitsBytes, 1)
    input.set(combined, 5)

    const hashBlock = hsm_digest(M, hSession, input, CKM_SHA256)
    const newTemp = new Uint8Array(temp.length + hashBlock.length)
    newTemp.set(temp)
    newTemp.set(hashBlock, temp.length)
    temp = newTemp
  }

  return temp.slice(0, 32)
}

/**
 * AES-CMAC conditioning (SP 800-90C §3.2.1.3 item 1 / SP 800-38B):
 *   CMAC(K, 0x01 || data) || CMAC(K, 0x02 || data)
 * Key: fixed 16-byte zero key per §3.2.1.1 (keys do not require secrecy).
 */
function conditionAesCmac(M: SoftHSMModule, hSession: number, combined: Uint8Array): Uint8Array {
  const keyHandle = hsm_importAESKey(
    M,
    hSession,
    CMAC_FIXED_KEY,
    false, // encrypt
    false, // decrypt
    false, // wrap
    false, // unwrap
    false, // derive
    true, // extractable
    true, // sign
    false // verify
  )
  try {
    // Two CMAC blocks → 32 bytes
    const block1Input = concat(new Uint8Array([0x01]), combined)
    const block2Input = concat(new Uint8Array([0x02]), combined)
    const mac1 = hsm_aesCmac(M, hSession, keyHandle, block1Input)
    const mac2 = hsm_aesCmac(M, hSession, keyHandle, block2Input)
    return concat(mac1, mac2)
  } finally {
    hsm_destroyObject(M, hSession, keyHandle)
  }
}
