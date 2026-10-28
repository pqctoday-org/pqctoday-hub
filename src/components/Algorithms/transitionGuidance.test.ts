// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { transitionDateSource } from './transitionGuidance'

describe('transitionDateSource', () => {
  it('attributes the IR 8547 forms to NIST only on NIST rows', () => {
    expect(transitionDateSource('2030 (Deprecated) / 2035 (Disallowed)', 'NIST')).toBe(
      'nist-ir-8547'
    )
    expect(transitionDateSource('2035 (Disallowed)', 'NIST')).toBe('nist-ir-8547')
    expect(transitionDateSource('2030 (Deprecated)', 'NIST')).toBe('nist-ir-8547')
  })

  it('does not lend the NIST dates to other bodies', () => {
    expect(transitionDateSource('2035 (Disallowed)', 'BSI/ANSSI')).toBe('not-recorded')
    expect(transitionDateSource('2035 (Disallowed)', 'KpqC')).toBe('not-recorded')
    expect(transitionDateSource('2035 (Disallowed)', 'IETF')).toBe('not-recorded')
  })

  it('leaves older or differently worded NIST dates unattributed', () => {
    expect(
      transitionDateSource(
        'Disallowed Jan 2024 — Grover reduces to ~56-bit; migrate immediately',
        'NIST'
      )
    ).toBeNull()
    expect(transitionDateSource('Deprecated 2011 / Disallowed 2030', 'NIST')).toBeNull()
    expect(transitionDateSource('2031 (Recommended until)', 'BSI')).toBeNull()
    expect(transitionDateSource('', 'NIST')).toBeNull()
  })
})
