// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Chip, ChipRow, chipLabel, type ChipProps } from './Chip'
import { CHIP_FAMILIES, chipRowViolation, type ChipFamily } from './chipRegistry'
import { loadTokens } from '@/styles/tokenContrast'

/** The words of handoff 2.1, typed out once more so a registry edit cannot pass unseen. */
const HANDOFF_WORDS: Record<Exclude<ChipFamily, 'category'>, string[]> = {
  severity: ['Critical', 'High', 'Medium', 'Low'],
  lifecycle: ['Final', 'Active', 'Draft', 'Pilot', 'Superseded', 'Expired'],
  source: ['Authoritative source', 'Reviewed', 'Not yet reviewed', 'Confidence'],
  freshness: ['New', 'Updated', 'Verified'],
  howItRuns: ['Real cryptography', 'Protocol model', 'Calculator', 'Simulation', 'Sandbox only'],
  outputKind: [
    'Scenario model',
    'Worksheet',
    'Design worksheet',
    'Draft document',
    'Evidence organiser',
  ],
  origin: ['Sample', 'Seeded', 'Yours', 'Catalogue', 'Model', 'Needs data ›'],
  evidence: ['Planned', 'Recorded', 'Reviewed', 'Verified', 'Unknown'],
  verdict: [
    'Valid',
    'Match',
    'Pass',
    'Invalid',
    'Mismatch',
    'Fail',
    'Rejected as expected',
    'Warning',
  ],
  support: ['Available', 'Partial', 'Planned', 'Not determined', 'None', 'PSK only'],
}

describe('chip registry', () => {
  it('holds the ten families with exactly the handoff words', () => {
    for (const [family, words] of Object.entries(HANDOFF_WORDS))
      expect(Object.keys(CHIP_FAMILIES[family as ChipFamily]), family).toEqual(words)
    expect(Object.keys(CHIP_FAMILIES)).toHaveLength(11) // ten families, family 6 in two parts
  })

  it('never has an all-caps word, and writes Unknown in sentence case', () => {
    for (const fam of Object.values(CHIP_FAMILIES))
      for (const word of Object.keys(fam)) expect(word).not.toMatch(/^[A-Z ]{3,}$/)
    expect(Object.keys(CHIP_FAMILIES.evidence)).toContain('Unknown')
  })

  it('points every word at a tone that has tokens in both themes', () => {
    const tokens = loadTokens()
    for (const fam of Object.values(CHIP_FAMILIES))
      for (const spec of Object.values(fam))
        for (const mode of ['light', 'dark'] as const)
          for (const k of ['fg', 'bg', 'border'])
            expect(tokens[mode][`chip-${spec.tone}-${k}`]).toBeDefined()
  })

  it('gives severity, how-it-runs, output kind and verdict a glyph on every word', () => {
    for (const f of ['severity', 'howItRuns', 'outputKind', 'verdict'] as const)
      for (const spec of Object.values(CHIP_FAMILIES[f])) expect(spec).toHaveProperty('glyph')
  })

  it('maps the tones the tokens file names', () => {
    expect(CHIP_FAMILIES.severity.Critical.tone).toBe('critical')
    expect(CHIP_FAMILIES.support['PSK only'].tone).toBe('warn')
    expect(CHIP_FAMILIES.verdict['Rejected as expected'].tone).toBe('ok')
    expect(CHIP_FAMILIES.origin['Needs data ›']).toMatchObject({ tone: 'mute', border: 'dashed' })
    expect(CHIP_FAMILIES.origin.Yours).toMatchObject({ tone: 'neutral', border: 'highlight' })
  })
})

describe('Chip', () => {
  it('shows the word and a tone', () => {
    render(<Chip family="severity" word="High" />)
    const chip = screen.getByText('High').closest('span[data-chip-family]')
    expect(chip).toHaveAttribute('data-chip-tone', 'high')
    expect(chip).toHaveClass('text-chip-high-fg')
  })

  it('hides the glyph from assistive technology but keeps the word', () => {
    render(<Chip family="severity" word="Critical" />)
    expect(screen.getByText('▲')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Critical', { exact: false })).toBeInTheDocument()
  })

  it('writes Confidence with its number and Verified with a date in the shared form', () => {
    expect(chipLabel({ family: 'source', word: 'Confidence', value: 84 })).toBe('Confidence 84')
    expect(chipLabel({ family: 'freshness', word: 'Verified', date: '2026-11-18' })).toBe(
      'Verified 18 Nov 2026'
    )
    expect(chipLabel({ family: 'origin', word: 'Seeded', from: 'your assessment' })).toBe(
      'Seeded from your assessment'
    )
  })

  it('renders a category with any text in neutral', () => {
    render(<Chip family="category" word="Public sector" />)
    expect(screen.getByText('Public sector')).toHaveAttribute('data-chip-tone', 'neutral')
  })

  it('renders nothing for a word its family does not hold', () => {
    const { container } = render(
      <Chip {...({ family: 'severity', word: 'Moderate' } as unknown as ChipProps)} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})

describe('ChipRow', () => {
  it('flags Source with Evidence on one row', () => {
    expect(chipRowViolation([{ family: 'source' }, { family: 'evidence' }])).toMatch(
      /never sit on the same row/
    )
    expect(chipRowViolation([{ family: 'source' }, { family: 'severity' }])).toBeNull()
    expect(chipRowViolation([{ family: 'evidence' }, { family: 'support' }])).toBeNull()
  })

  it('throws in development when a row mixes them, and renders the rest otherwise', () => {
    expect(() =>
      render(
        <ChipRow
          chips={[
            { family: 'source', word: 'Reviewed' },
            { family: 'evidence', word: 'Reviewed' },
          ]}
        />
      )
    ).toThrow(/never sit on the same row/)
    render(
      <ChipRow
        label="Status"
        chips={[
          { family: 'severity', word: 'Low' },
          { family: 'support', word: 'Available' },
        ]}
      />
    )
    expect(screen.getByRole('group', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
  })
})
