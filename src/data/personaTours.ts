// SPDX-License-Identifier: GPL-3.0-only
/**
 * Four short role tours — B+ remediation 4.2 (2026-08-10).
 *
 * Onboarding carried exactly one role out of six properly. Executive has a real
 * eight-phase guided tour (`EXEC_TOUR_STAGES` in the simulation) and curious has
 * a four-step guide (`CuriousGuide`); developer, architect, researcher and ops
 * got the same generic feature deck as an anonymous visitor, plus a disclaimer.
 *
 * These are deliberately SHORT — four steps, each pointing at a surface that
 * already exists, ending somewhere the reader has done something rather than
 * read something. "Each tour is a few screens against a surface that already
 * exists" is the whole design; anything longer would be a second product.
 *
 * They render as a final phase of the existing `GuidedTour` modal, reusing its
 * slide shape, its keyboard handling and its completion storage. No new tour
 * machinery was built.
 *
 * Every `route` here is validated against `App.tsx`'s real route set by
 * `personaTours.test.ts` — a tour that ends on a 404 is worse than no tour.
 */
import type { PersonaId } from './learningPersonas'

export interface PersonaTourStep {
  title: string
  /** Two sentences at most. What this surface is for, and what to do on it. */
  description: string
  /** Where the step sends the reader. Must be a real route. */
  route: string
  /** Label for the button that goes there. */
  cta: string
}

export interface PersonaTour {
  /** One line shown above the steps: what this tour gets you, and how long. */
  promise: string
  steps: PersonaTourStep[]
}

export const PERSONA_TOURS: Partial<Record<PersonaId, PersonaTour>> = {
  // "A five-minute first real crypto operation, ending in the Playground."
  developer: {
    promise: 'Five minutes, ending with you having run real post-quantum crypto in this browser.',
    steps: [
      {
        title: 'See what actually changes',
        description:
          'The transition table maps each classical algorithm to its replacement and states, in bytes, what that costs you. Start here so the rest is about consequences rather than names.',
        route: '/algorithms',
        cta: 'Open the transition table',
      },
      {
        title: 'Check the protocol you own',
        description:
          'The Protocol Support matrix tracks where each IETF protocol actually is — RFC, draft, or nothing yet. Find the one your service speaks before you plan anything.',
        route: '/algorithms?tab=support',
        cta: 'Open Protocol Support',
      },
      {
        title: 'Run the operation yourself',
        description:
          'Generate an ML-KEM key and encapsulate to it. Real FIPS 203, executing in your browser — not a diagram of it.',
        route: '/playground',
        cta: 'Open the Playground',
      },
      {
        title: 'Drive it the way you would in production',
        description:
          'OpenSSL Studio runs the same commands you would put in a script, against a real OpenSSL build. This is the door to it — the bare /openssl route is not.',
        route: '/playground/openssl-studio',
        cta: 'Open OpenSSL Studio',
      },
    ],
  },

  // "Command Center orientation."
  architect: {
    promise: 'Four steps to the artifacts a design review will ask you for.',
    steps: [
      {
        title: 'Start from the estate, not the algorithm',
        description:
          'The assessment asks what you run and what it protects. Its answers drive every artifact below, so this is the step that makes the rest specific to you.',
        route: '/assess',
        cta: 'Run the assessment',
      },
      {
        title: 'Read the report as a design brief',
        description:
          'Your profile opens on the assessment inputs and the threat landscape. The risk score now shows its own working, so you can defend it rather than quote it.',
        route: '/report',
        cta: 'Open your report',
      },
      {
        title: 'The Command Center is where it becomes artifacts',
        description:
          'Fourteen tools that turn the assessment into a charter, an architecture diagram, a hybrid transition plan and a risk treatment plan. Each one exports.',
        route: '/business',
        cta: 'Open the Command Center',
      },
      {
        title: 'Check your suppliers before you commit',
        description:
          'The migrate catalog says what each product actually supports and what that claim rests on — with the proof date in the row. Design around what has shipped.',
        route: '/migrate',
        cta: 'Open Migrate',
      },
    ],
  },

  // "Run View orientation."
  ops: {
    promise: 'Four steps to a rollout you can schedule and prove.',
    steps: [
      {
        title: 'Find out what your estate actually runs',
        description:
          'The migrate catalog is organised by infrastructure layer — network, hardware, OS, security stack — and tells you which of your products have shipped post-quantum support.',
        route: '/migrate',
        cta: 'Open Migrate',
      },
      {
        title: 'Get the dates you will be held to',
        description:
          'Compliance tracks which frameworks apply to you and when they bite. Your role emphasises CNSA 2.0, FedRAMP, NIS2, PCI DSS and DORA.',
        route: '/compliance',
        cta: 'Open Compliance',
      },
      {
        title: 'Size the change before you schedule it',
        description:
          'The HSM capacity calculator turns signature and key growth into throughput and storage — the numbers a change advisory board asks for.',
        route: '/playground/hsm-capacity',
        cta: 'Open the capacity calculator',
      },
      {
        title: 'Produce the evidence',
        description:
          'The assessment and its report are what you attach to a change record. The roadmap section is ordered for rollout, not for a board paper.',
        route: '/assess',
        cta: 'Run the assessment',
      },
    ],
  },

  // "Methodology tour — how claims are tiered and conclusions derived."
  researcher: {
    promise: 'Four steps covering how this site decides what it is willing to assert.',
    steps: [
      {
        title: 'How a claim earns its place',
        description:
          'Trust tiers are scored across source credibility, peer review, vetting body and whether we hold the document itself. About sets out the whole method, and who funds the site.',
        route: '/about#about-personalization',
        cta: 'Read the methodology',
      },
      {
        title: 'Every source, with its document',
        description:
          'The library holds the corpus behind the rest of the site. Each row says what the document settles and how long it is, and links the copy we actually fetched.',
        route: '/library',
        cta: 'Open the Library',
      },
      {
        title: 'Conclusions are computed, not typed',
        description:
          'Signature sizes, the Mosca window and the risk score are all derived from their inputs at render time. The score carries a "how this was calculated" table for exactly this reason.',
        route: '/algorithms',
        cta: 'See the derived figures',
      },
      {
        title: 'What changed, and when',
        description:
          'The revisions feed records every content change with its evidence. Reproduce a result, then check whether the record moved under you.',
        route: '/revisions',
        cta: 'Open Revisions',
      },
    ],
  },
}
