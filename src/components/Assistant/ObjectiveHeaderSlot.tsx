// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Eyebrow, StatusChip, StoryButton } from '@/components/storybook'
import { useUpdates } from '@/components/MyWork'
import { useJourneyStore } from '@/store/useJourneyStore'
import {
  useFocusedObjective,
  useIsDone,
  usePanelObjectives,
  useRoleObjectives,
} from '@/hooks/useJourney'
import { usePersonaStore } from '@/store/usePersonaStore'
import { nowStep } from '@/services/journey/stepRules'
import { describeStep, journeyHref, objectiveTitle } from '@/services/journey/stepView'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { COPY } from './copy'
import { useAssistantLayout } from './useAssistantLayout'

/**
 * Following a link from the header: the phone's full-screen sheet closes so the page it leads to
 * is in view; the desktop drawer stays beside the page.
 */
function useCloseSheetOnFollow(): () => void {
  const sheet = useAssistantLayout() === 'sheet'
  return () => {
    if (sheet) useRightPanelStore.getState().close()
  }
}

/**
 * The drawer header's objective area: "Objective", the focused objective's title, its state chip,
 * "Switch", "Go to your current step" and the update link. The objective comes from the journey
 * store (the one for the learner's current role). With none it shows "No objective yet": the drawer
 * works without an objective and never asks for one.
 */
export function ObjectiveHeaderSlot() {
  const objective = useFocusedObjective()
  const followed = useCloseSheetOnFollow()
  if (!objective) {
    return (
      <div data-testid="objective-header-slot">
        <Eyebrow as="p">Objective</Eyebrow>
        <div className="flex flex-wrap items-center gap-x-3">
          <p className="text-xs text-muted-foreground">{COPY.noObjective}</p>
          <Link
            to={journeyHref({ new: true })}
            onClick={followed}
            className="text-xs font-semibold text-primary-legible underline underline-offset-4"
          >
            {COPY.startObjective}
          </Link>
        </div>
      </div>
    )
  }
  return <FocusedObjective />
}

function FocusedObjective() {
  const objective = useFocusedObjective()
  const list = useRoleObjectives()
  const isDone = useIsDone()
  const focusObjective = useJourneyStore((s) => s.focusObjective)
  const role = usePersonaStore((s) => s.selectedPersona)
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const listId = useId()
  const followed = useCloseSheetOnFollow()
  if (!objective) return null

  const now = nowStep(objective, isDone)
  const nowView = now ? describeStep(now, objective) : null
  const here = nowView ? location.pathname + location.search === nowView.to : true
  const choices = list.filter((o) => o.id !== objective.id)

  return (
    <div data-testid="objective-header-slot" className="space-y-1">
      <Eyebrow as="p">Objective</Eyebrow>
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 truncate text-sm font-bold text-heading">
          {objectiveTitle(objective)}
        </p>
        <StatusChip
          status={objective.state === 'completed' ? 'completed' : 'active'}
          label={objective.state === 'paused' ? 'Paused' : undefined}
        />
        <StoryButton
          variant="quiet"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
        >
          Switch
        </StoryButton>
      </div>
      {open ? (
        <ul id={listId} aria-label="Your objectives" className="space-y-1 text-sm">
          {choices.map((o) => (
            <li key={o.id}>
              <StoryButton
                variant="quiet"
                onClick={() => {
                  focusObjective(o.id)
                  setOpen(false)
                }}
              >
                {objectiveTitle(o)}
              </StoryButton>
            </li>
          ))}
          <li>
            <Link
              to={journeyHref()}
              onClick={() => {
                setOpen(false)
                followed()
              }}
              className="font-semibold text-primary-legible underline underline-offset-4"
            >
              Manage objectives
            </Link>
          </li>
          <li>
            <Link
              to={journeyHref({ new: true })}
              onClick={() => {
                setOpen(false)
                followed()
              }}
              className="font-semibold text-primary-legible underline underline-offset-4"
            >
              {COPY.newObjective}
            </Link>
          </li>
        </ul>
      ) : null}
      {nowView && now && !here && objective.state === 'active' ? (
        <StoryButton
          variant="quiet"
          onClick={() => navigate(nowView.to, { state: { journeyOrigin: 'journey' } })}
        >
          Go to your current step
        </StoryButton>
      ) : null}
      <UpdateLink objectiveId={objective.id} personaId={role} />
    </div>
  )
}

/** "1 update affects this objective ›", read from the same notices as the Updates tab. */
function UpdateLink({
  objectiveId,
  personaId,
}: {
  objectiveId: string
  personaId: ReturnType<typeof usePersonaStore.getState>['selectedPersona']
}) {
  const { updates } = usePanelObjectives()
  const { notices } = useUpdates(updates, personaId)
  const n = notices.filter((x) => x.affects.some((a) => a.objectiveId === objectiveId)).length
  if (n === 0) return null
  return (
    <Link
      to={journeyHref({ view: 'updates' })}
      className="block text-xs font-semibold text-primary-legible underline underline-offset-4"
    >
      {n} {n === 1 ? 'update affects' : 'updates affect'} this objective ›
    </Link>
  )
}
