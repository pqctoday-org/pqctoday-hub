// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Role paths: computed from the lessons data file, never stored (direction 6, 24 Nov 2026).
 *
 * For a NICE work role: its lessons, ranked by how few roles share them (the most role-specific
 * first; ties by stage, then the track's own order, then the lesson id), the first ten shown in the
 * learning order, the rest under "more for this role". A role with fewer than ten lessons shows
 * all of them and says how many. A persona gets the path of the work role the Hub maps it to
 * (`PERSONA_DEFAULT_ROLE`); the curious persona has no work role, so its path is the common-ground
 * lessons in the learning order (owner: "The 17 common-ground lessons").
 */
import { LEARN_MODULES } from '@/data/generated/learnModules.generated'
import { NICE_WORK_ROLES, PERSONA_DEFAULT_ROLE, type NiceWorkRoleId } from '@/data/niceFramework'
import type { PersonaId } from '@/data/personaIds'
import { TREE_LESSONS, compareTreeOrder, type TreeLesson } from './lessons'

/** How many lessons a role path shows before "more for this role". */
export const ROLE_PATH_SIZE = 10

export interface RolePath {
  kind: 'work-role' | 'common-ground'
  /** The NICE work role the path is computed for; null for the common-ground path. */
  roleId: NiceWorkRoleId | null
  /** The lessons shown, in the learning order. */
  parts: TreeLesson[]
  /** The rest of the role's lessons, in the learning order. */
  more: TreeLesson[]
  /**
   * Common-ground lessons that sit outside the learning order (the practice quiz has no stage): shown
   * after the path, never as a step. Empty for a work role's path.
   */
  outside: { id: string; title: string; to: string }[]
  /** parts + more + outside: the number the path states. */
  total: number
  /** "8 modules" when the role has fewer than ten lessons of its own, otherwise null. */
  lengthStatement: string | null
}

function statement(total: number): string | null {
  return total < ROLE_PATH_SIZE ? `${total} ${total === 1 ? 'module' : 'modules'}` : null
}

/** The path of one NICE work role. */
export function rolePathForWorkRole(roleId: NiceWorkRoleId): RolePath {
  const ranked = TREE_LESSONS.filter((m) => m.niceWorkRoles.includes(roleId)).sort(
    (a, b) =>
      a.niceWorkRoles.length - b.niceWorkRoles.length ||
      a.stage - b.stage ||
      (a.trackOrder ?? 0) - (b.trackOrder ?? 0) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  )
  const parts = ranked.slice(0, ROLE_PATH_SIZE).sort(compareTreeOrder)
  const more = ranked.slice(ROLE_PATH_SIZE).sort(compareTreeOrder)
  return {
    kind: 'work-role',
    roleId,
    parts,
    more,
    outside: [],
    total: ranked.length,
    lengthStatement: statement(ranked.length),
  }
}

/**
 * The common-ground lessons in the learning order (the curious persona's path): the 17 of the owner's
 * decision. One of them, the practice quiz, has no stage, so it follows the others as an outside item.
 */
export function commonGroundPath(): RolePath {
  const parts = TREE_LESSONS.filter((m) => m.isCommonGround).sort(compareTreeOrder)
  const outside = LEARN_MODULES.filter((m) => m.isCommonGround && m.stage === undefined).map(
    (m) => ({
      id: m.id,
      title: m.title,
      to: `/learn/${m.id}`,
    })
  )
  const total = parts.length + outside.length
  return {
    kind: 'common-ground',
    roleId: null,
    parts,
    more: [],
    outside,
    total,
    lengthStatement: statement(total),
  }
}

/** The path a persona gets: its work role's path, or the common-ground lessons for the curious persona. */
export function rolePathForPersona(persona: PersonaId | null | undefined): RolePath | null {
  if (!persona) return null
  const roleId = PERSONA_DEFAULT_ROLE[persona]
  return roleId ? rolePathForWorkRole(roleId) : commonGroundPath()
}

/** Every lesson on a path, parts first. */
export function allOnPath(path: RolePath): TreeLesson[] {
  return [...path.parts, ...path.more]
}

/** True when the lesson is on the persona's path (shown or under "more"). */
export function isOnPersonaPath(persona: PersonaId | null | undefined, lessonTag: string): boolean {
  const path = rolePathForPersona(persona)
  return path ? allOnPath(path).some((m) => m.lmId === lessonTag) : false
}

/** The persona's label for a work role, for the line "Role · Security Architect". */
export function workRoleTitle(roleId: NiceWorkRoleId): string {
  return NICE_WORK_ROLES[roleId].title // eslint-disable-line security/detect-object-injection
}
