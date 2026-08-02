// SPDX-License-Identifier: GPL-3.0-only
//
// Crypto Lab command palette (⌘K / `/`). Type-to-run any tool by name, algorithm
// or intent, plus verb shortcuts that jump to an intent view. Keyboard: ↑/↓ move
// a single highlighted index across the flat verb+tool list, ↵ activates, Esc
// closes. It searches the universe passed in — sandbox tools stay searchable
// even while the runtime is off (dim, not hide); picking one opens the same
// detail modal that gates "Open tool" behind a locked state.
import React, { useMemo, useState } from 'react'
import FocusLock from 'react-focus-lock'
import { Search, Zap, Container, CornerDownLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import type { WorkshopTool } from './workshopRegistry'
import { VERBS, type VerbId, verbsFor, runFor } from './cryptoLabTaxonomy'

// Mount this only while open (`{paletteOpen && <CommandPalette … />}`) so each
// open starts fresh — no state-resetting effect needed.
interface CommandPaletteProps {
  tools: WorkshopTool[]
  onClose: () => void
  onPickTool: (_tool: WorkshopTool) => void
  onPickVerb: (_verb: VerbId) => void
}

const MAX_TOOLS = 9

const ROW = 'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 h-auto justify-start font-normal'

const RunPill: React.FC<{ sandbox: boolean }> = ({ sandbox }) =>
  sandbox ? (
    <span className="inline-flex items-center gap-1 text-[10px] text-status-warning">
      <Container className="w-2.5 h-2.5" aria-hidden="true" />
      Sandbox
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] text-status-success">
      <Zap className="w-2.5 h-2.5" aria-hidden="true" />
      In-browser
    </span>
  )

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  tools,
  onClose,
  onPickTool,
  onPickVerb,
}) => {
  const [q, setQ] = useState('')
  const [index, setIndex] = useState(0)

  const ql = q.trim().toLowerCase()

  const verbMatches = useMemo(
    () =>
      ql ? VERBS.filter((v) => v.label.toLowerCase().includes(ql) || v.id.includes(ql)) : VERBS,
    [ql]
  )

  const toolMatches = useMemo(() => {
    const matched = ql
      ? tools.filter(
          (t) =>
            t.name.toLowerCase().includes(ql) ||
            t.description.toLowerCase().includes(ql) ||
            t.category.toLowerCase().includes(ql) ||
            t.algorithms.some((a) => a.toLowerCase().includes(ql)) ||
            verbsFor(t.id).some((v) => v.includes(ql)) ||
            (!t.sandbox && 'in-browser'.includes(ql)) ||
            (t.sandbox && 'sandbox'.includes(ql))
        )
      : tools
    // Browser tools first, then alphabetical.
    return [...matched]
      .sort(
        (a, b) =>
          (runFor(a) === 'browser' ? 0 : 1) - (runFor(b) === 'browser' ? 0 : 1) ||
          a.name.localeCompare(b.name)
      )
      .slice(0, MAX_TOOLS)
  }, [ql, tools])

  const total = verbMatches.length + toolMatches.length
  // Clamp the highlight into range during render (no set-state-in-effect).
  const activeIndex = total === 0 ? 0 : Math.min(index, total - 1)

  const activate = (i: number) => {
    if (i < verbMatches.length) {
      const v = verbMatches.at(i)
      if (v) onPickVerb(v.id)
    } else {
      const t = toolMatches.at(i - verbMatches.length)
      if (t) onPickTool(t)
    }
  }

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (total) setIndex((activeIndex + 1) % total)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (total) setIndex((activeIndex - 1 + total) % total)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (total) activate(activeIndex)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 px-4 pt-[12vh]">
      <Button
        variant="ghost"
        onClick={onClose}
        aria-label="Close command palette"
        className="absolute inset-0 h-full w-full cursor-default rounded-none bg-transparent hover:bg-transparent"
      />
      <FocusLock returnFocus>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="relative glass-panel w-[640px] max-w-full overflow-hidden rounded-2xl shadow-glow"
        >
          {/* Search row */}
          <div className="flex items-center gap-2.5 border-b border-border px-4">
            <Search size={16} className="text-muted-foreground" aria-hidden="true" />
            <input
              data-autofocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Run a tool, algorithm or task…"
              aria-label="Search the Crypto Lab"
              className="h-12 flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
            <Button
              variant="ghost"
              onClick={onClose}
              aria-label="Close"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          <div
            role="listbox"
            aria-label="Results"
            className="max-h-[52vh] overflow-y-auto custom-scrollbar p-2"
          >
            {total === 0 && (
              <p className="px-3 py-8 text-center text-[12.5px] text-muted-foreground">
                No matches. Try a tool name, an algorithm, or “sign”, “encrypt”…
              </p>
            )}

            {verbMatches.length > 0 && (
              <>
                <p className="px-2 pb-1 pt-2 text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  Jump to a task
                </p>
                {verbMatches.map((v, i) => {
                  const active = i === activeIndex
                  const Icon = v.icon
                  return (
                    <Button
                      key={v.id}
                      variant="ghost"
                      role="option"
                      aria-selected={active}
                      onMouseMove={() => setIndex(i)}
                      onClick={() => onPickVerb(v.id)}
                      className={cn(ROW, active ? 'bg-primary/12' : 'hover:bg-muted/40')}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/12 text-secondary">
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                      <span className="text-[13px] font-medium text-foreground">{v.label}</span>
                    </Button>
                  )
                })}
              </>
            )}

            {toolMatches.length > 0 && (
              <>
                <p className="px-2 pb-1 pt-3 text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  Tools &amp; demos
                </p>
                {toolMatches.map((t, j) => {
                  const i = verbMatches.length + j
                  const active = i === activeIndex
                  const Icon = t.icon
                  return (
                    <Button
                      key={t.id}
                      variant="ghost"
                      role="option"
                      aria-selected={active}
                      onMouseMove={() => setIndex(i)}
                      onClick={() => onPickTool(t)}
                      className={cn(ROW, active ? 'bg-primary/12' : 'hover:bg-muted/40')}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-[13px] font-medium text-foreground">
                          {t.name}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {t.category}
                        </span>
                      </span>
                      <RunPill sandbox={!!t.sandbox} />
                    </Button>
                  )
                })}
              </>
            )}
          </div>

          {/* Footer legend */}
          <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[10.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded bg-muted px-1 font-mono">↑</kbd>
              <kbd className="rounded bg-muted px-1 font-mono">↓</kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded bg-muted px-1 font-mono">
                <CornerDownLeft className="inline h-2.5 w-2.5" aria-hidden="true" />
              </kbd>
              run
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-status-success" aria-hidden="true" /> in-browser
            </span>
            <span className="inline-flex items-center gap-1">
              <Container className="w-2.5 h-2.5 text-status-warning" aria-hidden="true" /> sandbox
            </span>
          </div>
        </div>
      </FocusLock>
    </div>
  )
}
