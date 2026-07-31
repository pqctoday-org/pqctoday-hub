// SPDX-License-Identifier: GPL-3.0-only
/**
 * The US federal mandate stack and the Federal PKI profile pair.
 *
 * Sources, all cached in the evidence library:
 *   QCCPA-2022, OMB-M-23-02, OMB-M-26-15, EO-14306, CNSSP 15,
 *   CISA-PQC-CATEGORY-LIST-2026, NIST-SP-800-171-Rev-3,
 *   Common-Policy-X-509-Certificate-and-CRL-Profile (classical),
 *   Federal-PKI-Common-Policy-X-509-Certificate-and-CRL-Profile (PQC DRAFT).
 */

export interface FederalMandate {
  id: string
  /** library reference_id, so the module can deep-link the real document */
  libraryRef: string
  label: string
  instrument: 'Law' | 'Executive Order' | 'OMB Memorandum' | 'CNSS Policy' | 'Agency Guidance'
  appliesTo: string
  obligation: string
}

export const FEDERAL_MANDATES: FederalMandate[] = [
  {
    id: 'qccpa',
    libraryRef: 'QCCPA-2022',
    label: 'Quantum Computing Cybersecurity Preparedness Act',
    instrument: 'Law',
    appliesTo: 'Federal civilian executive-branch agencies',
    obligation:
      'Requires agencies to inventory cryptographic systems vulnerable to a CRQC and to migrate them, with OMB reporting. The statute is what makes the rest of the stack enforceable rather than advisory.',
  },
  {
    id: 'omb-m-23-02',
    libraryRef: 'OMB-M-23-02',
    label: 'OMB M-23-02 — Migrating to Post-Quantum Cryptography',
    instrument: 'OMB Memorandum',
    appliesTo: 'Federal civilian agencies',
    obligation:
      'Operationalises the QCCPA: prioritised cryptographic inventories and annual reporting of quantum-vulnerable systems.',
  },
  {
    id: 'omb-m-26-15',
    libraryRef: 'OMB-M-26-15',
    label: 'OMB M-26-15 — Execution of the Migration to Post-Quantum Cryptography',
    instrument: 'OMB Memorandum',
    appliesTo: 'Federal civilian agencies',
    obligation:
      'The execution-phase successor to M-23-02 — moves the programme from inventory to delivery.',
  },
  {
    id: 'eo-14306',
    libraryRef: 'EO-14306',
    label: 'Executive Order 14306',
    instrument: 'Executive Order',
    appliesTo: 'Federal agencies and their suppliers',
    obligation:
      'Sustains and amends prior federal cybersecurity direction, including the PQC provisions that drive the CISA product-category work.',
  },
  {
    id: 'cnssp-15',
    libraryRef: 'CNSSP 15',
    label: 'CNSS Policy 15',
    instrument: 'CNSS Policy',
    appliesTo: 'National Security Systems',
    obligation:
      'The instrument that actually carries the CNSA 2.0 dates. NSS follow this, not the OMB memoranda — a distinction that decides which deadline applies to a given system.',
  },
  {
    id: 'sp-800-171r3',
    libraryRef: 'NIST-SP-800-171-Rev-3-Protecting-Controlled-Unclassified-Inf',
    label: 'NIST SP 800-171 Rev. 3',
    instrument: 'Agency Guidance',
    appliesTo: 'Nonfederal systems processing Controlled Unclassified Information',
    obligation:
      'Reaches contractors, universities, and suppliers who never touch an NSS. Supersedes Rev. 2 (2021).',
  },
]

/**
 * Two Federal PKI certificate profiles, one classical and one post-quantum,
 * maintained by the same authority. Teaching them side by side is the point:
 * this is crypto agility as an actual document lifecycle, not a slogan.
 */
export const FPKI_PROFILE_PAIR = {
  classical: {
    libraryRef: 'Common-Policy-X-509-Certificate-and-CRL-Profile',
    label: 'Common Policy X.509 Certificate and CRL Profile',
    status: 'Published — current',
    algorithms: 'RSA, SHA',
    note: 'The profile in force for Federal PKI certificates today.',
  },
  postQuantum: {
    libraryRef: 'Federal-PKI-Common-Policy-X-509-Certificate-and-CRL-Profile',
    label: 'Common Policy X.509 Certificate and CRL Profiles — PQC',
    status: 'DRAFT, 21 April 2026',
    algorithms: 'ML-DSA, ML-KEM (plus RSA for the transition)',
    note: 'Created to profile ML-DSA and ML-KEM certificates for CITE testing, starting from v2.2 of the Common Policy profiles. Draft — do not cite as binding.',
  },
} as const
