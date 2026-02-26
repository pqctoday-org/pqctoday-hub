import { useLocation } from 'react-router-dom'
import { useMemo } from 'react'

export interface PageContext {
  page: string
  moduleId?: string
  relevantSources: string[]
  suggestedQuestions: string[]
}

const PAGE_CONTEXTS: Record<string, Omit<PageContext, 'moduleId'>> = {
  '/algorithms': {
    page: 'Algorithms',
    relevantSources: ['algorithms', 'transitions', 'glossary'],
    suggestedQuestions: [
      'Compare ML-KEM and ML-DSA key sizes across security levels',
      'What FIPS standards cover post-quantum algorithms?',
      'Which algorithms are recommended for key encapsulation?',
    ],
  },
  '/timeline': {
    page: 'Timeline',
    relevantSources: ['timeline', 'compliance'],
    suggestedQuestions: [
      'Which countries have PQC migration deadlines?',
      'What are the key milestones in the PQC transition?',
    ],
  },
  '/threats': {
    page: 'Threat Landscape',
    relevantSources: ['threats', 'glossary'],
    suggestedQuestions: [
      'Which industries face the highest quantum threat?',
      'Explain harvest-now-decrypt-later attacks',
      'What cryptographic algorithms are most at risk?',
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
      'What factors affect migration priority?',
      'Explain HNDL relevance scoring',
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
      'What algorithms can I test in the playground?',
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
  'key-management': 'Key Management',
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

  return useMemo(() => {
    const { pathname } = location

    // Handle /learn/* module routes
    if (pathname.startsWith('/learn/')) {
      const moduleId = pathname.replace('/learn/', '').split('?')[0]
      const moduleName = MODULE_NAMES[moduleId]

      if (moduleName) {
        return {
          page: `Learn: ${moduleName}`,
          moduleId,
          relevantSources: ['modules', 'module-content', 'glossary', 'algorithms'],
          suggestedQuestions: [
            `What are the key concepts in ${moduleName}?`,
            `How does ${moduleName} relate to PQC migration?`,
            'What other modules should I explore?',
          ],
        }
      }
    }

    // Match exact routes
    const ctx = PAGE_CONTEXTS[pathname]
    if (ctx) return { ...ctx }

    // Fallback for /learn (without sub-path) or unknown routes
    if (pathname.startsWith('/learn')) return { ...PAGE_CONTEXTS['/learn'] }

    return { ...DEFAULT_CONTEXT }
  }, [location])
}
