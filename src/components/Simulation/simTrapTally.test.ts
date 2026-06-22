// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { recordTrapPick, readTrapTally, trapTallyTotal, clearTrapTally } from './simTrapTally'

describe('simTrapTally (PR-5)', () => {
  beforeEach(() => clearTrapTally())

  it('records and counts picks, ranked most-fallen-for first', () => {
    recordTrapPick('p0', 'Frame it as an IT-only compliance task')
    recordTrapPick('p5', 'Skip the library-readiness check')
    recordTrapPick('p0', 'Frame it as an IT-only compliance task')
    const ranked = readTrapTally()
    expect(ranked).toHaveLength(2)
    expect(ranked[0]).toMatchObject({ phaseId: 'p0', count: 2 })
    expect(ranked[1]).toMatchObject({ phaseId: 'p5', count: 1 })
    expect(trapTallyTotal()).toBe(3)
  })

  it('breaks ties by label for a stable order', () => {
    recordTrapPick('p1', 'Bbb')
    recordTrapPick('p2', 'Aaa')
    expect(readTrapTally().map((e) => e.label)).toEqual(['Aaa', 'Bbb'])
  })

  it('clear empties the tally', () => {
    recordTrapPick('p0', 'x')
    expect(trapTallyTotal()).toBe(1)
    clearTrapTally()
    expect(readTrapTally()).toEqual([])
    expect(trapTallyTotal()).toBe(0)
  })

  it('ignores empty phase or label', () => {
    recordTrapPick('', 'x')
    recordTrapPick('p0', '')
    expect(trapTallyTotal()).toBe(0)
  })
})
