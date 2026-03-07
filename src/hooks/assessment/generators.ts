import { ALGORITHM_DB, ESTIMATED_QUANTUM_THREAT_YEAR, SIGNING_ALGORITHMS } from '../assessmentData'

import type {
  AssessmentInput,
  ComplianceImpact,
  CategoryDrivers,
  HNDLRiskWindow,
  HNFLRiskWindow,
  MigrationEffortItem,
  RecommendedAction,
  AlgorithmMigration,
} from '../assessmentTypes'

import { getMaxSensitivity, getMaxRetentionYears, getIndustryRetentionDefault } from './scoring'

import { computeHNFLRiskWindow, getEffectiveThreatYear } from './riskWindows'

export function buildAlgorithmHighlightUrl(algorithms: string[]): string {
  if (algorithms.length === 0) return '/algorithms'
  return `/algorithms?highlight=${encodeURIComponent(algorithms.join(','))}`
}

export function buildThreatsUrl(industry?: string): string {
  if (!industry) return '/threats'
  return `/threats?industry=${encodeURIComponent(industry)}`
}

export function generateCategoryDrivers(
  input: AssessmentInput,
  vulnerableCount: number,
  pqcCount: number
): CategoryDrivers {
  // Quantum Exposure drivers
  const qeParts: string[] = []
  if (input.currentCryptoUnknown) {
    qeParts.push('algorithms unknown (conservative)')
  } else if (vulnerableCount > 0) {
    qeParts.push(`${vulnerableCount} vulnerable algorithm${vulnerableCount !== 1 ? 's' : ''}`)
  } else {
    qeParts.push('no vulnerable algorithms')
  }
  const maxSens = input.sensitivityUnknown
    ? 'high (assumed)'
    : getMaxSensitivity(input.dataSensitivity)
  qeParts.push(`${maxSens} sensitivity`)
  if (input.retentionUnknown) {
    qeParts.push(`${getIndustryRetentionDefault(input.industry)}y retention (assumed)`)
  } else if (input.dataRetention?.length) {
    qeParts.push(`${getMaxRetentionYears(input.dataRetention)}y retention`)
  }

  // Migration Complexity drivers
  const mcParts: string[] = []
  const agilityLabels: Record<string, string> = {
    'fully-abstracted': 'abstracted',
    'partially-abstracted': 'partial',
    hardcoded: 'hardcoded',
    unknown: 'unknown',
  }
  mcParts.push(`${agilityLabels[input.cryptoAgility ?? 'unknown'] ?? 'unknown'} crypto agility`)
  if (input.infrastructureUnknown) {
    mcParts.push('infrastructure unknown')
  } else if (input.infrastructure?.length) {
    mcParts.push(
      `${input.infrastructure.length} infra type${input.infrastructure.length !== 1 ? 's' : ''}`
    )
  }
  if (input.systemCount) mcParts.push(`${input.systemCount} systems`)

  // Regulatory Pressure drivers
  const rpParts: string[] = []
  if (pqcCount > 0) {
    rpParts.push(`${pqcCount} PQC mandate${pqcCount !== 1 ? 's' : ''}`)
  } else {
    rpParts.push('no PQC mandates')
  }
  rpParts.push(input.industry)
  if (input.country) rpParts.push(input.country)

  // Organizational Readiness drivers
  const orParts: string[] = []
  const statusLabels: Record<string, string> = {
    started: 'migration started',
    planning: 'planning phase',
    'not-started': 'not started',
    unknown: 'status unknown',
  }
  orParts.push(statusLabels[input.migrationStatus] ?? input.migrationStatus)
  if (input.systemCount && input.teamSize) {
    orParts.push(`${input.systemCount} systems / ${input.teamSize} team`)
  }
  const vendorLabel = input.vendorUnknown
    ? 'vendor unknown'
    : input.vendorDependency === 'heavy-vendor'
      ? 'heavy vendor dependency'
      : input.vendorDependency === 'in-house'
        ? 'in-house crypto'
        : (input.vendorDependency ?? '')
  if (vendorLabel) orParts.push(vendorLabel)

  return {
    quantumExposure: qeParts.join(', '),
    migrationComplexity: mcParts.join(', '),
    regulatoryPressure: rpParts.join(', '),
    organizationalReadiness: orParts.join(', '),
  }
}

export function generateExtendedActions(
  input: AssessmentInput,
  vulnerableCount: number,
  pqcCompliance: ComplianceImpact[],
  migrationEffort: MigrationEffortItem[]
): RecommendedAction[] {
  const actions: RecommendedAction[] = []
  let priority = 1
  if (input.currentCryptoUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Conduct a cryptographic asset inventory to identify all algorithms in use across systems, services, and dependencies.',
      category: 'immediate',
      relatedModule: '/migrate',
      effort: 'high',
    })
  }

  if (input.sensitivityUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Conduct a data classification exercise to identify the sensitivity levels of data protected by cryptography — this determines Harvest-Now-Decrypt-Later exposure and appropriate encryption requirements.',
      category: 'immediate',
      relatedModule: '/threats',
      effort: 'medium',
    })
  }

  if (input.retentionUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Establish a data classification and retention policy to quantify HNDL exposure for long-lived sensitive data.',
      category: 'immediate',
      relatedModule: '/threats',
      effort: 'medium',
    })
  }

  if (input.vendorUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Engage technology vendors and suppliers to document their cryptographic implementations and PQC migration roadmaps.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'medium',
    })
  }

  if (input.credentialLifetimeUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Audit the validity periods of all certificates, signed firmware, and digital credentials to quantify Harvest-Now-Forge-Later exposure.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'medium',
    })
  }

  if (input.complianceUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Identify applicable regulatory and compliance frameworks for your industry and region to understand PQC obligations.',
      category: 'short-term',
      relatedModule: '/compliance',
      effort: 'low',
    })
  }

  if (input.useCasesUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Map all business processes and applications that rely on cryptography to prioritize migration efforts.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'medium',
    })
  }

  if (input.infrastructureUnknown) {
    actions.push({
      priority: priority++,
      action:
        'Audit infrastructure for cryptographic dependencies — HSMs, legacy systems, cloud KMS, and embedded devices affect migration complexity.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'medium',
    })
  }

  // eslint-disable-next-line security/detect-object-injection
  const vulnerableAlgoNames = input.currentCrypto.filter((a) => ALGORITHM_DB[a]?.quantumVulnerable)
  const quickWins = migrationEffort.filter((m) => m.estimatedScope === 'quick-win')
  if (quickWins.length > 0) {
    actions.push({
      priority: priority++,
      action: `Migrate ${quickWins.length} quick-win algorithm${quickWins.length > 1 ? 's' : ''} (${quickWins.map((q) => q.algorithm).join(', ')}) to PQC equivalents.`,
      category: 'immediate',
      relatedModule: buildAlgorithmHighlightUrl(quickWins.map((q) => q.algorithm)),
      effort: 'low',
    })
  }

  const majorMigrations = migrationEffort.filter(
    (m) => m.estimatedScope === 'major-project' || m.estimatedScope === 'multi-year'
  )
  if (majorMigrations.length > 0) {
    actions.push({
      priority: priority++,
      action: `Plan migration for ${majorMigrations.length} high-complexity algorithm${majorMigrations.length > 1 ? 's' : ''} (${majorMigrations.map((m) => m.algorithm).join(', ')}).`,
      category: 'immediate',
      relatedModule: buildAlgorithmHighlightUrl(majorMigrations.map((m) => m.algorithm)),
      effort: 'high',
    })
  }

  const moderateMigrations = migrationEffort.filter((m) => m.estimatedScope === 'moderate')
  if (moderateMigrations.length > 0 && quickWins.length === 0 && majorMigrations.length === 0) {
    actions.push({
      priority: priority++,
      action: `Migrate ${vulnerableCount} quantum-vulnerable algorithm${vulnerableCount > 1 ? 's' : ''} to PQC equivalents.`,
      category: 'immediate',
      relatedModule: buildAlgorithmHighlightUrl(vulnerableAlgoNames),
      effort: 'medium',
    })
  }

  if (input.cryptoUseCases?.includes('TLS/HTTPS') && vulnerableCount > 0) {
    const tlsAlgos = vulnerableAlgoNames.filter((a) =>
      [
        'ECDH P-256',
        'ECDH P-384',
        'ECDH P-521',
        'X25519',
        'DH (Diffie-Hellman)',
        'RSA-2048',
        'RSA-4096',
      ].includes(a)
    )
    actions.push({
      priority: priority++,
      action: 'Migrate TLS endpoints to hybrid PQC key exchange (ML-KEM + X25519).',
      category: 'immediate',
      relatedModule: buildAlgorithmHighlightUrl(
        tlsAlgos.length > 0 ? tlsAlgos : vulnerableAlgoNames
      ),
      effort: 'medium',
    })
  }

  const hasHighSensitivity =
    input.dataSensitivity.includes('critical') || input.dataSensitivity.includes('high')
  if (
    hasHighSensitivity &&
    input.dataRetention?.length &&
    getMaxRetentionYears(input.dataRetention) > 5
  ) {
    actions.push({
      priority: priority++,
      action: 'Implement hybrid PQC encryption for data-at-rest to guard against HNDL attacks.',
      category: 'immediate',
      relatedModule: buildThreatsUrl(input.industry),
      effort: 'high',
    })
  } else if (hasHighSensitivity) {
    actions.push({
      priority: priority++,
      action: 'Implement hybrid PQC encryption for data-at-rest to guard against HNDL attacks.',
      category: 'immediate',
      relatedModule: buildThreatsUrl(input.industry),
      effort: 'medium',
    })
  }

  const hnfl = computeHNFLRiskWindow(input)
  if ((input.currentCrypto ?? []).some((a) => SIGNING_ALGORITHMS.has(a)) && hnfl?.isAtRisk) {
    if (hnfl.hnflRelevantUseCases.some((uc) => uc.includes('PKI') || uc.includes('code signing'))) {
      actions.push({
        priority: priority++,
        action:
          'Audit Root CA and sub-CA certificate lifetimes — certificates issued today may be cryptographically broken before they expire. Plan CA key ceremonies using ML-DSA or SLH-DSA.',
        category: 'immediate',
        relatedModule: '/migrate',
        effort: 'high',
      })
    }
    actions.push({
      priority: priority++,
      action:
        'Migrate signature algorithms (RSA, ECDSA, Ed25519) to ML-DSA or SLH-DSA. Long-lived signed artifacts and credentials are vulnerable to Harvest-Now-Forge-Later attacks.',
      category: 'immediate',
      relatedModule: '/migrate',
      effort: 'high',
    })
  }

  if (input.infrastructure?.some((i) => i.includes('HSM'))) {
    actions.push({
      priority: priority++,
      action: 'Evaluate HSM vendor PQC firmware roadmap and plan hardware upgrades.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'high',
    })
  }

  if (input.vendorDependency === 'heavy-vendor') {
    actions.push({
      priority: priority++,
      action: 'Engage SaaS and SDK vendors for PQC migration timelines and compatibility.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'medium',
    })
  }

  if (pqcCompliance.length > 0) {
    actions.push({
      priority: priority++,
      action: `Review PQC requirements for ${pqcCompliance.map((c) => c.framework).join(', ')}.`,
      category: 'short-term',
      relatedModule: '/compliance',
      effort: 'low',
    })
  }

  // Industry-specific actions
  const INDUSTRY_ACTIONS: Record<
    string,
    {
      action: string
      category: RecommendedAction['category']
      effort: RecommendedAction['effort']
      relatedModule: string
    }[]
  > = {
    'Government & Defense': [
      {
        action:
          'Align all national security systems with CNSA 2.0 requirements and begin FIPS 203/204/205 module validation.',
        category: 'immediate',
        effort: 'high',
        relatedModule: '/compliance',
      },
    ],
    'Finance & Banking': [
      {
        action:
          'Coordinate with SWIFT, payment processors, and banking partners on PQC migration timelines for transaction integrity.',
        category: 'short-term',
        effort: 'medium',
        relatedModule: '/compliance',
      },
    ],
    Healthcare: [
      {
        action:
          'Assess HIPAA-covered systems and EHR/FHIR data exchange channels for PQC readiness — patient data has long retention and high HNDL exposure.',
        category: 'immediate',
        effort: 'medium',
        relatedModule: buildThreatsUrl('Healthcare'),
      },
    ],
    Telecommunications: [
      {
        action:
          'Plan PQC migration for SIM/eSIM provisioning and 5G network slicing security — these are high-value targets with complex upgrade paths.',
        category: 'short-term',
        effort: 'high',
        relatedModule: '/migrate',
      },
    ],
    'Energy & Utilities': [
      {
        action:
          'Assess SCADA/OT systems for PQC readiness — embedded controllers and legacy protocols require extended migration timelines.',
        category: 'immediate',
        effort: 'high',
        relatedModule: buildThreatsUrl('Energy & Utilities'),
      },
    ],
    Automotive: [
      {
        action:
          'Plan PQC migration for V2X communication and ECU secure boot — vehicle lifetime (15+ years) creates long HNFL exposure.',
        category: 'short-term',
        effort: 'high',
        relatedModule: '/migrate',
      },
    ],
    Aerospace: [
      {
        action:
          'Assess avionics communication and satellite link encryption for PQC readiness — aircraft lifetime (40+ years) creates extreme HNDL/HNFL exposure.',
        category: 'immediate',
        effort: 'high',
        relatedModule: buildThreatsUrl('Aerospace'),
      },
    ],
    Technology: [
      {
        action:
          'Evaluate PQC support in cloud KMS providers (AWS, Azure, GCP) and plan API gateway migration to hybrid key exchange.',
        category: 'short-term',
        effort: 'medium',
        relatedModule: '/migrate',
      },
    ],
    'Retail & E-Commerce': [
      {
        action:
          'Coordinate with payment gateway providers on PQC timeline for card transaction encryption and PCI DSS alignment.',
        category: 'short-term',
        effort: 'medium',
        relatedModule: '/compliance',
      },
    ],
  }
  const industryActions = INDUSTRY_ACTIONS[input.industry]
  if (industryActions) {
    for (const ia of industryActions) {
      actions.push({ priority: priority++, ...ia })
    }
  }

  if (input.migrationStatus === 'not-started' || input.migrationStatus === 'unknown') {
    actions.push({
      priority: priority++,
      action:
        'Conduct cryptographic asset inventory to identify all systems using vulnerable algorithms.',
      category: 'immediate',
      relatedModule: '/migrate',
      effort: 'medium',
    })
  }

  if (input.cryptoAgility === 'hardcoded') {
    actions.push({
      priority: priority++,
      action:
        'Refactor cryptographic implementations to use abstraction layers for algorithm agility.',
      category: 'short-term',
      relatedModule: '/migrate',
      effort: 'high',
    })
  }

  actions.push({
    priority: priority++,
    action: 'Evaluate PQC-ready libraries and tools for your technology stack.',
    category: 'short-term',
    relatedModule: '/migrate',
    effort: 'low',
  })
  actions.push({
    priority: priority++,
    action: 'Build PQC awareness across engineering and leadership teams.',
    category: 'long-term',
    relatedModule: '/learn',
    effort: 'low',
  })
  return actions
}

export function generateExecutiveSummary(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  migrationEffort: MigrationEffortItem[],
  hndl: HNDLRiskWindow | undefined,
  hnfl: HNFLRiskWindow | undefined,
  pqcFrameworkCount: number
): string {
  const parts: string[] = []
  parts.push(
    `Your ${input.industry} organization faces a ${riskLevel} quantum risk (${riskScore}/100).`
  )
  if (vulnerableCount > 0) {
    const quickWins = migrationEffort.filter((m) => m.estimatedScope === 'quick-win').length
    const majorProjects = migrationEffort.filter(
      (m) => m.estimatedScope === 'major-project' || m.estimatedScope === 'multi-year'
    ).length

    const scopeParts: string[] = []
    if (quickWins > 0) scopeParts.push(`${quickWins} quick win${quickWins > 1 ? 's' : ''}`)
    if (majorProjects > 0)
      scopeParts.push(`${majorProjects} major project${majorProjects > 1 ? 's' : ''}`)
    const moderate = vulnerableCount - quickWins - majorProjects
    if (moderate > 0) scopeParts.push(`${moderate} moderate migration${moderate > 1 ? 's' : ''}`)

    parts.push(
      `${vulnerableCount} algorithm${vulnerableCount > 1 ? 's' : ''} require${vulnerableCount === 1 ? 's' : ''} migration: ${scopeParts.join(', ')}.`
    )
  }

  if (hndl?.isAtRisk) {
    parts.push(
      `Data persists ${hndl.riskWindowYears} year${hndl.riskWindowYears !== 1 ? 's' : ''} beyond the estimated quantum threat horizon, making HNDL attacks an active concern.`
    )
  }

  if (hnfl?.isAtRisk) {
    parts.push(
      `Credential lifetimes extend ${hnfl.riskWindowYears} year${hnfl.riskWindowYears !== 1 ? 's' : ''} beyond the quantum threat horizon — Harvest-Now-Forge-Later attacks on signature keys are an active concern.`
    )
  }

  if (pqcFrameworkCount > 0) {
    parts.push(
      `${pqcFrameworkCount} compliance framework${pqcFrameworkCount > 1 ? 's' : ''} mandate${pqcFrameworkCount === 1 ? 's' : ''} PQC adoption.`
    )
  }

  // Country deadline context
  if (input.country) {
    const effectiveThreatYear = getEffectiveThreatYear(input.country)
    if (effectiveThreatYear < ESTIMATED_QUANTUM_THREAT_YEAR) {
      parts.push(
        `${input.country}'s regulatory framework targets PQC transition by ${effectiveThreatYear}, ahead of the global ${ESTIMATED_QUANTUM_THREAT_YEAR} planning horizon.`
      )
    }
  }

  const statusSummary: Record<string, string> = {
    started: 'Migration is underway, reducing overall risk.',
    planning: 'Migration planning is in progress — prioritize execution.',
    'not-started': 'Migration has not begun — immediate action is recommended.',
    unknown: 'Migration status is unclear — establishing a baseline is the first priority.',
  }
  parts.push(statusSummary[input.migrationStatus] ?? '')
  return parts.filter(Boolean).join(' ')
}

export function generateQuickSummary(
  input: AssessmentInput,
  riskScore: number,
  riskLevel: string,
  vulnerableCount: number,
  pqcFrameworkCount: number
): string {
  const parts: string[] = []
  parts.push(
    `Your ${input.industry} organization faces a ${riskLevel} quantum risk (${riskScore}/100) based on a quick assessment.`
  )
  if (input.currentCryptoUnknown) {
    parts.push(
      'Cryptographic algorithms were not specified — conservative defaults applied. Complete a cryptographic inventory for a precise assessment.'
    )
  } else if (vulnerableCount > 0) {
    parts.push(
      `${vulnerableCount} quantum-vulnerable algorithm${vulnerableCount > 1 ? 's' : ''} identified.`
    )
  }

  if (input.dataSensitivity.includes('critical') || input.dataSensitivity.includes('high')) {
    parts.push(
      'High data sensitivity means Harvest-Now-Decrypt-Later attacks are a concern. Run a comprehensive assessment to quantify retention risk.'
    )
  }

  if (pqcFrameworkCount > 0) {
    parts.push(
      `${pqcFrameworkCount} compliance framework${pqcFrameworkCount > 1 ? 's' : ''} mandate${pqcFrameworkCount === 1 ? 's' : ''} PQC adoption.`
    )
  }

  const statusMsg: Record<string, string> = {
    started: 'Migration is underway.',
    planning: 'Migration planning is in progress — prioritize execution.',
    'not-started': 'Migration has not begun — immediate action recommended.',
    unknown: 'Migration status is unclear — establish a baseline first.',
  }
  parts.push(statusMsg[input.migrationStatus] ?? '')
  return parts.filter(Boolean).join(' ')
}

export function generateNarrative(
  input: AssessmentInput,
  score: number,
  level: string,
  vulnerableAlgos: number,
  pqcFrameworks: number
): string {
  const parts: string[] = []
  parts.push(
    `Your organization in the ${input.industry} sector has a quantum risk score of ${score}/100 (${level}).`
  )
  if (vulnerableAlgos > 0) {
    parts.push(
      `You are currently using ${vulnerableAlgos} quantum-vulnerable cryptographic algorithm${vulnerableAlgos > 1 ? 's' : ''} that require migration to post-quantum alternatives.`
    )
  } else {
    parts.push(
      'Your current cryptographic algorithms do not include quantum-vulnerable public-key schemes.'
    )
  }

  if (input.dataSensitivity.includes('critical') || input.dataSensitivity.includes('high')) {
    parts.push(
      'Given your high data sensitivity, "Harvest Now, Decrypt Later" attacks represent an immediate threat to long-lived data.'
    )
  }

  if (pqcFrameworks > 0) {
    parts.push(
      `${pqcFrameworks} of your compliance framework${pqcFrameworks > 1 ? 's' : ''} already require${pqcFrameworks === 1 ? 's' : ''} or will soon require PQC adoption.`
    )
  }

  const statusMsg: Record<string, string> = {
    started: 'Your migration has already begun, which significantly reduces your risk.',
    planning: 'You are in the planning phase — prioritize converting plans to implementation.',
    'not-started':
      'Migration has not yet started. We recommend beginning with a cryptographic asset inventory.',
    unknown: 'Your migration status is unclear — this should be established as a first priority.',
  }
  parts.push(statusMsg[input.migrationStatus] || '')
  if (input.dataRetention?.length) {
    const years = getMaxRetentionYears(input.dataRetention)
    if (years > 10) {
      parts.push(
        `With a data retention period of ${years}+ years, your data may remain encrypted beyond the expected quantum computing timeline.`
      )
    }
  }

  if (input.cryptoAgility === 'hardcoded') {
    parts.push(
      'Your cryptographic implementations are hardcoded, which will significantly increase migration effort.'
    )
  }

  return parts.filter(Boolean).join(' ')
}

export function generateKeyFindings(
  input: AssessmentInput,
  algorithmMigrations: AlgorithmMigration[],
  complianceImpacts: ComplianceImpact[],
  hndlRiskWindow?: HNDLRiskWindow,
  hnflRiskWindow?: HNFLRiskWindow
): string[] {
  const findings: string[] = []
  const p = input.persona

  // 1. Overall risk posture
  const vulnCount = algorithmMigrations.filter((a) => a.quantumVulnerable).length
  if (vulnCount > 0) {
    if (p === 'executive') {
      findings.push(
        `Your organization relies on ${vulnCount} encryption method${vulnCount > 1 ? 's' : ''} that quantum computers will break — board-level migration planning should begin.`
      )
    } else if (p === 'developer') {
      findings.push(
        `${vulnCount} algorithm${vulnCount > 1 ? 's' : ''} in your dependency chain ${vulnCount > 1 ? 'are' : 'is'} quantum-vulnerable and need${vulnCount === 1 ? 's' : ''} replacement with NIST-standardized PQC alternatives.`
      )
    } else if (p === 'architect') {
      findings.push(
        `${vulnCount} quantum-vulnerable algorithm${vulnCount > 1 ? 's' : ''} span${vulnCount === 1 ? 's' : ''} your dependency graph — migration must be sequenced from trust roots (PKI/HSM) to leaf services.`
      )
    } else {
      findings.push(
        `Your organization uses ${vulnCount} quantum-vulnerable algorithm${vulnCount > 1 ? 's' : ''} that ${vulnCount > 1 ? 'require' : 'requires'} migration to post-quantum alternatives.`
      )
    }
  }

  // 2. HNDL risk
  if (hndlRiskWindow?.isAtRisk) {
    const suffix = hndlRiskWindow.isEstimated ? ' (conservative estimate)' : ''
    if (p === 'executive') {
      findings.push(
        `Sensitive data remains exposed for ${hndlRiskWindow.riskWindowYears} years beyond the quantum horizon — adversaries may already be harvesting encrypted data for future decryption${suffix}.`
      )
    } else if (p === 'developer') {
      findings.push(
        `Data-at-rest encryption uses quantum-vulnerable algorithms with ${hndlRiskWindow.riskWindowYears} years of exposure beyond estimated CRQC arrival${suffix}.`
      )
    } else {
      findings.push(
        `Harvest-Now-Decrypt-Later risk detected: your data retention period extends ${hndlRiskWindow.riskWindowYears} years beyond the estimated quantum threat horizon${suffix}.`
      )
    }
  }

  // 3. HNFL risk
  if (hnflRiskWindow?.isAtRisk && hnflRiskWindow.hasSigningAlgorithms) {
    findings.push(
      `Harvest-Now-Forge-Later risk: signing credentials may remain trusted past the quantum threat year, exposing ${hnflRiskWindow.hnflRelevantUseCases.length} use case${hnflRiskWindow.hnflRelevantUseCases.length !== 1 ? 's' : ''} to forgery attacks.`
    )
  }

  // 4. Compliance urgency
  const urgentCompliance = complianceImpacts.filter(
    (c) => c.requiresPQC && c.deadline.match(/202[5-9]|203[0-2]/)
  )
  if (urgentCompliance.length > 0) {
    const names = urgentCompliance.map((c) => c.framework).join(', ')
    if (p === 'executive') {
      findings.push(
        `${urgentCompliance.length} compliance deadline${urgentCompliance.length > 1 ? 's' : ''} (${names}) require${urgentCompliance.length === 1 ? 's' : ''} board attention — non-compliance risks regulatory penalties and audit findings.`
      )
    } else if (p === 'developer') {
      findings.push(
        `${urgentCompliance.length} compliance framework${urgentCompliance.length > 1 ? 's' : ''} (${names}) mandate${urgentCompliance.length === 1 ? 's' : ''} PQC adoption — check framework-specific algorithm requirements for your stack.`
      )
    } else {
      findings.push(
        `${urgentCompliance.length} compliance framework${urgentCompliance.length > 1 ? 's' : ''} (${names}) ${urgentCompliance.length > 1 ? 'have' : 'has'} near-term PQC migration deadlines.`
      )
    }
  }

  // 5. Migration status
  if (input.migrationStatus === 'not-started') {
    if (p === 'executive') {
      findings.push(
        `Migration not yet started — early movers gain compliance advantages and spread costs over more budget cycles.`
      )
    } else if (p === 'developer') {
      findings.push(
        `No PQC migration started — begin with quick-win algorithm swaps in non-critical services to build experience.`
      )
    } else {
      findings.push(
        `PQC migration has not yet started. Beginning with a cryptographic inventory and pilot project would significantly reduce your risk exposure.`
      )
    }
  } else if (input.migrationStatus === 'planning') {
    if (p === 'executive') {
      findings.push(
        `Migration planning is underway — ensure budget and staffing are allocated for the first phase of implementation.`
      )
    } else {
      findings.push(
        `Migration planning is underway. Prioritize quantum-vulnerable algorithms in your highest-sensitivity systems to maximize risk reduction.`
      )
    }
  }

  return findings.slice(0, 5)
}
