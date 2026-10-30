// SPDX-License-Identifier: AGPL-3.0-only
/**
 * C2PA Content Credentials: Technical Specification, Version 2.4
 * (library `Content-Credentials-C2PA-Technical-Specification-Version-2-4`), with the two
 * IETF COSE documents that bear on a post-quantum signature
 * (library `RFC-9964`, `SLH-DSA-for-JOSE-and-COSE`).
 */

export const C2PA_EDITION = 'C2PA Technical Specification, Version 2.4'

export interface C2paAlgorithm {
  id: string
  label: string
  family: 'ECDSA' | 'RSASSA-PSS' | 'EdDSA'
  note: string
}

/** The allowed list for generating new claim signatures. The deprecated list is empty. */
export const C2PA_ALLOWED: C2paAlgorithm[] = [
  { id: 'ES256', label: 'ES256', family: 'ECDSA', note: 'ECDSA with SHA-256' },
  { id: 'ES384', label: 'ES384', family: 'ECDSA', note: 'ECDSA with SHA-384' },
  { id: 'ES512', label: 'ES512', family: 'ECDSA', note: 'ECDSA with SHA-512' },
  {
    id: 'PS256',
    label: 'PS256',
    family: 'RSASSA-PSS',
    note: 'RSASSA-PSS using SHA-256 and MGF1 with SHA-256',
  },
  {
    id: 'PS384',
    label: 'PS384',
    family: 'RSASSA-PSS',
    note: 'RSASSA-PSS using SHA-384 and MGF1 with SHA-384',
  },
  {
    id: 'PS512',
    label: 'PS512',
    family: 'RSASSA-PSS',
    note: 'RSASSA-PSS using SHA-512 and MGF1 with SHA-512',
  },
  {
    id: 'EdDSA',
    label: 'EdDSA',
    family: 'EdDSA',
    note: 'Ed25519 instance only; no other EdDSA instances are allowed',
  },
]

export const C2PA_FACTS = {
  deprecatedList: 'The deprecated list is empty.',
  curves:
    'C2PA recommends P-256 keys with ES256, P-384 keys with ES384 and P-521 keys with ES512 but does not require it; implementations accept keys on any of these curves for all ECDSA algorithm choices.',
  cose: 'A C2PA claim signature is a serialized COSE_Sign1_Tagged structure, written into the C2PA Claim Signature box.',
  timestamp:
    'A signature may carry an RFC 3161 time-stamp, in a COSE unprotected header named sigTst2 (the earlier sigTst form is deprecated). With no time-stamp, neither header is present.',
  trust:
    'C2PA keeps a C2PA Trust List of signer trust anchors for certificates that carry the c2pa-kp-claimSigning extended key usage, and a separate C2PA TSA Trust List for time-stamp authorities.',
  revocation:
    'Validation checks the signer credential’s revocation information: a manifest fails if the signer credential is found revoked by OCSP (failure code signingCredential.ocsp.revoked).',
  hash: 'The allowed hash list leaves out the SHA-3 family for consistency with the signature list, because COSE has not yet established signature algorithms that use a SHA-3 algorithm as the hash.',
}

export interface CandidateAlgorithm {
  id: string
  label: string
  onC2paList: boolean
  detail: string
}

/** Candidates for the allowed-list check. Every verdict follows from the list above. */
export const CANDIDATES: CandidateAlgorithm[] = [
  ...C2PA_ALLOWED.map((a) => ({
    id: a.id,
    label: a.id === 'EdDSA' ? 'EdDSA (Ed25519)' : a.label,
    onC2paList: true,
    detail: `On the allowed list: ${a.note}.`,
  })),
  {
    id: 'ed448',
    label: 'EdDSA (Ed448)',
    onC2paList: false,
    detail:
      'Not allowed: the list says Ed25519 instance only and that no other EdDSA instances are allowed.',
  },
  {
    id: 'ml-dsa-65',
    label: 'ML-DSA-65',
    onC2paList: false,
    detail:
      'Not on the C2PA 2.4 allowed list. A separate document, RFC 9964 (Standards Track, May 2026), specifies COSE and JOSE serializations for ML-DSA (FIPS 204).',
  },
  {
    id: 'slh-dsa-128s',
    label: 'SLH-DSA-SHA2-128s',
    onC2paList: false,
    detail:
      'Not on the C2PA 2.4 allowed list. COSE and JOSE serializations for SLH-DSA (FIPS 205) are specified in an IETF working-group draft, not yet a standard.',
  },
]

export const COSE_PQ_DOCUMENTS = {
  mlDsa:
    'RFC 9964 (Standards Track, May 2026) specifies JOSE and COSE serializations for ML-DSA (FIPS 204).',
  slhDsa:
    'An IETF working-group Internet-Draft specifies JOSE and COSE serializations for SLH-DSA (FIPS 205). It is a draft, not a standard.',
}
