// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, BookOpen, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PersonaId } from '@/data/learningPersonas'
import type { Region } from '@/store/usePersonaStore'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import type { WorkshopRegion } from '@/types/Workshop'

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
    default:
      return 'OTHER'
  }
}

interface FlowInfo {
  id: string
  firstStepId: string
  title: string
  minutes: number
}

async function loadFlowInfo(isCurious: boolean): Promise<FlowInfo | null> {
  try {
    const manifest = await fetch('/workshop/index.json').then((r) => r.json())
    const flows: {
      id: string
      file: string
      title: string
      totalEstMinutes: number
      isGenericFallback?: boolean
      match: { roles: string[] | '*'; proficiencies: string[] | '*' }
    }[] = manifest.flows ?? []

    const entry = isCurious
      ? flows.find(
          (f) =>
            Array.isArray(f.match.roles) &&
            f.match.roles.includes('curious') &&
            Array.isArray(f.match.proficiencies) &&
            f.match.proficiencies.includes('curious')
        )
      : flows.find((f) => f.isGenericFallback === true)

    if (!entry) return null

    const flow = await fetch(`/workshop/${entry.file}`).then((r) => r.json())
    const firstStepId: string = flow.intro?.steps?.[0]?.id ?? 'intro-01-welcome'

    return { id: entry.id, firstStepId, title: entry.title, minutes: entry.totalEstMinutes }
  } catch {
    return null
  }
}

export const OnboardingCTAs = ({ persona, region }: OnboardingCTAsProps) => {
  const navigate = useNavigate()
  const { startVideo } = useWorkshopStore()
  const { open: openPanel } = useRightPanelStore()

  const isCurious = persona === 'curious'
  const [flowInfo, setFlowInfo] = useState<FlowInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Async fetch in effect — synchronous setLoading kicks off the spinner
    // before the await resolves; pattern is intentional, not a cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    loadFlowInfo(isCurious).then((info) => {
      if (!cancelled) {
        setFlowInfo(info)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [isCurious])

  const handleVideoTour = () => {
    if (!flowInfo) return
    startVideo(flowInfo.id, flowInfo.firstStepId, personaRegionToWorkshop(region))
    // RightPanel auto-opens via its useEffect when workshop mode becomes 'video'
  }

  const videoLabel = isCurious ? 'PQC for the Curious — Visual Tour' : 'Watch Quick Overview'
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

        {/* CTA 3: Start journey */}
        <Button
          variant="outline"
          onClick={() => navigate('/learn')}
          className="flex flex-col items-center gap-2 h-auto py-4 px-4 text-left hover:border-primary/50 hover:bg-muted/30 transition-all"
        >
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <BookOpen size={18} aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground leading-tight">
              Start Your Journey
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Jump into the learning modules</p>
          </div>
        </Button>
      </div>
    </div>
  )
}
