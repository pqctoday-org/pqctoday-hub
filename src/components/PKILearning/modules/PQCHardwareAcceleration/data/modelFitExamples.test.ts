// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  exactLimbExample,
  measuredGpuBatchComparison,
  measuredOffloadPartition,
} from './modelFitExamples'
import { GPU_BATCH, OFFLOAD_ROUND_TRIP } from './measurements'

describe('Implementation-scoped hardware fit examples', () => {
  it('keeps the measured all-core CPU win and both measured GPU wins without a batch-1 extrapolation', () => {
    expect(measuredGpuBatchComparison(1)).toBeNull()
    expect(measuredGpuBatchComparison(256)?.gpuVsAllCpu).toBeCloseTo(82 / 152, 12)
    expect(measuredGpuBatchComparison(4096)?.gpuVsAllCpu).toBeCloseTo(975 / 166, 12)
    expect(measuredGpuBatchComparison(65536)?.gpuVsAllCpu).toBeCloseTo(1705 / 184, 12)
    expect(measuredGpuBatchComparison(256)!.gpuBatchMs).toBeGreaterThan(
      measuredGpuBatchComparison(256)!.cpuBatchMs
    )
    expect(measuredGpuBatchComparison(65536)!.gpuBatchMs).toBeLessThan(
      measuredGpuBatchComparison(65536)!.cpuBatchMs
    )
    for (const row of GPU_BATCH.keygen) {
      const calculated = measuredGpuBatchComparison(row.batch)!
      expect(calculated.gpuBatchMs * row.gpu * 1000).toBeCloseTo(row.batch, 8)
    }
  })

  it('executes exact byte-limb representation while the single-byte encoding loses information', () => {
    const example = exactLimbExample()
    expect(example.value).toBe(8_380_416n)
    expect(example.limbs).toEqual([0n, 224n, 127n])
    expect(example.limbs.every((limb) => limb >= 0n && limb <= 255n)).toBe(true)
    expect(example.recomposed).toBe(8_380_416n)
    expect(example.oneByteOnly).toBe(0n)
    expect(example.oneByteOnly).not.toBe(example.value)
    expect(example.partialProducts).toHaveLength(9)
    expect(example.product).toBe(8_380_416n * 8_380_416n)
    expect(example.product % 8_380_417n).toBe(1n)
    expect(example.residue).toBe(1n)
    // Dropping all but the lowest byte-pair is not the same computation.
    expect(example.partialProducts[0].value).not.toBe(example.product)
  })

  it('retains the measured slow partition rather than treating a working offload as automatically beneficial', () => {
    expect(measuredOffloadPartition()).toEqual({ jobs: 30, cpuUs: 359, offloadUs: 3242 })
    expect(OFFLOAD_ROUND_TRIP.fixedUs).toBe(1481)
    expect(OFFLOAD_ROUND_TRIP.perJobUs).toBe(58.7)
  })
})
