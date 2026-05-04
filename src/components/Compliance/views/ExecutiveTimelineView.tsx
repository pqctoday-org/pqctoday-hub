// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { ShieldAlert, BookOpen, Calendar } from 'lucide-react'
import { useApplicability } from '../../../hooks/useApplicability'
import {
  groupByTier,
  linkTimelineToFrameworks,
  type UserProfile,
} from '../../../utils/applicabilityEngine'
import { ProfileEditor } from '../../applicability/parts/ProfileEditor'
import { ProfileSummary } from '../../applicability/parts/ProfileSummary'
import { ThreatItem, LibraryDocItem, TimelineItem } from '../../applicability/parts/items'
import { RegulatoryClock } from './parts/RegulatoryClock'
import { FrameworkDeadlineCard } from './parts/FrameworkDeadlineCard'
import { NextDecisionCard } from './parts/NextDecisionCard'

interface ExecutiveTimelineViewProps {
  /** Override the ambient profile — used for `?country=X&ind=Y` workshop deep-links. */
  profileOverride?: Partial<UserProfile>
}

/**
 * Persona-specific view for executives, mounted on the /compliance For-You tab
 * when `selectedPersona === 'executive'`. Phase 5b of the persona-reorg
 * implementation plan.
 *
 * Layout:
 *   1. Profile summary (industry + country)
 *   2. Regulatory clock — stacked planning + cutover countdowns
 *   3. Two-column body:
 *      - Left (2/3): framework cards by tier, with embedded milestone chronology
 *        + Next-Decision card
 *      - Right (1/3): top-5 sector threats, top-3 library docs, top-5 industry
 *        events (cross-framework timeline events)
 */
export function ExecutiveTimelineView({ profileOverride }: ExecutiveTimelineViewProps) {
  const { profile, isEmpty, frameworks, library, threats, timeline } =
    useApplicability(profileOverride)

  const grouped = useMemo(() => groupByTier(frameworks), [frameworks])
  const linkedTimeline = useMemo(
    () => linkTimelineToFrameworks(timeline, frameworks),
    [timeline, frameworks]
  )

  if (isEmpty) {
    return (
      <ProfileEditor
        profile={profile}
        message="Set your industry and country to unlock the executive view."
      />
    )
  }

  const mandatory = grouped.mandatory
  const recognized = grouped.recognized
  const crossBorder = grouped['cross-border']
  const advisory = grouped.advisory

  // Industry events: cap to 5 by date desc (most recent + upcoming first).
  const industryEvents = [...linkedTimeline.industryEvents]
    .sort((a, b) => b.item.startYear - a.item.startYear)
    .slice(0, 5)

  return (
    <div className="space-y-4">
      <div data-section-id="profile-summary" className="scroll-mt-20">
        <ProfileSummary profile={profile} editable />
      </div>

      <div data-section-id="regulatory-clock" className="scroll-mt-20">
        <RegulatoryClock mandatoryFrameworks={mandatory} recognizedFrameworks={recognized} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column — framework cards by tier */}
        <div className="lg:col-span-2 space-y-3">
          <FrameworkSection
            title="Mandatory"
            sectionId="frameworks-mandatory"
            frameworks={mandatory}
            linkedEvents={linkedTimeline.byFrameworkId}
            emptyText="No domestic regulator framework matched — your country may not author its own PQC mandate yet."
          />
          <FrameworkSection
            title="Recognized"
            sectionId="frameworks-recognized"
            frameworks={recognized}
            linkedEvents={linkedTimeline.byFrameworkId}
          />
          <FrameworkSection
            title="Cross-border"
            sectionId="frameworks-crossborder"
            frameworks={crossBorder}
            linkedEvents={linkedTimeline.byFrameworkId}
          />
          <FrameworkSection
            title="Advisory"
            sectionId="frameworks-advisory"
            frameworks={advisory}
            linkedEvents={linkedTimeline.byFrameworkId}
          />

          <div data-section-id="next-decision" className="scroll-mt-20">
            <NextDecisionCard />
          </div>
        </div>

        {/* Right column — sidebars */}
        <aside className="space-y-3">
          <SidebarSection
            sectionId="sidebar-threats"
            icon={<ShieldAlert size={14} className="text-status-warning" />}
            title="Sector threats"
            count={threats.length}
            empty="No country-tagged threats matched."
          >
            <ul className="space-y-1">
              {threats.map((r, i) => (
                <li key={i}>
                  <ThreatItem result={r} />
                </li>
              ))}
            </ul>
          </SidebarSection>

          <SidebarSection
            sectionId="sidebar-library"
            icon={<BookOpen size={14} className="text-secondary" />}
            title="Top library docs"
            count={library.length}
            empty="No library docs matched the executive lens."
          >
            <ul className="space-y-1">
              {library.map((r, i) => (
                <li key={i}>
                  <LibraryDocItem result={r} />
                </li>
              ))}
            </ul>
          </SidebarSection>

          <SidebarSection
            sectionId="sidebar-industry-events"
            icon={<Calendar size={14} className="text-status-info" />}
            title="Industry events"
            count={industryEvents.length}
            empty="No cross-framework events surfaced."
          >
            <ul className="space-y-1">
              {industryEvents.map((r, i) => (
                <li key={i}>
                  <TimelineItem result={r} />
                </li>
              ))}
            </ul>
          </SidebarSection>
        </aside>
      </div>
    </div>
  )
}

// ── Internal helpers ─────────────────────────────────────────────────────

interface FrameworkSectionProps {
  title: string
  sectionId?: string
  frameworks: import('../../../utils/applicabilityEngine').ApplicabilityResult<
    import('../../../data/complianceData').ComplianceFramework
  >[]
  linkedEvents: Map<
    string,
    import('../../../utils/applicabilityEngine').ApplicabilityResult<
      import('../../../types/timeline').TimelineEvent
    >[]
  >
  emptyText?: string
}

function FrameworkSection({
  title,
  sectionId,
  frameworks,
  linkedEvents,
  emptyText,
}: FrameworkSectionProps) {
  if (frameworks.length === 0) {
    if (!emptyText) return null
    return (
      <div
        data-section-id={sectionId}
        className="rounded-lg border border-dashed border-border bg-card/50 p-3 text-xs text-muted-foreground scroll-mt-20"
      >
        <span className="font-semibold text-foreground/70">{title}: </span>
        {emptyText}
      </div>
    )
  }
  return (
    <div data-section-id={sectionId} className="space-y-2 scroll-mt-20">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
        {title} ({frameworks.length})
      </h3>
      {frameworks.map((r) => (
        <FrameworkDeadlineCard
          key={r.item.id}
          result={r}
          events={linkedEvents.get(r.item.id) ?? []}
        />
      ))}
    </div>
  )
}

function SidebarSection({
  sectionId,
  icon,
  title,
  count,
  empty,
  children,
}: {
  sectionId?: string
  icon: React.ReactNode
  title: string
  count: number
  empty: string
  children: React.ReactNode
}) {
  return (
    <section
      data-section-id={sectionId}
      className="rounded-lg border border-border bg-card overflow-hidden scroll-mt-20"
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </div>
        <span className="text-xs text-muted-foreground">{count}</span>
      </header>
      <div className="px-3 py-2">
        {count === 0 ? <p className="text-xs text-muted-foreground">{empty}</p> : children}
      </div>
    </section>
  )
}
