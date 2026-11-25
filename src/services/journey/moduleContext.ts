// SPDX-License-Identifier: AGPL-3.0-only
/**
 * What the module page shows for one learner (UX handoff 6.11): the step bar when the module is a
 * step of the focused objective, the other-role lens when it is outside the learner's role path,
 * and the resume line. Pure, so the six-module matrix can be tested for every persona.
 */
import { PERSONA_IDS, type PersonaId } from '@/data/personaIds'
import { isOnPersonaPath } from './rolePaths'
import { tagOfModule } from './lessons'
import type { Objective, Step } from './types'

export interface ModuleContext {
  /** The module's canonical tag; null for a page that is not a lesson (the quiz). */
  tag: string | null
  /** The step of the focused objective this module is, or null. */
  step: Step | null
  /** True when the module is on the persona's role path (shown or under "more"). */
  onRolePath: boolean
  /** Show "Outside the {role} path": a role is set, the module is not on its path and not a step of the focused objective. */
  lens: boolean
  /** The persona whose path holds this module, offered as "View as ..."; null when none besides the learner's does. */
  viewAs: PersonaId | null
}

/** The persona to offer as "View as ...": the first one, in the Learn page's order, whose path holds the lesson. */
export function personaWhoseRoleHolds(tag: string, except: PersonaId | null): PersonaId | null {
  const order: PersonaId[] = [...PERSONA_IDS]
  return order.find((p) => p !== except && isOnPersonaPath(p, tag)) ?? null
}

export function moduleContext(input: {
  moduleId: string
  persona: PersonaId | null
  focused: Objective | null
}): ModuleContext {
  const tag = tagOfModule(input.moduleId) ?? null
  const step =
    tag && input.focused ? (input.focused.steps.find((s) => s.resourceTag === tag) ?? null) : null
  const onRolePath = tag ? isOnPersonaPath(input.persona, tag) : false
  const lens = Boolean(input.persona && tag && !onRolePath && !step)
  return {
    tag,
    step,
    onRolePath,
    lens,
    viewAs: lens && tag ? personaWhoseRoleHolds(tag, input.persona) : null,
  }
}
