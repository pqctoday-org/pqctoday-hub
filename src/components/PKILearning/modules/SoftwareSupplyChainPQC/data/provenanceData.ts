// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Provenance Chain Check (workshop step 2). Which sourced sentences describe a signature
 * algorithm in each ecosystem of the status map, and which checks the SLSA page lists. Every
 * cell points at claim ids; an empty cell means this lesson holds no sentence about the pair,
 * which is not a statement that none exists.
 */
import type { SourceClaimId } from './sourceClaims'

export interface Encoding {
  id: 'sigstore' | 'cabf' | 'uefi' | 'cose' | 'cms' | 'x509' | 'openpgp'
  label: string
}

export const ENCODINGS: Encoding[] = [
  { id: 'sigstore', label: 'Sigstore algorithm registry' },
  { id: 'cabf', label: 'CA/Browser Forum code signing requirements' },
  { id: 'uefi', label: 'UEFI Secure Boot' },
  { id: 'cose', label: 'COSE and JOSE' },
  { id: 'cms', label: 'CMS' },
  { id: 'x509', label: 'X.509' },
  { id: 'openpgp', label: 'OpenPGP' },
]

export interface SignatureChoice {
  id: string
  label: string
  cells: Partial<Record<Encoding['id'], SourceClaimId[]>>
}

export const SIGNATURE_CHOICES: SignatureChoice[] = [
  {
    id: 'ecdsa',
    label: 'ECDSA',
    cells: { sigstore: ['SC-2.1'], cabf: ['SC-2.2'] },
  },
  {
    id: 'ml-dsa',
    label: 'ML-DSA',
    cells: {
      sigstore: ['SC-2.1'],
      cabf: ['SC-2.2n'],
      uefi: ['SC-2.6n'],
      cose: ['SC-2.7b'],
      cms: ['SC-2.8c'],
      x509: ['SC-2.9a'],
      openpgp: ['SC-2.10'],
    },
  },
  {
    id: 'slh-dsa',
    label: 'SLH-DSA',
    cells: {
      cabf: ['SC-2.2n'],
      uefi: ['SC-2.6n'],
      cose: ['SC-2.7c'],
      cms: ['SC-2.8b'],
      x509: ['SC-2.9b'],
      openpgp: ['SC-2.10'],
    },
  },
  {
    id: 'hss-lms',
    label: 'HSS/LMS',
    cells: {
      cabf: ['SC-2.2n'],
      uefi: ['SC-2.6n'],
      cose: ['SC-2.7a'],
      cms: ['SC-2.8a'],
      x509: ['SC-2.9c'],
    },
  },
  {
    id: 'xmss',
    label: 'XMSS',
    cells: { cabf: ['SC-2.2n'], uefi: ['SC-2.6n'], x509: ['SC-2.9c'] },
  },
]

export interface VerificationCheck {
  id: string
  label: string
}

/** The three steps SC-4.3 says verification should include. */
export const VERIFICATION_CHECKS: VerificationCheck[] = [
  { id: 'builder', label: 'The builder identity is one of the trusted builders' },
  { id: 'signature', label: 'The signature on the provenance envelope is verified' },
  { id: 'parameters', label: 'buildType and externalParameters match the expected values' },
]

export const STAGES: { id: string; title: string; claims: SourceClaimId[] }[] = [
  { id: 'build', title: '1. Build', claims: ['SC-4.1'] },
  { id: 'provenance', title: '2. Provenance and statement', claims: ['SC-4.2', 'SC-4.4'] },
  {
    id: 'signature',
    title: '3. Signature on the envelope',
    claims: ['SC-4.6n', 'SC-4.7n', 'SC-4.8n', 'SC-4.9n'],
  },
  { id: 'verification', title: '4. Verification', claims: ['SC-4.3'] },
]
