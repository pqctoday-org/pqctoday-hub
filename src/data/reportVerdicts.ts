// SPDX-License-Identifier: AGPL-3.0-only
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
  grc: 'GRC view',
  architect: 'Architect view',
  developer: 'Developer view',
  researcher: 'Researcher view',
  'cert-engineer': 'Certification view',
  ops: 'Operations view',
  curious: 'Getting started',
}

/** Shown only when there is no result to describe — a neutral, conditional first-time-visitor
 *  framing. It asserts no exposure and no deadline: both depend on the assessment answers. */
export const NO_PERSONA_VERDICT: ReportVerdict = {
  tag: 'Summary',
  narrative:
    'Harvest-Now-Decrypt-Later is a risk for data that must stay confidential for years and can be recorded today; whether it applies to you, and which regulatory dates matter, depend on your answers. The NIST post-quantum standards (FIPS 203/204/205) are published, so the next step is migration planning. Complete the assessment to see your own exposure and the dates that apply to your situation.',
}

/**
 * Role-free summary built from the reported facts. Exposure and dates are stated only where
 * the result supports them, so a report with no exposed data and no dated framework never
 * reads as if it had both. It is written separately from `result.narrative` (the Risk Score
 * section shows that one), so the two never repeat each other.
 */
function neutralSummary(result: AssessmentResult | null): string {
  if (!result) return NO_PERSONA_VERDICT.narrative
  const parts: string[] = []
  const hndl = result.hndlRiskWindow
  if (hndl) {
    parts.push(
      hndl.isAtRisk
        ? 'Your answers describe data that must stay confidential beyond the planning anchor this site uses for a first quantum computer, so Harvest-Now-Decrypt-Later is an exposure to investigate.'
        : 'Your answers do not describe data that outlives the planning anchor this site uses for a first quantum computer, so Harvest-Now-Decrypt-Later is not flagged for the data you described.'
    )
  }
  const expecting = (result.complianceImpacts ?? []).filter((c) => c.requiresPQC === true).length
  if (expecting > 0) {
    parts.push(
      `${expecting} of your selected framework${expecting > 1 ? 's' : ''} state${expecting === 1 ? 's' : ''} a PQC expectation; read each source for its own dates and scope.`
    )
  }
  parts.push(
    'The NIST post-quantum standards (FIPS 203/204/205) are published; the prioritised actions below are where to start.'
  )
  return parts.join(' ')
}

export function reportVerdict(
  persona: PersonaId | null,
  result: AssessmentResult | null
): ReportVerdict {
  if (!persona) {
    return { tag: NO_PERSONA_VERDICT.tag, narrative: neutralSummary(result) }
  }
  return {
    // eslint-disable-next-line security/detect-object-injection -- persona is a typed enum key
    tag: PERSONA_TAG[persona] ?? NO_PERSONA_VERDICT.tag,
    narrative: result?.personaNarrative ?? result?.narrative ?? NO_PERSONA_VERDICT.narrative,
  }
}
