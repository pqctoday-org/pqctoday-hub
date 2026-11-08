// SPDX-License-Identifier: AGPL-3.0-only
import { useId } from 'react'
import {
  ExternalLink,
  Map as MapIcon,
  Cpu,
  Calendar,
  Shield,
  GitMerge,
  Quote,
  Layers,
  Clock,
} from 'lucide-react'
import type { VendorRoadmap, VendorRoadmapEnrichment } from '../../types/MigrateTypes'
import { StatusBadge } from '../common/StatusBadge'
import {
  deriveVendorRoadmapDisplay,
  type AnalysisFacts,
  type AnalysisSourceInfo,
  analysisSourceLinkLabel,
  type GaStatusKind,
  type ScopeChipKind,
} from './vendorRoadmapDisplay'

interface VendorRoadmapPanelProps {
  roadmap: VendorRoadmap | undefined
  enrichment: VendorRoadmapEnrichment | undefined
  /**
   * An analysis written from a different page than this roadmap row's own
   * link. It is shown in its own labelled block, below the row's facts, with
   * a link to the page it came from; none of its facts appear next to the
   * row's link.
   */
  crossSource?: VendorRoadmapEnrichment
}

const GA_STATUS_CLASS: Record<GaStatusKind, string> = {
  ga: 'bg-status-success/10 text-status-success border-status-success/30',
  preview: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  beta: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  planned: 'bg-muted/50 text-muted-foreground border-border',
}

function GaStatusChip({
  kind,
  label,
  detail,
}: {
  kind: GaStatusKind
  label: string
  detail?: string | null
}) {
  return (
    <span
      title={detail ?? undefined}
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${GA_STATUS_CLASS[kind]}`}
    >
      {label}
    </span>
  )
}

const SCOPE_CHIP_CLASS: Record<ScopeChipKind, string> = {
  portfolio: 'bg-primary/10 text-primary border-primary/30',
  multi: 'bg-status-success/10 text-status-success border-status-success/30',
  single: 'bg-muted/50 text-muted-foreground border-border',
  standard: 'bg-muted/50 text-muted-foreground border-border',
}

/** Link to the page an analysis was written from. Its name says what it is and
 * that it opens a new tab; the visible text is the page title and site. */
function AnalysisSourceLink({ source }: { source: AnalysisSourceInfo }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={analysisSourceLinkLabel(source)}
      className="inline-flex min-h-6 items-start gap-1 break-words text-xs text-primary transition-colors hover:text-primary/80 hover:underline"
    >
      <ExternalLink size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">
        {source.title ?? source.siteName}
        {source.title && <span className="text-muted-foreground"> ({source.siteName})</span>}
      </span>
    </a>
  )
}

/** Algorithms, dates, hybrid mode, frameworks and the first quote of one
 * analysis. The same markup serves the row's own analysis and the analysis
 * shown under "Analysis from another source". */
function AnalysisFactsView({ facts }: { facts: AnalysisFacts }) {
  return (
    <>
      {/* Algorithms */}
      {facts.pqcAlgorithms.length > 0 && (
        <div className="flex items-start gap-2">
          <Cpu size={11} className="text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-1">
            {facts.pqcAlgorithms.map((alg) => (
              <span
                key={alg}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary/8 text-primary border border-primary/20"
              >
                {alg}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Migration dates */}
      {facts.migrationDates && (
        <div className="flex items-start gap-2">
          <Calendar size={11} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">{facts.migrationDates}</p>
        </div>
      )}

      {/* Hybrid mode */}
      {facts.hybridModeText && (
        <div className="flex items-start gap-2">
          <GitMerge size={11} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Hybrid: </span>
            {facts.hybridModeText}
          </p>
        </div>
      )}

      {/* Compliance frameworks */}
      {facts.complianceFrameworks.length > 0 && (
        <div className="flex items-start gap-2">
          <Shield size={11} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">{facts.complianceFrameworks.join(' · ')}</p>
        </div>
      )}

      {/* Key quote — first one only */}
      {facts.firstQuote && (
        <div className="flex items-start gap-2">
          <Quote size={11} className="text-muted-foreground mt-1 shrink-0" />
          <p className="text-xs text-muted-foreground italic border-l border-border pl-2">
            &ldquo;{facts.firstQuote}&rdquo;
          </p>
        </div>
      )}
    </>
  )
}

function ScopeChip({ kind, label }: { kind: ScopeChipKind; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border ${SCOPE_CHIP_CLASS[kind]}`}
    >
      <Layers size={9} aria-hidden="true" />
      {label}
    </span>
  )
}

export const VendorRoadmapPanel = ({
  roadmap,
  enrichment,
  crossSource,
}: VendorRoadmapPanelProps) => {
  const display = deriveVendorRoadmapDisplay(roadmap, enrichment, crossSource)
  const sourceHeadingId = useId()
  const otherHeadingId = useId()
  if (!display) return null
  const {
    title,
    roadmapUrl,
    gaStatus,
    gaStatusDetail,
    scopeChip,
    dateLine,
    isEmpty,
    analysisSource,
    crossSource: other,
  } = display

  return (
    <div className="space-y-3">
      {/* Header — title + external link */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <MapIcon size={13} className="text-primary shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-foreground">{title}</span>
          {gaStatus && (
            <GaStatusChip kind={gaStatus.kind} label={gaStatus.label} detail={gaStatusDetail} />
          )}
          {display.roadmapStatus && <StatusBadge status={display.roadmapStatus} size="sm" />}
          {scopeChip && <ScopeChip kind={scopeChip.kind} label={scopeChip.label} />}
        </div>
        {roadmapUrl && (
          <a
            href={roadmapUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs transition-colors shrink-0"
            aria-label={`Open ${display.vendorName} PQC roadmap`}
          >
            <ExternalLink size={11} />
            <span>Open</span>
          </a>
        )}
      </div>

      {dateLine && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80">
          <Clock size={10} className="shrink-0" aria-hidden="true" />
          <span>
            {dateLine.label === 'verified' ? 'Last verified' : 'Published'} {dateLine.date}
          </span>
        </div>
      )}

      {/* A vendor with no roadmap row: say which page the analysis came from. */}
      {analysisSource && (
        // A group, not a landmark: the Roadmaps tab repeats this line for dozens of vendors.
        <div role="group" aria-labelledby={sourceHeadingId} className="space-y-1">
          <h3
            id={sourceHeadingId}
            className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
          >
            Analysis source
          </h3>
          <AnalysisSourceLink source={analysisSource} />
        </div>
      )}

      {enrichment && <AnalysisFactsView facts={display} />}

      {/* An analysis written from a different page than the row's own link:
       * its own block, source first, so its facts never read as the row's. */}
      {other && (
        <section
          aria-labelledby={otherHeadingId}
          data-testid="analysis-other-source"
          className="space-y-2 rounded-lg border border-border bg-muted/20 p-3"
        >
          <h3 id={otherHeadingId} className="text-xs font-semibold text-foreground">
            Analysis from another source
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {roadmapUrl
              ? 'This analysis was written from a different page than the roadmap linked above.'
              : 'This analysis was written from a different page than this roadmap entry.'}
          </p>
          <AnalysisSourceLink source={other.source} />
          {(other.gaStatus || other.scopeChip) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {other.gaStatus && (
                <GaStatusChip
                  kind={other.gaStatus.kind}
                  label={other.gaStatus.label}
                  detail={other.gaStatusDetail}
                />
              )}
              {other.scopeChip && (
                <ScopeChip kind={other.scopeChip.kind} label={other.scopeChip.label} />
              )}
            </div>
          )}
          <AnalysisFactsView facts={other} />
        </section>
      )}

      {/* No roadmap fallback */}
      {isEmpty && <p className="text-xs text-muted-foreground">No roadmap published</p>}
    </div>
  )
}
