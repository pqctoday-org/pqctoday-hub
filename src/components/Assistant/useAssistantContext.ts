// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback } from 'react'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { AssistantContext } from '@/services/assistant/contract'

/** The Hub address of the page the learner is on: its path and query, never the fragment. */
function currentAddress(): string | null {
  try {
    return window.location.pathname + window.location.search
  } catch {
    return null
  }
}

/**
 * What the engine may use to order its answer: the chosen role, the region, the first industry and the page the learner is on.
 * Never learner text: the question itself goes to the engine as its own argument.
 */
export function useAssistantContext(): () => AssistantContext {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const region = usePersonaStore((s) => s.selectedRegion)
  const industry = usePersonaStore((s) => s.selectedIndustries[0] ?? null)
  return useCallback(
    () => ({
      persona: persona ?? null,
      region: region && region !== 'global' ? region : null,
      industry,
      page: currentAddress(),
    }),
    [persona, region, industry]
  )
}
