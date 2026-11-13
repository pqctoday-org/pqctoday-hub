// SPDX-License-Identifier: AGPL-3.0-only
import { GPU_BATCH, OFFLOAD_ROUND_TRIP } from './measurements'

/** Derived comparisons of the retained Metal ML-DSA-65 key-generation study.
 * Throughput and aggregate batch time do not measure an individual key's latency.
 */
export function measuredGpuBatchComparison(batch: number) {
  const row = GPU_BATCH.keygen.find((sample) => sample.batch === batch)
  if (!row) return null
  return {
    ...row,
    gpuVsAllCpu: row.gpu / row.cpuAll,
    cpuBatchMs: (batch / (row.cpuAll * 1_000_000)) * 1000,
    gpuBatchMs: (batch / (row.gpu * 1_000_000)) * 1000,
  }
}

/** Exact arithmetic teaching example, not an NTT/kernel implementation.
 * q is the existing ML-DSA modulus; q−1 exposes information lost by keeping
 * only one byte. Unsigned byte limbs here are a mathematical representation,
 * not a claim that a selected NPU supports those types or this execution graph.
 */
export function exactLimbExample() {
  const q = 8_380_417n
  const value = q - 1n
  const radix = 256n
  const limbs = [value % radix, (value / radix) % radix, value / (radix * radix)]
  const recomposed = limbs.reduce((sum, limb, i) => sum + limb * radix ** BigInt(i), 0n)
  const partialProducts = limbs.flatMap((a, i) =>
    limbs.map((b, j) => ({ a, b, weight: radix ** BigInt(i + j), value: a * b }))
  )
  const product = partialProducts.reduce((sum, term) => sum + term.value * term.weight, 0n)
  return {
    q,
    value,
    radix,
    limbs,
    recomposed,
    partialProducts,
    product,
    residue: product % q,
    oneByteOnly: value % radix,
  }
}

/** Existing measured partition: correctness can coexist with losing performance.
 * No new timing constant or NPU performance estimate is introduced.
 */
export function measuredOffloadPartition() {
  const jobs = OFFLOAD_ROUND_TRIP.referenceBatch
  return {
    jobs,
    cpuUs: jobs * OFFLOAD_ROUND_TRIP.cpuPerJobUs,
    offloadUs: OFFLOAD_ROUND_TRIP.fixedUs + jobs * OFFLOAD_ROUND_TRIP.perJobUs,
  }
}
