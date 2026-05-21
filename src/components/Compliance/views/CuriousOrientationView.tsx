// SPDX-License-Identifier: GPL-3.0-only
/**
 * CuriousOrientationView — persona-specific For You body for the curious
 * persona on /compliance. Closes the post-2026-05-21 audit finding: curious
 * fell through to the generic ApplicabilityPanel and had no plain-language
 * entry point into the compliance page.
 *
 * Layout:
 *   - Profile editor (curious is unlikely to have an existing profile)
 *   - Plain-English explainer card: what "compliance" means in PQC context
 *   - 1-2-3 framing: rules → algorithms → deadlines, with cross-links to
 *     /learn/pqc-101 and /threats
 *   - Up to 5 applicable frameworks rendered with friendly descriptions
 *
 * Reuses useApplicabilityWithPaths so the engine output is identical to other
 * For You views; only rendering differs.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Compass, BookOpen, ShieldCheck, CalendarDays, ArrowRight } from 'lucide-react'
import { useApplicabilityWithPaths } from '../../../hooks/useApplicabilityWithPaths'
import { groupByTier, type UserProfile } from '../../../utils/applicabilityEngine'
import { ProfileEditor } from '../../applicability/parts/ProfileEditor'
import { ProfileSummary } from '../../applicability/parts/ProfileSummary'
import { Button } from '@/components/ui/button'
import type { ComplianceFramework } from '../../../data/complianceData'
import type { LibraryItem } from '../../../data/libraryData'
import type { ThreatData } from '../../../data/threatsData'
import type { TimelineEvent } from '../../../types/timeline'

interface CuriousOrientationViewProps {
  profileOverride?: Partial<UserProfile>
  onSelectLibrary?: (item: LibraryItem) => void
  onSelectThreat?: (item: ThreatData) => void
  onSelectTimeline?: (item: TimelineEvent) => void
  onSelectFramework?: (item: ComplianceFramework) => void
}

const THREE_STEPS = [
  {
    n: 1,
    label: 'The rules',
    blurb:
      'Governments and standards bodies publish "compliance frameworks" — lists of cryptography rules that organisations have to follow.',
    Icon: ShieldCheck,
  },
  {
    n: 2,
    label: 'The algorithms',
    blurb:
      'Most current rules require RSA or ECC. New rules are starting to require post-quantum algorithms instead (ML-KEM, ML-DSA, SLH-DSA).',
    Icon: BookOpen,
  },
  {
    n: 3,
    label: 'The deadlines',
    blurb:
      'Each rule sets a date by which the change must happen. Some have already passed (US CNSA 2.0 starts in 2027), others are years out.',
    Icon: CalendarDays,
  },
]

export function CuriousOrientationView({
  profileOverride,
  onSelectFramework,
}: CuriousOrientationViewProps) {
  const { profile, isEmpty, frameworks } = useApplicabilityWithPaths(profileOverride)
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

  return (
    <div className="space-y-4">
      {/* ── Plain-English explainer (always shown for curious) ─── */}
      <section
        data-section-id="curious-explainer"
        className="rounded-lg border border-primary/30 bg-primary/5 p-5 md:p-6 scroll-mt-20"
      >
        <header className="flex items-center gap-2 mb-3">
          <Compass size={18} className="text-primary" />
          <h2 className="text-lg md:text-xl font-bold text-gradient">
            What is compliance, in three minutes
          </h2>
        </header>
        <p className="text-sm text-foreground/85 leading-relaxed mb-4">
          Compliance is the layer between cryptography and the law. It tells organisations{' '}
          <em>which</em> algorithms they must use, <em>where</em>, and <em>by when</em>. The shift
          from classical to post-quantum cryptography is the biggest compliance event in the history
          of digital security.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {THREE_STEPS.map(({ n, label, blurb, Icon }) => (
            <div key={n} className="rounded-lg border border-border/60 bg-card/30 p-3 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center">
                  {n}
                </span>
                <Icon size={14} className="text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground">{label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{blurb}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link
            to="/learn/pqc-101"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:text-primary hover:border-primary/40 transition-colors"
          >
            <BookOpen size={12} />
            Start with PQC 101
          </Link>
          <Link
            to="/threats"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:text-primary hover:border-primary/40 transition-colors"
          >
            <ShieldCheck size={12} />
            See the quantum threats
          </Link>
          <Link
            to="/timeline"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:text-primary hover:border-primary/40 transition-colors"
          >
            <CalendarDays size={12} />
            See national timelines
          </Link>
        </div>
      </section>

      {/* ── Profile + applicable frameworks ─────────────────────── */}
      {isEmpty ? (
        <ProfileEditor
          profile={profile}
          message="Curious about a specific industry or country? Pick one and we will show the frameworks that apply."
        />
      ) : (
        <>
          <div data-section-id="profile-summary" className="scroll-mt-20">
            <ProfileSummary profile={profile} editable />
          </div>
          <section
            data-section-id="curious-applicable"
            className="glass-panel p-4 space-y-3 scroll-mt-20"
          >
            <header className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-secondary" />
              <h3 className="text-base font-semibold text-foreground">What applies to you</h3>
              <span className="text-xs text-muted-foreground">
                Top {Math.min(applicable.length, 5)} of {applicable.length}
              </span>
            </header>
            {applicable.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No compliance rules matched the industry and country you chose. Try a different
                combination above.
              </p>
            ) : (
              <ul className="space-y-2">
                {applicable.slice(0, 5).map((fw) => (
                  <li key={fw.id} className="rounded-lg border border-border bg-card/30 p-3">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => onSelectFramework?.(fw)}
                      className="h-auto px-0 py-0 text-left w-full justify-start"
                      title={fw.label}
                    >
                      <div className="min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {fw.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {fw.deadline || 'ongoing'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                          {fw.description || fw.notes || 'No description.'}
                        </p>
                      </div>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="pt-1">
              <Link
                to="/assess"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Want a personalised report? Start the assessment <ArrowRight size={11} />
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
