// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { loadPQCAlgorithmsData } from '../../data/pqcAlgorithmsData'
import { PICKER_ID_TO_ALGO_NAME, getPickerTier } from './algorithmPickerStatus'
import { isDraftTier } from '../../data/algorithmStatusTier'

describe('algorithmPickerStatus (WORKSTREAMS.md §WS-A consumer — playground.md item 1)', () => {
  it('every mapped CSV algorithm name resolves against the wired reference CSV', async () => {
    const rows = await loadPQCAlgorithmsData()
    const names = new Set(rows.map((r) => r.name))
    for (const [pickerId, algoName] of Object.entries(PICKER_ID_TO_ALGO_NAME)) {
      expect(
        names.has(algoName),
        `picker id "${pickerId}" → CSV name "${algoName}" not found`
      ).toBe(true)
    }
  })

  it('agrees with /algorithms on FN-DSA being a draft tier (FIPS 206 unpublished)', async () => {
    const rows = await loadPQCAlgorithmsData()
    const tiers = new Map(rows.map((r) => [r.name, r.statusTier]))
    expect(isDraftTier(getPickerTier('FN-DSA-512', tiers)!)).toBe(true)
    expect(isDraftTier(getPickerTier('FN-DSA-1024', tiers)!)).toBe(true)
  })

  it('agrees with /algorithms on ML-KEM/ML-DSA/SLH-DSA being final (unbadged)', async () => {
    const rows = await loadPQCAlgorithmsData()
    const tiers = new Map(rows.map((r) => [r.name, r.statusTier]))
    expect(isDraftTier(getPickerTier('768', tiers)!)).toBe(false) // ML-KEM-768
    expect(isDraftTier(getPickerTier('65', tiers)!)).toBe(false) // ML-DSA-65
    expect(isDraftTier(getPickerTier('SLH-DSA-SHA2-128s', tiers)!)).toBe(false)
  })

  it('flags Round-2 candidates (MAYO, CROSS, UOV, SNOVA) and Round-4-concluded/regional HQC & Classic McEliece as draft', async () => {
    const rows = await loadPQCAlgorithmsData()
    const tiers = new Map(rows.map((r) => [r.name, r.statusTier]))
    expect(isDraftTier(getPickerTier('MAYO-1', tiers)!)).toBe(true)
    expect(isDraftTier(getPickerTier('CROSS-RSDP-128-balanced', tiers)!)).toBe(true)
    expect(isDraftTier(getPickerTier('OV-Ip', tiers)!)).toBe(true)
    expect(isDraftTier(getPickerTier('SNOVA-24-5-4', tiers)!)).toBe(true)
    expect(isDraftTier(getPickerTier('HQC-128', tiers)!)).toBe(true)
    // Classic McEliece is 'regional' (BSI TR-02102-1) — final within that jurisdiction, unbadged
    expect(isDraftTier(getPickerTier('Classic-McEliece-348864', tiers)!)).toBe(false)
  })
})
