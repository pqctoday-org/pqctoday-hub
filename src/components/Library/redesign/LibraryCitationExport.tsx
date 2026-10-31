// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Cite" — export Library records as BibTeX or CSL-JSON, either the
 * bookmarked set or the documents the current filter shows. Rides the global
 * top bar next to the CSV Export (via the page-actions `extra` slot); the menu
 * is portalled to `document.body` because the top-bar row clips overflow (same
 * pattern as PageActionStrip's Info popover).
 */
import { useEffect, useRef, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import { Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { bundleFilename, downloadBlob } from '@/services/exportBundle'
import { logLibraryDownload } from '@/utils/analytics'
import { toBibtex, toCslJson, type CitableItem } from '@/utils/citationExport'
import type { LibraryItem } from '@/data/libraryData'

export type CitationScope = 'bookmarked' | 'filtered'
export type CitationFormat = 'bib' | 'json'

/** Every record in the tree (top-level rows and their children), by reference id. */
export function itemsByReferenceIds(all: LibraryItem[], ids: string[]): LibraryItem[] {
  const index = new Map<string, LibraryItem>()
  const walk = (items: LibraryItem[]) => {
    for (const it of items) {
      if (!index.has(it.referenceId)) index.set(it.referenceId, it)
      if (it.children?.length) walk(it.children)
    }
  }
  walk(all)
  return ids.map((id) => index.get(id)).filter((x): x is LibraryItem => !!x)
}

/** Build and download the file for one scope and format. */
export function downloadCitations(
  items: CitableItem[],
  scope: CitationScope,
  format: CitationFormat,
  today: string = new Date().toISOString().slice(0, 10)
): void {
  const prefix = scope === 'bookmarked' ? 'pqc-library-bookmarks' : 'pqc-library-citations'
  if (format === 'bib') {
    downloadBlob(
      new Blob([toBibtex(items, today)], { type: 'application/x-bibtex' }),
      bundleFilename(prefix, 'bib', today)
    )
  } else {
    downloadBlob(
      new Blob([`${JSON.stringify(toCslJson(items), null, 2)}\n`], {
        type: 'application/vnd.citationstyles.csl+json',
      }),
      bundleFilename(`${prefix}-csl`, 'json', today)
    )
  }
}

interface LibraryCitationExportProps {
  /** Items for a scope, read at click time so the menu never holds a stale list. */
  getItems: (scope: CitationScope) => LibraryItem[]
  bookmarkCount: number
  filteredCount: number
}

export const LibraryCitationExport: FC<LibraryCitationExportProps> = ({
  getItems,
  bookmarkCount,
  filteredCount,
}) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }
    const rect = triggerRef.current?.getBoundingClientRect()
    const width = 256
    setPos({
      top: (rect?.bottom ?? 48) + 8,
      left: Math.max(8, Math.min(rect?.left ?? 8, window.innerWidth - width - 8)),
    })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return
      setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, { capture: true })
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, { capture: true })
    }
  }, [open])

  const run = (scope: CitationScope, format: CitationFormat) => {
    downloadCitations(getItems(scope), scope, format)
    logLibraryDownload(`citations-${scope}-${format}`)
    setOpen(false)
  }

  const row = (scope: CitationScope, count: number, label: string) => (
    <div className="space-y-1">
      <p className="text-xs text-foreground">
        {label} <span className="text-muted-foreground">({count})</span>
      </p>
      <div className="flex gap-1">
        {(['bib', 'json'] as const).map((format) => (
          <Button
            key={format}
            variant="outline"
            size="sm"
            disabled={count === 0}
            onClick={() => run(scope, format)}
            data-testid={`library-cite-${scope}-${format}`}
            className="h-7 px-2 text-xs"
          >
            {format === 'bib' ? 'BibTeX (.bib)' : 'CSL-JSON (.json)'}
          </Button>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Export citations (BibTeX or CSL-JSON)"
        title="Export citations (BibTeX or CSL-JSON)"
        data-testid="library-cite-trigger"
        className="flex items-center gap-1 px-2 py-1.5 h-auto rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
      >
        <Quote size={13} aria-hidden="true" />
        <span>Cite</span>
      </Button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="dialog"
            aria-label="Export citations"
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
            className="glass-panel w-64 p-3 space-y-3 shadow-xl"
            data-testid="library-cite-menu"
          >
            {row('filtered', filteredCount, 'Documents shown by the current filter')}
            {row('bookmarked', bookmarkCount, 'Your bookmarked documents')}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Each entry carries the Library record id, URL, status, lifecycle label and the date
              the record was last verified.
            </p>
          </div>,
          document.body
        )}
    </>
  )
}
