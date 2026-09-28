// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure helpers behind the acvp-lab-workflow workshop steps (kept out of the
 * component files so React fast refresh stays component-only).
 */
import type { PlanItem } from '@/services/acvp/dispatch'
import type { JsonObject } from '@/services/acvp/ir'

export type Prediction = 'executes' | 'partly' | 'unsupported'

export interface GroupOutcome {
  tgId: number
  execute: number
  unsupported: number
  reasons: string[]
  actual: Prediction
}

/** Pure: per-group outcome of the prototype's execution plan. */
export const groupOutcomes = (items: PlanItem[]): Map<number, GroupOutcome> => {
  const out = new Map<number, GroupOutcome>()
  for (const it of items) {
    const g = out.get(it.tgId) ?? {
      tgId: it.tgId,
      execute: 0,
      unsupported: 0,
      reasons: [],
      actual: 'executes' as Prediction,
    }
    if (it.kind === 'execute') g.execute++
    else {
      g.unsupported++
      if (!g.reasons.includes(it.reason)) g.reasons.push(it.reason)
    }
    out.set(it.tgId, g)
  }
  for (const g of out.values()) {
    g.actual = g.unsupported === 0 ? 'executes' : g.execute === 0 ? 'unsupported' : 'partly'
  }
  return out
}

export interface EvidenceSummary {
  evidenceClass: string
  knownFixture: string | null
  engine: string
  answered: number
  unsupported: number
  error: number
  artifactSha256Note: string | null
}

/** Pure: pull the fields a reviewer reads first out of an evidence.json. */
export const summarizeEvidence = (doc: unknown): EvidenceSummary => {
  const e = doc as JsonObject
  const prompt = (e.prompt ?? {}) as JsonObject
  const known = prompt.knownPublicFixture as JsonObject | null | undefined
  const engine = (e.engine ?? {}) as JsonObject
  const summary = (e.summary ?? {}) as JsonObject
  if (typeof e.evidenceClass !== 'string') {
    throw new Error('not an evidence.json from the Hub’s ACVP-format prototype (no evidenceClass)')
  }
  return {
    evidenceClass: e.evidenceClass,
    knownFixture: known
      ? `${String(known.upstreamPath)} @ ${String(known.commit).slice(0, 7)}`
      : null,
    engine: typeof engine.label === 'string' ? engine.label : 'unknown engine',
    answered: Number(summary.answered ?? 0),
    unsupported: Number(summary.unsupported ?? 0),
    error: Number(summary.error ?? 0),
    artifactSha256Note:
      typeof engine.artifactSha256Note === 'string' ? engine.artifactSha256Note : null,
  }
}
