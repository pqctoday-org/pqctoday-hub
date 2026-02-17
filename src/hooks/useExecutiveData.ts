import { useMemo } from 'react'
import { threatsData } from '../data/threatsData'
import { algorithmsData } from '../data/algorithmsData'
import { softwareData } from '../data/migrateData'
import type { ComplianceRecord } from '../components/Compliance/types'
import type { AssessmentResult } from './useAssessmentEngine'

export interface PriorityAction {
  priority: number
  action: string
  affectedSystems: string
  deadline: string
  link: string
}

export interface ExecutiveMetrics {
  algorithmsAtRisk: number
  totalAlgorithms: number
  criticalThreats: number
  totalThreats: number
  migrationToolsAvailable: number
  activeStandards: number
  topActions: PriorityAction[]
  riskNarrative: string
  orgRiskScore: number | null
  orgRiskLevel: AssessmentResult['riskLevel'] | null
}

export function useExecutiveData(
  complianceData?: ComplianceRecord[],
  assessmentResult?: AssessmentResult | null
): ExecutiveMetrics {
  return useMemo(() => {
    // Count algorithms that still require migration
    const totalAlgorithms = algorithmsData.length
    const algorithmsAtRisk = algorithmsData.filter(
      (a) => a.classical && a.classical !== 'N/A'
    ).length

    // Count critical/high threats
    const totalThreats = threatsData.length
    const criticalThreats = threatsData.filter(
      (t) => t.criticality === 'Critical' || t.criticality === 'High'
    ).length

    // Count migration tools
    const migrationToolsAvailable = softwareData.length

    // Count distinct active compliance framework types
    const activeStandards = complianceData?.length
      ? new Set(complianceData.filter((r) => r.status === 'Active').map((r) => r.type)).size
      : 3 // Fallback: FIPS 203/204/205

    // Generate priority actions — use assessment recommendations if available
    const topActions: PriorityAction[] = []

    if (assessmentResult) {
      // Map assessment recommended actions to priority actions
      assessmentResult.recommendedActions.slice(0, 5).forEach((rec, i) => {
        const linkMap: Record<string, string> = {
          immediate: '/algorithms',
          'short-term': '/migrate',
          'long-term': '/learn',
        }
        topActions.push({
          priority: i + 1,
          action: rec.action,
          affectedSystems: rec.relatedModule || rec.category,
          deadline:
            rec.category === 'immediate'
              ? 'Immediate'
              : rec.category === 'short-term'
                ? 'Q2 2026'
                : 'Ongoing',
          link: linkMap[rec.category] || '/assess',
        })
      })
    } else {
      // Fallback: static priority actions from aggregated data
      if (criticalThreats > 0) {
        const topThreat = threatsData.find((t) => t.criticality === 'Critical')
        topActions.push({
          priority: 1,
          action: 'Address critical quantum threats in your infrastructure',
          affectedSystems: topThreat?.industry || 'Multiple sectors',
          deadline: 'Immediate',
          link: '/threats',
        })
      }

      if (algorithmsAtRisk > 0) {
        topActions.push({
          priority: 2,
          action: `Migrate ${algorithmsAtRisk} classical algorithms to PQC equivalents`,
          affectedSystems: 'TLS, PKI, Code Signing',
          deadline: 'Before 2030 (NIST)',
          link: '/algorithms',
        })
      }

      topActions.push({
        priority: 3,
        action: 'Evaluate PQC-ready software from the migration database',
        affectedSystems: `${migrationToolsAvailable} tools available`,
        deadline: 'Q2 2026',
        link: '/migrate',
      })

      topActions.push({
        priority: 4,
        action: 'Review FIPS 203/204/205 compliance requirements',
        affectedSystems: 'Federal systems, regulated industries',
        deadline: '2025-2030',
        link: '/compliance',
      })

      topActions.push({
        priority: 5,
        action: 'Build PQC awareness with team training',
        affectedSystems: 'Engineering & security teams',
        deadline: 'Ongoing',
        link: '/learn',
      })
    }

    // Generate narrative
    const industryCount = new Set(threatsData.map((t) => t.industry)).size
    let riskNarrative = `Your organization faces ${criticalThreats} critical or high-severity quantum threats across ${industryCount} industries. ${algorithmsAtRisk} cryptographic algorithms in common use require migration to post-quantum alternatives before NIST's 2030 deprecation target. ${migrationToolsAvailable} PQC-ready software tools are available to support your transition.`

    if (assessmentResult) {
      riskNarrative += ` ${assessmentResult.narrative}`
    }

    return {
      algorithmsAtRisk,
      totalAlgorithms,
      criticalThreats,
      totalThreats,
      migrationToolsAvailable,
      activeStandards,
      topActions,
      riskNarrative,
      orgRiskScore: assessmentResult?.riskScore ?? null,
      orgRiskLevel: assessmentResult?.riskLevel ?? null,
    }
  }, [complianceData, assessmentResult])
}
