// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  LIFECYCLE_FILTER_OPTIONS,
  LIFECYCLE_LABELS,
  LIFECYCLE_STYLES,
  getGroupLifecycleLabel,
  lifecycleLabelFromStatusBucket,
  parseLifecycleLabel,
  parseLifecycleParam,
  resolveLifecycleLabel,
} from './libraryLifecycle'
import {
  LIFECYCLE_FILTER_OPTIONS as OLD_FILTER_OPTIONS,
  getDocumentStatusBucket,
  type DocumentStatusBucket,
} from './documentStatusBucket'

describe('the six lifecycle labels', () => {
  it('are exactly Released, Draft, Expired, Historical, Research Paper and Misc', () => {
    expect([...LIFECYCLE_LABELS]).toEqual([
      'Released',
      'Draft',
      'Expired',
      'Historical',
      'Research Paper',
      'Misc',
    ])
  })

  it('each have a badge, a dot and their own name as the shown label', () => {
    for (const label of LIFECYCLE_LABELS) {
      /* eslint-disable security/detect-object-injection -- label is a LifecycleLabel key */
      expect(LIFECYCLE_STYLES[label].label).toBe(label)
      expect(LIFECYCLE_STYLES[label].badge.length).toBeGreaterThan(0)
      expect(LIFECYCLE_STYLES[label].dot.length).toBeGreaterThan(0)
      /* eslint-enable security/detect-object-injection */
    }
  })

  it('are all in the filter, after "All Statuses"', () => {
    expect(LIFECYCLE_FILTER_OPTIONS.map((o) => o.id)).toEqual(['All', ...LIFECYCLE_LABELS])
  })
})

describe('parseLifecycleLabel (the lifecycle_state cell)', () => {
  it('reads each label exactly, ignoring case, spacing and "_" or "-"', () => {
    for (const label of LIFECYCLE_LABELS) {
      expect(parseLifecycleLabel(label)).toBe(label)
      expect(parseLifecycleLabel(label.toUpperCase())).toBe(label)
      expect(parseLifecycleLabel(`  ${label.toLowerCase()} `)).toBe(label)
    }
    expect(parseLifecycleLabel('research_paper')).toBe('Research Paper')
    expect(parseLifecycleLabel('research-paper')).toBe('Research Paper')
  })

  it('reads the three renamed labels by their old names', () => {
    expect(parseLifecycleLabel('Published')).toBe('Released')
    expect(parseLifecycleLabel('Proposed')).toBe('Draft')
    expect(parseLifecycleLabel('Superseded')).toBe('Historical')
  })

  it('returns null for blank cells and for the free text the column held before', () => {
    for (const raw of [
      '',
      '   ',
      undefined,
      null,
      'current',
      'active',
      'deprecated',
      'Round 2',
      'Preprint',
      'Expired Draft',
      'Released (Proposed Standard)',
    ]) {
      expect(parseLifecycleLabel(raw), String(raw)).toBeNull()
    }
  })
})

describe('resolveLifecycleLabel', () => {
  it('uses the lifecycle_state cell when it holds a label, even against the status text', () => {
    expect(
      resolveLifecycleLabel({ lifecycleState: 'Historical', documentStatus: 'Published' })
    ).toBe('Historical')
    expect(
      resolveLifecycleLabel({ lifecycleState: 'Research Paper', documentStatus: 'Final' })
    ).toBe('Research Paper')
    expect(resolveLifecycleLabel({ lifecycleState: 'Misc', documentStatus: 'Draft' })).toBe('Misc')
  })

  it('falls back to the status text where the cell is blank or is not a label', () => {
    for (const lifecycleState of [undefined, '', 'current', 'deprecated', 'Round 2']) {
      expect(resolveLifecycleLabel({ lifecycleState, documentStatus: 'Final' })).toBe('Released')
      expect(resolveLifecycleLabel({ lifecycleState, documentStatus: 'Proposed Standard' })).toBe(
        'Draft'
      )
      expect(resolveLifecycleLabel({ lifecycleState, documentStatus: 'Internet-Draft' })).toBe(
        'Draft'
      )
      expect(
        resolveLifecycleLabel({ lifecycleState, documentStatus: 'Expired Internet-Draft' })
      ).toBe('Expired')
      expect(resolveLifecycleLabel({ lifecycleState, documentStatus: 'Superseded by X' })).toBe(
        'Historical'
      )
    }
  })

  it('never produces Research Paper or Misc from the status text alone', () => {
    for (const documentStatus of ['Active Research', 'Preprint', 'Misc', 'Research Paper', '']) {
      expect(['Research Paper', 'Misc']).not.toContain(resolveLifecycleLabel({ documentStatus }))
    }
  })
})

describe('the old five buckets map to the new labels', () => {
  it('Published to Released, Proposed to Draft, Superseded to Historical, Draft and Expired stay', () => {
    const expected: Record<DocumentStatusBucket, string> = {
      Published: 'Released',
      Proposed: 'Draft',
      Draft: 'Draft',
      Expired: 'Expired',
      Superseded: 'Historical',
    }
    for (const [bucket, label] of Object.entries(expected)) {
      expect(lifecycleLabelFromStatusBucket(bucket as DocumentStatusBucket)).toBe(label)
    }
  })

  it('agree with the status text rules for a spread of real status values', () => {
    const cases: Array<[string, string]> = [
      ['Final', 'Released'],
      ['Published', 'Released'],
      ['In force', 'Released'],
      ['Proposed Standard', 'Draft'],
      ['Round 4 Submission', 'Draft'],
      ['Internet-Draft (WG Document)', 'Draft'],
      ['Initial Public Draft', 'Draft'],
      ['Expired (WGLC pending revival)', 'Expired'],
      ['Obsoleted by RFC 9999', 'Expired'],
      ['Superseded', 'Historical'],
    ]
    for (const [status, label] of cases) {
      expect(resolveLifecycleLabel({ documentStatus: status }), status).toBe(label)
      expect(lifecycleLabelFromStatusBucket(getDocumentStatusBucket(status))).toBe(label)
    }
  })
})

describe('parseLifecycleParam (the ?lifecycle= URL value)', () => {
  it('keeps every old link working: each old filter value opens with the matching new label', () => {
    const opened = Object.fromEntries(
      OLD_FILTER_OPTIONS.map((o) => [o.id, parseLifecycleParam(o.id)])
    )
    expect(opened).toEqual({
      All: 'All',
      Published: 'Released',
      Proposed: 'Draft',
      Draft: 'Draft',
      Expired: 'Expired',
      Superseded: 'Historical',
    })
  })

  it('accepts the six labels, in any case', () => {
    for (const label of LIFECYCLE_LABELS) {
      expect(parseLifecycleParam(label)).toBe(label)
      expect(parseLifecycleParam(label.toLowerCase())).toBe(label)
    }
    expect(parseLifecycleParam('all')).toBe('All')
  })

  it('treats a missing or unknown value as no value', () => {
    for (const raw of [null, undefined, '', 'Archived', 'Round 2']) {
      expect(parseLifecycleParam(raw), String(raw)).toBeNull()
    }
  })
})

describe('getGroupLifecycleLabel', () => {
  it('returns the furthest label across a document and its older revisions', () => {
    expect(getGroupLifecycleLabel('Draft', ['Released'])).toBe('Released')
    expect(getGroupLifecycleLabel('Released', ['Draft', 'Expired'])).toBe('Released')
    expect(getGroupLifecycleLabel('Expired', ['Historical'])).toBe('Expired')
    expect(getGroupLifecycleLabel('Draft', ['Draft'])).toBe('Draft')
  })

  it('returns the label itself when there are no older revisions', () => {
    for (const label of LIFECYCLE_LABELS) expect(getGroupLifecycleLabel(label, [])).toBe(label)
  })

  it('never lets a lapsed or replaced revision outrank a Research Paper or Misc document', () => {
    expect(getGroupLifecycleLabel('Research Paper', ['Expired', 'Historical'])).toBe(
      'Research Paper'
    )
    expect(getGroupLifecycleLabel('Misc', ['Expired', 'Historical'])).toBe('Misc')
  })
})
