// SPDX-License-Identifier: GPL-3.0-only
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import FocusLock from 'react-focus-lock'
import { useOverlayEscape } from '@/hooks/useOverlayEscape'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { Network, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ItemShareButton, itemShareTitle } from '@/components/common/ItemShareButton'
import { FrameworkConceptGraph } from './FrameworkConceptGraph'

interface FrameworkConceptGraphModalProps {
  isOpen: boolean
  onClose: () => void
  /** Canonical concept_id of the framework, e.g. `guidance:cnsa-2`. */
  centerConceptId: string
  /** Human-readable title for the modal header. */
  title: string
  /** The framework the graph belongs to — Share links to its drawer
   *  (`/compliance?framework=<id>`); the graph itself has no URL. */
  frameworkId: string
}

/**
 * Modal portal rendering the framework's xwalk neighbourhood as a graph.
 * Mounts the FrameworkConceptGraph component centred on `centerConceptId`.
 * Pattern matches FrameworkDetailPopover (FocusLock, overlay, Escape close).
 */
export function FrameworkConceptGraphModal({
  isOpen,
  onClose,
  centerConceptId,
  title,
  frameworkId,
}: FrameworkConceptGraphModalProps) {
  // Opened on top of FrameworkDetailPopover: Esc closes only this modal, and
  // the ref-counted lock keeps the page locked while the popover stays open.
  const dialogRef = useRef<HTMLDivElement>(null)
  useOverlayEscape(isOpen, onClose, { rootRef: dialogRef })
  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  const content = (
    <>
      <div className="fixed inset-0 z-overlay bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        <FocusLock returnFocus>
          <div
            className="w-[95vw] sm:w-[88vw] md:w-[80vw] max-w-[1200px] max-h-[88dvh] border border-border rounded-xl overflow-hidden flex flex-col bg-popover text-popover-foreground shadow-2xl animate-in zoom-in-95 duration-200"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="framework-graph-title"
          >
            <div className="p-4 border-b border-border bg-muted/20 flex items-start justify-between gap-4 flex-shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Network size={16} className="text-primary" aria-hidden="true" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Concept Graph (IR 8477 xwalk)
                  </span>
                </div>
                <h3
                  id="framework-graph-title"
                  className="text-lg font-bold text-foreground leading-tight"
                >
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  1-hop neighbourhood; dashed edges = synthetic <code>implements</code> edges to
                  algorithm leaves.
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <ItemShareButton
                  title={itemShareTitle(title)}
                  path={`/compliance?framework=${encodeURIComponent(frameworkId)}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="flex-shrink-0"
                  aria-label="Close concept graph"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <FrameworkConceptGraph
                centerConceptId={centerConceptId}
                height={Math.min(700, window.innerHeight - 200)}
              />
            </div>
          </div>
        </FocusLock>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
