// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_GANTT_VIEW,
  readGanttViewParams,
  writeGanttViewParams,
  readDocViewParam,
} from './timelineData'

const sp = (s: string) => new URLSearchParams(s)

describe('readGanttViewParams', () => {
  it('empty URL → defaults', () => {
    expect(readGanttViewParams(sp(''))).toEqual(DEFAULT_GANTT_VIEW)
  })

  it('reads every param, case-insensitively', () => {
    expect(
      readGanttViewParams(sp('phase=migration&etype=MILESTONE&gsort=Organization&gdir=DESC'))
    ).toEqual({ phase: 'Migration', etype: 'Milestone', sort: 'organization', dir: 'desc' })
  })

  it('deadlines=1 wins over phase', () => {
    expect(readGanttViewParams(sp('deadlines=1&phase=Policy')).phase).toBe('Deadline')
    expect(readGanttViewParams(sp('deadlines=yes')).phase).toBe('All')
  })

  it('unknown values are ignored; a repeated key uses its first known value', () => {
    expect(readGanttViewParams(sp('phase=bogus&etype=x&gsort=y&gdir=z'))).toEqual(
      DEFAULT_GANTT_VIEW
    )
    expect(readGanttViewParams(sp('phase=bogus&phase=POC&phase=Policy')).phase).toBe('POC')
  })
})

describe('writeGanttViewParams', () => {
  it('omits defaults and keeps unrelated params', () => {
    expect(
      writeGanttViewParams(sp('country=France&phase=POC'), DEFAULT_GANTT_VIEW).toString()
    ).toBe('country=France')
  })

  it('writes Deadline as deadlines=1, never phase=Deadline', () => {
    const out = writeGanttViewParams(sp('phase=POC'), { ...DEFAULT_GANTT_VIEW, phase: 'Deadline' })
    expect(out.get('deadlines')).toBe('1')
    expect(out.has('phase')).toBe(false)
  })

  it('round-trips a non-default view', () => {
    const view = { phase: 'Testing', etype: 'Phase', sort: 'organization', dir: 'desc' } as const
    expect(readGanttViewParams(writeGanttViewParams(sp(''), view))).toEqual(view)
  })
})

describe('readDocViewParam', () => {
  it('table, else cards', () => {
    expect(readDocViewParam('table')).toBe('table')
    expect(readDocViewParam('cards')).toBe('cards')
    expect(readDocViewParam('grid')).toBe('cards')
    expect(readDocViewParam(null)).toBe('cards')
  })
})
