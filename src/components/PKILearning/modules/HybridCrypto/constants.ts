// SPDX-License-Identifier: GPL-3.0-only

// ── Hybrid Signature Spectrum (IETF draft-ietf-pquip-hybrid-signature-spectrums) ──

import type { CompositeProfileDraft19 } from './services/certBuilder'

export type NonSeparabilityLevel = 'none' | 'wns' | 'sns'
export type HybridSigConstruction = 'concatenation' | 'nesting' | 'fused'

export interface HybridSignatureModel {
  id: string
  name: string
  construction: HybridSigConstruction
  nonSeparability: NonSeparabilityLevel
  components: string[]
  tagline: string
  description: string
  reference: string
  referenceUrl: string
  separable: boolean
  backwardsCompatible: boolean
}

export const HYBRID_SIGNATURE_MODELS: HybridSignatureModel[] = [
  {
    id: 'concatenation',
    name: 'Concatenation',
    construction: 'concatenation',
    nonSeparability: 'none',
    components: ['EC-Schnorr (secp256k1)', 'ML-DSA-65'],
    tagline: 'sig₁ ‖ sig₂',
    description:
      'Two independent signatures concatenated. Either component verifies alone. Easiest to implement and most backwards-compatible, but provides no protection against separability attacks.',
    reference: 'IETF draft §1.3.3',
    referenceUrl: 'https://datatracker.ietf.org/doc/draft-ietf-pquip-hybrid-signature-spectrums/',
    separable: true,
    backwardsCompatible: true,
  },
  {
    id: 'nesting',
    name: 'Nesting',
    construction: 'nesting',
    nonSeparability: 'wns',
    components: ['EC-Schnorr (secp256k1)', 'ML-DSA-65'],
    tagline: 'sign_ML(msg ‖ sig_EC)',
    description:
      'ML-DSA outer covers msg ‖ ecSig. Swapping the EC signature invalidates the outer layer. EC component still verifies alone — Weak Non-Separability (WNS).',
    reference: 'IETF draft §1.3.3',
    referenceUrl: 'https://datatracker.ietf.org/doc/draft-ietf-pquip-hybrid-signature-spectrums/',
    separable: true,
    backwardsCompatible: true,
  },
  {
    id: 'silithium',
    name: 'Silithium (Fused)',
    construction: 'fused',
    nonSeparability: 'sns',
    components: ['EC-Schnorr (secp256k1)', 'ML-DSA-65'],
    tagline: 'μ = H(R ‖ pk_ec ‖ pk_ml ‖ msg)',
    description:
      'Fused Fiat-Shamir: both components share a single challenge μ. Neither component verifies without the shared μ. Achieves Strong Non-Separability (SNS) with smaller signature than concatenation.',
    reference: 'ePrint 2025/2059',
    referenceUrl: 'https://eprint.iacr.org/2025/2059',
    separable: false,
    backwardsCompatible: false,
  },
]

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
  // Hybrid signatures
  {
    name: 'Silithium',
    type: 'hybrid',
    category: 'signature',
    opensslAlgorithm: 'FUSED',
    publicKeyBytes: 1952 + 33, // ML-DSA-65 + secp256k1 compressed
    privateKeyBytes: 4032 + 32, // ML-DSA-65 + secp256k1
    ciphertextOrSigBytes: 3309 + 33 + 32, // ML-DSA-65 sig + secp256k1 R + s = 3374
    nistLevel: 3,
    description:
      'EC-Schnorr (secp256k1) + ML-DSA-65 fused via adapted Fiat-Shamir. Strong Non-Separability. ePrint 2025/2059.',
  },
]

export type HybridFormatId =
  | 'pure-pqc'
  | 'pure-pqc-slh'
  | 'composite'
  | 'alt-sig'
  | 'related-certs'
  | 'chameleon'
  | 'pure-pqc-kem'
  | 'composite-kem'

/** Static Tailwind badge classes by status color — avoids dynamic class purging */
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  success: 'bg-success/10 text-success border-success/20',
  primary: 'bg-primary/10 text-primary border-primary/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  muted: 'bg-muted/10 text-muted-foreground border-border',
}

/** Static Tailwind text classes for ASN.1 structure lines — avoids purging of dynamic text-${color} */
export const STRUCTURE_LINE_COLOR_CLASSES: Record<string, string> = {
  foreground: 'text-foreground',
  muted: 'text-muted-foreground',
  success: 'text-success',
  primary: 'text-primary',
  secondary: 'text-secondary',
  warning: 'text-warning',
}

/**
 * Where a format is shown. 'current' formats make up the main comparison and
 * Generate All. 'historical' formats (expired or abandoned designs) render in a
 * separate section, are never generated by Generate All, and are never
 * recommended for new deployments.
 */
export type HybridCertFormatGroup = 'current' | 'historical'

export interface HybridCertFormat {
  id: HybridFormatId
  group: HybridCertFormatGroup
  label: string
  shortLabel: string
  approach: string
  standard: string
  standardUrl: string
  oids: string[]
  status:
    | 'Published'
    | 'RFC Editor Queue'
    | 'IESG Evaluation'
    | 'IETF Last Call'
    | 'AD Evaluation'
    | 'Active Draft'
    | 'Expired Draft'
    | 'Informational'
  statusColor: string
  /** Whether the format is quantum-safe. 'system' = only quantum-safe as a multi-cert system. */
  quantumSafe: boolean | 'system'
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
    group: 'current',
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
    description:
      'An ML-DSA-65 end-entity certificate issued by an ML-DSA-65 workshop CA — ML-DSA is the only algorithm in the chain.',
    structureLines: [
      { text: 'Certificate ::= SEQUENCE {', color: 'foreground', indent: 0 },
      { text: 'tbsCertificate {', color: 'muted', indent: 1 },
      { text: 'issuer               Workshop CA (ML-DSA-65)', color: 'muted', indent: 2 },
      {
        text: 'subjectPublicKeyInfo ML-DSA-65 (2.16.840.1.101.3.4.3.18), no parameters',
        color: 'success',
        indent: 2,
      },
      { text: 'keyUsage (critical)  digitalSignature', color: 'success', indent: 2 },
      { text: 'basicConstraints (critical)  cA=FALSE', color: 'muted', indent: 2 },
      { text: '}', color: 'muted', indent: 1 },
      {
        text: 'signatureAlgorithm  ML-DSA-65 (2.16.840.1.101.3.4.3.18),',
        color: 'success',
        indent: 1,
      },
      {
        text: 'signatureValue      BIT STRING (3309 bytes, by the CA)',
        color: 'success',
        indent: 1,
      },
      { text: '}', color: 'foreground', indent: 0 },
    ],
    educationalNote:
      'Pure PQC certificates are the simplest approach — a direct replacement of classical algorithms. However, they break backward compatibility since legacy validators cannot process ML-DSA-65. ANSSI recommends hybrid approaches until PQC algorithms have matured through extended cryptanalysis.',
    classicalAlg: null,
    pqcAlg: 'ML-DSA-65',
  },
  {
    id: 'pure-pqc-slh',
    group: 'current',
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
      'X.509 using SLH-DSA-128s — a hash-based signature whose security rests only on hash-function properties, which diversifies away from lattice assumptions.',
    structureLines: [
      { text: 'Certificate ::= SEQUENCE {', color: 'foreground', indent: 0 },
      { text: 'tbsCertificate {', color: 'muted', indent: 1 },
      { text: 'issuer               Workshop CA (SLH-DSA-SHA2-128s)', color: 'muted', indent: 2 },
      {
        text: 'subjectPublicKeyInfo SLH-DSA-SHA2-128s, no parameters',
        color: 'success',
        indent: 2,
      },
      { text: 'keyUsage (critical)  digitalSignature', color: 'success', indent: 2 },
      { text: '}', color: 'muted', indent: 1 },
      {
        text: 'signatureAlgorithm  SLH-DSA-SHA2-128s (2.16.840.1.101.3.4.3.20),',
        color: 'success',
        indent: 1,
      },
      { text: 'signatureValue      BIT STRING (7856 bytes)', color: 'success', indent: 1 },
      { text: '}', color: 'foreground', indent: 0 },
    ],
    educationalNote:
      'SLH-DSA (SPHINCS+) uses hash-based constructions with no lattice assumptions. RFC 9909 (published December 2025) defines the X.509 profile, but CA/browser ecosystem adoption is still nascent — significantly behind ML-DSA (RFC 9881). ANSSI allows standalone use of hash-based signatures (SLH-DSA, LMS, XMSS) even without hybrid mode, since their security relies only on hash function properties.',
    classicalAlg: null,
    pqcAlg: 'SLH-DSA-128s',
  },
  {
    id: 'composite',
    group: 'current',
    label: 'Composite (ML-DSA-65 + ECDSA)',
    shortLabel: 'Composite',
    approach: 'Single composite OID',
    standard: 'draft-ietf-lamps-pq-composite-sigs-19',
    standardUrl: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/',
    oids: ['1.3.6.1.5.5.7.6.45'],
    status: 'RFC Editor Queue',
    statusColor: 'primary',
    quantumSafe: true,
    legacyCompat: false,
    description:
      'Both classical and PQC keys/signatures under a single composite OID, each stored as a raw concatenation with the ML-DSA component first. Both must verify.',
    structureLines: [
      { text: 'Certificate ::= SEQUENCE {', color: 'foreground', indent: 0 },
      { text: 'tbsCertificate      TBSCertificate {', color: 'muted', indent: 1 },
      { text: 'subjectPublicKeyInfo {', color: 'muted', indent: 2 },
      {
        text: 'algorithm         MLDSA65-ECDSA-P256-SHA512 (1.3.6.1.5.5.7.6.45)',
        color: 'primary',
        indent: 3,
      },
      {
        text: 'subjectPublicKey  BIT STRING (2017 bytes) — raw concatenation:',
        color: 'primary',
        indent: 3,
      },
      {
        text: 'mldsaPublicKey  ML-DSA-65 (1952 bytes)  ← ML-DSA FIRST',
        color: 'success',
        indent: 4,
      },
      { text: 'ecPublicKey     EC P-256  (65 bytes, X9.62)', color: 'warning', indent: 4 },
      { text: '}', color: 'muted', indent: 2 },
      { text: '}', color: 'muted', indent: 1 },
      {
        text: 'signatureAlgorithm  MLDSA65-ECDSA-P256-SHA512 (1.3.6.1.5.5.7.6.45),',
        color: 'primary',
        indent: 1,
      },
      {
        text: 'signatureValue      BIT STRING (~3,379 bytes = 3,309 + 64 + 6) — raw concatenation:',
        color: 'primary',
        indent: 1,
      },
      {
        text: 'mldsaSignature  ML-DSA-65 (3309 bytes)  ← ML-DSA FIRST',
        color: 'success',
        indent: 2,
      },
      { text: 'ecdsaSignature  ECDSA (70-72 bytes, DER)', color: 'warning', indent: 2 },
      { text: '}', color: 'foreground', indent: 0 },
      { text: '', color: 'muted', indent: 0 },
      {
        text: '// No ASN.1 SEQUENCE wraps the components — §5.1 puts the',
        color: 'muted',
        indent: 0,
      },
      {
        text: '// raw bytes straight into the BIT STRING. A verifier splits',
        color: 'muted',
        indent: 0,
      },
      { text: '// at the ML-DSA fixed length (FIPS 204).', color: 'muted', indent: 0 },
    ],
    educationalNote:
      "Composite certificates bind both algorithms under a single OID (1.3.6.1.5.5.7.6.45) and require both signatures to verify — if either fails, the certificate is rejected. Both the public key and the signature are RAW CONCATENATIONS with the ML-DSA component first (§4.1, §4.3); there is no ASN.1 wrapper, so a verifier splits at ML-DSA's fixed length. Both components sign a shared message representative M' = Prefix || Label || len(ctx) || ctx || PH(TBS), and ML-DSA takes the signature label as its FIPS 204 context — this is what prevents either half being stripped and reused. Legacy validators cannot process composite OIDs at all: composite is NOT backward compatible.",
    classicalAlg: 'EC',
    pqcAlg: 'ML-DSA-65',
  },
  {
    id: 'alt-sig',
    group: 'current',
    label: 'Alt-Sig / Catalyst (ECDSA + ML-DSA)',
    shortLabel: 'Alt-Sig',
    approach: 'PQC in X.509 extensions',
    standard: 'ITU-T X.509 (2019) §9.8',
    standardUrl: 'https://www.itu.int/rec/T-REC-X.509-201910-I/en',
    oids: ['2.5.29.72', '2.5.29.73', '2.5.29.74'],
    status: 'Published',
    statusColor: 'success',
    quantumSafe: true,
    legacyCompat: true,
    description:
      'A single classical certificate with PQC key and signature embedded in X.509 extension fields. Legacy verifiers process only the classical signature; PQC-aware verifiers check both.',
    structureLines: [
      { text: 'Certificate ::= SEQUENCE {', color: 'foreground', indent: 0 },
      { text: 'tbsCertificate {', color: 'muted', indent: 1 },
      { text: 'subjectPublicKeyInfo  EC P-256 (classical)', color: 'warning', indent: 2 },
      { text: 'extensions {', color: 'muted', indent: 2 },
      {
        text: 'SubjectAltPublicKeyInfo (2.5.29.72): ML-DSA-65 key',
        color: 'success',
        indent: 3,
      },
      {
        text: 'AltSignatureAlgorithm  (2.5.29.73): ML-DSA-65',
        color: 'success',
        indent: 3,
      },
      {
        text: 'AltSignatureValue      (2.5.29.74): ML-DSA-65 sig',
        color: 'success',
        indent: 3,
      },
      { text: '}', color: 'muted', indent: 2 },
      { text: '}', color: 'muted', indent: 1 },
      { text: 'signatureAlgorithm  ecdsa-with-SHA256', color: 'warning', indent: 1 },
      {
        text: 'signatureValue      ECDSA signature (DER Ecdsa-Sig-Value)',
        color: 'warning',
        indent: 1,
      },
      { text: '}', color: 'foreground', indent: 0 },
      { text: '', color: 'muted', indent: 0 },
      {
        text: '// The ML-DSA signature covers the TBSCertificate with BOTH',
        color: 'muted',
        indent: 0,
      },
      {
        text: '// the signature field and AltSignatureValue removed (§7.2.2).',
        color: 'muted',
        indent: 0,
      },
    ],
    educationalNote:
      'Alt-Sig (the alternative-signature extensions from ITU-T X.509 §9.8; ISARA marketed an implementation as "Catalyst") embeds a PQC public key and signature inside a classical certificate\'s X.509 extensions. Legacy validators ignore the unknown extensions and process only the classical ECDSA signature. PQC-aware verifiers can also check the alternative signature; their policy decides whether one or both must verify. This differs from Related Certificates (RFC 9763), which uses two separate independent certificates bound by a hash.',
    classicalAlg: 'EC',
    pqcAlg: 'ML-DSA-65',
  },
  {
    id: 'related-certs',
    group: 'current',
    label: 'Related Certificates (RFC 9763)',
    shortLabel: 'Related',
    approach: 'New certificate references an existing one',
    standard: 'RFC 9763',
    standardUrl: 'https://datatracker.ietf.org/doc/rfc9763/',
    oids: ['1.3.6.1.5.5.7.1.36'],
    status: 'Published',
    statusColor: 'success',
    quantumSafe: 'system',
    legacyCompat: true,
    description:
      'An existing classical certificate (Cert A) stays unchanged; a new PQC certificate (Cert B) carries a RelatedCertificate extension holding the hash of Cert A.',
    structureLines: [
      { text: 'Existing Cert A (ECDSA P-256) — never modified', color: 'warning', indent: 0 },
      { text: '│  hash of its complete final DER', color: 'primary', indent: 0 },
      { text: '▼', color: 'primary', indent: 0 },
      { text: 'New Cert B (ML-DSA-65) ::= SEQUENCE {', color: 'success', indent: 0 },
      { text: 'tbsCertificate {', color: 'muted', indent: 1 },
      { text: 'issuer: Workshop CA (ML-DSA-65)', color: 'muted', indent: 2 },
      { text: 'extensions: RelatedCertificate (non-critical) {', color: 'primary', indent: 2 },
      { text: 'hashAlgorithm  sha256', color: 'primary', indent: 3 },
      { text: 'hashValue      SHA-256(Cert A)', color: 'primary', indent: 3 },
      { text: '}', color: 'primary', indent: 2 },
      { text: '}', color: 'muted', indent: 1 },
      { text: 'signatureAlgorithm  ML-DSA-65', color: 'success', indent: 1 },
      { text: '}', color: 'success', indent: 0 },
      { text: '', color: 'muted', indent: 0 },
      {
        text: '// Before issuing B, the CA checks a relatedCertRequest',
        color: 'muted',
        indent: 0,
      },
      { text: "// signed with Cert A's key (proof of possession).", color: 'muted', indent: 0 },
    ],
    educationalNote:
      "RFC 9763 (Related Certificates) links a NEW certificate to an EXISTING one. The requester proves it holds Cert A's key in a relatedCertRequest CSR attribute; the CA verifies that proof and issues Cert B with a RelatedCertificate extension holding the hash of the complete final Cert A — the hash named by Cert A's signature algorithm, SHA-256 here. The link is one-way and Cert A is never modified. Each certificate stays independently valid, and a protocol may use either or both — RFC 9763 does not require both. Unlike Alt-Sig (one certificate carrying a second signature), the two certificates stay separate.",
    classicalAlg: 'EC',
    pqcAlg: 'ML-DSA-65',
  },
  {
    id: 'pure-pqc-kem',
    group: 'current',
    label: 'Pure PQC KEM (ML-KEM-768)',
    shortLabel: 'Pure KEM',
    approach: 'Single PQC KEM algorithm',
    standard: 'RFC 9935',
    standardUrl: 'https://datatracker.ietf.org/doc/rfc9935/',
    oids: ['2.16.840.1.101.3.4.4.2'],
    status: 'Published',
    statusColor: 'success',
    quantumSafe: true,
    legacyCompat: false,
    description:
      'A CA-issued end-entity certificate whose subject key is ML-KEM-768. The ML-KEM key encapsulates and decapsulates; it cannot sign, so a separate ML-DSA-65 CA signs the certificate.',
    structureLines: [
      { text: 'Certificate ::= SEQUENCE {', color: 'foreground', indent: 0 },
      { text: 'tbsCertificate {', color: 'muted', indent: 1 },
      {
        text: 'subjectPublicKeyInfo  ML-KEM-768 (2.16.840.1.101.3.4.4.2)',
        color: 'success',
        indent: 2,
      },
      { text: 'keyUsage (critical)   keyEncipherment only', color: 'success', indent: 2 },
      { text: 'basicConstraints (critical)  cA=FALSE', color: 'muted', indent: 2 },
      { text: '}', color: 'muted', indent: 1 },
      {
        text: 'signatureAlgorithm  ML-DSA-65 — by the Workshop CA, not the KEM key',
        color: 'primary',
        indent: 1,
      },
      { text: 'signatureValue      CA signature', color: 'primary', indent: 1 },
      { text: '}', color: 'foreground', indent: 0 },
    ],
    educationalNote:
      'RFC 9935 (March 2026) defines X.509 algorithm identifiers for ML-KEM-512/768/1024. KEM certificates are encryption-only per §4 — they cannot self-sign. This workshop generates an ML-KEM-768 key and issues a CA-issued ML-KEM end-entity certificate from a separate ML-DSA-65 workshop CA: the subject key does encapsulation and decapsulation, and only the issuer key signs. A CA cannot check a self-signature from a KEM key, so the workshop CA injects the public key directly. KEM certs enable PQ-safe key encapsulation at the X.509 layer (CMS, S/MIME, IKE certificate-based modes).',
    classicalAlg: null,
    pqcAlg: 'ML-KEM-768',
  },
  {
    id: 'composite-kem',
    group: 'current',
    label: 'Composite KEM (ML-KEM-768 + X25519)',
    shortLabel: 'Composite KEM',
    approach: 'Single composite KEM OID',
    standard: 'draft-ietf-lamps-pq-composite-kem-21',
    standardUrl: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-kem/',
    oids: ['1.3.6.1.5.5.7.6.58'],
    status: 'IESG Evaluation',
    statusColor: 'primary',
    quantumSafe: true,
    legacyCompat: false,
    description:
      'X.509 certificate carrying a composite ML-KEM-768 + X25519 public key under a single OID. This card shows the certificate encoding; it does not run encapsulation, which combines both KEM shares via a KDF.',
    structureLines: [
      { text: 'Certificate ::= SEQUENCE {', color: 'foreground', indent: 0 },
      { text: 'tbsCertificate {', color: 'muted', indent: 1 },
      { text: 'subjectPublicKeyInfo  CompositeKEMPublicKey {', color: 'primary', indent: 2 },
      { text: 'mlkem768PublicKey   ML-KEM-768 (1184 bytes)', color: 'success', indent: 3 },
      { text: 'x25519PublicKey     X25519 (32 bytes)', color: 'warning', indent: 3 },
      { text: '}', color: 'primary', indent: 2 },
      {
        text: 'subjectPublicKeyOID  id-MLKEM768-X25519-SHA3-256 (1.3.6.1.5.5.7.6.58)',
        color: 'primary',
        indent: 2,
      },
      { text: 'keyUsage (critical)   keyEncipherment only', color: 'success', indent: 2 },
      { text: '}', color: 'muted', indent: 1 },
      {
        text: 'signatureAlgorithm  ML-DSA-65 — by the Workshop CA',
        color: 'primary',
        indent: 1,
      },
      { text: 'signatureValue      CA signature', color: 'muted', indent: 1 },
      { text: '}', color: 'foreground', indent: 0 },
    ],
    educationalNote:
      'draft-ietf-lamps-pq-composite-kem defines composite KEM public keys binding ML-KEM-768 with a classical KEM (X25519, P-256, P-384, RSA-2048/3072/4096, brainpoolP256) under a single OID (encoded ML-KEM component first, then the classical component — §4.1). Encapsulation runs both KEMs and combines shared secrets via a KDF — both must succeed. Like composite signatures, the wire format is parsed only by composite-aware libraries: stock OpenSSL 3.6.3 registers no composite algorithms at all and fails to load a composite public key, so composite certificates are NOT backward compatible. KEM certs are encryption-only (RFC 9935 §4); signing requires a separate CA. This card shows the certificate encoding only — it does not run composite encapsulation.',
    classicalAlg: 'X25519',
    pqcAlg: 'ML-KEM-768',
  },
  {
    id: 'chameleon',
    group: 'historical',
    label: 'Chameleon Certificates',
    shortLabel: 'Chameleon',
    approach: 'Delta extension embedding',
    standard: 'draft-bonnell-lamps-chameleon-certs-07',
    standardUrl: 'https://datatracker.ietf.org/doc/draft-bonnell-lamps-chameleon-certs/',
    oids: ['2.16.840.1.114027.80.6.1'],
    status: 'Expired Draft',
    statusColor: 'muted',
    quantumSafe: true,
    legacyCompat: false,
    description:
      'Historical design (expired individual draft). A single certificate with a DeltaCertificateDescriptor extension that encodes the differences needed to reconstruct a classical partner certificate.',
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
      'HISTORICAL — not recommended for new deployments. draft-bonnell-lamps-chameleon-certs-07 is an INDIVIDUAL submission that EXPIRED on 2026-04-21 and was never adopted as a LAMPS working-group document — there is no draft-ietf-lamps-chameleon-certs, and the work was not renamed or absorbed elsewhere. Treat it as a dormant design, not an active standards track; it is kept here only because the delta-encoding idea is instructive. This demo generates a real DER-encoded chameleon cert with a DeltaCertificateDescriptor extension (OID 2.16.840.1.114027.80.6.1). The delta extension encodes only the differences (signature, public key, extensions) needed to reconstruct the classical partner cert — but validating it requires a chameleon-aware parser. Legacy validators see only the ML-DSA-65 primary and silently ignore the delta: verified against OpenSSL 3.6.3, which validates the ML-DSA-65 signature and reports the delta as an unrecognised OID.',
    classicalAlg: 'EC',
    pqcAlg: 'ML-DSA-65',
  },
]

/**
 * ASN.1 structure lines for the composite card, derived from the selected
 * draft §6 profile — never hard-coded to one profile.
 */
export function compositeStructureLines(
  profile: CompositeProfileDraft19
): HybridCertFormat['structureLines'] {
  const name = profile.label.replace(/^id-/, '')
  const mldsa = name.split('-')[0].replace('MLDSA', 'ML-DSA-')
  const c = profile.classical
  const trad =
    c.kind === 'ecdsa'
      ? {
          label: `EC ${c.curve}`,
          pk: c.curve === 'P-384' ? '97 bytes, X9.62' : '65 bytes, X9.62',
          sig: c.curve === 'P-384' ? 'ECDSA (~103 bytes, DER)' : 'ECDSA (70-72 bytes, DER)',
        }
      : c.kind === 'ed25519'
        ? { label: 'Ed25519', pk: '32 bytes', sig: 'Ed25519 (64 bytes)' }
        : {
            label: `RSA-${c.modulusBits}`,
            pk: 'RSAPublicKey, DER',
            sig: `RSASSA-PSS (${c.modulusBits / 8} bytes)`,
          }
  return [
    { text: 'Certificate ::= SEQUENCE {', color: 'foreground', indent: 0 },
    { text: 'tbsCertificate      TBSCertificate {', color: 'muted', indent: 1 },
    { text: 'subjectPublicKeyInfo {', color: 'muted', indent: 2 },
    { text: `algorithm         ${name} (${profile.compositeOid})`, color: 'primary', indent: 3 },
    { text: 'subjectPublicKey  BIT STRING — raw concatenation:', color: 'primary', indent: 3 },
    {
      text: `mldsaPublicKey  ${mldsa} (${profile.mldsaPubKeyBytes} bytes)  ← ML-DSA FIRST`,
      color: 'success',
      indent: 4,
    },
    { text: `tradPublicKey   ${trad.label} (${trad.pk})`, color: 'warning', indent: 4 },
    { text: '}', color: 'muted', indent: 2 },
    { text: '}', color: 'muted', indent: 1 },
    { text: `signatureAlgorithm  ${name} (${profile.compositeOid}),`, color: 'primary', indent: 1 },
    { text: 'signatureValue      BIT STRING — raw concatenation:', color: 'primary', indent: 1 },
    {
      text: `mldsaSignature  ${mldsa} (${profile.mldsaSigBytes} bytes)  ← ML-DSA FIRST`,
      color: 'success',
      indent: 2,
    },
    { text: `tradSignature   ${trad.sig}`, color: 'warning', indent: 2 },
    { text: '}', color: 'foreground', indent: 0 },
    { text: '', color: 'muted', indent: 0 },
    {
      text: '// No ASN.1 SEQUENCE wraps the components — the raw bytes go',
      color: 'muted',
      indent: 0,
    },
    {
      text: "// straight into the BIT STRING. A verifier splits at ML-DSA's",
      color: 'muted',
      indent: 0,
    },
    { text: '// fixed length (FIPS 204).', color: 'muted', indent: 0 },
  ]
}

/** Formats in the main comparison — the set Generate All produces. */
export const CURRENT_HYBRID_CERT_FORMATS = HYBRID_CERT_FORMATS.filter((f) => f.group === 'current')

/** Expired or abandoned designs, shown separately and generated only on request. */
export const HISTORICAL_HYBRID_CERT_FORMATS = HYBRID_CERT_FORMATS.filter(
  (f) => f.group === 'historical'
)

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
