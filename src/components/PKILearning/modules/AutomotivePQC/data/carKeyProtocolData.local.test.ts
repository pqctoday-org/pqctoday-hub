// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  SAMPLE_CHALLENGE_BYTES,
  buildCarKeyFlow,
  fragmentCount,
  summarizeCarKeyFlow,
  type CarKeyMessage,
  type OwnerCertRoute,
  type RadioScenario,
} from './carKeyProtocolData'

function rows(
  overrides: Partial<{
    challengeBytes: number
    ownerCertRoute: OwnerCertRoute
    radio: RadioScenario
  }> = {}
): CarKeyMessage[] {
  return buildCarKeyFlow({
    challengeBytes: 32,
    ownerCertRoute: 'direct-carmaker',
    radio: 'nfc',
    ...overrides,
  })
}

describe('car key flow: payload accounting', () => {
  it('counts both ML-KEM directions and fragments each message separately (5 + 5, not 9)', () => {
    const kem = rows().filter((m) => m.id === 'owner-kex-public' || m.id === 'owner-kex-return')
    const x = summarizeCarKeyFlow(kem, 'pqc')
    expect(x.totalBytes).toBe(1184 + 1088)
    expect(x.totalBytes).toBe(2272)
    expect(x.transports.nfc?.payloadFragments).toBe(10)
    expect(Math.ceil(2272 / 256)).toBe(9)
    expect(fragmentCount('nfc', 1184)).toBe(5)
    expect(fragmentCount('nfc', 1088)).toBe(5)
    expect(kem.map((m) => [m.fromActor, m.toActor])).toEqual([
      ['device', 'vehicle'],
      ['vehicle', 'device'],
    ])
  })

  it('pins the whole-flow totals: 2,164 bytes classical and 38,604 bytes PQC', () => {
    const flow = rows()
    const c = summarizeCarKeyFlow(flow, 'classical')
    const p = summarizeCarKeyFlow(flow, 'pqc')
    expect(c.totalBytes).toBe(2164)
    expect(p.totalBytes).toBe(38604)
    expect(c.transports.nfc?.bytes).toBe(624)
    expect(c.transports.network?.bytes).toBe(1540)
    expect(p.transports.nfc?.bytes).toBe(13248)
    expect(p.transports.network?.bytes).toBe(25356)
    expect(p.transports.nfc?.payloadFragments).toBe(57)
    expect(p.transports.network?.payloadFragments).toBeNull()
    expect(c.serialServiceMs).toBeNull()
    expect(p.serialServiceMs).toBeNull()
  })

  it('moves bytes between network and radio on the phone-relay route without changing the total', () => {
    const p = summarizeCarKeyFlow(rows({ ownerCertRoute: 'phone-relay' }), 'pqc')
    expect(p.totalBytes).toBe(38604)
    expect(p.transports.nfc?.bytes).toBe(16992)
    expect(p.transports.network?.bytes).toBe(21612)
    expect(p.transports.network?.messages).toBe(4)
  })

  it('adds only the ranging message on UWB and keeps credential messages on BLE', () => {
    const flow = rows({ radio: 'ble+uwb' })
    expect(flow.filter((m) => m.transport === 'uwb').map((m) => m.id)).toEqual(['ranging'])
    expect(summarizeCarKeyFlow(flow, 'pqc').totalBytes).toBe(38620)
    expect(flow.filter((m) => m.id.includes('kex')).every((m) => m.transport === 'ble')).toBe(true)
  })

  it('never lists a locally derived key or a radio discovery event as a transmitted message', () => {
    const flow = rows()
    expect(flow).toHaveLength(14)
    expect(flow.some((m) => /kdf|derivation|discovery|proximity/i.test(m.id))).toBe(false)
  })

  it('has two explicit owner-certificate recipients and explicit friend certificate forwarding', () => {
    const flow = rows()
    const toPhone = flow.find((m) => m.id === 'owner-cert-phone')!
    const toVehicle = flow.find((m) => m.id === 'owner-cert-vehicle')!
    expect([toPhone.toActor, toVehicle.toActor]).toEqual(['device', 'vehicle'])
    expect([toPhone.fromActor, toVehicle.fromActor]).toEqual(['oem-server', 'oem-server'])
    const forward = flow.find((m) => m.id === 'friend-cert-forward')!
    expect([forward.fromActor, forward.toActor]).toEqual(['friend-device', 'vehicle'])
  })

  it('uses a 32-byte request, a distinct vehicle-to-phone message from the signed response', () => {
    expect(SAMPLE_CHALLENGE_BYTES).toBe(32)
    const flow = rows()
    const request = flow.find((m) => m.id === 'owner-challenge')!
    const response = flow.find((m) => m.id === 'owner-response')!
    expect([request.fromActor, request.toActor]).toEqual(['vehicle', 'device'])
    expect([response.fromActor, response.toActor]).toEqual(['device', 'vehicle'])
    expect(request.pqcBytes).toBe(32)
  })

  it('shows a changed request length and the fragment boundary it crosses', () => {
    const x = summarizeCarKeyFlow(rows(), 'pqc')
    const y = summarizeCarKeyFlow(rows({ challengeBytes: 257 }), 'pqc')
    expect(y.totalBytes - x.totalBytes).toBe(450)
    expect(
      (y.transports.nfc?.payloadFragments ?? 0) - (x.transports.nfc?.payloadFragments ?? 0)
    ).toBe(2)
  })

  it('refuses invalid choices instead of defaulting', () => {
    for (const challengeBytes of [0, -1, 1.5, Number.NaN]) {
      expect(() => rows({ challengeBytes })).toThrow()
    }
    expect(() => rows({ ownerCertRoute: 'unknown' as OwnerCertRoute })).toThrow()
    expect(() => rows({ radio: 'uwb' as RadioScenario })).toThrow()
    expect(() => rows({ radio: undefined as unknown as RadioScenario })).toThrow()
  })

  it('shows no elapsed time without a complete, positive service profile', () => {
    const flow = rows()
    for (const rates of [
      { nfc: 200 },
      { nfc: 200, network: 0 },
      { nfc: Number.POSITIVE_INFINITY, network: 1 },
      { nfc: 200, network: 1, uwb: 10 },
    ]) {
      expect(() => summarizeCarKeyFlow(flow, 'pqc', rates)).toThrow()
    }
    // Synthetic unit rates only: they prove the formula, they are not proposed values.
    const x = summarizeCarKeyFlow(flow, 'pqc', { nfc: 1, network: 1 })
    expect(x.serialServiceMs).toBe((x.transports.nfc?.payloadFragments ?? 0) + 5)
    const slow = summarizeCarKeyFlow(flow, 'pqc', { nfc: 2, network: 10 })
    expect(slow.serialServiceMs).toBe(2 * 57 + 10 * 5)
  })

  it('refuses duplicate messages and does not depend on message order', () => {
    const flow = rows()
    expect(() => summarizeCarKeyFlow([...flow, flow[0]], 'pqc')).toThrow()
    expect(summarizeCarKeyFlow(flow, 'pqc')).toEqual(
      summarizeCarKeyFlow([...flow].reverse(), 'pqc')
    )
  })
})
