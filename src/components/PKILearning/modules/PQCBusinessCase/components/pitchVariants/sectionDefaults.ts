// SPDX-License-Identifier: GPL-3.0-only
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { PersonaId } from '@/data/learningPersonas'
import { reframeActionsForPersona } from '@/hooks/assessment/personas'

type Data = ExecutiveModuleData

/** Human-readable persona label for copy. */
export function personaLabel(persona: PersonaId | null): string {
  switch (persona) {
    case 'executive':
      return 'Executive / Board'
    case 'developer':
      return 'Developer'
    case 'architect':
      return 'Architect'
    case 'ops':
      return 'Operations'
    case 'researcher':
      return 'Researcher'
    case 'curious':
      return 'Curious Explorer'
    default:
      return 'Executive'
  }
}

export function buildRiskOverviewDefault(data: Data): string {
  const parts: string[] = []
  if (data.riskScore !== null) {
    parts.push(
      `Composite quantum risk score: ${data.riskScore}/100 (${data.assessmentResult?.riskLevel ?? 'n/a'}).`
    )
    if (data.preBoostScore !== null && data.preBoostScore !== data.riskScore) {
      const delta = data.riskScore - data.preBoostScore
      parts.push(
        `Base-weighted score was ${data.preBoostScore}/100; situational boosts added ${delta > 0 ? '+' : ''}${delta} points.`
      )
    }
  }
  if (data.boosts.length > 0) {
    const boostSummary = data.boosts
      .map((b) => `${b.label} (+${Math.round(b.delta * 100)}%)`)
      .join(', ')
    parts.push(`Active situational factors: ${boostSummary}.`)
  }
  parts.push(
    `${data.criticalThreatCount} critical or high-severity quantum threats identified in the industry threat landscape.`
  )
  parts.push(
    `${data.totalProducts} products in the infrastructure require PQC evaluation (${data.pqcReadyCount} have a PQC-ready roadmap, ${data.fipsValidatedCount} FIPS-validated).`
  )
  if (data.frameworksByIndustry.length > 0) {
    parts.push(
      `${data.frameworksByIndustry.length} compliance frameworks apply to ${data.industry || 'our sector'}; several carry emerging PQC mandates.`
    )
  }
  if (parts.length === 0) {
    return 'Complete the assessment to see a quantified risk overview.'
  }
  return parts.join('\n')
}

export function buildQuantumUrgencyDefault(data: Data): string {
  const parts: string[] = []
  const hndl = data.hndlRiskWindow
  const hnfl = data.hnflRiskWindow

  if (hndl) {
    const est = hndl.isEstimated ? ' (estimated — retention unknown)' : ''
    if (hndl.isAtRisk) {
      parts.push(
        `HNDL (harvest-now-decrypt-later): data with a ${hndl.dataRetentionYears}-year retention is being captured today for future decryption. Exposure window = ${hndl.riskWindowYears} years beyond the estimated quantum threat year (${hndl.estimatedQuantumThreatYear})${est}.`
      )
    } else {
      parts.push(
        `HNDL risk: retention (${hndl.dataRetentionYears}y) currently sits inside the pre-quantum window — monitor annually${est}.`
      )
    }
  }
  if (hnfl) {
    const est = hnfl.isEstimated ? ' (estimated — credential lifetime unknown)' : ''
    if (hnfl.isAtRisk) {
      parts.push(
        `HNFL (harvest-now-forge-later): signing credentials remain trusted for ${hnfl.credentialLifetimeYears} years — ${hnfl.riskWindowYears} year${hnfl.riskWindowYears !== 1 ? 's' : ''} past the quantum threat line. Forgery liability grows with every unrotated certificate${est}.`
      )
      if (hnfl.hnflRelevantUseCases.length > 0) {
        parts.push(`High-relevance use cases: ${hnfl.hnflRelevantUseCases.join(', ')}.`)
      }
    } else if (hnfl.hasSigningAlgorithms) {
      parts.push(
        `HNFL: signing present but credential lifetimes do not extend past the quantum threat window — rotation cadence is adequate for now${est}.`
      )
    }
  }

  if (parts.length === 0) {
    return 'Harvest-now-decrypt-later (HNDL) and harvest-now-forge-later (HNFL) are the two time-bound quantum risks. HNDL targets long-retention encrypted data captured today. HNFL targets signing credentials whose trust extends past the quantum threat horizon. Complete the assessment to quantify your exposure window.'
  }
  return parts.join('\n\n')
}

export function buildCryptoInventoryDefault(data: Data, detail: 'summary' | 'detail'): string {
  const profile = data.assessmentProfile
  const lines: string[] = []

  if (profile?.algorithmsSelected?.length) {
    lines.push(`Classical algorithms in use: ${profile.algorithmsSelected.join(', ')}.`)
  } else if (profile?.algorithmCategories?.length) {
    lines.push(`Crypto families in use: ${profile.algorithmCategories.join(', ')}.`)
  }
  if (profile?.algorithmUnknown) {
    lines.push(
      'Algorithm inventory is incomplete — a CBOM (Cryptographic Bill of Materials) is a prerequisite for migration planning.'
    )
  }

  if (profile?.infrastructure?.length) {
    lines.push(`Infrastructure layers touched: ${profile.infrastructure.join(', ')}.`)
  }

  const subcats = profile?.infrastructureSubCategories
  if (subcats && Object.keys(subcats).length > 0 && detail === 'detail') {
    lines.push('Per-layer technology stack:')
    for (const [layer, values] of Object.entries(subcats)) {
      if (values.length > 0) {
        lines.push(`  • ${layer}: ${values.join(', ')}`)
      }
    }
  }

  if (profile?.useCases?.length) {
    lines.push(`Crypto use cases: ${profile.useCases.join(', ')}.`)
  }

  if (detail === 'detail' && data.algorithmMigrations.length > 0) {
    const quantumVuln = data.algorithmMigrations.filter((m) => m.quantumVulnerable)
    if (quantumVuln.length > 0) {
      lines.push(
        `\nQuantum-vulnerable algorithms (${quantumVuln.length}): ${quantumVuln.map((m) => `${m.classical} → ${m.replacement}`).join('; ')}.`
      )
    }
  }

  if (lines.length === 0) {
    return 'Complete the assessment wizard (Step 3: Current Crypto, Step 11: Infrastructure) to populate the crypto inventory automatically.'
  }
  return lines.join('\n')
}

export function buildCategoryDriversDefault(data: Data): string {
  const scores = data.categoryScores
  const drivers = data.categoryDrivers
  if (!scores || !drivers) {
    return 'Complete the assessment to see per-category score drivers (quantum exposure, migration complexity, regulatory pressure, organizational readiness).'
  }
  return [
    `Quantum Exposure — ${scores.quantumExposure}/100. ${drivers.quantumExposure}`,
    `Migration Complexity — ${scores.migrationComplexity}/100. ${drivers.migrationComplexity}`,
    `Regulatory Pressure — ${scores.regulatoryPressure}/100. ${drivers.regulatoryPressure}`,
    `Organizational Readiness — ${scores.organizationalReadiness}/100. ${drivers.organizationalReadiness}`,
  ].join('\n\n')
}

export function buildAlgorithmMigrationsDefault(data: Data): string {
  if (data.algorithmMigrations.length === 0) {
    return 'Complete the assessment (Step 3: Current Crypto) to generate the classical → PQC replacement map.'
  }
  const rows = data.algorithmMigrations.map((m) => {
    const flag = m.quantumVulnerable ? '⚠️ vulnerable' : 'safe'
    return `• ${m.classical} → ${m.replacement} [${m.urgency}, ${flag}] — ${m.notes}`
  })
  return rows.join('\n')
}

export function buildMigrationEffortDefault(data: Data): string {
  if (data.migrationEffort.length === 0) {
    return 'Complete the assessment to generate an effort breakdown per algorithm (complexity + scope).'
  }
  const counts = {
    'quick-win': 0,
    moderate: 0,
    'major-project': 0,
    'multi-year': 0,
  } as Record<string, number>
  for (const m of data.migrationEffort) {
    counts[m.estimatedScope] = (counts[m.estimatedScope] ?? 0) + 1
  }
  const summary = `Effort rollup: ${counts['quick-win']} quick-wins · ${counts.moderate} moderate · ${counts['major-project']} major projects · ${counts['multi-year']} multi-year initiatives.`
  const rows = data.migrationEffort.map(
    (m) => `• ${m.algorithm} — ${m.complexity} complexity, ${m.estimatedScope}. ${m.rationale}`
  )
  return `${summary}\n\n${rows.join('\n')}`
}

export function buildTimelineDefault(data: Data, persona: PersonaId): string {
  const year = data.migrationDeadlineYear
  const country = data.country || 'your country'
  if (!year) {
    // Persona-specific fallback
    switch (persona) {
      case 'developer':
        return 'Sprint cadence recommendation:\n• Sprints 1–4: CBOM discovery + hybrid TLS PoC.\n• Sprints 5–12: Library upgrades (OpenSSL/BoringSSL ≥ PQC-enabled versions), API surface review, test vectors.\n• Sprints 13–24: Rollout behind feature flags + gradual cutover.'
      case 'architect':
        return 'Migration roadmap (architecture phases):\n• Phase 1 (Q1–Q2): Crypto-agility review, HSM/KMS inventory, interop matrix.\n• Phase 2 (Q3–Q4): Hybrid PQC/classical at perimeter (TLS, VPN, IKE). Root-of-trust hierarchy design.\n• Phase 3 (Y2): PKI re-issuance + PQC signing at CA. Code-signing migration.\n• Phase 4 (Y2+): Full PQC-only with classical fallback retired.'
      case 'ops':
        return 'Operational rollout (phased by risk tier):\n• T-0: Inventory + telemetry baseline. Canary services identified.\n• T+4w: Hybrid PQC deployed to canary (5% traffic). Latency SLOs tracked.\n• T+12w: Progressive rollout 25% → 50% → 100% with rollback runbooks at each gate.\n• T+24w: Credential rotation + cert re-issue cycle complete.'
      default:
        return 'Phased migration:\n• Phase 1 (3–6 months): Assessment + CBOM.\n• Phase 2 (6–12 months): Hybrid PQC deployment for highest-HNDL systems.\n• Phase 3 (12–24 months): Full NIST-standardized PQC across production.\nEarlier adoption reduces HNDL liability and positions ahead of regulatory deadlines.'
    }
  }
  const yearsRemaining = year - new Date().getFullYear()
  const base = `${country} has a binding PQC deadline targeting ${year} (${yearsRemaining} years out).`
  switch (persona) {
    case 'developer':
      return `${base} Recommended cadence: complete library upgrades + hybrid PoC in Year 1; progressive rollout + CBOM automation in Year 2; leave ≥12 months for regression and interop testing before the deadline.`
    case 'architect':
      return `${base} Architecture phases: hybrid perimeter (Y1) → PKI + signing migration (Y2) → full PQC with classical retired (pre-deadline). Reserve the final 12 months for interop validation with downstream partners and vendors.`
    case 'ops':
      return `${base} Operational plan: canary + progressive rollout (Y1), credential rotation + cert re-issue cycle (Y2), full cutover with documented rollback gates no later than 12 months before the deadline.`
    default:
      return `${base} Recommended plan: start immediately with assessment + hybrid PoCs, target full PQC deployment ≥12 months before the deadline, and use the first year to shake out interop issues with downstream partners.`
  }
}

export function buildCostBenefitDefault(data: Data): string {
  const level = data.assessmentResult?.riskLevel
  const tier = level === 'critical' || level === 'high' ? 'major' : 'moderate'
  const multiplier = tier === 'major' ? '3–5×' : '2–3×'
  const parts: string[] = []
  parts.push(
    `Cost of inaction (${tier}): regulatory penalties, breach response, contract loss, and reputational damage typically total ${multiplier} the migration investment. The ROI Calculator (Step 1 of this workshop) provides organization-specific figures.`
  )
  if (data.migrationDeadlineYear) {
    parts.push(
      `Deadline-driven urgency: ${data.migrationDeadlineYear} compliance window compresses procurement and training lead times — late-start projects consistently overrun by 40–60%.`
    )
  }
  if (data.hndlRiskWindow?.isAtRisk) {
    parts.push(
      `HNDL-specific cost: every year of delay adds ~${data.hndlRiskWindow.riskWindowYears} years of retroactive breach liability on data already captured.`
    )
  }
  parts.push(
    `Benefit categories: (1) breach avoidance, (2) compliance penalty avoidance, (3) contract eligibility (CNSA 2.0, NIS2, PCI-DSS 4.x), (4) early-mover competitive positioning.`
  )
  return parts.join('\n\n')
}

export function buildBudgetDefault(data: Data): { amount: string; breakdown: string } {
  const level = data.assessmentResult?.riskLevel
  // Ranges are illustrative — the ROI Calculator refines them per org.
  let amount = '$500K – $1.5M over 18–24 months'
  if (level === 'high') amount = '$1M – $3M over 24 months'
  if (level === 'critical') amount = '$2M – $6M over 24–36 months'

  const breakdown =
    '• Software (PQC-enabled libraries, HSM/KMS upgrades): 30%\n' +
    '• Hardware (FIPS-140-3 modules, TPM refreshes): 15%\n' +
    '• Consulting / SI partner (CBOM + migration): 25%\n' +
    '• Training & certification: 10%\n' +
    '• Testing, interop, and regression: 15%\n' +
    '• Contingency / multi-year support: 5%'

  return { amount, breakdown }
}

export function buildGovernanceDefault(data: Data, persona: PersonaId): string {
  const scale = data.assessmentProfile?.systemScale
  const team = data.assessmentProfile?.teamSize
  const scaleNote = scale ? `System scale: ${scale}.` : ''
  const teamNote = team ? `Team size: ${team}.` : ''
  const context = [scaleNote, teamNote].filter(Boolean).join(' ')

  switch (persona) {
    case 'executive':
      return [
        context,
        'Recommended RACI:',
        '• Accountable: CISO (budget + audit sign-off).',
        '• Responsible: Crypto lead / PKI owner.',
        '• Consulted: Legal (compliance), Architecture, Procurement.',
        '• Informed: Board (quarterly), Audit Committee (milestones).',
        'Recommended executive sponsor: CISO or CTO. Progress reported quarterly against a named PQC migration charter.',
      ]
        .filter(Boolean)
        .join('\n')
    case 'architect':
      return [
        context,
        'Governance structure:',
        '• Crypto Review Board (CRB) — approves algorithm selections + crypto-agility exceptions.',
        '• Architecture runway — PQC hybrid deployment patterns published as reference architectures.',
        '• Exception process — any non-PQC-ready component requires CRB sign-off with a remediation deadline.',
      ]
        .filter(Boolean)
        .join('\n')
    case 'ops':
      return [
        context,
        'Operational ownership:',
        '• On-call rotation: PKI + crypto infra added to existing platform on-call.',
        '• Runbook: credential rotation, cert re-issue, hybrid rollback procedures.',
        '• Monitoring: TLS handshake success rates, PQC algorithm usage, cert expiry dashboards.',
        '• Escalation path: Platform SRE → Crypto lead → CISO.',
      ]
        .filter(Boolean)
        .join('\n')
    default:
      return context || 'Assign a named crypto owner and sponsor before kickoff.'
  }
}

export function buildPeerBenchmarkDefault(data: Data): string {
  const ind = data.industry || 'your industry'
  const country = data.country || 'your country'
  const fw = data.frameworksByIndustry.slice(0, 4).map((f) => f.label)
  const parts: string[] = []
  parts.push(
    `${ind} peers in ${country} are navigating the same PQC transition under overlapping frameworks${fw.length ? `: ${fw.join(', ')}` : ''}.`
  )
  if (data.migrationDeadlineYear) {
    parts.push(
      `The ${data.migrationDeadlineYear} deadline is the anchor — peers that started in year T-4 or earlier are on track; later starters are showing schedule slippage.`
    )
  }
  parts.push(
    `Early-mover advantage: PQC-ready vendor status is increasingly a procurement filter for defense, finance, and regulated healthcare contracts.`
  )
  return parts.join('\n\n')
}

export function buildRecommendedActionsDefault(data: Data, persona: PersonaId): string {
  const raw = data.assessmentResult?.recommendedActions ?? []
  if (raw.length === 0) {
    return '1. [IMMEDIATE] Complete a cryptographic inventory (CBOM) across all systems.\n2. [IMMEDIATE] Identify and prioritize HNDL-vulnerable data stores.\n3. [SHORT-TERM] Deploy hybrid PQC/classical TLS for external-facing services.\n4. [SHORT-TERM] Evaluate PQC-ready vendors for critical infrastructure.\n5. [LONG-TERM] Full migration to NIST-standardized PQC algorithms.'
  }
  const reframed = reframeActionsForPersona(raw, persona)
  return reframed
    .slice(0, 6)
    .map((a) => `${a.priority}. [${a.category.toUpperCase()}] ${a.action}`)
    .join('\n')
}

export function buildExecutiveSummaryDefault(data: Data, persona: PersonaId): string {
  const result = data.assessmentResult
  if (result?.personaNarrative) return result.personaNarrative
  if (result?.executiveSummary) return result.executiveSummary

  if (data.isAssessmentComplete && data.riskScore !== null) {
    const level = result?.riskLevel ?? 'significant'
    const industry = data.industry || 'our'
    switch (persona) {
      case 'developer':
        return `Our ${industry} systems carry ${level} quantum-risk exposure (${data.riskScore}/100). This proposal lays out the engineering work required — library upgrades, API migration, test vector coverage, and hybrid deployment — to reach PQC-ready status without breaking existing integrations.`
      case 'architect':
        return `Our ${industry} crypto architecture shows ${level} quantum-risk exposure (${data.riskScore}/100). This review covers the algorithmic substitutions, hybrid deployment patterns, PKI re-issuance, and crypto-agility gaps that must be closed to hit the migration deadline.`
      case 'ops':
        return `Production systems in our ${industry} environment carry ${level} quantum-risk exposure (${data.riskScore}/100). This plan defines the operational rollout — phases, gates, rollback procedures, credential rotation, and monitoring — required to migrate without service disruption.`
      default:
        return `Our ${industry} organization faces ${level}-level quantum risk (${data.riskScore}/100). Post-quantum cryptography migration is required to protect long-retention data, maintain regulatory compliance, and ensure long-term business resilience. This proposal outlines the investment, timeline, and governance.`
    }
  }

  switch (persona) {
    case 'developer':
      return 'Post-quantum cryptography migration is an engineering initiative requiring library upgrades (OpenSSL, BoringSSL, WolfSSL), API surface review, and hybrid PQC/classical deployment. This proposal defines the scope, dependencies, and rollout plan.'
    case 'architect':
      return 'Post-quantum cryptography changes core assumptions in our trust architecture: algorithm substitutions, hybrid key-exchange, PKI re-issuance, and crypto-agility enforcement. This proposal frames the architectural decisions that must be made.'
    case 'ops':
      return 'Post-quantum cryptography migration touches every TLS endpoint, every signing credential, and every HSM-backed key in production. This runbook defines how we roll out safely without service disruption.'
    default:
      return 'Post-quantum cryptography (PQC) migration is a critical infrastructure investment. Current encryption (RSA, ECDSA, ECDH) will be broken by quantum computers. This proposal outlines the business case, cost-benefit, and recommended timeline.'
  }
}

export function buildPitchObjective(persona: PersonaId): string {
  switch (persona) {
    case 'executive':
      return 'Secure budget approval, executive sponsorship, and a named governance charter.'
    case 'developer':
      return 'Align engineering on scope, dependencies, and a sprint plan for PQC migration.'
    case 'architect':
      return 'Agree on algorithm substitutions, hybrid deployment patterns, and PKI migration.'
    case 'ops':
      return 'Agree on rollout phases, runbooks, rollback gates, and on-call ownership.'
    default:
      return 'Drive shared understanding of the PQC migration need and next steps.'
  }
}
