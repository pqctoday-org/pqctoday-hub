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

/**
 * Regression: the warning fired on the tool with the BEST citations.
 *
 * The Audit Readiness Checklist writes its sources inline in brackets. Every
 * one was Title Case, so all of them read as unfilled placeholders: the tool
 * told users "7 unfilled placeholders still in this document" and then listed
 * NIST SP 800-57 Part 3, FIPS 203/204/205 and CISA CBOM Guidance among them.
 *
 * The strings below are copied verbatim from a real export taken on
 * 2026-08-12, not invented for the test.
 */
describe('standards citations are not placeholders', () => {
  const REAL_CHECKLIST_LINES = [
    'All systems cataloged — Comprehensive inventory of all systems using cryptographic operations. [EO 14028 §4; OMB M-23-02]',
    'Algorithm usage documented — Every cryptographic algorithm in use is identified. [NIST SP 800-131A Rev 3 (draft)]',
    'Key lengths recorded — cataloged and assessed. [CNSA 2.0; NIST SP 800-57 Part 1]',
    'Certificate lifecycle tracked — X.509 certificates inventoried. [NIST SP 800-57 Part 3]',
    'PQC algorithms validated. [FIPS 203/204/205]',
    'CBOM generated. [CISA CBOM Guidance]',
    'Config baselines held. [NIST SP 800-128]',
    'Supply chain assessed. [NIST SP 800-161r1]',
  ].join('\n')

  it('flags nothing in a fully-cited checklist', () => {
    expect(findUnresolvedPlaceholders(REAL_CHECKLIST_LINES)).toEqual([])
  })

  it('still flags the real blanks the policy and contract generators leave', () => {
    const doc = [
      'Effective Date: [Effective Date]',
      'Vendor shall comply no later than [YEAR].',
      'Reports delivered [FREQUENCY] in [FORMAT] with [PERIOD] notice at [LEVEL].',
      'Owner: [Organization Name]',
    ].join('\n')
    expect(findUnresolvedPlaceholders(doc)).toEqual([
      'Effective Date',
      'YEAR',
      'FREQUENCY',
      'FORMAT',
      'PERIOD',
      'LEVEL',
      'Organization Name',
    ])
  })

  it('does not let a citation hide a genuine blank on the same line', () => {
    const line = 'Vendor shall meet [NIST SP 800-161r1] by [YEAR].'
    expect(findUnresolvedPlaceholders(line)).toEqual(['YEAR'])
  })
})
