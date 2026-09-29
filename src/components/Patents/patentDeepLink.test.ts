// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { resolvePatentTab } from './patentDeepLink'
import { normalizePatentNumber, findPatentByNumber } from '@/data/patentsScope'
import { patentsData } from '@/data/patentsData'

describe('normalizePatentNumber', () => {
  it('accepts US-prefixed, bare, lower-case and punctuated forms', () => {
    expect(normalizePatentNumber('US12676741')).toBe('US12676741')
    expect(normalizePatentNumber('12676741')).toBe('US12676741')
    expect(normalizePatentNumber('us12676741')).toBe('US12676741')
    expect(normalizePatentNumber(' 12,676,741 ')).toBe('US12676741')
    expect(normalizePatentNumber('')).toBeNull()
    expect(normalizePatentNumber(null)).toBeNull()
  })
})

describe('findPatentByNumber', () => {
  it('resolves both forms against the full corpus', () => {
    const p = patentsData[patentsData.length - 1]
    expect(findPatentByNumber(p.patentNumber)).toBe(p)
    expect(findPatentByNumber(p.patentNumber.replace(/^US/, ''))).toBe(p)
  })
  it('returns null for unknown IDs', () => {
    expect(findPatentByNumber('US00000000')).toBeNull()
  })
})

describe('resolvePatentTab', () => {
  const F = ['impact', 'search']
  const tab = (qs: string) => resolvePatentTab(new URLSearchParams(qs), F)
  it('keeps valid tabs', () => {
    expect(tab('tab=search&patent=US1')).toBe('search')
    expect(tab('tab=insights')).toBe('insights')
  })
  it('maps unknown/legacy tabs to explore', () => {
    expect(tab('tab=patents')).toBe('explore')
  })
  it('defaults to explore with a patent or filter and no tab', () => {
    expect(tab('patent=12676741')).toBe('explore')
    expect(tab('impact=High')).toBe('explore')
  })
  it('defaults to insights otherwise', () => {
    expect(tab('')).toBe('insights')
    expect(tab('scope=all')).toBe('insights')
  })
})
