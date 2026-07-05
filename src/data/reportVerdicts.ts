// SPDX-License-Identifier: GPL-3.0-only
/**
 * Per-persona "verdict" for the Quantum Risk Report hero (redesign). The same
 * assessed risk is re-led for each role: the score, gauge and action list stay
 * the same; only the framing tag + narrative change.
 *
 * The narrative is the engine's own persona+score-aware text
 * (`result.personaNarrative`, from `generatePersonaNarrative` — see
 * hooks/assessment/personas.ts), NOT a static per-persona string: an earlier
 * version hand-wrote a fixed narrative here regardless of the user's actual
 * score, and — because the Risk Score section ALSO rendered
 * `result.personaNarrative` — the two ended up saying overlapping things a few
 * inches apart on the same page. Only the short `tag` stays static; the real,
 * result-specific text now lives here exclusively (Risk Score shows the
 * neutral `result.narrative` instead — see ReportContent.tsx).
 */
import type { PersonaId } from './learningPersonas'
import type { AssessmentResult } from '../hooks/assessmentTypes'

export interface ReportVerdict {
  /** Short role tag shown on the violet pill, e.g. "Executive view". */
  tag: string
  /** The result's persona-aware narrative (or the neutral one as fallback). */
  narrative: string
}

/** Short role tag per persona — the only static part of the verdict now. */
const PERSONA_TAG: Record<PersonaId, string> = {
  executive: 'Executive view',
  architect: 'Architect view',
  developer: 'Developer view',
  researcher: 'Researcher view',
  ops: 'Operations view',
  curious: 'Getting started',
}

/** Shown when no persona is selected — generic first-time-visitor framing,
 *  not tied to any specific result. */
export const NO_PERSONA_VERDICT: ReportVerdict = {
  tag: 'Summary',
  narrative:
    'Your data faces a Harvest-Now-Decrypt-Later risk: encrypted today, it can be stored and broken once a quantum computer arrives, with regulatory deadlines clustering around 2030. The standards (NIST FIPS 203/204/205) are final — the gap is migration. The prioritised actions below are where to start.',
}

export function reportVerdict(
  persona: PersonaId | null,
  result: AssessmentResult | null
): ReportVerdict {
  if (!persona) return NO_PERSONA_VERDICT
  return {
    // eslint-disable-next-line security/detect-object-injection -- persona is a typed enum key
    tag: PERSONA_TAG[persona] ?? NO_PERSONA_VERDICT.tag,
    narrative: result?.personaNarrative ?? result?.narrative ?? NO_PERSONA_VERDICT.narrative,
  }
}
