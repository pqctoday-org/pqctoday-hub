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
        body: 'Deep-dive into individual PQC algorithms. Filter by crypto family (KEM, Signature) or function type. Click any algorithm card to see full specifications including key sizes, ciphertext sizes, security levels, and performance benchmarks.',
      },
      {
        heading: 'Compare Panel',
        body: 'Select up to 3 algorithms to compare side-by-side. Click the compare icon on algorithm cards to add them to the comparison bar at the bottom of the page. The panel shows a detailed table comparing all properties.',
      },
      {
        heading: 'URL Parameters',
        body: 'Algorithms can be highlighted via URL parameters for deep linking. Use the Share button to copy a link to your current selection.',
      },
    ],
    tips: [
      'Use the Detailed tab filters to quickly narrow down algorithms by security level or standardization status.',
      'The compare panel is great for preparing algorithm selection reports.',
    ],
  },

  library: {
    title: 'PQC Library',
    summary:
      'Search and browse the latest post-quantum cryptography standards, drafts, RFCs, and reference documents from NIST, IETF, ETSI, and other organizations.',
    sections: [
      {
        heading: 'Search & Filters',
        body: 'Type in the search bar to search across titles, descriptions, and tags. Use the category sidebar to filter by standardization body (NIST, IETF, ETSI, ISO, etc.). Filter by urgency or priority to find the most relevant documents.',
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
    ],
  },

  playground: {
    title: 'Interactive Playground',
    summary:
      'Generate real post-quantum cryptographic keys, encrypt data, and sign messages directly in your browser using WebAssembly. All operations run locally — no data leaves your machine.',
    sections: [
      {
        heading: 'Key Generation',
        body: 'Select any algorithm from the dropdown to generate a keypair instantly. The playground shows public key size, private key size, and generation time. Compare PQC key sizes with classical equivalents.',
      },
      {
        heading: 'KEM Operations',
        body: 'Test ML-KEM key encapsulation: generate a keypair, encapsulate to create a shared secret + ciphertext, then decapsulate to recover the shared secret. Compare ciphertext sizes across parameter sets.',
      },
      {
        heading: 'Digital Signatures',
        body: 'Sign messages with ML-DSA or SLH-DSA and verify signatures. Enter any message, sign it with a private key, then verify with the public key. Compare signature sizes across algorithms.',
      },
      {
        heading: 'SoftHSM Tab',
        body: 'Emulates a PKCS#11 v3.2 hardware security module in the browser. Demonstrates HSM-style key management, signing, KEM, and key agreement operations — all via WASM with no real hardware required.',
      },
      {
        heading: 'Additional Tabs',
        body: 'Symmetric encryption (AES), hashing, key store management, operation logs, and ACVP testing are available as separate tabs. Use URL parameters (?tab=kem_ops&algo=ML-KEM-768) to deep-link to specific operations.',
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
        body: 'Filter threats by industry (Aviation, Finance, Healthcare, Energy, Government, etc.) using the dropdown. Each industry shows its specific threat landscape and affected cryptographic protocols.',
      },
      {
        heading: 'Criticality & Search',
        body: 'Filter by criticality level (Critical, High, Medium, Low) to focus on the most urgent threats. Use the search bar to find threats by keyword across all fields.',
      },
      {
        heading: 'Threat Details',
        body: 'Click any threat card to expand full details: affected algorithms, at-risk protocols, timeline to quantum risk, recommended PQC replacements, and references to compliance frameworks.',
      },
      {
        heading: 'Sort Options',
        body: 'Sort threats by industry, threat ID, or criticality level. The default view groups threats by industry with the most critical items first.',
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
        body: 'Click a leader card to see their full profile: organization, contributions to PQC, key publications, and links to related library resources.',
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
      'Map compliance and certification frameworks to PQC requirements across industries. Track FIPS 140-3, Common Criteria, ACVP, and other certification schemes.',
    sections: [
      {
        heading: 'Certification Schemes Tab',
        body: 'Browse active certification programs relevant to PQC: FIPS 140-3, Common Criteria, ACVP, and industry-specific schemes. Each entry shows status, scope, and links to source documents.',
      },
      {
        heading: 'Compliance Landscape Tab',
        body: 'Interactive visualization showing how compliance frameworks relate to each other. See which frameworks cover which industries and how PQC requirements cascade through the regulatory landscape.',
      },
      {
        heading: 'Industry Filtering',
        body: 'Filter by industry to see only the compliance frameworks relevant to your sector. The table highlights which frameworks are mandatory vs. recommended for each industry.',
      },
      {
        heading: 'Framework Details',
        body: 'Click any framework row to see full details: requirements, timelines, affected algorithms, and references to related library documents and timeline milestones.',
      },
    ],
    tips: [
      'Compliance data is automatically updated daily via the compliance scraper.',
      'Framework entries cross-reference both Library documents and Timeline milestones.',
    ],
  },

  migrate: {
    title: 'Migration Catalog',
    summary:
      'Browse the software migration catalog to see product PQC readiness, migration status, and recommendations organized by infrastructure layer.',
    sections: [
      {
        heading: 'Infrastructure Layer Stack',
        body: 'Products are organized by layer: Application, Platform, Network, Hardware, and more. Click a layer in the stack visualization to filter products. The stack shows readiness counts per layer.',
      },
      {
        heading: 'Product Search & Filters',
        body: 'Search by product name or vendor. Filter by PQC readiness status, infrastructure layer, or category. Persona-based recommendations highlight the most relevant layers for your role.',
      },
      {
        heading: 'Product Details',
        body: 'Click any product to see its full migration profile: current PQC support, migration timeline, certification status (FIPS/ACVP/CC cross-references), vendor links, and product briefs.',
      },
      {
        heading: 'My Products',
        body: 'Add products to your comparison list using the bookmark icon. The "My Products" panel lets you compare multiple products side-by-side and export the comparison.',
      },
      {
        heading: 'View Toggle',
        body: 'Switch between Card view and Table view. The table view supports sorting by any column and shows more products at a glance.',
      },
    ],
    tips: [
      'Hidden products can be managed via the settings icon — useful for excluding irrelevant entries.',
      'Certification cross-references link directly to the Compliance page for each product.',
    ],
  },

  assess: {
    title: 'Risk Assessment',
    summary:
      "Complete a guided assessment wizard to evaluate your organization's PQC readiness. Choose Quick (~2 min) or Comprehensive (~5 min) mode.",
    sections: [
      {
        heading: 'Assessment Modes',
        body: 'Quick mode covers essential questions for a rapid readiness check. Comprehensive mode adds deeper questions about compliance, data sensitivity, credential lifetime, and migration planning.',
      },
      {
        heading: 'Wizard Steps',
        body: 'The wizard walks you through questions about your industry, country, cryptographic stack, compliance requirements, data sensitivity, credential lifetime, organization scale, and migration readiness. Each step has clear guidance.',
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
        body: 'The report summarizes your PQC readiness across multiple dimensions: risk level, compliance gaps, migration priority, and recommended next steps. Scores are computed from your assessment answers.',
      },
      {
        heading: 'Recommendations',
        body: 'Each section includes specific, actionable recommendations tailored to your industry, country, and cryptographic stack. Recommendations link to relevant pages (Compliance, Migrate, Library) for deeper exploration.',
      },
      {
        heading: 'URL Hydration',
        body: 'Reports can be shared via URL parameters that encode your assessment context (industry, country, algorithms, compliance, sensitivity). Recipients see the same personalized view.',
      },
      {
        heading: 'Navigation',
        body: 'Action buttons link directly to pre-filtered views on the Compliance and Migrate pages based on your assessment context, saving you from manual filtering.',
      },
    ],
    tips: [
      'Complete the Assessment wizard first for the most accurate report.',
      'Share the report URL with colleagues — it encodes your assessment context.',
    ],
  },

  'business-center': {
    title: 'Business Center',
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
      'Structured PQC education with 40+ interactive modules covering PKI fundamentals, quantum threats, hybrid cryptography, industry-specific topics, and hands-on workshops.',
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
}
