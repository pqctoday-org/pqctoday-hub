// SPDX-License-Identifier: GPL-3.0-only
/**
 * LandscapeTab — combined body for the unified Landscape tab.
 *
 * Was four separate tab bodies (`standards`, `technical`, `certification`,
 * `compliance`), each rendering a SectionHeader + CrossTabSearchHint +
 * <ComplianceLandscape> with a pre-filtered framework slice. This component
 * owns the type facet and selects the slice itself, so the four bodies
 * collapse to one.
 *
 * `<CrossTabSearchHint>` is omitted — the type facet IS the cross-tab
 * affordance now.
 */
import { useMemo } from 'react'
import { complianceFrameworks, type DeadlinePhase, type RegionBloc } from '@/data/complianceData'
import { ComplianceLandscape, type FrameworkSortOption } from './ComplianceLandscape'
import { LandscapeTypeFacet, type LandscapeType } from './LandscapeTypeFacet'
import { maturityByRefId } from '@/data/maturityGovernanceData'
import { type ViewMode } from '@/components/Library/ViewToggle'
import { useTrustTierFilter, matchesTrustTierFilter } from '@/components/common/TrustTierFilter'

interface Props {
  type: LandscapeType
  onTypeChange: (next: LandscapeType) => void
  /** Pass-through controlled state (lifted to ComplianceView for URL sync). */
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
  onSelectFramework?: (fw: import('@/data/complianceData').ComplianceFramework) => void
}

export function LandscapeTab({ type, onTypeChange, onNavigateToCswp39, ...landscape }: Props) {
  // Trust tier filter — applied before slicing so per-facet counts reflect
  // the active tier selection. Empty selection = no-op (pass everything).
  const tierFilter = useTrustTierFilter()
  const tierFilteredFrameworks = useMemo(
    () =>
      tierFilter.length === 0
        ? complianceFrameworks
        : complianceFrameworks.filter((f) =>
            matchesTrustTierFilter(tierFilter, 'compliance', f.id)
          ),
    [tierFilter]
  )

  // Same partitioning as the legacy tabs. Industry alliances ride along with
  // standardization bodies — they're standardization-adjacent.
  const slices = useMemo(() => {
    const bodies = tierFilteredFrameworks.filter(
      (f) => f.bodyType === 'standardization_body' || f.bodyType === 'industry_alliance'
    )
    const standards = tierFilteredFrameworks.filter((f) => f.bodyType === 'technical_standard')
    const certifications = tierFilteredFrameworks.filter((f) => f.bodyType === 'certification_body')
    const regulations = tierFilteredFrameworks.filter((f) => f.bodyType === 'compliance_framework')
    return { bodies, standards, certifications, regulations }
  }, [tierFilteredFrameworks])

  const counts = {
    regulations: slices.regulations.length,
    standards: slices.standards.length,
    certifications: slices.certifications.length,
    bodies: slices.bodies.length,
  }

  // eslint-disable-next-line security/detect-object-injection
  const frameworks = slices[type]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <LandscapeTypeFacet value={type} counts={counts} onChange={onTypeChange} />
        <span className="text-xs text-muted-foreground">
          {/* eslint-disable-next-line security/detect-object-injection */}
          {counts[type]} {type}
          {counts[type] === 1 ? '' : ''}
        </span>
      </div>
      <ComplianceLandscape
        frameworks={frameworks}
        showDeadlineTimeline={false}
        maturityByRefId={maturityByRefId}
        onNavigateToCswp39={onNavigateToCswp39}
        {...landscape}
      />
    </div>
  )
}
