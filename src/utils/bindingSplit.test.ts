// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  BINDING_GROUPS,
  BINDING_GROUP_META,
  BINDING_STATUSES,
  bindingGroupOf,
  parseBindingStatus,
  splitByBinding,
  type BindingStatus,
} from './bindingSplit'

describe('the six binding words', () => {
  it("are the Timeline's own binding_force words", () => {
    expect([...BINDING_STATUSES]).toEqual([
      'binding',
      'mandatory_for_scope',
      'official_target',
      'recommendation',
      'draft',
      'informational',
    ])
  })
})

describe('parseBindingStatus', () => {
  it('reads each word, ignoring case, spaces and hyphens', () => {
    for (const status of BINDING_STATUSES) {
      expect(parseBindingStatus(status)).toBe(status)
      expect(parseBindingStatus(status.toUpperCase())).toBe(status)
    }
    expect(parseBindingStatus(' Mandatory for scope ')).toBe('mandatory_for_scope')
    expect(parseBindingStatus('official-target')).toBe('official_target')
  })

  it('treats a blank, or anything that is not one of the words, as not classified', () => {
    for (const raw of [
      '',
      '   ',
      undefined,
      null,
      'mandatory',
      'guidance',
      'HARD',
      'binding force',
    ]) {
      expect(parseBindingStatus(raw), String(raw)).toBeUndefined()
    }
  })
})

describe('bindingGroupOf', () => {
  it('puts binding and mandatory_for_scope under Binding', () => {
    expect(bindingGroupOf('binding')).toBe('binding')
    expect(bindingGroupOf('mandatory_for_scope')).toBe('binding')
  })

  it('puts the other four under Guidance and drafts', () => {
    for (const s of ['official_target', 'recommendation', 'draft', 'informational'] as const) {
      expect(bindingGroupOf(s), s).toBe('guidance')
    }
  })

  it('never reads a blank as guidance', () => {
    expect(bindingGroupOf(undefined)).toBe('unclassified')
  })

  it('gives every one of the six words exactly one group, and every group a label', () => {
    for (const s of BINDING_STATUSES) expect(BINDING_GROUPS).toContain(bindingGroupOf(s))
    expect(BINDING_GROUPS.map((g) => BINDING_GROUP_META[g].label)).toEqual([
      'Binding',
      'Guidance and drafts',
      'Not yet classified',
    ])
  })
})

describe('splitByBinding', () => {
  const r = (id: string, bindingStatus?: BindingStatus) => ({ id, item: { bindingStatus } })

  it('splits a list into the three groups, keeping the order given', () => {
    const out = splitByBinding([
      r('a', 'recommendation'),
      r('b', 'binding'),
      r('c'),
      r('d', 'mandatory_for_scope'),
      r('e', 'draft'),
      r('f'),
    ])
    expect(out.binding.map((x) => x.id)).toEqual(['b', 'd'])
    expect(out.guidance.map((x) => x.id)).toEqual(['a', 'e'])
    expect(out.unclassified.map((x) => x.id)).toEqual(['c', 'f'])
  })

  it('puts every item in exactly one group', () => {
    const all = [...BINDING_STATUSES, undefined].map((s, i) => r(`x${i}`, s))
    const out = splitByBinding(all)
    expect(out.binding.length + out.guidance.length + out.unclassified.length).toBe(all.length)
  })

  it('returns empty groups for an empty list', () => {
    expect(splitByBinding([])).toEqual({ binding: [], guidance: [], unclassified: [] })
  })
})
