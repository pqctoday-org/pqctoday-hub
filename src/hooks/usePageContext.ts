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
    relevantSources: ['threats', 'glossary'],
    suggestedQuestions: [
      'Which industries face the highest HNDL risk?',
      "How does Shor's algorithm threaten RSA?",
      'What are the financial services quantum threats?',
    ],
  },
  '/library': {
    page: 'Library',
    relevantSources: ['library', 'authoritative-sources'],
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
    relevantSources: ['compliance', 'certifications'],
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
    relevantSources: ['algorithms', 'glossary', 'modules'],
    suggestedQuestions: [
      'Generate an ML-KEM keypair — what are the sizes?',
      "What's the signature size of ML-DSA-65?",
      'How do PQC key sizes compare to classical?',
    ],
  },
  '/openssl': {
    page: 'OpenSSL Studio',
    relevantSources: ['algorithms', 'modules'],
    suggestedQuestions: [
      'Which OpenSSL commands support PQC algorithms?',
      'How do I generate ML-KEM keys with OpenSSL?',
    ],
  },
  '/learn': {
    page: 'Learn',
    relevantSources: ['modules', 'module-content', 'glossary', 'quiz'],
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
    'How does PQC affect SUCI concealment?',
    'What is the 5G-AKA authentication flow?',
    'Which 5G components need PQC upgrades?',
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
  const { selectedPersona, selectedIndustry, selectedRegion } = usePersonaStore()
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
          suggestedQuestions: moduleQuestions ?? [
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
    if (ctx) return { ...ctx, ...personaFields, ...assessmentFields }

    // Fallback for /learn (without sub-path) or unknown routes
    if (pathname.startsWith('/learn'))
      return { ...PAGE_CONTEXTS['/learn'], ...personaFields, ...assessmentFields }

    return { ...DEFAULT_CONTEXT, ...personaFields, ...assessmentFields }
  }, [
    location,
    selectedPersona,
    selectedIndustry,
    selectedRegion,
    assessmentStatus,
    lastResult,
    complianceRequirements,
    infrastructure,
    migrationStatus,
    timelinePressure,
    cryptoAgility,
  ])
}
