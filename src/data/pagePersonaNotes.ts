// SPDX-License-Identifier: AGPL-3.0-only
/**
 * B+ round 8, Wave C (2026-09-19) — "What this means for you" on eleven routed
 * reference pages. /navigate is a full-screen canvas, so it carries equivalent
 * role guidance in its overlay rather than this strip.
 *
 * One line per persona per page. Every line was written against the page's
 * real controls and sections (its headings, filter labels, data columns) —
 * the review packet's first drafts named a CPC filter /patents does not have,
 * a "Data Foundation" section /about does not have, and a public sponsor list
 * /sponsor does not show. A line here must describe something the page shows;
 * pagePersonaNotes.test.ts pins shape, and PersonaPageNote renders the active
 * persona's line (all seven when no persona is set).
 */
import type { PersonaId } from '@/data/personaIds'
import { PERSONAS } from '@/data/learningPersonas'

/** The count, in words, for a short list (the essentials of a path). */
const COUNT_WORDS = [
  'no',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
]
function countWord(n: number): string {
  // eslint-disable-next-line security/detect-object-injection -- n is an array length
  return COUNT_WORDS[n] ?? String(n)
}

export type PagePersonaNotes = Record<PersonaId, string>

export const PAGE_PERSONA_NOTES: Record<string, PagePersonaNotes> = {
  '/': {
    executive:
      'Pick Executive and choose the question — mandate, risk, roadmap, deadlines, evidence or the whole programme — each board leads with your next step, and the cards and proof behind it are one click away under "More for this question".',
    grc: 'Pick GRC and choose the question — what applies, what is already proven, the controls, the risk register, vendor assurance or what "done" means — before any tool asks you for an inventory.',
    developer:
      'Pick Developer and choose the question: the pilot board runs a real hybrid ML-KEM + X25519 key exchange in this tab in minutes; the others cover parameter sets, inventory, sizes, deadlines and closure.',
    architect:
      'Pick Architect and choose the question: the control-plane board changes one KMIP policy line and rekeys the estate live; the others cover inventory, key stores, protocols, sequencing and defending the design.',
    researcher:
      "Pick Researcher and choose the question: provenance, reproducing the tests, the standards' dates and states, the threat model, the field, or the command line — every figure carries its source.",
    'cert-engineer':
      'Choose the question — test the algorithms, the entropy source or the module interface, place a product on the certificate stages, or sign firmware — every result states the evidence level it reached.',
    ops: 'Pick IT Ops and choose the question: capacity, cutover rehearsal, cipher-suite config, supplier timelines, closeout or your standing — sized before renewal day.',
    curious:
      'You do not need a role: skip the question and the site opens by topic, or pick Curious for what breaks and when, where it touches you, a thirty-second version, and how to talk about it at work.',
  },
  '/patents': {
    executive:
      'Licensing exposure is part of vendor risk: the "Top assignee" view shows who has filed the most claims over the implementations your suppliers ship.',
    grc: 'A patent filing is dated evidence of prior work; "Filing activity over time" shows when each family of claims was first written down.',
    developer:
      'Filter to "Core invention" and "PQC only" to see the constructions that carry real claims before you standardise your own envelope or hybrid format.',
    architect:
      'Use "Map to FIPS 203/4/5" to see which patents touch the standards you are designing against; hybrid schemes have their own filter.',
    researcher:
      'The "Corpus scope" control switches between all filings and the core-invention set; each patent opens with its claims, not just its abstract.',
    'cert-engineer':
      'Use "Map to FIPS 203/4/5" to see which filings touch the algorithms a module implements; licensing is a question for the vendor, not for the lab.',
    ops: 'Patents change nothing you operate today; the licensing angle you need rides on the vendors in the migration catalogue.',
    curious:
      'A patent is a public description of an invention with a date on it — this is where the post-quantum ideas were first written down, searchable by title, assignee or number.',
  },
  '/leaders': {
    executive:
      'Use the category and organization filters to find relevant profiles, then open their cited resources; inclusion and profile counts are not influence or endorsement rankings.',
    grc: 'Filter by country, region and category to see which people and organisations are represented in the current evidence-linked directory, then verify any role claim at its source.',
    developer:
      'Use Standards and Open Source Maintainer to find cited authorship and project links; confirm current maintainer roles and releases at the linked source.',
    architect:
      'Use Standards and Industry Vendor as routes into cited specifications and roadmaps, without treating a profile as proof of interoperability or readiness.',
    researcher:
      'Entries show cited resources and, where available, when profile sources were last checked; absence from this curated directory proves nothing about a person or contribution.',
    'cert-engineer':
      'Government and Industry Vendor profiles link to agency and vendor publications; the directory lists few certification-programme or laboratory profiles, so confirm certificates, status, scope, and effective versions in the official registers.',
    ops: 'Use Industry Vendor and Open Source Maintainer to locate support and release sources, then confirm the exact product, version, platform, and distribution you operate.',
    curious:
      'This is a curated, evidence-linked introduction to people appearing in post-quantum sources—not a complete census, ranking, or endorsement list.',
  },
  '/explore': {
    executive:
      'Start with "Understand the Threat" and "Assess Your Risk"; the page is organised by question, not by department.',
    grc: 'The "Compliance Landscape" and "Global Migration Timeline" cards put every framework and deadline in one place.',
    developer:
      'Jump to "Try the Playground": the hands-on tools, grouped by what each one exercises.',
    architect:
      '"Compare PQC Algorithms" and "Migration Workbench" are the two cards a design decision rests on; read them in that order.',
    researcher:
      '"Reference Library" is the read-only record behind the claims on the site; the Revisions page beside it holds the corrections.',
    'cert-engineer':
      'The "Reference Library" and "Compliance Landscape" cards hold the standards a module is tested against and the schemes that certify it.',
    ops: '"Migration Workbench" and "Command Center" are the shortest route to a cutover plan you can hand to a change board.',
    curious:
      'This page exists for you: every topic on the site, in plain words, with a first stop for each.',
  },
  '/revisions': {
    executive:
      'A correction log for the data your reports are built on: if a number changed, the reason and the date are here.',
    grc: 'Every change to a compliance obligation, deadline or certification record is dated and attributed — audit evidence for the data itself.',
    developer:
      'Vendor and migration records change as roadmaps ship; the domain chips narrow the feed to what moved since you last checked.',
    architect:
      'Algorithm and protocol records carry their revision history; a design decision made on an old value can be re-checked here.',
    researcher:
      "This is the site's own errata: what was wrong, what it was corrected to, and when.",
    'cert-engineer':
      'Every correction to a certification record is dated and attributed here — the audit trail behind each status on Product Records.',
    ops: 'Use the Migrate chip to see which product support claims were corrected — those are the ones to re-verify before a cutover.',
    curious: 'Facts on this site get corrected in public; this page is the list of corrections.',
  },
  '/changelog': {
    executive: 'Filter by your persona to see only the releases that changed something you use.',
    grc: 'Data Updates entries mark corrections to obligations and records; the Compliance and Timeline tags say which area moved.',
    developer:
      'Entries tagged Software and Algorithms name the tool or view that gained or fixed something.',
    architect:
      'Architecture-relevant changes carry the Algorithms and Library tags; the Architect persona filter narrows to them.',
    researcher:
      'Data Updates entries say which dataset changed; the Revisions page has the row-level detail.',
    'cert-engineer':
      'Data Updates entries say which dataset changed and when; the Revisions page has the row-level detail for any certificate record.',
    ops: 'The Ops persona filter covers deployment, certificate lifecycle and TLS configuration changes.',
    curious:
      'Each entry starts with what changed for you, in plain words; the version number is the least important part.',
  },
  '/faq': {
    executive:
      '"What should executives know about quantum risk?" and "How do I build a PQC business case for the board?" are answered here, under Role-Specific Guidance.',
    grc: 'The "Compliance & Regulation" category answers what DORA, NIS2, eIDAS 2.0, PCI DSS 4.0 and CNSA 2.0 require, one question each.',
    developer:
      '"Can I test PQC algorithms in my browser?" and the "Interactive Tools" category point at the playground tool that demonstrates each answer.',
    architect:
      '"What is a hybrid cryptographic approach?" and "How do PQC certificates affect TLS chain size?" link to the comparisons the answers were taken from.',
    researcher:
      'Questions are grouped by category and searchable; answers name the standard or report they come from, which the Library holds.',
    'cert-engineer':
      "Three questions lead for your role: FIPS 140-3 and the validation backlog, Common Criteria's role in PQC, and which HSMs support ML-KEM and ML-DSA.",
    ops: '"How do you configure PQC TLS on Linux?", "What OpenSSH version supports PQC?" and "How do I safely retire legacy cryptography?" are the ones to read before scheduling a cutover.',
    curious:
      'Start with "What is post-quantum cryptography?" and "Where should I start if I\'m new to PQC?"; each answer links to the module that explains it fully.',
  },
  '/about': {
    executive:
      "The Trust Engine explains how source checks, human decisions and signed audit entries support the site's records — and where those checks remain incomplete.",
    grc: 'The Transparency & Disclaimer and Independence sections state who runs the site, who funds it and how corrections are handled.',
    developer:
      'The SBOM section lists every dependency by category; the Data Privacy section states that the site is static, with no backend and nothing leaving your browser.',
    architect:
      'The Platform Data section names each data file with its date — the provenance of every table you design from.',
    researcher:
      'The Trust Engine and Content Audit Trail show how records are sourced, reviewed and corrected; open the cited source before relying on a figure.',
    'cert-engineer':
      'The Trust Engine and Content Audit Trail show the review evidence behind recorded changes; the Transparency & Disclaimer section explains the limits and correction process.',
    ops: "Your progress and settings live in your browser's localStorage; the Data Privacy section says exactly what is and is not collected.",
    curious:
      'The Transparency & Disclaimer section says who builds this site, why, and what is and is not tracked.',
  },
  '/editorial-independence': {
    executive:
      'No vendor pays for placement: "What sponsorship buys, and what it does not" states the rule in writing.',
    grc: '"Conflict-of-interest disclosure" and "Requests to modify content" state how conflicts and change requests are handled.',
    developer:
      '"Inclusion and assessment criteria" is the rule behind every product row: it is in the catalogue because published evidence supports it.',
    architect:
      'The policy is why a "PQC-ready" claim on this site links to its proof; the assessment criteria are stated here.',
    researcher:
      '"Funding sources" and "How to flag a violation" are the sections to cite when you rely on the site\'s data.',
    'cert-engineer':
      '"Conflict-of-interest disclosure" states how vendors are handled — worth reading when the module under test is a vendor\'s product this site also lists.',
    ops: 'Product rows you plan a cutover on are assessed by these criteria; the row shows the proof and its date.',
    curious: 'Nobody can buy a better rating here; this page explains how that is kept true.',
  },
  '/sponsor': {
    executive:
      'Sponsorship funds hosting and data work and buys no placement; "The editorial-independence promise" on this page states the rule.',
    grc: 'Sponsorship is disclosed, and "Where your sponsorship goes" lists what it funds; the compliance data is not influenced by it.',
    developer:
      'The site is open source; sponsorship is one way to support it, contributing code is another.',
    architect: 'Sponsorship does not change catalogue positions or algorithm assessments.',
    researcher:
      'The tiers and what each funds are listed here, so a reader can judge any perceived conflict.',
    'cert-engineer':
      'Sponsorship is disclosed, and "Where your sponsorship goes" lists what it funds — check it before you cite a vendor comparison from this site.',
    ops: 'Nothing operational changes with sponsorship; the tools stay free.',
    curious: 'If the site helped you, this is how to help it keep running.',
  },
  '/terms': {
    executive:
      "The site gives information, not legal or compliance advice; decisions remain yours and your counsel's.",
    grc: 'The License and Third-Party Content sections say what you may reuse and how to attribute it; check them before putting tables in an audit file.',
    developer:
      'The source code licence is AGPL-3.0-only, and nothing in these terms restricts the rights it grants.',
    architect:
      'Simulations and tools are educational; the Cryptographic Disclaimer says production designs need your own validation.',
    researcher:
      'Reuse of text and data is governed by the License and Third-Party Content sections; cite the site when you reuse it.',
    'cert-engineer':
      'The License and Third-Party Content sections say what you may reuse; for a certificate itself, cite the NIST or scheme record, not this site.',
    ops: 'The playground runs real cryptography in your browser; the Cryptographic Disclaimer says keys made here must never protect production systems.',
    curious:
      'Plain summary: free to use, no account, and the Privacy and Analytics section says what is collected.',
  },
  // ── Round 9, wave 2 (2026-09-19): the sixteen routed pages the round-8 strip did not reach; each line written against the page's rendered controls and sections ──
  '/report': {
    executive:
      'Your view opens "Recommended Actions (Top 5)" first. "Print Executive Brief" and "Board Pack ZIP" export a learning report built from the answers you entered, with sources and limits; review the inputs and evidence before using it in a real board discussion.',
    grc: '"Compliance Impact" marks each framework "PQC Required" or "No PQC mandate yet" with its deadline; your view also opens Assessment Profile, Discovery, CBOM and Vendor risk, and "Compliance Pack ZIP" adds an applicability register: each framework in scope, why it applies, its binding status and source.',
    developer:
      'Your view opens "Cryptographic Bill of Materials (CBOM)" and "Cryptographic Discovery" first; "Algorithm Migration Priority" names each replacement with a "Try in Playground" link, and "Export CSV" downloads that table.',
    architect:
      'Your view opens "Assessment Profile" and the "Industry Threat Landscape" by default; "HNDL / HNFL Risk Windows" shows how long your data and certificates must outlast the threat.',
    researcher:
      'Under "Risk Score", "How this was calculated" lists each category\'s score, weight and points; the info button "How this report works" opens the methodology behind every section.',
    'cert-engineer':
      'Your view opens Assessment Profile and CBOM — the algorithm inventory — beside Algorithm Migration Priority and Compliance Impact; programme sections are collapsed, not removed.',
    ops: 'Your view opens "Migration Roadmap" (Phase 1: Immediate, Phase 2: Short-term, Phase 3: Long-term), "Migration Toolkit" — products from the Migrate catalog matching your infrastructure — and "Algorithm Migration Priority".',
    curious:
      'With no assessment yet, "See an example report" shows a finished one before you start; your own report shows "Recommended Actions (Top 3)" and a three-step roadmap rather than the full plan.',
  },
  '/assess': {
    executive:
      'The Fast track (6 questions, ~3 min) is the recommended route for you; the chooser card lists exactly what "Your report includes" and how many sections stay locked until the Full track.',
    grc: 'The Full track is your recommended route; the "Compliance" step asks which frameworks apply, and every step states "In your report:" what that answer changes before you answer it.',
    developer:
      'On the "Crypto in use" step, "Have a CBOM? Import it instead of answering by hand." reads a CycloneDX 1.6 file in your browser and fills that question — nothing is uploaded.',
    architect:
      'The "Infrastructure" step flags HSMs and on-prem as hardest to migrate and its "Synced" toggle pulls your Migrate product selections in; "Crypto agility" decides whether the roadmap recommends a one-off swap or the ability to swap again.',
    researcher:
      '"No estate to describe? Use a reference one" — "Mid-size retail bank" or "Hospital group" — answers every question and jumps straight to "Review your answers"; the report then says it came from a reference estate.',
    'cert-engineer':
      'The Full track is recommended for your role, and the first step asks which sector the product is sold into — answer for the product line; every step states "In your report:" what the answer changes.',
    ops: 'The "Data retention" and "Credential lifetime" steps set the HNDL and HNFL windows; "Timeline pressure" asks whether you have a migration deadline; "Save link" copies a link to resume from the step you are on.',
    curious:
      'The Fast track is recommended for you; each step has a "Why we ask" disclosure, optional steps show "Skip", and the flow ends with "Review your answers" then "Generate my report".',
  },
  '/playground/cacp': {
    executive:
      'In the guided view, the Learn tab opens with "Crypto agility in three steps" — set the policy, watch a request be refused, watch the estate rekey; the Dev tab is not shown for your role.',
    grc: 'On the Policy tab, "Which regime governs you?" loads a policy by regulator — US · NSA CNSA 2.0, US · FIPS 140-3, Germany · BSI — and the Inspect tab\'s Activity trail records every allow, deny or rekey decision.',
    developer:
      'The Dev tab is a pipeline builder with Builder and Code views, a "Corpus (OASIS conformance)" palette, Run, and "Export .py"; switch View to expert and Inspect adds a "KMIP Wire" view of the TTLV bytes.',
    architect:
      'On Operate, "Plane 2 · KMIP Lifecycle" sends a real KMIP 3.0 request per button, with the algorithm set to "Auto — let the policy decide" or a named set; the Policy tab\'s Compare and Timeline ("As of" slider) show rules over time.',
    researcher:
      'The "CSD02" chip states that KMIP 3.0 is an OASIS committee draft, not a ratified standard; in expert view the Policy tab adds a YAML view of the exact rules and Inspect adds the raw "KMIP Wire" response.',
    'cert-engineer':
      'On the Policy tab, "Which regime governs you?" includes US · FIPS 140-3; KMIP 3.0 is an OASIS committee draft (the "CSD02" chip), so nothing here is a validated configuration.',
    ops: 'The "Migration Estate" tab asks for keys by business label and lets the policy pick the algorithm; move from classical to hybrid to full PQC and "Key objects on this engine" shows rekeyed successors linked to deactivated predecessors.',
    curious:
      'Keep View on "guided" and press "Guided Tour" for step-by-step lessons; everything runs in this tab — no server, no Docker.',
  },
  '/learn': {
    executive:
      '"My Path" opens on "Essentials" — the core modules that unlock your "Capstone Quiz"; in "Browse all" the "Governance & Risk" track chip narrows the catalogue to the leadership and GRC modules.',
    grc: '"My Path" opens on your Essentials in order — PQC 101, risk, data sensitivity, PQC GRC, compliance, governance, vendors, closure; in "Browse all" the "Governance & Risk" track chip narrows the catalogue to them, and the "Workforce view" button maps modules to NICE work roles.',
    developer:
      '"Browse all" has a search ("try \'TLS\' or \'HSM\'"), track chips such as Protocols, Software Infrastructure and Hardware Infrastructure, and a "Shortest first" sort.',
    architect:
      '"Guided routing" asks where you are — "Have an inventory, but no risk priorities", "Know the priorities, need a multi-year plan" — and names the first module; in "Browse all" the Protocols track chip is yours.',
    researcher:
      '"Check our work: reproduce a known-answer test" sits above your path — "Run the ACVP vectors" and "Find the published vectors"; the "Practice quiz" is open any time, and the Capstone Quiz unlocks after your Essentials.',
    'cert-engineer': `Start with the validation tests, then follow your essentials from the certificate: ${countWord(PERSONAS['cert-engineer'].essentials.length)} essentials, three checkpoint quizzes, then the capstone; the "Advanced" tray adds browse by Algorithms / Standards, and "Workforce view" maps modules to NICE work roles.`,
    ops: '"My Path" has an "Essentials" / "Full track" toggle with the hours for each and a "Continue where you left off" card with "Resume"; in "Browse all", filter by status to see "In progress" modules.',
    curious:
      '"Pick a role in the top bar for a guided path — or" browse every module; "New here? Start with the right module" includes "Not sure — assess me", and the "Quiz" button sits beside the page title.',
  },
  '/playground/hsm': {
    executive:
      'A banner at the top says this is a hands-on engineering workbench and points you to Command Center, Compliance landscape and Migration framework; for your role the engine stays Rust and the test suites are not shown.',
    grc: 'The same engineering-workbench banner appears for your role; if you stay, Inspect › Log lists every call with Function, Arguments and Return Value, and "Beginner" adds a "Plain English" column.',
    developer:
      'Build › Standard is a pipeline builder with Builder and Code views, Run (⌘/Ctrl+Enter) and "Export .py"; Build also carries Validation and Conformance suites, and the Engine switch offers C++, Rust or Dual Parity.',
    architect:
      'Operate walks "1. Initialize HSM", "2. Create Token", "3. Open Session & Login", then a Primitives rail — KEM, Symmetric Encrypt, Key Wrap / Unwrap, Hashing, Sign & Verify, Key Agreement, KDF; Inspect › Keys lists what the token holds.',
    researcher:
      'Build › Validation is the "Cryptographic Validation Workbench": NIST ACVP-Server reference samples, standard KATs, oracle and functional tests, each row tagged with its evidence tier; Build › Conformance is a "PKCS#11 v3.2 Conformance Runner"; the WIP badge opens the methodology.',
    'cert-engineer':
      'Build › Validation is the "Cryptographic Validation Workbench" — NIST ACVP-Server reference samples, standard KATs, oracle and functional tests, each row tagged with its evidence tier; Build › Conformance replays PKCS#11 v3.2 profile cases.',
    ops: 'The Learn lessons "The Cryptoki model — slots, tokens, sessions, login" and "Mechanism discovery" cover token setup; Inspect › Mechanisms\' "Query Slot" enumerates what the token supports, and the Log filters by origin.',
    curious:
      'Open the Learn tab, pick a lesson and press "Run all" to watch each step run; the "New to PKCS#11?" strip explains the terms on hover, and the engine is preset to Rust.',
  },
  '/algorithms': {
    executive:
      'The “What one high-assurance profile specifies” box explains that CNSA 2.0 names ML-KEM-1024 and ML-DSA-87 for US National Security Systems without presenting that profile as a universal federal mandate.',
    grc: 'The Transition Guide lists candidate PQC migration paths, region, publication status, and transition timing. It is educational evidence—not a compliance determination—so confirm applicability in the primary policy and product documentation.',
    developer:
      'Detailed Comparison sorts objective size and RAM fields, labels heterogeneous catalogue performance text as illustrative, and includes a same-harness hardware case study. Validation › “Known-answer checks” runs pinned vectors in your browser.',
    architect:
      'The Protocol Support tab tracks each protocol across pure-KEM, hybrid-KEM, pure-Sig and hybrid-Sig, each marked RFC, Draft, Experimental or None, with filters for OSS, commercial and live deployment.',
    researcher:
      'The "Research needed" toggle narrows to algorithms with an incomplete data row; Validation › "Implementation Attacks" gives side-channel and fault-injection notes per family; the Region filter includes KpqC, CACR and CRYPTREC.',
    'cert-engineer':
      'On the Validation tab, "Implementation Attacks" gives side-channel and fault-injection notes per family and the known-answer tests run in the browser; a CAVP algorithm validation is a prerequisite for a module certificate, not the certificate itself.',
    ops: 'The “Final NIST standards” preset shows algorithms published in final NIST FIPS standards; it does not mean your implementation is validated. Protocol Support separates specification maturity from reviewed deployment evidence.',
    curious:
      'You get a short preview of three common starting points from the published NIST standards — ML-KEM-768, ML-DSA-65, SLH-DSA-SHA2-128s — then "Show full algorithm comparison" or "Learn the basics first".',
  },
  '/migrate': {
    executive:
      '"Which vendors have published evidence" summarizes the tracked catalog; compare it with your own supplier list rather than treating it as an assessment of your supply chain.',
    grc: 'Product rows show recorded availability, FIPS evidence and verification freshness; "Evidence gaps" highlights catalog questions and does not score risk or determine compliance.',
    developer:
      'Under "Replace what you own", the "Crypto libraries & frameworks" domain lists the libraries; use "Filter products…" to narrow, and a product\'s detail shows its CPE and PURL identifiers.',
    architect:
      '"Replace what you own" lists common cryptographic areas with illustrative actions; "Plan & sequence" offers a teaching order that you must adapt to inventory, dependencies and policy.',
    researcher:
      '"This catalog as a corpus of claims" states how many products are backed by a dated document versus the vendor\'s word; every product row shows its verification status and evidence warnings.',
    'cert-engineer':
      "Product rows carry a PQC status, a FIPS 140-3 badge and a verification badge; a product's detail names the stage and flags PQC that is CAVP-validated but outside the module certificate.",
    ops: 'Planning coverage counts selected catalog examples, not readiness. "Plan & sequence" shows illustrative waves, and its JSON export is an educational draft—not an inventory or CBOM.',
    curious:
      '"Who has already moved" introduces documented catalog examples; "Add what you run" builds an educational sequence, not a scan or readiness verdict.',
  },
  '/compliance': {
    executive:
      '"For You" groups scoped instruments as Binding, Relevant / recognized, Cross-border and Advisory above a "Deadline timeline", with "Sector threats" and "Industry events" beside them; "Progress" states the next dated milestone in your scope.',
    grc: '"Rules & Standards": pick a Country (sector comes from the top bar) and review why each instrument is in scope, its binding basis and freshness; "Sources & Practices" shows extracted passages to verify against primary sources, while "Products" separates algorithm validation, module validation and evaluated claims.',
    developer:
      '"For You" has an inventory-policy CI example with a "Copy CI gate YAML" button — it can fail on prohibited findings but does not determine compliance — plus "Algorithm coverage" and an "Implementation jump bar".',
    architect:
      '"For You" has a "Crypto-Agility Maturity" panel, a "Jurisdiction map" and "Standards to read"; the "Landscape" tab lays out Standardization Bodies, Certification Schemes and Compliance Frameworks as one pipeline.',
    researcher:
      '"For You" sorts frameworks by data confidence with a "Source library" and "Cited timeline events"; "Sources & Practices" names the model that extracted each passage; "Product Records" are snapshots of NIST CMVP, CAVP, entropy source validation (ESV) and Common Criteria records with source and freshness metadata.',
    'cert-engineer':
      '"Product Records" lists NIST CMVP, CAVP, entropy source validation (ESV) and Common Criteria records — keep the stages apart: CAVP is the prerequisite, a module certificate is the certification, and an ESV certificate validates a noise source; "For You" lists the schemes that expect PQC and the tests to run first.',
    ops: '"For You" has a "Rotation clock" bucketing frameworks by how soon they bind, "Toolchain quick jumps" and "Framework deadlines"; "Products" shows whether each certificate is PQC validated, mixed or classical only.',
    curious:
      '"For You" opens with "Does this affect me?"; the "Landscape" tab shows who defines algorithms (Standardization Bodies), who validates products (Certification Schemes) and who mandates adoption (Compliance Frameworks).',
  },
  '/business': {
    executive:
      "Start with the four board questions — What's at risk? What's the deadline? What will it cost? Who owns it? — each opens a tool; once you have artifacts, the Governance zone leads with the Board Deck, ROI Model and Audit Checklist cards.",
    grc: 'Your lens opens on the Governance zone with the Audit Checklist, Policy Draft and Vendor Scorecard cards first, then Risk Register and Risk Treatment Plan under Data-Centric Risk Management; the Zones rail on the left switches between them.',
    developer:
      'Your lens opens on the Migration zone with the Migration Roadmap card, the Deployment Playbook under Mitigation; "NIST CSWP.39 — by document section" above the plan jumps by section, and "Export ZIP" bundles every artifact as Markdown.',
    architect:
      'The "Architecture pack" panel at the top holds your scope, decision records and test plan, and downloads them with your saved architecture artifacts as one document that lists what is still missing; the Migration zone holds the Hybrid Transition Plan and MTI Recommendation.',
    researcher:
      'Your lens opens on Data-Centric Risk Management with the Risk Register and Risk Treatment Plan cards; "NIST CSWP.39 — by document section" lists the plan by section, and the accordion at the bottom quotes NIST CSWP 39\'s definition.',
    'cert-engineer':
      "The Command Center plans a migration programme, which this role does not run; the Vendor Scorecard is the tool that touches certificates — a supplier's claims scored against what they can prove.",
    ops: 'Your lens opens on the Migration zone with the Migration Roadmap card first, the Deployment Playbook under Mitigation and the KPI Tracker under Data-Centric Risk Management; "Your next steps" at the top ranks what to do next.',
    curious:
      'This page is a worked example of a migration programme; a banner names the roles it is built for, and the "How does NIST CSWP 39 define crypto agility?" accordion at the bottom is the plain definition to start from.',
  },
  '/timeline': {
    executive:
      'The nearest confirmed-binding milestone card is limited to reviewed records in the current view; open the cited source to determine sector, system, and procurement scope before using its date.',
    grc: 'Filter to a country and inspect its source table, binding characterization, and source-check date; country selection alone does not establish applicability.',
    developer:
      'Use Testing, POC, and Migration records to locate implementation guidance, then inspect the linked source; a phase label is not proof that a library or deployment is production-ready.',
    architect:
      'Use the phase filter to compare published records and open each source before treating it as an architecture pattern; the bars organize evidence rather than score readiness.',
    researcher:
      'Switch regions to compare recorded policy activity and source coverage—not migration pace—and use the source table and source-check dates to inspect the evidence behind each row.',
    'cert-engineer':
      'Use country and source filters to find certification-policy records, then verify programme, module boundary, effective version, and official register; these dates are not certificate requirements by themselves.',
    ops: 'Treat Migration and Deadline rows as planning signals. Calendar exports are year-level reminder windows, not exact cutover dates or proof that a milestone applies to your fleet.',
    curious:
      '"What is recorded for your country?" identifies the next published milestone in the dataset; open its source to learn who and what it covers.',
  },
  '/library': {
    executive:
      'Pick the "Plan migration" door for guidance and report picks rather than raw specifications; sort by Urgency, and each document\'s panel shows a Migration urgency value and an "Open document" link to the original.',
    grc: 'The "Certification starter set" quick view lists seven documents; open any document for its Trust score, Vetting body, Peer reviewed and last-verified date, and "Mapped to NIST CSWP 39" under Advanced keeps only documents tied to a CSWP 39 maturity requirement.',
    developer:
      'Search "ML-KEM", "FIPS 203" or "hybrid TLS", or open Advanced and filter by Algorithm family; the "Reference" door keeps standards, specs and policy, and "Builds on" in a document\'s panel lists what it depends on.',
    architect:
      'The "Reference" door holds standards, specs and policy; a document\'s panel lists what it "Builds on", its "Previous revisions" and the "CSWP-39 requirements" it satisfies, each linking to the matching Command Center zone.',
    researcher:
      'Sort by Publication date or Most cited; every document panel shows its type, region, last-verified date, Trust score, Peer reviewed status and "Previous revisions", with "Open document" going to the original source.',
    'cert-engineer':
      'The "Certification starter set" quick view shows seven documents whatever your role: FIPS 203–205, SP 800-208, SP 800-227, the CMVP manual and the FIPS 140-3 Implementation Guidance; a search lists an exact standard number or title first, and the list narrows to your five focus categories, tinted in the category list.',
    ops: '"Start here — picked for" your role sits above the doors; the "Certification starter set" quick view lists seven documents (FIPS 203–205, SP 800-208 and 227, the CMVP manual, the FIPS 140-3 IG), and Lifecycle status filters to Published so you are not configuring against a draft.',
    curious:
      'Pick the "Learn" door for research, analysis and explainers; "Recently changed" at the top shows what was just added or updated, and the search box takes plain words like "hybrid TLS".',
  },
  '/playground/interactive': {
    executive:
      'This is an engineering workbench that runs real key generation, encryption and signing in your browser; the banner at the top points you to the Command Center and Compliance landscape for board-level context.',
    grc: 'Nothing here produces evidence for an audit — it is a hands-on workbench; the banner at the top links to the Compliance landscape and Migration framework, and the Logs tab shows only what you ran in this session.',
    developer:
      'Generate a key pair on the Key Store tab, then Sign & Verify or KEM & Encrypt; the "Code Reference" panel under the key generator shows the same operation as OpenSSL CLI, Python (liboqs) and Go (liboqs-go), ready to copy.',
    architect:
      'On KEM & Encrypt, tick "Hybrid Mode" and choose the key derivation — HKDF-Extract or raw concatenation — to see how a PQC and a classical shared secret combine; the Key Store table has a Size column for every key.',
    researcher:
      'Every operation is logged with its timing: the strip under the heading shows the last result in milliseconds, and the Logs tab lists timestamp, key, operation and execution time, with "Copy Logs" for the whole run.',
    'cert-engineer':
      'Every operation is logged with its timing in the Logs tab; these are educational WebAssembly builds, not a validated module, so a result here is a demonstration, not evidence.',
    ops: 'Key Store\'s "Backup All" exports every key as a ZIP and "Import ZIP" restores it, so a rehearsal survives a reload; Sign & Verify has a "Deterministic signing" option, and Key Store also generates classical keys for comparison.',
    curious:
      'Follow the Quick Start: generate a key pair on the Key Store tab, then create and check a signature on Sign & Verify; everything runs in your browser and the Logs tab shows each step.',
  },
  '/openssl': {
    executive:
      'This is a hands-on engineering tool — a real OpenSSL 3.6.3 running in your browser, not a FIPS-validated module; the banner at the top links you to the Compliance landscape and Migration framework instead.',
    grc: 'The header states plainly that this build is educational and not FIPS-validated; the Explore tab\'s "Query this build" lists which providers are self-reported versus actually verified, and the banner links to the Compliance landscape.',
    developer:
      'The "Quick jump" strip drops you straight into genpkey, req, x509, dgst, kem or enc on the Workbench tab — the same binary and flags you would put in a script; "Recent Commands" keeps what you ran.',
    architect:
      'The Learn tab walks from a first keypair through certificates, key establishment without classical exchange, and packaging keys for the real world; the Workbench tab then runs each step against real files.',
    researcher:
      'The "Related specs" strip links ML-KEM, ML-DSA, TLS 1.3, PKCS#12 and X.509 to their source documents; on the Explore tab, "Query this build" lists the algorithms and providers this exact binary reports.',
    'cert-engineer':
      'The header states that this build is educational and not FIPS-validated; on the Explore tab, "Query this build" lists which providers are self-reported and which are actually verified.',
    ops: 'The "Rotation & inspection" strip is a rotation rehearsal — genpkey to mint the new key, req for the CSR, x509 to inspect issuer, expiry and algorithm, pkcs12 to bundle key and chain; nothing touches your estate.',
    curious:
      'A banner names the roles this page is built for; the Learn tab starts with "Your first keypair — classical, then post-quantum", and the Workbench terminal offers one-click starters such as "Check OpenSSL version".',
  },
  '/threats': {
    executive:
      'Pick your sector in "Your Exposure" to narrow the teaching catalog. The Mosca result is the latest safe-start year produced by example assumptions—not a compliance deadline; replace X, Y and Z with your organisation’s figures.',
    grc: 'Open a threat dossier to inspect its Evidence section: source identity, claims checked, caveats, second sources and last-verified date. Evidence sorting is available only in the Researcher table view.',
    developer:
      'The "By protocol" chips — TLS / HTTPS, SSH, VPN / IPsec and more — filter threats by what you build on, and say whether each match is stated in the record or inferred; each dossier separates At-Risk Cryptography from its site-derived Candidate response.',
    architect:
      'Each dossier names its At-Risk Cryptography, its site-derived Candidate response and any recorded implementation pitfalls (side-channel, fault, RNG); the Class chips split HNDL from HNFL so you know whether the exposure is data or signatures.',
    researcher:
      '"CRQC Threat Horizon" separates arrival surveys, migration deadlines and machine demonstrations. In the Table view, Evidence sorting ranks claim-lineage coverage and trusted-source presence; it is not a peer-review or confidence score.',
    'cert-engineer':
      'Each threat opens with an Evidence section showing source identity, checked claims, caveats, second sources and last verification; where a replacement has attack notes, the dossier links to Implementation Attacks on /algorithms.',
    ops: 'Each threat\'s Educational detection and response section has a "Detection / SOC" tab and an "Incident Response" tab; use the Industry filter for your sector and the Site priority chips as teaching order, not as an assessment of your estate.',
    curious:
      'A line above the catalog explains what the records represent. Pick a sector in the "Your Exposure" section to narrow the list, then open any card for a plain-language scenario, candidate response and evidence.',
  },
  '/playground': {
    executive:
      'This is an engineering workbench; the banner at the top says why crypto-agility is a board cost-and-risk decision and links to the Compliance landscape, and your featured cards are the HSM Capacity and Cert Capacity calculators.',
    grc: 'Your featured cards are the Cert Capacity and HSM Capacity calculators — sizing evidence for a migration plan; the banner at the top links to the Compliance landscape and Migration framework for the obligations themselves.',
    developer:
      'Start from "I want to…" — Sign / verify, Key exchange, Generate keys, Certificates / PKI — or a category on the left; your featured cards include Hybrid Signature Spectrums, and the Beginner / Advanced chips set the depth.',
    architect:
      'Your featured cards are TEE-HSM Secure Channel, key derivation and the HSM Capacity Calculator; the KMIP Control Plane card at the bottom flips a crypto-agility policy and shows the same operations switch to PQC.',
    researcher:
      'Your featured cards are Source Combining, Stateful Hash Signatures and more; "Size / benchmark" under "I want to…" collects the measurement tools, and the "Sandbox" chip shows which tools run in a container rather than the browser.',
    'cert-engineer':
      'Your featured cards are the Validation Workbench, the Conformance Runner, Entropy Testing, SP 800-90A DRBG and Firmware Signing; the first two open the ACVP-sample suite and the OASIS conformance suite inside the PKCS#11 HSM playground.',
    ops: 'Your featured cards are the PQC VPN Simulator, HSM Capacity Calculator and Hybrid Certificates; "Runs on this device" hides tools that need the sandbox, and "Sandbox runtime" in the left rail shows whether you have container access.',
    curious:
      'Your featured cards are the Merkle Tree Workshop and PKI Workshop; a notice explains that advanced controls are folded away but everything still runs real cryptography in your browser, and the Beginner chip keeps the list gentle.',
  },
}
