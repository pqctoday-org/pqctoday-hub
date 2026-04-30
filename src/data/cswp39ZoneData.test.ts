// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PILLAR_TO_STEP, PILLAR_TO_ZONE, CSWP39_ZONE_ORDER, legacyToZoneId } from './cswp39ZoneData'
import type { PillarId } from '@/types/MaturityTypes'

const ALL_PILLARS: PillarId[] = [
  'governance',
  'inventory',
  'observability',
  'assurance',
  'lifecycle',
]

describe('PILLAR_TO_STEP / PILLAR_TO_ZONE', () => {
  it('covers every PillarId', () => {
    for (const p of ALL_PILLARS) {
      expect(PILLAR_TO_STEP[p]).toBeTruthy()
      expect(PILLAR_TO_ZONE[p]).toBeTruthy()
    }
  })

  it('produces unique zones across all pillars (no two pillars collapse to the same zone)', () => {
    const zones = ALL_PILLARS.map((p) => PILLAR_TO_ZONE[p])
    expect(new Set(zones).size).toBe(zones.length)
  })

  it('every produced zone is a known ZoneId', () => {
    for (const p of ALL_PILLARS) {
      expect(CSWP39_ZONE_ORDER).toContain(PILLAR_TO_ZONE[p])
    }
  })

  it('PILLAR_TO_ZONE is consistent with legacyToZoneId(PILLAR_TO_STEP[p])', () => {
    for (const p of ALL_PILLARS) {
      expect(PILLAR_TO_ZONE[p]).toBe(legacyToZoneId(PILLAR_TO_STEP[p]))
    }
  })
})
