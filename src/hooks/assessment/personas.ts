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
      curious:
        'Ask your IT team to make a list of all the encryption your organization uses — think of it as checking all the locks on your doors before getting new ones.',
      ops: 'Run an infrastructure discovery scan to identify all active certificates, TLS endpoints, and key stores.',
      researcher: 'Systematically catalog cryptographic implementations to analyze the attack surface area across dependencies.',
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
      curious:
        'Find out which of your computer systems use encryption that needs upgrading — your IT team can help.',
      ops: 'Audit production environments to locate services currently negotiating quantum-vulnerable protocols.',
      researcher: 'Identify all instances of vulnerable algorithms within the operational environment to build an empirical risk model.',
    },
  },
  {
    pattern: 'Conduct a data classification exercise',
    reframings: {
      executive:
        'Commission a data classification exercise to understand which business data requires quantum-safe protection — this drives your HNDL risk exposure.',
      developer:
        'Audit the data sensitivity levels your code handles — PII, financial, and health data in long-lived stores drive HNDL risk.',
      curious:
        'Figure out which of your important data (customer records, financial info, health data) needs the strongest protection from future quantum computers.',
      ops: 'Ensure storage and backup policies map to data sensitivity classifications aligned with HNDL risk.',
      researcher: 'Analyze data schemas to categorize information assets according to their Harvest-Now-Decrypt-Later exploitability.',
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
      curious:
        'Make your encryption systems flexible so they can be updated to new methods in the future — like installing modular locks that can be rekeyed.',
      ops: 'Deploy configuration-driven cryptographic proxies and terminate TLS at agile gateways.',
      researcher: 'Implement cryptographic abstraction interfaces to facilitate comparative algorithm testing without system disruption.',
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
      curious:
        'Start learning about quantum computing threats and share what you learn with your team — awareness is the first step.',
      ops: 'Train deployment teams and NOC on identifying and managing PQC-related incidents and configuration changes.',
      researcher: 'Publish internal analyses and organize technical deep-dives on the mechanics of PQC algorithms.',
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
      curious:
        'Ask your technology team to start looking at new encryption tools that are designed to resist quantum computers.',
      ops: 'Test operational deployment and patching of PQC-ready binaries and containers in lower environments.',
      researcher: 'Conduct rigorous functional and side-channel testing of available PQC cryptographic provider implementations.',
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
      curious:
        'Upgrade the encryption on your websites and online services to use quantum-safe methods — this protects data being sent over the internet.',
      ops: 'Update proxy and load balancer configurations to negotiate hybrid ML-KEM key exchanges across external endpoints.',
      researcher: 'Monitor and benchmark handshake latency differences when transitioning TLS termination to hybrid ML-KEM.',
    },
  },
  {
    pattern: 'Evaluate HSM vendor PQC firmware roadmap',
    reframings: {
      executive:
        'Engage your HSM vendor about PQC firmware upgrade timelines and budget — HSMs are typically the highest-cost migration item.',
      architect:
        'Evaluate HSM vendor PQC firmware roadmap and plan trust root migration sequence — HSMs constrain the entire certificate chain.',
      curious: 'Check if the specialized hardware storing your most critical passwords can be upgraded to resist quantum attacks.',
      ops: 'Plan maintenance windows for HSM firmware flashes and validate key ceremony procedures for PQC keys.',
      researcher: 'Analyze cryptographic boundaries and firmware release notes for standards-compliant PQC stateful signature modes.',
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
      curious: 'Begin double-locking your stored sensitive files using both traditional and new quantum-safe methods.',
      ops: 'Roll out encryption-at-rest using hybrid key hierarchies across databases and block storage.',
      researcher: 'Investigate the feasibility and overhead of KEM combiners for static data archives.',
    },
  },
  {
    pattern: 'Engage SaaS and SDK vendors for PQC migration timelines',
    reframings: {
      executive:
        'Request PQC migration roadmaps from your SaaS and SDK vendors — their timelines may constrain your own migration schedule.',
      developer:
        'Check your vendor SDKs and SaaS APIs for PQC support — file feature requests and track their migration roadmaps.',
      curious: 'Ask the external software companies you rely on when they plan to upgrade their security to be quantum-safe.',
      ops: 'Map all external vendor API integrations and monitor their endpoints for PQC negotiation capabilities.',
      researcher: 'Review SaaS provider transparency reports regarding their cryptographic transitions and evaluate their timeline viability.',
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
  researcher: { agility: 0.85, infra: 0.8, compliance: 0.75, migration: 0.85 },
  ops: { agility: 0.9, infra: 1.0, compliance: 0.85, migration: 1.0 },
  curious: { agility: 0.7, infra: 0.7, compliance: 0.8, migration: 0.7 },
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

function generateExecNarrative(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  migrationEffort: MigrationEffortItem[] | undefined,
  pqcFrameworkCount: number,
  hndl: HNDLRiskWindow | undefined,
  hnfl: HNFLRiskWindow | undefined
): string {
  const parts: string[] = []
  parts.push(
    `Your ${input.industry} organization has a ${riskLevel} quantum risk exposure (${riskScore}/100), requiring ${riskScore > 55 ? 'board-level attention and budget allocation' : 'proactive planning'} to avoid regulatory and competitive penalties from delayed PQC migration.`
  )
  if (vulnerableCount > 0) {
    const quickWins = migrationEffort?.filter((m) => m.estimatedScope === 'quick-win').length ?? 0
    const majorProjects =
      migrationEffort?.filter(
        (m) => m.estimatedScope === 'major-project' || m.estimatedScope === 'multi-year'
      ).length ?? 0
    if (majorProjects > 0) {
      parts.push(
        `${majorProjects} algorithm migration${majorProjects > 1 ? 's' : ''} represent${majorProjects === 1 ? 's' : ''} major capital expenditures; ${quickWins > 0 ? `${quickWins} quick-win${quickWins > 1 ? 's' : ''} can demonstrate progress while larger projects are planned` : 'immediate budget planning is recommended'}.`
      )
    } else if (quickWins > 0) {
      parts.push(
        `${quickWins} quick-win migration${quickWins > 1 ? 's' : ''} can be completed with minimal investment to reduce your risk score immediately.`
      )
    }
  }
  if (hndl?.isAtRisk) {
    parts.push(
      `Sensitive data is being harvested today for future decryption — your ${hndl.riskWindowYears}-year exposure window means delayed action directly increases breach liability.`
    )
  }
  if (hnfl?.isAtRisk) {
    parts.push(
      `Digital credentials and signatures remain trusted ${hnfl.riskWindowYears} year${hnfl.riskWindowYears !== 1 ? 's' : ''} beyond the quantum threat window — forgery risk increases without certificate lifecycle migration.`
    )
  }
  if (pqcFrameworkCount > 0) {
    parts.push(
      `${pqcFrameworkCount} compliance framework${pqcFrameworkCount > 1 ? 's' : ''} mandate${pqcFrameworkCount === 1 ? 's' : ''} PQC adoption — non-compliance risks audit findings and potential penalties.`
    )
  }
  const statusMsg: Record<string, string> = {
    started: 'Migration is underway — ensure executive sponsorship and budget continuity.',
    planning: 'Migration planning is in progress — secure funding and assign executive ownership.',
    'not-started':
      'Migration has not begun — the cost of delay compounds as quantum timelines firm up.',
    unknown: 'Migration status is unclear — commission a cryptographic baseline assessment.',
  }
  parts.push(statusMsg[input.migrationStatus] ?? '')
  return parts.filter(Boolean).join(' ')
}

function generateDevNarrative(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  migrationEffort: MigrationEffortItem[] | undefined
): string {
  const parts: string[] = []
  parts.push(
    `Your stack has a ${riskLevel} quantum vulnerability score (${riskScore}/100) — ${vulnerableCount > 0 ? `${vulnerableCount} algorithm${vulnerableCount > 1 ? 's' : ''} in your dependency chain need${vulnerableCount === 1 ? 's' : ''} PQC replacements` : 'your current algorithm choices are PQC-compatible'}.`
  )
  const quickWins = migrationEffort?.filter((m) => m.estimatedScope === 'quick-win') ?? []
  if (quickWins.length > 0) {
    parts.push(
      `Start with ${quickWins.map((q) => q.algorithm).join(', ')} — ${quickWins.length > 1 ? 'these are' : 'this is a'} quick-win${quickWins.length > 1 ? 's' : ''} that can be migrated with minimal refactoring using liboqs, OpenSSL 3.5+, or BoringSSL.`
    )
  }
  if (input.cryptoAgility === 'hardcoded') {
    parts.push(
      'Your cryptographic implementations are hardcoded, which will significantly increase migration effort. Introduce provider/factory abstractions before attempting algorithm swaps.'
    )
  } else if (input.cryptoAgility === 'fully-abstracted') {
    parts.push(
      'Your crypto abstraction layer means algorithm swaps can be implemented as configuration changes — prioritize updating the algorithm registry.'
    )
  }
  if (input.vendorDependency === 'heavy-vendor') {
    parts.push(
      'Heavy vendor dependency means your migration timeline is constrained by SDK and SaaS provider roadmaps — file PQC feature requests and track vendor release schedules.'
    )
  }
  const statusMsg: Record<string, string> = {
    started:
      'PQC migration is underway in your stack — keep momentum and test hybrid schemes in staging.',
    planning:
      'Migration is planned — begin with a dependency-level crypto audit and identify quick-win algorithm swaps.',
    'not-started':
      'No migration started — begin with a codebase scan for crypto primitive usage and prioritize by data sensitivity.',
    unknown:
      'Migration status unclear — audit your dependency tree for cryptographic library versions and algorithm choices.',
  }
  parts.push(statusMsg[input.migrationStatus] ?? '')
  return parts.filter(Boolean).join(' ')
}

function generateArchitectNarrative(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  migrationEffort: MigrationEffortItem[] | undefined,
  categoryScores: CategoryScores | undefined
): string {
  const parts: string[] = []
  parts.push(
    `Your system architecture has a ${riskLevel} PQC migration complexity score (${riskScore}/100).`
  )
  if (categoryScores) {
    const dominantCategory = Object.entries(categoryScores).reduce((a, b) => (b[1] > a[1] ? b : a))
    const categoryLabels: Record<string, string> = {
      quantumExposure: 'quantum algorithm exposure',
      migrationComplexity: 'migration complexity',
      regulatoryPressure: 'regulatory pressure',
      organizationalReadiness: 'organizational readiness gaps',
    }
    parts.push(
      `The dominant risk driver is ${categoryLabels[dominantCategory[0]] ?? dominantCategory[0]} (${dominantCategory[1]}/100).`
    )
  }
  if (vulnerableCount > 0) {
    const majorMigrations =
      migrationEffort?.filter(
        (m) => m.estimatedScope === 'major-project' || m.estimatedScope === 'multi-year'
      ) ?? []
    if (majorMigrations.length > 0) {
      parts.push(
        `${majorMigrations.length} algorithm${majorMigrations.length > 1 ? 's' : ''} (${majorMigrations.map((m) => m.algorithm).join(', ')}) require major architectural changes — sequence migration from trust roots to leaf services.`
      )
    }
  }
  if (input.infrastructure?.some((i) => i.includes('HSM'))) {
    parts.push(
      'HSM dependencies constrain the migration sequence — begin with HSM vendor PQC firmware evaluation before planning certificate chain migration.'
    )
  }
  if (input.cryptoAgility === 'hardcoded') {
    parts.push(
      'Hardcoded cryptographic primitives across the infrastructure will require systematic refactoring before algorithm-agnostic deployment can proceed.'
    )
  }
  const statusMsg: Record<string, string> = {
    started:
      'Migration is in progress — validate hybrid deployment patterns and monitor performance impact on critical paths.',
    planning:
      'Architecture planning is underway — define migration sequencing from PKI/KMS trust roots outward.',
    'not-started':
      'No migration underway — begin with an architectural dependency map of cryptographic services.',
    unknown:
      'Migration status unclear — prioritize a cryptographic architecture review to scope the migration effort.',
  }
  parts.push(statusMsg[input.migrationStatus] ?? '')
  return parts.filter(Boolean).join(' ')
}

function generateResearcherNarrative(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  migrationEffort: MigrationEffortItem[] | undefined,
  categoryScores: CategoryScores | undefined,
  hndl: HNDLRiskWindow | undefined,
  hnfl: HNFLRiskWindow | undefined,
  pqcFrameworkCount: number
): string {
  const parts: string[] = []
  parts.push(
    `Composite risk score: ${riskScore}/100 (${riskLevel}) across ${vulnerableCount} quantum-vulnerable algorithm${vulnerableCount !== 1 ? 's' : ''}.`
  )
  if (categoryScores) {
    const scoreBreakdown = Object.entries(categoryScores)
      .map(([k, v]) => {
        const labels: Record<string, string> = {
          quantumExposure: 'QE',
          migrationComplexity: 'MC',
          regulatoryPressure: 'RP',
          organizationalReadiness: 'OR',
        }
        // eslint-disable-next-line security/detect-object-injection
        return `${labels[k] ?? k}=${v}`
      })
      .join(', ')
    parts.push(`Category scores: ${scoreBreakdown}.`)
  }
  if (hndl?.isAtRisk) {
    const suffix = hndl.isEstimated ? ' (estimated)' : ''
    parts.push(
      `HNDL exposure window: ${hndl.riskWindowYears} years${suffix} — data sensitivity tiers: ${input.dataSensitivity.join(', ')}.`
    )
  }
  if (hnfl?.isAtRisk && hnfl.hasSigningAlgorithms) {
    parts.push(
      `HNFL exposure: ${hnfl.riskWindowYears} year${hnfl.riskWindowYears !== 1 ? 's' : ''} of signing key exposure, ${hnfl.hnflRelevantUseCases.length} affected use case${hnfl.hnflRelevantUseCases.length !== 1 ? 's' : ''} (${hnfl.hnflRelevantUseCases.slice(0, 3).join(', ')}${hnfl.hnflRelevantUseCases.length > 3 ? '...' : ''}).`
    )
  }
  if (pqcFrameworkCount > 0) {
    parts.push(
      `${pqcFrameworkCount} compliance framework${pqcFrameworkCount > 1 ? 's' : ''} mandate${pqcFrameworkCount === 1 ? 's' : ''} PQC adoption for the ${input.industry}/${input.country ?? 'Global'} jurisdiction.`
    )
  }
  if (migrationEffort && migrationEffort.length > 0) {
    const byScope = migrationEffort.reduce(
      (acc, m) => {
        acc[m.estimatedScope] = (acc[m.estimatedScope] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    const scopeSummary = Object.entries(byScope)
      .map(([s, n]) => `${n} ${s}`)
      .join(', ')
    parts.push(`Migration effort breakdown: ${scopeSummary}.`)
  }
  return parts.filter(Boolean).join(' ')
}

function generateOpsNarrative(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number
): string {
  const parts: string[] = []
  parts.push(
    `Your operational infrastructure has a ${riskLevel} quantum vulnerability score (${riskScore}/100) — ${vulnerableCount > 0 ? `${vulnerableCount} deployed algorithm${vulnerableCount > 1 ? 's' : ''} require${vulnerableCount === 1 ? 's' : ''} mitigation.` : 'your infrastructure relies on PQC-compatible primitives.'}`
  )
  if (input.infrastructure?.some((i) => i.includes('HSM'))) {
    parts.push(
      'Hardware Security Modules represent long-lead migration dependencies. Prioritize firmware updates to enable hybrid certificate deployments.'
    )
  }
  const statusMsg: Record<string, string> = {
    started:
      'Infrastructure migration is actively rolling out — continue to monitor TLS handshake performance and backward compatibility.',
    planning:
      'Rollout planning is in progress — validate network configuration scripts and HSM capabilities before large-scale deployment.',
    'not-started':
      'No infrastructure migration started — initiate a network scan to map active TLS configurations and certificate lifecycles.',
    unknown:
      'Deployment status is unclear — conduct an infrastructure discovery sweep to catalog cryptographic service endpoints.',
  }
  parts.push(statusMsg[input.migrationStatus] ?? '')
  return parts.filter(Boolean).join(' ')
}

function generateCuriousNarrative(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  hndl: HNDLRiskWindow | undefined
): string {
  const parts: string[] = []
  if (riskScore > 55) {
    parts.push(
      `Your organization has a ${riskLevel.toLowerCase()} level of exposure to quantum computing threats (${riskScore} out of 100). This means action is needed soon to keep your data safe.`
    )
  } else {
    parts.push(
      `Your organization has a ${riskLevel.toLowerCase()} level of exposure to quantum computing threats (${riskScore} out of 100). You have some time, but it's smart to start preparing.`
    )
  }
  if (hndl?.isAtRisk) {
    parts.push(
      'One important risk: adversaries could be capturing your encrypted data right now and storing it until quantum computers can break it — this is called "harvest now, decrypt later." The sooner you upgrade, the less data is at risk.'
    )
  }
  parts.push(
    input.migrationStatus === 'started'
      ? 'Good news: your organization has already started preparing. Keep the momentum going!'
      : input.migrationStatus === 'planning'
        ? 'Your organization is planning to prepare — the next step is to start making changes.'
        : "Most organizations haven't started preparing yet. The three most important steps are: learn about the threat, find out what encryption you use, and make a plan to upgrade."
  )
  return parts.join(' ')
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
    case 'ops':
      return generateOpsNarrative(input, riskScore, riskLevel, vulnerableCount)
    case 'curious':
      return generateCuriousNarrative(input, riskScore, riskLevel, hndl)
    default:
      return undefined
  }
}
