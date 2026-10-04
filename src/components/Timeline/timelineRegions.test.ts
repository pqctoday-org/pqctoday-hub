// SPDX-License-Identifier: GPL-3.0-only
/**
 * The Timeline's region filter offers the same regions the rest of the site
 * defines (the persona region and its country lists). A region missing here
 * cannot be linked: the PQC Assistant names these ids in its links
 * (promptBuilder.ts), and one of them, `mena`, was left out of that list.
 */
import { describe, it, expect } from 'vitest'
import { TIMELINE_REGION_LABELS } from './timelineRegions'
import { REGION_COUNTRIES_MAP } from '@/data/personaConfig'

describe('TIMELINE_REGION_LABELS', () => {
  it('offers americas, eu, mena, apac and global', () => {
    expect(Object.keys(TIMELINE_REGION_LABELS)).toEqual([
      'americas',
      'eu',
      'mena',
      'apac',
      'global',
    ])
  })

  it('has one entry for every region the site defines (the country map plus global)', () => {
    expect(new Set(Object.keys(TIMELINE_REGION_LABELS))).toEqual(
      new Set([...Object.keys(REGION_COUNTRIES_MAP), 'global'])
    )
  })

  it('gives every region a label to show', () => {
    for (const label of Object.values(TIMELINE_REGION_LABELS)) {
      expect(label.trim().length).toBeGreaterThan(0)
    }
  })
})
