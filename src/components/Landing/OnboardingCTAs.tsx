// SPDX-License-Identifier: AGPL-3.0-only
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Play, BookOpen, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PersonaId } from '@/data/learningPersonas'
import { homeFunnelFor } from '@/data/nextSteps'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { usePersonaStore, type Region } from '@/store/usePersonaStore'
import type { WorkshopRegion } from '@/types/Workshop'
import { loadFlow, loadManifest } from '@/services/workshopFlowLoader'
import { pickFlowEntry, type FlowProfile } from './onboardingFlow'

interface OnboardingCTAsProps {
  persona: PersonaId | null
  region: Region | null
}

function personaRegionToWorkshop(r: Region | null): WorkshopRegion {
  switch (r) {
    case 'americas':
      return 'US'
    case 'apac':
      return 'AU'
    case 'eu':
      return 'EU'
    case 'mena':
      // WorkshopRegion has no MENA member; fall through to OTHER until workshop
      // flows add region-specific MENA chapters.
      return 'OTHER'
    default:
      return 'OTHER'
  }
}

interface FlowInfo {
  id: string
  firstStepId: string
  title: string
  minutes: number
  /** True when the tour is the catch-all overview, not one written for this role. */
  isGeneric: boolean
}

async function loadFlowInfo(profile: FlowProfile): Promise<FlowInfo | null> {
  try {
    const manifest = await loadManifest()
    const entry = pickFlowEntry(manifest, profile)
    if (!entry) return null

    const flow = await loadFlow(entry.file)
    const firstStepId: string = flow.intro?.steps?.[0]?.id ?? 'intro-01-welcome'

    return {
      id: entry.id,
      firstStepId,
      title: entry.title,
      minutes: entry.totalEstMinutes,
      isGeneric: entry.isGenericFallback === true,
    }
  } catch {
    return null
  }
}

export const OnboardingCTAs = ({ persona, region }: OnboardingCTAsProps) => {
  const navigate = useNavigate()
  const { startVideo } = useWorkshopStore()
  const { open: openPanel } = useRightPanelStore()

  const proficiency = usePersonaStore((st) => st.experienceLevel)
  const industry = usePersonaStore((st) => st.selectedIndustry)
  // A persona whose Home leads somewhere other than the learning modules
  // (the researcher: the Library's recent changes) gets that as its third CTA.
  const startCta = homeFunnelFor(persona)?.startCta ?? {
    label: 'Start Your Journey',
    sub: 'Jump into the learning modules',
    to: '/learn',
  }
  const [flowInfo, setFlowInfo] = useState<FlowInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Async fetch in effect — synchronous setLoading kicks off the spinner
    // before the await resolves; pattern is intentional, not a cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    loadFlowInfo({ persona, proficiency, industry, region }).then((info) => {
      if (!cancelled) {
        setFlowInfo(info)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [persona, proficiency, industry, region])

  const handleVideoTour = () => {
    if (!flowInfo) return
    startVideo(flowInfo.id, flowInfo.firstStepId, personaRegionToWorkshop(region))
    // RightPanel auto-opens via its useEffect when workshop mode becomes 'video'
  }

  // A role's own tour is named by its title; the catch-all overview keeps the
  // generic label.
  const videoLabel = flowInfo && !flowInfo.isGeneric ? flowInfo.title : 'Watch Quick Overview'
  const videoSub = flowInfo
    ? `${flowInfo.minutes} min guided tour`
    : loading
      ? 'Loading…'
      : 'Guided tour'

  return (
    <div className="glass-panel p-4 sm:p-6">
      <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4 text-center">
        Where would you like to start?
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* CTA 1: Video tour */}
        <Button
          variant="outline"
          onClick={handleVideoTour}
          disabled={!flowInfo}
          className="flex flex-col items-center gap-2 h-auto py-4 px-4 text-left hover:border-primary/50 hover:bg-muted/30 transition-all"
        >
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Play size={18} aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground leading-tight">{videoLabel}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{videoSub}</p>
          </div>
        </Button>

        {/* CTA 2: Browse workshops */}
        <Button
          variant="outline"
          onClick={() => openPanel('workshop')}
          className="flex flex-col items-center gap-2 h-auto py-4 px-4 text-left hover:border-primary/50 hover:bg-muted/30 transition-all"
        >
          <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
            <LayoutGrid size={18} aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground leading-tight">Browse Workshops</p>
            <p className="text-xs text-muted-foreground mt-0.5">Find the right guided tour</p>
          </div>
        </Button>

        {/* CTA 3: Start journey (or the persona's own first stop) */}
        <Button
          variant="outline"
          onClick={() => navigate(startCta.to)}
          className="flex flex-col items-center gap-2 h-auto py-4 px-4 text-left hover:border-primary/50 hover:bg-muted/30 transition-all"
        >
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <BookOpen size={18} aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground leading-tight">{startCta.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{startCta.sub}</p>
          </div>
        </Button>
      </div>
    </div>
  )
}
