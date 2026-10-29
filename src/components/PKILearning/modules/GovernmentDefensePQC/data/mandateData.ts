// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The US federal mandate stack and the Federal PKI profile pair.
 *
 * Sources, all cached in the evidence library:
 *   QCCPA-2022, OMB-M-23-02, OMB-M-26-15, EO-14306, EO-2026-06-22-Securing-the-Nation
 *   (Executive Order 14412), CNSSP 15,
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
      'To comply with NSM-10, directs agencies to submit a prioritised inventory of CRQC-vulnerable cryptographic systems (excluding National Security Systems) by 4 May 2023 and annually thereafter until 2035, or as directed by superseding guidance.',
  },
  {
    id: 'omb-m-26-15',
    libraryRef: 'OMB-M-26-15',
    label: 'OMB M-26-15 — Execution of the Migration to Post-Quantum Cryptography',
    instrument: 'OMB Memorandum',
    appliesTo: 'Federal civilian agencies',
    obligation:
      'Implements the accelerated migration set by Executive Order 14412 (22 June 2026), and fulfils OMB’s responsibility under the QCCPA to issue guidance directing each agency to prioritise critical IT for migration to PQC and to plan that migration. Each agency submits a PQC migration plan within 120 days, phased from discovery (2026–2027) through pilots (2027–2028), prioritised key-establishment migration (2028–2030) and signature migration (2031) to full migration (2035). It does not apply to National Security Systems.',
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
    id: 'eo-14412',
    libraryRef: 'EO-2026-06-22-Securing-the-Nation',
    label: 'Executive Order 14412 — Securing the Nation Against Advanced Cryptographic Attacks',
    instrument: 'Executive Order',
    appliesTo:
      'Federal agencies (high value assets and high impact systems, not National Security Systems); covered contractors through a directed FAR rule',
    obligation:
      'Section 4(b) directs OMB to require agencies to move all high value assets and high impact systems to post-quantum cryptography for key establishment by 31 December 2030 and for digital signatures by 31 December 2031. Section 6(c) directs the FAR Council to publish, within 180 days, a proposed rule requiring covered contractors to comply by 31 December 2030 with NIST FIPS, including all applicable FIPS incorporating PQC-compliant algorithms. The order directs a proposed rule; it is not itself that rule.',
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
      'Reaches contractors, universities, and suppliers who never touch an NSS. NIST states that it supersedes Rev. 2 (February 2020), but DoD’s CMMC briefing (cleared for open publication 21 January 2025) says CMMC assessments remain against Rev. 2 until DoD formally adopts Rev. 3 through rulemaking.',
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
    algorithms: 'ML-DSA, ML-KEM',
    note: 'Created to profile ML-DSA and ML-KEM certificates for CITE testing, starting from v2.2 of the Common Policy profiles. Draft — do not cite as binding.',
  },
} as const
