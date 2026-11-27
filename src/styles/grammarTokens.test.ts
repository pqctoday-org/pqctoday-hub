// SPDX-License-Identifier: AGPL-3.0-only
// The UX grammar chip tones (handoff 2.1, tokens file 2): every text and fill pair is 4.5:1 or
// more and every border 3:1 or more on the card, in both themes, measured from the generated CSS.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadTokens, tokenRatio, tokenRgb, toHex, type Mode } from './tokenContrast'
import spec from './grammarTokens.json'

const MODES: Mode[] = ['light', 'dark']
const TONES = spec.chipTones.map((t) => t.tone)

/** Decorative borders: the word carries the meaning, so no 3:1 rule (tokens file 2, neutral row). */
const DECORATIVE_BORDER = new Set(['dark:neutral', 'light:neutral'])

describe('grammar chip tones', () => {
  it('has the nine tones from the tokens file', () => {
    expect(TONES).toEqual([
      'critical',
      'high',
      'medium',
      'low',
      'ok',
      'warn',
      'mute',
      'info',
      'neutral',
    ])
  })

  it.each(MODES)('defines fg, bg and border for every tone (%s)', (mode) => {
    for (const tone of TONES)
      for (const k of ['fg', 'bg', 'border'])
        expect(loadTokens()[mode][`chip-${tone}-${k}`], `${mode} --chip-${tone}-${k}`).toBeDefined()
  })

  it.each(MODES)('text on fill passes AA 4.5:1 (%s)', (mode) => {
    for (const tone of TONES)
      expect(
        tokenRatio(mode, `chip-${tone}-fg`, `chip-${tone}-bg`),
        `${mode} ${tone}`
      ).toBeGreaterThanOrEqual(4.5)
  })

  it.each(MODES)('border on the card passes 3:1 (%s)', (mode) => {
    for (const tone of TONES) {
      if (DECORATIVE_BORDER.has(`${mode}:${tone}`)) continue
      expect(
        tokenRatio(mode, `chip-${tone}-border`, 'card'),
        `${mode} ${tone}`
      ).toBeGreaterThanOrEqual(3)
    }
  })

  it.each(MODES)('round-trips to the hex in the tokens file (%s)', (mode) => {
    for (const t of spec.chipTones) {
      const v = t[mode] as { fg: string; bg: string; border?: string }
      const near = (a: string, b: string) =>
        [1, 3, 5].every(
          (i) => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)) <= 2
        )
      expect(
        near(toHex(tokenRgb(mode, `chip-${t.tone}-fg`)), v.fg.toLowerCase()),
        `${mode} ${t.tone} fg`
      ).toBe(true)
      expect(
        near(toHex(tokenRgb(mode, `chip-${t.tone}-bg`)), v.bg.toLowerCase()),
        `${mode} ${t.tone} bg`
      ).toBe(true)
    }
  })
})

describe('grammar type styles', () => {
  const css = readFileSync(resolve(__dirname, 'grammar-tokens.css'), 'utf8')
  it('has one named class per style, and no page title (that is O4, built elsewhere)', () => {
    for (const name of Object.keys(spec.typeStyles)) expect(css).toContain(`.type-${name} {`)
    expect(css).not.toContain('.page-title')
  })
  it('keeps small text at 12 px or more and form fields at 16 px on a phone', () => {
    expect(spec.typeStyles.small.phone).toBeGreaterThanOrEqual(12)
    expect(spec.typeStyles.field.phone).toBe(16)
  })
})
