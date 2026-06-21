// SPDX-License-Identifier: GPL-3.0-only
/**
 * Per-persona "verdict" for the Quantum Risk Report hero (redesign). The same
 * assessed risk is re-led for each role: the score, gauge and action list stay
 * the same; only the framing sentence + tag change. DRAFT copy — pending review.
 *
 * The narrative deliberately avoids hard-coding the numeric score (that lives in
 * the gauge); it frames what the result MEANS for that role and what to do first.
 */
import type { PersonaId } from './learningPersonas'

export interface ReportVerdict {
  /** Short role tag shown on the violet pill, e.g. "Executive view". */
  tag: string
  /** 1–3 sentence framing of the result for this role. */
  narrative: string
}

export const REPORT_VERDICT: Record<PersonaId, ReportVerdict> = {
  executive: {
    tag: 'Executive view',
    narrative:
      'This is a material, time-bound business risk: data you protect today can be harvested now and decrypted once a quantum computer arrives, and CNSA 2.0 sets a 2030 line for federal and regulated systems. The cheapest move this quarter is to fund a cryptographic inventory and name a migration owner — the cost of acting scales with how long you wait.',
  },
  architect: {
    tag: 'Architect view',
    narrative:
      'The critical path is the RSA and ECDSA in your TLS, PKI and code-signing — everywhere a long-lived secret or signature depends on classical public-key crypto. Put a crypto-agility layer at PKI/TLS first so algorithms become swappable, then pilot hybrid ML-KEM-768 key exchange before committing to a full migration sequence.',
  },
  developer: {
    tag: 'Developer view',
    narrative:
      'Start by getting your code off hard-coded primitives: wrap crypto calls behind a swappable interface so an algorithm change is a config change, not a rewrite. Pilot hybrid TLS in a non-critical service, then migrate code-signing to ML-DSA-65 — the standardised replacement for ECDSA signatures.',
  },
  researcher: {
    tag: 'Researcher view',
    narrative:
      'The result maps your estate against the now-final NIST standards (FIPS 203/204/205) and the Harvest-Now-Decrypt-Later window. The high-value follow-ups are quantifying data shelf-life versus the CRQC estimate, and tracking which of your protocols have ratified post-quantum profiles versus drafts still in flight.',
  },
  ops: {
    tag: 'Operations view',
    narrative:
      'Translate this into runbooks: which certificates, keys and services rotate to post-quantum algorithms, in what order, and with what rollback. Begin where exposure is highest and change is cheapest — TLS termination and certificate issuance — and stand up monitoring for crypto inventory drift so new classical keys do not quietly reappear.',
  },
  curious: {
    tag: 'Getting started',
    narrative:
      'Quantum computers will eventually break the maths protecting today’s secure connections, and attackers can store encrypted data now to crack later. Your score reflects how exposed your data is and how ready you are to switch to the new quantum-safe algorithms. The good news: the standards are finished, and the actions below are concrete first steps.',
  },
}

/** Shown when no persona is selected. */
export const NO_PERSONA_VERDICT: ReportVerdict = {
  tag: 'Summary',
  narrative:
    'Your data faces a Harvest-Now-Decrypt-Later risk: encrypted today, it can be stored and broken once a quantum computer arrives, with regulatory deadlines clustering around 2030. The standards (NIST FIPS 203/204/205) are final — the gap is migration. The prioritised actions below are where to start.',
}

export function reportVerdict(persona: PersonaId | null): ReportVerdict {
  if (!persona) return NO_PERSONA_VERDICT
  // eslint-disable-next-line security/detect-object-injection -- persona is a typed enum key
  return REPORT_VERDICT[persona] ?? NO_PERSONA_VERDICT
}
