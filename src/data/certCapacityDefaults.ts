// SPDX-License-Identifier: AGPL-3.0-only
/** Size inputs only. Public keys are raw material; encoding allowances are separate. */
export interface AlgoCapacityProfile {
  name: string
  publicKeyBytes: number
  signatureBytes: number
  /** Public-key encoding and SPKI wrapper, excluded from template overhead. */
  publicKeyEncodingBytes: number
  sizeSource: string
}

export const CERT_CAPACITY_DEFAULTS: AlgoCapacityProfile[] = [
  {
    name: 'RSA-2048',
    publicKeyBytes: 256,
    publicKeyEncodingBytes: 38,
    signatureBytes: 256,
    sizeSource: 'RFC 8017 / RFC 5280; 256-byte modulus, estimated 294-byte encoded SPKI',
  },
  {
    name: 'ECDSA P-256',
    publicKeyBytes: 64,
    publicKeyEncodingBytes: 27,
    signatureBytes: 72,
    sizeSource:
      'RFC 5480 / RFC 3279; 65-byte uncompressed point plus SPKI wrapper; 72-byte DER signature upper bound',
  },
  {
    name: 'ML-DSA-44',
    publicKeyBytes: 1312,
    publicKeyEncodingBytes: 22,
    signatureBytes: 2420,
    sizeSource: 'FIPS 204 / RFC 9881; raw sizes plus 22-byte DER SPKI wrapper',
  },
  {
    name: 'ML-DSA-65',
    publicKeyBytes: 1952,
    publicKeyEncodingBytes: 22,
    signatureBytes: 3309,
    sizeSource: 'FIPS 204 / RFC 9881; raw sizes plus 22-byte DER SPKI wrapper',
  },
  {
    name: 'ML-DSA-87',
    publicKeyBytes: 2592,
    publicKeyEncodingBytes: 22,
    signatureBytes: 4627,
    sizeSource: 'FIPS 204 / RFC 9881; raw sizes plus 22-byte DER SPKI wrapper',
  },
]

export const CERT_CAPACITY_MODEL_VERSION = '2'
export const CERT_CAPACITY_ASSUMPTIONS =
  'Educational estimate. Root CA → one intermediate CA → leaf, with one algorithm and parameter set throughout. ' +
  'TLS sends the intermediate and leaf; root excluded. Payload = two estimated certificates + one server CertificateVerify signature contribution. ' +
  'Excludes TLS framing, key shares, other handshake messages, optional OCSP/SCT additions and client authentication. ' +
  'Rate means full handshakes, excluding resumed connections. Annual storage covers steady-state leaf issuance only, without initial issuance, CA renewals, backups or retention. ' +
  'Template overhead excludes the encoded public key and signature; all other certificate structure and extensions use this adjustable allowance. No CPU prediction.'

export interface CertCapacityInputs {
  certCount: number
  renewalDays: number
  handshakesPerSec: number
  templateBytes: number
}

export function computeCertificateCapacity(inputs: CertCapacityInputs) {
  const { certCount, renewalDays, handshakesPerSec, templateBytes } = inputs
  if (
    ![certCount, renewalDays, handshakesPerSec, templateBytes].every(Number.isFinite) ||
    !Number.isInteger(certCount) ||
    certCount < 0 ||
    renewalDays <= 0 ||
    handshakesPerSec < 0 ||
    templateBytes < 0
  ) {
    throw new RangeError(
      'Use a nonnegative certificate count and rates, and a positive renewal interval.'
    )
  }
  const renewalsPerYear = 365 / renewalDays
  return CERT_CAPACITY_DEFAULTS.map((algo) => {
    const certificateBytes =
      algo.publicKeyBytes + algo.publicKeyEncodingBytes + algo.signatureBytes + templateBytes
    const chainBytes = 2 * certificateBytes
    const payloadBytes = chainBytes + algo.signatureBytes
    const storageMiB = (certCount * certificateBytes * renewalsPerYear) / 1024 ** 2
    const aggregateMiBPerSec = (payloadBytes * handshakesPerSec) / 1024 ** 2
    if (![payloadBytes, renewalsPerYear, storageMiB, aggregateMiBPerSec].every(Number.isFinite)) {
      throw new RangeError('Certificate estimate exceeds numeric range.')
    }
    return {
      algorithm: algo.name,
      certificateBytes,
      chainBytes,
      signatureBytes: algo.signatureBytes,
      payloadBytes,
      storageMiB,
      renewalsPerYear,
      payloadKiB: payloadBytes / 1024,
      aggregateMiBPerSec,
      sizeSource: algo.sizeSource,
    }
  })
}
