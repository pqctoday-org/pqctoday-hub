// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the PERSONA_HERO_TAGLINE map on Landing.
 *
 * The map drives the persona-specific second-line copy under the hero body.
 * These tests pin: (1) every persona has a tagline, (2) each tagline is short
 * enough to fit the hero layout (≤ 24 words per the design call), (3) each
 * tagline carries a verifiable persona-specific keyword so the copy doesn't
 * drift toward generic phrasing.
 */
import { describe, it, expect } from 'vitest'
import { PERSONA_HERO_TAGLINE } from './LandingView'

describe('PERSONA_HERO_TAGLINE', () => {
  it('has a tagline for every persona', () => {
    expect(Object.keys(PERSONA_HERO_TAGLINE).sort()).toEqual([
      'architect',
      'curious',
      'developer',
      'executive',
      'ops',
      'researcher',
    ])
  })

  it.each(Object.entries(PERSONA_HERO_TAGLINE))(
    '%s tagline is ≤ 24 words (fits the hero layout)',
    (_persona, tagline) => {
      const wordCount = tagline.trim().split(/\s+/).length
      expect(wordCount).toBeLessThanOrEqual(24)
    }
  )

  it.each(Object.entries(PERSONA_HERO_TAGLINE))(
    '%s tagline ends with a sentence terminator',
    (_persona, tagline) => {
      expect(tagline.trim()).toMatch(/[.!?]$/)
    }
  )

  it('executive tagline mentions compliance / deadline framing', () => {
    expect(PERSONA_HERO_TAGLINE.executive).toMatch(/CNSA|deadline|audit|compliance|board/i)
  })

  it('developer tagline mentions library / API / shipping context', () => {
    expect(PERSONA_HERO_TAGLINE.developer).toMatch(/OpenSSL|BoringSSL|JOSE|library|stack/i)
  })

  it('architect tagline mentions hybrid / PKI / redesign framing', () => {
    expect(PERSONA_HERO_TAGLINE.architect).toMatch(/Hybrid|composite|PKI|redesign|key-size/i)
  })

  it('researcher tagline mentions FIPS / RFC / KAT framing', () => {
    expect(PERSONA_HERO_TAGLINE.researcher).toMatch(/FIPS|RFC|ACVP|KAT|citation/i)
  })

  it('ops tagline mentions rotation / cutover / HSM framing', () => {
    expect(PERSONA_HERO_TAGLINE.ops).toMatch(/rotation|cutover|HSM|renewal|keys/i)
  })

  it('curious tagline avoids jargon (no FIPS / RFC / acronyms in caps)', () => {
    expect(PERSONA_HERO_TAGLINE.curious).not.toMatch(/FIPS|RFC|KAT|ACVP|CNSA|HSM|PKI/)
  })
})
