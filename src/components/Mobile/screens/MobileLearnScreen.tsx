// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'
import { TOTAL_MODULE_COUNT } from '@/components/PKILearning/redesign/learnRedesign.helpers'
import { MobileMyPathView } from './MobileMyPathView'
import { MobileBrowseAllView } from './MobileBrowseAllView'
import { MobileGuidedRoutingView } from './MobileGuidedRoutingView'
import { MobileRoleSelection } from '../shell/MobileRoleSelection'
import { MobileWorkshopEntry } from '../shell/MobileWorkshopEntry'

/**
 * Handoff screen 2 — Learn. The same three views the desktop page offers: My Path (the role's
 * journey), Browse all (the whole module catalogue) and Guided (the "Where do I start?" router).
 * Owner decision D3 (2026-11-08): the catalogue and the guided flow are on the phone too; before
 * that the phone had My Path only, and a shared ?mode=browse or ?mode=guided link quietly opened
 * My Path instead.
 *
 * The view is kept in the address (`?mode=mypath|browse|guided`, written with replace), so links
 * work on both layouts and a link followed while this screen is open — for example one from the
 * chat assistant, `/learn?mode=browse&track=Protocols` — switches the view and the track chip.
 * Browse all keeps its own `track` and `q`; leaving it drops them.
 *
 * Still on the desktop site only, by decision: the workforce (NICE) view and the algorithm and
 * standard filters. A role is not needed for Browse all or Guided; My Path asks for one.
 */
type LearnMode = 'mypath' | 'browse' | 'guided'

const MODES: readonly LearnMode[] = ['mypath', 'browse', 'guided']

/**
 * The view a link asks for. A valid `mode` wins. Without one, the desktop's workforce link
 * (`?view=nice`) opens Browse all, the catalogue it sits in on the phone; anything else opens
 * My Path, as before.
 */
function modeOf(raw: string | null, niceLink: boolean): LearnMode {
  if ((MODES as readonly string[]).includes(raw ?? '')) return raw as LearnMode
  return niceLink ? 'browse' : 'mypath'
}

const TAB_LABELS: Record<LearnMode, string> = {
  mypath: 'My Path',
  browse: `Browse all ${TOTAL_MODULE_COUNT}`,
  guided: 'Guided',
}

export function MobileLearnScreen() {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const [roleSwitchOpen, setRoleSwitchOpen] = useState(false)
  const [params, setParams] = useSearchParams()
  const niceLink = params.get('view') === 'nice'
  const mode = modeOf(params.get('mode'), niceLink)
  const baseId = useId()
  const tabRefs = useRef(new Map<LearnMode, HTMLButtonElement>())
  const tabId = (m: LearnMode) => `${baseId}-tab-${m}`
  const panelId = (m: LearnMode) => `${baseId}-panel-${m}`

  const selectMode = (next: LearnMode) => {
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev)
        out.set('mode', next)
        // The track and the search words belong to Browse all alone.
        if (next !== 'browse') {
          out.delete('track')
          out.delete('q')
        }
        return out
      },
      { replace: true }
    )
  }

  // Arrow keys, Home and End move between the tabs and open the one reached (automatic
  // activation: each view renders at once, so there is nothing to wait for).
  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, from: LearnMode) => {
    // Alt+Left, Cmd+Left and the like are the browser's Back and Forward, not tab keys.
    if (e.altKey || e.ctrlKey || e.metaKey) return
    // Measured from the tab that took the key, not from the current mode: the address, and so
    // the mode, updates a moment after a key press, and a quick second press must not use the old one.
    const at = MODES.indexOf(from)
    let to: number
    if (e.key === 'ArrowRight') to = (at + 1) % MODES.length
    else if (e.key === 'ArrowLeft') to = (at - 1 + MODES.length) % MODES.length
    else if (e.key === 'Home') to = 0
    else if (e.key === 'End') to = MODES.length - 1
    else return
    e.preventDefault()
    const next = MODES[to]
    selectMode(next)
    tabRefs.current.get(next)?.focus()
  }

  return (
    <div className="px-4 pb-4 pt-4">
      {/* The page's level-one heading: the header title is plain text. */}
      <h1 className="sr-only">Learn</h1>
      {niceLink && (
        <p
          data-testid="mobile-learn-nice-note"
          className="mb-3 rounded-lg border border-border bg-card px-3 py-2 text-[12px] leading-relaxed text-muted-foreground"
        >
          The workforce (NICE) view is on the desktop site. Here is the full module catalogue.
        </p>
      )}
      <div
        className="-mx-4 mb-4 flex snap-x gap-1.5 overflow-x-auto rounded-none bg-transparent px-4 pb-1"
        role="tablist"
        aria-label="Learn view"
      >
        {MODES.map((m) => {
          const active = m === mode
          return (
            <Button
              key={m}
              ref={(el) => {
                if (el) tabRefs.current.set(m, el)
                else tabRefs.current.delete(m)
              }}
              type="button"
              variant="ghost"
              role="tab"
              id={tabId(m)}
              aria-selected={active}
              aria-controls={panelId(m)}
              tabIndex={active ? 0 : -1}
              onClick={() => selectMode(m)}
              onKeyDown={(e) => onTabKeyDown(e, m)}
              className={cn(
                'h-11 shrink-0 snap-start items-center gap-1.5 rounded-lg px-3 text-[12px] font-bold',
                active
                  ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {TAB_LABELS[m]}
            </Button>
          )
        })}
      </div>

      {MODES.map((m) => (
        <div key={m} role="tabpanel" id={panelId(m)} aria-labelledby={tabId(m)} hidden={m !== mode}>
          {m === mode && m === 'mypath' && (
            <MyPathPanel
              selectedPersona={selectedPersona as PersonaId | null}
              onPickRole={() => setRoleSwitchOpen(true)}
            />
          )}
          {m === mode && m === 'browse' && <MobileBrowseAllView />}
          {m === mode && m === 'guided' && <MobileGuidedRoutingView />}
        </div>
      ))}

      <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted-foreground">
        The workforce (NICE) view and the algorithm and standard filters are on the desktop site.
      </p>

      <MobileRoleSelection
        variant="switch"
        open={roleSwitchOpen}
        onClose={() => setRoleSwitchOpen(false)}
      />
    </div>
  )
}

function MyPathPanel({
  selectedPersona,
  onPickRole,
}: {
  selectedPersona: PersonaId | null
  onPickRole: () => void
}) {
  if (!selectedPersona) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-4 py-6 text-center">
        <p className="text-[12.5px] text-muted-foreground">
          Pick a role for a guided path tuned to you.
        </p>
        <Button
          type="button"
          onClick={onPickRole}
          className="h-11 rounded-[10px] bg-primary px-5 text-[12.5px] font-bold text-primary-foreground"
        >
          Pick a role
        </Button>
      </div>
    )
  }
  return (
    <>
      <MobileMyPathView persona={selectedPersona} />
      {/* Guided workshop was reachable only from Home (2026-08-24 audit R4.5) — invisible from
          the education hub itself. Same self-gating entry Home already renders (idle/paused
          states only; nothing while running, since the dock owns that). */}
      <div className="mt-4 border-t border-border pt-4">
        <MobileWorkshopEntry />
      </div>
    </>
  )
}
