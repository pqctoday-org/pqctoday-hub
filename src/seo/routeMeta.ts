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
          sameAs: ['https://github.com/pqctoday/pqctoday-hub'],
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
            'PKCS#11 HSM Mode via SoftHSMv3 WASM',
            'OpenSSL WASM Studio',
            'PQC Migration Planning',
            'Compliance Tracker (NIST, ANSSI, Common Criteria)',
            '48 Hands-on Learning Modules',
            'PQC Risk Assessment Wizard',
            'Migration Software Catalog',
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is post-quantum cryptography (PQC)?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Post-quantum cryptography (PQC) refers to cryptographic algorithms designed to resist attacks from both classical and quantum computers. NIST finalized the first PQC standards in August 2024: FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA), with FIPS 206 (FN-DSA) expected in 2025.',
              },
            },
            {
              '@type': 'Question',
              name: 'When will quantum computers break current encryption?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Expert estimates for a Cryptographically Relevant Quantum Computer (CRQC) range from 2029 to 2040. However, "Harvest Now, Decrypt Later" attacks mean adversaries can collect encrypted data today and decrypt it once quantum computers become available, making migration urgent now.',
              },
            },
            {
              '@type': 'Question',
              name: 'What are the NIST PQC standards?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'NIST published four PQC standards: FIPS 203 (ML-KEM for key encapsulation), FIPS 204 (ML-DSA for digital signatures), FIPS 205 (SLH-DSA for hash-based signatures), and FIPS 206 (FN-DSA for compact signatures). NIST IR 8547 sets the transition timeline: deprecate classical algorithms by 2030, disallow by 2035.',
              },
            },
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
      '@graph': [
        {
          '@type': 'Dataset',
          name: 'PQC Migration Timeline',
          description:
            'Global post-quantum cryptography migration deadlines and milestones by country.',
          creator: { '@type': 'Organization', name: 'PQC Today' },
          license: 'https://opensource.org/licenses/GPL-3.0',
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'When does NIST plan to deprecate classical cryptographic algorithms?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'According to NIST IR 8547, classical algorithms like RSA, ECDSA, and ECDH will be deprecated by 2030 and fully disallowed by 2035. Organizations should begin planning their migration now to meet these deadlines.',
              },
            },
            {
              '@type': 'Question',
              name: 'Which country has the most aggressive PQC migration deadline?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'France has one of the most aggressive timelines — ANSSI requires PQC support in qualified products by 2025. The CNSA 2.0 Suite requires US national security systems to adopt ML-KEM and ML-DSA by 2025, with all classical algorithms disallowed by 2033.',
              },
            },
            {
              '@type': 'Question',
              name: "What is the EU's coordinated PQC transition plan?",
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'EU Recommendation 2024/1101 calls on all member states to develop coordinated PQC migration plans. Combined with DORA (financial sector), NIS2 (critical infrastructure), and eIDAS 2.0 (digital identity), the EU is building a comprehensive quantum-readiness regulatory framework.',
              },
            },
          ],
        },
      ],
    },
  },

  '/algorithms': {
    title: 'PQC Algorithm Explorer — ML-KEM, ML-DSA, SLH-DSA, FN-DSA | PQC Today',
    description:
      'Compare NIST post-quantum algorithms: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205). Key sizes, performance benchmarks, and security levels.',
    canonical: `${BASE_URL}/algorithms`,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'ItemList',
          name: 'Post-Quantum Cryptography Algorithms',
          description:
            'NIST standardized and candidate PQC algorithms with key sizes and benchmarks.',
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
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is ML-KEM and what FIPS standard covers it?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'ML-KEM (Module-Lattice Key Encapsulation Mechanism) is standardized in FIPS 203, published August 2024. It is a lattice-based KEM that replaces RSA and ECDH for key exchange, offering three parameter sets: ML-KEM-512 (Level 1), ML-KEM-768 (Level 3), and ML-KEM-1024 (Level 5).',
              },
            },
            {
              '@type': 'Question',
              name: 'What is the recommended PQC replacement for RSA-2048?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'For key exchange, ML-KEM-768 (FIPS 203, NIST Level 3) replaces RSA key transport. For digital signatures, ML-DSA-65 (FIPS 204, NIST Level 3) replaces RSA-2048 signing. Both provide equivalent or higher security against quantum attacks.',
              },
            },
            {
              '@type': 'Question',
              name: 'What is the difference between ML-DSA and SLH-DSA?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'ML-DSA (FIPS 204) is lattice-based with compact signatures (~2.4-4.6 KB) and fast verification, making it the primary choice. SLH-DSA (FIPS 205) is hash-based with larger signatures (~7-50 KB) but relies only on hash function security, serving as a conservative fallback if lattice assumptions are broken.',
              },
            },
          ],
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

  '/business/tools': {
    title: 'Business Tools — PQC Planning & Governance Toolkit | PQC Today',
    description:
      '14 interactive business planning tools for PQC migration — ROI calculators, RACI builders, vendor scorecards, roadmap planners, and compliance checklists.',
    canonical: `${BASE_URL}/business/tools`,
  },

  '/assess': {
    title: 'PQC Risk Assessment — Quantum Readiness Score for Your Organization | PQC Today',
    description:
      'Understand your quantum risk exposure with a 14-step guided assessment. Get a personalized migration roadmap aligned with your industry, country, and applicable compliance mandates — NIST, ANSSI, BSI, and more.',
    canonical: `${BASE_URL}/assess`,
  },

  '/report': {
    title: 'PQC Assessment Report — Personalized Quantum Risk Analysis | PQC Today',
    description:
      'View your personalized PQC risk assessment report with migration roadmap, compliance gap analysis, threat landscape, and actionable recommendations.',
    canonical: `${BASE_URL}/report`,
  },

  '/threats': {
    title: 'Quantum Threat Dashboard — Cryptographic Risk Timeline | PQC Today',
    description:
      'Monitor quantum computing threats to cryptography. CRQC timeline estimates, harvest-now-decrypt-later risks, and algorithm vulnerability tracking.',
    canonical: `${BASE_URL}/threats`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is a "Harvest Now, Decrypt Later" (HNDL) attack?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'In a Harvest Now, Decrypt Later attack, an adversary records encrypted network traffic today and stores it until a sufficiently powerful quantum computer becomes available to decrypt it. This makes data with long confidentiality requirements — such as healthcare records, government secrets, and financial data — vulnerable right now.',
          },
        },
        {
          '@type': 'Question',
          name: 'When will quantum computers be able to break RSA and ECDSA?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Expert estimates for a Cryptographically Relevant Quantum Computer (CRQC) capable of running Shor's algorithm at scale range from 2029 to 2040. A CRQC with approximately 4,000 logical qubits could factor RSA-2048 in hours, breaking both RSA and ECDSA/ECDH.",
          },
        },
        {
          '@type': 'Question',
          name: 'Which industries are most vulnerable to quantum computing threats?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Financial services, healthcare, government/defense, and critical infrastructure face the highest quantum risk due to long data lifetimes, strict regulatory requirements, and the potential for HNDL attacks on currently encrypted communications.',
          },
        },
      ],
    },
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

  '/faq': {
    title: 'PQC FAQ — Post-Quantum Cryptography Questions & Answers | PQC Today',
    description:
      'Answers to 100+ common post-quantum cryptography questions: ML-KEM, ML-DSA, NIST FIPS standards, migration timelines, compliance requirements, algorithm comparisons, and industry-specific PQC guidance.',
    canonical: `${BASE_URL}/faq`,
    // FAQPage structured data is injected dynamically by FAQPage component
    // to avoid duplicating 100+ Q&A pairs in this static config
  },

  '/about': {
    title: 'About PQC Today — Open-Source Post-Quantum Cryptography Education',
    description:
      'PQC Today is an open-source platform for post-quantum cryptography education, migration planning, and interactive algorithm demonstrations. GPL-3.0 licensed.',
    canonical: `${BASE_URL}/about`,
  },

  '/terms': {
    title: 'Terms of Service — PQC Today',
    description:
      'Terms of Service for PQC Today, including export compliance (ECCN 5D002), sanctions restrictions, educational-use disclaimers, and privacy policy for embedded cryptographic software.',
    canonical: `${BASE_URL}/terms`,
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
        '48 interactive modules covering PQC fundamentals, protocols, infrastructure, applications, industry verticals, and role-based guides with real cryptographic operations.',
      provider: { '@type': 'Organization', name: 'PQC Today', url: BASE_URL },
      isAccessibleForFree: true,
      numberOfCredits: 48,
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        courseWorkload: 'PT61H',
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

  '/learn/standards-bodies': {
    title: 'Standards, Certification & Compliance Bodies — NIST, ISO, ETSI, CCRA | PQC Today',
    description:
      'Understand who creates PQC standards, who certifies products, and who mandates compliance. Explore 12 organizations across standards development, certification, and regulatory enforcement.',
    canonical: `${BASE_URL}/learn/standards-bodies`,
    structuredData: buildModuleSchema(
      'Standards, Certification & Compliance Bodies',
      'PT60M',
      'Intermediate'
    ),
  },

  '/learn/confidential-computing': {
    title: 'Confidential Computing & TEEs — SGX, SEV-SNP, ARM CCA & PQC | PQC Today',
    description:
      'Explore Trusted Execution Environments for PQC: Intel SGX, AMD SEV-SNP, ARM CCA architectures, remote attestation flows, sealing key migration, and quantum threat timelines for TEE-based systems.',
    canonical: `${BASE_URL}/learn/confidential-computing`,
    structuredData: buildModuleSchema('Confidential Computing & TEEs', 'PT90M', 'Advanced'),
  },

  '/learn/web-gateway-pqc': {
    title: 'Web Gateway PQC — CDN, WAF, Load Balancer & Reverse Proxy Migration | PQC Today',
    description:
      'Plan PQC migration for web infrastructure: CDN edge TLS, WAF inspection with ML-KEM, load balancer cipher suite updates, and reverse proxy certificate chain management.',
    canonical: `${BASE_URL}/learn/web-gateway-pqc`,
    structuredData: buildModuleSchema('Web Gateway PQC', 'PT90M', 'Intermediate'),
  },

  '/learn/emv-payment-pqc': {
    title: 'EMV Payment Systems & PQC — Card Auth, Tokenization & DUKPT Migration | PQC Today',
    description:
      'Post-quantum migration for payment ecosystems: EMV SDA/DDA/CDA authentication, Visa/Mastercard tokenization, POS terminal upgrades, DUKPT key injection, and FN-DSA for constrained cards.',
    canonical: `${BASE_URL}/learn/emv-payment-pqc`,
    structuredData: buildModuleSchema('EMV Payment Systems & PQC', 'PT120M', 'Advanced'),
  },

  '/learn/crypto-dev-apis': {
    title: 'Cryptographic APIs & Developer Languages — JCA, OpenSSL EVP, PKCS#11, CNG | PQC Today',
    description:
      'Master PQC integration across 7 languages and 5 crypto APIs: JCA/JCE, OpenSSL EVP, PKCS#11, CNG, and Bouncy Castle. Provider patterns, build-vs-buy analysis, and crypto agility patterns.',
    canonical: `${BASE_URL}/learn/crypto-dev-apis`,
    structuredData: buildModuleSchema(
      'Cryptographic APIs & Developer Languages',
      'PT120M',
      'Intermediate'
    ),
  },

  '/learn/platform-eng-pqc': {
    title:
      'Platform Engineering & PQC — CI/CD Crypto Inventory, Container Signing & Policy | PQC Today',
    description:
      'Migrate your platform to post-quantum: CI/CD pipeline crypto inventory, container signing with ML-DSA via cosign/Notation, IaC defaults, OPA/Kyverno policy enforcement, and crypto posture monitoring.',
    canonical: `${BASE_URL}/learn/platform-eng-pqc`,
    structuredData: buildModuleSchema('Platform Engineering & PQC', 'PT120M', 'Advanced'),
  },

  '/learn/energy-utilities-pqc': {
    title: 'Energy & Utilities PQC — SCADA, Smart Grid & IEC 62351 Migration | PQC Today',
    description:
      'Post-quantum cryptography for energy infrastructure: SCADA/ICS protocols, smart grid security, IEC 62351 compliance, substation automation, and OT network migration planning.',
    canonical: `${BASE_URL}/learn/energy-utilities-pqc`,
    structuredData: buildModuleSchema('Energy & Utilities PQC', 'PT90M', 'Intermediate'),
  },

  '/learn/healthcare-pqc': {
    title: 'Healthcare PQC — HIPAA, HL7 FHIR, Medical Device & EHR Migration | PQC Today',
    description:
      'Post-quantum migration for healthcare: HIPAA compliance, HL7 FHIR API security, medical device firmware signing, EHR encryption, and clinical data protection strategies.',
    canonical: `${BASE_URL}/learn/healthcare-pqc`,
    structuredData: buildModuleSchema('Healthcare PQC', 'PT90M', 'Intermediate'),
  },

  '/learn/aerospace-pqc': {
    title: 'Aerospace PQC — Satellite Comms, CCSDS & DO-326A Migration | PQC Today',
    description:
      'Post-quantum cryptography for aerospace: satellite communication links, CCSDS protocol security, DO-326A airworthiness, ground station upgrades, and long-lifecycle mission planning.',
    canonical: `${BASE_URL}/learn/aerospace-pqc`,
    structuredData: buildModuleSchema('Aerospace PQC', 'PT120M', 'Advanced'),
  },

  '/learn/automotive-pqc': {
    title: 'Automotive PQC — V2X, AUTOSAR, ISO 21434 & ECU Migration | PQC Today',
    description:
      'Post-quantum migration for automotive: V2X communication security, AUTOSAR crypto stack, ISO 21434 compliance, ECU firmware signing, and connected vehicle PKI.',
    canonical: `${BASE_URL}/learn/automotive-pqc`,
    structuredData: buildModuleSchema('Automotive PQC', 'PT120M', 'Advanced'),
  },

  '/learn/exec-quantum-impact': {
    title: 'Executive Quantum Impact Guide — PQC Strategy for Business Leaders | PQC Today',
    description:
      'A 30-minute executive briefing on quantum computing threats to your business. Understand HNDL risks, regulatory deadlines, budget implications, and board-level action items.',
    canonical: `${BASE_URL}/learn/exec-quantum-impact`,
    structuredData: buildModuleSchema('Executive Quantum Impact Guide', 'PT30M', 'Beginner'),
  },

  '/learn/dev-quantum-impact': {
    title: 'Developer Quantum Impact Guide — PQC for Software Engineers | PQC Today',
    description:
      'A 30-minute developer guide to post-quantum cryptography. Learn which libraries support PQC, how to integrate ML-KEM/ML-DSA, and what changes in your code.',
    canonical: `${BASE_URL}/learn/dev-quantum-impact`,
    structuredData: buildModuleSchema('Developer Quantum Impact Guide', 'PT30M', 'Beginner'),
  },

  '/learn/arch-quantum-impact': {
    title: 'Architect Quantum Impact Guide — PQC System Design Decisions | PQC Today',
    description:
      'A 30-minute architect guide to post-quantum system design. Crypto agility patterns, hybrid deployment strategies, and infrastructure migration sequencing.',
    canonical: `${BASE_URL}/learn/arch-quantum-impact`,
    structuredData: buildModuleSchema('Architect Quantum Impact Guide', 'PT30M', 'Beginner'),
  },

  '/learn/ops-quantum-impact': {
    title: 'Operations Quantum Impact Guide — PQC for IT & Security Ops | PQC Today',
    description:
      'A 30-minute operations guide to PQC migration. Certificate rotation, HSM firmware updates, monitoring for algorithm deprecation, and incident response planning.',
    canonical: `${BASE_URL}/learn/ops-quantum-impact`,
    structuredData: buildModuleSchema('Operations Quantum Impact Guide', 'PT30M', 'Beginner'),
  },

  '/learn/research-quantum-impact': {
    title: 'Researcher Quantum Impact Guide — PQC for Security Researchers | PQC Today',
    description:
      'A 30-minute guide for security researchers on post-quantum cryptography. Lattice-based security proofs, side-channel considerations, and open research questions.',
    canonical: `${BASE_URL}/learn/research-quantum-impact`,
    structuredData: buildModuleSchema('Researcher Quantum Impact Guide', 'PT30M', 'Beginner'),
  },

  '/learn/ai-security-pqc': {
    title:
      'AI Security & PQC — Model Protection, Federated Learning & ML Pipeline Security | PQC Today',
    description:
      'Post-quantum security for AI systems: model weight encryption, federated learning channel protection, ML pipeline integrity, inference API authentication, and adversarial robustness in a quantum era.',
    canonical: `${BASE_URL}/learn/ai-security-pqc`,
    structuredData: buildModuleSchema('AI Security & PQC', 'PT120M', 'Advanced'),
  },

  '/learn/secrets-management-pqc': {
    title: 'Secrets Management & PQC — Vault, AWS, Azure & GCP Migration | PQC Today',
    description:
      'Post-quantum secrets management: HashiCorp Vault transit encryption, AWS/Azure/GCP secrets migration, rotation policy design, and CI/CD pipeline integration with PQC-safe key wrapping.',
    canonical: `${BASE_URL}/learn/secrets-management-pqc`,
    structuredData: buildModuleSchema('Secrets Management & PQC', 'PT90M', 'Advanced'),
  },

  '/learn/network-security-pqc': {
    title: 'Network Security & PQC — NGFW, TLS Inspection, IDS/IPS & ZTNA | PQC Today',
    description:
      'Post-quantum network security: next-gen firewall cipher analysis, TLS inspection with ML-KEM, IDS/IPS signature updates, vendor migration matrices, and Zero Trust Network Access with PQC.',
    canonical: `${BASE_URL}/learn/network-security-pqc`,
    structuredData: buildModuleSchema('Network Security & PQC Migration', 'PT90M', 'Advanced'),
  },

  '/learn/database-encryption-pqc': {
    title: 'Database Encryption & PQC — TDE, CLE, Queryable Encryption & BYOK | PQC Today',
    description:
      'Post-quantum database encryption: TDE migration planning, column-level encryption with ML-KEM, queryable encryption patterns, BYOK/HYOK key management, and database vendor readiness.',
    canonical: `${BASE_URL}/learn/database-encryption-pqc`,
    structuredData: buildModuleSchema('Database Encryption & PQC', 'PT75M', 'Intermediate'),
  },

  '/learn/iam-pqc': {
    title: 'Identity & Access Management with PQC — JWT, SAML, OIDC & Zero Trust | PQC Today',
    description:
      'Post-quantum IAM migration: JWT/SAML/OIDC token signing with ML-DSA, Active Directory and LDAP upgrades, vendor readiness scoring, and Zero Trust identity architecture.',
    canonical: `${BASE_URL}/learn/iam-pqc`,
    structuredData: buildModuleSchema(
      'Identity & Access Management with PQC',
      'PT90M',
      'Intermediate'
    ),
  },

  '/learn/secure-boot-pqc': {
    title: 'Secure Boot & Firmware PQC — UEFI, TPM 2.0, DICE & ML-DSA Signing | PQC Today',
    description:
      'Post-quantum secure boot: UEFI PK/KEK/db key migration to ML-DSA, TPM 2.0 key hierarchy, DICE attestation, firmware vendor readiness, and boot chain integrity verification.',
    canonical: `${BASE_URL}/learn/secure-boot-pqc`,
    structuredData: buildModuleSchema('Secure Boot & Firmware PQC', 'PT90M', 'Advanced'),
  },

  '/learn/os-pqc': {
    title: 'Operating System & Platform Crypto PQC — OpenSSL, SSH, GnuTLS & FIPS | PQC Today',
    description:
      'Post-quantum OS crypto migration: OpenSSL provider architecture, SSH host key migration, GnuTLS/Schannel policy configuration, package signing, and FIPS 140-3 compatibility across RHEL, Ubuntu, Windows Server, and more.',
    canonical: `${BASE_URL}/learn/os-pqc`,
    structuredData: buildModuleSchema(
      'Operating System & Platform Crypto PQC',
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

  // Dynamic routes — fall back to parent route meta
  if (normalized.startsWith('/business/tools/')) return ROUTE_META['/business/tools']!
  if (normalized.startsWith('/learn/')) return ROUTE_META['/learn']!

  // Fallback to homepage
  return ROUTE_META['/']!
}
