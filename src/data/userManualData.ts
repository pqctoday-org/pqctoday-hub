// SPDX-License-Identifier: AGPL-3.0-only

export type PageId =
  | 'timeline'
  | 'algorithms'
  | 'library'
  | 'playground'
  | 'openssl-studio'
  | 'threats'
  | 'leaders'
  | 'patents'
  | 'compliance'
  | 'migrate'
  | 'assess'
  | 'report'
  | 'business-center'
  | 'learn'
  | 'navigate'
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
      'Compare published post-quantum migration records — standards, guidance, policy and deadlines — across countries and international bodies, each linked to its source.',
    sections: [
      {
        heading: 'Region & Country Filters',
        body: 'Use the region dropdown, or a Coverage-by-region tile, to show Americas, EU (the Europe group, including the UK, Norway and Switzerland), MENA, APAC or Global (international bodies such as the G7, IETF, ITU-T and ETSI). Pick a country to narrow further and to open its Documents panel. Filters are kept in the URL (?region=, ?country=, ?q=) so a filtered view can be shared.',
      },
      {
        heading: 'Gantt Chart',
        body: "Each country has one row per phase type: Discovery, Testing, POC, Migration, Standardization, Guidance, Policy, Regulation, Research or Deadline. Bars are phases with a start and end year; flags are dated milestones, with a number when one year holds several, and a thin line when a milestone states a span. The Organization column names the body behind each row. Click a bar or flag to open that year's record; when a row groups several records, the popover lists them all so each can be opened.",
      },
      {
        heading: 'Search & Quick Filters',
        body: 'Search matches countries, issuing bodies and each record\'s title, description and identifiers (for example "FIPS 203" or "TR-02102"). The phase and type dropdowns narrow the chart (?phase=, ?etype=), and Deadlines (?deadlines=1) shows deadline records only. A deadline that states a range counts at its end year.',
      },
      {
        heading: 'Records, Binding Force & Evidence',
        body: 'A record shows who issued it, its period, how binding the source is (binding, mandatory in scope, official target, recommendation, draft or informational), its HARD/SOFT mandate label where one has been reviewed, its evidence score, its review history, and links to the Library documents and compliance frameworks that cite it. In the Documents panel, switch between Cards and Table (?docview=table). A link to one record is /timeline?event=<record id>; a link to a retired record opens the record that replaced it when the dataset names one.',
      },
      {
        heading: 'Export & Sharing',
        body: 'Export (in the header or the chart toolbar) downloads one CSV row per record in the current view, with its issuer, dates, source, mandate label and binding force. The operations view also offers a calendar (.ics) export of the same records. Years are year-level: a calendar entry marks the year, not a day.',
      },
      {
        heading: 'Endorsements & Flags',
        body: 'Use Endorse or Flag on a country row or a record to send feedback about its accuracy.',
      },
    ],
    tips: [
      'Bookmark a filtered URL to quickly return to a specific region view.',
      'A country-level record does not establish that a milestone applies to your organization; open its source to check scope.',
    ],
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
      'Search and browse post-quantum cryptography standards, drafts, RFCs, guidance and research from NIST, IETF, ETSI and other organizations. Each record says what the document is, where it stands in its lifecycle, and links to the official source.',
    sections: [
      {
        heading: 'Where to start',
        body: 'Three purpose doors (Learn, Reference, Plan migration) narrow the catalogue by why you are here. With a role selected, Start here suggests three documents for it, and the New & updated strip lists documents added or revised recently.',
      },
      {
        heading: 'Search & Filters',
        body: 'Type in the search bar to search titles, summaries, reference IDs and tags. The left rail filters by quick view (All, New & updated, Certification starter set, Bookmarked), by the 13 categories and by lifecycle status; the toolbar adds organization, geography, sector, trust tier, algorithm family and research topic. With a role selected, the list starts narrowed to that role\'s focus areas; "Show all documents" turns that off.',
      },
      {
        heading: 'View Toggle',
        body: 'Switch between Card view and Tree Table view in the toolbar. Card view shows document summaries; the Tree Table lists the documents that match your filters, with sortable columns and nests, under each document, the documents that build on it.',
      },
      {
        heading: 'Document Details',
        body: "Open any document to see its catalogue summary, status and dates, the documents it builds on, earlier revisions, the catalogue's classification tags, the Learn modules that use it, and a direct link to the source.",
      },
      {
        heading: 'Export',
        body: 'Export the filtered list as CSV, or export citations for the filtered list or your bookmarks as BibTeX or CSL-JSON.',
      },
    ],
    tips: [
      'Use ?ref=REFERENCE_ID to deep-link directly to a document; a retired ID opens the document that replaced it.',
      'URL params: ?purpose=, ?cat=, ?org=, ?geo=, ?sector=, ?tier=, ?algo=, ?topic=, ?lifecycle=, ?cswp39=1, ?q=, ?sort= and ?view=cards|table combine into shareable filtered views.',
      'On other pages, ?spec=REFERENCE_ID opens a document in place without leaving the page.',
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
        body: 'The /playground/hsm route emulates a PKCS#11 v3.2 HSM via SoftHSMv3 WASM in four modes. Learn runs guided lessons in three tracks: PKCS#11 Foundations, v3.2 & the PQC transformation, and PKCS#11 v3.3 (working draft). Operate has seven panels: KEM, Symmetric Encrypt, Key Wrap / Unwrap, Hashing, Sign & Verify, Key Agreement and KDF. Build holds the test suites (standard KATs, selected NIST ACVP-Server reference samples, conformance, and v3.3). Inspect shows the mechanism list, the call log and the keys on the token. Supports C++, Rust, and Dual engine modes with parity cross-check.',
      },
      {
        heading: 'KMIP Control Plane',
        body: 'The /playground/cacp route is a KMIP 3.0 key-management control plane running in the browser, with Learn, Policy, Operate, Inspect, Dev and Migration Estate tabs. Switch a crypto-agility policy and watch new keys and operations move to post-quantum algorithms.',
      },
      {
        heading: 'Individual Tools',
        body: 'Each workshop tool has its own route at /playground/:toolId with lazy-loaded components, breadcrumb navigation, and community endorse/flag buttons. Step-based tools open at a given step with ?step=N (counting from 0), and the TPM 2.0 Playground keeps its open tab in ?tab=.',
      },
      {
        heading: 'Command Palette',
        body: 'On a laptop, press ⌘K (Ctrl-K) or / on the /playground page to search every tool, task and full playground by name, algorithm or keyword. Algorithm nicknames such as Kyber, Dilithium and SPHINCS find the standard ML-KEM, ML-DSA and SLH-DSA tools.',
      },
    ],
    tips: [
      'All generated keys are for educational purposes only — not for production use.',
      'The Logs tab records every operation with timestamps for review.',
      'Use the HSM Playground to understand how real HSMs handle PQC operations via PKCS#11.',
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
    title: 'Community',
    summary:
      'An evidence-linked directory of people and organizations named in post-quantum research, standards, policy, patent and open-source sources. Inclusion is not an endorsement, a ranking or a certification.',
    sections: [
      {
        heading: 'Curated profiles and document contributors',
        body: 'The directory opens on the hand-curated profiles. "Show all contributors" adds the document-contributor profiles, created from the author lists of documents in the Library (the link form is ?all=1). The page shows the current count of each.',
      },
      {
        heading: 'Filters and views',
        body: 'Filter by category, region and country, or sector (Public, Private, Academic), or search by name, role, organization or bio. Three views show the same results: Sector Stack (people grouped by sector; choose a sector to narrow the list), Cards, and Table (sortable columns, including Category). Name order ignores titles such as "Dr." and "Prof.", and people with no recorded country sort last.',
      },
      {
        heading: 'What a profile links to',
        body: 'Open a card or a table row to read the full role, organizations and bio, and the cited evidence: "Cited in the Library" opens each document in the Library, "External sources" opens the cited pages, "View patents" opens the person\'s patent records, and catalog products open in Migrate. "Events from <country>" appears when the Timeline has events for that country.',
      },
      {
        heading: 'Links you can share',
        body: '?leader=<id> opens one profile (old links to merged or renamed profiles forward to the current one). Filters are kept in the address too: ?cat=, ?region=, ?country=, ?sector=, ?q=, ?mode=stack|cards|table, ?layer= (a Sector Stack sector) and ?sort=.',
      },
      {
        heading: 'Reading a profile critically',
        body: 'A profile is a starting point, not a verdict. The recorded source details (institutions in source metadata, review flags, "profile sources checked" dates) say what was recorded, not that anyone endorsed the person or their work. Check the claim in the linked primary source, and check its date and version.',
      },
    ],
    tips: [
      'Profiles are compiled from cited public sources and from people who ask to be listed; anyone listed can ask for a correction or removal from the page.',
      "Export CSV includes each profile's Library refs, external sources, patents and catalog products, so you can check them in bulk.",
    ],
  },

  patents: {
    title: 'PQC Patents',
    summary:
      'An educational catalogue of US patent records that touch post-quantum cryptography. Use it to see which algorithms, protocols and hardware the claims describe and who holds them. It records what each filing discloses and claims; it does not tell you whether a patent is valid, enforceable against you, or licensed, and it is not legal or IP advice.',
    sections: [
      {
        heading: 'Scope: PQC & hybrid or All crypto',
        body: 'The page opens on records that use post-quantum or hybrid cryptography. All crypto adds the remaining records, including ones that are quantum-safe without a PQC algorithm (AES-256 or SHA-2/3 strength, lattice homomorphic encryption, quantum key distribution) and classical-only ones. Records outside the patents scope were retired from the catalogue, not deleted. A shared link to a record outside your current scope widens it (with Undo on a computer).',
      },
      {
        heading: 'Granted patents and published applications',
        body: 'A granted patent has been examined and its claims allowed on the grant date. A published application (an 11-digit US number beginning with the year) is an application the patent office has published; the publication alone gives no current prosecution status. The patent office record records any subsequent grant or abandonment. The Granted / pub. column, the detail panel and the export say which each record is.',
      },
      {
        heading: 'Impact level and PQC migration score',
        body: 'Each record has a 1–10 PQC migration score with a one-sentence reason, shown in the detail panel. The Hub impact score (0–100) takes half from what the record names (FIPS 203/204/205 standards, protocols, hardware, application domains, data types protected) and half from the migration score; High is 72 or more (about the top fifth of the catalogue), Medium 35–71, Low below 35. Both are reading aids for this catalogue, not measures of patent value.',
      },
      {
        heading: 'Explore, Insights and Search',
        body: 'Explore lists the records with filters for filing office, agility, impact and domain; More filters adds assignee, PQC algorithm, protocol, classical algorithm, hardware, NIST status, publication type and, under All crypto, quantum-safe basis. Algorithms named by their filing-era name (Kyber, Dilithium, SPHINCS+, Falcon) are counted and filtered together with their FIPS name. Insights charts the corpus; clicking a bar opens Explore filtered to it. Search finds records by meaning as well as words.',
      },
      {
        heading: 'What a record does not tell you',
        body: 'The catalogue records assignees, claims and dates. It records no licensing terms, patent-pledge commitments or history of assertion, and it is not a complete search of patent offices. Treat the holders it lists as people to ask, and take questions of freedom to operate to your own counsel.',
      },
    ],
    tips: [
      'In the detail panel, click an algorithm, protocol or hardware tag to see every record that names it; a standard the Library holds opens there.',
      'The role panel above the list links a holder to /migrate only when the holder is a vendor in the Migrate catalogue.',
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
      'Browse the catalogue of software products, each with its own PQC status, organized across 9 infrastructure layers with certification cross-references and migration planning tools.',
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
      'Structured PQC education: 85 modules in nine tracks, from foundations through protocols, infrastructure, governance and industry topics, with hands-on workshops where a module has them. The Practice quiz is a separate entry.',
    sections: [
      {
        heading: 'Finding a Module',
        body: 'The Learn page has four views. Your journey holds your objectives, their steps and your role map, and keeps them on this device. Recommended order shows a sequence tuned to the role you picked in the top bar. All modules lists every module and can be narrowed by track, search, status and saved modules, in a grid or a list. Guided routing asks about your migration situation and points to a first module or page, with a framework crosswalk. The Practice quiz button opens the quiz.',
      },
      {
        heading: 'Module Tracks',
        body: 'Modules are organised into nine tracks: Role Guides, Foundations, Strategy, Protocols, Hardware Infrastructure, Software Infrastructure, Applications, Governance & Risk and Industries. All modules shows a chip for each track with its module count.',
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
        body: 'Badges are awarded for learning activity such as workshop steps, modules and tracks, and also for using other parts of the Hub; a toast appears when you unlock one. The badge collection is shown on the Home page score card and at the top of Role map in Learn › Your journey.',
      },
    ],
    tips: [
      'Start with the Foundations track if you are new to PQC, or pick a role first so Your journey and Recommended order can order the modules for you.',
      'Workshop exercises that use WebAssembly cryptography run locally in your browser.',
      'The Practice quiz draws on questions across many topics, filtered by your role and the difficulty you choose.',
    ],
  },

  navigate: {
    title: 'Navigate: the knowledge graph',
    summary:
      'A 3D map of how the hub’s records connect. Each node is a record from one of the hub’s data sets and each line is a relationship recorded in that data. The graph teaches how standards, algorithms, protocols, compliance frameworks, products and vendors refer to each other; it does not validate any of them.',
    sections: [
      {
        heading: 'Twelve kinds of record',
        body: 'Nodes are coloured by category: Trusted source, Crypto mechanism, Industry, Use case, Compliance, Standard, Glossary, Product, Protocol, Patent, Community and Vendor. A bigger, darker node has more recorded connections in this graph. That is a count of links in the data, not a measure of importance, trust or maturity.',
      },
      {
        heading: 'Zooming and labels',
        body: 'Labels change with distance. From far away you see the category names, closer in the sub-category names, and close up the names of single records. The Labels slider sets how many labels can show at once; labels never overlap.',
      },
      {
        heading: 'Filters and the node count',
        body: 'Filters turns categories and sub-categories on and off. The Nodes slider sets how many records are drawn; each category contributes its most-connected records first, so a record that is not drawn is not missing from the data. The line under the sliders shows how many records and links are drawn out of the whole graph.',
      },
      {
        heading: 'Finding a record',
        body: 'Search (or the search box at the top of Filters) finds any record by name across the whole graph, including records the node count or the filters leave out. Picking one draws it, opens its details and flies the camera to it. List view (keyboard) lists the drawn records for keyboard and screen-reader use and does the same.',
      },
      {
        heading: 'Spotlight',
        body: 'Click a category or sub-category label to spotlight it: the camera frames it and every other record is hidden. The chip at the top names the spotlight; Show all or Escape returns to the whole graph. Clicking empty space also ends it, but releasing a drag does not.',
      },
      {
        heading: 'Record details',
        body: 'Clicking a record opens its details: what it is, links to its page in the hub (and to Learn modules or tools that cover it), and its connections grouped by relationship. A connection marked "name match" was found because one record’s text uses the other’s name; "family match" means a source named an algorithm family and the link goes to every parameter set of it. Unmarked connections come from a field that cites that exact record.',
      },
      {
        heading: 'Guided tour and motion',
        body: 'Spin turns the graph slowly. Tour visits each category and then its most-connected records, with a caption naming each one and, on a wider screen, its details panel open (on a phone the panel would cover the tour controls, so only the caption shows). Pause, Previous and Next control the tour; dragging the view also pauses it, and Resume carries on from the current stop.',
      },
      {
        heading: 'Sharing a view',
        body: 'The address bar follows what you have open: ?node= for a record, ?type= and ?sub= for a spotlight. The Share button in the top bar copies that link, and opening it shows the same record or spotlight.',
      },
    ],
    tips: [
      'A link records a reference in the dataset, not a validation. Before relying on one, open the cited document or the official register (for example CMVP for FIPS 140-3 certificates).',
      'If the canvas feels busy, spotlight one category or lower the Nodes slider, then follow connections from the details panel.',
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
