// SPDX-License-Identifier: GPL-3.0-only
/**
 * Two-Track roadmap swimlane — renders milestones across three lanes (the
 * Foundations/governance spine + Track A confidentiality + Track B integrity)
 * on a shared year ruler, with phase/gate chips and dependency badges, plus an
 * add-milestone form. Replaces the flat `TimelinePlanner` for the Roadmap
 * Builder so the framework's parallel-track structure is visible to the learner.
 */
import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { FRAMEWORK_PHASES, PHASE_ORDER, type PhaseId } from '@/data/frameworkPhases'
import type { ExternalDeadline } from '../../../common/executive'
import {
  TRACK_META,
  TRACK_ORDER,
  criticalPathLength,
  criticalPathSpanYears,
  newMilestoneId,
  type RoadmapMilestone,
  type RoadmapTrack,
} from './roadmapTracks'

interface TwoTrackRoadmapTimelineProps {
  milestones: RoadmapMilestone[]
  deadlines: ExternalDeadline[]
  yearRange: [number, number]
  onChange: (next: RoadmapMilestone[]) => void
}

const TRACK_ACCENT: Record<RoadmapTrack, string> = {
  program: 'border-primary/40 bg-primary/5',
  A: 'border-status-info/40 bg-status-info/5',
  B: 'border-status-warning/40 bg-status-warning/5',
}

function phaseLabel(id: PhaseId): string {
  const p = FRAMEWORK_PHASES[id]
  if (p.number !== null) return `P${p.number}`
  return id === 'verify-close' ? 'V&C' : 'Foundations'
}

export const TwoTrackRoadmapTimeline: React.FC<TwoTrackRoadmapTimelineProps> = ({
  milestones,
  deadlines,
  yearRange,
  onChange,
}) => {
  const [min, max] = yearRange
  const [draftLabel, setDraftLabel] = useState('')
  const [draftYear, setDraftYear] = useState<number>(min + 1)
  const [draftPhase, setDraftPhase] = useState<PhaseId>('p3')
  const [draftTrack, setDraftTrack] = useState<RoadmapTrack>('A')
  const [draftDeps, setDraftDeps] = useState<string[]>([])

  const labelById = useMemo(() => new Map(milestones.map((m) => [m.id, m.label])), [milestones])
  const critPath = useMemo(() => criticalPathLength(milestones), [milestones])
  const critSpan = useMemo(() => criticalPathSpanYears(milestones), [milestones])
  const years = useMemo(() => {
    const out: number[] = []
    for (let y = min; y <= max; y++) out.push(y)
    return out
  }, [min, max])

  const addMilestone = () => {
    if (!draftLabel.trim()) return
    onChange([
      ...milestones,
      {
        id: newMilestoneId(),
        label: draftLabel.trim(),
        year: draftYear,
        phaseId: draftPhase,
        track: draftTrack,
        dependsOn: draftDeps.length ? draftDeps : undefined,
      },
    ])
    setDraftLabel('')
    setDraftDeps([])
  }

  const removeMilestone = (id: string) =>
    onChange(
      milestones
        .filter((m) => m.id !== id)
        .map((m) => ({ ...m, dependsOn: m.dependsOn?.filter((d) => d !== id) }))
    )

  return (
    <div className="space-y-4">
      {/* Year ruler + selected regulatory deadlines */}
      <div className="glass-panel p-3">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          {years
            .filter((_, i) => i % 2 === 0)
            .map((y) => (
              <span key={y}>{y}</span>
            ))}
        </div>
        {deadlines.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {deadlines.map((d, i) => (
              <span
                key={`${d.label}-${d.year}-${i}`}
                className="text-[10px] rounded bg-status-error/10 text-status-error px-1.5 py-0.5 border border-status-error/30"
              >
                {d.year} · {d.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* The three lanes */}
      {TRACK_ORDER.map((track) => {
        const meta = TRACK_META[track]
        const laneMs = milestones.filter((m) => m.track === track).sort((a, b) => a.year - b.year)
        return (
          <div key={track} className={`rounded-lg border p-3 ${TRACK_ACCENT[track]}`}>
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <h4 className="text-sm font-semibold text-foreground" title={meta.rationale}>
                {meta.label}
              </h4>
              <span className="text-[10px] text-muted-foreground">{meta.focus}</span>
            </div>
            {laneMs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No milestones in this lane yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {laneMs.map((m) => {
                  const phase = FRAMEWORK_PHASES[m.phaseId]
                  const gateTip = phase.gate
                    ? `${phase.gate.id}: ${phase.gate.criterion} (sign-off: ${phase.gate.authority})`
                    : phase.name
                  return (
                    <div
                      key={m.id}
                      className="flex items-start gap-2 rounded-md bg-background/60 border border-border p-2"
                    >
                      <span className="text-xs font-mono text-muted-foreground shrink-0 w-12">
                        {m.year}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="text-[10px] rounded bg-primary/10 text-primary px-1.5 py-0.5 border border-primary/30"
                            title={gateTip}
                          >
                            {phaseLabel(m.phaseId)}
                            {phase.gate ? ` · ${phase.gate.id}` : ''}
                          </span>
                          <span className="text-sm text-foreground">{m.label}</span>
                        </div>
                        {m.dependsOn && m.dependsOn.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] text-muted-foreground">depends on:</span>
                            {m.dependsOn.map((dep) => (
                              <span
                                key={dep}
                                className="text-[10px] rounded bg-muted px-1 py-0.5 text-muted-foreground"
                              >
                                {labelById.get(dep) ?? dep}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(m.id)}
                        aria-label="Remove milestone"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        ×
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <p className="text-xs text-muted-foreground">
        Critical path: spans{' '}
        <span className="font-semibold text-foreground">
          {critSpan === 0 ? 'within one year' : `${critSpan} year${critSpan !== 1 ? 's' : ''}`}
        </span>{' '}
        across <span className="font-semibold text-foreground">{critPath}</span> milestone
        {critPath !== 1 ? 's' : ''} (longest dependency chain — the time span is what actually
        constrains the timeline).
      </p>

      {/* Add-milestone form */}
      <div className="glass-panel p-3 space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Add milestone</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <input
            type="text"
            className="text-sm rounded-md border border-input bg-background p-2"
            placeholder="Milestone label"
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            aria-label="Milestone label"
          />
          <input
            type="number"
            className="text-sm rounded-md border border-input bg-background p-2"
            value={draftYear}
            min={min}
            max={max}
            onChange={(e) => setDraftYear(Number(e.target.value))}
            aria-label="Milestone year"
          />
          <FilterDropdown
            items={PHASE_ORDER.map((p) => ({
              id: p,
              label: `${phaseLabel(p)} — ${FRAMEWORK_PHASES[p].name}`,
            }))}
            selectedId={draftPhase}
            onSelect={(id) => setDraftPhase(id as PhaseId)}
            ariaLabel="Framework phase"
            hideDefaultOption
            noContainer
            className="w-full"
          />
          <FilterDropdown
            items={TRACK_ORDER.map((t) => ({ id: t, label: TRACK_META[t].label }))}
            selectedId={draftTrack}
            onSelect={(id) => setDraftTrack(id as RoadmapTrack)}
            ariaLabel="Track"
            hideDefaultOption
            noContainer
            className="w-full"
          />
        </div>
        {milestones.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-muted-foreground">depends on:</span>
            {milestones.map((m) => {
              const on = draftDeps.includes(m.id)
              return (
                <Button
                  key={m.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDraftDeps((prev) => (on ? prev.filter((d) => d !== m.id) : [...prev, m.id]))
                  }
                  className={`h-auto rounded px-1.5 py-0.5 text-[10px] border font-normal ${
                    on
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-background border-border text-muted-foreground'
                  }`}
                >
                  {m.label}
                </Button>
              )
            })}
          </div>
        )}
        <Button type="button" size="sm" onClick={addMilestone} disabled={!draftLabel.trim()}>
          + Add milestone
        </Button>
      </div>
    </div>
  )
}
