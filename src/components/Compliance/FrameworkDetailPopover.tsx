// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import FocusLock from 'react-focus-lock'
import { useState } from 'react'
import {
  ShieldCheck,
  Network,
  X,
  ExternalLink,
  BookOpen,
  Calendar,
  Globe,
  ListChecks,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComplianceFramework } from '@/data/complianceData'
import type { LibraryItem } from '@/data/libraryData'
import type { TimelineEvent } from '@/types/timeline'
import { libraryData } from '@/data/libraryData'
import { conceptIdForFramework } from '@/data/complianceData'
import { timelineData } from '@/data/timelineData'
import { maturityByRefId } from '@/data/maturityGovernanceData'
import { hasGraphEdges } from '@/utils/conceptXwalkGraph'
import { FrameworkConceptGraphModal } from './FrameworkConceptGraphModal'

interface FrameworkDetailPopoverProps {
  isOpen: boolean
  onClose: () => void
  framework: ComplianceFramework | null
  /** Click-through to library / timeline detail panes for cross-references. */
  onSelectLibrary?: (item: LibraryItem) => void
  onSelectTimeline?: (item: TimelineEvent) => void
}

export const FrameworkDetailPopover = ({
  isOpen,
  onClose,
  framework,
  onSelectLibrary,
  onSelectTimeline,
}: FrameworkDetailPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [graphOpen, setGraphOpen] = useState(false)
  const graphConceptId = framework ? conceptIdForFramework(framework) : undefined
  const showGraphIcon = graphConceptId !== undefined && hasGraphEdges(graphConceptId)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !framework) return null

  const linkedLibrary = libraryData.filter((item) =>
    framework.libraryRefs.includes(item.referenceId)
  )

  const flatTimeline: TimelineEvent[] = []
  for (const country of timelineData) {
    for (const body of country.bodies) {
      for (const ev of body.events) flatTimeline.push(ev)
    }
  }
  const linkedTimeline = flatTimeline.filter(
    (ev) =>
      framework.timelineRefs.includes(ev.title) ||
      framework.timelineRefs.includes(ev.sourceUrl ?? '')
  )

  const linkedRequirements = framework.libraryRefs.flatMap((ref) => maturityByRefId.get(ref) ?? [])

  const content = (
    <>
      <div className="fixed inset-0 z-overlay bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        <FocusLock returnFocus>
          <div
            ref={popoverRef}
            className="w-[95vw] sm:w-[80vw] md:w-[60vw] max-w-[900px] max-h-[85dvh] border border-border rounded-xl overflow-hidden flex flex-col bg-popover text-popover-foreground shadow-2xl animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="framework-popover-title"
          >
            <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-start gap-4 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <ShieldCheck size={16} className="text-primary" aria-hidden="true" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {framework.bodyType.replace(/_/g, ' ')}
                  </span>
                  {framework.requiresPQC && (
                    <span className="text-[10px] font-bold text-primary uppercase">PQC</span>
                  )}
                  {framework.deadline && (
                    <span className="text-[10px] text-status-error">{framework.deadline}</span>
                  )}
                  {framework.confidenceScore !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        framework.confidenceScore >= 70
                          ? 'bg-status-success/10 text-status-success border-status-success/30'
                          : framework.confidenceScore >= 40
                            ? 'bg-status-warning/10 text-status-warning border-status-warning/30'
                            : 'bg-status-error/10 text-status-error border-status-error/30'
                      }`}
                      title={`Data confidence: ${framework.confidenceScore}/100`}
                    >
                      {framework.confidenceScore}% confidence
                    </span>
                  )}
                </div>
                <h3
                  id="framework-popover-title"
                  className="text-lg font-bold text-foreground leading-tight"
                >
                  {framework.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{framework.enforcementBody}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {showGraphIcon && (
                  <Button
                    variant="ghost"
                    onClick={() => setGraphOpen(true)}
                    aria-label="Open concept graph"
                    title="Concept graph (IR 8477 xwalk)"
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                  >
                    <Network size={18} aria-hidden="true" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={onClose}
                  aria-label="Close details"
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <X size={18} aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto p-4 space-y-4">
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Description
                </h4>
                <p className="text-sm text-foreground leading-relaxed">{framework.description}</p>
                {framework.notes && (
                  <p className="text-xs text-muted-foreground mt-2">{framework.notes}</p>
                )}
              </section>

              {framework.cswp39Tags && framework.cswp39Tags.length > 0 && (
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Tag size={12} aria-hidden="true" />
                    CSWP 39 Considerations
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {framework.cswp39Tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center text-xs px-2 py-1 rounded bg-accent/10 text-accent font-medium border border-accent/20"
                        title={`NIST CSWP 39 consideration: ${tag}`}
                      >
                        {tag.replace('cswp39:', '')}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {framework.countries.length > 0 && (
                  <div>
                    <h4 className="font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Countries
                    </h4>
                    <p className="text-foreground">{framework.countries.join(', ')}</p>
                  </div>
                )}
                {framework.industries.length > 0 && (
                  <div>
                    <h4 className="font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Industries
                    </h4>
                    <p className="text-foreground">{framework.industries.join(', ')}</p>
                  </div>
                )}
              </div>

              {linkedLibrary.length > 0 && (
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <BookOpen size={12} aria-hidden="true" />
                    Linked Library Documents ({linkedLibrary.length})
                  </h4>
                  <ul className="space-y-1">
                    {linkedLibrary.map((doc) => (
                      <li key={doc.referenceId}>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => onSelectLibrary?.(doc)}
                          disabled={!onSelectLibrary}
                          className="w-full h-auto text-left flex items-start gap-2 py-1 px-2 rounded hover:bg-muted/40 transition-colors disabled:opacity-60 disabled:cursor-default"
                        >
                          <BookOpen
                            size={12}
                            className="text-secondary mt-0.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="text-sm text-foreground line-clamp-2">
                            {doc.documentTitle}
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {linkedTimeline.length > 0 && (
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Calendar size={12} aria-hidden="true" />
                    Linked Timeline Events ({linkedTimeline.length})
                  </h4>
                  <ul className="space-y-1">
                    {linkedTimeline.map((ev, i) => (
                      <li key={`${ev.title}-${i}`}>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => onSelectTimeline?.(ev)}
                          disabled={!onSelectTimeline}
                          className="w-full h-auto text-left flex items-baseline gap-2 py-1 px-2 rounded hover:bg-muted/40 transition-colors disabled:opacity-60 disabled:cursor-default"
                        >
                          <span className="tabular-nums text-foreground/80 text-xs">
                            {ev.startYear}
                          </span>
                          <span className="text-sm text-foreground line-clamp-2 flex-1">
                            {ev.title}
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {linkedRequirements.length > 0 && (
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <ListChecks size={12} aria-hidden="true" />
                    CSWP.39 Maturity Requirements ({linkedRequirements.length})
                  </h4>
                  <div className="space-y-2">
                    {linkedRequirements.map((req, i) => (
                      <div
                        key={`${req.refId}-${req.pillar}-${req.maturityLevel}-${i}`}
                        className="border border-border rounded-lg p-3 space-y-1.5 bg-card text-xs"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold capitalize">
                            {req.pillar}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
                            Tier {req.maturityLevel}
                          </span>
                          {req.assetClass !== 'all' && (
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {req.assetClass}
                            </span>
                          )}
                          <span className="ml-auto text-[10px] text-muted-foreground/60">
                            {req.confidence} confidence
                          </span>
                        </div>
                        <p className="text-foreground/90 leading-relaxed">{req.requirement}</p>
                        {req.evidenceLocation && (
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {req.evidenceLocation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {framework.website && (
                <section>
                  <a
                    href={framework.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Globe size={14} aria-hidden="true" />
                    Official source
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </section>
              )}
            </div>
          </div>
        </FocusLock>
      </div>
      {showGraphIcon && graphConceptId && framework && (
        <FrameworkConceptGraphModal
          isOpen={graphOpen}
          onClose={() => setGraphOpen(false)}
          centerConceptId={graphConceptId}
          title={framework.label}
        />
      )}
    </>
  )

  return createPortal(content, document.body)
}
