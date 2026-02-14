// EUDI Wallet Educational Module Constants
// Based on ARF v2.4.0+ and cryptoimplementation.md requirements

// Maria García's Identity Attributes (Reference Test Data)
export const MARIA_IDENTITY = {
  family_name: 'García',
  given_name: 'María Elena',
  birth_date: '1990-03-15',
  birth_place: 'Madrid',
  birth_country: 'ES',
  gender: 'female',
  nationality: ['ES'],
  resident_address: 'Calle Mayor 42, 28013 Madrid',
  age_over_18: true,
  age_over_21: true,
  document_number: '12345678X',
  issuing_country: 'ES',
  issuing_authority: 'Dirección General de Tráfico',
}

// OpenSSL Commands for EUDI Cryptographic Operations
export const EUDI_COMMANDS = {
  // Generate P-256 key for WUA (Wallet Unit Attestation)
  GEN_WUA_KEY: (filename: string) =>
    `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out ${filename}`,

  // Generate P-256 key for PID (Person Identification Data)
  GEN_PID_KEY: (filename: string) =>
    `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out ${filename}`,

  // Generate P-384 key for Diploma attestation
  GEN_DIPLOMA_KEY: (filename: string) =>
    `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-384 -out ${filename}`,

  // Extract public key from private key
  EXTRACT_PUB: (privKey: string, pubKey: string) =>
    `openssl pkey -in ${privKey} -pubout -out ${pubKey}`,

  // Sign with ECDSA (for device binding proofs)
  SIGN: (keyFile: string, dataFile: string, sigFile: string) =>
    `openssl pkeyutl -sign -inkey ${keyFile} -in ${dataFile} -out ${sigFile}`,

  // Verify ECDSA signature
  VERIFY: (pubKey: string, dataFile: string, sigFile: string) =>
    `openssl pkeyutl -verify -pubin -inkey ${pubKey} -in ${dataFile} -sigfile ${sigFile}`,

  // Display key in text format for parsing
  DISPLAY_KEY: (keyFile: string) => `openssl pkey -in ${keyFile} -text -noout`,

  // Display public key in text format
  DISPLAY_PUB: (pubKeyFile: string) => `openssl pkey -pubin -in ${pubKeyFile} -text -noout`,
}

// Filename helper (following Digital Assets pattern)
export const getFilenames = (prefix: string) => ({
  PRIVATE_KEY: `${prefix}_private.pem`,
  PUBLIC_KEY: `${prefix}_public.pem`,
  SIGNATURE: `${prefix}_signature.sig`,
  HASH: `${prefix}_hash.bin`,
  DATA: `${prefix}_data.bin`,
})

// OpenID4VCI Metadata (PID Provider - Motor Vehicle Authority)
export const OPENID4VCI_METADATA = {
  credential_issuer: 'https://mva.gov.es',
  credential_endpoint: 'https://mva.gov.es/credentials',
  authorization_endpoint: 'https://mva.gov.es/authorize',
  token_endpoint: 'https://mva.gov.es/token',
  pushed_authorization_request_endpoint: 'https://mva.gov.es/par',
  credential_configurations_supported: [
    {
      format: 'mso_mdoc',
      doctype: 'org.iso.18013.5.1.mDL',
      cryptographic_binding_methods_supported: ['cose_key'],
      cryptographic_suites_supported: ['ES256', 'ES384'],
      display: [
        {
          name: 'Mobile Driving License',
          locale: 'en-US',
        },
      ],
    },
  ],
}

// OpenID4VP Presentation Definition (Bank KYC)
export const OPENID4VP_PRESENTATION_DEF = {
  id: 'premium_account_opening',
  input_descriptors: [
    {
      id: 'pid_identity',
      name: 'Identity Verification',
      purpose: 'KYC compliance',
      format: { mso_mdoc: {} },
      constraints: {
        fields: [
          { path: ['$.family_name'], intent_to_retain: true },
          { path: ['$.given_name'], intent_to_retain: true },
          { path: ['$.birth_date'], intent_to_retain: true },
          { path: ['$.resident_address'], intent_to_retain: true },
        ],
      },
    },
    {
      id: 'diploma_education',
      name: 'Education Verification',
      purpose: 'Premium account eligibility',
      format: { 'vc+sd-jwt': {} },
      constraints: {
        fields: [{ path: ['$.degree_type'] }, { path: ['$.institution_name'] }],
      },
    },
  ],
}

// University Diploma Attestation Data
export const DIPLOMA_DATA = {
  family_name: 'García',
  given_name: 'María Elena',
  degree_type: 'Master of Science',
  degree_field: 'Computer Science',
  graduation_date: '2023-06-15',
  institution_name: 'State University',
  diploma_number: 'MSC-2023-12345',
  honors: 'Cum Laude',
  issuing_country: 'ES',
  issuing_authority: 'State University',
}

// CSC API Endpoints (Remote QES Provider)
export const CSC_API_ENDPOINTS = {
  info: '/csc/v2/info',
  credentials_list: '/csc/v2/credentials/list',
  credentials_info: '/csc/v2/credentials/info',
  credentials_authorize: '/csc/v2/credentials/authorize',
  signatures_signHash: '/csc/v2/signatures/signHash',
}

// Educational tooltips for EUDI terms
export const EUDI_GLOSSARY = {
  WUA: 'Wallet Unit Attestation - A credential issued by the Wallet Provider that attests to the authenticity and security properties of the wallet instance.',
  PID: 'Person Identification Data - The core identity credential in the EUDI Wallet, containing mandatory attributes like name, birth date, and nationality.',
  mDL: 'Mobile Driving License - A digital representation of a physical driving license following ISO/IEC 18013-5 standard.',
  QEAA: 'Qualified Electronic Attestation of Attributes - An attestation issued by a Qualified Trust Service Provider.',
  'PuB-EAA':
    'Public Body Electronic Attestation of Attributes - An attestation issued by a public body based on authentic sources.',
  OpenID4VCI:
    'OpenID for Verifiable Credential Issuance - Protocol for issuing verifiable credentials.',
  OpenID4VP:
    'OpenID for Verifiable Presentations - Protocol for presenting verifiable credentials.',
  'SD-JWT': 'Selective Disclosure JWT - A JWT format that allows selective disclosure of claims.',
  mdoc: 'Mobile Document - CBOR-based credential format defined in ISO/IEC 18013-5.',
  'Device Binding':
    'Cryptographic proof that the presenter controls the private key associated with the credential.',
  'Remote HSM':
    'Hardware Security Module operated by the Wallet Provider, providing centralized key management.',
  WSCD: 'Wallet Secure Cryptographic Device - The hardware component storing private keys (in this case, a remote HSM).',
  WSCA: 'Wallet Secure Cryptographic Application - The firmware/software managing cryptographic operations in the WSCD.',
  'CSC API': 'Cloud Signature Consortium API - Standard for remote signature creation services.',
  QES: 'Qualified Electronic Signature - A type of electronic signature with the same legal effect as a handwritten signature in the EU.',
  QTSP: 'Qualified Trust Service Provider - An organization authorized to provide qualified trust services.',
  'Relying Party':
    'An entity that relies on and verifies credentials presented by a holder (e.g., a bank verifying identity).',
  P2PKH: 'Pay to Public Key Hash - Bitcoin address format (educational reference).',
}

// Module metadata
export const DIGITAL_ID_MODULE = {
  id: 'digital-id',
  title: 'Digital ID',
  description:
    'Master EUDI Wallet: Wallet activation, PID issuance, attestations, QES, and verification.',
  duration: '120 min',
}
