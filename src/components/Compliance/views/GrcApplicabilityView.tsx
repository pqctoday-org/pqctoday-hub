// SPDX-License-Identifier: AGPL-3.0-only
/**
 * GrcApplicabilityView — persona-specific For You body for the GRC persona
 * on /compliance. Added 2026-09-07 (Executive/GRC split): the persona-branch
 * chain in ComplianceView.tsx's ForYouSection was never updated when GRC was
 * split out of Executive, so a GRC reader fell through to the same generic
 * ApplicabilityPanel a visitor with no persona at all sees — the one thing
 * this tab exists to avoid (every other persona gets its own reading).
 *
 * Structurally mirrors ResearcherEvidenceView (same underlying
 * useApplicabilityWithPaths engine output — persona only changes rendering,
 * never the applicable set), but sorts ascending by confidenceScore instead
 * of descending: the same "source-review gaps first, not a noncompliance
 * signal" framing already established for GRC's obligations-register lens
 * (see obligations/roleLens.ts's `grc` entry) — least-confident data first,
 * because that is what most needs a direct source check before treating a
 * row as settled.
 */
import { useMemo } from 'react'
import { Link2, ShieldAlert, Calendar, BookOpen } from 'lucide-react'
import { useApplicabilityWithPaths } from '../../../hooks/useApplicabilityWithPaths'
import { groupByTier, TIER_META, type UserProfile } from '../../../utils/applicabilityEngine'
import { BINDING_GROUP_META, bindingGroupOf } from '../../../utils/bindingSplit'
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
import { SourceFreshnessBadge } from '../SourceFreshnessBadge'

interface GrcApplicabilityViewProps {
  profileOverride?: Partial<UserProfile>
  onSelectLibrary?: (item: LibraryItem) => void
  onSelectThreat?: (item: ThreatData) => void
  onSelectTimeline?: (item: TimelineEvent) => void
  onSelectFramework?: (item: ComplianceFramework) => void
}

export function GrcApplicabilityView({
  profileOverride,
  onSelectLibrary,
  onSelectTimeline,
  onSelectFramework,
}: GrcApplicabilityViewProps) {
  const { profile, isEmpty, frameworks, library, timeline, derivedFrameworks } =
    useApplicabilityWithPaths(profileOverride)

  const grouped = useMemo(() => groupByTier(frameworks), [frameworks])
  // Flatten to a single array sorted by confidenceScore ascending — least
  // confident (most in need of a direct source check) leads.
  const sorted = useMemo(() => {
    const all = [
      ...grouped.mandatory,
      ...grouped.recognized,
      ...grouped['cross-border'],
      ...grouped.advisory,
    ]
    return all.slice().sort((a, b) => {
      const cA = a.item.confidenceScore ?? Number.MAX_SAFE_INTEGER
      const cB = b.item.confidenceScore ?? Number.MAX_SAFE_INTEGER
      return cA - cB
    })
  }, [grouped])

  if (isEmpty) {
    return (
      <ProfileEditor
        profile={profile}
        message="Set your industry and country so the register can filter to the instruments that actually bind you."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div data-section-id="profile-summary" className="scroll-mt-20">
        <ProfileSummary profile={profile} editable />
      </div>

      <section className="glass-panel p-4 space-y-2" aria-labelledby="grc-reasoning-lesson">
        <h3 id="grc-reasoning-lesson" className="text-base font-semibold text-foreground">
          Applicability reasoning lesson
        </h3>
        <p className="text-xs text-muted-foreground">
          For each example, ask what facts would establish scope, which primary passage supplies the
          binding basis, what remains uncertain, and which qualified expert would decide it in a
          real engagement. PQC Today does not store or make that decision.
        </p>
        <p className="text-xs text-muted-foreground">
          Data confidence measures catalogue completeness and provenance. It is not legal certainty
          and does not replace an applicability decision.
        </p>
      </section>

      {/* ── Recent revisions — what changed since you last checked ── */}
      <section data-section-id="grc-updates" className="glass-panel p-4 space-y-2 scroll-mt-20">
        <header className="flex items-center gap-2">
          <Calendar size={16} className="text-status-info" />
          <h3 className="text-base font-semibold text-foreground">Recent revisions</h3>
          <span className="text-xs text-muted-foreground">
            Compliance-CSV changes from the latest two revisions
          </span>
        </header>
        <ContentUpdatesFeed domain="compliance" limit={10} title="" />
      </section>

      {/* ── Frameworks, weakest evidence first ── */}
      <section data-section-id="grc-frameworks" className="space-y-2 scroll-mt-20">
        <header className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Applicability review queue</h3>
          <span className="text-xs text-muted-foreground">
            Sorted by data confidence (lowest first) — compare each catalogue summary with its
            source and identify what you would verify
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
                    <span className="text-[10px] rounded border border-border px-1.5 py-0.5">
                      {TIER_META[r.tier].label}
                    </span>
                    <span className="text-[10px] rounded border border-border px-1.5 py-0.5">
                      {BINDING_GROUP_META[bindingGroupOf(r.item.bindingStatus)].chip}
                    </span>
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
                    {r.item.trustedSourceId && (
                      <span className="text-[10px] text-muted-foreground">
                        source: {r.item.trustedSourceId}
                      </span>
                    )}
                    {r.item.deadline && (
                      <span className="text-[10px] text-status-error">{r.item.deadline}</span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{r.reason}</p>
                  {r.item.bindingBasis && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">Basis:</span>{' '}
                      {r.item.bindingBasis}
                    </p>
                  )}
                  <div className="mt-1">
                    <SourceFreshnessBadge lastVerified={r.item.lastVerified} />
                  </div>
                </div>
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
        <section data-section-id="grc-derived" className="space-y-2 scroll-mt-20">
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

      {/* ── Source library — the evidence backing your applicable set ── */}
      {library.length > 0 && (
        <section data-section-id="grc-library" className="space-y-2 scroll-mt-20">
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
        <section data-section-id="grc-timeline" className="space-y-2 scroll-mt-20">
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
