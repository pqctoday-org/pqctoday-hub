// SPDX-License-Identifier: AGPL-3.0-only
//
// Certification engineer role boards: the Stages board says entropy source
// certificates are kept apart from the module stages, the Entropy board links to
// those certificates, and the Community card sits on the Hardware board.
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

  it('Entropy board links to the entropy source certificates, word for word', () => {
    const card = board('entropy').gridCards?.[0]
    expect(card?.title).toBe('See the entropy source certificates')
    expect(card?.body).toBe(
      "The certification records list NIST's entropy source validations. An entropy source certificate validates a noise source, not a module or an algorithm."
    )
    expect(card?.href).toBe('/compliance?tab=records&rtab=esv')
  })

  it('the standards-community card sits on the Hardware board, not the Entropy board', () => {
    const hardware = board('hardware').gridCards ?? []
    const entropy = board('entropy').gridCards ?? []
    expect(hardware[1]?.title).toBe('Meet the standards community')
    expect(hardware[1]?.href).toBe('/leaders')
    expect(entropy.some((c) => c.href === '/leaders')).toBe(false)
  })
})

describe('certification engineer boards - closure gate link', () => {
  it('Stages board names the migration programme in its second button and keeps the link', () => {
    const b = board('stages')
    expect(b.ctaSecondary).toBe("See the migration programme's closure gate")
    expect(b.ctaSecondary).not.toMatch(/evidence closure gate/i)
    expect(b.ctaSecondaryHref).toBe('/simulation?phase=verify-close')
  })
})
