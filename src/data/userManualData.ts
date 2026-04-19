// SPDX-License-Identifier: GPL-3.0-only

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
    tips: [
      'Bookmark a filtered URL to quickly return to a specific region view.',
      'Timeline data updates automatically when new government milestones are published.',
    ],
  },

  algorithms: {
    title: 'PQC Algorithms',
    summary:
      'Compare post-quantum cryptographic algorithms side-by-side, explore transition paths from classical to quantum-safe, and analyze performance characteristics.',
    sections: [
      {
        heading: 'Transition Tab',
        body: 'Shows how classical algorithms (RSA, ECDH, ECDSA) map to their PQC replacements (ML-KEM, ML-DSA, SLH-DSA). Each card shows the classical algorithm on the left and its quantum-safe successor on the right.',
      },
      {
        heading: 'Detailed Comparison Tab',
        body: 'Deep-dive into individual PQC algorithms with four sub-tabs: Performance (benchmarks and timing), Security (levels and threat analysis), Sizes (key, ciphertext, and signature sizes), and Use Cases (recommended applications). A baseline algorithm is auto-selected for comparison (ECDH P-256 for KEM, RSA-2048 for Signatures). Filter by crypto family, function group, or security level.',
      },
      {
        heading: 'Compare Panel',
        body: 'Select up to 3 algorithms to compare side-by-side. Click the compare icon on algorithm cards to add them to the comparison bar at the bottom of the page. The panel shows a detailed table comparing all properties.',
      },
      {
        heading: 'URL Parameters',
        body: 'Deep link to specific views: ?tab=transition|detailed, ?subtab=performance|security|sizes|usecases, ?highlight= to highlight algorithms, ?compare= for pre-selected comparisons. Use the Share button to copy a link to your current selection.',
      },
    ],
    tips: [
      'Use the Detailed tab filters to quickly narrow down algorithms by security level or standardization status.',
      'The compare panel is great for preparing algorithm selection reports.',
      'Switch between sub-tabs (Performance, Security, Sizes, Use Cases) for focused analysis.',
    ],
  },

  library: {
    title: 'PQC Library',
    summary:
      'Search and browse 372+ post-quantum cryptography standards, drafts, RFCs, and reference documents from NIST, IETF, ETSI, and other organizations.',
    sections: [
      {
        heading: 'Search & Filters',
        body: 'Type in the search bar to search across titles, descriptions, and tags. Use the category sidebar to filter across 10 categories (Digital Signature, KEM, PKI Certificate Management, Protocols, Government & Policy, NIST Standards, International Frameworks, Migration Guidance, Algorithm Specifications, Industry & Research). Filter by organization or industry. Persona-aware category boosting surfaces the most relevant categories for your role.',
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
      'URL params: ?cat=, ?org=, ?ind=, ?sort=, ?view=cards|table are all combinable for shareable filtered views.',
    ],
  },

  playground: {
    title: 'Interactive Playground',
    summary:
      'Generate real post-quantum cryptographic keys, encrypt data, and sign messages directly in your browser using WebAssembly. 21 workshop tools, an interactive crypto lab, and a full PKCS#11 HSM emulator — all running locally.',
    sections: [
      {
        heading: 'Workshop Grid',
        body: 'The main /playground view shows a searchable catalog of 21 workshop tools across 6 categories: HSM / PKCS#11, Entropy & Random, Certificates & Proofs, Protocol Simulations, Blockchain & Digital Assets, and OpenSSL Studio (includes TLS 1.3 Simulator). Persona-aware filtering highlights recommended tools with difficulty badges (beginner/intermediate/advanced).',
      },
      {
        heading: 'Interactive Crypto Lab',
        body: 'The /playground/interactive route provides 7 tabs: Key Store (keypair generation), Data (hex editor), KEM & Encrypt (ML-KEM + X25519 ECDH), Sym Encrypt (AES/ChaCha), Hash (SHA/SHAKE), Sign & Verify (PQC + classical), and Logs (operation history). Use ?tab= to deep-link to specific operations.',
      },
      {
        heading: 'HSM Playground',
        body: 'The /playground/hsm route emulates a PKCS#11 v3.2 HSM via SoftHSMv3 WASM with 10 tabs: Keystore, Symmetric, Key Wrap, Hashing, Sign/Verify, Key Agreement, Key Derivation, Mechanisms, ACVP (NIST KAT vectors), and Logs. Supports C++, Rust, and Dual engine modes with parity cross-check.',
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
      'Interactive OpenSSL v3.6.1 environment running entirely in your browser via WebAssembly. Build and execute real OpenSSL commands with a visual workbench.',
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
        body: 'Click a leader card to see their full profile: organization, contributions to PQC, key publications, and links to related library resources. 71 leaders are currently profiled.',
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
      'Map compliance and certification frameworks to PQC requirements across industries. Track FIPS 140-3, Common Criteria, ACVP, and other certification schemes across 5 tabs.',
    sections: [
      {
        heading: 'Five Tabs',
        body: 'The page has 5 tabs: Standardization Bodies (standards orgs), Technical Standards (technical specifications), Certification Schemes (FIPS/ACVP/CC programs), Compliance Frameworks (regulatory requirements), and Cert Records (searchable FIPS/ACVP/CC product certification records with pagination).',
      },
      {
        heading: 'Landscape Tabs (Bodies, Standards, Schemes, Frameworks)',
        body: 'Each landscape tab shows cards for compliance entries, filterable by organization, industry, and search. Persona and industry context hints appear at the top to guide exploration.',
      },
      {
        heading: 'Cert Records Tab',
        body: 'Searchable database of FIPS, ACVP, and Common Criteria certification records. Filter by PQC algorithm, category, source, vendor, and module category (?mcat=). Supports pagination and deep-linking via ?cert= to open a specific record.',
      },
      {
        heading: 'Framework Details',
        body: 'Click any framework row to see full details: requirements, timelines, affected algorithms, and references to related library documents and timeline milestones.',
      },
    ],
    tips: [
      'Compliance data is automatically updated daily via the compliance scraper.',
      'Framework entries cross-reference both Library documents and Timeline milestones.',
      'URL params: ?tab=standards|technical|certification|compliance|records, ?org=, ?ind=, ?q=, ?cert=, ?mcat=.',
    ],
  },

  migrate: {
    title: 'Migration Catalog',
    summary:
      'Browse 521+ PQC-ready software products organized across 9 infrastructure layers with certification cross-references and migration planning tools.',
    sections: [
      {
        heading: 'Infrastructure Layer Stack',
        body: 'Products are organized across 9 layers: Cloud, Network, Application Servers, Libraries & SDKs, Security Software, Database, Security Stack, Operating Systems, and Hardware & Secure Elements. Click a layer to filter. The stack shows readiness counts per layer.',
      },
      {
        heading: 'Product Search & Filters',
        body: 'Search by product name or vendor. Filter by infrastructure layer, category, sub-category, vendor, verification status, and migration step. Persona-based recommendations highlight relevant layers. URL params: ?q=, ?layer=, ?cat=, ?vendor=, ?verification=, ?sort=, ?mode=stack|cards|table, ?subcat=, ?step=, ?industry=.',
      },
      {
        heading: 'Product Details',
        body: 'Click any product to see its full migration profile: current PQC support, migration timeline, certification status (FIPS/ACVP/CC cross-references), vendor links, and product briefs.',
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
      "Complete a guided assessment wizard to evaluate your organization's PQC readiness. Choose Quick (6 steps, ~2 min) or Comprehensive (13 steps, ~5 min) mode.",
    sections: [
      {
        heading: 'Assessment Modes',
        body: 'Quick mode covers 6 essential questions (Industry, Country, Crypto, Sensitivity, Compliance, Migration) for a rapid readiness check. Comprehensive mode adds 7 deeper steps: Use Cases, Data Retention, Credential Lifetime, Organization Scale, Crypto Agility, Infrastructure, and Timeline Pressure.',
      },
      {
        heading: '13 Comprehensive Steps',
        body: 'Industry → Country → Crypto Stack → Data Sensitivity → Compliance → Migration Status → Use Cases → Data Retention → Credential Lifetime → Organization Scale → Crypto Agility → Infrastructure → Timeline Pressure. Four risk categories scored: Strategic, Operational, Compliance, and Vendor.',
      },
      {
        heading: 'Progress & Navigation',
        body: 'A progress bar shows your position in the wizard. You can navigate back to previous steps to change answers. Your progress is saved automatically — you can leave and resume later.',
      },
      {
        heading: 'Results',
        body: 'After completing the assessment, you are directed to the Report page with personalized recommendations based on your answers. The assessment also pre-filters other pages (Compliance, Migrate) for your context.',
      },
    ],
    tips: [
      'Your assessment data persists in localStorage — it survives page refreshes.',
      'Persona-based mode recommendations appear on the mode selector to help you choose.',
    ],
  },

  report: {
    title: 'Readiness Report',
    summary:
      'View your personalized PQC readiness report generated from your assessment responses, with actionable recommendations and links to relevant resources.',
    sections: [
      {
        heading: 'Report Overview',
        body: 'The report summarizes your PQC readiness across multiple dimensions: risk level, compliance gaps, migration priority, and recommended next steps. Includes Board Brief, KPI Trending, Migration Roadmap, ROI Calculator, and HNDL/HNFL risk window analysis.',
      },
      {
        heading: 'Recommendations',
        body: 'Each section includes specific, actionable recommendations tailored to your industry, country, and cryptographic stack. Persona-aware CTAs adapt the report sections to your role. Recommendations link to relevant pages (Compliance, Migrate, Library) for deeper exploration.',
      },
      {
        heading: 'URL Hydration & Sharing',
        body: 'Reports can be shared via URL parameters encoding your assessment context (?i=industry, ?cy=country, ?c=crypto, ?d=sensitivity, ?f=frameworks, etc.). Recipients see the same personalized view. Supports Print/PDF output.',
      },
      {
        heading: 'Navigation & History',
        body: 'Action buttons link directly to pre-filtered views on the Compliance and Migrate pages. Assessment snapshots provide historical tracking of readiness changes over time.',
      },
    ],
    tips: [
      'Complete the Assessment wizard first for the most accurate report.',
      'Share the report URL with colleagues — it encodes your assessment context.',
    ],
  },

  'business-center': {
    title: 'Command Center',
    summary:
      'Your PQC readiness command center for managing risk artifacts, compliance documents, governance plans, vendor evaluations, and action items.',
    sections: [
      {
        heading: 'Getting Started',
        body: 'The welcome state shows CTA buttons to begin: Risk Assessment, Compliance Review, and Executive Learning Track. Complete the assessment first to populate your context banner with industry and country.',
      },
      {
        heading: 'Artifact Sections',
        body: 'Five sections organize your work: Risk Management, Compliance & Regulatory, Governance, Vendor/Supply Chain, and Action Items. Each section contains artifact cards that you can create, edit, and manage.',
      },
      {
        heading: 'Artifact Drawer',
        body: 'Click any artifact card or the "New" button to open the artifact drawer. Write and edit documents with rich text. Artifacts are saved to localStorage and persist across sessions.',
      },
      {
        heading: 'Filter & Export',
        body: 'Filter artifacts by type using the dropdown. Export all artifacts as a ZIP file for offline use or to share with your team.',
      },
    ],
    tips: [
      'Complete the Assessment wizard to populate the context banner with your industry and country.',
      'The Learning Bar at the bottom links to relevant executive learning modules.',
    ],
  },

  learn: {
    title: 'Learning Center',
    summary:
      'Structured PQC education with 50 interactive modules covering PKI fundamentals, quantum threats, hybrid cryptography, industry-specific topics, and hands-on workshops.',
    sections: [
      {
        heading: 'Module Tracks',
        body: 'Modules are organized into tracks: Foundations, Applied Crypto, Industry, Advanced, and Role Guides. Use the sidebar or dashboard to browse by track. Each track builds on the previous one.',
      },
      {
        heading: 'Learn & Workshop Tabs',
        body: 'Each module has two tabs: Learn (educational content with step-by-step lessons) and Workshop (hands-on interactive exercises). Complete both to earn full module credit.',
      },
      {
        heading: 'Progress Tracking',
        body: 'The sidebar shows completion status for each module with checkmarks. Your progress is saved automatically. The dashboard view shows overall track completion percentages.',
      },
      {
        heading: 'Navigation',
        body: 'Use the Previous/Next buttons to navigate between lesson steps within a module. The "Next Module" CTA appears when you complete a module to guide you to the recommended next topic.',
      },
      {
        heading: 'Achievements',
        body: 'Earn achievement badges as you complete modules, tracks, and milestones. Achievement toasts appear when you unlock new badges. View your full collection in the progress dashboard.',
      },
    ],
    tips: [
      'Start with the Foundations track if you are new to PQC.',
      'Workshop exercises use real WASM-based crypto — all operations run locally in your browser.',
      'The quiz module tests your knowledge across all tracks.',
    ],
  },

  faq: {
    title: 'Frequently Asked Questions',
    summary:
      'Browse common questions about post-quantum cryptography, the PQC Today platform, and how to get started with your migration planning.',
    sections: [
      {
        heading: 'Category Navigation',
        body: 'Questions are organized by category with quick-link navigation pills at the top. Click a category pill to jump directly to that section.',
      },
      {
        heading: 'Search',
        body: 'Use the search bar to filter questions across all categories. Multi-term search is supported — results match any word in both questions and answers.',
      },
      {
        heading: 'Deep Links',
        body: 'Each answer includes direct links to relevant app pages and features for further exploration.',
      },
    ],
    tips: [
      'Can\'t find your answer? Use the "Ask the PQC Assistant" button at the bottom to chat with the AI assistant.',
    ],
  },
}
