// SPDX-License-Identifier: GPL-3.0-only
/**
 * Unit tests for the markdown → DOCX block tokenizer (audit C1).
 *
 * The bug these guard against: `markdownToDocx` used to be line-by-line with no
 * table branch, so a GFM `| a | b |` table fell through to a plain paragraph and
 * Word showed literal pipe text. The tokenizer must group pipe rows into a real
 * table block and never leak a `|` into a paragraph.
 */
import { describe, it, expect } from 'vitest'
import { Table, Paragraph } from 'docx'
import { parseDocxBlocks, markdownToDocxChildren, type DocxBlock } from './docxExport'

const TABLE_MD = `# Skills & Team Plan

## Core roles & FTE

| Role | Typical FTE | Status |
|------|-------------|--------|
| QRPM | 1.0 | active |
| Crypto Lead | 0.5–1.0 | open |

Some trailing prose with no pipes.`

describe('parseDocxBlocks — table grouping (audit C1)', () => {
  it('groups consecutive pipe rows into one table block and drops the separator', () => {
    const blocks = parseDocxBlocks(TABLE_MD)
    const tables = blocks.filter(
      (b): b is Extract<DocxBlock, { kind: 'table' }> => b.kind === 'table'
    )
    expect(tables).toHaveLength(1)
    expect(tables[0].head).toEqual(['Role', 'Typical FTE', 'Status'])
    expect(tables[0].body).toHaveLength(2)
    expect(tables[0].body[0]).toEqual(['QRPM', '1.0', 'active'])
    // the `|---|` separator row must not appear in the body
    expect(tables[0].body.some((r) => r.join('').includes('---'))).toBe(false)
  })

  it('never leaks a raw pipe into a paragraph/bullet/kv block', () => {
    const blocks = parseDocxBlocks(TABLE_MD)
    const leaks = blocks.filter(
      (b) => 'text' in b && typeof b.text === 'string' && b.text.includes('|')
    )
    expect(leaks).toHaveLength(0)
  })

  it('maps heading levels with the legacy shift (# → Title … #### → H3)', () => {
    const blocks = parseDocxBlocks('# A\n## B\n### C\n#### D')
    expect(blocks).toEqual([
      { kind: 'heading', level: 0, text: 'A' },
      { kind: 'heading', level: 1, text: 'B' },
      { kind: 'heading', level: 2, text: 'C' },
      { kind: 'heading', level: 3, text: 'D' },
    ])
  })

  it('parses checklists case-insensitively', () => {
    const blocks = parseDocxBlocks('- [x] lower\n- [X] upper\n- [ ] open')
    expect(blocks).toEqual([
      { kind: 'check', checked: true, text: 'lower' },
      { kind: 'check', checked: true, text: 'upper' },
      { kind: 'check', checked: false, text: 'open' },
    ])
  })

  it('captures fenced code and blockquotes instead of dumping markers', () => {
    const blocks = parseDocxBlocks('```\nconst x = 1\n```\n> a quote')
    expect(blocks[0]).toEqual({ kind: 'code', lines: ['const x = 1'] })
    expect(blocks[1]).toEqual({ kind: 'quote', text: 'a quote' })
  })
})

describe('markdownToDocxChildren — renders a real Word table (audit C1)', () => {
  it('emits a docx Table for table markdown (not paragraphs of pipe text)', () => {
    const children = markdownToDocxChildren(TABLE_MD)
    const tables = children.filter((c) => c instanceof Table)
    expect(tables).toHaveLength(1)
  })

  it('still renders headings/paragraphs as Paragraph instances', () => {
    const children = markdownToDocxChildren('# Title\n\nbody text')
    expect(children.every((c) => c instanceof Paragraph)).toBe(true)
    expect(children.length).toBeGreaterThanOrEqual(2)
  })
})
