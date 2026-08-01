// SPDX-License-Identifier: GPL-3.0-only
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
      // Renamed from `cryptographic_suites_supported` in OpenID4VCI 1.0 Final.
      credential_signing_alg_values_supported: ['ES256', 'ES384'],
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
      format: { 'dc+sd-jwt': {} },
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

// NOTE: an `EUDI_GLOSSARY` map of 22 EUDI definitions used to live here.
// Its only consumer was InfoTooltip.tsx, which was never rendered, so none
// of it reached a learner — while mso_mdoc / SD-JWT VC / COSE_Sign1 rendered
// as dead <InlineTooltip> terms in this very module. The definitions were
// migrated into src/data/glossary/concepts.json on 2026-07-31, where the
// global tooltip and glossary page both read them.

// NOTE: a `DIGITAL_ID_MODULE` constant used to live here duplicating the
// module's id/title/description/duration. It had no consumers and its
// duration ('120 min') contradicted the manifest ('80 min'), which is what
// the UI actually renders. manifest.ts is the single source of truth.
