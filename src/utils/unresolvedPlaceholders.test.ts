// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { findUnresolvedPlaceholders, hasUnresolvedPlaceholders } from './unresolvedPlaceholders'

describe('findUnresolvedPlaceholders', () => {
  it('finds the tokens the audit found reaching exported documents', () => {
    const md = `# Crypto Policy
**Organization:** [Organization Name]
**Effective:** [Effective Date]
**Owner:** [Policy Owner]
Review cadence: [FREQUENCY], reported in [FORMAT].`
    expect(findUnresolvedPlaceholders(md)).toEqual([
      'Organization Name',
      'Effective Date',
      'Policy Owner',
      'FREQUENCY',
      'FORMAT',
    ])
    expect(hasUnresolvedPlaceholders(md)).toBe(true)
  })

  it('does not flag markdown links', () => {
    const md = 'See [NIST CSWP 39](https://doi.org/10.6028/NIST.CSWP.39-upd1) for detail.'
    expect(findUnresolvedPlaceholders(md)).toEqual([])
  })

  it('does not flag citation brackets or lowercase asides', () => {
    expect(findUnresolvedPlaceholders('Derived from the CSF [43].')).toEqual([])
    expect(findUnresolvedPlaceholders('The table [see above] lists them.')).toEqual([])
  })

  it('deduplicates repeated tokens', () => {
    expect(findUnresolvedPlaceholders('[FREQUENCY] then [FREQUENCY]')).toEqual(['FREQUENCY'])
  })

  it('is clean for a fully filled document', () => {
    const md = '**Organization:** Acme Corp\n**Effective:** 2026-09-01'
    expect(hasUnresolvedPlaceholders(md)).toBe(false)
  })
})
