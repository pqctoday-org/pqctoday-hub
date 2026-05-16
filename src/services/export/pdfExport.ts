// SPDX-License-Identifier: GPL-3.0-only
/**
 * markdownToPdf — render an artifact's markdown into a vector A4 PDF.
 *
 * One pipeline serves every Command Center artifact editor (drawer "Download
 * PDF" and inline `.pdf` buttons). Output is selectable text, never raster.
 *
 * Block-level support: # / ## / ### / #### headings, paragraphs, GFM tables
 * (via jspdf-autotable, with repeating header rows on page break),
 * bullet/ordered lists, task-list checkboxes, fenced code blocks, horizontal
 * rules, blockquotes, and the `**label:** value` key/value pattern emitted by
 * many builders.
 *
 * Mermaid (```` ```mermaid ```` fenced blocks): jsPDF can't render the SVG and
 * pre-rendering to PNG would balloon the bundle (~400 KB for headless mermaid
 * + chromium-shim), so the source is stripped and replaced with a substitute
 * paragraph that names the diagram type and first label. Audit B1.
 *
 * Inline support: **bold**, *italic*, `code`, [text](url) — all rendered with
 * matching font weight/family. `*` characters that are not paired or appear
 * inside URIs/glob patterns survive as literals (the parser only consumes
 * matched pairs).
 *
 * Character encoding: jsPDF's built-in Helvetica/Courier fonts are WinAnsi
 * (latin1) only. Every string fed into the doc passes through
 * `sanitizeForLatin1` so smart quotes, em-dashes, math symbols, Greek letters,
 * and status emoji become ASCII equivalents instead of being silently
 * dropped. Audit B2.
 *
 * Page furniture: every page gets a footer with the artifact title (left) and
 * "Page N of M" (right).
 */
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Page geometry (A4 portrait, points) ────────────────────────────────────
const PAGE_FORMAT = 'a4'
const MARGIN_X = 54
const MARGIN_TOP = 64
const MARGIN_BOTTOM = 56
const FOOTER_Y_OFFSET = 28 // distance from bottom of page to footer baseline

// ── Typography ─────────────────────────────────────────────────────────────
const FONT_BODY = 'helvetica'
const FONT_MONO = 'courier'
const SIZE_BODY = 10
const SIZE_H1 = 20
const SIZE_H2 = 14
const SIZE_H3 = 12
const SIZE_H4 = 10.5
const SIZE_CODE = 9
const SIZE_TABLE = 9
const SIZE_FOOTER = 8
const LINE_HEIGHT_FACTOR = 1.35

// ── ASCII / latin1 substitution (audit B2) ─────────────────────────────────
/**
 * Map of non-latin1 glyphs the codebase actually emits to their nearest ASCII
 * equivalent. Order matters only insofar as overlapping replacements (none
 * currently overlap). Encoded as `[regex, replacement]` so the per-string
 * pass is a fixed number of `String.replace` calls.
 *
 * Embedding a TrueType font (Inter / Roboto Mono) would cost ~400 KB on the
 * bundle vs. this ~1 KB table; ASCII fidelity is acceptable for the worked
 * examples and accepted by the audit.
 */
const LATIN1_SUBSTITUTIONS: ReadonlyArray<readonly [RegExp, string]> = [
  // Punctuation
  [/—/g, '-'], // U+2014 em-dash
  [/–/g, '-'], // U+2013 en-dash
  [/‘/g, "'"], // U+2018 left single quote
  [/’/g, "'"], // U+2019 right single quote / apostrophe
  [/“/g, '"'], // U+201C left double quote
  [/”/g, '"'], // U+201D right double quote
  [/…/g, '...'], // U+2026 horizontal ellipsis
  [/•/g, '-'], // U+2022 bullet
  // Arrows / inequality / math
  [/→/g, '->'], // U+2192
  [/←/g, '<-'], // U+2190
  [/≤/g, '<='], // U+2264
  [/≥/g, '>='], // U+2265
  [/≠/g, '!='], // U+2260
  [/×/g, 'x'], // U+00D7 (technically latin1 but not on Helvetica WinAnsi)
  [/±/g, '+/-'], // U+00B1
  [/°/g, ' deg'], // U+00B0
  [/∞/g, 'inf'], // U+221E
  // Greek letters used in PQC math notation
  [/α/g, 'alpha'],
  [/β/g, 'beta'],
  [/γ/g, 'gamma'],
  [/δ/g, 'delta'],
  [/Δ/g, 'Delta'],
  [/π/g, 'pi'],
  [/Σ/g, 'Sigma'],
  [/μ/g, 'mu'],
  [/λ/g, 'lambda'],
  // Status emoji / dingbats (U+FE0F variation selector is optional & stripped)
  [/⚠️?/g, '[!]'], // U+26A0
  [/ℹ️?/g, '[i]'], // U+2139
  [/✓/g, '[OK]'], // U+2713
  [/✗/g, '[X]'], // U+2717
  [/★/g, '[*]'], // U+2605
]

/**
 * Replace non-latin1 glyphs with ASCII equivalents. After the explicit table
 * is applied, any surviving character with codepoint > 0xFF is replaced with
 * `?` — a single visible fallback rather than a silent drop so QA can spot
 * missing glyphs in review.
 */
export function sanitizeForLatin1(input: string): string {
  if (!input) return input
  let out = input
  for (const [pattern, replacement] of LATIN1_SUBSTITUTIONS) {
    out = out.replace(pattern, replacement)
  }
  return Array.from(out)
    .map((ch) => (ch.charCodeAt(0) > 0xff ? '?' : ch))
    .join('')
}

// ── Mermaid strip-and-summarise (audit B1) ─────────────────────────────────
const MERMAID_HEADER_PATTERN =
  /^(timeline|flowchart|graph|sequenceDiagram|gantt|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|pie|mindmap|quadrantChart|requirementDiagram|gitGraph|c4Context)\b/

/**
 * Detect the mermaid diagram type by inspecting the first non-empty,
 * non-directive line. Returns `diagram` if nothing recognised so the
 * substitute paragraph still reads naturally.
 */
function detectMermaidType(source: string): string {
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('%%')) continue
    const match = line.match(MERMAID_HEADER_PATTERN)
    if (match) return match[1]
    return 'diagram'
  }
  return 'diagram'
}

/**
 * Extract the first quoted label or node identifier from a mermaid block —
 * gives the reader at least one anchor to recognise the diagram in the app.
 */
function extractMermaidFirstLabel(source: string): string | undefined {
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('%%')) continue
    // Skip the header line itself (timeline / flowchart TD / etc.).
    if (MERMAID_HEADER_PATTERN.test(line)) continue
    // Prefer a quoted label.
    const quoted = line.match(/"([^"]+)"/)
    if (quoted) return quoted[1]
    // Otherwise a bracketed node label: A[Label] / A(Label) / A{Label}
    const bracketed = line.match(/[[({]([^\])}]+)[\])}]/)
    if (bracketed) return bracketed[1]
    // Otherwise the first identifier on the line.
    const ident = line.match(/^([A-Za-z0-9_-]+)/)
    if (ident) return ident[1]
  }
  return undefined
}

// ── Learning-banner strip (audit M9) ───────────────────────────────────────
/**
 * The Command Center LearningFrameBanner is a JSX-only component that doesn't
 * normally enter the markdown pipeline. The strip is therefore a defensive
 * filter for any caller that has stringified the banner into their export
 * (matches `> Worked example ...` / `> This is a worked example ...` leading
 * blockquote variants).
 */
const BANNER_LINE = /^\s*>\s*(?:This is a )?worked example\b/i

function stripLearningBannerFromMarkdown(markdown: string): string {
  const lines = markdown.split(/\r?\n/)
  let i = 0
  while (i < lines.length && (lines[i] ?? '').trim() === '') i++
  let stripped = false
  while (i < lines.length && BANNER_LINE.test(lines[i] ?? '')) {
    lines.splice(i, 1)
    stripped = true
  }
  if (stripped && i < lines.length && (lines[i] ?? '').trim() === '') {
    lines.splice(i, 1)
  }
  return lines.join('\n')
}

// ── Public option surface ──────────────────────────────────────────────────
export interface PdfExportOptions {
  /**
   * Render in A4 landscape (842 x 595 pt) so wide tables — RACI matrices,
   * supply-chain matrices, framework grids, contract clauses, CBOM rows — fit
   * without column truncation. Default: `false` (portrait). Audit M4.
   */
  wideTable?: boolean
  /**
   * Drop the LearningFrameBanner content from the markdown before tokenisation
   * and append a short standards-citation note in muted text below the title.
   * Used for executive-emphasis exports where the in-app pedagogy framing is
   * noise. Default: `false`. Audit M9.
   */
  stripLearningBanner?: boolean
}

interface Run {
  text: string
  bold?: boolean
  italic?: boolean
  code?: boolean
  href?: string
}

/**
 * Tokenise a single line of markdown text into styled runs. Recursive on
 * **bold** so that mixed bold+italic / bold+code combinations render
 * correctly. Unpaired markers fall through as literals.
 *
 * Sanitisation: the raw text is run through `sanitizeForLatin1` once at the
 * top so every downstream Run already speaks WinAnsi. All markdown markers
 * (`*`, `_`, `[`, `]`, backtick) are ASCII, so sanitising before tokenisation
 * is safe.
 */
function parseInline(rawText: string): Run[] {
  const text = sanitizeForLatin1(rawText)
  const runs: Run[] = []
  let i = 0

  const pushPlain = (start: number, end: number) => {
    if (end > start) runs.push({ text: text.slice(start, end) })
  }

  let plainStart = 0
  while (i < text.length) {
    // `code`
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1)
      if (end > i + 1) {
        pushPlain(plainStart, i)
        runs.push({ text: text.slice(i + 1, end), code: true })
        i = end + 1
        plainStart = i
        continue
      }
    }
    // **bold** (recurse so inner *italic* / `code` still styles)
    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2)
      if (end > i + 2) {
        pushPlain(plainStart, i)
        for (const inner of parseInline(text.slice(i + 2, end))) {
          runs.push({ ...inner, bold: true })
        }
        i = end + 2
        plainStart = i
        continue
      }
    }
    // *italic* (single star, not **). Reject if surrounded by alnum (e.g.
    // `2*3`) or starts with whitespace right after the marker.
    if (text[i] === '*' && text[i + 1] !== '*') {
      const prev = i > 0 ? text[i - 1] : ' '
      if (!/[A-Za-z0-9]/.test(prev) && text[i + 1] && text[i + 1] !== ' ') {
        const end = text.indexOf('*', i + 1)
        if (end > i + 1 && text[end - 1] !== ' ' && text[end + 1] !== '*') {
          pushPlain(plainStart, i)
          runs.push({ text: text.slice(i + 1, end), italic: true })
          i = end + 1
          plainStart = i
          continue
        }
      }
    }
    // [text](url)
    if (text[i] === '[') {
      const labelEnd = text.indexOf(']', i + 1)
      if (labelEnd > 0 && text[labelEnd + 1] === '(') {
        const urlEnd = text.indexOf(')', labelEnd + 2)
        if (urlEnd > 0) {
          pushPlain(plainStart, i)
          runs.push({
            text: text.slice(i + 1, labelEnd),
            href: text.slice(labelEnd + 2, urlEnd),
          })
          i = urlEnd + 1
          plainStart = i
          continue
        }
      }
    }
    i++
  }
  pushPlain(plainStart, text.length)
  return runs.filter((r) => r.text.length > 0)
}

/** Apply a run's style to the doc before measuring or drawing. */
function applyRunFont(doc: jsPDF, run: Run, baseSize: number) {
  if (run.code) {
    doc.setFont(FONT_MONO, run.bold ? 'bold' : 'normal')
    doc.setFontSize(SIZE_CODE)
    return
  }
  const style =
    run.bold && run.italic ? 'bolditalic' : run.bold ? 'bold' : run.italic ? 'italic' : 'normal'
  doc.setFont(FONT_BODY, style)
  doc.setFontSize(baseSize)
}

/**
 * Render a sequence of styled runs as wrapped text starting at the given
 * cursor. Returns the new cursor.
 */
function renderRuns(
  doc: jsPDF,
  runs: Run[],
  baseSize: number,
  cursor: { x: number; y: number },
  lineLeft: number,
  lineRight: number,
  ensure: (need: number) => void
): { x: number; y: number } {
  const lineHeight = baseSize * LINE_HEIGHT_FACTOR
  let { x, y } = cursor

  const newline = () => {
    y += lineHeight
    ensure(lineHeight)
    x = lineLeft
  }

  for (const run of runs) {
    applyRunFont(doc, run, baseSize)
    // Split on whitespace while keeping the spaces so we can word-wrap without
    // collapsing them.
    const parts = run.text.split(/(\s+)/).filter((p) => p.length > 0)
    for (const part of parts) {
      const w = doc.getTextWidth(part)
      const isSpace = /^\s+$/.test(part)

      // If the next word would overflow the line, wrap. Spaces at line start
      // are dropped to avoid leading whitespace.
      if (x + w > lineRight && !isSpace) {
        // If the single token itself is wider than the line (very long URL),
        // break it up so it still gets emitted.
        if (w > lineRight - lineLeft) {
          const chars = Array.from(part)
          let buf = ''
          for (const ch of chars) {
            if (x + doc.getTextWidth(buf + ch) > lineRight) {
              if (buf) doc.text(buf, x, y)
              newline()
              buf = ch
            } else {
              buf += ch
            }
          }
          if (buf) {
            doc.text(buf, x, y)
            x += doc.getTextWidth(buf)
          }
          continue
        }
        newline()
        if (isSpace) continue
      }
      if (isSpace && x === lineLeft) continue

      ensure(lineHeight)
      doc.text(part, x, y)
      if (run.href && !isSpace) {
        // Underline + link annotation
        doc.setDrawColor(80, 90, 200)
        doc.line(x, y + 1.5, x + w, y + 1.5)
        doc.link(x, y - lineHeight + 4, w, lineHeight, { url: run.href })
      }
      x += w
    }
  }
  return { x, y }
}

/** Tokenise the markdown source into block-level instructions. */
type Block =
  | { kind: 'h1' | 'h2' | 'h3' | 'h4'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'numbered'; text: string; index: number }
  | { kind: 'check'; text: string; checked: boolean }
  | { kind: 'kv'; label: string; value: string }
  | { kind: 'codeblock'; lines: string[]; lang?: string }
  | { kind: 'mermaid-stub'; diagramType: string; firstLabel?: string }
  | { kind: 'table'; rows: string[] }
  | { kind: 'hr' }
  | { kind: 'blockquote'; text: string }
  | { kind: 'blank' }

function tokenize(markdown: string): Block[] {
  const blocks: Block[] = []
  const lines = markdown.split(/\r?\n/)
  let i = 0
  let orderedIndex = 0
  while (i < lines.length) {
    // eslint-disable-next-line security/detect-object-injection
    const raw = lines[i]
    const line = raw.replace(/\s+$/, '')

    // Fenced code block
    const fence = line.match(/^```\s*(\S*)\s*$/)
    if (fence) {
      const lang = fence[1] || undefined
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i] ?? '')) {
        buf.push(lines[i] ?? '')
        i++
      }
      i++ // skip closing fence
      // Mermaid: strip the source and emit a substitute paragraph block
      // (handled in the render switch). Audit B1.
      if (lang === 'mermaid') {
        const source = buf.join('\n')
        blocks.push({
          kind: 'mermaid-stub',
          diagramType: detectMermaidType(source),
          firstLabel: extractMermaidFirstLabel(source),
        })
        orderedIndex = 0
        continue
      }
      blocks.push({ kind: 'codeblock', lines: buf, lang })
      orderedIndex = 0
      continue
    }

    // Table — consecutive `|`-delimited lines
    if (line.startsWith('|') && line.endsWith('|')) {
      const tbl: string[] = []
      while (
        i < lines.length &&
        (lines[i] ?? '').trimEnd().startsWith('|') &&
        (lines[i] ?? '').trimEnd().endsWith('|')
      ) {
        tbl.push(lines[i] ?? '')
        i++
      }
      blocks.push({ kind: 'table', rows: tbl })
      orderedIndex = 0
      continue
    }

    if (line === '') {
      blocks.push({ kind: 'blank' })
      orderedIndex = 0
      i++
      continue
    }
    if (line === '---' || line === '***') {
      blocks.push({ kind: 'hr' })
      orderedIndex = 0
      i++
      continue
    }
    if (line.startsWith('#### ')) {
      blocks.push({ kind: 'h4', text: line.slice(5) })
      orderedIndex = 0
      i++
      continue
    }
    if (line.startsWith('### ')) {
      blocks.push({ kind: 'h3', text: line.slice(4) })
      orderedIndex = 0
      i++
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push({ kind: 'h2', text: line.slice(3) })
      orderedIndex = 0
      i++
      continue
    }
    if (line.startsWith('# ')) {
      blocks.push({ kind: 'h1', text: line.slice(2) })
      orderedIndex = 0
      i++
      continue
    }
    if (line.startsWith('> ')) {
      blocks.push({ kind: 'blockquote', text: line.slice(2) })
      i++
      continue
    }
    const check = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/)
    if (check) {
      blocks.push({
        kind: 'check',
        checked: check[1].toLowerCase() === 'x',
        text: check[2] ?? '',
      })
      i++
      continue
    }
    if (/^[-*]\s+/.test(line)) {
      blocks.push({ kind: 'bullet', text: line.replace(/^[-*]\s+/, '') })
      orderedIndex = 0
      i++
      continue
    }
    const ordered = line.match(/^(\d+)\.\s+(.*)$/)
    if (ordered) {
      orderedIndex += 1
      blocks.push({
        kind: 'numbered',
        index: orderedIndex,
        text: ordered[2] ?? '',
      })
      i++
      continue
    }
    const kv = line.match(/^\*\*([^*]+):\*\*\s*(.*)$/)
    if (kv) {
      blocks.push({ kind: 'kv', label: kv[1] ?? '', value: kv[2] ?? '' })
      orderedIndex = 0
      i++
      continue
    }
    blocks.push({ kind: 'p', text: line })
    orderedIndex = 0
    i++
  }
  return blocks
}

function parseTableRows(rawRows: string[]): { head: string[]; body: string[][] } {
  const parsed = rawRows.map((l) =>
    l
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())
  )
  const isSep = (r: string[]) => r.every((c) => /^:?-+:?$/.test(c))
  const sepIdx = parsed.findIndex(isSep)
  if (sepIdx === 1) {
    return { head: parsed[0] ?? [], body: parsed.slice(2) }
  }
  return { head: [], body: parsed.filter((r) => !isSep(r)) }
}

/** Strip inline markdown markers for table cells (autoTable doesn't render
 *  styled runs; bolding cells would require cell-level hooks per col/row,
 *  which is over-engineering for the small visual win). Also passes through
 *  `sanitizeForLatin1` so smart quotes / em-dashes / emoji in table cells
 *  don't survive into autoTable's WinAnsi render path. */
function stripInlineForCell(s: string): string {
  return sanitizeForLatin1(
    s
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/(?<![A-Za-z0-9])\*([^*]+)\*(?!\*)/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
  )
}

/** Stamp footer (title left, page N of M right) on every page. Called once,
 *  after all content is laid out and the page count is final. */
function drawFooters(doc: jsPDF, title: string) {
  const total = doc.getNumberOfPages()
  const safeTitle = sanitizeForLatin1(title)
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setFont(FONT_BODY, 'normal')
    doc.setFontSize(SIZE_FOOTER)
    doc.setTextColor(110)
    const ph = doc.internal.pageSize.getHeight()
    const pw = doc.internal.pageSize.getWidth()
    if (safeTitle) doc.text(safeTitle, MARGIN_X, ph - FOOTER_Y_OFFSET)
    doc.text(`Page ${p} of ${total}`, pw - MARGIN_X, ph - FOOTER_Y_OFFSET, { align: 'right' })
    doc.setTextColor(0)
  }
}

/**
 * Build a paginated A4 PDF from the artifact's markdown source. Returns the
 * jsPDF document without saving — exposed for tests so they can inspect the
 * rendered output without going through a browser download.
 *
 * @param markdown The artifact's source markdown.
 * @param title    Document title used for the PDF's `/Info` dictionary and
 *                 the per-page footer.
 * @param options  See {@link PdfExportOptions}. Defaults to portrait, banner
 *                 retained.
 */
export function buildArtifactPdf(
  markdown: string,
  title?: string,
  options: PdfExportOptions = {}
): jsPDF {
  const { wideTable = false, stripLearningBanner = false } = options

  const sourceMarkdown = stripLearningBanner ? stripLearningBannerFromMarkdown(markdown) : markdown

  const doc = new jsPDF({
    unit: 'pt',
    format: PAGE_FORMAT,
    orientation: wideTable ? 'landscape' : 'portrait',
    compress: true,
  })
  doc.setProperties({
    title: sanitizeForLatin1(title ?? ''),
    subject: 'PQC Command Center artifact',
    creator: 'PQC Today Hub',
  })

  // pageSize.getWidth/getHeight already return the orientation-correct
  // dimensions, so the rest of the layout adapts to landscape without further
  // changes. Footer position recomputes per page in drawFooters().
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentLeft = MARGIN_X
  const contentRight = pageWidth - MARGIN_X
  const contentBottom = pageHeight - MARGIN_BOTTOM

  let y = MARGIN_TOP

  const ensure = (needed: number) => {
    if (y + needed > contentBottom) {
      doc.addPage()
      y = MARGIN_TOP
    }
  }

  const writeBlockText = (
    runs: Run[],
    size: number,
    leadingSpacing = 0,
    trailingSpacing = size * 0.4,
    indent = 0
  ) => {
    if (leadingSpacing) y += leadingSpacing
    ensure(size * LINE_HEIGHT_FACTOR)
    const cursor = renderRuns(
      doc,
      runs,
      size,
      { x: contentLeft + indent, y },
      contentLeft + indent,
      contentRight,
      ensure
    )
    y = cursor.y + size * LINE_HEIGHT_FACTOR * 0.2 + trailingSpacing
  }

  // When the learning banner was stripped, prepend a muted standards-citation
  // line in its place so the document still establishes provenance. Audit
  // B1+M9. Rendered as page-1 furniture, not part of the block stream, so it
  // doesn't disturb later headings or table-of-contents heuristics.
  if (stripLearningBanner) {
    doc.setFont(FONT_BODY, 'italic')
    doc.setFontSize(SIZE_BODY * 0.9)
    doc.setTextColor(120, 120, 120)
    doc.text(
      sanitizeForLatin1(
        'Generated by PQC Today Hub. Standards citations: NIST CSWP 39, FIPS 203/204/205.'
      ),
      contentLeft,
      y
    )
    doc.setTextColor(0, 0, 0)
    y += SIZE_BODY * LINE_HEIGHT_FACTOR
  }

  const blocks = tokenize(sourceMarkdown)

  for (let bi = 0; bi < blocks.length; bi++) {
    // eslint-disable-next-line security/detect-object-injection
    const block = blocks[bi]
    if (!block) continue

    switch (block.kind) {
      case 'h1':
        writeBlockText(parseInline(block.text), SIZE_H1, SIZE_H1 * 0.4, SIZE_H1 * 0.5)
        break
      case 'h2': {
        y += SIZE_H2 * 0.6
        ensure(SIZE_H2 * LINE_HEIGHT_FACTOR + 6)
        // Subtle underline on h2 to match MarkdownView's `border-b`
        writeBlockText(parseInline(block.text), SIZE_H2, 0, 4)
        doc.setDrawColor(220, 220, 230)
        doc.line(contentLeft, y - 2, contentRight, y - 2)
        y += SIZE_H2 * 0.25
        break
      }
      case 'h3':
        writeBlockText(parseInline(block.text), SIZE_H3, SIZE_H3 * 0.4, SIZE_H3 * 0.3)
        break
      case 'h4':
        writeBlockText(parseInline(block.text), SIZE_H4, SIZE_H4 * 0.3, SIZE_H4 * 0.2)
        break
      case 'p':
        writeBlockText(parseInline(block.text), SIZE_BODY)
        break
      case 'bullet':
        writeBlockText(
          [{ text: '- ' }, ...parseInline(block.text)],
          SIZE_BODY,
          0,
          SIZE_BODY * 0.2,
          14
        )
        break
      case 'numbered':
        writeBlockText(
          [{ text: `${block.index}. ` }, ...parseInline(block.text)],
          SIZE_BODY,
          0,
          SIZE_BODY * 0.2,
          14
        )
        break
      case 'check':
        // Checkbox glyphs ☑/☐ are U+2611 / U+2610 — not in WinAnsi. Substitute
        // with bracket-style markers so the state is still legible in PDF.
        writeBlockText(
          [{ text: block.checked ? '[x] ' : '[ ] ' }, ...parseInline(block.text)],
          SIZE_BODY,
          0,
          SIZE_BODY * 0.2,
          14
        )
        break
      case 'kv':
        writeBlockText(
          [
            { text: `${sanitizeForLatin1(block.label)}: `, bold: true },
            ...parseInline(block.value),
          ],
          SIZE_BODY
        )
        break
      case 'blockquote':
        ensure(SIZE_BODY * LINE_HEIGHT_FACTOR + 4)
        doc.setDrawColor(150, 160, 200)
        doc.setLineWidth(2)
        doc.line(contentLeft, y - SIZE_BODY * 0.8, contentLeft, y + SIZE_BODY * 0.4)
        doc.setLineWidth(1)
        writeBlockText(
          parseInline(block.text).map((r) => ({ ...r, italic: true })),
          SIZE_BODY,
          0,
          SIZE_BODY * 0.3,
          12
        )
        break
      case 'mermaid-stub': {
        // Substitute paragraph: tells the reader the diagram exists in the
        // web app and what to look for. Audit B1.
        writeBlockText(
          parseInline(
            '[Diagram available in the PQC Today Hub web app - Mermaid not rendered in PDF.]'
          ),
          SIZE_BODY,
          SIZE_BODY * 0.3,
          SIZE_BODY * 0.1
        )
        const summary = block.firstLabel
          ? `Diagram type: ${block.diagramType} - first node: ${block.firstLabel}`
          : `Diagram type: ${block.diagramType}`
        writeBlockText(parseInline(summary), SIZE_BODY)
        break
      }
      case 'codeblock': {
        y += 4
        const lineH = SIZE_CODE * LINE_HEIGHT_FACTOR
        const padding = 6
        // Pre-sanitise lines for the WinAnsi render path. Markdown markers
        // don't apply inside fenced code, so this is just the latin1 guard.
        const safeLines = block.lines.map(sanitizeForLatin1)
        const blockHeight = safeLines.length * lineH + padding * 2
        // If the whole block doesn't fit, push it to the next page rather than
        // splitting (code is hard to read across page breaks).
        if (y + blockHeight > contentBottom && blockHeight < contentBottom - MARGIN_TOP) {
          doc.addPage()
          y = MARGIN_TOP
        }
        const startY = y
        doc.setFillColor(245, 246, 250)
        doc.setDrawColor(225, 228, 235)
        doc.rect(
          contentLeft,
          startY,
          contentRight - contentLeft,
          Math.min(blockHeight, contentBottom - startY),
          'FD'
        )
        doc.setFont(FONT_MONO, 'normal')
        doc.setFontSize(SIZE_CODE)
        doc.setTextColor(40)
        let cy = startY + padding + SIZE_CODE
        for (const cl of safeLines) {
          ensure(lineH)
          if (cy > contentBottom - padding) {
            // Continue the code block on the next page with a fresh background
            doc.addPage()
            y = MARGIN_TOP
            cy = MARGIN_TOP + padding + SIZE_CODE
            doc.setFillColor(245, 246, 250)
            doc.setDrawColor(225, 228, 235)
            doc.rect(
              contentLeft,
              MARGIN_TOP,
              contentRight - contentLeft,
              contentBottom - MARGIN_TOP,
              'FD'
            )
            doc.setFont(FONT_MONO, 'normal')
            doc.setFontSize(SIZE_CODE)
            doc.setTextColor(40)
          }
          // Long lines: hard-wrap on character count via splitTextToSize
          const wrapped = doc.splitTextToSize(
            cl,
            contentRight - contentLeft - padding * 2
          ) as string[]
          for (const w of wrapped) {
            doc.text(w, contentLeft + padding, cy)
            cy += lineH
          }
        }
        doc.setTextColor(0)
        y = cy + padding
        break
      }
      case 'hr':
        y += SIZE_BODY * 0.3
        ensure(8)
        doc.setDrawColor(210, 215, 225)
        doc.line(contentLeft, y, contentRight, y)
        y += SIZE_BODY * 0.7
        break
      case 'table': {
        const { head, body } = parseTableRows(block.rows)
        // stripInlineForCell already runs sanitizeForLatin1 on every cell, so
        // autoTable receives only WinAnsi-safe strings.
        const cleanedHead = head.map(stripInlineForCell)
        const cleanedBody = body.map((r) => r.map(stripInlineForCell))
        autoTable(doc, {
          startY: y + 4,
          head: cleanedHead.length ? [cleanedHead] : undefined,
          body: cleanedBody,
          margin: { left: contentLeft, right: MARGIN_X, top: MARGIN_TOP, bottom: MARGIN_BOTTOM },
          styles: {
            font: FONT_BODY,
            fontSize: SIZE_TABLE,
            cellPadding: 4,
            overflow: 'linebreak',
            valign: 'top',
            lineColor: [220, 222, 232],
            lineWidth: 0.5,
          },
          headStyles: {
            fillColor: [232, 234, 246],
            textColor: [25, 30, 60],
            fontStyle: 'bold',
            halign: 'left',
          },
          alternateRowStyles: {
            fillColor: [248, 248, 252],
          },
          theme: 'grid',
          showHead: 'everyPage',
        })
        // Pull the cursor back from autoTable's internal state.
        const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
          ?.finalY
        if (typeof finalY === 'number') {
          y = finalY + SIZE_BODY * 0.6
        } else {
          y += SIZE_BODY * 0.6
        }
        break
      }
      case 'blank':
        y += SIZE_BODY * 0.5
        break
    }
  }

  drawFooters(doc, title ?? '')
  return doc
}

/**
 * Convert an artifact's markdown export into a paginated A4 PDF and trigger
 * a browser download with the sanitised filename.
 *
 * @param options See {@link PdfExportOptions}. Backwards-compatible: all
 *                existing callers (no fourth arg) get the same portrait
 *                layout and banner-retained behaviour as before.
 */
export async function markdownToPdf(
  markdown: string,
  filename: string,
  title?: string,
  options: PdfExportOptions = {}
): Promise<void> {
  const doc = buildArtifactPdf(markdown, title ?? filename, options)
  doc.save(`${sanitiseFilename(filename)}.pdf`)
}

/** Sanitise candidate filename: strip path separators, OS-rejected punctuation,
 *  and C0 control characters. Mirrors the contract from the previous
 *  exportPdf util so behaviour is identical for callers. */
function sanitiseFilename(name: string): string {
  const cleaned = Array.from(name.normalize('NFC'))
    .filter((ch) => {
      if ('\\/:*?"<>|'.includes(ch)) return false
      const code = ch.charCodeAt(0)
      if (code < 0x20 || code === 0x7f) return false
      return true
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.length > 0 ? cleaned : 'artifact'
}
