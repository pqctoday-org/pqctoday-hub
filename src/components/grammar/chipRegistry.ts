// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The chip registry (UX grammar v2.1, section 2.1): ten families, each with its fixed words and
 * the tone of each word. This is the only table of chip words and tones. The Chip component reads
 * it; nothing else may define a chip word or colour.
 *
 * Colour never carries meaning alone: every chip shows its word. Severity, How it runs, Output
 * kind and Verdict also carry a glyph.
 */

/** The nine tones. Each has --chip-<tone>-fg / -bg / -border tokens (src/styles/grammarTokens.json). */
export type ChipTone =
  'critical' | 'high' | 'medium' | 'low' | 'ok' | 'warn' | 'mute' | 'info' | 'neutral'

/** How the border differs from the default solid border in the tone colour. */
export type ChipBorder = 'solid' | 'highlight' | 'dashed'

export interface ChipWordSpec {
  tone: ChipTone
  /** A glyph drawn before the word (aria-hidden: the word carries the meaning). */
  glyph?: string
  border?: ChipBorder
}

const w = (tone: ChipTone, glyph?: string, border?: ChipBorder): ChipWordSpec => ({
  tone,
  ...(glyph ? { glyph } : {}),
  ...(border ? { border } : {}),
})

/** Family key to its fixed words. The key order is the handoff's family numbering. */
export const CHIP_FAMILIES = {
  // 1 Severity
  severity: {
    Critical: w('critical', '▲'),
    High: w('high', '◆'),
    Medium: w('medium', '●'),
    Low: w('low', '▽'),
  },
  // 2 Lifecycle
  lifecycle: {
    Final: w('ok'),
    Active: w('ok'),
    Draft: w('warn'),
    Pilot: w('warn'),
    Superseded: w('mute'),
    Expired: w('mute'),
  },
  // 3 Source (record provenance). "Confidence" takes a value: "Confidence 84".
  source: {
    'Authoritative source': w('ok'),
    Reviewed: w('info'),
    'Not yet reviewed': w('mute'),
    Confidence: w('neutral'),
  },
  // 4 Freshness. "Verified" takes a date: "Verified 18 Nov 2026".
  freshness: {
    New: w('info'),
    Updated: w('info'),
    Verified: w('ok'),
  },
  // 5 Category: neutral pills only, with any text. See CATEGORY_TONE.
  category: {},
  // 6a Tool type: how it runs (Playground)
  howItRuns: {
    'Real cryptography': w('ok', '●'),
    'Protocol model': w('info', '◐'),
    Calculator: w('neutral', '∑'),
    Simulation: w('warn', '≈'),
    'Sandbox only': w('mute', '▣'),
  },
  // 6b Tool type: output kind (Business)
  outputKind: {
    'Scenario model': w('info', '∿'),
    Worksheet: w('neutral', '▤'),
    'Design worksheet': w('neutral', '◫'),
    'Draft document': w('warn', '✎'),
    'Evidence organiser': w('ok', '☑'),
  },
  // 7 Origin: where a value came from. "Seeded" may name its source.
  origin: {
    Sample: w('warn'),
    Seeded: w('info'),
    Yours: w('neutral', undefined, 'highlight'),
    Catalogue: w('info'),
    Model: w('neutral'),
    'Needs data ›': w('mute', undefined, 'dashed'),
  },
  // 8 Evidence: proof of a user's claim. "Unknown" is sentence case; an empty cell stays empty.
  evidence: {
    Planned: w('mute'),
    Recorded: w('info'),
    Reviewed: w('info'),
    Verified: w('ok'),
    Unknown: w('neutral'),
  },
  // 9 Verdict
  verdict: {
    Valid: w('ok', '✓'),
    Match: w('ok', '✓'),
    Pass: w('ok', '✓'),
    Invalid: w('critical', '✕'),
    Mismatch: w('critical', '✕'),
    Fail: w('critical', '✕'),
    'Rejected as expected': w('ok', '✓'),
    Warning: w('warn', '⚠'),
  },
  // 10 Support status (from D1)
  support: {
    Available: w('ok'),
    Partial: w('warn'),
    Planned: w('info'),
    'Not determined': w('mute'),
    None: w('mute'),
    'PSK only': w('warn'),
  },
} as const satisfies Record<string, Record<string, ChipWordSpec>>

export type ChipFamily = keyof typeof CHIP_FAMILIES

/** The handoff's family numbers, for the registry test and the docs. */
export const CHIP_FAMILY_NUMBER: Record<ChipFamily, string> = {
  severity: '1',
  lifecycle: '2',
  source: '3',
  freshness: '4',
  category: '5',
  howItRuns: '6a',
  outputKind: '6b',
  origin: '7',
  evidence: '8',
  verdict: '9',
  support: '10',
}

/** Category chips (family 5) are neutral only. */
export const CATEGORY_TONE: ChipWordSpec = { tone: 'neutral' }

/** The fixed words of one family. */
export type ChipWord<F extends ChipFamily> = F extends 'category'
  ? string
  : Extract<keyof (typeof CHIP_FAMILIES)[F], string>

/** One chip: a family and one of its words, so a wrong word fails the type check. */
export type ChipSpec = {
  [F in ChipFamily]: { family: F; word: ChipWord<F> }
}[ChipFamily]

/** Two families that never sit on the same row: Source (record provenance) and Evidence (a user's claim). */
export const EXCLUSIVE_FAMILIES: readonly [ChipFamily, ChipFamily] = ['source', 'evidence']

/** The spec of a word, or undefined for a word the family does not hold. */
export function chipWordSpec(family: ChipFamily, word: string): ChipWordSpec | undefined {
  if (family === 'category') return CATEGORY_TONE
  const table: Record<string, ChipWordSpec> = CHIP_FAMILIES[family]
  return Object.prototype.hasOwnProperty.call(table, word) ? table[word] : undefined
}

/** A row of chips breaks the rule when it holds both Source and Evidence chips. Returns the message, or null. */
export function chipRowViolation(chips: readonly Pick<ChipSpec, 'family'>[]): string | null {
  const [a, b] = EXCLUSIVE_FAMILIES
  const has = (f: ChipFamily) => chips.some((c) => c.family === f)
  return has(a) && has(b)
    ? `Chip families "${a}" and "${b}" never sit on the same row (handoff 2.1)`
    : null
}
