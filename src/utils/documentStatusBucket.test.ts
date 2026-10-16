// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getDocumentStatusBucket } from './documentStatusBucket'

describe('getDocumentStatusBucket', () => {
  it('reads a status text into the bucket the lifecycle label falls back on', () => {
    // An RFC's category describes a published RFC (document labels, 16 Oct 2026).
    expect(getDocumentStatusBucket('Proposed Standard')).toBe('Published')
    expect(getDocumentStatusBucket('Informational')).toBe('Published')
    expect(getDocumentStatusBucket('Round 4 Submission')).toBe('Proposed')
    expect(getDocumentStatusBucket('Internet-Draft')).toBe('Draft')
    expect(getDocumentStatusBucket('Internet Draft')).toBe('Draft')
    expect(getDocumentStatusBucket('Expired Internet-Draft')).toBe('Expired')
    expect(getDocumentStatusBucket('Superseded by X')).toBe('Superseded')
    expect(getDocumentStatusBucket('Final')).toBe('Published')
  })

  it('never reads unrecognised or unreviewed text as published', () => {
    expect(getDocumentStatusBucket('Unverified — needs review')).toBe('Unverified')
    expect(getDocumentStatusBucket('')).toBe('Unverified')
    expect(getDocumentStatusBucket('Something nobody wrote a rule for')).toBe('Unverified')
  })
})
