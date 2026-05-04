// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { ShieldAlert, Calendar, BookOpen, Scale } from 'lucide-react'
import { useApplicability } from '../../hooks/useApplicability'
import {
  TIER_META,
  TIER_ORDER,
  groupByTier,
  type ApplicabilityResult,
  type ApplicabilityTier,
  type UserProfile,
} from '../../utils/applicabilityEngine'
import { ProfileEditor } from './parts/ProfileEditor'
import { ProfileSummary } from './parts/ProfileSummary'
import { TIER_STYLES } from './parts/tierStyles'
import { FrameworkItem, ThreatItem, LibraryDocItem, TimelineItem } from './parts/items'

type Variant = 'tab' | 'report-section' | 'summary-card'

interface ApplicabilityPanelProps {
  variant?: Variant
  /** Override the ambient profile — used for `/compliance?country=X&industry=Y` deep-links. */
  profileOverride?: Partial<UserProfile>
  /** Show the inline profile editor even when profile is non-empty. */
  alwaysShowProfileEditor?: boolean
}

/**
 * Renders applicability results for the active user profile across all four
 * content domains. Used by:
 *  - /compliance "For You" tab (variant='tab')
 *  - assessment report (variant='report-section')
 *  - command center summary card (variant='summary-card')
 */
export function ApplicabilityPanel({
  variant = 'tab',
  profileOverride,
  alwaysShowProfileEditor = false,
}: ApplicabilityPanelProps) {
  const { profile, isEmpty, frameworks, library, threats, timeline, droppedCounts, lens } =
    useApplicability(profileOverride)

  const isCompact = variant !== 'tab'

  if (isEmpty) {
    return (
      <ProfileEditor
        profile={profile}
        message="Set your industry and country to see what applies to you."
      />
    )
  }

  // Build the per-section render data, then emit only the sections the lens lists,
  // in lens order. This is how an executive sees mandates first while an architect
  // sees protocols first.
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    frameworks: () => (
      <Section
        key="frameworks"
        icon={<Scale size={isCompact ? 14 : 16} className="text-primary" />}
        title="Compliance Frameworks"
        results={frameworks}
        dropped={droppedCounts.frameworks}
        renderItem={(r) => <FrameworkItem result={r} compact={isCompact} />}
        compact={isCompact}
      />
    ),
    threats: () => (
      <Section
        key="threats"
        icon={<ShieldAlert size={16} className="text-status-warning" />}
        title="Threats"
        results={threats}
        dropped={droppedCounts.threats}
        renderItem={(r) => <ThreatItem result={r} />}
        compact={isCompact}
      />
    ),
    library: () => (
      <Section
        key="library"
        icon={<BookOpen size={16} className="text-secondary" />}
        title="Library — Standards & Specifications"
        results={library}
        dropped={droppedCounts.library}
        renderItem={(r) => <LibraryDocItem result={r} />}
        compact={isCompact}
      />
    ),
    timeline: () => (
      <Section
        key="timeline"
        icon={<Calendar size={16} className="text-status-info" />}
        title="Timeline Milestones"
        results={timeline}
        dropped={droppedCounts.timeline}
        renderItem={(r) => <TimelineItem result={r} />}
        compact={isCompact}
      />
    ),
  }

  // Compact variants (report/summary card) only show frameworks — full panel uses lens order.
  const sectionsToRender = variant === 'tab' ? lens.sections : (['frameworks'] as const)

  return (
    <div className="space-y-4">
      <ProfileSummary profile={profile} editable={alwaysShowProfileEditor || variant === 'tab'} />
      {variant === 'tab' && lens.framing && (
        <p className="text-xs text-muted-foreground italic px-1">{lens.framing}</p>
      )}
      {sectionsToRender.map((id) =>
        // eslint-disable-next-line security/detect-object-injection
        sectionRenderers[id] ? sectionRenderers[id]() : null
      )}
    </div>
  )
}

// ── Subcomponents ────────────────────────────────────────────────────────

interface SectionProps<T> {
  icon: React.ReactNode
  title: string
  results: ApplicabilityResult<T>[]
  /** Per-tier counts of items hidden by the persona lens cap — surfaced as "+N more" hints. */
  dropped?: Record<ApplicabilityTier, number>
  renderItem: (r: ApplicabilityResult<T>) => React.ReactNode
  compact: boolean
}

function Section<T>({ icon, title, results, dropped, renderItem, compact }: SectionProps<T>) {
  const grouped = useMemo(() => groupByTier(results), [results])
  const total = results.length
  const totalDropped = dropped
    ? dropped.mandatory + dropped['cross-border'] + dropped.advisory + dropped.informational
    : 0

  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </div>
        <span className="text-xs text-muted-foreground">
          {total} shown
          {totalDropped > 0 ? ` (+${totalDropped} hidden by persona lens)` : ''}
        </span>
      </header>

      {total === 0 ? (
        <div className="px-3 py-3 text-xs text-muted-foreground">No items match this profile.</div>
      ) : (
        <div className="divide-y divide-border">
          {TIER_ORDER.map((tier) => {
            const items = grouped[tier]
            if (items.length === 0) return null
            const styles = TIER_STYLES[tier]
            // eslint-disable-next-line security/detect-object-injection
            const droppedHere = dropped?.[tier] ?? 0
            return (
              <div key={tier} className="px-3 py-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${styles.dot}`} aria-hidden="true" />
                  <span className="text-xs font-medium text-foreground">{styles.label}</span>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                  {droppedHere > 0 && (
                    <span className="text-xs text-muted-foreground/80">+{droppedHere} more</span>
                  )}
                  <span
                    className="text-xs text-muted-foreground/80 hidden sm:inline truncate"
                    title={TIER_META[tier].description}
                  >
                    — {TIER_META[tier].description}
                  </span>
                </div>
                <ul className={compact ? 'space-y-0.5' : 'space-y-1'}>
                  {items.map((r, i) => (
                    <li key={i}>{renderItem(r)}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// Re-export for legacy consumers — these now live in ./parts/
export { TierBadge } from './parts/items'
export { TIER_STYLES } from './parts/tierStyles'
