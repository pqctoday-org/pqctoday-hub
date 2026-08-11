// SPDX-License-Identifier: GPL-3.0-only
/**
 * CuriousOrientationView — persona-specific For You body for the curious
 * persona on /compliance. Closes the post-2026-05-21 audit finding: curious
 * fell through to the generic ApplicabilityPanel and had no plain-language
 * entry point into the compliance page.
 *
 * 2026-08-02 simplification (design_handoff_2026_pages/
 * IMPLEMENTATION-PLAN-COMPLIANCE-2026-08-01.md §3.3, user decision "go for
 * simpler"): the previous version's 3-step explainer + profile editor/summary
 * + top-5 applicable-frameworks list was a deliberately-built, working page —
 * just busier than a first-time, low-context visitor needs. Cut down to one
 * "does this affect me?" card and one link to the full Landscape, per the
 * original design intent.
 */
import { Link } from 'react-router'
import { useEffect, useMemo, type FC } from 'react'
import { Compass, ArrowRight } from 'lucide-react'
import type { UserProfile } from '../../../utils/applicabilityEngine'
import { complianceFrameworks, type ComplianceFramework } from '../../../data/complianceData'
import type { LibraryItem } from '../../../data/libraryData'
import type { ThreatData } from '../../../data/threatsData'
import type { TimelineEvent } from '../../../types/timeline'
import { useAchievementStore } from '@/store/useAchievementStore'

// ComplianceView spreads one shared `callbacks` object (profileOverride,
// onSelectLibrary/Threat/Timeline/Framework) across every For You persona
// view for interface consistency — kept in the type for that, but the
// simplified card has nothing to select into, so nothing is destructured.
interface CuriousOrientationViewProps {
  profileOverride?: Partial<UserProfile>
  onSelectLibrary?: (item: LibraryItem) => void
  onSelectThreat?: (item: ThreatData) => void
  onSelectTimeline?: (item: TimelineEvent) => void
  onSelectFramework?: (item: ComplianceFramework) => void
}

export const CuriousOrientationView: FC<CuriousOrientationViewProps> = () => {
  // CC-15: drive the met-the-quantum-threat achievement for curious users.
  useEffect(() => {
    useAchievementStore.getState().recordSectionVisit('curious:threats-orientation')
  }, [])

  /**
   * "Who makes the rules, and when do they start" — B+ remediation 4.6
   * (2026-08-10). The card above explains what compliance rules ARE; the
   * review's ask was to name the bodies, because "a grid of twenty framework
   * acronyms" is the thing a newcomer cannot parse and a short list of named
   * institutions is the thing they can.
   *
   * DERIVED from the live framework set: the bodies that actually require
   * post-quantum algorithms, ordered by their earliest recorded deadline, so
   * this cannot drift from the landscape it summarises. A body whose earliest
   * date is unrecorded sorts last and says so rather than being dropped —
   * "no date yet" is information for this reader too.
   */
  const ruleMakers = useMemo(() => {
    const byBody = new Map<string, { body: string; earliest: number | null; count: number }>()
    for (const fw of complianceFrameworks) {
      if (!fw.requiresPQC) continue
      const body = fw.enforcementBody?.trim()
      if (!body) continue
      const year =
        fw.deadlineYear ??
        (fw.deadlineDates?.length ? Math.min(...fw.deadlineDates.map((d) => d.year)) : null)
      const existing = byBody.get(body)
      if (existing) {
        existing.count += 1
        if (year !== null && (existing.earliest === null || year < existing.earliest)) {
          existing.earliest = year
        }
      } else {
        byBody.set(body, { body, earliest: year, count: 1 })
      }
    }
    return [...byBody.values()]
      .sort((a, b) => (a.earliest ?? 9999) - (b.earliest ?? 9999))
      .slice(0, 6)
  }, [])

  return (
    <section
      data-section-id="curious-explainer"
      className="rounded-lg border border-primary/30 bg-primary/5 p-5 md:p-6 scroll-mt-20"
    >
      <header className="flex items-center gap-2 mb-3">
        <Compass size={18} className="text-primary" />
        <h2 className="text-lg md:text-xl font-bold text-gradient">Does this affect me?</h2>
      </header>
      <p className="text-sm text-foreground/85 leading-relaxed mb-4">
        Compliance rules tell organisations <em>which</em> cryptographic algorithms they must use,{' '}
        <em>where</em>, and <em>by when</em>. Most current rules require RSA or ECC; new rules are
        starting to require post-quantum algorithms instead, each with its own deadline — some
        already passed, some years out. The full Landscape below lists every rule, filterable by
        country and industry.
      </p>
      {ruleMakers.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-1.5 text-sm font-semibold text-foreground">
            Who makes the rules, and when they start
          </h3>
          <ul className="space-y-1">
            {ruleMakers.map((r) => (
              <li key={r.body} className="text-sm leading-snug text-muted-foreground">
                <span className="font-medium text-foreground">{r.body}</span>
                {' — '}
                {r.earliest !== null ? (
                  <>
                    first deadline {r.earliest}
                    {r.count > 1 ? `, across ${r.count} rules` : ''}
                  </>
                ) : (
                  <>{r.count > 1 ? `${r.count} rules, ` : ''}no date set yet</>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to="/compliance?tab=compliance"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        See the full Compliance Landscape <ArrowRight size={14} />
      </Link>
    </section>
  )
}
