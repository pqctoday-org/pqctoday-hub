// SPDX-License-Identifier: GPL-3.0-only
/**
 * The fixed value sets the Threats page's URL takes — `?class=`, `?mode=`,
 * `?threattab=` — are also what the PQC Assistant puts in its links
 * (promptBuilder.ts reads them from threatsUrlParams.ts). A typed list left out
 * `class=both`, which the page accepts and 81 threats carry.
 */
import { describe, it, expect } from 'vitest'
import {
  CLASS_PARAM_VALUES,
  DETAIL_TAB_VALUES,
  THREATS_VIEW_MODES,
  threatClassParam,
  threatDetailTabParam,
  threatsViewModeParam,
} from './threatsUrlParams'
import { THREAT_CLASSES } from '@/data/threatRowRules'
import { threatsData } from '@/data/threatsData'

const params = (query: string) => new URLSearchParams(query)

describe('?class= values', () => {
  it('are the reviewed threat classes: hndl, hnfl and both', () => {
    expect([...CLASS_PARAM_VALUES]).toEqual(['hndl', 'hnfl', 'both'])
    expect(new Set(CLASS_PARAM_VALUES)).toEqual(new Set(THREAT_CLASSES))
  })

  it('cover every class a published threat carries', () => {
    const inData = new Set(threatsData.map((t) => t.threatClass).filter(Boolean))
    expect(
      [...inData].filter((c) => !(CLASS_PARAM_VALUES as readonly string[]).includes(c!))
    ).toEqual([])
  })

  it('are each accepted by the page, and a made-up one is not', () => {
    for (const value of CLASS_PARAM_VALUES) {
      expect(threatClassParam(params(`class=${value}`))).toBe(value)
    }
    expect(threatClassParam(params('class=bogus'))).toBeNull()
  })
})

describe('?mode= values', () => {
  it('are cards and table', () => {
    expect([...THREATS_VIEW_MODES]).toEqual(['cards', 'table'])
  })

  it('are each accepted by the page', () => {
    for (const value of THREATS_VIEW_MODES) {
      expect(threatsViewModeParam(params(`mode=${value}`))).toBe(value)
    }
  })

  it('fall back to the table when absent, unknown, or a link to the removed stack view', () => {
    expect(threatsViewModeParam(params(''))).toBe('table')
    expect(threatsViewModeParam(params('mode=stack'))).toBe('table')
    expect(threatsViewModeParam(params('mode=bogus'))).toBe('table')
  })
})

describe('?threattab= values', () => {
  it('are detection and response, detection first (the default)', () => {
    expect([...DETAIL_TAB_VALUES]).toEqual(['detection', 'response'])
  })

  it('are each accepted by the page; anything else opens detection', () => {
    for (const value of DETAIL_TAB_VALUES) {
      expect(threatDetailTabParam(params(`threattab=${value}`))).toBe(value)
    }
    expect(threatDetailTabParam(params(''))).toBe(DETAIL_TAB_VALUES[0])
    expect(threatDetailTabParam(params('threattab=bogus'))).toBe(DETAIL_TAB_VALUES[0])
  })
})
