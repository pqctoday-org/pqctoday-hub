import { describe, it, expect } from 'vitest'
import { canonicalLeaderCountry, isLeaderCountryOnList } from './leaderCountry'

describe('canonicalLeaderCountry', () => {
  it('reads codes, old spellings and pairs as the long form, part by part', () => {
    expect(canonicalLeaderCountry('US')).toBe('United States')
    expect(canonicalLeaderCountry('USA')).toBe('United States')
    expect(canonicalLeaderCountry('GB')).toBe('United Kingdom')
    expect(canonicalLeaderCountry('UK')).toBe('United Kingdom')
    expect(canonicalLeaderCountry('France')).toBe('France')
    expect(canonicalLeaderCountry('NL;US')).toBe('Netherlands/United States')
    expect(canonicalLeaderCountry('Netherlands/USA')).toBe('Netherlands/United States')
    expect(canonicalLeaderCountry('')).toBe('')
    expect(canonicalLeaderCountry('All')).toBe('All')
  })
})

describe('isLeaderCountryOnList', () => {
  it('accepts a jurisdiction name or code, or ";"-joined ones, and an unstated country', () => {
    for (const v of ['', 'France', 'United States', 'US', 'GB', 'NL;US', 'Japan;United States'])
      expect(isLeaderCountryOnList(v), v).toBe(true)
  })

  it('refuses the spellings the file used to hold and anything off the list', () => {
    for (const v of [
      'USA',
      'UK',
      'USA/Canada',
      'Netherlands/USA',
      'NL; US',
      ';US',
      'US;',
      'Atlantis',
      'EU',
    ])
      expect(isLeaderCountryOnList(v), v).toBe(false)
  })
})
