// SPDX-License-Identifier: GPL-3.0-only
/**
 * GENERATED — do not edit by hand.
 * Source: src/data/role_board_content_08022026.csv
 * Regenerate: npm run generate:role-board-content
 */
import type { PersonaJourneyBoard, RoleBoardVariant } from '../personaConfig'
import type { PersonaId } from '../learningPersonas'

/** Every role's board options, in chip order (order 1 first). */
export const PERSONA_JOURNEY_BOARD_VARIANTS: Record<PersonaId, RoleBoardVariant[]> = {
  executive: [
    {
      id: 'mandate',
      order: 1,
      chipLabel: 'Get the mandate signed',
      chipDescription: 'The board decision that unlocks budget and names an owner.',
      phaseId: 'p0',
      cswp39Zone: 'governance',
      moduleIds: ['pqc-business-case', 'pqc-governance'],
      workshopIds: [],
      board: {
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
    },
    {
      id: 'risk',
      order: 2,
      chipLabel: 'Know your exposure',
      chipDescription: 'A defensible risk position and the dates that already bind you.',
      phaseId: 'p3',
      cswp39Zone: 'risk-management',
      moduleIds: ['pqc-risk-management', 'data-asset-sensitivity'],
      workshopIds: [],
      board: {
        heroEyebrow: 'Executive / GRC · risk position · the dates that already bind you',
        heroBadge: {
          text: 'Default: Americas · Finance & Banking — scenario shown: EU',
          tone: 'illustrative' as 'sourced' | 'illustrative',
        },
        headline: 'Know what you are actually exposed to.',
        sub: 'The same eight questions, scored. You get a risk position you can defend line by line, with each regulatory deadline attached to the finding it threatens rather than filed in an appendix.',
        ctaPrimary: 'Score my exposure',
        ctaPrimaryHref: '/assess',
        ctaSecondary: 'See a scored example',
        ctaSecondaryHref: '/report?example=1',
        proofChips: [
          '789 sources, trust-tiered',
          'Regulatory data verified 16 Jul 2026',
          'Organised around the NIST CSWP.39 zones',
          'How we verify',
        ],
        sideCard: {
          title: 'What the score is built from',
          tone: 'warn' as 'bad' | 'warn' | 'info' | 'accent',
          provenance: 'illustrative' as 'sourced' | 'illustrative',
          rows: [
            { label: 'Questions you answer', value: '8' },
            { label: 'Report sections generated', value: '17' },
            { label: 'Governance artifacts attached', value: 'four' },
          ],
          punchline: 'A number you can put in front of an auditor.',
          footnote:
            'Illustrative until you answer the eight questions — the score, the sections and the artifacts are generated from your own answers, not from a sample estate.',
        },
        gridTitle: 'What the score gives you',
        gridSub: 'Generated from your 8 answers',
        gridCards: [
          {
            title: 'A defensible number',
            body: 'From Risk Score, Key Findings and Risk Breakdown — the three sections that carry the arithmetic, all open by default for your role.',
          },
          {
            title: 'Deadlines attached to findings',
            body: 'NIS2 (since Oct 2024) · DORA (since Jan 2025) · National PQC roadmap due (Dec 2026) · High-risk systems migrated (Dec 2030)',
          },
          {
            title: 'Command Center · Risk zone',
            body: 'KPI Dashboard, Risk Register, Board Deck, ROI Model, Policy Draft and Audit Checklist — the evidence a risk committee asks for.',
          },
        ] as [
          { title: string; body: string },
          { title: string; body: string },
          { title: string; body: string },
        ],
        trackTitle: 'Then, if you want the background: 3 hours 20, not 10¼.',

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
    },
    {
      id: 'roadmap',
      order: 3,
      chipLabel: 'Show a credible plan',
      chipDescription: 'The roadmap, policy and KPIs a regulator will accept.',
      phaseId: 'p4',
      cswp39Zone: 'governance',
      moduleIds: ['migration-program', 'compliance-strategy', 'pqc-governance'],
      workshopIds: [],
      board: {
        heroEyebrow: 'Executive / GRC · sequenced plan · owners · KPIs',
        heroBadge: {
          text: 'Default: Americas · Finance & Banking — scenario shown: EU',
          tone: 'illustrative' as 'sourced' | 'illustrative',
        },
        headline: 'Show a plan your regulator will accept.',
        sub: 'A sequenced roadmap with named owners, measurable KPIs and a policy draft — built from the same eight answers, so your plan and your risk position cannot quietly disagree.',
        ctaPrimary: 'See a finished plan',
        ctaPrimaryHref: '/report?example=1',
        ctaSecondary: 'Check the deadlines',
        ctaSecondaryHref: '/timeline',
        proofChips: [
          'Deadlines derived from the published timeline',
          'Regulatory data verified 16 Jul 2026',
          'Organised around the NIST CSWP.39 zones',
          'How we verify',
        ],
        sideCard: {
          title: 'What the plan contains',
          tone: 'info' as 'bad' | 'warn' | 'info' | 'accent',
          provenance: 'illustrative' as 'sourced' | 'illustrative',
          rows: [
            { label: 'Governance artifacts', value: 'four' },
            { label: 'Report sections', value: '17' },
            { label: 'Modules on your path', value: '17' },
          ],
          punchline: 'A plan, not a slide.',
          footnote:
            "Illustrative until you answer the eight questions. The artifact and section counts are real — they are what this role's report and Command Center actually generate.",
        },
        gridTitle: 'What you walk out with',
        gridSub: 'A plan someone can be held to',
        gridCards: [
          {
            title: 'Owners, not intentions',
            body: 'Board Deck, ROI Model, Policy Draft and Audit Checklist — each with a named owner rather than a department.',
          },
          {
            title: 'Dates you did not invent',
            body: 'The migration deadlines already published for your region, not a schedule of our choosing.',
          },
          {
            title: 'KPIs that survive contact',
            body: 'From Risk Score and Risk Breakdown — the two sections a steering committee will actually re-read.',
          },
        ] as [
          { title: string; body: string },
          { title: string; body: string },
          { title: string; body: string },
        ],
        trackTitle: 'Then, if you want the background: 3 hours 20, not 10¼.',

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
    },
  ],
  developer: [
    {
      id: 'pilot',
      order: 1,
      chipLabel: 'Ship a real handshake',
      chipDescription: 'Hybrid key exchange running in this tab, then in your stack.',
      phaseId: 'p5',
      cswp39Zone: 'migration',
      moduleIds: ['tls-basics', 'hybrid-crypto'],
      workshopIds: ['tls-simulator', 'vpn-sim'],
      board: {
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
    },
    {
      id: 'inventory',
      order: 2,
      chipLabel: 'Find the crypto in your code',
      chipDescription: 'Build the CBOM before you plan a single change.',
      phaseId: 'p2',
      cswp39Zone: 'assets',
      moduleIds: ['cbom', 'sbom', 'crypto-registry'],
      workshopIds: ['openssl-studio'],
      board: {
        heroEyebrow: 'Developer / Engineer · CBOM before code changes',
        heroBadge: { text: 'Americas · Technology', tone: 'sourced' as 'sourced' | 'illustrative' },
        headline: 'Find the crypto before you change it.',
        sub: 'Most of your cryptography was chosen by a library default, not by you. A CBOM names what your services actually negotiate — start from the catalogue rather than from a grep.',
        ctaPrimary: 'Open the catalogue',
        ctaPrimaryHref: '/migrate',
        ctaSecondary: 'Watch a handshake negotiate',
        ctaSecondaryHref: '/playground/tls-simulator',
        proofChips: [
          'Real liboqs + SoftHSMv3 in your browser',
          'Catalogue entries are proof-gated',
          'No signup, no key required',
        ],
        sideCard: {
          title: 'What a CBOM has to name',
          tone: 'info' as 'bad' | 'warn' | 'info' | 'accent',
          provenance: 'illustrative' as 'sourced' | 'illustrative',
          rows: [
            { label: 'Algorithms in use', value: 'every suite you negotiate' },
            { label: 'Where they came from', value: 'library defaults, not just your code' },
            { label: 'What breaks first', value: 'your longest-lived key' },
          ],
          punchline: 'You cannot migrate what you have not named.',
          footnote:
            "Illustrative framing. The catalogue's PQC-readiness data is real and proof-gated; what your own estate contains is something only your scan can answer.",
        },
        gridTitle: 'What you walk out with',
        gridSub: 'An inventory you can act on',
        gridCards: [
          {
            title: 'Catalogue, scoped to your layers',
            body: 'Your persona gives you Libraries, Cloud and Database — the catalogue opens pre-filtered to the layers you actually own.',
          },
          {
            title: 'SBOM, then CBOM',
            body: 'The two modules that separate what you ship from what it negotiates. Both already sit on your learning path.',
          },
          {
            title: 'Command Center · Migration zone',
            body: 'Migration Roadmap and Deployment Playbook — the working set for a real inventory pass.',
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
    },
    {
      id: 'sizing',
      order: 3,
      chipLabel: 'See what the sizes break',
      chipDescription: 'Bigger keys and signatures hit schemas and budgets first.',
      phaseId: 'p6',
      cswp39Zone: 'mitigation',
      moduleIds: ['crypto-dev-apis', 'pqc-testing-validation'],
      workshopIds: ['cert-capacity', 'api-security-jwt'],
      board: {
        heroEyebrow: 'Developer / Engineer · sizes, budgets, and what overflows',
        heroBadge: { text: 'Americas · Technology', tone: 'sourced' as 'sourced' | 'illustrative' },
        headline: 'The new sizes break your schema first.',
        sub: 'An ML-DSA-65 signature is roughly fifty times an ECDSA one. Your token budget, your database column and your MTU all notice long before your cryptography does.',
        ctaPrimary: 'Size the impact',
        ctaPrimaryHref: '/playground/hsm-capacity',
        ctaSecondary: 'Compare against my stack',
        ctaSecondaryHref: '/migrate',
        proofChips: [
          'Sizes from FIPS 203/204, not estimates',
          'Benchmarked through a real PKCS#11 engine',
          'No signup, no key required',
        ],
        sideCard: {
          title: 'What the calculator tells you',
          tone: 'warn' as 'bad' | 'warn' | 'info' | 'accent',
          provenance: 'sourced' as 'sourced' | 'illustrative',
          rows: [
            { label: 'Enterprise workflows sized', value: 'ten' },
            { label: 'ML-DSA-65 signature', value: '3,309 B' },
            { label: "Sign rate on today's HSM", value: '150 ops/s · ~133× slower than ECDSA' },
          ],
          punchline: 'Budget the cores before you budget the migration.',
          footnote:
            "Real figures, not illustrative — the HSM Capacity Calculator's own defaults, the same ones behind the IT Ops board.",
        },
        gridTitle: 'What you walk out with',
        gridSub: 'Numbers you can put in a ticket',
        gridCards: [
          {
            title: 'Where the bytes land',
            body: 'Token payloads, certificate chains and TLS records — the three places the new sizes show up in your service first.',
          },
          {
            title: 'A test you can re-run',
            body: 'pqc-testing-validation and crypto-dev-apis are both on your path, and both are about proving the change rather than describing it.',
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
    },
  ],
  architect: [
    {
      id: 'controlplane',
      order: 1,
      chipLabel: 'Design for agility',
      chipDescription: 'A policy-driven control plane you can re-key from.',
      phaseId: 'p4',
      cswp39Zone: 'governance',
      moduleIds: ['crypto-agility', 'crypto-mgmt-modernization'],
      workshopIds: ['cacp-kmip'],
      board: {
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
    },
    {
      id: 'inventory',
      order: 2,
      chipLabel: 'Map the estate',
      chipDescription: 'As-is versus to-be crypto architecture, evidenced by a CBOM.',
      phaseId: 'p2',
      cswp39Zone: 'assets',
      moduleIds: ['cbom', 'sbom', 'crypto-registry'],
      workshopIds: ['openssl-studio'],
      board: {
        heroEyebrow: 'Security Architect · as-is before to-be',
        heroBadge: {
          text: 'Global · Technology, Telecommunications',
          tone: 'sourced' as 'sourced' | 'illustrative',
        },
        headline: 'You cannot draw the to-be without the as-is.',
        sub: 'Every library, HSM, protocol and CA in the estate, inventoried before the target architecture exists. A CBOM is what makes the diagram arguable rather than aspirational.',
        ctaPrimary: 'Open the catalogue',
        ctaPrimaryHref: '/migrate',
        ctaSecondary: 'Open the control plane',
        ctaSecondaryHref: '/playground/cacp',
        proofChips: [
          'Catalogue entries are proof-gated',
          'KMIP 3.0 conformance corpus replays live',
          'Real ML-KEM / ML-DSA / SLH-DSA, no server',
        ],
        sideCard: {
          title: 'What the as-is must name',
          tone: 'info' as 'bad' | 'warn' | 'info' | 'accent',
          provenance: 'illustrative' as 'sourced' | 'illustrative',
          rows: [
            { label: 'Layers in the catalogue', value: 'four' },
            { label: 'Agility tracked per', value: 'asset, not per algorithm' },
            { label: 'Ownership recorded via', value: 'RACI' },
          ],
          punchline: 'An inventory nobody owns is a document, not a control.',
          footnote:
            "Illustrative framing. The catalogue's layer taxonomy and PQC-readiness data are real; the ownership model is the one this role's Command Center zone already assumes.",
        },
        gridTitle: 'What you walk out with',
        gridSub: 'The artifacts a review board will ask for',
        gridCards: [
          {
            title: 'A diagram with evidence under it',
            body: 'Crypto Architecture, RACI Matrix, Policy Draft, Vendor Scorecard, Supply Chain Matrix and Cloud Responsibility Matrix — the crypto architecture and the RACI that says who owns each box.',
          },
          {
            title: 'SBOM, CBOM, registry',
            body: 'Three modules on your path that together answer what we ship, what it negotiates, and what we have promised elsewhere.',
          },
          {
            title: 'Command Center · Governance zone',
            body: 'Opens where the as-is and to-be actually get argued, not where they get filed.',
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
    },
    {
      id: 'keystores',
      order: 3,
      chipLabel: 'Plan the key infrastructure',
      chipDescription: 'Where keys live, and what changes when they get bigger.',
      phaseId: 'p6',
      cswp39Zone: 'mitigation',
      moduleIds: ['hsm-pqc', 'kms-pqc'],
      workshopIds: ['hsm-capacity', 'tpm-playground'],
      board: {
        heroEyebrow: 'Security Architect · where the keys live',
        heroBadge: {
          text: 'Global · Technology, Telecommunications',
          tone: 'sourced' as 'sourced' | 'illustrative',
        },
        headline: 'Decide where the keys live.',
        sub: "HSM partitions, KMS policy and TPM-backed device identity all behave differently under ML-DSA. Size them before you commit to a date in someone else's plan.",
        ctaPrimary: 'Size the estate',
        ctaPrimaryHref: '/playground/hsm-capacity',
        ctaSecondary: 'Open the PKCS#11 workbench',
        ctaSecondaryHref: '/playground/hsm',
        proofChips: [
          'Real PKCS#11 engine, in your browser',
          'Sizing from real FIPS 203/204 key sizes',
          'TPM 2.0 conformance checks run locally',
        ],
        sideCard: {
          title: 'What changes in the key store',
          tone: 'warn' as 'bad' | 'warn' | 'info' | 'accent',
          provenance: 'sourced' as 'sourced' | 'illustrative',
          rows: [
            { label: 'ML-DSA-65 signature', value: '3,309 B' },
            { label: "Sign rate on today's HSM", value: '150 ops/s · ~133× slower than ECDSA' },
            { label: 'Keys in the sample estate', value: 'seven' },
          ],
          punchline: 'Capacity is an architecture decision, not an ops surprise.',
          footnote:
            "Real figures — the capacity calculator's own defaults and the migration estate this playground actually ships with.",
        },
        gridTitle: 'What you walk out with',
        gridSub: 'Decisions with numbers attached',
        gridCards: [
          {
            title: 'A partition plan',
            body: 'Ten enterprise workflows sized side by side, so partition counts stop being a guess.',
          },
          {
            title: 'Policy that survives re-keying',
            body: 'hsm-pqc and kms-pqc are both on your path — the two modules about governing keys rather than generating them.',
          },
          {
            title: 'Command Center · Migration zone',
            body: 'MTI Recommendation, Hybrid Transition Plan, Crypto API Refactor Audit, Migration Roadmap, Risk Register and Risk Treatment Plan — where the estate plan and its risks sit together.',
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
    },
  ],
  ops: [
    {
      id: 'capacity',
      order: 1,
      chipLabel: 'Size the fleet',
      chipDescription: "Whether today's HSMs clear tomorrow's signing load.",
      phaseId: 'p6',
      cswp39Zone: 'mitigation',
      moduleIds: ['hsm-pqc', 'kms-pqc'],
      workshopIds: ['hsm-capacity', 'cert-capacity'],
      board: {
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
    },
    {
      id: 'cutover',
      order: 2,
      chipLabel: 'Rehearse the cutover',
      chipDescription: 'Hybrid tunnels and certificates on a real renewal window.',
      phaseId: 'p5',
      cswp39Zone: 'migration',
      moduleIds: ['vpn-ssh-pqc', 'tls-basics'],
      workshopIds: ['vpn-sim', 'pqc-ssh-sim'],
      board: {
        heroEyebrow: 'IT Ops · rehearse before the change window',
        heroBadge: {
          text: 'Americas · Energy & Utilities, Telecommunications',
          tone: 'sourced' as 'sourced' | 'illustrative',
        },
        headline: 'Rehearse the cutover before renewal day.',
        sub: 'Hybrid tunnels and hybrid certificates, end to end in this tab, so the first time you meet a fragmentation bug is not at 2am inside a change window.',
        ctaPrimary: 'Run a hybrid handshake',
        ctaPrimaryHref: '/playground/tls-simulator',
        ctaSecondary: 'Size the fleet',
        ctaSecondaryHref: '/playground/hsm-capacity',
        proofChips: [
          'Real TLS 1.3 handshake, in your browser',
          'Hybrid groups X25519MLKEM768 and friends',
          'Log exportable',
        ],
        sideCard: {
          title: 'What the rehearsal covers',
          tone: 'info' as 'bad' | 'warn' | 'info' | 'accent',
          provenance: 'illustrative' as 'sourced' | 'illustrative',
          rows: [
            { label: 'Protocols exercised', value: 'TLS 1.3, IPsec, SSH' },
            { label: 'What fails first', value: 'MTU and fragmentation' },
            { label: 'Rollback', value: 'classical suites stay negotiable' },
          ],
          punchline: 'Find the fragmentation bug in a tab, not in a change window.',
          footnote:
            'The handshakes are real; which of them your estate breaks on is not something we can know for you. Treat the failure order as a starting hypothesis.',
        },
        gridTitle: 'What you walk out with',
        gridSub: 'A rehearsal you can repeat',
        gridCards: [
          {
            title: 'A tested negotiation path',
            body: 'Hybrid key exchange proven end to end before it meets your load balancers.',
          },
          {
            title: 'Two protocols, not one',
            body: 'vpn-ssh-pqc and tls-basics both sit on your path — the cutover rarely fails in the protocol you rehearsed.',
          },
          {
            title: 'Command Center · Run view',
            body: 'Migration Roadmap and Deployment Playbook — the deployment playbook and the roadmap, together.',
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
    },
    {
      id: 'suppliers',
      order: 3,
      chipLabel: 'Check your suppliers',
      chipDescription: 'Vendor roadmaps against renewals you have already booked.',
      phaseId: 'p7',
      cswp39Zone: 'governance',
      moduleIds: ['sbom', 'crypto-registry', 'verification-closure'],
      workshopIds: [],
      board: {
        heroEyebrow: 'IT Ops · your renewals depend on their roadmaps',
        heroBadge: {
          text: 'Americas · Energy & Utilities, Telecommunications',
          tone: 'sourced' as 'sourced' | 'illustrative',
        },
        headline: "Your renewals commit you to someone else's timeline.",
        sub: "Every certificate you renew this year ties you to a vendor's PQC schedule for its whole lifetime. Check theirs against yours before you sign, not after.",
        ctaPrimary: 'Check vendor roadmaps',
        ctaPrimaryHref: '/migrate?tab=roadmaps',
        ctaSecondary: 'Open the catalogue',
        ctaSecondaryHref: '/migrate',
        proofChips: [
          'Vendor claims are proof-gated',
          'CNSA 2.0 mandate dates built in',
          "Every roadmap links to the vendor's own source",
        ],
        sideCard: {
          title: 'What to ask a supplier',
          tone: 'info' as 'bad' | 'warn' | 'info' | 'accent',
          provenance: 'illustrative' as 'sourced' | 'illustrative',
          rows: [
            { label: 'Named algorithms', value: 'not the words quantum-safe' },
            { label: 'A dated commitment', value: 'not on our roadmap' },
            { label: 'Evidence', value: 'a certificate or a published spec' },
          ],
          punchline: 'A roadmap without a date is a press release.',
          footnote:
            "Illustrative checklist. The vendor data behind the catalogue is proof-gated — every claim there carries a link to the vendor's own published source, or it is not shown.",
        },
        gridTitle: 'What you walk out with',
        gridSub: 'Questions with evidence behind them',
        gridCards: [
          {
            title: 'A supplier list with dates',
            body: 'Vendor roadmaps as published, not as summarised, so you can quote them back.',
          },
          {
            title: 'SBOM and registry, together',
            body: 'Both on your path — what you run, and what you have already told an auditor you run.',
          },
          {
            title: 'Command Center · Governance zone',
            body: 'Supply Chain Matrix and Audit Checklist — the supply-chain matrix and the audit checklist.',
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
    },
  ],
  researcher: [
    {
      id: 'provenance',
      order: 1,
      chipLabel: 'Trace every claim',
      chipDescription: 'Source tiers and verification dates across the whole corpus.',
      phaseId: 'p1',
      cswp39Zone: 'assets',
      moduleIds: ['standards-bodies', 'pqc-candidates'],
      workshopIds: ['openssl-studio'],
      board: {
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
    },
    {
      id: 'reproduce',
      order: 2,
      chipLabel: 'Reproduce the claims',
      chipDescription: 'ACVP vectors and KATs you run yourself, log exportable.',
      phaseId: 'verify-close',
      cswp39Zone: 'risk-management',
      moduleIds: ['pqc-testing-validation', 'slh-dsa'],
      workshopIds: ['slh-dsa', 'merkle-proof', 'entropy-test'],
      board: {
        heroEyebrow: 'Researcher / Academic · run it yourself · export the log',
        heroBadge: {
          text: 'All regions · unfiltered',
          tone: 'illustrative' as 'sourced' | 'illustrative',
        },
        headline: 'Run the tests yourself.',
        sub: 'ACVP vectors, known-answer tests and the 25-check TCG V1.85 runner all execute locally in this tab. Export the log. Do not take our word for any of it.',
        ctaPrimary: 'Run the ACVP vectors',
        ctaPrimaryHref: '/playground/hsm',
        ctaSecondary: 'Open the evidence workspace',
        ctaSecondaryHref: '/library',
        proofChips: [
          'ACVP + KAT run locally, not asserted',
          'Real liboqs + SoftHSMv3 compiled to WASM',
          'Log exportable',
          'Drift guards fail the build on silent data change',
        ],
        sideCard: {
          title: 'What you can reproduce here',
          tone: 'accent' as 'bad' | 'warn' | 'info' | 'accent',
          provenance: 'sourced' as 'sourced' | 'illustrative',
          rows: [
            { label: 'Hash-based signatures', value: 'SLH-DSA, XMSS, LMS' },
            { label: 'Randomness', value: 'entropy and DRBG tests' },
            { label: 'Certificate structure', value: 'Merkle inclusion proofs' },
          ],
          punchline: 'Nothing here asks you to trust it.',
          footnote:
            'The named workshops run real implementations locally — liboqs and SoftHSMv3 compiled to WebAssembly — not recorded output replayed back at you.',
        },
        gridTitle: 'What the workspace gives you',
        gridSub: 'Instruments, not assertions',
        gridCards: [
          {
            title: 'Vectors, not screenshots',
            body: 'Known-answer tests against the published NIST vectors, executed in your browser and exportable as a log.',
          },
          {
            title: 'The primitives, separately',
            body: 'slh-dsa and pqc-testing-validation are both on your path — the scheme and the discipline of proving it.',
          },
          {
            title: 'Command Center · Risk Analysis',
            body: 'Risk Register, Risk Treatment Plan, Policy Draft, Audit Checklist and CRQC Scenario as citable evidence.',
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
    },
    {
      id: 'threatmodel',
      order: 3,
      chipLabel: 'Interrogate the threat model',
      chipDescription: 'CRQC scenarios and the strongest published counter-claims.',
      phaseId: 'p3',
      cswp39Zone: 'risk-management',
      moduleIds: ['quantum-threats', 'data-asset-sensitivity'],
      workshopIds: ['rng-demo'],
      board: {
        heroEyebrow: 'Researcher / Academic · the estimate, its sources, and its objections',
        heroBadge: {
          text: 'All regions · unfiltered',
          tone: 'illustrative' as 'sourced' | 'illustrative',
        },
        headline: 'Argue with the threat model.',
        sub: 'CRQC arrival is a distribution, not a date. The consensus window, every source behind it, and the strongest published objections are all on file and all dated.',
        ctaPrimary: 'Open the evidence workspace',
        ctaPrimaryHref: '/library',
        ctaSecondary: 'Check the deadlines',
        ctaSecondaryHref: '/timeline',
        proofChips: [
          'Counter-claims dataset · CVE snapshots',
          'Authoritative / High / Moderate / Low source tiers',
          '789 sources, trust-tiered',
          'Drift guards fail the build on silent data change',
        ],
        sideCard: {
          title: 'The CRQC consensus',
          tone: 'bad' as 'bad' | 'warn' | 'info' | 'accent',
          provenance: 'sourced' as 'sourced' | 'illustrative',
          rows: [
            { label: 'Consensus estimate', value: '2033 (2030–2036)' },
            { label: 'Data must stay secret', value: '12 yrs' },
            { label: 'A migration takes', value: '5 yrs' },
          ],
          punchline: 'Start by 2028, or your 12-year secrets are already late.',
          footnote:
            "Mosca's inequality: a 5-year migration must finish before the machine arrives, so it has to start by 2028. The 2033 estimate is the median across 6 tracked sources; 2030–2036 is the consensus window, not a forecast.",
        },
        gridTitle: 'What the workspace gives you',
        gridSub: 'The estimate and its dissent, side by side',
        gridCards: [
          {
            title: 'Every source, tiered',
            body: 'The estimate is a median across tracked sources, each with its own date, tier and link — not a single headline number.',
          },
          {
            title: 'The objections too',
            body: 'Where a published counter-claim exists it is on file against the claim it disputes, not omitted.',
          },
          {
            title: 'Command Center · Risk Analysis',
            body: 'Risk Register, Risk Treatment Plan, Policy Draft, Audit Checklist and CRQC Scenario as citable evidence.',
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
    },
  ],
  curious: [
    {
      id: 'break',
      order: 1,
      chipLabel: 'Watch it break',
      chipDescription: 'See a real connection fall over, in this tab.',
      phaseId: '',
      cswp39Zone: '',
      moduleIds: ['pqc-101', 'quantum-threats'],
      workshopIds: ['tls-simulator'],
      board: {
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
    },
    {
      id: 'short',
      order: 2,
      chipLabel: 'The 30-second version',
      chipDescription: 'The one idea worth leaving with, and nothing else.',
      phaseId: '',
      cswp39Zone: '',
      moduleIds: ['pqc-101'],
      workshopIds: [],
      board: {
        heroEyebrow: 'No background needed · about 30 seconds · nothing to install',
        heroBadge: {
          text: 'Americas · unfiltered',
          tone: 'illustrative' as 'sourced' | 'illustrative',
        },
        headline: 'Thirty seconds, then decide.',
        sub: 'Someone can record encrypted traffic today and open it years later, once the right computer exists. That is the whole argument. Everything else is detail.',
        ctaPrimary: 'Show me the dates',
        ctaPrimaryHref: '/timeline',
        ctaSecondary: 'Watch it break',
        ctaSecondaryHref: '/playground/tls-simulator',
        proofChips: [
          'Plain English by default',
          'Every term explained on hover',
          'Nothing to install',
        ],
        sideCard: {
          title: 'The one idea',
          tone: 'bad' as 'bad' | 'warn' | 'info' | 'accent',
          provenance: 'illustrative' as 'sourced' | 'illustrative',
          rows: [
            { label: 'Recorded today', value: 'opened later' },
            { label: 'Nothing you do now', value: 'un-records it' },
            { label: 'So the fix', value: 'change the lock before then' },
          ],
          punchline: 'Harvest now, decrypt later.',
          footnote:
            'An illustrative framing of the harvest-now-decrypt-later argument. The dates it depends on are on the timeline, with sources.',
        },
        gridTitle: 'Where you can go next',
        gridSub: 'Optional, none of it locked',
        gridCards: [
          {
            title: 'The 6-minute version',
            body: 'If thirty seconds landed, the short path is six modules of plain language and no jargon.',
          },
          {
            title: 'The dates',
            body: 'When governments say the old locks stop being acceptable — published, not predicted.',
          },
          {
            title: 'The demo',
            body: 'A real connection, broken in front of you, whenever you want it.',
          },
        ] as [
          { title: string; body: string },
          { title: string; body: string },
          { title: string; body: string },
        ],
        trackTitle: 'Start anywhere. Nothing is locked.',
        trackNote:
          'Optional, none of it sequenced — pick what looks interesting and stop when you have had enough.',
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
    },
    {
      id: 'mylife',
      order: 3,
      chipLabel: 'Where this touches me',
      chipDescription: 'Your payments, your ID, your medical records.',
      phaseId: '',
      cswp39Zone: '',
      moduleIds: ['digital-assets', 'digital-id', 'healthcare-pqc'],
      workshopIds: ['digital-id', 'bitcoin-flow'],
      board: {
        heroEyebrow: 'No background needed · about 6 minutes · nothing to install',
        heroBadge: {
          text: 'Americas · unfiltered',
          tone: 'illustrative' as 'sourced' | 'illustrative',
        },
        headline: 'Where this actually touches you.',
        sub: 'Your card payments, the ID in your phone and your medical records all lean on the same maths. Here is what changes for each, and which one cannot wait.',
        ctaPrimary: 'Watch it break',
        ctaPrimaryHref: '/playground/tls-simulator',
        ctaSecondary: 'Browse the library',
        ctaSecondaryHref: '/library',
        proofChips: [
          'Real cryptography, running here',
          'Plain English by default',
          'Every term explained on hover',
        ],
        sideCard: {
          title: 'Three things it touches',
          tone: 'info' as 'bad' | 'warn' | 'info' | 'accent',
          provenance: 'illustrative' as 'sourced' | 'illustrative',
          rows: [
            { label: 'Payments', value: 'the card in your pocket' },
            { label: 'Identity', value: 'the ID in your phone' },
            { label: 'Health records', value: 'kept for decades' },
          ],
          punchline: 'Long-lived data is the part that cannot wait.',
          footnote:
            'Illustrative examples chosen because their data outlives the lock protecting it. The underlying standards for each are in the library.',
        },
        gridTitle: 'Where you can go next',
        gridSub: 'Three doors, all optional',
        gridCards: [
          {
            title: 'Money',
            body: 'How card payments and digital assets are protected, and what changes for them.',
          },
          {
            title: 'Identity',
            body: 'Digital ID is designed to last years — which is exactly what makes it interesting here.',
          },
          {
            title: 'Records',
            body: 'Health data is kept for decades, so it is the clearest case of harvest now, decrypt later.',
          },
        ] as [
          { title: string; body: string },
          { title: string; body: string },
          { title: string; body: string },
        ],
        trackTitle: 'Start anywhere. Nothing is locked.',
        trackNote:
          'Optional, none of it sequenced — pick what looks interesting and stop when you have had enough.',
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
    },
  ],
}

/**
 * The board a role opens on — its order-1 variant.
 *
 * Kept as a distinct export so every existing consumer
 * (PersonaBoardView, CuriousMobileBoard, ResearcherFieldWatchCard, the drift
 * guards) keeps working unchanged against "the role's board", and only code
 * that genuinely cares about variants reaches for the map above.
 */
export const PERSONA_JOURNEY_BOARD: Record<PersonaId, PersonaJourneyBoard> = Object.fromEntries(
  Object.entries(PERSONA_JOURNEY_BOARD_VARIANTS).map(([role, variants]) => [
    role,
    variants[0].board,
  ])
) as Record<PersonaId, PersonaJourneyBoard>
