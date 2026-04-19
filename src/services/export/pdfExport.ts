// SPDX-License-Identifier: GPL-3.0-only
import jsPDF from 'jspdf'

/**
 * Convert an artifact's markdown export into a paginated PDF document.
 *
 * Parsing rules:
 *   - `# Heading`  → 18pt bold title
 *   - `## Heading` → 14pt bold section
 *   - `### Heading` → 12pt bold subsection
 *   - `- [x] item` → bullet with checkmark
 *   - `- item` → bullet
 *   - `**label:** value` → bold label + normal value
 *   - Blank lines → paragraph spacing
 *   - `---` → horizontal rule
 */
export async function markdownToPdf(
  markdown: string,
  filename: string,
  title?: string
): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 54
  const marginTop = 64
  const marginBottom = 54
  const contentWidth = pageWidth - marginX * 2

  if (title) doc.setProperties({ title })

  let y = marginTop
  const lineHeight = 14

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - marginBottom) {
      doc.addPage()
      y = marginTop
    }
  }

  const writeWrapped = (text: string, fontSize: number, bold: boolean, indent = 0) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    const wrapped = doc.splitTextToSize(text, contentWidth - indent) as string[]
    for (const line of wrapped) {
      ensureSpace(lineHeight)
      doc.text(line, marginX + indent, y)
      y += lineHeight
    }
  }

  const lines = markdown.split(/\r?\n/)

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (line === '') {
      y += lineHeight / 2
      continue
    }

    if (line === '---') {
      ensureSpace(lineHeight)
      doc.setDrawColor(180, 180, 180)
      doc.line(marginX, y, pageWidth - marginX, y)
      y += lineHeight
      continue
    }

    if (line.startsWith('# ')) {
      y += lineHeight / 2
      ensureSpace(lineHeight * 2)
      writeWrapped(stripInline(line.slice(2)), 18, true)
      y += lineHeight / 2
      continue
    }

    if (line.startsWith('## ')) {
      y += lineHeight
      ensureSpace(lineHeight * 2)
      writeWrapped(stripInline(line.slice(3)), 14, true)
      y += lineHeight / 3
      continue
    }

    if (line.startsWith('### ')) {
      y += lineHeight / 2
      ensureSpace(lineHeight * 1.5)
      writeWrapped(stripInline(line.slice(4)), 12, true)
      continue
    }

    const checklistMatch = line.match(/^-\s+\[([x ])\]\s+(.*)$/)
    if (checklistMatch) {
      const checked = checklistMatch[1] === 'x'
      const content = stripInline(checklistMatch[2])
      writeWrapped(`${checked ? '☑' : '☐'} ${content}`, 10, false, 14)
      continue
    }

    if (line.startsWith('- ')) {
      writeWrapped(`• ${stripInline(line.slice(2))}`, 10, false, 14)
      continue
    }

    const kvMatch = line.match(/^\*\*([^*]+):\*\*\s*(.*)$/)
    if (kvMatch) {
      const labelText = `${kvMatch[1]}: `
      const valueText = stripInline(kvMatch[2])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      const labelWidth = doc.getTextWidth(labelText)
      ensureSpace(lineHeight)
      doc.text(labelText, marginX, y)
      doc.setFont('helvetica', 'normal')
      const remainingWidth = contentWidth - labelWidth
      const valueLines = doc.splitTextToSize(valueText, remainingWidth) as string[]
      if (valueLines.length > 0) {
        doc.text(valueLines[0], marginX + labelWidth, y)
        y += lineHeight
        for (let i = 1; i < valueLines.length; i++) {
          ensureSpace(lineHeight)
          doc.text(valueLines[i], marginX, y)
          y += lineHeight
        }
      } else {
        y += lineHeight
      }
      continue
    }

    writeWrapped(stripInline(line), 10, false)
  }

  doc.save(`${filename}.pdf`)
}

function stripInline(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
}
