// SPDX-License-Identifier: GPL-3.0-only
/**
 * The Command Center's empty-state intro: the sentence and the four questions it
 * opens with. One copy for both shells (BusinessCenterView and
 * MobileCommandCenterView used to carry their own literals).
 *
 * GRC and Developer get their own sets (journey audits, 15 Oct 2026): the board's four
 * questions — what's at risk, the deadline, the cost, who owns it — are an
 * executive's framing and sent a GRC reader to an ROI calculator. A GRC program
 * answers what applies, who owns each control, what evidence is missing, and
 * how exceptions are closed.
 */
import type { PersonaId } from '@/data/learningPersonas'

export interface CommandCenterQuestion {
  q: string
  desc: string
  to: string
  cta: string
}

export interface CommandCenterIntro {
  lede: string
  questions: CommandCenterQuestion[]
  /** The guided overview run is the executive walkthrough; GRC is not sent to it. */
  showGuidedOverview: boolean
}

const BOARD_INTRO: CommandCenterIntro = {
  lede: 'A post-quantum migration is a program, and every program answers the same four board-level questions. Start with whichever you need first.',
  showGuidedOverview: true,
  questions: [
    {
      q: "What's at risk?",
      desc: 'Size your quantum exposure by system and data sensitivity.',
      to: '/assess',
      cta: 'Run risk assessment',
    },
    {
      q: "What's the deadline?",
      desc: 'See the mandates and dates that apply to your sector and region.',
      to: '/compliance?tab=compliance',
      cta: 'Compliance deadlines',
    },
    {
      q: 'What will it cost?',
      desc: 'Model the budget, ROI, and the cost of waiting.',
      to: '/business/tools/roi-calculator',
      cta: 'ROI calculator',
    },
    {
      q: 'Who owns it?',
      desc: 'Assign accountability and set the governance model.',
      to: '/business/tools/raci-builder',
      cta: 'RACI builder',
    },
  ],
}

const GRC_INTRO: CommandCenterIntro = {
  lede: 'A GRC program turns obligations into owned controls with evidence. These four questions are the order to work in: scope first, then ownership, evidence and closure.',
  showGuidedOverview: false,
  questions: [
    {
      q: 'What applies to us?',
      desc: 'List the rules and standards that bind your country and sector, with the source behind each.',
      to: '/compliance?tab=obligations',
      cta: 'Rules & Standards',
    },
    {
      q: 'Who owns each control?',
      desc: 'Turn the obligations that apply into a checklist with an owner per control.',
      to: '/business/tools/compliance-checklist',
      cta: 'Compliance checklist',
    },
    {
      q: 'What evidence is missing?',
      desc: 'Walk the audit checklist and record what proves each control, and what does not yet.',
      to: '/business/tools/audit-checklist',
      cta: 'Audit checklist',
    },
    {
      q: 'How do exceptions close?',
      desc: 'Record each accepted risk with an owner, a treatment and an expiry date.',
      to: '/business/tools/risk-treatment-plan',
      cta: 'Risk treatment plan',
    },
  ],
}

// The Developer / Engineer equivalent: the four engineering questions a
// migration has to answer, each mapped to an existing tool. Board questions
// (ROI, RACI) are not a developer's first step.
const DEVELOPER_INTRO: CommandCenterIntro = {
  lede: 'Changing the cryptography in a codebase comes down to four engineering questions. Start with whichever you need first.',
  showGuidedOverview: false,
  questions: [
    {
      q: 'Where is the vulnerable crypto?',
      desc: 'Find the call sites, APIs and providers your code depends on.',
      to: '/business/tools/crypto-api-refactor-audit',
      cta: 'Crypto API refactor audit',
    },
    {
      q: 'What does the inventory look like?',
      desc: 'Record algorithms, libraries and keys as a CycloneDX CBOM.',
      to: '/business/tools/crypto-cbom-builder',
      cta: 'CBOM builder',
    },
    {
      q: 'Does it work on my stack?',
      desc: 'Try ML-KEM, ML-DSA and SLH-DSA with real OpenSSL commands.',
      to: '/openssl',
      cta: 'OpenSSL Studio',
    },
    {
      q: 'Does the handshake still work?',
      desc: 'Run a real TLS 1.3 handshake with hybrid and PQC groups.',
      to: '/playground/tls-simulator',
      cta: 'TLS 1.3 simulator',
    },
  ],
}

export function commandCenterIntroFor(persona: PersonaId | null): CommandCenterIntro {
  if (persona === 'grc') return GRC_INTRO
  if (persona === 'developer') return DEVELOPER_INTRO
  return BOARD_INTRO
}
