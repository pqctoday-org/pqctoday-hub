// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { loadManifest, loadFlow, resolveFromManifest } from '@/services/workshopFlowLoader'
import { flattenFlow } from '@/data/workshopRegistry'
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

  // Capture the autostart inputs ONCE, at mount, via a lazy useState
  // initializer. A sibling hook (`useUrlPersonaOverride`, mounted higher in the
  // tree) strips `?persona=` from the URL in a mount effect. The original code
  // depended the autostart effect on the live `params`, so that strip
  // retriggered it and re-resolved with persona defaulted to 'executive' — the
  // wrong workshop for every non-executive deep-link (the exact bug in
  // workshop-autostart.spec.ts). The initializer runs during the first render,
  // BEFORE any sibling effect commits the strip, so it reads the original
  // persona; because it runs exactly once, the later strip can't disturb it.
  // (Trade-off: a workshop URL added AFTER mount via in-app navigation won't
  // autostart — but this hook exists for deep-link ENTRY / the headless
  // recorder, both of which are fresh page loads.)
  const [snapshot] = useState<{
    region: WorkshopRegion
    persona: PersonaId
    proficiency: ExperienceLevel
    industry: string
  } | null>(() => {
    if (params.get('workshop') !== 'video' || params.get('autoplay') !== '1') return null
    const region = (params.get('region') ?? 'US').toUpperCase() as WorkshopRegion
    if (!['US', 'CA', 'AU'].includes(region)) return null
    return {
      region,
      persona: (params.get('persona') ?? 'executive') as PersonaId,
      proficiency: (params.get('proficiency') ?? 'basics') as ExperienceLevel,
      industry: params.get('industry') ?? 'Finance & Banking',
    }
  })

  useEffect(() => {
    if (fired.current) return
    if (!snapshot) return

    setPersona(snapshot.persona)
    setExperienceLevel(snapshot.proficiency)
    setIndustry(snapshot.industry)

    let cancelled = false
    void (async () => {
      const manifest = await loadManifest().catch(() => null)
      if (cancelled || !manifest) return
      const entry = resolveFromManifest(manifest, {
        role: snapshot.persona,
        proficiency: snapshot.proficiency,
        industry: snapshot.industry,
        region: snapshot.region,
      })
      if (!entry) return
      const flow = await loadFlow(entry.file).catch(() => null)
      if (cancelled || !flow) return
      const steps = flattenFlow(
        flow,
        snapshot.region,
        snapshot.industry,
        snapshot.persona,
        snapshot.proficiency
      )
      if (steps.length === 0) return

      fired.current = true
      openPanel('workshop')
      startVideo(flow.id, steps[0].id, snapshot.region)
    })()

    return () => {
      cancelled = true
    }
  }, [snapshot, setPersona, setExperienceLevel, setIndustry, startVideo, openPanel])
}
