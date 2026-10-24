// SPDX-License-Identifier: AGPL-3.0-only
//
// The 7 acronyms that gate comprehension of the Compliance Records tab
// (FIPS 140-3 / NIST CAVP / ESV / CC / CSPN / EUCC / CNSA 2.0 / HNDL). Pure-moved out of
// RecordsGlossaryStrip.tsx (2026-08-24 audit R3.3) — MobileComplianceView.tsx
// carried a verbatim second copy of this same regulatory content, which
// would have silently drifted from the desktop definitions on the next
// edit to either file.

export interface GlossaryTerm {
  term: string
  short: string
  def: string
}

export const RECORDS_GLOSSARY: GlossaryTerm[] = [
  {
    term: 'FIPS 140-3',
    short: 'module validation',
    def: 'Security requirements for cryptographic modules. Under CMVP, a certificate applies to a defined module, version, operational environment and approved mode—not automatically to an entire product or deployment.',
  },
  {
    term: 'ACVP',
    short: 'algorithm testing protocol',
    def: 'Automated Cryptographic Validation Protocol — the JSON-over-HTTPS protocol NIST’s ACVTS uses for CAVP algorithm testing. ACVP itself issues no certificate; CAVP does.',
  },
  {
    term: 'NIST CAVP',
    short: 'algorithm validation',
    def: 'Cryptographic Algorithm Validation Program — validates individual algorithm implementations (tested through the ACVP protocol). A prerequisite for a FIPS 140-3 module certificate, not a module certificate itself.',
  },
  {
    term: 'ESV',
    short: 'entropy source validation',
    def: 'NIST CMVP entropy source validation (SP 800-90B) — validates a noise source, not a module or an algorithm. A FIPS 140-3 module that relies on one names its certificate in its Security Policy. It says nothing about post-quantum algorithms.',
  },
  {
    term: 'CC',
    short: 'product evaluation',
    def: 'Common Criteria (ISO/IEC 15408) security evaluation against a stated Security Target under a national scheme. Recognition depends on the CCRA arrangement, assurance components and scheme scope; it is not universal product approval.',
  },
  {
    term: 'CSPN',
    short: 'ANSSI national scheme',
    def: "ANSSI's Certification de Sécurité de Premier Niveau — a French national first-level certification, separate from Common Criteria and not recognised under CCRA.",
  },
  {
    term: 'EUCC',
    short: 'EU CC scheme',
    def: 'The EU cybersecurity certification scheme based on Common Criteria under the Cybersecurity Act. Certificates and assurance claims remain scoped to the evaluated product and its certification documentation.',
  },
  {
    term: 'CNSA 2.0',
    short: 'NSS mandate',
    def: 'NSA algorithm and transition profile for US National Security Systems. Its practical mandate comes through applicable NSS policy and implementation direction; the suite is not a general private-sector regulation.',
  },
  {
    term: 'HNDL',
    short: 'harvest-now-decrypt-later',
    def: 'Adversaries collect ciphertext today and decrypt once a quantum computer exists — the threat driving near-term migration of long-lived data.',
  },
]
