// SPDX-License-Identifier: GPL-3.0-only
import type { WorkshopChapter, WorkshopFlow } from '@/types/Workshop'

const intro: WorkshopChapter = {
  id: 'intro',
  title: 'Welcome',
  estMinutes: 5,
  steps: [
    {
      id: 'intro-01-welcome',
      chapter: 'intro',
      title: 'What you will leave with',
      estMinutes: 5,
      whyItMatters: 'Sets the destination so every step has a clear payoff for you and your board.',
      page: { route: '/' },
      tasks: ['Skim the four outcomes below', 'Confirm 90 minutes of uninterrupted time'],
      expectedOutput:
        'Clear understanding of the four outcomes: quantum threat literacy, jurisdictional deadlines, board-ready risk report, 90-day action plan.',
      narration:
        'Welcome. In the next ninety minutes you will leave with four things: first, a plain-English understanding of why quantum computing breaks classical cryptography and what Harvest-Now Decrypt-Later already does to your data. Second, your jurisdiction’s post-quantum deadlines — the dates regulators have already committed to. Third, a personalised, board-ready risk report tied to your country and to finance. And fourth, a ninety-day action plan you can hand to your CISO before close of business.',
    },
  ],
}

const prerequisites: WorkshopChapter = {
  id: 'prereq',
  title: 'Pre-flight checklist',
  estMinutes: 3,
  steps: [
    {
      id: 'prereq-01-checklist',
      chapter: 'prereq',
      title: 'Set persona, country, and industry',
      estMinutes: 3,
      whyItMatters:
        'Every page in the app personalises content from your persona context. Setting it once now means the rest of the workshop will surface the right deadlines, threats, and peers automatically.',
      page: { route: '/' },
      tasks: [
        'Open the persona switcher and choose Executive',
        'Set proficiency to Basics (no prior PQC needed)',
        'Choose your country: United States, Canada, or Australia',
        'Set industry to Finance & Banking',
      ],
      expectedOutput:
        'Persona chip shows Executive · Basics · your country · Finance & Banking. The journey panel reflects the executive sequence.',
      narration:
        'Before we begin, we set four things: your role as executive, your proficiency at basics — meaning we assume no prior post-quantum exposure — your country, and your industry as finance and banking. The application personalises every page from these four signals. Pick one country now; we will swap it later if you want to compare jurisdictions.',
      completionSignal: { kind: 'route-visited', route: '/' },
    },
  ],
}

const foundations: WorkshopChapter = {
  id: 'foundations',
  title: 'Foundations',
  estMinutes: 40,
  steps: [
    {
      id: 'f1-landing',
      chapter: 'foundations',
      title: 'Orient on the Landing page',
      estMinutes: 4,
      whyItMatters:
        'The landing page is your command centre entry point. The hero CTA and journey steps are filtered to the executive persona — there is no need to wade through developer playgrounds.',
      page: { route: '/' },
      tasks: [
        'Read the executive hero copy',
        'Note the four journey sections: Start, My Journey, Assess & Report, Keep Up to Date',
        'Identify the secondary CTA: Open Command Center',
      ],
      expectedOutput:
        'You can describe the four executive sections without scrolling and you know where the Command Center lives.',
      narration:
        'This is the executive landing. Notice the journey is already filtered for you — no playgrounds, no algorithm trees. The primary action is Start the Journey, the secondary is Open Command Center, which we will visit at the end. For now, we follow the journey.',
      cues: [
        {
          tMs: 4_000,
          kind: 'caption',
          text: 'The executive landing — journey already filtered for you.',
        },
        { tMs: 8_000, kind: 'spotlight', selector: '[data-workshop-target="landing-cta-primary"]' },
        {
          tMs: 12_000,
          kind: 'callout',
          selector: '[data-workshop-target="landing-cta-primary"]',
          label: 'Start the Journey',
          arrow: 'right',
        },
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'Secondary CTA — Open Command Center — is where we end the workshop.',
        },
        {
          tMs: 65_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="landing-cta-secondary"]',
        },
        {
          tMs: 120_000,
          kind: 'caption',
          text: 'Four sections: Start the Journey · My Journey · Assess & Report · Keep Up to Date.',
        },
        { tMs: 240_000, kind: 'advance' },
      ],
    },
    {
      id: 'f2-learn',
      chapter: 'foundations',
      title: 'Learn the quantum impact',
      estMinutes: 8,
      whyItMatters:
        'You need a common vocabulary with your board. Q-Day, Harvest-Now Decrypt-Later, and FIPS 203/204 must be five-second answers, not five-minute explanations.',
      page: { route: '/learn' },
      tasks: [
        'Open the module "Executive Quantum Impact"',
        'Walk through the first checkpoint',
        'Note the three terms surfaced: Q-Day, HNDL, FIPS 203/204',
      ],
      expectedOutput: 'First checkpoint of the executive quantum impact module is closed.',
      narration:
        'This module explains in plain language the three terms you need at boardroom speed. Q-Day is the day a sufficiently large quantum computer breaks RSA and elliptic-curve cryptography. Harvest-Now Decrypt-Later is the present-tense problem: adversaries are already collecting encrypted finance data today to decrypt later. FIPS 203 and 204 are the two NIST standards that fix this — ML-KEM for key exchange, ML-DSA for signatures.',
      completionSignal: { kind: 'module-progress', moduleId: 'exec-quantum-impact', minSteps: 1 },
      cues: [
        // 0–60s: Foundation first — walk PQC 101
        {
          tMs: 4_000,
          kind: 'caption',
          text: 'Foundation first — start with PQC 101 for the shared vocabulary.',
        },
        {
          tMs: 8_000,
          kind: 'scroll-to',
          selector: '[data-workshop-target="learn-module-pqc-101"]',
        },
        {
          tMs: 12_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="learn-module-pqc-101"]',
        },
        {
          tMs: 20_000,
          kind: 'click',
          selector: '[data-workshop-target="learn-module-pqc-101"]',
        },
        // 60–180s: Inside PQC 101 — Next button clicks demonstrate stepper navigation
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'PQC 101 — quantum threat in plain language.',
        },
        {
          tMs: 90_000,
          kind: 'click',
          selector: '[data-workshop-target="learn-stepper-next"]',
        },
        {
          tMs: 120_000,
          kind: 'caption',
          text: 'Q-Day — the day a quantum computer breaks RSA and elliptic-curve crypto.',
        },
        {
          tMs: 150_000,
          kind: 'click',
          selector: '[data-workshop-target="learn-stepper-next"]',
        },
        {
          tMs: 180_000,
          kind: 'caption',
          text: 'Harvest-Now Decrypt-Later — already happening to finance traffic today.',
        },
        // 180–300s: Back to /learn, then into the role-specific exec module
        { tMs: 220_000, kind: 'navigate', route: '/learn' },
        {
          tMs: 230_000,
          kind: 'caption',
          text: 'Now the role-specific module — Executive Quantum Impact.',
        },
        {
          tMs: 240_000,
          kind: 'scroll-to',
          selector: '[data-workshop-target="learn-module-exec-quantum-impact"]',
        },
        {
          tMs: 250_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="learn-module-exec-quantum-impact"]',
        },
        {
          tMs: 260_000,
          kind: 'click',
          selector: '[data-workshop-target="learn-module-exec-quantum-impact"]',
        },
        // 300–420s: Walk module structure — Learn → Workshop → Reference
        {
          tMs: 300_000,
          kind: 'caption',
          text: 'Module structure — Learn · Workshop · Reference.',
        },
        { tMs: 320_000, kind: 'select-tab', tabName: 'Workshop' },
        {
          tMs: 330_000,
          kind: 'caption',
          text: 'Workshop tab — interactive crypto in your browser via OpenSSL WASM + liboqs.',
        },
        { tMs: 360_000, kind: 'select-tab', tabName: 'Reference' },
        {
          tMs: 370_000,
          kind: 'caption',
          text: 'Reference — every claim cites NIST FIPS 203/204 and primary sources.',
        },
        // 420–480s: close
        {
          tMs: 420_000,
          kind: 'caption',
          text: 'FIPS 203 = ML-KEM (replaces RSA). FIPS 204 = ML-DSA (replaces ECDSA).',
        },
        { tMs: 480_000, kind: 'advance' },
      ],
    },
    {
      id: 'f3-threats',
      chapter: 'foundations',
      title: 'See finance-specific threats',
      estMinutes: 5,
      whyItMatters:
        'Generic quantum risk talk does not move budgets. The five FIN- threats here are concrete and tied to systems your bank already runs: TARGET2, SWIFT, HSMs, transaction logs.',
      page: { route: '/threats', query: { industry: 'Financial Services / Banking' } },
      tasks: [
        'Filter by Finance & Banking',
        'Open FIN-001: BIS Project Leap (TARGET2 hybrid PQC)',
        'Open FIN-004: HSM backup key extraction',
        'Open FIN-005: FS-ISAC sector-readiness warning',
        'Bookmark at least one threat',
      ],
      expectedOutput: 'At least one finance threat is bookmarked, criticality scores noted.',
      narration:
        'These are not generic threats. FIN-001 is the Bank for International Settlements live test of hybrid PQC on TARGET2 — that is real-time gross settlement for the euro area. FIN-004 explains why your hardware security modules are not safe even when offline: backup keys wrapped with RSA become recoverable retroactively. FIN-005 is the FS-ISAC warning that the financial sector has not allocated the resources to meet 2030 deadlines.',
      completionSignal: { kind: 'bookmark-added', surface: 'compliance' },
      cues: [
        {
          tMs: 4_000,
          kind: 'caption',
          text: 'Five concrete threats tied to systems your bank already runs.',
        },
        {
          tMs: 8_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="threats-toc-FIN-001"]',
        },
        {
          tMs: 12_000,
          kind: 'click',
          selector: '[data-workshop-target="threats-toc-FIN-001"]',
        },
        // 60-150s: FIN-001 BIS Project Leap
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'FIN-001: BIS Project Leap — live hybrid-PQC test on TARGET2 real-time settlement.',
        },
        // 150-200s: FIN-004 HSM
        {
          tMs: 150_000,
          kind: 'click',
          selector: '[data-workshop-target="threats-toc-FIN-004"]',
        },
        {
          tMs: 155_000,
          kind: 'caption',
          text: 'FIN-004: HSM backup keys wrapped with RSA become recoverable retroactively. Offline does not save you.',
        },
        // 200-260s: FIN-005 FS-ISAC
        {
          tMs: 200_000,
          kind: 'click',
          selector: '[data-workshop-target="threats-toc-FIN-005"]',
        },
        {
          tMs: 205_000,
          kind: 'caption',
          text: 'FIN-005: FS-ISAC — financial sector under-resourced to meet 2030.',
        },
        { tMs: 300_000, kind: 'advance' },
      ],
    },
    {
      id: 'f4-timeline',
      chapter: 'foundations',
      title: 'Walk the regulatory runway',
      estMinutes: 5,
      whyItMatters:
        'Deadlines drive procurement. The timeline shows exactly how many quarters you have, which agencies own each milestone, and what binds in your jurisdiction.',
      page: { route: '/timeline' },
      tasks: [
        'Filter by your region',
        'Bookmark your country',
        'Export the timeline CSV for your board secretary',
      ],
      expectedOutput: 'Country bookmarked; CSV download triggered.',
      narration:
        'The runway is shorter than most boards realise. We will land on the specific deadlines for your country in the region chapter. For now, note three patterns: announcements have already happened, mandatory deadlines cluster around 2030, and procurement decisions you make in the next twelve to eighteen months will determine whether you meet them.',
      completionSignal: { kind: 'bookmark-added', surface: 'timeline' },
      cues: [
        { tMs: 4_000, kind: 'caption', text: 'The runway is shorter than most boards realise.' },
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'Pattern 1: announcements have already happened. The first ASD guide is from 2022.',
        },
        {
          tMs: 120_000,
          kind: 'caption',
          text: 'Pattern 2: mandatory deadlines cluster around 2030.',
        },
        {
          tMs: 180_000,
          kind: 'caption',
          text: 'Pattern 3: procurement decisions in the next 12–18 months determine whether you meet them.',
        },
        {
          tMs: 240_000,
          kind: 'caption',
          text: 'We will land on country-specific deadlines in the region chapter.',
        },
        { tMs: 300_000, kind: 'advance' },
      ],
    },
    {
      id: 'f5-library',
      chapter: 'foundations',
      title: 'Source the standards',
      estMinutes: 6,
      whyItMatters:
        'Your CISO will ask "what document says that?". The library gives you the primary sources — NIST FIPS, CCCS ITSM, ASD ISM — without leaving the app.',
      page: { route: '/library' },
      tasks: [
        'Open Government & Policy category',
        'Bookmark NIST FIPS 203 and FIPS 204',
        'Open Migration Guidance category',
        'Bookmark NIST IR 8547 (deprecation timeline)',
      ],
      expectedOutput: 'Three documents bookmarked from the executive-relevant categories.',
      narration:
        'These are the primary sources. FIPS 203 standardises ML-KEM, the key encapsulation mechanism that replaces RSA key exchange. FIPS 204 standardises ML-DSA, the signature algorithm. NIST Internal Report 8547 is the deprecation calendar — it is the document your auditors will cite when they ask why you are still running ECDSA in 2031.',
      completionSignal: { kind: 'bookmark-added', surface: 'library' },
      cues: [
        {
          tMs: 4_000,
          kind: 'caption',
          text: 'Primary sources — what your CISO will cite when asked "what document says that?".',
        },
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'FIPS 203 — ML-KEM. Replaces RSA key exchange.',
        },
        {
          tMs: 150_000,
          kind: 'caption',
          text: 'FIPS 204 — ML-DSA. Replaces ECDSA signatures.',
        },
        {
          tMs: 240_000,
          kind: 'caption',
          text: 'NIST IR 8547 — the deprecation calendar your auditors will cite in 2031.',
        },
        {
          tMs: 300_000,
          kind: 'caption',
          text: 'Bookmark all three so they are one click away during board prep.',
        },
        { tMs: 360_000, kind: 'advance' },
      ],
    },
    {
      id: 'f6-leaders',
      chapter: 'foundations',
      title: 'See finance peers leading',
      estMinutes: 4,
      whyItMatters:
        'Boards respond to peer movement. Concrete names — Citi, Santander, FS-ISAC working groups — convert "we should look at this" into "we are already behind".',
      page: { route: '/leaders', query: { cat: 'Industry Adopter' } },
      tasks: [
        'Filter by category: Industry Adopter',
        'Open Sudha Iyer (Citi, founding FS-ISAC PQC working group member)',
        'Open Jaime Gomez Garcia (Banco Santander Head of Quantum Technologies)',
        'Bookmark one leader',
      ],
      expectedOutput: 'One leader bookmarked.',
      narration:
        'These are real names, real institutions. Citi has had a chief cybersecurity architect inside the FS-ISAC PQC working group since its founding. Santander has a head of quantum technologies who is active in the European Telecommunications Standards Institute and the IBM Quantum Network. If your board asks "are our peers doing this", the answer is yes, and these are the people they are sending.',
      completionSignal: { kind: 'bookmark-added', surface: 'leaders' },
      cues: [
        { tMs: 4_000, kind: 'caption', text: 'Real names. Real institutions. Real movement.' },
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'Sudha Iyer — Citi Chief Cybersecurity Architect. Founding FS-ISAC PQC working-group member.',
        },
        {
          tMs: 120_000,
          kind: 'caption',
          text: 'Jaime Gomez Garcia — Banco Santander, Head of Quantum Technologies.',
        },
        {
          tMs: 180_000,
          kind: 'caption',
          text: 'When the board asks "are our peers doing this?" — these are the people they are sending.',
        },
        { tMs: 240_000, kind: 'advance' },
      ],
    },
    {
      id: 'f7-assess',
      chapter: 'foundations',
      title: 'Run the executive risk assessment',
      estMinutes: 6,
      whyItMatters:
        'The Quick mode generates a personalised risk profile in two minutes. It is the input to your board-ready report and seeds the Command Center artifacts.',
      page: { route: '/assess' },
      tasks: [
        'Choose Quick mode (badged for executives)',
        'Confirm country and industry pre-fills',
        'Answer four to six questions about data sensitivity, retention, and existing crypto inventory',
      ],
      expectedOutput: 'Assessment status changes to complete; report becomes available.',
      narration:
        'Quick mode is calibrated for executives — six questions, two minutes. The questions are about data sensitivity, retention horizon, and whether you already have a cryptographic inventory. The output is a risk profile that we use as the input to the next page.',
      completionSignal: { kind: 'assessment-complete' },
      cues: [
        { tMs: 4_000, kind: 'caption', text: 'Quick mode — calibrated for executives.' },
        { tMs: 8_000, kind: 'spotlight', selector: '[data-workshop-target="assess-mode-quick"]' },
        {
          tMs: 12_000,
          kind: 'callout',
          selector: '[data-workshop-target="assess-mode-quick"]',
          label: 'Recommended for you',
          arrow: 'right',
        },
        {
          tMs: 20_000,
          kind: 'click',
          selector: '[data-workshop-target="assess-mode-quick"]',
        },
        // 60-180s: question framing
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'Six questions. Data sensitivity, retention horizon, crypto inventory.',
        },
        {
          tMs: 180_000,
          kind: 'caption',
          text: 'Two minutes — and the output seeds your board-ready report.',
        },
        // 240-360s: results
        {
          tMs: 240_000,
          kind: 'caption',
          text: 'The risk profile is the input to the next page.',
        },
        { tMs: 360_000, kind: 'advance' },
      ],
    },
    {
      id: 'f8-report',
      chapter: 'foundations',
      title: 'Read the personalised risk report',
      estMinutes: 4,
      whyItMatters:
        'This is your board pack. It hides developer-only sections, surfaces your top five recommended actions, and produces a shareable URL the board secretary can use.',
      page: { route: '/report' },
      tasks: [
        'Expand the executive summary',
        'Note the top five recommended actions',
        'Generate a shareable URL',
      ],
      expectedOutput:
        'Shareable report URL is visible; you can describe the top five actions in one breath.',
      narration:
        'Notice what is hidden: algorithm migration tables, mitigation deep-dives. Those are not for you. What is shown is a five-action shortlist tied to your jurisdiction. The share button generates a token-bearing URL — not a PDF — that your board secretary can embed in the next agenda. PDFs go stale; this URL re-renders against current data.',
      cues: [
        { tMs: 4_000, kind: 'caption', text: 'Your board pack — hides developer-only sections.' },
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'Five-action shortlist tied to your jurisdiction.',
        },
        {
          tMs: 120_000,
          kind: 'caption',
          text: 'Share button generates a token-bearing URL — not a PDF.',
        },
        {
          tMs: 180_000,
          kind: 'caption',
          text: 'PDFs go stale. This URL re-renders against current data every time.',
        },
        { tMs: 240_000, kind: 'advance' },
      ],
    },
  ],
}

const action: WorkshopChapter = {
  id: 'action',
  title: 'Action plan — Command Center CSWP 39 walk-through',
  estMinutes: 20,
  steps: [
    {
      id: 'a1-cswp-governance',
      chapter: 'action',
      title: 'CSWP 39 §5.1–5.4 — Governance zone',
      estMinutes: 5,
      whyItMatters:
        'Governance is the policy layer that shapes every other crypto decision. Without a named owner and a published policy, every later artifact stalls in committee. CSWP.39 §5.1–5.4 makes this the first zone for a reason.',
      page: { route: '/business', query: { zone: 'governance' } },
      tasks: [
        'Open the Command Center and select the Governance zone',
        'Generate the Policy draft (one-page mandate)',
        'Generate the RACI (PQC champion · CISO responsible · CRO consulted · Board sponsor accountable)',
        'Generate the Standards-watch subscription list',
      ],
      expectedOutput: 'Policy draft + RACI + standards-watch list downloaded.',
      narration:
        'The Governance zone of NIST Cybersecurity White Paper 39 — sections five-point-one through five-point-four — is where every executive crypto migration begins. Three artifacts come out of this zone: a one-page policy draft your legal team finishes in an afternoon, a RACI that names four humans, and a standards-watch subscription list so your team is alerted when NIST, ASD, or CCCS publish updates. If you only do one zone in this session, do this one.',
      cues: [
        // Step entry already navigates to /business?zone=governance.
        // 0–60s: Frame Governance, spotlight + click the zone tile
        {
          tMs: 1500,
          kind: 'spotlight',
          selector: '[data-workshop-target="business-zone-governance"]',
        },
        {
          tMs: 2500,
          kind: 'callout',
          selector: '[data-workshop-target="business-zone-governance"]',
          label: 'Start here',
          arrow: 'top',
        },
        {
          tMs: 5_000,
          kind: 'click',
          selector: '[data-workshop-target="business-zone-governance"]',
        },
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'Governance is the policy layer. CSWP.39 §5.1–5.4. Without it every later artifact stalls in committee.',
        },
        // 60–120s: Click the Policy artifact create button
        {
          tMs: 90_000,
          kind: 'caption',
          text: 'Three artifacts: policy draft, RACI, standards-watch subscription.',
        },
        {
          tMs: 100_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="business-artifact-policy-create"]',
        },
        {
          tMs: 110_000,
          kind: 'click',
          selector: '[data-workshop-target="business-artifact-policy-create"]',
        },
        // 120–180s: RACI artifact
        {
          tMs: 130_000,
          kind: 'caption',
          text: 'Policy draft generated — your legal team finishes it in an afternoon.',
        },
        {
          tMs: 150_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="business-artifact-raci-create"]',
        },
        {
          tMs: 160_000,
          kind: 'click',
          selector: '[data-workshop-target="business-artifact-raci-create"]',
        },
        {
          tMs: 180_000,
          kind: 'caption',
          text: 'RACI: PQC champion responsible, CISO accountable, Board sponsor informed.',
        },
        // 180–240s: Standards-watch artifact
        {
          tMs: 210_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="business-artifact-standards-watch-create"]',
        },
        {
          tMs: 220_000,
          kind: 'click',
          selector: '[data-workshop-target="business-artifact-standards-watch-create"]',
        },
        // 240–300s: Close
        {
          tMs: 240_000,
          kind: 'caption',
          text: 'Three artifacts created. If you only do one zone in this session, do this one.',
        },
        { tMs: 300_000, kind: 'advance' },
      ],
    },
    {
      id: 'a2-cswp-assets',
      chapter: 'action',
      title: 'CSWP 39 §5.2 — Assets zone (CBOM)',
      estMinutes: 5,
      whyItMatters:
        'You cannot migrate cryptography you do not know you have. The Assets zone is where the Cryptographic Bill of Materials lives — code, libraries, applications, files, protocols, systems. CSWP.39 §5.2 is the inventory pillar.',
      page: { route: '/business', query: { zone: 'assets' } },
      tasks: [
        'Open the Assets zone',
        'Generate the CBOM template (six asset classes pre-populated)',
        'Generate the vendor-letter campaign (asks every crypto vendor for their PQC roadmap)',
      ],
      expectedOutput: 'CBOM template + vendor-letter campaign downloaded.',
      narration:
        'The Assets zone is the cryptographic bill of materials. Six classes — code, libraries, applications, files, protocols, systems — every one of which can hide a cryptographic dependency. The CBOM template is pre-populated with the six classes; your team fills in the rows over four to six weeks using existing CMDB and SBOM tooling. The vendor-letter campaign sends a single templated request to every cryptographic vendor in your inventory: tell us your post-quantum roadmap. The replies are themselves a CBOM input.',
    },
    {
      id: 'a3-cswp-risk',
      chapter: 'action',
      title: 'CSWP 39 §6.5 — Data-Centric Risk Management zone',
      estMinutes: 5,
      whyItMatters:
        'This is the executive zone. The Information Repository feeds the Risk Analysis Engine, which produces the KPI dashboards your board will see. If your risk register does not have HNDL on it, your auditor will add it next quarter — on their framing, not yours.',
      page: { route: '/business', query: { zone: 'risk-management' } },
      tasks: [
        'Open the Risk Management zone',
        'Add a risk register entry for HNDL on settlement and transaction logs',
        'Generate the executive KPI dashboard (FIPS 140-3 coverage, PQC-ready certificate share, vendor PQC commitment)',
        'Generate the quarterly board report template',
      ],
      expectedOutput: 'Risk register entry + KPI dashboard + board report template downloaded.',
      narration:
        'Section six-point-five of CSWP 39 is the maturity assessment. This zone is where the work of every other zone becomes visible to executives. Three KPIs matter: the percentage of your cryptographic estate covered by FIPS 140-3 certified modules, the share of your active certificates that are post-quantum-ready or hybrid, and the percentage of your top-twenty cryptographic vendors with a published PQC roadmap. The dashboard renders these against your jurisdictional deadline — 2030 for ASD, 2031 for CCCS high-priority, 2035 for NIST disallow.',
    },
    {
      id: 'a4-cswp-migration',
      chapter: 'action',
      title: 'CSWP 39 §3.2 — Migration zone (90-day plan)',
      estMinutes: 5,
      whyItMatters:
        'Migration is the preferred long-term path — full algorithm replacement, library upgrades, certificate re-issuance, ACME/EST/CMP automation. The 90-day plan turns CSWP.39 §3.2 into three concrete workstreams an executive can be accountable to.',
      page: { route: '/business', query: { zone: 'migration' } },
      tasks: [
        'Open the Migration zone',
        'Generate the 90-day action plan (inventory · vendor letters · pilot scope)',
        'Generate the certificate-lifecycle automation checklist (ACME / EST / CMP)',
        'Download the full report bundle as a ZIP',
      ],
      expectedOutput: '90-day plan + cert-automation checklist + report ZIP downloaded.',
      narration:
        'CSWP 39 section three-point-two covers algorithm transitions — the migration zone. Three workstreams, ninety days. First, the cryptographic inventory pilot using existing CMDB and SBOM tooling — output is a populated CBOM. Second, the vendor-letter campaign you saw in the Assets zone — output is a vendor-readiness scorecard. Third, a hybrid post-quantum pilot, usually on internal TLS or code-signing, that proves your operations team can run ML-KEM and ML-DSA in production. Three workstreams, three artifacts, one board meeting at the end of the quarter.',
    },
  ],
}

const close: WorkshopChapter = {
  id: 'close',
  title: 'Close',
  estMinutes: 7,
  steps: [
    {
      id: 'close-01-about',
      chapter: 'close',
      title: 'Trust and transparency — the About page',
      estMinutes: 3,
      whyItMatters:
        'Before you share this report with your board, your CISO will ask three questions: where does the data come from, who maintains it, and is the platform itself secure? The About page answers all three in one page.',
      page: { route: '/about' },
      tasks: [
        'Read the Vision section',
        'Open Security Audit',
        'Open Data Privacy',
        'Note the SBOM and License sections',
      ],
      expectedOutput: 'Three sections reviewed: Vision, Security Audit, Data Privacy.',
      narration:
        'Before sharing the report, walk your CISO through the About page. Vision establishes intent. Security Audit shows the platform itself is reviewed. Data Privacy explains what stays in the browser and what is sent to the cloud — answer: nothing leaves your browser unless you opt in. SBOM lists every dependency. License shows the terms. Three minutes of trust-building.',
      cues: [
        {
          tMs: 4_000,
          kind: 'caption',
          text: 'Three questions your CISO will ask before approving the report.',
        },
        // 0-60s: Vision
        {
          tMs: 8_000,
          kind: 'scroll-to',
          selector: '[data-workshop-target="section-vision"]',
        },
        {
          tMs: 12_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="section-vision"]',
        },
        {
          tMs: 16_000,
          kind: 'caption',
          text: 'Vision — establishes intent.',
        },
        // 60-120s: Security Audit
        {
          tMs: 60_000,
          kind: 'scroll-to',
          selector: '[data-workshop-target="section-security-audit"]',
        },
        {
          tMs: 65_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="section-security-audit"]',
        },
        {
          tMs: 70_000,
          kind: 'caption',
          text: 'Security Audit — the platform itself is reviewed.',
        },
        // 120-180s: Data Privacy
        {
          tMs: 120_000,
          kind: 'scroll-to',
          selector: '[data-workshop-target="section-data-privacy"]',
        },
        {
          tMs: 125_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="section-data-privacy"]',
        },
        {
          tMs: 130_000,
          kind: 'caption',
          text: 'Data Privacy — nothing leaves your browser unless you opt in.',
        },
        { tMs: 180_000, kind: 'advance' },
      ],
    },
    {
      id: 'close-02-recap',
      chapter: 'close',
      title: 'Recap and share',
      estMinutes: 4,
      whyItMatters:
        'A workshop that is not shared is a workshop that did not happen. The recap step exists to make sharing the friction-free default.',
      page: { route: '/report' },
      tasks: [
        'Open the share-with-board CTA',
        'Schedule a 30-day follow-up to revisit the report after the inventory pilot',
      ],
      expectedOutput: 'Share URL copied; follow-up scheduled.',
      narration:
        'You now have, in one URL, a board-ready report tied to your jurisdiction and your industry. You have governance, risk, and a 90-day plan. The single highest-leverage action you can take in the next sixty seconds is to share this URL with the colleague who will own the inventory pilot. Schedule a thirty-day follow-up. The deadlines are not waiting.',
      cues: [
        {
          tMs: 4_000,
          kind: 'caption',
          text: 'You now have a board-ready report tied to your jurisdiction and finance.',
        },
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'One URL — governance, risk, 90-day plan, region chapter.',
        },
        {
          tMs: 120_000,
          kind: 'caption',
          text: 'Highest-leverage action in the next sixty seconds: share this URL with whoever owns the inventory pilot.',
        },
        {
          tMs: 180_000,
          kind: 'caption',
          text: 'Schedule a thirty-day follow-up. The deadlines are not waiting.',
        },
        { tMs: 240_000, kind: 'advance' },
      ],
    },
  ],
}

const usRegion: WorkshopChapter = {
  id: 'region-us',
  title: 'United States — your region',
  estMinutes: 20,
  steps: [
    {
      id: 'us-01-compliance',
      chapter: 'region',
      region: 'US',
      title: 'NIST + CNSA 2.0 + FIPS 140-3',
      estMinutes: 4,
      whyItMatters:
        'These three frameworks set the binding deadlines for U.S. financial institutions and federal counterparties: 2030 for hybrid TLS, 2035 for full disallowance.',
      page: { route: '/compliance' },
      tasks: [
        'Filter by NIST',
        'Open CNSA 2.0',
        'Open FIPS 140-3 CMVP',
        'Note the 2030 hybrid TLS and 2035 disallow markers',
      ],
      expectedOutput: 'Three U.S. frameworks bookmarked; deadlines noted.',
      narration:
        'CNSA 2.0 is the National Security Agency’s Commercial National Security Algorithm Suite, version two. By 2030, federal TLS, code-signing, and key exchange must use hybrid post-quantum schemes. By 2035, classical-only is disallowed. FIPS 140-3 is the validation programme — your hardware security modules and crypto libraries must hold a current certificate.',
    },
    {
      id: 'us-02-timeline',
      chapter: 'region',
      region: 'US',
      title: 'U.S. timeline — DoD, FedRAMP, G7',
      estMinutes: 4,
      whyItMatters:
        'Federal moves cascade into private sector procurement, especially for banks that serve federal customers or operate cross-border.',
      page: { route: '/timeline', query: { country: 'United States' } },
      tasks: [
        'Open SandboxAQ AQtive Guard Pentagon agreement',
        'Open FedRAMP Ready milestone',
        'Open G7 Cyber Expert Group financial-sector roadmap (Jan 2026)',
      ],
      expectedOutput: 'Three milestones reviewed; G7 financial roadmap bookmarked.',
      narration:
        'Three signals: the Department of Defense five-year agreement with SandboxAQ for cryptographic discovery across the Pentagon. FedRAMP Ready, which means cloud vendors selling to federal agencies are now being evaluated for automated PQC discovery. And the Group of Seven Cyber Expert Group financial-sector roadmap, co-chaired by U.S. Treasury and the Bank of England, with critical-systems migration by 2030 to 2032 and full migration by 2035.',
    },
    {
      id: 'us-03-threats',
      chapter: 'region',
      region: 'US',
      title: 'Threats with U.S. context',
      estMinutes: 3,
      whyItMatters:
        'The same finance threats land differently in the U.S. — FedWire, CHIPS, and SWIFT messaging make HSM and settlement-log exposure operationally severe.',
      page: { route: '/threats', query: { industry: 'FIN' } },
      tasks: [
        'Re-open FIN-001 BIS Project Leap',
        'Open FIN-004 HSM backup key extraction',
        'Open FIN-005 FS-ISAC sector-readiness warning',
      ],
      expectedOutput: 'You can recite the three U.S.-relevant FIN threats in one minute.',
      narration:
        'In a U.S. context, the BIS Project Leap test on TARGET2 is a preview of what FedWire and CHIPS will face. FIN-004 explains why your domestic HSM fleet is on the timeline regardless of your application stack. FIN-005 is the FS-ISAC warning that, by their measurement, the sector is short of resources to hit 2030.',
    },
    {
      id: 'us-04-leaders',
      chapter: 'region',
      region: 'US',
      title: 'U.S. finance leader — Citi / FS-ISAC',
      estMinutes: 3,
      whyItMatters:
        'Sudha Iyer at Citi is a founding FS-ISAC PQC working-group member. Her public statements give you board-ready external citations.',
      page: { route: '/leaders', query: { country: 'US', sector: 'Finance' } },
      tasks: ['Open Sudha Iyer’s profile', 'Bookmark for board citation'],
      expectedOutput: 'Citation bookmarked.',
      narration:
        'Sudha Iyer has been at Citi for two decades and is a founding member of the FS-ISAC post-quantum working group. She is your reference point for "what is a tier-one U.S. bank already doing".',
    },
    {
      id: 'us-05-library',
      chapter: 'region',
      region: 'US',
      title: 'PCI DSS 4.0 §12.3.3 — the de-facto deadline',
      estMinutes: 3,
      whyItMatters:
        'Even before federal mandates bind on you, PCI DSS 4.0 already requires a cryptographic inventory and a crypto-agility plan. That is post-quantum readiness in everything but name.',
      page: { route: '/library' },
      tasks: ['Search PCI DSS 4.0', 'Open requirement 12.3.3', 'Bookmark NIST IR 8547'],
      expectedOutput: 'PCI 12.3.3 requirement open; NIST IR 8547 bookmarked.',
      narration:
        'PCI DSS 4.0 requirement 12.3.3 has been mandatory since March 2025. It requires you to maintain a cryptographic inventory and a crypto-agility plan. Your assessor reads this as post-quantum readiness. If you have been deferring inventory work, this requirement has already moved your deadline forward to today.',
    },
    {
      id: 'us-06-business',
      chapter: 'region',
      region: 'US',
      title: 'Generate U.S. board deck + PCI inventory plan',
      estMinutes: 3,
      whyItMatters:
        'Your specific deliverables for a U.S. finance executive: a board deck framed around CNSA 2.0 and the G7 roadmap, and a PCI 12.3.3 inventory plan.',
      page: { route: '/business' },
      tasks: [
        'Open the Governance zone',
        'Generate the Board Deck artifact',
        'Generate the PCI 12.3.3 inventory plan',
      ],
      expectedOutput: 'Board deck and PCI plan downloaded.',
      narration:
        'These two artifacts are tuned for U.S. finance. The board deck cites CNSA 2.0 and the G7 financial-sector roadmap. The PCI plan maps requirement 12.3.3 to a phased inventory across cardholder-data systems and HSMs. Both download as editable formats — your team finishes them; the workshop got you ninety percent of the way there.',
    },
  ],
}

const caRegion: WorkshopChapter = {
  id: 'region-ca',
  title: 'Canada — your region',
  estMinutes: 20,
  steps: [
    {
      id: 'ca-01-compliance',
      chapter: 'region',
      region: 'CA',
      title: 'CCCS ITSM.40.001 — phased mandate',
      estMinutes: 4,
      whyItMatters:
        'Canada has the most prescriptive federal roadmap of the three jurisdictions: 2026 plans due, 2031 high-priority complete, 2035 full migration.',
      page: { route: '/compliance' },
      tasks: [
        'Filter by CCCS',
        'Open ITSM.40.001',
        'Note the three-phase calendar: 2026 / 2031 / 2035',
      ],
      expectedOutput: 'ITSM.40.001 framework bookmarked; three-phase calendar noted.',
      narration:
        'The Canadian Centre for Cyber Security published ITSM.40.001 in June 2025. It is phased: by April 2026, federal departments must submit migration plans. By 2031, high-priority systems must be migrated. By 2035, the full government of Canada non-classified estate must be on post-quantum cryptography. Federal procurement alignment cascades to the financial sector through service contracts.',
    },
    {
      id: 'ca-02-timeline',
      chapter: 'region',
      region: 'CA',
      title: 'Canadian timeline — ISED, CCCS, TBS',
      estMinutes: 4,
      whyItMatters:
        'Three documents define your runway: ISED industry guidance from 2023, CCCS roadmap from June 2025, and the TBS Security Policy Implementation Notice from October 2025.',
      page: { route: '/timeline', query: { country: 'Canada' } },
      tasks: [
        'Open ISED PQC Best Practices (2023-06)',
        'Open CCCS PQC Migration Roadmap (2025-06-23)',
        'Open TBS SPIN Notice (2025-10-09)',
      ],
      expectedOutput: 'Three Canadian milestones reviewed; country bookmarked.',
      narration:
        'The runway is in three documents. Innovation, Science and Economic Development Canada published the original best practices in 2023 — that is when your peers first started budgeting. The CCCS roadmap of June 2025 is the binding federal document. The Treasury Board Secretariat Security Policy Implementation Notice of October 2025 turns the roadmap into a contractual obligation across federal procurement.',
    },
    {
      id: 'ca-03-threats',
      chapter: 'region',
      region: 'CA',
      title: 'Threats with Canadian framing',
      estMinutes: 3,
      whyItMatters:
        'Canada participates in the G7 framework; the FIN- threats apply with cross-border emphasis given Canadian banks’ U.S. and U.K. footprints.',
      page: { route: '/threats', query: { industry: 'FIN' } },
      tasks: [
        'Re-open FIN-001 BIS Project Leap',
        'Open FIN-002 HNDL on settlement records',
        'Open FIN-005 FS-ISAC sector-readiness warning',
      ],
      expectedOutput: 'Three threats reviewed in Canadian context.',
      narration:
        'For Canadian banks, FIN-001 matters because Canada participates in the Group of Seven coordinating framework. FIN-002 is operationally severe because HNDL on cross-border settlement traffic creates a permanent privacy exposure that pre-existing Canadian privacy law — PIPEDA, the new C-27 — already covers. FIN-005 applies — your sector readiness is no better than your U.S. peers.',
    },
    {
      id: 'ca-04-leaders',
      chapter: 'region',
      region: 'CA',
      title: 'Canadian leader — Sami Khoury',
      estMinutes: 3,
      whyItMatters:
        'Canada’s Senior Official for Cyber Security and former CCCS head wrote the playbook. His public statements are board-grade citations.',
      page: { route: '/leaders', query: { country: 'Canada' } },
      tasks: ['Open Sami Khoury profile', 'Bookmark for board citation'],
      expectedOutput: 'Citation bookmarked.',
      narration:
        'Sami Khoury is currently Canada’s Senior Official for Cyber Security and was the head of the Canadian Centre for Cyber Security when ITSAP.00.017 was published. He is your in-country reference point.',
    },
    {
      id: 'ca-05-library',
      chapter: 'region',
      region: 'CA',
      title: 'CCCS ITSAP.00.017 — practitioner guide',
      estMinutes: 3,
      whyItMatters:
        'ITSAP.00.017 is the practitioner-facing companion to the ITSM roadmap. It is what your CISO will hand to engineering.',
      page: { route: '/library' },
      tasks: [
        'Search ITSAP.00.017',
        'Open the document',
        'Bookmark NIST FIPS 203 and 204 (Canada aligns to NIST)',
      ],
      expectedOutput: 'CCCS practitioner guide and NIST FIPS bookmarked.',
      narration:
        'Canada aligns to NIST standards — there is no separate Canadian algorithm suite. ITSAP.00.017 is the practitioner guide that translates NIST FIPS 203 and 204 into deployment guidance for federal departments. Your CISO will treat this as the authoritative implementation document.',
    },
    {
      id: 'ca-06-business',
      chapter: 'region',
      region: 'CA',
      title: 'Generate Canadian migration-plan template',
      estMinutes: 3,
      whyItMatters:
        'Specific to Canada: a migration-plan template framed against the April 2026 federal-plan deadline, even if you are private sector — your federal counterparties will ask.',
      page: { route: '/business' },
      tasks: [
        'Open Migration zone',
        'Generate Departmental migration plan template',
        'Generate Board Deck (Canadian framing)',
      ],
      expectedOutput: 'Migration plan template and board deck downloaded.',
      narration:
        'The migration plan template is structured around the CCCS three-phase calendar. Even private-sector banks should produce one — federal procurement counterparties already ask for it as part of their own April 2026 obligation. The board deck cites the three Canadian documents and frames the urgency around federal cascades.',
    },
  ],
}

const auRegion: WorkshopChapter = {
  id: 'region-au',
  title: 'Australia — your region',
  estMinutes: 20,
  steps: [
    {
      id: 'au-01-compliance',
      chapter: 'region',
      region: 'AU',
      title: 'ASD ISM-1917 — 2030 prohibition',
      estMinutes: 4,
      whyItMatters:
        'Australia has the tightest deadline of the three jurisdictions by five years. By end-2030, traditional crypto is prohibited under the Information Security Manual.',
      page: { route: '/compliance' },
      tasks: [
        'Filter by ASD',
        'Open ISM-1917',
        'Note the required algorithms: ML-DSA-87, ML-KEM-1024, SHA-384/512, AES-256',
      ],
      expectedOutput: 'ISM-1917 framework bookmarked; required algorithms noted.',
      narration:
        'The Australian Signals Directorate updated the Information Security Manual in December 2024 with control 1917. By end of 2030, traditional cryptography — RSA, ECDSA, ECDH — is prohibited for protected systems. Required algorithms are at the highest NIST security levels: ML-DSA-87 for signatures, ML-KEM-1024 for key encapsulation, SHA-384 or SHA-512, AES-256. This is five years ahead of the U.S. and U.K. equivalents.',
      cues: [
        // 0–60s: arrive on /compliance, switch to the Compliance Frameworks tab
        {
          tMs: 4_000,
          kind: 'caption',
          text: 'ASD updated the ISM in December 2024 with control 1917 — by end-2030, traditional crypto is prohibited.',
        },
        { tMs: 8_000, kind: 'select-tab', tabName: 'Compliance Frameworks' },
        { tMs: 12_000, kind: 'spotlight', selector: '[data-workshop-target="tab-compliance"]' },
        // 60–120s: spotlight the ISM-1917 framework card (slug from FrameworkCard id)
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'Required algorithms are at the highest NIST security levels.',
        },
        {
          tMs: 65_000,
          kind: 'scroll-to',
          selector: '[data-workshop-target="compliance-framework-asd-ism-1917"]',
        },
        {
          tMs: 70_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="compliance-framework-asd-ism-1917"]',
        },
        {
          tMs: 75_000,
          kind: 'callout',
          selector: '[data-workshop-target="compliance-framework-asd-ism-1917"]',
          label: 'ISM-1917 — 2030 prohibition',
          arrow: 'left',
        },
        // 120–180s: highlight specific algorithm callouts
        {
          tMs: 120_000,
          kind: 'caption',
          text: 'ML-DSA-87 for signatures · ML-KEM-1024 for key encapsulation · SHA-384/512 · AES-256.',
        },
        // 180–240s: close — the comparative urgency
        {
          tMs: 180_000,
          kind: 'caption',
          text: 'Five years ahead of U.S. and U.K. equivalents — the tightest deadline of the three jurisdictions.',
        },
        { tMs: 240_000, kind: 'advance' },
      ],
    },
    {
      id: 'au-02-timeline',
      chapter: 'region',
      region: 'AU',
      title: 'Australian timeline — three migration phases',
      estMinutes: 4,
      whyItMatters:
        'The phasing is explicit: planning 2024-2026, critical systems migration 2026-2028, full migration 2028-2030. You are already in phase one.',
      page: { route: '/timeline', query: { country: 'Australia' } },
      tasks: [
        'Open ASD initial planning guide (2022-07)',
        'Open ISM December 2024 update',
        'Open ASD September 2025 LATICE update',
      ],
      expectedOutput: 'Three milestones reviewed; phasing noted.',
      narration:
        'The first ASD planning guide is from 2022. The binding update is from December 2024. The most recent practitioner refresh is the LATICE framework from September 2025. The three phases — planning by 2026, critical migration by 2028, full migration by 2030 — leave Australian banks with the smallest remaining runway of the three jurisdictions in this workshop.',
      cues: [
        // 0–60s: arrive on /timeline?country=Australia, spotlight the country TOC entry
        {
          tMs: 4_000,
          kind: 'caption',
          text: 'Three documents define your runway. The 2022 ASD guide. The binding December 2024 ISM update. The September 2025 LATICE refresh.',
        },
        {
          tMs: 8_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="timeline-toc-Australia"]',
        },
        {
          tMs: 12_000,
          kind: 'callout',
          selector: '[data-workshop-target="timeline-toc-Australia"]',
          label: 'Australia row pinned',
          arrow: 'right',
        },
        // 60–180s: walk the three milestones
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'Three phases — planning 2024-2026, critical-systems migration 2026-2028, full migration 2028-2030.',
        },
        {
          tMs: 120_000,
          kind: 'caption',
          text: 'Smallest remaining runway of the three jurisdictions in this workshop.',
        },
        // 180–240s: phase comparison close
        {
          tMs: 180_000,
          kind: 'caption',
          text: 'You are already in phase one.',
        },
        { tMs: 240_000, kind: 'advance' },
      ],
    },
    {
      id: 'au-03-threats',
      chapter: 'region',
      region: 'AU',
      title: 'Threats with Australian urgency framing',
      estMinutes: 3,
      whyItMatters:
        'Same FIN- threats, different countdown. By 2030, ISM-1917 makes most of these threats compliance failures, not just risk items.',
      page: { route: '/threats', query: { industry: 'Financial Services / Banking' } },
      tasks: [
        'Open FIN-001 BIS Project Leap',
        'Open FIN-004 HSM backup key extraction',
        'Open FIN-005 FS-ISAC sector-readiness warning',
      ],
      expectedOutput: 'Three threats reviewed under 2030-deadline pressure.',
      narration:
        'In Australia, these stop being threats and become compliance gates. After end-2030, an HSM fleet that still wraps backup keys with RSA is non-compliant under ISM-1917. The FS-ISAC sector readiness warning applies, with the additional dimension that you have five years less than your U.S. peers to act.',
      cues: [
        // 0–60s: spotlight the threat TOC, click FIN-001
        {
          tMs: 3_000,
          kind: 'caption',
          text: 'In Australia, these stop being threats — they become compliance gates after end-2030.',
        },
        { tMs: 6_000, kind: 'spotlight', selector: '[data-workshop-target="threats-toc-FIN-001"]' },
        { tMs: 12_000, kind: 'click', selector: '[data-workshop-target="threats-toc-FIN-001"]' },
        // 60–120s: FIN-004 HSM extraction
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'FIN-004: an HSM fleet wrapping backup keys with RSA is non-compliant under ISM-1917 by 2030.',
        },
        { tMs: 65_000, kind: 'click', selector: '[data-workshop-target="threats-toc-FIN-004"]' },
        // 120–180s: FIN-005 sector readiness
        {
          tMs: 120_000,
          kind: 'caption',
          text: 'FIN-005: FS-ISAC warns the sector is short of resources — and you have five fewer years than U.S. peers.',
        },
        { tMs: 125_000, kind: 'click', selector: '[data-workshop-target="threats-toc-FIN-005"]' },
        { tMs: 180_000, kind: 'advance' },
      ],
    },
    {
      id: 'au-04-leaders',
      chapter: 'region',
      region: 'AU',
      title: 'Australian leader — Rachel Noble (former ASD DG)',
      estMinutes: 3,
      whyItMatters:
        'Rachel Noble led ASD from 2020 to September 2024 and oversaw the Australian quantum-safe strategy. Her statements are board-grade citations.',
      page: { route: '/leaders', query: { leader: 'Rachel Noble' } },
      tasks: ['Open Rachel Noble profile (deep-linked)', 'Bookmark for board citation'],
      expectedOutput: 'Citation bookmarked.',
      narration:
        'Rachel Noble was the Director-General of ASD from 2020 to September 2024 and was the public face of Australia’s post-quantum migration strategy and quantum-computing investments. She is your reference point for "what does the Australian government expect us to do".',
      cues: [
        {
          tMs: 4_000,
          kind: 'caption',
          text: 'Rachel Noble led ASD from 2020 to September 2024 — the public face of Australia’s post-quantum strategy.',
        },
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'Your reference point for "what does the Australian government expect us to do".',
        },
        {
          tMs: 120_000,
          kind: 'caption',
          text: 'Bookmark her profile to cite her in your board materials.',
        },
        { tMs: 180_000, kind: 'advance' },
      ],
    },
    {
      id: 'au-05-migrate',
      chapter: 'region',
      region: 'AU',
      title: 'Vendor reality — Dell BSAFE certified products',
      estMinutes: 3,
      whyItMatters:
        'Dell Australia’s BSAFE products are already NIST-validated for ML-DSA and ML-KEM. Concrete proof that the vendor ecosystem is ready before your deadline.',
      page: { route: '/migrate', query: { vendor: 'Dell' } },
      tasks: [
        'Filter by vendor Dell',
        'Open the BSAFE Crypto Module for C (ACVP A8272)',
        'Open the BSAFE Crypto Module for Java',
      ],
      expectedOutput: 'Two Dell BSAFE certifications opened.',
      narration:
        'Dell Australia is the named vendor on multiple ACVP certificates — A8272 for the C module, with separate certificates for Java. ML-DSA and ML-KEM are both validated. This matters because the most common board objection — "the vendors are not ready" — is already factually incorrect for your jurisdiction.',
      cues: [
        // 0–60s: spotlight a Dell BSAFE row in the filtered table
        {
          tMs: 4_000,
          kind: 'caption',
          text: 'Dell Australia is the named vendor on multiple ACVP certificates — ML-DSA and ML-KEM both validated.',
        },
        {
          tMs: 8_000,
          kind: 'scroll-to',
          selector: '[data-workshop-target="migrate-product-dell-bsafe-crypto-module-for-c"]',
        },
        {
          tMs: 12_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="migrate-product-dell-bsafe-crypto-module-for-c"]',
        },
        {
          tMs: 16_000,
          kind: 'callout',
          selector: '[data-workshop-target="migrate-product-dell-bsafe-crypto-module-for-c"]',
          label: 'A8272 — ACVP certified',
          arrow: 'right',
        },
        // 60–120s: Java module
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'A8272 for the C module · separate certificates for Java.',
        },
        {
          tMs: 65_000,
          kind: 'scroll-to',
          selector: '[data-workshop-target="migrate-product-dell-bsafe-crypto-module-for-java"]',
        },
        {
          tMs: 70_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="migrate-product-dell-bsafe-crypto-module-for-java"]',
        },
        // 120–180s: close
        {
          tMs: 120_000,
          kind: 'caption',
          text: 'The most common board objection — "the vendors are not ready" — is already factually incorrect.',
        },
        { tMs: 180_000, kind: 'advance' },
      ],
    },
    {
      id: 'au-06-business',
      chapter: 'region',
      region: 'AU',
      title: 'Generate 2030 readiness gap analysis',
      estMinutes: 3,
      whyItMatters:
        'Specific to Australia: a 2030 gap analysis and a board urgency memo. Note the workshop flags the absence of APRA-specific PQC guidance — that gap is your own-risk item.',
      page: { route: '/business', query: { zone: 'risk-management' } },
      tasks: [
        'Open Risk Management zone',
        'Generate the 2030 readiness gap analysis',
        'Generate the board urgency memo',
      ],
      expectedOutput: 'Gap analysis and urgency memo downloaded.',
      narration:
        'The gap analysis maps every cryptographic system in your inventory against ISM-1917 requirements with end-2030 as the gate. The urgency memo for your board names the timing reality plainly: five years less than U.S. and U.K. peers, no APRA-specific PQC guidance yet, and therefore an own-risk decision on how aggressively to interpret ASD requirements for the financial sector.',
      cues: [
        // 0–60s: arrive on /business?zone=risk-management; spotlight the zone tile
        {
          tMs: 4_000,
          kind: 'caption',
          text: 'Risk Management zone — where the work of every other zone becomes visible to executives.',
        },
        {
          tMs: 8_000,
          kind: 'spotlight',
          selector: '[data-workshop-target="business-zone-risk-management"]',
        },
        {
          tMs: 12_000,
          kind: 'callout',
          selector: '[data-workshop-target="business-zone-risk-management"]',
          label: 'CSWP.39 §6.5 — Maturity',
          arrow: 'top',
        },
        // 60–120s: gap analysis framing
        {
          tMs: 60_000,
          kind: 'caption',
          text: 'The 2030 gap analysis maps every cryptographic system against ISM-1917 with end-2030 as the gate.',
        },
        // 120–180s: own-risk note
        {
          tMs: 120_000,
          kind: 'caption',
          text: 'No APRA-specific PQC guidance yet — own-risk interpretation of ASD requirements for finance.',
        },
        { tMs: 180_000, kind: 'advance' },
      ],
    },
  ],
}

export const executiveFinanceFlow: WorkshopFlow = {
  id: 'executive-finance-amer-apac-v1',
  title: 'Executive PQC Workshop — Finance (US / Canada / Australia)',
  match: {
    roles: ['executive'],
    proficiencies: ['basics'],
    industries: ['Finance & Banking'],
    regions: ['US', 'CA', 'AU'],
  },
  // Welcome 5 + Pre-flight 3 + Foundations 40 + Action 20 + Region 20 + Close 7
  totalEstMinutes: 95,
  intro,
  prerequisites,
  common: [foundations, action],
  regions: { US: usRegion, CA: caRegion, AU: auRegion },
  close,
  fixturesUrl: 'workshop-fixtures/executive-finance-amer-apac-v1.json',
}
