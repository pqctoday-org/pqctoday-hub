// SPDX-License-Identifier: GPL-3.0-only
/**
 * W2-4 (audit 2026-08-10): the Skills & Team Plan applied framework-2.1's
 * `sizing_heuristic` (1 FTE per 500 instances) without ever reconciling it
 * against `sizing_extras` in the SAME yaml block, which says a >10,000
 * instance estate needs "8-12 FTEs at peak". At 10,000 the ratio gives 20
 * scalable FTE plus the fixed-overhead trio — about double its own source.
 */
import { describe, it, expect } from 'vitest'
import {
  sizingSanityCheck,
  SIZING_SANITY_BANDS,
  FTE_PER_CRYPTO_INSTANCES,
} from './roleCrosswalk'

describe('sizingSanityCheck', () => {
  it('flags the divergence the framework itself creates at 10,000+ instances', () => {
    const instances = 20_000
    const heuristic = instances / FTE_PER_CRYPTO_INSTANCES // 40 FTE
    const result = sizingSanityCheck(instances, heuristic)
    expect(result).not.toBeNull()
    expect(result!.diverges).toBe(true)
    expect(result!.note).toContain('8-12')
  })

  it('does not flag a large estate whose ratio lands inside the stated band', () => {
    expect(sizingSanityCheck(20_000, 10)).toBeNull()
  })

  it('surfaces the part-time guidance for small estates without calling it a divergence', () => {
    const result = sizingSanityCheck(500, 1)
    expect(result).not.toBeNull()
    expect(result!.diverges).toBe(false)
    expect(result!.note).toMatch(/part-time QRPM/i)
  })

  it('says nothing for a mid-sized estate the framework gives no band for', () => {
    expect(sizingSanityCheck(5_000, 10)).toBeNull()
  })

  it('keeps the bands traceable to the framework text', () => {
    expect(SIZING_SANITY_BANDS.largeEstateInstances).toBe(10_000)
    expect(SIZING_SANITY_BANDS.largeEstatePeakFteLow).toBe(8)
    expect(SIZING_SANITY_BANDS.largeEstatePeakFteHigh).toBe(12)
  })
})
