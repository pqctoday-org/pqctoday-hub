// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Learn › Your journey (UX handoff 4.1, 6.3, 7.2). Four views: Objectives (the default), Role map,
 * My work and Updates. The view is kept in the address (`jview`), so a link opens it. One component
 * serves both layouts; the columns stack on a phone.
 */
import { useRef, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router'
import { cn } from '@/lib/utils'
import { StoryButton } from '@/components/storybook'
import { resolvePreviewRole } from '@/services/journey/previewRole'
import { ObjectivesView } from './ObjectivesView'
import { RoleMapView } from './RoleMapView'
import { MyWorkMount, UpdatesMount, useUpdatesCount } from './mountPoints'
import { useFocusedObjective } from '@/hooks/useJourney'

export type JourneyView = 'objectives' | 'role-map' | 'my-work' | 'updates'
const VIEWS: readonly JourneyView[] = ['objectives', 'role-map', 'my-work', 'updates']

export function journeyViewOf(raw: string | null): JourneyView {
  return (VIEWS as readonly string[]).includes(raw ?? '') ? (raw as JourneyView) : 'objectives'
}

export function YourJourneyView() {
  const [params, setParams] = useSearchParams()
  // A link naming a role (?role=architect or a work-role id) opens Role map on that role's path.
  const view = params.get('jview')
    ? journeyViewOf(params.get('jview'))
    : resolvePreviewRole(params.get('role'))
      ? 'role-map'
      : 'objectives'
  const updates = useUpdatesCount()
  const focused = useFocusedObjective()
  const refs = useRef(new Map<JourneyView, HTMLButtonElement>())

  const labels: Record<JourneyView, string> = {
    objectives: 'Objectives',
    'role-map': 'Role map',
    'my-work': 'My work',
    updates: updates > 0 ? `Updates · ${updates}` : 'Updates',
  }

  const select = (next: JourneyView) =>
    setParams(
      (p) => {
        const out = new URLSearchParams(p)
        out.set('mode', 'journey')
        out.delete('view')
        if (next === 'objectives') out.delete('jview')
        else out.set('jview', next)
        out.delete('step')
        out.delete('objective')
        // An opened new-objective form belongs to the Objectives view; it does not follow the learner to another view.
        if (next !== view) out.delete('new')
        // The previewed role belongs to Role map alone.
        if (next !== 'role-map') out.delete('role')
        return out
      },
      { replace: true }
    )

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, from: JourneyView) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const at = VIEWS.indexOf(from)
    let to: number
    if (e.key === 'ArrowRight') to = (at + 1) % VIEWS.length
    else if (e.key === 'ArrowLeft') to = (at - 1 + VIEWS.length) % VIEWS.length
    else if (e.key === 'Home') to = 0
    else if (e.key === 'End') to = VIEWS.length - 1
    else return
    e.preventDefault()
    const next = VIEWS[to] // eslint-disable-line security/detect-object-injection
    select(next)
    refs.current.get(next)?.focus()
  }

  return (
    <div className="space-y-4" data-testid="your-journey">
      <div
        role="tablist"
        aria-label="Your journey views"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {VIEWS.map((v) => {
          const active = v === view
          return (
            <StoryButton
              key={v}
              ref={(el) => {
                if (el) refs.current.set(v, el)
                else refs.current.delete(v)
              }}
              role="tab"
              id={`journey-tab-${v}`}
              aria-selected={active}
              aria-controls={`journey-panel-${v}`}
              tabIndex={active ? 0 : -1}
              variant={active ? 'primary' : 'secondary'}
              className={cn('shrink-0')}
              onClick={() => select(v)}
              onKeyDown={(e) => onKey(e, v)}
            >
              {labels[v]}
            </StoryButton>
          )
        })}
      </div>
      <div role="tabpanel" id={`journey-panel-${view}`} aria-labelledby={`journey-tab-${view}`}>
        {view === 'objectives' ? <ObjectivesView /> : null}
        {view === 'role-map' ? <RoleMapView /> : null}
        {view === 'my-work' ? <MyWorkMount objectiveId={focused?.id ?? null} /> : null}
        {view === 'updates' ? <UpdatesMount objectiveId={focused?.id ?? null} /> : null}
      </div>
    </div>
  )
}
