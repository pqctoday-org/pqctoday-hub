// SPDX-License-Identifier: AGPL-3.0-only

export type IncidentalAlgorithmCoverage = 'models' | 'teaches'

export interface IncidentalAlgorithmDecision {
  coverage: IncidentalAlgorithmCoverage
  reason: string
}

/**
 * Human-reviewed disposition for algorithm-family mentions found in a tool's
 * import graph but intentionally absent from its executable-algorithm list.
 * Keeping these separate prevents search/cards from claiming execution merely
 * because a comparison, migration note, or model mentions the family.
 */
export const PLAYGROUND_INCIDENTAL_ALGORITHM_MENTIONS: Record<string, IncidentalAlgorithmDecision> =
  {
    'cacp-kmip:SLH-DSA': {
      coverage: 'models',
      reason: 'Policy/capability modelling, not an advertised operation in this tool.',
    },
    'cacp-kmip:LMS': {
      coverage: 'models',
      reason: 'Policy/capability modelling, not an advertised operation in this tool.',
    },
    'cacp-kmip:XMSS': {
      coverage: 'models',
      reason: 'Policy/capability modelling, not an advertised operation in this tool.',
    },
    'envelope-encrypt:ML-DSA': {
      coverage: 'teaches',
      reason:
        'Signature-family comparison text; envelope execution uses KEM and symmetric wrapping.',
    },
    'envelope-encrypt:SLH-DSA': {
      coverage: 'teaches',
      reason:
        'Signature-family comparison text; envelope execution uses KEM and symmetric wrapping.',
    },
    'token-migration:ML-KEM': {
      coverage: 'teaches',
      reason: 'Migration context only; this tool executes token signatures.',
    },
    'firmware-signing:XMSS': {
      coverage: 'teaches',
      reason: 'Stateful-signature comparison only; XMSS signing is not offered here.',
    },
    'slh-dsa:LMS': {
      coverage: 'teaches',
      reason: 'Comparison with another hash-based signature family.',
    },
    'tls-simulator:SLH-DSA': {
      coverage: 'teaches',
      reason: 'Certificate/signature context only; not a selectable TLS identity.',
    },
    'pqc-ssh-sim:SLH-DSA': {
      coverage: 'teaches',
      reason: 'Host-key comparison context; not a selectable SSH operation.',
    },
    'pki-workshop:ML-KEM': {
      coverage: 'teaches',
      reason: 'PQC migration context; the workshop does not issue a KEM certificate operation.',
    },
    'pki-workshop:SLH-DSA': {
      coverage: 'teaches',
      reason: 'Certificate-family comparison context; not a selectable issuer operation.',
    },
    'hybrid-certs:ML-KEM': {
      coverage: 'teaches',
      reason: 'Certificate-format explanation, not a KEM execution path.',
    },
    'hybrid-certs:LMS': {
      coverage: 'teaches',
      reason: 'Historical/format comparison, not a selectable generator.',
    },
    'merkle-proof:ML-DSA': {
      coverage: 'teaches',
      reason: 'Certificate-size comparison; the tool executes hashing and Merkle proofs.',
    },
    'merkle-proof:SLH-DSA': {
      coverage: 'teaches',
      reason: 'Certificate-size comparison; the tool executes hashing and Merkle proofs.',
    },
    'digital-id:ML-KEM': {
      coverage: 'models',
      reason: 'Future wallet migration scenario, not the modelled current credential operation.',
    },
    'digital-id:ML-DSA': {
      coverage: 'models',
      reason: 'Future wallet migration scenario, not the modelled current credential operation.',
    },
    'digital-id:SLH-DSA': {
      coverage: 'models',
      reason: 'Future wallet migration scenario, not the modelled current credential operation.',
    },
    'hd-wallet:ML-DSA': {
      coverage: 'teaches',
      reason: 'Migration comparison; wallet derivation remains BIP39/BIP32.',
    },
    'hd-wallet:SLH-DSA': {
      coverage: 'teaches',
      reason: 'Migration comparison; wallet derivation remains BIP39/BIP32.',
    },
    'openssl-studio:LMS': {
      coverage: 'teaches',
      reason: 'Reference/help material; LMS is not advertised as a runnable Studio algorithm.',
    },
  }
