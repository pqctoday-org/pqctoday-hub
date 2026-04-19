// SPDX-License-Identifier: GPL-3.0-only
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from 'docx'

/**
 * Convert an artifact's markdown export into a DOCX document.
 *
 * Parsing rules (intentionally loose — artifact builders emit consistent md):
 *   - `# Heading`  → title (Heading 1)
 *   - `## Heading` → section (Heading 2)
 *   - `### Heading` → subsection (Heading 3)
 *   - `- [x] item` / `- [ ] item` → bullet with checkmark prefix
 *   - `- item` → bullet
 *   - `**label:**` inline bold stripped to bold run
 *   - Blank lines → paragraph break
 *   - `---` → skipped
 */
export async function markdownToDocx(
  markdown: string,
  filename: string,
  title?: string
): Promise<void> {
  const lines = markdown.split(/\r?\n/)
  const children: Paragraph[] = []

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (line === '' || line === '---') {
      continue
    }

    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: stripInline(line.slice(2)),
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 },
        })
      )
      continue
    }

    if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: stripInline(line.slice(3)),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      )
      continue
    }

    if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: stripInline(line.slice(4)),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 160, after: 80 },
        })
      )
      continue
    }

    // Checklist items: "- [x] item" or "- [ ] item"
    const checklistMatch = line.match(/^-\s+\[([x ])\]\s+(.*)$/)
    if (checklistMatch) {
      const checked = checklistMatch[1] === 'x'
      const content = stripInline(checklistMatch[2])
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${checked ? '☑' : '☐'} ${content}` })],
          spacing: { after: 60 },
          indent: { left: 360 },
        })
      )
      continue
    }

    // Plain bullet: "- item"
    if (line.startsWith('- ')) {
      children.push(
        new Paragraph({
          text: stripInline(line.slice(2)),
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      )
      continue
    }

    // Bold key-value: "**Label:** value"
    const kvMatch = line.match(/^\*\*([^*]+):\*\*\s*(.*)$/)
    if (kvMatch) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${kvMatch[1]}: `, bold: true }),
            new TextRun({ text: stripInline(kvMatch[2]) }),
          ],
          spacing: { after: 80 },
        })
      )
      continue
    }

    children.push(
      new Paragraph({
        children: [new TextRun({ text: stripInline(line) })],
        spacing: { after: 80 },
      })
    )
  }

  const doc = new Document({
    title: title ?? filename,
    creator: 'PQC Today Hub',
    sections: [{ children }],
  })

  const blob = await Packer.toBlob(doc)
  triggerDownload(blob, `${filename}.docx`)
}

function stripInline(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}
