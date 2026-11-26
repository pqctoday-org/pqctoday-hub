// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The links lessons used to carry as hand-typed "Related Resources" and "Related modules" lists, kept as data.
 * The lesson page's "Related resources" box shows them as "Related lessons" (other lessons, including one
 * workshop step) and "Elsewhere on the Hub" (other pages, some opened with a filter).
 *
 * Every title and reason is the wording the lesson used. A reason may be empty (the old block had none).
 * `lessonRelatedLinks.test.ts` checks that every lesson and target lesson exists and is not retired, that
 * every page route exists, that each query parameter is one the page reads, and that filter values exist
 * in the Hub's data.
 */

export interface RelatedLink {
  /** An address inside the Hub: `/learn/<lesson>[?...]` or a page with an optional filter. */
  to: string
  title: string
  /** The one-line reason the lesson gave for the link; empty when it gave none. */
  reason: string
}

export interface LessonRelatedLinks {
  /** Other lessons, in the order the lesson listed them. */
  lessons: readonly RelatedLink[]
  /** Other pages of the Hub, in the order the lesson listed them. */
  pages: readonly RelatedLink[]
}

/** Keyed by the lesson's module id (the address `/learn/<id>`). */
export const LESSON_RELATED_LINKS: Readonly<Record<string, LessonRelatedLinks>> = {
  '5g-security': {
    lessons: [
      {
        to: '/learn/tls-basics',
        title: 'TLS Basics',
        reason: 'How TLS 1.3 works and where PQC fits in',
      },
      {
        to: '/learn/iot-pqc',
        title: 'IoT & Embedded Device PQC',
        reason: 'PQC for constrained devices & industrial protocols',
      },
      {
        to: '/learn/automotive-pqc',
        title: 'Automotive PQC',
        reason: 'V2X, AUTOSAR & connected vehicle PQC migration',
      },
    ],
    pages: [
      {
        to: '/algorithms',
        title: 'Algorithm Explorer',
        reason: 'Compare key sizes, security levels & performance',
      },
      {
        to: '/threats?industry=Telecommunications',
        title: 'Threat Dashboard',
        reason: 'Industry-specific quantum risks & PQC replacements',
      },
      {
        to: '/timeline',
        title: 'Migration Timeline',
        reason: 'NIST milestones, country deadlines & standardization',
      },
    ],
  },
  'aerospace-pqc': {
    lessons: [
      {
        to: '/learn/iot-pqc',
        title: 'IoT & Embedded Device PQC',
        reason: 'PQC migration for embedded and space-rated processors',
      },
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC',
        reason: 'Radiation-hardened HSMs for ML-KEM and ML-DSA key storage',
      },
      {
        to: '/learn/code-signing',
        title: 'Code Signing',
        reason: 'PQC firmware signing for flight-critical and satellite systems',
      },
      {
        to: '/learn/stateful-signatures',
        title: 'Stateful Signatures',
        reason: 'LMS and XMSS for long-lived aerospace mission signing keys',
      },
    ],
    pages: [],
  },
  'ai-security-pqc': {
    lessons: [
      {
        to: '/learn/code-signing',
        title: 'Code Signing',
        reason: 'ML-DSA model signing, Sigstore cosign, and in-toto attestation',
      },
      {
        to: '/learn/confidential-computing',
        title: 'Confidential Computing',
        reason: 'TEE-based model protection and PQC attestation during inference',
      },
      {
        to: '/learn/api-security-jwt',
        title: 'API Security & JWT',
        reason: 'PQC token signing for AI API authentication and agent identity',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC',
        reason: 'PQC key hierarchies for AI model encryption and signing keys',
      },
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Algorithm-agnostic AI pipeline design for PQC algorithm rollout',
      },
    ],
    pages: [],
  },
  'api-security-jwt': {
    lessons: [
      {
        to: '/learn/hybrid-crypto',
        title: 'Hybrid Cryptography',
        reason: 'Composite signatures and dual-algorithm approaches',
      },
      { to: '/learn/kms-pqc', title: 'KMS & PQC Key Management', reason: 'JWKS' },
      {
        to: '/learn/iam-pqc',
        title: 'IAM & PQC',
        reason: 'JWT/SAML/OIDC token migration & identity provider PQC readiness',
      },
    ],
    pages: [
      {
        to: '/openssl',
        title: 'OpenSSL Studio',
        reason: 'Generate ML-DSA keys and sign data interactively',
      },
      {
        to: '/library?q=JOSE',
        title: 'Standards Library',
        reason: 'Browse JOSE PQC drafts, FIPS 203, and FIPS 204',
      },
    ],
  },
  'automotive-pqc': {
    lessons: [
      {
        to: '/learn/iot-pqc',
        title: 'IoT & Embedded Device PQC',
        reason: 'PQC for V2X, CAN bus, and automotive OT networks',
      },
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC',
        reason: 'Automotive-grade HSMs for secure boot and ECU key storage',
      },
      {
        to: '/learn/emv-payment-pqc',
        title: 'EMV Payment & PQC',
        reason: 'In-vehicle payment systems and connected mobility PQC migration',
      },
      {
        to: '/learn/vendor-risk',
        title: 'Vendor Risk',
        reason: 'Tier-1 and Tier-2 supplier PQC readiness assessment',
      },
    ],
    pages: [],
  },
  'cert-quantum-impact': {
    lessons: [
      {
        to: '/learn/crypto-product-certification',
        title: 'Cryptographic Product Certification',
        reason: 'Standards, evaluation criteria, and certification schemes',
      },
      {
        to: '/learn/fips-140-3-certification',
        title: 'FIPS 140-3 Certification',
        reason: 'CMVP boundaries, MIP queue, ESV, and submission routes',
      },
      {
        to: '/learn/acvp-lab-workflow',
        title: 'ACVP Lab Workflow',
        reason: 'PQC vector sets, seed-driven AFT keyGen, and harness discipline',
      },
      {
        to: '/learn/cc-eucc-certification',
        title: 'Common Criteria & EUCC',
        reason: 'EUCC ACM v2, eIDAS QSCDs, and NIAP Policy #33',
      },
    ],
    pages: [],
  },
  'code-signing': {
    lessons: [
      {
        to: '/learn/pki-workshop',
        title: 'PKI Workshop',
        reason: 'Certificate chains, X.509 structure, and trust models',
      },
      {
        to: '/learn/hybrid-crypto',
        title: 'Hybrid Cryptography',
        reason: 'Composite signatures and dual-algorithm approaches',
      },
      {
        to: '/learn/stateful-signatures',
        title: 'Stateful Hash Signatures',
        reason: 'LMS/XMSS deep dive, state management, and CNSA 2.0 timelines',
      },
      {
        to: '/learn/secure-boot-pqc',
        title: 'Secure Boot',
        reason: 'UEFI PK/KEK migration, TPM 2.0, and ML-DSA firmware signing',
      },
      {
        to: '/learn/platform-eng-pqc',
        title: 'Platform Engineering',
        reason: 'CI/CD pipeline crypto, container signing, and OPA/Kyverno policy',
      },
    ],
    pages: [
      {
        to: '/openssl',
        title: 'OpenSSL Studio',
        reason: 'Run ML-DSA signing and verification commands interactively',
      },
      {
        to: '/library?cat=Digital%20Signature',
        title: 'Standards Library',
        reason: 'Browse FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), and signing standards',
      },
    ],
  },
  'compliance-strategy': {
    lessons: [
      {
        to: '/learn/pqc-governance',
        title: 'PQC Governance & Policy',
        reason: 'RACI matrices, policies, and board reporting',
      },
      {
        to: '/learn/standards-bodies',
        title: 'Standards Bodies',
        reason: 'Who creates PQC standards, certifies products & mandates compliance',
      },
    ],
    pages: [
      {
        to: '/compliance',
        title: 'Compliance Tracker',
        reason: 'NIST, ANSSI, BSI, and Common Criteria compliance data',
      },
      { to: '/assess', title: 'Risk Assessment', reason: 'Run a guided PQC readiness assessment' },
      {
        to: '/timeline',
        title: 'PQC Timeline',
        reason: 'Country-by-country regulatory timeline explorer',
      },
    ],
  },
  'confidential-computing': {
    lessons: [
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC',
        reason: 'Hardware roots of trust for TEE attestation keys',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC',
        reason: 'Sealing key management and PQC key wrapping for enclaves',
      },
      {
        to: '/learn/pki-workshop',
        title: 'PKI Workshop',
        reason: 'Certificate infrastructure for remote attestation chains',
      },
      {
        to: '/learn/secure-boot-pqc',
        title: 'Secure Boot & PQC',
        reason: 'UEFI and firmware signing that underpins TEE security',
      },
      {
        to: '/learn/arch-quantum-impact?tab=workshop&step=5',
        title: 'Compare with the other trust hardware',
        reason: 'Side by side with TPMs, HSMs, DPUs and other roots of trust',
      },
    ],
    pages: [],
  },
  'crypto-agility': {
    lessons: [
      {
        to: '/learn/quantum-threats',
        title: 'Quantum Threats',
        reason: 'Why migration matters — the quantum threat explained',
      },
      {
        to: '/learn/code-signing',
        title: 'Code Signing',
        reason: 'Agile supply chain security with ML-DSA & Sigstore',
      },
    ],
    pages: [
      { to: '/assess', title: 'Risk Assessment', reason: 'Run a guided PQC readiness assessment' },
      {
        to: '/migrate',
        title: 'Migration Guide',
        reason: 'Detailed migration workflows and software catalog',
      },
      { to: '/compliance', title: 'Compliance Tracker', reason: 'NIST,' },
    ],
  },
  'crypto-dev-apis': {
    lessons: [
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Design provider-agnostic APIs to swap algorithms at runtime',
      },
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC',
        reason: 'PKCS#11 from the HSM admin view vs. developer API perspective',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC',
        reason: 'KMIP protocol and API-level key management integration',
      },
      {
        to: '/learn/code-signing',
        title: 'Code Signing',
        reason: 'Signing operations and API selection for CI/CD pipelines',
      },
      {
        to: '/learn/os-pqc',
        title: 'OS Cryptographic Stacks',
        reason: 'OS-level crypto providers that application APIs build on top of',
      },
      {
        to: '/learn/platform-eng-pqc',
        title: 'Platform Engineering',
        reason: 'CI/CD pipeline crypto inventory and library selection',
      },
    ],
    pages: [],
  },
  'data-asset-sensitivity': {
    lessons: [
      {
        to: '/learn/pqc-risk-management',
        title: 'PQC Risk Management',
        reason: 'NIST RMF, ISO 27005, FAIR, and DORA/NIS2 applied to PQC migration',
      },
      {
        to: '/learn/compliance-strategy',
        title: 'Compliance Strategy',
        reason: 'Framework-driven PQC compliance planning and gap analysis',
      },
      {
        to: '/learn/healthcare-pqc',
        title: 'Healthcare PQC',
        reason: 'HIPAA, ePHI protection, and healthcare data PQC migration',
      },
      {
        to: '/learn/database-encryption-pqc',
        title: 'Database Encryption',
        reason: 'TDE, column-level encryption, and BYOK key management',
      },
    ],
    pages: [],
  },
  'database-encryption-pqc': {
    lessons: [
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC',
        reason: 'Manage DEK and CMK lifecycles with PQC key wrapping',
      },
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC',
        reason: 'Hardware-backed TDE master key storage and ML-KEM support',
      },
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Algorithm-agnostic encryption layers for future-proof databases',
      },
      {
        to: '/learn/secrets-management-pqc',
        title: 'Secrets Management',
        reason: 'Vault-based dynamic secrets and PQC BYOK patterns',
      },
    ],
    pages: [],
  },
  'digital-assets': {
    lessons: [
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Algorithm-agnostic wallet and smart contract design',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC',
        reason: 'PQC key management for custodial and self-custody wallets',
      },
      {
        to: '/learn/hybrid-crypto',
        title: 'Hybrid Cryptography',
        reason: 'Transitional signature schemes for DeFi protocols and wallets',
      },
    ],
    pages: [
      {
        to: '/threats?industry=Cryptocurrency%20%2F%20Blockchain',
        title: 'Threat Dashboard',
        reason: 'Industry-specific quantum risks & PQC replacements',
      },
      {
        to: '/algorithms',
        title: 'Algorithm Explorer',
        reason: 'Compare key sizes, security levels & performance',
      },
      {
        to: '/playground',
        title: 'Playground',
        reason: 'Experiment with PQC algorithms interactively',
      },
      {
        to: '/assess',
        title: 'Risk Assessment',
        reason: "Assess your organisation's quantum readiness",
      },
    ],
  },
  'digital-id': {
    lessons: [
      {
        to: '/learn/pki-workshop',
        title: 'PKI Workshop',
        reason: 'X.509 certificates, CA chains & PQC credential foundations',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC Key Management',
        reason: 'Wallet key lifecycle, PQC rotation & envelope encryption',
      },
      {
        to: '/learn/iam-pqc',
        title: 'IAM & PQC',
        reason: 'JWT/SAML/OIDC token migration and identity provider PQC readiness',
      },
    ],
    pages: [
      {
        to: '/compliance?framework=EIDAS',
        title: 'Compliance',
        reason: 'eIDAS 2.0 obligations, PQC expectations & GDPR Art. 32',
      },
      {
        to: '/assess',
        title: 'Risk Assessment',
        reason: "Assess your organisation's quantum readiness",
      },
      {
        to: '/timeline?country=European%20Union',
        title: 'Migration Timeline',
        reason: 'EU PQC milestones: 2026 roadmaps, 2030 high-risk, 2035 full',
      },
      {
        to: '/threats',
        title: 'Threat Dashboard',
        reason: 'Industry-specific quantum risks & PQC replacements',
      },
    ],
  },
  'dnssec-pqc': {
    lessons: [
      {
        to: '/learn/network-security-pqc',
        title: 'Network Security',
        reason: 'Broader PQC migration across network security infrastructure',
      },
      {
        to: '/learn/vpn-ssh-pqc',
        title: 'VPN/IPsec & SSH',
        reason: 'Another protocol facing the same PQC message-size pressure',
      },
    ],
    pages: [
      {
        to: '/algorithms?tab=support&protocol=dnssec',
        title: 'Protocol Support Matrix',
        reason: 'Live-tracked DNSSEC deployment posture, refs, and stage',
      },
      {
        to: '/library?q=DNSSEC',
        title: 'Standards Library',
        reason: 'RFCs and IETF drafts behind PQ DNSSEC',
      },
    ],
  },
  'email-signing': {
    lessons: [
      {
        to: '/learn/pki-workshop',
        title: 'PKI Workshop',
        reason: 'Certificate chains, X.509 structure, and trust models',
      },
      {
        to: '/learn/hybrid-crypto',
        title: 'Hybrid Cryptography',
        reason: 'Composite signatures and dual-algorithm approaches',
      },
    ],
    pages: [
      {
        to: '/openssl',
        title: 'OpenSSL Studio',
        reason: 'Run CMS signing and encryption commands interactively',
      },
      {
        to: '/library?q=CMS',
        title: 'Standards Library',
        reason: 'Browse RFC 9629, RFC 9882, and other CMS PQC standards',
      },
    ],
  },
  'emv-payment-pqc': {
    lessons: [
      {
        to: '/learn/tls-basics',
        title: 'TLS Basics & PQC',
        reason: 'ML-KEM hybrid KEMs for securing payment network channels',
      },
      {
        to: '/learn/hybrid-crypto',
        title: 'Hybrid Cryptography',
        reason: 'Dual-signature card strategies for backwards-compatible migration',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC',
        reason: 'DUKPT and KIF key management lifecycle for PQC migration',
      },
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC',
        reason: 'Payment HSM vendors and PQC key-wrapping support timelines',
      },
      {
        to: '/learn/iot-pqc',
        title: 'IoT & Embedded Device PQC',
        reason: 'FN-DSA for constrained card chips and POS terminal migration',
      },
      {
        to: '/learn/compliance-strategy',
        title: 'Compliance Strategy',
        reason: 'PCI DSS, G7, and BIS regulatory timelines for payment PQC',
      },
    ],
    pages: [
      {
        to: '/threats?industry=Payment%20Card%20Industry',
        title: 'Payment Card Threats',
        reason: 'Card-ecosystem quantum threats, with sources',
      },
      {
        to: '/threats?industry=Finance%20%26%20Banking',
        title: 'Banking Threats',
        reason: 'Settlement, HSM and interbank threat entries',
      },
      {
        to: '/compliance?framework=DORA',
        title: 'Compliance Landscape',
        reason: 'DORA and the sector’s regulatory obligations',
      },
      {
        to: '/timeline?event=g7-g7-ceg-g7-financial-sector-critical-systems-pqc-transition',
        title: 'Migration Timeline',
        reason: 'The early-2030s targets this module cites',
      },
    ],
  },
  'entropy-randomness': {
    lessons: [
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC Key Management',
        reason: 'Key lifecycle, envelope encryption, and PQC rotation',
      },
      {
        to: '/learn/qkd',
        title: 'Quantum Key Distribution',
        reason: 'BB84 protocol, QRNG sources, and real-world QKD deployments',
      },
    ],
    pages: [
      {
        to: '/algorithms',
        title: 'Algorithm Explorer',
        reason: 'Compare PQC key sizes, security levels & performance',
      },
      {
        to: '/playground',
        title: 'Crypto Playground',
        reason: 'Hands-on hashing, KEM, and symmetric operations',
      },
    ],
  },
  'exec-quantum-impact': {
    lessons: [
      {
        to: '/learn/pqc-risk-management',
        title: 'PQC Risk Management',
        reason: 'Build risk registers and executive heatmaps',
      },
      {
        to: '/learn/pqc-business-case',
        title: 'PQC Business Case',
        reason: 'ROI models and board-level presentations',
      },
      {
        to: '/learn/pqc-governance',
        title: 'PQC Governance',
        reason: 'Governance frameworks and executive policies',
      },
      {
        to: '/learn/compliance-strategy',
        title: 'Compliance Strategy',
        reason: 'Multi-jurisdiction regulatory requirements',
      },
    ],
    pages: [],
  },
  'healthcare-pqc': {
    lessons: [
      {
        to: '/learn/iot-pqc',
        title: 'IoT & Embedded Device PQC',
        reason: 'PQC for implantable devices, monitors, and hospital OT networks',
      },
      {
        to: '/learn/compliance-strategy',
        title: 'Compliance Strategy',
        reason:
          'HIPAA, FDA premarket cybersecurity guidance, and NIS2 cyber risk-management duties',
      },
      {
        to: '/learn/pqc-risk-management',
        title: 'PQC Risk Management',
        reason: 'Risk registers for patient data and long-lifecycle medical records',
      },
    ],
    pages: [],
  },
  'homomorphic-encryption': {
    lessons: [
      {
        to: '/learn/confidential-computing',
        title: 'Confidential Computing & TEEs',
        reason: 'The other way to protect data in use: trust the hardware instead of the maths',
      },
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC',
        reason: 'The hardware that holds the FHE secret key and signs the public key set',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC',
        reason: 'Key lifecycle management for keys that live in hardware',
      },
    ],
    pages: [],
  },
  'hsm-pqc': {
    lessons: [
      {
        to: '/learn/arch-quantum-impact?tab=workshop&step=5',
        title: 'Compare with the other trust hardware',
        reason: 'HSMs, TPMs, Caliptra, confidential computing and DPUs side by side',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC',
        reason: 'Key management services that integrate with HSM backends',
      },
      {
        to: '/learn/stateful-signatures',
        title: 'Stateful Hash Signatures',
        reason: 'LMS and XMSS signing stored in HSM key stores',
      },
      {
        to: '/learn/pki-workshop',
        title: 'PKI Workshop',
        reason: 'HSM-backed CA operations and PQC certificate issuance',
      },
      {
        to: '/learn/qkd',
        title: 'Quantum Key Distribution',
        reason: 'QKD integration with HSM-based key injection pipelines',
      },
    ],
    pages: [],
  },
  'hybrid-crypto': {
    lessons: [
      {
        to: '/learn/quantum-threats',
        title: 'Quantum Threats',
        reason: 'Why hybrid? Understand the quantum threat first',
      },
      {
        to: '/learn/tls-basics',
        title: 'TLS Basics',
        reason: 'Interactive TLS 1.3 handshake simulator with hybrid KEM negotiation',
      },
      {
        to: '/learn/api-security-jwt',
        title: 'API Security & JWT',
        reason: 'Hybrid JOSE tokens with ML-DSA signing & ML-KEM encryption',
      },
      {
        to: '/learn/code-signing',
        title: 'Code Signing',
        reason: 'Hybrid & composite signatures for software supply chain',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC',
        reason: 'Key lifecycle management for hybrid & PQC key pairs',
      },
      {
        to: '/learn/qkd',
        title: 'Quantum Key Distribution',
        reason: 'Physical-layer key exchange complementing hybrid PQC schemes',
      },
    ],
    pages: [
      {
        to: '/algorithms?tab=detailed&q=hybrid',
        title: 'Algorithm Explorer',
        reason: 'Compare hybrid algorithm key sizes & performance',
      },
      {
        to: '/openssl',
        title: 'OpenSSL Studio',
        reason: 'Try hybrid key gen & cert commands directly',
      },
      {
        to: '/library?q=composite',
        title: 'Standards Library',
        reason: 'Read composite signature & KEM RFC drafts',
      },
    ],
  },
  'iam-pqc': {
    lessons: [
      {
        to: '/learn/pki-workshop',
        title: 'PKI & Certificate Authority',
        reason: 'Certificate lifecycle, CA hierarchies, and PQC certificate formats',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC Key Management',
        reason: 'Envelope encryption, key hierarchy, and cross-provider KMS strategies',
      },
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Algorithm-agnostic design patterns for IAM infrastructure',
      },
    ],
    pages: [
      {
        to: '/migrate?domain=identity',
        title: 'Migration Workbench',
        reason: 'IAM vendor migration status and PQC product catalog',
      },
    ],
  },
  'kms-pqc': {
    lessons: [
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC Operations',
        reason: 'PKCS#11 v3.2 mechanisms, firmware migration, and FIPS validation',
      },
      {
        to: '/learn/arch-quantum-impact?tab=workshop&step=5',
        title: 'Compare with the other trust hardware',
        reason: 'HSMs, TPMs, confidential computing and DPUs side by side',
      },
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Design patterns for algorithm-agnostic cryptographic infrastructure',
      },
      {
        to: '/learn/hybrid-crypto',
        title: 'Hybrid Cryptography',
        reason: 'Classical + PQC hybrid schemes for the transition period',
      },
      {
        to: '/learn/secrets-management-pqc',
        title: 'Secrets Management',
        reason: 'Vault, cloud secrets engines, and PQC rotation policies',
      },
      {
        to: '/learn/database-encryption-pqc',
        title: 'Database Encryption',
        reason: 'TDE, column-level encryption, and BYOK key management',
      },
      {
        to: '/learn/ai-security-pqc',
        title: 'AI Security & PQC',
        reason: 'AI model security, data pipeline encryption, and PQC for ML workloads',
      },
    ],
    pages: [
      {
        to: '/migrate',
        title: 'Migration Guide',
        reason: 'Software catalog and migration workflows',
      },
    ],
  },
  'merkle-tree-certs': {
    lessons: [
      {
        to: '/learn/stateful-signatures',
        title: 'Stateful Hash Signatures',
        reason: 'LMS, XMSS, and SLH-DSA Merkle tree internals',
      },
      {
        to: '/learn/pki-workshop',
        title: 'PKI Workshop',
        reason: 'Certificate issuance and PQC root of trust migration',
      },
      {
        to: '/learn/tls-basics',
        title: 'TLS Basics & PQC',
        reason: 'How MTCs reduce TLS handshake size with PQ certificates',
      },
      { to: '/learn/quiz', title: 'Take Quiz', reason: '' },
    ],
    pages: [],
  },
  'migration-program': {
    lessons: [
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Architecture patterns for rapid algorithm migration',
      },
      {
        to: '/learn/pqc-governance',
        title: 'PQC Governance & Policy',
        reason: 'RACI matrices, policy drafts, and KPI dashboards',
      },
      {
        to: '/learn/pqc-business-case',
        title: 'PQC Business Case',
        reason: 'Build executive-ready justification for PQC investment',
      },
    ],
    pages: [
      { to: '/assess', title: 'Risk Assessment', reason: 'Run a guided PQC readiness assessment' },
      {
        to: '/timeline',
        title: 'Regulatory Timeline',
        reason: 'Country-by-country PQC deadlines and milestones',
      },
    ],
  },
  'network-security-pqc': {
    lessons: [
      {
        to: '/learn/tls-basics',
        title: 'TLS & PQC Basics',
        reason: 'TLS 1.3 protocol mechanics and PQC integration points',
      },
      {
        to: '/learn/vpn-ssh-pqc',
        title: 'VPN & SSH with PQC',
        reason: 'IPsec IKEv2 and OpenSSH PQC migration patterns',
      },
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Design patterns for algorithm-agnostic security infrastructure',
      },
      {
        to: '/learn/hybrid-crypto',
        title: 'Hybrid Cryptography',
        reason: 'Classical + PQC hybrid schemes for the transition period',
      },
      {
        to: '/learn/web-gateway-pqc',
        title: 'Web Gateway PQC',
        reason: 'PQC TLS termination at reverse proxies, CDNs, and API gateways',
      },
    ],
    pages: [],
  },
  'os-pqc': {
    lessons: [
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC Operations',
        reason: 'PKCS#11 v3.2 mechanisms, firmware migration, and FIPS validation',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC Key Management',
        reason: 'Envelope encryption, hybrid key wrapping, and KMS provider roadmaps',
      },
      {
        to: '/learn/crypto-dev-apis',
        title: 'Crypto Dev APIs',
        reason: 'OpenSSL EVP, PKCS#11, CNG, and JCA/JCE PQC migration patterns',
      },
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Algorithm-agnostic design patterns for OS-level cryptography',
      },
      {
        to: '/learn/secure-boot-pqc',
        title: 'Secure Boot & Firmware',
        reason: 'UEFI PK/KEK migration, TPM 2.0, and ML-DSA firmware signing',
      },
    ],
    pages: [
      {
        to: '/migrate?domain=platform',
        title: 'Migration Workbench',
        reason: 'OS vendor products and PQC migration status',
      },
    ],
  },
  'ot-pqc': {
    lessons: [
      {
        to: '/learn/iot-pqc',
        title: 'IoT & Embedded Device PQC',
        reason: 'Constrained devices, smart-meter fleets and LPWAN',
      },
      {
        to: '/learn/stateful-signatures',
        title: 'Stateful Signatures',
        reason: 'LMS and XMSS state management in depth',
      },
      {
        to: '/learn/secure-boot-pqc',
        title: 'Secure Boot PQC',
        reason: 'Bootloader verification of PQC firmware signatures',
      },
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC',
        reason: 'Where OT signing keys and their state should live',
      },
      {
        to: '/learn/vpn-ssh-pqc',
        title: 'VPN & SSH PQC',
        reason: 'Hybrid key exchange for remote access and overlays',
      },
      {
        to: '/learn/migration-program',
        title: 'Migration Program',
        reason: 'Multi-year programme governance for critical infrastructure',
      },
    ],
    pages: [],
  },
  'pki-workshop': {
    lessons: [
      {
        to: '/learn/merkle-tree-certs',
        title: 'Merkle Tree Certificates',
        reason: 'Interactive MTC builder, inclusion proofs, and PQC size comparison',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC Key Management',
        reason: 'Enterprise key lifecycle and PQC rotation planning',
      },
      {
        to: '/learn/email-signing',
        title: 'Email Signing',
        reason: 'S/MIME and CMS document signing with PQC',
      },
      {
        to: '/learn/digital-id',
        title: 'Digital Identity',
        reason: 'EUDI Wallet, eIDAS 2.0 & PQC credential issuance',
      },
    ],
    pages: [
      {
        to: '/compliance',
        title: 'Compliance',
        reason: 'NIST, BSI, ANSSI & Common Criteria requirements',
      },
      {
        to: '/library',
        title: 'Standards Library',
        reason: 'FIPS, RFC, and ISO PQC standards reference',
      },
    ],
  },
  'platform-eng-pqc': {
    lessons: [
      {
        to: '/learn/migration-program',
        title: 'Migration Program',
        reason: 'Phase-based PQC rollout planning for platform teams',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC',
        reason: 'Key management backends for platform secret injection',
      },
      {
        to: '/learn/code-signing',
        title: 'Code Signing',
        reason: 'Sigstore and Notation migration to ML-DSA in CI/CD pipelines',
      },
      {
        to: '/learn/ai-security-pqc',
        title: 'AI Security & PQC',
        reason: 'PQC considerations for ML pipelines and model signing',
      },
    ],
    pages: [],
  },
  'pqc-101': {
    lessons: [
      {
        to: '/learn/entropy-randomness',
        title: 'Entropy & Randomness',
        reason: 'NIST SP 800-90 DRBGs & entropy sources for PQC key generation',
      },
    ],
    pages: [
      {
        to: '/threats',
        title: 'Threat Dashboard',
        reason: 'Industry-specific quantum risks & PQC replacements',
      },
      {
        to: '/algorithms',
        title: 'Algorithm Explorer',
        reason: 'Compare key sizes, security levels & performance',
      },
      {
        to: '/timeline',
        title: 'Migration Timeline',
        reason: 'NIST milestones, country deadlines & standardization',
      },
      {
        to: '/assess',
        title: 'Risk Assessment',
        reason: "Assess your organisation's quantum readiness",
      },
    ],
  },
  'pqc-business-case': {
    lessons: [
      { to: '/learn/pqc-risk-management', title: 'PQC Risk Management', reason: '' },
      { to: '/learn/migration-program', title: 'Migration Program', reason: '' },
      { to: '/learn/vendor-risk', title: 'Vendor Risk', reason: '' },
      { to: '/learn/compliance-strategy', title: 'Compliance Strategy', reason: '' },
    ],
    pages: [
      {
        to: '/assess',
        title: 'Risk Assessment',
        reason: 'Run a guided PQC readiness assessment to feed into your business case',
      },
      {
        to: '/threats',
        title: 'Threat Landscape',
        reason: 'Explore industry-specific quantum threats and attack vectors',
      },
      {
        to: '/compliance',
        title: 'Compliance Tracker',
        reason: 'Review PQC compliance deadlines and regulatory requirements',
      },
      {
        to: '/migrate',
        title: 'Migration Workbench',
        reason: 'Browse PQC-ready products to estimate migration costs',
      },
    ],
  },
  'pqc-governance': {
    lessons: [
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Architecture patterns for algorithm-agile systems',
      },
      {
        to: '/learn/pqc-risk-management',
        title: 'PQC Risk Management',
        reason: 'Quantify quantum risk and build risk registers',
      },
      {
        to: '/learn/pqc-business-case',
        title: 'PQC Business Case',
        reason: 'Build executive-ready justification for PQC investment',
      },
      {
        to: '/learn/standards-bodies',
        title: 'Standards Bodies',
        reason: 'Who creates PQC standards, certifies products, and mandates compliance',
      },
    ],
    pages: [
      { to: '/assess', title: 'Risk Assessment', reason: 'Run a guided PQC readiness assessment' },
      { to: '/compliance', title: 'Compliance Tracker', reason: 'NIST,' },
    ],
  },
  'pqc-grc': {
    lessons: [
      {
        to: '/learn/pqc-governance',
        title: 'PQC Governance & Policy',
        reason: 'RACI, policy hierarchy, and escalation framework',
      },
      {
        to: '/learn/pqc-risk-management',
        title: 'PQC Risk Management',
        reason: 'Quantify quantum risk and registers',
      },
    ],
    pages: [
      {
        to: '/compliance',
        title: 'Compliance Tracker',
        reason: 'Feeds the Regulatory Horizon Report',
      },
      { to: '/assess', title: 'Risk Assessment', reason: 'Seeds KRI baselines and exposure' },
    ],
  },
  'pqc-hw-acceleration': {
    lessons: [
      {
        to: '/learn/slh-dsa',
        title: 'SLH-DSA',
        reason: 'The hash-based signature this module accelerates',
      },
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC',
        reason: 'Where accelerated PQC runs in production',
      },
      { to: '/learn/iot-pqc', title: 'IoT & Embedded', reason: 'Small cores, tight budgets' },
      {
        to: '/learn/arch-quantum-impact?tab=workshop&step=5',
        title: 'Compare with the other trust hardware',
        reason: 'Where accelerators sit next to TPMs, HSMs and DPUs',
      },
    ],
    pages: [],
  },
  'pqc-risk-management': {
    lessons: [
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Architecture patterns for rapid algorithm migration',
      },
      {
        to: '/learn/quantum-threats',
        title: 'Quantum Threats',
        reason: 'Why quantum computing threatens current cryptography',
      },
    ],
    pages: [
      { to: '/assess', title: 'Risk Assessment', reason: 'Run a guided PQC readiness assessment' },
      {
        to: '/threats',
        title: 'Threat Landscape',
        reason: 'Explore quantum threats by industry and algorithm',
      },
    ],
  },
  qkd: {
    lessons: [
      {
        to: '/learn/hybrid-crypto',
        title: 'Hybrid Cryptography',
        reason: 'Learn how classical + PQC hybrid KEMs work with hands-on HKDF key derivation.',
      },
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC Operations',
        reason: 'Deep dive into HSM PKCS#11 v3.2 operations and PQC firmware migration.',
      },
      {
        to: '/learn/5g-security',
        title: '5G Security',
        reason: 'Explore 3GPP security architecture — QKD could secure future telecom backbones.',
      },
    ],
    pages: [
      {
        to: '/threats',
        title: 'Threat Dashboard',
        reason: 'Understand the quantum threats that motivate both PQC and QKD adoption.',
      },
    ],
  },
  'quantum-threats': {
    lessons: [
      {
        to: '/learn/digital-assets',
        title: 'Digital Assets',
        reason: 'Blockchain & cryptocurrency quantum vulnerabilities',
      },
    ],
    pages: [
      {
        to: '/threats',
        title: 'Threat Dashboard',
        reason: 'Industry-specific quantum risks & PQC replacements',
      },
      {
        to: '/algorithms',
        title: 'Algorithm Explorer',
        reason: 'Compare key sizes, security levels & performance',
      },
      {
        to: '/timeline',
        title: 'Migration Timeline',
        reason: 'NIST milestones, country deadlines & standardization',
      },
      {
        to: '/assess',
        title: 'Risk Assessment',
        reason: "Assess your organization's quantum readiness",
      },
    ],
  },
  'secrets-management-pqc': {
    lessons: [
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC Key Management',
        reason: 'Envelope encryption, ML-KEM key wrapping, multi-provider KMS',
      },
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC Operations',
        reason: 'PKCS#11 v3.2, HSM vendor migration, FIPS 140-3',
      },
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Algorithm-agnostic design patterns for infrastructure',
      },
      {
        to: '/learn/platform-eng-pqc',
        title: 'Platform Engineering',
        reason: 'CI/CD pipeline crypto, container signing, and policy enforcement',
      },
    ],
    pages: [
      {
        to: '/migrate?domain=kms',
        title: 'Migration Workbench',
        reason: 'Vault, AWS, Azure, GCP PQC readiness tracker',
      },
    ],
  },
  'secure-boot-pqc': {
    lessons: [
      {
        to: '/learn/hsm-pqc',
        title: 'HSM & PQC Operations',
        reason: 'PKCS#11 v3.2 mechanisms and firmware migration',
      },
      {
        to: '/learn/kms-pqc',
        title: 'KMS & PQC Key Management',
        reason: 'Envelope encryption and key hierarchy patterns',
      },
      {
        to: '/learn/confidential-computing',
        title: 'Confidential Computing',
        reason: 'TEEs, remote attestation, and PQC',
      },
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Algorithm-agnostic cryptographic infrastructure',
      },
      {
        to: '/learn/arch-quantum-impact?tab=workshop&step=5',
        title: 'Compare with the other trust hardware',
        reason: 'TPMs, Caliptra, HSMs, confidential computing and DPUs side by side',
      },
      {
        to: '/learn/os-pqc',
        title: 'OS Cryptographic Stacks',
        reason: 'OS-level crypto providers, SSH host keys, and system TLS policy',
      },
    ],
    pages: [],
  },
  'skills-team-structure': {
    lessons: [
      {
        to: '/learn/pqc-governance',
        title: 'PQC Governance & Policy',
        reason: 'RACI matrices, escalation paths, and KPI dashboards for the program',
      },
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'The design patterns crypto champions enforce in reviews',
      },
      {
        to: '/learn/pqc-business-case',
        title: 'PQC Business Case',
        reason: 'Justify the FTE budget your sizing calculation produces',
      },
      {
        to: '/learn/standards-bodies',
        title: 'Standards Bodies',
        reason: 'The bodies whose outputs the team must track and implement',
      },
    ],
    pages: [
      {
        to: '/assess',
        title: 'Risk Assessment',
        reason: 'Size your estate and surface the cryptographic instances that drive headcount',
      },
    ],
  },
  'standards-bodies': {
    lessons: [
      {
        to: '/learn/compliance-strategy',
        title: 'Compliance Strategy',
        reason: 'Map standards-body mandates to your regulatory obligations',
      },
      {
        to: '/learn/pqc-101',
        title: 'PQC 101',
        reason: "Foundational concepts behind NIST's standardization process",
      },
      {
        to: '/learn/pki-workshop',
        title: 'PKI Workshop',
        reason: 'Hands-on implementation of NIST-standardized PQ algorithms',
      },
    ],
    pages: [],
  },
  'stateful-signatures': {
    lessons: [
      {
        to: '/learn/pki-workshop',
        title: 'PKI Workshop',
        reason: 'Key management fundamentals and certificate chain building',
      },
    ],
    pages: [
      {
        to: '/openssl',
        title: 'OpenSSL Studio',
        reason: 'Run LMS/XMSS operations with OpenSSL 3.x WASM',
      },
      {
        to: '/algorithms?tab=detailed&highlight=LMS,XMSS',
        title: 'Algorithm Reference',
        reason: 'Detailed specs for all PQC algorithms including LMS and XMSS',
      },
      {
        to: '/library?q=stateful',
        title: 'Software Library',
        reason: 'PQC-ready libraries and tools with stateful signature support',
      },
    ],
  },
  'tls-basics': {
    lessons: [
      {
        to: '/learn/vpn-ssh-pqc',
        title: 'VPN/IPsec & SSH',
        reason: 'PQC in IKEv2, SSH, and WireGuard protocols',
      },
      {
        to: '/learn/api-security-jwt',
        title: 'API Security & JWT',
        reason: 'PQC tokens & OAuth 2.0 migration over TLS',
      },
      {
        to: '/learn/5g-security',
        title: '5G Security',
        reason: 'SUCI, 5G-AKA & PQC transport in mobile networks',
      },
      {
        to: '/learn/web-gateway-pqc',
        title: 'Web Gateway PQC',
        reason: 'PQC TLS termination at reverse proxies & CDNs',
      },
      {
        to: '/learn/network-security-pqc',
        title: 'Network Security',
        reason: 'NGFWs, TLS inspection & ZTNA with PQC cipher suites',
      },
    ],
    pages: [
      {
        to: '/algorithms?tab=support&protocol=tls-1-3',
        title: 'Protocol Support Matrix',
        reason: 'TLS 1.3 PQC key exchange & signature support, drafts and stage',
      },
      { to: '/openssl', title: 'OpenSSL Studio', reason: 'Run PQC commands live in your browser' },
      {
        to: '/threats',
        title: 'Threat Dashboard',
        reason: 'Industry-specific quantum risks & PQC replacements',
      },
    ],
  },
  'vendor-risk': {
    lessons: [
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Architecture patterns for algorithm-agile vendor integration',
      },
    ],
    pages: [
      {
        to: '/migrate',
        title: 'Migration Workbench',
        reason: 'Browse PQC-ready products across infrastructure layers',
      },
      {
        to: '/compliance',
        title: 'Compliance Tracker',
        reason: 'FIPS, CNSA 2.0, and international PQC compliance requirements',
      },
      {
        to: '/assess',
        title: 'Risk Assessment',
        reason: 'Run a full PQC readiness assessment for your organization',
      },
    ],
  },
  'vpn-ssh-pqc': {
    lessons: [
      {
        to: '/learn/tls-basics',
        title: 'TLS Basics',
        reason: 'Deep dive into TLS 1.3 handshakes and PQC integration',
      },
      {
        to: '/learn/hybrid-crypto',
        title: 'Hybrid Cryptography',
        reason: 'Hybrid KEMs, composite signatures, and certificate comparison',
      },
      {
        to: '/learn/network-security-pqc',
        title: 'Network Security',
        reason: 'NGFWs, TLS inspection, IDS/IPS, and ZTNA PQC migration',
      },
    ],
    pages: [
      {
        to: '/algorithms?highlight=ML-KEM,ML-DSA',
        title: 'Algorithm Explorer',
        reason: 'Compare ML-KEM, ML-DSA, and classical algorithm parameters',
      },
      {
        to: '/library?cat=Protocols',
        title: 'Standards Library',
        reason: 'RFCs, NIST FIPS, and IETF drafts for PQC protocols',
      },
    ],
  },
  'web-gateway-pqc': {
    lessons: [
      {
        to: '/learn/tls-basics',
        title: 'TLS Basics & PQC',
        reason: 'ML-KEM hybrid KEMs and TLS 1.3 handshake fundamentals',
      },
      {
        to: '/learn/vpn-ssh-pqc',
        title: 'VPN & SSH',
        reason: 'PQC key exchange for tunnelled gateway traffic',
      },
      {
        to: '/learn/network-security-pqc',
        title: 'Network Security',
        reason: 'NGFW, TLS inspection, and ZTNA with PQC cipher suites',
      },
      {
        to: '/learn/crypto-agility',
        title: 'Crypto Agility',
        reason: 'Algorithm-agnostic gateway configuration for rapid cipher rollout',
      },
    ],
    pages: [],
  },
}

const NONE: LessonRelatedLinks = { lessons: [], pages: [] }

/** The kept links of one lesson; empty lists when it had none. */
export function relatedLinksOf(lessonId: string): LessonRelatedLinks {
  return Object.prototype.hasOwnProperty.call(LESSON_RELATED_LINKS, lessonId)
    ? LESSON_RELATED_LINKS[lessonId as keyof typeof LESSON_RELATED_LINKS]
    : NONE
}

/** The name of the Hub page an address opens, for the "Page" label of a link; "Hub" for an address no page claims. */
const PAGE_NAMES: Readonly<Record<string, string>> = {
  algorithms: 'Algorithms',
  assess: 'Assess',
  compliance: 'Compliance',
  library: 'Library',
  migrate: 'Migrate',
  openssl: 'OpenSSL Studio',
  playground: 'Playground',
  threats: 'Threats',
  timeline: 'Timeline',
}

/** "Page: Library" for `/library?q=CMS`. */
export function pageLabelOf(to: string): string {
  const first = to.replace(/^\//, '').split(/[/?#]/)[0] ?? ''
  const name = Object.prototype.hasOwnProperty.call(PAGE_NAMES, first)
    ? PAGE_NAMES[first as keyof typeof PAGE_NAMES]
    : 'Hub'
  return `Page: ${name}`
}

/** "Workshop step" for a link into one step of a lesson's workshop, "Module" for a lesson. */
export function lessonLabelOf(to: string): string {
  return /[?&]step=\d+/.test(to) ? 'Workshop step' : 'Module'
}
