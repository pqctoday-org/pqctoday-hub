// SPDX-License-Identifier: GPL-3.0-only
const BASE_URL = 'https://www.pqctoday.com'

export interface RouteMeta {
  title: string
  description: string
  canonical: string
  ogImage?: string
  structuredData?: Record<string, unknown>
}

/** Per-route SEO metadata for all discoverable pages */
export const ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: 'PQC Today — Post-Quantum Cryptography Migration Hub',
    description:
      'Your guided post-quantum cryptography transformation journey. Learn PQC fundamentals, assess your quantum risk, and migrate your cryptography infrastructure in full compliance with NIST, ANSSI, BSI, and applicable regulatory mandates.',
    canonical: `${BASE_URL}/`,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: 'PQC Today',
          url: BASE_URL,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${BASE_URL}/library?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'Organization',
          name: 'PQC Today',
          url: BASE_URL,
          logo: `${BASE_URL}/favicon.svg`,
          sameAs: ['https://github.com/pqctoday/pqc-timeline-app'],
        },
        {
          '@type': 'WebApplication',
          name: 'PQC Today',
          url: BASE_URL,
          description:
            'Your guided post-quantum cryptography transformation journey. Learn PQC fundamentals, assess your quantum risk, and migrate your cryptography infrastructure in full compliance with NIST, ANSSI, BSI, and applicable regulatory mandates.',
          applicationCategory: 'SecurityApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            'Post-Quantum Cryptography Timeline',
            'Interactive ML-KEM and ML-DSA Demos',
            'OpenSSL WASM Studio',
            'PQC Migration Planning',
            'Compliance Tracker (NIST, ANSSI, Common Criteria)',
            '48 Hands-on Learning Modules',
            'PQC Risk Assessment Wizard',
            'Migration Software Catalog',
          ],
        },
      ],
    },
  },

  '/timeline': {
    title: 'PQC Migration Timeline — Global Deadlines & Milestones | PQC Today',
    description:
      'Track every PQC migration deadline that applies to your organization. Country-by-country regulatory timelines, NIST and EU mandates, and global transition milestones in one interactive view.',
    canonical: `${BASE_URL}/timeline`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'PQC Migration Timeline',
      description:
        'Global post-quantum cryptography migration deadlines and milestones by country.',
      creator: { '@type': 'Organization', name: 'PQC Today' },
      license: 'https://opensource.org/licenses/GPL-3.0',
    },
  },

  '/algorithms': {
    title: 'PQC Algorithm Explorer — ML-KEM, ML-DSA, SLH-DSA, FN-DSA | PQC Today',
    description:
      'Compare NIST post-quantum algorithms: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205). Key sizes, performance benchmarks, and security levels.',
    canonical: `${BASE_URL}/algorithms`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Post-Quantum Cryptography Algorithms',
      description: 'NIST standardized and candidate PQC algorithms with key sizes and benchmarks.',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'ML-KEM (FIPS 203)',
          description: 'Module-Lattice Key Encapsulation Mechanism',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'ML-DSA (FIPS 204)',
          description: 'Module-Lattice Digital Signature Algorithm',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'SLH-DSA (FIPS 205)',
          description: 'Stateless Hash-based Digital Signature Algorithm',
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: 'FN-DSA (FIPS 206)',
          description: 'FFT over NTRU-Lattice Digital Signature Algorithm',
        },
      ],
    },
  },

  '/playground': {
    title: 'PQC Crypto Playground — Test ML-KEM & ML-DSA in Your Browser | PQC Today',
    description:
      'Generate post-quantum keys, encrypt, sign, and verify using ML-KEM, ML-DSA, and 40+ algorithms. Real WASM-powered cryptographic operations in-browser.',
    canonical: `${BASE_URL}/playground`,
  },

  '/openssl': {
    title: 'OpenSSL WASM Studio — Run PQC Commands in Your Browser | PQC Today',
    description:
      'Execute OpenSSL 3.6 commands with PQC algorithm support directly in your browser. Generate ML-KEM keys, create certificates, and test post-quantum TLS.',
    canonical: `${BASE_URL}/openssl`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'OpenSSL WASM Studio',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      description: 'Browser-based OpenSSL 3.6 environment with PQC algorithm support.',
    },
  },

  '/compliance': {
    title: 'PQC Compliance Tracker — NIST, ANSSI, BSI, NCSC Standards | PQC Today',
    description:
      'Stay ahead of your regulatory obligations. Track PQC mandates from NIST, ANSSI, BSI, NCSC, and Common Criteria — with framework timelines, deadlines, and industry-specific requirements in one place.',
    canonical: `${BASE_URL}/compliance`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'PQC Compliance Frameworks',
      description:
        'Post-quantum cryptography compliance requirements from NIST, ANSSI, BSI, NCSC, and Common Criteria.',
      creator: { '@type': 'Organization', name: 'PQC Today' },
      license: 'https://opensource.org/licenses/GPL-3.0',
    },
  },

  '/migrate': {
    title: 'PQC Migration Catalog — Software & Infrastructure PQC Readiness | PQC Today',
    description:
      'Navigate every step of your PQC migration. Track software and infrastructure readiness across 7 technology layers, with FIPS validation status and migration phases mapped to your regulatory obligations.',
    canonical: `${BASE_URL}/migrate`,
  },

  '/business': {
    title: 'Business Center — PQC Readiness Dashboard | PQC Today',
    description:
      'Your executive PQC command center. Live risk scores, compliance tracking, migration pipeline, vendor posture, and actionable next steps — all in one dashboard.',
    canonical: `${BASE_URL}/business`,
  },

  '/assess': {
    title: 'PQC Risk Assessment — Quantum Readiness Score for Your Organization | PQC Today',
    description:
      'Understand your quantum risk exposure with a 14-step guided assessment. Get a personalized migration roadmap aligned with your industry, country, and applicable compliance mandates — NIST, ANSSI, BSI, and more.',
    canonical: `${BASE_URL}/assess`,
  },

  '/threats': {
    title: 'Quantum Threat Dashboard — Cryptographic Risk Timeline | PQC Today',
    description:
      'Monitor quantum computing threats to cryptography. CRQC timeline estimates, harvest-now-decrypt-later risks, and algorithm vulnerability tracking.',
    canonical: `${BASE_URL}/threats`,
  },

  '/leaders': {
    title: 'PQC Industry Leaders — Organizations Migrating to Post-Quantum | PQC Today',
    description:
      'Track which organizations are adopting post-quantum cryptography. Industry leaders, government agencies, and tech companies leading the PQC transition.',
    canonical: `${BASE_URL}/leaders`,
  },

  '/library': {
    title: 'PQC Reference Library — Standards, Research Papers & Guides | PQC Today',
    description:
      'Curated collection of post-quantum cryptography standards (FIPS 203-206), research papers, migration guides, and implementation references.',
    canonical: `${BASE_URL}/library`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'PQC Reference Library',
      description: 'Curated post-quantum cryptography standards, papers, and guides.',
    },
  },

  '/about': {
    title: 'About PQC Today — Open-Source Post-Quantum Cryptography Education',
    description:
      'PQC Today is an open-source platform for post-quantum cryptography education, migration planning, and interactive algorithm demonstrations. GPL-3.0 licensed.',
    canonical: `${BASE_URL}/about`,
  },

  '/changelog': {
    title: 'Changelog — PQC Today Version History & Release Notes',
    description:
      'Track new features, improvements, and bug fixes in PQC Today. Detailed version history of the post-quantum cryptography education platform.',
    canonical: `${BASE_URL}/changelog`,
  },

  // --- Learning modules ---

  '/learn': {
    title: 'Learn Post-Quantum Cryptography — 48 Interactive Modules | PQC Today',
    description:
      'Begin your post-quantum transformation with 48 guided learning modules across 8 tracks. Build the knowledge to assess your risk, plan your migration, and meet your regulatory requirements — from PQC fundamentals to advanced protocol implementation.',
    canonical: `${BASE_URL}/learn`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'Post-Quantum Cryptography Learning Path',
      description:
        '27 interactive modules covering PQC fundamentals, protocols, infrastructure, and applications with real cryptographic operations.',
      provider: { '@type': 'Organization', name: 'PQC Today', url: BASE_URL },
      isAccessibleForFree: true,
      numberOfCredits: 27,
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        courseWorkload: 'PT34H',
      },
    },
  },

  '/learn/pqc-101': {
    title: 'PQC 101 — Introduction to Post-Quantum Cryptography | PQC Today',
    description:
      'Start your PQC journey. Learn why quantum computers threaten current encryption, what lattice-based cryptography is, and how NIST standards protect us.',
    canonical: `${BASE_URL}/learn/pqc-101`,
    structuredData: buildModuleSchema(
      'PQC 101 — Introduction to Post-Quantum Cryptography',
      'PT15M',
      'Beginner'
    ),
  },

  '/learn/quantum-threats': {
    title: "Quantum Threats — Shor's Algorithm, CRQC & HNDL Attacks | PQC Today",
    description:
      "Understand how Shor's and Grover's algorithms break RSA and AES. CRQC timeline estimates, harvest-now-decrypt-later mechanics, and security level degradation.",
    canonical: `${BASE_URL}/learn/quantum-threats`,
    structuredData: buildModuleSchema('Quantum Threats to Cryptography', 'PT60M', 'Intermediate'),
  },

  '/learn/hybrid-crypto': {
    title: 'Hybrid Cryptography — Transitional PQC Key Exchange & Signatures | PQC Today',
    description:
      'Combine classical and post-quantum algorithms for safe migration. Hybrid KEMs, composite signatures, and interactive certificate format comparison.',
    canonical: `${BASE_URL}/learn/hybrid-crypto`,
    structuredData: buildModuleSchema('Hybrid Cryptography', 'PT60M', 'Intermediate'),
  },

  '/learn/crypto-agility': {
    title: 'Crypto Agility — 7-Phase PQC Migration Framework & CBOM | PQC Today',
    description:
      'Design crypto-agile architectures for PQC transition. Abstraction layers, CBOM scanning, and the 7-phase migration framework from assessment to optimization.',
    canonical: `${BASE_URL}/learn/crypto-agility`,
    structuredData: buildModuleSchema('Crypto Agility', 'PT60M', 'Intermediate'),
  },

  '/learn/tls-basics': {
    title: 'TLS 1.3 Basics — Post-Quantum Handshakes & Cipher Suites | PQC Today',
    description:
      'Deep dive into TLS 1.3 handshake protocol, cipher suite negotiation, and how ML-KEM integrates into post-quantum TLS connections.',
    canonical: `${BASE_URL}/learn/tls-basics`,
    structuredData: buildModuleSchema('TLS 1.3 Basics', 'PT60M', 'Intermediate'),
  },

  '/learn/vpn-ssh-pqc': {
    title: 'VPN & SSH PQC — IKEv2 ML-KEM, WireGuard Rosenpass | PQC Today',
    description:
      'Post-quantum VPN and SSH: IKEv2 hybrid ML-KEM key exchange, WireGuard Rosenpass integration, and protocol overhead comparison for IPsec tunnels.',
    canonical: `${BASE_URL}/learn/vpn-ssh-pqc`,
    structuredData: buildModuleSchema('VPN/IPsec & SSH PQC', 'PT90M', 'Advanced'),
  },

  '/learn/email-signing': {
    title: 'Email & Document Signing — S/MIME PQC Migration | PQC Today',
    description:
      'Post-quantum email security: S/MIME signing workflows, KEM-based CMS encryption (RFC 9629), and PQC migration path for enterprise email.',
    canonical: `${BASE_URL}/learn/email-signing`,
    structuredData: buildModuleSchema('Email & Document Signing', 'PT60M', 'Intermediate'),
  },

  '/learn/pki-workshop': {
    title: 'PKI Workshop — Certificate Chains, X.509 & PQC Migration | PQC Today',
    description:
      'Hands-on PKI fundamentals: build certificate chains, explore X.509 extensions, and plan post-quantum PKI infrastructure migration.',
    canonical: `${BASE_URL}/learn/pki-workshop`,
    structuredData: buildModuleSchema('PKI Workshop', 'PT60M', 'Intermediate'),
  },

  '/learn/kms-pqc': {
    title: 'KMS & PQC Key Management — Envelope Encryption, Hybrid Wrapping & Rotation | PQC Today',
    description:
      'Master PQC key management patterns: ML-KEM envelope encryption, hybrid key wrapping combiners, multi-provider rotation planning across AWS, Google, Azure, and on-prem KMS.',
    canonical: `${BASE_URL}/learn/kms-pqc`,
    structuredData: buildModuleSchema('KMS & PQC Key Management', 'PT75M', 'Intermediate'),
  },

  '/learn/hsm-pqc': {
    title: 'HSM & PQC Operations — PKCS#11 v3.2, Firmware Migration & FIPS 140-3 | PQC Today',
    description:
      'Deep dive into Hardware Security Modules for PQC: PKCS#11 v3.2 mechanisms, vendor comparison, firmware migration planning, and FIPS 140-3 validation tracking.',
    canonical: `${BASE_URL}/learn/hsm-pqc`,
    structuredData: buildModuleSchema('HSM & PQC Operations', 'PT90M', 'Advanced'),
  },

  '/learn/stateful-signatures': {
    title: 'Stateful Hash Signatures — LMS/HSS & XMSS Deep Dive | PQC Today',
    description:
      'Master LMS/HSS and XMSS/XMSS^MT: Merkle tree signatures, parameter selection, state management, and when to choose stateful over stateless schemes.',
    canonical: `${BASE_URL}/learn/stateful-signatures`,
    structuredData: buildModuleSchema('Stateful Hash Signatures', 'PT60M', 'Advanced'),
  },

  '/learn/merkle-tree-certs': {
    title: 'Merkle Tree Certificates — Interactive MTC Proofs for PQC TLS | PQC Today',
    description:
      'Build Merkle trees interactively, generate and verify inclusion proofs, and compare MTC efficiency versus traditional PKI for post-quantum TLS.',
    canonical: `${BASE_URL}/learn/merkle-tree-certs`,
    structuredData: buildModuleSchema('Merkle Tree Certificates', 'PT60M', 'Advanced'),
  },

  '/learn/digital-assets': {
    title: 'Digital Assets & PQC — Bitcoin, Ethereum, Solana Crypto Threats | PQC Today',
    description:
      'Quantum threats to blockchain: how PQC impacts Bitcoin, Ethereum, and Solana. Key derivation, address generation, and post-quantum migration paths.',
    canonical: `${BASE_URL}/learn/digital-assets`,
    structuredData: buildModuleSchema('Digital Assets & PQC', 'PT60M', 'Intermediate'),
  },

  '/learn/5g-security': {
    title: '5G Security — 3GPP SUCI, 5G-AKA & PQC in Telecoms | PQC Today',
    description:
      'Explore 3GPP 5G security architecture: SUCI deconcealment, 5G-AKA protocol, subscriber provisioning, and post-quantum migration for mobile networks.',
    canonical: `${BASE_URL}/learn/5g-security`,
    structuredData: buildModuleSchema('5G Security', 'PT90M', 'Advanced'),
  },

  '/learn/digital-id': {
    title: 'Digital ID — EUDI Wallet, PID Issuance & PQC | PQC Today',
    description:
      'Master the EU Digital Identity Wallet: activation flows, PID issuance, qualified electronic signatures (QES), and post-quantum readiness for eIDAS 2.0.',
    canonical: `${BASE_URL}/learn/digital-id`,
    structuredData: buildModuleSchema('Digital ID & EUDI Wallet', 'PT120M', 'Advanced'),
  },

  '/learn/entropy-randomness': {
    title: 'Entropy & Randomness — DRBG, QRNG & SP 800-90 | PQC Today',
    description:
      'Master entropy sources and random number generation: NIST SP 800-90 DRBGs, hardware TRNGs, quantum random number generators, and entropy testing.',
    canonical: `${BASE_URL}/learn/entropy-randomness`,
    structuredData: buildModuleSchema('Entropy & Randomness', 'PT60M', 'Intermediate'),
  },

  '/learn/qkd': {
    title: 'Quantum Key Distribution — BB84 Protocol & Global Deployments | PQC Today',
    description:
      'Explore QKD fundamentals: BB84 protocol simulation with Eve interception, classical post-processing, hybrid key derivation, and real-world QKD network data.',
    canonical: `${BASE_URL}/learn/qkd`,
    structuredData: buildModuleSchema('Quantum Key Distribution', 'PT150M', 'Advanced'),
  },

  '/learn/vendor-risk': {
    title: 'Vendor & Supply Chain PQC Risk — Scorecards, CBOM & Contract Clauses | PQC Today',
    description:
      "Evaluate your supply chain's quantum readiness. Build PQC vendor scorecards across 6 dimensions, demand CycloneDX CBOM inventories, generate contract clauses, and map cryptographic risk across infrastructure layers.",
    canonical: `${BASE_URL}/learn/vendor-risk`,
    structuredData: buildModuleSchema('Vendor & Supply Chain PQC Risk', 'PT90M', 'Advanced'),
  },

  '/learn/compliance-strategy': {
    title:
      'PQC Compliance Strategy — CNSA 2.0, NIST IR 8547, Multi-Jurisdiction Planning | PQC Today',
    description:
      'Build a multi-jurisdiction PQC compliance strategy. Map CNSA 2.0, NIST IR 8547, ANSSI, and BSI requirements across your operating regions, build audit readiness checklists, and construct compliance timelines for key deadlines through 2035.',
    canonical: `${BASE_URL}/learn/compliance-strategy`,
    structuredData: buildModuleSchema('PQC Compliance & Regulatory Strategy', 'PT90M', 'Advanced'),
  },

  '/learn/migration-program': {
    title:
      'PQC Migration Program Management — 7-Phase Roadmap, KPIs & Stakeholder Planning | PQC Today',
    description:
      'Structure your enterprise PQC migration as a multi-year program. Apply the 7-phase CISA/NIST framework — from discovery and CBOM to validation — with roadmap builder, stakeholder communications planner, and KPI tracker.',
    canonical: `${BASE_URL}/learn/migration-program`,
    structuredData: buildModuleSchema('PQC Migration Program Management', 'PT90M', 'Advanced'),
  },

  '/learn/pqc-risk-management': {
    title: 'PQC Risk Management — CRQC Scenarios, Risk Register & Heatmap | PQC Today',
    description:
      "Quantify your organization's quantum risk exposure. Model CRQC arrival scenarios, build a cryptographic risk register with likelihood × impact scoring, and visualize migration priorities on a 5×5 risk heatmap.",
    canonical: `${BASE_URL}/learn/pqc-risk-management`,
    structuredData: buildModuleSchema('PQC Risk Management', 'PT60M', 'Intermediate'),
  },

  '/learn/pqc-business-case': {
    title:
      'Building the PQC Business Case — ROI Calculator, Breach Modeling & Board Pitch | PQC Today',
    description:
      'Make the financial case for PQC migration. Calculate risk-adjusted ROI, model HNDL breach costs with industry data, quantify compliance penalty exposure, and generate a board-ready investment memo with executive summary.',
    canonical: `${BASE_URL}/learn/pqc-business-case`,
    structuredData: buildModuleSchema('Building the PQC Business Case', 'PT60M', 'Intermediate'),
  },

  '/learn/pqc-governance': {
    title: 'PQC Governance & Policy — RACI Matrix, Policy Templates & KPI Dashboard | PQC Today',
    description:
      'Establish enterprise governance for your PQC transition. Build RACI matrices for migration responsibilities, generate cryptographic policy templates across 4 layers, choose a governance model, and design a KPI dashboard for board reporting.',
    canonical: `${BASE_URL}/learn/pqc-governance`,
    structuredData: buildModuleSchema('PQC Governance & Policy', 'PT90M', 'Advanced'),
  },

  '/learn/code-signing': {
    title: 'Code Signing & Supply Chain Security — PQC ML-DSA, Sigstore & Secure Boot | PQC Today',
    description:
      'Post-quantum code signing: sign binaries and packages with ML-DSA, build PQC certificate chains, simulate Sigstore keyless signing, and explore secure boot firmware trust chains with LMS/XMSS vs ML-DSA trade-offs.',
    canonical: `${BASE_URL}/learn/code-signing`,
    structuredData: buildModuleSchema('Code Signing & Supply Chain Security', 'PT90M', 'Advanced'),
  },

  '/learn/api-security-jwt': {
    title: 'API Security & PQC JWT — ML-DSA Signing, ML-KEM JWE & OAuth 2.0 Migration | PQC Today',
    description:
      'Migrate API authentication to post-quantum cryptography. Decode JWTs, replace RS256/ES256 with ML-DSA signing, swap ECDH-ES for ML-KEM key agreement in JWE, analyze PQC token size impacts, and plan OAuth 2.0/OIDC migration.',
    canonical: `${BASE_URL}/learn/api-security-jwt`,
    structuredData: buildModuleSchema('API Security & JWT with PQC', 'PT90M', 'Advanced'),
  },

  '/learn/iot-ot-pqc': {
    title: 'IoT & OT Security — PQC for Constrained Devices & SCADA | PQC Today',
    description:
      'Master PQC challenges for IoT and OT: algorithm selection for constrained devices, firmware signing with LMS/XMSS, CoAP/DTLS protocol impacts, certificate chain bloat, and SCADA/ICS migration planning.',
    canonical: `${BASE_URL}/learn/iot-ot-pqc`,
    structuredData: buildModuleSchema('IoT & OT Security', 'PT90M', 'Advanced'),
  },

  '/learn/data-asset-sensitivity': {
    title: 'Data & Asset Sensitivity Assessment — NIST RMF, ISO 27005, FAIR, DORA | PQC Today',
    description:
      'Classify organizational data assets, map GDPR/HIPAA/NIS2/DORA compliance obligations, apply NIST RMF, ISO 27005, and FAIR risk methodologies, and generate a PQC migration priority map for your most sensitive assets.',
    canonical: `${BASE_URL}/learn/data-asset-sensitivity`,
    structuredData: buildModuleSchema(
      'Data & Asset Sensitivity Assessment',
      'PT75M',
      'Intermediate'
    ),
  },

  '/learn/quiz': {
    title: 'PQC Quiz — Test Your Post-Quantum Cryptography Knowledge | PQC Today',
    description:
      'Challenge yourself across all PQC topics: algorithms, NIST standards, compliance, migration strategy, and protocol security. Adaptive difficulty.',
    canonical: `${BASE_URL}/learn/quiz`,
  },
}

/** Build a CourseInstance JSON-LD schema for a learning module */
function buildModuleSchema(name: string, duration: string, level: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name,
    provider: { '@type': 'Organization', name: 'PQC Today', url: BASE_URL },
    isAccessibleForFree: true,
    educationalLevel: level,
    timeRequired: duration,
    learningResourceType: 'interactive module',
    inLanguage: 'en',
  }
}

/**
 * Match a pathname to its route metadata.
 * Falls back to homepage meta for unknown routes.
 */
export function getRouteMeta(pathname: string): RouteMeta {
  // Exact match first — hasOwn guard makes these accesses safe
  // eslint-disable-next-line security/detect-object-injection
  if (Object.hasOwn(ROUTE_META, pathname)) return ROUTE_META[pathname]!

  // Normalize trailing slashes
  const normalized = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  // eslint-disable-next-line security/detect-object-injection
  if (Object.hasOwn(ROUTE_META, normalized)) return ROUTE_META[normalized]!

  // Fallback to homepage
  return ROUTE_META['/']!
}
