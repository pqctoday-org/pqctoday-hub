// SPDX-License-Identifier: GPL-3.0-only
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from 'docx'

/**
 * Convert an artifact's markdown export into a DOCX document.
 *
 * Block-level support (block tokenizer, not line-by-line, so multi-row
 * constructs like tables group correctly):
 *   - `# / ## / ### / ####`  → Title / Heading 1 / Heading 2 / Heading 3
 *   - GFM `| a | b |` tables  → a real Word table (bold, shaded header row,
 *     equal column widths); the `|---|` separator row is dropped. Audit C1.
 *   - ```` ``` ```` fenced code → monospace (Courier New) paragraphs
 *   - `> quote`               → indented italic paragraph
 *   - `- [x] item` / `- [ ] item` (case-insensitive) → bullet with check prefix
 *   - `- item`                → bullet
 *   - `**label:**` value      → bold label + value
 *   - Blank / `---`           → skipped
 *
 * Inline `**bold**` / `*italic*` markers are stripped to plain runs (Word can't
 * render the markdown markers and per-run styling inside table cells / list
 * items is more machinery than the visual win justifies).
 */

// ── Block model (pure, testable) ────────────────────────────────────────────
export type DocxBlock =
  | { kind: 'heading'; level: 0 | 1 | 2 | 3; text: string }
  | { kind: 'table'; head: string[]; body: string[][] }
  | { kind: 'code'; lines: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'check'; checked: boolean; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'kv'; label: string; value: string }
  | { kind: 'p'; text: string }

const isTableLine = (l: string) => {
  const t = l.trim()
  return t.startsWith('|') && t.endsWith('|') && t.length > 1
}
const isSeparatorRow = (cells: string[]) => cells.every((c) => /^:?-+:?$/.test(c.trim()))

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}

/**
 * Tokenise artifact markdown into block descriptors. Exported so the parsing
 * (the part that actually had the table bug) is unit-testable without docx.
 */
export function parseDocxBlocks(markdown: string): DocxBlock[] {
  const lines = markdown.split(/\r?\n/)
  const blocks: DocxBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = (lines[i] ?? '').trimEnd()

    if (line === '' || line.trim() === '---') {
      i++
      continue
    }

    // Fenced code block
    if (/^```/.test(line.trim())) {
      i++
      const code: string[] = []
      while (i < lines.length && !/^```/.test((lines[i] ?? '').trim())) {
        code.push(lines[i] ?? '')
        i++
      }
      i++ // consume closing fence
      blocks.push({ kind: 'code', lines: code })
      continue
    }

    // GFM table — buffer consecutive pipe rows
    if (isTableLine(line)) {
      const rows: string[][] = []
      while (i < lines.length && isTableLine(lines[i] ?? '')) {
        rows.push(splitTableRow(lines[i] ?? ''))
        i++
      }
      const sepIdx = rows.findIndex(isSeparatorRow)
      let head: string[] = []
      let body: string[][]
      if (sepIdx === 1) {
        head = rows[0] ?? []
        body = rows.slice(2)
      } else {
        body = rows.filter((r) => !isSeparatorRow(r))
      }
      if (head.length || body.length) blocks.push({ kind: 'table', head, body })
      continue
    }

    // Headings (mirror the legacy shift: # → Title, ## → H1, ### → H2, #### → H3)
    if (line.startsWith('#### ')) {
      blocks.push({ kind: 'heading', level: 3, text: line.slice(5) })
      i++
      continue
    }
    if (line.startsWith('### ')) {
      blocks.push({ kind: 'heading', level: 2, text: line.slice(4) })
      i++
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push({ kind: 'heading', level: 1, text: line.slice(3) })
      i++
      continue
    }
    if (line.startsWith('# ')) {
      blocks.push({ kind: 'heading', level: 0, text: line.slice(2) })
      i++
      continue
    }

    if (line.startsWith('> ')) {
      blocks.push({ kind: 'quote', text: line.slice(2) })
      i++
      continue
    }

    // Checklist — case-insensitive [x]/[X]/[ ]
    const checklistMatch = line.match(/^[-*]\s+\[([xX ])\]\s+(.*)$/)
    if (checklistMatch) {
      blocks.push({
        kind: 'check',
        checked: (checklistMatch[1] ?? ' ').toLowerCase() === 'x',
        text: checklistMatch[2] ?? '',
      })
      i++
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      blocks.push({ kind: 'bullet', text: line.replace(/^[-*]\s+/, '') })
      i++
      continue
    }

    const kvMatch = line.match(/^\*\*([^*]+):\*\*\s*(.*)$/)
    if (kvMatch) {
      blocks.push({ kind: 'kv', label: kvMatch[1] ?? '', value: kvMatch[2] ?? '' })
      i++
      continue
    }

    blocks.push({ kind: 'p', text: line })
    i++
  }

  return blocks
}

// ── Block → docx rendering ──────────────────────────────────────────────────
const HEADING_FOR_LEVEL = [
  HeadingLevel.TITLE,
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
] as const

function docxTable(head: string[], body: string[][]): Table {
  const colCount = Math.max(head.length, ...body.map((r) => r.length), 1)
  const colWidth = Math.floor(100 / colCount)

  const mkCell = (text: string, bold: boolean): TableCell =>
    new TableCell({
      width: { size: colWidth, type: WidthType.PERCENTAGE },
      shading: bold
        ? { type: ShadingType.CLEAR, color: 'auto', fill: 'E8EAF6' }
        : undefined,
      children: [new Paragraph({ children: [new TextRun({ text: stripInline(text), bold })] })],
    })

  const mkRow = (cells: string[], header: boolean): TableRow =>
    new TableRow({
      tableHeader: header,
      children: Array.from({ length: colCount }, (_, c) => mkCell(cells[c] ?? '', header)),
    })

  const rows: TableRow[] = []
  if (head.length) rows.push(mkRow(head, true))
  for (const r of body) rows.push(mkRow(r, false))

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })
}

/**
 * Map parsed blocks to docx section children. Exported for tests so the
 * table-vs-paragraph regression can be asserted without a download.
 */
export function markdownToDocxChildren(markdown: string): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = []
  for (const block of parseDocxBlocks(markdown)) {
    switch (block.kind) {
      case 'heading':
        out.push(
          new Paragraph({
            text: stripInline(block.text),
            heading: HEADING_FOR_LEVEL[block.level],
            alignment: block.level === 0 ? AlignmentType.LEFT : undefined,
            spacing: block.level === 0 ? { after: 200 } : { before: 200, after: 100 },
          })
        )
        break
      case 'table':
        out.push(docxTable(block.head, block.body))
        // a trailing spacer so the next block doesn't butt against the table
        out.push(new Paragraph({ text: '', spacing: { after: 80 } }))
        break
      case 'code':
        for (const cl of block.lines) {
          out.push(
            new Paragraph({
              children: [new TextRun({ text: cl, font: 'Courier New', size: 18 })],
              spacing: { after: 0 },
            })
          )
        }
        break
      case 'quote':
        out.push(
          new Paragraph({
            children: [new TextRun({ text: stripInline(block.text), italics: true })],
            indent: { left: 360 },
            spacing: { after: 80 },
          })
        )
        break
      case 'check':
        out.push(
          new Paragraph({
            children: [new TextRun({ text: `${block.checked ? '☑' : '☐'} ${stripInline(block.text)}` })],
            spacing: { after: 60 },
            indent: { left: 360 },
          })
        )
        break
      case 'bullet':
        out.push(
          new Paragraph({
            text: stripInline(block.text),
            bullet: { level: 0 },
            spacing: { after: 60 },
          })
        )
        break
      case 'kv':
        out.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${block.label}: `, bold: true }),
              new TextRun({ text: stripInline(block.value) }),
            ],
            spacing: { after: 80 },
          })
        )
        break
      case 'p':
        out.push(
          new Paragraph({
            children: [new TextRun({ text: stripInline(block.text) })],
            spacing: { after: 80 },
          })
        )
        break
    }
  }
  return out
}

export async function markdownToDocx(
  markdown: string,
  filename: string,
  title?: string
): Promise<void> {
  const doc = new Document({
    title: title ?? filename,
    creator: 'PQC Today Hub',
    sections: [{ children: markdownToDocxChildren(markdown) }],
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
