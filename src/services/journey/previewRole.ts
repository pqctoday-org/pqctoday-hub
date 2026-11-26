// SPDX-License-Identifier: AGPL-3.0-only
/**
 * `/learn?view=journey&role=<id>`: the id is a persona id (`architect`) or a NICE work-role id
 * (`control-assessor`). Either names a computed role path to look at WITHOUT switching the learner's
 * own role. An id that is neither is ignored: the page is plain Your journey.
 */
import { NICE_WORK_ROLES, type NiceWorkRoleId } from '@/data/niceFramework'
import { PERSONAS } from '@/data/learningPersonas'
import { isPersonaId, type PersonaId } from '@/data/personaIds'
import { rolePathForPersona, rolePathForWorkRole, workRoleTitle, type RolePath } from './rolePaths'

export type PreviewRole =
  | { kind: 'persona'; id: PersonaId; label: string; path: RolePath }
  | { kind: 'work-role'; id: NiceWorkRoleId; label: string; path: RolePath }

export function resolvePreviewRole(raw: string | null | undefined): PreviewRole | null {
  if (!raw) return null
  if (isPersonaId(raw)) {
    const path = rolePathForPersona(raw)
    return path ? { kind: 'persona', id: raw, label: PERSONAS[raw].label, path } : null // eslint-disable-line security/detect-object-injection
  }
  if (Object.prototype.hasOwnProperty.call(NICE_WORK_ROLES, raw)) {
    const id = raw as NiceWorkRoleId
    return { kind: 'work-role', id, label: workRoleTitle(id), path: rolePathForWorkRole(id) }
  }
  return null
}
