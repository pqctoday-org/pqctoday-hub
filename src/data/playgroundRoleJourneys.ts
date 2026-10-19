// SPDX-License-Identifier: AGPL-3.0-only
import type { PersonaId } from '@/data/personaIds'

export interface PlaygroundRoleJourney {
  /** Ordered, deliberately short route through the browser-only tools. */
  toolIds: readonly string[]
  learnTo: string
  rationale: string
}

/**
 * The single source of truth for role-specific Playground recommendations.
 * Landing cards, Start-here cards, role boards and tests must derive from this
 * map so a learner is not sent down a different path on each surface.
 */
export const PLAYGROUND_ROLE_JOURNEYS: Record<PersonaId, PlaygroundRoleJourney> = {
  executive: {
    toolIds: ['hsm-capacity', 'cert-capacity'],
    learnTo: '/learn/exec-quantum-impact',
    rationale: 'Turn cryptographic change into capacity, cost and delivery decisions.',
  },
  grc: {
    toolIds: ['cert-capacity', 'hsm-capacity'],
    learnTo: '/learn/pqc-grc',
    rationale: 'See measurable operational impact, then connect it to governance evidence.',
  },
  developer: {
    toolIds: ['hybrid-encrypt', 'tls-simulator', 'api-security-jwt'],
    learnTo: '/learn/crypto-dev-apis',
    rationale: 'Exercise the application, transport and token boundaries developers change.',
  },
  architect: {
    toolIds: ['envelope-encrypt', 'cert-capacity', 'hybrid-certs'],
    learnTo: '/learn/arch-quantum-impact',
    rationale: 'Explore key custody, certificate size and migration architecture trade-offs.',
  },
  researcher: {
    toolIds: ['slh-dsa', 'entropy-test', 'drbg-demo'],
    learnTo: '/learn/research-quantum-impact',
    rationale: 'Inspect algorithm behaviour, statistical evidence and deterministic generation.',
  },
  'cert-engineer': {
    toolIds: ['entropy-test', 'drbg-demo', 'firmware-signing'],
    learnTo: '/learn/crypto-product-certification',
    rationale:
      'Practice evidence interpretation without mistaking browser output for certification.',
  },
  ops: {
    toolIds: ['token-migration', 'firmware-signing', 'openssl-studio'],
    learnTo: '/learn/ops-quantum-impact',
    rationale: 'Rehearse migration, release integrity and command-line operational workflows.',
  },
  curious: {
    toolIds: ['qrng-demo', 'pki-workshop', 'merkle-proof'],
    learnTo: '/learn/pqc-101',
    rationale: 'Build intuition through visible randomness, trust chains and proof verification.',
  },
}

export function playgroundJourneyFor(persona: PersonaId): PlaygroundRoleJourney {
  return PLAYGROUND_ROLE_JOURNEYS[persona]
}
