// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { ArtifactSection } from '../../../common/executive/ArtifactBuilder'
import {
  clearAuditPrefill,
  editAuditDraft,
  initializeAuditPrefill,
  type AuditPrefillDraft,
} from './auditPrefillOwnership'
const sections: ArtifactSection[] = [
  {
    id: 'sample',
    title: 'Sample',
    fields: [
      {
        id: 'topics',
        label: 'Topics',
        type: 'checklist',
        defaultValue: ['a', 'b'],
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
          { value: 'c', label: 'C' },
        ],
      },
      { id: 'note', label: 'Note', type: 'textarea', defaultValue: '' },
    ],
  },
]
const toggle = (draft: AuditPrefillDraft, item: string) =>
  editAuditDraft(
    draft,
    (data) => {
      const current = data.sample.topics as string[]
      return {
        ...data,
        sample: {
          ...data.sample,
          topics: current.includes(item) ? current.filter((v) => v !== item) : [...current, item],
        },
      }
    },
    { sectionId: 'sample', fieldId: 'topics', optionValue: item }
  )
const savedOf = (draft: AuditPrefillDraft) => ({
  checklistData: draft.checklistData,
  prefillOwnership: draft.prefillOwnership,
  originalSavedInputs: draft.originalSavedInputs,
})

describe('Audit topic prefill ownership is recorded, never inferred from equal values', () => {
  it('removes only untouched actual insertions and preserves independent selections and multiline notes', () => {
    let draft = initializeAuditPrefill(sections)
    expect(draft.prefillOwnership.untouchedInserted).toHaveLength(2)
    draft = toggle(draft, 'c')
    draft = editAuditDraft(
      draft,
      (data) => ({ ...data, sample: { ...data.sample, note: 'Fictional, "sample"\nnotes' } }),
      { sectionId: 'sample', fieldId: 'note' }
    )
    const cleared = clearAuditPrefill(draft)
    expect(cleared.checklistData).toEqual({
      sample: { topics: ['c'], note: 'Fictional, "sample"\nnotes' },
    })
    expect(cleared.lastClearCount).toBe(2)
    expect(draft.checklistData.sample.topics).toEqual(['a', 'b', 'c'])
  })
  it('preserves a seeded option explicitly toggled off then back on, including after saved ownership reload', () => {
    const draft = toggle(toggle(initializeAuditPrefill(sections), 'a'), 'a')
    expect(draft.checklistData.sample.topics).toEqual(['b', 'a'])
    expect(draft.prefillOwnership.untouchedInserted.map((t) => t.optionValue)).toEqual(['b'])
    const restored = initializeAuditPrefill(sections, savedOf(draft))
    expect(clearAuditPrefill(restored).checklistData.sample.topics).toEqual(['a'])
  })
  it('releases a whole edited field without guessing which equal values came from prefill', () => {
    const fresh = initializeAuditPrefill(sections)
    const edited = editAuditDraft(
      fresh,
      (data) => ({ ...data, sample: { ...data.sample, topics: ['a', 'b'] } }),
      { sectionId: 'sample', fieldId: 'topics' }
    )
    expect(clearAuditPrefill(edited).checklistData.sample.topics).toEqual(['a', 'b'])
  })
  it('keeps explicit saved empty fields authoritative and does not repopulate from changed defaults', () => {
    const cleared = clearAuditPrefill(initializeAuditPrefill(sections))
    const changed = sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) =>
        field.id === 'topics' ? { ...field, defaultValue: ['a', 'b', 'c'] } : field
      ),
    }))
    const restored = initializeAuditPrefill(changed, savedOf(cleared))
    expect(restored.checklistData.sample.topics).toEqual([])
    expect(restored.prefillOwnership.cleared).toBe(true)
    expect(restored.prefillOwnership.untouchedInserted).toEqual([])
  })
  it('preserves legacy matching selections, opaque work and one original snapshot across repeated saves', () => {
    const legacy = {
      checklistData: {
        sample: { topics: ['a'], note: 'Saved, "sample"\nnote' },
        future: { memo: 'Keep me' },
      },
      futureMemo: { version: 9, text: 'Opaque' },
    }
    const draft = initializeAuditPrefill(sections, legacy)
    expect(draft.prefillOwnership.inheritedOriginUnknown).toBe(true)
    expect(clearAuditPrefill(draft).checklistData).toEqual(legacy.checklistData)
    const once = initializeAuditPrefill(sections, savedOf(clearAuditPrefill(draft)))
    const twice = initializeAuditPrefill(sections, savedOf(once))
    expect(twice.originalSavedInputs).toEqual(legacy)
    expect(twice.originalSavedInputs).toEqual(once.originalSavedInputs)
    expect(twice.prefillOwnership.inheritedOriginUnknown).toBe(true)
  })
  it.each([
    {
      version: 2,
      untouchedInserted: [],
      cleared: false,
      inheritedOriginUnknown: false,
      futureRule: 'keep',
    },
    { version: 1, untouchedInserted: 'all', cleared: false, inheritedOriginUnknown: false },
    {
      version: 1,
      untouchedInserted: [
        { sectionId: 'sample', fieldId: 'topics', optionValue: 'a' },
        { sectionId: 'sample', fieldId: 'topics', optionValue: 'a' },
      ],
      cleared: false,
      inheritedOriginUnknown: false,
    },
    {
      version: 1,
      untouchedInserted: [{ sectionId: 'sample', fieldId: 'topics', optionValue: 'a' }],
      cleared: true,
      inheritedOriginUnknown: false,
    },
    {
      version: 1,
      untouchedInserted: [],
      cleared: false,
      inheritedOriginUnknown: false,
      futureRule: 'do not clear',
    },
  ])('preserves entries with unsupported or malformed ownership %#', (prefillOwnership) => {
    const original = {
      checklistData: { sample: { topics: ['a', 'b'], note: 'Keep' } },
      prefillOwnership,
    }
    const draft = initializeAuditPrefill(sections, original)
    expect(draft.prefillOwnership.untouchedInserted).toEqual([])
    expect(draft.prefillOwnership.inheritedOriginUnknown).toBe(true)
    expect(clearAuditPrefill(draft).checklistData).toEqual(original.checklistData)
    expect(draft.originalSavedInputs).toEqual(original)
  })
  it('with zero ownership keeps a manual selection and reports no removed insertions', () => {
    const empty = sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) => ({
        ...field,
        defaultValue: field.type === 'checklist' ? [] : '',
      })),
    }))
    const manual = toggle(initializeAuditPrefill(empty), 'c')
    expect(clearAuditPrefill(manual).checklistData.sample.topics).toEqual(['c'])
    expect(clearAuditPrefill(manual).lastClearCount).toBe(0)
  })
  it.each([
    { version: 2, newRule: 'Do not guess' },
    { version: 1, untouchedInserted: [], cleared: false, inheritedOriginUnknown: false },
  ])(
    'keeps a future loaded envelope rather than substituting an older snapshot, without repeated nesting %#',
    (prefillOwnership) => {
      const future = {
        checklistData: { sample: { topics: ['a'], note: 'Current future note' } },
        prefillOwnership,
        originalSavedInputs: { checklistData: { sample: { topics: ['b'], note: 'Older note' } } },
        futureMemo: { text: 'Keep current opaque work' },
      }
      const first = clearAuditPrefill(initializeAuditPrefill(sections, future))
      expect(first.checklistData.sample.topics).toEqual(['a'])
      expect(first.originalSavedInputs).toEqual(future)
      const second = initializeAuditPrefill(sections, savedOf(first))
      const third = initializeAuditPrefill(sections, savedOf(second))
      expect(second.originalSavedInputs).toEqual(future)
      expect(third.originalSavedInputs).toEqual(future)
    }
  )
})
