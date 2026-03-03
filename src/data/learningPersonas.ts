// SPDX-License-Identifier: GPL-3.0-only
import type { QuizCategory } from '@/components/PKILearning/modules/Quiz/types'

export type PersonaId = 'executive' | 'developer' | 'architect' | 'researcher'

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
  icon: 'Briefcase' | 'Code' | 'ShieldCheck' | 'GraduationCap'
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
    label: 'Executive / CISO',
    subtitle: 'Risk & strategy focus',
    icon: 'Briefcase',
    description:
      'Understand the quantum threat, build a business case, establish governance, and plan a comprehensive migration strategy.',
    recommendedPath: [
      'pqc-101',
      'quantum-threats',
      'pqc-risk-management',
      'data-asset-sensitivity',
      'pqc-business-case',
      'pqc-governance',
      'compliance-strategy',
      'crypto-agility',
      'migration-program',
      'vendor-risk',
      'kms-pqc',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
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
      {
        type: 'checkpoint',
        id: 'exec-cp-3',
        label: 'Governance & Compliance',
        categories: ['pqc-governance', 'compliance-strategy', 'compliance'],
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
      {
        type: 'checkpoint',
        id: 'exec-cp-5',
        label: 'Infrastructure',
        categories: ['kms-pqc'],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 660,
    quizDescription:
      'Test your knowledge on quantum threats, risk management, data asset classification, business cases, governance, compliance strategy, and migration planning.',
    quizCategories: [
      'pqc-fundamentals',
      'quantum-threats',
      'pqc-risk-management',
      'pqc-business-case',
      'pqc-governance',
      'compliance-strategy',
      'compliance',
      'migration-planning',
      'crypto-agility',
      'migration-program',
      'vendor-risk',
      'kms-pqc',
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
      'quantum-threats',
      'entropy-randomness',
      'tls-basics',
      'vpn-ssh-pqc',
      'hybrid-crypto',
      'crypto-agility',
      'pki-workshop',
      'merkle-tree-certs',
      'email-signing',
      'api-security-jwt',
      'code-signing',
      'iot-ot-pqc',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
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
      {
        type: 'checkpoint',
        id: 'dev-cp-2',
        label: 'Protocol Integration',
        categories: ['tls-basics', 'protocol-integration', 'vpn-ssh-pqc'],
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
      { type: 'module', moduleId: 'merkle-tree-certs' },
      { type: 'module', moduleId: 'email-signing' },
      {
        type: 'checkpoint',
        id: 'dev-cp-4',
        label: 'PKI & Signing',
        categories: [
          'pki-infrastructure',
          'merkle-tree-certs',
          'email-signing',
          'crypto-operations',
        ],
      },
      { type: 'module', moduleId: 'api-security-jwt' },
      { type: 'module', moduleId: 'code-signing' },
      { type: 'module', moduleId: 'iot-ot-pqc' },
      {
        type: 'checkpoint',
        id: 'dev-cp-5',
        label: 'Supply Chain & IoT Security',
        categories: ['code-signing', 'api-security-jwt', 'iot-ot-pqc'],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 855,
    quizDescription:
      'Test your knowledge on quantum threats, TLS, VPN/SSH, PKI, hybrid cryptography, crypto agility, and protocol integration.',
    quizCategories: [
      'pqc-fundamentals',
      'quantum-threats',
      'entropy-randomness',
      'tls-basics',
      'protocol-integration',
      'hybrid-crypto',
      'crypto-agility',
      'pki-infrastructure',
      'merkle-tree-certs',
      'crypto-operations',
      'vpn-ssh-pqc',
      'email-signing',
      'code-signing',
      'api-security-jwt',
      'iot-ot-pqc',
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
      'quantum-threats',
      'entropy-randomness',
      'crypto-agility',
      'hybrid-crypto',
      'data-asset-sensitivity',
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
      { type: 'module', moduleId: 'data-asset-sensitivity' },
      { type: 'module', moduleId: 'qkd' },
      {
        type: 'checkpoint',
        id: 'arch-cp-2',
        label: 'Architecture Strategy',
        categories: ['crypto-agility', 'hybrid-crypto', 'nist-standards', 'compliance'],
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
        id: 'arch-cp-identity',
        label: 'Identity & Credentials',
        categories: ['email-signing', 'digital-id'],
      },
      { type: 'module', moduleId: 'api-security-jwt' },
      { type: 'module', moduleId: 'code-signing' },
      { type: 'module', moduleId: 'iot-ot-pqc' },
      {
        type: 'checkpoint',
        id: 'arch-cp-4',
        label: 'API, Supply Chain & IoT',
        categories: ['api-security-jwt', 'code-signing', 'iot-ot-pqc'],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 1275,
    quizDescription:
      'Test your knowledge on crypto agility, data asset classification, TLS, key management, HSM operations, stateful signatures, and architecture patterns.',
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
      'quantum-threats',
      'entropy-randomness',
      'hybrid-crypto',
      'crypto-agility',
      'data-asset-sensitivity',
      'qkd',
      'tls-basics',
      'vpn-ssh-pqc',
      'email-signing',
      'api-security-jwt',
      'pki-workshop',
      'kms-pqc',
      'hsm-pqc',
      'stateful-signatures',
      'merkle-tree-certs',
      'digital-assets',
      '5g-security',
      'digital-id',
      'code-signing',
      'iot-ot-pqc',
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
      { type: 'module', moduleId: 'qkd' },
      {
        type: 'checkpoint',
        id: 'res-cp-2',
        label: 'Strategy',
        categories: [
          'hybrid-crypto',
          'crypto-agility',
          'algorithm-families',
          'nist-standards',
          'compliance',
        ],
      },
      { type: 'module', moduleId: 'tls-basics' },
      { type: 'module', moduleId: 'vpn-ssh-pqc' },
      { type: 'module', moduleId: 'email-signing' },
      { type: 'module', moduleId: 'api-security-jwt' },
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
        ],
      },
      { type: 'module', moduleId: 'pki-workshop' },
      { type: 'module', moduleId: 'kms-pqc' },
      { type: 'module', moduleId: 'hsm-pqc' },
      { type: 'module', moduleId: 'stateful-signatures' },
      { type: 'module', moduleId: 'merkle-tree-certs' },
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
        ],
      },
      { type: 'module', moduleId: 'digital-assets' },
      { type: 'module', moduleId: '5g-security' },
      { type: 'module', moduleId: 'digital-id' },
      { type: 'module', moduleId: 'code-signing' },
      { type: 'module', moduleId: 'iot-ot-pqc' },
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
        id: 'res-cp-6',
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
    estimatedMinutes: 1575,
    quizDescription:
      'Full assessment across all PQC categories — algorithms, protocols, standards, compliance, and applications.',
    quizCategories: [], // empty = all categories shown (full coverage for researcher)
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
    (assessment.migrationStatus === 'not-started' ||
      assessment.migrationStatus === 'unknown' ||
      assessment.migrationStatus === '') &&
    assessment.cryptoAgility !== 'fully-abstracted' &&
    infraCount <= 2
  ) {
    return 'executive'
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
