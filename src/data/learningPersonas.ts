// SPDX-License-Identifier: GPL-3.0-only
import type { QuizCategory } from '@/components/PKILearning/modules/Quiz/types'

export type PersonaId = 'executive' | 'developer' | 'architect' | 'researcher' | 'ops'

export type PathItem =
  | { type: 'module'; moduleId: string }
  | {
      type: 'checkpoint'
      id: string
      label: string
      categories: QuizCategory[]
    }

export interface LearningPersona {
  id: PersonaId
  label: string
  subtitle: string
  icon: 'Briefcase' | 'Code' | 'ShieldCheck' | 'GraduationCap' | 'Server'
  description: string
  /** Ordered module IDs — first = start here, sequence matters */
  recommendedPath: string[]
  /** Interleaved path items: module stops + quiz checkpoints */
  pathItems: PathItem[]
  estimatedMinutes: number
  /** Persona-specific quiz card description shown in the learning path */
  quizDescription: string
  /** Quiz categories pre-selected for this persona (matches QuizCategory type) */
  quizCategories: string[]
}

export const PERSONAS: Record<PersonaId, LearningPersona> = {
  executive: {
    id: 'executive',
    label: 'Executive / GRC',
    subtitle: 'Risk, governance & compliance focus',
    icon: 'Briefcase',
    description:
      'Understand the quantum threat, build a business case, establish governance, track compliance deadlines, and plan a comprehensive migration strategy.',
    recommendedPath: [
      'pqc-101',
      'exec-quantum-impact',
      'quantum-threats',
      'pqc-risk-management',
      'data-asset-sensitivity',
      'pqc-business-case',
      'pqc-governance',
      'compliance-strategy',
      'standards-bodies',
      'crypto-agility',
      'migration-program',
      'vendor-risk',
      'kms-pqc',
      'ai-security-pqc',
      'aerospace-space-pqc',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'exec-quantum-impact' },
      { type: 'module', moduleId: 'quantum-threats' },
      {
        type: 'checkpoint',
        id: 'exec-cp-1',
        label: 'Threat Landscape',
        categories: ['pqc-fundamentals', 'quantum-threats'],
      },
      { type: 'module', moduleId: 'pqc-risk-management' },
      { type: 'module', moduleId: 'data-asset-sensitivity' },
      { type: 'module', moduleId: 'pqc-business-case' },
      {
        type: 'checkpoint',
        id: 'exec-cp-2',
        label: 'Risk & Investment',
        categories: ['pqc-risk-management', 'pqc-business-case', 'industry-threats'],
      },
      { type: 'module', moduleId: 'pqc-governance' },
      { type: 'module', moduleId: 'compliance-strategy' },
      { type: 'module', moduleId: 'standards-bodies' },
      {
        type: 'checkpoint',
        id: 'exec-cp-3',
        label: 'Governance & Compliance',
        categories: ['pqc-governance', 'compliance-strategy', 'standards-bodies', 'compliance'],
      },
      { type: 'module', moduleId: 'crypto-agility' },
      { type: 'module', moduleId: 'migration-program' },
      { type: 'module', moduleId: 'vendor-risk' },
      {
        type: 'checkpoint',
        id: 'exec-cp-4',
        label: 'Migration Execution',
        categories: ['crypto-agility', 'migration-program', 'vendor-risk', 'migration-planning'],
      },
      { type: 'module', moduleId: 'kms-pqc' },
      { type: 'module', moduleId: 'ai-security-pqc' },
      { type: 'module', moduleId: 'aerospace-space-pqc' },
      {
        type: 'checkpoint',
        id: 'exec-cp-5',
        label: 'Infrastructure & Industries',
        categories: ['kms-pqc', 'ai-security-pqc', 'aerospace-space-pqc'],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 930,
    quizDescription:
      'Test your knowledge on quantum threats, risk management, data asset classification, business cases, governance, compliance strategy, and migration planning.',
    quizCategories: [
      'pqc-fundamentals',
      'quantum-threats',
      'pqc-risk-management',
      'pqc-business-case',
      'pqc-governance',
      'compliance-strategy',
      'standards-bodies',
      'compliance',
      'migration-planning',
      'crypto-agility',
      'migration-program',
      'vendor-risk',
      'kms-pqc',
      'ai-security-pqc',
      'aerospace-space-pqc',
    ],
  },
  developer: {
    id: 'developer',
    label: 'Developer / Engineer',
    subtitle: 'Protocol & implementation focus',
    icon: 'Code',
    description:
      'Hands-on protocol integration: TLS, VPN/SSH, PKI certificates, and hybrid cryptography.',
    recommendedPath: [
      'pqc-101',
      'dev-quantum-impact',
      'quantum-threats',
      'entropy-randomness',
      'tls-basics',
      'vpn-ssh-pqc',
      'web-gateway-pqc',
      'hybrid-crypto',
      'crypto-agility',
      'pki-workshop',
      'crypto-dev-apis',
      'merkle-tree-certs',
      'email-signing',
      'api-security-jwt',
      'code-signing',
      'platform-eng-pqc',
      'iot-ot-pqc',
      'confidential-computing',
      'ai-security-pqc',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'dev-quantum-impact' },
      { type: 'module', moduleId: 'quantum-threats' },
      { type: 'module', moduleId: 'entropy-randomness' },
      {
        type: 'checkpoint',
        id: 'dev-cp-1',
        label: 'Foundations & Threats',
        categories: ['pqc-fundamentals', 'quantum-threats', 'entropy-randomness'],
      },
      { type: 'module', moduleId: 'tls-basics' },
      { type: 'module', moduleId: 'vpn-ssh-pqc' },
      { type: 'module', moduleId: 'web-gateway-pqc' },
      {
        type: 'checkpoint',
        id: 'dev-cp-2',
        label: 'Protocol Integration',
        categories: ['tls-basics', 'protocol-integration', 'vpn-ssh-pqc', 'web-gateway-pqc'],
      },
      { type: 'module', moduleId: 'hybrid-crypto' },
      { type: 'module', moduleId: 'crypto-agility' },
      {
        type: 'checkpoint',
        id: 'dev-cp-3',
        label: 'Hybrid & Agility',
        categories: ['hybrid-crypto', 'crypto-agility'],
      },
      { type: 'module', moduleId: 'pki-workshop' },
      { type: 'module', moduleId: 'crypto-dev-apis' },
      { type: 'module', moduleId: 'merkle-tree-certs' },
      { type: 'module', moduleId: 'email-signing' },
      {
        type: 'checkpoint',
        id: 'dev-cp-4',
        label: 'PKI & Signing',
        categories: [
          'pki-infrastructure',
          'crypto-dev-apis',
          'merkle-tree-certs',
          'email-signing',
          'crypto-operations',
        ],
      },
      { type: 'module', moduleId: 'api-security-jwt' },
      { type: 'module', moduleId: 'code-signing' },
      { type: 'module', moduleId: 'platform-eng-pqc' },
      { type: 'module', moduleId: 'iot-ot-pqc' },
      { type: 'module', moduleId: 'confidential-computing' },
      { type: 'module', moduleId: 'ai-security-pqc' },
      {
        type: 'checkpoint',
        id: 'dev-cp-5',
        label: 'Applications & AI Security',
        categories: [
          'code-signing',
          'api-security-jwt',
          'iot-ot-pqc',
          'confidential-computing',
          'ai-security-pqc',
        ],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 1305,
    quizDescription:
      'Test your knowledge on quantum threats, TLS, VPN/SSH, PKI, cryptographic APIs, hybrid cryptography, crypto agility, and protocol integration.',
    quizCategories: [
      'pqc-fundamentals',
      'quantum-threats',
      'entropy-randomness',
      'tls-basics',
      'protocol-integration',
      'web-gateway-pqc',
      'hybrid-crypto',
      'crypto-agility',
      'pki-infrastructure',
      'crypto-dev-apis',
      'merkle-tree-certs',
      'crypto-operations',
      'vpn-ssh-pqc',
      'email-signing',
      'code-signing',
      'api-security-jwt',
      'iot-ot-pqc',
      'confidential-computing',
    ],
  },
  architect: {
    id: 'architect',
    label: 'Security Architect',
    subtitle: 'Architecture & infrastructure focus',
    icon: 'ShieldCheck',
    description:
      'Design crypto-agile architectures, plan key management, and evaluate algorithm trade-offs.',
    recommendedPath: [
      'pqc-101',
      'arch-quantum-impact',
      'quantum-threats',
      'entropy-randomness',
      'crypto-agility',
      'hybrid-crypto',
      'qkd',
      'tls-basics',
      'kms-pqc',
      'hsm-pqc',
      'stateful-signatures',
      'pki-workshop',
      'merkle-tree-certs',
      'email-signing',
      'digital-id',
      'api-security-jwt',
      'code-signing',
      'iot-ot-pqc',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'arch-quantum-impact' },
      { type: 'module', moduleId: 'quantum-threats' },
      { type: 'module', moduleId: 'entropy-randomness' },
      {
        type: 'checkpoint',
        id: 'arch-cp-1',
        label: 'Foundations',
        categories: [
          'pqc-fundamentals',
          'quantum-threats',
          'algorithm-families',
          'entropy-randomness',
        ],
      },
      { type: 'module', moduleId: 'crypto-agility' },
      { type: 'module', moduleId: 'hybrid-crypto' },
      { type: 'module', moduleId: 'qkd' },
      {
        type: 'checkpoint',
        id: 'arch-cp-2',
        label: 'Architecture Strategy',
        categories: ['crypto-agility', 'hybrid-crypto', 'nist-standards'],
      },
      { type: 'module', moduleId: 'tls-basics' },
      { type: 'module', moduleId: 'kms-pqc' },
      { type: 'module', moduleId: 'hsm-pqc' },
      { type: 'module', moduleId: 'stateful-signatures' },
      { type: 'module', moduleId: 'pki-workshop' },
      { type: 'module', moduleId: 'merkle-tree-certs' },
      {
        type: 'checkpoint',
        id: 'arch-cp-3',
        label: 'Infrastructure & Protocols',
        categories: [
          'tls-basics',
          'kms-pqc',
          'hsm-pqc',
          'stateful-signatures',
          'pki-infrastructure',
          'merkle-tree-certs',
        ],
      },
      { type: 'module', moduleId: 'email-signing' },
      { type: 'module', moduleId: 'digital-id' },
      {
        type: 'checkpoint',
        id: 'arch-cp-4',
        label: 'Identity & Credentials',
        categories: ['email-signing', 'digital-id'],
      },
      { type: 'module', moduleId: 'api-security-jwt' },
      { type: 'module', moduleId: 'code-signing' },
      { type: 'module', moduleId: 'iot-ot-pqc' },
      {
        type: 'checkpoint',
        id: 'arch-cp-5',
        label: 'API, Supply Chain & IoT',
        categories: ['api-security-jwt', 'code-signing', 'iot-ot-pqc'],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 1245,
    quizDescription:
      'Test your knowledge on cryptographic foundations, architecture strategy (crypto agility, hybrid crypto, QKD), infrastructure protocols (TLS, KMS, HSMs, stateful signatures, PKI, Merkle tree certs), identity and credentials, API security, code signing, and IoT/OT security.',
    quizCategories: [
      'entropy-randomness',
      'crypto-agility',
      'tls-basics',
      'kms-pqc',
      'hsm-pqc',
      'stateful-signatures',
      'merkle-tree-certs',
      'email-signing',
      'digital-id',
      'migration-planning',
      'algorithm-families',
      'nist-standards',
      'hybrid-crypto',
      'api-security-jwt',
      'code-signing',
      'iot-ot-pqc',
    ],
  },
  researcher: {
    id: 'researcher',
    label: 'Researcher / Academic',
    subtitle: 'Comprehensive deep dive',
    icon: 'GraduationCap',
    description:
      'Explore every module in depth — algorithms, protocols, infrastructure, and real-world applications.',
    recommendedPath: [
      'pqc-101',
      'research-quantum-impact',
      'quantum-threats',
      'entropy-randomness',
      'hybrid-crypto',
      'crypto-agility',
      'data-asset-sensitivity',
      'standards-bodies',
      'qkd',
      'tls-basics',
      'vpn-ssh-pqc',
      'email-signing',
      'api-security-jwt',
      'web-gateway-pqc',
      'pki-workshop',
      'kms-pqc',
      'hsm-pqc',
      'stateful-signatures',
      'merkle-tree-certs',
      'confidential-computing',
      'crypto-dev-apis',
      'digital-assets',
      '5g-security',
      'digital-id',
      'code-signing',
      'platform-eng-pqc',
      'iot-ot-pqc',
      'ai-security-pqc',
      'emv-payment-pqc',
      'energy-utilities-pqc',
      'healthcare-pqc',
      'automotive-pqc',
      'aerospace-space-pqc',
      'pqc-risk-management',
      'pqc-business-case',
      'pqc-governance',
      'vendor-risk',
      'migration-program',
      'compliance-strategy',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'research-quantum-impact' },
      { type: 'module', moduleId: 'quantum-threats' },
      { type: 'module', moduleId: 'entropy-randomness' },
      {
        type: 'checkpoint',
        id: 'res-cp-1',
        label: 'Foundations',
        categories: ['pqc-fundamentals', 'quantum-threats', 'entropy-randomness'],
      },
      { type: 'module', moduleId: 'hybrid-crypto' },
      { type: 'module', moduleId: 'crypto-agility' },
      { type: 'module', moduleId: 'data-asset-sensitivity' },
      { type: 'module', moduleId: 'standards-bodies' },
      { type: 'module', moduleId: 'qkd' },
      {
        type: 'checkpoint',
        id: 'res-cp-2',
        label: 'Strategy',
        categories: [
          'hybrid-crypto',
          'crypto-agility',
          'standards-bodies',
          'algorithm-families',
          'nist-standards',
          'compliance',
        ],
      },
      { type: 'module', moduleId: 'tls-basics' },
      { type: 'module', moduleId: 'vpn-ssh-pqc' },
      { type: 'module', moduleId: 'email-signing' },
      { type: 'module', moduleId: 'api-security-jwt' },
      { type: 'module', moduleId: 'web-gateway-pqc' },
      {
        type: 'checkpoint',
        id: 'res-cp-3',
        label: 'Protocols',
        categories: [
          'tls-basics',
          'protocol-integration',
          'vpn-ssh-pqc',
          'email-signing',
          'api-security-jwt',
          'web-gateway-pqc',
        ],
      },
      { type: 'module', moduleId: 'pki-workshop' },
      { type: 'module', moduleId: 'kms-pqc' },
      { type: 'module', moduleId: 'hsm-pqc' },
      { type: 'module', moduleId: 'stateful-signatures' },
      { type: 'module', moduleId: 'merkle-tree-certs' },
      { type: 'module', moduleId: 'confidential-computing' },
      { type: 'module', moduleId: 'crypto-dev-apis' },
      {
        type: 'checkpoint',
        id: 'res-cp-4',
        label: 'Infrastructure',
        categories: [
          'pki-infrastructure',
          'kms-pqc',
          'hsm-pqc',
          'stateful-signatures',
          'merkle-tree-certs',
          'confidential-computing',
          'crypto-dev-apis',
        ],
      },
      { type: 'module', moduleId: 'digital-assets' },
      { type: 'module', moduleId: '5g-security' },
      { type: 'module', moduleId: 'digital-id' },
      { type: 'module', moduleId: 'code-signing' },
      { type: 'module', moduleId: 'platform-eng-pqc' },
      { type: 'module', moduleId: 'iot-ot-pqc' },
      { type: 'module', moduleId: 'ai-security-pqc' },
      {
        type: 'checkpoint',
        id: 'res-cp-5',
        label: 'Applications',
        categories: [
          'digital-assets',
          '5g-security',
          'industry-threats',
          'code-signing',
          'iot-ot-pqc',
          'ai-security-pqc',
        ],
      },
      { type: 'module', moduleId: 'emv-payment-pqc' },
      { type: 'module', moduleId: 'energy-utilities-pqc' },
      { type: 'module', moduleId: 'healthcare-pqc' },
      { type: 'module', moduleId: 'automotive-pqc' },
      { type: 'module', moduleId: 'aerospace-space-pqc' },
      {
        type: 'checkpoint',
        id: 'res-cp-6',
        label: 'Industries',
        categories: [
          'emv-payment-pqc',
          'energy-utilities-pqc',
          'healthcare-pqc',
          'automotive-pqc',
          'aerospace-space-pqc',
          'industry-threats',
        ],
      },
      { type: 'module', moduleId: 'pqc-risk-management' },
      { type: 'module', moduleId: 'pqc-business-case' },
      { type: 'module', moduleId: 'pqc-governance' },
      { type: 'module', moduleId: 'vendor-risk' },
      { type: 'module', moduleId: 'migration-program' },
      { type: 'module', moduleId: 'compliance-strategy' },
      {
        type: 'checkpoint',
        id: 'res-cp-7',
        label: 'Executive Strategy',
        categories: [
          'pqc-risk-management',
          'pqc-business-case',
          'pqc-governance',
          'vendor-risk',
          'migration-program',
          'compliance-strategy',
        ],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 2565,
    quizDescription:
      'Full assessment across all PQC categories — algorithms, protocols, standards, compliance, industries, and applications.',
    quizCategories: [], // empty = all categories shown (full coverage for researcher)
  },
  ops: {
    id: 'ops',
    label: 'IT Ops / DevOps',
    subtitle: 'Deploy & operate focus',
    icon: 'Server',
    description:
      'Deploy PQC across production infrastructure — certificate rollouts, key lifecycle management, TLS configurations, and system-wide crypto inventory.',
    recommendedPath: [
      'pqc-101',
      'ops-quantum-impact',
      'quantum-threats',
      'tls-basics',
      'vpn-ssh-pqc',
      'web-gateway-pqc',
      'pki-workshop',
      'kms-pqc',
      'hsm-pqc',
      'standards-bodies',
      'crypto-agility',
      'migration-program',
      'platform-eng-pqc',
      'iot-ot-pqc',
      'energy-utilities-pqc',
      'ai-security-pqc',
      'aerospace-space-pqc',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'ops-quantum-impact' },
      { type: 'module', moduleId: 'quantum-threats' },
      {
        type: 'checkpoint',
        id: 'ops-cp-1',
        label: 'Foundations',
        categories: ['pqc-fundamentals', 'quantum-threats'],
      },
      { type: 'module', moduleId: 'tls-basics' },
      { type: 'module', moduleId: 'vpn-ssh-pqc' },
      { type: 'module', moduleId: 'web-gateway-pqc' },
      { type: 'module', moduleId: 'pki-workshop' },
      {
        type: 'checkpoint',
        id: 'ops-cp-2',
        label: 'Protocol Operations',
        categories: [
          'tls-basics',
          'vpn-ssh-pqc',
          'web-gateway-pqc',
          'pki-infrastructure',
          'protocol-integration',
        ],
      },
      { type: 'module', moduleId: 'kms-pqc' },
      { type: 'module', moduleId: 'hsm-pqc' },
      {
        type: 'checkpoint',
        id: 'ops-cp-3',
        label: 'Key Infrastructure',
        categories: ['kms-pqc', 'hsm-pqc', 'standards-bodies'],
      },
      { type: 'module', moduleId: 'standards-bodies' },
      { type: 'module', moduleId: 'crypto-agility' },
      { type: 'module', moduleId: 'migration-program' },
      { type: 'module', moduleId: 'platform-eng-pqc' },
      { type: 'module', moduleId: 'iot-ot-pqc' },
      { type: 'module', moduleId: 'energy-utilities-pqc' },
      { type: 'module', moduleId: 'ai-security-pqc' },
      { type: 'module', moduleId: 'aerospace-space-pqc' },
      {
        type: 'checkpoint',
        id: 'ops-cp-4',
        label: 'Migration & Fleet',
        categories: [
          'crypto-agility',
          'migration-program',
          'migration-planning',
          'iot-ot-pqc',
          'energy-utilities-pqc',
          'ai-security-pqc',
          'aerospace-space-pqc',
        ],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 1215,
    quizDescription:
      'Test your knowledge on TLS operations, VPN/SSH, web gateways, PKI certificate management, KMS and HSM operations, standards bodies, energy/utilities, and infrastructure migration planning.',
    quizCategories: [
      'pqc-fundamentals',
      'quantum-threats',
      'tls-basics',
      'vpn-ssh-pqc',
      'web-gateway-pqc',
      'pki-infrastructure',
      'protocol-integration',
      'kms-pqc',
      'hsm-pqc',
      'standards-bodies',
      'crypto-agility',
      'migration-program',
      'migration-planning',
      'iot-ot-pqc',
      'energy-utilities-pqc',
      'aerospace-space-pqc',
    ],
  },
}

/**
 * Infer a persona suggestion from a completed assessment.
 * Returns null if the assessment isn't complete or there's not enough signal.
 */
export function inferPersonaFromAssessment(assessment: {
  assessmentStatus: 'not-started' | 'in-progress' | 'complete'
  teamSize: string
  migrationStatus: string
  cryptoAgility: string
  currentCrypto?: string[]
  complianceRequirements?: string[]
  cryptoUseCases?: string[]
  infrastructure?: string[]
}): PersonaId | null {
  if (assessment.assessmentStatus !== 'complete') return null

  const cryptoCount = assessment.currentCrypto?.length ?? 0
  const complianceCount = assessment.complianceRequirements?.length ?? 0
  const useCaseCount = assessment.cryptoUseCases?.length ?? 0
  const infraCount = assessment.infrastructure?.length ?? 0

  // Researcher: comprehensive breadth across many assessment dimensions
  // (selected many algorithms, many compliance frameworks, many use cases)
  if (cryptoCount >= 5 && complianceCount >= 4 && useCaseCount >= 4) {
    return 'researcher'
  }

  // Executive: early-stage migration, focus on risk/compliance rather than implementation
  if (
    (assessment.migrationStatus === 'not-started' || assessment.migrationStatus === '') &&
    assessment.cryptoAgility !== 'fully-abstracted' &&
    infraCount <= 2
  ) {
    return 'executive'
  }

  // Ops: deep infrastructure involvement + actively migrating + hands-on (not fully abstracted)
  if (
    infraCount >= 3 &&
    (assessment.migrationStatus === 'started' || assessment.migrationStatus === 'planning') &&
    assessment.cryptoAgility !== 'fully-abstracted'
  ) {
    return 'ops'
  }

  // Architect: deep infrastructure involvement or crypto-agile design focus
  if (
    assessment.cryptoAgility === 'fully-abstracted' ||
    assessment.cryptoAgility === 'partially-abstracted' ||
    infraCount >= 3
  ) {
    return 'architect'
  }

  // Developer: actively migrating or planning, implementation-focused
  if (assessment.migrationStatus === 'started' || assessment.migrationStatus === 'planning') {
    return 'developer'
  }

  // Not enough signal to suggest a persona
  return null
}
