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

  const rawLines = markdown.split(/\r?\n/)

  // Collect consecutive table lines, flush as a rendered table block.
  const isTableRow = (l: string) => l.trimEnd().startsWith('|') && l.trimEnd().endsWith('|')

  const flushTable = (tableLines: string[]) => {
    if (tableLines.length === 0) return
    // Parse cells: split on |, drop first/last empty strings.
    const parsedRows = tableLines.map((l) =>
      l
        .split('|')
        .slice(1, -1)
        .map((c) => stripInline(c.trim()))
    )
    // Identify header / separator / data rows.
    const separatorIdx = parsedRows.findIndex((r) => r.every((c) => /^[-: ]+$/.test(c)))
    const hasHeader = separatorIdx === 1
    const headers = hasHeader ? parsedRows[0] : []
    const dataRows = hasHeader
      ? parsedRows.slice(2)
      : parsedRows.filter((r) => !r.every((c) => /^[-: ]+$/.test(c)))
    const colCount = headers.length || (dataRows[0]?.length ?? 1)

    // Column widths: equal split of contentWidth, capped by actual content.
    const colWidth = contentWidth / colCount
    const cellPad = 4
    const fontSize = 8
    const cellLineH = 10

    // Compute row heights based on wrapped text.
    const computeRowHeight = (cells: string[], bold: boolean): number => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setFontSize(fontSize)
      let maxLines = 1
      for (const cell of cells) {
        const wrapped = doc.splitTextToSize(cell, colWidth - cellPad * 2) as string[]
        if (wrapped.length > maxLines) maxLines = wrapped.length
      }
      return maxLines * cellLineH + cellPad * 2
    }

    const renderRow = (
      cells: string[],
      bold: boolean,
      rowH: number,
      fillColor?: [number, number, number]
    ) => {
      ensureSpace(rowH)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setFontSize(fontSize)
      doc.setDrawColor(200, 200, 200)
      if (fillColor) {
        doc.setFillColor(...fillColor)
      }
      for (let c = 0; c < colCount; c++) {
        const cx = marginX + c * colWidth
        if (fillColor) {
          doc.rect(cx, y, colWidth, rowH, 'FD')
        } else {
          doc.rect(cx, y, colWidth, rowH, 'S')
        }
        // eslint-disable-next-line security/detect-object-injection
        const cellText = cells[c] ?? ''
        const wrapped = doc.splitTextToSize(cellText, colWidth - cellPad * 2) as string[]
        for (let li = 0; li < wrapped.length; li++) {
          // eslint-disable-next-line security/detect-object-injection
          doc.text(wrapped[li], cx + cellPad, y + cellPad + (li + 1) * cellLineH - 2)
        }
      }
      y += rowH
    }

    y += lineHeight / 2
    if (hasHeader) {
      const hRowH = computeRowHeight(headers, true)
      renderRow(headers, true, hRowH, [235, 235, 245])
    }
    for (let ri = 0; ri < dataRows.length; ri++) {
      // eslint-disable-next-line security/detect-object-injection
      const rowH = computeRowHeight(dataRows[ri], false)
      const fill: [number, number, number] | undefined = ri % 2 === 1 ? [248, 248, 252] : undefined
      // eslint-disable-next-line security/detect-object-injection
      renderRow(dataRows[ri], false, rowH, fill)
    }
    y += lineHeight / 2
  }

  let tableBuf: string[] = []

  for (const rawLine of rawLines) {
    const line = rawLine.trimEnd()

    // Buffer table rows; flush when a non-table line appears.
    if (isTableRow(line)) {
      tableBuf.push(line)
      continue
    }
    if (tableBuf.length > 0) {
      flushTable(tableBuf)
      tableBuf = []
    }

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
          // eslint-disable-next-line security/detect-object-injection
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

  // Flush any trailing table.
  if (tableBuf.length > 0) flushTable(tableBuf)

  doc.save(`${filename}.pdf`)
}

function stripInline(s: string): string {
  // Only strip **bold** markers. Single-star italic is deliberately excluded:
  // CPE URIs, glob patterns, and URLs contain bare `*` characters that the
  // italic regex `/\*([^*]+)\*/g` would incorrectly collapse (e.g. `*:*` → `:`).
  return s.replace(/\*\*([^*]+)\*\*/g, '$1')
}
