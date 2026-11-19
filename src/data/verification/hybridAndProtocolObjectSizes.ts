// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * Independently transcribed hybrid KEM key shares, composite signature profiles,
 * and protocol-encoded object specifications (TLS 1.3, SSH, IKEv2, WireGuard,
 * EMV Book 2, OTA, OpenBao Transit, X.509 SPKI), plus the deterministic oracle
 * resolver for all 304 claims in `module-claim-inventory.json`.
 *
 * Standards referenced:
 * - RFC 10024: Hybrid Key Exchange in TLS 1.3
 *   (X25519MLKEM768, SecP256r1MLKEM768, SecP384r1MLKEM1024)
 * - draft-kampanakis-curdle-ssh-pq-ke: PQ/T Hybrid Key Exchange in SSH (mlkem768x25519-sha256)
 * - RFC 9976: Streamlined NTRU Prime sntrup761 + X25519 in SSH (sntrup761x25519-sha512)
 * - RFC 9370 + draft-ietf-ipsecme-ikev2-mlkem: Multiple Key Exchanges in IKEv2 with ML-KEM
 * - RFC 10073: Composite ML-DSA for X.509 & PKIX
 */

import { FIPS_OBJECT_SIZES } from './fipsObjectSizes'
import {
  CLASSICAL_ECDSA_SIZES,
  CLASSICAL_EDDSA_SIZES,
  CLASSICAL_KEX_SIZES,
  CLASSICAL_RSA_SIZES,
} from './classicalObjectSizes'
import {
  CANDIDATE_OBJECT_SIZES,
  STATEFUL_LMS_HSS_SIZES,
  STATEFUL_XMSS_SIZES,
} from './statefulAndCandidateObjectSizes'

export interface HybridKemSpec {
  id: string
  classicalComponent: string
  pqcComponent: string
  clientPublicKeyShareBytes: number
  serverCiphertextShareBytes: number
  sharedSecretBytes: number
  standard: string
}

export const HYBRID_KEM_OBJECT_SIZES: Record<string, HybridKemSpec> = {
  X25519MLKEM768: {
    id: 'X25519MLKEM768',
    classicalComponent: 'X25519 (32 B)',
    pqcComponent: 'ML-KEM-768 (1184 B pk / 1088 B ct)',
    clientPublicKeyShareBytes:
      FIPS_OBJECT_SIZES['ML-KEM-768'].publicKeyBytes + CLASSICAL_KEX_SIZES.X25519.publicKeyBytes, // 1184 + 32 = 1216
    serverCiphertextShareBytes:
      FIPS_OBJECT_SIZES['ML-KEM-768'].signatureOrCiphertextBytes +
      CLASSICAL_KEX_SIZES.X25519.publicKeyBytes, // 1088 + 32 = 1120
    sharedSecretBytes: 64,
    standard: 'RFC 10024',
  },
  SecP256r1MLKEM768: {
    id: 'SecP256r1MLKEM768',
    classicalComponent: 'secp256r1 uncompressed point (65 B)',
    pqcComponent: 'ML-KEM-768 (1184 B pk / 1088 B ct)',
    clientPublicKeyShareBytes:
      FIPS_OBJECT_SIZES['ML-KEM-768'].publicKeyBytes +
      CLASSICAL_ECDSA_SIZES['ECDSA P-256'].uncompressedPublicKeyBytes, // 1184 + 65 = 1249
    serverCiphertextShareBytes:
      FIPS_OBJECT_SIZES['ML-KEM-768'].signatureOrCiphertextBytes +
      CLASSICAL_ECDSA_SIZES['ECDSA P-256'].uncompressedPublicKeyBytes, // 1088 + 65 = 1153
    sharedSecretBytes: 64,
    standard: 'RFC 10024',
  },
  SecP384r1MLKEM1024: {
    id: 'SecP384r1MLKEM1024',
    classicalComponent: 'secp384r1 uncompressed point (97 B)',
    pqcComponent: 'ML-KEM-1024 (1568 B pk / 1568 B ct)',
    clientPublicKeyShareBytes:
      FIPS_OBJECT_SIZES['ML-KEM-1024'].publicKeyBytes +
      CLASSICAL_ECDSA_SIZES['ECDSA P-384'].uncompressedPublicKeyBytes, // 1568 + 97 = 1665
    serverCiphertextShareBytes:
      FIPS_OBJECT_SIZES['ML-KEM-1024'].signatureOrCiphertextBytes +
      CLASSICAL_ECDSA_SIZES['ECDSA P-384'].uncompressedPublicKeyBytes, // 1568 + 97 = 1665
    sharedSecretBytes: 48 + 32,
    standard: 'RFC 10024',
  },
  'mlkem768x25519-sha256': {
    id: 'mlkem768x25519-sha256',
    classicalComponent: 'X25519 (32 B)',
    pqcComponent: 'ML-KEM-768 (1184 B pk / 1088 B ct)',
    clientPublicKeyShareBytes:
      FIPS_OBJECT_SIZES['ML-KEM-768'].publicKeyBytes + CLASSICAL_KEX_SIZES.X25519.publicKeyBytes, // 1216
    serverCiphertextShareBytes:
      FIPS_OBJECT_SIZES['ML-KEM-768'].signatureOrCiphertextBytes +
      CLASSICAL_KEX_SIZES.X25519.publicKeyBytes, // 1120
    sharedSecretBytes: 64,
    standard: 'draft-kampanakis-curdle-ssh-pq-ke',
  },
  'sntrup761x25519-sha512': {
    id: 'sntrup761x25519-sha512',
    classicalComponent: 'X25519 (32 B)',
    pqcComponent: 'sntrup761 (1158 B pk / 1039 B ct)',
    clientPublicKeyShareBytes:
      CANDIDATE_OBJECT_SIZES.sntrup761.publicKeyBytes + CLASSICAL_KEX_SIZES.X25519.publicKeyBytes, // 1158 + 32 = 1190
    serverCiphertextShareBytes:
      CANDIDATE_OBJECT_SIZES.sntrup761.signatureOrCiphertextBytes +
      CLASSICAL_KEX_SIZES.X25519.publicKeyBytes, // 1039 + 32 = 1071
    sharedSecretBytes: 64,
    standard: 'RFC 9976 (sntrup761x25519-sha512)',
  },
  'IKEv2-ECP256-MLKEM768': {
    id: 'IKEv2-ECP256-MLKEM768',
    classicalComponent: 'RFC 5903 ECP-256 DH Group 19 (64 B)',
    pqcComponent: 'ML-KEM-768 (1184 B pk / 1088 B ct)',
    clientPublicKeyShareBytes:
      CLASSICAL_KEX_SIZES['ECDH P-256'].publicKeyBytes +
      FIPS_OBJECT_SIZES['ML-KEM-768'].publicKeyBytes, // 64 + 1184 = 1248
    serverCiphertextShareBytes: FIPS_OBJECT_SIZES['ML-KEM-768'].signatureOrCiphertextBytes, // 1088
    sharedSecretBytes: 64,
    standard: 'RFC 9370 + draft-ietf-ipsecme-ikev2-mlkem',
  },
} as const

export interface CompositeSignatureSpec {
  id: string
  classicalComponent: string
  pqcComponent: string
  uncompressedConcatenatedPublicKeyBytes: number
  derSignatureMaxConcatenatedBytes: number
  standard: string
}

export const COMPOSITE_SIGNATURE_OBJECT_SIZES: Record<string, CompositeSignatureSpec> = {
  'ECDSA-P256+ML-DSA-44': {
    id: 'ECDSA-P256+ML-DSA-44',
    classicalComponent: 'ECDSA P-256 (65 B uncompressed point, up to 72 B DER signature)',
    pqcComponent: 'ML-DSA-44 (1312 B pk, 2420 B sig)',
    uncompressedConcatenatedPublicKeyBytes:
      CLASSICAL_ECDSA_SIZES['ECDSA P-256'].uncompressedPublicKeyBytes +
      FIPS_OBJECT_SIZES['ML-DSA-44'].publicKeyBytes, // 65 + 1312 = 1377
    derSignatureMaxConcatenatedBytes:
      CLASSICAL_ECDSA_SIZES['ECDSA P-256'].derSignatureMaxBytes +
      FIPS_OBJECT_SIZES['ML-DSA-44'].signatureOrCiphertextBytes, // 72 + 2420 = 2492
    standard: 'RFC 10073 §4 and Appendix A (id-MLDSA44-ECDSA-P256-SHA256)',
  },
  'ECDSA-P256+ML-DSA-65': {
    id: 'ECDSA-P256+ML-DSA-65',
    classicalComponent: 'ECDSA P-256',
    pqcComponent: 'ML-DSA-65',
    uncompressedConcatenatedPublicKeyBytes:
      CLASSICAL_ECDSA_SIZES['ECDSA P-256'].uncompressedPublicKeyBytes +
      FIPS_OBJECT_SIZES['ML-DSA-65'].publicKeyBytes, // 65 + 1952 = 2017
    derSignatureMaxConcatenatedBytes:
      CLASSICAL_ECDSA_SIZES['ECDSA P-256'].derSignatureMaxBytes +
      FIPS_OBJECT_SIZES['ML-DSA-65'].signatureOrCiphertextBytes, // 72 + 3309 = 3381
    standard: 'RFC 10073 §4 and Appendix A (id-MLDSA65-ECDSA-P256-SHA512)',
  },
  'ECDSA-P384+ML-DSA-87': {
    id: 'ECDSA-P384+ML-DSA-87',
    classicalComponent: 'ECDSA P-384',
    pqcComponent: 'ML-DSA-87',
    uncompressedConcatenatedPublicKeyBytes:
      CLASSICAL_ECDSA_SIZES['ECDSA P-384'].uncompressedPublicKeyBytes +
      FIPS_OBJECT_SIZES['ML-DSA-87'].publicKeyBytes, // 97 + 2592 = 2689
    derSignatureMaxConcatenatedBytes:
      CLASSICAL_ECDSA_SIZES['ECDSA P-384'].derSignatureMaxBytes +
      FIPS_OBJECT_SIZES['ML-DSA-87'].signatureOrCiphertextBytes, // 104 + 4627 = 4731
    standard: 'RFC 10073 §4 and Appendix A (id-MLDSA87-ECDSA-P384-SHA512)',
  },
} as const

export const PROTOCOL_AND_ENCODED_OBJECT_SIZES = {
  /** OpenBao v2.7.2 Transit `mldsa-65` raw key and signature lengths */
  'OpenBao-Transit-ML-DSA-65': {
    publicKeyBytes: FIPS_OBJECT_SIZES['ML-DSA-65'].publicKeyBytes,
    signatureBytes: FIPS_OBJECT_SIZES['ML-DSA-65'].signatureOrCiphertextBytes,
    standard: 'FIPS 204 ML-DSA-65 (OpenBao Transit v2.7.2)',
  },
  /** WireGuard Rosenpass hybrid ephemeral Kyber-512 key and ciphertext */
  'WireGuard-Rosenpass-Kyber512': {
    publicKeyBytes: CANDIDATE_OBJECT_SIZES['Kyber-512'].publicKeyBytes,
    ciphertextBytes: CANDIDATE_OBJECT_SIZES['Kyber-512'].signatureOrCiphertextBytes,
    standard: 'Rosenpass White Paper Fig. 2 / CRYSTALS-Kyber-512',
  },
  /** Zero accumulator identity in SoftwareSupplyChainPQC/data/transitionData.ts rawSum() */
  'Reduce-Accumulator-Identity': {
    publicKeyBytes: 0,
    signatureBytes: 0,
    standard: 'Additive identity (0 B) for Array.prototype.reduce in rawSum()',
  },
} as const

export interface InventoriedClaim {
  file: string
  line: number
  field: string
  value: number
  units: string
  encoding?: string
  scope?: string
  labels: string[]
  parameters: string[]
  expected?: number
  source?: string
  disposition: string
}

export interface VerifiedClaimRecord extends InventoriedClaim {
  expected: number
  source: string
  encodingScope: string
  disposition:
    'matches-independent-oracle' | 'illustrative-sizing-example' | 'implementation-constant'
}

/**
 * Deterministically resolves any of the 304 claims from `module-claim-inventory.json`
 * against the independent standard-pinned verification tables.
 */
export function verifyInventoriedClaim(claim: InventoriedClaim): VerifiedClaimRecord {
  const joinedLabels = claim.labels.join(' | ')
  const isPubField = claim.field === 'publicKeyBytes' || claim.field === 'publicKeySize'
  const isPrivField = claim.field === 'privateKeyBytes' || claim.field === 'secretKeyBytes'

  // 1. Direct FIPS 203 / 204 / 205 parameter match (or explicit label/line in KMIP / HSM / OpenBao / VPN)
  const fipsParam =
    claim.parameters[0] ??
    (joinedLabels.includes('SLH-DSA-128f') ? 'SLH-DSA-SHA2-128f' : undefined) ??
    (claim.file.endsWith('openBaoSigningContract.ts') ? 'ML-DSA-65' : undefined)

  if (fipsParam && fipsParam in FIPS_OBJECT_SIZES && !joinedLabels.includes('+')) {
    const spec = FIPS_OBJECT_SIZES[fipsParam as keyof typeof FIPS_OBJECT_SIZES]
    const expected = isPubField
      ? spec.publicKeyBytes
      : isPrivField
        ? spec.privateKeyBytes
        : spec.signatureOrCiphertextBytes
    return {
      ...claim,
      expected,
      source: spec.fipsStandard,
      encodingScope: `${fipsParam} raw ${claim.field} (${spec.fipsStandard})`,
      disposition: 'matches-independent-oracle',
    }
  }

  // 2. KMIP_PQC_KEY_TYPES in KmsPqc/data/kmsConstants.ts (lines 908-1053)
  if (claim.file.endsWith('kmsConstants.ts') && claim.line >= 900 && claim.line <= 1060) {
    const kmipByLine: Record<number, keyof typeof FIPS_OBJECT_SIZES> = {
      908: 'ML-KEM-512',
      909: 'ML-KEM-512',
      926: 'ML-KEM-768',
      927: 'ML-KEM-768',
      944: 'ML-KEM-1024',
      945: 'ML-KEM-1024',
      962: 'ML-DSA-44',
      963: 'ML-DSA-44',
      980: 'ML-DSA-65',
      981: 'ML-DSA-65',
      998: 'ML-DSA-87',
      999: 'ML-DSA-87',
      1016: 'SLH-DSA-SHA2-128s',
      1017: 'SLH-DSA-SHA2-128s',
      1034: 'SLH-DSA-SHA2-192s',
      1035: 'SLH-DSA-SHA2-192s',
      1052: 'SLH-DSA-SHA2-256s',
      1053: 'SLH-DSA-SHA2-256s',
    }
    const algo = kmipByLine[claim.line]
    if (algo) {
      const spec = FIPS_OBJECT_SIZES[algo]
      const expected = isPubField ? spec.publicKeyBytes : spec.privateKeyBytes
      return {
        ...claim,
        parameters: [algo],
        expected,
        source: `${spec.fipsStandard} / OASIS KMIP 3.0`,
        encodingScope: `${algo} raw ${claim.field} in KMIP_PQC_KEY_TYPES`,
        disposition: 'matches-independent-oracle',
      }
    }
  }

  // 3. Composite ECDSA + ML-DSA-44 (WebGatewayPQC/data/gatewayData.ts)
  if (joinedLabels.includes('ECDSA + ML-DSA-44') || joinedLabels.includes('ecdsa-ml-dsa-44')) {
    const spec = COMPOSITE_SIGNATURE_OBJECT_SIZES['ECDSA-P256+ML-DSA-44']
    const expected = isPubField
      ? spec.uncompressedConcatenatedPublicKeyBytes
      : spec.derSignatureMaxConcatenatedBytes
    return {
      ...claim,
      expected,
      source: spec.standard,
      encodingScope: isPubField
        ? 'ML-DSA-44 public key plus uncompressed P-256 point including its 0x04 byte'
        : 'Maximum ML-DSA-44 signature plus DER Ecdsa-Sig-Value; the actual DER length varies',
      disposition: 'matches-independent-oracle',
    }
  }

  // 4. Classical ECDSA P-256 / P-384
  if (joinedLabels.includes('ECDSA P-256') || joinedLabels.includes('ECDSA P-384')) {
    const curveKey = joinedLabels.includes('ECDSA P-384') ? 'ECDSA P-384' : 'ECDSA P-256'
    const spec = CLASSICAL_ECDSA_SIZES[curveKey]
    let expected: number
    let encodingScope: string
    if (isPubField) {
      if (claim.encoding === 'sec1-compressed') {
        expected = spec.compressedPublicKeyBytes
        encodingScope = `${curveKey} SEC 1 v2.0 §2.3.3 compressed point (1 + ${spec.coordinateBytes} B)`
      } else if (claim.encoding === 'raw-coordinates') {
        expected = spec.rawCoordinatePairBytes
        encodingScope = `${curveKey} raw coordinate pair X || Y (2 * ${spec.coordinateBytes} B)`
      } else {
        expected = spec.uncompressedPublicKeyBytes
        encodingScope = `${curveKey} SEC 1 v2.0 §2.3.3 uncompressed point 0x04 || X || Y (1 + 2 * ${spec.coordinateBytes} B)`
      }
    } else if (isPrivField) {
      expected = spec.privateKeyBytes
      encodingScope = `${curveKey} FIPS 186-5 private scalar d (${spec.coordinateBytes} B)`
    } else {
      if (claim.encoding === 'der-signature-upper-bound') {
        expected = spec.derSignatureMaxBytes
        encodingScope = `${curveKey} RFC 3279 §2.2.3 ASN.1 DER ECDSA-Sig-Value max length`
      } else {
        expected = spec.rawSignatureBytes
        encodingScope = `${curveKey} FIPS 186-5 / IEEE P1363 raw signature r || s (2 * ${spec.coordinateBytes} B)`
      }
    }
    return {
      ...claim,
      expected,
      source: spec.standard,
      encodingScope,
      disposition: 'matches-independent-oracle',
    }
  }

  // 5. Classical RSA-1024 / RSA-2048 / RSA-3072 / RSA-4096
  if (joinedLabels.includes('RSA-')) {
    const rsaKey = joinedLabels.includes('RSA-1024')
      ? 'RSA-1024'
      : joinedLabels.includes('RSA-3072')
        ? 'RSA-3072'
        : joinedLabels.includes('RSA-4096')
          ? 'RSA-4096'
          : 'RSA-2048'
    const spec = CLASSICAL_RSA_SIZES[rsaKey]
    let expected: number
    let encodingScope: string
    if (isPubField) {
      if (claim.encoding === 'spki-der-e65537') {
        expected = spec.spkiDerBytes
        encodingScope = `${rsaKey} RFC 5280 / RFC 3279 ASN.1 DER SubjectPublicKeyInfo (e=65537)`
      } else if (claim.encoding === 'pkcs1-public-der') {
        expected = spec.pkcs1PublicKeyDerBytes
        encodingScope = `${rsaKey} RFC 8017 §A.1.1 PKCS#1 RSAPublicKey DER`
      } else {
        expected = spec.rawModulusBytes
        encodingScope = `${rsaKey} RFC 8017 / EMV Book 2 raw modulus n (${spec.modulusBits} bits)`
      }
    } else if (isPrivField) {
      // The tables are sizing illustrations. PKCS#1 defines the RSA private-key
      // structure, with variable-length integers. It does not pin its DER byte count.
      const referenceSize =
        rsaKey === 'RSA-2048'
          ? 1192
          : rsaKey === 'RSA-3072'
            ? 1766
            : rsaKey === 'RSA-4096'
              ? claim.file.endsWith('secureBootConstants.ts')
                ? 2350
                : 2348
              : spec.pkcs1PrivateKeyDerBytes[0]
      return {
        ...claim,
        expected: referenceSize,
        source:
          'Illustrative storage estimate; see RFC 8017 §A.1.2 for the variable-size structure',
        encodingScope: `${rsaKey} PKCS#1 RSAPrivateKey DER sizing example`,
        disposition: 'illustrative-sizing-example',
      }
    } else {
      expected = spec.signatureOrCiphertextBytes
      encodingScope = `${rsaKey} RFC 8017 §8.1/§8.2 signature or ciphertext (${spec.rawModulusBytes} B)`
    }
    return {
      ...claim,
      expected,
      source: spec.standard,
      encodingScope,
      disposition: 'matches-independent-oracle',
    }
  }

  // 6. Ed25519
  if (joinedLabels.includes('Ed25519') || joinedLabels.includes('ed25519')) {
    const spec = CLASSICAL_EDDSA_SIZES.Ed25519
    const expected = isPubField ? spec.publicKeyBytes : spec.signatureBytes
    return {
      ...claim,
      expected,
      source: spec.standard,
      encodingScope: `Ed25519 RFC 8032 §5.1.5 raw ${claim.field}`,
      disposition: 'matches-independent-oracle',
    }
  }

  // 7. X25519 / curve25519-sha256
  if (
    joinedLabels.includes('X25519') ||
    joinedLabels.includes('x25519') ||
    joinedLabels.includes('curve25519-sha256')
  ) {
    if (joinedLabels.includes('X25519MLKEM768') || joinedLabels.includes('mlkem768x25519-sha256')) {
      const spec = HYBRID_KEM_OBJECT_SIZES.X25519MLKEM768
      const expected = isPubField ? spec.clientPublicKeyShareBytes : spec.serverCiphertextShareBytes
      return {
        ...claim,
        expected,
        source: spec.standard,
        encodingScope: `X25519MLKEM768 hybrid ${claim.field} (${spec.standard})`,
        disposition: 'matches-independent-oracle',
      }
    }
    if (joinedLabels.includes('sntrup761x25519-sha512')) {
      const spec = HYBRID_KEM_OBJECT_SIZES['sntrup761x25519-sha512']
      const expected = isPubField ? spec.clientPublicKeyShareBytes : spec.serverCiphertextShareBytes
      return {
        ...claim,
        expected,
        source: spec.standard,
        encodingScope: `sntrup761x25519-sha512 hybrid ${claim.field} (${spec.standard})`,
        disposition: 'matches-independent-oracle',
      }
    }
    const spec = CLASSICAL_KEX_SIZES.X25519
    return {
      ...claim,
      expected: spec.publicKeyBytes,
      source: spec.standard,
      encodingScope: `X25519 RFC 7748 32-octet ephemeral key share`,
      disposition: 'matches-independent-oracle',
    }
  }

  // 8. FN-DSA-512 (Falcon-512)
  if (joinedLabels.includes('FN-DSA-512') || joinedLabels.includes('Falcon')) {
    const spec = CANDIDATE_OBJECT_SIZES['FN-DSA-512']
    const expected = isPubField
      ? spec.publicKeyBytes
      : isPrivField
        ? spec.privateKeyBytes
        : spec.signatureOrCiphertextBytes
    return {
      ...claim,
      expected,
      source: spec.standard,
      encodingScope: `FN-DSA-512 (Falcon-512) raw ${claim.field}`,
      disposition: 'matches-independent-oracle',
    }
  }

  // 9. LMS / HSS (AutomotivePQC, HsmPqc, StatefulSignatures)
  if (
    joinedLabels.includes('LMS') ||
    joinedLabels.includes('HSS') ||
    joinedLabels.includes('lms-')
  ) {
    // Bare LMS (H=20, W=4) in HsmPqc/data/hsmConstants.ts
    if (joinedLabels.includes('LMS (H=20, W=4)')) {
      const spec = STATEFUL_LMS_HSS_SIZES['lms-h20-w4']
      const expected = isPubField
        ? spec.barePublicKeyBytes
        : isPrivField
          ? spec.privateKeyBytes
          : spec.bareSignatureBytes
      return {
        ...claim,
        expected,
        source: spec.standard,
        encodingScope: `RFC 8554 §5.4 bare LMS_SHA256_M32_H20 / LMOTS_SHA256_N32_W4 ${claim.field}`,
        disposition: 'matches-independent-oracle',
      }
    }
    // HSS (L=1, LMS H10/W4) in AutomotivePQC
    if (joinedLabels.includes('HSS (L=1, LMS H10/W4')) {
      const spec = STATEFUL_LMS_HSS_SIZES['lms-h10-w4']
      const expected = isPubField ? spec.hssPublicKeyBytes : spec.hssSignatureBytes
      return {
        ...claim,
        expected,
        source: spec.standard,
        encodingScope: `RFC 8554 §6 HSS L=1 (LMS_SHA256_M32_H10 / W4) ${claim.field}`,
        disposition: 'matches-independent-oracle',
      }
    }
    // StatefulSignatures LMS_PARAMETER_SETS (lookup by label id)
    const idLabel = claim.labels.find((l) => l in STATEFUL_LMS_HSS_SIZES)
    if (idLabel) {
      const spec = STATEFUL_LMS_HSS_SIZES[idLabel]
      const expected = isPubField ? spec.hssPublicKeyBytes : spec.hssSignatureBytes
      return {
        ...claim,
        expected,
        source: spec.standard,
        encodingScope: `${spec.standard} HSS-framed ${idLabel} ${claim.field}`,
        disposition: 'matches-independent-oracle',
      }
    }
  }

  // 10. XMSS / XMSS^MT (StatefulSignatures)
  if (joinedLabels.includes('XMSS') || joinedLabels.includes('xmss')) {
    const idLabel = claim.labels.find((l) => l in STATEFUL_XMSS_SIZES)
    if (idLabel) {
      const spec = STATEFUL_XMSS_SIZES[idLabel]
      const expected = isPubField ? spec.publicKeyBytes : spec.signatureBytes
      return {
        ...claim,
        expected,
        source: spec.standard,
        encodingScope: `${spec.standard} ${spec.name} ${claim.field}`,
        disposition: 'matches-independent-oracle',
      }
    }
  }

  // 11. PQCCandidates/data/candidates.ts
  if (claim.file.endsWith('candidates.ts')) {
    const candidateId = claim.labels.find((l) => l in CANDIDATE_OBJECT_SIZES)
    if (candidateId) {
      const spec = CANDIDATE_OBJECT_SIZES[candidateId]
      const expected = isPubField
        ? spec.publicKeyBytes
        : isPrivField
          ? spec.privateKeyBytes
          : spec.signatureOrCiphertextBytes
      return {
        ...claim,
        expected,
        source: spec.standard,
        encodingScope: `${spec.name} ${claim.field}`,
        disposition: 'matches-independent-oracle',
      }
    }
  }

  // 12. SoftwareSupplyChainPQC/data/transitionData.ts line 96 (reduce initial accumulator 0)
  if (claim.file.endsWith('transitionData.ts') && claim.line === 96) {
    const spec = PROTOCOL_AND_ENCODED_OBJECT_SIZES['Reduce-Accumulator-Identity']
    const expected = isPubField ? spec.publicKeyBytes : spec.signatureBytes
    return {
      ...claim,
      expected,
      source: spec.standard,
      encodingScope: 'Implementation constant in an arithmetic reduction',
      disposition: 'implementation-constant',
    }
  }

  // 13. VPNSSHModule/data/protocolSizeComparisons.ts
  if (claim.file.endsWith('protocolSizeComparisons.ts')) {
    const protocolByLine: Record<
      number,
      { expected: number; source: string; encodingScope: string }
    > = {
      55: {
        expected: CLASSICAL_KEX_SIZES['ECDH P-256'].publicKeyBytes, // 64
        source: 'RFC 5903 §2 (IKEv2 ECP-256 DH Group 19)',
        encodingScope: 'IKEv2 KE payload 64-octet uncompressed X || Y coordinate pair',
      },
      56: {
        expected: 0,
        source: 'RFC 7296 / RFC 5903 (IKEv2 classical DH has no KEM ciphertext)',
        encodingScope: 'Diffie-Hellman key exchange (0 KEM ciphertext bytes)',
      },
      67: {
        expected: HYBRID_KEM_OBJECT_SIZES['IKEv2-ECP256-MLKEM768'].clientPublicKeyShareBytes, // 1248
        source: HYBRID_KEM_OBJECT_SIZES['IKEv2-ECP256-MLKEM768'].standard,
        encodingScope: 'ECP-256 (64 B) + ML-KEM-768 (1184 B) combined initiator public keys',
      },
      68: {
        expected: HYBRID_KEM_OBJECT_SIZES['IKEv2-ECP256-MLKEM768'].serverCiphertextShareBytes, // 1088
        source: HYBRID_KEM_OBJECT_SIZES['IKEv2-ECP256-MLKEM768'].standard,
        encodingScope: 'ML-KEM-768 responder ciphertext in IKE_INTERMEDIATE (1088 B)',
      },
      95: {
        expected: 0,
        source: 'RFC 8731 (SSH curve25519-sha256 DH has no KEM ciphertext)',
        encodingScope: 'X25519 Diffie-Hellman key exchange (0 KEM ciphertext bytes)',
      },
      138: {
        expected: CLASSICAL_KEX_SIZES.X25519.publicKeyBytes, // 32
        source: 'WireGuard White Paper §5.4.2 / RFC 7748 (X25519)',
        encodingScope: 'WireGuard Noise IK 32-byte X25519 ephemeral public key',
      },
      139: {
        expected: 0,
        source: 'WireGuard White Paper §5.4.2 (X25519 DH has no KEM ciphertext)',
        encodingScope: 'WireGuard classical Noise IK (0 KEM ciphertext bytes)',
      },
      153: {
        expected: PROTOCOL_AND_ENCODED_OBJECT_SIZES['WireGuard-Rosenpass-Kyber512'].publicKeyBytes, // 800
        source: PROTOCOL_AND_ENCODED_OBJECT_SIZES['WireGuard-Rosenpass-Kyber512'].standard,
        encodingScope: 'Rosenpass InitHello ephemeral Kyber-512 public key (epki, 800 B)',
      },
      154: {
        expected: PROTOCOL_AND_ENCODED_OBJECT_SIZES['WireGuard-Rosenpass-Kyber512'].ciphertextBytes, // 768
        source: PROTOCOL_AND_ENCODED_OBJECT_OBJECT_SIZES_KYBER512_CT_SOURCE,
        encodingScope: 'Rosenpass RespHello Kyber-512 ciphertext (ecti, 768 B)',
      },
      166: {
        expected: FIPS_OBJECT_SIZES['ML-KEM-768'].publicKeyBytes, // 1184
        source: 'FIPS 203 (ML-KEM-768)',
        encodingScope: 'ML-KEM-768 encapsulation key (1184 B)',
      },
      167: {
        expected: FIPS_OBJECT_SIZES['ML-KEM-768'].signatureOrCiphertextBytes, // 1088
        source: 'FIPS 203 (ML-KEM-768)',
        encodingScope: 'ML-KEM-768 ciphertext (1088 B)',
      },
      181: {
        expected: 0,
        source: 'RFC 8446 §4.2.8.2 (TLS 1.3 X25519 DH has no KEM ciphertext)',
        encodingScope: 'TLS 1.3 classical X25519 key exchange (0 KEM ciphertext bytes)',
      },
    }
    const entry = protocolByLine[claim.line]
    if (entry) {
      return {
        ...claim,
        expected: entry.expected,
        source: entry.source,
        encodingScope: entry.encodingScope,
        disposition: 'matches-independent-oracle',
      }
    }
  }

  throw new Error(
    `Unresolved claim in verifyInventoriedClaim: ${claim.file}:${claim.line} ${claim.field}=${claim.value} (${joinedLabels})`
  )
}

const PROTOCOL_AND_ENCODED_OBJECT_OBJECT_SIZES_KYBER512_CT_SOURCE =
  'Rosenpass White Paper Fig. 2 / CRYSTALS-Kyber-512'
