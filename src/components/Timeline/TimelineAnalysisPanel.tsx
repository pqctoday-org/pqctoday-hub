// SPDX-License-Identifier: GPL-3.0-only
import {
  Tag,
  AlertTriangle,
  Clock,
  Building2,
  GitBranch,
  Star,
  CalendarClock,
  Link2,
} from 'lucide-react'
import type { LibraryEnrichment } from '../../data/libraryEnrichmentData'

interface TimelineAnalysisPanelProps {
  enrichment: LibraryEnrichment
}

/** Badge color for Regulatory Mandate Level */
function mandateBadgeClass(level: string | null | undefined): string {
  if (!level) return 'bg-muted/30 text-muted-foreground border-border'
  const l = level.toLowerCase()
  if (l.startsWith('mandatory'))
    return 'bg-status-error/10 text-status-error border-status-error/30'
  if (l.startsWith('recommended'))
    return 'bg-status-warning/10 text-status-warning border-status-warning/30'
  if (l.startsWith('voluntary')) return 'bg-accent/10 text-accent border-accent/30'
  return 'bg-muted/30 text-muted-foreground border-border'
}

/** Badge color for Migration Urgency & Priority */
function urgencyBadgeClass(urgency: string | null | undefined): string {
  if (!urgency) return 'bg-muted/30 text-muted-foreground border-border'
  const u = urgency.toLowerCase()
  if (u.startsWith('critical')) return 'bg-status-error/10 text-status-error border-status-error/30'
  if (u.startsWith('near'))
    return 'bg-status-warning/10 text-status-warning border-status-warning/30'
  if (u.startsWith('long'))
    return 'bg-status-success/10 text-status-success border-status-success/30'
  return 'bg-muted/30 text-muted-foreground border-border'
}

/**
 * Renders the 8 timeline-specific enrichment dimensions extracted by the
 * enhanced enrich-docs-ollama.py script for the timeline collection.
 * Only renders when at least one field has substantive content.
 */
export function TimelineAnalysisPanel({ enrichment }: TimelineAnalysisPanelProps) {
  const {
    phaseClassification,
    mandateLevel,
    sectorApplicability,
    migrationUrgency,
    phaseTransition,
    historicalSignificance,
    implementationDates,
    successorDependencies,
  } = enrichment

  const hasContent =
    phaseClassification ||
    mandateLevel ||
    (sectorApplicability && sectorApplicability.length > 0) ||
    migrationUrgency ||
    phaseTransition ||
    historicalSignificance ||
    (implementationDates && implementationDates.length > 0) ||
    successorDependencies

  if (!hasContent) return null

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-4">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Tag size={12} aria-hidden="true" />
        Timeline Analysis
      </h4>

      {/* Phase Classification Rationale */}
      {phaseClassification && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Phase Rationale
          </p>
          <p className="text-sm text-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
            {phaseClassification}
          </p>
        </div>
      )}

      {/* Mandate Level + Migration Urgency — side by side */}
      {(mandateLevel || migrationUrgency) && (
        <div className="flex flex-wrap gap-3">
          {mandateLevel && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertTriangle size={10} aria-hidden="true" />
                Mandate Level
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${mandateBadgeClass(mandateLevel)}`}
              >
                {mandateLevel}
              </span>
            </div>
          )}
          {migrationUrgency && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={10} aria-hidden="true" />
                Migration Urgency
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${urgencyBadgeClass(migrationUrgency)}`}
              >
                {migrationUrgency}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sector / Industry Applicability */}
      {sectorApplicability && sectorApplicability.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Building2 size={10} aria-hidden="true" />
            Sector Applicability
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sectorApplicability.map((sector) => (
              <span
                key={sector}
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-secondary/10 text-secondary border border-secondary/20"
              >
                {sector}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Phase Transition Narrative */}
      {phaseTransition && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
            <GitBranch size={10} aria-hidden="true" />
            Phase Transition
          </p>
          <p className="text-sm text-foreground leading-relaxed">{phaseTransition}</p>
        </div>
      )}

      {/* Historical Significance */}
      {historicalSignificance && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
            <Star size={10} aria-hidden="true" />
            Historical Significance
          </p>
          <p className="text-sm text-foreground leading-relaxed">{historicalSignificance}</p>
        </div>
      )}

      {/* Implementation Timeline Dates */}
      {implementationDates && implementationDates.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <CalendarClock size={10} aria-hidden="true" />
            Key Dates & Deadlines
          </p>
          <ul className="space-y-1">
            {implementationDates.map((date, idx) => (
              <li
                key={idx}
                className="text-sm text-foreground pl-3 border-l-2 border-accent/40 leading-relaxed"
              >
                {date}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Successor Events & Dependencies */}
      {successorDependencies && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
            <Link2 size={10} aria-hidden="true" />
            Dependencies & Successors
          </p>
          <p className="text-sm text-foreground leading-relaxed">{successorDependencies}</p>
        </div>
      )}
    </div>
  )
}
