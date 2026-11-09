// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { WORLDWIDE_BODIES } from './worldwideBodies'

describe('worldwide bodies: KpqC', () => {
  const kpqc = WORLDWIDE_BODIES.find((b) => b.id === 'kpqc')!

  it('attributes the competition to the KpqC Research Group, not to KISA or a forum', () => {
    expect(kpqc).toBeDefined()
    const text = `${kpqc.role} ${kpqc.detail}`
    expect(kpqc.role).toMatch(/KpqC Research Group/)
    expect(kpqc.role).not.toMatch(/KISA/)
    expect(text).not.toMatch(/Korean Cryptography Forum/)
    expect(text).toMatch(/2021/)
    expect(text).toMatch(/NSR/)
  })

  it('keeps competition selection distinct from a published national standard', () => {
    expect(kpqc.detail).toMatch(/not the same as a published national standard/)
    expect(kpqc.detail).toMatch(/Korean Standard \(KS\) proposals/)
    expect(kpqc.detail).toMatch(/16 January 2025/)
  })

  it('does not repeat the unsupported launch year or independence motive', () => {
    expect(kpqc.detail).not.toMatch(/Launched in 2022/)
    expect(kpqc.detail).not.toMatch(/cryptopolitical/)
    expect(kpqc.detail).not.toMatch(/independence from US standards/)
  })
})

describe('worldwide bodies: ANSSI and BSI hybrid stance', () => {
  const anssi = WORLDWIDE_BODIES.find((b) => b.id === 'anssi')!
  const bsi = WORLDWIDE_BODIES.find((b) => b.id === 'bsi')!

  it('limits the ANSSI hybrid mandate to its regulated perimeter', () => {
    const text = `${anssi.role} ${anssi.detail}`
    expect(anssi.role).toMatch(/strongly recommends hybrid/)
    expect(anssi.role).toMatch(/mandatory only inside its regulated perimeter/)
    expect(anssi.detail).toMatch(/to date, its PQC guidance has no regulatory force by itself/)
    expect(anssi.detail).toMatch(/except for hash-based signatures \(SLH-DSA, XMSS, LMS\)/)
    expect(text).not.toMatch(/mandatory hybrid PQC for high-sensitivity|must use hybrid/)
  })

  it('does not call BSI TR-02102-1 an authoritative procurement reference', () => {
    expect(bsi).toBeDefined()
    expect(bsi.detail).toMatch(/recommendation to developers/)
    expect(bsi.detail).not.toMatch(/Authoritative reference for German federal procurement/)
  })
})
