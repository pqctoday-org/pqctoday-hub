// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  getScenario39Ranked,
  getScenario39Scaling,
  SCENARIO39_OPERATIONS,
  SCENARIO39_PLATFORM_ORDER,
  SCENARIO39_PLATFORMS,
  X1_ISA_RESULTS,
} from './scenario39'

describe('Scenario 39 common CPU benchmark snapshot', () => {
  it('has a positive one-worker and whole-platform measurement for every platform and operation', () => {
    expect(SCENARIO39_PLATFORM_ORDER).toHaveLength(7)
    expect(SCENARIO39_OPERATIONS).toHaveLength(6)

    for (const operation of SCENARIO39_OPERATIONS) {
      for (const platformId of SCENARIO39_PLATFORM_ORDER) {
        expect(operation.oneWorker[platformId]).toBeGreaterThan(0) // eslint-disable-line security/detect-object-injection
        expect(operation.wholePlatform[platformId]).toBeGreaterThan(0) // eslint-disable-line security/detect-object-injection
      }
    }
  })

  it('keeps the current CPU comparison separate from the historical KV260 FPGA study', () => {
    expect(SCENARIO39_PLATFORMS.kv260.note).toMatch(/CPU PKCS#11 path only/i)
    expect(SCENARIO39_PLATFORMS.ventunoQ.note).toMatch(/GPU\/NPU is not measured/i)
  })

  it('derives a deterministic ranking and scaling ratio from the matching profile', () => {
    const operation = SCENARIO39_OPERATIONS.find((item) => item.id === 'hybridKemEncap')!
    const ranked = getScenario39Ranked(operation, 'wholePlatform')

    expect(ranked.map((item) => item.platform.id)).toEqual([
      'm4Pro',
      'm5Max',
      'x1Pro',
      'ventunoQ',
      'mx95',
      'mx95Pro',
      'kv260',
    ])
    expect(getScenario39Scaling(operation, 'x1Pro')).toBeCloseTo(3.48, 2)
  })

  it('retains both successful and rejected X1 instruction-set evidence', () => {
    expect(X1_ISA_RESULTS.some((item) => item.status === 'measured')).toBe(true)
    expect(X1_ISA_RESULTS.find((item) => item.feature === 'VAES-256 and VAES-512')?.status).toBe(
      'rejected'
    )
  })
})
