// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Clock } from 'lucide-react'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import clsx from 'clsx'
import type { HNDLRiskWindow, HNFLRiskWindow } from '../../hooks/assessmentTypes'

const HNDLTimelineBar = ({ hndl }: { hndl: HNDLRiskWindow }) => {
  const totalSpan = Math.max(
    hndl.dataRetentionYears + 5,
    hndl.estimatedQuantumThreatYear - hndl.currentYear + 10
  )
  const threatOffset = ((hndl.estimatedQuantumThreatYear - hndl.currentYear) / totalSpan) * 100
  const dataEndOffset = (hndl.dataRetentionYears / totalSpan) * 100

  return (
    <div>
      <div
        className="relative h-12 mb-6"
        role="img"
        aria-label={
          hndl.isAtRisk
            ? `Your data persists ${hndl.riskWindowYears} years beyond the quantum threat horizon. HNDL attacks are an active concern.`
            : 'Your data retention period does not extend beyond the estimated quantum threat year.'
        }
      >
        <div className="absolute top-5 left-0 right-0 h-2 rounded-full bg-border" />
        <div
          className="absolute top-5 left-0 h-2 rounded-l-full bg-success/40"
          style={{ width: `${Math.min(threatOffset, 100)}%` }}
        />
        {hndl.isAtRisk && (
          <div
            className="absolute top-5 h-2 rounded-r-full bg-destructive/40"
            style={{
              left: `${Math.min(threatOffset, 100)}%`,
              width: `${Math.min(dataEndOffset - threatOffset, 100 - threatOffset)}%`,
            }}
          />
        )}
        <div className="absolute top-0 left-0 flex flex-col items-center">
          <div className="w-0.5 h-4 bg-foreground" />
          <span className="text-[10px] text-muted-foreground mt-3">{hndl.currentYear}</span>
        </div>
        <div
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${Math.min(threatOffset, 95)}%` }}
        >
          <div className="w-0.5 h-4 bg-warning" />
          <span className="text-[10px] text-warning font-bold mt-3">
            ~{hndl.estimatedQuantumThreatYear}
          </span>
        </div>
        <div
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${Math.min(dataEndOffset, 95)}%` }}
        >
          <div className={clsx('w-0.5 h-4', hndl.isAtRisk ? 'bg-destructive' : 'bg-success')} />
          <span
            className={clsx(
              'text-[10px] font-bold mt-3',
              hndl.isAtRisk ? 'text-destructive' : 'text-success'
            )}
          >
            {hndl.currentYear + hndl.dataRetentionYears}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-success/40" /> Safe zone
        </span>
        {hndl.isAtRisk && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-destructive/40" /> At risk
          </span>
        )}
      </div>
      {hndl.isAtRisk ? (
        <p className="text-sm text-destructive mt-3 font-medium">
          Your data persists {hndl.riskWindowYears} year{hndl.riskWindowYears !== 1 ? 's' : ''}{' '}
          beyond the estimated quantum threat horizon. HNDL attacks are an active concern.
          {hndl.isEstimated && (
            <span className="text-xs text-muted-foreground font-normal block mt-1">
              Based on a conservative 15-year retention estimate — define your retention policy for
              a precise assessment.
            </span>
          )}
        </p>
      ) : (
        <p className="text-sm text-success mt-3 font-medium">
          Your data retention period does not extend beyond the estimated quantum threat year.
          {hndl.isEstimated && (
            <span className="text-xs text-muted-foreground font-normal block mt-1">
              Based on a conservative 15-year retention estimate.
            </span>
          )}
        </p>
      )}
    </div>
  )
}

const HNFLTimelineBar = ({ hnfl }: { hnfl: HNFLRiskWindow }) => {
  const totalSpan = Math.max(
    hnfl.credentialLifetimeYears + 5,
    hnfl.estimatedQuantumThreatYear - hnfl.currentYear + 10
  )
  const threatOffset = ((hnfl.estimatedQuantumThreatYear - hnfl.currentYear) / totalSpan) * 100
  const credEndOffset = (hnfl.credentialLifetimeYears / totalSpan) * 100

  return (
    <div>
      <div
        className="relative h-12 mb-6"
        role="img"
        aria-label={
          hnfl.isAtRisk
            ? `Your credentials remain trusted ${hnfl.riskWindowYears} years beyond the quantum threat horizon. HNFL attacks on signature keys are an active concern.`
            : 'Your credential lifetimes expire before the estimated quantum threat year.'
        }
      >
        <div className="absolute top-5 left-0 right-0 h-2 rounded-full bg-border" />
        <div
          className="absolute top-5 left-0 h-2 rounded-l-full bg-success/40"
          style={{ width: `${Math.min(threatOffset, 100)}%` }}
        />
        {hnfl.isAtRisk && (
          <div
            className="absolute top-5 h-2 rounded-r-full bg-destructive/40"
            style={{
              left: `${Math.min(threatOffset, 100)}%`,
              width: `${Math.min(credEndOffset - threatOffset, 100 - threatOffset)}%`,
            }}
          />
        )}
        <div className="absolute top-0 left-0 flex flex-col items-center">
          <div className="w-0.5 h-4 bg-foreground" />
          <span className="text-[10px] text-muted-foreground mt-3">{hnfl.currentYear}</span>
        </div>
        <div
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${Math.min(threatOffset, 95)}%` }}
        >
          <div className="w-0.5 h-4 bg-warning" />
          <span className="text-[10px] text-warning font-bold mt-3">
            ~{hnfl.estimatedQuantumThreatYear}
          </span>
        </div>
        <div
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${Math.min(credEndOffset, 95)}%` }}
        >
          <div className={clsx('w-0.5 h-4', hnfl.isAtRisk ? 'bg-destructive' : 'bg-success')} />
          <span
            className={clsx(
              'text-[10px] font-bold mt-3',
              hnfl.isAtRisk ? 'text-destructive' : 'text-success'
            )}
          >
            {hnfl.currentYear + hnfl.credentialLifetimeYears}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-success/40" /> Safe zone
        </span>
        {hnfl.isAtRisk && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-destructive/40" /> At risk
          </span>
        )}
      </div>
      {hnfl.isAtRisk ? (
        <div className="mt-3 space-y-1">
          <p className="text-sm text-destructive font-medium">
            Your credentials are trusted {hnfl.riskWindowYears} year
            {hnfl.riskWindowYears !== 1 ? 's' : ''} beyond the quantum threat horizon. Signature
            keys must be migrated before {hnfl.estimatedQuantumThreatYear}.
            {hnfl.isEstimated && (
              <span className="text-xs text-muted-foreground font-normal block mt-1">
                Based on a conservative 10-year credential lifetime estimate — audit your
                certificates and signing keys for a precise assessment.
              </span>
            )}
          </p>
          {hnfl.hnflRelevantUseCases.length > 0 && (
            <p className="text-xs text-muted-foreground">
              High-risk use cases: {hnfl.hnflRelevantUseCases.join(', ')}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-success mt-3 font-medium">
          Credential lifetimes expire before the quantum threat horizon. Monitor and reassess as the
          threat timeline evolves.
          {hnfl.isEstimated && (
            <span className="text-xs text-muted-foreground font-normal block mt-1">
              Based on a conservative 10-year credential lifetime estimate.
            </span>
          )}
        </p>
      )}
      {!hnfl.hasSigningAlgorithms && (
        <p className="text-xs text-muted-foreground mt-2">
          No signature algorithms detected — HNFL risk is reduced, but verify all signing use cases
          are accounted for.
        </p>
      )}
    </div>
  )
}

interface Milestone {
  year: number
  label: string
  type: 'baseline' | 'warning' | 'risk' | 'safe'
  badge?: string
}

const milestoneStyles: Record<Milestone['type'], { dot: string; year: string; badge: string }> = {
  baseline: {
    dot: 'bg-muted-foreground',
    year: 'text-muted-foreground',
    badge: '',
  },
  warning: {
    dot: 'bg-warning',
    year: 'text-warning font-bold',
    badge: 'text-warning bg-warning/10',
  },
  risk: {
    dot: 'bg-destructive',
    year: 'text-destructive font-bold',
    badge: 'text-destructive bg-destructive/10',
  },
  safe: {
    dot: 'bg-success',
    year: 'text-success font-bold',
    badge: 'text-success bg-success/10',
  },
}

export function HNDLHNFLSection({
  hndl,
  hnfl,
  defaultOpen = true,
  headerExtra,
  infoTip,
}: {
  hndl?: HNDLRiskWindow
  hnfl?: HNFLRiskWindow
  defaultOpen?: boolean
  headerExtra?: React.ReactNode
  infoTip?: React.ReactNode
}) {
  if (!hndl && !hnfl) return null

  const ref = hndl ?? hnfl!
  const currentYear = ref.currentYear
  const threatYear = ref.estimatedQuantumThreatYear

  const milestones: Milestone[] = [
    { year: currentYear, label: 'Today (baseline)', type: 'baseline' },
    { year: threatYear, label: 'Estimated CRQC arrival', type: 'warning' },
  ]
  if (hndl) {
    const dataExpiryYear = currentYear + hndl.dataRetentionYears
    const yearsBeyond = dataExpiryYear - threatYear
    milestones.push({
      year: dataExpiryYear,
      label: hndl.isEstimated
        ? 'Data at risk until (HNDL, estimated)'
        : 'Data at risk until (HNDL)',
      type: hndl.isAtRisk ? 'risk' : 'safe',
      badge: hndl.isAtRisk ? `+${yearsBeyond}yr beyond threat` : 'within safe window',
    })
  }
  if (hnfl) {
    const credExpiryYear = currentYear + hnfl.credentialLifetimeYears
    const yearsBeyond = credExpiryYear - threatYear
    milestones.push({
      year: credExpiryYear,
      label: hnfl.isEstimated
        ? 'Credentials trusted until (HNFL, estimated)'
        : 'Credentials trusted until (HNFL)',
      type: hnfl.isAtRisk ? 'risk' : 'safe',
      badge: hnfl.isAtRisk ? `+${yearsBeyond}yr beyond threat` : 'within safe window',
    })
  }
  milestones.sort((a, b) => a.year - b.year)

  return (
    <CollapsibleSection
      title="Harvest-Now Attack Risk Windows"
      icon={<Clock className="text-primary" size={20} />}
      defaultOpen={defaultOpen}
      headerExtra={headerExtra}
      infoTip={infoTip}
    >
      {/* Key milestones */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Key Milestones
        </p>
        <div className="space-y-2">
          {milestones.map((m, i) => {
            const styles = milestoneStyles[m.type]
            return (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={clsx('w-2 h-2 rounded-full shrink-0', styles.dot)} />
                <span className={clsx('font-mono text-xs w-10 shrink-0', styles.year)}>
                  {m.type === 'warning' ? `~${m.year}` : m.year}
                </span>
                <span className="text-foreground flex-1">{m.label}</span>
                {m.badge && (
                  <span
                    className={clsx(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0',
                      styles.badge
                    )}
                  >
                    {m.badge}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Individual timelines */}
      {hndl && (
        <div className={clsx(hnfl && 'mb-6')}>
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            HNDL — Harvest Now, Decrypt Later
          </p>
          <HNDLTimelineBar hndl={hndl} />
        </div>
      )}

      {hndl && hnfl && <div className="border-t border-border my-4" />}

      {hnfl && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
            HNFL — Harvest Now, Forge Later
          </p>
          <HNFLTimelineBar hnfl={hnfl} />
        </div>
      )}
    </CollapsibleSection>
  )
}
