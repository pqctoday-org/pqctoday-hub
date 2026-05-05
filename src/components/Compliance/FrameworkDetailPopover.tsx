// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import FocusLock from 'react-focus-lock'
import { ShieldCheck, X, ExternalLink, BookOpen, Calendar, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComplianceFramework } from '@/data/complianceData'
import type { LibraryItem } from '@/data/libraryData'
import type { TimelineEvent } from '@/types/timeline'
import { libraryData } from '@/data/libraryData'
import { timelineData } from '@/data/timelineData'

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
                </div>
                <h3
                  id="framework-popover-title"
                  className="text-lg font-bold text-foreground leading-tight"
                >
                  {framework.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{framework.enforcementBody}</p>
              </div>
              <Button
                variant="ghost"
                onClick={onClose}
                aria-label="Close details"
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex-shrink-0"
              >
                <X size={18} aria-hidden="true" />
              </Button>
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
    </>
  )

  return createPortal(content, document.body)
}
