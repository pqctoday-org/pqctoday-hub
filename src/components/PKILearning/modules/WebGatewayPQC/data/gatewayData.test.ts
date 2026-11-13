// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  TLS_MODES,
  GATEWAY_BENCHMARKS,
  GATEWAY_FIGURES_NOTE,
  HANDSHAKE_MITIGATIONS_NOTE,
  ALL_SEGMENTS_PQC_NOTE,
  analyzeTopology,
  type TopologyConnection,
} from './gatewayData'

const conns = (...modes: TopologyConnection['mode'][]): TopologyConnection[] =>
  modes.map((mode, i) => ({ from: `n${i}`, to: `n${i + 1}`, mode }))

describe('TLS passthrough in the topology analysis', () => {
  it('is not marked quantum-vulnerable or quantum-safe: the endpoints decide', () => {
    const pass = TLS_MODES.find((m) => m.id === 'passthrough')
    expect(pass?.quantumSafe).toBeNull()
    expect(pass?.description).toMatch(/negotiate the key exchange and authentication end to end/)
    expect(pass?.description).toMatch(/which this topology does not show/)
  })

  it('does not count a passthrough segment as vulnerable, and leaves the exposure unresolved', () => {
    const a = analyzeTopology(conns('passthrough'))
    expect(a.vulnerableSegments).toBe(0)
    expect(a.unresolvedSegments).toBe(1)
    expect(a.hndlExposure).toBe('unresolved')
    expect(a.recommendations.join(' ')).not.toMatch(/All segments are quantum-safe/)
    expect(a.recommendations.join(' ')).toMatch(
      /negotiate the key exchange and authentication end to end/
    )
    // a passthrough front hop does not trigger the "upgrade the client-facing connection" advice
    expect(a.recommendations.join(' ')).not.toMatch(/Upgrade the client-facing connection/)
  })

  it('still counts known-classical segments as vulnerable next to a passthrough segment', () => {
    const a = analyzeTopology(conns('passthrough', 'classical-tls13'))
    expect(a.vulnerableSegments).toBe(1)
    expect(a.unresolvedSegments).toBe(1)
    expect(a.hndlExposure).toBe('medium')
    const known = analyzeTopology(conns('classical-tls13', 'pqc-hybrid'))
    expect(known.unresolvedSegments).toBe(0)
    expect(known.recommendations.join(' ')).toMatch(/Upgrade the client-facing connection/)
  })

  it('keeps a fully post-quantum topology low and passthrough-free counts unchanged', () => {
    const a = analyzeTopology(conns('pqc-hybrid', 'mtls-pqc-hybrid'))
    expect(a).toMatchObject({ vulnerableSegments: 0, unresolvedSegments: 0, hndlExposure: 'low' })
  })
})

describe('illustrative gateway figures', () => {
  it('does not attribute capacity numbers to named vendor products', () => {
    const names = GATEWAY_BENCHMARKS.map((b) => b.name).join(' ')
    expect(names).not.toMatch(/F5|BIG-IP|NGINX|HAProxy|Envoy|AWS|ALB/)
    for (const b of GATEWAY_BENCHMARKS) {
      expect(b.name).toMatch(/\(illustrative\)/)
      expect(b.notes).toMatch(/^Illustrative figure/)
    }
  })

  it('states that no benchmark source or test conditions exist and tells the learner to measure', () => {
    expect(GATEWAY_FIGURES_NOTE).toMatch(/not measurements or vendor specifications/)
    expect(GATEWAY_FIGURES_NOTE).toMatch(/no benchmark source or test conditions are supplied/)
    expect(GATEWAY_FIGURES_NOTE).toMatch(/instead of assuming a uniform buffer size or performance/)
    expect(HANDSHAKE_MITIGATIONS_NOTE).toMatch(/exact captured messages/)
  })
})

describe('a topology where every segment uses a PQC mode', () => {
  it('says what the modes cover (the key exchange) and does not claim the whole path is quantum-safe', () => {
    const a = analyzeTopology(conns('pqc-hybrid', 'mtls-pqc-hybrid'))
    expect(a.vulnerableSegments).toBe(0)
    expect(a.unresolvedSegments).toBe(0)
    expect(a.recommendations).toContain(ALL_SEGMENTS_PQC_NOTE)
    expect(ALL_SEGMENTS_PQC_NOTE).toMatch(/covers the key exchange/)
    expect(ALL_SEGMENTS_PQC_NOTE).toMatch(/certificates and signatures separately/)
    expect(ALL_SEGMENTS_PQC_NOTE).not.toMatch(/quantum-safe/i)
  })
})
