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
      'Understand the quantum threat, compliance landscape, and migration strategy without deep technical details.',
    recommendedPath: ['pqc-101', 'quantum-threats', 'crypto-agility', 'hybrid-crypto', 'quiz'],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'quantum-threats' },
      {
        type: 'checkpoint',
        id: 'exec-cp-1',
        label: 'Threat Landscape',
        categories: ['pqc-fundamentals', 'quantum-threats'],
      },
      { type: 'module', moduleId: 'crypto-agility' },
      { type: 'module', moduleId: 'hybrid-crypto' },
      {
        type: 'checkpoint',
        id: 'exec-cp-2',
        label: 'Strategy & Migration',
        categories: ['crypto-agility', 'migration-planning', 'compliance'],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 210,
    quizDescription:
      'Test your knowledge on quantum threats, compliance deadlines, and migration strategy.',
    quizCategories: [
      'pqc-fundamentals',
      'quantum-threats',
      'compliance',
      'migration-planning',
      'crypto-agility',
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
      'tls-basics',
      'vpn-ssh-pqc',
      'hybrid-crypto',
      'crypto-agility',
      'pki-workshop',
      'email-signing',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'quantum-threats' },
      {
        type: 'checkpoint',
        id: 'dev-cp-1',
        label: 'Foundations & Threats',
        categories: ['pqc-fundamentals', 'quantum-threats'],
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
      { type: 'module', moduleId: 'email-signing' },
      {
        type: 'checkpoint',
        id: 'dev-cp-4',
        label: 'PKI & Signing',
        categories: ['pki-infrastructure', 'email-signing', 'crypto-operations'],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 495,
    quizDescription:
      'Test your knowledge on quantum threats, TLS, VPN/SSH, PKI, hybrid cryptography, crypto agility, and protocol integration.',
    quizCategories: [
      'pqc-fundamentals',
      'quantum-threats',
      'tls-basics',
      'protocol-integration',
      'hybrid-crypto',
      'crypto-agility',
      'pki-infrastructure',
      'crypto-operations',
      'vpn-ssh-pqc',
      'email-signing',
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
      'crypto-agility',
      'hybrid-crypto',
      'tls-basics',
      'key-management',
      'stateful-signatures',
      'pki-workshop',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'quantum-threats' },
      {
        type: 'checkpoint',
        id: 'arch-cp-1',
        label: 'Foundations',
        categories: ['pqc-fundamentals', 'quantum-threats', 'algorithm-families'],
      },
      { type: 'module', moduleId: 'crypto-agility' },
      { type: 'module', moduleId: 'hybrid-crypto' },
      {
        type: 'checkpoint',
        id: 'arch-cp-2',
        label: 'Architecture Strategy',
        categories: ['crypto-agility', 'hybrid-crypto', 'nist-standards'],
      },
      { type: 'module', moduleId: 'tls-basics' },
      { type: 'module', moduleId: 'key-management' },
      { type: 'module', moduleId: 'stateful-signatures' },
      { type: 'module', moduleId: 'pki-workshop' },
      {
        type: 'checkpoint',
        id: 'arch-cp-3',
        label: 'Infrastructure & Protocols',
        categories: ['tls-basics', 'key-management', 'stateful-signatures', 'pki-infrastructure'],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 465,
    quizDescription:
      'Test your knowledge on crypto agility, TLS, key management, stateful signatures, and architecture patterns.',
    quizCategories: [
      'crypto-agility',
      'tls-basics',
      'key-management',
      'stateful-signatures',
      'migration-planning',
      'algorithm-families',
      'nist-standards',
      'hybrid-crypto',
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
      'hybrid-crypto',
      'crypto-agility',
      'tls-basics',
      'vpn-ssh-pqc',
      'email-signing',
      'pki-workshop',
      'key-management',
      'stateful-signatures',
      'digital-assets',
      '5g-security',
      'digital-id',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'quantum-threats' },
      {
        type: 'checkpoint',
        id: 'res-cp-1',
        label: 'Foundations',
        categories: ['pqc-fundamentals', 'quantum-threats'],
      },
      { type: 'module', moduleId: 'hybrid-crypto' },
      { type: 'module', moduleId: 'crypto-agility' },
      {
        type: 'checkpoint',
        id: 'res-cp-2',
        label: 'Strategy',
        categories: ['hybrid-crypto', 'crypto-agility', 'algorithm-families', 'nist-standards'],
      },
      { type: 'module', moduleId: 'tls-basics' },
      { type: 'module', moduleId: 'vpn-ssh-pqc' },
      { type: 'module', moduleId: 'email-signing' },
      {
        type: 'checkpoint',
        id: 'res-cp-3',
        label: 'Protocols',
        categories: ['tls-basics', 'protocol-integration', 'vpn-ssh-pqc', 'email-signing'],
      },
      { type: 'module', moduleId: 'pki-workshop' },
      { type: 'module', moduleId: 'key-management' },
      { type: 'module', moduleId: 'stateful-signatures' },
      {
        type: 'checkpoint',
        id: 'res-cp-4',
        label: 'Infrastructure',
        categories: ['pki-infrastructure', 'key-management', 'stateful-signatures'],
      },
      { type: 'module', moduleId: 'digital-assets' },
      { type: 'module', moduleId: '5g-security' },
      { type: 'module', moduleId: 'digital-id' },
      {
        type: 'checkpoint',
        id: 'res-cp-5',
        label: 'Applications',
        categories: ['digital-assets', '5g-security', 'industry-threats'],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 780,
    quizDescription:
      'Full assessment across all 16 PQC categories — algorithms, protocols, standards, compliance, and applications.',
    quizCategories: [], // empty = all categories shown (full coverage for researcher)
  },
}

/**
 * Infer a persona suggestion from a completed assessment.
 * Returns null if the assessment isn't complete or there's not enough signal.
 */
export function inferPersonaFromAssessment(assessment: {
  isComplete: boolean
  teamSize: string
  migrationStatus: string
  cryptoAgility: string
  currentCrypto?: string[]
  complianceRequirements?: string[]
  cryptoUseCases?: string[]
  infrastructure?: string[]
}): PersonaId | null {
  if (!assessment.isComplete) return null

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
