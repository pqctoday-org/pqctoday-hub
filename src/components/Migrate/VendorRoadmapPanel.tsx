// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink, Map as MapIcon, Cpu, Calendar, Shield, GitMerge, Quote } from 'lucide-react'
import type { VendorRoadmap, VendorRoadmapEnrichment } from '../../types/MigrateTypes'

interface VendorRoadmapPanelProps {
  roadmap: VendorRoadmap | undefined
  enrichment: VendorRoadmapEnrichment | undefined
}

function GaStatusChip({ status }: { status: string }) {
  const s = status.toLowerCase()
  const isGa = s.startsWith('ga')
  const isPreview = s.startsWith('preview') || s.startsWith('beta')
  const isPlanned = s.startsWith('planned')
  const base =
    'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap'
  if (isGa)
    return (
      <span className={`${base} bg-status-success/10 text-status-success border-status-success/30`}>
        GA
      </span>
    )
  if (isPreview)
    return (
      <span className={`${base} bg-status-warning/10 text-status-warning border-status-warning/30`}>
        {s.startsWith('beta') ? 'Beta' : 'Preview'}
      </span>
    )
  if (isPlanned)
    return (
      <span className={`${base} bg-muted/50 text-muted-foreground border-border`}>Planned</span>
    )
  return null
}

export const VendorRoadmapPanel = ({ roadmap, enrichment }: VendorRoadmapPanelProps) => {
  if (!roadmap && !enrichment) return null

  const hasUrl = roadmap?.roadmapUrl
  const none = 'None detected'

  return (
    <div className="space-y-3">
      {/* Header — title + external link */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapIcon size={13} className="text-primary shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-foreground">
            {roadmap?.roadmapTitle || 'Vendor PQC Roadmap'}
          </span>
          {enrichment && <GaStatusChip status={enrichment.currentGaStatus} />}
        </div>
        {hasUrl && (
          <a
            href={roadmap.roadmapUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs transition-colors shrink-0"
            aria-label={`Open ${roadmap.vendorName} PQC roadmap`}
          >
            <ExternalLink size={11} />
            <span>Open</span>
          </a>
        )}
      </div>

      {enrichment && (
        <>
          {/* Algorithms */}
          {enrichment.pqcAlgorithms.length > 0 && (
            <div className="flex items-start gap-2">
              <Cpu size={11} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {enrichment.pqcAlgorithms.map((alg) => (
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
          {enrichment.targetMigrationDates && enrichment.targetMigrationDates !== none && (
            <div className="flex items-start gap-2">
              <Calendar size={11} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{enrichment.targetMigrationDates}</p>
            </div>
          )}

          {/* Hybrid mode */}
          {enrichment.hybridModeSupport &&
            enrichment.hybridModeSupport !== none &&
            !enrichment.hybridModeSupport.startsWith('None') && (
              <div className="flex items-start gap-2">
                <GitMerge size={11} className="text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Hybrid: </span>
                  {enrichment.hybridModeSupport.replace(/^(Yes|No|Partial)[;,]?\s*/i, '')}
                </p>
              </div>
            )}

          {/* Compliance frameworks */}
          {enrichment.complianceFrameworks.length > 0 && (
            <div className="flex items-start gap-2">
              <Shield size={11} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {enrichment.complianceFrameworks.join(' · ')}
              </p>
            </div>
          )}

          {/* Key quote — first one only */}
          {enrichment.keyQuotes.length > 0 && (
            <div className="flex items-start gap-2">
              <Quote size={11} className="text-muted-foreground mt-1 shrink-0" />
              <p className="text-xs text-muted-foreground italic border-l border-border pl-2">
                &ldquo;{enrichment.keyQuotes[0]}&rdquo;
              </p>
            </div>
          )}
        </>
      )}

      {/* No roadmap fallback */}
      {!hasUrl && !enrichment && (
        <p className="text-xs text-muted-foreground/60">No roadmap published</p>
      )}
    </div>
  )
}
