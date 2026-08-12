// SPDX-License-Identifier: GPL-3.0-only
/**
 * The lens makes two different claims under one label. If the split between
 * them ever collapses — everything reported as "stated", or the inference
 * silently widening — a developer gets a confident list of threats to a
 * protocol that half the records never mentioned. That is the failure this
 * whole design exists to prevent, so it is what the tests pin.
 */
import { describe, it, expect } from 'vitest'
import { LENS_PROTOCOLS, protocolsForThreat, threatTouchesProtocol } from './threatProtocolLens'
import { threatsData, type ThreatItem } from './threatsData'

const threat = (over: Partial<ThreatItem>): ThreatItem =>
  ({
    threatId: 'T',
    industry: 'X',
    description: '',
    cryptoAtRisk: '',
    pqcReplacement: '',
    ...over,
  }) as ThreatItem

describe('threat protocol lens', () => {
  it('calls a named protocol STATED, not inferred', () => {
    const m = protocolsForThreat(threat({ cryptoAtRisk: 'ground station TLS' }))
    expect(m.find((x) => x.protocol === 'TLS / HTTPS')?.basis).toBe('stated')
  })

  it('calls an algorithm-only match INFERRED', () => {
    const m = protocolsForThreat(threat({ cryptoAtRisk: 'RSA-2048' }))
    const tls = m.find((x) => x.protocol === 'TLS / HTTPS')
    expect(tls).toBeDefined()
    expect(tls!.basis).toBe('inferred')
  })

  it('prefers STATED when a record both names the protocol and lists the algorithm', () => {
    // Otherwise a record that says "TLS using RSA-2048" would be reported as a
    // guess, which understates what we actually know.
    const m = protocolsForThreat(threat({ cryptoAtRisk: 'TLS using RSA-2048' }))
    expect(m.filter((x) => x.protocol === 'TLS / HTTPS')).toHaveLength(1)
    expect(m.find((x) => x.protocol === 'TLS / HTTPS')?.basis).toBe('stated')
  })

  it('does not infer a protocol from AES or SHA', () => {
    // Every protocol uses them, so a match would return everything — a lens
    // that returns everything is worse than no lens.
    const m = protocolsForThreat(threat({ cryptoAtRisk: 'AES-256; SHA-256' }))
    expect(m).toEqual([])
  })

  it('never offers a filter that returns nothing on the live corpus', () => {
    for (const p of LENS_PROTOCOLS) {
      const hits = threatsData.filter((t) => threatTouchesProtocol(t, p))
      expect(hits.length, `protocol "${p}" matches no active threat`).toBeGreaterThan(0)
    }
  })

  it('keeps a real mix of stated and inferred across the corpus', () => {
    // If everything came back one way, the disclosure the UI shows would be
    // describing a distinction that no longer exists.
    let stated = 0
    let inferred = 0
    for (const t of threatsData) {
      for (const m of protocolsForThreat(t)) {
        if (m.basis === 'stated') stated += 1
        else inferred += 1
      }
    }
    expect(stated).toBeGreaterThan(0)
    expect(inferred).toBeGreaterThan(0)
  })
})
