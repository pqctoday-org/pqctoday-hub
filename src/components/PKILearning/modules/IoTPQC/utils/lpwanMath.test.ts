// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { firmwareAirtime, loraTimeOnAirSeconds, type FirmwareAirtimeInput } from './lpwanMath'

const base: FirmwareAirtimeInput = {
  techId: 'wisun-fsk',
  firmwareBytes: 150 * 1024,
  signatureBytes: 4627, // ML-DSA-87
  keyBytes: 0,
  devicesPerCell: 1000,
  multicast: false,
  hops: 3,
  windowHours: 24,
}

describe('firmwareAirtime', () => {
  it('the signature is a few percent of a firmware update (firmware ≈ 97% of the bytes)', () => {
    const r = firmwareAirtime(base)
    expect(r.signatureShare).toBeGreaterThan(0.02)
    expect(r.signatureShare).toBeLessThan(0.04)
  })

  it('an update that misses its window with PQC also misses it with ECDSA (the old "PQC collapse" lesson was wrong)', () => {
    const pqc = firmwareAirtime({ ...base, techId: 'nbiot', devicesPerCell: 2000 })
    const ecdsa = firmwareAirtime({
      ...base,
      techId: 'nbiot',
      devicesPerCell: 2000,
      signatureBytes: 64,
    })
    expect(pqc.fitsWindow).toBe(false)
    expect(ecdsa.fitsWindow).toBe(false)
    expect(pqc.cellHours / ecdsa.cellHours).toBeLessThan(1.05)
  })

  it('multicast, not the signature, is the lever', () => {
    const uni = firmwareAirtime({ ...base, techId: 'nbiot', devicesPerCell: 2000 })
    const multi = firmwareAirtime({
      ...base,
      techId: 'nbiot',
      devicesPerCell: 2000,
      multicast: true,
    })
    expect(multi.copies).toBe(1)
    expect(uni.cellHours / multi.cellHours).toBeCloseTo(2000, 0)
    expect(multi.fitsWindow).toBe(true)
  })

  it('Wi-SUN FAN 1.1 OFDM is faster than FSK, and hops divide mesh throughput', () => {
    const fsk = firmwareAirtime(base)
    const ofdm = firmwareAirtime({ ...base, techId: 'wisun-ofdm' })
    expect(ofdm.secondsPerCopy).toBeLessThan(fsk.secondsPerCopy)
    const oneHop = firmwareAirtime({ ...base, hops: 1 })
    expect(fsk.secondsPerCopy / oneHop.secondsPerCopy).toBeCloseTo(3, 5)
  })

  it('hops do not apply to cellular NB-IoT', () => {
    const a = firmwareAirtime({ ...base, techId: 'nbiot', hops: 1 })
    const b = firmwareAirtime({ ...base, techId: 'nbiot', hops: 5 })
    expect(a.secondsPerCopy).toBe(b.secondsPerCopy)
  })

  it('LoRaWAN splits into 222-byte frames and applies the 1% duty cycle', () => {
    const r = firmwareAirtime({ ...base, techId: 'lorawan', multicast: true })
    expect(r.frames).toBe(Math.ceil((150 * 1024 + 4627) / 222))
    expect(r.dutyCycleHours! / r.cellHours).toBeCloseTo(100, 5)
  })

  it('rejects invalid parameters', () => {
    expect(() => firmwareAirtime({ ...base, firmwareBytes: -1 })).toThrow()
    expect(() => firmwareAirtime({ ...base, devicesPerCell: 0 })).toThrow()
    expect(() => firmwareAirtime({ ...base, hops: 0 })).toThrow()
  })
})

describe('loraTimeOnAirSeconds', () => {
  it('matches the AN1200.13 formula for SF7/125 kHz', () => {
    // 235 B PHY payload (222 B + 13 B MAC): 8 + ceil((1880-28+28+16)/28)*5 = 8 + 68*5 = 348 symbols payload
    // (8 + 4.25 + 348) symbols * 1.024 ms
    expect(loraTimeOnAirSeconds(235)).toBeCloseTo((8 + 4.25 + 348) * (128 / 125_000), 9)
  })

  it('SF12 is far slower than SF7 and uses low-data-rate optimisation', () => {
    expect(loraTimeOnAirSeconds(64, 12)).toBeGreaterThan(20 * loraTimeOnAirSeconds(64, 7))
  })
})
