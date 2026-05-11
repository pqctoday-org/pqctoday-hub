// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { classifyPr, CHANGE_LABELS } from './classifyPr'

describe('classifyPr', () => {
  it('returns no labels for an empty changed-file list', () => {
    const r = classifyPr([])
    expect(r.inferredLabels).toEqual([])
    expect(r.unambiguous).toBe(false)
    expect(r.comment).toContain("doesn't touch any tracked trust-engine surface")
  })

  it('infers data:library for a single library CSV', () => {
    const r = classifyPr(['src/data/library_05082026_r9.csv'])
    expect(r.inferredLabels).toEqual(['data:library'])
    expect(r.unambiguous).toBe(true)
    expect(r.comment).toContain('auto-applied')
    expect(r.comment).toContain('data:library')
  })

  it('infers data:compliance for a compliance CSV', () => {
    const r = classifyPr(['src/data/compliance_05072026_r5.csv'])
    expect(r.inferredLabels).toEqual(['data:compliance'])
    expect(r.unambiguous).toBe(true)
  })

  it('infers xref for concept_xwalks CSVs', () => {
    const r = classifyPr(['src/data/concept_xwalks_05082026_r2.csv'])
    expect(r.inferredLabels).toEqual(['xref'])
    expect(r.unambiguous).toBe(true)
  })

  it('infers tool:wasm-backend for WASM source under src/wasm', () => {
    const r = classifyPr(['src/wasm/mlkem-bindings.ts'])
    expect(r.inferredLabels).toEqual(['tool:wasm-backend'])
    expect(r.unambiguous).toBe(true)
  })

  it('infers vocab:change for the overlay JSON', () => {
    const r = classifyPr(['src/data/pqc-vocab-overlay.json'])
    expect(r.inferredLabels).toEqual(['vocab:change'])
    expect(r.unambiguous).toBe(true)
  })

  it('infers module:content for a PKILearning module content.ts', () => {
    const r = classifyPr(['src/components/PKILearning/modules/HybridCrypto/content.ts'])
    expect(r.inferredLabels).toEqual(['module:content'])
    expect(r.unambiguous).toBe(true)
  })

  it('flags as ambiguous when two domains are touched', () => {
    const r = classifyPr([
      'src/data/library_05082026_r9.csv',
      'src/data/compliance_05072026_r5.csv',
    ])
    expect(r.inferredLabels.sort()).toEqual(['data:compliance', 'data:library'])
    expect(r.unambiguous).toBe(false)
    expect(r.comment).toContain('review before applying')
  })

  it('flags as ambiguous when there are unclassified files alongside a domain match', () => {
    const r = classifyPr([
      'src/data/library_05082026_r9.csv',
      '.github/workflows/some-unrelated.yml',
    ])
    expect(r.inferredLabels).toEqual(['data:library'])
    expect(r.unambiguous).toBe(false)
    expect(r.unclassifiedFiles).toContain('.github/workflows/some-unrelated.yml')
  })

  it('lists unclassified files in the comment when present', () => {
    const r = classifyPr(['README.md', 'docs/something.md'])
    expect(r.inferredLabels).toEqual([])
    expect(r.unclassifiedFiles).toEqual(['README.md', 'docs/something.md'])
    expect(r.comment).toContain('Unclassified files')
  })

  it('truncates unclassified-file list to 10 with overflow indicator', () => {
    const files = Array.from({ length: 15 }, (_, i) => `random/file-${i}.txt`)
    const r = classifyPr(files)
    expect(r.unclassifiedFiles).toHaveLength(15)
    expect(r.comment).toContain('and 5 more')
  })

  it('attaches evidence (file + reason) per label', () => {
    const r = classifyPr(['src/data/library_05082026_r9.csv', 'src/data/library_05082026_r10.csv'])
    expect(r.evidence['data:library']).toHaveLength(2)
    expect(r.evidence['data:library'][0].reason).toContain('library_*.csv')
  })

  it('does not flag a generic markdown file as enrichment', () => {
    const r = classifyPr(['docs/readme.md'])
    expect(r.inferredLabels).toEqual([])
  })

  it('flags pqctoday-priv enrichment markdown as enrichment', () => {
    const r = classifyPr(['pqctoday-priv/cowork/library-enrichments/FIPS_203.md'])
    expect(r.inferredLabels).toEqual(['enrichment'])
  })

  it('flags WASM binaries under public/dist as tool:wasm-backend', () => {
    const r = classifyPr(['public/dist/oqs-bindings.wasm'])
    expect(r.inferredLabels).toEqual(['tool:wasm-backend'])
  })

  it('flags type definitions under src/types as schema:change', () => {
    const r = classifyPr(['src/types/MaturityTypes.ts'])
    expect(r.inferredLabels).toEqual(['schema:change'])
  })

  it('does not duplicate a label when multiple files match the same rule', () => {
    const r = classifyPr([
      'src/data/library_05082026_r9.csv',
      'src/data/library_05082026_r10.csv',
      'src/data/library_05082026_r11.csv',
    ])
    expect(r.inferredLabels).toEqual(['data:library'])
    expect(r.unambiguous).toBe(true)
  })

  it('CHANGE_LABELS is a non-empty closed set', () => {
    expect(CHANGE_LABELS.length).toBeGreaterThan(10)
  })
})
