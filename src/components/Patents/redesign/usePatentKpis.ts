// SPDX-License-Identifier: GPL-3.0-only
/**
 * usePatentKpis — the five headline numbers for the redesign's control deck,
 * computed over the SCOPED corpus (after the PQC & hybrid / All crypto toggle).
 * Pure derivation; the strip component owns the icons + drill wiring.
 */
import { useMemo } from 'react'
import type { PatentItem } from '@/types/PatentTypes'

export interface PatentKpis {
  inScope: number
  highImpact: { count: number; pct: number }
  coreQuantum: number
  fipsMapped: number
  topAssignee: { name: string; count: number } | null
}

export function computePatentKpis(patents: PatentItem[]): PatentKpis {
  const total = patents.length
  const highImpactCount = patents.filter((p) => p.impactLevel === 'High').length
  const coreQuantum = patents.filter((p) => p.quantumRelevance === 'core_invention').length
  const fipsMapped = patents.filter((p) =>
    p.nistRoundStatus.some((n) => n.status.startsWith('fips_'))
  ).length

  const byAssignee = new Map<string, number>()
  for (const p of patents) {
    if (!p.assignee) continue
    byAssignee.set(p.assignee, (byAssignee.get(p.assignee) ?? 0) + 1)
  }
  let topAssignee: PatentKpis['topAssignee'] = null
  for (const [name, count] of byAssignee) {
    if (!topAssignee || count > topAssignee.count) topAssignee = { name, count }
  }

  return {
    inScope: total,
    highImpact: {
      count: highImpactCount,
      pct: total ? Math.round((highImpactCount / total) * 100) : 0,
    },
    coreQuantum,
    fipsMapped,
    topAssignee,
  }
}

export function usePatentKpis(patents: PatentItem[]): PatentKpis {
  return useMemo(() => computePatentKpis(patents), [patents])
}
