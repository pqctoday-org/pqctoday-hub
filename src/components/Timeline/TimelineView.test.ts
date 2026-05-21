// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the TIMELINE_PERSONA_HINTS map.
 *
 * Pins: (1) every persona has a hint (post-2026-05-21 audit added ops + curious),
 * (2) each hint is short enough to fit the inline hint chip, (3) the hint
 * carries persona-relevant framing.
 */
import { describe, it, expect } from 'vitest'
import { TIMELINE_PERSONA_HINTS } from './TimelineView'

describe('TIMELINE_PERSONA_HINTS', () => {
  it('has a hint for every persona including ops and curious', () => {
    expect(Object.keys(TIMELINE_PERSONA_HINTS).sort()).toEqual([
      'architect',
      'curious',
      'developer',
      'executive',
      'ops',
      'researcher',
    ])
  })

  it.each(Object.entries(TIMELINE_PERSONA_HINTS))(
    '%s hint is ≤ 30 words (fits the chip)',
    (_persona, hint) => {
      const wordCount = hint.trim().split(/\s+/).length
      expect(wordCount).toBeLessThanOrEqual(30)
    }
  )

  it('ops hint mentions rotation / deploy framing', () => {
    expect(TIMELINE_PERSONA_HINTS.ops).toMatch(/Deploy|rotation|cert|fleet/i)
  })

  it('curious hint uses plain language (no FIPS / RFC / acronyms)', () => {
    expect(TIMELINE_PERSONA_HINTS.curious).not.toMatch(/FIPS|RFC|KAT|ACVP|CNSA|HSM|PKI/)
    // And mentions countries / phases in accessible terms
    expect(TIMELINE_PERSONA_HINTS.curious).toMatch(/country|region|phase/i)
  })
})
