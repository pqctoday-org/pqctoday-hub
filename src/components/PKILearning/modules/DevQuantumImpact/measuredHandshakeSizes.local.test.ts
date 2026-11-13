// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import captures from '../VPNSSHModule/data/tlsMeasuredSamples.json'
import { tlsSample } from '../VPNSSHModule/data/measuredTlsHandshake'
import { MEASURED_HANDSHAKE_FACTS, formatBytes } from '../VPNSSHModule/data/measuredHandshakeFacts'
import { DEV_GUIDE_DATA } from './data'
import { ARCH_GUIDE_DATA } from '../ArchQuantumImpact/data'
import devContent from './content.ts?raw'
import devRag from './rag-summary.md?raw'
import devCurious from './curious-summary.md?raw'
import archContent from '../ArchQuantumImpact/content.ts?raw'
import archRag from '../ArchQuantumImpact/rag-summary.md?raw'
import archCurious from '../ArchQuantumImpact/curious-summary.md?raw'

const impact = (data: typeof DEV_GUIDE_DATA, id: string) =>
  data.threatImpacts.find((entry) => entry.id === id)!
const text = (value: unknown) => JSON.stringify(value)

/** Every lesson surface the two role modules show or feed to search and chat. */
const surfaces: Record<string, string> = {
  'developer guide data': text(DEV_GUIDE_DATA),
  'architect guide data': text(ARCH_GUIDE_DATA),
  'developer content': devContent,
  'architect content': archContent,
  'developer rag summary': devRag,
  'architect rag summary': archRag,
  'developer curious summary': devCurious,
  'architect curious summary': archCurious,
}

describe('role lesson handshake sizes come from the capture', () => {
  it('reads 2,233 / 4,499 / 16,944 bytes and the 1,642-byte RSA certificate message', () => {
    const f = MEASURED_HANDSHAKE_FACTS
    expect([f.classical.totalBytes, f.hybrid.totalBytes, f.pqc.totalBytes]).toEqual([
      2233, 4499, 16944,
    ])
    expect(f.classical.certificateMessageBytes).toBe(1642)
    expect(f.hybrid.certificateMessageBytes).toBe(1642)
    expect(f.messageCount).toBe(7)
    // Independent route: decode every captured message and add them up.
    expect(tlsSample('classical').totalBytes).toBe(f.classical.totalBytes)
    expect(tlsSample('hybrid').totalBytes).toBe(f.hybrid.totalBytes)
    expect(tlsSample('pure-pqc').totalBytes).toBe(f.pqc.totalBytes)
    expect(tlsSample('classical').messages.at(3)!.bytes).toBe(f.classical.certificateMessageBytes)
  })

  it('labels the three cases exactly as the capture does', () => {
    const f = MEASURED_HANDSHAKE_FACTS
    expect(captures.profiles.map((p) => p.authentication)).toEqual([
      'RSA-2048',
      'RSA-2048',
      'ML-DSA-65',
    ])
    expect(f.classical.label).toBe('X25519 with RSA-2048')
    expect(f.hybrid.label).toBe('X25519MLKEM768 with RSA-2048')
    expect(f.pqc.label).toBe('ML-KEM-768 with ML-DSA-65')
  })

  it('shows those capture values on the developer TLS card and the architect budget card', () => {
    const f = MEASURED_HANDSHAKE_FACTS
    const dev = impact(DEV_GUIDE_DATA, 'tls-handshake')
    const devText = `${dev.description} ${dev.exampleScenario}`
    for (const bytes of [f.classical.totalBytes, f.hybrid.totalBytes, f.pqc.totalBytes]) {
      expect(devText).toContain(formatBytes(bytes))
    }
    for (const label of [f.classical.label, f.hybrid.label, f.pqc.label]) {
      expect(devText).toContain(label)
    }
    expect(devText).toContain('fictional')
    expect(devText).toMatch(/No handshake time was measured/)

    const arch = impact(ARCH_GUIDE_DATA, 'performance-budgets')
    for (const bytes of [
      f.classical.totalBytes,
      f.hybrid.totalBytes,
      f.pqc.totalBytes,
      f.hybrid.certificateMessageBytes,
      f.pqc.certificateMessageBytes,
    ]) {
      expect(arch.exampleScenario).toContain(formatBytes(bytes))
    }
    expect(arch.exampleScenario).toMatch(/No handshake time was measured/)
  })

  it('states the same totals in each role summary used for search and chat', () => {
    for (const file of [devRag, archRag]) {
      for (const total of ['2,233', '4,499', '16,944']) expect(file).toContain(total)
    }
    expect(archRag).toContain('1,642')
    expect(archRag).toContain('11,100')
  })
})

describe('role lessons carry no invented latency or approximate handshake sizes', () => {
  it.each(Object.entries(surfaces))('%s has no millisecond figure', (_name, body) => {
    expect(body).not.toMatch(/\d\s?ms\b/i)
    expect(body).not.toMatch(/\d\s?milliseconds?\b/i)
  })

  it.each(Object.entries(surfaces))('%s mentions P50 or P99 only to disclaim it', (_name, body) => {
    for (const hit of body.matchAll(/P50|P99/gi)) {
      const before = body.slice(Math.max(0, hit.index! - 90), hit.index)
      expect(before, `un-negated percentile near: ${before}`).toMatch(
        /\b(not|no|nor|never|without|does not|do not|did not)\b|\bnot a\b/i
      )
    }
  })

  it('no longer quotes the old approximate handshake payloads', () => {
    for (const body of Object.values(surfaces)) {
      expect(body).not.toMatch(/handshake[^.\n]{0,40}~\s?(5|15|25)\s?KB/i)
      expect(body).not.toMatch(/~\s?(5|15|25)\s?KB[^.\n]{0,60}handshake/i)
      expect(body).not.toMatch(/adds ~1\s?KB/i)
      expect(body).not.toMatch(/classical[^.\n]{0,40}~3 KB/i)
    }
  })
})
