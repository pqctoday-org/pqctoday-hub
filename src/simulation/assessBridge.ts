// SPDX-License-Identifier: GPL-3.0-only
/**
 * assessBridge — READ-ONLY adapter from the Assessment to the Simulation.
 *
 * Data flows one way (Assess → Sim) and only as DATA: the sim's lifecycle and
 * maturity are driven by the sim itself, never by Assess. Nothing here writes to
 * the assessment stores. If no assessment exists, callers fall back to the sim's
 * own dials/defaults.
 */
import { useMemo } from 'react'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import type { AssessmentResult, RecommendedAction } from '@/hooks/assessmentTypes'
import type { Cswp39StepId } from '@/data/cswp39ZoneData'
import type { ExecutiveDocument } from '@/services/storage/types'

export interface AssessSnapshot {
  result: AssessmentResult
  completedAt: string | null
}

/** The latest completed assessment, or null if the player hasn't run one. */
export function getAssessSnapshot(): AssessSnapshot | null {
  const { lastResult, completedAt } = useAssessmentResultStore.getState()
  return lastResult ? { result: lastResult, completedAt } : null
}

/**
 * Reactive variant of {@link getAssessSnapshot} for use inside React render —
 * subscribes to the store via selectors instead of an impure getState() read.
 */
export function useAssessSnapshot(): AssessSnapshot | null {
  const lastResult = useAssessmentResultStore((s) => s.lastResult)
  const completedAt = useAssessmentResultStore((s) => s.completedAt)
  return useMemo(
    () => (lastResult ? { result: lastResult, completedAt } : null),
    [lastResult, completedAt]
  )
}

export interface AssessRec {
  priority: number
  category: RecommendedAction['category']
  cswp39Step?: Cswp39StepId
}

/**
 * Map learn-module id → the Assess recommendation that targets it (relatedModule
 * '/learn/<id>'), so the sim can badge next-move steps the assessment flagged.
 * Read-only; does not change gating or order.
 */
export function recommendationByModule(r: AssessmentResult): Map<string, AssessRec> {
  const m = new Map<string, AssessRec>()
  for (const a of r.recommendedActions ?? []) {
    if (a.relatedModule?.startsWith('/learn/')) {
      const id = a.relatedModule.slice('/learn/'.length)
      if (id && !m.has(id))
        m.set(id, { priority: a.priority, category: a.category, cswp39Step: a.cswp39Step })
    }
  }
  return m
}

// ---- T2.1/T2.2: org profile (sim sector / size / country) from the assessment ----
// Maps the Assess vocabularies onto the sim's own dial ids. Anything the sim
// doesn't model (e.g. an industry/country outside its tables) is simply left
// unmapped so the sim keeps its current dial.
const INDUSTRY_TO_SECTOR = new Map<string, string>([
  ['Finance & Banking', 'financial'],
  ['Government & Defense', 'government'],
  ['Healthcare', 'healthcare'],
  ['Telecommunications', 'telecom'],
  ['Technology', 'general'],
  ['Energy & Utilities', 'energy'],
  ['Automotive', 'general'],
  ['Aerospace', 'government'],
  ['Retail & E-Commerce', 'retail'],
  ['Education', 'general'],
  ['Manufacturing', 'energy'],
  ['Other', 'general'],
])
const SCALE_TO_SIZE = new Map<string, string>([
  ['1-10', 'small'],
  ['11-50', 'mid'],
  ['51-200', 'large'],
  ['200-plus', 'global'],
])
const COUNTRY_NAME_TO_CODE = new Map<string, string>([
  ['United States', 'US'],
  ['Germany', 'DE'],
  ['France', 'FR'],
  ['United Kingdom', 'UK'],
  ['Australia', 'AU'],
])

export interface SimProfileFromAssess {
  sector?: string
  size?: string
  country?: string
}

/**
 * Map a completed assessment onto the sim's setup dials (sector / size /
 * country) so an imported assessment starts the sim on the real org. Only fields
 * the sim actually models are returned; the caller leaves the rest untouched and
 * the player can still change any dial afterward (auto-fill, not a lock).
 */
export function simProfileFromAssess(r: AssessmentResult): SimProfileFromAssess {
  const p = r.assessmentProfile
  const out: SimProfileFromAssess = {}
  if (!p) return out
  const sector = p.industry ? INDUSTRY_TO_SECTOR.get(p.industry) : undefined
  if (sector) out.sector = sector
  const size = p.systemScale ? SCALE_TO_SIZE.get(p.systemScale) : undefined
  if (size) out.size = size
  const country = p.country ? COUNTRY_NAME_TO_CODE.get(p.country) : undefined
  if (country) out.country = country
  return out
}

export interface MoscaInputs {
  shelfLifeYears: number
  migrationYears: number
}

/**
 * Derive the sim's Mosca X (data shelf-life) and Y (migration time) from the
 * assessment — the org's actual answers — instead of the static sector/size
 * tables. Returns null if the assessment lacks the needed fields. The horizon Z
 * stays sim-driven (country deadline + Q-Day).
 */
export function moscaInputsFromAssess(r: AssessmentResult): MoscaInputs | null {
  const shelf = r.hndlRiskWindow?.dataRetentionYears
  const mc = r.categoryScores?.migrationComplexity
  if (shelf == null && mc == null) return null
  return {
    shelfLifeYears: shelf ?? 5,
    // migrationComplexity 0–100 → ~2–6 years
    migrationYears: mc != null ? Math.round(2 + (mc / 100) * 4) : 3,
  }
}

const STEP_LABEL: Record<string, string> = {
  govern: 'Govern',
  inventory: 'Inventory',
  'identify-gaps': 'Identify-gaps',
  prioritise: 'Prioritise',
  implement: 'Implement',
}

/** Serialize an assessment into a markdown body for a Phase-0 scoping artifact. */
export function serializeAssessReport(r: AssessmentResult): string {
  const p = r.assessmentProfile
  const lines: string[] = []
  lines.push('# Quantum Readiness Assessment (imported from Assess)')
  if (p) lines.push(`**Industry:** ${p.industry}${p.country ? ` · **Country:** ${p.country}` : ''}`)
  lines.push(`**Overall risk:** ${r.riskScore}/100 (${r.riskLevel})`)
  if (r.frameworkRisk) {
    const f = r.frameworkRisk
    lines.push('')
    lines.push('## Framework risk lens')
    lines.push(
      `- HNDL ${f.hndl} · TNFL ${f.tnfl} · Regulatory ${f.regulatory} · Feasibility ${f.feasibility}`
    )
  }
  if (r.keyFindings?.length) {
    lines.push('')
    lines.push('## Key findings')
    for (const k of r.keyFindings) lines.push(`- ${k}`)
  }
  if (r.recommendedActions?.length) {
    lines.push('')
    lines.push('## Recommended actions')
    for (const a of r.recommendedActions.slice(0, 12)) {
      const step = a.cswp39Step ? `[${STEP_LABEL[a.cswp39Step] ?? a.cswp39Step}] ` : ''
      lines.push(`${a.priority}. ${step}${a.action}`)
    }
  }
  if (r.complianceImpacts?.length) {
    lines.push('')
    lines.push('## Applicable compliance')
    for (const c of r.complianceImpacts)
      lines.push(`- ${c.framework}${c.deadline ? ` (deadline ${c.deadline})` : ''}`)
  }
  if (r.executiveSummary) {
    lines.push('')
    lines.push('## Executive summary')
    lines.push(r.executiveSummary)
  }
  return lines.join('\n')
}

/**
 * Build the Phase-0 scoping ExecutiveDocument from an assessment. Type
 * 'initial-scoping' so it satisfies the sim's P0 0.2 step (the sim's gate logic
 * still decides it counts — nothing here advances the lifecycle).
 */
export function buildAssessReportDoc(r: AssessmentResult, now: number): ExecutiveDocument {
  const industry = r.assessmentProfile?.industry ?? 'Organization'
  return {
    id: `assess-scoping-${now}`,
    moduleId: 'data-asset-sensitivity',
    type: 'initial-scoping',
    title: `Scoping & Asset Assessment — ${industry}`,
    data: serializeAssessReport(r),
    createdAt: now,
  }
}
