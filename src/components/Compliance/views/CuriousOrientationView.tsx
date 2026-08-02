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
import { useEffect, type FC } from 'react'
import { Compass, ArrowRight } from 'lucide-react'
import type { UserProfile } from '../../../utils/applicabilityEngine'
import type { ComplianceFramework } from '../../../data/complianceData'
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
      <Link
        to="/compliance?tab=compliance"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        See the full Compliance Landscape <ArrowRight size={14} />
      </Link>
    </section>
  )
}
