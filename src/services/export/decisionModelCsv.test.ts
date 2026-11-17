// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { decisionModelToCsv } from './decisionModelCsv'
it('preserves actual nested inputs/results, empty lists, quotes and newlines without executing text as formulas', () => {
  const csv = decisionModelToCsv({
    input: { selected: ['A', 'B'], note: 'one,"two"\nthree' },
    result: { gap: -2, accepted: false },
    empty: [],
    text: '=1+1',
  })
  expect(csv).toContain('input.selected[1],B')
  expect(csv).toContain('result.gap,-2')
  expect(csv).toContain('result.accepted,false')
  expect(csv).toContain('empty,[]')
  expect(csv).toContain('"one,""two""\nthree"')
  expect(csv).toContain("text,'=1+1")
})
