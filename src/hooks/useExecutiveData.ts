import { useMemo } from 'react'
import { threatsData } from '../data/threatsData'
import { algorithmsData } from '../data/algorithmsData'
import { softwareData } from '../data/migrateData'

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
  topActions: PriorityAction[]
  riskNarrative: string
}

export function useExecutiveData(): ExecutiveMetrics {
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

    // Generate priority actions from real data
    const topActions: PriorityAction[] = []

    // Action 1: If there are critical threats
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

    // Action 2: Algorithm migration
    if (algorithmsAtRisk > 0) {
      topActions.push({
        priority: 2,
        action: `Migrate ${algorithmsAtRisk} classical algorithms to PQC equivalents`,
        affectedSystems: 'TLS, PKI, Code Signing',
        deadline: 'Before 2030 (NIST)',
        link: '/algorithms',
      })
    }

    // Action 3: Software inventory
    topActions.push({
      priority: 3,
      action: 'Evaluate PQC-ready software from the migration database',
      affectedSystems: `${migrationToolsAvailable} tools available`,
      deadline: 'Q2 2026',
      link: '/migrate',
    })

    // Action 4: Compliance preparation
    topActions.push({
      priority: 4,
      action: 'Review FIPS 203/204/205 compliance requirements',
      affectedSystems: 'Federal systems, regulated industries',
      deadline: '2025-2030',
      link: '/compliance',
    })

    // Action 5: Team training
    topActions.push({
      priority: 5,
      action: 'Build PQC awareness with team training',
      affectedSystems: 'Engineering & security teams',
      deadline: 'Ongoing',
      link: '/learn',
    })

    // Generate narrative
    const riskNarrative = `Your organization faces ${criticalThreats} critical or high-severity quantum threats across ${new Set(threatsData.map((t) => t.industry)).size} industries. ${algorithmsAtRisk} cryptographic algorithms in common use require migration to post-quantum alternatives before NIST's 2030 deprecation target. ${migrationToolsAvailable} PQC-ready software tools are available to support your transition.`

    return {
      algorithmsAtRisk,
      totalAlgorithms,
      criticalThreats,
      totalThreats,
      migrationToolsAvailable,
      topActions,
      riskNarrative,
    }
  }, [])
}
