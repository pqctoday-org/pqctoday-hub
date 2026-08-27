// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure-move extraction (IMPLEMENTATION-PLAN.md §5.4, E-3) — `Intent`,
 * `INTENTS`, `PERSONA_INTENTS` and `EU_EXECUTIVE_INTENTS` were exported from
 * AlgorithmEntryStrip.tsx (a desktop view component) already; moved verbatim
 * to a data module so the mobile Algorithms screen — and the existing
 * AlgorithmEntryStrip.driftguard.test.ts — can both read them without either
 * depending on a component file. AlgorithmEntryStrip.tsx re-imports all three
 * from here under the same names.
 */
import { ArrowRight, FlaskConical, Network, Shuffle } from 'lucide-react'
import type { PersonaId } from '@/data/learningPersonas'

export interface Intent {
  label: string
  description: string
  icon: React.ReactNode
  params: Record<string, string | null>
}

// Exported (ACCURACY-0705) so a drift-guard test can assert every literal
// `status:` value here is a real member of AlgorithmFilters' STATUS_ITEMS —
// this is exactly the class of bug that shipped a 'Standardized' value no
// filter enum recognised, silently producing a zero-result CTA.
export const INTENTS: Intent[] = [
  {
    label: 'Replace a classical algorithm',
    description: 'Find the right PQC drop-in for RSA, ECC, or AES',
    icon: <Shuffle size={15} />,
    params: { tab: 'transition' },
  },
  {
    label: 'Understand PQC protocols',
    description: 'See TLS, SSH, and IKE standardization status',
    icon: <Network size={15} />,
    params: { tab: 'support' },
  },
  {
    label: 'Run a live test',
    description: 'Execute KAT vectors against real WASM implementations',
    icon: <FlaskConical size={15} />,
    // KAT Validation lives on the Validation tab (moved from Detailed
    // Comparison) — see AlgorithmValidationView.tsx.
    params: { tab: 'validation', section: 'kat' },
  },
]

export const PERSONA_INTENTS: Partial<Record<PersonaId, Intent>> = {
  executive: {
    label: 'View top compliance picks',
    description: 'ML-KEM-768 and ML-DSA-65 — the FIPS-required choices for US federal compliance',
    icon: <ArrowRight size={15} />,
    params: {
      tab: 'detailed',
      highlight: 'ML-KEM-768,ML-DSA-65,SLH-DSA-SHA2-128s',
    },
  },
  developer: {
    label: 'Find a drop-in replacement',
    description: 'Transition table with key sizes, performance, and standardization status',
    icon: <Shuffle size={15} />,
    // ACCURACY-0705: 'Standardized' is not a value in STATUS_ITEMS
    // (AlgorithmFilters.tsx) — this was a zero-result dead end for every
    // Developer-persona user, since it's the persona's default entry CTA.
    // 'Certified' is the closest existing status (FIPS 203/204/205 finalized).
    params: { tab: 'transition', status: 'Certified' },
  },
  architect: {
    label: 'See protocol readiness',
    description: 'TLS, SSH, IKE, QUIC and more — IETF stage status across 4 PQC dimensions',
    icon: <Network size={15} />,
    params: { tab: 'support' },
  },
  researcher: {
    label: 'Run KAT validation',
    description: 'Execute ACVP-style vectors and cross-validate against WASM implementations',
    icon: <FlaskConical size={15} />,
    params: { tab: 'validation', section: 'kat' },
  },
}

// bplus-programme WS4c (2026-08-07): the executive default above is a US/NIST
// FIPS claim, which is wrong to show unqualified to an EU visitor — BSI and
// ANSSI have their OWN, DIFFERENT positions, verified against their primary
// documents (both cached in pqctoday-priv/local-evidence-cache/library/):
// BSI-TR-02102-1.pdf (2026-01 ed.) and ANSSI-PG-083-v3-2026.pdf. They are
// shown as two separate entries, never merged into one line, because they
// disagree on more than the "which alternate" question:
//   - BSI: ML-KEM/ML-DSA are listed as suitable standalone (no hybrid
//     language in their sections). SLH-DSA is recommended ONLY at NIST
//     Category 3/5 (192-/256-bit) — Category 1 (128-bit) is absent from its
//     recommended-parameters table. Two hybrid-mode conservative KEM
//     alternates are named: FrodoKEM-976/1344 and Classic McEliece
//     (460896/6688128/8192128).
//   - ANSSI: explicit rule — "used without hybridization, regardless of
//     parameter set, ML-KEM/ML-DSA do not respect RègleSécuAsym." Standalone
//     PQC is not compliant for these two mechanisms at all. SLH-DSA is the
//     one exception ANSSI calls out as compliant standalone, with no
//     category restriction stated. Its named hybrid KEM alternate is
//     FrodoKEM-976 only — Classic McEliece appears nowhere in the document
//     (checked: zero matches for "McEliece" or "Goppa").
// Drift-guarded in AlgorithmEntryStrip.driftguard.test.ts against a
// hand-verified allowlist transcribed from BSI's own recommended-parameter
// tables, so a future edit can't silently attribute an unverified algorithm
// to either authority.
export const EU_EXECUTIVE_INTENTS: Intent[] = [
  {
    label: 'BSI (Germany)',
    description:
      'ML-KEM-768 and ML-DSA-65 usable standalone; SLH-DSA recommended at 192-bit+, not 128; FrodoKEM-976 or Classic McEliece for hybrid high-assurance',
    icon: <ArrowRight size={15} />,
    params: {
      tab: 'detailed',
      highlight: 'ML-KEM-768,ML-DSA-65,SLH-DSA-SHA2-192s,FrodoKEM-976,Classic-McEliece-6688128',
    },
  },
  {
    label: 'ANSSI (France)',
    description:
      'ML-KEM-768 and ML-DSA-65 require hybridization with a classical algorithm — no standalone PQC yet; SLH-DSA is usable alone; FrodoKEM-976 is the hybrid pick',
    icon: <ArrowRight size={15} />,
    params: {
      tab: 'detailed',
      highlight: 'ML-KEM-768,ML-DSA-65,SLH-DSA-SHA2-128s,FrodoKEM-976',
    },
  },
]
