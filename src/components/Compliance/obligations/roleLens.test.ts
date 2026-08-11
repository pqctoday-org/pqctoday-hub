// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { applyRoleOrder, defaultTabForPersona, roleFramingFor, roleNoteFor } from './roleLens'
import { buildObligations, groupObligations } from './obligationsModel'
import type { PersonaId } from '@/data/learningPersonas'

const EU_FINANCE = { country: 'France', industry: 'Finance & Insurance', region: 'eu' as const }
const ROWS = buildObligations(EU_FINANCE)
const MANDATORY = groupObligations(ROWS).find((g) => g.tier === 'mandatory')!.rows
const ALL_ROLES: PersonaId[] = [
  'executive',
  'architect',
  'developer',
  'ops',
  'researcher',
  'curious',
]

describe('applyRoleOrder', () => {
  it('never drops or duplicates a row', () => {
    // The whole point of not reusing applicabilityLens: a browsing panel may
    // downsample, a register may not. Hiding an instrument the engine says
    // binds you is the one thing this page must never do.
    for (const role of ALL_ROLES) {
      const ordered = applyRoleOrder(ROWS, role)
      expect(ordered).toHaveLength(ROWS.length)
      expect(new Set(ordered.map((r) => r.framework.id)).size).toBe(ROWS.length)
    }
  })

  it('is stable for rows the role has no opinion about', () => {
    // Equal rank must preserve the model's ordering, so switching persona lifts
    // what that role leads with rather than scrambling the list.
    const rows = applyRoleOrder(ROWS, 'curious')
    const mandatory = rows.filter((r) => r.tier === 'mandatory').map((r) => r.framework.id)
    const original = ROWS.filter((r) => r.tier === 'mandatory').map((r) => r.framework.id)
    expect(mandatory).toEqual(original)
  })

  it('leads an executive with dated obligations', () => {
    const ordered = applyRoleOrder(MANDATORY, 'executive')
    const firstUndated = ordered.findIndex((r) => r.milestones.length === 0)
    if (firstUndated !== -1) {
      expect(ordered.slice(firstUndated).every((r) => r.milestones.length === 0)).toBe(true)
    }
  })

  it('leads ops with the nearest stated date', () => {
    const ordered = applyRoleOrder(MANDATORY, 'ops')
    const years = ordered
      .map((r) => r.milestones[0]?.year)
      .filter((y): y is number => y !== undefined)
    expect(years).toEqual([...years].sort((a, b) => a - b))
  })

  it('leads a researcher with the best-evidenced rows', () => {
    const ordered = applyRoleOrder(MANDATORY, 'researcher')
    const counts = ordered.map((r) => r.requirementCount)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
  })

  it('leaves order untouched when no persona is set', () => {
    expect(applyRoleOrder(ROWS, null).map((r) => r.framework.id)).toEqual(
      ROWS.map((r) => r.framework.id)
    )
  })

  it('produces a different lead row for at least two roles', () => {
    // If every role read the same, deleting the six persona views would buy
    // nothing — this asserts the lens actually earns that removal.
    const leads = new Set(ALL_ROLES.map((r) => applyRoleOrder(MANDATORY, r)[0].framework.id))
    expect(leads.size).toBeGreaterThan(1)
  })
})

describe('roleNoteFor and roleFramingFor', () => {
  it('gives every role its own framing sentence', () => {
    const framings = new Set(ALL_ROLES.map((r) => roleFramingFor(r)))
    expect(framings.size).toBe(ALL_ROLES.length)
  })

  it('annotates from the row’s own facts, never invented text', () => {
    const anssi = ROWS.find((r) => r.framework.id === 'ANSSI')!
    const note = roleNoteFor(anssi, 'architect')
    expect(note).toContain(String(anssi.requirementCount))
  })

  it('returns null rather than filler when a role has nothing to add', () => {
    const gdpr = ROWS.find((r) => r.framework.id === 'GDPR')!
    expect(roleNoteFor(gdpr, 'developer')).toBeNull()
  })

  it('falls back to a neutral framing with no persona', () => {
    expect(roleFramingFor(null)).toMatch(/applies to your country and sector/i)
  })
})

describe('defaultTabForPersona', () => {
  it('sends an ops reader to the calendar and everyone else to the register', () => {
    expect(defaultTabForPersona('ops')).toBe('progress')
    for (const role of ALL_ROLES.filter((r) => r !== 'ops')) {
      expect(defaultTabForPersona(role)).toBe('obligations')
    }
    expect(defaultTabForPersona(null)).toBe('obligations')
  })
})
