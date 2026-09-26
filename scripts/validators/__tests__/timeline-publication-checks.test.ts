// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { checkManifest, checkTimelinePublication } from '../timeline-publication-checks'

const UNREVIEWED = new Set(['new', 'unverified — needs review'])
const REGISTRY = new Set(['nist'])

function row(over: Record<string, string> = {}): Record<string, string> {
  return {
    event_id: 'e1',
    Title: 'T',
    Description: 'D',
    StartYear: '2030',
    EndYear: '2030',
    SourceUrl: 'https://nist.gov/x',
    SourceDate: '2025-01-01',
    Status: 'Validated',
    status: 'active',
    entity_type: 'government',
    trusted_source_id: 'nist',
    trusted_source_id_status: 'registered',
    local_file: 'timeline/x.pdf',
    is_sim_deadline: '',
    mandate_type: '',
    binding_force: '',
    source_class: 'primary',
    ...over,
  }
}

const byId = (results: ReturnType<typeof checkTimelinePublication>) =>
  Object.fromEntries(results.map((r) => [r.id, r]))

describe('timeline publication checks', () => {
  it('passes a clean, unchanged catalogue', () => {
    const r = byId(checkTimelinePublication([row()], [row()], UNREVIEWED, REGISTRY, 't.csv'))
    expect(Object.values(r).every((c) => c.status === 'PASS')).toBe(true)
  })

  it('rejects free-text trust statuses and unknown enum values', () => {
    const r = byId(
      checkTimelinePublication(
        [row({ trusted_source_id_status: 'resolved_2026-07-16', binding_force: 'HARD' })],
        null,
        UNREVIEWED,
        REGISTRY,
        't.csv'
      )
    )
    expect(r['TL-VOCAB'].findings).toHaveLength(2)
  })

  it('a reviewed deadline row must carry binding_force; an unreviewed one is only reported', () => {
    const r = byId(
      checkTimelinePublication(
        [
          row({ is_sim_deadline: 'true' }),
          row({ event_id: 'e2', is_sim_deadline: 'true', Status: 'New' }),
        ],
        null,
        UNREVIEWED,
        REGISTRY,
        't.csv'
      )
    )
    expect(r['TL-DEADLINE'].findings.map((f) => f.message)).toEqual([
      'e1: deadline row has no reviewed binding_force',
    ])
    expect(r['TL-DEADLINE-WITHHELD'].findings).toHaveLength(1)
    expect(r['TL-DEADLINE-WITHHELD'].severity).toBe('WARNING')
  })

  it('blocks a new unsourced row but only reports an unchanged legacy one', () => {
    const bad = { trusted_source_id: '', local_file: '' }
    const fresh = byId(checkTimelinePublication([row(bad)], [], UNREVIEWED, REGISTRY, 't.csv'))
    expect(fresh['TL-NEW'].status).toBe('FAIL')
    const legacy = byId(
      checkTimelinePublication([row(bad)], [row(bad)], UNREVIEWED, REGISTRY, 't.csv')
    )
    expect(legacy['TL-NEW'].status).toBe('PASS')
    expect(legacy['TL-LEGACY'].findings).toHaveLength(2)
  })

  it('flags a public vendor row, ignores a withheld one', () => {
    const r = byId(
      checkTimelinePublication(
        [
          row({ entity_type: 'vendor' }),
          row({ event_id: 'e2', entity_type: 'vendor', Status: 'New' }),
        ],
        null,
        UNREVIEWED,
        REGISTRY,
        't.csv'
      )
    )
    expect(r['TL-SCOPE'].findings.map((f) => f.message)).toEqual([
      'e1: vendor actor on the public timeline',
    ])
  })

  it('the manifest must be built from the live CSV and cover every active row', () => {
    const rows = [row(), row({ event_id: 'e2', status: 'deprecated' })]
    expect(checkManifest(rows, 't.csv', { csv: 't.csv', entries: [{ refId: 'e1' }] }).status).toBe(
      'PASS'
    )
    const stale = checkManifest(rows, 't.csv', { csv: 'old.csv', entries: [] })
    expect(stale.findings.map((f) => f.field)).toEqual(['csv', 'refId'])
    expect(checkManifest(rows, 't.csv', null).status).toBe('FAIL')
  })
})
