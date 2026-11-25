// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename -- reads the committed knowledge file by a fixed path */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { PERSONA_IDS } from '@/data/personaIds'
import { NICE_WORK_ROLES, PERSONA_DEFAULT_ROLE, type NiceWorkRoleId } from '@/data/niceFramework'
import {
  ROLE_PATH_SIZE,
  allOnPath,
  commonGroundPath,
  isOnPersonaPath,
  rolePathForPersona,
  rolePathForWorkRole,
} from './rolePaths'
import { TREE_LESSONS } from './lessons'

const core = JSON.parse(
  readFileSync(join(process.cwd(), 'public/data/knowledge-core.json'), 'utf8')
) as { records: { id: string; kind: string; parts?: string[]; more?: string[] }[] }
const corePaths = core.records.filter((r) => r.kind === 'role path')

describe('role paths are computed from the lessons data file', () => {
  it('has a path record for every NICE work role to compare with', () => {
    expect(corePaths.map((r) => r.id.replace('PATH:', '')).sort()).toEqual(
      Object.keys(NICE_WORK_ROLES).sort()
    )
  })

  it.each(corePaths.map((r) => [r.id, r] as const))(
    '%s matches the path the knowledge file carries, shown order and more',
    (_id, record) => {
      const path = rolePathForWorkRole(record.id.replace('PATH:', '') as NiceWorkRoleId)
      expect(path.parts.map((l) => l.lmId)).toEqual(record.parts)
      expect(path.more.map((l) => l.lmId)).toEqual(record.more ?? [])
    }
  )

  it('shows at most ten lessons and puts the rest under "more for this role"', () => {
    for (const role of Object.keys(NICE_WORK_ROLES) as NiceWorkRoleId[]) {
      const path = rolePathForWorkRole(role)
      expect(path.parts.length).toBeLessThanOrEqual(ROLE_PATH_SIZE)
      expect(path.total).toBe(path.parts.length + path.more.length)
      if (path.total > ROLE_PATH_SIZE) expect(path.parts).toHaveLength(ROLE_PATH_SIZE)
    }
  })

  it('shows the shown lessons in the learning order', () => {
    const path = rolePathForWorkRole('security-architect')
    const stages = path.parts.map((l) => l.stage)
    expect(stages).toEqual([...stages].sort((a, b) => a - b))
  })

  it('ranks by how few roles share a lesson: the shown ten are no more shared than the rest', () => {
    for (const role of Object.keys(NICE_WORK_ROLES) as NiceWorkRoleId[]) {
      const path = rolePathForWorkRole(role)
      if (path.more.length === 0) continue
      const mostShared = Math.max(...path.parts.map((l) => l.niceWorkRoles.length))
      const leastSharedRest = Math.min(...path.more.map((l) => l.niceWorkRoles.length))
      expect(mostShared).toBeLessThanOrEqual(leastSharedRest)
    }
  })

  it('states the length when a role has fewer than ten lessons, and only then', () => {
    for (const role of Object.keys(NICE_WORK_ROLES) as NiceWorkRoleId[]) {
      const path = rolePathForWorkRole(role)
      if (path.total < ROLE_PATH_SIZE) expect(path.lengthStatement).toBe(`${path.total} modules`)
      else expect(path.lengthStatement).toBeNull()
    }
  })

  it('never lists a lesson outside the learning order (the practice quiz has no stage)', () => {
    for (const role of Object.keys(NICE_WORK_ROLES) as NiceWorkRoleId[]) {
      for (const l of allOnPath(rolePathForWorkRole(role))) expect(l.stage).toBeGreaterThan(0)
    }
  })
})

describe('every persona has a path (A05, A36)', () => {
  it.each(PERSONA_IDS.map((p) => [p] as const))('%s', (persona) => {
    const path = rolePathForPersona(persona)
    expect(path).not.toBeNull()
    expect(path!.parts.length).toBeGreaterThan(0)
    const role = PERSONA_DEFAULT_ROLE[persona]
    if (role) expect(path!.roleId).toBe(role)
    else expect(path!.kind).toBe('common-ground')
  })

  it('gives the curious persona the common-ground lessons in the learning order, all of them', () => {
    const path = rolePathForPersona('curious')!
    const common = TREE_LESSONS.filter((l) => l.isCommonGround)
    expect(path.parts).toHaveLength(common.length)
    // 16 in the learning order plus the practice quiz, which has no stage: the 17 of the owner's decision
    expect(path.parts.length + path.outside.length).toBe(17)
    expect(path.total).toBe(17)
    expect(path.outside.map((o) => o.id)).toEqual(['quiz'])
    expect(path.more).toHaveLength(0)
    expect(commonGroundPath().lengthStatement).toBeNull()
  })

  it('has no path without a role', () => {
    expect(rolePathForPersona(null)).toBeNull()
    expect(isOnPersonaPath(null, 'LM-008')).toBe(false)
  })

  it('answers whether a lesson is on a persona path, shown or under "more"', () => {
    const path = rolePathForPersona('architect')!
    expect(isOnPersonaPath('architect', path.parts[0].lmId)).toBe(true)
    expect(isOnPersonaPath('architect', path.more[0].lmId)).toBe(true)
  })
})
