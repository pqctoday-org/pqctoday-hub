// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { computeCertificateCapacity, CERT_CAPACITY_DEFAULTS } from './certCapacityDefaults'

const inputs = { certCount: 1000, renewalDays: 240, handshakesPerSec: 100, templateBytes: 512 }

describe('certificate educational size model', () => {
  it('uses encoded SPKI lengths, not raw-key lengths, without double-counting', () => {
    // DER encodings independently cross-checked against native OpenSSL SPKI exports.
    expect(CERT_CAPACITY_DEFAULTS.map((a) => a.publicKeyBytes + a.publicKeyEncodingBytes)).toEqual([
      294, 91, 1334, 1974, 2614,
    ])
  })
  it('transmits exactly intermediate + leaf, with just one server signature', () => {
    const row = computeCertificateCapacity(inputs).find((r) => r.algorithm === 'ML-DSA-65')!
    expect(row.certificateBytes).toBe(1952 + 22 + 3309 + 512)
    expect(row.chainBytes).toBe(11590)
    expect(row.payloadBytes).toBe(14899)
    expect(row.payloadKiB).toBe(14899 / 1024)
    expect(row.aggregateMiBPerSec).toBe(1489900 / 1048576)
  })
  it('counts fractional renewals and annual leaf issuance only at 240 days', () => {
    const row = computeCertificateCapacity(inputs)[1]
    expect(row.certificateBytes).toBe(675)
    expect(row.renewalsPerYear).toBe(365 / 240)
    expect(row.storageMiB).toBeCloseTo((1000 * 675 * (365 / 240)) / 1048576, 12)
  })
  it('changes smoothly across renewal intervals instead of rounding annual counts', () => {
    const storage = [239, 240, 241].map(
      (renewalDays) => computeCertificateCapacity({ ...inputs, renewalDays })[0].storageMiB
    )
    expect(storage[0]).toBeGreaterThan(storage[1])
    expect(storage[1]).toBeGreaterThan(storage[2])
    expect(storage[0] / storage[1]).toBeCloseTo(240 / 239, 12)
  })
  it('keeps storage, traffic and template changes independent', () => {
    const base = computeCertificateCapacity(inputs)
    const more = computeCertificateCapacity({
      ...inputs,
      handshakesPerSec: 200,
      templateBytes: 612,
    })
    more.forEach((r, i) => {
      expect(r.certificateBytes - base[i].certificateBytes).toBe(100)
      expect(r.payloadBytes - base[i].payloadBytes).toBe(200)
    })
    const zero = computeCertificateCapacity({ ...inputs, certCount: 0, handshakesPerSec: 0 })
    expect(zero.every((r) => r.storageMiB === 0 && r.aggregateMiBPerSec === 0)).toBe(true)
    expect(zero[0].payloadBytes).toBe(base[0].payloadBytes)
  })
  it.each([
    { renewalDays: 0 },
    { renewalDays: -1 },
    { renewalDays: NaN },
    { certCount: -1 },
    { certCount: 0.5 },
    { templateBytes: Infinity },
    { handshakesPerSec: -1 },
    { handshakesPerSec: Number.MAX_VALUE },
    { renewalDays: Number.MIN_VALUE },
  ])('rejects invalid input %j', (bad) => {
    expect(() => computeCertificateCapacity({ ...inputs, ...bad })).toThrow(RangeError)
  })
})
