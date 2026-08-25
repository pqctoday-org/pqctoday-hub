// SPDX-License-Identifier: GPL-3.0-only
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
  type GaStatusKind,
  type ScopeChipKind,
} from './vendorRoadmapDisplay'

interface VendorRoadmapPanelProps {
  roadmap: VendorRoadmap | undefined
  enrichment: VendorRoadmapEnrichment | undefined
}

const GA_STATUS_CLASS: Record<GaStatusKind, string> = {
  ga: 'bg-status-success/10 text-status-success border-status-success/30',
  preview: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  beta: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  planned: 'bg-muted/50 text-muted-foreground border-border',
}

function GaStatusChip({ kind, label }: { kind: GaStatusKind; label: string }) {
  return (
    <span
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

export const VendorRoadmapPanel = ({ roadmap, enrichment }: VendorRoadmapPanelProps) => {
  const display = deriveVendorRoadmapDisplay(roadmap, enrichment)
  if (!display) return null
  const { title, roadmapUrl, gaStatus, scopeChip, dateLine, isEmpty } = display

  return (
    <div className="space-y-3">
      {/* Header — title + external link */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <MapIcon size={13} className="text-primary shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-foreground">{title}</span>
          {gaStatus && <GaStatusChip kind={gaStatus.kind} label={gaStatus.label} />}
          {display.roadmapStatus && <StatusBadge status={display.roadmapStatus} size="sm" />}
          {scopeChip && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border ${SCOPE_CHIP_CLASS[scopeChip.kind]}`}
            >
              <Layers size={9} aria-hidden="true" />
              {scopeChip.label}
            </span>
          )}
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

      {enrichment && (
        <>
          {/* Algorithms */}
          {display.pqcAlgorithms.length > 0 && (
            <div className="flex items-start gap-2">
              <Cpu size={11} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {display.pqcAlgorithms.map((alg) => (
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
          {display.migrationDates && (
            <div className="flex items-start gap-2">
              <Calendar size={11} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{display.migrationDates}</p>
            </div>
          )}

          {/* Hybrid mode */}
          {display.hybridModeText && (
            <div className="flex items-start gap-2">
              <GitMerge size={11} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Hybrid: </span>
                {display.hybridModeText}
              </p>
            </div>
          )}

          {/* Compliance frameworks */}
          {display.complianceFrameworks.length > 0 && (
            <div className="flex items-start gap-2">
              <Shield size={11} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {display.complianceFrameworks.join(' · ')}
              </p>
            </div>
          )}

          {/* Key quote — first one only */}
          {display.firstQuote && (
            <div className="flex items-start gap-2">
              <Quote size={11} className="text-muted-foreground mt-1 shrink-0" />
              <p className="text-xs text-muted-foreground italic border-l border-border pl-2">
                &ldquo;{display.firstQuote}&rdquo;
              </p>
            </div>
          )}
        </>
      )}

      {/* No roadmap fallback */}
      {isEmpty && <p className="text-xs text-muted-foreground">No roadmap published</p>}
    </div>
  )
}
