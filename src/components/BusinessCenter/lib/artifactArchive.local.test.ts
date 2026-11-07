// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { artifactArchive } from './artifactArchive'

describe('Artifact ZIP keeps every selected document', () => {
  it('preserves equal titles, sanitization collisions and an empty sanitized title as separate entries', async () => {
    const documents = [
      { id: 'first', type: 'charter', title: 'Plan', data: '# First\nFirst inputs' },
      { id: 'second', type: 'risk', title: 'Plan', data: '# Second\nOther inputs' },
      { id: 'third', type: 'charter', title: 'Plan!', data: '# Third' },
      { id: 'fourth', type: 'charter', title: '???', data: '# Fourth' },
    ]
    const bytes = await artifactArchive(documents).generateAsync({ type: 'uint8array' })
    const restored = await JSZip.loadAsync(bytes)
    const names = Object.keys(restored.files).filter((name) => name.endsWith('.md'))
    const manifest = JSON.parse(await restored.file('manifest.json')!.async('string'))
    expect(manifest.documents.map((doc: { id: string }) => doc.id)).toEqual(
      documents.map((doc) => doc.id)
    )
    expect(manifest.documents.map((doc: { filename: string }) => doc.filename)).toEqual(names)
    expect(manifest.documents.map((doc: { title: string }) => doc.title)).toEqual(
      documents.map((doc) => doc.title)
    )
    expect(names).toHaveLength(4)
    expect(new Set(names).size).toBe(4)
    expect(names).toEqual(['001-Plan.md', '002-Plan.md', '003-Plan.md', '004-document.md'])
    expect(await Promise.all(names.map((name) => restored.file(name)!.async('string')))).toEqual(
      documents.map((doc) => doc.data)
    )
  })
  it('exports only the supplied filtered selection without mutating its content', async () => {
    const selected = [
      {
        id: 'chosen',
        type: 'charter',
        title: 'Scoped item',
        data: 'Sample label\nSource reference\nInputs',
      },
    ]
    const zip = artifactArchive(selected)
    expect(Object.keys(zip.files)).toEqual(['001-Scoped_item.md', 'manifest.json'])
    expect(await zip.file('001-Scoped_item.md')!.async('string')).toBe(selected[0].data)
  })
})
