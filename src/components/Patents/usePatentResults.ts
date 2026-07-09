// SPDX-License-Identifier: GPL-3.0-only
/**
 * usePatentResults — the shared Explore filter + sort pipeline.
 *
 * Lifted verbatim from PatentsTable so it is the single source of truth for BOTH
 * the table render and the redesign orchestrator (which needs the same ordered
 * list for the live "N of M" count and the detail drawer's prev/next nav). The
 * `pqc` and `fips` filters are additive (used by the redesign's leaderboard / KPI
 * drill-downs); legacy never sets them, so legacy behaviour is unchanged.
 */
import { useMemo } from 'react'
import type { PatentItem } from '@/types/PatentTypes'
import type { SortKey, SortDir } from './PatentsTable'
import { inferRegion } from './PatentsInsights'

export function filterPatents(patents: PatentItem[], params: URLSearchParams): PatentItem[] {
  const q = (params.get('search') ?? '').toLowerCase()
  const assigneeF = params.get('assignee') ?? ''
  const agilityF = params.get('agility') ?? ''
  const domainF = params.get('domain') ?? ''
  const impactF = params.get('impact') ?? ''
  const quantumTechF = params.get('quantumTech') ?? ''
  const quantumRelevanceF = params.get('quantumRelevance') ?? ''
  const regionF = params.get('region') ?? ''
  const protocolF = params.get('protocol') ?? ''
  const classicalAlgorithmF = params.get('classicalAlgorithm') ?? ''
  const hardwareComponentF = params.get('hardwareComponent') ?? ''
  const nistStatusF = params.get('nistStatus') ?? ''
  const pqcF = params.get('pqc') ?? ''
  const fipsF = params.get('fips') ?? ''
  const filingYearF = params.get('filingYear') ?? ''

  return patents.filter((p) => {
    if (
      q &&
      !p.title.toLowerCase().includes(q) &&
      !p.summary.toLowerCase().includes(q) &&
      !p.primaryInventiveClaim.toLowerCase().includes(q) &&
      !p.assignee.toLowerCase().includes(q) &&
      !p.patentNumber.toLowerCase().includes(q)
    )
      return false
    if (assigneeF && p.assignee !== assigneeF) return false
    if (agilityF && p.cryptoAgilityMode !== agilityF) return false
    if (domainF && !p.applicationDomain.includes(domainF)) return false
    if (impactF && p.impactLevel !== impactF) return false
    if (quantumTechF && !p.quantumTechnology.includes(quantumTechF)) return false
    if (quantumRelevanceF && p.quantumRelevance !== quantumRelevanceF) return false
    if (regionF && inferRegion(p.assignee) !== regionF) return false
    if (protocolF && !p.protocols.includes(protocolF)) return false
    if (classicalAlgorithmF && !p.classicalAlgorithms.includes(classicalAlgorithmF)) return false
    if (hardwareComponentF && !p.hardwareComponents.includes(hardwareComponentF)) return false
    if (nistStatusF && !p.nistRoundStatus.some((n) => n.status === nistStatusF)) return false
    // Redesign-only filters (legacy never sets these params):
    if (pqcF && !p.pqcAlgorithms.includes(pqcF)) return false
    if (fipsF && !p.nistRoundStatus.some((n) => n.status.startsWith('fips_'))) return false
    if (filingYearF && p.filingYear !== Number(filingYearF)) return false
    return true
  })
}

export function sortPatents(
  patents: PatentItem[],
  sortKey: SortKey,
  sortDir: SortDir
): PatentItem[] {
  return [...patents].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'issueDate') cmp = a.issueDate.localeCompare(b.issueDate)
    else if (sortKey === 'priorityDate') cmp = a.priorityDate.localeCompare(b.priorityDate)
    else if (sortKey === 'impactScore') cmp = a.impactScore - b.impactScore
    else if (sortKey === 'title') cmp = a.title.localeCompare(b.title)
    return sortDir === 'asc' ? cmp : -cmp
  })
}

/** Filtered + sorted patents for the active URL filters/sort. Length === count. */
export function usePatentResults(
  patents: PatentItem[],
  params: URLSearchParams,
  sortKey: SortKey,
  sortDir: SortDir
): PatentItem[] {
  return useMemo(
    () => sortPatents(filterPatents(patents, params), sortKey, sortDir),
    [patents, params, sortKey, sortDir]
  )
}
