// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { ALGORITHM_SECURITY_DATA, CRQC_MODALITY_TRACKS } from './quantumConstants'

describe('Grover bound on AES is kept apart from cost and policy', () => {
  const aes = (name: string) => ALGORITHM_SECURITY_DATA.find((a) => a.name === name)!

  it('the AES-128 note calls the 64-bit figure a query bound, not a rejection', () => {
    const note = aes('AES-128').notes
    expect(note).toMatch(/query/i)
    expect(note).toMatch(/not a gate, time or cost estimate/i)
    expect(note).toMatch(/CNSA 2\.0/)
    expect(note).not.toMatch(/below security threshold/i)
    expect(note).not.toMatch(/insufficient/i)
  })

  it('the AES-192 note does not apply a universal 128-bit post-quantum threshold', () => {
    const note = aes('AES-192').notes
    expect(note).not.toMatch(/below the 128-bit post-quantum threshold/i)
    expect(note).toMatch(/depends on the authority/i)
  })

  it('the AES-256 note does not promise unconditional security', () => {
    const note = aes('AES-256').notes
    expect(note).not.toMatch(/fully secure/i)
    expect(note).toMatch(/not a proof/i)
  })
})

describe('PQC parameter-set notes treat the bit figure as a category label', () => {
  it.each(['ML-KEM-768', 'ML-DSA-65'])(
    '%s: category label, not a measured or identical cost',
    (name) => {
      const note = ALGORITHM_SECURITY_DATA.find((a) => a.name === name)!.notes
      expect(note).toMatch(/category 3/i)
      expect(note).toMatch(/category label rather than a measured/i)
      expect(note).toMatch(/not a proof of identical work/i)
    }
  )
})

describe('photonic hardware track separates physical modes from logical qubits', () => {
  const photonic = CRQC_MODALITY_TRACKS.find((t) => t.technology === 'Photonic')!

  it('records no logical-qubit demonstration for Aurora and keeps the 12 as physical modes', () => {
    expect(photonic.bestLogical).toBe(0)
    expect(photonic.bestPhysical).toBe(12)
    expect(photonic.recentProgress).toMatch(/12 physical qubit modes per clock cycle/)
    expect(photonic.recentProgress).toMatch(/distance-2 repetition code/)
    expect(photonic.recentProgress).toMatch(/error-detection/)
    expect(photonic.recentProgress).toMatch(/not twelve error-corrected logical qubits/)
  })

  it('no photonic text claims twelve error-corrected logical qubits', () => {
    const text = `${photonic.note} ${photonic.recentProgress} ${photonic.scaleChallenge}`
    expect(text).not.toMatch(/ran 12 error-corrected/i)
    expect(text).not.toMatch(/12 error-corrected/i)
  })

  it('the loss gap is stated with the paper’s own figures', () => {
    expect(photonic.scaleChallenge).toMatch(/about 1%/)
    expect(photonic.scaleChallenge).toMatch(/about 56%/)
    expect(photonic.scaleChallenge).toMatch(/slightly over 95%/)
  })
})
