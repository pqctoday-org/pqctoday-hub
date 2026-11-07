// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { content } from './content'
import { CNSA_2_0, CNSA_2_0_BY_CLASS } from '@/data/regulatoryTimelines'

describe('risk management module lists the current CNSA 2.0 national security system dates', () => {
  const cnsa = content.deadlines.filter((d) => d.source === 'CNSA 2.0')

  it('lists acquisition, phase-out and mandate dates, each limited to national security systems', () => {
    expect(cnsa.map((d) => [d.label, d.year])).toEqual([
      ['CNSA 2.0: new national security system acquisitions (from 1 January 2027)', 2027],
      [
        'CNSA 2.0: unsupported national security system equipment phased out (31 December 2030)',
        2030,
      ],
      ['CNSA 2.0 mandated for national security systems (31 December 2031)', 2031],
    ])
  })

  it('takes each year from the shared CNSA 2.0 milestone table', () => {
    expect(cnsa.map((d) => d.year)).toEqual(CNSA_2_0_BY_CLASS.map((c) => c.year))
    expect(cnsa.map((d) => d.year)).toEqual([
      CNSA_2_0.networkingRequired,
      CNSA_2_0.softwareExclusive,
      CNSA_2_0.networkingExclusive,
    ])
  })

  it('no longer lists the earlier software-signing ladder', () => {
    expect(
      content.deadlines.some((d) => /signing preferred|software exclusive/i.test(d.label))
    ).toBe(false)
  })
})
