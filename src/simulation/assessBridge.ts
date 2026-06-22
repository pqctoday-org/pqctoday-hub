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
import type {
  AssessmentResult,
  AssessmentInput,
  RecommendedAction,
  ComplianceImpact,
  CategoryScores,
  AlgorithmMigration,
  FrameworkRisk,
} from '@/hooks/assessmentTypes'
import { buildTwoTrackPlan, type TwoTrackPlan } from '@/hooks/assessment/twoTrack'
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
/**
 * The sim only models five jurisdiction archetypes (US / DE / FR / UK / AU — see
 * `moscaClock` + `jurisdiction`). These five countries map 1:1 to their archetype
 * (an "exact" match). Every OTHER assessment country still resolves to one of the
 * five via a region-based fallback (see {@link COUNTRY_REGION_FALLBACK}), so the
 * sim mechanics always have a rule-set even when the dial shows the real country.
 */
const COUNTRY_NAME_TO_CODE = new Map<string, string>([
  ['United States', 'US'],
  ['Germany', 'DE'],
  ['France', 'FR'],
  ['United Kingdom', 'UK'],
  ['Australia', 'AU'],
])

/**
 * Region-based fallback archetype for assessment countries the sim doesn't model
 * 1:1. Picks the closest of the five archetypes by regulatory posture:
 *   - EU/EEA members → 'DE' (BSI — hybrid required), the EU's representative stance
 *   - United Kingdom → 'UK' (handled as an exact match above; listed for clarity)
 *   - Australia / New Zealand → 'AU' (ASD — pure end-state)
 *   - United States / Canada / everything else → 'US' (CNSA 2.0 — the default)
 * Anything not listed here falls through to 'US' in {@link resolveArchetype}.
 */
const COUNTRY_REGION_FALLBACK = new Map<string, string>([
  // EU / EEA → German (BSI) hybrid-required archetype
  ['European Union', 'DE'],
  ['Italy', 'DE'],
  ['Spain', 'DE'],
  ['Czech Republic', 'DE'],
  ['Netherlands', 'DE'],
  ['Belgium', 'DE'],
  ['Poland', 'DE'],
  ['Sweden', 'DE'],
  ['Norway', 'DE'],
  ['Switzerland', 'DE'],
  ['Ireland', 'DE'],
  ['Austria', 'DE'],
  ['Denmark', 'DE'],
  ['Finland', 'DE'],
  // Oceania → Australian (ASD) pure end-state archetype
  ['New Zealand', 'AU'],
])

/** The sim's default jurisdiction archetype when no closer match is found. */
const DEFAULT_ARCHETYPE = 'US'

/**
 * Resolve any assessment country name to one of the sim's five archetypes plus
 * whether the match was exact (a 1:1 modelled jurisdiction) or a region fallback.
 *   - exact: the country is one of US/DE/FR/UK/AU → mechanics + display agree
 *   - fallback: an unmodelled country → mechanics use a nearby archetype while the
 *     display keeps the real country name and notes the modelled archetype
 */
function resolveArchetype(countryName: string): { code: string; exact: boolean } {
  const exact = COUNTRY_NAME_TO_CODE.get(countryName)
  if (exact) return { code: exact, exact: true }
  const fallback = COUNTRY_REGION_FALLBACK.get(countryName) ?? DEFAULT_ARCHETYPE
  return { code: fallback, exact: false }
}

export interface SimJurisdictionFromAssess {
  /** One of the sim's five archetype codes (US/DE/FR/UK/AU) — drives mechanics. */
  countryCode: string
  /** The REAL country name from the assessment — shown on the JURISDICTION dial. */
  displayName: string
  /** true when the country is a 1:1 modelled jurisdiction (no archetype note). */
  exact: boolean
}

/**
 * Map the assessment's real country onto the sim's jurisdiction: the archetype
 * `countryCode` the mechanics use, the `displayName` to show on the dial (the
 * real country), and whether that was an exact 1:1 match. Returns null when the
 * assessment carries no country. Every country resolves to an archetype, so a
 * non-null result always yields a usable `countryCode`.
 */
export function simJurisdictionFromAssess(r: AssessmentResult): SimJurisdictionFromAssess | null {
  const name = r.assessmentProfile?.country
  if (!name) return null
  const { code, exact } = resolveArchetype(name)
  return { countryCode: code, displayName: name, exact }
}

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
  // Country always resolves to a sim archetype (exact match or region fallback)
  // so the store dial is never left pointing at an unmodelled jurisdiction.
  const jur = simJurisdictionFromAssess(r)
  if (jur) out.country = jur.countryCode
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

// ---- T2.3: applicable compliance for the P0 view ----
/** The compliance frameworks the assessment found applicable (empty if none). */
export function complianceFromAssess(r: AssessmentResult): ComplianceImpact[] {
  return r.complianceImpacts ?? []
}

// ---- T2.4: category scores as informational sim KPIs (no level granting) ----
/**
 * The assessment's four category scores, surfaced read-only in the sim as
 * context KPIs. These NEVER grant or change maturity — the sim's lifecycle is
 * earned in-game. Returns null when the assessment carries no category scores.
 */
export function kpisFromAssess(r: AssessmentResult): CategoryScores | null {
  return r.categoryScores ?? null
}

// ---- framework risk lens (the P3 four-dimension model) for the sim's P3 view ----
/**
 * The assessment's framework risk lens — HNDL / TNFL / Regulatory / Feasibility,
 * the exact four dimensions the framework's Phase 3 risk scoring uses. Surfaced
 * read-only at the sim's P3 so the QRA the player produces reflects their real
 * assessed risk profile. Null when the assessment carries no framework risk.
 */
export function frameworkRiskFromAssess(r: AssessmentResult): FrameworkRisk | null {
  return r.frameworkRisk ?? null
}

// ---- T3.1: sim-local readiness trend (assessed baseline → in-game progress) ----
export interface ReadinessTrend {
  /** Assessed organisational readiness at import time (0–100). */
  baseline: number
  /** Sim-local projection given framework maturity earned so far (0–100). */
  projected: number
  /** projected − baseline (the movement the player has driven in-game). */
  delta: number
}

/**
 * Project a sim-local readiness trend: start at the assessed organisational
 * readiness and rise toward 100 as framework maturity is earned in-game
 * (progressFrac 0..1). Purely sim-local and read-only — NEVER written back to
 * the assessment or its history; it only shows movement against the baseline.
 */
export function projectReadiness(baselineReadiness: number, progressFrac: number): ReadinessTrend {
  const b = Math.round(Math.max(0, Math.min(100, baselineReadiness)))
  const p = Math.max(0, Math.min(1, progressFrac))
  const projected = Math.round(b + (100 - b) * p)
  return { baseline: b, projected, delta: projected - b }
}

// ---- T2.5: algorithm migration backlog + two-track plan for P3/P5 ----
/** The classical→PQC algorithm backlog from the assessment (empty if none). */
export function algorithmBacklogFromAssess(r: AssessmentResult): AlgorithmMigration[] {
  return r.algorithmMigrations ?? []
}

/**
 * The Track-A (confidentiality/KEM) / Track-B (integrity/signatures) split for
 * the sim's P3/P5 views. buildTwoTrackPlan only reads result fields (its input
 * arg is unused), so a minimal input is sufficient. Returns undefined when the
 * assessment has neither actions nor effort to split.
 */
export function twoTrackFromAssess(r: AssessmentResult): TwoTrackPlan | undefined {
  return buildTwoTrackPlan({} as AssessmentInput, r)
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
