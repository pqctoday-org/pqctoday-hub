// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Play, Video, Clock, Pause, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import {
  WORKSHOP_FLOWS,
  flattenFlow,
  resolveWorkshopFlow,
  getNextStep,
  getPrevStep,
  findStepIndex,
} from '@/data/workshopRegistry'
import type { WorkshopFlow, WorkshopRegion, WorkshopStep } from '@/types/Workshop'
import { WorkshopPrereqList } from './WorkshopPrereqList'
import { labelForRegion } from '@/utils/workshopRegion'
import { WorkshopStepCard } from './WorkshopStepCard'
import { useWorkshopAutoComplete } from '@/hooks/useWorkshopAutoComplete'
import { buildStepUrl } from '@/utils/workshopDeepLink'

export const WorkshopPanel: React.FC = () => {
  useWorkshopAutoComplete()

  const role = usePersonaStore((s) => s.selectedPersona)
  const proficiency = usePersonaStore((s) => s.experienceLevel)
  const industry = usePersonaStore((s) => s.selectedIndustry)

  const {
    mode,
    currentFlowId,
    currentStepId,
    completedStepIds,
    selectedRegion,
    start,
    startVideo,
    exit,
    pause,
    resume,
    setStep,
    markStepComplete,
  } = useWorkshopStore()

  const [pickedRegion, setPickedRegion] = useState<WorkshopRegion | null>(selectedRegion)

  const matchedFlow = useMemo<WorkshopFlow | null>(() => {
    if (!role || !proficiency || !industry || !pickedRegion) return null
    return resolveWorkshopFlow({ role, proficiency, industry, region: pickedRegion })
  }, [role, proficiency, industry, pickedRegion])

  const isRunningOrVideo = mode === 'running' || mode === 'video' || mode === 'paused'

  if (isRunningOrVideo) {
    return (
      <RunningView
        currentFlowId={currentFlowId}
        currentStepId={currentStepId}
        completedStepIds={completedStepIds}
        selectedRegion={selectedRegion}
        onAdvance={(stepId) => setStep(stepId)}
        onMarkComplete={(stepId) => markStepComplete(stepId)}
        onExit={() => exit()}
        onPause={() => pause()}
        onResume={() => resume()}
        paused={mode === 'paused'}
        videoMode={mode === 'video'}
      />
    )
  }

  const prereqsReady =
    role === 'executive' &&
    proficiency === 'basics' &&
    industry === 'Finance & Banking' &&
    pickedRegion !== null

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <GraduationCap size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">Executive PQC Workshop</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Finance · United States, Canada, or Australia · ~90 minutes
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-3 space-y-2">
        <h3 className="text-sm font-medium text-foreground">What to expect</h3>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside marker:text-primary">
          <li>Plain-English understanding of the quantum threat to finance</li>
          <li>Your jurisdiction&rsquo;s post-quantum deadlines (US, Canada, or Australia)</li>
          <li>A board-ready, shareable risk report tailored to your context</li>
          <li>A 90-day action plan walked through the four CSWP 39 zones</li>
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-card p-3 space-y-2">
        <h3 className="text-sm font-medium text-foreground">Pre-flight checklist</h3>
        <WorkshopPrereqList pickedRegion={pickedRegion} onPickRegion={setPickedRegion} />
      </section>

      {matchedFlow ? (
        <FlowAgenda flow={matchedFlow} region={pickedRegion!} />
      ) : (
        <section className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
          {!role || !proficiency || !industry
            ? 'Set role, proficiency, and industry to see the workshop agenda.'
            : pickedRegion
              ? 'No workshop flow available for the selected combination yet — additional persona flows are in development.'
              : 'Pick a country to see the workshop agenda.'}
        </section>
      )}

      <div className="flex flex-col gap-2">
        <Button
          variant="gradient"
          className="w-full"
          disabled={!matchedFlow || !prereqsReady}
          onClick={() => {
            if (!matchedFlow || !pickedRegion) return
            const steps = flattenFlow(matchedFlow, pickedRegion)
            if (steps.length === 0) return
            start(matchedFlow.id, steps[0].id, pickedRegion)
          }}
        >
          <Play size={16} className="mr-2" />
          Start Workshop
        </Button>
        <Button
          variant="outline"
          className="w-full"
          disabled={!matchedFlow || !prereqsReady}
          onClick={() => {
            if (!matchedFlow || !pickedRegion) return
            const steps = flattenFlow(matchedFlow, pickedRegion)
            if (steps.length === 0) return
            startVideo(matchedFlow.id, steps[0].id, pickedRegion)
          }}
        >
          <Video size={16} className="mr-2" />
          Record this workshop (video mode)
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {WORKSHOP_FLOWS.length} flow available. Additional persona flows (Curious, Developer,
        Architect, Ops, Researcher; other industries; intermediate / advanced proficiency) are in
        development.
      </p>
    </div>
  )
}

interface FlowAgendaProps {
  flow: WorkshopFlow
  region: WorkshopRegion
}

const FlowAgenda: React.FC<FlowAgendaProps> = ({ flow, region }) => {
  const regionChapter = flow.regions?.[region]
  return (
    <section className="rounded-lg border border-border bg-card p-3 space-y-2">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
        <Clock size={14} className="text-muted-foreground" /> Agenda · {flow.totalEstMinutes} min
      </h3>
      <ul className="text-sm space-y-1">
        <AgendaItem
          title={flow.intro.title}
          minutes={flow.intro.estMinutes}
          count={flow.intro.steps.length}
        />
        <AgendaItem
          title={flow.prerequisites.title}
          minutes={flow.prerequisites.estMinutes}
          count={flow.prerequisites.steps.length}
        />
        {flow.common.map((c) => {
          if (c.id === 'action') {
            return (
              <React.Fragment key={c.id}>
                {regionChapter && (
                  <AgendaItem
                    title={regionChapter.title}
                    minutes={regionChapter.estMinutes}
                    count={regionChapter.steps.length}
                    region={labelForRegion(region)}
                  />
                )}
                <AgendaItem title={c.title} minutes={c.estMinutes} count={c.steps.length} />
              </React.Fragment>
            )
          }
          return (
            <AgendaItem key={c.id} title={c.title} minutes={c.estMinutes} count={c.steps.length} />
          )
        })}
        <AgendaItem
          title={flow.close.title}
          minutes={flow.close.estMinutes}
          count={flow.close.steps.length}
        />
      </ul>
    </section>
  )
}

const AgendaItem: React.FC<{ title: string; minutes: number; count: number; region?: string }> = ({
  title,
  minutes,
  count,
  region,
}) => (
  <li className="flex items-center justify-between gap-2 text-foreground">
    <span className="truncate">
      {title}
      {region ? <span className="text-muted-foreground"> · {region}</span> : null}
    </span>
    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
      {count} step{count === 1 ? '' : 's'} · {minutes} min
    </span>
  </li>
)

interface RunningViewProps {
  currentFlowId: string | null
  currentStepId: string | null
  completedStepIds: string[]
  selectedRegion: WorkshopRegion | null
  paused: boolean
  videoMode: boolean
  onAdvance: (stepId: string) => void
  onMarkComplete: (stepId: string) => void
  onExit: () => void
  onPause: () => void
  onResume: () => void
}

const RunningView: React.FC<RunningViewProps> = ({
  currentFlowId,
  currentStepId,
  completedStepIds,
  selectedRegion,
  paused,
  videoMode,
  onAdvance,
  onMarkComplete,
  onExit,
  onPause,
  onResume,
}) => {
  const navigate = useNavigate()
  const flow = useMemo(
    () => WORKSHOP_FLOWS.find((f) => f.id === currentFlowId) ?? null,
    [currentFlowId]
  )
  const steps: WorkshopStep[] = useMemo(() => {
    if (!flow || !selectedRegion) return []
    return flattenFlow(flow, selectedRegion)
  }, [flow, selectedRegion])

  const idx = currentStepId ? findStepIndex(steps, currentStepId) : -1
  const step: WorkshopStep | null = idx >= 0 ? steps[idx] : (steps[0] ?? null)
  const prev = step ? getPrevStep(steps, step.id) : null
  const next = step ? getNextStep(steps, step.id) : null

  if (!step || !flow) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">No active workshop step.</p>
          <Button variant="outline" onClick={onExit}>
            Exit Workshop
          </Button>
        </div>
      </div>
    )
  }

  const handleNext = (): void => {
    if (!next) return
    onAdvance(next.id)
    navigate(buildStepUrl(next))
  }
  const handleBack = (): void => {
    if (!prev) return
    onAdvance(prev.id)
    navigate(buildStepUrl(prev))
  }
  const handleSkip = (): void => {
    if (!next) return
    onAdvance(next.id)
    // Skip = navigate but do not mark complete
    navigate(buildStepUrl(next))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-border bg-card/30 shrink-0">
        <div className="text-xs text-muted-foreground">
          {flow.title}
          {videoMode ? ' · Video Mode' : paused ? ' · Paused' : ''}
        </div>
        <div className="flex items-center gap-1">
          {!videoMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={paused ? onResume : onPause}
              aria-label={paused ? 'Resume workshop' : 'Pause workshop'}
            >
              {paused ? (
                'Resume'
              ) : (
                <>
                  <Pause size={14} className="mr-1" />
                  Pause
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('Exit workshop? Progress is saved.')) onExit()
            }}
            aria-label="Exit workshop"
          >
            <X size={14} className="mr-1" />
            Exit
          </Button>
        </div>
      </div>

      <WorkshopStepCard
        step={step}
        flow={flow}
        index={idx >= 0 ? idx : 0}
        total={steps.length}
        isCompleted={completedStepIds.includes(step.id)}
        onBack={prev ? handleBack : null}
        onNext={next ? handleNext : null}
        onSkip={handleSkip}
        onMarkComplete={() => onMarkComplete(step.id)}
      />
    </div>
  )
}
