// SPDX-License-Identifier: GPL-3.0-only
//
// The Landscape centrepiece: a three-pillar pipeline that makes the page's
// premise legible — Define → Validate → Mandate. Selecting a pillar filters the
// framework table below (the proven <ComplianceLandscape>) to that body type.
// Replaces the flat 4-way LandscapeTypeFacet.

import { useMemo } from 'react'
import { BookOpen, Award, Scale, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComplianceFramework, DeadlinePhase, RegionBloc } from '@/data/complianceData'
import { maturityByRefId } from '@/data/maturityGovernanceData'
import type { ViewMode } from '@/components/Library/ViewToggle'
import { ComplianceLandscape, type FrameworkSortOption } from '../ComplianceLandscape'
import { PILLAR_DEFS, frameworksForPillar, pillarCounts, type PillarId } from './pillarModel'

const PILLAR_ICON: Record<PillarId, typeof BookOpen> = {
  standardize: BookOpen,
  certify: Award,
  comply: Scale,
}

interface PillarPipelineProps {
  /** Tier-filtered framework universe (already filtered upstream). */
  frameworks: ComplianceFramework[]
  activePillar: PillarId
  onPillarChange: (pillar: PillarId) => void
  // Landscape filter pass-through (URL-synced in ComplianceView).
  orgFilter: string
  industryFilter: string
  regionFilter: RegionBloc | 'All'
  countryFilter: string
  deadlineFilter: 'All' | DeadlinePhase
  searchText: string
  searchInputValue: string
  sortBy: FrameworkSortOption
  viewMode: ViewMode
  onOrgFilterChange: (org: string) => void
  onIndustryFilterChange: (ind: string) => void
  onRegionFilterChange: (region: RegionBloc | 'All') => void
  onCountryFilterChange: (country: string) => void
  onDeadlineFilterChange: (phase: 'All' | DeadlinePhase) => void
  onSearchTextChange: (text: string) => void
  onSortByChange: (sort: FrameworkSortOption) => void
  onViewModeChange: (mode: ViewMode) => void
  onNavigateToCswp39?: (refId: string) => void
  highlightFrameworkId?: string | null
  /** Row click → opens the traceability drawer. */
  onSelectFramework?: (fw: ComplianceFramework) => void
}

export function PillarPipeline({
  frameworks,
  activePillar,
  onPillarChange,
  ...landscape
}: PillarPipelineProps) {
  const counts = useMemo(() => pillarCounts(frameworks), [frameworks])
  const activeFrameworks = useMemo(
    () => frameworksForPillar(activePillar, frameworks),
    [activePillar, frameworks]
  )

  return (
    <div className="space-y-4">
      {/* Pillar pipeline */}
      <div
        className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-stretch"
        role="tablist"
        aria-label="Compliance pillars"
      >
        {PILLAR_DEFS.map((p, i) => {
          const Icon = PILLAR_ICON[p.id]
          const active = p.id === activePillar
          return (
            <div key={p.id} className="flex flex-1 items-stretch gap-3">
              <Button
                type="button"
                variant="ghost"
                role="tab"
                aria-selected={active}
                onClick={() => onPillarChange(p.id)}
                className={`flex h-auto flex-1 flex-col items-start whitespace-normal rounded-2xl border p-4 text-left transition-colors ${
                  active
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-card hover:border-primary/20'
                }`}
              >
                <div className="mb-2 flex items-center gap-2.5">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-extrabold ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-muted text-muted-foreground'
                    }`}
                  >
                    {p.step}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
                      <Icon size={11} className="mr-1 inline" />
                      {p.verb}
                    </div>
                    <div className="text-sm font-bold text-foreground">{p.title}</div>
                  </div>
                </div>
                <p className="text-[11.5px] leading-snug text-muted-foreground">{p.blurb}</p>
                <div className="mt-3 flex items-end gap-1.5">
                  <span
                    className={`text-2xl font-extrabold leading-none tracking-tight ${
                      active ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {counts[p.id]}
                  </span>
                  <span className="pb-0.5 text-[11px] text-muted-foreground">{p.countLabel}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {p.samples.map((s) => (
                    <span
                      key={s}
                      className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Button>
              {/* Connector */}
              {i < PILLAR_DEFS.length - 1 && (
                <div className="hidden w-16 shrink-0 flex-col items-center justify-center gap-1 lg:flex">
                  <span className="text-center text-[9px] uppercase leading-tight text-muted-foreground">
                    {p.connector}
                  </span>
                  <ArrowRight size={18} className="text-primary" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Active-pillar table */}
      <ComplianceLandscape
        frameworks={activeFrameworks}
        showDeadlineTimeline={false}
        maturityByRefId={activePillar === 'comply' ? maturityByRefId : undefined}
        {...landscape}
      />
    </div>
  )
}
