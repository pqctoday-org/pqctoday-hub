// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Role switch (UX handoff 6.13, acceptance A05): the learner picks a role, sees what would change
 * and what stays, then switches; an undo note follows. Switching is always the learner's own act:
 * a temporary request ("explain this for an executive") never reaches this component, so it never
 * changes the saved role. Objectives are kept per role, and completions are kept by tag, so
 * switching never loses evidence.
 */
import { useMemo, useState } from 'react'
import { Chip, Eyebrow, StoryButton, StoryRow } from '@/components/storybook'
import { JourneyDialog } from './JourneyDialog'
import { PERSONAS } from '@/data/learningPersonas'
import { PERSONA_IDS, type PersonaId } from '@/data/personaIds'
import { usePersonaStore, defaultTierForPersona } from '@/store/usePersonaStore'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useIsDone } from '@/hooks/useJourney'
import { rolePathForPersona } from '@/services/journey/rolePaths'
import { startHere } from '@/services/journey/levels'
import type { NiceProficiencyTier } from '@/data/niceFramework'

const TIER_WORD: Record<NiceProficiencyTier, string> = {
  awareness: 'Awareness level',
  practitioner: 'Practitioner level',
  expert: 'Expert level',
}

export function roleLabel(persona: string | null | undefined): string {
  return persona && persona in PERSONAS ? PERSONAS[persona as PersonaId].label : 'No role'
}

interface RoleSwitchDialogProps {
  open: boolean
  onClose: () => void
}

/** The "Change role" dialog (a sheet on a phone). Also the first "Choose a role". */
export function RoleSwitchDialog({ open, onClose }: RoleSwitchDialogProps) {
  const current = usePersonaStore((s) => s.selectedPersona)
  const level = usePersonaStore((s) => s.experienceLevel)
  const setPersona = usePersonaStore((s) => s.setPersona)
  const noteRoleSwitch = useJourneyStore((s) => s.noteRoleSwitch)
  const objectives = useJourneyStore((s) => s.objectives)
  const order = useJourneyStore((s) => s.order)
  const isDone = useIsDone()
  const [picked, setPicked] = useState<PersonaId | null>(null)
  const target = picked ?? null

  const preview = useMemo(() => {
    if (!target) return null
    const path = rolePathForPersona(target)
    const first = path ? startHere(path.parts, level, isDone) : null
    const mine = order.map((id) => objectives[id]).filter((o) => o && o.role === target) // eslint-disable-line security/detect-object-injection
    return {
      active: mine.filter((o) => o.state === 'active').length,
      total: mine.length,
      firstModule: first?.title ?? null,
      tier: TIER_WORD[defaultTierForPersona(target)],
    }
  }, [target, level, isDone, objectives, order])

  const close = () => {
    setPicked(null)
    onClose()
  }

  return (
    <JourneyDialog
      open={open}
      onClose={close}
      eyebrow="Role"
      title={current ? 'Change role' : 'Choose a role'}
      testId="role-switch-dialog"
    >
      <p className="text-sm text-muted-foreground">
        Navigation and suggestions adapt. Your work does not.
      </p>
      <div role="radiogroup" aria-label="Roles" className="space-y-2">
        {PERSONA_IDS.map((id) => {
          const p = PERSONAS[id] // eslint-disable-line security/detect-object-injection
          const selected = (picked ?? current) === id
          return (
            <StoryRow
              as="div"
              key={id}
              tone={selected ? 'highlight' : 'default'}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="radio"
                    name="journey-role"
                    aria-describedby={`journey-role-${id}-note`}
                    className="mt-1 size-5 shrink-0 accent-primary"
                    checked={selected}
                    onChange={() => setPicked(id)}
                  />
                  <span className="text-sm font-bold text-heading">{p.label}</span>
                </label>
                <p id={`journey-role-${id}-note`} className="pl-8 text-xs text-muted-foreground">
                  {p.subtitle} · {TIER_WORD[defaultTierForPersona(id)]}
                </p>
              </div>
              {current === id ? <Chip>Current</Chip> : null}
            </StoryRow>
          )
        })}
      </div>

      {target && target !== current && preview ? (
        <div className="space-y-3" data-testid="role-switch-preview">
          <Eyebrow>If you switch to {roleLabel(target)}</Eyebrow>
          <div>
            <p className="text-sm font-bold text-heading">Changes</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              <li>
                Your objectives:{' '}
                {preview.active === 0 ? 'none yet for this role' : `${preview.active} active`}
                {preview.total > preview.active
                  ? `, ${preview.total - preview.active} more saved`
                  : ''}
              </li>
              <li>
                The module that opens first:{' '}
                {preview.firstModule ?? 'every module on the path is done'}
              </li>
              <li>Role map and suggested questions</li>
              <li>Default level: {preview.tier}</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold text-heading">Stays the same</p>
            <p className="mt-1 text-sm">
              Your My work items, bookmarks and Assistant history. Region and industry. The page you
              are on.
              {current
                ? ` Each role keeps its own objectives: your ${roleLabel(current)} objectives stay saved.`
                : ''}
            </p>
          </div>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">Undo stays available right after you switch.</p>
      <div className="flex flex-wrap gap-2">
        <StoryButton
          variant="primary"
          disabled={!target || target === current}
          onClick={() => {
            if (!target) return
            noteRoleSwitch(current, target)
            setPersona(target)
            close()
          }}
        >
          {target && target !== current ? `Switch to ${roleLabel(target)}` : 'Switch role'}
        </StoryButton>
        <StoryButton variant="secondary" onClick={close}>
          Cancel
        </StoryButton>
      </div>
    </JourneyDialog>
  )
}

/** After switching: "Now viewing as {role}." with Undo and "Keep this role". Shows only right after a switch. */
export function RoleSwitchNotice() {
  const note = useJourneyStore((s) => s.roleSwitch)
  const clear = useJourneyStore((s) => s.clearRoleSwitch)
  const setPersona = usePersonaStore((s) => s.setPersona)
  const clearPersona = usePersonaStore((s) => s.clearPersona)
  const current = usePersonaStore((s) => s.selectedPersona)
  if (!note || note.to !== current) return null
  return (
    <div
      role="status"
      data-testid="role-switch-notice"
      className="rounded-2xl border-2 border-ink bg-highlight px-4 py-3 text-heading"
    >
      <p className="font-bold">Now viewing as {roleLabel(note.to)}.</p>
      <p className="mt-1 text-sm">
        Your objective, module, Role map and level changed.{' '}
        {note.from
          ? `Your ${roleLabel(note.from)} objectives stay saved.`
          : 'Your work stays saved.'}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <StoryButton
          variant="secondary"
          onClick={() => {
            if (note.from) setPersona(note.from as PersonaId)
            else clearPersona()
            clear()
          }}
        >
          Undo
        </StoryButton>
        <StoryButton variant="quiet" onClick={clear}>
          Keep this role
        </StoryButton>
      </div>
    </div>
  )
}
