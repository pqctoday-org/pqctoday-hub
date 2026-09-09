// SPDX-License-Identifier: GPL-3.0-only
/**
 * personaDebrief (W7.4) — what this run means for the seat the player sat in.
 *
 * The run-end ceremony said the same thing to everyone: a grade, a maturity
 * number and three objectives. That is a sponsor's view, and it left an
 * architect without their technical evidence, an operator without a cadence,
 * and a newcomer without a plain-language explanation of what they just saw.
 *
 * Two things are kept apart on purpose, because the audit found them conflated:
 *  - SPONSORSHIP (funding, ownership, risk acceptance, sequencing) — the
 *    executive question.
 *  - ASSURANCE (applicability, evidence gaps, review cadence, exceptions) — the
 *    governance question, which is not answered by having a sponsor.
 *
 * Nothing here claims competence. A debrief describes what the run
 * demonstrated and what the seat still owes; it never asserts the player can
 * now do it. Clicks are not competence.
 */
import type { PersonaId } from '@/data/learningPersonas'

export interface PersonaDebrief {
  /** How to read this run from this seat. */
  headline: string
  /** The single next action this seat would actually take. */
  nextAction: string
  /** What this seat is on the hook to produce or review — the evidence
   *  obligation, stated separately from any sponsorship claim. */
  evidenceObligation: string
  /** Where to go next in the hub. */
  nextStop: { label: string; to: string }
}

const DEBRIEFS: Record<PersonaId, PersonaDebrief> = {
  executive: {
    headline:
      'You sequenced a migration and paid for it. The question a board asks next is not "is it done" but "who owns it, and what did we accept".',
    nextAction:
      'Name the standing owner for each continuing capability and record what residual risk you are explicitly accepting, with a re-evaluation date.',
    evidenceObligation:
      'A charter, a funded multi-year plan, and a minuted decision at the level that chartered the programme. Sponsorship is not assurance — someone still has to evidence that the work happened.',
    nextStop: { label: 'Business tools — charter and roadmap', to: '/business' },
  },
  grc: {
    // W7.4: GRC is a DISTINCT seat from executive, which is the whole point of
    // the split. Sponsorship answers "who owns it and what did we accept";
    // assurance answers "which obligations applied, and what proves it". Having
    // a sponsor evidences nothing.
    headline:
      'You ran the programme against one jurisdiction and one scenario. Assurance asks a different question from sponsorship: which obligations actually applied here, and what proves the work happened.',
    nextAction:
      'Work the applicability out properly — sector, system scope and effective date, not country alone — then list every criterion you could not evidence and who owns closing it.',
    evidenceObligation:
      'Verification records against a stated evidence standard, an exceptions register with owners and review dates, and a recurring review cadence. A dossier that exists is not a dossier that was reviewed, and a deadline that applies to federal systems does not apply to you because you share a country with them.',
    nextStop: { label: 'Compliance — obligations and evidence', to: '/compliance' },
  },
  researcher: {
    headline:
      'You watched a migration play out under one set of assumptions — a CRQC horizon, a shelf life, a set of parameter choices. Every one of those is a modelling decision, not a measurement.',
    nextAction:
      'Change one assumption that the scenario fixed for you — pull the threat horizon in, or lengthen the data shelf life — and work out which decisions in the run would no longer hold.',
    evidenceObligation:
      'Stated assumptions with their sources and dates, and a clear line between what a standard specifies and what this scenario asserted for teaching purposes. Published expert estimates are opinion surveys, not forecasts.',
    nextStop: { label: 'Algorithms — parameters and security levels', to: '/algorithms' },
  },
  architect: {
    headline:
      'You made migration decisions across an estate. What a design review will probe is whether the decisions hold at the edges you did not touch.',
    nextAction:
      'Re-examine the connections you left classical or bridged, and state what makes each one acceptable — or what would have to change first.',
    evidenceObligation:
      'A current CBOM, a scored inventory, and interoperability and rollback results for the patterns you chose. Producing a diagram is not the same as demonstrating the estate behaves.',
    nextStop: {
      label: 'Algorithms — protocol support and trade-offs',
      to: '/algorithms?tab=support',
    },
  },
  developer: {
    headline:
      'You moved a programme through its phases. Implementation is where a plan meets a library, a key size and a handshake that has to keep working.',
    nextAction:
      'Take one system you migrated in the scenario and work the real change: swap the primitive, run the tests, and see what breaks.',
    evidenceObligation:
      'Working code paths with test evidence — KATs or interop results — not a completed reading list. A passed comprehension check records understanding, not a working implementation.',
    nextStop: { label: 'Playground — hands-on crypto', to: '/playground' },
  },
  ops: {
    headline:
      'You brought infrastructure through a migration. Operations is judged on what happens after the project ends.',
    nextAction:
      'Set the thresholds you would actually alert on — capacity, certificate lifetime, discovery drift — and decide who is paged when one moves.',
    evidenceObligation:
      'Capacity measured at production scale, monitoring that detects drift, and a corrective action that was re-measured afterwards. A baseline taken once is already out of date.',
    nextStop: { label: 'Migrate — the product estate you operate', to: '/migrate' },
  },
  curious: {
    headline:
      'You just watched a multi-year cryptography migration compressed into a few decisions. The short version: the danger is not that today’s encryption breaks tomorrow, it is that data captured today can be decrypted later.',
    nextAction:
      'Pick one thing that surprised you and follow it — the harvest-now idea, or why a deadline can matter more than the threat itself.',
    evidenceObligation:
      'Nothing is owed here. This run demonstrated a programme; it did not test you, and it does not say you could run one.',
    nextStop: { label: 'Learn — start with the threat', to: '/learn/quantum-threats' },
  },
}

export function personaDebrief(seat: string): PersonaDebrief {
  return DEBRIEFS[seat as PersonaId] ?? DEBRIEFS.curious
}

/**
 * The honest framing for a run whose progress came mostly from watching.
 * `learnerShare` is the fraction of this run's evidence the player produced
 * themselves (0–1).
 */
export function completionTypeNote(learnerShare: number): string {
  if (learnerShare >= 0.8) return 'Almost all of this run’s evidence is work you did yourself.'
  if (learnerShare >= 0.4)
    return 'A meaningful part of this run was demonstrated for you rather than done by you — the debrief below describes the programme, not your practice of it.'
  return 'This run was mostly a demonstration you watched. It shows how a migration goes; it is not a record that you carried one out.'
}
