// SPDX-License-Identifier: GPL-3.0-only
/**
 * RunActionsMenu (PR2) — collapses the simulation command bar's secondary run
 * actions (Exit to hub, Export, Import, Reset run, Start over) into one "⋯ More"
 * overflow menu, so the header keeps a clear primary path (Play all · Commit ·
 * End Quarter). Presentation-only: every item keeps its original handler, and
 * its old tooltip becomes a visible secondary line. Closes on outside-click or
 * Esc; focus returns to the trigger. Nothing is removed — parity preserved.
 */
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export interface RunActionItem {
  key: string
  label: string
  /** The action's old tooltip — shown as a secondary line in the menu. */
  description: string
  onSelect: () => void
  tone?: 'default' | 'destructive'
}

export function RunActionsMenu({ items }: { items: RunActionItem[] }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        aria-haspopup="menu"
        aria-expanded={open}
        title="More run actions"
        onClick={() => setOpen((v) => !v)}
        className="h-auto rounded-md border border-background/20 px-2.5 py-1.5 font-mono text-sim-chip font-bold text-background/70 hover:bg-background/10"
      >
        ⋯ MORE
      </Button>
      {open && (
        <div
          role="menu"
          aria-label="More run actions"
          className="fixed right-4 top-16 z-50 w-60 overflow-hidden rounded-lg border border-border bg-card py-1 text-foreground shadow-lg md:absolute md:right-0 md:top-full md:mt-1"
        >
          {items.map((it) => (
            <Button
              key={it.key}
              type="button"
              role="menuitem"
              variant="ghost"
              onClick={() => {
                setOpen(false)
                it.onSelect()
              }}
              className="flex h-auto w-full flex-col items-start justify-start gap-0.5 whitespace-normal rounded-none px-3 py-2 text-left hover:bg-muted"
            >
              <span
                className={`text-sim-body font-semibold ${
                  it.tone === 'destructive' ? 'text-status-error' : 'text-foreground'
                }`}
              >
                {it.label}
              </span>
              <span className="text-sim-micro font-normal leading-tight text-muted-foreground">
                {it.description}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
