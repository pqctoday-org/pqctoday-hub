// SPDX-License-Identifier: GPL-3.0-only
/**
 * PatentDetailDrawer — a right-anchored slide-over that hosts the existing
 * PatentDetail (unchanged) over the intact table, replacing the live page's
 * table-collapsing split-panel. Adds a prev/next bar (‹ N / M ›) that steps
 * through the active result list, plus keyboard control (←/→ step, Esc close).
 * Transform-only entrance (resting opacity 1, per the handoff).
 */
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PatentDetail } from '@/components/Patents/PatentDetail'
import type { PatentItem } from '@/types/PatentTypes'

interface PatentDetailDrawerProps {
  patent: PatentItem | null
  /** The active result list (Explore sorted order, or Search hits) for prev/next. */
  resultList: PatentItem[]
  /** Patent numbers present in the scoped corpus — drives PatentDetail's in-corpus
   *  vs external citation links. */
  inCorpusIds: Set<string>
  onClose: () => void
  onNavigate: (patentNumber: string) => void
}

export function PatentDetailDrawer(props: PatentDetailDrawerProps) {
  if (!props.patent) return null
  return <DrawerPanel key={props.patent.patentNumber} {...props} patent={props.patent} />
}

function DrawerPanel({
  patent,
  resultList,
  inCorpusIds,
  onClose,
  onNavigate,
}: PatentDetailDrawerProps & { patent: PatentItem }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const index = resultList.findIndex((p) => p.patentNumber === patent.patentNumber)
  const hasList = resultList.length > 1 && index >= 0
  const prev = hasList && index > 0 ? resultList[index - 1] : null
  const next = hasList && index < resultList.length - 1 ? resultList[index + 1] : null

  // Keyboard: ←/→ step through the list, Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft' && prev) onNavigate(prev.patentNumber)
      else if (e.key === 'ArrowRight' && next) onNavigate(next.patentNumber)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose, onNavigate])

  return (
    <div
      className="fixed inset-0 z-50 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={patent.title}
    >
      <Button
        type="button"
        variant="ghost"
        aria-label="Close detail"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default rounded-none bg-black/60 hover:bg-black/60"
      />
      <div
        className="absolute right-0 top-0 flex h-full w-[560px] max-w-[94vw] flex-col border-l border-border bg-card shadow-2xl transition-transform duration-200 ease-out"
        style={{ transform: entered ? 'translateX(0)' : 'translateX(26px)' }}
      >
        {/* prev/next bar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
          {hasList && (
            <>
              <Button
                type="button"
                variant="ghost"
                aria-label="Previous patent"
                disabled={!prev}
                onClick={() => prev && onNavigate(prev.patentNumber)}
                className="h-auto p-1 disabled:opacity-40"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </Button>
              <span className="font-mono text-[11.5px] tabular-nums text-muted-foreground">
                {index + 1} / {resultList.length}
              </span>
              <Button
                type="button"
                variant="ghost"
                aria-label="Next patent"
                disabled={!next}
                onClick={() => next && onNavigate(next.patentNumber)}
                className="h-auto p-1 disabled:opacity-40"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            aria-label="Close"
            onClick={onClose}
            className="ml-auto h-auto p-1.5"
          >
            <X size={18} aria-hidden="true" />
          </Button>
        </div>
        {/* existing PatentDetail body (its own onClose also closes the drawer) */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PatentDetail
            patent={patent}
            onClose={onClose}
            inCorpusIds={inCorpusIds}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  )
}
