// SPDX-License-Identifier: GPL-3.0-only
/**
 * Unit tests for the unified Command Center artifact PDF pipeline.
 *
 * These tests exercise `buildArtifactPdf` (the non-saving variant) so we can
 * inspect the rendered jsPDF document without triggering a browser download.
 * The fixture markdown covers every block-level token the renderer supports —
 * a regression here means a real artifact will print wrong.
 */
import { describe, it, expect } from 'vitest'
import type { jsPDF } from 'jspdf'
import {
  buildArtifactPdf,
  markdownToPdf,
  sanitizeForLatin1,
  addDiagramImagePage,
  drawFooters,
  sanitiseFilename,
} from './pdfExport'

// Smallest possible valid PNG (1x1 transparent pixel) — enough to exercise
// jsPDF's addImage without needing a real rasterised diagram.
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

/**
 * Extract every drawn text fragment from the PDF before serialization (so the
 * inspection works even when content streams are compressed). jsPDF stores
 * each page's PDF operator stream as an array of latin1 strings under
 * `internal.pages` — joining those and grepping for `(...) Tj` gives us the
 * actual visible text in render order.
 */
function drawnText(doc: jsPDF): string {
  const pages = (doc as unknown as { internal: { pages: string[][] } }).internal.pages
  const flat: string[] = []
  for (const page of pages) {
    if (!page) continue
    for (const op of page) flat.push(op)
  }
  const blob = flat.join('\n')
  // The renderer issues one Tj per word/space token, but the per-token spaces
  // ARE present in the captured text — joining with '' (not \n) reconstructs
  // the visible text spans, so multi-word headings like "Top risks" remain
  // searchable as one substring.
  return Array.from(blob.matchAll(/\(((?:\\.|[^()\\])*)\)\s*Tj/g))
    .map((m) => m[1])
    .join('')
}

const FIXTURE = `# Risk Register

Generated: 2026-05-08

## Summary

This artifact tracks the **top-priority** PQC migration risks across the
*Finance & Banking* lens. See the [NIST CSWP.39 §6.5](https://www.nist.gov/) for
the source maturity model. Inline \`code\` should also render correctly.

### Top risks

- HNDL exposure on long-lived data
- Vendor cryptographic agility unknown
- ML-DSA performance not yet benchmarked

### Migration checklist

- [x] Inventory completed
- [x] Vendors notified
- [ ] Pilot deployment
- [ ] Production rollout

**Owner:** CISO
**Reviewer:** CTO

| Risk ID | Likelihood | Impact | Owner | Mitigation |
|---------|------------|--------|-------|------------|
| R-01 | High | Critical | CISO | Migrate root CA to ML-DSA-87 |
| R-02 | Medium | High | CTO | Inventory libraries; require CBOM from vendors |
| R-03 | Low | Medium | Security Architect | Run hybrid TLS pilot with X25519+ML-KEM-768 |

## Notes

> Quantum risk is not theoretical — harvest-now-decrypt-later attacks against
> 30-year retention windows are happening today.

\`\`\`bash
openssl genpkey -algorithm ML-DSA-87 -out root-ca.key
\`\`\`

---

End of report.
`

describe('buildArtifactPdf', () => {
  it('produces a multi-page A4 PDF with the supplied title', () => {
    const doc = buildArtifactPdf(FIXTURE, 'PQC Risk Register')
    const pageSize = doc.internal.pageSize
    // A4 in points: 595.28 × 841.89
    expect(pageSize.getWidth()).toBeCloseTo(595.28, 1)
    expect(pageSize.getHeight()).toBeCloseTo(841.89, 1)
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1)
  })

  it('sets PDF metadata so the file is recognisable in archives', () => {
    const doc = buildArtifactPdf(FIXTURE, 'PQC Risk Register')
    // The /Info dictionary is not compressed, so a head-of-file scan finds it.
    const out = doc.output('arraybuffer') as ArrayBuffer
    const head = new TextDecoder('latin1').decode(
      new Uint8Array(out).slice(0, Math.min(out.byteLength, 8192))
    )
    expect(head).toContain('PQC Today Hub')
  })

  it('emits a footer with "Page N of M" on every page', () => {
    const doc = buildArtifactPdf(FIXTURE, 'PQC Risk Register')
    const total = doc.getNumberOfPages()
    const drawn = drawnText(doc)
    expect(drawn).toContain(`Page 1 of ${total}`)
    if (total > 1) {
      expect(drawn).toContain(`Page ${total} of ${total}`)
    }
  })

  it('does not leak inline markdown markers into the output text', () => {
    const doc = buildArtifactPdf(FIXTURE, 'PQC Risk Register')
    // We extract every visible string in the PDF by scanning the content
    // streams. jsPDF emits text in `(string) Tj` operators with backslash
    // escaping. We only need the raw text — a coarse regex is sufficient for
    // the regression we care about (literal `**`, `*`, `[`, `](` leaking
    // through the renderer).
    const drawn = drawnText(doc)

    // Inline markers must be consumed.
    expect(drawn).not.toMatch(/\*\*/)
    expect(drawn).not.toMatch(/\]\(http/) // [text](url) should be split into label + link
    // Bold-key/value markers should be consumed (no trailing `:**` left over).
    expect(drawn).not.toMatch(/:\*\*/)
  })

  it('renders body text from the table head row (autoTable reached)', () => {
    const doc = buildArtifactPdf(FIXTURE, 'PQC Risk Register')
    const drawn = drawnText(doc)
    expect(drawn).toContain('Risk ID')
    expect(drawn).toContain('Likelihood')
    expect(drawn).toContain('Mitigation')
    expect(drawn).toContain('R-01')
  })

  it('renders headings, lists, and the artifact title in body text', () => {
    const doc = buildArtifactPdf(FIXTURE, 'PQC Risk Register')
    const drawn = drawnText(doc)
    expect(drawn).toContain('Risk Register')
    expect(drawn).toContain('Summary')
    expect(drawn).toContain('Top risks')
    expect(drawn).toContain('Inventory completed')
    expect(drawn).toContain('Production rollout')
    // Bold-key prefix retained as plain text
    expect(drawn).toContain('Owner')
    expect(drawn).toContain('CISO')
  })

  it('handles an empty document without throwing', () => {
    const doc = buildArtifactPdf('', 'Empty')
    expect(doc.getNumberOfPages()).toBe(1)
  })
})

// ── Audit B2: ASCII / latin1 substitution ──────────────────────────────────
describe('sanitizeForLatin1 (audit B2)', () => {
  // Each rule is one assertion. Failures here are exactly localised.
  const RULES: ReadonlyArray<readonly [string, string, string]> = [
    ['em-dash', '—', '-'],
    ['en-dash', '–', '-'],
    ['left single quote', '‘', "'"],
    ['right single quote', '’', "'"],
    ['left double quote', '“', '"'],
    ['right double quote', '”', '"'],
    ['ellipsis', '…', '...'],
    ['bullet', '•', '-'],
    ['right arrow', '→', '->'],
    ['left arrow', '←', '<-'],
    ['less-or-equal', '≤', '<='],
    ['greater-or-equal', '≥', '>='],
    ['not-equal', '≠', '!='],
    ['multiplication sign', '×', 'x'],
    ['plus-minus', '±', '+/-'],
    ['degree', '°', ' deg'],
    ['infinity', '∞', 'inf'],
    ['alpha', 'α', 'alpha'],
    ['beta', 'β', 'beta'],
    ['gamma', 'γ', 'gamma'],
    ['delta', 'δ', 'delta'],
    ['big delta', 'Δ', 'Delta'],
    ['pi', 'π', 'pi'],
    ['big sigma', 'Σ', 'Sigma'],
    ['mu', 'μ', 'mu'],
    ['lambda', 'λ', 'lambda'],
    ['warning emoji', '⚠️', '[!]'],
    ['warning emoji no vs16', '⚠', '[!]'],
    ['info emoji', 'ℹ️', '[i]'],
    ['check', '✓', '[OK]'],
    ['ballot x', '✗', '[X]'],
    ['star', '★', '[*]'],
  ]

  for (const [name, glyph, expected] of RULES) {
    it(`substitutes ${name} (U+${glyph
      .codePointAt(0)!
      .toString(16)
      .toUpperCase()
      .padStart(4, '0')})`, () => {
      expect(sanitizeForLatin1(`x${glyph}y`)).toBe(`x${expected}y`)
    })
  }

  it('replaces any surviving codepoint > 0xFF with "?" so loss is visible', () => {
    // U+9999 is intentionally not in the substitution table — it should fall
    // through to the guard pass and become a single "?".
    expect(sanitizeForLatin1('a香b')).toBe('a?b')
    // CJK characters route through the same guard.
    expect(sanitizeForLatin1('hello中文')).toBe('hello??')
  })

  it('returns the input unchanged when only ASCII is present', () => {
    expect(sanitizeForLatin1('Plain ASCII text 123 - ok')).toBe('Plain ASCII text 123 - ok')
  })

  it('handles empty input without error', () => {
    expect(sanitizeForLatin1('')).toBe('')
  })

  it('does not corrupt latin1-but-renderable characters (e.g. é)', () => {
    // U+00E9 is in WinAnsi and should NOT be touched.
    expect(sanitizeForLatin1('café')).toBe('café')
  })
})

describe('sanitizeForLatin1 — super/subscript math notation (audit C3)', () => {
  it('maps a multi-digit superscript exponent to ^<digits> as one token', () => {
    // 2⁸⁵ must become 2^85, never 2^8^5 or 2?? (the pre-fix behaviour).
    expect(sanitizeForLatin1('~2⁸⁵')).toBe('~2^85')
    expect(sanitizeForLatin1('~2⁶⁴')).toBe('~2^64')
  })

  it('maps latin1 superscripts (¹ ² ³) consistently, grouped with unmapped ones', () => {
    // 2¹²⁸ mixes ¹²(latin1) + ⁸(>0xFF) — all collapse into one ^128.
    expect(sanitizeForLatin1('~2¹²⁸')).toBe('~2^128')
    expect(sanitizeForLatin1('m²')).toBe('m^2')
  })

  it('maps subscript digit runs to _<digits>', () => {
    expect(sanitizeForLatin1('CO₂')).toBe('CO_2')
    expect(sanitizeForLatin1('x₁₀')).toBe('x_10')
  })

  it('maps the almost-equal sign to ~ instead of dropping it', () => {
    // Skills & Team Plan emits "≈ 4.8" — must not become "? 4.8".
    expect(sanitizeForLatin1('≈ 4.8')).toBe('~ 4.8')
  })

  it('leaves a bare caret/underscore and plain digits untouched', () => {
    expect(sanitizeForLatin1('2^85 and x_10')).toBe('2^85 and x_10')
  })
})

// ── Audit B2 integration: real PDF render swallows typographic glyphs ──────
describe('buildArtifactPdf — latin1 sanitisation integration (audit B2)', () => {
  it('replaces em-dashes and smart quotes in body text', () => {
    const md = '# Title\n\nHe said “wait — we need ML-DSA-87,” right?'
    const doc = buildArtifactPdf(md, 'Title')
    const drawn = drawnText(doc)
    // Smart-quote round trip becomes straight ASCII quotes.
    expect(drawn).toContain('"wait')
    expect(drawn).toContain('right?')
    // No smart-quote / em-dash codepoints survived.
    expect(drawn).not.toMatch(/[—‘’“”]/)
  })

  it('replaces Greek letters and inequalities in table cells', () => {
    const md = `# Title

| Symbol | Meaning |
|--------|---------|
| λ | wavelength |
| ≤ | bound |
`
    const doc = buildArtifactPdf(md, 'Title')
    const drawn = drawnText(doc)
    expect(drawn).toContain('lambda')
    expect(drawn).toContain('<=')
    expect(drawn).not.toMatch(/[λ≤]/)
  })
})

// ── Audit B1: Mermaid strip-and-summarise ─────────────────────────────────
describe('buildArtifactPdf — mermaid blocks (audit B1)', () => {
  const FIXTURE_MERMAID = `# Diagram

\`\`\`mermaid
flowchart TD
    A["Inventory"] --> B["Classify"]
    B --> C["Migrate"]
\`\`\`

End.
`

  it('strips the mermaid source and emits a substitute paragraph', () => {
    const doc = buildArtifactPdf(FIXTURE_MERMAID, 'Diagram')
    const drawn = drawnText(doc)
    expect(drawn).toContain('Diagram available in the PQC Today Hub web app')
    // The raw mermaid source should NOT appear in the rendered text.
    expect(drawn).not.toContain('flowchart TD')
    // A summary line should accompany the substitute.
    expect(drawn).toContain('Diagram type: flowchart')
  })

  it('still emits a summary line when the diagram has no quoted label', () => {
    const md = '# X\n\n```mermaid\ntimeline\n  2026 : Inventory\n```\n'
    const doc = buildArtifactPdf(md, 'X')
    const drawn = drawnText(doc)
    expect(drawn).toContain('Diagram type: timeline')
  })

  it('falls back to "diagram" when the mermaid header is unrecognised', () => {
    const md = '# X\n\n```mermaid\n%%{init: {...}}%%\nweird-thing\n```\n'
    const doc = buildArtifactPdf(md, 'X')
    const drawn = drawnText(doc)
    expect(drawn).toContain('Diagram type: diagram')
  })

  it('leaves non-mermaid fenced code blocks alone', () => {
    const md = '# X\n\n```bash\nopenssl genpkey -algorithm ML-DSA-87\n```\n'
    const doc = buildArtifactPdf(md, 'X')
    const drawn = drawnText(doc)
    expect(drawn).toContain('openssl genpkey')
  })
})

// ── Audit M4: wide-table landscape opt-in ──────────────────────────────────
describe('buildArtifactPdf — wideTable option (audit M4)', () => {
  it('defaults to A4 portrait when no option is passed', () => {
    const doc = buildArtifactPdf('# x', 'x')
    const pageSize = doc.internal.pageSize
    expect(pageSize.getWidth()).toBeCloseTo(595.28, 1)
    expect(pageSize.getHeight()).toBeCloseTo(841.89, 1)
  })

  it('renders in A4 landscape when wideTable: true', () => {
    const doc = buildArtifactPdf('# x', 'x', { wideTable: true })
    const pageSize = doc.internal.pageSize
    // Landscape A4: 841.89 wide x 595.28 tall.
    expect(pageSize.getWidth()).toBeCloseTo(841.89, 1)
    expect(pageSize.getHeight()).toBeCloseTo(595.28, 1)
  })

  it('still renders body content in landscape mode', () => {
    const md = `# Wide

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| 1 | 2 | 3 | 4 | 5 | 6 | 7 |
`
    const doc = buildArtifactPdf(md, 'Wide', { wideTable: true })
    const drawn = drawnText(doc)
    expect(drawn).toContain('Wide')
    expect(drawn).toContain('A')
    expect(drawn).toContain('G')
  })
})

// ── Audit M9: stripLearningBanner option ───────────────────────────────────
describe('buildArtifactPdf — stripLearningBanner option (audit M9)', () => {
  // The LearningFrameBanner component is JSX-only and does not normally enter
  // the markdown stream, so the option's job is (1) defensive: strip any
  // leading "> worked example..." blockquote a caller stringified into their
  // export, and (2) prepend the standards-citation footer note.
  it('keeps banner-style blockquote in the output when option is omitted', () => {
    const md = '> This is a worked example of NIST CSWP 39.\n\n# Title\n\nBody.'
    const doc = buildArtifactPdf(md, 'Title')
    const drawn = drawnText(doc)
    expect(drawn).toContain('worked example')
  })

  it('removes the banner-style blockquote when stripLearningBanner: true', () => {
    const md = '> This is a worked example of NIST CSWP 39.\n\n# Title\n\nBody.'
    const doc = buildArtifactPdf(md, 'Title', { stripLearningBanner: true })
    const drawn = drawnText(doc)
    expect(drawn).not.toContain('This is a worked example')
    // The actual content survives.
    expect(drawn).toContain('Title')
    expect(drawn).toContain('Body')
  })

  it('handles the "> Worked example" variant too', () => {
    const md = '> Worked example: see canonical scenarios.\n\n# Title\n\nBody.'
    const doc = buildArtifactPdf(md, 'Title', { stripLearningBanner: true })
    const drawn = drawnText(doc)
    expect(drawn).not.toContain('Worked example: see canonical scenarios')
  })

  it('prepends the standards-citation footer note when banner is stripped', () => {
    const md = '# Title\n\nBody.'
    const doc = buildArtifactPdf(md, 'Title', { stripLearningBanner: true })
    const drawn = drawnText(doc)
    expect(drawn).toContain('Generated by PQC Today Hub')
    expect(drawn).toContain('NIST CSWP 39')
  })

  it('does not prepend the citation note when stripLearningBanner is false', () => {
    const md = '# Title\n\nBody.'
    const doc = buildArtifactPdf(md, 'Title')
    const drawn = drawnText(doc)
    expect(drawn).not.toContain('Generated by PQC Today Hub')
  })
})

describe('markdownToPdf', () => {
  it('triggers a save call on the produced jsPDF document', async () => {
    // jsPDF.save in jsdom dispatches an <a> click. We just verify the function
    // resolves without throwing on a minimal input.
    await expect(
      markdownToPdf('# Title\n\nBody.', 'unit-test', 'Unit Test')
    ).resolves.toBeUndefined()
  })

  it('sanitises path-separator and control characters out of the filename', async () => {
    // The function would throw if the sanitised filename were empty; this
    // confirms it falls back to "artifact" and never hits the empty path.
    await expect(markdownToPdf('# x', '//// ', 'Sanitised')).resolves.toBeUndefined()
  })

  it('forwards options to buildArtifactPdf (wideTable: true → landscape)', async () => {
    // Smoke test only — we can't easily inspect the saved doc, but a thrown
    // error here would indicate an option-forwarding regression.
    await expect(
      markdownToPdf('# x', 'wide-test', 'Wide Test', { wideTable: true })
    ).resolves.toBeUndefined()
  })
})

// ── skipFooters + addDiagramImagePage (live-rendered diagram export) ───────
describe('buildArtifactPdf — skipFooters option', () => {
  it('omits footers when skipFooters: true, unlike the default', () => {
    const withFooters = buildArtifactPdf('# Title\n\nBody.', 'Title')
    const withoutFooters = buildArtifactPdf('# Title\n\nBody.', 'Title', { skipFooters: true })
    expect(drawnText(withFooters)).toMatch(/Page 1 of 1/)
    expect(drawnText(withoutFooters)).not.toMatch(/Page \d+ of \d+/)
  })
})

describe('drawFooters', () => {
  it('stamps "Page N of M" using the page count at call time', () => {
    const doc = buildArtifactPdf('# Title\n\nBody.', 'Title', { skipFooters: true })
    doc.addPage()
    drawFooters(doc, 'Title')
    const drawn = drawnText(doc)
    expect(drawn).toContain('Page 1 of 2')
    expect(drawn).toContain('Page 2 of 2')
  })
})

describe('addDiagramImagePage', () => {
  it('appends exactly one page containing the supplied image', () => {
    const doc = buildArtifactPdf('# Title\n\nBody.', 'Title', { skipFooters: true })
    const before = doc.getNumberOfPages()
    addDiagramImagePage(doc, { dataUrl: TINY_PNG, width: 800, height: 400 })
    expect(doc.getNumberOfPages()).toBe(before + 1)
  })

  it('renders the caption as text on the new page', () => {
    const doc = buildArtifactPdf('# Title\n\nBody.', 'Title', { skipFooters: true })
    addDiagramImagePage(doc, { dataUrl: TINY_PNG, width: 800, height: 400 }, 'Dependency diagram')
    expect(drawnText(doc)).toContain('Dependency diagram')
  })

  it('does not throw for a very tall/narrow image (extreme aspect ratio)', () => {
    const doc = buildArtifactPdf('# Title\n\nBody.', 'Title', { skipFooters: true })
    expect(() =>
      addDiagramImagePage(doc, { dataUrl: TINY_PNG, width: 50, height: 4000 })
    ).not.toThrow()
  })

  it('composes with skipFooters + drawFooters so the diagram page is counted', () => {
    const doc = buildArtifactPdf('# Title\n\nBody.', 'Title', { skipFooters: true })
    addDiagramImagePage(doc, { dataUrl: TINY_PNG, width: 800, height: 400 }, 'Dependency diagram')
    drawFooters(doc, 'Title')
    const drawn = drawnText(doc)
    const total = doc.getNumberOfPages()
    expect(drawn).toContain(`Page ${total} of ${total}`)
  })
})

describe('sanitiseFilename (exported for callers that build a custom PDF pipeline)', () => {
  it('strips path separators and OS-rejected punctuation', () => {
    expect(sanitiseFilename('a/b\\c:d*e?f"g<h>i|j')).toBe('abcdefghij')
  })

  it('falls back to "artifact" when nothing survives sanitisation', () => {
    expect(sanitiseFilename('////')).toBe('artifact')
  })
})
