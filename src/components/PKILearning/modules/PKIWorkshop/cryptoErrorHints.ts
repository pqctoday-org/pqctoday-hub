// SPDX-License-Identifier: GPL-3.0-only
/**
 * Maps common OpenSSL / WASM error patterns to short educational hints
 * shown inline after a crypto failure in the PKI Workshop steps.
 *
 * Returns undefined when no recognised pattern matches, so callers can
 * skip rendering the hint block entirely.
 */
export function getCryptoErrorHint(message: string): string | undefined {
  const m = message.toLowerCase()

  if (
    m.includes('unknown key') ||
    m.includes('unsupported algorithm') ||
    m.includes('no such alg')
  ) {
    return 'The PQC provider may not have initialised yet. Refresh the page to reload the WASM library, then try again.'
  }
  if (m.includes('no start line') || m.includes('not a pem') || m.includes('bad end line')) {
    return "The input doesn't look like a PEM-encoded object. Make sure it includes the -----BEGIN … and -----END … header/footer lines."
  }
  if (
    m.includes('signature') &&
    (m.includes('fail') || m.includes('invalid') || m.includes('bad') || m.includes('mismatch'))
  ) {
    return "Signature failure usually means the private key doesn't match the certificate or CSR. Check that you're using the same key pair throughout all steps."
  }
  if (m.includes('unable to load') || m.includes('not found') || m.includes('no such file')) {
    return 'A required file is missing. Try completing the previous step again to regenerate the key or certificate.'
  }
  if (m.includes('timed out') || m.includes('timeout')) {
    return 'The WASM operation timed out. ML-DSA and SLH-DSA key generation can be slow on first use; refresh the page and try again.'
  }
  if (m.includes('memory') || m.includes('out of memory')) {
    return 'The WASM runtime ran out of memory. Refresh the page to reset the sandbox and try again.'
  }
  if (m.includes('verify') && (m.includes('csr') || m.includes('request'))) {
    return "CSR verification failed — the public key inside the CSR doesn't match the private key used to sign it. Regenerate the CSR with the correct key in Step 1."
  }
  return undefined
}
