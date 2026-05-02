// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
  GraduationCap,
  Play,
  Video,
  Clock,
  Pause,
  X,
  ChevronDown,
  Sparkles,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { flattenFlow, getNextStep, getPrevStep, findStepIndex } from '@/data/workshopRegistry'
import type { WorkshopChapter, WorkshopFlow, WorkshopRegion, WorkshopStep } from '@/types/Workshop'
import { WorkshopPrereqList } from './WorkshopPrereqList'
import { labelForRegion } from '@/utils/workshopRegion'
import { WorkshopStepCard } from './WorkshopStepCard'
import { useWorkshopAutoComplete } from '@/hooks/useWorkshopAutoComplete'
import { useWorkshopManifest } from '@/hooks/useWorkshopManifest'
import { buildStepUrl } from '@/utils/workshopDeepLink'

export const WorkshopPanel: React.FC = () => {
  useWorkshopAutoComplete()

  const {
    mode,
    currentStepId,
    completedStepIds,
    selectedRegion,
    playbackSpeed,
    playbackMode,
    start,
    startVideo,
    exit,
    pause,
    resume,
    setStep,
    markStepComplete,
    setPlaybackSpeed,
    setPlaybackMode,
  } = useWorkshopStore()

  const [pickedRegion, setPickedRegion] = useState<WorkshopRegion | null>(selectedRegion)
  const [activeTab, setActiveTab] = useState<'recommended' | 'browse'>('recommended')

  // Auto-clear flowOverrideId when the persona context changes — a previously
  // hand-picked flow shouldn't keep showing after the user switches role,
  // proficiency, or industry. The hook fires once on mount with the current
  // values; the ref skips that initial run so we don't clobber a fresh override.
  const personaRole = usePersonaStore((s) => s.selectedPersona)
  const personaProf = usePersonaStore((s) => s.experienceLevel)
  const personaIndustry = usePersonaStore((s) => s.selectedIndustry)
  const setFlowOverride = useWorkshopStore((s) => s.setFlowOverrideId)
  const lastPersonaSig = useRef<string | null>(null)
  useEffect(() => {
    const sig = `${personaRole}|${personaProf}|${personaIndustry}`
    if (lastPersonaSig.current !== null && lastPersonaSig.current !== sig) {
      setFlowOverride(null)
    }
    lastPersonaSig.current = sig
  }, [personaRole, personaProf, personaIndustry, setFlowOverride])

  // Manifest hook resolves the matched flow + honors the user's flowOverrideId.
  const { manifest, activeEntry, matchedEntry, compatibleEntries, activeFlow, isLoading } =
    useWorkshopManifest(pickedRegion)

  const flowOverrideId = useWorkshopStore((s) => s.flowOverrideId)
  const setFlowOverrideId = useWorkshopStore((s) => s.setFlowOverrideId)

  const isRunningOrVideo = mode === 'running' || mode === 'video' || mode === 'paused'

  if (isRunningOrVideo) {
    return (
      <RunningView
        flow={activeFlow}
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

  // The Start / Record buttons are enabled when prerequisites are met for the
  // active flow (matched OR overridden). Generic flows have wildcard match so
  // they're always available; specific flows require the picked region.
  const prereqsReady = activeFlow !== null && pickedRegion !== null

  const headerTitle = activeEntry?.title ?? 'Workshop'
  const headerSubtitle = activeEntry
    ? `${formatMatchSummary(activeEntry.match)} · ~${activeEntry.totalEstMinutes} min`
    : 'Pick a flow to begin'

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <GraduationCap size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">{headerTitle}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
      </header>

      {/* Per-flow inner tab bar — one tab per compatible flow, generic last. */}
      {compatibleEntries.length > 1 && (
        <div
          className="flex flex-wrap items-center gap-1 border-b border-border"
          role="tablist"
          aria-label="Compatible workshops"
        >
          {compatibleEntries.map((entry) => {
            const isActive = activeEntry?.id === entry.id
            const isMatched = matchedEntry?.id === entry.id
            return (
              <Button
                key={entry.id}
                variant="ghost"
                size="sm"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFlowOverrideId(isMatched ? null : entry.id)}
                className={`rounded-none rounded-t-md border-b-2 text-xs ${
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {entry.title}
                {entry.isGenericFallback && (
                  <span className="ml-1.5 text-[10px] text-muted-foreground/70">(fallback)</span>
                )}
              </Button>
            )
          })}
        </div>
      )}

      {activeFlow && activeFlow.whatToExpect && activeFlow.whatToExpect.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-3 space-y-2">
          <h3 className="text-sm font-medium text-foreground">What to expect</h3>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside marker:text-primary">
            {activeFlow.whatToExpect.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-border bg-card p-3 space-y-2">
        <h3 className="text-sm font-medium text-foreground">Pre-flight checklist</h3>
        <WorkshopPrereqList
          pickedRegion={pickedRegion}
          onPickRegion={setPickedRegion}
          flowMatch={activeEntry?.match}
          onPickAnotherFlow={() => setActiveTab('browse')}
        />
      </section>

      {/* Recommended / Browse-all tab bar */}
      <div className="flex items-center gap-1 border-b border-border" role="tablist">
        <Button
          variant="ghost"
          size="sm"
          role="tab"
          aria-selected={activeTab === 'recommended'}
          onClick={() => setActiveTab('recommended')}
          className={`flex-1 rounded-none rounded-t-md border-b-2 ${
            activeTab === 'recommended'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles size={14} className="mr-1.5" />
          Recommended
        </Button>
        <Button
          variant="ghost"
          size="sm"
          role="tab"
          aria-selected={activeTab === 'browse'}
          onClick={() => setActiveTab('browse')}
          className={`flex-1 rounded-none rounded-t-md border-b-2 ${
            activeTab === 'browse'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <List size={14} className="mr-1.5" />
          Browse all
        </Button>
      </div>

      {isLoading && !manifest ? (
        <section className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
          Loading workshop catalogue…
        </section>
      ) : activeTab === 'recommended' ? (
        activeFlow ? (
          <>
            {flowOverrideId && matchedEntry && activeEntry?.id !== matchedEntry.id && (
              <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-foreground flex items-center justify-between gap-2">
                <span>
                  Using <strong>{activeEntry?.title}</strong>. Reset to recommended (
                  <em>{matchedEntry.title}</em>)?
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setFlowOverrideId(null)}
                >
                  Reset
                </Button>
              </div>
            )}
            <FlowAgenda flow={activeFlow} region={pickedRegion ?? 'US'} />
          </>
        ) : (
          <section className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            {!pickedRegion
              ? 'Pick a country in the pre-flight checklist to see the recommended workshop.'
              : 'No matched workshop flow yet — switch to Browse all to pick one manually.'}
          </section>
        )
      ) : (
        <BrowseAllFlows
          manifest={manifest}
          activeId={activeEntry?.id ?? null}
          matchedId={matchedEntry?.id ?? null}
          onSelect={(id) => {
            setFlowOverrideId(id)
            setActiveTab('recommended')
          }}
        />
      )}

      <div className="flex flex-col gap-2">
        <Button
          variant="gradient"
          className="w-full"
          disabled={!activeFlow || !prereqsReady}
          onClick={() => {
            if (!activeFlow || !pickedRegion) return
            const steps = flattenFlow(activeFlow, pickedRegion)
            if (steps.length === 0) return
            start(activeFlow.id, steps[0].id, pickedRegion)
          }}
        >
          <Play size={16} className="mr-2" />
          Start Workshop
        </Button>

        {/* Video Mode playback — Mode (Preview vs Presentation) + Speed.
            Preview: each step plays for fixed STEP_DURATION_MS[speed] (5/10/20s).
            Presentation: cues play at authored tMs, multiplied by speed (2x/1x/0.5x). */}
        <div className="rounded-md border border-border bg-card p-2 space-y-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Mode
              </span>
              <span className="text-[10px] text-muted-foreground">
                {playbackMode === 'preview' ? 'Fast tour' : 'Authored timeline'}
              </span>
            </div>
            <div className="flex gap-1.5">
              {(
                [
                  { value: 'preview', label: 'Preview' },
                  { value: 'presentation', label: 'Presentation' },
                ] as const
              ).map((opt) => (
                <Button
                  key={opt.value}
                  variant={playbackMode === opt.value ? 'gradient' : 'outline'}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setPlaybackMode(opt.value)}
                  aria-pressed={playbackMode === opt.value}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Speed
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {playbackMode === 'preview'
                  ? playbackSpeed === 'slow'
                    ? '20s/step'
                    : playbackSpeed === 'fast'
                      ? '5s/step'
                      : '10s/step'
                  : playbackSpeed === 'slow'
                    ? '2× (longer)'
                    : playbackSpeed === 'fast'
                      ? '0.5× (faster)'
                      : '1× (authored)'}
              </span>
            </div>
            <div className="flex gap-1.5">
              {(
                [
                  { value: 'slow', label: 'Slow' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'fast', label: 'Fast' },
                ] as const
              ).map((opt) => (
                <Button
                  key={opt.value}
                  variant={playbackSpeed === opt.value ? 'gradient' : 'outline'}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setPlaybackSpeed(opt.value)}
                  aria-pressed={playbackSpeed === opt.value}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          disabled={!activeFlow || !prereqsReady}
          onClick={() => {
            if (!activeFlow || !pickedRegion) return
            const steps = flattenFlow(activeFlow, pickedRegion)
            if (steps.length === 0) return
            startVideo(activeFlow.id, steps[0].id, pickedRegion)
            // Minimize the panel — Video Mode renders captions + spotlight on top of the main pane.
            useRightPanelStore.getState().minimize()
          }}
        >
          <Video size={16} className="mr-2" />
          Record this workshop (video mode)
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {manifest?.flows.length ?? 0} flow{(manifest?.flows.length ?? 0) === 1 ? '' : 's'}{' '}
        available. Additional persona flows (Curious, Developer, Architect, Ops, Researcher; other
        industries) are in development.
      </p>
    </div>
  )
}

function formatMatchSummary(match: import('@/types/Workshop').FlowMatch): string {
  const fmt = (val: readonly string[] | '*' | undefined): string => {
    if (val === '*' || val === undefined) return 'any'
    if (val.length === 0) return 'any'
    if (val.length <= 2) return val.join(' / ')
    return `${val.length} options`
  }
  const parts = [fmt(match.roles), fmt(match.industries), fmt(match.regions)]
  return parts.join(' · ')
}

interface FlowAgendaProps {
  flow: WorkshopFlow
  region: WorkshopRegion
}

const FlowAgenda: React.FC<FlowAgendaProps> = ({ flow, region }) => {
  const regionChapter = flow.regions?.[region]

  // Ordered chapter list, inserting the region chapter just before the 'action'
  // chapter (matches flattenFlow's order).
  const orderedChapters: { chapter: WorkshopChapter; regionLabel?: string }[] = []
  orderedChapters.push({ chapter: flow.intro })
  orderedChapters.push({ chapter: flow.prerequisites })
  for (const c of flow.common) {
    if (c.id === 'action' && regionChapter) {
      orderedChapters.push({ chapter: regionChapter, regionLabel: labelForRegion(region) })
    }
    orderedChapters.push({ chapter: c })
  }
  orderedChapters.push({ chapter: flow.close })

  const scopedMinutes = orderedChapters.reduce((s, { chapter }) => s + (chapter.estMinutes ?? 0), 0)

  return (
    <section className="rounded-lg border border-border bg-card p-3 space-y-2">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
        <Clock size={14} className="text-muted-foreground" /> Agenda · {scopedMinutes} min
      </h3>
      <div className="space-y-1.5">
        {orderedChapters.map(({ chapter, regionLabel }) => (
          <AgendaChapterSection key={chapter.id} chapter={chapter} regionLabel={regionLabel} />
        ))}
      </div>
    </section>
  )
}

interface AgendaChapterSectionProps {
  chapter: WorkshopChapter
  regionLabel?: string
}

const AgendaChapterSection: React.FC<AgendaChapterSectionProps> = ({ chapter, regionLabel }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-md border border-border/70 bg-background/40">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full h-auto justify-between gap-2 px-2.5 py-2 text-left rounded-md font-normal"
      >
        <span className="flex items-center gap-2 min-w-0">
          <ChevronDown
            size={14}
            className={`text-muted-foreground shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
          />
          <span className="text-sm text-foreground truncate">
            {chapter.title}
            {regionLabel ? <span className="text-muted-foreground"> · {regionLabel}</span> : null}
          </span>
        </span>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {chapter.steps.length} step{chapter.steps.length === 1 ? '' : 's'} · {chapter.estMinutes}{' '}
          min
        </span>
      </Button>
      {open && (
        <ol className="px-2.5 pb-2 pt-0 space-y-2">
          {chapter.steps.map((step, i) => (
            <li
              key={step.id}
              className="text-xs leading-relaxed pt-2 border-t border-border/40 first:border-t-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-2 min-w-0 flex-1">
                  <span className="text-muted-foreground tabular-nums shrink-0 w-5">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-foreground block font-medium">{step.title}</span>
                    <code className="block text-[11px] text-primary/90 break-all mt-0.5 font-mono">
                      {buildStepUrl(step)}
                    </code>
                    <ul className="mt-1 space-y-0.5">
                      {step.tasks.map((task, j) => (
                        <li key={j} className="flex gap-1.5 text-muted-foreground/90">
                          <span className="text-muted-foreground/60 shrink-0">·</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <span className="text-muted-foreground tabular-nums shrink-0">
                  ~{step.estMinutes}m
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

interface RunningViewProps {
  flow: WorkshopFlow | null
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
  flow,
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

interface BrowseAllFlowsProps {
  manifest: import('@/services/workshopFlowLoader').WorkshopFlowManifest | null
  activeId: string | null
  matchedId: string | null
  onSelect: (id: string) => void
}

const BrowseAllFlows: React.FC<BrowseAllFlowsProps> = ({
  manifest,
  activeId,
  matchedId,
  onSelect,
}) => {
  if (!manifest || manifest.flows.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
        No workshop flows in the catalogue yet.
      </section>
    )
  }
  return (
    <section className="rounded-lg border border-border bg-card p-3 space-y-2">
      <h3 className="text-sm font-medium text-foreground">All workshops</h3>
      <ul className="space-y-1.5">
        {manifest.flows.map((entry) => {
          const isActive = entry.id === activeId
          const isMatched = entry.id === matchedId
          return (
            <li key={entry.id}>
              <Button
                variant={isActive ? 'gradient' : 'outline'}
                size="sm"
                onClick={() => onSelect(entry.id)}
                className="w-full h-auto justify-start p-3 whitespace-normal text-left"
                aria-pressed={isActive}
              >
                <div className="flex flex-col items-start gap-1 min-w-0 w-full">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{entry.title}</span>
                    {isMatched && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                        Recommended
                      </span>
                    )}
                    {entry.isGenericFallback && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Generic
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.stepCount} step{entry.stepCount === 1 ? '' : 's'} ·{' '}
                    {entry.totalEstMinutes} min
                  </div>
                </div>
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
