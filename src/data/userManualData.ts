// SPDX-License-Identifier: AGPL-3.0-only

export type PageId =
  | 'timeline'
  | 'algorithms'
  | 'library'
  | 'playground'
  | 'openssl-studio'
  | 'threats'
  | 'leaders'
  | 'compliance'
  | 'migrate'
  | 'assess'
  | 'report'
  | 'business-center'
  | 'learn'
  | 'faq'

export interface ManualSection {
  heading: string
  body: string
}

export interface PageManual {
  title: string
  summary: string
  sections: ManualSection[]
  tips?: string[]
}

export const pageManuals: Record<PageId, PageManual> = {
  timeline: {
    title: 'Global Migration Timeline',
    summary:
      'Compare post-quantum cryptography migration roadmaps across nations and track phases from discovery to full migration.',
    sections: [
      {
        heading: 'Region & Country Filters',
        body: 'Use the region dropdown to filter by Americas, EU, APAC, or Global. Select a specific country to see its migration phases highlighted on the Gantt chart. Filters sync with the URL so you can share filtered views.',
      },
      {
        heading: 'Gantt Chart',
        body: 'Each row represents a country. Colored bars show migration phases (Research, Planning, Early Adoption, Transition, Full Migration). Hover over a bar to see phase dates and details. Click a row to expand milestones.',
      },
      {
        heading: 'Export & Sharing',
        body: 'Use the Export button in the header to download the full timeline dataset as CSV. The Share button copies a deep link to your current filtered view.',
      },
      {
        heading: 'Sources & Endorsements',
        body: 'Click Sources to see the authoritative government documents behind each data point. Use the Endorse/Flag buttons to provide community feedback on data accuracy.',
      },
    ],
    tips: ['Bookmark a filtered URL to quickly return to a specific region view.'],
  },

  algorithms: {
    title: 'PQC Algorithms',
    summary:
      'Learn how post-quantum algorithms differ, explore candidate transition paths, inspect evidence, and run scoped implementation checks.',
    sections: [
      {
        heading: 'Transition Tab',
        body: 'Shows candidate migration paths from classical algorithms (RSA, ECDH, ECDSA) to post-quantum algorithms (ML-KEM, ML-DSA, SLH-DSA and others). Each row shows the classical algorithm on the left and a candidate migration path on the right, with region, publication status and transition timing. A row is educational context, not a drop-in replacement or a compliance determination.',
      },
      {
        heading: 'Detailed Comparison Tab',
        body: 'Deep-dive into algorithms in a sortable table covering security levels, key/ciphertext/signature sizes, catalogue estimates, and reviewed use cases. Toggle Browse ↔ Compare mode. Baselines help explain size differences; they are not universal performance rankings. Filter by crypto family, function group, or security level.',
      },
      {
        heading: 'Compare Panel',
        body: 'Select up to 3 algorithms to compare side-by-side. Click the compare icon on algorithm cards to add them to the comparison bar at the bottom of the page. The panel shows a detailed table comparing all properties.',
      },
      {
        heading: 'URL Parameters',
        body: 'Deep link to specific views: ?tab=transition|detailed|support|landscape|validation, ?family=, ?fn=, ?level=, ?region=, ?status= and ?q= to filter, ?quickview=nist-picks|final-nist-standards|none (the older fips-validated value still opens Final NIST standards), ?mode=compare for the Detailed tab, ?section=attacks|kat|coverage for the Validation tab, ?protocol=<id> to open a Protocol Support row, ?industry= for the Landscape tab, ?highlight= to highlight algorithms, ?transition=<row> to open and highlight one Transition Guide row, ?compare= for pre-selected comparisons. On the Protocol Support tab: ?matrixView=detailed, ?matrixQ=, ?matrixStatus=, ?matrixAvailability=, ?matrixSort=key:direction. Use the Share button to copy a link to your current selection.',
      },
    ],
    tips: [
      'Use the Detailed tab filters to quickly narrow down algorithms by security level or standardization status.',
      'The compare panel is great for preparing algorithm selection reports.',
      'Toggle Browse ↔ Compare mode on the Detailed tab, or open the Validation tab for implementation attacks and live KAT tests.',
    ],
  },

  library: {
    title: 'PQC Library',
    summary:
      'Search and browse 1,200+ post-quantum cryptography standards, drafts, RFCs, and reference documents from NIST, IETF, ETSI, and other organizations.',
    sections: [
      {
        heading: 'Search & Filters',
        body: 'Type in the search bar to search across titles, descriptions, and tags. Use the category sidebar to filter across 13 categories (Digital Signature, KEM, PKI Certificate Management, Protocols, Government & Policy, NIST Standards, International Frameworks, Migration Guidance, Algorithm Specifications, Industry & Research, Compliance & Certification, Blockchain Standards, Implementations). Filter by organization or industry. Persona-aware category boosting surfaces the most relevant categories for your role.',
      },
      {
        heading: 'View Toggle',
        body: 'Switch between Card view and Tree Table view using the toggle in the toolbar. Card view shows document summaries; Tree Table groups documents by category with sortable columns.',
      },
      {
        heading: 'Document Details',
        body: 'Click any document card to see full details including abstract, status, dependencies, related standards, and a direct link to the source. Documents with local cached copies show a preview icon.',
      },
      {
        heading: 'Activity Feed',
        body: 'The activity feed shows recently added or updated documents. New and Updated badges appear on documents that changed since the previous data version.',
      },
    ],
    tips: [
      'Use the URL parameter ?ref=REFERENCE_ID to deep-link directly to a specific document.',
      'Export the full library as CSV for offline analysis or reporting.',
      'URL params: ?ref= opens a document; ?cat=, ?org=, ?sector=, ?q=, ?sort=, ?view=cards|table are all combinable for shareable filtered views.',
    ],
  },

  playground: {
    title: 'Interactive Playground',
    summary:
      'Generate real post-quantum cryptographic keys, encrypt data, and sign messages directly in your browser using WebAssembly. 34 workshop tools, an interactive crypto lab, and a full PKCS#11 HSM emulator — all running locally.',
    sections: [
      {
        heading: 'Workshop Grid',
        body: 'The main /playground view shows a searchable catalog of 34 workshop tools across 7 categories: HSM / PKCS#11, Entropy & Random, Certificates & Proofs, Protocol Simulations, Blockchain & Digital Assets, Digital Identity, and OpenSSL Studio (includes TLS 1.3 Simulator). Persona-aware filtering highlights recommended tools with difficulty badges (beginner/intermediate/advanced).',
      },
      {
        heading: 'Interactive Crypto Lab',
        body: 'The /playground/interactive route provides 7 tabs: Key Store (keypair generation), Data (hex editor), KEM & Encrypt (ML-KEM + X25519 ECDH), Sym Encrypt (AES/ChaCha), Hash (SHA/SHAKE), Sign & Verify (PQC + classical), and Logs (operation history). Use ?tab= to deep-link to specific operations.',
      },
      {
        heading: 'HSM Playground',
        body: 'The /playground/hsm route emulates a PKCS#11 v3.2 HSM via SoftHSMv3 WASM with 10 tabs: Keystore, Symmetric, Key Wrap, Hashing, Sign/Verify, Key Agreement, Key Derivation, Mechanisms, Validation (mixed-evidence workbench: selected NIST ACVP-Server reference samples, standard KATs, oracle and functional tests), and Logs. Supports C++, Rust, and Dual engine modes with parity cross-check.',
      },
      {
        heading: 'Individual Tools',
        body: 'Each workshop tool has its own route at /playground/:toolId with lazy-loaded components, breadcrumb navigation, and community endorse/flag buttons.',
      },
    ],
    tips: [
      'All generated keys are for educational purposes only — not for production use.',
      'The Logs tab records every operation with timestamps for review.',
      'Use the SoftHSM tab to understand how real HSMs handle PQC operations via PKCS#11.',
    ],
  },

  'openssl-studio': {
    title: 'OpenSSL Studio',
    summary:
      'Interactive OpenSSL v3.6.3 environment running entirely in your browser via WebAssembly. Build and execute real OpenSSL commands with a visual workbench.',
    sections: [
      {
        heading: 'Command Categories',
        body: 'Select a command category from the top menu: genpkey (key generation), req (certificate requests), x509 (certificates), enc (encryption), dgst (digests), hash, rand (random), kem (key encapsulation), and more.',
      },
      {
        heading: 'Workbench',
        body: 'The workbench provides a file manager and code editor. Upload or create input files, edit command parameters, and see the generated OpenSSL command. Click Run to execute against the in-browser OpenSSL instance.',
      },
      {
        heading: 'Terminal Output',
        body: 'Command output appears in the terminal panel below the workbench. View generated keys, certificates, and operation results. Collapsible sections help navigate long outputs.',
      },
      {
        heading: 'File Viewer',
        body: 'Generated files (keys, certificates, CSRs) appear in the file manager. Click to inspect file contents, copy to clipboard, or use them as inputs for subsequent commands.',
      },
    ],
    tips: [
      'Use the URL parameter ?cmd= to deep-link to a specific command category.',
      'Start with genpkey to generate a PQC key, then use req to create a certificate request.',
      'The Logs tab shows raw OpenSSL output for debugging.',
    ],
  },

  threats: {
    title: 'Quantum Threats',
    summary:
      'Explore industry-specific threat analysis showing which cryptographic assets are at risk from quantum computers and the recommended PQC replacements.',
    sections: [
      {
        heading: 'Industry Filters',
        body: 'Filter threats by industry using the multi-select dropdown — select multiple industries simultaneously (e.g., Finance + Healthcare). Each industry shows its specific threat landscape and affected cryptographic protocols. A persona-aware summary card highlights the most impactful threats for your role.',
      },
      {
        heading: 'Criticality & Search',
        body: 'Filter by criticality level (Critical, High, Medium-High, Medium, Low) to focus on the most urgent threats. Use the search bar to find threats by keyword across all fields.',
      },
      {
        heading: 'Threat Details',
        body: 'Click any threat card to expand full details: affected algorithms, at-risk protocols, timeline to quantum risk, recommended PQC replacements, trust score badges, and references to compliance frameworks.',
      },
      {
        heading: 'Sort Options',
        body: 'Sort threats by industry, threat ID, or criticality level. The default view groups threats by industry with the most critical items first. URL params: ?industry= (comma-separated), ?criticality=, ?q=, ?sort=, ?dir=, ?id=.',
      },
    ],
    tips: [
      'Use Endorse/Flag buttons to provide community feedback on threat assessments.',
      'Threats link to related compliance frameworks — click through to see requirements.',
    ],
  },

  leaders: {
    title: 'PQC Leaders',
    summary:
      'Discover the organizations and experts driving post-quantum cryptography adoption worldwide, organized by region, sector, and leadership category.',
    sections: [
      {
        heading: 'Region & Sector Filters',
        body: 'Filter by region (Americas, EU, Asia-Pacific) with country drill-down, or by sector (Public, Private, Academic). Use the category sidebar to browse by leadership type.',
      },
      {
        heading: 'View Toggle',
        body: 'Switch between Card view (visual profile cards) and Table view (sortable columns). Both views support the same filtering and search capabilities.',
      },
      {
        heading: 'Leader Details',
        body: 'Click a leader card to see their full profile: organization, contributions to PQC, key publications, and links to related library resources. 330+ leaders are currently profiled.',
      },
      {
        heading: 'Search',
        body: 'Search by name, organization, or keyword to quickly find specific leaders or organizations. Results update in real-time as you type.',
      },
    ],
    tips: [
      'Leader profiles link to related documents in the Library via their Key Resource URLs.',
      'Use the consent/removal form to submit corrections or request profile removal.',
    ],
  },

  compliance: {
    title: 'Compliance Frameworks',
    summary:
      'Use this educational reference to learn which rules, standards and certification records may be relevant to a country and sector, why they were included, what their sources say about post-quantum cryptography, and the dates they state. It is not a GRC system, legal advice, an applicability decision or proof of compliance. The page has eight views: Rules & Standards, Sources & Practices, Progress, Products, Landscape, Product Records, For You and CSWP.39 Agility.',
    sections: [
      {
        heading: 'Eight Views',
        body: 'The tab bar has eight views: Rules & Standards, Sources & Practices, Progress, Products, Landscape, Product Records, For You and CSWP.39 Agility. Rules & Standards opens first for most roles, and operations roles open on Progress. A link that carries a certificate, a source passage, a product or a CSWP.39 reference opens the view it belongs to. On a narrow screen the tab bar scrolls sideways.',
      },
      {
        heading: 'Rules & Standards, Sources & Practices and Progress',
        body: 'Rules & Standards lists instruments associated with the selected country and sector, why each one was included, and what its source says about post-quantum cryptography. Each item carries a tier (Binding, Relevant / recognized, Cross-border, Advisory, Related via IR 8477 or Informational) from the same educational applicability model as For You. Binding requires a reviewed binding status and a stated basis; an issuer match alone is not enough, and the site does not decide whether an instrument applies to a real organisation. Sources & Practices shows machine-extracted source passages, where they appear and which model extracted them. Verify the primary passage and obtain the appropriate legal or assurance review before treating it as an obligation. Progress compares dates stated by scoped sources; a date does not by itself prove implementation is overdue.',
      },
      {
        heading: 'Products and Product Records',
        body: 'Products maps the inventory you keep on Migrate to reviewed evidence. It distinguishes NIST CAVP/ACVP algorithm validation, FIPS 140 module validation, and algorithms named in evaluated-product documentation; those evidence classes are not interchangeable. Product Records is a searchable snapshot of NIST CMVP module validations, NIST CAVP algorithm validations, NIST entropy source validations (the Entropy (ESV) tab), Common Criteria and EUCC certificates, and ANSSI CSPN certificates. Search by product, vendor or type, filter by source and status, and use the source and freshness fields before relying on a record. A link with ?cert= opens one specific record.',
      },
      {
        heading: 'Landscape',
        body: 'Landscape lays the field out as a chain of three groups. Standardization Bodies define the algorithms and publish the standards. Certification Schemes (FIPS 140-3, ACVP, Common Criteria, EUCC) test that products implement them correctly. Compliance Frameworks (for example CNSA 2.0, NIS2 and DORA) set the requirements and deadlines. Switch between the three groups at the top, filter by organization, industry or search, and sort by name, deadline or finish date.',
      },
      {
        heading: 'For You and CSWP.39 Agility',
        body: 'For You presents standards, threats, library documents and timeline milestones associated with the selected industry, country and region, tuned by the role selected in the top bar. The executive CSV is a learning worksheet, not an audit or management register. CSWP.39 Agility presents a PQC Today learning sequence based on NIST CSWP 39, with links to the source PDF and related Learn module; its steps are not NIST’s section structure.',
      },
      {
        heading: 'Framework Details',
        body: 'Click any framework to open its details drawer: source and trust information, a Learn this link, the traceability chain, deadline phases, and related and overlapping frameworks.',
      },
    ],
    tips: [
      'Framework entries cross-reference both Library documents and Timeline milestones.',
      'Old links still work: ?tab=standards, ?tab=certification and ?tab=compliance open Landscape.',
      'URL params: ?tab=obligations|requirements|progress|products|foryou|records|cswp39 chooses a view; ?framework=<id> opens a framework, ?cert=<id> a certification record, ?reqfw=<id> a framework in Requirements, ?prod=<id> a product, ?evref= a CSWP.39 reference; ?org=, ?ind=, ?q= and ?mcat= filter.',
    ],
  },

  migrate: {
    title: 'Migration Workbench',
    summary:
      'Browse 880+ PQC-ready software products organized across 9 infrastructure layers with certification cross-references and migration planning tools.',
    sections: [
      {
        heading: 'Infrastructure Layer Stack',
        body: 'Products are organized across 9 layers: Cloud, Network, Application Servers, Libraries & SDKs, Security Software, Database, Security Stack, Operating Systems, and Hardware & Secure Elements. Click a layer to filter. The stack shows readiness counts per layer.',
      },
      {
        heading: 'Product Search & Filters',
        body: 'Search by product name or vendor. Filter by infrastructure layer, category, sub-category, vendor, verification status, and migration step. Persona-based recommendations highlight relevant layers. URL params: ?product=<product id> opens one product, ?productIds= lists several, ?tab=replace|plan|roadmaps|vendorrisk picks a tab, and ?tab=roadmaps&vendor=<vendor id> opens a vendor roadmap.',
      },
      {
        heading: 'Product Details',
        body: 'Click any product to see its full migration profile: current PQC support, migration timeline, certification status (FIPS 140-3/CAVP/CC cross-references), vendor links, and product briefs.',
      },
      {
        heading: 'My Products & Comparison',
        body: 'Add products to your comparison list using the bookmark icon. The "My Products" panel lets you compare up to 3 products side-by-side via the sticky compare bar.',
      },
      {
        heading: 'View Modes',
        body: 'Three view modes: Stack (grouped by infrastructure layer, default), Cards (flat grid), and Table (sortable columns). Hidden products can be managed via the settings icon.',
      },
    ],
    tips: [
      'Hidden products can be managed via the settings icon — useful for excluding irrelevant entries.',
      'Certification cross-references link directly to the Compliance page for each product.',
      'Community members can submit product update requests via the contribution cards.',
    ],
  },

  assess: {
    title: 'Risk Assessment',
    summary:
      'Answer guided questions about your organization to build an educational priority index and a planning report. Choose the Fast track (6 questions, about 3 minutes) or the Full track (13 questions, about 5 minutes). The result is a learning model built from your answers, not a formal evaluation or a measurement of your estate.',
    sections: [
      {
        heading: 'Choosing a Track',
        body: 'The chooser offers a Fast track (6 questions) and a Full track (13 questions); a role can show a "Recommended for you" tag on one of them. When a role is selected, its recommended track starts straight away and the chooser is skipped. A Track switch above the questions changes track. A third option, "No estate to describe? Use a reference one", assesses a documented example organization with every question pre-answered, and the report says on its face that it came from a reference estate.',
      },
      {
        heading: 'The Questions',
        body: 'The questions fall into three groups. Your organization: Industry and Jurisdiction. Cryptographic exposure: Crypto in use, Data sensitivity, Compliance, Use cases, Data retention and Credential lifetime. Migration readiness: Migration status, Organizational scale, Crypto agility, Infrastructure and Timeline pressure. The Fast track asks Industry, Jurisdiction, Crypto in use, Data sensitivity, Compliance and Migration status; the Full track adds the other seven.',
      },
      {
        heading: 'Answering and Navigating',
        body: 'Each question shows what your answer changes in the report and a "Why we ask" note. Use Back and Continue to move between questions; Compliance, Use cases and Infrastructure can be skipped with Skip. Where you do not know an answer, choose "I\'m not sure" and the report applies a stated default instead. Save link copies a link that resumes from the current step, and Reset clears all answers. After the last question, Review answers opens a summary where any answer can be edited before the report is generated.',
      },
      {
        heading: 'What the Scoring Covers',
        body: 'The report turns your answers into an educational priority index from 0 to 100, built from four weighted categories: Quantum Exposure, Migration Complexity, Regulatory Pressure and Organizational Readiness. The weights are editorial choices that vary by industry profile, so the index is a planning aid and not a measured risk probability, a graded result or an external benchmark. The Full track also unlocks the per-domain risk breakdown and progress over time; on the Fast track those two sections stay locked.',
      },
      {
        heading: 'After You Finish',
        body: 'The completion screen offers View my risk report, Retake and, on the Fast track, a Continue button for the remaining questions. Your industry and country answers also feed the For You view on the Compliance page and the context line on the Command Center.',
      },
    ],
    tips: [
      'Your answers are saved in this browser (local storage), so they survive a page refresh; if you return to an unfinished assessment within 24 hours, a prompt offers to resume it.',
      'Under each question, "In your report" says what that answer changes, so you can see which answers matter before you choose.',
    ],
  },

  report: {
    title: 'Readiness Report',
    summary:
      'View the educational report generated from your assessment answers, with a priority index, findings, compliance and migration context and recommended actions. It is a planning aid built from what you entered, not a formal evaluation or a certification.',
    sections: [
      {
        heading: 'Report Contents',
        body: 'The report covers Country PQC Migration Timeline, Educational Priority Index, Quantum Readiness Assessment, Key Findings, Risk Breakdown, Executive Summary, Assessment Profile, HNDL / HNFL Risk Windows, Cryptographic Discovery, Cryptographic Bill of Materials (CBOM), Candidate Algorithm Transitions, Compliance Impact, Recommended Actions, Migration Roadmap, Migration Toolkit, Third-Party & Vendor PQC Risk, ROI & Financial Case, Progress Over Time, Industry Threat Landscape and Simulation Outcomes, plus a NICE Workforce Gap Report on your own report. Your role decides which sections are shown, so the table of contents (with Expand all and Collapse) lists only what applies. Risk Breakdown and Progress Over Time need the Full track and show a locked notice after a Fast-track assessment; Progress Over Time also waits until at least two Full-track assessments have been saved.',
      },
      {
        heading: 'The Priority Index',
        body: 'The Educational Priority Index (0 to 100) comes from four weighted categories: Quantum Exposure, Migration Complexity, Regulatory Pressure and Organizational Readiness. Higher means the model suggests investigating earlier. It is not a measured risk probability, a graded result or an external benchmark, and selecting a compliance framework adds modelled pressure without establishing that the framework applies to you. The "How this was calculated" disclosure under the index shows the working, and the info button next to the generation date opens "How This Report Works", which also explains how "I\'m not sure" answers are handled.',
      },
      {
        heading: 'Recommendations and Links',
        body: 'Recommended Actions list the next steps the model suggests for your answers, and can open the Migrate page filtered to the related products. Compliance Impact links each framework to its entry on the Compliance page. Which sections and calls to action appear depends on your selected role.',
      },
      {
        heading: 'Sharing, Printing and Export',
        body: 'The Share button in the top bar copies or shares a link that opens the same report for the recipient; the link carries a share token (?share=). Older links built from individual parameters (?i=industry, ?cy=country and so on) still open, as an approximate view recomputed from what they carry. At the bottom of the report, Print / Save as PDF (Download report (PDF) for roles without the board exports) and Export CSV are always there; depending on your role you also see Print Executive Brief, a board pack export or an engineering plan export. Edit Answers returns to the assessment and Start Over clears it.',
      },
    ],
    tips: [
      'Complete the Assessment first; a Full-track assessment fills in more of the report than a Fast-track one.',
      "A shared link shows the sender's report to the recipient without changing the recipient's own saved assessment.",
    ],
  },

  'business-center': {
    title: 'Command Center',
    summary:
      'A worked-example command center organised around the NIST CSWP.39 Fig. 3 Crypto Agility Strategic Plan. Use it to learn the shape of a PQC programme: create planning artifacts, follow next steps and see which part of the plan each belongs to.',
    sections: [
      {
        heading: 'Getting Started',
        body: 'Until you have started something (an assessment, a tracked compliance framework, a bookmarked product, or an Executive or governance learning module), the page shows a welcome state with a short introduction for your role, a "Start with these tools" row, an Explore Compliance button and a learning button for your role. Complete the Risk Assessment to fill the context line with your industry, country and the date you last assessed.',
      },
      {
        heading: 'Next Steps and What Applies',
        body: 'Your next steps lists the most useful actions first (three, four or five of them, depending on the Density shown in the banner at the top of the page, which follows your role and experience level), followed by a card summarising what applies to your profile.',
      },
      {
        heading: 'The Six Zones',
        body: 'The plan has six zones: Governance, Assets, Management Tools, Data-Centric Risk Management, Mitigation and Migration. Select a zone in the diagram or in the Zones list to open its panel. In the Zones list (shown at Intermediate and Advanced density), Focus shows only the open zone and Show all brings the others back. A link ending in ?zone= and a zone id (for example governance) opens that zone directly.',
      },
      {
        heading: 'Artifacts',
        body: "Each zone panel lists the artifacts you have saved as cards, and placeholders for the artifact types you have not created yet; select a placeholder to start one. A card opens in the artifact drawer, where you can view it, edit it in that type's builder, export it as Markdown or PDF, or delete it; click a card's title to rename it. Artifacts are saved in this browser (local storage) and persist across sessions on the same device.",
      },
      {
        heading: 'Filter & Export',
        body: 'At Advanced density a toolbar above the page filters your artifacts by type and Export ZIP downloads the filtered artifacts as pqc-artifacts.zip. At other densities the same artifacts are reachable from their zone panels.',
      },
      {
        heading: 'Learning Bar',
        body: "The bar at the bottom tracks the six Executive Learning Path modules. For roles other than Executive it is labelled as optional context for your role, because it is the Executive path rather than your own; open Learn for your role's path. It starts collapsed at Advanced density.",
      },
    ],
    tips: [
      'Complete the Assessment to fill the context line with your industry and country.',
      'The page is a worked example, not a live GRC console: use it to learn the structure, then build your own programme records off-platform.',
    ],
  },

  learn: {
    title: 'Learning Center',
    summary:
      'Structured PQC education: 75 modules in nine tracks, from foundations through protocols, infrastructure, governance and industry topics, with hands-on workshops where a module has them. The Practice quiz is a separate entry.',
    sections: [
      {
        heading: 'Finding a Module',
        body: 'The Learn page has three views. My Path shows a sequence tuned to the role you picked in the top bar. Browse all lists every module and can be narrowed by track, search, status and saved modules, in a grid or a list. Guided routing asks about your migration situation and points to a first module or page, with a framework crosswalk. The Practice quiz button opens the quiz.',
      },
      {
        heading: 'Module Tracks',
        body: 'Modules are organised into nine tracks: Role Guides, Foundations, Strategy, Protocols, Hardware Infrastructure, Software Infrastructure, Applications, Governance & Risk and Industries. Browse all shows a chip for each track with its module count.',
      },
      {
        heading: 'Module Tabs',
        body: 'Each module opens on Learn (the lessons). Depending on the module it also has Visual, Workshop (hands-on exercises), Exercises, References and Tools & Products tabs.',
      },
      {
        heading: 'Progress Tracking',
        body: 'Inside a module, a progress panel lists its lesson sections with checkmarks and shows a percentage, plus workshop progress where the module has a workshop. Your progress is saved in this browser (local storage) and survives a refresh on the same device.',
      },
      {
        heading: 'Navigation',
        body: "On a module's Learn tab, Mark as Read marks every lesson section done. On the Workshop tab, use Previous Step and Next Step (or the step chips) to move through the exercises; the last step offers Complete Module. When all of a module's workshop steps are done, a prompt links to the next module in your role's path if there is one.",
      },
      {
        heading: 'Achievements',
        body: 'Badges are awarded for learning activity such as workshop steps, modules and tracks, and also for using other parts of the Hub; a toast appears when you unlock one. The badge collection is shown on the Home page score card and in the Journey tab of the right-hand panel.',
      },
    ],
    tips: [
      'Start with the Foundations track if you are new to PQC, or pick a role first so My Path can order the modules for you.',
      'Workshop exercises that use WebAssembly cryptography run locally in your browser.',
      'The Practice quiz draws on questions across many topics, filtered by your role and the difficulty you choose.',
    ],
  },

  faq: {
    title: 'Frequently Asked Questions',
    summary:
      'Browse common questions about post-quantum cryptography, the PQC Today platform, and how to get started with your migration planning.',
    sections: [
      {
        heading: 'Category Navigation',
        body: 'Questions are organized by category with quick-link pills at the top. Select a category pill to jump to that section. Each question opens when you select it.',
      },
      {
        heading: 'Search',
        body: 'Use the search bar to filter questions across all categories. A question is shown only if it contains every word you type, in the question or in its answer.',
      },
      {
        heading: 'Your Role',
        body: 'When you have picked a role, a "Start here" block above the categories leads with the three questions that role asks first, and role-matching questions float to the top of their category with a "For you" tag. Nothing is hidden: the full list is always below.',
      },
      {
        heading: 'Learn More Links',
        body: 'Each open answer ends with a Learn more link to the page or module where the topic is covered in depth.',
      },
    ],
    tips: [
      "Can't find your answer? The Assistant tab in the right-hand panel opens the PQC Assistant; the button at the bottom of this page opens the About page, which describes it.",
    ],
  },
}
