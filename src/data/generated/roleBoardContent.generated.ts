// SPDX-License-Identifier: GPL-3.0-only
/**
 * GENERATED — do not edit by hand.
 * Source: src/data/role_board_content_08022026.csv
 * Regenerate: npm run generate:role-board-content
 */
import type { PersonaJourneyBoard } from '../personaConfig'
import type { PersonaId } from '../learningPersonas'

export const PERSONA_JOURNEY_BOARD: Record<PersonaId, PersonaJourneyBoard> = {
  executive: {
    heroEyebrow: "Illustrative — this user's inputs",
    heroBadge: {
      text: 'Default: Americas · Finance & Banking — scenario shown: EU',
      tone: 'illustrative' as 'sourced' | 'illustrative',
    },
    headline: 'Answer the board in eleven minutes.',
    sub: 'Eight questions about your estate. You get a defensible risk position, the regulatory dates that already bind you under NIS2 and DORA, and a board pack you can present on Thursday.',
    ctaPrimary: 'Start — 8 questions, about 6 minutes',
    ctaPrimaryHref: '/assess',
    ctaSecondary: 'See a finished example',
    ctaSecondaryHref: '/report?example=1',
    proofChips: [
      'Verified in your browser against NIST ACVP vectors',
      '789 sources, trust-tiered',
      'Regulatory data verified 16 Jul 2026',
      'How we verify',
    ],
    sideCard: {
      title: 'Your exposure window',
      tone: 'bad' as 'bad' | 'warn' | 'info' | 'accent',
      provenance: 'illustrative' as 'sourced' | 'illustrative',
      rows: [
        { label: 'Data must stay secret', value: '12 yrs' },
        { label: 'Your migration takes', value: '5 yrs' },
        { label: 'Cryptanalytic quantum computer', value: '2033 (2030–2036)' },
      ],
      punchline: 'Start by 2028, or your 12-year secrets are already late.',
      footnote:
        "Mosca's inequality: a 5-year migration must finish before the machine arrives, so it has to start by 2028. The 2033 estimate is the median across 6 tracked sources; 2030–2036 is the consensus window, not a forecast.",
    },
    gridTitle: 'What you walk out with',
    gridSub: 'Generated from your 8 answers',
    gridCards: [
      {
        title: 'Risk position',
        body: 'From Risk Score, Key Findings and Risk Breakdown — three of the 17 report sections, all open by default for your role.',
      },
      {
        title: 'Two already bind you',
        body: 'NIS2 (since Oct 2024) · DORA (since Jan 2025) · National PQC roadmap due (Dec 2026) · High-risk systems migrated (Dec 2030)',
      },
      {
        title: 'Your board pack',
        body: 'The four artifacts already featured in your Governance zone: Board Deck, ROI Model, Policy Draft, Audit Checklist.',
      },
    ] as [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ],
    trackTitle: 'Then, if you want the background: 3 hours 20, not 10¼.',
    trackNote:
      "Seven essentials against the full 17-module, 615-minute path. The path already inserts real actions like Run Risk Assessment and Explore Business Tools right where they're relevant.",
    trackChips: [
      'PQC 101',
      'Quantum impact',
      'Quantum threats',
      'Risk management',
      'Business case',
      'Governance',
      'Compliance strategy',
    ],
    capstoneChip: { label: 'Board-Ready' },
  },
  developer: {
    heroEyebrow: 'Developer · Node + Go services · TLS termination at the edge',
    heroBadge: { text: 'Americas · Technology', tone: 'sourced' as 'sourced' | 'illustrative' },
    headline: 'Five minutes to a real ML-KEM handshake.',
    sub: 'Not a diagram. Real WASM crypto in this tab, with the PKCS#11 call log open and a plain-English column beside it. Then we tell you what to change in your stack.',
    ctaPrimary: 'Run X25519MLKEM768 now',
    ctaPrimaryHref: '/playground/tls-simulator',
    ctaSecondary: 'Compare against my stack',
    ctaSecondaryHref: '/migrate',
    proofChips: [
      'Real liboqs + SoftHSMv3 in your browser',
      'Verified against NIST ACVP vectors',
      'No signup, no key required',
    ],
    sideCard: {
      title: 'What this breaks in your code',
      tone: 'warn' as 'bad' | 'warn' | 'info' | 'accent',
      provenance: 'sourced' as 'sourced' | 'illustrative',
      rows: [
        { label: 'ML-DSA-65 public key', value: '1,952 B · was 64' },
        { label: 'ML-DSA-65 signature', value: '3,309 B · was 64' },
        { label: 'Your VARCHAR(256) key column', value: 'overflows' },
      ],
      punchline: 'Your schema breaks before your crypto does.',
      footnote:
        'Real sizes, not illustrative — the second of the four anti-patterns the Crypto Agility module already teaches.',
    },
    gridTitle: 'What you walk out with',
    gridSub: 'Real surfaces mapped to what you actually own',
    gridCards: [
      {
        title: 'Migrate, scoped to your layers',
        body: 'Your persona gives you Libraries, Cloud and Database — the catalogue opens pre-filtered to the three you actually own.',
      },
      {
        title: 'Command Center · Implementation View',
        body: 'Opens on the Migration zone with Migration Roadmap, Deployment Playbook, Crypto Architecture and Policy Draft featured.',
      },
      {
        title: 'A report that is finally yours',
        body: 'All 17 report sections, at their defaults — opening with Algorithm Migration Priority and Cryptographic Bill of Materials (CBOM).',
      },
    ] as [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ],
    trackTitle: 'Then, the background: 5 hours 25, not 28¼.',

    trackChips: [
      'PQC 101',
      'Dev quantum impact',
      'PQC candidates',
      'TLS basics',
      'Hybrid crypto',
      'Crypto agility',
      'PKI workshop',
      'Crypto dev APIs',
    ],
    capstoneChip: { label: 'capstone' },
  },
  architect: {
    heroEyebrow: 'Security architect · Multi-region PKI · 40k certificates',
    heroBadge: {
      text: 'Global · Technology, Telecommunications',
      tone: 'sourced' as 'sourced' | 'illustrative',
    },
    headline: 'Change one policy line. Watch the estate rekey.',
    sub: 'A KMIP 3.0 control plane and a real PKCS#11 HSM, both in this tab. Create keys by business label, flip Classical → Hybrid → Full PQC, and watch the same request get allowed, denied, or auto-rekeyed.',
    ctaPrimary: 'Open the control plane',
    ctaPrimaryHref: '/playground/cacp',
    ctaSecondary: 'See the seven-key estate',
    ctaSecondaryHref: '/playground/cacp?plane=migration',
    proofChips: [
      'Real ML-KEM / ML-DSA / SLH-DSA, no server',
      'KMIP 3.0 conformance corpus replays live',
      'All 66 KMIP operations documented',
    ],
    sideCard: {
      title: 'Why agility, not just algorithms',
      tone: 'info' as 'bad' | 'warn' | 'info' | 'accent',
      provenance: 'illustrative' as 'sourced' | 'illustrative',
      rows: [
        { label: 'Algorithms you will migrate to', value: '3' },
        { label: 'Times you will migrate again', value: '≥ 2' },
        { label: 'Cost of the second migration', value: 'near zero' },
      ],
      punchline: 'Agility is the deliverable. PQC is the first test of it.',
    },
    gridTitle: 'What you walk out with',
    gridSub: 'Real artifacts from your zone configuration',
    gridCards: [
      {
        title: 'A rekey lineage',
        body: 'Old to new across the seven-key business estate, per mode, with the KMIP log per key — from the CACP migration tab.',
      },
      {
        title: 'Command Center · System View',
        body: 'Governance zone featuring Crypto Architecture, RACI Matrix, Policy Draft, Vendor Scorecard, Supply Chain Matrix and Cloud Responsibility Matrix.',
      },
      {
        title: 'Migration artifacts',
        body: 'MTI Recommendation, Hybrid Transition Plan, Crypto API Refactor Audit and Migration Roadmap — the full migration set.',
      },
    ] as [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ],
    trackTitle: 'Then, the background: 6 hours 20, not 29¾.',

    trackChips: [
      'PQC 101',
      'Arch quantum impact',
      'PQC candidates',
      'Crypto agility',
      'Crypto mgmt modernization',
      'Hybrid crypto',
      'KMS',
      'HSM',
      'PKI workshop',
    ],
    capstoneChip: { label: 'capstone' },
  },
  ops: {
    heroEyebrow: 'IT Ops · 12k certs · 4 HSM partitions · next renewal window in 90 days',
    heroBadge: {
      text: 'Americas · Energy & Utilities, Telecommunications',
      tone: 'sourced' as 'sourced' | 'illustrative',
    },
    headline: 'Size your fleet before renewal day.',
    sub: 'Ten enterprise workflows, sized side by side: RSA-3072 and ECDSA P-256 today against ML-DSA-44/65/87. Storage, bandwidth, and CPU cores per workflow, with a totals row.',
    ctaPrimary: 'Size my fleet',
    ctaPrimaryHref: '/playground/hsm-capacity',
    ctaSecondary: "Check your HSM vendor's roadmap",
    ctaSecondaryHref: '/migrate?tab=roadmaps',
    proofChips: [
      'Sizing from real FIPS 203/204 key sizes',
      'Benchmarked through a real PKCS#11 engine',
      'CNSA 2.0 mandate dates built in',
    ],
    sideCard: {
      title: 'What changes on renewal day',
      tone: 'warn' as 'bad' | 'warn' | 'info' | 'accent',
      provenance: 'sourced' as 'sourced' | 'illustrative',
      rows: [
        { label: 'ML-DSA-65 signature', value: '3,309 B' },
        {
          label: "ML-DSA-65 sign rate on today's HSM",
          value: '150 ops/s · ~133× slower than ECDSA',
        },
        { label: 'Per OCSP / CRL response', value: '+3.3 KB · ~5 KB with key' },
      ],
      punchline: 'Your next renewal window is your migration window.',
      footnote:
        'Real figures, not illustrative — the same defaults behind the HSM Capacity Calculator this page links to.',
    },
    gridTitle: 'What you walk out with',
    gridSub: 'Real zones and artifacts for your fleet',
    gridCards: [
      {
        title: 'A sizing verdict',
        body: "Per workflow: storage MB, aggregate network MB/s, CPU cores, and whether your fleet clears it — across the calculator's ten enterprise use cases.",
      },
      {
        title: 'Command Center · Run View',
        body: 'Opens on Migration with Deployment Playbook, KPI Tracker, KPI Dashboard, Migration Roadmap, Supply Chain Matrix and Audit Checklist. Mitigation gateways carry mandatory sunset dates per CSWP.39 §4.6.',
      },
      {
        title: 'A report built for the cutover',
        body: 'Your report opens Migration Roadmap, Migration Toolkit and Algorithm Migration Priority, and hides HNDL — the emphasis a cutover needs.',
      },
    ] as [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ],
    trackTitle: 'Then, the background: 6 hours, not 29½.',

    trackChips: [
      'PQC 101',
      'Ops quantum impact',
      'TLS basics',
      'VPN/SSH',
      'PKI workshop',
      'Crypto agility',
      'Migration program',
      'KMS',
      'HSM',
    ],
    capstoneChip: { label: 'capstone' },
  },
  researcher: {
    heroEyebrow: 'Researcher · unfiltered corpus · strict chronological · no gating',
    heroBadge: {
      text: 'All regions · unfiltered',
      tone: 'illustrative' as 'sourced' | 'illustrative',
    },
    headline: 'Check our work.',
    sub: 'Every claim on this site carries a source tier, a verification date, and where one exists, the strongest published argument against it. Run the known-answer tests yourself in this tab.',
    ctaPrimary: 'Open the evidence workspace',
    ctaPrimaryHref: '/library',
    ctaSecondary: 'Run the ACVP vectors',
    ctaSecondaryHref: '/playground/hsm',
    proofChips: [
      'ACVP + KAT run locally, not asserted',
      'Authoritative / High / Moderate / Low source tiers',
      'Counter-claims dataset · CVE snapshots',
      'Drift guards fail the build on silent data change',
    ],
    sideCard: {
      title: 'Changed in your fields',
      tone: 'info' as 'bad' | 'warn' | 'info' | 'accent',
      provenance: 'illustrative' as 'sourced' | 'illustrative',
      rows: [],
      punchline: 'Nothing in the fields you follow was retracted.',
      footnote:
        'Counts documents in the fields you follow that were updated or retracted in the 90 days before this release of the library.',
      emptyState: 'Pick a few fields to see what has moved in them lately.',
    },
    gridTitle: 'What the workspace gives you',
    gridSub: 'Instruments and evidence, every claim traceable to its source',
    gridCards: [
      {
        title: 'Provenance on every claim',
        body: 'Source tier, verification date, and the counter-claim where one is on file. Nothing in the Library or the Migrate catalogue is filtered out for this role — the corpus arrives whole, by design.',
      },
      {
        title: 'Reproducible verification',
        body: 'ACVP vectors, KATs and the 25-check TCG V1.85 runner, all in your browser, log exportable.',
      },
      {
        title: 'Command Center · Risk Analysis',
        body: 'The one persona that opens on the risk-management zone: Risk Register, Risk Treatment Plan, Policy Draft, Audit Checklist and CRQC Scenario as citable evidence.',
      },
    ] as [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ],
    trackTitle: 'Learning path: available, never pushed.',
    trackNote:
      'This is a reference shelf, not a curriculum — browse at your own pace, nothing here is sequenced for you.',
    trackChips: [
      'PQC 101',
      'Research quantum impact',
      'PQC candidates',
      'Entropy & randomness',
      'Hybrid crypto',
      'Crypto agility',
      'Standards bodies',
      'TLS basics',
      'PKI workshop',
    ],
  },
  curious: {
    heroEyebrow: 'No background needed · about 6 minutes · nothing to install',
    heroBadge: {
      text: 'Americas · unfiltered',
      tone: 'illustrative' as 'sourced' | 'illustrative',
    },
    headline: 'What actually breaks, and when.',
    sub: 'The padlock in your browser relies on maths a quantum computer would undo. Watch it happen to a real connection in this tab, then decide how much further you want to go.',
    ctaPrimary: 'Show me',
    ctaPrimaryHref: '/playground/tls-simulator',
    ctaSecondary: 'I have 30 seconds — the short version',
    ctaSecondaryHref: '/timeline',
    proofChips: [
      'Real cryptography, running here',
      'Plain English by default',
      'Every term explained on hover',
    ],
    sideCard: {
      title: 'The bit that surprises people',
      tone: 'bad' as 'bad' | 'warn' | 'info' | 'accent',
      provenance: 'illustrative' as 'sourced' | 'illustrative',
      rows: [
        { label: 'Encrypted data captured today', value: 'still readable later' },
        { label: 'If it must stay secret for', value: '12 years' },
        { label: 'And the machine arrives in', value: '~2032' },
      ],
      punchline: 'The deadline already passed for some data.',
      footnote:
        'Harvest now, decrypt later. That is the whole argument, and it is the one idea worth leaving with even if you read nothing else.',
    },
    gridTitle: 'Where you can go next',
    gridSub: 'Optional, none of it locked — all of it real',
    gridCards: [
      {
        title: 'The short version',
        body: 'Six modules, 205 minutes, plain language throughout. Milestones already sit in the path: Take Assessment, Explore Timeline, Explore Threat Landscape.',
      },
      {
        title: 'A library worth browsing',
        body: 'A shortlist rather than the whole corpus: Migration Guidance and Government & Policy. Everything else is still one click away.',
      },
      {
        title: 'A read on your own risk',
        body: 'Today the report hides HNDL, Algorithm Migration Priority, Migration Roadmap and Migration Toolkit and caps actions at 3. Here it explains rather than withholds.',
      },
    ] as [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ],
    trackTitle: 'Six modules, 205 minutes — and yes, that is still a lot.',
    trackNote:
      'Worth saying plainly: at 205 minutes this is longer than the executive track (200 min), which is not what you would expect. Take it in pieces — your progress is saved between visits.',
    trackChips: [
      'PQC 101',
      'PQC candidates',
      'Quantum threats',
      'Risk basics',
      'Compliance timelines',
      'TLS basics',
    ],
    capstoneChip: { label: 'Quantum-Native' },
  },
}
