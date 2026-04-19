// SPDX-License-Identifier: GPL-3.0-only
import { useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { getModuleDeepLink } from './useModuleDeepLink'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'

export interface PageContext {
  page: string
  moduleId?: string
  tab?: string
  step?: number
  relevantSources: string[]
  suggestedQuestions: string[]
  // Persona context
  persona?: string | null
  industry?: string | null
  region?: string | null
  experienceLevel?: string | null
  // Assessment context (only populated when assessment is complete)
  assessmentComplete?: boolean
  riskScore?: number
  riskLevel?: string
  complianceFrameworks?: string[]
  infrastructure?: string[]
  migrationStatus?: string
  timelinePressure?: string
  cryptoAgility?: string
}

const PAGE_CONTEXTS: Record<string, Omit<PageContext, 'moduleId'>> = {
  '/business': {
    page: 'Command Center',
    relevantSources: ['business-center', 'assessment', 'compliance', 'threats', 'priority-matrix'],
    suggestedQuestions: [
      'What business planning tools are available?',
      'How do I calculate ROI for PQC migration?',
      'Help me build a board pitch for PQC investment',
    ],
  },
  '/algorithms': {
    page: 'Algorithms',
    relevantSources: ['algorithms', 'transitions', 'glossary'],
    suggestedQuestions: [
      'Compare ML-KEM-768 and ML-KEM-1024 performance',
      'Which algorithm family is best for key exchange?',
      'What FIPS standards cover post-quantum algorithms?',
    ],
  },
  '/timeline': {
    page: 'Timeline',
    relevantSources: ['timeline', 'compliance'],
    suggestedQuestions: [
      'Which countries mandate PQC migration by 2030?',
      "What is ANSSI's hybrid cryptography requirement?",
      'Compare the US and EU PQC migration timelines',
    ],
  },
  '/threats': {
    page: 'Threat Landscape',
    relevantSources: ['threats', 'glossary', 'document-enrichment'],
    suggestedQuestions: [
      'Which industries face the highest HNDL risk?',
      "How does Shor's algorithm threaten RSA?",
      'What are the financial services quantum threats?',
    ],
  },
  '/library': {
    page: 'Library',
    relevantSources: ['library', 'authoritative-sources', 'document-enrichment'],
    suggestedQuestions: [
      'What are the key NIST PQC standards?',
      'Show me documents about ML-KEM',
      'What guidance exists for PQC migration?',
    ],
  },
  '/leaders': {
    page: 'Leaders',
    relevantSources: ['leaders'],
    suggestedQuestions: [
      'Who are the key PQC researchers?',
      'Which organizations lead PQC development?',
    ],
  },
  '/compliance': {
    page: 'Compliance',
    relevantSources: ['compliance', 'certifications', 'document-enrichment'],
    suggestedQuestions: [
      'What FIPS 140-3 validated modules support PQC?',
      'Which compliance frameworks require PQC adoption?',
      'Show ACVP-validated PQC implementations',
    ],
  },
  '/migrate': {
    page: 'Migrate Catalog',
    relevantSources: ['migrate', 'certifications', 'priority-matrix'],
    suggestedQuestions: [
      'Which HSMs support ML-KEM?',
      'List PQC-ready cryptographic libraries',
      'What software has FIPS validation for PQC?',
    ],
  },
  '/assess': {
    page: 'Assessment',
    relevantSources: ['assessment', 'compliance', 'threats'],
    suggestedQuestions: [
      'How is the PQC risk score calculated?',
      'What does data sensitivity mean for quantum risk?',
      'Which compliance frameworks require PQC adoption?',
    ],
  },
  '/report': {
    page: 'Assessment Report',
    relevantSources: ['assessment', 'compliance', 'threats'],
    suggestedQuestions: [
      'How should I interpret my risk score?',
      'What are the recommended next steps for migration?',
    ],
  },
  '/playground': {
    page: 'Playground',
    relevantSources: ['algorithms', 'glossary', 'modules', 'playground-guide', 'softhsmv3'],
    suggestedQuestions: [
      'Generate an ML-KEM keypair — what are the sizes?',
      "What's the signature size of ML-DSA-65?",
      'How do PQC key sizes compare to classical?',
    ],
  },
  '/openssl': {
    page: 'OpenSSL Studio',
    relevantSources: ['algorithms', 'modules', 'openssl-guide'],
    suggestedQuestions: [
      'Which OpenSSL commands support PQC algorithms?',
      'How do I generate ML-KEM keys with OpenSSL?',
    ],
  },
  '/learn': {
    page: 'Learn',
    relevantSources: ['modules', 'module-content', 'module-summaries', 'glossary', 'quiz'],
    suggestedQuestions: [
      'What learning modules are available?',
      'Where should I start learning about PQC?',
      'What topics does the quiz cover?',
    ],
  },
  '/changelog': {
    page: 'Changelog',
    relevantSources: [],
    suggestedQuestions: ['What are the latest features?', 'When was the PQC Assistant added?'],
  },
  '/about': {
    page: 'About',
    relevantSources: [],
    suggestedQuestions: [
      'What data sources does this app use?',
      'How does the PQC Assistant work?',
    ],
  },
}

const MODULE_NAMES: Record<string, string> = {
  'pqc-101': 'PQC 101',
  'quantum-threats': 'Quantum Threats',
  'hybrid-crypto': 'Hybrid Cryptography',
  'crypto-agility': 'Crypto Agility',
  'tls-basics': 'TLS Basics',
  'vpn-ssh-pqc': 'VPN & SSH',
  'email-signing': 'Email Signing',
  'pki-workshop': 'PKI Workshop',
  'kms-pqc': 'KMS & PQC Key Management',
  'hsm-pqc': 'HSM & PQC Operations',
  'stateful-signatures': 'Stateful Signatures',
  'digital-assets': 'Digital Assets',
  '5g-security': '5G Security',
  'digital-id': 'Digital Identity',
  'entropy-randomness': 'Entropy & Randomness',
  'merkle-tree-certs': 'Merkle Tree Certificates',
  qkd: 'Quantum Key Distribution',
  'api-security-jwt': 'API Security & JWT',
  'code-signing': 'Code Signing',
  'iot-ot-pqc': 'IoT & OT Security',
  'pqc-risk-management': 'PQC Risk Management',
  'pqc-business-case': 'PQC Business Case',
  'pqc-governance': 'PQC Governance & Policy',
  'vendor-risk': 'Vendor & Supply Chain Risk',
  'migration-program': 'Migration Program Management',
  'compliance-strategy': 'Compliance & Regulatory Strategy',
  'data-asset-sensitivity': 'Data & Asset Sensitivity',
  'exec-quantum-impact': 'Executive Quantum Impact',
  'dev-quantum-impact': 'Developer Quantum Impact',
  'arch-quantum-impact': 'Architect Quantum Impact',
  'ops-quantum-impact': 'Ops Quantum Impact',
  'research-quantum-impact': 'Researcher Quantum Impact',
  'web-gateway-pqc': 'Web Gateway PQC',
  'network-security-pqc': 'Network Security & PQC Migration',
  'ai-security-pqc': 'AI Security & PQC',
  'emv-payment-pqc': 'EMV Payment Systems & PQC',
  'healthcare-pqc': 'Healthcare PQC',
  'energy-utilities-pqc': 'Energy & Utilities PQC',
  'automotive-pqc': 'Automotive PQC',
  'aerospace-pqc': 'Aerospace PQC',
  'confidential-computing': 'Confidential Computing & TEEs',
  'database-encryption-pqc': 'Database Encryption & PQC',
  'secrets-management-pqc': 'Secrets Management & PQC',
  'platform-eng-pqc': 'Platform Engineering & PQC',
  'secure-boot-pqc': 'Secure Boot & Firmware PQC',
  'os-pqc': 'Operating System & Platform Crypto PQC',
  'iam-pqc': 'Identity & Access Management with PQC',
  'standards-bodies': 'Standards, Certification & Compliance Bodies',
  'crypto-dev-apis': 'Cryptographic APIs & Developer Languages',
}

/** Module-specific suggested questions — curated for top modules, others use generic template */
const MODULE_SUGGESTED_QUESTIONS: Record<string, string[]> = {
  'pqc-101': [
    'What is post-quantum cryptography and why does it matter?',
    "How do Shor's and Grover's algorithms affect current encryption?",
    'What are the NIST-standardized PQC algorithms?',
  ],
  'quantum-threats': [
    'When will quantum computers break RSA?',
    "What is Mosca's theorem?",
    'How does harvest-now-decrypt-later work?',
  ],
  'tls-basics': [
    'How does ML-KEM integrate with TLS 1.3?',
    "What's the performance overhead of PQC in TLS?",
    'Explain hybrid key exchange in TLS',
  ],
  '5g-security': [
    'What are the three SUCI protection profiles, and which is quantum-resistant?',
    'Why is MILENAGE quantum-resistant while SUCI Profile A/B is not?',
    'How does Profile C hybrid mode combine classical and PQC shared secrets?',
  ],
  'hybrid-crypto': [
    'Why use hybrid cryptography during the PQC transition?',
    'How do composite signatures work?',
    'What is X-Wing for hybrid key exchange?',
  ],
  'crypto-agility': [
    'What is crypto agility and why is it important?',
    'How do I implement a CBOM?',
    'What are the key principles of agile cryptographic design?',
  ],
  'digital-assets': [
    'How is Bitcoin vulnerable to quantum attacks?',
    'Which blockchain signature schemes need PQC upgrades?',
    'What is the Ethereum quantum migration roadmap?',
  ],
  'kms-pqc': [
    'How does ML-KEM envelope encryption differ from RSA-OAEP?',
    'Which cloud KMS providers support PQC algorithms?',
    'Best practices for PQC key rotation planning',
  ],
  'hsm-pqc': [
    'What PKCS#11 v3.2 mechanisms support PQC algorithms?',
    'Which HSM vendors have FIPS 140-3 PQC validation?',
    'How does HSM firmware migration work for PQC?',
  ],
  'stateful-signatures': [
    'Compare LMS and XMSS stateful signature schemes',
    'Why are stateful signatures harder to deploy?',
    'When should I use stateful vs stateless signatures?',
  ],
  qkd: [
    'How does the BB84 QKD protocol work?',
    'What are the limitations of QKD vs PQC?',
    'Where is QKD deployed today?',
  ],
  'entropy-randomness': [
    'What is a DRBG and why does it matter for PQC?',
    'How does SP 800-90 apply to quantum-safe randomness?',
    'What are quantum random number generators (QRNG)?',
  ],
  'vpn-ssh-pqc': [
    'How does PQC integrate with IKEv2 for VPN tunnels?',
    'Compare SSH key exchange: curve25519 vs sntrup761 vs mlkem768',
    'What is the performance overhead of PQC in IPsec?',
  ],
  'email-signing': [
    'How does PQC affect S/MIME email signing?',
    'What are the challenges of PQC in CMS message formats?',
    'Which signature algorithms work best for email?',
  ],
  'pki-workshop': [
    'How do PQC certificates affect PKI infrastructure?',
    'What is the impact of larger PQC signatures on X.509 chains?',
    'How do certificate authorities prepare for PQC migration?',
  ],
  'merkle-tree-certs': [
    'How do Merkle Tree Certificates reduce handshake sizes?',
    'What is an inclusion proof in certificate transparency?',
    'Compare Merkle Tree Certificates vs traditional X.509 chains',
  ],
  'api-security-jwt': [
    'How does PQC affect JWT and JWS signing?',
    'Which PQC algorithms work with JSON Web Tokens?',
    'What changes are needed for PQC API authentication?',
  ],
  'code-signing': [
    'How does PQC affect code signing and software supply chains?',
    'What is Sigstore and how does it relate to PQC?',
    'Which PQC signature algorithms are best for binary signing?',
  ],
  'digital-id': [
    'How does PQC affect mobile driver licenses (mDL)?',
    'What is SD-JWT and its role in digital identity?',
    'How do verifiable credentials prepare for the quantum threat?',
  ],
  'iot-ot-pqc': [
    'Which PQC algorithms work on constrained IoT devices?',
    'How does PQC migration differ for OT/industrial systems?',
    'What are the key challenges of PQC in embedded systems?',
  ],
  'pqc-risk-management': [
    'How do I build a quantum threat risk register?',
    'What is the relationship between CRQC timelines and business risk?',
    'How do I create a PQC risk heatmap?',
  ],
  'pqc-business-case': [
    'How do I calculate ROI for PQC migration?',
    'What are the cost categories in a PQC business case?',
    'How do I present PQC risks to the board?',
  ],
  'pqc-governance': [
    'What roles belong in a PQC RACI matrix?',
    'How do I draft a PQC cryptographic policy?',
    'Which KPIs should I track for PQC migration?',
  ],
  'vendor-risk': [
    'How do I score vendor PQC readiness?',
    'What contract clauses protect against quantum risk?',
    'How do I assess supply chain cryptographic dependencies?',
  ],
  'migration-program': [
    'What are the phases of a PQC migration program?',
    'How do I build a PQC migration roadmap?',
    'What stakeholder communication is needed for PQC migration?',
  ],
  'compliance-strategy': [
    'Which PQC compliance frameworks apply to my organization?',
    'How do I prepare for a PQC compliance audit?',
    'How do CNSA 2.0 and ETSI timelines differ?',
  ],
  'data-asset-sensitivity': [
    'How do I classify data assets for PQC migration priority?',
    'Which compliance frameworks require data sensitivity assessment?',
    'What risk methodologies apply to PQC data classification?',
  ],
  'exec-quantum-impact': [
    'Why should executives care about quantum computing threats?',
    'What are the regulatory deadlines for PQC migration?',
    'How do I build a board-level PQC business case?',
  ],
  'dev-quantum-impact': [
    'How do PQC algorithms affect my code and libraries?',
    'What changes are needed for PQC-safe TLS and JWT?',
    'How do I set up a PQC test environment?',
  ],
  'arch-quantum-impact': [
    'How should I design crypto-agile architecture for PQC?',
    'What is the impact of PQC on KMS and HSM design?',
    'How do hybrid deployment patterns work?',
  ],
  'ops-quantum-impact': [
    'How does PQC affect certificate operations at scale?',
    'What VPN/SSH upgrades are needed for PQC?',
    'How do I recalibrate monitoring for PQC?',
  ],
  'research-quantum-impact': [
    'What research data is most vulnerable to quantum threats?',
    'What are the emerging PQC research frontiers?',
    'How can researchers contribute to PQC standards?',
  ],
  'web-gateway-pqc': [
    'How do PQC handshake sizes affect CDN and load balancer performance?',
    'What TLS termination patterns work best for hybrid PQC deployment?',
    'Which web gateway vendors support PQC today?',
  ],
  'network-security-pqc': [
    'How does PQC affect TLS inspection on next-gen firewalls?',
    'What IDS/IPS signature updates are needed for PQC traffic detection?',
    'How do I design a PQC-aware zero trust network architecture?',
  ],
  'ai-security-pqc': [
    'How does HNDL risk apply to AI training data pipelines?',
    'What PQC algorithms protect AI model weights and signing?',
    'How do AI agent authentication and delegation chains use PQC?',
  ],
  'emv-payment-pqc': [
    'Why is FN-DSA-512 preferred over ML-DSA for constrained payment cards?',
    'Which EMV authentication methods (SDA, DDA, CDA) are quantum-vulnerable?',
    'What is the PQC migration timeline for payment network HSMs?',
  ],
  'healthcare-pqc': [
    'Why are biometric data and genomic records the highest HNDL priority?',
    'How does PQC affect HIPAA compliance and PHI encryption requirements?',
    'What are the PQC constraints for implantable medical devices?',
  ],
  'energy-utilities-pqc': [
    'Can PQC signatures fit within IEC 61850 GOOSE 4ms trip timing budgets?',
    'How do I migrate DNP3 Secure Authentication key ceremonies to ML-KEM?',
    'What is the HNDL risk for smart meters with 20-year lifetimes?',
  ],
  'automotive-pqc': [
    'How do ASIL safety levels constrain PQC algorithm choices in vehicles?',
    'What is the OTA firmware signing migration path to ML-DSA?',
    'How does CCC Digital Key 3.0 use hybrid PQC key exchange?',
  ],
  'aerospace-pqc': [
    'Why can ARINC 429 and ACARS not carry PQC signatures on-wire?',
    'How does DO-178C re-certification affect PQC migration timelines?',
    'What are the ITAR/EAR export control implications for PQC in avionics?',
  ],
  'confidential-computing': [
    'How do TEE attestation chains become vulnerable to quantum attacks?',
    'What is the PQC migration path for Intel SGX, AMD SEV-SNP, and ARM CCA?',
    'How do TEE-HSM trusted channels integrate PQC key provisioning?',
  ],
  'database-encryption-pqc': [
    'Is AES-256 TDE already quantum-safe, and what still needs migration?',
    'How do BYOK and HYOK patterns change with ML-KEM key wrapping?',
    'Which database vendors support PQC-capable queryable encryption?',
  ],
  'secrets-management-pqc': [
    'How do I classify secrets by HNDL risk for PQC migration priority?',
    'What is the Vault transit engine upgrade path to ML-KEM and ML-DSA?',
    'How do Kubernetes secrets and external secrets operators adopt PQC?',
  ],
  'platform-eng-pqc': [
    'How do I inventory quantum-vulnerable crypto in a CI/CD pipeline?',
    'What is the container image signing migration path from ECDSA to ML-DSA?',
    'How do OPA/Kyverno policies enforce PQC algorithm requirements?',
  ],
  'secure-boot-pqc': [
    'How do I migrate the UEFI PK/KEK/db key hierarchy to ML-DSA?',
    'What is the TPM 2.0 path to post-quantum attestation?',
    'Which firmware vendors have PQC roadmaps?',
  ],
  'os-pqc': [
    'How do I configure system-wide TLS crypto policies for PQC?',
    'What is the SSH host key migration path to ML-DSA?',
    'How does FIPS mode interact with PQC algorithm enablement?',
  ],
  'iam-pqc': [
    'How do I migrate JWT and SAML token signing to ML-DSA?',
    'What are the HNDL risks for Kerberos tickets and OIDC tokens?',
    'Which IAM vendors have PQC roadmaps?',
  ],
  'standards-bodies': [
    'What is the difference between standards bodies, certification bodies, and regulators?',
    'How does the NIST-to-CMVP-to-CNSA 2.0 standards chain work?',
    'How do ETSI, BSI, and ANSSI differ in their PQC requirements?',
  ],
  'crypto-dev-apis': [
    'How do JCA/JCE, OpenSSL EVP, and PKCS#11 compare for PQC integration?',
    'Which PQC libraries have FIPS validation?',
    'What crypto agility patterns minimize migration effort when algorithms change?',
  ],
}

/** Persona-specific generic fallback questions for module pages without curated questions */
const PERSONA_GENERIC_QUESTIONS: Record<string, (moduleName: string) => string[]> = {
  executive: (m) => [
    `What is the business impact of ${m}?`,
    `What are the compliance implications of ${m}?`,
    `How does ${m} affect our PQC migration timeline?`,
  ],
  developer: (m) => [
    `What are the implementation details of ${m}?`,
    `How do I integrate ${m} into my codebase?`,
    `What APIs or libraries support ${m}?`,
  ],
  architect: (m) => [
    `What are the architecture trade-offs in ${m}?`,
    `How does ${m} fit into a crypto-agile design?`,
    `What infrastructure changes does ${m} require?`,
  ],
  researcher: (m) => [
    `What are the mathematical foundations behind ${m}?`,
    `What open research questions exist in ${m}?`,
    `How does ${m} compare to alternative approaches?`,
  ],
  ops: (m) => [
    `How do I deploy ${m} in production?`,
    `What monitoring or config changes does ${m} need?`,
    `What are the operational risks of ${m}?`,
  ],
  curious: (m) => [
    `What is ${m} and why should I care?`,
    `How does ${m} affect everyday people?`,
    `What's the simplest way to understand ${m}?`,
  ],
}

/** Simplified suggested questions for Curious experience level on accessible pages. */
const CURIOUS_PAGE_QUESTIONS: Record<string, string[]> = {
  '/learn': [
    'What should I learn first?',
    'What is quantum computing?',
    'Why does encryption need to change?',
  ],
  '/timeline': [
    'When will quantum computers be powerful enough to matter?',
    'Which countries are preparing?',
    'What are the key deadlines?',
  ],
  '/threats': [
    "What could go wrong if we don't prepare?",
    'What is "harvest now, decrypt later"?',
    'Which industries are most at risk?',
  ],
  '/library': [
    'What are the most important documents about quantum-safe security?',
    'Where do I start reading?',
  ],
  '/compliance': ['Who is making the rules?', 'What deadlines should I know about?'],
  '/assess': ['How exposed is my organization?', 'What does this assessment measure?'],
}

const DEFAULT_CONTEXT: PageContext = {
  page: 'Home',
  relevantSources: [],
  suggestedQuestions: [
    'What is post-quantum cryptography?',
    'How do I get started with PQC migration?',
    'What algorithms does NIST recommend?',
  ],
}

export function usePageContext(): PageContext {
  const location = useLocation()
  const { selectedPersona, selectedIndustry, selectedRegion, experienceLevel } = usePersonaStore()
  const {
    assessmentStatus,
    lastResult,
    complianceRequirements,
    infrastructure,
    migrationStatus,
    timelinePressure,
    cryptoAgility,
  } = useAssessmentStore()

  return useMemo(() => {
    const { pathname } = location

    // Persona fields — always included (may be null)
    const personaFields = {
      persona: selectedPersona,
      industry: selectedIndustry,
      region: selectedRegion,
      experienceLevel,
    }

    // Assessment fields — only when complete with a result
    const assessmentFields: Partial<PageContext> = {}
    if (assessmentStatus === 'complete' && lastResult) {
      assessmentFields.assessmentComplete = true
      assessmentFields.riskScore = lastResult.riskScore
      assessmentFields.riskLevel = lastResult.riskLevel
      if (complianceRequirements.length > 0)
        assessmentFields.complianceFrameworks = complianceRequirements
      if (infrastructure.length > 0) assessmentFields.infrastructure = infrastructure
      if (migrationStatus) assessmentFields.migrationStatus = migrationStatus
      if (timelinePressure) assessmentFields.timelinePressure = timelinePressure
      if (cryptoAgility) assessmentFields.cryptoAgility = cryptoAgility
    }

    // Handle /learn/* module routes
    if (pathname.startsWith('/learn/')) {
      const moduleId = pathname.replace('/learn/', '').split('?')[0]
      const moduleName = MODULE_NAMES[moduleId]

      if (moduleName) {
        const moduleQuestions = MODULE_SUGGESTED_QUESTIONS[moduleId]
        const { initialTab, initialStep } = getModuleDeepLink()
        return {
          page: `Learn: ${moduleName}`,
          moduleId,
          tab: initialTab,
          step: initialStep,
          relevantSources: [
            'modules',
            'module-content',
            'module-summaries',
            'glossary',
            'algorithms',
          ],
          suggestedQuestions: moduleQuestions ??
            (selectedPersona ? PERSONA_GENERIC_QUESTIONS[selectedPersona]?.(moduleName) : null) ?? [
              `What are the key concepts in ${moduleName}?`,
              `How does ${moduleName} relate to PQC migration?`,
              'What other modules should I explore?',
            ],
          ...personaFields,
          ...assessmentFields,
        }
      }
    }

    // Match exact routes
    const ctx = PAGE_CONTEXTS[pathname]
    if (ctx) {
      // Override suggested questions for Curious experience level
      const curiousOverride =
        experienceLevel === 'curious' ? CURIOUS_PAGE_QUESTIONS[pathname] : undefined
      const resolved = curiousOverride ? { ...ctx, suggestedQuestions: curiousOverride } : ctx
      return { ...resolved, ...personaFields, ...assessmentFields }
    }

    // Fallback for /learn (without sub-path) or unknown routes
    if (pathname.startsWith('/learn')) {
      const learnCtx = PAGE_CONTEXTS['/learn']
      const curiousOverride =
        experienceLevel === 'curious' ? CURIOUS_PAGE_QUESTIONS['/learn'] : undefined
      const resolved = curiousOverride
        ? { ...learnCtx, suggestedQuestions: curiousOverride }
        : learnCtx
      return { ...resolved, ...personaFields, ...assessmentFields }
    }

    return { ...DEFAULT_CONTEXT, ...personaFields, ...assessmentFields }
  }, [
    location,
    selectedPersona,
    selectedIndustry,
    selectedRegion,
    experienceLevel,
    assessmentStatus,
    lastResult,
    complianceRequirements,
    infrastructure,
    migrationStatus,
    timelinePressure,
    cryptoAgility,
  ])
}
