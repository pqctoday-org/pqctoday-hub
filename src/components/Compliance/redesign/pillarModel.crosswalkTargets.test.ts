// SPDX-License-Identifier: AGPL-3.0-only
// Every "Related & overlapping" row must open the exact record it names, or be inert.
// The old matcher opened an umbrella row by label substring, and many rows opened nothing.
// The invariants below are computed from the live data, so a data refresh does not change them.
import { describe, expect, it } from 'vitest'
import { complianceFrameworks, getFrameworkById } from '@/data/complianceData'
import { findLibraryItemByRef } from '@/data/libraryData'
import { buildDrawerDetail, pillarForBodyType, type CrosswalkItem } from './pillarModel'

const active = complianceFrameworks.filter((f) => f.status !== 'deprecated')

const items = active.flatMap((fw) =>
  buildDrawerDetail(fw, pillarForBodyType(fw.bodyType)).crosswalk.map((item) => ({
    fwId: fw.id,
    item: item as CrosswalkItem,
  }))
)
const clickable = items.filter((i) => i.item.target !== undefined)
const inert = items.filter((i) => i.item.target === undefined)

describe('drawer related records resolve to the exact record they name', () => {
  it('has related rows to check', () => {
    expect(items.length).toBeGreaterThan(0)
    expect(clickable.length).toBeGreaterThan(0)
  })

  it('every clickable row opens a record that exists, and never the framework itself', () => {
    for (const { fwId, item } of clickable) {
      const t = item.target
      if (!t) continue
      if (t.kind === 'framework') {
        expect(getFrameworkById(t.id)?.id, `${fwId} -> ${t.id}`).toBe(t.id)
        expect(t.id).not.toBe(fwId)
      } else {
        expect(findLibraryItemByRef(t.ref)?.referenceId, `${fwId} -> ${t.ref}`).toBe(t.ref)
      }
    }
  })

  it('a row that names an active framework by its exact id opens that framework', () => {
    for (const { fwId, item } of items) {
      if (item.name === fwId) continue
      if (!getFrameworkById(item.name)) continue
      expect(item.target, `${fwId} names ${item.name}`).toEqual({
        kind: 'framework',
        id: item.name,
      })
    }
  })

  it('an inert row names no record we hold, so it can say why it cannot open', () => {
    for (const { item } of inert) {
      expect(findLibraryItemByRef(item.name)).toBeUndefined()
      expect(getFrameworkById(item.name)).toBeUndefined()
    }
  })
})
