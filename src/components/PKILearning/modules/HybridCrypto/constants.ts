// SPDX-License-Identifier: GPL-3.0-only
export interface HybridAlgorithmInfo {
  name: string
  type: 'classical' | 'pqc' | 'hybrid'
  category: 'kem' | 'signature'
  opensslAlgorithm: string
  publicKeyBytes: number
  privateKeyBytes: number
  ciphertextOrSigBytes: number
  nistLevel: number | null
  description: string
}

export const HYBRID_ALGORITHMS: HybridAlgorithmInfo[] = [
  // Classical KEMs
  {
    name: 'X25519',
    type: 'classical',
    category: 'kem',
    opensslAlgorithm: 'X25519',
    publicKeyBytes: 32,
    privateKeyBytes: 32,
    ciphertextOrSigBytes: 32,
    nistLevel: null,
    description: 'Curve25519 ECDH — quantum-vulnerable.',
  },
  {
    name: 'ECDH P-256',
    type: 'classical',
    category: 'kem',
    opensslAlgorithm: 'EC',
    publicKeyBytes: 65,
    privateKeyBytes: 32,
    ciphertextOrSigBytes: 65,
    nistLevel: null,
    description: 'NIST P-256 ECDH — quantum-vulnerable.',
  },
  // PQC KEMs
  {
    name: 'ML-KEM-768',
    type: 'pqc',
    category: 'kem',
    opensslAlgorithm: 'ML-KEM-768',
    publicKeyBytes: 1184,
    privateKeyBytes: 2400,
    ciphertextOrSigBytes: 1088,
    nistLevel: 3,
    description: 'FIPS 203 lattice-based KEM. Recommended general-purpose.',
  },
  // Hybrid KEMs
  {
    name: 'X25519MLKEM768',
    type: 'hybrid',
    category: 'kem',
    opensslAlgorithm: 'SIMULATED',
    publicKeyBytes: 1216,
    privateKeyBytes: 2432,
    ciphertextOrSigBytes: 1120,
    nistLevel: 3,
    description: 'X25519 + ML-KEM-768 hybrid. Simulated via separate operations + HKDF.',
  },
  // Classical signatures
  {
    name: 'ECDSA P-256',
    type: 'classical',
    category: 'signature',
    opensslAlgorithm: 'EC',
    publicKeyBytes: 65,
    privateKeyBytes: 32,
    ciphertextOrSigBytes: 72,
    nistLevel: null,
    description: 'NIST P-256 ECDSA — quantum-vulnerable.',
  },
  // PQC signatures
  {
    name: 'ML-DSA-65',
    type: 'pqc',
    category: 'signature',
    opensslAlgorithm: 'ML-DSA-65',
    publicKeyBytes: 1952,
    privateKeyBytes: 4032,
    ciphertextOrSigBytes: 3309,
    nistLevel: 3,
    description: 'FIPS 204 lattice-based signature. Recommended general-purpose.',
  },
]

export type HybridFormatId =
  | 'pure-pqc'
  | 'pure-pqc-slh'
  | 'composite'
  | 'related-certs'
  | 'chameleon'

export interface HybridCertFormat {
  id: HybridFormatId
  label: string
  shortLabel: string
  approach: string
  standard: string
  standardUrl: string
  oids: string[]
  status: 'Published' | 'IETF Last Call' | 'Active Draft' | 'Informational'
  statusColor: string
  quantumSafe: boolean
  legacyCompat: boolean
  description: string
  structureLines: Array<{
    text: string
    color: 'muted' | 'success' | 'primary' | 'secondary' | 'foreground' | 'warning'
    indent: number
  }>
  educationalNote: string
  classicalAlg: string | null
  pqcAlg: string
}

export const HYBRID_CERT_FORMATS: HybridCertFormat[] = [
  {
    id: 'pure-pqc',
    label: 'Pure PQC (ML-DSA-65)',
    shortLabel: 'Pure PQC',
    approach: 'Single PQC algorithm',
    standard: 'RFC 9881',
    standardUrl: 'https://datatracker.ietf.org/doc/rfc9881/',
    oids: ['2.16.840.1.101.3.4.3.18'],
    status: 'Published',
    statusColor: 'success',
    quantumSafe: true,
    legacyCompat: false,
    description: 'Standard X.509 certificate using ML-DSA-65 as the sole algorithm.',
    structureLines: [
      { text: 'Certificate ::= SEQUENCE {', color: 'foreground', indent: 0 },
      { text: 'tbsCertificate      TBSCertificate,', color: 'muted', indent: 1 },
      {
        text: 'signatureAlgorithm  ML-DSA-65 (2.16.840.1.101.3.4.3.18),',
        color: 'success',
        indent: 1,
      },
      { text: 'signatureValue      BIT STRING (3309 bytes)', color: 'success', indent: 1 },
      { text: '}', color: 'foreground', indent: 0 },
    ],
    educationalNote:
      'Pure PQC certificates are the simplest approach — a direct replacement of classical algorithms. However, they break backward compatibility since legacy validators cannot process ML-DSA-65. ANSSI recommends hybrid approaches until PQC algorithms have matured through extended cryptanalysis.',
    classicalAlg: null,
    pqcAlg: 'ML-DSA-65',
  },
  {
    id: 'pure-pqc-slh',
    label: 'Pure PQC (SLH-DSA-128s)',
    shortLabel: 'SLH-DSA',
    approach: 'Single PQC algorithm (hash-based)',
    standard: 'RFC 9909',
    standardUrl: 'https://datatracker.ietf.org/doc/rfc9909/',
    oids: ['2.16.840.1.101.3.4.3.20'],
    status: 'Published',
    statusColor: 'success',
    quantumSafe: true,
    legacyCompat: false,
    description:
      'X.509 using SLH-DSA-128s — hash-based signature safe against both quantum and mathematical breakthroughs.',
    structureLines: [
      { text: 'Certificate ::= SEQUENCE {', color: 'foreground', indent: 0 },
      { text: 'tbsCertificate      TBSCertificate,', color: 'muted', indent: 1 },
      {
        text: 'signatureAlgorithm  SLH-DSA-SHA2-128s (2.16.840.1.101.3.4.3.20),',
        color: 'success',
        indent: 1,
      },
      { text: 'signatureValue      BIT STRING (7856 bytes)', color: 'success', indent: 1 },
      { text: '}', color: 'foreground', indent: 0 },
    ],
    educationalNote:
      'SLH-DSA (SPHINCS+) uses hash-based constructions with no lattice assumptions. ANSSI allows standalone use of hash-based signatures (SLH-DSA, LMS, XMSS) even without hybrid mode, since their security relies only on hash function properties.',
    classicalAlg: null,
    pqcAlg: 'SLH-DSA-128s',
  },
  {
    id: 'composite',
    label: 'Composite (ML-DSA-65 + ECDSA)',
    shortLabel: 'Composite',
    approach: 'Single composite OID',
    standard: 'draft-ietf-lamps-pq-composite-sigs-14',
    standardUrl: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/',
    oids: ['1.3.6.1.5.5.7.6.45'],
    status: 'IETF Last Call',
    statusColor: 'primary',
    quantumSafe: true,
    legacyCompat: false,
    description:
      'Both classical and PQC keys/signatures under a single composite OID. Both must verify.',
    structureLines: [
      { text: 'Certificate ::= SEQUENCE {', color: 'foreground', indent: 0 },
      { text: 'tbsCertificate      TBSCertificate {', color: 'muted', indent: 1 },
      { text: 'subjectPublicKeyInfo  CompositePublicKey {', color: 'primary', indent: 2 },
      { text: 'ecPublicKey         EC P-256 (65 bytes)', color: 'warning', indent: 3 },
      { text: 'mldsaPublicKey      ML-DSA-65 (1952 bytes)', color: 'success', indent: 3 },
      { text: '}', color: 'primary', indent: 2 },
      { text: '}', color: 'muted', indent: 1 },
      {
        text: 'signatureAlgorithm  MLDSA65-ECDSA-P256 (1.3.6.1.5.5.7.6.45),',
        color: 'primary',
        indent: 1,
      },
      { text: 'signatureValue      CompositeSignature {', color: 'primary', indent: 1 },
      { text: 'ecdsaSignature      ECDSA (72 bytes)', color: 'warning', indent: 2 },
      { text: 'mldsaSignature      ML-DSA-65 (3309 bytes)', color: 'success', indent: 2 },
      { text: '}', color: 'primary', indent: 1 },
      { text: '}', color: 'foreground', indent: 0 },
    ],
    educationalNote:
      'Composite certificates bind both algorithms under a single OID — the strongest security model since both signatures MUST verify. However, legacy validators cannot process composite OIDs. OpenSSL 3.6.0 does not yet support composite OIDs natively; this demo generates component certs separately to illustrate the structure.',
    classicalAlg: 'EC',
    pqcAlg: 'ML-DSA-65',
  },
  {
    id: 'related-certs',
    label: 'Related Certificates (RFC 9763)',
    shortLabel: 'Related',
    approach: 'Paired certificates with binding hash',
    standard: 'RFC 9763',
    standardUrl: 'https://datatracker.ietf.org/doc/rfc9763/',
    oids: ['1.3.6.1.5.5.7.1.35'],
    status: 'Published',
    statusColor: 'success',
    quantumSafe: true,
    legacyCompat: true,
    description:
      'Two independent certificates bound by a RelatedCertificate extension containing a hash of the partner certificate.',
    structureLines: [
      { text: 'Certificate A (Classical) ::= SEQUENCE {', color: 'warning', indent: 0 },
      { text: 'tbsCertificate {', color: 'muted', indent: 1 },
      { text: 'extensions: RelatedCertificate {', color: 'primary', indent: 2 },
      { text: 'sha256(CertificateB) → binding hash', color: 'primary', indent: 3 },
      { text: '}', color: 'primary', indent: 2 },
      { text: '}', color: 'muted', indent: 1 },
      { text: 'signatureAlgorithm  ecdsa-with-SHA256', color: 'warning', indent: 1 },
      { text: '}', color: 'warning', indent: 0 },
      { text: '', color: 'muted', indent: 0 },
      { text: 'Certificate B (PQC) ::= SEQUENCE {', color: 'success', indent: 0 },
      { text: 'tbsCertificate {', color: 'muted', indent: 1 },
      { text: 'extensions: RelatedCertificate {', color: 'primary', indent: 2 },
      { text: 'sha256(CertificateA) → binding hash', color: 'primary', indent: 3 },
      { text: '}', color: 'primary', indent: 2 },
      { text: '}', color: 'muted', indent: 1 },
      { text: 'signatureAlgorithm  ML-DSA-65', color: 'success', indent: 1 },
      { text: '}', color: 'success', indent: 0 },
    ],
    educationalNote:
      'The "catalyst" approach (RFC 9763, developed by NSA) — each certificate is independently valid. Legacy systems validate the classical cert; PQC-aware systems verify both and check the binding hash. This provides backward compatibility without modifying existing PKI infrastructure.',
    classicalAlg: 'EC',
    pqcAlg: 'ML-DSA-65',
  },
  {
    id: 'chameleon',
    label: 'Chameleon Certificates',
    shortLabel: 'Chameleon',
    approach: 'Delta extension embedding',
    standard: 'draft-bonnell-lamps-chameleon-certs-07',
    standardUrl: 'https://datatracker.ietf.org/doc/draft-bonnell-lamps-chameleon-certs/',
    oids: ['2.16.840.1.114027.80.6.1'],
    status: 'Active Draft',
    statusColor: 'warning',
    quantumSafe: true,
    legacyCompat: true,
    description:
      'A single certificate with a DeltaCertificateDescriptor extension that encodes the differences needed to reconstruct a classical partner certificate.',
    structureLines: [
      { text: 'Certificate (Primary — PQC) ::= SEQUENCE {', color: 'success', indent: 0 },
      { text: 'tbsCertificate {', color: 'muted', indent: 1 },
      { text: 'subjectPublicKeyInfo  ML-DSA-65', color: 'success', indent: 2 },
      { text: 'extensions: DeltaCertificateDescriptor {', color: 'primary', indent: 2 },
      { text: '// Differences from the paired classical cert:', color: 'muted', indent: 3 },
      { text: 'serialNumber        (if different)', color: 'warning', indent: 3 },
      { text: 'signature           ecdsa-with-SHA256', color: 'warning', indent: 3 },
      { text: 'subjectPublicKeyInfo  EC P-256', color: 'warning', indent: 3 },
      { text: 'extensions          (delta extensions)', color: 'warning', indent: 3 },
      { text: 'signatureValue      ECDSA signature', color: 'warning', indent: 3 },
      { text: '}', color: 'primary', indent: 2 },
      { text: '}', color: 'muted', indent: 1 },
      { text: 'signatureAlgorithm  ML-DSA-65', color: 'success', indent: 1 },
      { text: '}', color: 'success', indent: 0 },
    ],
    educationalNote:
      'Chameleon certificates (backed by DigiCert and Entrust) are more space-efficient than related certs — only one certificate is transmitted. PQC-aware clients use the primary ML-DSA cert directly. Legacy clients extract the DeltaCertificateDescriptor extension and reconstruct the classical ECDSA cert from it.',
    classicalAlg: 'EC',
    pqcAlg: 'ML-DSA-65',
  },
]

export const KEY_GEN_COMMANDS: Record<string, string[]> = {
  X25519: ['openssl genpkey -algorithm X25519 -out x25519_key.pem'],
  EC: ['openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out ec_key.pem'],
  'ML-KEM-768': ['openssl genpkey -algorithm ML-KEM-768 -out mlkem768_key.pem'],
  X25519MLKEM768: [
    'openssl genpkey -algorithm X25519 -out x25519_key.pem',
    'openssl genpkey -algorithm ML-KEM-768 -out mlkem768_key.pem',
  ],
  'ML-DSA-65': ['openssl genpkey -algorithm ML-DSA-65 -out mldsa65_key.pem'],
}
