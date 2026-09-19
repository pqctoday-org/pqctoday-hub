// SPDX-License-Identifier: GPL-3.0-only
/**
 * B+ round 8, Wave C (2026-09-19) — "What this means for you" on eleven routed
 * reference pages. /navigate is a full-screen canvas with no header to sit under,
 * so it carries no strip.
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

export type PagePersonaNotes = Record<PersonaId, string>

export const PAGE_PERSONA_NOTES: Record<string, PagePersonaNotes> = {
  '/': {
    executive:
      'Pick Executive and choose the question — mandate, risk, roadmap, deadlines, evidence or the whole programme — each board is three cards that answer it, with the proof behind each.',
    grc: 'Pick GRC and choose the question — what applies, what is already proven, the controls, the risk register, vendor assurance or what "done" means — before any tool asks you for an inventory.',
    developer:
      'Pick Developer and choose the question: the pilot board reaches a real ML-KEM handshake in this tab in minutes; the others cover parameter sets, inventory, sizes, deadlines and closure.',
    architect:
      'Pick Architect and choose the question: the control-plane board changes one KMIP policy line and rekeys the estate live; the others cover inventory, key stores, protocols, sequencing and defending the design.',
    researcher:
      "Pick Researcher and choose the question: provenance, reproducing the tests, the standards' dates and states, the threat model, the field, or the command line — every figure carries its source.",
    ops: 'Pick IT Ops and choose the question: capacity, cutover rehearsal, cipher-suite config, supplier timelines, closeout or your standing — sized before renewal day.',
    curious:
      'You do not need a role: skip the question and the site opens by topic, or pick Curious for what breaks and when, where it touches you, and a thirty-second version.',
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
    ops: 'Patents change nothing you operate today; the licensing angle you need rides on the vendors in the migration catalogue.',
    curious:
      'A patent is a public description of an invention with a date on it — this is where the post-quantum ideas were first written down, searchable by title, assignee or number.',
  },
  '/leaders': {
    executive:
      'The people here wrote the standards your regulator will cite; when a vendor names a co-author, filter by name and check the claim.',
    grc: 'Filter by country, region and sector to see which national bodies and organisations are actually represented in the standards work.',
    developer:
      'The Standards category names the authors behind FIPS 203–205 and the PKCS#11 specification, with the documents each one wrote.',
    architect:
      'Interoperability questions have owners: the Standards category tells you who edits the PKCS#11 and KMIP specifications you design against.',
    researcher:
      'Entries carry their key resources and a verified date; a name that is missing means no public proof was found, not that the person is unknown.',
    ops: 'Skip the biographies: sort "By relevance to you" or filter to the Standards category to see who maintains the documents your configuration references.',
    curious:
      'Post-quantum cryptography is being built by a few hundred people you can name — this is who they are, in cards or a table, and what each one did.',
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
    ops: '"How do you configure PQC TLS on Linux?", "What OpenSSH version supports PQC?" and "How do I safely retire legacy cryptography?" are the ones to read before scheduling a cutover.',
    curious:
      'Start with "What is post-quantum cryptography?" and "Where should I start if I\'m new to PQC?"; each answer links to the module that explains it fully.',
  },
  '/about': {
    executive:
      "The Trust Engine and Trust Score Methodology sections explain how much of the site's content is backed by a cached primary source — the figures to quote when you cite the site.",
    grc: 'The Transparency & Disclaimer and Independence sections state who runs the site, who funds it and how corrections are handled.',
    developer:
      'The SBOM section lists every dependency by category; the Data Privacy section states that the site is static, with no backend and nothing leaving your browser.',
    architect:
      'The Platform Data section names each data file with its date — the provenance of every table you design from.',
    researcher:
      'The Trust Score Methodology and Trust Tiers are published in full; use them to judge any figure on the site.',
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
    ops: 'Nothing operational changes with sponsorship; the tools stay free.',
    curious: 'If the site helped you, this is how to help it keep running.',
  },
  '/terms': {
    executive:
      "The site gives information, not legal or compliance advice; decisions remain yours and your counsel's.",
    grc: 'The License and Third-Party Content sections say what you may reuse and how to attribute it; check them before putting tables in an audit file.',
    developer:
      'The source code licence is GPL-3.0-only, and nothing in these terms restricts the rights it grants.',
    architect:
      'Simulations and tools are educational; the Cryptographic Disclaimer says production designs need your own validation.',
    researcher:
      'Reuse of text and data is governed by the License and Third-Party Content sections; cite the site when you reuse it.',
    ops: 'The playground runs real cryptography in your browser; the Cryptographic Disclaimer says keys made here must never protect production systems.',
    curious:
      'Plain summary: free to use, no account, and the Privacy and Analytics section says what is collected.',
  },
  // ── Round 9, wave 2 (2026-09-19): the sixteen routed pages the round-8 strip did not reach; each line written against the page's rendered controls and sections ──
  '/report': {
    executive:
      'Your view opens "Recommended Actions (Top 5)" first; at the foot of the report, "Print Executive Brief" and "Board Pack ZIP" produce the version you hand to the board.',
    grc: 'The "Compliance Impact" section marks each framework "PQC Required" or "No PQC mandate yet" with its deadline and links into the Library and Timeline; your view also opens Assessment Profile, Discovery, CBOM and Vendor risk.',
    developer:
      'Your view opens "Cryptographic Bill of Materials (CBOM)" and "Cryptographic Discovery" first; "Algorithm Migration Priority" names each replacement with a "Try in Playground" link, and "Export CSV" downloads that table.',
    architect:
      'Your view opens "Assessment Profile" and the "Industry Threat Landscape" by default; "HNDL / HNFL Risk Windows" shows how long your data and certificates must outlast the threat.',
    researcher:
      'Under "Risk Score", "How this was calculated" lists each category\'s score, weight and points; the info button "How this report works" opens the methodology behind every section.',
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
    ops: 'The "Migration Estate" tab asks for keys by business label and lets the policy pick the algorithm; move from classical to hybrid to full PQC and "Key objects on this engine" shows rekeyed successors linked to deactivated predecessors.',
    curious:
      'Keep View on "guided" and press "Guided Tour" for step-by-step lessons; everything runs in this tab — no server, no Docker.',
  },
  '/learn': {
    executive:
      '"My Path" opens on "Essentials" — the core modules that unlock your "Capstone Quiz"; in "Browse all" the Executive track chip narrows the catalogue to the modules written for your role.',
    grc: 'In "Browse all", the "Workforce view" button is shown for your role and maps modules to NICE work roles; the "Advanced" tray adds a "NICE proficiency" filter — Awareness, Practitioner, Expert.',
    developer:
      '"Browse all" has a search ("try \'TLS\' or \'HSM\'"), track chips such as Protocols, Software Infrastructure and Hardware Infrastructure, and a "Shortest first" sort.',
    architect:
      '"Guided routing" asks where you are — "Have an inventory, but no risk priorities", "Know the priorities, need a multi-year plan" — and names the first module; in "Browse all" the Protocols track chip is yours.',
    researcher:
      'Your path ends not in a quiz but in "Your capstone: reproduce a known-answer test" — "Run the ACVP vectors" and "Find the published vectors"; the "Advanced" tray adds a browse-by-Algorithms / Standards filter for your role.',
    ops: '"My Path" has an "Essentials" / "Full track" toggle with the hours for each and a "Continue where you left off" card with "Resume"; in "Browse all", filter by status to see "In progress" modules.',
    curious:
      '"Pick a role in the top bar for a guided path — or" browse every module; "New here? Start with the right module" includes "Not sure — assess me", and the "Quiz" button sits beside the page title.',
  },
  '/playground/hsm': {
    executive:
      'A banner at the top says this is a hands-on engineering workbench and points you to Command Center, Compliance landscape and Migration framework; for your role the engine stays Rust and the test suites are not shown.',
    grc: 'The same engineering-workbench banner appears for your role; if you stay, Inspect › Log lists every call with Function, Arguments and Return Value, and "Beginner" adds a "Plain English" column.',
    developer:
      'Build › Standard is a pipeline builder with Builder and Code views, Run (⌘/Ctrl+Enter) and "Export .py"; Build also carries ACVP and Conformance suites, and the Engine switch offers C++, Rust or Dual Parity.',
    architect:
      'Operate walks "1. Initialize HSM", "2. Create Token", "3. Open Session & Login", then a Primitives rail — KEM, Symmetric Encrypt, Key Wrap / Unwrap, Hashing, Sign & Verify, Key Agreement, KDF; Inspect › Keys lists what the token holds.',
    researcher:
      'Build › ACVP replays NIST ACVP reference vectors against the WASM engine ("ACVP Known-Answer Tests"); Build › Conformance is a "PKCS#11 v3.2 Conformance Runner"; the WIP badge opens the test methodology.',
    ops: 'The Learn lessons "The Cryptoki model — slots, tokens, sessions, login" and "Mechanism discovery" cover token setup; Inspect › Mechanisms\' "Query Slot" enumerates what the token supports, and the Log filters by origin.',
    curious:
      'Open the Learn tab, pick a lesson and press "Run all" to watch each step run; the "New to PKCS#11?" strip explains the terms on hover, and the engine is preset to Rust.',
  },
  '/algorithms': {
    executive:
      'The "What you\'re required to adopt" box states that CNSA 2.0 requires ML-KEM-1024 and ML-DSA-87 for US National Security Systems; "View Top 4 →" highlights the four to know, and the "CNSA 2.0" lens filters the tables to that suite.',
    grc: 'The Transition Guide tab lists each classical algorithm, its PQC alternative, region, status and transition or deprecation; filter Status to Certified — the page hint reminds you that certified is not the same as compliant.',
    developer:
      'Detailed Comparison sorts on Pub key, Sig / CT, KeyGen, Sign / Enc, Verify / Dec and RAM, with "Compare side-by-side"; Validation › "KAT Validation" runs pinned known-answer tests in your browser.',
    architect:
      'The Protocol Support tab tracks 28 protocols across pure-KEM, hybrid-KEM, pure-Sig and hybrid-Sig, each marked RFC, Draft, Experimental or None, with filters for OSS, commercial and live deployment.',
    researcher:
      'The "Research needed" toggle narrows to algorithms with an incomplete data row; Validation › "Implementation Attacks" gives side-channel and fault-injection notes per family; the Region filter includes KpqC, CACR and CRYPTREC.',
    ops: 'The "FIPS-validated" quick preset shows only algorithms that completed FIPS validation; on Protocol Support each row carries a Production, Pilot or Experimental deployment posture and a "Has OSS" filter.',
    curious:
      'You get a short preview — "three you actually need to know": ML-KEM-768, ML-DSA-65, SLH-DSA-SHA2-128s — then "Show full algorithm comparison" or "Learn the basics first".',
  },
  '/migrate': {
    executive:
      '"Which of your suppliers have committed" counts the vendors with a published PQC roadmap we hold a copy of against those with nothing public; the "Vendor roadmaps" and "Vendor risk" tabs give the detail per supplier.',
    grc: 'Product rows on "Replace what you own" carry a PQC status (GA, Partial, Roadmap, No PQC), a FIPS 140-3 badge and a verification badge (Verified, Pending Verification); the "Vendor risk" tab scores a "Certification gap".',
    developer:
      'Under "Replace what you own", the "Crypto libraries & frameworks" domain lists the libraries; use "Filter products…" to narrow, and a product\'s detail shows its CPE and PURL identifiers.',
    architect:
      '"Replace what you own" lists assets — TLS key exchange, IPsec / IKEv2 VPN, X.509 cert signatures, HSM-protected keys — each with a decision (Drop-in, Hybrid config, Re-key, Track roadmap, Mitigate); "Plan & sequence" orders by exposure.',
    researcher:
      '"This catalog as a corpus of claims" states how many products are backed by a dated document versus the vendor\'s word; every product row shows its verification status and evidence warnings.',
    ops: 'The readiness panel shows the share of your assets with a GA path, the "HNDL-urgent" count, the "Nearest CNSA deadline" and your "Next move" with its wave; "Export plan + CBOM" on "Plan & sequence" downloads the plan.',
    curious:
      '"Who has already moved" says how many tracked products support post-quantum cryptography with a document proving it, and where it landed first; "Add what you run" starts a plan of your own.',
  },
  '/compliance': {
    executive:
      '"For You" groups your frameworks as Mandatory, Recognized, Cross-border and Advisory above a "Deadline timeline", with "Sector threats" and "Industry events" beside them; "Progress" states the next dated milestone in your scope.',
    grc: '"Rules & Standards": pick a Country (sector comes from the top bar) and the register says how many instruments are in scope and how many actually mandate PQC; "Requirements" quotes each source verbatim, "Products" shows your certificates.',
    developer:
      '"For You" has "Wire a PQC gate into CI" — a GitHub Actions snippet with a "Copy CI gate YAML" button — plus "Algorithm coverage" and an "Implementation jump bar".',
    architect:
      '"For You" has a "Crypto-Agility Maturity" panel, a "Jurisdiction map" and "Standards to read"; the "Landscape" tab lays out Standardization Bodies, Certification Schemes and Compliance Frameworks as one pipeline.',
    researcher:
      '"For You" sorts frameworks by data confidence with a "Source library" and "Cited timeline events"; "Requirements" names the model that extracted each quote; "Product Records" are live NIST CMVP, CAVP and Common Criteria records.',
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
      'Your lens opens on the Governance zone with Crypto Architecture, RACI Matrix, Vendor Scorecard and Supply Chain Matrix cards first; the Migration zone holds the Hybrid Transition Plan and MTI Recommendation, reached from the Zones rail.',
    researcher:
      'Your lens opens on Data-Centric Risk Management with the Risk Register and Risk Treatment Plan cards; "NIST CSWP.39 — by document section" lists the plan by section, and the accordion at the bottom quotes NIST CSWP 39\'s definition.',
    ops: 'Your lens opens on the Migration zone with the Migration Roadmap card first, the Deployment Playbook under Mitigation and the KPI Tracker under Data-Centric Risk Management; "Your next steps" at the top ranks what to do next.',
    curious:
      'This page is a worked example of a migration programme; a banner names the roles it is built for, and the "How does NIST CSWP 39 define crypto agility?" accordion at the bottom is the plain definition to start from.',
  },
  '/timeline': {
    executive:
      '"Your nearest binding milestone" above the chart names the soonest enforceable date in your region and how many years out it is; the region filter changes the scope, and the "Deadlines" button strips the chart to deadline bars only.',
    grc: 'The "Show:" control defaults to Government and Standards & Consortia; pick a country and a "Documents" table appears under the chart listing its policy documents by phase, type, organisation and period; country rows show a Verified date.',
    developer:
      'Set the country to the US, UK or Germany and watch for rows in the Testing, POC and Migration phases — those are the first production deployments to align a library choice with; the "All Phases" dropdown filters to one phase.',
    architect:
      'Use the "All Phases" dropdown to show only Testing, POC or Migration and see which countries have reached them; the Countries list on the left jumps to a row, and the "Phase Color Code" legend at the bottom decodes the bars.',
    researcher:
      'Switch the region filter to compare migration pace across blocs; country rows show their Verified date, and the "Documents" table under a selected country lists the source documents with sortable phase, type, organisation and period.',
    ops: 'Watch the Migration and Deadline phases — they set the certificate-rotation clock; the "Export ... matching as .ics" button puts the filtered phases into your calendar as all-day windows, and the CSV export is next to the search box.',
    curious:
      '"When does this reach me" above the chart shows your own country\'s track and what comes next; each row below is one country, and the "Phase Color Code" legend at the bottom explains what each coloured bar means.',
  },
  '/library': {
    executive:
      'Pick the "Plan migration" door for guidance and report picks rather than raw specifications; sort by Urgency, and each document\'s panel shows a Migration urgency value and an "Open document" link to the original.',
    grc: 'The "Cert-relevant" quick view is the FIPS 203–205, SP 800-208 and CMVP set; open any document for its Trust score, Vetting body, Peer reviewed and last-verified date, and "Authoritative sources only" under Advanced drops the rest.',
    developer:
      'Search "ML-KEM", "FIPS 203" or "hybrid TLS", or open Advanced and filter by Algorithm family; the "Reference" door keeps standards, specs and policy, and "Builds on" in a document\'s panel lists what it depends on.',
    architect:
      'The "Reference" door holds standards, specs and policy; a document\'s panel lists what it "Builds on", its "Previous revisions" and the "CSWP-39 requirements" it satisfies, each linking to the matching Command Center zone.',
    researcher:
      'Sort by Publication date or Most cited; every document panel shows its type, region, last-verified date, Trust score, Peer reviewed status and "Previous revisions", with "Open document" going to the original source.',
    ops: '"Start here — picked for" your role sits above the doors; the "Cert-relevant" quick view is FIPS 203–205, SP 800-208 and the CMVP manual, and Lifecycle status filters to Published so you are not configuring against a draft.',
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
    ops: 'The "Rotation & inspection" strip is a rotation rehearsal — genpkey to mint the new key, req for the CSR, x509 to inspect issuer, expiry and algorithm, pkcs12 to bundle key and chain; nothing touches your estate.',
    curious:
      'A banner names the roles this page is built for; the Learn tab starts with "Your first keypair — classical, then post-quantum", and the Workbench terminal offers one-click starters such as "Check OpenSSL version".',
  },
  '/threats': {
    executive:
      '"Your Exposure" at the top shows your sector\'s threats and "Your migration deadline" — the year the Mosca arithmetic says you must be done; the Severity chips in the Threat Catalog cut the list to Critical.',
    grc: 'Sort the Table view by Evidence to put the best-documented records first; each threat opens with its Data Provenance (peer review, vetting body, last verified) and a Reference Source link you can cite.',
    developer:
      'The "By protocol" chips — TLS / HTTPS, SSH, VPN / IPsec and more — filter threats by what you build on, and say whether each match is stated in the record or inferred; each threat lists its At-Risk Cryptography and PQC Mitigation.',
    architect:
      'Each threat names its At-Risk Cryptography, its PQC Mitigation and the implementation pitfalls of the replacement (side-channel, fault, RNG); the Class chips split HNDL from HNFL so you know whether the exposure is data or signatures.',
    researcher:
      '"CRQC Threat Horizon" lists the CRQC arrival estimates by source and logical-qubit progress per machine, with a Mosca calculator; the Evidence column sorts records by peer review, source and confidence.',
    ops: 'Each threat\'s Detection & Response section has a "Detection / SOC" tab and an "Incident Response" tab; use the Industry filter for your sector and the Severity chips to work Critical first.',
    curious:
      'A line above the catalog tells you how many known threats there are and what one is; pick an industry in the list on the left to see the ones closest to you, and "Your Exposure" at the top sums it up.',
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
    ops: 'Your featured cards are the PQC VPN Simulator, HSM Capacity Calculator and Hybrid Certificates; "Runs on this device" hides tools that need the sandbox, and "Sandbox runtime" in the left rail shows whether you have container access.',
    curious:
      'Your featured cards are the Merkle Tree Workshop and PKI Workshop; a notice explains that advanced controls are folded away but everything still runs real cryptography in your browser, and the Beginner chip keeps the list gentle.',
  },
}
