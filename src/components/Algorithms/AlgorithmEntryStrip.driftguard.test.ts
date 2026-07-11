// SPDX-License-Identifier: GPL-3.0-only
//
// ACCURACY-0705 drift guard: every literal `status:` value any in-app
// deep-link/CTA passes must be a real STATUS_ITEMS id. This is exactly the
// class of bug that shipped: 'Standardized' isn't a valid status, so the
// Developer persona's default entry CTA (and its matching persona-hint
// copy) silently produced a zero-result filter. A single structural
// assertion over the data — not a rendered click — catches this and any
// future recurrence, without needing to know which component fires it.
import { describe, it, expect } from 'vitest'
import { INTENTS, PERSONA_INTENTS } from './AlgorithmEntryStrip'
import { STATUS_ITEMS } from './AlgorithmFilters'

describe('AlgorithmEntryStrip status params (ACCURACY-0705)', () => {
  const validStatusIds = new Set(STATUS_ITEMS.map((item) => item.id))

  it('every intent whose params include a status uses a real STATUS_ITEMS id', () => {
    const allIntents = [...INTENTS, ...Object.values(PERSONA_INTENTS)]
    const offenders = allIntents
      .filter((intent) => intent.params.status != null)
      .filter((intent) => !validStatusIds.has(intent.params.status as string))
      .map((intent) => ({ label: intent.label, status: intent.params.status }))

    expect(offenders).toEqual([])
  })
})

// Same class of bug as ACCURACY-0705, caught 2026-07-11: the executive
// persona's default CTA set `section: 'security'` with `tab: 'detailed'` —
// `section` is only ever read by AlgorithmValidationView on the Validation
// tab, and only recognises 'attacks' | 'kat', so that key silently did
// nothing. This structural check makes the same mistake fail a test instead
// of shipping a dead param again.
describe('AlgorithmEntryStrip section params', () => {
  const validSectionIds = new Set(['attacks', 'kat'])

  it('every intent whose params include a section targets tab=validation with a real section id', () => {
    const allIntents = [...INTENTS, ...Object.values(PERSONA_INTENTS)]
    const offenders = allIntents
      .filter((intent) => intent.params.section != null)
      .filter(
        (intent) =>
          intent.params.tab !== 'validation' ||
          !validSectionIds.has(intent.params.section as string)
      )
      .map((intent) => ({
        label: intent.label,
        tab: intent.params.tab,
        section: intent.params.section,
      }))

    expect(offenders).toEqual([])
  })
})
