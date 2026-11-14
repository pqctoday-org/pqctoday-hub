// SPDX-License-Identifier: AGPL-3.0-only
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
import { LIBRARY_RECENT_CHANGES_ROUTE } from '@/data/nextSteps'

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

// The Operations set: the four questions a migration run answers, each mapped to
// the tool or calculator that answers it. The board questions are not an
// operator's first step.
const OPS_INTRO: CommandCenterIntro = {
  lede: 'A migration run turns a plan into rollouts that hold capacity and can be rolled back. These four questions are the order to work in: capacity, timing, rollout, then progress.',
  showGuidedOverview: false,
  questions: [
    {
      q: 'Will capacity hold?',
      desc: 'Size HSM and key-operation load for post-quantum algorithms.',
      to: '/playground/hsm-capacity',
      cta: 'HSM capacity calculator',
    },
    {
      q: 'When can we change it?',
      desc: 'Line the migration up with hardware and certificate refresh windows.',
      to: '/business/tools/refresh-cycle-alignment',
      cta: 'Refresh-cycle alignment',
    },
    {
      q: 'How do we roll it out?',
      desc: 'A step-by-step deployment and rollback runbook.',
      to: '/business/tools/deployment-playbook',
      cta: 'Deployment playbook',
    },
    {
      q: 'How do we track progress?',
      desc: 'Migration KPIs over time.',
      to: '/business/tools/kpi-tracker',
      cta: 'KPI tracker',
    },
  ],
}

// The Certification Engineer's set: the four questions a certification effort
// answers, each mapped to the learning page, record or tool that answers it.
const CERT_ENGINEER_INTRO: CommandCenterIntro = {
  lede: 'Certification turns a product into evidence that a scheme accepts. These four questions are the order to work in: the scheme, what already exists, whether the vendor evidence holds, and whether the migration is verified.',
  showGuidedOverview: false,
  questions: [
    {
      q: 'Which scheme applies?',
      desc: 'FIPS 140-3, Common Criteria / EUCC and other schemes, and how a product gets through them.',
      to: '/learn/crypto-product-certification',
      cta: 'Crypto Product Certification',
    },
    {
      q: 'What has already been certified?',
      desc: 'Certification records by scheme, with the source.',
      to: '/compliance?tab=records',
      cta: 'Certification records',
    },
    {
      q: 'Is the vendor evidence enough?',
      desc: 'Score vendor certificates and claims.',
      to: '/business/tools/vendor-scorecard',
      cta: 'Vendor scorecard',
    },
    {
      q: 'Is the migration verified?',
      desc: 'Check the deployed result against the plan.',
      to: '/business/tools/migration-verification',
      cta: 'Migration verification',
    },
  ],
}

// The Security Architect's set: the four questions a design review asks, each
// mapped to an existing tool. The architecture pack above the intro collects
// the answers into one document.
const ARCHITECT_INTRO: CommandCenterIntro = {
  lede: 'An architecture review asks four questions: what depends on what, which transition mode applies where, who holds which key, and whether the design works. The architecture pack above collects your answers into one document.',
  showGuidedOverview: false,
  questions: [
    {
      q: 'What depends on what?',
      desc: 'Record the algorithms, libraries, keys and certificates in use as a CycloneDX CBOM.',
      to: '/business/tools/crypto-cbom-builder',
      cta: 'CBOM builder',
    },
    {
      q: 'Which transition mode, where?',
      desc: 'Choose classical, hybrid or pure PQC per system and protocol.',
      to: '/business/tools/hybrid-transition-planner',
      cta: 'Hybrid transition planner',
    },
    {
      q: 'Who holds which key?',
      desc: 'Map key custody and operations across cloud and on-premises services.',
      to: '/business/tools/cloud-responsibility-matrix',
      cta: 'Cloud responsibility matrix',
    },
    {
      q: 'Does the rekey work?',
      desc: 'Change a policy and watch the KMIP engine replace a key behind the same name.',
      to: '/playground/cacp?tab=migration',
      cta: 'KMIP quick run',
    },
  ],
}

// The Researcher / Academic set: the four questions a researcher checks first,
// each mapped to the existing page or tool that answers it. A researcher is not
// running a program, so neither the board questions nor the executive overview
// apply.
const RESEARCHER_INTRO: CommandCenterIntro = {
  lede: 'Checking a post-quantum claim comes down to four questions: what changed, whether it reproduces, how firm the threat estimate is, and who holds the patents. Start with whichever you need first. The evidence bundle above collects your bookmarked sources and saved runs into one citable zip.',
  showGuidedOverview: false,
  questions: [
    {
      q: 'What changed in the standards?',
      desc: 'New and revised documents in the Library, newest first, each with its source and date.',
      to: LIBRARY_RECENT_CHANGES_ROUTE,
      cta: 'Recent standards changes',
    },
    {
      q: 'Can I reproduce it?',
      desc: 'Run the SP 800-90A HMAC_DRBG yourself and check it against pinned NIST ACVP vectors.',
      to: '/playground/drbg-demo',
      cta: 'SP 800-90A DRBG',
    },
    {
      q: 'How sure is the threat timeline?',
      desc: 'Quantum threats by industry, with the cryptography at risk and the migration window behind the dates.',
      to: '/threats',
      cta: 'Threats',
    },
    {
      q: 'Who holds the patents?',
      desc: 'Patent filings on post-quantum schemes: who filed, where, and on which algorithms.',
      to: '/patents',
      cta: 'Patents',
    },
  ],
}

export function commandCenterIntroFor(persona: PersonaId | null): CommandCenterIntro {
  if (persona === 'grc') return GRC_INTRO
  if (persona === 'developer') return DEVELOPER_INTRO
  if (persona === 'architect') return ARCHITECT_INTRO
  if (persona === 'researcher') return RESEARCHER_INTRO
  if (persona === 'ops') return OPS_INTRO
  if (persona === 'cert-engineer') return CERT_ENGINEER_INTRO
  return BOARD_INTRO
}
