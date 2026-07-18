// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS-15 — close the loop back to the Command Center. The Assess→Sim bridge is
 * read-only; this is the opt-in INVERSE: turn a simulation run into a draft
 * roadmap artifact (`sim-roadmap`) the player can keep and refine in the hub.
 *
 * Pure builders — they produce an ExecutiveDocument; the caller persists it via
 * useModuleStore.addExecutiveDocument. Nothing here touches the assessment.
 */
import type { ExecutiveDocument } from '@/services/storage/types'
import type { SimRunCompleteObjective } from '@/components/Simulation/SimRunComplete'
import type { RunScoreBreakdown } from './runScore'

export interface SimRoadmapInput {
  sector: string
  size: string
  country: string
  difficulty: string
  phases: { id: string; name: string; level: number; cleared: boolean }[]
  clearedCount: number
  totalPhases: number
  readinessPct: number
  yearsToHorizon: number
  over: number
  /**
   * Wave 5 (WP5.1) — additive, all optional so a pre-Wave-5 committed doc still
   * renders (SimulationOutcomesSection degrades each field independently rather
   * than requiring a re-commit). Sourced from the same live state the ceremony
   * and ribbon already compute — no new derivation.
   */
  compliancePct?: number
  objectives?: SimRunCompleteObjective[]
  score?: RunScoreBreakdown
  verifyCloseCleared?: boolean
}

/** Markdown body for the committed roadmap. */
export function serializeSimRoadmap(r: SimRoadmapInput): string {
  const lines: string[] = []
  lines.push('# PQC Migration Roadmap (draft — from the Simulation)')
  lines.push(`**Organisation:** ${r.sector} · ${r.size} · ${r.country} — **mode:** ${r.difficulty}`)
  lines.push(
    `**Progress:** ${r.clearedCount}/${r.totalPhases} phases cleared · readiness ${r.readinessPct}%`
  )
  lines.push(
    `**Mosca clock:** ${r.yearsToHorizon}y to Q-Day${r.over > 0 ? ` · currently over by ${r.over}y` : ''}`
  )
  lines.push('')
  lines.push('## Phase maturity')
  for (const p of r.phases)
    lines.push(`- ${p.cleared ? '✓' : '·'} ${p.id.toUpperCase()} ${p.name} — L${p.level}`)
  lines.push('')
  lines.push('> Draft generated from a simulation run — refine it in the Command Center.')
  return lines.join('\n')
}

/** Build the draft-roadmap ExecutiveDocument from a simulation run. */
export function buildSimRoadmapDoc(r: SimRoadmapInput, now: number): ExecutiveDocument {
  return {
    id: `sim-roadmap-${now}`,
    moduleId: 'migration-program',
    type: 'sim-roadmap',
    title: `Simulation Roadmap — ${r.sector} (${r.clearedCount}/${r.totalPhases})`,
    data: serializeSimRoadmap(r),
    // Preserve the STRUCTURED run so the Migrate RoadmapBuilder can read it back
    // and seed an editable draft (C1) — `data` alone is markdown and lossy.
    inputs: r,
    createdAt: now,
  }
}
