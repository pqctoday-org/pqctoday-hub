// SPDX-License-Identifier: GPL-3.0-only
import type { CategoryScores } from '@/hooks/assessmentTypes'
import type { PersonaId } from '@/data/learningPersonas'

/**
 * Returns up to 3 module IDs tailored to an assessment result and persona.
 * Rules mirror the roadmap's UI-LDB-01 spec:
 *   - High quantumExposure  → quantum-threats
 *   - High migrationComplexity → migration-program (falls back to crypto-agility)
 *   - Low organizationalReadiness → pqc-101
 * Persona-specific overrides apply on top.
 */
export function inferRecommendedModules(
  categoryScores: CategoryScores,
  persona: PersonaId
): string[] {
  const candidates: Array<{ id: string; score: number }> = []

  const { quantumExposure, migrationComplexity, organizationalReadiness } = categoryScores

  // High quantum exposure → learn the threats first
  if (quantumExposure >= 60) {
    candidates.push({ id: 'quantum-threats', score: quantumExposure })
  }

  // High migration complexity → migration program or crypto-agility
  if (migrationComplexity >= 60) {
    candidates.push({
      id: 'migration-program',
      score: migrationComplexity,
    })
  } else if (migrationComplexity >= 40) {
    candidates.push({ id: 'crypto-agility', score: migrationComplexity })
  }

  // Low organizational readiness → start at 101
  if (organizationalReadiness < 40) {
    candidates.push({ id: 'pqc-101', score: 100 - organizationalReadiness })
  }

  // Persona-specific additions
  const personaBoosts: Record<PersonaId, string[]> = {
    executive: ['pqc-101'],
    architect: ['hybrid-crypto'],
    ops: ['kms-pqc'],
    researcher: ['stateful-signatures'],
    developer: ['crypto-dev-apis'],
    curious: ['pqc-101'],
  }
  for (const id of personaBoosts[persona] ?? []) {
    if (!candidates.some((c) => c.id === id)) {
      candidates.push({ id, score: 50 })
    }
  }

  // Fallback: always suggest pqc-101 if nothing scored
  if (candidates.length === 0) {
    candidates.push({ id: 'pqc-101', score: 50 })
  }

  // Deduplicate, sort by score desc, return top 3
  const seen = new Set<string>()
  return candidates
    .filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((c) => c.id)
}
