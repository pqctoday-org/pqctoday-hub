// SPDX-License-Identifier: GPL-3.0-only
/**
 * ArchitectStandardsView — persona-specific For You body for the Architect
 * persona on /compliance. Closes audit P1 #10 (audit-2026-05-15.md §5.2).
 *
 * Per-persona spec (from 2026-05-16 design call):
 *   - Top widget: maturity dashboard (CSWP-39 5-pillar × 4-tier grid)
 *   - Filter affordance: jurisdiction map (regional grouping of applicable frameworks)
 *   - Empty state: "Set your stack first" → /assess CTA
 *
 * Reuses the same useApplicabilityWithPaths engine output as ExecutiveTimelineView
 * and ApplicabilityPanel so the persona switch only changes rendering, not the
 * underlying recommendation set.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Layers, GlobeLock, ArrowRight } from 'lucide-react'
import { useApplicabilityWithPaths } from '../../../hooks/useApplicabilityWithPaths'
import { groupByTier, type UserProfile } from '../../../utils/applicabilityEngine'
import { ProfileEditor } from '../../applicability/parts/ProfileEditor'
import { ProfileSummary } from '../../applicability/parts/ProfileSummary'
import { LibraryDocItem } from '../../applicability/parts/items'
import { MaturityEvidenceGrid } from '../MaturityEvidenceGrid'
import { Button } from '@/components/ui/button'
import { maturityRequirements } from '../../../data/maturityGovernanceData'
import {
  regionForCountry,
  type ComplianceFramework,
  type RegionBloc,
} from '../../../data/complianceData'
import type { LibraryItem } from '../../../data/libraryData'
import type { ThreatData } from '../../../data/threatsData'
import type { TimelineEvent } from '../../../types/timeline'

interface ArchitectStandardsViewProps {
  profileOverride?: Partial<UserProfile>
  onSelectLibrary?: (item: LibraryItem) => void
  onSelectThreat?: (item: ThreatData) => void
  onSelectTimeline?: (item: TimelineEvent) => void
  onSelectFramework?: (item: ComplianceFramework) => void
}

export function ArchitectStandardsView({
  profileOverride,
  onSelectLibrary,
  onSelectFramework,
}: ArchitectStandardsViewProps) {
  const { profile, isEmpty, frameworks, library } = useApplicabilityWithPaths(profileOverride)

  // Tier grouping mirrors the executive view; architect surfaces all tiers
  // collapsed into a single jurisdiction-rolled list (the regional map IS
  // the primary filter affordance here).
  const grouped = useMemo(() => groupByTier(frameworks), [frameworks])
  const applicable: ComplianceFramework[] = useMemo(
    () =>
      [
        ...grouped.mandatory,
        ...grouped.recognized,
        ...grouped['cross-border'],
        ...grouped.advisory,
      ].map((r) => r.item),
    [grouped]
  )

  // Group applicable frameworks by region bloc
  const byRegion = useMemo(() => {
    const m = new Map<RegionBloc | 'Other', ComplianceFramework[]>()
    for (const fw of applicable) {
      const regions = new Set<RegionBloc | 'Other'>()
      for (const c of fw.countries) regions.add(regionForCountry(c) as RegionBloc)
      // Each framework can sit in multiple region buckets (e.g. EU + Global)
      for (const r of regions) {
        const arr = m.get(r) ?? []
        arr.push(fw)
        m.set(r, arr)
      }
    }
    return m
  }, [applicable])

  // Region display order — same as REGION_BLOC_ORDER in complianceData
  const REGION_ORDER: (RegionBloc | 'Other')[] = [
    'Global',
    'North America',
    'European Union',
    'United Kingdom',
    'Europe (non-EU)',
    'Latin America',
    'Asia-Pacific',
    'Middle East',
    'Africa',
    'Other',
  ]
  const orderedRegions = REGION_ORDER.filter((r) => byRegion.has(r))

  // Maturity requirements filtered to the user-relevant compliance refs
  // (every applicable framework's library_refs that surface in the maturity corpus)
  const relevantRefIds = useMemo(() => {
    const ids = new Set<string>()
    for (const fw of applicable) {
      for (const r of fw.libraryRefs ?? []) ids.add(r)
      ids.add(fw.id)
    }
    return ids
  }, [applicable])
  const filteredMaturity = useMemo(
    () => maturityRequirements.filter((r) => relevantRefIds.has(r.refId)),
    [relevantRefIds]
  )

  if (isEmpty) {
    return (
      <div className="space-y-3">
        <ProfileEditor
          profile={profile}
          message="Set your stack first — pick an industry and country so the maturity dashboard and jurisdiction map can show the standards that actually constrain your system."
        />
        <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Want a deeper inventory? Take the full assessment.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              The architect view sharpens once your data sensitivity, retention, and crypto-stack
              inventory are recorded in your assessment profile.
            </p>
          </div>
          <Button asChild variant="gradient" size="sm">
            <Link to="/assess" className="flex items-center gap-1.5">
              Start assessment <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div data-section-id="profile-summary" className="scroll-mt-20">
        <ProfileSummary profile={profile} editable />
      </div>

      {/* ── Top widget: Maturity dashboard ───────────────────────── */}
      <section
        data-section-id="architect-maturity"
        className="glass-panel p-4 space-y-2 scroll-mt-20"
      >
        <header className="flex items-center gap-2">
          <Layers size={16} className="text-secondary" />
          <h3 className="text-base font-semibold text-foreground">Crypto-Agility Maturity</h3>
          <span className="text-xs text-muted-foreground">
            Where your applicable standards land on the CSWP-39 5-pillar × 4-tier grid
          </span>
        </header>
        {filteredMaturity.length > 0 ? (
          <MaturityEvidenceGrid requirements={filteredMaturity} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No CSWP-39 maturity rows mapped to your applicable standards yet. The maturity corpus
            (`pqc_maturity_governance_requirements_*.csv`) is grown by ongoing enrichment runs.
            Browse the full grid in the workshop's Crypto Management Modernization module.
          </p>
        )}
      </section>

      {/* ── Filter affordance: Jurisdiction map ─────────────────── */}
      <section data-section-id="architect-jurisdictions" className="space-y-3 scroll-mt-20">
        <header className="flex items-center gap-2">
          <GlobeLock size={16} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Jurisdiction map</h3>
          <span className="text-xs text-muted-foreground">
            Frameworks that bind your stack, grouped by regulatory bloc
          </span>
        </header>
        {orderedRegions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No region-tagged frameworks matched.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {orderedRegions.map((region) => {
              const fws = byRegion.get(region) ?? []
              return (
                <div key={region} className="glass-panel p-3 space-y-2 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{region}</h4>
                    <span className="text-[11px] text-muted-foreground">
                      {fws.length} framework{fws.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <ul className="space-y-1 min-w-0">
                    {fws.slice(0, 8).map((fw) => (
                      <li key={fw.id} className="min-w-0">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => onSelectFramework?.(fw)}
                          className="h-auto px-1.5 py-0.5 text-left text-xs text-foreground hover:text-primary w-full justify-start gap-1.5 truncate"
                          title={fw.label}
                        >
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                              fw.pqcRequirement === 'yes'
                                ? 'bg-status-success'
                                : fw.pqcRequirement === 'partial' ||
                                    fw.pqcRequirement === 'expected'
                                  ? 'bg-status-warning'
                                  : fw.pqcRequirement === 'guidance'
                                    ? 'bg-status-info'
                                    : 'bg-muted-foreground'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="truncate">{fw.label}</span>
                        </Button>
                      </li>
                    ))}
                    {fws.length > 8 && (
                      <li className="text-[11px] text-muted-foreground italic">
                        + {fws.length - 8} more — switch to Landscape tab for the full grid
                      </li>
                    )}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Cross-references: library docs the architect should read ── */}
      {library.length > 0 && (
        <section data-section-id="architect-library" className="space-y-2 scroll-mt-20">
          <header className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">Standards to read</h3>
            <span className="text-xs text-muted-foreground">
              Library documents cited by your applicable frameworks
            </span>
          </header>
          <ul className="space-y-1 min-w-0">
            {library.slice(0, 8).map((r, i) => (
              <li key={i} className="min-w-0">
                <LibraryDocItem result={r} onSelect={onSelectLibrary} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
