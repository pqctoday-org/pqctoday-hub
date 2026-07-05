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
