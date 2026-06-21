// SPDX-License-Identifier: GPL-3.0-only
//
// Persistent acronym glossary for the Product Records tab. Replaces the
// hidden "Glossary" toggle — these six terms gate comprehension of the whole
// page, so they stay on-screen. Each chip carries its full definition in a
// title tooltip.

interface GlossaryTerm {
  term: string
  short: string
  def: string
}

const TERMS: GlossaryTerm[] = [
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

export function RecordsGlossaryStrip() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/20 px-3.5 py-2.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        Glossary
      </span>
      {TERMS.map((t) => (
        <span
          key={t.term}
          title={t.def}
          className="inline-flex cursor-help items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[10.5px]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="font-semibold text-foreground">{t.term}</span>
          <span className="text-muted-foreground">{t.short}</span>
        </span>
      ))}
    </div>
  )
}
