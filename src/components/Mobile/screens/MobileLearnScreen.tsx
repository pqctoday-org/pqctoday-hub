// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'
import { cn } from '@/lib/utils'
import { MobileMyPathView } from './MobileMyPathView'
import { MobileRoleSelection } from '../shell/MobileRoleSelection'

type Mode = 'path' | 'browse' | 'guided'

/**
 * Handoff screen 2 — Learn list. Revised scope (plan §Phase 5 pre-work,
 * 2026-08-23): the handoff's "Journey · Stack · Cards" toggle is dead code
 * on desktop (LearnViewToggle.tsx has zero importers) — the real /learn page
 * is LearnRedesignView with My Path / Browse all / Guided routing, persisted
 * via the exact same `?mode=` convention this mirrors (mypath|browse|guided
 * in the URL, internal 'path' for My Path — matching LearnRedesignView's own
 * asymmetry so a shared deep link works whether it lands on desktop or
 * mobile).
 *
 * My Path is built (MobileMyPathView). Browse all / Guided routing are
 * explicitly NOT built yet — BrowseAllView/WhereToStartTree are desktop-
 * shaped (dense grid, tree) with no mobile equivalent designed, so this
 * states that plainly rather than reusing them undersized or faking a
 * screen. Matches the handoff's own rule: a dropped feature says so.
 */
export function MobileLearnScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const [roleSwitchOpen, setRoleSwitchOpen] = useState(false)

  const [mode, setMode] = useState<Mode>(() => {
    const m = searchParams.get('mode')
    if (m === 'browse') return 'browse'
    if (m === 'guided') return 'guided'
    return 'path'
  })

  const selectMode = useCallback(
    (next: Mode) => {
      setMode(next)
      setSearchParams(
        (sp) => {
          const params = new URLSearchParams(sp)
          params.set('mode', next === 'path' ? 'mypath' : next)
          return params
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const MODE_TABS: { id: Mode; label: string }[] = [
    { id: 'path', label: 'My Path' },
    { id: 'browse', label: 'Browse all' },
    { id: 'guided', label: 'Guided routing' },
  ]

  return (
    <div className="px-4 pb-4 pt-4">
      <div
        className="-mx-4 mb-4 flex snap-x gap-1.5 overflow-x-auto rounded-none bg-transparent px-4 pb-1"
        role="tablist"
        aria-label="Learn view"
      >
        {MODE_TABS.map(({ id, label }) => {
          const active = mode === id
          return (
            <Button
              key={id}
              type="button"
              variant="ghost"
              role="tab"
              aria-selected={active}
              onClick={() => selectMode(id)}
              className={cn(
                'h-9 shrink-0 snap-start items-center gap-1.5 rounded-lg px-3 text-[11.5px] font-bold',
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {id === 'guided' && <Compass size={13} aria-hidden="true" />}
              {label}
            </Button>
          )
        })}
      </div>

      {mode === 'path' &&
        (selectedPersona ? (
          <MobileMyPathView persona={selectedPersona as PersonaId} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-4 py-6 text-center">
            <p className="text-[12.5px] text-muted-foreground">
              Pick a role for a guided path tuned to you.
            </p>
            <Button
              type="button"
              onClick={() => setRoleSwitchOpen(true)}
              className="h-10 rounded-[10px] bg-primary px-5 text-[12.5px] font-bold text-primary-foreground"
            >
              Pick a role
            </Button>
          </div>
        ))}

      {(mode === 'browse' || mode === 'guided') && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
          <p className="text-[12.5px] font-semibold text-foreground">
            {mode === 'browse' ? 'Browse all' : 'Guided routing'} isn&apos;t built for mobile yet
          </p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
            {mode === 'browse'
              ? "Desktop's full catalog grid doesn't have a mobile layout yet — use My Path, or switch to a laptop to browse everything."
              : "Desktop's routing tree doesn't have a mobile layout yet — My Path already gives you a role-tuned starting point."}
          </p>
        </div>
      )}

      <MobileRoleSelection
        variant="switch"
        open={roleSwitchOpen}
        onClose={() => setRoleSwitchOpen(false)}
      />
    </div>
  )
}
