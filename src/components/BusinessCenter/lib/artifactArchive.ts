// SPDX-License-Identifier: AGPL-3.0-only
import JSZip from 'jszip'

interface ArchiveDocument {
  id: string
  type: string
  title: string
  data: string
}

/** Prefix each selected document by its position so duplicate/sanitized titles
 * cannot replace an earlier ZIP entry. Contents and selection order stay intact.
 */
export function artifactArchive(documents: ArchiveDocument[]): JSZip {
  const zip = new JSZip()
  const width = Math.max(3, String(documents.length).length)
  const manifest = documents.map((doc, index) => {
    const title =
      doc.title
        .replace(/[^a-z0-9_\- ]/gi, '')
        .trim()
        .replace(/\s+/g, '_') || 'document'
    const prefix = String(index + 1).padStart(width, '0')
    const filename = `${prefix}-${title}.md`
    zip.file(filename, doc.data)
    return { id: doc.id, type: doc.type, title: doc.title, filename }
  })
  zip.file('manifest.json', JSON.stringify({ formatVersion: 1, documents: manifest }, null, 2))
  return zip
}
