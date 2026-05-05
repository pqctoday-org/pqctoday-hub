// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'
import { ShieldCheck, AlertTriangle, BookOpen, Calendar } from 'lucide-react'
import type { ComplianceFramework } from '../../../data/complianceData'
import type { LibraryItem } from '../../../data/libraryData'
import type { ThreatData } from '../../../data/threatsData'
import type { TimelineEvent } from '../../../types/timeline'
import type { ApplicabilityResult, ApplicabilityTier } from '../../../utils/applicabilityEngine'
import { TIER_STYLES } from './tierStyles'
import { Button } from '../../ui/button'

/**
 * Compact tier badge — used inline next to item titles when the tier needs
 * to be visible without the section header (e.g. inside ExecutiveTimelineView's
 * framework cards).
 */
export function TierBadge({ tier }: { tier: ApplicabilityTier }) {
  // eslint-disable-next-line security/detect-object-injection
  const styles = TIER_STYLES[tier]
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${styles.chip}`}
    >
      {styles.label}
    </span>
  )
}

export function FrameworkItem({
  result,
  compact,
  onSelect,
}: {
  result: ApplicabilityResult<ComplianceFramework>
  compact: boolean
  onSelect?: (item: ComplianceFramework) => void
}) {
  const fw = result.item
  const cls = 'flex items-start gap-2 py-1 px-2 -mx-2 rounded hover:bg-muted/40 transition-colors'
  const content = (
    <>
      <ShieldCheck size={14} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">{fw.label}</span>
          {fw.requiresPQC && !compact && (
            <span className="text-[10px] uppercase tracking-wide text-primary">PQC</span>
          )}
          {fw.deadline && fw.deadline !== 'Ongoing' && !compact && (
            <span className="text-[10px] text-muted-foreground">{fw.deadline}</span>
          )}
        </div>
        {!compact && <p className="text-xs text-muted-foreground line-clamp-1">{fw.description}</p>}
      </div>
    </>
  )
  if (onSelect)
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => onSelect(fw)}
        className={`${cls} h-auto text-left w-full`}
        title={result.reason}
      >
        {content}
      </Button>
    )
  return (
    <Link
      to={`/compliance?framework=${encodeURIComponent(fw.id)}`}
      className={cls}
      title={result.reason}
    >
      {content}
    </Link>
  )
}

export function ThreatItem({
  result,
  onSelect,
}: {
  result: ApplicabilityResult<ThreatData>
  onSelect?: (item: ThreatData) => void
}) {
  const t = result.item
  const cls = 'flex items-start gap-2 py-1 px-2 -mx-2 rounded hover:bg-muted/40 transition-colors'
  const content = (
    <>
      <AlertTriangle size={14} className="text-status-warning mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">{t.threatId}</span>
          <span className="text-[10px] uppercase text-status-warning">{t.criticality}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
      </div>
    </>
  )
  if (onSelect)
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => onSelect(t)}
        className={`${cls} h-auto`}
        title={result.reason}
      >
        {content}
      </Button>
    )
  return (
    <Link
      to={`/threats?id=${encodeURIComponent(t.threatId)}`}
      className={cls}
      title={result.reason}
    >
      {content}
    </Link>
  )
}

export function LibraryDocItem({
  result,
  onSelect,
}: {
  result: ApplicabilityResult<LibraryItem>
  onSelect?: (item: LibraryItem) => void
}) {
  const doc = result.item
  const cls = 'flex items-start gap-2 py-1 px-2 -mx-2 rounded hover:bg-muted/40 transition-colors'
  const content = (
    <>
      <BookOpen size={14} className="text-secondary mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-foreground line-clamp-1">
            {doc.documentTitle}
          </span>
        </div>
        {doc.authorsOrOrganization && (
          <p className="text-xs text-muted-foreground line-clamp-1">{doc.authorsOrOrganization}</p>
        )}
      </div>
    </>
  )
  if (onSelect)
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => onSelect(doc)}
        className={`${cls} h-auto`}
        title={result.reason}
      >
        {content}
      </Button>
    )
  return (
    <Link
      to={`/library?ref=${encodeURIComponent(doc.referenceId)}`}
      className={cls}
      title={result.reason}
    >
      {content}
    </Link>
  )
}

export function TimelineItem({
  result,
  onSelect,
}: {
  result: ApplicabilityResult<TimelineEvent>
  onSelect?: (item: TimelineEvent) => void
}) {
  const ev = result.item
  const cls = 'flex items-start gap-2 py-1 px-2 -mx-2 rounded hover:bg-muted/40 transition-colors'
  const content = (
    <>
      <Calendar size={14} className="text-status-info mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-foreground line-clamp-1">{ev.title}</span>
          <span className="text-[10px] text-muted-foreground">
            {ev.startYear}
            {ev.endYear !== ev.startYear ? `–${ev.endYear}` : ''}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {ev.orgName} — {ev.countryName}
        </p>
      </div>
    </>
  )
  if (onSelect)
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => onSelect(ev)}
        className={`${cls} h-auto`}
        title={result.reason}
      >
        {content}
      </Button>
    )
  return (
    <Link
      to={`/timeline?country=${encodeURIComponent(ev.countryName)}`}
      className={cls}
      title={result.reason}
    >
      {content}
    </Link>
  )
}
