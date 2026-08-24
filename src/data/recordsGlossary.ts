// SPDX-License-Identifier: GPL-3.0-only
//
// The 6 acronyms that gate comprehension of the Compliance Records tab
// (FIPS 140-3 / ACVP / CC / EUCC / CNSA 2.0 / HNDL). Pure-moved out of
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
    def: 'NIST cryptographic module validation standard (supersedes 140-2). CMVP certifies the whole module. Required for US federal procurement.',
  },
  {
    term: 'ACVP',
    short: 'algorithm testing',
    def: 'Automated Cryptographic Validation Protocol — CAVP algorithm-level testing. Prerequisite for a FIPS 140-3 module cert.',
  },
  {
    term: 'CC',
    short: 'product evaluation',
    def: 'Common Criteria (ISO/IEC 15408). Issued under national schemes, mutually recognised under CCRA up to EAL2/EAL4.',
  },
  {
    term: 'EUCC',
    short: 'EU CC scheme',
    def: 'European Union Common Criteria scheme, operative 2024 under the Cybersecurity Act. Supersedes SOG-IS inside the EU.',
  },
  {
    term: 'CNSA 2.0',
    short: 'NSS mandate',
    def: 'NSA Commercial National Security Algorithm suite v2.0 — binding PQC requirements for US National Security Systems, full transition by 2035.',
  },
  {
    term: 'HNDL',
    short: 'harvest-now-decrypt-later',
    def: 'Adversaries collect ciphertext today and decrypt once a quantum computer exists — the threat driving near-term migration of long-lived data.',
  },
]
