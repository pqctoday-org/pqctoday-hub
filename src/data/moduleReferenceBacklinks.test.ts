// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { MODULE_CITED_STANDARDS } from './moduleContentRegistry'
import { resolveCitedLibraryItem } from './libraryData'
describe('module citations resolve to useful Library entries and backlinks', () => {
  it('resolves each cited document and includes its citing module in the Library entry', () => {
    const missing: string[] = []
    for (const [moduleId, refs] of Object.entries(MODULE_CITED_STANDARDS))
      for (const ref of refs) {
        const item = resolveCitedLibraryItem(ref.id)
        if (!item || !item.moduleIds?.includes(moduleId)) missing.push(`${moduleId}: ${ref.id}`)
      }
    expect(missing).toEqual([])
  })
})
