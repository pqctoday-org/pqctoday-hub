// SPDX-License-Identifier: GPL-3.0-only
/**
 * GENERATED — do not edit by hand.
 * Source: src/data/role_board_content_08072026.csv
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
      businessToolIds: ['program-charter'],
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
        ctaSecondary: 'Draft the program charter',
        ctaSecondaryHref: '/business/tools/program-charter',
        proofChips: [
          'Verified in your browser against NIST ACVP vectors',
          '804 sources, trust-tiered',
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
          punchline: 'Your start-by year was 2016 — you are ten years past it.',
          footnote:
            "Mosca's inequality: Z 2033 − X 12 yrs − Y 5 yrs = 2016. A 5-year migration had to finish by 2021, because 12-year secrets encrypted after that are still confidential when the machine arrives — finishing as it arrives protects nothing already sent. The 2033 estimate is the median across 6 tracked sources; 2030–2036 is the consensus window, not a forecast.",
        },
        gridTitle: 'What you walk out with',
        gridSub: 'Your own answers, not a sample estate',
        gridCards: [
          {
            title: 'Eight questions, one risk position',
            body: 'The assessment turns 8 answers about your estate into a defensible risk position, with the regulatory dates that already bind you attached to it.',
          },
          {
            title: 'A drafted mandate',
            body: 'The Program Charter tool drafts the Phase 0 mandate — sponsor sign-off, steering committee, the QRPM appointment and the governance model.',
          },
          {
            title: 'Why the mandate comes first',
            body: 'Phase 0 exists because a programme without a named sponsor and a standing committee stalls at the first budget review, whatever the inventory says.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
      businessToolIds: ['risk-register'],
      board: {
        heroEyebrow: 'Executive / GRC · risk position · the dates that already bind you',
        heroBadge: {
          text: 'Default: Americas · Finance & Banking — scenario shown: EU',
          tone: 'illustrative' as 'sourced' | 'illustrative',
        },
        headline: 'Know what you are actually exposed to.',
        sub: 'The same eight questions, scored. You get a risk position you can defend line by line, with each regulatory deadline attached to the finding it threatens rather than filed in an appendix.',
        ctaPrimary: 'See a finished example report',
        ctaPrimaryHref: '/report?example=1',
        ctaSecondary: 'Build the risk register',
        ctaSecondaryHref: '/business/tools/risk-register',
        proofChips: [
          '804 sources, trust-tiered',
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
            title: 'A finished report, before you start',
            body: 'The worked example renders a complete report under its own authored persona — you can read the output before committing to the assessment.',
          },
          {
            title: 'A register with owners on it',
            body: 'The Risk Register Builder turns the score into named risks with impact, likelihood, an owner and a mitigation each — the form a risk committee accepts.',
          },
          {
            title: 'Why a register, not just a score',
            body: 'A number persuades a meeting once. A register with an owner against each risk is what survives the meeting and gets re-read next quarter.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
      businessToolIds: ['roadmap-builder'],
      board: {
        heroEyebrow: 'Executive / GRC · sequenced plan · owners · KPIs',
        heroBadge: {
          text: 'Default: Americas · Finance & Banking — scenario shown: EU',
          tone: 'illustrative' as 'sourced' | 'illustrative',
        },
        headline: 'Show a plan your regulator will accept.',
        sub: 'A sequenced roadmap with named owners, measurable KPIs and a policy draft — built from the same eight answers, so your plan and your risk position cannot quietly disagree.',
        ctaPrimary: 'Build the roadmap',
        ctaPrimaryHref: '/business/tools/roadmap-builder',
        ctaSecondary: 'Check what already binds you',
        ctaSecondaryHref: '/compliance',
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
            title: 'A two-track roadmap',
            body: "The Roadmap Builder sequences key-exchange/HNDL work alongside signatures and PKI across the framework's eight phases — a shape, not just a deadline.",
          },
          {
            title: 'What already binds you',
            body: 'The compliance view lists the standardization and certification frameworks in force and what each one already requires of you.',
          },
          {
            title: 'Two tracks, not one list',
            body: 'Harvest-now-decrypt-later work and signature/PKI work have different deadlines and different owners — a single ordered list hides that.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
      workshopIds: ['hybrid-encrypt'],
      businessToolIds: ['crypto-api-refactor-audit'],
      board: {
        heroEyebrow: 'Developer · Node + Go services · TLS termination at the edge',
        heroBadge: { text: 'Americas · Technology', tone: 'sourced' as 'sourced' | 'illustrative' },
        headline: 'Five minutes to a real ML-KEM handshake.',
        sub: 'Not a diagram. ML-KEM and X25519 combined through a real HKDF pipeline in this tab, every intermediate value inspectable. Then we tell you what to change in your stack.',
        ctaPrimary: 'Run ML-KEM + X25519 now',
        ctaPrimaryHref: '/playground/hybrid-encrypt',
        ctaSecondary: 'Grade your crypto agility',
        ctaSecondaryHref: '/business/tools/crypto-api-refactor-audit',
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
        gridSub: 'A handshake you have actually run',
        gridCards: [
          {
            title: 'A real hybrid KEM pipeline',
            body: "ML-KEM encapsulation combined with an X25519 ECDH share and run through HKDF — the exact construction a hybrid handshake negotiates, with each step's bytes shown.",
          },
          {
            title: 'A grade on your call sites',
            body: 'The Crypto API Refactor Audit (CSWP.39 §4.1) grades how agile your current crypto call sites are, and what refactoring this pilot implies for them.',
          },
          {
            title: 'The construction, not the diagram',
            body: 'This is the primitive underneath every hybrid key exchange you will ship. Getting it right here is what makes the protocol-level work uneventful.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
        capstoneChip: { label: 'Pilot-Ready' },
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
      businessToolIds: ['crypto-cbom-builder'],
      board: {
        heroEyebrow: 'Developer / Engineer · CBOM before code changes',
        heroBadge: { text: 'Americas · Technology', tone: 'sourced' as 'sourced' | 'illustrative' },
        headline: 'Find the crypto before you change it.',
        sub: 'Most of your cryptography was chosen by a library default, not by you. A CBOM names what your services actually negotiate — start from the catalogue rather than from a grep.',
        ctaPrimary: 'Open OpenSSL Studio',
        ctaPrimaryHref: '/playground/openssl-studio',
        ctaSecondary: 'Build the CBOM',
        ctaSecondaryHref: '/business/tools/crypto-cbom-builder',
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
            title: 'A full OpenSSL environment',
            body: 'OpenSSL Studio is OpenSSL 3.6.2 compiled to WASM — keygen, certificates, CSR, KEM, signing, KDF and encryption — with 11 guided lessons.',
          },
          {
            title: 'The CBOM itself',
            body: 'The CBOM Builder assembles a Crypto Bill of Materials from an SBOM, library posture or HSM inventory — the artifact an inventory pass is supposed to produce.',
          },
          {
            title: 'Inspect before you inventory',
            body: 'Studio is where you read what a key or certificate really contains — the step before a CBOM is worth writing.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
        capstoneChip: { label: 'Pilot-Ready' },
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
      workshopIds: ['api-security-jwt', 'cert-capacity'],
      businessToolIds: [],
      board: {
        heroEyebrow: 'Developer / Engineer · sizes, budgets, and what overflows',
        heroBadge: { text: 'Americas · Technology', tone: 'sourced' as 'sourced' | 'illustrative' },
        headline: 'The new sizes break your schema first.',
        sub: 'An ML-DSA-65 signature is roughly fifty times an ECDSA one. Your token budget, your database column and your MTU all notice long before your cryptography does.',
        ctaPrimary: 'Sign a JWT with ML-DSA',
        ctaPrimaryHref: '/playground/api-security-jwt',
        ctaSecondary: 'Size the certificate estate',
        ctaSecondaryHref: '/playground/cert-capacity',
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
            title: 'A signed token you can measure',
            body: 'The JWT workshop signs with ML-DSA-44/65/87, SLH-DSA and composite ML-DSA-65+Ed25519, so you can weigh each payload against your own header budget.',
          },
          {
            title: 'The same question, at PKI scale',
            body: 'The Cert Capacity Calculator models storage, bandwidth and CPU for migrating a PKI to ML-DSA, with adjustable certificate counts and renewal cadence.',
          },
          {
            title: 'Where the bytes land',
            body: 'Token payloads, certificate chains and TLS records — the three places the new sizes surface in a service first.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
        capstoneChip: { label: 'Pilot-Ready' },
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
      businessToolIds: ['hybrid-transition-planner'],
      board: {
        heroEyebrow: 'Security architect · Multi-region PKI · 40k certificates',
        heroBadge: {
          text: 'Global · Technology, Telecommunications',
          tone: 'sourced' as 'sourced' | 'illustrative',
        },
        headline: 'Change one policy line. Watch the estate rekey.',
        sub: 'A KMIP 3.0 control plane and a real PKCS#11 HSM, both in this tab. Create keys by business label, flip Classical → Hybrid → Full PQC, and watch the same request get allowed, denied, or auto-rekeyed.',
        ctaPrimary: 'Open the KMIP control plane',
        ctaPrimaryHref: '/playground/cacp',
        ctaSecondary: 'Choose your transition mode',
        ctaSecondaryHref: '/business/tools/hybrid-transition-planner',
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
        gridSub: 'A control plane you have driven',
        gridCards: [
          {
            title: 'A policy-driven KMIP control plane',
            body: 'KMIP 3.0 plus a SoftHSM Rust v3 HSM, both in WebAssembly. Load a crypto-agility policy and watch requests get allowed, denied or auto-rekeyed.',
          },
          {
            title: 'A transition decision, per asset class',
            body: 'The Hybrid Transition Planner (CSWP.39 §3.2.4) walks the decision tree between traditional+PQC, PQC+PQC and pure PQC.',
          },
          {
            title: 'Agility as a control, not a slogan',
            body: 'The control plane is the workshop this board rests on: the policy line you change is a real one, and the estate rekeys against it.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
        capstoneChip: { label: 'Agility-Ready' },
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
      workshopIds: ['pki-workshop'],
      businessToolIds: ['crypto-architecture-diagram'],
      board: {
        heroEyebrow: 'Security Architect · as-is before to-be',
        heroBadge: {
          text: 'Global · Technology, Telecommunications',
          tone: 'sourced' as 'sourced' | 'illustrative',
        },
        headline: 'You cannot draw the to-be without the as-is.',
        sub: 'Every library, HSM, protocol and CA in the estate, inventoried before the target architecture exists. A CBOM is what makes the diagram arguable rather than aspirational.',
        ctaPrimary: 'Document the architecture',
        ctaPrimaryHref: '/business/tools/crypto-architecture-diagram',
        ctaSecondary: 'Build a certificate chain',
        ctaSecondaryHref: '/playground/pki-workshop',
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
        gridSub: 'The evidence under the diagram',
        gridCards: [
          {
            title: 'The as-is, written down',
            body: 'The Crypto Architecture Diagram records apps, libraries, HSMs, protocols, key stores and CAs with their dependencies — the inventory in a form a review board reads.',
          },
          {
            title: 'A chain you built yourself',
            body: 'The PKI workshop walks CSR, root CA, issuance, parsing and CRL by hand, so what you are documenting is something you have actually constructed.',
          },
          {
            title: 'Documented, then verified',
            body: 'The diagram is the deliverable; the chain workshop is how you check that what you drew is what your CAs actually issue.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
        capstoneChip: { label: 'Agility-Ready' },
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
      workshopIds: ['envelope-encrypt'],
      businessToolIds: ['infra-modernization-planner'],
      board: {
        heroEyebrow: 'Security Architect · where the keys live',
        heroBadge: {
          text: 'Global · Technology, Telecommunications',
          tone: 'sourced' as 'sourced' | 'illustrative',
        },
        headline: 'Decide where the keys live.',
        sub: "HSM partitions, KMS policy and TPM-backed device identity all behave differently under ML-DSA. Size them before you commit to a date in someone else's plan.",
        ctaPrimary: 'Wrap a key, KMS-style',
        ctaPrimaryHref: '/playground/envelope-encrypt',
        ctaSecondary: 'Plan the modernization',
        ctaSecondaryHref: '/business/tools/infra-modernization-planner',
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
            title: 'Envelope encryption, end to end',
            body: 'ML-KEM plus AES key wrap in the KMS envelope pattern — the shape most key stores will adopt, run before you commit to it.',
          },
          {
            title: 'A Phase 6 deliverable',
            body: 'The Infrastructure Modernization Planner consolidates the PKI modernization plan and the HSM/KMS upgrade schedule into one document.',
          },
          {
            title: 'Where the keys live',
            body: 'The envelope workshop is what this board rests on: it is the difference between a key policy you wrote and one you have executed.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
        capstoneChip: { label: 'Agility-Ready' },
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
      workshopIds: ['hsm-capacity'],
      businessToolIds: ['refresh-cycle-alignment'],
      board: {
        heroEyebrow: 'IT Ops · 12k certs · 4 HSM partitions · next renewal window in 90 days',
        heroBadge: {
          text: 'Americas · Energy & Utilities, Telecommunications',
          tone: 'sourced' as 'sourced' | 'illustrative',
        },
        headline: 'Size your fleet before renewal day.',
        sub: 'Ten enterprise workflows, sized side by side: RSA-3072 and ECDSA P-256 today against ML-DSA-44/65/87. Storage, bandwidth, and CPU cores per workflow, with a totals row.',
        ctaPrimary: 'Size your HSM fleet',
        ctaPrimaryHref: '/playground/hsm-capacity',
        ctaSecondary: 'Align to funded refreshes',
        ctaSecondaryHref: '/business/tools/refresh-cycle-alignment',
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
        gridSub: 'A sizing verdict, not a guess',
        gridCards: [
          {
            title: 'Your HSM fleet, sized',
            body: 'Ten enterprise use cases compared classical against PQC, with per-algorithm tuning — storage, bandwidth and CPU per workflow.',
          },
          {
            title: 'Sizing turned into a schedule',
            body: 'Refresh-Cycle Alignment maps PQC migration tasks onto infrastructure refresh cycles you have already funded.',
          },
          {
            title: 'Sizing that lands in a plan',
            body: 'A capacity number only matters once it has a date attached, which is what the refresh-cycle alignment adds. Mitigation gateways carry mandatory sunset dates per CSWP.39 §4.6.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
        capstoneChip: { label: 'Cutover-Ready' },
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
      workshopIds: ['vpn-sim'],
      businessToolIds: ['deployment-playbook'],
      board: {
        heroEyebrow: 'IT Ops · rehearse before the change window',
        heroBadge: {
          text: 'Americas · Energy & Utilities, Telecommunications',
          tone: 'sourced' as 'sourced' | 'illustrative',
        },
        headline: 'Rehearse the cutover before renewal day.',
        sub: 'Hybrid tunnels and hybrid certificates, end to end in this tab, so the first time you meet a fragmentation bug is not at 2am inside a change window.',
        ctaPrimary: 'Run an IKEv2 hybrid handshake',
        ctaPrimaryHref: '/playground/vpn-sim',
        ctaSecondary: 'Write the playbook',
        ctaSecondaryHref: '/business/tools/deployment-playbook',
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
            title: 'A full IKEv2 handshake',
            body: 'The VPN simulator runs IKEv2 in WASM with PKCS#11 crypto routed through SoftHSMv3, and the live C_* calls open for inspection.',
          },
          {
            title: 'The rehearsal, written down',
            body: 'The Deployment Playbook generates the rollout with rollback procedures and validation steps — for the night itself, not the tab.',
          },
          {
            title: 'Two protocols, not one',
            body: 'The cutover rarely fails in the protocol you rehearsed — which is why this board carries both.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
        capstoneChip: { label: 'Cutover-Ready' },
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
      businessToolIds: ['vendor-scorecard'],
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
        ctaSecondary: 'Score your vendors',
        ctaSecondaryHref: '/business/tools/vendor-scorecard',
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
            title: 'Supplier roadmaps as published',
            body: "Vendor PQC roadmaps quoted as issued rather than summarised, each linked to the vendor's own source or not shown at all.",
          },
          {
            title: 'Claims made comparable',
            body: 'The Vendor Scorecard Builder turns roadmap claims into a comparable PQC-readiness assessment per supplier.',
          },
          {
            title: 'A date means nothing without enrollment',
            body: 'If a supplier cannot enrol a PQC certificate, their roadmap date is a press release. This board lets you check both.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
        capstoneChip: { label: 'Cutover-Ready' },
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
      workshopIds: [],
      businessToolIds: [],
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
        ctaSecondary: 'Read the revision log',
        ctaSecondaryHref: '/revisions',
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
        gridSub: 'Every claim traceable to its source',
        gridCards: [
          {
            title: 'The corpus, unfiltered',
            body: 'Source tier, verification date and the counter-claim where one is on file. Nothing is filtered out for this role — the corpus arrives whole.',
          },
          {
            title: 'The correction history',
            body: 'Every logged correction to the compliance, vendor and migration data, with who reviewed it — the audit trail behind the catalogues.',
          },
          {
            title: 'Provenance you can re-check',
            body: 'Both destinations are read-only records: the corpus with its tiers, and the log of every correction made to it. Nothing here asks you to trust a summary.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
      workshopIds: ['slh-dsa', 'entropy-test'],
      businessToolIds: [],
      board: {
        heroEyebrow: 'Researcher / Academic · run it yourself · export the log',
        heroBadge: {
          text: 'All regions · unfiltered',
          tone: 'illustrative' as 'sourced' | 'illustrative',
        },
        headline: 'Run the tests yourself.',
        sub: 'ACVP vectors, known-answer tests and the 25-check TCG V1.85 runner all execute locally in this tab. Export the log. Do not take our word for any of it.',
        ctaPrimary: 'Run SLH-DSA sign and verify',
        ctaPrimaryHref: '/playground/slh-dsa',
        ctaSecondary: 'Run the SP 800-90B entropy suite',
        ctaSecondaryHref: '/playground/entropy-test',
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
            title: 'All 12 FIPS 205 parameter sets',
            body: 'SLH-DSA sign and verify across every parameter set, pre-hash variants included, executed locally in the browser.',
          },
          {
            title: 'Randomness, tested not asserted',
            body: 'The NIST SP 800-90B suite — monobit, frequency and min-entropy — run against live output rather than quoted from a datasheet.',
          },
          {
            title: 'Nothing here is recorded output',
            body: 'Both workshops run real implementations compiled to WebAssembly, alongside the 25-check TCG V1.85 runner. The log is exportable, so the claim is yours to check.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
      workshopIds: [],
      businessToolIds: ['crqc-scenario'],
      board: {
        heroEyebrow: 'Researcher / Academic · the estimate, its sources, and its objections',
        heroBadge: {
          text: 'All regions · unfiltered',
          tone: 'illustrative' as 'sourced' | 'illustrative',
        },
        headline: 'Argue with the threat model.',
        sub: 'CRQC arrival is a distribution, not a date. The consensus window, every source behind it, and the strongest published objections are all on file and all dated.',
        ctaPrimary: 'Plan a CRQC scenario',
        ctaPrimaryHref: '/business/tools/crqc-scenario',
        ctaSecondary: 'Read the threat economics',
        ctaSecondaryHref: '/threats',
        proofChips: [
          'Counter-claims dataset · CVE snapshots',
          'Authoritative / High / Moderate / Low source tiers',
          '804 sources, trust-tiered',
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
          punchline: 'Your start-by year was 2016 — you are ten years past it.',
          footnote:
            "Mosca's inequality: Z 2033 − X 12 yrs − Y 5 yrs = 2016. A 5-year migration had to finish by 2021, because 12-year secrets encrypted after that are still confidential when the machine arrives — finishing as it arrives protects nothing already sent. The 2033 estimate is the median across 6 tracked sources; 2030–2036 is the consensus window, not a forecast.",
        },
        gridTitle: 'What the workspace gives you',
        gridSub: 'The estimate and its dissent',
        gridCards: [
          {
            title: 'Scenarios, not a single date',
            body: 'The CRQC Scenario Planner models cryptographically-relevant-quantum-computer arrival scenarios and what each one implies for your own horizon.',
          },
          {
            title: 'The threat data, with its sources',
            body: 'Threat Economics, the CRQC Capability Watch and the Z-estimate, each figure carrying the sources behind it.',
          },
          {
            title: 'An estimate, not a date',
            body: 'The consensus is a median across tracked sources, each with its own date, tier and link — and the published objections are on file too.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
      businessToolIds: ['breach-simulator'],
      board: {
        heroEyebrow: 'No background needed · about 6 minutes · nothing to install',
        heroBadge: {
          text: 'Americas · unfiltered',
          tone: 'illustrative' as 'sourced' | 'illustrative',
        },
        headline: 'What actually breaks, and when.',
        sub: 'The padlock in your browser relies on maths a quantum computer would undo. Watch it happen to a real connection in this tab, then decide how much further you want to go.',
        ctaPrimary: 'Watch a real handshake',
        ctaPrimaryHref: '/playground/tls-simulator',
        ctaSecondary: 'See what a breach costs',
        ctaSecondaryHref: '/business/tools/breach-simulator',
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
        gridSub: 'Optional, none of it locked',
        gridCards: [
          {
            title: 'A real connection, in this tab',
            body: 'The TLS 1.3 simulator runs an actual handshake — the same negotiation your browser does for the padlock — so you can see which part the quantum threat lands on.',
          },
          {
            title: 'What it would actually cost',
            body: 'The Breach Scenario Simulator compares classical against quantum-enabled breach cost, per event and as annual expected loss.',
          },
          {
            title: 'Why a handshake, of all things',
            body: 'The handshake is where the keys are agreed. It is the one moment worth understanding if you only ever understand one, and it takes about a minute to watch.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
      businessToolIds: ['cost-of-inaction'],
      board: {
        heroEyebrow: 'No background needed · about 30 seconds · nothing to install',
        heroBadge: {
          text: 'Americas · unfiltered',
          tone: 'illustrative' as 'sourced' | 'illustrative',
        },
        headline: 'Thirty seconds, then decide.',
        sub: 'Someone can record encrypted traffic today and open it years later, once the right computer exists. That is the whole argument. Everything else is detail.',
        ctaPrimary: 'Take the guided path',
        ctaPrimaryHref: '/learn',
        ctaSecondary: 'The cost of waiting',
        ctaSecondaryHref: '/business/tools/cost-of-inaction',
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
        gridSub: 'Optional, none of it sequenced',
        gridCards: [
          {
            title: 'One guided path',
            body: 'The learning path is a single route through post-quantum cryptography, ordered for whichever role you pick.',
          },
          {
            title: 'The cost of waiting',
            body: 'The Cost of Inaction Analyzer models the discounted cost of delaying — breach exposure and harvest-now-decrypt-later residual among them.',
          },
          {
            title: 'Thirty seconds was the point',
            body: 'If you stop here you already have the argument. Everything above is optional detail.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
      businessToolIds: [],
      board: {
        heroEyebrow: 'No background needed · about 6 minutes · nothing to install',
        heroBadge: {
          text: 'Americas · unfiltered',
          tone: 'illustrative' as 'sourced' | 'illustrative',
        },
        headline: 'Where this actually touches you.',
        sub: 'Your card payments, the ID in your phone and your medical records all lean on the same maths. Here is what changes for each, and which one cannot wait.',
        ctaPrimary: 'Walk through a digital ID wallet',
        ctaPrimaryHref: '/playground/digital-id',
        ctaSecondary: 'Follow a Bitcoin transaction',
        ctaSecondaryHref: '/playground/bitcoin-flow',
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
            title: 'The ID in your phone',
            body: 'The full EUDI wallet lifecycle: wallet, PID issuance, attestation, relying-party verification and the QES provider.',
          },
          {
            title: 'The money',
            body: 'A Bitcoin transaction end to end — secp256k1 keypair, SHA-256 and RIPEMD-160, transaction signing. Classical crypto, shown as what is being migrated away from.',
          },
          {
            title: 'Why these two',
            body: 'Identity and money are the everyday systems whose data outlives the lock protecting it — which is what makes them the clear cases.',
          },
        ] as [
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
          { title: string; body: string; href?: string },
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
