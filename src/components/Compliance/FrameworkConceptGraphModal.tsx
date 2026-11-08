// SPDX-License-Identifier: AGPL-3.0-only
import { useRef, type SyntheticEvent } from 'react'
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
 * React delivers an event from a portal to the component that rendered it, not
 * to the page element it sits under. The modal is rendered inside a framework
 * card (and inside the detail pop-up), so without this a click on the graph
 * canvas, a zoom control or the backdrop also reached the card's own click
 * handler and opened the framework detail panel behind the graph. Stopping
 * click and wheel at the modal boundary keeps those interactions inside the
 * modal. Pointer-down and key events are left alone: outside-click menus and
 * page shortcuts listen for those on the document.
 */
function keepInsideModal(event: SyntheticEvent) {
  event.stopPropagation()
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
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- not an interactive control: `display: contents` boundary that only stops portal events reaching the card; keyboard access stays on the controls inside.
    <div className="contents" onClick={keepInsideModal} onWheel={keepInsideModal}>
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
                  One-hop view of recorded relationships; dashed links add generated algorithm
                  context. Scroll below the graph for direction, evidence and the derived Hub
                  confidence index. These mappings are learning aids, not legal or conformance
                  determinations.
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
            <div className="flex-1 min-h-0 overflow-y-auto">
              <FrameworkConceptGraph
                centerConceptId={centerConceptId}
                height={Math.min(700, window.innerHeight - 200)}
              />
            </div>
          </div>
        </FocusLock>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
