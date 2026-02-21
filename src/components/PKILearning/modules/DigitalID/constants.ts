// EUDI Wallet Educational Module Constants
// Based on EUDI Wallet Architecture Reference Framework (ARF). Educational simulation.

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
  issuing_authority: 'Dirección General de la Policía',
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

// OpenID4VCI Metadata (PID Provider - National Identity Authority)
export const OPENID4VCI_METADATA = {
  credential_issuer: 'https://pid-provider.gob.es',
  credential_endpoint: 'https://pid-provider.gob.es/credentials',
  authorization_endpoint: 'https://pid-provider.gob.es/authorize',
  token_endpoint: 'https://pid-provider.gob.es/token',
  pushed_authorization_request_endpoint: 'https://pid-provider.gob.es/par',
  credential_configurations_supported: [
    {
      format: 'mso_mdoc',
      doctype: 'eu.europa.ec.eudi.pid.1',
      cryptographic_binding_methods_supported: ['cose_key'],
      cryptographic_suites_supported: ['ES256', 'ES384'],
      display: [
        {
          name: 'Person Identification Data',
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
          { path: ["$['eu.europa.ec.eudi.pid.1']['family_name']"], intent_to_retain: true },
          { path: ["$['eu.europa.ec.eudi.pid.1']['given_name']"], intent_to_retain: true },
          { path: ["$['eu.europa.ec.eudi.pid.1']['birth_date']"], intent_to_retain: true },
          { path: ["$['eu.europa.ec.eudi.pid.1']['resident_address']"], intent_to_retain: true },
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
    'OpenID for Verifiable Credential Issuance (1.0) - Protocol for issuing verifiable credentials to wallets.',
  OpenID4VP:
    'OpenID for Verifiable Presentations (1.0 Final, July 2025) - Protocol for presenting verifiable credentials to Relying Parties.',
  'SD-JWT':
    'Selective Disclosure JWT (RFC 9901) - A JWT format that allows selective disclosure of claims. The SD-JWT VC credential profile remains a draft.',
  mdoc: 'Mobile Document - CBOR-based credential format defined in ISO/IEC 18013-5.',
  'Device Binding':
    'Cryptographic proof that the presenter controls the private key associated with the credential.',
  'Remote HSM':
    'Hardware Security Module operated by the Wallet Provider for remote key management. The ARF supports both local WSCD (device secure element) and remote WSCD (HSM) models.',
  WSCD: 'Wallet Secure Cryptographic Device - The secure hardware storing private keys. Can be local (device secure element, eSE, TEE) or remote (cloud HSM). This simulation demonstrates the remote HSM model.',
  WSCA: 'Wallet Secure Cryptographic Application - The firmware/software managing cryptographic operations in the WSCD.',
  'CSC API': 'Cloud Signature Consortium API - Standard for remote signature creation services.',
  QES: 'Qualified Electronic Signature - A type of electronic signature with the same legal effect as a handwritten signature in the EU.',
  QTSP: 'Qualified Trust Service Provider - An organization authorized to provide qualified trust services.',
  'Relying Party':
    'An entity that relies on and verifies credentials presented by a holder (e.g., a bank verifying identity).',
  'Selective Disclosure':
    'Cryptographic technique allowing the holder to reveal only specific attributes from a credential, hiding all others from the verifier.',
  Unlinkability:
    'Privacy property ensuring that multiple presentations by the same holder cannot be correlated across different Relying Parties.',
  'Data Minimization':
    'GDPR principle (Art. 5(1)(c)) requiring collection of only the minimum personal data necessary for a specific purpose.',
  'Trusted List':
    'Machine-readable registry of Qualified Trust Service Providers published by each EU member state, enabling cross-border trust verification.',
  'eIDAS Trust Framework':
    'Cross-border mechanism ensuring mutual recognition of digital identities and qualified attestations across all 27 EU member states.',
}

// Module metadata
export const DIGITAL_ID_MODULE = {
  id: 'digital-id',
  title: 'Digital ID',
  description:
    'Master EUDI Wallet: Wallet activation, PID issuance, attestations, QES, and verification.',
  duration: '120 min',
}
