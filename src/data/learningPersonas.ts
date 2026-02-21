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
      'industry-threats',
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
      'tls-basics',
      'vpn-ssh-pqc',
      'hybrid-crypto',
      'pki-workshop',
      'email-signing',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'tls-basics' },
      {
        type: 'checkpoint',
        id: 'dev-cp-1',
        label: 'Protocol Basics',
        categories: ['pqc-fundamentals', 'tls-basics'],
      },
      { type: 'module', moduleId: 'vpn-ssh-pqc' },
      { type: 'module', moduleId: 'hybrid-crypto' },
      {
        type: 'checkpoint',
        id: 'dev-cp-2',
        label: 'Protocols & Hybrid Crypto',
        categories: ['protocol-integration', 'hybrid-crypto', 'vpn-ssh-pqc'],
      },
      { type: 'module', moduleId: 'pki-workshop' },
      { type: 'module', moduleId: 'email-signing' },
      {
        type: 'checkpoint',
        id: 'dev-cp-3',
        label: 'PKI & Signing',
        categories: ['pki-infrastructure', 'email-signing', 'crypto-operations'],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 405,
    quizDescription:
      'Test your knowledge on TLS, VPN/SSH, PKI, hybrid cryptography, and protocol integration.',
    quizCategories: [
      'tls-basics',
      'protocol-integration',
      'hybrid-crypto',
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
      { type: 'module', moduleId: 'key-management' },
      { type: 'module', moduleId: 'stateful-signatures' },
      { type: 'module', moduleId: 'pki-workshop' },
      {
        type: 'checkpoint',
        id: 'arch-cp-3',
        label: 'Infrastructure',
        categories: ['key-management', 'stateful-signatures', 'pki-infrastructure'],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 420,
    quizDescription:
      'Test your knowledge on crypto agility, key management, stateful signatures, and architecture patterns.',
    quizCategories: [
      'crypto-agility',
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
}): PersonaId | null {
  if (!assessment.isComplete) return null

  // Small team + early migration stage → likely executive/decision-maker
  if (
    (assessment.teamSize === 'small' || assessment.teamSize === '') &&
    (assessment.migrationStatus === 'not_started' || assessment.migrationStatus === '')
  ) {
    return 'executive'
  }

  // High crypto agility or large team → likely architect
  if (assessment.cryptoAgility === 'high' || assessment.teamSize === 'large') {
    return 'architect'
  }

  // Medium team actively migrating → likely developer
  if (assessment.migrationStatus === 'in_progress' || assessment.migrationStatus === 'planning') {
    return 'developer'
  }

  // Default suggestion for assessment completers
  return 'architect'
}
