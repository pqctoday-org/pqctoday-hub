// SPDX-License-Identifier: AGPL-3.0-only
import type { BusinessToolAudience } from '@/components/BusinessCenter/businessToolsRegistry'
import type { BusinessRoleSequence } from './businessRoleConfig'
import type { PersonaId } from './learningPersonas'

/**
 * Persona rank for a business tool inside its group (lower comes first): the
 * role's recommended sequence first (in sequence order), then tools whose
 * audience is the role's, then everything else. No persona: all equal, so the
 * caller's registry order stands. Shared by the desktop grid and the phone
 * catalogue so both list the same tools first for the same reader.
 */
export function businessToolRank(
  tool: { id: string; audience?: BusinessToolAudience },
  persona: PersonaId | null,
  sequence: BusinessRoleSequence
): number {
  if (!persona) return 1
  const step = sequence.steps.findIndex((s) => s.id === tool.id)
  if (step !== -1) return -100 + step
  const audience = tool.audience ?? 'business'
  const mine =
    (persona === 'executive' || persona === 'grc') && audience === 'business'
      ? true
      : audience === persona
  return mine ? 0 : 1
}

/** Stable sort by `businessToolRank`, keeping input order within a rank. */
export function rankBusinessTools<T extends { id: string; audience?: BusinessToolAudience }>(
  tools: readonly T[],
  persona: PersonaId | null,
  sequence: BusinessRoleSequence
): T[] {
  return tools
    .map((tool, index) => ({ tool, index, rank: businessToolRank(tool, persona, sequence) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ tool }) => tool)
}
