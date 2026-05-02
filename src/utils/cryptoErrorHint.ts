// SPDX-License-Identifier: GPL-3.0-only
/**
 * Maps PKCS#11 return codes and WASM runtime errors to user-readable messages
 * with actionable retry suggestions.
 *
 * Returns `undefined` when no pattern matches — callers should fall back to
 * showing the raw message (or suppress display entirely for non-fatal errors).
 */

export interface CryptoErrorHint {
  /** One-line plain-English summary of what went wrong. */
  summary: string
  /** Specific action the user can take to recover. */
  action: string
  /** Optional: a more technical note for developers (shown collapsed). */
  technicalNote?: string
}

// PKCS#11 v3.2 return code patterns
const PKCS11_PATTERNS: Array<[RegExp, CryptoErrorHint]> = [
  [
    /CKR_KEY_TYPE_INCONSISTENT|0x00000063/i,
    {
      summary: 'The selected algorithm is incompatible with this key type.',
      action: 'Regenerate the key pair using the correct algorithm, then retry.',
      technicalNote: 'CKR_KEY_TYPE_INCONSISTENT (0x63) — mechanism does not support this key type.',
    },
  ],
  [
    /CKR_MECHANISM_INVALID|0x00000070/i,
    {
      summary: 'This operation is not supported by the current HSM configuration.',
      action: 'Check that the HSM engine is loaded and the selected algorithm is enabled.',
      technicalNote: 'CKR_MECHANISM_INVALID (0x70) — mechanism not supported by token.',
    },
  ],
  [
    /CKR_SIGNATURE_INVALID|0x000000C0/i,
    {
      summary: 'Signature verification failed — the signature does not match the message.',
      action:
        'Ensure you are verifying against the same message that was signed. Regenerate the key pair and signature if the issue persists.',
      technicalNote: 'CKR_SIGNATURE_INVALID (0xC0) — C_Verify returned INVALID.',
    },
  ],
  [
    /CKR_SIGNATURE_LEN_RANGE|0x000000C1/i,
    {
      summary: 'Signature byte length is wrong for this algorithm.',
      action: 'Regenerate the signature. Do not truncate or modify signature hex.',
      technicalNote: 'CKR_SIGNATURE_LEN_RANGE (0xC1) — signature length rejected by token.',
    },
  ],
  [
    /CKR_DEVICE_ERROR|0x00000030/i,
    {
      summary: 'The HSM emulator encountered an internal error.',
      action: 'Reload the page to reinitialise the WASM HSM, then retry.',
      technicalNote: 'CKR_DEVICE_ERROR (0x30) — SoftHSMv3 internal fault.',
    },
  ],
  [
    /CKR_GENERAL_ERROR|0x00000005/i,
    {
      summary: 'The HSM emulator returned a general error.',
      action: 'Reload the page to reset the WASM module and try again.',
      technicalNote: 'CKR_GENERAL_ERROR (0x05).',
    },
  ],
  [
    /CKR_TOKEN_NOT_PRESENT|0x000000E0/i,
    {
      summary: 'The HSM token is not initialised.',
      action: 'Enable the Live HSM toggle and wait for initialisation to complete before retrying.',
      technicalNote: 'CKR_TOKEN_NOT_PRESENT (0xE0) — C_InitToken has not completed.',
    },
  ],
  [
    /CKR_SESSION_HANDLE_INVALID|0x000000B3/i,
    {
      summary: 'The HSM session has expired.',
      action: 'Reload the page to open a fresh session, then retry.',
      technicalNote: 'CKR_SESSION_HANDLE_INVALID (0xB3).',
    },
  ],
  [
    /CKR_KEY_EXHAUSTED|0x00000162/i,
    {
      summary: 'This key has used all of its one-time signatures and cannot sign again.',
      action:
        'Generate a new key pair. Stateful hash-based keys (LMS/HSS, XMSS) have a fixed signature budget.',
      technicalNote: 'CKR_KEY_EXHAUSTED (0x162) — all OTS indices consumed.',
    },
  ],
  [
    /CKR_OBJECT_HANDLE_INVALID|0x00000082/i,
    {
      summary: 'The key handle is no longer valid — it may have been deleted.',
      action: 'Regenerate the key pair and retry the operation.',
      technicalNote: 'CKR_OBJECT_HANDLE_INVALID (0x82).',
    },
  ],
  [
    /C_CreateObject.*failed|C_ImportKey.*failed/i,
    {
      summary: 'Key import into the HSM failed.',
      action:
        'Check that the key format is correct for the selected algorithm. Try regenerating the key pair.',
      technicalNote: 'C_CreateObject / C_ImportKey returned an error code.',
    },
  ],
]

// Emscripten / WASM runtime error patterns
const WASM_PATTERNS: Array<[RegExp, CryptoErrorHint]> = [
  [
    /table index is out of bounds|indirect call|RuntimeError/i,
    {
      summary: 'The WASM module crashed due to a memory access error.',
      action: 'Reload the page to reset the WASM sandbox, then retry.',
      technicalNote:
        'Emscripten RuntimeError — usually a call-stack overflow or null function pointer.',
    },
  ],
  [
    /out of memory|memory access out of bounds/i,
    {
      summary: 'The WASM module ran out of memory.',
      action:
        'Reload the page to free WASM heap memory. Large key operations (SLH-DSA, Classic McEliece) require more memory.',
      technicalNote: 'Emscripten OOM or invalid memory access.',
    },
  ],
  [
    /HSM session is not ready/i,
    {
      summary: 'The HSM is still initialising.',
      action:
        'Wait a few seconds for the "Initialising SoftHSM…" banner to clear, then retry the operation.',
    },
  ],
  [
    /module is not defined|wasm.*not.*loaded|failed to fetch.*wasm/i,
    {
      summary: 'The WASM module failed to load.',
      action: 'Check your network connection, disable any content blockers, and reload the page.',
      technicalNote: 'WASM fetch or instantiation error.',
    },
  ],
]

// OpenSSL error patterns
const OPENSSL_PATTERNS: Array<[RegExp, CryptoErrorHint]> = [
  [
    /unknown key|unsupported algorithm|no such alg/i,
    {
      summary: 'The PQC provider may not have initialised yet.',
      action: 'Refresh the page to reload the WASM library, then try again.',
    },
  ],
  [
    /no start line|not a pem|bad end line/i,
    {
      summary: "The input doesn't look like a PEM-encoded object.",
      action: 'Make sure it includes the -----BEGIN … and -----END … header/footer lines.',
    },
  ],
  [
    /signature.*(fail|invalid|bad|mismatch)/i,
    {
      summary:
        "Signature failure usually means the private key doesn't match the certificate or CSR.",
      action: "Check that you're using the same key pair throughout all steps.",
    },
  ],
  [
    /unable to load|not found|no such file/i,
    {
      summary: 'A required file is missing.',
      action: 'Try completing the previous step again to regenerate the key or certificate.',
    },
  ],
  [
    /timed out|timeout/i,
    {
      summary: 'The WASM operation timed out.',
      action:
        'ML-DSA and SLH-DSA key generation can be slow on first use; refresh the page and try again.',
    },
  ],
  [
    /verify.*(csr|request)/i,
    {
      summary:
        "CSR verification failed — the public key inside the CSR doesn't match the private key used to sign it.",
      action: 'Regenerate the CSR with the correct key in Step 1.',
    },
  ],
]

/**
 * Returns a structured hint for a PKCS#11, WASM, or OpenSSL error string, or
 * `undefined` if no pattern matches.
 */
export function getCryptoErrorHint(message: string): CryptoErrorHint | undefined {
  for (const [pattern, hint] of PKCS11_PATTERNS) {
    if (pattern.test(message)) return hint
  }
  for (const [pattern, hint] of WASM_PATTERNS) {
    if (pattern.test(message)) return hint
  }
  for (const [pattern, hint] of OPENSSL_PATTERNS) {
    if (pattern.test(message)) return hint
  }
  return undefined
}

/**
 * Convenience helper: returns just the summary + action as a single string,
 * suitable for passing directly to `<ErrorAlert message={...} />`.
 * Falls back to the raw message if no pattern matches.
 */
export function translateCryptoError(rawMessage: string): string {
  const hint = getCryptoErrorHint(rawMessage)
  if (!hint) return rawMessage
  return `${hint.summary} — ${hint.action}`
}
