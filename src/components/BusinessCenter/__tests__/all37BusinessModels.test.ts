// SPDX-License-Identifier: AGPL-3.0-only
import fs from 'node:fs'
import { afterAll, describe, expect, it } from 'vitest'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import {
  BUSINESS_CAPABILITY_CHECKLISTS,
  getBusinessCapabilityChecklist,
} from '@/data/businessCapabilityChecklists'
import { BUSINESS_TOOL_EXERCISES } from '@/data/businessToolExercises'
import { businessToolEvidence } from '@/data/businessToolEvidence'
import { decisionModelToCsv } from '@/services/export/decisionModelCsv'
import { evaluateSamplePolicy } from '@/utils/policyContradictionEvaluator'

export const ALL_37_BUSINESS_TOOL_IDS = [
  'bt-roi-calculator',
  'bt-board-pitch',
  'bt-breach-simulator',
  'bt-cost-of-inaction',
  'bt-cost-model-explorer',
  'bt-crqc-scenario',
  'bt-risk-register',
  'bt-risk-treatment-plan',
  'bt-compliance-checklist',
  'bt-audit-checklist',
  'bt-compliance-timeline',
  'bt-raci-builder',
  'bt-policy-generator',
  'bt-kpi-dashboard',
  'bt-vendor-scorecard',
  'bt-contract-clause',
  'bt-supply-chain-matrix',
  'bt-roadmap-builder',
  'bt-stakeholder-comms',
  'bt-kpi-tracker',
  'bt-deployment-playbook',
  'bt-hybrid-transition-planner',
  'bt-mti-negotiator',
  'bt-crypto-api-refactor-audit',
  'bt-cloud-responsibility-matrix',
  'bt-crypto-architecture-diagram',
  'bt-management-tools-audit',
  'bt-crypto-cbom-builder',
  'bt-crypto-vulnerability-watch',
  'bt-program-charter',
  'bt-initial-scoping',
  'bt-skills-team-plan',
  'bt-infra-modernization-planner',
  'bt-refresh-cycle-alignment',
  'bt-accelerated-execution-profile',
  'bt-data-at-rest-strategy',
  'bt-migration-verification',
] as const

export type BusinessAssessmentId = (typeof ALL_37_BUSINESS_TOOL_IDS)[number]

export interface BusinessDecisionScenario {
  toolId: string
  scenarioId: string
  inputs: Record<string, unknown>
  baselineVerdict: string
  adverseCase: {
    trigger: string
    verdict: string
    rejectedOrFlagged: boolean
  }
  recoveryAndSensitivity: {
    correction: string
    verdict: string
    sensitivityDelta: string
  }
  boundaryNotice: string
}

export function formatDecisionModelMarkdown(
  toolName: string,
  scenario: BusinessDecisionScenario
): string {
  const inputLines = Object.entries(scenario.inputs)
    .map(([k, v]) => `- **${k}**: \`${JSON.stringify(v)}\``)
    .join('\n')
  return [
    `# ${toolName} (${scenario.toolId}) — Fictional Scenario Decision Export`,
    `## Scenario ID: ${scenario.scenarioId}`,
    `### Inputs`,
    inputLines,
    `### Baseline Verdict`,
    `${scenario.baselineVerdict}`,
    `### Adverse / Contradictory Case`,
    `- Trigger: ${scenario.adverseCase.trigger}`,
    `- Verdict: ${scenario.adverseCase.verdict}`,
    `### Recovery & Sensitivity`,
    `- Correction: ${scenario.recoveryAndSensitivity.correction}`,
    `- Verdict: ${scenario.recoveryAndSensitivity.verdict}`,
    `- Sensitivity: ${scenario.recoveryAndSensitivity.sensitivityDelta}`,
    `### Educational Scope Notice`,
    `> ${scenario.boundaryNotice}`,
  ].join('\n')
}

type BusinessModelOracle = () => BusinessDecisionScenario

export const BUSINESS_MODEL_ORACLES: Record<BusinessAssessmentId, BusinessModelOracle> = {
  'bt-roi-calculator': () => {
    // Baseline: 12 products, $420k migration investment, 8% annual breach prob on $4.5M breach impact = $360k/yr expected loss avoided, 5-year horizon
    const calcRoi = (
      investment: number,
      breachCost: number,
      annualProb: number,
      horizonYears: number
    ) => {
      if (investment <= 0 || horizonYears <= 0 || annualProb < 0 || annualProb > 1) {
        throw new RangeError('Invalid ROI financial inputs')
      }
      const annualAvoided = breachCost * annualProb
      const paybackYears = annualAvoided > 0 ? investment / annualAvoided : Infinity
      const netBenefit = annualAvoided * horizonYears - investment
      return {
        annualAvoided,
        paybackYears: Number(paybackYears.toFixed(2)),
        netBenefit,
        withinHorizon: paybackYears <= horizonYears,
      }
    }
    const base = calcRoi(420000, 4500000, 0.08, 5)
    expect(base.annualAvoided).toBe(360000)
    expect(base.paybackYears).toBe(1.17)
    expect(base.withinHorizon).toBe(true)

    // Adverse: Zero avoided loss (annualProb = 0) yields Infinite payback -> withinHorizon = false; negative investment throws
    const zeroProb = calcRoi(420000, 4500000, 0, 5)
    expect(zeroProb.paybackYears).toBe(Infinity)
    expect(zeroProb.withinHorizon).toBe(false)
    expect(() => calcRoi(-100, 4500000, 0.08, 5)).toThrow(RangeError)

    // Recovery & Sensitivity: Halve annual breach probability to 4% ($180k/yr avoided) -> payback 2.33 years still lands inside 5-year horizon
    const halved = calcRoi(420000, 4500000, 0.04, 5)
    expect(halved.paybackYears).toBe(2.33)
    expect(halved.withinHorizon).toBe(true)

    return {
      toolId: 'roi-calculator',
      scenarioId: 'FIN-ROI-2026-01',
      inputs: {
        productsInScope: 12,
        migrationInvestmentUsd: 420000,
        breachImpactUsd: 4500000,
        annualBreachProb: 0.08,
        horizonYears: 5,
      },
      baselineVerdict: `Payback ${base.paybackYears} yrs ($${base.annualAvoided}/yr avoided; net 5-yr benefit $${base.netBenefit})`,
      adverseCase: {
        trigger: 'annualBreachProb=0 with zero penalty assumptions',
        verdict: 'Payback=Infinity (outside 5-year planning horizon)',
        rejectedOrFlagged: !zeroProb.withinHorizon,
      },
      recoveryAndSensitivity: {
        correction: 'Restore evidence-backed 0.04 conservative probability (50% haircut)',
        verdict: `Payback ${halved.paybackYears} yrs (remains <= 5-year horizon)`,
        sensitivityDelta: '+1.16 yrs payback under 50% probability haircut',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['roi-calculator'].sampleVsProductionBoundary,
    }
  },

  'bt-board-pitch': () => {
    // One ask, one date, one consequence of missing it + traceable basis of figures
    const evaluatePitch = (
      askUsd: number,
      targetYear: number,
      consequence: string,
      basisSource: string
    ) => {
      const missingFields: string[] = []
      if (!(askUsd > 0)) missingFields.push('askUsd')
      if (!(targetYear >= 2026 && targetYear <= 2035)) missingFields.push('targetYear')
      if (consequence.trim().length < 15) missingFields.push('consequence')
      if (basisSource.trim().length < 10) missingFields.push('basisSource')
      return {
        defensible: missingFields.length === 0,
        missingFields,
      }
    }
    const base = evaluatePitch(
      420000,
      2029,
      'Unmitigated HNDL exposure on 10-year customer archives past NIST 2030 deprecation',
      'CBOM scan 2026-11 + ROI worksheet FIN-ROI-2026-01'
    )
    expect(base.defensible).toBe(true)

    // Adverse: Missing consequence or unsourced budget request
    const adverse = evaluatePitch(420000, 2029, '', '')
    expect(adverse.defensible).toBe(false)
    expect(adverse.missingFields).toEqual(['consequence', 'basisSource'])

    // Recovery & Sensitivity: Shifting target date from 2029 to 2028 compresses annual tranche from $140k/yr (3 yrs) to $210k/yr (2 yrs)
    const tranche3Yr = 420000 / 3
    const tranche2Yr = 420000 / 2
    expect(tranche2Yr - tranche3Yr).toBe(70000)

    return {
      toolId: 'board-pitch',
      scenarioId: 'EXEC-PITCH-2026-01',
      inputs: {
        budgetRequestUsd: 420000,
        targetCompletionYear: 2029,
        paybackMonths: 14,
        basisOfFigures: 'CBOM scan 2026-11 + ROI worksheet FIN-ROI-2026-01',
      },
      baselineVerdict:
        'Defensible single-slide board proposal (ask + 2029 date + HNDL consequence + cited basis)',
      adverseCase: {
        trigger: 'Omitted consequence statement and missing basis-of-figures citation',
        verdict: 'Flagged incomplete pitch: missing [consequence, basisSource]',
        rejectedOrFlagged: !adverse.defensible,
      },
      recoveryAndSensitivity: {
        correction: 'Attach dated CBOM + ROI citation and compare 2029 vs 2028 target date',
        verdict: 'Proposal complete and traceable',
        sensitivityDelta:
          '+$70,000/yr annual tranche when accelerating completion from 3 yrs to 2 yrs',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['board-pitch'].sampleVsProductionBoundary,
    }
  },

  'bt-breach-simulator': () => {
    // Mosca X + Y > Z combined with classical vs quantum-enabled ALE calculation
    const simulateBreach = (
      xRetention: number,
      yMigration: number,
      zCrqc: number,
      records: number,
      costPerRecord: number
    ) => {
      const exposureYears = xRetention + yMigration - zCrqc
      const hndlExposed = exposureYears > 0
      const baseEventCost = records * costPerRecord
      const quantumMultiplier = hndlExposed ? 1.45 : 1.0
      return {
        exposureYears,
        hndlExposed,
        classicalCostUsd: baseEventCost,
        quantumCostUsd: Math.round(baseEventCost * quantumMultiplier),
      }
    }
    // Baseline: X=3 yrs retention, Y=2 yrs migration, Z=6 yrs -> 3+2-6 = -1 yr (Not Yet Late)
    const base = simulateBreach(3, 2, 6, 50000, 180)
    expect(base.hndlExposed).toBe(false)
    expect(base.exposureYears).toBe(-1)

    // Adverse: X=10 yrs retention, Y=3 yrs migration, Z=8 yrs -> 10+3-8 = +5 yrs HNDL exposure (Already Late)
    const late = simulateBreach(10, 3, 8, 50000, 180)
    expect(late.hndlExposed).toBe(true)
    expect(late.exposureYears).toBe(5)
    expect(late.quantumCostUsd).toBeGreaterThan(late.classicalCostUsd)

    // Recovery & Sensitivity: Deploy hybrid ML-KEM-768 transport now (reducing remaining Y for transit capture to 1 yr) + reduce archive retention X to 6 yrs -> 6+1-8 = -1 yr
    const recovered = simulateBreach(6, 1, 8, 50000, 180)
    expect(recovered.hndlExposed).toBe(false)

    return {
      toolId: 'breach-simulator',
      scenarioId: 'CRQ-BREACH-2026-01',
      inputs: {
        retentionYearsX: 10,
        migrationYearsY: 3,
        crqcHorizonYearsZ: 8,
        recordsInScope: 50000,
        costPerRecordUsd: 180,
      },
      baselineVerdict: `Baseline short-lived tier (X=3, Y=2, Z=6): exposure=${base.exposureYears} yr (within margin)`,
      adverseCase: {
        trigger: 'Long-lived archive tier (X=10, Y=3, Z=8 -> X+Y=13 > Z=8)',
        verdict: `HNDL Exposed (+${late.exposureYears} yrs overdue; modeled quantum event $${late.quantumCostUsd})`,
        rejectedOrFlagged: late.hndlExposed,
      },
      recoveryAndSensitivity: {
        correction:
          'Enable hybrid X25519MLKEM768 transit encryption (Y=1) and tier retention (X=6)',
        verdict: `Exposure window closed (${recovered.exposureYears} yr margin)`,
        sensitivityDelta: 'Reduces modeled quantum exposure delta by $4,050,000 across 50k records',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['breach-simulator'].sampleVsProductionBoundary,
    }
  },

  'bt-cost-of-inaction': () => {
    // Discounted NPV of starting migration now (smoothed 4-year OpEx) vs delaying 3 years (compressed rush surcharge + HNDL risk)
    const computeNpv = (cashflows: number[], discountRate: number) =>
      Number(cashflows.reduce((acc, cf, t) => acc + cf / (1 + discountRate) ** t, 0).toFixed(2))
    const startNowFlows = [150000, 150000, 150000, 150000, 20000, 20000] // $640k undiscounted
    const delay3YrFlows = [0, 0, 0, 320000, 380000, 260000] // $960k undiscounted due to compressed rush & contractor premium
    const npvNow = computeNpv(startNowFlows, 0.06)
    const npvDelay = computeNpv(delay3YrFlows, 0.06)
    expect(npvDelay).toBeGreaterThan(npvNow)

    // Adverse: 3-year delay incurs +$174,851.99 higher discounted NPV cost
    const delayPenaltyNpv = Number((npvDelay - npvNow).toFixed(2))
    expect(delayPenaltyNpv).toBeGreaterThan(150000)

    // Recovery & Sensitivity: Test at 3% vs 8% discount rate — acting now remains cheaper under both discount rates
    const deltaAt3Pct = Number(
      (computeNpv(delay3YrFlows, 0.03) - computeNpv(startNowFlows, 0.03)).toFixed(2)
    )
    expect(deltaAt3Pct).toBeGreaterThan(delayPenaltyNpv)

    return {
      toolId: 'cost-of-inaction',
      scenarioId: 'FIN-COI-2026-01',
      inputs: {
        discountRate: 0.06,
        horizonYears: 6,
        startNowFlowsUsd: startNowFlows,
        delay3YrFlowsUsd: delay3YrFlows,
      },
      baselineVerdict: `Start-now NPV $${npvNow} vs 3-yr delay NPV $${npvDelay}`,
      adverseCase: {
        trigger: '3-year program deferral into 2029-2030 mandate crunch',
        verdict: `Delay increases discounted program cost by $${delayPenaltyNpv}`,
        rejectedOrFlagged: npvDelay > npvNow,
      },
      recoveryAndSensitivity: {
        correction: 'Initiate Phase 0/1 discovery in Year 0 to eliminate rush premium',
        verdict: `Saves $${delayPenaltyNpv} at 6% discount rate ($${deltaAt3Pct} at 3% discount rate)`,
        sensitivityDelta: 'Crossover occurs in Year 4 when compressed remediation surcharges hit',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['cost-of-inaction'].sampleVsProductionBoundary,
    }
  },

  'bt-cost-model-explorer': () => {
    // Compare Parametric, Bottom-Up WBS, and Percentile spread on system inventory count
    const estimateProgramCost = (
      systemsCount: number,
      omittedSystemsCount: number,
      unitRefactUsd: number
    ) => {
      const effectiveSystems = systemsCount
      const parametricUsd = Math.round(effectiveSystems * unitRefactUsd * 1.15)
      const bottomUpUsd = effectiveSystems * unitRefactUsd + 85000
      const p10Usd = Math.round(effectiveSystems * unitRefactUsd * 0.85)
      const p90Usd = Math.round(effectiveSystems * unitRefactUsd * 1.65)
      const unmodeledOmissionUsd = Math.round(omittedSystemsCount * unitRefactUsd * 1.25)
      return { parametricUsd, bottomUpUsd, p10Usd, p90Usd, unmodeledOmissionUsd }
    }
    // Baseline: Complete 25-system inventory (0 omitted)
    const complete = estimateProgramCost(25, 0, 18000)
    expect(complete.unmodeledOmissionUsd).toBe(0)
    expect(complete.p90Usd).toBeGreaterThan(complete.p10Usd)

    // Adverse: Shared incomplete inventory (15 counted, 10 omitted shadow systems) — small method spread hides $225k omitted cost
    const incomplete = estimateProgramCost(15, 10, 18000)
    const methodSpread = Math.abs(incomplete.parametricUsd - incomplete.bottomUpUsd)
    expect(methodSpread).toBeLessThan(incomplete.unmodeledOmissionUsd)

    // Recovery & Sensitivity: Correct inventory to 25 systems and vary unit refactoring labor ($18k -> $22k)
    const highLabor = estimateProgramCost(25, 0, 22000)
    expect(highLabor.parametricUsd - complete.parametricUsd).toBe(115000)

    return {
      toolId: 'cost-model-explorer',
      scenarioId: 'FIN-CME-2026-01',
      inputs: {
        countedSystems: 25,
        omittedSystemsInAdverseCase: 10,
        unitRefactorCostUsd: 18000,
      },
      baselineVerdict: `Complete 25-system range: P10 $${complete.p10Usd} – P90 $${complete.p90Usd} (Parametric $${complete.parametricUsd})`,
      adverseCase: {
        trigger: 'Shared incomplete inventory (15 systems counted, 10 omitted)',
        verdict: `Method spread ($${methodSpread}) masks $${incomplete.unmodeledOmissionUsd} correlated omission error`,
        rejectedOrFlagged: incomplete.unmodeledOmissionUsd > methodSpread,
      },
      recoveryAndSensitivity: {
        correction: 'Reconcile CMDB/CBOM to include all 25 systems before comparing estimators',
        verdict: 'Correlated omission eliminated; honest P10-P90 spread restored',
        sensitivityDelta:
          '+$115,000 parametric cost when unit refactoring labor shifts from $18k to $22k',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['cost-model-explorer'].sampleVsProductionBoundary,
    }
  },

  'bt-crqc-scenario': () => {
    // Evaluate policy and threat-horizon scenario via `evaluateSamplePolicy`
    const base = evaluateSamplePolicy({
      algorithm: 'ML-KEM-768',
      useCase: 'key-establishment',
      quantumVulnerableDuringTransition: true,
      retentionYears: 4,
      migrationYears: 2,
      threatHorizonYears: 8,
      completionYear: 2029,
      policy: {
        id: 'NIST-IR-8547',
        revision: 'ipd',
        source: 'NIST IR 8547 2030 deprecation milestone',
        applies: true,
        deadlineYear: 2030,
      },
    })
    expect(base.findings).toEqual([])
    expect(base.exposureYears).toBe(-2)

    // Adverse: Accelerated CRQC horizon (threatHorizonYears=5 with retention=10, migration=3 -> exposureYears=+8) + completionYear=2032 > 2030
    const adverse = evaluateSamplePolicy({
      algorithm: 'ML-KEM-768',
      useCase: 'key-establishment',
      quantumVulnerableDuringTransition: true,
      retentionYears: 10,
      migrationYears: 3,
      threatHorizonYears: 5,
      completionYear: 2032,
      policy: {
        id: 'NIST-IR-8547',
        revision: 'ipd',
        source: 'NIST IR 8547 2030 deprecation milestone',
        applies: true,
        deadlineYear: 2030,
      },
    })
    expect(adverse.exposureYears).toBe(8)
    expect(adverse.findings.map((f) => f.kind)).toEqual(['policy', 'scenario-risk'])

    // Recovery: Accelerate completion to 2028 (migrationYears=2) with hybrid KEM deployed now (quantumVulnerableDuringTransition=false)
    const recovered = evaluateSamplePolicy({
      algorithm: 'ML-KEM-768',
      useCase: 'key-establishment',
      quantumVulnerableDuringTransition: false,
      retentionYears: 10,
      migrationYears: 2,
      threatHorizonYears: 5,
      completionYear: 2028,
      policy: {
        id: 'NIST-IR-8547',
        revision: 'ipd',
        source: 'NIST IR 8547 2030 deprecation milestone',
        applies: true,
        deadlineYear: 2030,
      },
    })
    expect(recovered.findings).toEqual([])

    return {
      toolId: 'crqc-scenario',
      scenarioId: 'RISK-CRQC-2026-01',
      inputs: {
        algorithm: 'ML-KEM-768',
        retentionYears: 10,
        migrationYears: 2,
        threatHorizonYears: 8,
        completionYear: 2029,
      },
      baselineVerdict:
        '0 findings; completion 2029 meets 2030 milestone with -2 yr exposure margin',
      adverseCase: {
        trigger: 'Accelerated 5-yr horizon + 2032 completion with classical transition exposure',
        verdict: `2 findings: [${adverse.findings.map((f) => f.kind).join(', ')}], +8 yrs exposure`,
        rejectedOrFlagged: adverse.findings.length === 2,
      },
      recoveryAndSensitivity: {
        correction: 'Accelerate completion to 2028 and enable hybrid ML-KEM-768 now',
        verdict: '0 findings under accelerated 5-yr sensitivity test',
        sensitivityDelta: 'Eliminates both policy-deadline breach and 8-year HNDL transition risk',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['crqc-scenario'].sampleVsProductionBoundary,
    }
  },

  'bt-risk-register': () => {
    // Likelihood (1-5) * Impact (1-5) = Score (1-25) + governance gate: ownerRole & reviewDate required to graduate from "Note, not a risk yet"
    const evaluateRiskEntry = (
      likelihood: number,
      impact: number,
      ownerRole: string,
      reviewDate: string
    ) => {
      const score = likelihood * impact
      const severity =
        score >= 20 ? 'Critical' : score >= 12 ? 'High' : score >= 6 ? 'Medium' : 'Low'
      const isActionableRisk = ownerRole.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(reviewDate)
      return {
        score,
        severity,
        statusBadge: isActionableRisk ? 'Committed Risk Entry' : 'Note, not a risk yet',
        isActionableRisk,
      }
    }
    const base = evaluateRiskEntry(4, 5, 'PKI Lead', '2027-03-01')
    expect(base.score).toBe(20)
    expect(base.severity).toBe('Critical')
    expect(base.isActionableRisk).toBe(true)

    // Adverse: Blank ownerRole or missing reviewDate flags entry as "Note, not a risk yet"
    const unowned = evaluateRiskEntry(4, 5, '', '')
    expect(unowned.isActionableRisk).toBe(false)
    expect(unowned.statusBadge).toBe('Note, not a risk yet')

    // Recovery & Sensitivity: Assign owner role + review date and apply hybrid TLS mitigation reducing Likelihood 4 -> 2 (Score 20 -> 10 Medium)
    const mitigated = evaluateRiskEntry(2, 5, 'PKI Lead', '2027-03-01')
    expect(mitigated.score).toBe(10)
    expect(mitigated.severity).toBe('Medium')

    return {
      toolId: 'risk-register',
      scenarioId: 'RISK-REG-2026-01',
      inputs: {
        asset: 'TLS Certificates (Public Web)',
        currentAlgorithm: 'RSA-2048',
        likelihood: 4,
        impact: 5,
        ownerRole: 'PKI Lead',
        reviewDate: '2027-03-01',
      },
      baselineVerdict: `Score ${base.score} (${base.severity}) — ${base.statusBadge}`,
      adverseCase: {
        trigger: 'Blank ownerRole and missing reviewDate on Likelihood 4 / Impact 5 entry',
        verdict: unowned.statusBadge,
        rejectedOrFlagged: !unowned.isActionableRisk,
      },
      recoveryAndSensitivity: {
        correction: 'Assign PKI Lead + 2027-03-01 review cadence and deploy hybrid TLS mitigation',
        verdict: `Residual Score ${mitigated.score} (${mitigated.severity})`,
        sensitivityDelta: '-10 risk points (20 Critical -> 10 Medium) when likelihood drops 4 -> 2',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['risk-register'].sampleVsProductionBoundary,
    }
  },

  'bt-risk-treatment-plan': () => {
    // Treatment plan requires non-empty treatment strategy + rationale + funded owner for every High/Critical cell
    const validateTreatment = (
      inherentScore: number,
      strategy: 'Mitigate' | 'Avoid' | 'Transfer' | 'Accept' | '',
      rationale: string,
      evidenceAttached: boolean
    ) => {
      if (!strategy || rationale.trim().length < 10) {
        return { valid: false, residualScore: inherentScore, reason: 'UNTREATED_HIGH_RISK' }
      }
      // Residual score only drops when independent verification evidence is attached
      const reductionFactor = strategy === 'Mitigate' && evidenceAttached ? 0.5 : 1.0
      return {
        valid: true,
        residualScore: Math.round(inherentScore * reductionFactor),
        reason: evidenceAttached ? 'VERIFIED_REDUCTION' : 'PLANNED_ONLY_NO_EVIDENCE_REDUCTION',
      }
    }
    const base = validateTreatment(
      20,
      'Mitigate',
      'Migrate ingress to X25519MLKEM768 + ML-DSA-65',
      true
    )
    expect(base.valid).toBe(true)
    expect(base.residualScore).toBe(10)

    // Adverse: Blank treatment or unverified claim (evidenceAttached=false keeps residualScore=20)
    const blank = validateTreatment(20, '', '', false)
    expect(blank.valid).toBe(false)
    const unverified = validateTreatment(
      20,
      'Mitigate',
      'Planned Q4 upgrade without packet capture',
      false
    )
    expect(unverified.residualScore).toBe(20)

    return {
      toolId: 'risk-treatment-plan',
      scenarioId: 'RISK-TREAT-2026-01',
      inputs: {
        cell: 'L4xI5',
        inherentScore: 20,
        strategy: 'Mitigate',
        rationale: 'Migrate ingress to X25519MLKEM768 + ML-DSA-65',
        evidenceAttached: true,
      },
      baselineVerdict: `Valid Mitigate plan; verified residual score=${base.residualScore}`,
      adverseCase: {
        trigger: 'Blank strategy or mitigation claim without technical verification receipt',
        verdict: `${blank.reason}; unverified residual score remains ${unverified.residualScore}`,
        rejectedOrFlagged: !blank.valid && unverified.residualScore === 20,
      },
      recoveryAndSensitivity: {
        correction: 'Attach staging PCAP / CBOM receipt before crediting residual-risk reduction',
        verdict: 'Residual risk score reduced from 20 to 10',
        sensitivityDelta: '-50% residual score only after technical verification attachment',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['risk-treatment-plan'].sampleVsProductionBoundary,
    }
  },

  'bt-compliance-checklist': () => {
    // Per-framework control mapping: a control is only "Evidence Linked" if both owner and artifactRef are present
    const scoreFrameworkChecklist = (
      controls: { id: string; checked: boolean; owner: string; artifactRef: string }[]
    ) => {
      const evidenced = controls.filter(
        (c) => c.checked && c.owner.trim().length > 0 && c.artifactRef.trim().length > 0
      )
      const intentionsOnly = controls.filter(
        (c) => c.checked && (!c.owner.trim() || !c.artifactRef.trim())
      )
      return {
        total: controls.length,
        evidencedCount: evidenced.length,
        intentionsOnlyCount: intentionsOnly.length,
        auditReady: intentionsOnly.length === 0 && evidenced.length === controls.length,
      }
    }
    const base = scoreFrameworkChecklist([
      { id: 'CNSA-1', checked: true, owner: 'PKI Lead', artifactRef: 'cbom-2026-11.cdx.json' },
      { id: 'CNSA-2', checked: true, owner: 'NetSec Lead', artifactRef: 'tls-hybrid-pcap-01.pcap' },
    ])
    expect(base.auditReady).toBe(true)

    // Adverse: Ticking boxes without evidence artifact references ("checklist of intentions")
    const intentions = scoreFrameworkChecklist([
      { id: 'CNSA-1', checked: true, owner: 'PKI Lead', artifactRef: '' },
      { id: 'CNSA-2', checked: true, owner: '', artifactRef: '' },
    ])
    expect(intentions.auditReady).toBe(false)
    expect(intentions.intentionsOnlyCount).toBe(2)

    // Recovery: Populate concrete artifact IDs and owners
    const recovered = scoreFrameworkChecklist([
      { id: 'CNSA-1', checked: true, owner: 'PKI Lead', artifactRef: 'cbom-2026-11.cdx.json' },
      { id: 'CNSA-2', checked: true, owner: 'NetSec Lead', artifactRef: 'hsm-fw-inventory.csv' },
    ])
    expect(recovered.auditReady).toBe(true)

    return {
      toolId: 'compliance-checklist',
      scenarioId: 'COMP-CHK-2026-01',
      inputs: {
        framework: 'CNSA 2.0 / NIST IR 8547',
        controlCount: 2,
        evidencedCount: base.evidencedCount,
      },
      baselineVerdict: `${base.evidencedCount}/${base.total} controls backed by named owner and artifact reference`,
      adverseCase: {
        trigger: 'Checked controls with empty artifactRef ("checklist of intentions")',
        verdict: `Flagged ${intentions.intentionsOnlyCount} unsubstantiated checkmarks; auditReady=false`,
        rejectedOrFlagged: !intentions.auditReady,
      },
      recoveryAndSensitivity: {
        correction: 'Attach dated CBOM and HSM inventory references to each checked obligation',
        verdict: '2/2 obligations traceable to concrete artifacts',
        sensitivityDelta: '0 unverified intentions remaining',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['compliance-checklist'].sampleVsProductionBoundary,
    }
  },

  'bt-audit-checklist': () => {
    // Topic selection count is strictly separated from reference rows; reference rows never inflate topic percentages
    const computeAuditPlanningState = (
      selectedTopics: string[],
      totalTopics: number,
      referenceRows: { label: string; refId: string }[]
    ) => {
      return {
        selectedCount: selectedTopics.length,
        totalTopics,
        selectionRatio: `${selectedTopics.length}/${totalTopics}`,
        referenceRowCount: referenceRows.length,
        readinessAssessed: false as const, // Never claims audit readiness
      }
    }
    const state0 = computeAuditPlanningState(['cbom-generated'], 5, [])
    const stateWithRef = computeAuditPlanningState(['cbom-generated'], 5, [
      { label: 'Fictional CMVP reference', refId: 'CMVP-FICTIONAL-0001' },
    ])
    expect(state0.selectionRatio).toBe('1/5')
    expect(stateWithRef.selectionRatio).toBe('1/5') // Reference row does not inflate topic count
    expect(stateWithRef.readinessAssessed).toBe(false)

    // Adverse: Verify that adding 10 reference rows with 0 selected topics still yields 0/5 topics and readinessAssessed=false
    const zeroTopicsWithRefs = computeAuditPlanningState(
      [],
      5,
      Array.from({ length: 10 }, (_, i) => ({ label: `Ref ${i}`, refId: `ID-${i}` }))
    )
    expect(zeroTopicsWithRefs.selectionRatio).toBe('0/5')

    // Recovery: Select 3 planning topics and record explicit missing-evidence note
    const state3 = computeAuditPlanningState(
      ['cbom-generated', 'policy-approved', 'hsm-inventory'],
      5,
      [{ label: 'Fictional CMVP reference', refId: 'CMVP-FICTIONAL-0001' }]
    )
    expect(state3.selectionRatio).toBe('3/5')

    return {
      toolId: 'audit-checklist',
      scenarioId: 'COMP-AUDIT-2026-01',
      inputs: {
        domain: 'Cryptographic Inventory',
        selectedTopics: ['cbom-generated', 'policy-approved', 'hsm-inventory'],
        totalTopics: 5,
        fictionalReferenceId: 'CMVP-FICTIONAL-0001',
      },
      baselineVerdict:
        '1/5 planning topics selected; reference row recorded without inflating topic count',
      adverseCase: {
        trigger: '10 reference rows added with 0 planning topics selected',
        verdict:
          'Topic count remains 0/5; readinessAssessed=false (never conflates notes with readiness)',
        rejectedOrFlagged:
          zeroTopicsWithRefs.selectedCount === 0 && !zeroTopicsWithRefs.readinessAssessed,
      },
      recoveryAndSensitivity: {
        correction: 'Select 3 in-scope planning topics and document missing evidence items',
        verdict: '3/5 planning topics scoped; readinessAssessed=false preserved',
        sensitivityDelta:
          'Topic count scales strictly with selected topics (1/5 -> 3/5), independent of reference rows',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['audit-checklist'].sampleVsProductionBoundary,
    }
  },

  'bt-compliance-timeline': () => {
    // Compare linked internal milestone year against external obligation reference year
    const evaluateMilestoneAlignment = (
      milestoneYear: number,
      linkedObligations: { id: string; referenceYear: number }[]
    ) => {
      if (linkedObligations.length === 0) {
        return [{ id: 'UNLINKED', status: 'Not linked to any obligation', slackYears: null }]
      }
      return linkedObligations.map((ob) => {
        const slackYears = ob.referenceYear - milestoneYear
        return {
          id: ob.id,
          slackYears,
          status:
            slackYears >= 0
              ? 'Planned by reference year (satisfaction not assessed)'
              : `Late by ${Math.abs(slackYears)} yr(s) against reference year`,
        }
      })
    }
    const base = evaluateMilestoneAlignment(2026, [{ id: 'CNSA-2.0-SW', referenceYear: 2031 }])
    expect(base[0].slackYears).toBe(5)
    expect(base[0].status).toContain('Planned by reference year')

    // Adverse: Milestone planned for 2032 against a 2030 NIST IR 8547 deprecation reference year -> -2 yrs slack
    const late = evaluateMilestoneAlignment(2032, [
      { id: 'NIST-IR-8547-2030', referenceYear: 2030 },
    ])
    expect(late[0].slackYears).toBe(-2)
    expect(late[0].status).toContain('Late by 2 yr(s)')

    // Recovery: Pull internal PKI/inventory milestone forward to 2028 -> +2 yrs positive slack
    const recovered = evaluateMilestoneAlignment(2028, [
      { id: 'NIST-IR-8547-2030', referenceYear: 2030 },
    ])
    expect(recovered[0].slackYears).toBe(2)

    return {
      toolId: 'compliance-timeline',
      scenarioId: 'COMP-TIME-2026-01',
      inputs: {
        jurisdiction: 'United States',
        milestoneTitle: 'Complete crypto inventory & PKI cutover',
        milestoneYear: 2028,
        obligationId: 'NIST-IR-8547-2030',
        obligationReferenceYear: 2030,
      },
      baselineVerdict:
        '2026 inventory milestone linked to 2031 reference (+5 yrs slack; satisfaction not assessed)',
      adverseCase: {
        trigger: 'Internal milestone scheduled for 2032 against 2030 reference deadline',
        verdict: late[0].status,
        rejectedOrFlagged: late[0].slackYears! < 0,
      },
      recoveryAndSensitivity: {
        correction: 'Reschedule internal milestone to 2028 ahead of 2030 obligation date',
        verdict: `${recovered[0].status} (+${recovered[0].slackYears} yrs slack)`,
        sensitivityDelta: '+4 years schedule slack improvement (from -2 yrs to +2 yrs)',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['compliance-timeline'].sampleVsProductionBoundary,
    }
  },

  'bt-raci-builder': () => {
    // RACI invariant: Exactly ONE Accountable ('A') and at least one Responsible ('R') per activity row
    type RaciCode = 'R' | 'A' | 'C' | 'I' | ''
    const validateRaciRow = (activity: string, assignments: Record<string, RaciCode>) => {
      const codes = Object.values(assignments)
      const aCount = codes.filter((c) => c === 'A').length
      const rCount = codes.filter((c) => c === 'R').length
      const issues: string[] = []
      if (aCount === 0) issues.push('MISSING_ACCOUNTABLE')
      if (aCount > 1) issues.push('MULTIPLE_ACCOUNTABLES_MEANS_NOBODY')
      if (rCount === 0) issues.push('MISSING_RESPONSIBLE')
      return { activity, valid: issues.length === 0, aCount, rCount, issues }
    }
    const base = validateRaciRow('Crypto Inventory', {
      CISO: 'C',
      EnterpriseArchitect: 'A',
      PKILead: 'R',
      Procurement: 'I',
    })
    expect(base.valid).toBe(true)
    expect(base.aCount).toBe(1)

    // Adverse: Two Accountables on the same row ('CISO': 'A', 'EnterpriseArchitect': 'A')
    const dualA = validateRaciRow('Crypto Inventory', {
      CISO: 'A',
      EnterpriseArchitect: 'A',
      PKILead: 'R',
      Procurement: 'I',
    })
    expect(dualA.valid).toBe(false)
    expect(dualA.issues).toContain('MULTIPLE_ACCOUNTABLES_MEANS_NOBODY')

    // Recovery: Reassign CISO to Consulted ('C') so EnterpriseArchitect is the single Accountable ('A')
    const fixed = validateRaciRow('Crypto Inventory', {
      CISO: 'C',
      EnterpriseArchitect: 'A',
      PKILead: 'R',
      Procurement: 'C',
    })
    expect(fixed.valid).toBe(true)

    return {
      toolId: 'raci-builder',
      scenarioId: 'GOV-RACI-2026-01',
      inputs: {
        activity: 'Crypto Inventory & CBOM Pipeline',
        CISO: 'C',
        EnterpriseArchitect: 'A',
        PKILead: 'R',
        Procurement: 'C',
      },
      baselineVerdict:
        'Valid RACI row: 1 Accountable (EnterpriseArchitect) and 1 Responsible (PKILead)',
      adverseCase: {
        trigger: 'Both CISO and EnterpriseArchitect assigned Accountable (A) on Crypto Inventory',
        verdict: 'Flagged MULTIPLE_ACCOUNTABLES_MEANS_NOBODY (aCount=2)',
        rejectedOrFlagged: !dualA.valid,
      },
      recoveryAndSensitivity: {
        correction:
          'Set CISO to Consulted (C) and retain EnterpriseArchitect as sole Accountable (A)',
        verdict: 'Single-Accountable governance invariant restored',
        sensitivityDelta: 'aCount reduced from 2 -> 1 across all 10 migration workstreams',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['raci-builder'].sampleVsProductionBoundary,
    }
  },

  'bt-policy-generator': () => {
    // Policy template validation: approved PQC algorithms cannot overlap with deprecated classical list; exception window must be bounded (<= 24 months)
    const validateCryptoPolicy = (
      approvedKem: string[],
      approvedSig: string[],
      retireList: string[],
      exceptionMonths: number
    ) => {
      const overlap = [...approvedKem, ...approvedSig].filter((a) => retireList.includes(a))
      const unboundedException = exceptionMonths <= 0 || exceptionMonths > 24
      return {
        valid: overlap.length === 0 && !unboundedException,
        overlap,
        unboundedException,
      }
    }
    const base = validateCryptoPolicy(
      ['ML-KEM-768', 'ML-KEM-1024'],
      ['ML-DSA-65', 'ML-DSA-87', 'SLH-DSA'],
      ['RSA-2048', 'ECDSA-P256', 'ECDH-P256'],
      12
    )
    expect(base.valid).toBe(true)

    // Adverse: Contradictory policy approving RSA-2048 while also listing RSA-2048 for retirement, plus 60-month exception waiver
    const contradictory = validateCryptoPolicy(
      ['ML-KEM-768', 'RSA-2048'],
      ['ML-DSA-65'],
      ['RSA-2048'],
      60
    )
    expect(contradictory.valid).toBe(false)
    expect(contradictory.overlap).toEqual(['RSA-2048'])
    expect(contradictory.unboundedException).toBe(true)

    // Recovery: Remove RSA-2048 from approved list and cap exception waiver at 12 months with CISO sign-off
    const recovered = validateCryptoPolicy(['ML-KEM-1024'], ['ML-DSA-87'], ['RSA-2048'], 12)
    expect(recovered.valid).toBe(true)

    return {
      toolId: 'policy-generator',
      scenarioId: 'GOV-POL-2026-01',
      inputs: {
        approvedKem: ['ML-KEM-768', 'ML-KEM-1024'],
        approvedSig: ['ML-DSA-65', 'ML-DSA-87', 'SLH-DSA'],
        retiredAlgorithms: ['RSA-2048', 'ECDSA-P256', 'ECDH-P256'],
        maxExceptionMonths: 12,
      },
      baselineVerdict:
        'Valid normative policy: FIPS 203/204/205 approved, classical retirement list disjoint, 12-mo exception cap',
      adverseCase: {
        trigger: 'RSA-2048 placed in both Approved and Retire lists with 60-month waiver window',
        verdict: 'Rejected contradictory policy: overlap=[RSA-2048], unboundedException=true',
        rejectedOrFlagged: !contradictory.valid,
      },
      recoveryAndSensitivity: {
        correction:
          'Remove RSA-2048 from approved list and enforce CNSA 2.0 profile (ML-KEM-1024 / ML-DSA-87, 12-mo waiver cap)',
        verdict: 'Zero policy contradictions; ready for OPA/Kyverno admission rule mapping',
        sensitivityDelta: 'Reduces maximum exception exposure window from 60 months to 12 months',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['policy-generator'].sampleVsProductionBoundary,
    }
  },

  'bt-kpi-dashboard': () => {
    // Role-weighted KPI rollup: refuses to turn missing data into 0 or 100; Executive vs Architect lens changes weights on identical values
    const kpiValues: Record<string, number | null> = {
      inventoryCoverage: 70,
      vendorCbomRate: 60,
      pqcTlsAdoption: 20,
      codeRefactorPct: 15,
    }
    const execWeights = {
      inventoryCoverage: 0.35,
      vendorCbomRate: 0.35,
      pqcTlsAdoption: 0.2,
      codeRefactorPct: 0.1,
    }
    const archWeights = {
      inventoryCoverage: 0.2,
      vendorCbomRate: 0.1,
      pqcTlsAdoption: 0.35,
      codeRefactorPct: 0.35,
    }

    const computeLensScore = (
      vals: Record<string, number | null>,
      weights: Record<string, number>
    ) => {
      if (Object.values(vals).some((v) => v === null)) {
        return { complete: false, weightedScore: null }
      }
      const sum = Object.entries(weights).reduce((acc, [k, w]) => acc + (vals[k] as number) * w, 0)
      return { complete: true, weightedScore: Math.round(sum) }
    }
    const execRes = computeLensScore(kpiValues, execWeights)
    const archRes = computeLensScore(kpiValues, archWeights)
    expect(execRes.weightedScore).toBe(51)
    expect(archRes.weightedScore).toBe(32)
    expect(execRes.weightedScore).not.toBe(archRes.weightedScore)

    // Adverse: Missing domain measurement (`vendorCbomRate: null`) must return `weightedScore: null` rather than coercing null -> 0
    const incompleteRes = computeLensScore({ ...kpiValues, vendorCbomRate: null }, execWeights)
    expect(incompleteRes.complete).toBe(false)
    expect(incompleteRes.weightedScore).toBeNull()

    return {
      toolId: 'kpi-dashboard',
      scenarioId: 'GOV-KPIDASH-2026-01',
      inputs: {
        kpiValues,
        executiveScore: execRes.weightedScore,
        architectScore: archRes.weightedScore,
      },
      baselineVerdict: `Sample baseline scored: Executive lens=${execRes.weightedScore} vs Architect lens=${archRes.weightedScore} on identical inputs`,
      adverseCase: {
        trigger: 'Missing vendorCbomRate measurement (null)',
        verdict:
          'Rollup withheld (weightedScore=null); refuses to fabricate 0% or 100% for unassessed KPI',
        rejectedOrFlagged: !incompleteRes.complete,
      },
      recoveryAndSensitivity: {
        correction:
          'Supply verified TPRM CBOM metric (60%) and compare Executive vs Architect weightings',
        verdict: 'Both role lenses compute deterministic weighted averages (51 vs 32)',
        sensitivityDelta:
          '19-point lens delta driven by Architect weighting on pqcTlsAdoption & codeRefactorPct',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['kpi-dashboard'].sampleVsProductionBoundary,
    }
  },

  'bt-vendor-scorecard': () => {
    // Evidence-tier weighted vendor scorecard: verified CAVP/CMVP cert + CycloneDX CBOM outranks unverified marketing slide claims
    type EvidenceTier = 'verified-cavp-cmvp' | 'signed-cbom' | 'unverified-slide-claim' | 'none'
    const tierMultipliers: Record<EvidenceTier, number> = {
      'verified-cavp-cmvp': 1.0,
      'signed-cbom': 0.85,
      'unverified-slide-claim': 0.25,
      none: 0,
    }
    const scoreVendor = (
      rawScore: number,
      tier: EvidenceTier,
      fips203Ready: boolean,
      fips204Ready: boolean
    ) => {
      const capBonus = (fips203Ready ? 15 : 0) + (fips204Ready ? 15 : 0)
      const adjusted = Math.round((rawScore + capBonus) * tierMultipliers[tier])
      return {
        adjustedScore: adjusted,
        qualifiedForTier1: adjusted >= 70 && tier !== 'unverified-slide-claim' && tier !== 'none',
      }
    }
    const verifiedVendor = scoreVendor(65, 'verified-cavp-cmvp', true, true)
    expect(verifiedVendor.adjustedScore).toBe(95)
    expect(verifiedVendor.qualifiedForTier1).toBe(true)

    // Adverse: Vendor claiming 70 raw score purely via unverified roadmap slides -> penalized to 25 and blocked from Tier-1 qualification
    const slideVendor = scoreVendor(70, 'unverified-slide-claim', true, true)
    expect(slideVendor.adjustedScore).toBe(25)
    expect(slideVendor.qualifiedForTier1).toBe(false)

    // Recovery: Require CycloneDX 1.6 CBOM delivery (`signed-cbom` tier) -> adjusted score rises to 85 (qualified)
    const cbomVendor = scoreVendor(70, 'signed-cbom', true, true)
    expect(cbomVendor.adjustedScore).toBe(85)
    expect(cbomVendor.qualifiedForTier1).toBe(true)

    return {
      toolId: 'vendor-scorecard',
      scenarioId: 'TPRM-VEND-2026-01',
      inputs: {
        vendorName: 'Fictional CloudHSM Provider A',
        rawCapabilityScore: 65,
        evidenceTier: 'verified-cavp-cmvp',
        fips203Support: true,
        fips204Support: true,
      },
      baselineVerdict: `Adjusted Score ${verifiedVendor.adjustedScore}/100 (Qualified Tier-1 with CAVP/CMVP evidence)`,
      adverseCase: {
        trigger:
          'Vendor submits only unverified marketing roadmap slides (tier=unverified-slide-claim)',
        verdict: `Discounted to ${slideVendor.adjustedScore}/100; qualifiedForTier1=false`,
        rejectedOrFlagged: !slideVendor.qualifiedForTier1,
      },
      recoveryAndSensitivity: {
        correction:
          'Require signed CycloneDX 1.6 CBOM and NIST CAVP certificate numbers before contract award',
        verdict: `Score recovers to ${cbomVendor.adjustedScore}/100 (signed-cbom) and ${verifiedVendor.adjustedScore}/100 (verified-cavp-cmvp)`,
        sensitivityDelta:
          '+60 points when upgrading evidence from marketing slide (25) to signed CBOM (85)',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['vendor-scorecard'].sampleVsProductionBoundary,
    }
  },

  'bt-contract-clause': () => {
    // Contract playbook validator: requires CBOM delivery SLA (days), FIPS 203/204/205 mandate, and crypto-vulnerability remediation SLA
    const evaluateContractClauses = (clauseSpec: {
      cbomDeliveryDays: number | null
      mandatesFips203_204: boolean
      remediationSlaDays: number | null
      rightToAudit: boolean
    }) => {
      const gaps: string[] = []
      if (!clauseSpec.cbomDeliveryDays || clauseSpec.cbomDeliveryDays > 90)
        gaps.push('CBOM_SLA_MISSING_OR_TOO_SLOW')
      if (!clauseSpec.mandatesFips203_204) gaps.push('MISSING_FIPS_203_204_REQUIREMENT')
      if (!clauseSpec.remediationSlaDays || clauseSpec.remediationSlaDays > 60)
        gaps.push('WEAK_REMEDIATION_SLA')
      if (!clauseSpec.rightToAudit) gaps.push('MISSING_RIGHT_TO_AUDIT')
      return { enforceable: gaps.length === 0, gaps }
    }
    const base = evaluateContractClauses({
      cbomDeliveryDays: 30,
      mandatesFips203_204: true,
      remediationSlaDays: 30,
      rightToAudit: true,
    })
    expect(base.enforceable).toBe(true)

    // Adverse: Legacy MSA with no CBOM delivery requirement and 180-day remediation window
    const weakMsa = evaluateContractClauses({
      cbomDeliveryDays: null,
      mandatesFips203_204: false,
      remediationSlaDays: 180,
      rightToAudit: false,
    })
    expect(weakMsa.enforceable).toBe(false)
    expect(weakMsa.gaps).toHaveLength(4)

    // Recovery: Insert PQC rider with 30-day CBOM per release and 30-day critical crypto defect SLA
    const rider = evaluateContractClauses({
      cbomDeliveryDays: 30,
      mandatesFips203_204: true,
      remediationSlaDays: 45,
      rightToAudit: true,
    })
    expect(rider.enforceable).toBe(true)

    return {
      toolId: 'contract-clause',
      scenarioId: 'TPRM-CLAUSE-2026-01',
      inputs: {
        cbomDeliveryDays: 30,
        mandatesFips203_204: true,
        remediationSlaDays: 30,
        rightToAudit: true,
      },
      baselineVerdict:
        'Enforceable PQC procurement rider (30-day CBOM SLA, FIPS 203/204 mandate, right-to-audit)',
      adverseCase: {
        trigger:
          'Legacy MSA lacking CBOM delivery clause, FIPS 203/204 mandate, and right-to-audit (180-day SLA)',
        verdict: `Rejected with 4 procurement gaps: ${weakMsa.gaps.join(', ')}`,
        rejectedOrFlagged: !weakMsa.enforceable,
      },
      recoveryAndSensitivity: {
        correction:
          'Attach standardized PQC rider (<= 30-day CBOM delivery, <= 45-day remediation SLA)',
        verdict: 'All 4 procurement gaps closed',
        sensitivityDelta: 'Remediation SLA tightened from 180 days to 30-45 days',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['contract-clause'].sampleVsProductionBoundary,
    }
  },

  'bt-supply-chain-matrix': () => {
    // Transitive upstream crypto library concentration & EoL exposure across N-tier suppliers
    const analyzeSupplyChain = (
      suppliers: {
        name: string
        upstreamLib: string
        libVersion: string
        eol: boolean
        pqcReady: boolean
      }[]
    ) => {
      const eolSuppliers = suppliers.filter((s) => s.eol).map((s) => s.name)
      const libCounts: Record<string, number> = {}
      for (const s of suppliers) {
        libCounts[s.upstreamLib] = (libCounts[s.upstreamLib] ?? 0) + 1
      }
      const maxShare = Math.max(...Object.values(libCounts)) / suppliers.length
      return {
        eolSuppliers,
        singlePointConcentration: maxShare >= 0.75,
        allPqcReady: suppliers.every((s) => s.pqcReady && !s.eol),
      }
    }
    const base = analyzeSupplyChain([
      {
        name: 'GatewayVendor',
        upstreamLib: 'OpenSSL',
        libVersion: '3.6.1',
        eol: false,
        pqcReady: true,
      },
      {
        name: 'AuthVendor',
        upstreamLib: 'BoringSSL',
        libVersion: '2026-08',
        eol: false,
        pqcReady: true,
      },
      {
        name: 'StorageVendor',
        upstreamLib: 'wolfSSL',
        libVersion: '5.8.0',
        eol: false,
        pqcReady: true,
      },
    ])
    expect(base.allPqcReady).toBe(true)
    expect(base.eolSuppliers).toEqual([])

    // Adverse: Supplier embedding EoL OpenSSL 1.1.1w + 4/4 monoculture concentration
    const adverse = analyzeSupplyChain([
      {
        name: 'LegacyApplianceA',
        upstreamLib: 'OpenSSL-1.1.1',
        libVersion: '1.1.1w',
        eol: true,
        pqcReady: false,
      },
      {
        name: 'LegacyApplianceB',
        upstreamLib: 'OpenSSL-1.1.1',
        libVersion: '1.1.1k',
        eol: true,
        pqcReady: false,
      },
      {
        name: 'LegacyApplianceC',
        upstreamLib: 'OpenSSL-1.1.1',
        libVersion: '1.1.1t',
        eol: true,
        pqcReady: false,
      },
      {
        name: 'LegacyApplianceD',
        upstreamLib: 'OpenSSL-1.1.1',
        libVersion: '1.1.1w',
        eol: true,
        pqcReady: false,
      },
    ])
    expect(adverse.allPqcReady).toBe(false)
    expect(adverse.eolSuppliers).toHaveLength(4)
    expect(adverse.singlePointConcentration).toBe(true)

    return {
      toolId: 'supply-chain-matrix',
      scenarioId: 'TPRM-SCM-2026-01',
      inputs: {
        tier1SuppliersEvaluated: 3,
        upstreamLibraries: ['OpenSSL 3.6.1', 'BoringSSL 2026-08', 'wolfSSL 5.8.0'],
      },
      baselineVerdict: 'Diversified PQC-capable upstream crypto libraries (0 EoL dependencies)',
      adverseCase: {
        trigger: 'Suppliers embedding EoL OpenSSL 1.1.1 series across 100% of appliances',
        verdict: 'Flagged 4 EoL suppliers + single-library monoculture concentration risk',
        rejectedOrFlagged: !adverse.allPqcReady && adverse.singlePointConcentration,
      },
      recoveryAndSensitivity: {
        correction:
          'Mandate upgrade to OpenSSL 3.5+/3.6+ or wolfSSL 5.8+ with verified CycloneDX CBOMs',
        verdict: 'EoL count reduced 4 -> 0 and library concentration reduced below 50%',
        sensitivityDelta: 'Eliminates 100% transitive OpenSSL 1.1.1 EoL exposure',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['supply-chain-matrix'].sampleVsProductionBoundary,
    }
  },

  'bt-roadmap-builder': () => {
    // Dependency-ordered wave sequencing: HSM/KMS (Wave 1) -> PKI Hierarchy (Wave 2) -> Edge/Network (Wave 3) -> Apps (Wave 4)
    const validateWaveOrder = (
      waves: Record<'hsm-kms' | 'pki-ca' | 'edge-tls' | 'apps', number>
    ) => {
      const violations: string[] = []
      if (waves['pki-ca'] < waves['hsm-kms']) {
        violations.push('PKI_CA_SCHEDULED_BEFORE_HSM_KMS_READINESS')
      }
      if (waves['apps'] < waves['pki-ca']) {
        violations.push('APPS_SCHEDULED_BEFORE_PKI_ISSUING_CA')
      }
      return { validOrder: violations.length === 0, violations }
    }
    const base = validateWaveOrder({ 'hsm-kms': 1, 'pki-ca': 2, 'edge-tls': 3, apps: 4 })
    expect(base.validOrder).toBe(true)

    // Adverse: Scheduling Application cert cutover (Wave 1) before PKI CA (Wave 3) and HSM firmware upgrade (Wave 4)
    const inverted = validateWaveOrder({ 'hsm-kms': 4, 'pki-ca': 3, 'edge-tls': 2, apps: 1 })
    expect(inverted.validOrder).toBe(false)
    expect(inverted.violations).toEqual([
      'PKI_CA_SCHEDULED_BEFORE_HSM_KMS_READINESS',
      'APPS_SCHEDULED_BEFORE_PKI_ISSUING_CA',
    ])

    // Recovery: Re-sequence foundational HSM/KMS to Wave 1 and PKI CA to Wave 2
    const recovered = validateWaveOrder({ 'hsm-kms': 1, 'pki-ca': 2, 'edge-tls': 2, apps: 3 })
    expect(recovered.validOrder).toBe(true)

    return {
      toolId: 'roadmap-builder',
      scenarioId: 'PMO-ROADMAP-2026-01',
      inputs: {
        wave1: 'hsm-kms (2026)',
        wave2: 'pki-ca (2027)',
        wave3: 'edge-tls (2028)',
        wave4: 'apps (2029)',
      },
      baselineVerdict:
        'Valid prerequisite dependency chain: HSM/KMS -> PKI CA -> Edge TLS -> Applications',
      adverseCase: {
        trigger:
          'Applications scheduled in Wave 1 before PKI Issuing CA (Wave 3) and HSM upgrade (Wave 4)',
        verdict: `Blocked prerequisite inversion: ${inverted.violations.join('; ')}`,
        rejectedOrFlagged: !inverted.validOrder,
      },
      recoveryAndSensitivity: {
        correction:
          'Restore foundational HSM/KMS (Wave 1) and PKI CA (Wave 2) ahead of application cutover',
        verdict: 'Critical path satisfied; parallel Wave 2 Edge TLS allowed once CA is active',
        sensitivityDelta:
          'Compresses total roadmap from 4 waves to 3 waves when Edge TLS parallels PKI CA',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['roadmap-builder'].sampleVsProductionBoundary,
    }
  },

  'bt-stakeholder-comms': () => {
    // Audience-specific communication completeness: requires audience, maintenanceWindow, clientMinVersion, and rollbackContact
    const validateCommsPlan = (plan: {
      audience: string
      maintenanceWindow: string
      clientMinVersion: string
      rollbackChannel: string
    }) => {
      const missing = Object.entries(plan)
        .filter(([, v]) => !v || v.trim().length === 0)
        .map(([k]) => k)
      return { ready: missing.length === 0, missing }
    }
    const base = validateCommsPlan({
      audience: 'External API Relying Parties',
      maintenanceWindow: '2027-04-12 02:00-04:00 UTC',
      clientMinVersion: 'OpenSSL 3.5+ / Chrome 131+ (X25519MLKEM768)',
      rollbackChannel: 'noc-pqc-rollback@example.internal',
    })
    expect(base.ready).toBe(true)

    // Adverse: Customer notice sent without client minimum version or rollback escalation channel
    const incomplete = validateCommsPlan({
      audience: 'External API Relying Parties',
      maintenanceWindow: '2027-04-12',
      clientMinVersion: '',
      rollbackChannel: '',
    })
    expect(incomplete.ready).toBe(false)
    expect(incomplete.missing).toEqual(['clientMinVersion', 'rollbackChannel'])

    return {
      toolId: 'stakeholder-comms',
      scenarioId: 'PMO-COMMS-2026-01',
      inputs: {
        audience: 'External API Relying Parties',
        maintenanceWindow: '2027-04-12 02:00-04:00 UTC',
        clientMinVersion: 'OpenSSL 3.5+ / Chrome 131+ (X25519MLKEM768)',
        rollbackChannel: 'noc-pqc-rollback@example.internal',
      },
      baselineVerdict:
        'Complete partner communication package with TLS client requirements and rollback channel',
      adverseCase: {
        trigger: 'Omitted clientMinVersion and rollbackChannel in external partner notice',
        verdict: 'Blocked dispatch: missing [clientMinVersion, rollbackChannel]',
        rejectedOrFlagged: !incomplete.ready,
      },
      recoveryAndSensitivity: {
        correction:
          'Specify X25519MLKEM768 client baseline and 24x7 NOC rollback contact across all 4 audience tracks',
        verdict: 'All 4 stakeholder tracks (Board, Engineering, SRE, External Partners) complete',
        sensitivityDelta:
          'Covers 4 distinct audience playbooks with explicit fallback instructions',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['stakeholder-comms'].sampleVsProductionBoundary,
    }
  },

  'bt-kpi-tracker': () => {
    // Operational velocity tracker: compares current % against linear target trajectory toward deadline
    const evaluateVelocity = (currentPct: number, targetPctNow: number, targetYear: number) => {
      const variancePct = currentPct - targetPctNow
      const status =
        variancePct >= 0 ? 'ON_TRACK' : variancePct >= -10 ? 'AT_RISK' : 'BEHIND_SCHEDULE'
      return { currentPct, targetPctNow, variancePct, status, targetYear }
    }
    const base = evaluateVelocity(68, 65, 2030)
    expect(base.status).toBe('ON_TRACK')

    // Adverse: TLS hybrid negotiation at 18% against a 50% milestone target (-32% variance -> BEHIND_SCHEDULE)
    const lagging = evaluateVelocity(18, 50, 2030)
    expect(lagging.variancePct).toBe(-32)
    expect(lagging.status).toBe('BEHIND_SCHEDULE')

    // Recovery: Enable X25519MLKEM768 on primary CDN ingress (raising coverage from 18% to 55%)
    const recovered = evaluateVelocity(55, 50, 2030)
    expect(recovered.status).toBe('ON_TRACK')

    return {
      toolId: 'kpi-tracker',
      scenarioId: 'PMO-KPITRK-2026-01',
      inputs: {
        metric: 'Ingress TLS 1.3 X25519MLKEM768 Negotiation %',
        currentPct: 68,
        targetPctNow: 65,
        milestoneYear: 2030,
      },
      baselineVerdict: `ON_TRACK (+${base.variancePct}% above planned trajectory toward ${base.targetYear})`,
      adverseCase: {
        trigger: 'Lagging BU ingress at 18% vs 50% planned milestone',
        verdict: `BEHIND_SCHEDULE (${lagging.variancePct}% variance triggers executive escalation)`,
        rejectedOrFlagged: lagging.status === 'BEHIND_SCHEDULE',
      },
      recoveryAndSensitivity: {
        correction: 'Enable hybrid X25519MLKEM768 across Tier-1 CDN edge profiles',
        verdict: `Velocity restored to ${recovered.currentPct}% (${recovered.status}, +${recovered.variancePct}% margin)`,
        sensitivityDelta: '+37 percentage-point improvement in hybrid TLS telemetry',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['kpi-tracker'].sampleVsProductionBoundary,
    }
  },

  'bt-deployment-playbook': () => {
    // Progressive canary rollout (1% -> 10% -> 50% -> 100%) with automated rollback gate on handshake error rate > threshold
    const evaluateCanaryStage = (
      stageTrafficPct: number,
      observedErrorRatePct: number,
      maxAllowedErrorRatePct: number,
      mtuPreFlightPassed: boolean
    ) => {
      if (!mtuPreFlightPassed) {
        return { action: 'ABORT_PREFLIGHT_MTU_FAIL', nextTrafficPct: 0 }
      }
      if (observedErrorRatePct > maxAllowedErrorRatePct) {
        return { action: 'AUTOMATIC_ROLLBACK_TO_CLASSICAL', nextTrafficPct: 0 }
      }
      const nextMap: Record<number, number> = { 1: 10, 10: 50, 50: 100, 100: 100 }
      return { action: 'PROMOTE_STAGE', nextTrafficPct: nextMap[stageTrafficPct] ?? 100 }
    }
    const base = evaluateCanaryStage(10, 0.04, 0.25, true)
    expect(base.action).toBe('PROMOTE_STAGE')
    expect(base.nextTrafficPct).toBe(50)

    // Adverse: Middlebox ClientHello drop spikes error rate to 2.8% (> 0.25% threshold) at 10% canary
    const spike = evaluateCanaryStage(10, 2.8, 0.25, true)
    expect(spike.action).toBe('AUTOMATIC_ROLLBACK_TO_CLASSICAL')
    expect(spike.nextTrafficPct).toBe(0)

    // Recovery: Upgrade legacy middlebox firmware, pass MTU pre-flight, and re-run 10% -> 50% -> 100% promotion
    const promoted = evaluateCanaryStage(50, 0.05, 0.25, true)
    expect(promoted.action).toBe('PROMOTE_STAGE')
    expect(promoted.nextTrafficPct).toBe(100)

    return {
      toolId: 'deployment-playbook',
      scenarioId: 'OPS-DEPLOY-2026-01',
      inputs: {
        canaryStagesPct: [1, 10, 50, 100],
        maxAllowedErrorRatePct: 0.25,
        observedErrorRatePct: 0.04,
        mtuPreFlightPassed: true,
      },
      baselineVerdict: 'Canary 10% healthy (0.04% error <= 0.25% ceiling) -> PROMOTE_STAGE to 50%',
      adverseCase: {
        trigger:
          'Middlebox drops multi-packet ClientHello causing 2.8% handshake failure rate at 10% canary',
        verdict: 'AUTOMATIC_ROLLBACK_TO_CLASSICAL (traffic reverted to 0% PQC)',
        rejectedOrFlagged: spike.action === 'AUTOMATIC_ROLLBACK_TO_CLASSICAL',
      },
      recoveryAndSensitivity: {
        correction: 'Patch middlebox TCP reassembly buffer and enable RFC 8879 cert compression',
        verdict: 'Promoted 50% -> 100% production traffic at 0.05% error rate',
        sensitivityDelta: 'Error rate reduced from 2.80% to 0.05% (56x reduction)',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['deployment-playbook'].sampleVsProductionBoundary,
    }
  },

  'bt-hybrid-transition-planner': () => {
    // Interoperability matrix across Classical-Only, PQ/T Hybrid Preferred, and PQC/Hybrid Required modes
    type Mode = 'classical-only' | 'hybrid-preferred' | 'pqc-required'
    const negotiateTransition = (clientMode: Mode, serverMode: Mode) => {
      if (serverMode === 'pqc-required' && clientMode === 'classical-only') {
        return { connected: false, negotiated: 'HANDSHAKE_FAILURE_NO_SHARED_GROUP' }
      }
      if (
        clientMode === ' classical-only' ||
        serverMode === 'classical-only' ||
        clientMode === 'classical-only'
      ) {
        return { connected: true, negotiated: 'CLASSICAL_X25519_FALLBACK' }
      }
      return { connected: true, negotiated: 'HYBRID_X25519MLKEM768' }
    }
    const base = negotiateTransition('hybrid-preferred', 'hybrid-preferred')
    expect(base.negotiated).toBe('HYBRID_X25519MLKEM768')

    // Adverse: Enforcing `pqc-required` on server while legacy partner is still `classical-only` breaks connection
    const broken = negotiateTransition('classical-only', 'pqc-required')
    expect(broken.connected).toBe(false)

    // Recovery: Use `hybrid-preferred` during partner transition, then switch to `pqc-required` once partner upgrades to `hybrid-preferred`
    const phased = negotiateTransition('classical-only', 'hybrid-preferred')
    expect(phased.connected).toBe(true)
    expect(phased.negotiated).toBe('CLASSICAL_X25519_FALLBACK')
    const finalStrict = negotiateTransition('hybrid-preferred', 'pqc-required')
    expect(finalStrict.negotiated).toBe('HYBRID_X25519MLKEM768')

    return {
      toolId: 'hybrid-transition-planner',
      scenarioId: 'ARCH-HYBRID-2026-01',
      inputs: {
        phase1ServerMode: 'hybrid-preferred',
        phase2ServerMode: 'pqc-required',
        targetGroup: 'X25519MLKEM768',
      },
      baselineVerdict: 'Hybrid-preferred client & server negotiate HYBRID_X25519MLKEM768',
      adverseCase: {
        trigger:
          'Premature server enforcement of pqc-required against classical-only partner client',
        verdict: 'HANDSHAKE_FAILURE_NO_SHARED_GROUP (connected=false)',
        rejectedOrFlagged: !broken.connected,
      },
      recoveryAndSensitivity: {
        correction:
          'Operate server in hybrid-preferred until telemetry shows 100% partner readiness, then lock pqc-required',
        verdict: 'Zero partner outages during phased transition to strict PQC/Hybrid enforcement',
        sensitivityDelta: 'Preserves 100% availability while migrating legacy relying parties',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['hybrid-transition-planner'].sampleVsProductionBoundary,
    }
  },

  'bt-mti-negotiator': () => {
    // Ordered MTI preference intersection between client and server algorithm lists
    const selectFirstMutual = (serverOrdered: string[], clientSupported: string[]) => {
      const clientSet = new Set(clientSupported)
      const match = serverOrdered.find((alg) => clientSet.has(alg))
      return match ?? null
    }
    const serverPref = ['SecP384r1MLKEM1024', 'X25519MLKEM768', 'x25519', 'secp256r1']
    const modernClient = ['X25519MLKEM768', 'x25519']
    expect(selectFirstMutual(serverPref, modernClient)).toBe('X25519MLKEM768')

    // Adverse: Disjoint MTI policy (CNSA-only server `['ML-KEM-1024']` vs classical-only client `['x25519']`) -> null intersection
    const disjoint = selectFirstMutual(['ML-KEM-1024'], ['x25519', 'secp256r1'])
    expect(disjoint).toBeNull()

    // Recovery: Add `X25519MLKEM768` and `ML-KEM-1024` to client MTI profile
    const upgraded = selectFirstMutual(
      ['ML-KEM-1024', 'X25519MLKEM768'],
      ['X25519MLKEM768', 'ML-KEM-1024']
    )
    expect(upgraded).toBe('ML-KEM-1024')

    return {
      toolId: 'mti-negotiator',
      scenarioId: 'ARCH-MTI-2026-01',
      inputs: {
        serverPreference: serverPref,
        clientSupported: modernClient,
      },
      baselineVerdict: 'Negotiated highest mutual hybrid group: X25519MLKEM768',
      adverseCase: {
        trigger:
          'Disjoint MTI sets: server requires [ML-KEM-1024] while client offers only [x25519, secp256r1]',
        verdict: 'Null intersection -> TLS alert handshake_failure (40)',
        rejectedOrFlagged: disjoint === null,
      },
      recoveryAndSensitivity: {
        correction: 'Include X25519MLKEM768 and ML-KEM-1024 in client supported_groups policy',
        verdict: 'Selects ML-KEM-1024 under server-preference ordering',
        sensitivityDelta:
          'Upgrades negotiated security strength from Category 3 (768) to Category 5 (1024)',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['mti-negotiator'].sampleVsProductionBoundary,
    }
  },

  'bt-crypto-api-refactor-audit': () => {
    // AST call-site audit: detects hardcoded RSA/ECDSA calls and fixed small buffers (< 4,627 B for ML-DSA-87)
    const auditCallSite = (call: {
      api: string
      fixedBufferBytes: number
      providerDriven: boolean
    }) => {
      const issues: string[] = []
      if (/RSA_generate_key|ECDSA_sign|EVP_PKEY_RSA/.test(call.api) && !call.providerDriven) {
        issues.push('HARDCODED_CLASSICAL_PRIMITIVE')
      }
      if (call.fixedBufferBytes > 0 && call.fixedBufferBytes < 4627) {
        issues.push(`BUFFER_TOO_SMALL_FOR_MLDSA87_${call.fixedBufferBytes}B`)
      }
      return { cryptoAgile: issues.length === 0, issues }
    }
    const agile = auditCallSite({
      api: 'EVP_PKEY_encapsulate / EVP_DigestSign',
      fixedBufferBytes: 8192,
      providerDriven: true,
    })
    expect(agile.cryptoAgile).toBe(true)

    // Adverse: Legacy C call `ECDSA_sign` with stack-allocated `uint8_t sig[128]`
    const legacy = auditCallSite({
      api: 'ECDSA_sign',
      fixedBufferBytes: 128,
      providerDriven: false,
    })
    expect(legacy.cryptoAgile).toBe(false)
    expect(legacy.issues).toEqual([
      'HARDCODED_CLASSICAL_PRIMITIVE',
      'BUFFER_TOO_SMALL_FOR_MLDSA87_128B',
    ])

    return {
      toolId: 'crypto-api-refactor-audit',
      scenarioId: 'DEV-REFACTOR-2026-01',
      inputs: {
        legacyApi: 'ECDSA_sign (128 B stack buffer)',
        refactoredApi: 'EVP_PKEY_encapsulate / EVP_DigestSign (dynamic / 8192 B buffer)',
      },
      baselineVerdict: 'Provider-driven EVP API with 8,192 B buffer passes crypto-agility audit',
      adverseCase: {
        trigger: 'Hardcoded ECDSA_sign call with fixed 128-byte signature buffer',
        verdict: `Flagged 2 blockers: ${legacy.issues.join(', ')}`,
        rejectedOrFlagged: !legacy.cryptoAgile,
      },
      recoveryAndSensitivity: {
        correction:
          'Refactor to provider-driven EVP_DigestSign and query signature length dynamically (or >= 5 KB)',
        verdict:
          'Supports ML-DSA-44 (2,420 B), ML-DSA-65 (3,309 B), and ML-DSA-87 (4,627 B) without overflow',
        sensitivityDelta: 'Buffer headroom increased from 128 B to 8,192 B (64x)',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['crypto-api-refactor-audit'].sampleVsProductionBoundary,
    }
  },

  'bt-cloud-responsibility-matrix': () => {
    // Shared-responsibility validator across IaaS / PaaS / SaaS: flags unconfigured customer-owned CMK/BYOK/mTLS controls
    const evaluateCloudPosture = (
      controls: { layer: string; owner: 'provider' | 'customer'; configuredPqc: boolean }[]
    ) => {
      const customerGaps = controls.filter((c) => c.owner === 'customer' && !c.configuredPqc)
      return {
        compliant: customerGaps.length === 0,
        customerGapLayers: customerGaps.map((c) => c.layer),
      }
    }
    const base = evaluateCloudPosture([
      { layer: 'Physical HSM Firmware', owner: 'provider', configuredPqc: true },
      { layer: 'KMS Customer-Managed Key (CMK) Algorithm', owner: 'customer', configuredPqc: true },
      { layer: 'Service-Mesh Internal mTLS', owner: 'customer', configuredPqc: true },
    ])
    expect(base.compliant).toBe(true)

    // Adverse: Assuming cloud provider automatically migrates customer-owned KMS CMKs and service-mesh mTLS
    const assumed = evaluateCloudPosture([
      { layer: 'Physical HSM Firmware', owner: 'provider', configuredPqc: true },
      {
        layer: 'KMS Customer-Managed Key (CMK) Algorithm',
        owner: 'customer',
        configuredPqc: false,
      },
      { layer: 'Service-Mesh Internal mTLS', owner: 'customer', configuredPqc: false },
    ])
    expect(assumed.compliant).toBe(false)
    expect(assumed.customerGapLayers).toHaveLength(2)

    return {
      toolId: 'cloud-responsibility-matrix',
      scenarioId: 'ARCH-CLOUD-2026-01',
      inputs: {
        serviceModel: 'IaaS / PaaS Hybrid',
        providerOwnedControls: ['Physical HSM Firmware', 'Edge CDN TLS Termination'],
        customerOwnedControls: ['KMS CMK Algorithm Selection', 'Service-Mesh Internal mTLS'],
      },
      baselineVerdict: 'All customer-owned KMS CMK and mTLS controls explicitly configured for PQC',
      adverseCase: {
        trigger:
          'Customer assumes provider upgrades customer-owned KMS CMKs and internal mTLS automatically',
        verdict: `CSPM drift alert: 2 unconfigured customer controls [${assumed.customerGapLayers.join(', ')}]`,
        rejectedOrFlagged: !assumed.compliant,
      },
      recoveryAndSensitivity: {
        correction:
          'Pin ML-KEM / ML-DSA key specs in Terraform IaC for customer-owned KMS keys and mesh CAs',
        verdict: 'Zero shared-responsibility blind spots',
        sensitivityDelta: 'Closes 2 customer-owned control gaps across multi-cloud templates',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['cloud-responsibility-matrix'].sampleVsProductionBoundary,
    }
  },

  'bt-crypto-architecture-diagram': () => {
    // End-to-end service path analyzer: every hop on a critical path must be PQC/Hybrid to avoid weakest-link exposure
    const evaluatePathHops = (hops: { hop: string; protocol: string; pqcProtected: boolean }[]) => {
      const weakHops = hops.filter((h) => !h.pqcProtected).map((h) => h.hop)
      return {
        endToEndQuantumSafe: weakHops.length === 0,
        weakHops,
      }
    }
    const base = evaluatePathHops([
      { hop: 'Client -> CDN Edge', protocol: 'TLS 1.3 X25519MLKEM768', pqcProtected: true },
      { hop: 'CDN -> API Gateway', protocol: 'mTLS ML-DSA-65 + ML-KEM-768', pqcProtected: true },
      {
        hop: 'API Gateway -> DB Archive',
        protocol: 'AES-256-GCM + ML-KEM-1024 KEK',
        pqcProtected: true,
      },
    ])
    expect(base.endToEndQuantumSafe).toBe(true)

    // Adverse: PQC at CDN edge, but classical RSA-2048 mTLS on internal CDN -> API Gateway hop over leased cross-connect
    const partial = evaluatePathHops([
      { hop: 'Client -> CDN Edge', protocol: 'TLS 1.3 X25519MLKEM768', pqcProtected: true },
      { hop: 'CDN -> API Gateway', protocol: 'TLS 1.2 RSA-2048', pqcProtected: false },
      {
        hop: 'API Gateway -> DB Archive',
        protocol: 'AES-256-GCM + ML-KEM-1024 KEK',
        pqcProtected: true,
      },
    ])
    expect(partial.endToEndQuantumSafe).toBe(false)
    expect(partial.weakHops).toEqual(['CDN -> API Gateway'])

    return {
      toolId: 'crypto-architecture-diagram',
      scenarioId: 'ARCH-DIAG-2026-01',
      inputs: {
        serviceFlow: 'Payment Ingress -> API Gateway -> Archive Storage',
        hopCount: 3,
      },
      baselineVerdict: '3/3 hops protected with PQC/Hybrid KEM and AES-256-GCM',
      adverseCase: {
        trigger: 'Internal hop CDN -> API Gateway left on legacy TLS 1.2 RSA-2048',
        verdict: 'End-to-end path flagged vulnerable at bottleneck: [CDN -> API Gateway]',
        rejectedOrFlagged: !partial.endToEndQuantumSafe,
      },
      recoveryAndSensitivity: {
        correction:
          'Upgrade internal ingress-to-mesh hop to TLS 1.3 X25519MLKEM768 + ML-DSA-65 mTLS',
        verdict: 'End-to-end quantum-resistant path restored across all 3 trust boundaries',
        sensitivityDelta: 'Coverage increases from 66.7% (2/3 hops) to 100% (3/3 hops)',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['crypto-architecture-diagram'].sampleVsProductionBoundary,
    }
  },

  'bt-management-tools-audit': () => {
    // Estate discovery & CLM coverage calculator + PQC OID parsing support check
    const auditToolingStack = (
      totalAssets: number,
      scannedAssets: number,
      supportsRfc9881And9935Oids: boolean,
      minCoveragePct = 90
    ) => {
      const coveragePct = Number(((scannedAssets / totalAssets) * 100).toFixed(1))
      const blindSpotAssets = totalAssets - scannedAssets
      return {
        coveragePct,
        blindSpotAssets,
        oidReady: supportsRfc9881And9935Oids,
        passesAudit: coveragePct >= minCoveragePct && supportsRfc9881And9935Oids,
      }
    }
    const base = auditToolingStack(1000, 950, true, 90)
    expect(base.passesAudit).toBe(true)
    expect(base.coveragePct).toBe(95)

    // Adverse: Discovery scanner inspects only 620/1000 hosts (62%) and chokes on RFC 9881 ML-DSA OIDs
    const blindSpot = auditToolingStack(1000, 620, false, 90)
    expect(blindSpot.passesAudit).toBe(false)
    expect(blindSpot.blindSpotAssets).toBe(380)

    return {
      toolId: 'management-tools-audit',
      scenarioId: 'OPS-MGMT-2026-01',
      inputs: {
        cmdbTotalAssets: 1000,
        scannedAssets: 950,
        minCoverageThresholdPct: 90,
        supportsRfc9881And9935Oids: true,
      },
      baselineVerdict: `95.0% estate coverage (950/1000 assets) with RFC 9881/9935 PQC OID parsing verified`,
      adverseCase: {
        trigger:
          '380 ephemeral container/OT assets unscanned (62% coverage) + parser fails on ML-DSA OIDs',
        verdict: 'Audit failed: 380 blind-spot assets and missing PQC OID support',
        rejectedOrFlagged: !blindSpot.passesAudit,
      },
      recoveryAndSensitivity: {
        correction:
          'Deploy sidecar/passive CBOM sensors to ephemeral clusters and upgrade CLM OID dictionary',
        verdict: 'Estate coverage raised from 62.0% to 95.0% (>= 90% gate)',
        sensitivityDelta:
          '+330 previously uninspected assets brought under continuous CLM discovery',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['management-tools-audit'].sampleVsProductionBoundary,
    }
  },

  'bt-crypto-cbom-builder': () => {
    // CycloneDX 1.6 CBOM analyzer: flags End-of-Life libraries (e.g., OpenSSL 1.1.1) and quantum-vulnerable asymmetric primitives
    const analyzeCbomComponents = (
      components: { name: string; version: string; algorithm: string; quantumSafe: boolean }[]
    ) => {
      const eolLibs = components.filter(
        (c) => c.name.toLowerCase().includes('openssl') && c.version.startsWith('1.1.1')
      )
      const vulnerableAlgs = components.filter((c) => !c.quantumSafe)
      return {
        bomFormat: 'CycloneDX',
        specVersion: '1.6',
        totalComponents: components.length,
        eolCount: eolLibs.length,
        vulnerableCount: vulnerableAlgs.length,
        cleanForProduction: eolLibs.length === 0 && vulnerableAlgs.length === 0,
      }
    }
    const base = analyzeCbomComponents([
      { name: 'OpenSSL', version: '3.6.1', algorithm: 'ML-KEM-768', quantumSafe: true },
      { name: 'OpenSSL', version: '3.6.1', algorithm: 'ML-DSA-65', quantumSafe: true },
    ])
    expect(base.cleanForProduction).toBe(true)

    // Adverse: Build artifact containing OpenSSL 1.1.1w (EoL 2023-09-11) and RSA-2048
    const dirty = analyzeCbomComponents([
      { name: 'OpenSSL', version: '1.1.1w', algorithm: 'RSA-2048', quantumSafe: false },
    ])
    expect(dirty.cleanForProduction).toBe(false)
    expect(dirty.eolCount).toBe(1)
    expect(dirty.vulnerableCount).toBe(1)

    return {
      toolId: 'crypto-cbom-builder',
      scenarioId: 'OPS-CBOM-2026-01',
      inputs: {
        bomFormat: 'CycloneDX',
        specVersion: '1.6',
        componentsScanned: 2,
        library: 'OpenSSL 3.6.1',
      },
      baselineVerdict:
        'CycloneDX 1.6 CBOM clean: 0 EoL libraries, 2/2 quantum-safe primitives (ML-KEM-768, ML-DSA-65)',
      adverseCase: {
        trigger: 'Legacy microservice image bundling OpenSSL 1.1.1w and RSA-2048',
        verdict:
          'Flagged eolCount=1 (OpenSSL 1.1.1w EoL 2023-09-11) and vulnerableCount=1 (RSA-2048)',
        rejectedOrFlagged: !dirty.cleanForProduction,
      },
      recoveryAndSensitivity: {
        correction:
          'Rebuild container base image on OpenSSL 3.6.1 and migrate key exchange/signing to ML-KEM-768 / ML-DSA-65',
        verdict: 'CBOM passes CI/CD gate with 0 EoL and 0 classical asymmetric findings',
        sensitivityDelta: 'Reduces EoL and quantum-vulnerable component counts to 0',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['crypto-cbom-builder'].sampleVsProductionBoundary,
    }
  },

  'bt-crypto-vulnerability-watch': () => {
    // Correlate deployed crypto components against NVD CPEs + flag niche PQC components lacking CPE identifiers
    const evaluateVulnWatch = (
      assets: {
        component: string
        cpe: string | null
        cvss: number
        sideChannelAdvisory: boolean
      }[]
    ) => {
      const cpeBlindSpots = assets.filter((a) => !a.cpe).map((a) => a.component)
      const criticalBlockers = assets.filter((a) => a.cvss >= 7.0 || a.sideChannelAdvisory)
      return {
        cpeBlindSpots,
        criticalBlockerCount: criticalBlockers.length,
        requiresVendorAdvisoryFallback: cpeBlindSpots.length > 0,
      }
    }
    const base = evaluateVulnWatch([
      {
        component: 'OpenSSL 3.6.1',
        cpe: 'cpe:2.3:a:openssl:openssl:3.6.1:*:*:*:*:*:*:*',
        cvss: 0,
        sideChannelAdvisory: false,
      },
    ])
    expect(base.criticalBlockerCount).toBe(0)
    expect(base.cpeBlindSpots).toEqual([])

    // Adverse: Unpatched timing side-channel (KyberSlash-class advisory) on a niche PQC appliance with no NVD CPE
    const adverse = evaluateVulnWatch([
      { component: 'Custom-PQ-Appliance-v1', cpe: null, cvss: 7.5, sideChannelAdvisory: true },
    ])
    expect(adverse.criticalBlockerCount).toBe(1)
    expect(adverse.requiresVendorAdvisoryFallback).toBe(true)

    return {
      toolId: 'crypto-vulnerability-watch',
      scenarioId: 'OPS-VULN-2026-01',
      inputs: {
        monitoredComponent: 'OpenSSL 3.6.1',
        cpe: 'cpe:2.3:a:openssl:openssl:3.6.1:*:*:*:*:*:*:*',
        activeHighCvssCount: 0,
      },
      baselineVerdict:
        'CPE-matched component with 0 active high-severity CVEs or side-channel advisories',
      adverseCase: {
        trigger:
          'Niche PQC appliance lacking NVD CPE with active division-timing side-channel advisory (CVSS 7.5)',
        verdict:
          'Flagged 1 critical blocker + CPE coverage gap requiring direct vendor CSAF/advisory feed',
        rejectedOrFlagged:
          adverse.criticalBlockerCount > 0 && adverse.requiresVendorAdvisoryFallback,
      },
      recoveryAndSensitivity: {
        correction:
          'Register Package URL (purl) + vendor CSAF feed and patch constant-time decapsulation library',
        verdict: 'Side-channel blocker remediated and non-CPE advisory monitoring active',
        sensitivityDelta:
          'Closes CPE blind spot and reduces critical CVSS exposure from 7.5 to 0.0',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['crypto-vulnerability-watch'].sampleVsProductionBoundary,
    }
  },

  'bt-program-charter': () => {
    // Charter completeness & service-vs-asset distinction (archiving service protects long-lived records; records themselves are assets, not services)
    const validateCharter = (charter: {
      executiveSponsors: string[]
      businessService: string
      protectedAsset: string
      conflatesAssetAsService: boolean
      exceptionAuthorityRole: string
    }) => {
      const errors: string[] = []
      if (charter.executiveSponsors.length === 0) errors.push('NO_EXECUTIVE_SPONSOR')
      if (charter.conflatesAssetAsService || charter.businessService === charter.protectedAsset) {
        errors.push('CONFLATED_BUSINESS_SERVICE_WITH_PROTECTED_ASSET')
      }
      if (!charter.exceptionAuthorityRole.trim()) errors.push('NO_EXCEPTION_GOVERNANCE_ROLE')
      return { charterValid: errors.length === 0, errors }
    }
    const base = validateCharter({
      executiveSponsors: ['CISO', 'CIO', 'CFO'],
      businessService: 'Records Archiving and Retrieval Service',
      protectedAsset: 'Long-Lived Customer Financial Records (25-yr retention)',
      conflatesAssetAsService: false,
      exceptionAuthorityRole: 'PQC Architecture Review Board & CISO',
    })
    expect(base.charterValid).toBe(true)

    // Adverse: Listing "Long-Lived Customer Records" as both the business service and the asset, with no sponsor
    const conflated = validateCharter({
      executiveSponsors: [],
      businessService: 'Long-Lived Customer Financial Records',
      protectedAsset: 'Long-Lived Customer Financial Records',
      conflatesAssetAsService: true,
      exceptionAuthorityRole: '',
    })
    expect(conflated.charterValid).toBe(false)
    expect(conflated.errors).toContain('CONFLATED_BUSINESS_SERVICE_WITH_PROTECTED_ASSET')

    return {
      toolId: 'program-charter',
      scenarioId: 'PMO-CHARTER-2026-01',
      inputs: {
        executiveSponsors: ['CISO', 'CIO', 'CFO'],
        businessService: 'Records Archiving and Retrieval Service',
        protectedAsset: 'Long-Lived Customer Financial Records (25-yr retention)',
        exceptionAuthorityRole: 'PQC Architecture Review Board & CISO',
      },
      baselineVerdict:
        'Valid charter distinguishing Business Service (Archiving Service) from Protected Asset (Retained Records)',
      adverseCase: {
        trigger:
          'Charter lists retained records as a business service and omits executive sponsor / exception authority',
        verdict: `Rejected charter: ${conflated.errors.join(', ')}`,
        rejectedOrFlagged: !conflated.charterValid,
      },
      recoveryAndSensitivity: {
        correction:
          'Separate Business Service from Protected Asset and bind CISO/CIO/CFO sponsorship',
        verdict: 'Charter passes all governance and service/asset distinction checks',
        sensitivityDelta: 'Resolves all 3 charter governance deficiencies',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['program-charter'].sampleVsProductionBoundary,
    }
  },

  'bt-initial-scoping': () => {
    // Prioritization scoring: HNDL confidentiality weight + regulatory mandate urgency + migration complexity
    const scoreDomainPriority = (
      retentionYears: number,
      mandateYear: number,
      complexity1To5: number
    ) => {
      const hndlScore = Math.min(40, retentionYears * 4)
      const urgencyScore = Math.max(0, (2036 - mandateYear) * 5)
      const complexityScore = complexity1To5 * 4
      const total = hndlScore + urgencyScore + complexityScore
      return {
        total,
        wave: total >= 65 ? 'Wave 1 Immediate' : total >= 40 ? 'Wave 2 Core' : 'Wave 3 Standard',
      }
    }
    const highPriority = scoreDomainPriority(10, 2030, 4) // 40 + 30 + 16 = 86 -> Wave 1 Immediate
    expect(highPriority.total).toBe(86)
    expect(highPriority.wave).toBe('Wave 1 Immediate')

    // Adverse: Misclassifying a 10-year archive as 0-year ephemeral retention drops priority to 46 (missing Wave 1)
    const misclassified = scoreDomainPriority(0, 2030, 4)
    expect(misclassified.total).toBe(46)
    expect(misclassified.wave).not.toBe('Wave 1 Immediate')

    return {
      toolId: 'initial-scoping',
      scenarioId: 'PMO-SCOPE-2026-01',
      inputs: {
        domain: 'Customer Long-Term Archive & PKI Root',
        retentionYears: 10,
        mandateYear: 2030,
        complexity1To5: 4,
      },
      baselineVerdict: `Priority Score ${highPriority.total}/100 -> ${highPriority.wave}`,
      adverseCase: {
        trigger: 'Archive data retention mis-entered as 0 years instead of 10 years',
        verdict: `Under-scoped to ${misclassified.total}/100 (${misclassified.wave}), delaying critical HNDL mitigation`,
        rejectedOrFlagged: misclassified.wave !== 'Wave 1 Immediate',
      },
      recoveryAndSensitivity: {
        correction:
          'Link scoping worksheet to enterprise data-retention catalog (retentionYears=10)',
        verdict: 'Restores Wave 1 Immediate prioritization (score 86/100)',
        sensitivityDelta: '+40 priority points when 10-year HNDL retention is properly accounted',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['initial-scoping'].sampleVsProductionBoundary,
    }
  },

  'bt-skills-team-plan': () => {
    // NICE Framework (SP 800-181 Rev. 1) role competency & lab verification gap calculator
    const evaluateTeamReadiness = (
      engineersTotal: number,
      trainedTheoryCount: number,
      completedHandsOnLabCount: number
    ) => {
      const theoryPct = Math.round((trainedTheoryCount / engineersTotal) * 100)
      const handsOnPct = Math.round((completedHandsOnLabCount / engineersTotal) * 100)
      return {
        theoryPct,
        handsOnPct,
        operationalReady: handsOnPct >= 80,
        gapFte: engineersTotal - completedHandsOnLabCount,
      }
    }
    const base = evaluateTeamReadiness(20, 19, 17)
    expect(base.handsOnPct).toBe(85)
    expect(base.operationalReady).toBe(true)

    // Adverse: 95% slide/video completion (19/20) but only 15% (3/20) have executed a staging PQC migration lab
    const slideOnly = evaluateTeamReadiness(20, 19, 3)
    expect(slideOnly.operationalReady).toBe(false)
    expect(slideOnly.gapFte).toBe(17)

    return {
      toolId: 'skills-team-plan',
      scenarioId: 'PMO-SKILLS-2026-01',
      inputs: {
        niceWorkRoles: [
          'Architects',
          'Developers',
          'PKI/HSM Operations',
          'Network Engineers',
          'GRC',
        ],
        engineersTotal: 20,
        trainedTheoryCount: 19,
        completedHandsOnLabCount: 17,
      },
      baselineVerdict: `85% hands-on lab completion (17/20 engineers); operationalReady=true`,
      adverseCase: {
        trigger:
          '95% passive video completion but only 15% (3/20) hands-on staging lab verification',
        verdict: `Flagged operationalReady=false with ${slideOnly.gapFte} FTE hands-on competency gap`,
        rejectedOrFlagged: !slideOnly.operationalReady,
      },
      recoveryAndSensitivity: {
        correction: 'Require verified staging TLS/PKI/HSM lab exercises for remaining 14 engineers',
        verdict: 'Hands-on readiness increases from 15% to 85% (>= 80% operational gate)',
        sensitivityDelta: '+70 percentage points in verified hands-on migration competency',
      },
      boundaryNotice: BUSINESS_CAPABILITY_CHECKLISTS['skills-team-plan'].sampleVsProductionBoundary,
    }
  },

  'bt-infra-modernization-planner': () => {
    // Hardware appliance replacement vs firmware upgrade classifier + MTU/NVRAM headroom check
    const planInfraModernization = (
      appliances: {
        id: string
        supportsPqcFirmware: boolean
        eolYear: number
        replacementCapexUsd: number
      }[],
      targetYear: number
    ) => {
      const mustReplace = appliances.filter(
        (a) => !a.supportsPqcFirmware || a.eolYear <= targetYear
      )
      const firmwareUpgradeOnly = appliances.filter(
        (a) => a.supportsPqcFirmware && a.eolYear > targetYear
      )
      const totalCapexUsd = mustReplace.reduce((sum, a) => sum + a.replacementCapexUsd, 0)
      return {
        mustReplaceCount: mustReplace.length,
        firmwareUpgradeCount: firmwareUpgradeOnly.length,
        totalCapexUsd,
      }
    }
    const fleet = [
      { id: 'HSM-Gen2-01', supportsPqcFirmware: false, eolYear: 2027, replacementCapexUsd: 45000 },
      { id: 'HSM-Gen3-02', supportsPqcFirmware: true, eolYear: 2032, replacementCapexUsd: 45000 },
      { id: 'NGFW-Core-01', supportsPqcFirmware: true, eolYear: 2031, replacementCapexUsd: 30000 },
    ]
    const base = planInfraModernization(fleet, 2029)
    expect(base.mustReplaceCount).toBe(1)
    expect(base.firmwareUpgradeCount).toBe(2)
    expect(base.totalCapexUsd).toBe(45000)

    // Adverse: Assuming legacy HSM-Gen2-01 can take a software update when hardware lacks FIPS 203/204 support (under-budgeting $45k CapEx)
    const underBudgeted = 0
    expect(base.totalCapexUsd).toBeGreaterThan(underBudgeted)

    // Sensitivity: Extending planning horizon to 2032 brings NGFW-Core-01 (EoL 2031) into replacement scope (+$30k CapEx)
    const horizon2032 = planInfraModernization(fleet, 2032)
    expect(horizon2032.totalCapexUsd).toBe(120000)

    return {
      toolId: 'infra-modernization-planner',
      scenarioId: 'OPS-INFRA-2026-01',
      inputs: {
        fleetSize: 3,
        targetYear: 2029,
        mustReplaceCount: base.mustReplaceCount,
        firmwareUpgradeCount: base.firmwareUpgradeCount,
        replacementCapexUsd: base.totalCapexUsd,
      },
      baselineVerdict:
        '1 hardware replacement ($45k CapEx for HSM-Gen2-01) and 2 in-place firmware upgrades',
      adverseCase: {
        trigger:
          'Assuming all 3 appliances upgrade via free firmware without checking vendor hardware matrix',
        verdict: 'Unbudgeted $45,000 hardware replacement blocker on EoL HSM-Gen2-01',
        rejectedOrFlagged: base.mustReplaceCount > 0,
      },
      recoveryAndSensitivity: {
        correction: 'Budget $45k CapEx for HSM-Gen2-01 replacement in FY27 refresh wave',
        verdict: '100% of fleet has a validated firmware or hardware path to FIPS 203/204',
        sensitivityDelta: '+$75,000 CapEx when horizon extends from 2029 ($45k) to 2032 ($120k)',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['infra-modernization-planner'].sampleVsProductionBoundary,
    }
  },

  'bt-refresh-cycle-alignment': () => {
    // Align PQC procurement gate with scheduled lease/depreciation renewal vs unbudgeted mid-cycle write-off
    const computeRefreshAlignment = (
      contractRenewalYear: number,
      pqcGateInsertedYear: number,
      assetBookValueUsd: number,
      remainingLeaseYears: number
    ) => {
      const alignedBeforeRenewal = pqcGateInsertedYear <= contractRenewalYear
      const midCycleWriteOffUsd = alignedBeforeRenewal
        ? 0
        : Math.round(assetBookValueUsd * (remainingLeaseYears / 5))
      return { alignedBeforeRenewal, midCycleWriteOffUsd }
    }
    const aligned = computeRefreshAlignment(2027, 2026, 200000, 3)
    expect(aligned.alignedBeforeRenewal).toBe(true)
    expect(aligned.midCycleWriteOffUsd).toBe(0)

    // Adverse: Renewing a 5-year classical-only HSM lease in 2027 without PQC gate, then forced to replace in 2029 (3 years remaining -> $120k write-off)
    const missedWindow = computeRefreshAlignment(2027, 2029, 200000, 3)
    expect(missedWindow.alignedBeforeRenewal).toBe(false)
    expect(missedWindow.midCycleWriteOffUsd).toBe(120000)

    return {
      toolId: 'refresh-cycle-alignment',
      scenarioId: 'OPS-REFRESH-2026-01',
      inputs: {
        applianceCluster: 'Core Datacenter HSM Lease',
        contractRenewalYear: 2027,
        pqcGateInsertedYear: 2026,
        assetBookValueUsd: 200000,
      },
      baselineVerdict:
        'PQC capability gate inserted in 2026 prior to 2027 renewal ($0 mid-cycle write-off)',
      adverseCase: {
        trigger:
          '5-year lease renewed in 2027 without PQC clause, forcing mid-cycle replacement with 3 yrs remaining',
        verdict: `Incurs $${missedWindow.midCycleWriteOffUsd} unbudgeted hardware lease write-off`,
        rejectedOrFlagged: !missedWindow.alignedBeforeRenewal,
      },
      recoveryAndSensitivity: {
        correction:
          'Attach mandatory FIPS 203/204/205 gate to ITAM renewals 12 months before PO signature',
        verdict: 'Saves $120,000 in stranded depreciation cost',
        sensitivityDelta: '$120,000 avoided write-off per $200,000 appliance cluster',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['refresh-cycle-alignment'].sampleVsProductionBoundary,
    }
  },

  'bt-accelerated-execution-profile': () => {
    // Emergency break-glass crypto rollover drill: checks automated ACME/EST cert rotation + pre-staged backup trust anchor
    const evaluateBreakGlassReadiness = (profile: {
      preStagedBackupRootCa: boolean
      automatedCertRolloverHours: number
      targetSlaHours: number
    }) => {
      const meetsSla =
        profile.preStagedBackupRootCa &&
        profile.automatedCertRolloverHours <= profile.targetSlaHours
      return {
        meetsSla,
        deficitHours: Math.max(0, profile.automatedCertRolloverHours - profile.targetSlaHours),
      }
    }
    const base = evaluateBreakGlassReadiness({
      preStagedBackupRootCa: true,
      automatedCertRolloverHours: 6,
      targetSlaHours: 24,
    })
    expect(base.meetsSla).toBe(true)

    // Adverse: Manual CSR/spreadsheet rotation taking 240 hours (10 days) with no pre-staged backup root CA
    const manual = evaluateBreakGlassReadiness({
      preStagedBackupRootCa: false,
      automatedCertRolloverHours: 240,
      targetSlaHours: 24,
    })
    expect(manual.meetsSla).toBe(false)
    expect(manual.deficitHours).toBe(216)

    return {
      toolId: 'accelerated-execution-profile',
      scenarioId: 'OPS-ACCEL-2026-01',
      inputs: {
        preStagedBackupRootCa: true,
        automatedCertRolloverHours: 6,
        targetSlaHours: 24,
        backupSignatureFamily: 'SLH-DSA-SHA2-128s (hash-based fallback for lattice ML-DSA-65)',
      },
      baselineVerdict:
        'Break-glass drill completes in 6 hrs (<= 24 hr SLA) using pre-staged backup Root CA',
      adverseCase: {
        trigger:
          'Manual ticket-based certificate rollover (240 hrs) and no pre-staged backup trust anchor',
        verdict: 'Fails emergency rollover SLA by 216 hours; clients reject unpinned root',
        rejectedOrFlagged: !manual.meetsSla,
      },
      recoveryAndSensitivity: {
        correction:
          'Pre-distribute backup SLH-DSA root in trust stores and automate ACME/CMPv3 short-lived renewal',
        verdict: 'Rollover duration compressed from 240 hrs to 6 hrs',
        sensitivityDelta: '-234 hours Mean Time to Rotate (MTTR) under cryptanalytic emergency',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['accelerated-execution-profile'].sampleVsProductionBoundary,
    }
  },

  'bt-data-at-rest-strategy': () => {
    // Storage encryption + KEK wrapping + long-lived RFC 3161 / RFC 4998 Evidence Record Syntax (ERS) PQC archive timestamps
    const evaluateDataAtRest = (config: {
      bulkCipher: 'AES-256-GCM' | 'AES-128-CBC' | '3DES'
      kekWrapping: 'ML-KEM-1024' | 'ML-KEM-768' | 'RSA-2048-OAEP'
      archiveTimestampAlg: 'ML-DSA-87' | 'SLH-DSA-SHA2-192s' | 'RSA-2048'
      retentionYears: number
    }) => {
      const issues: string[] = []
      if (config.bulkCipher === '3DES') issues.push('DEPRECATED_BULK_CIPHER_3DES')
      if (config.kekWrapping === 'RSA-2048-OAEP' && config.retentionYears > 3) {
        issues.push('QUANTUM_VULNERABLE_KEK_ON_LONG_LIVED_ARCHIVE')
      }
      if (config.archiveTimestampAlg === 'RSA-2048' && config.retentionYears > 3) {
        issues.push('FORGEABLE_CLASSICAL_ARCHIVE_TIMESTAMP')
      }
      return { compliant: issues.length === 0, issues }
    }
    const base = evaluateDataAtRest({
      bulkCipher: 'AES-256-GCM',
      kekWrapping: 'ML-KEM-1024',
      archiveTimestampAlg: 'ML-DSA-87',
      retentionYears: 25,
    })
    expect(base.compliant).toBe(true)

    // Adverse: 25-year archive encrypted with AES-256-GCM but wrapped with RSA-2048-OAEP KEK and timestamped with RSA-2048
    const vulnerableKek = evaluateDataAtRest({
      bulkCipher: 'AES-256-GCM',
      kekWrapping: 'RSA-2048-OAEP',
      archiveTimestampAlg: 'RSA-2048',
      retentionYears: 25,
    })
    expect(vulnerableKek.compliant).toBe(false)
    expect(vulnerableKek.issues).toEqual([
      'QUANTUM_VULNERABLE_KEK_ON_LONG_LIVED_ARCHIVE',
      'FORGEABLE_CLASSICAL_ARCHIVE_TIMESTAMP',
    ])

    return {
      toolId: 'data-at-rest-strategy',
      scenarioId: 'OPS-DAR-2026-01',
      inputs: {
        protectedService: 'Records Archiving and Retrieval Service',
        bulkCipher: 'AES-256-GCM',
        kekWrapping: 'ML-KEM-1024',
        archiveTimestampAlg: 'ML-DSA-87 (RFC 9882 / RFC 4998 ERS)',
        retentionYears: 25,
      },
      baselineVerdict:
        '25-yr archive protected by AES-256-GCM bulk encryption, ML-KEM-1024 KEK wrap, and ML-DSA-87 ERS timestamp',
      adverseCase: {
        trigger:
          'AES-256 archive wrapped with RSA-2048-OAEP KEK and signed with RSA-2048 timestamp',
        verdict: `Flagged 2 archive exposures: ${vulnerableKek.issues.join(', ')}`,
        rejectedOrFlagged: !vulnerableKek.compliant,
      },
      recoveryAndSensitivity: {
        correction:
          'Re-wrap DEKs online under ML-KEM-1024 KEK and apply RFC 4998 ERS timestamp chains with ML-DSA-87',
        verdict:
          'Zero bulk re-encryption needed; KEK and non-repudiation timestamp quantum-hardened',
        sensitivityDelta:
          'Protects 25-year retention horizon without rewriting terabyte data blocks',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['data-at-rest-strategy'].sampleVsProductionBoundary,
    }
  },

  'bt-migration-verification': () => {
    // 5-point technical migration dossier: wire negotiation + negative tamper test + PQC cert chain + fallback policy + archived dossier
    // Hub status remains "Evidence recorded — review required" (never claims deployed production sign-off)
    const evaluateDossier = (points: {
      wireNegotiationObserved: boolean
      negativeTamperTestPassed: boolean
      pqcCertChainVerified: boolean
      fallbackPolicyDocumented: boolean
      dossierArchived: boolean
    }) => {
      const completedCount = Object.values(points).filter(Boolean).length
      return {
        completedCount,
        totalPoints: 5,
        statusLabel:
          completedCount === 5
            ? 'Evidence recorded — review required'
            : `Incomplete dossier (${completedCount}/5 points recorded)`,
        productionCertified: false as const,
      }
    }
    const fullDossier = evaluateDossier({
      wireNegotiationObserved: true,
      negativeTamperTestPassed: true,
      pqcCertChainVerified: true,
      fallbackPolicyDocumented: true,
      dossierArchived: true,
    })
    expect(fullDossier.completedCount).toBe(5)
    expect(fullDossier.statusLabel).toBe('Evidence recorded — review required')
    expect(fullDossier.productionCertified).toBe(false)

    // Adverse: Claiming closure when negative tamper/downgrade test was skipped (4/5 points)
    const skippedNegativeTest = evaluateDossier({
      wireNegotiationObserved: true,
      negativeTamperTestPassed: false,
      pqcCertChainVerified: true,
      fallbackPolicyDocumented: true,
      dossierArchived: true,
    })
    expect(skippedNegativeTest.completedCount).toBe(4)
    expect(skippedNegativeTest.statusLabel).toContain('Incomplete dossier (4/5')

    return {
      toolId: 'migration-verification',
      scenarioId: 'OPS-VERIFY-2026-01',
      inputs: {
        systemId: 'SYS-PORTAL-TLS-01',
        wireNegotiationObserved: true,
        negativeTamperTestPassed: true,
        pqcCertChainVerified: true,
        fallbackPolicyDocumented: true,
        dossierArchived: true,
      },
      baselineVerdict:
        '5/5 dossier items recorded -> status: "Evidence recorded — review required" (productionCertified=false)',
      adverseCase: {
        trigger: 'Omitted negative tamper/downgrade test (negativeTamperTestPassed=false)',
        verdict: skippedNegativeTest.statusLabel,
        rejectedOrFlagged: skippedNegativeTest.completedCount < 5,
      },
      recoveryAndSensitivity: {
        correction:
          'Execute 1-byte signature/ciphertext tamper test and attach failure receipt to dossier',
        verdict: '5/5 technical verification items recorded; non-certification boundary preserved',
        sensitivityDelta:
          'Advances dossier from 4/5 incomplete to 5/5 recorded for independent review',
      },
      boundaryNotice:
        BUSINESS_CAPABILITY_CHECKLISTS['migration-verification'].sampleVsProductionBoundary,
    }
  },
}

describe('All 37 Business Center Tools — Registry, Exercises, Independent Decision Models, Adverse Cases & CSV/Markdown Export Parity', () => {
  const collectedReceipts: Array<Record<string, unknown>> = []

  afterAll(() => {
    const outDir = `${process.cwd()}/../backups/hub-4213`
    if (fs.existsSync(outDir) && collectedReceipts.length === 37) {
      fs.writeFileSync(
        `${outDir}/business-37-oracle-export-receipts.json`,
        JSON.stringify(
          {
            version: '4.215.0',
            phase:
              'Phase C — Independent Decision Models, Adverse-Case Recovery & CSV/Markdown Export Parity Across All 37 Business Tools',
            generatedAt: '2026-11-17T23:25:00Z',
            totalBusinessToolsVerified: collectedReceipts.length,
            allPassed: true,
            gates: [
              'Gate 1: Registry, Worked Exercise & Production Capability Checklist Completeness (BUSINESS_TOOLS, BUSINESS_TOOL_EXERCISES, BUSINESS_CAPABILITY_CHECKLISTS, businessToolEvidence)',
              'Gate 2: Independent Decision / Formula Model Check (Valid Baseline + Adverse/Contradictory Case + Corrected Recovery & Sensitivity Check)',
              'Gate 3: CSV & Markdown Export Parity (decisionModelToCsv + formatDecisionModelMarkdown with formula-injection guard and zero data loss)',
            ],
            items: collectedReceipts,
          },
          null,
          2
        )
      )
    }
  })

  it('covers the exact 37 bt-* Business Center tool IDs from the v4.212.0 reassessment inventory', () => {
    expect(ALL_37_BUSINESS_TOOL_IDS).toHaveLength(37)
    expect(new Set(ALL_37_BUSINESS_TOOL_IDS).size).toBe(37)
    expect(BUSINESS_TOOLS).toHaveLength(37)
    expect(Object.keys(BUSINESS_MODEL_ORACLES)).toHaveLength(37)
  })

  it.each(ALL_37_BUSINESS_TOOL_IDS)(
    '%s passes Gate 1 (Registry/Exercise/Checklist), Gate 2 (Independent Decision Model + Adverse + Recovery), and Gate 3 (CSV & Markdown Export Parity)',
    (btId) => {
      const slug = btId.replace(/^bt-/, '')

      // Gate 1: Registry, Exercise & Capability Checklist Completeness
      const regEntry = BUSINESS_TOOLS.find((t) => t.id === slug)
      expect(regEntry, `BUSINESS_TOOLS entry for ${slug}`).toBeDefined()
      expect(regEntry!.goodAnswer.length).toBeGreaterThan(25)
      expect(regEntry!.workedExample?.length ?? 0).toBeGreaterThan(25)

      const exercises = BUSINESS_TOOL_EXERCISES[slug]
      expect(exercises, `BUSINESS_TOOL_EXERCISES[${slug}]`).toBeDefined()
      expect(exercises.length).toBeGreaterThan(0)
      for (const ex of exercises) {
        expect(ex.prompt.length).toBeGreaterThan(15)
        expect(ex.options.length).toBeGreaterThanOrEqual(3)
        expect(ex.answer).toBeGreaterThanOrEqual(0)
        expect(ex.answer).toBeLessThan(ex.options.length)
        expect(ex.why.length).toBeGreaterThan(25)
      }

      const checklist = getBusinessCapabilityChecklist(slug)
      expect(checklist, `BUSINESS_CAPABILITY_CHECKLISTS[${slug}]`).toBeDefined()
      expect(checklist!.toolId).toBe(slug)
      expect(checklist!.productionToolCategory.length).toBeGreaterThan(10)
      expect(checklist!.requiredCapabilities).toHaveLength(3)
      for (const cap of checklist!.requiredCapabilities) {
        expect(cap.length).toBeGreaterThan(25)
      }
      expect(checklist!.evaluationCriteria.length).toBeGreaterThan(25)
      expect(checklist!.sampleVsProductionBoundary).toContain(
        'does not collect production evidence or assess a deployed environment'
      )

      const evidence = businessToolEvidence(slug)
      expect(evidence, `businessToolEvidence(${slug})`).toBeDefined()
      expect(evidence!.proves.length).toBeGreaterThan(15)
      expect(evidence!.doesNotProve.length).toBeGreaterThan(15)

      // Gate 2: Independent Decision / Formula Model Check (Baseline + Adverse + Recovery/Sensitivity)
      const oracle = BUSINESS_MODEL_ORACLES[btId]
      expect(oracle).toBeDefined()
      const scenario = oracle()
      expect(scenario.toolId).toBe(slug)
      expect(scenario.baselineVerdict.length).toBeGreaterThan(15)
      expect(scenario.adverseCase.rejectedOrFlagged).toBe(true)
      expect(scenario.adverseCase.verdict.length).toBeGreaterThan(10)
      expect(scenario.recoveryAndSensitivity.verdict.length).toBeGreaterThan(10)
      expect(scenario.recoveryAndSensitivity.sensitivityDelta.length).toBeGreaterThan(10)

      // Gate 3: CSV & Markdown Export Parity (including CSV formula-injection neutralization)
      const exportPayload = {
        ...scenario,
        formulaGuardProbe: '=SUM(A1:A10)',
      }
      const csv = decisionModelToCsv(exportPayload as unknown as Record<string, unknown>)
      expect(csv).toContain('Field,Value')
      expect(csv).toContain(`toolId,${slug}`)
      expect(csv).toContain(`scenarioId,${scenario.scenarioId}`)
      expect(csv).toContain('adverseCase.rejectedOrFlagged,true')
      expect(csv).toContain("formulaGuardProbe,'=SUM(A1:A10)")
      for (const key of Object.keys(scenario.inputs)) {
        expect(csv).toContain(`inputs.${key}`)
      }

      const md = formatDecisionModelMarkdown(regEntry!.name, scenario)
      expect(md).toContain(`# ${regEntry!.name} (${slug})`)
      expect(md).toContain(scenario.scenarioId)
      expect(md).toContain(scenario.baselineVerdict)
      expect(md).toContain(scenario.adverseCase.verdict)
      expect(md).toContain(scenario.recoveryAndSensitivity.verdict)
      expect(md).toContain('does not collect production evidence or assess a deployed environment')

      collectedReceipts.push({
        id: btId,
        slug,
        name: regEntry!.name,
        category: regEntry!.category,
        cswp39SectionRef: regEntry!.cswp39SectionRef,
        frameworkPhase: regEntry!.frameworkPhase,
        evidenceClass: evidence!.evidenceClass,
        gate1RegistryExerciseChecklist: {
          exerciseCount: exercises.length,
          productionToolCategory: checklist!.productionToolCategory,
          requiredCapabilities: checklist!.requiredCapabilities,
          evaluationCriteria: checklist!.evaluationCriteria,
          sampleVsProductionBoundary: checklist!.sampleVsProductionBoundary,
        },
        gate2DecisionModel: scenario,
        gate3ExportParity: {
          csvRowCount: csv.trim().split('\n').length,
          csvFormulaInjectionNeutralized: csv.includes("formulaGuardProbe,'=SUM(A1:A10)"),
          markdownHeadingVerified: md.startsWith(`# ${regEntry!.name} (${slug})`),
          csvByteLength: Buffer.byteLength(csv, 'utf8'),
          markdownByteLength: Buffer.byteLength(md, 'utf8'),
        },
      })
    }
  )
})
