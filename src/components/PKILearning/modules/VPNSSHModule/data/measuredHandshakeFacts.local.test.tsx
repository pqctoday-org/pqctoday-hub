// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import captures from './tlsMeasuredSamples.json'
import { MEASURED_HANDSHAKE_FACTS } from './measuredHandshakeFacts'
import { TERMINATION_PATTERNS } from '../../WebGatewayPQC/data/gatewayData'
import { TLSTerminationPatterns } from '../../WebGatewayPQC/workshop/TLSTerminationPatterns'
import { TLSInspectionLab } from '../../NetworkSecurityPQC/workshop/TLSInspectionLab'
import { NetworkSecurityIntroduction } from '../../NetworkSecurityPQC/components/NetworkSecurityIntroduction'
import { CIPHER_SUITES, TRAFFIC_TYPES } from '../../NetworkSecurityPQC/data/networkConstants'
import { OPS_QUANTUM_EXERCISES } from '../../OpsQuantumImpact/exercises'
import { OPS_GUIDE_DATA } from '../../OpsQuantumImpact/data'
import scenarios from '../../TLSBasics/data/tls-scenarios.json'

const sources = import.meta.glob(
  [
    '../../{TLSBasics,WebGatewayPQC,NetworkSecurityPQC,OpsQuantumImpact}/**/*.{ts,tsx,md,json}',
    '!**/*.test.*',
    '!**/*.kat.json',
    '!**/defaultCertificates.ts',
    '!**/__snapshots__/**',
  ],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

const total = (name: string) => captures.profiles.find((p) => p.name === name)!.totalBytes

describe('handshake figures in the TLS, gateway, network and operations lessons', () => {
  it('quote the capture file totals', () => {
    expect([total('classical'), total('hybrid'), total('pqc')]).toEqual([2233, 4499, 16944])
    expect(MEASURED_HANDSHAKE_FACTS.hybrid.serverHelloBytes).toBe(1178)
    const text = JSON.stringify(scenarios)
    for (const n of ['2,233', '4,499', '16,944', '2,266', '1,642', '11,100']) {
      expect(text).toContain(n)
    }
    const mdFiles = ['TLSBasics', 'NetworkSecurityPQC'].map(
      (m) => sources[`../../${m}/rag-summary.md`]
    )
    for (const md of mdFiles) for (const n of ['2,233', '4,499', '16,944']) expect(md).toContain(n)
  })

  it('gateway termination bytes are the capture totals times the TLS sessions shown', () => {
    for (const p of TERMINATION_PATTERNS) {
      expect(p).not.toHaveProperty('latencyOverheadMs')
      expect(p.bandwidthOverheadBytes.classical).toBe(p.tlsSessions * total('classical'))
      expect(p.bandwidthOverheadBytes.pqcHybrid).toBe(p.tlsSessions * total('hybrid'))
    }
  })

  it('gateway, inspection lab and network intro show no millisecond or latency figure', () => {
    const gateway = render(<TLSTerminationPatterns />).container.textContent ?? ''
    expect(gateway).not.toMatch(/\d\s?ms\b/)
    expect(gateway).not.toMatch(/\bLatency\b/)
    expect(gateway).toContain('Handshake bytes')
    const lab = render(<TLSInspectionLab />).container.textContent ?? ''
    expect(lab).not.toMatch(/\d\s?ms\b/)
    expect(lab).not.toMatch(/Latency/)
    for (const n of ['2,233', '4,499', '16,944']) expect(lab).toContain(n)
    const intro =
      render(
        <MemoryRouter>
          <NetworkSecurityIntroduction onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      ).container.textContent ?? ''
    expect(intro).not.toMatch(/\d\s?ms\b/)
    expect(intro).toContain('16,944')
  })

  it('simulation data carries no handshake time and operations text uses captured sizes', () => {
    for (const suite of CIPHER_SUITES) expect(suite).not.toHaveProperty('handshakeMs')
    for (const t of TRAFFIC_TYPES) expect(t).not.toHaveProperty('latencyImpact')
    const ex = OPS_QUANTUM_EXERCISES.find((e) => e.prompt.includes('handshake alerts'))!
    for (const n of ['2,233', '4,499', '16,944']) expect(ex.prompt).toContain(n)
    expect(JSON.stringify(OPS_GUIDE_DATA)).toContain('1,178 bytes more in the ClientHello')
  })

  it('no source text in the four modules states a millisecond latency or an approximate handshake size', () => {
    const files = Object.entries(sources)
    expect(files.length).toBeGreaterThan(40)
    for (const [file, body] of files) {
      expect(body, file).not.toMatch(/(?<![\w.])\d+(\.\d+)?\s?ms\b(?!\w)/)
      expect(body, file).not.toMatch(/handshake[^.\n]{0,40}~\s?(4|5|15|25)\s?KB/i)
      expect(body, file).not.toMatch(/~\s?(4|5|15|25)\s?KB[^.\n]{0,60}handshake/i)
      expect(body, file).not.toMatch(/\b(handshake|latency)\b[^.\n]{0,30}~\s?\d+\s?ms/i)
    }
  })
})
