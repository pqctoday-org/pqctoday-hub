// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The curated facts every timeline record carries but no popover showed
 * (2026-11-14): how binding the source is (`binding_force`), its editorial
 * status, the Library documents it points to (`library_refs`, or a Library
 * document with the same URL), the compliance frameworks that cite its issuer,
 * and its review history. Shared by GanttDetailPopover and
 * TimelineDocumentDetailPopover so the two say the same thing.
 */
import { useState } from 'react'
import { Link } from 'react-router'
import { BookOpen, ShieldCheck } from 'lucide-react'
import type { TimelineEvent } from '@/types/timeline'
import { complianceFrameworks } from '@/data/complianceData'
import { timelineLibraryLinks } from '@/data/timelineEnrichmentData'
import { ReviewedBadge } from '@/components/ui/ReviewedBadge'
import { RevisionDrilldownPanel } from '@/components/ui/RevisionDrilldownPanel'
import { useRevisions, byRecord } from '@/hooks/useRevisions'
import { Button } from '@/components/ui/button'

export type BindingForce = NonNullable<TimelineEvent['bindingForce']>

/** Plain-language label and explanation for each reviewed binding_force value. */
const BINDING_FORCE_TEXT: Record<BindingForce, { label: string; title: string }> = {
  binding: {
    label: 'Binding',
    title: 'The source is a law, regulation or order that binds those it names.',
  },
  mandatory_for_scope: {
    label: 'Mandatory in scope',
    title: 'Mandatory for the systems, sectors or bodies the source names — not for everyone.',
  },
  official_target: {
    label: 'Official target',
    title: 'A date or goal set by an official body, without a stated legal obligation.',
  },
  recommendation: {
    label: 'Recommendation',
    title: 'Published guidance or a recommendation, not an obligation.',
  },
  draft: { label: 'Draft', title: 'A draft or consultation text; it may change before adoption.' },
  informational: {
    label: 'Informational',
    title: 'An announcement, report or paper that sets no requirement.',
  },
}

const COMPLIANCE_LIMIT = 6

const frameworkLabel = new Map(complianceFrameworks.map((fw) => [fw.id, fw.label]))

type FactsEvent = Pick<
  TimelineEvent,
  | 'eventId'
  | 'title'
  | 'bindingForce'
  | 'reviewStatus'
  | 'libraryRefs'
  | 'sourceUrl'
  | 'complianceRefs'
>

export function BindingForcePill({ value }: { value?: TimelineEvent['bindingForce'] }) {
  // eslint-disable-next-line security/detect-object-injection -- typed union
  const text = value ? BINDING_FORCE_TEXT[value] : undefined
  if (!text) return null
  return (
    <span
      title={text.title}
      data-testid="binding-force"
      className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
    >
      {text.label}
    </span>
  )
}

const MANDATE_TEXT: Record<
  NonNullable<TimelineEvent['mandateType']>,
  { label: string; title: string; cls: string }
> = {
  HARD: {
    label: 'binding mandate',
    title: 'Binding legal mandate — law, regulation, or executive order.',
    cls: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
  SOFT: {
    label: 'guidance',
    title: 'Published guidance — a target, not a binding legal mandate.',
    cls: 'border-border bg-muted text-muted-foreground',
  },
  DRAFT: {
    label: 'label pending',
    title:
      'Binding status could not be confirmed from an authoritative source yet — treat as neither binding nor advisory until reviewed.',
    cls: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
  },
}

/** The curated HARD/SOFT/DRAFT mandate label (CSV `mandate_type`). */
export function MandatePill({ value }: { value?: TimelineEvent['mandateType'] }) {
  // eslint-disable-next-line security/detect-object-injection -- typed union
  const text = value ? MANDATE_TEXT[value] : undefined
  if (!text) return null
  return (
    <span
      title={text.title}
      data-testid="mandate-type"
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${text.cls}`}
    >
      {text.label}
    </span>
  )
}

export function TimelineRecordFacts({ event }: { event: FactsEvent }) {
  const { revisions } = useRevisions()
  const [drilldownOpen, setDrilldownOpen] = useState(false)
  const library = timelineLibraryLinks(event)
  const compliance = (event.complianceRefs ?? []).filter((id) => frameworkLabel.has(id))
  const [showAllCompliance, setShowAllCompliance] = useState(false)
  const shownCompliance = showAllCompliance ? compliance : compliance.slice(0, COMPLIANCE_LIMIT)
  const recordId = event.eventId || event.title

  return (
    <div className="space-y-2 text-xs" data-testid="timeline-record-facts">
      <div className="flex flex-wrap items-center gap-2">
        <BindingForcePill value={event.bindingForce} />
        {event.reviewStatus && (
          <span className="text-muted-foreground">
            Status: <span className="text-foreground">{event.reviewStatus}</span>
          </span>
        )}
        <ReviewedBadge
          domain="timeline"
          entityId={recordId}
          showUnreviewed={false}
          onOpenDrilldown={() => setDrilldownOpen(true)}
        />
      </div>

      {library.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-muted-foreground uppercase tracking-wider font-medium">
            In the Library
          </span>
          {library.map((ref) => (
            <Link
              key={ref.referenceId}
              to={`/library?ref=${encodeURIComponent(ref.referenceId)}`}
              className="inline-flex items-center gap-1 text-accent hover:underline"
              title={ref.title}
            >
              <BookOpen size={12} aria-hidden="true" />
              {ref.referenceId}
            </Link>
          ))}
        </div>
      )}

      {compliance.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className="text-muted-foreground uppercase tracking-wider font-medium"
            title="Compliance frameworks that cite this record's issuing body. They cite the body, not necessarily this record."
          >
            Cited by frameworks
          </span>
          {shownCompliance.map((id) => (
            <Link
              key={id}
              to={`/compliance?framework=${encodeURIComponent(id)}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ShieldCheck size={12} aria-hidden="true" />
              {frameworkLabel.get(id)}
            </Link>
          ))}
          {compliance.length > COMPLIANCE_LIMIT && !showAllCompliance && (
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowAllCompliance(true)}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground underline"
            >
              {compliance.length - COMPLIANCE_LIMIT} more
            </Button>
          )}
        </div>
      )}

      {drilldownOpen && (
        <RevisionDrilldownPanel
          domain="timeline"
          entityId={recordId}
          entityLabel={event.title}
          revisions={byRecord(revisions, 'timeline', recordId)}
          onClose={() => setDrilldownOpen(false)}
          sharePath={`/timeline?event=${encodeURIComponent(recordId)}`}
        />
      )}
    </div>
  )
}
