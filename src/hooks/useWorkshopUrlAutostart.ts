// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { resolveWorkshopFlow, flattenFlow } from '@/data/workshopRegistry'
import type { WorkshopRegion } from '@/types/Workshop'
import type { PersonaId } from '@/data/learningPersonas'
import type { ExperienceLevel } from '@/store/usePersonaStore'

/**
 * Auto-starts the workshop in Video Mode when the URL contains
 * `?workshop=video&region=US|CA|AU&autoplay=1`.
 *
 * Used by the Playwright headless recorder. Also accepts optional
 * `persona`, `proficiency`, and `industry` params so the test harness
 * doesn't need to seed localStorage.
 */
export function useWorkshopUrlAutostart(): void {
  const [params] = useSearchParams()
  const fired = useRef(false)

  const setPersona = usePersonaStore((s) => s.setPersona)
  const setExperienceLevel = usePersonaStore((s) => s.setExperienceLevel)
  const setIndustry = usePersonaStore((s) => s.setIndustry)
  const startVideo = useWorkshopStore((s) => s.startVideo)
  const openPanel = useRightPanelStore((s) => s.open)

  useEffect(() => {
    if (fired.current) return
    if (params.get('workshop') !== 'video') return
    if (params.get('autoplay') !== '1') return

    const region = (params.get('region') ?? 'US').toUpperCase() as WorkshopRegion
    if (!['US', 'CA', 'AU'].includes(region)) return

    const persona = (params.get('persona') ?? 'executive') as PersonaId
    const proficiency = (params.get('proficiency') ?? 'basics') as ExperienceLevel
    const industry = params.get('industry') ?? 'Finance & Banking'

    setPersona(persona)
    setExperienceLevel(proficiency)
    setIndustry(industry)

    const flow = resolveWorkshopFlow({ role: persona, proficiency, industry, region })
    if (!flow) return
    const steps = flattenFlow(flow, region)
    if (steps.length === 0) return

    fired.current = true
    openPanel('workshop')
    startVideo(flow.id, steps[0].id, region)
  }, [params, setPersona, setExperienceLevel, setIndustry, startVideo, openPanel])
}
