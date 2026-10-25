// SPDX-License-Identifier: AGPL-3.0-only
//
// Certification engineer role boards: the Stages board says entropy source
// certificates are kept apart from the module stages.
import { describe, it, expect } from 'vitest'
import { PERSONA_JOURNEY_BOARD_VARIANTS } from '@/data/generated/roleBoardContent.generated'

function board(id: string) {
  const v = PERSONA_JOURNEY_BOARD_VARIANTS['cert-engineer'].find((x) => x.id === id)
  if (!v) throw new Error(`no cert-engineer board ${id}`)
  return v.board
}

describe('certification engineer boards - entropy source certificates', () => {
  it('Stages board footnote keeps the old text and adds the entropy sentence last', () => {
    const footnote = board('stages').sideCard.footnote ?? ''
    expect(footnote).toContain(
      'Certificate data is a published snapshot, not a live feed; the records table shows when each source list was retrieved.'
    )
    expect(
      footnote.endsWith(
        ' Entropy source certificates validate a noise source and are kept apart from these stages.'
      )
    ).toBe(true)
  })
})
