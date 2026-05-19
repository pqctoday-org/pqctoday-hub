// SPDX-License-Identifier: GPL-3.0-only
/**
 * ResearcherEvidenceView — persona-specific For You body for the Researcher
 * persona on /compliance. Closes audit P1 #11 (audit-2026-05-15.md §5.2).
 *
 * Per-persona spec (from 2026-05-16 design call):
 *   - Default sort: by confidenceScore descending
 *   - Inline trust-path sidebar on every framework card
 *   - ContentUpdatesFeed surfaced prominently (top of body, not below the fold)
 *
 * Reuses the same useApplicabilityWithPaths engine output as ExecutiveTimelineView
 * and ApplicabilityPanel so the persona switch only changes rendering, not the
 * underlying recommendation set.
 */
import { useMemo } from 'react'
import { Link2, Info, Calendar, BookOpen } from 'lucide-react'
import { useApplicabilityWithPaths } from '../../../hooks/useApplicabilityWithPaths'
import { groupByTier, type UserProfile } from '../../../utils/applicabilityEngine'
import { ProfileEditor } from '../../applicability/parts/ProfileEditor'
import { ProfileSummary } from '../../applicability/parts/ProfileSummary'
import { LibraryDocItem, TimelineItem } from '../../applicability/parts/items'
import { TrustPathPopover } from '../TrustPathPopover'
import { ContentUpdatesFeed } from '@/components/ui/ContentUpdatesFeed'
import { Button } from '@/components/ui/button'
import type { DerivedResult } from '../../../utils/trustPathTraversal'
import type { ComplianceFramework } from '../../../data/complianceData'
import type { LibraryItem } from '../../../data/libraryData'
import type { ThreatData } from '../../../data/threatsData'
import type { TimelineEvent } from '../../../types/timeline'

interface ResearcherEvidenceViewProps {
  profileOverride?: Partial<UserProfile>
  onSelectLibrary?: (item: LibraryItem) => void
  onSelectThreat?: (item: ThreatData) => void
  onSelectTimeline?: (item: TimelineEvent) => void
  onSelectFramework?: (item: ComplianceFramework) => void
}

export function ResearcherEvidenceView({
  profileOverride,
  onSelectLibrary,
  onSelectTimeline,
  onSelectFramework,
}: ResearcherEvidenceViewProps) {
  const { profile, isEmpty, frameworks, library, timeline, derivedFrameworks } =
    useApplicabilityWithPaths(profileOverride)

  const grouped = useMemo(() => groupByTier(frameworks), [frameworks])
  // Flatten to a single array sorted by confidenceScore desc (per researcher spec)
  const sorted = useMemo(() => {
    const all = [
      ...grouped.mandatory,
      ...grouped.recognized,
      ...grouped['cross-border'],
      ...grouped.advisory,
    ]
    return all.slice().sort((a, b) => {
      const cA = a.item.confidenceScore ?? -1
      const cB = b.item.confidenceScore ?? -1
      return cB - cA
    })
  }, [grouped])

  if (isEmpty) {
    return (
      <ProfileEditor
        profile={profile}
        message="Set your industry and country so the evidence view can filter to standards that actually constrain your stack."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div data-section-id="profile-summary" className="scroll-mt-20">
        <ProfileSummary profile={profile} editable />
      </div>

      {/* ── Prominent ContentUpdatesFeed (top of body) ─────────── */}
      <section
        data-section-id="researcher-updates"
        className="glass-panel p-4 space-y-2 scroll-mt-20"
      >
        <header className="flex items-center gap-2">
          <Calendar size={16} className="text-status-info" />
          <h3 className="text-base font-semibold text-foreground">Recent revisions</h3>
          <span className="text-xs text-muted-foreground">
            Compliance-CSV changes from the latest two revisions
          </span>
        </header>
        <ContentUpdatesFeed domain="compliance" limit={10} title="" />
      </section>

      {/* ── Frameworks sorted by confidence, inline trust path ── */}
      <section data-section-id="researcher-frameworks" className="space-y-2 scroll-mt-20">
        <header className="flex items-center gap-2">
          <Info size={16} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Applicable frameworks</h3>
          <span className="text-xs text-muted-foreground">
            Sorted by data confidence (highest first)
          </span>
        </header>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No frameworks matched your profile.</p>
        ) : (
          <ul className="space-y-2 min-w-0">
            {sorted.map((r) => (
              <li
                key={r.item.id}
                className="glass-panel p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onSelectFramework?.(r.item)}
                    className="h-auto px-1.5 py-0.5 text-left text-sm font-medium text-foreground hover:text-primary truncate w-full justify-start"
                    title={r.item.label}
                  >
                    {r.item.label}
                  </Button>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {r.item.confidenceScore !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          r.item.confidenceScore >= 70
                            ? 'bg-status-success/10 text-status-success border-status-success/30'
                            : r.item.confidenceScore >= 40
                              ? 'bg-status-warning/10 text-status-warning border-status-warning/30'
                              : 'bg-status-error/10 text-status-error border-status-error/30'
                        }`}
                        title={`Data confidence: ${r.item.confidenceScore}/100`}
                      >
                        {r.item.confidenceScore}%
                      </span>
                    )}
                    {r.item.peerReviewed === 'yes' && (
                      <span className="text-[10px] text-status-success">peer-reviewed</span>
                    )}
                    {r.item.peerReviewed === 'partial' && (
                      <span className="text-[10px] text-status-warning">partial review</span>
                    )}
                    {r.item.trustedSourceId && (
                      <span className="text-[10px] text-muted-foreground">
                        source: {r.item.trustedSourceId}
                      </span>
                    )}
                    {r.item.deadline && (
                      <span className="text-[10px] text-status-error">{r.item.deadline}</span>
                    )}
                  </div>
                </div>
                {/* Inline trust-path sidebar per the researcher spec */}
                {r.trustPath && (
                  <aside className="shrink-0">
                    <TrustPathPopover path={r.trustPath} standardLabel={r.item.label} />
                  </aside>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Derived (xwalk-reached) frameworks with their trust paths ── */}
      {derivedFrameworks.length > 0 && (
        <section data-section-id="researcher-derived" className="space-y-2 scroll-mt-20">
          <header className="flex items-center gap-2">
            <Link2 size={16} className="text-secondary" />
            <h3 className="text-base font-semibold text-foreground">Derived via cross-walk</h3>
            <span className="text-xs text-muted-foreground">
              Frameworks reached via NIST IR 8477 relationships from your applicable set
            </span>
          </header>
          <ul className="space-y-1.5 min-w-0">
            {derivedFrameworks.map((d: DerivedResult) => (
              <li
                key={d.standardId}
                className="glass-panel p-2.5 flex items-center justify-between gap-2"
              >
                <span className="text-sm text-foreground truncate min-w-0">{d.standardLabel}</span>
                <TrustPathPopover path={d.bestPath} standardLabel={d.standardLabel} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Library docs for researcher evidence chain ───────── */}
      {library.length > 0 && (
        <section data-section-id="researcher-library" className="space-y-2 scroll-mt-20">
          <header className="flex items-center gap-2">
            <BookOpen size={16} className="text-secondary" />
            <h3 className="text-base font-semibold text-foreground">Source library</h3>
            <span className="text-xs text-muted-foreground">
              Documents cited by your applicable frameworks
            </span>
          </header>
          <ul className="space-y-1 min-w-0">
            {library.slice(0, 10).map((r, i) => (
              <li key={i} className="min-w-0">
                <LibraryDocItem result={r} onSelect={onSelectLibrary} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Timeline events (last 5) ───────────────────────── */}
      {timeline.length > 0 && (
        <section data-section-id="researcher-timeline" className="space-y-2 scroll-mt-20">
          <header className="flex items-center gap-2">
            <Calendar size={16} className="text-status-info" />
            <h3 className="text-base font-semibold text-foreground">Cited timeline events</h3>
          </header>
          <ul className="space-y-1 min-w-0">
            {timeline.slice(0, 5).map((r, i) => (
              <li key={i} className="min-w-0">
                <TimelineItem result={r} onSelect={onSelectTimeline} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
