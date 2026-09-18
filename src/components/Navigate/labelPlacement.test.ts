// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { placeLabels, truncateLabel, type LabelCandidate } from './labelPlacement'

const box = (
  id: string,
  x: number,
  y: number,
  priority: number,
  extra: Partial<LabelCandidate> = {}
): LabelCandidate => ({
  id,
  x,
  y,
  width: 100,
  height: 16,
  priority,
  distance: 10,
  ...extra,
})

const viewport = { viewportWidth: 1000, viewportHeight: 800 }

describe('placeLabels', () => {
  it('keeps every non-overlapping label up to the budget', () => {
    const shown = placeLabels([box('a', 0, 0, 1), box('b', 200, 0, 1), box('c', 400, 0, 1)], {
      budget: 10,
      ...viewport,
    })
    expect([...shown].sort()).toEqual(['a', 'b', 'c'])
  })

  it('drops the lower-priority label of an overlapping pair', () => {
    const shown = placeLabels([box('low', 0, 0, 1), box('high', 20, 4, 5)], {
      budget: 10,
      ...viewport,
    })
    expect(shown.has('high')).toBe(true)
    expect(shown.has('low')).toBe(false)
  })

  it('treats the margin as part of the box', () => {
    // Boxes touch edge-to-edge with a 1px gap: kept with margin 0, rejected with margin 4.
    const pair = [box('a', 0, 0, 1), box('b', 101, 0, 1)]
    expect(placeLabels(pair, { budget: 10, margin: 0, ...viewport }).size).toBe(2)
    expect(placeLabels(pair, { budget: 10, margin: 4, ...viewport }).size).toBe(1)
  })

  it('never exceeds the budget, taking the highest priorities first', () => {
    const many = Array.from({ length: 20 }, (_, i) => box(`n${i}`, i * 120, 0, i))
    const shown = placeLabels(many, { budget: 3, viewportWidth: 3000, viewportHeight: 800 })
    expect([...shown].sort()).toEqual(['n17', 'n18', 'n19'])
  })

  it('discards candidates entirely off screen before spending budget on them', () => {
    const shown = placeLabels(
      [box('off', -500, -500, 100), box('on', 10, 10, 1), box('right', 1200, 10, 50)],
      { budget: 1, ...viewport }
    )
    expect([...shown]).toEqual(['on'])
  })

  it('a pinned label beats a higher-priority overlapping one', () => {
    const shown = placeLabels([box('selected', 0, 0, 0, { pinned: true }), box('big', 10, 0, 99)], {
      budget: 10,
      ...viewport,
    })
    expect([...shown]).toEqual(['selected'])
  })

  it('a sticky label holds its place against any non-sticky newcomer, even a higher-priority one', () => {
    const holder = box('holder', 0, 0, 5)
    const higher = box('higher', 10, 0, 6)
    const sticky = new Set(['holder'])
    expect([...placeLabels([holder, higher], { budget: 10, sticky, ...viewport })]).toEqual([
      'holder',
    ])
    // ...but without stickiness the higher priority wins the same collision.
    expect([...placeLabels([holder, higher], { budget: 10, ...viewport })]).toEqual(['higher'])
  })

  it('two sticky labels that now collide resolve by priority', () => {
    const a = box('a', 0, 0, 5)
    const b = box('b', 10, 0, 6)
    expect([
      ...placeLabels([a, b], { budget: 10, sticky: new Set(['a', 'b']), ...viewport }),
    ]).toEqual(['b'])
  })

  it('ties on priority break toward the closer label, then the id', () => {
    const shown = placeLabels(
      [box('far', 0, 0, 1, { distance: 30 }), box('near', 10, 0, 1, { distance: 5 })],
      { budget: 10, ...viewport }
    )
    expect([...shown]).toEqual(['near'])
  })

  it('candidates avoid obstacles, which are never hidden and never spend budget', () => {
    const shown = placeLabels([box('blocked', 0, 0, 99), box('free', 300, 0, 1)], {
      budget: 1,
      obstacles: [box('category', 10, 0, 0)],
      ...viewport,
    })
    expect([...shown]).toEqual(['free'])
  })

  it('returns nothing for a zero budget', () => {
    expect(placeLabels([box('a', 0, 0, 1)], { budget: 0, ...viewport }).size).toBe(0)
  })
})

describe('truncateLabel', () => {
  it('leaves short text alone', () => {
    expect(truncateLabel('FIPS 204 (ML-DSA)')).toBe('FIPS 204 (ML-DSA)')
  })

  it('cuts long text at a nearby word boundary with an ellipsis', () => {
    const long =
      'ANSI X9.63-2011 (R2017) — Public Key Cryptography for the Financial Services Industry'
    const out = truncateLabel(long, 40)
    expect(out.endsWith('…')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(40)
    expect(out).toBe('ANSI X9.63-2011 (R2017) — Public Key…')
  })

  it('does not back up to a word boundary that would cost most of the budget', () => {
    const out = truncateLabel('Short Averyveryveryveryveryveryverylongtoken', 20)
    expect(out).toBe('Short Averyveryvery…')
  })

  it('strips a dangling separator before the ellipsis', () => {
    expect(truncateLabel('Recommendation for Key Derivation — Part 1: General', 36)).toBe(
      'Recommendation for Key Derivation…'
    )
  })
})
