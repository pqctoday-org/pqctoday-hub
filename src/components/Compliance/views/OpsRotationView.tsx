// SPDX-License-Identifier: GPL-3.0-only
/**
 * OpsRotationView — persona-specific For You body for the ops persona on
 * /compliance. Closes the post-2026-05-21 audit finding: ops fell through to
 * the generic ApplicabilityPanel despite being the persona most affected by
 * rotation timing, fleet planning, and PKI cutover scheduling.
 *
 * Layout:
 *   - Profile summary (shared)
 *   - Rotation clock: applicable frameworks bucketed by deadlinePhase
 *     (active / imminent / near / mid / long / ongoing) to highlight what
 *     drives the next certificate-rotation window
 *   - Toolchain quick-jumps: openssl-studio, pki-workshop, migrate catalog
 *   - Framework → key timing fields table (deadline, enforcement body)
 *
 * Reuses useApplicabilityWithPaths so the engine output is identical to other
 * For You views; only rendering differs.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  ShieldAlert,
  CalendarClock,
  Hourglass,
  ArrowRight,
  Wrench,
  Server,
  Boxes,
} from 'lucide-react'
import { useApplicabilityWithPaths } from '../../../hooks/useApplicabilityWithPaths'
import { groupByTier, type UserProfile } from '../../../utils/applicabilityEngine'
import { ProfileEditor } from '../../applicability/parts/ProfileEditor'
import { ProfileSummary } from '../../applicability/parts/ProfileSummary'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import type { ComplianceFramework, DeadlinePhase } from '../../../data/complianceData'
import type { LibraryItem } from '../../../data/libraryData'
import type { ThreatData } from '../../../data/threatsData'
import type { TimelineEvent } from '../../../types/timeline'

interface OpsRotationViewProps {
  profileOverride?: Partial<UserProfile>
  onSelectLibrary?: (item: LibraryItem) => void
  onSelectThreat?: (item: ThreatData) => void
  onSelectTimeline?: (item: TimelineEvent) => void
  onSelectFramework?: (item: ComplianceFramework) => void
}

interface PhaseMeta {
  label: string
  blurb: string
  Icon: typeof Clock
  className: string
}

const PHASE_META: Record<DeadlinePhase, PhaseMeta> = {
  active: {
    label: 'Active now',
    blurb: 'Deadline has passed or is in effect — rotation is overdue.',
    Icon: ShieldAlert,
    className: 'border-status-error/40 bg-status-error/5 text-status-error',
  },
  imminent: {
    label: 'Imminent (≤ 12 months)',
    blurb: 'Plan the cutover window now — certs issued today will straddle the deadline.',
    Icon: CalendarClock,
    className: 'border-status-warning/40 bg-status-warning/5 text-status-warning',
  },
  near: {
    label: 'Near term (1–2 yr)',
    blurb: 'Pilot new algorithms in non-prod; budget for HSM firmware refresh.',
    Icon: Hourglass,
    className: 'border-status-warning/30 bg-status-warning/5 text-status-warning',
  },
  mid: {
    label: 'Mid term (3–5 yr)',
    blurb: 'Strategy phase — pick crypto-agile patterns and standards bets.',
    Icon: Clock,
    className: 'border-primary/30 bg-primary/5 text-primary',
  },
  long: {
    label: 'Long term (5 yr+)',
    blurb: 'Watch for revisions; nothing rotates yet.',
    Icon: Clock,
    className: 'border-border bg-card/30 text-muted-foreground',
  },
  ongoing: {
    label: 'Ongoing guidance',
    blurb: 'Living guidance, no hard deadline — track revisions.',
    Icon: Clock,
    className: 'border-border bg-card/30 text-muted-foreground',
  },
}

const PHASE_ORDER: DeadlinePhase[] = ['active', 'imminent', 'near', 'mid', 'long', 'ongoing']

const TOOLCHAIN_LINKS = [
  {
    label: 'OpenSSL Studio',
    desc: 'Rotate a cert hands-on with ML-DSA / hybrid signers',
    to: '/openssl',
    icon: Wrench,
  },
  {
    label: 'PKI Workshop',
    desc: 'Walk a CA hierarchy and re-issue end-entity certs',
    to: '/playground/pki-workshop',
    icon: Server,
  },
  {
    label: 'Migrate catalog',
    desc: 'Software inventory mapped to migration steps',
    to: '/migrate',
    icon: Boxes,
  },
]

export function OpsRotationView({ profileOverride, onSelectFramework }: OpsRotationViewProps) {
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

  // Bucket frameworks by deadlinePhase
  const byPhase = useMemo(() => {
    const m = new Map<DeadlinePhase, ComplianceFramework[]>()
    for (const fw of applicable) {
      const phase = fw.deadlinePhase ?? 'ongoing'
      const bucket = m.get(phase) ?? []
      bucket.push(fw)
      m.set(phase, bucket)
    }
    return m
  }, [applicable])

  if (isEmpty) {
    return (
      <div className="space-y-3">
        <ProfileEditor
          profile={profile}
          message="Tell us where you operate — industry and country drive which compliance deadlines actually set your rotation clock."
        />
        <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              For a fleet inventory and rotation plan, take the full assessment.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Capturing your toolchain and HSM choices in /assess sharpens the rotation guidance
              here.
            </p>
          </div>
          <Link
            to="/assess"
            className={`${buttonVariants({ variant: 'gradient', size: 'sm' })} flex items-center gap-1.5`}
          >
            Start assessment <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div data-section-id="profile-summary" className="scroll-mt-20">
        <ProfileSummary profile={profile} editable />
      </div>

      {/* ── Rotation clock ──────────────────────────────────────── */}
      <section
        data-section-id="ops-rotation-clock"
        className="glass-panel p-4 space-y-3 scroll-mt-20"
      >
        <header className="flex items-center gap-2">
          <Clock size={16} className="text-secondary" />
          <h3 className="text-base font-semibold text-foreground">Rotation clock</h3>
          <span className="text-xs text-muted-foreground">
            Your applicable frameworks bucketed by how soon they bind
          </span>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {PHASE_ORDER.filter((p) => byPhase.has(p)).map((phase) => {
            // eslint-disable-next-line security/detect-object-injection
            const meta = PHASE_META[phase]
            const fws = byPhase.get(phase) ?? []
            const Icon = meta.Icon
            return (
              <div
                key={phase}
                className={`rounded-lg border p-3 space-y-1.5 min-w-0 ${meta.className}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Icon size={14} className="shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wide">{meta.label}</span>
                  </div>
                  <span className="text-[11px] opacity-70 shrink-0">{fws.length}</span>
                </div>
                <p className="text-[11px] opacity-80 leading-snug">{meta.blurb}</p>
                <ul className="space-y-0.5 mt-1">
                  {fws.slice(0, 4).map((fw) => (
                    <li key={fw.id} className="min-w-0">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onSelectFramework?.(fw)}
                        className="h-auto px-1 py-0 text-left text-xs w-full justify-start truncate text-foreground/85 hover:text-foreground"
                        title={`${fw.label} — ${fw.deadline || 'no deadline'}`}
                      >
                        <span className="truncate">{fw.label}</span>
                      </Button>
                    </li>
                  ))}
                  {fws.length > 4 && (
                    <li className="text-[10px] opacity-70 px-1">+{fws.length - 4} more</li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Toolchain quick jumps ───────────────────────────────── */}
      <section
        data-section-id="ops-toolchain-jump"
        className="glass-panel p-4 space-y-3 scroll-mt-20"
      >
        <header className="flex items-center gap-2">
          <Wrench size={16} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Toolchain quick jumps</h3>
          <span className="text-xs text-muted-foreground">
            Where to actually do the rotation work
          </span>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {TOOLCHAIN_LINKS.map(({ label, desc, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="rounded-lg border border-border bg-card/30 p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors group min-w-0"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className="text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Framework timing table ──────────────────────────────── */}
      <section data-section-id="ops-framework-table" className="space-y-2 scroll-mt-20">
        <header className="flex items-center gap-2">
          <CalendarClock size={16} className="text-secondary" />
          <h3 className="text-base font-semibold text-foreground">Framework deadlines</h3>
          <span className="text-xs text-muted-foreground">
            Top {Math.min(applicable.length, 10)} applicable to your profile
          </span>
        </header>
        <div className="glass-panel p-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left font-medium px-2 py-1.5">Framework</th>
                <th className="text-left font-medium px-2 py-1.5 hidden md:table-cell">Enforcer</th>
                <th className="text-left font-medium px-2 py-1.5">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {applicable.slice(0, 10).map((fw) => (
                <tr key={fw.id} className="border-b border-border/40 last:border-0">
                  <td className="px-2 py-1.5 min-w-0">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onSelectFramework?.(fw)}
                      className="h-auto px-0 py-0 text-left text-foreground hover:text-primary truncate"
                      title={fw.label}
                    >
                      {fw.label}
                    </Button>
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground hidden md:table-cell">
                    {fw.enforcementBody || '—'}
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">
                    {fw.deadline || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
