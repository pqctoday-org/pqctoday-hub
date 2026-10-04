// SPDX-License-Identifier: GPL-3.0-only
import { TOOL_ROUTE_META } from './toolRouteMeta.generated'

const BASE_URL = 'https://www.pqctoday.com'

export interface RouteMeta {
  title: string
  description: string
  canonical: string
  ogImage?: string
  structuredData?: Record<string, unknown>
  /** When true, PageMeta emits <meta name="robots" content="noindex,follow"> */
  noindex?: boolean
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
          sameAs: [
            'https://github.com/pqctoday-org/pqctoday-hub',
            'https://github.com/pqctoday-org',
            'https://www.youtube.com/@pqctoday',
          ],
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
            '{modules} Hands-on Learning Modules',
            'PQC Risk Assessment Wizard',
            'Migration Software Catalog',
            'PQC Patent Landscape',
            'Enterprise PQC Migration Simulation',
            'CRQC Threat Horizon Dashboard',
            'PQC Business & Governance Tools',
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
                text: 'Post-quantum cryptography (PQC) refers to cryptographic algorithms designed to resist attacks from both classical and quantum computers. NIST finalized the first PQC standards in August 2024: FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA), with FIPS 206 (FN-DSA) still in development.',
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
                text: 'NIST published three PQC standards in August 2024: FIPS 203 (ML-KEM for key encapsulation), FIPS 204 (ML-DSA for digital signatures), and FIPS 205 (SLH-DSA for hash-based signatures). FIPS 206 (FN-DSA for compact signatures) is still in development — no public draft yet. The draft NIST IR 8547 proposes the transition timeline: deprecate classical algorithms by 2030, disallow by 2035.',
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
                text: 'According to the draft NIST IR 8547, classical algorithms like RSA, ECDSA, and ECDH will be deprecated by 2030 and fully disallowed by 2035. Organizations should begin planning their migration now to meet these deadlines.',
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
          name: 'Post-Quantum Algorithms & Protocols',
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
              name: 'FN-DSA (planned FIPS 206)',
              description:
                'FFT over NTRU-Lattice Digital Signature Algorithm; FIPS 206 remains in development with no published public draft',
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
    title: 'PQC Migration Workbench — Software & Infrastructure PQC Readiness | PQC Today',
    description:
      'Navigate every step of your PQC migration. Track software and infrastructure readiness across 9 infrastructure layers, with FIPS validation status and migration phases mapped to your regulatory obligations.',
    canonical: `${BASE_URL}/migrate`,
  },

  '/business': {
    title: 'Command Center — PQC Readiness Dashboard | PQC Today',
    description:
      'Your executive PQC command center. Live risk scores, compliance tracking, migration pipeline, vendor posture, and actionable next steps — all in one dashboard.',
    canonical: `${BASE_URL}/business`,
  },

  '/business/tools': {
    title: 'Business Tools — PQC Planning & Governance Toolkit | PQC Today',
    description:
      '{businessTools} interactive business planning tools for PQC migration — ROI calculators, RACI builders, vendor scorecards, roadmap planners, and compliance checklists.',
    canonical: `${BASE_URL}/business/tools`,
  },

  '/assess': {
    title: 'PQC Risk Assessment — Quantum Readiness Score for Your Organization | PQC Today',
    description:
      'Understand your quantum risk exposure with a 13-step guided assessment (6-step quick path). Get a personalized migration roadmap aligned with your industry, country, and applicable compliance mandates — NIST, ANSSI, BSI, and more.',
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

  '/simulation': {
    title: 'PQC Migration Simulation — Run Your Quantum-Safe Transition | PQC Today',
    description:
      'Play through a full post-quantum cryptography migration for your assessed organization — your sector, size, and jurisdiction. Watch a sample finance-sector run end to end or simulate your own multi-phase transition.',
    canonical: `${BASE_URL}/simulation`,
  },

  '/sponsor': {
    title: 'Sponsor PQC Today — Support Independent Post-Quantum Education | PQC Today',
    description:
      'Back PQC Today, the free and neutral post-quantum cryptography platform. Sponsorship tiers for individuals, teams, and vendors fund open education and reference data while preserving strict editorial independence.',
    canonical: `${BASE_URL}/sponsor`,
  },

  '/editorial-independence': {
    title: 'Editorial Independence Policy | PQC Today',
    description:
      'The binding policy governing how sponsorship and editorial content interact at PQC Today: what sponsorship buys and does not buy, inclusion and assessment criteria, and conflict-of-interest disclosure.',
    canonical: `${BASE_URL}/editorial-independence`,
  },

  '/changelog': {
    title: 'Changelog — PQC Today Version History & Release Notes',
    description:
      'Track new features, improvements, and bug fixes in PQC Today. Detailed version history of the post-quantum cryptography education platform.',
    canonical: `${BASE_URL}/changelog`,
  },

  '/revisions': {
    title: 'Content Revisions — PQC Today Data Trust Log',
    description:
      'Every correction to our compliance, vendor, and migration data, reviewed and logged: what changed, who reviewed it, and why — the audit trail behind the data you rely on.',
    canonical: `${BASE_URL}/revisions`,
  },

  // --- Learning modules ---

  '/learn': {
    title: 'Learn Post-Quantum Cryptography — {modules} Interactive Modules | PQC Today',
    description:
      'Begin your post-quantum transformation with {modules} guided learning modules across 9 tracks. Build the knowledge to assess your risk, plan your migration, and meet your regulatory requirements — from PQC fundamentals to advanced protocol implementation.',
    canonical: `${BASE_URL}/learn`,
  },

  '/learn/pqc-101': {
    title: 'PQC 101 — Introduction to Post-Quantum Cryptography | PQC Today',
    description:
      'Start your PQC journey. Learn why quantum computers threaten current encryption, what lattice-based cryptography is, and how NIST standards protect us.',
    canonical: `${BASE_URL}/learn/pqc-101`,
    structuredData: buildModuleSchema(
      'PQC 101 — Introduction to Post-Quantum Cryptography',
      'PT10M',
      'Beginner'
    ),
  },

  '/learn/quantum-threats': {
    title: "Quantum Threats — Shor's Algorithm, CRQC & HNDL Attacks | PQC Today",
    description:
      "Understand how Shor's and Grover's algorithms break RSA and AES. CRQC timeline estimates, harvest-now-decrypt-later mechanics, and security level degradation.",
    canonical: `${BASE_URL}/learn/quantum-threats`,
    structuredData: buildModuleSchema('Quantum Threats to Cryptography', 'PT40M', 'Intermediate'),
  },

  '/learn/hybrid-crypto': {
    title: 'Hybrid Cryptography — Transitional PQC Key Exchange & Signatures | PQC Today',
    description:
      'Combine classical and post-quantum algorithms for safe migration. Hybrid KEMs, composite signatures, and interactive certificate format comparison.',
    canonical: `${BASE_URL}/learn/hybrid-crypto`,
    structuredData: buildModuleSchema('Hybrid Cryptography', 'PT40M', 'Intermediate'),
  },

  '/learn/crypto-agility': {
    title: 'Crypto Agility — 7-Phase PQC Migration Framework & CBOM | PQC Today',
    description:
      'Design crypto-agile architectures for PQC transition. Abstraction layers, CBOM scanning, and the 7-phase migration framework from assessment to optimization.',
    canonical: `${BASE_URL}/learn/crypto-agility`,
    structuredData: buildModuleSchema('Crypto Agility', 'PT40M', 'Intermediate'),
  },

  '/learn/tls-basics': {
    title: 'TLS 1.3 Basics — Post-Quantum Handshakes & Cipher Suites | PQC Today',
    description:
      'Deep dive into TLS 1.3 handshake protocol, cipher suite negotiation, and how ML-KEM integrates into post-quantum TLS connections.',
    canonical: `${BASE_URL}/learn/tls-basics`,
    structuredData: buildModuleSchema('TLS 1.3 Basics', 'PT40M', 'Intermediate'),
  },

  '/learn/vpn-ssh-pqc': {
    title: 'VPN & SSH PQC — IKEv2 ML-KEM, WireGuard Rosenpass | PQC Today',
    description:
      'Post-quantum VPN and SSH: IKEv2 hybrid ML-KEM key exchange, WireGuard Rosenpass integration, and protocol overhead comparison for IPsec tunnels.',
    canonical: `${BASE_URL}/learn/vpn-ssh-pqc`,
    structuredData: buildModuleSchema('VPN/IPsec & SSH PQC', 'PT60M', 'Advanced'),
  },
  '/learn/dnssec-pqc': {
    title: 'DNSSEC & Post-Quantum Signatures — ML-DSA-44, Algorithm 18 | PQC Today',
    description:
      "DNSSEC's move to post-quantum signatures: ML-DSA-44 (IANA DNSSEC algorithm 18), Cloudflare's 1.1.1.1 pilot against dnstest.dev, and what's still missing before production zones can be signed.",
    canonical: `${BASE_URL}/learn/dnssec-pqc`,
    structuredData: buildModuleSchema('DNSSEC & Post-Quantum Signatures', 'PT35M', 'Intermediate'),
  },

  '/learn/email-signing': {
    title: 'Email & Document Signing — S/MIME PQC Migration | PQC Today',
    description:
      'Post-quantum email security: S/MIME signing workflows, KEM-based CMS encryption (RFC 9629), and PQC migration path for enterprise email.',
    canonical: `${BASE_URL}/learn/email-signing`,
    structuredData: buildModuleSchema('Email & Document Signing', 'PT40M', 'Intermediate'),
  },

  '/learn/pki-workshop': {
    title: 'PKI Workshop — Certificate Chains, X.509 & PQC Migration | PQC Today',
    description:
      'Hands-on PKI fundamentals: build certificate chains, explore X.509 extensions, and plan post-quantum PKI infrastructure migration.',
    canonical: `${BASE_URL}/learn/pki-workshop`,
    structuredData: buildModuleSchema('PKI Workshop', 'PT40M', 'Intermediate'),
  },

  '/learn/kms-pqc': {
    title: 'KMS & PQC Key Management — Envelope Encryption, Hybrid Wrapping & Rotation | PQC Today',
    description:
      'Master PQC key management patterns: ML-KEM envelope encryption, hybrid key wrapping combiners, multi-provider rotation planning across AWS, Google, Azure, and on-prem KMS.',
    canonical: `${BASE_URL}/learn/kms-pqc`,
    structuredData: buildModuleSchema('KMS & PQC Key Management', 'PT60M', 'Intermediate'),
  },

  '/learn/pqc-hw-acceleration': {
    title: 'PQC Hardware Acceleration — SIMD, FPGA, GPU, ASIC for ML-DSA & SLH-DSA | PQC Today',
    description:
      'How ML-DSA and SLH-DSA are accelerated with SIMD, crypto instructions, GPUs, FPGAs, ASICs and NPUs — explained in plain English and backed by measurements on Apple M4 Pro, Cortex-A55 and Cortex-A53 + FPGA.',
    canonical: `${BASE_URL}/learn/pqc-hw-acceleration`,
    structuredData: buildModuleSchema('PQC Hardware Acceleration', 'PT60M', 'Advanced'),
  },

  '/learn/hsm-pqc': {
    title: 'HSM & PQC Operations — PKCS#11 v3.2, Firmware Migration & FIPS 140-3 | PQC Today',
    description:
      'Deep dive into Hardware Security Modules for PQC: PKCS#11 v3.2 mechanisms, vendor comparison, firmware migration planning, and FIPS 140-3 validation tracking.',
    canonical: `${BASE_URL}/learn/hsm-pqc`,
    structuredData: buildModuleSchema('HSM & PQC Operations', 'PT60M', 'Advanced'),
  },

  '/learn/crypto-product-certification': {
    title:
      'Cryptographic Product Certification: Fundamentals — FIPS 140-3, CC, EUCC & PCI | PQC Today',
    description:
      'What a FIPS 140-3, Common Criteria, EUCC or PCI certificate proves, why scope comes before level, and what adding post-quantum cryptography changes in each scheme.',
    canonical: `${BASE_URL}/learn/crypto-product-certification`,
    structuredData: buildModuleSchema(
      'Cryptographic Product Certification: Fundamentals',
      'PT60M',
      'Advanced'
    ),
  },

  '/learn/fips-140-3-certification': {
    title: 'FIPS 140-3 Certification — CMVP, Security Levels & PQC | PQC Today',
    description:
      'FIPS 140-3 and the CMVP in depth: what a certificate proves, security levels, the validation queue, and what adding post-quantum cryptography means for a validated module.',
    canonical: `${BASE_URL}/learn/fips-140-3-certification`,
    structuredData: buildModuleSchema('FIPS 140-3 Certification', 'PT60M', 'Advanced'),
  },

  '/learn/pci-certification': {
    title: 'PCI Certification — PTS HSM, PIN, P2PE & KMO | PQC Today',
    description:
      'PCI PTS HSM with the payment operating stack: what a device approval proves, how to read a PTS listing, and what PCI does and does not require for PQC.',
    canonical: `${BASE_URL}/learn/pci-certification`,
    structuredData: buildModuleSchema('PCI Certification', 'PT60M', 'Advanced'),
  },

  '/learn/cc-eucc-certification': {
    title: 'Common Criteria, EUCC & eIDAS Certification — EALs, PPs & PQC | PQC Today',
    description:
      'Common Criteria and CC:2022, EUCC as the EU scheme, eIDAS qualified devices and their Protection Profiles: what each claim proves and what adding PQC means for a certified product.',
    canonical: `${BASE_URL}/learn/cc-eucc-certification`,
    structuredData: buildModuleSchema(
      'Common Criteria, EUCC & eIDAS Certification',
      'PT60M',
      'Advanced'
    ),
  },

  '/learn/stateful-signatures': {
    title: 'Stateful Hash Signatures — LMS/HSS & XMSS Deep Dive | PQC Today',
    description:
      'Master LMS/HSS and XMSS/XMSS^MT: Merkle tree signatures, parameter selection, state management, and when to choose stateful over stateless schemes.',
    canonical: `${BASE_URL}/learn/stateful-signatures`,
    structuredData: buildModuleSchema('Stateful Hash Signatures', 'PT40M', 'Advanced'),
  },

  '/learn/merkle-tree-certs': {
    title: 'Merkle Tree Certificates — Interactive MTC Proofs for PQC TLS | PQC Today',
    description:
      'Build Merkle trees interactively, generate and verify inclusion proofs, and compare MTC efficiency versus traditional PKI for post-quantum TLS.',
    canonical: `${BASE_URL}/learn/merkle-tree-certs`,
    structuredData: buildModuleSchema('Merkle Tree Certificates', 'PT40M', 'Advanced'),
  },

  '/learn/digital-assets': {
    title: 'Digital Assets & PQC — Bitcoin, Ethereum, Solana Crypto Threats | PQC Today',
    description:
      'Quantum threats to blockchain: how PQC impacts Bitcoin, Ethereum, and Solana. Key derivation, address generation, and post-quantum migration paths.',
    canonical: `${BASE_URL}/learn/digital-assets`,
    structuredData: buildModuleSchema('Digital Assets & PQC', 'PT50M', 'Intermediate'),
  },

  '/learn/5g-security': {
    title: '5G Security — 3GPP SUCI, 5G-AKA & PQC in Telecoms | PQC Today',
    description:
      'Explore 3GPP 5G security architecture: SUCI deconcealment, 5G-AKA protocol, subscriber provisioning, and post-quantum migration for mobile networks.',
    canonical: `${BASE_URL}/learn/5g-security`,
    structuredData: buildModuleSchema('5G Security', 'PT60M', 'Advanced'),
  },

  '/learn/digital-id': {
    title: 'Digital ID — EUDI Wallet, PID Issuance & PQC | PQC Today',
    description:
      'Master the EU Digital Identity Wallet: activation flows, PID issuance, qualified electronic signatures (QES), and post-quantum readiness for eIDAS 2.0.',
    canonical: `${BASE_URL}/learn/digital-id`,
    structuredData: buildModuleSchema('Digital ID & EUDI Wallet', 'PT80M', 'Advanced'),
  },

  '/learn/entropy-randomness': {
    title: 'Entropy & Randomness — DRBG, QRNG & SP 800-90 | PQC Today',
    description:
      'Master entropy sources and random number generation: NIST SP 800-90 DRBGs, hardware TRNGs, quantum random number generators, and entropy testing.',
    canonical: `${BASE_URL}/learn/entropy-randomness`,
    structuredData: buildModuleSchema('Entropy & Randomness', 'PT40M', 'Intermediate'),
  },

  '/learn/qkd': {
    title: 'Quantum Key Distribution — BB84 Protocol & Global Deployments | PQC Today',
    description:
      'Explore QKD fundamentals: BB84 protocol simulation with Eve interception, classical post-processing, hybrid key derivation, and real-world QKD network data.',
    canonical: `${BASE_URL}/learn/qkd`,
    structuredData: buildModuleSchema('Quantum Key Distribution', 'PT100M', 'Advanced'),
  },

  '/learn/vendor-risk': {
    title: 'Vendor & Supply Chain PQC Risk — Scorecards, CBOM & Contract Clauses | PQC Today',
    description:
      "Evaluate your supply chain's quantum readiness. Build PQC vendor scorecards across 6 dimensions, demand CycloneDX CBOM inventories, generate contract clauses, and map cryptographic risk across infrastructure layers.",
    canonical: `${BASE_URL}/learn/vendor-risk`,
    structuredData: buildModuleSchema('Vendor & Supply Chain PQC Risk', 'PT30M', 'Advanced'),
  },

  '/learn/compliance-strategy': {
    title:
      'PQC Compliance Strategy — CNSA 2.0, NIST IR 8547, Multi-Jurisdiction Planning | PQC Today',
    description:
      'Build a multi-jurisdiction PQC compliance strategy. Map CNSA 2.0, NIST IR 8547, ANSSI, and BSI requirements across your operating regions, build audit readiness checklists, and construct compliance timelines for key deadlines through 2035.',
    canonical: `${BASE_URL}/learn/compliance-strategy`,
    structuredData: buildModuleSchema('PQC Compliance & Regulatory Strategy', 'PT30M', 'Advanced'),
  },

  '/learn/migration-program': {
    title:
      'PQC Migration Program Management — 7-Phase Roadmap, KPIs & Stakeholder Planning | PQC Today',
    description:
      'Structure your enterprise PQC migration as a multi-year program. Apply the 7-phase CISA/NIST framework — from discovery and CBOM to validation — with roadmap builder, stakeholder communications planner, and KPI tracker.',
    canonical: `${BASE_URL}/learn/migration-program`,
    structuredData: buildModuleSchema('PQC Migration Program Management', 'PT30M', 'Advanced'),
  },

  '/learn/pqc-risk-management': {
    title: 'PQC Risk Management — CRQC Scenarios, Risk Register & Heatmap | PQC Today',
    description:
      "Quantify your organization's quantum risk exposure. Model CRQC arrival scenarios, build a cryptographic risk register with likelihood × impact scoring, and visualize migration priorities on a 5×5 risk heatmap.",
    canonical: `${BASE_URL}/learn/pqc-risk-management`,
    structuredData: buildModuleSchema('PQC Risk Management', 'PT30M', 'Intermediate'),
  },

  '/learn/pqc-business-case': {
    title:
      'Building the PQC Business Case — ROI Calculator, Breach Modeling & Board Pitch | PQC Today',
    description:
      'Make the financial case for PQC migration. Calculate risk-adjusted ROI, model HNDL breach costs with industry data, quantify compliance penalty exposure, and generate a board-ready investment memo with executive summary.',
    canonical: `${BASE_URL}/learn/pqc-business-case`,
    structuredData: buildModuleSchema('Building the PQC Business Case', 'PT30M', 'Intermediate'),
  },

  '/learn/pqc-governance': {
    title: 'PQC Governance & Policy — RACI Matrix, Policy Templates & KPI Dashboard | PQC Today',
    description:
      'Establish enterprise governance for your PQC transition. Build RACI matrices for migration responsibilities, generate cryptographic policy templates across 4 layers, choose a governance model, and design a KPI dashboard for board reporting.',
    canonical: `${BASE_URL}/learn/pqc-governance`,
    structuredData: buildModuleSchema('PQC Governance & Policy', 'PT30M', 'Advanced'),
  },

  '/learn/code-signing': {
    title: 'Code Signing & Supply Chain Security — PQC ML-DSA, Sigstore & Secure Boot | PQC Today',
    description:
      'Post-quantum code signing: sign binaries and packages with ML-DSA, build PQC certificate chains, simulate Sigstore keyless signing, and explore secure boot firmware trust chains with LMS/XMSS vs ML-DSA trade-offs.',
    canonical: `${BASE_URL}/learn/code-signing`,
    structuredData: buildModuleSchema('Code Signing & Supply Chain Security', 'PT50M', 'Advanced'),
  },

  '/learn/api-security-jwt': {
    title: 'API Security & PQC JWT — ML-DSA Signing, ML-KEM JWE & OAuth 2.0 Migration | PQC Today',
    description:
      'Migrate API authentication to post-quantum cryptography. Decode JWTs, replace RS256/ES256 with ML-DSA signing, swap ECDH-ES for ML-KEM key agreement in JWE, analyze PQC token size impacts, and plan OAuth 2.0/OIDC migration.',
    canonical: `${BASE_URL}/learn/api-security-jwt`,
    structuredData: buildModuleSchema('API Security & JWT with PQC', 'PT60M', 'Advanced'),
  },

  '/learn/iot-pqc': {
    title: 'IoT & Embedded Device PQC — Constrained Devices, Firmware & Protocols | PQC Today',
    description:
      'Post-quantum cryptography for IoT and embedded devices: algorithm fit by device class, firmware signing with LMS and ML-DSA, DTLS 1.3 and EDHOC, certificate size, device identity, fleet keys and IoT regulation.',
    canonical: `${BASE_URL}/learn/iot-pqc`,
    structuredData: buildModuleSchema('IoT & Embedded Device PQC', 'PT90M', 'Advanced'),
  },

  '/learn/data-asset-sensitivity': {
    title: 'Data & Asset Sensitivity Assessment — NIST RMF, ISO 27005, FAIR, DORA | PQC Today',
    description:
      'Classify organizational data assets, map GDPR/HIPAA/NIS2/DORA compliance obligations, apply NIST RMF, ISO 27005, and FAIR risk methodologies, and generate a PQC migration priority map for your most sensitive assets.',
    canonical: `${BASE_URL}/learn/data-asset-sensitivity`,
    structuredData: buildModuleSchema(
      'Data & Asset Sensitivity Assessment',
      'PT50M',
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
      'PT40M',
      'Intermediate'
    ),
  },

  '/learn/confidential-computing': {
    title: 'Confidential Computing & TEEs — SGX, SEV-SNP, ARM CCA & PQC | PQC Today',
    description:
      'Explore Trusted Execution Environments for PQC: Intel SGX, AMD SEV-SNP, ARM CCA architectures, remote attestation flows, sealing key migration, and quantum threat timelines for TEE-based systems.',
    canonical: `${BASE_URL}/learn/confidential-computing`,
    structuredData: buildModuleSchema('Confidential Computing & TEEs', 'PT60M', 'Advanced'),
  },

  '/learn/homomorphic-encryption': {
    title: 'Homomorphic Encryption (FHE) & HSM Key Custody — ISO/IEC 28033 & PQC | PQC Today',
    description:
      'Compute on encrypted data without trusting the hardware: the ISO/IEC 28033 draft FHE schemes, FHE keys and who runs each operation, FHE against the quantum threat, and how an HSM holds the FHE secret key without becoming a decryption oracle.',
    canonical: `${BASE_URL}/learn/homomorphic-encryption`,
    structuredData: buildModuleSchema(
      'Homomorphic Encryption (FHE) & HSM Key Custody',
      'PT45M',
      'Advanced'
    ),
  },

  '/learn/web-gateway-pqc': {
    title: 'Web Gateway PQC — CDN, WAF, Load Balancer & Reverse Proxy Migration | PQC Today',
    description:
      'Plan PQC migration for web infrastructure: CDN edge TLS, WAF inspection with ML-KEM, load balancer cipher suite updates, and reverse proxy certificate chain management.',
    canonical: `${BASE_URL}/learn/web-gateway-pqc`,
    structuredData: buildModuleSchema('Web Gateway PQC', 'PT60M', 'Intermediate'),
  },

  '/learn/emv-payment-pqc': {
    title:
      'Financial Services & Payments PQC — Cards, Interbank Settlement & Key Blocks | PQC Today',
    description:
      'Post-quantum migration across payments and banking: EMV SDA/DDA/CDA authentication, tokenization, POS and DUKPT key injection, Swift and RTGS settlement rails, ANSI X9.143 key blocks, and the sector regulation setting the pace.',
    canonical: `${BASE_URL}/learn/emv-payment-pqc`,
    structuredData: buildModuleSchema('Financial Services & Payments PQC', 'PT120M', 'Advanced'),
  },
  '/learn/government-defense-pqc': {
    title: 'Government & Defense PQC — CNSA 2.0, Federal PKI & NSS Mandates | PQC Today',
    description:
      'The federal post-quantum policy layer: the CNSA 2.0 suite, the dated CNSSP 15 milestones for National Security Systems, CSfC, Federal PKI and its draft ML-DSA/ML-KEM certificate profile, and PQC procurement requirements.',
    canonical: `${BASE_URL}/learn/government-defense-pqc`,
    structuredData: buildModuleSchema('Government & Defense PQC', 'PT60M', 'Advanced'),
  },
  '/learn/trust-services-pqc': {
    title: 'Trust Services & Long-Term Signatures — Timestamping, LTV & PQC | PQC Today',
    description:
      'Signatures that must verify in thirty years: qualified vs advanced signatures, RFC 3161 timestamping, long-term validation and re-timestamping, TSP conformity, and ETSI TS 119 312 V2.1.1 post-quantum suites.',
    canonical: `${BASE_URL}/learn/trust-services-pqc`,
    structuredData: buildModuleSchema(
      'Trust Services & Long-Term Signatures',
      'PT60M',
      'Intermediate'
    ),
  },

  '/learn/crypto-dev-apis': {
    title: 'Cryptographic APIs & Developer Languages — JCA, OpenSSL EVP, PKCS#11, CNG | PQC Today',
    description:
      'Master PQC integration across 7 languages and 5 crypto APIs: JCA/JCE, OpenSSL EVP, PKCS#11, CNG, and Bouncy Castle. Provider patterns, build-vs-buy analysis, and crypto agility patterns.',
    canonical: `${BASE_URL}/learn/crypto-dev-apis`,
    structuredData: buildModuleSchema(
      'Cryptographic APIs & Developer Languages',
      'PT80M',
      'Intermediate'
    ),
  },

  '/learn/platform-eng-pqc': {
    title:
      'Platform Engineering & PQC — CI/CD Crypto Inventory, Container Signing & Policy | PQC Today',
    description:
      'Migrate your platform to post-quantum: CI/CD pipeline crypto inventory, container signing with ML-DSA via cosign/Notation, IaC defaults, OPA/Kyverno policy enforcement, and crypto posture monitoring.',
    canonical: `${BASE_URL}/learn/platform-eng-pqc`,
    structuredData: buildModuleSchema('Platform Engineering & PQC', 'PT80M', 'Advanced'),
  },

  '/learn/ot-pqc': {
    title: 'OT & Industrial Control Systems PQC — IEC 62443, SCADA & Substations | PQC Today',
    description:
      'Post-quantum cryptography for operational technology in energy, water, rail, manufacturing and buildings: IEC 62443 zones, OT protocol security, safety timing, PLC signing, NERC CIP and NIS2.',
    canonical: `${BASE_URL}/learn/ot-pqc`,
    structuredData: buildModuleSchema('OT & Industrial Control Systems PQC', 'PT90M', 'Advanced'),
  },

  '/learn/healthcare-pqc': {
    title: 'Healthcare PQC — HIPAA, HL7 FHIR, Medical Device & EHR Migration | PQC Today',
    description:
      'Post-quantum migration for healthcare: HIPAA compliance, HL7 FHIR API security, medical device firmware signing, EHR encryption, and clinical data protection strategies.',
    canonical: `${BASE_URL}/learn/healthcare-pqc`,
    structuredData: buildModuleSchema('Healthcare PQC', 'PT60M', 'Intermediate'),
  },

  '/learn/aerospace-pqc': {
    title: 'Aerospace PQC — Satellite Comms, CCSDS & DO-326A Migration | PQC Today',
    description:
      'Post-quantum cryptography for aerospace: satellite communication links, CCSDS protocol security, DO-326A airworthiness, ground station upgrades, and long-lifecycle mission planning.',
    canonical: `${BASE_URL}/learn/aerospace-pqc`,
    structuredData: buildModuleSchema('Aerospace PQC', 'PT80M', 'Advanced'),
  },

  '/learn/automotive-pqc': {
    title: 'Automotive PQC — V2X, AUTOSAR, ISO 21434 & ECU Migration | PQC Today',
    description:
      'Post-quantum migration for automotive: V2X communication security, AUTOSAR crypto stack, ISO 21434 compliance, ECU firmware signing, and connected vehicle PKI.',
    canonical: `${BASE_URL}/learn/automotive-pqc`,
    structuredData: buildModuleSchema('Automotive PQC', 'PT80M', 'Advanced'),
  },

  '/learn/exec-quantum-impact': {
    title: 'Executive Quantum Impact Guide — PQC Strategy for Business Leaders | PQC Today',
    description:
      'A 30-minute executive briefing on quantum computing threats to your business. Understand HNDL risks, regulatory deadlines, budget implications, and board-level action items.',
    canonical: `${BASE_URL}/learn/exec-quantum-impact`,
    structuredData: buildModuleSchema('Executive Quantum Impact Guide', 'PT30M', 'Beginner'),
  },

  '/learn/talking-about-pqc': {
    title: 'Talking About PQC Accurately — A Guide for Non-Technical Roles | PQC Today',
    description:
      'For sales, marketing, communications, procurement and press: what is true about post-quantum cryptography today, which deadlines are real, what a FIPS certificate proves, and which claims to avoid.',
    canonical: `${BASE_URL}/learn/talking-about-pqc`,
    structuredData: buildModuleSchema('Talking About PQC Accurately', 'PT30M', 'Beginner'),
  },

  '/learn/dev-quantum-impact': {
    title: 'Developer Quantum Impact Guide — PQC for Software Engineers | PQC Today',
    description:
      'A 30-minute developer guide to post-quantum cryptography. Learn which libraries support PQC, how to integrate ML-KEM/ML-DSA, and what changes in your code.',
    canonical: `${BASE_URL}/learn/dev-quantum-impact`,
    structuredData: buildModuleSchema('Developer Quantum Impact Guide', 'PT20M', 'Beginner'),
  },

  '/learn/arch-quantum-impact': {
    title: 'Architect Quantum Impact Guide — PQC System Design Decisions | PQC Today',
    description:
      'A 30-minute architect guide to post-quantum system design. Crypto agility patterns, hybrid deployment strategies, and infrastructure migration sequencing.',
    canonical: `${BASE_URL}/learn/arch-quantum-impact`,
    structuredData: buildModuleSchema('Architect Quantum Impact Guide', 'PT20M', 'Beginner'),
  },

  '/learn/ops-quantum-impact': {
    title: 'Operations Quantum Impact Guide — PQC for IT & Security Ops | PQC Today',
    description:
      'A 30-minute operations guide to PQC migration. Certificate rotation, HSM firmware updates, monitoring for algorithm deprecation, and incident response planning.',
    canonical: `${BASE_URL}/learn/ops-quantum-impact`,
    structuredData: buildModuleSchema('Operations Quantum Impact Guide', 'PT20M', 'Beginner'),
  },

  '/learn/research-quantum-impact': {
    title: 'Researcher Quantum Impact Guide — PQC for Security Researchers | PQC Today',
    description:
      'A 30-minute guide for security researchers on post-quantum cryptography. Lattice-based security proofs, side-channel considerations, and open research questions.',
    canonical: `${BASE_URL}/learn/research-quantum-impact`,
    structuredData: buildModuleSchema('Researcher Quantum Impact Guide', 'PT20M', 'Beginner'),
  },

  '/learn/ai-security-pqc': {
    title:
      'AI Security & PQC — Model Protection, Federated Learning & ML Pipeline Security | PQC Today',
    description:
      'Post-quantum security for AI systems: model weight encryption, federated learning channel protection, ML pipeline integrity, inference API authentication, and adversarial robustness in a quantum era.',
    canonical: `${BASE_URL}/learn/ai-security-pqc`,
    structuredData: buildModuleSchema('AI Security & PQC', 'PT80M', 'Advanced'),
  },

  '/learn/secrets-management-pqc': {
    title: 'Secrets Management & PQC — Vault, AWS, Azure & GCP Migration | PQC Today',
    description:
      'Post-quantum secrets management: HashiCorp Vault transit encryption, AWS/Azure/GCP secrets migration, rotation policy design, and CI/CD pipeline integration with PQC-safe key wrapping.',
    canonical: `${BASE_URL}/learn/secrets-management-pqc`,
    structuredData: buildModuleSchema('Secrets Management & PQC', 'PT60M', 'Advanced'),
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
    structuredData: buildModuleSchema('Database Encryption & PQC', 'PT50M', 'Intermediate'),
  },

  '/learn/iam-pqc': {
    title: 'Identity & Access Management with PQC — JWT, SAML, OIDC & Zero Trust | PQC Today',
    description:
      'Post-quantum IAM migration: JWT/SAML/OIDC token signing with ML-DSA, Active Directory and LDAP upgrades, vendor readiness scoring, and Zero Trust identity architecture.',
    canonical: `${BASE_URL}/learn/iam-pqc`,
    structuredData: buildModuleSchema(
      'Identity & Access Management with PQC',
      'PT60M',
      'Intermediate'
    ),
  },

  '/learn/secure-boot-pqc': {
    title: 'Secure Boot & Firmware PQC — UEFI, TPM 2.0, DICE & ML-DSA Signing | PQC Today',
    description:
      'Post-quantum secure boot: UEFI PK/KEK/db key migration to ML-DSA, TPM 2.0 key hierarchy, DICE attestation, firmware vendor readiness, and boot chain integrity verification.',
    canonical: `${BASE_URL}/learn/secure-boot-pqc`,
    structuredData: buildModuleSchema('Secure Boot & Firmware PQC', 'PT60M', 'Advanced'),
  },

  '/learn/os-pqc': {
    title: 'Operating System & Platform Crypto PQC — OpenSSL, SSH, GnuTLS & FIPS | PQC Today',
    description:
      'Post-quantum OS crypto migration: OpenSSL provider architecture, SSH host key migration, GnuTLS/Schannel policy configuration, package signing, and FIPS 140-3 compatibility across RHEL, Ubuntu, Windows Server, and more.',
    canonical: `${BASE_URL}/learn/os-pqc`,
    structuredData: buildModuleSchema(
      'Operating System & Platform Crypto PQC',
      'PT50M',
      'Intermediate'
    ),
  },

  '/learn/quiz': {
    title: 'PQC Quiz — Test Your Post-Quantum Cryptography Knowledge | PQC Today',
    description:
      'Challenge yourself across all PQC topics: algorithms, NIST standards, compliance, migration strategy, and protocol security. Adaptive difficulty.',
    canonical: `${BASE_URL}/learn/quiz`,
  },

  '/learn/pqc-testing-validation': {
    title: 'PQC Network Testing & Validation | PQC Today',
    description:
      'Design and execute testing strategies for post-quantum cryptography deployments. Covers passive crypto discovery, active endpoint scanning, performance benchmarking, interoperability testing, TVLA side-channel assessment, and building a comprehensive PQC test program.',
    canonical: `${BASE_URL}/learn/pqc-testing-validation`,
    structuredData: buildModuleSchema('PQC Network Testing & Validation', 'PT120M', 'Advanced'),
  },

  '/learn/acvp-lab-workflow': {
    title: 'ACVP Lab Workflow — From Vector Set to Evidence (Draft) | PQC Today',
    description:
      'How algorithm validation testing runs: CAVP vs CMVP, ACVP registration and vector sets, test types, PKCS#11 adapter limits, negative testing, and stating results at the evidence level reached. Draft awaiting lab-practitioner review.',
    canonical: `${BASE_URL}/learn/acvp-lab-workflow`,
    structuredData: buildModuleSchema(
      'ACVP Lab Workflow: From Vector Set to Evidence',
      'PT90M',
      'Advanced'
    ),
  },

  // --- Modules that were in the catalog but had no page entry (title and description are the module's own) ---

  '/learn/cbom': {
    title: 'Cryptography Bill of Materials (CBOM) | PQC Today',
    description:
      'Choose a CBOM format, discover all your cryptography — including the crypto nobody tracks — give each key its identity and provenance, and make the inventory machine-verifiable.',
    canonical: `${BASE_URL}/learn/cbom`,
    structuredData: buildModuleSchema(
      'Cryptography Bill of Materials (CBOM)',
      'PT60M',
      'Intermediate'
    ),
  },

  '/learn/crypto-mgmt-modernization': {
    title: 'Cryptographic Management Modernization | PQC Today',
    description:
      'Build a modern cryptographic posture management program across certificates, libraries, software, and keys — iterative and ROI-positive even if quantum never arrives.',
    canonical: `${BASE_URL}/learn/crypto-mgmt-modernization`,
    structuredData: buildModuleSchema(
      'Cryptographic Management Modernization',
      'PT55M',
      'Intermediate'
    ),
  },

  '/learn/crypto-registry': {
    title: 'CycloneDX Cryptography Registry | PQC Today',
    description:
      'One canonical name per cryptographic mechanism — resolve the same algorithm or curve across HSM, certificate, protocol and library notations, and see exactly where PQC families fit.',
    canonical: `${BASE_URL}/learn/crypto-registry`,
    structuredData: buildModuleSchema('CycloneDX Cryptography Registry', 'PT30M', 'Intermediate'),
  },

  '/learn/mls-group-messaging': {
    title: 'MLS — Group Messaging | PQC Today',
    description:
      'Messaging Layer Security (RFC 9420) with TreeKEM, HPKE, and a PKCS#11-backed openmls provider. Scales group key agreement to thousands while keeping signature keys in the HSM.',
    canonical: `${BASE_URL}/learn/mls-group-messaging`,
    structuredData: buildModuleSchema('MLS — Group Messaging', 'PT40M', 'Intermediate'),
  },

  '/learn/pki-enrollment-protocols': {
    title: 'PKI Enrollment Protocols (EST & CMP) | PQC Today',
    description:
      'RFC 7030 EST and RFC 9810 CMP (KEM update) — hands-on PQC certificate enrollment with real OpenSSL 3.6 WASM crypto and an in-browser mock CA.',
    canonical: `${BASE_URL}/learn/pki-enrollment-protocols`,
    structuredData: buildModuleSchema('PKI Enrollment Protocols (EST & CMP)', 'PT50M', 'Advanced'),
  },

  '/learn/pqc-candidates': {
    title: 'PQC Candidates & Lifecycle | PQC Today',
    description:
      'How NIST evaluates new post-quantum mechanisms, the nine third-round signature on-ramp candidates (NIST IR 8610, May 2026) across four math families, and the worldwide parallel tracks (KpqC, CACR, ISO/IEC).',
    canonical: `${BASE_URL}/learn/pqc-candidates`,
    structuredData: buildModuleSchema('PQC Candidates & Lifecycle', 'PT55M', 'Intermediate'),
  },

  '/learn/pqc-grc': {
    title: 'PQC GRC | PQC Today',
    description:
      'Wire post-quantum risk into governance, risk, and compliance: cascade Key Risk Indicators from board to operational level, triage a deferral exception register into SOC suppression, and hand off cleanly between GRC and the SOC.',
    canonical: `${BASE_URL}/learn/pqc-grc`,
    structuredData: buildModuleSchema('PQC GRC', 'PT30M', 'Intermediate'),
  },

  '/learn/sbom': {
    title: 'Software Bill of Materials (SBOM) | PQC Today',
    description:
      'Inventory every software component a product depends on — supplier, version, dependency graph — the discovery input that feeds a CBOM and closes the vulnerability-triage loop with VEX.',
    canonical: `${BASE_URL}/learn/sbom`,
    structuredData: buildModuleSchema('Software Bill of Materials (SBOM)', 'PT30M', 'Intermediate'),
  },

  '/learn/skills-team-structure': {
    title: 'Skills & Team Structure | PQC Today',
    description:
      'Size and staff the PQC migration program: convert your cryptographic estate into an FTE estimate with the 1-FTE-per-500-instances heuristic, build a federated Crypto Champion roster, and track each champion’s readiness commitments.',
    canonical: `${BASE_URL}/learn/skills-team-structure`,
    structuredData: buildModuleSchema('Skills & Team Structure', 'PT30M', 'Intermediate'),
  },

  '/learn/slh-dsa': {
    title: 'SLH-DSA: Stateless Hash Signatures | PQC Today',
    description:
      'Master FIPS 205 SLH-DSA: WOTS+, FORS, hypertree architecture, parameter trade-offs, context strings, deterministic signing, and migration from stateful schemes.',
    canonical: `${BASE_URL}/learn/slh-dsa`,
    structuredData: buildModuleSchema('SLH-DSA: Stateless Hash Signatures', 'PT45M', 'Advanced'),
  },

  '/learn/soc-implementation-pqc': {
    title: 'SOC Implementation for PQC | PQC Today',
    description:
      'Operationalize PQC defense in the SOC: five detection use cases (hybrid downgrade, crypto drift, certificate-lifecycle anomalies, signature integrity, HNDL indicators), the posture registry they depend on.',
    canonical: `${BASE_URL}/learn/soc-implementation-pqc`,
    structuredData: buildModuleSchema('SOC Implementation for PQC', 'PT60M', 'Advanced'),
  },

  '/learn/verification-closure': {
    title: 'Decommissioning & Program Closure | PQC Today',
    description:
      'Retire classical cryptography on a defensible schedule, prove the migration actually happened from observed behaviour, and hand the program to business-as-usual.',
    canonical: `${BASE_URL}/learn/verification-closure`,
    structuredData: buildModuleSchema('Decommissioning & Program Closure', 'PT40M', 'Intermediate'),
  },

  '/explore': {
    title: 'Explore | PQC Today',
    description:
      'Discover post-quantum cryptography resources — interactive timelines, {modules} learning modules, compliance tools, migration guides, and the PQC risk assessment.',
    canonical: `${BASE_URL}/explore`,
  },

  '/patents': {
    title: 'PQC Patent Landscape | PQC Today',
    description:
      'Cryptographic patents relevant to post-quantum migration, enriched with 25 technical dimensions. For research purposes only — not legal or IP advice.',
    canonical: `${BASE_URL}/patents`,
  },

  '/navigate': {
    title: 'Navigate the PQC Knowledge Graph | PQC Today',
    description:
      'Interactive 3D map of the post-quantum cryptography landscape — standards, algorithms, protocols, compliance mandates, industries, use cases, products, vendors, patents, and community leaders, linked by how they relate.',
    canonical: `${BASE_URL}/navigate`,
  },
}

// --- Counts quoted in page copy -------------------------------------------------------------------
// A title or description writes "{modules}" where it quotes the number of Learn modules and
// "{businessTools}" where it quotes the number of Business Tools, in titles, descriptions and structured
// data alike. The /learn course data carries the
// module count and the total study time. They all come from the pages themselves (the module pages
// below, counted the way the app counts them: the catalog without the quiz, and the generated tool
// list), so adding a module or a tool updates every place at once. learnRoutes.test.ts and
// searchRoutes.test.ts tie those sources to the real catalog and registry.
const moduleStudyMinutes = (iso: unknown): number => {
  const text = String(iso ?? '')
  return Number(/(\d+)H/.exec(text)?.[1] ?? 0) * 60 + Number(/(\d+)M/.exec(text)?.[1] ?? 0)
}
const modulePages = Object.entries(ROUTE_META).filter(
  ([path]) => path.startsWith('/learn/') && path !== '/learn/quiz'
)
export const LEARN_MODULE_COUNT = modulePages.length
const LEARN_STUDY_MINUTES = modulePages.reduce(
  (sum, [, meta]) => sum + moduleStudyMinutes(meta.structuredData?.timeRequired),
  0
)

const BUSINESS_TOOL_COUNT = TOOL_ROUTE_META.filter((tool) => tool.kind === 'business-tool').length
const QUOTED_COUNTS: Record<string, number> = {
  '{modules}': LEARN_MODULE_COUNT,
  '{businessTools}': BUSINESS_TOOL_COUNT,
}

/** Fill the count placeholders in a string, or in every string inside structured data. */
function fillCounts(value: unknown): unknown {
  if (typeof value === 'string') {
    return Object.entries(QUOTED_COUNTS).reduce(
      (text, [token, count]) => text.replaceAll(token, String(count)),
      value
    )
  }
  if (Array.isArray(value)) return value.map(fillCounts)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, fillCounts(inner)]))
  }
  return value
}

for (const meta of Object.values(ROUTE_META)) {
  meta.title = fillCounts(meta.title) as string
  meta.description = fillCounts(meta.description) as string
  if (meta.structuredData)
    meta.structuredData = fillCounts(meta.structuredData) as Record<string, unknown>
}

ROUTE_META['/learn']!.structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Post-Quantum Cryptography Learning Path',
  description: `${LEARN_MODULE_COUNT} interactive modules covering PQC fundamentals, protocols, infrastructure, applications, industry verticals, and role-based guides with real cryptographic operations.`,
  provider: { '@type': 'Organization', name: 'PQC Today', url: BASE_URL },
  isAccessibleForFree: true,
  numberOfCredits: LEARN_MODULE_COUNT,
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    courseWorkload: `PT${Math.round(LEARN_STUDY_MINUTES / 60)}H`,
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

/** Dynamic/child route prefixes that inherit a parent section's title + description. */
const PARENT_PREFIXES: ReadonlyArray<readonly [string, string]> = [
  ['/business/tools/', '/business/tools'],
  ['/learn/', '/learn'],
  ['/playground/', '/playground'],
  ['/migrate/', '/migrate'],
  ['/assess/', '/assess'],
  ['/patents/', '/patents'],
  ['/library/', '/library'],
]

const TOOL_META_BY_PATH = new Map(TOOL_ROUTE_META.map((route) => [route.path, route]))

/**
 * Routes that exist but must not be indexed: legacy duplicates of redesigned
 * pages and the signed embed surface. They still resolve to real metadata so the
 * canonical stays self-referential, but PageMeta marks them noindex.
 */
export function isNoindexRoute(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const tool = TOOL_META_BY_PATH.get(normalized)
  return (
    tool?.index === false ||
    normalized.endsWith('/legacy') ||
    normalized === '/embed' ||
    normalized.startsWith('/embed/') ||
    (normalized.startsWith('/business/tools/') && !tool) ||
    (normalized.startsWith('/playground/') && !tool && !Object.hasOwn(ROUTE_META, normalized))
  )
}

/**
 * Match a pathname to its route metadata.
 *
 * Unknown routes NEVER fall back to the homepage's canonical (that would tell
 * search engines the page is a duplicate of the homepage and drop it). Instead
 * the canonical is always self-referential; only the human-readable
 * title/description are inherited from the parent section when available.
 */
export function getRouteMeta(pathname: string): RouteMeta {
  // Normalize trailing slash (but keep the root "/")
  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  const noindex = isNoindexRoute(normalized) || undefined
  const selfCanonical = `${BASE_URL}${normalized === '/' ? '/' : normalized}`

  // Exact match — hasOwn guard makes these accesses safe
  if (Object.hasOwn(ROUTE_META, normalized)) {
    // eslint-disable-next-line security/detect-object-injection
    const meta = ROUTE_META[normalized]!
    return noindex ? { ...meta, noindex } : meta
  }

  const tool = TOOL_META_BY_PATH.get(normalized)
  if (tool) {
    return {
      title: tool.title,
      description: tool.description,
      canonical: selfCanonical,
      noindex: tool.index ? undefined : true,
    }
  }

  // Dynamic/child routes — inherit the parent section's title + description, but
  // keep a self-referential canonical and drop the parent's structured data.
  for (const [prefix, parent] of PARENT_PREFIXES) {
    if (normalized.startsWith(prefix) && Object.hasOwn(ROUTE_META, parent)) {
      // eslint-disable-next-line security/detect-object-injection
      const meta = ROUTE_META[parent]!
      return {
        title: meta.title,
        description: meta.description,
        canonical: selfCanonical,
        ogImage: meta.ogImage,
        noindex,
      }
    }
  }

  // Unknown top-level route — generic title + homepage description, self canonical.
  return {
    title: ROUTE_META['/']!.title,
    description: ROUTE_META['/']!.description,
    canonical: selfCanonical,
    noindex,
  }
}
