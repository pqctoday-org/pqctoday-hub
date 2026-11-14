// SPDX-License-Identifier: AGPL-3.0-only
// Every "Related & overlapping" row must open the exact record it names, or be inert.
// The old matcher opened an umbrella row by label substring, and 116 rows opened nothing.
import { describe, expect, it } from 'vitest'
import { complianceFrameworks, getFrameworkById } from '@/data/complianceData'
import { findLibraryItemByRef } from '@/data/libraryData'
import { buildDrawerDetail, pillarForBodyType, type CrosswalkItem } from './pillarModel'

const active = complianceFrameworks.filter((f) => f.status !== 'deprecated')

function allItems(): Array<{ fwId: string; item: CrosswalkItem }> {
  return active.flatMap((fw) =>
    buildDrawerDetail(fw, pillarForBodyType(fw.bodyType)).crosswalk.map((item) => ({
      fwId: fw.id,
      item,
    }))
  )
}

describe('drawer related records resolve to the exact record they name', () => {
  const items = allItems()
  const frameworkCount = new Set(items.map((i) => i.fwId)).size
  const clickable = items.filter((i) => i.item.target !== undefined)

  it('keeps the related-row count (247 rows across 109 frameworks)', () => {
    expect(items).toHaveLength(247)
    expect(frameworkCount).toBe(109)
  })

  it('resolves 245 rows: 87 to a framework, 158 to a library document; 2 are inert', () => {
    const framework = clickable.filter((i) => i.item.target?.kind === 'framework')
    const library = clickable.filter((i) => i.item.target?.kind === 'library')
    expect(clickable).toHaveLength(245)
    expect(framework).toHaveLength(87)
    expect(library).toHaveLength(158)
    expect(items.length - clickable.length).toBe(2)
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

  it('an inert row names no record we hold, so it is never a button that does nothing', () => {
    const inert = items.filter((i) => i.item.target === undefined)
    // Inert rows are only those whose other end is outside the register and the library.
    for (const { item } of inert) {
      expect(findLibraryItemByRef(item.name)).toBeUndefined()
      expect(getFrameworkById(item.name)).toBeUndefined()
    }
  })
})
