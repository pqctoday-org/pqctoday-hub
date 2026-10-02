// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { Map, Calendar, Building2, AlertTriangle, Scale } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { CompleteStepAction } from '../../../common/CompleteStepAction'
import {
  roadmapSummary,
  milestonesFor,
  siteRolloutMonths,
  SECTOR_LABEL,
  SITE_NOUN,
  SITES_PER_YEAR,
  ROADMAP_START_YEAR,
  type RoadmapInputs,
  type OrgSize,
  type BudgetLevel,
  type Jurisdiction,
} from '../data/roadmapData'
import type { OTSector } from '../data/otProtocolData'
import type { ZoneAssessment } from '../data/zoneConduitData'
import type { ConsequenceResult } from '../data/consequenceData'
import { CONSEQUENCE_SCENARIOS } from '../data/consequenceData'

interface SectorMigrationRoadmapProps {
  inputs: RoadmapInputs
  onInputsChange: (i: RoadmapInputs) => void
  topZone: ZoneAssessment | null
  consequenceResults: ConsequenceResult[]
  onComplete: () => void
}

const ORG_OPTIONS: { id: OrgSize; label: string }[] = [
  { id: 'small', label: `Small programme (${SITES_PER_YEAR.small} sites/yr)` },
  { id: 'medium', label: `Medium programme (${SITES_PER_YEAR.medium} sites/yr)` },
  { id: 'large', label: `Large programme (${SITES_PER_YEAR.large} sites/yr)` },
]
const BUDGET_OPTIONS: { id: BudgetLevel; label: string }[] = [
  { id: 'constrained', label: 'Constrained (×1.4 duration)' },
  { id: 'normal', label: 'Normal' },
  { id: 'accelerated', label: 'Accelerated (×0.7 duration)' },
]
const JURISDICTION_OPTIONS: { id: Jurisdiction; label: string }[] = [
  { id: 'us', label: 'United States' },
  { id: 'eu', label: 'European Union' },
  { id: 'both', label: 'US and EU' },
  { id: 'other', label: 'Other' },
]

const DRIVER_BAR: Record<string, string> = {
  forgery: 'bg-status-error/60',
  hndl: 'bg-status-warning/60',
  both: 'bg-primary/60',
  inventory: 'bg-muted-foreground/40',
}

export const SectorMigrationRoadmap: React.FC<SectorMigrationRoadmapProps> = ({
  inputs,
  onInputsChange,
  topZone,
  consequenceResults,
  onComplete,
}) => {
  const [pinned, setPinned] = useState<string | null>(null)
  const summary = useMemo(() => roadmapSummary(inputs), [inputs])
  const milestones = useMemo(() => milestonesFor(inputs), [inputs])
  const maxMonth = Math.max(60, summary.totalMonths)
  const planningMonth = (inputs.planningYear - ROADMAP_START_YEAR + 1) * 12

  const set = <K extends keyof RoadmapInputs>(k: K, v: RoadmapInputs[K]) =>
    onInputsChange({ ...inputs, [k]: v })

  const worst = consequenceResults.length
    ? consequenceResults.reduce((m, r) => (r.compound > m.compound ? r : m))
    : null
  const worstName = worst
    ? (CONSEQUENCE_SCENARIOS.find((s) => s.id === worst.scenarioId)?.name ?? worst.scenarioId)
    : null

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Build a multi-year plan for one sector. Phases are coloured by what drives them — red for
        forgery (signing roots), amber for HNDL (boundaries) — and any phase that ends after your
        CRQC planning year is flagged. Model estimate; no costs are shown because none could be
        sourced.
      </p>

      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Building2 size={16} className="text-primary" /> Organisation
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <span className="block text-xs text-muted-foreground mb-1">Sector</span>
            <FilterDropdown
              noContainer
              selectedId={inputs.sector}
              onSelect={(id) => set('sector', id as OTSector)}
              items={(Object.keys(SECTOR_LABEL) as OTSector[]).map((s) => ({
                id: s,
                // eslint-disable-next-line security/detect-object-injection
                label: SECTOR_LABEL[s],
              }))}
            />
          </div>
          <div>
            <span className="block text-xs text-muted-foreground mb-1">Programme capacity</span>
            <FilterDropdown
              noContainer
              selectedId={inputs.orgSize}
              onSelect={(id) => set('orgSize', id as OrgSize)}
              items={ORG_OPTIONS}
            />
          </div>
          <div>
            <span className="block text-xs text-muted-foreground mb-1">Budget pace</span>
            <FilterDropdown
              noContainer
              selectedId={inputs.budget}
              onSelect={(id) => set('budget', id as BudgetLevel)}
              items={BUDGET_OPTIONS}
            />
          </div>
          <div>
            <span className="block text-xs text-muted-foreground mb-1">Jurisdiction</span>
            <FilterDropdown
              noContainer
              selectedId={inputs.jurisdiction}
              onSelect={(id) => set('jurisdiction', id as Jurisdiction)}
              items={JURISDICTION_OPTIONS}
            />
          </div>
          <div>
            <label htmlFor="ot-site-count" className="block text-xs text-muted-foreground mb-1">
              Number of {SITE_NOUN[inputs.sector]}
            </label>
            <input
              id="ot-site-count"
              type="number"
              min={1}
              max={5000}
              value={inputs.siteCount}
              onChange={(e) => set('siteCount', Math.max(1, Number(e.target.value) || 1))}
              className="rounded-lg bg-muted border border-border text-foreground px-3 py-2 text-sm w-full"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Site rollout: {siteRolloutMonths(inputs)} months
            </p>
          </div>
          <div>
            <label htmlFor="ot-planning-year" className="block text-xs text-muted-foreground mb-1">
              CRQC planning year:{' '}
              <span className="font-mono text-foreground">{inputs.planningYear}</span>
            </label>
            <input
              id="ot-planning-year"
              type="range"
              min={2029}
              max={2040}
              step={1}
              value={inputs.planningYear}
              onChange={(e) => set('planningYear', Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-[10px] text-muted-foreground">
              An assumption you choose, not a prediction.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Map size={16} className="text-primary" /> Roadmap ({ROADMAP_START_YEAR} start)
        </h4>
        <div className="space-y-2">
          {summary.phases.map((p) => {
            const open = pinned === p.id
            return (
              <div key={p.id}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  onClick={() => setPinned(open ? null : p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setPinned(open ? null : p.id)
                    }
                  }}
                  className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="w-[120px] sm:w-[190px] shrink-0 text-right pr-2">
                    <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.durationMonths} mo · ends {p.finishYear}
                    </p>
                  </div>
                  <div className="flex-1 relative h-7 bg-muted/30 rounded overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 w-px bg-status-error"
                      style={{ left: `${Math.min(100, (planningMonth / maxMonth) * 100)}%` }}
                      aria-hidden="true"
                    />
                    <div
                      className={`absolute top-0 h-full rounded ${DRIVER_BAR[p.driver]} ${
                        p.afterPlanningYear ? 'ring-2 ring-status-error' : ''
                      }`}
                      style={{
                        left: `${(p.startMonth / maxMonth) * 100}%`,
                        width: `${(p.durationMonths / maxMonth) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                {open && (
                  <div className="ml-[128px] sm:ml-[198px] mt-1 text-xs text-muted-foreground bg-muted/40 rounded p-2 border border-border">
                    <p>{p.description}</p>
                    <p className="mt-1">
                      <span className="text-foreground">Assets:</span> {p.assets}
                    </p>
                    {p.afterPlanningYear && (
                      <p className="mt-1 text-status-error">
                        Ends after your CRQC planning year ({inputs.planningYear}).
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Red line = end of your CRQC planning year. Tap a phase for details.
        </p>
      </div>

      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-primary" /> Summary
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted-foreground">Total duration</p>
            <p className="text-lg font-bold">{summary.totalMonths} months</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted-foreground">Programme ends</p>
            <p className="text-lg font-bold">{summary.finishYear}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted-foreground">Signing roots done</p>
            <p className="text-lg font-bold">{summary.signingRootsFinish}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted-foreground">Phases after planning year</p>
            <p className={`text-lg font-bold ${summary.lateCount ? 'text-status-error' : ''}`}>
              {summary.lateCount}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Scale size={16} className="text-primary" /> Regulatory milestones for this sector and
          jurisdiction
        </h4>
        {milestones.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No jurisdiction-specific milestones in this model — use IEC 62443 as the baseline.
          </p>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {milestones.map((m) => (
              <li key={m.label} className="flex gap-2">
                <span className="font-mono font-bold text-foreground w-10 shrink-0">{m.year}</span>
                <span className="text-muted-foreground">
                  {m.label} <span className="text-foreground/60">({m.regime})</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(topZone || worst) && (
        <div className="glass-panel p-4 text-sm space-y-2">
          <h4 className="text-sm font-bold text-foreground">From earlier steps</h4>
          {topZone && (
            <p className="flex items-start gap-2 text-foreground/80">
              <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
              Zone planner: {topZone.zone.name} ranked first ({topZone.priority}, driven by{' '}
              {topZone.driver === 'hndl' ? 'HNDL' : 'forgery'}).
            </p>
          )}
          {worst && (
            <p className="flex items-start gap-2 text-foreground/80">
              <AlertTriangle size={14} className="text-status-error shrink-0 mt-0.5" />
              Consequence scorer: {worstName} scored highest ({worst.compound}, {worst.riskLevel}).
            </p>
          )}
        </div>
      )}

      <div className="flex justify-center pt-2">
        <CompleteStepAction recordsArtifact={false} onClick={onComplete} />
      </div>
    </div>
  )
}
