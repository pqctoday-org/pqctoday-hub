// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback } from 'react'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { AssistantContext } from '@/services/assistant/contract'

/**
 * What the engine may use to order its answer: the chosen role, the region and the first industry.
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
    }),
    [persona, region, industry]
  )
}
