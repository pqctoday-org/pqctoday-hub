// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'
import { MobileMyPathView } from './MobileMyPathView'
import { MobileRoleSelection } from '../shell/MobileRoleSelection'
import { MobileWorkshopEntry } from '../shell/MobileWorkshopEntry'

/**
 * Handoff screen 2 — Learn list. Revised scope (plan §Phase 5 pre-work,
 * 2026-08-23): the handoff's "Journey · Stack · Cards" toggle is dead code
 * on desktop (LearnViewToggle.tsx has zero importers) — the real /learn page
 * is LearnRedesignView with My Path / Browse all / Guided routing.
 *
 * My Path is built (MobileMyPathView) and is the only view on a phone.
 * BrowseAllView/WhereToStartTree are desktop-shaped (dense grid, tree) with
 * no mobile equivalent designed, so the phone does not offer those two tabs
 * at all; a note says the full catalogue and guided routing are on the
 * desktop site. A shared desktop link that carries ?mode=browse or
 * ?mode=guided opens My Path here.
 */
export function MobileLearnScreen() {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const [roleSwitchOpen, setRoleSwitchOpen] = useState(false)

  return (
    <div className="px-4 pb-4 pt-4">
      {/* The page's level-one heading: the header title is plain text. */}
      <h1 className="sr-only">Learn</h1>
      <div
        className="-mx-4 mb-4 flex snap-x gap-1.5 overflow-x-auto rounded-none bg-transparent px-4 pb-1"
        role="tablist"
        aria-label="Learn view"
      >
        <Button
          type="button"
          variant="ghost"
          role="tab"
          aria-selected
          className="h-9 shrink-0 snap-start items-center gap-1.5 rounded-lg bg-primary px-3 text-[11.5px] font-bold text-primary-foreground"
        >
          My Path
        </Button>
      </div>

      {selectedPersona ? (
        <>
          <MobileMyPathView persona={selectedPersona as PersonaId} />
          {/* Guided workshop was reachable only from Home (2026-08-24 audit
              R4.5) — invisible from the education hub itself. Same
              self-gating entry Home already renders (idle/paused states
              only; nothing while running, since the dock owns that). */}
          <div className="mt-4 border-t border-border pt-4">
            <MobileWorkshopEntry />
          </div>
        </>
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
      )}

      <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted-foreground">
        The full module catalogue and guided routing are on the desktop site.
      </p>

      <MobileRoleSelection
        variant="switch"
        open={roleSwitchOpen}
        onClose={() => setRoleSwitchOpen(false)}
      />
    </div>
  )
}
