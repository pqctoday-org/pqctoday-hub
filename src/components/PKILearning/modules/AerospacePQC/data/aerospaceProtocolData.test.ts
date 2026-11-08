// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { AVIONICS_PROTOCOLS } from './aerospaceProtocolData'

const link16 = AVIONICS_PROTOCOLS.find((p) => p.id === 'link-16')!

describe('Link 16 security teaching', () => {
  it('keeps message encryption and transmission security as separate functions', () => {
    const notes = link16.pqcOverhead.notes
    expect(notes).toMatch(/message security \(MSEC\)/)
    expect(notes).toMatch(/encrypts the message data/)
    expect(notes).toMatch(/transmission security \(TSEC\)/)
    expect(notes).toMatch(/does not replace message encryption/)
  })

  it('does not say transmission security stands in for message encryption', () => {
    const notes = link16.pqcOverhead.notes
    expect(notes).not.toMatch(/rather than COMSEC/i)
    expect(notes).not.toMatch(/relies on TRANSEC/i)
  })

  it('does not claim a classified device, key-distribution design or migration path', () => {
    const text = `${link16.currentCrypto} ${link16.pqcOverhead.notes}`
    expect(text).not.toMatch(/KGV-127|TACLANE|Type 1/i)
    expect(text).not.toMatch(/migration targets the key distribution/i)
    expect(link16.pqcOverhead.notes).toMatch(/classified, so this lesson does not describe them/)
  })
})

describe('ACARS size teaching', () => {
  const acars = AVIONICS_PROTOCOLS.find((p) => p.id === 'acars')!

  it('gives the block counts as signature-byte lower bounds that match the block size', () => {
    const notes = acars.pqcOverhead.notes
    expect(Math.ceil(acars.pqcOverhead.mldsa65Bytes / acars.maxPayloadBytes)).toBe(16)
    expect(Math.ceil(acars.pqcOverhead.lmsBytes / acars.maxPayloadBytes)).toBe(12)
    expect(notes).toMatch(/at least 16 ACARS blocks/)
    expect(notes).toMatch(/at least 12/)
    expect(notes).toMatch(/lower bounds/)
    expect(notes).toMatch(/exclude message content and framing/)
  })

  it('does not call the channel-occupancy increase dramatic or give it a figure', () => {
    const notes = acars.pqcOverhead.notes
    expect(notes).not.toMatch(/dramatic/i)
    expect(notes).not.toMatch(/\d+\s*(x|times)\b/i)
  })
})
