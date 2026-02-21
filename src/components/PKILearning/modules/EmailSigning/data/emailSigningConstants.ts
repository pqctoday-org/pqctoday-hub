// ── CMS Content Types (RFC 5652) ───────────────────────────────────────────
export interface ContentType {
  name: string
  oid: string
  description: string
}

export const CMS_CONTENT_TYPES: ContentType[] = [
  {
    name: 'data',
    oid: '1.2.840.113549.1.7.1',
    description: 'Arbitrary octet string (the email body or attachment)',
  },
  {
    name: 'signed-data',
    oid: '1.2.840.113549.1.7.2',
    description: 'SignedData structure with one or more signer infos',
  },
  {
    name: 'enveloped-data',
    oid: '1.2.840.113549.1.7.3',
    description: 'EnvelopedData with encrypted content and recipient info',
  },
  {
    name: 'authenticated-data',
    oid: '1.2.840.113549.1.9.16.1.2',
    description: 'MACed content with authentication',
  },
  {
    name: 'authenticated-enveloped-data',
    oid: '1.2.840.113549.1.9.16.1.23',
    description: 'AEAD-encrypted content (AES-GCM)',
  },
]

// ── Algorithm OIDs ─────────────────────────────────────────────────────────
export interface AlgorithmOID {
  name: string
  oid: string
  type: 'classical' | 'pqc'
  category: 'signature' | 'kem' | 'key-transport' | 'hash' | 'content-encryption'
  nistLevel?: number
}

export const ALGORITHM_OIDS: AlgorithmOID[] = [
  // Signature algorithms
  {
    name: 'RSA-2048 (PKCS#1 v1.5)',
    oid: '1.2.840.113549.1.1.11',
    type: 'classical',
    category: 'signature',
  },
  {
    name: 'ECDSA P-256',
    oid: '1.2.840.10045.4.3.2',
    type: 'classical',
    category: 'signature',
  },
  {
    name: 'Ed25519',
    oid: '1.3.101.112',
    type: 'classical',
    category: 'signature',
  },
  {
    name: 'ML-DSA-44',
    oid: '2.16.840.1.101.3.4.3.17',
    type: 'pqc',
    category: 'signature',
    nistLevel: 2,
  },
  {
    name: 'ML-DSA-65',
    oid: '2.16.840.1.101.3.4.3.18',
    type: 'pqc',
    category: 'signature',
    nistLevel: 3,
  },
  {
    name: 'ML-DSA-87',
    oid: '2.16.840.1.101.3.4.3.19',
    type: 'pqc',
    category: 'signature',
    nistLevel: 5,
  },
  {
    name: 'HSS/LMS',
    oid: '1.2.840.113549.1.9.16.3.17',
    type: 'pqc',
    category: 'signature',
    // Security level is parameter-dependent (hash function and tree height)
  },
  // KEM algorithms
  {
    name: 'ML-KEM-512',
    oid: '2.16.840.1.101.3.4.4.1',
    type: 'pqc',
    category: 'kem',
    nistLevel: 1,
  },
  {
    name: 'ML-KEM-768',
    oid: '2.16.840.1.101.3.4.4.2',
    type: 'pqc',
    category: 'kem',
    nistLevel: 3,
  },
  {
    name: 'ML-KEM-1024',
    oid: '2.16.840.1.101.3.4.4.3',
    type: 'pqc',
    category: 'kem',
    nistLevel: 5,
  },
  // Key transport (classical)
  {
    name: 'RSA-OAEP',
    oid: '1.2.840.113549.1.1.7',
    type: 'classical',
    category: 'key-transport',
  },
  // Hashes
  {
    name: 'SHA-256',
    oid: '2.16.840.1.101.3.4.2.1',
    type: 'classical',
    category: 'hash',
  },
  {
    name: 'SHA-512',
    oid: '2.16.840.1.101.3.4.2.3',
    type: 'classical',
    category: 'hash',
  },
  // Content encryption
  {
    name: 'AES-256-GCM',
    oid: '2.16.840.1.101.3.4.1.46',
    type: 'classical',
    category: 'content-encryption',
  },
  {
    name: 'AES-256-CBC',
    oid: '2.16.840.1.101.3.4.1.42',
    type: 'classical',
    category: 'content-encryption',
  },
]

// ── S/MIME Certificate Extension Requirements ──────────────────────────────
export interface CertExtension {
  name: string
  oid: string
  critical: boolean
  signingValue: string
  encryptionValue: string
  description: string
}

export const SMIME_CERT_EXTENSIONS: CertExtension[] = [
  {
    name: 'keyUsage',
    oid: '2.5.29.15',
    critical: true,
    signingValue: 'digitalSignature, nonRepudiation',
    encryptionValue: 'keyEncipherment (RSA) / keyAgreement (ECDH). KEM keyUsage is TBD by LAMPS WG',
    description:
      'Defines permitted key operations for the certificate. No existing keyUsage bit maps cleanly to KEMs.',
  },
  {
    name: 'extKeyUsage',
    oid: '2.5.29.37',
    critical: false,
    signingValue: 'id-kp-emailProtection (1.3.6.1.5.5.7.3.4)',
    encryptionValue: 'id-kp-emailProtection (1.3.6.1.5.5.7.3.4)',
    description: 'Extended key usage for S/MIME email protection',
  },
  {
    name: 'subjectAltName',
    oid: '2.5.29.17',
    critical: false,
    signingValue: 'rfc822Name: user@example.com',
    encryptionValue: 'rfc822Name: user@example.com',
    description: 'Email address binding (required for S/MIME)',
  },
  {
    name: 'subjectKeyIdentifier',
    oid: '2.5.29.14',
    critical: false,
    signingValue: 'SHA-1 hash of public key',
    encryptionValue: 'SHA-1 hash of public key',
    description: 'Unique identifier for certificate key pair',
  },
  {
    name: 'authorityKeyIdentifier',
    oid: '2.5.29.35',
    critical: false,
    signingValue: 'Issuer SKI reference',
    encryptionValue: 'Issuer SKI reference',
    description: 'Links to issuing CA certificate',
  },
  {
    name: 'smimeCapabilities',
    oid: '1.2.840.113549.1.9.15',
    critical: false,
    signingValue: 'Advertised signing algorithms',
    encryptionValue: 'Advertised encryption algorithms',
    description: 'Announces supported S/MIME algorithms to peers',
  },
]

// ── Recipient Info Structure Comparison ─────────────────────────────────────
export interface RecipientInfoField {
  field: string
  classicalValue: string
  pqcValue: string
}

export const RECIPIENT_INFO_COMPARISON: RecipientInfoField[] = [
  {
    field: 'Structure Type',
    classicalValue: 'KeyTransRecipientInfo',
    pqcValue: 'KEMRecipientInfo (RFC 9629)',
  },
  {
    field: 'Version',
    classicalValue: '0 (issuerAndSerialNumber)',
    pqcValue: '0',
  },
  {
    field: 'Recipient ID',
    classicalValue: 'issuerAndSerialNumber / subjectKeyIdentifier',
    pqcValue: 'issuerAndSerialNumber / subjectKeyIdentifier',
  },
  {
    field: 'Key Mechanism',
    classicalValue: 'RSA-OAEP encrypts CEK directly',
    pqcValue: 'KEM encapsulation produces shared secret',
  },
  {
    field: 'Key Derivation',
    classicalValue: 'None (CEK is encrypted directly)',
    pqcValue: 'KDF (HKDF-SHA256) derives key-wrap key from shared secret',
  },
  {
    field: 'Key Wrap',
    classicalValue: 'Not applicable',
    pqcValue: 'AES-256-WRAP wraps the CEK with derived key',
  },
  {
    field: 'Ciphertext Field',
    classicalValue: 'encryptedKey (RSA ciphertext)',
    pqcValue: 'kemct (KEM ciphertext / encapsulated key)',
  },
  {
    field: 'Algorithm ID',
    classicalValue: 'RSA-OAEP (1.2.840.113549.1.1.7)',
    pqcValue: 'id-alg-ml-kem-768 (2.16.840.1.101.3.4.4.2)',
  },
]

// ── S/MIME Size Comparisons ─────────────────────────────────────────────────
export interface SizeComparison {
  metric: string
  rsa2048: string
  ecdsaP256: string
  mlDsa65: string
  mlKem768: string
  unit: string
}

export const SIZE_COMPARISONS: SizeComparison[] = [
  {
    metric: 'Public Key',
    rsa2048: '256',
    ecdsaP256: '65',
    mlDsa65: '1,952',
    mlKem768: '1,184',
    unit: 'bytes',
  },
  {
    metric: 'Signature / Ciphertext',
    rsa2048: '256',
    ecdsaP256: '~72 (DER)',
    mlDsa65: '3,309',
    mlKem768: '1,088',
    unit: 'bytes',
  },
  {
    metric: 'Certificate Size',
    rsa2048: '~1,200',
    ecdsaP256: '~600',
    mlDsa65: '~6,000',
    mlKem768: 'N/A (KEM)',
    unit: 'bytes',
  },
  {
    metric: 'Signed Email Overhead',
    rsa2048: '~2 KB',
    ecdsaP256: '~1 KB',
    mlDsa65: '~10 KB',
    mlKem768: 'N/A',
    unit: '',
  },
  {
    metric: 'Encrypted Email Overhead',
    rsa2048: '~0.5 KB',
    ecdsaP256: 'N/A',
    mlDsa65: 'N/A',
    mlKem768: '~2.5 KB',
    unit: '',
  },
]

// ── CMS SignedData ASN.1 Structure ──────────────────────────────────────────
export interface ASN1Node {
  label: string
  oid?: string
  value?: string
  children?: ASN1Node[]
  highlight?: 'classical' | 'pqc' | 'common'
}

export const CMS_SIGNED_DATA_STRUCTURE: ASN1Node = {
  label: 'ContentInfo',
  children: [
    {
      label: 'contentType',
      oid: '1.2.840.113549.1.7.2',
      value: 'signed-data',
      highlight: 'common',
    },
    {
      label: 'SignedData',
      children: [
        { label: 'version', value: '1', highlight: 'common' },
        {
          label: 'digestAlgorithms',
          children: [
            {
              label: 'AlgorithmIdentifier',
              oid: '2.16.840.1.101.3.4.2.1',
              value: 'SHA-256',
              highlight: 'common',
            },
          ],
        },
        {
          label: 'encapContentInfo',
          children: [
            {
              label: 'eContentType',
              oid: '1.2.840.113549.1.7.1',
              value: 'data',
              highlight: 'common',
            },
            { label: 'eContent', value: '[email body bytes]', highlight: 'common' },
          ],
        },
        {
          label: 'certificates [0] IMPLICIT',
          value: 'Signer certificate chain',
          highlight: 'common',
        },
        {
          label: 'signerInfos',
          children: [
            {
              label: 'SignerInfo',
              children: [
                { label: 'version', value: '1', highlight: 'common' },
                { label: 'sid', value: 'issuerAndSerialNumber', highlight: 'common' },
                { label: 'digestAlgorithm', value: 'SHA-256', highlight: 'common' },
                {
                  label: 'signedAttrs',
                  children: [
                    { label: 'content-type', oid: '1.2.840.113549.1.9.3', highlight: 'common' },
                    { label: 'message-digest', oid: '1.2.840.113549.1.9.4', highlight: 'common' },
                    { label: 'signing-time', oid: '1.2.840.113549.1.9.5', highlight: 'common' },
                    {
                      label: 'smime-capabilities',
                      oid: '1.2.840.113549.1.9.15',
                      highlight: 'common',
                    },
                  ],
                },
                {
                  label: 'signatureAlgorithm',
                  value: '(algorithm-specific)',
                  highlight: 'common',
                },
                { label: 'signature', value: '(signature bytes)', highlight: 'common' },
              ],
            },
          ],
        },
      ],
    },
  ],
}

// ── CMS AuthEnvelopedData ASN.1 Structure (RFC 5083) ─────────────────────────
// AES-GCM is an AEAD cipher and MUST use AuthEnvelopedData, not plain EnvelopedData.
// Plain EnvelopedData (RFC 5652) is for non-AEAD ciphers like AES-CBC.
export const CMS_AUTH_ENVELOPED_DATA_STRUCTURE: ASN1Node = {
  label: 'ContentInfo',
  children: [
    {
      label: 'contentType',
      oid: '1.2.840.113549.1.9.16.1.23',
      value: 'authenticated-enveloped-data',
      highlight: 'common',
    },
    {
      label: 'AuthEnvelopedData',
      children: [
        { label: 'version', value: '0', highlight: 'common' },
        {
          label: 'recipientInfos',
          value: '(recipient-specific structure)',
          highlight: 'common',
        },
        {
          label: 'authEncryptedContentInfo',
          children: [
            {
              label: 'contentType',
              oid: '1.2.840.113549.1.7.1',
              value: 'data',
              highlight: 'common',
            },
            {
              label: 'contentEncryptionAlgorithm',
              oid: '2.16.840.1.101.3.4.1.46',
              value: 'AES-256-GCM',
              highlight: 'common',
            },
            {
              label: 'encryptedContent',
              value: '[AEAD-encrypted email bytes + auth tag]',
              highlight: 'common',
            },
          ],
        },
        {
          label: 'mac',
          value: '[implicit in GCM auth tag]',
          highlight: 'common',
        },
      ],
    },
  ],
}

// ── Classical vs PQC Signer Info details ────────────────────────────────────
export interface SignerComparison {
  field: string
  ecdsaValue: string
  mlDsaValue: string
}

export const SIGNER_INFO_COMPARISON: SignerComparison[] = [
  {
    field: 'signatureAlgorithm',
    ecdsaValue: 'ecdsa-with-SHA256 (1.2.840.10045.4.3.2)',
    mlDsaValue: 'id-ml-dsa-65 (2.16.840.1.101.3.4.3.18)',
  },
  {
    field: 'Signature Size',
    ecdsaValue: '~72 bytes (DER-encoded r, s)',
    mlDsaValue: '3,309 bytes',
  },
  {
    field: 'Public Key Size',
    ecdsaValue: '65 bytes (uncompressed P-256)',
    mlDsaValue: '1,952 bytes',
  },
  {
    field: 'Security Level',
    ecdsaValue: '128-bit classical',
    mlDsaValue: 'NIST Level 3 (quantum)',
  },
  {
    field: 'Standards',
    ecdsaValue: 'RFC 5754 / RFC 5652',
    mlDsaValue: 'RFC 9882 (ML-DSA in CMS)',
  },
  {
    field: 'Quantum Safe',
    ecdsaValue: 'No',
    mlDsaValue: 'Yes',
  },
]

// ── Key RFCs ────────────────────────────────────────────────────────────────
export interface RFCReference {
  number: string
  title: string
  description: string
  year: number
}

export const KEY_RFCS: RFCReference[] = [
  {
    number: 'RFC 5652',
    title: 'Cryptographic Message Syntax (CMS)',
    description: 'Core CMS specification: SignedData, EnvelopedData, and other content types.',
    year: 2009,
  },
  {
    number: 'RFC 8551',
    title: 'S/MIME 4.0 Message Specification',
    description: 'Current S/MIME standard defining email signing and encryption using CMS.',
    year: 2019,
  },
  {
    number: 'RFC 9629',
    title: 'Using Key Encapsulation Mechanism (KEM) in CMS',
    description:
      'Defines KEMRecipientInfo for CMS EnvelopedData, enabling ML-KEM for email encryption.',
    year: 2024,
  },
  {
    number: 'RFC 9882',
    title: 'ML-DSA in CMS',
    description:
      'Specifies use of ML-DSA (FIPS 204) for signing CMS content, including S/MIME messages.',
    year: 2025,
  },
  {
    number: 'RFC 9708',
    title: 'HSS/LMS in CMS',
    description: 'Specifies use of hash-based signatures (LMS/HSS per SP 800-208) in CMS.',
    year: 2025,
  },
  {
    number: 'RFC 9690',
    title: 'Using RSA-KEM in CMS',
    description: 'Defines RSA-KEM usage in CMS EnvelopedData. Updates and obsoletes RFC 5990.',
    year: 2024,
  },
]

// ── Certificate Field Comparison (RSA vs ML-DSA) ────────────────────────────
export interface CertFieldComparison {
  field: string
  rsaValue: string
  mlDsaValue: string
  notes: string
}

export const CERT_FIELD_COMPARISON: CertFieldComparison[] = [
  {
    field: 'Subject',
    rsaValue: 'CN=Alice, E=alice@example.com',
    mlDsaValue: 'CN=Alice, E=alice@example.com',
    notes: 'Identical subject naming',
  },
  {
    field: 'Issuer',
    rsaValue: 'CN=Enterprise CA, O=Acme Corp',
    mlDsaValue: 'CN=PQC Enterprise CA, O=Acme Corp',
    notes: 'Separate CA for PQC certificates',
  },
  {
    field: 'Signature Algorithm',
    rsaValue: 'sha256WithRSAEncryption',
    mlDsaValue: 'id-ml-dsa-65',
    notes: 'PQC algorithm has no hash prefix (hash is internal)',
  },
  {
    field: 'Public Key Algorithm',
    rsaValue: 'rsaEncryption (2048 bit)',
    mlDsaValue: 'id-ml-dsa-65',
    notes: 'ML-DSA key is 1,952 bytes vs 256 bytes for RSA',
  },
  {
    field: 'Public Key Size',
    rsaValue: '256 bytes',
    mlDsaValue: '1,952 bytes',
    notes: '7.6x larger public key',
  },
  {
    field: 'Signature Size',
    rsaValue: '256 bytes',
    mlDsaValue: '3,309 bytes',
    notes: '12.9x larger signature',
  },
  {
    field: 'Total Certificate',
    rsaValue: '~1,200 bytes',
    mlDsaValue: '~6,000 bytes',
    notes: '~5x larger certificate overall',
  },
  {
    field: 'keyUsage',
    rsaValue: 'digitalSignature, nonRepudiation',
    mlDsaValue: 'digitalSignature, nonRepudiation',
    notes: 'Same key usage for signing certs',
  },
  {
    field: 'extKeyUsage',
    rsaValue: 'id-kp-emailProtection',
    mlDsaValue: 'id-kp-emailProtection',
    notes: 'Same extended key usage',
  },
  {
    field: 'subjectAltName',
    rsaValue: 'email:alice@example.com',
    mlDsaValue: 'email:alice@example.com',
    notes: 'Required for S/MIME binding',
  },
]
