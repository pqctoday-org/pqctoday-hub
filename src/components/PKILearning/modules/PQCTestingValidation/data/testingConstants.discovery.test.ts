// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PASSIVE_OBSERVATIONS, SCAN_RESULTS } from './testingConstants'

describe('passive discovery observations: not observed is not the same as not supported', () => {
  const all = Object.values(PASSIVE_OBSERVATIONS).flat()
  const byId = (id: string) => all.find((o) => o.id === id)!

  it('a flow without a hybrid exchange says support is unknown, not that the endpoint lacks it', () => {
    const d = byId('obs-cloud-2').details
    expect(d).toMatch(/hybrid key exchange was not observed/i)
    expect(d).toMatch(/unknown from this capture/)
    expect(d).not.toMatch(/does not support hybrid/)
  })

  it('an encrypted TLS 1.3 flow explains why a passive tap cannot see the certificate chain', () => {
    const o = byId('obs-cloud-3')
    expect(o.quantumSafe).toBe('unknown')
    expect(o.details).toMatch(/hybrid was not observed and support is unknown/)
    expect(o.details).toMatch(/TLS 1\.3 encrypts the Certificate message/)
    expect(o.details).toMatch(/endpoint telemetry/)
  })

  it('no observation turns an absent hybrid exchange into a requirement', () => {
    expect(byId('obs-wan-3').details).not.toMatch(/Upgrade to hybrid required/)
  })
})

describe('active scan results: TLS 1.2 is not deprecated and BEAST is a TLS 1.0 CBC issue', () => {
  const t3 = SCAN_RESULTS.t3
  const t7 = SCAN_RESULTS.t7

  it('reports static RSA lack of forward secrecy and CBC implementation risk for TLS 1.2, without calling it deprecated or BEAST-prone', () => {
    const v = t3.vulnerabilities.join(' | ')
    expect(t3.tlsVersion).toBe('TLS 1.2')
    expect(v).not.toMatch(/deprecated/i)
    expect(v).not.toMatch(/BEAST/)
    expect(v).toMatch(/no forward secrecy/)
    expect(v).toMatch(/Lucky Thirteen/)
    expect(t3.recommendation).toMatch(/TLS 1\.2 itself is not deprecated/)
    expect(t3.recommendation).toMatch(/RFC 8996 deprecates TLS 1\.0 and 1\.1/)
  })

  it('keeps the end-of-life label for TLS 1.1', () => {
    expect(t7.tlsVersion).toBe('TLS 1.1')
    expect(t7.vulnerabilities.join(' ')).toMatch(/TLS 1\.1/)
  })
})
