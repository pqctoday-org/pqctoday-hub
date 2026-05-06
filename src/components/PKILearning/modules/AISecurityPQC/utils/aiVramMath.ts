// SPDX-License-Identifier: GPL-3.0-only

export interface VramImpact {
  modelVramGB: number
  kvCacheVramGB: number
  cryptoVramGB: number
  totalVramGB: number
  isOOM: boolean
  remainingVramGB: number
}

/**
 * Calculates the GPU VRAM consumption for an LLM inference endpoint.
 * Models the scenario where batch cryptographic decryption (e.g., cuPQC)
 * occurs directly on the GPU to avoid PCIe bottlenecks.
 *
 * @param gpuCapacityGB The total VRAM capacity of the GPU
 * @param modelWeightsGB The VRAM consumed by the LLM weights
 * @param concurrentSessions The number of simultaneous inference streams
 * @param kvCachePerSessionMB The KV cache memory required per stream
 * @param cryptoStatePerSessionKB The cryptographic state memory required per stream (e.g., TLS buffers, ciphertexts, keys)
 */
export function calculateVramImpact(
  gpuCapacityGB: number,
  modelWeightsGB: number,
  concurrentSessions: number,
  kvCachePerSessionMB: number,
  cryptoStatePerSessionKB: number
): VramImpact {
  if (
    gpuCapacityGB <= 0 ||
    modelWeightsGB < 0 ||
    concurrentSessions < 0 ||
    kvCachePerSessionMB < 0 ||
    cryptoStatePerSessionKB < 0
  ) {
    throw new Error('Invalid VRAM parameters')
  }

  const modelVramGB = modelWeightsGB
  const kvCacheVramGB = (concurrentSessions * kvCachePerSessionMB) / 1024
  const cryptoVramGB = (concurrentSessions * cryptoStatePerSessionKB) / (1024 * 1024)

  const totalVramGB = modelVramGB + kvCacheVramGB + cryptoVramGB
  const isOOM = totalVramGB > gpuCapacityGB
  const remainingVramGB = Math.max(0, gpuCapacityGB - totalVramGB)

  return {
    modelVramGB,
    kvCacheVramGB,
    cryptoVramGB,
    totalVramGB,
    isOOM,
    remainingVramGB,
  }
}
