import type {
  AssessmentInput,
  CategoryScores,
  HNDLRiskWindow,
  HNFLRiskWindow,
  MigrationEffortItem,
  RecommendedAction,
} from '../assessmentTypes'

export interface ActionReframing {
  /** Substring to match in the original action text */
  pattern: string
  /** Persona-specific replacement text */
  reframings: Partial<Record<string, string>>
}

export const ACTION_REFRAMINGS: ActionReframing[] = [
  {
    pattern:
      'Conduct a cryptographic asset inventory to identify all algorithms in use across systems, services, and dependencies.',
    reframings: {
      executive:
        'Commission a cryptographic asset inventory across your organization — this is the foundation for migration planning and budget estimation.',
      developer:
        'Run a dependency-level crypto audit: scan for algorithm identifiers in your codebase and audit transitive crypto library dependencies.',
      architect:
        'Map all cryptographic assets across your system topology — protocol endpoints, key stores, certificate chains, and embedded crypto.',
    },
  },
  {
    pattern:
      'Conduct cryptographic asset inventory to identify all systems using vulnerable algorithms.',
    reframings: {
      executive:
        'Commission a cryptographic asset inventory to determine which business systems require migration investment.',
      developer:
        'Scan your codebase and dependency tree for quantum-vulnerable algorithm usage before planning migration.',
      architect:
        'Map all systems consuming cryptographic services — direct and transitive — to scope the migration effort.',
    },
  },
  {
    pattern: 'Conduct a data classification exercise',
    reframings: {
      executive:
        'Commission a data classification exercise to understand which business data requires quantum-safe protection — this drives your HNDL risk exposure.',
      developer:
        'Audit the data sensitivity levels your code handles — PII, financial, and health data in long-lived stores drive HNDL risk.',
    },
  },
  {
    pattern: 'Refactor cryptographic implementations to use abstraction layers',
    reframings: {
      executive:
        'Invest in crypto-agility infrastructure — abstracting encryption from business logic reduces the cost of future algorithm transitions.',
      developer:
        'Introduce a provider/factory pattern for all crypto operations to enable algorithm-agnostic migration paths.',
      architect:
        'Design a crypto abstraction layer that supports algorithm negotiation and hybrid schemes across the infrastructure.',
    },
  },
  {
    pattern: 'Build PQC awareness across engineering and leadership teams.',
    reframings: {
      executive:
        'Brief the board and senior leadership on quantum risk and the PQC migration investment timeline.',
      developer:
        'Complete PQC learning modules relevant to your stack and share findings with your engineering team.',
      architect:
        'Conduct architecture review workshops focused on PQC migration patterns and hybrid deployment strategies.',
    },
  },
  {
    pattern: 'Evaluate PQC-ready libraries and tools for your technology stack.',
    reframings: {
      executive:
        'Direct your engineering leads to evaluate quantum-safe encryption libraries and estimate integration costs.',
      developer:
        'Benchmark PQC library candidates (liboqs, OpenSSL 3.5+, BoringSSL) against your performance and compatibility requirements.',
      architect:
        'Evaluate PQC-ready libraries for compatibility with your infrastructure topology, HSM integrations, and deployment pipeline.',
    },
  },
  {
    pattern: 'Migrate TLS endpoints to hybrid PQC key exchange',
    reframings: {
      executive:
        'Prioritize TLS migration to hybrid quantum-safe encryption — this protects data in transit immediately and demonstrates compliance progress.',
      developer:
        'Configure hybrid ML-KEM + X25519 key exchange on your TLS endpoints — start with non-critical services to validate performance.',
      architect:
        'Plan TLS migration as a phased rollout: hybrid ML-KEM + X25519 at edge gateways first, then propagate to internal service mesh.',
    },
  },
  {
    pattern: 'Evaluate HSM vendor PQC firmware roadmap',
    reframings: {
      executive:
        'Engage your HSM vendor about PQC firmware upgrade timelines and budget — HSMs are typically the highest-cost migration item.',
      architect:
        'Evaluate HSM vendor PQC firmware roadmap and plan trust root migration sequence — HSMs constrain the entire certificate chain.',
    },
  },
  {
    pattern: 'Implement hybrid PQC encryption for data-at-rest',
    reframings: {
      executive:
        'Prioritize hybrid quantum-safe encryption for your most sensitive stored data — this mitigates the Harvest-Now-Decrypt-Later threat immediately.',
      developer:
        'Implement hybrid PQC encryption (ML-KEM + AES) for data-at-rest in your highest-sensitivity data stores.',
      architect:
        'Design a hybrid PQC encryption layer for data-at-rest that integrates with your KMS topology and key rotation policies.',
    },
  },
  {
    pattern: 'Engage SaaS and SDK vendors for PQC migration timelines',
    reframings: {
      executive:
        'Request PQC migration roadmaps from your SaaS and SDK vendors — their timelines may constrain your own migration schedule.',
      developer:
        'Check your vendor SDKs and SaaS APIs for PQC support — file feature requests and track their migration roadmaps.',
    },
  },
]

export const PERSONA_UNKNOWN_WEIGHTS: Record<
  string,
  { agility: number; infra: number; compliance: number; migration: number }
> = {
  executive: { agility: 0.8, infra: 0.7, compliance: 1.0, migration: 0.8 },
  developer: { agility: 1.0, infra: 0.9, compliance: 0.8, migration: 0.9 },
  architect: { agility: 1.0, infra: 1.0, compliance: 0.9, migration: 1.0 },
  pki: { agility: 1.0, infra: 1.0, compliance: 1.0, migration: 1.0 },
  product: { agility: 0.8, infra: 0.8, compliance: 0.9, migration: 0.9 },
  leadership: { agility: 0.7, infra: 0.7, compliance: 1.0, migration: 0.8 },
  researcher: { agility: 0.85, infra: 0.8, compliance: 0.75, migration: 0.85 },
  ops: { agility: 0.9, infra: 1.0, compliance: 0.85, migration: 1.0 },
}

export const DEFAULT_UNKNOWN_WEIGHTS = { agility: 1.0, infra: 1.0, compliance: 1.0, migration: 1.0 }

export function getPersonaWeights(persona: string | undefined): {
  agility: number
  infra: number
  compliance: number
  migration: number
} {
  if (!persona) return DEFAULT_UNKNOWN_WEIGHTS
  // eslint-disable-next-line security/detect-object-injection
  return PERSONA_UNKNOWN_WEIGHTS[persona] ?? DEFAULT_UNKNOWN_WEIGHTS
}

export function reframeActionsForPersona(
  actions: RecommendedAction[],
  persona: string
): RecommendedAction[] {
  return actions.map((action) => {
    for (const reframing of ACTION_REFRAMINGS) {
      if (action.action.includes(reframing.pattern)) {
        // eslint-disable-next-line security/detect-object-injection
        const replacement = reframing.reframings[persona]
        if (replacement) {
          return { ...action, action: replacement }
        }
        break
      }
    }
    return action
  })
}

export function generatePersonaNarrative(
  persona: string | undefined,
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  migrationEffort: MigrationEffortItem[] | undefined,
  categoryScores: CategoryScores | undefined,
  hndl: HNDLRiskWindow | undefined,
  hnfl: HNFLRiskWindow | undefined,
  pqcFrameworkCount: number
): string | undefined {
  if (!persona) return undefined

  switch (persona) {
    case 'executive':
      return generateExecNarrative(
        input,
        riskScore,
        riskLevel,
        vulnerableCount,
        migrationEffort,
        pqcFrameworkCount,
        hndl,
        hnfl
      )
    case 'developer':
      return generateDevNarrative(input, riskScore, riskLevel, vulnerableCount, migrationEffort)
    case 'architect':
      return generateArchitectNarrative(
        input,
        riskScore,
        riskLevel,
        vulnerableCount,
        migrationEffort,
        categoryScores
      )
    case 'researcher':
      return generateResearcherNarrative(
        input,
        riskScore,
        riskLevel,
        vulnerableCount,
        migrationEffort,
        categoryScores,
        hndl,
        hnfl,
        pqcFrameworkCount
      )
    default:
      return undefined
  }
}
