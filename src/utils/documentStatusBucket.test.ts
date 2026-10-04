// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getDocumentStatusBucket } from './documentStatusBucket'

describe('getDocumentStatusBucket', () => {
  it('reads a status text into the bucket the lifecycle label falls back on', () => {
    expect(getDocumentStatusBucket('Proposed Standard')).toBe('Proposed')
    expect(getDocumentStatusBucket('Internet-Draft')).toBe('Draft')
    expect(getDocumentStatusBucket('Expired Internet-Draft')).toBe('Expired')
    expect(getDocumentStatusBucket('Superseded by X')).toBe('Superseded')
    expect(getDocumentStatusBucket('Final')).toBe('Published')
  })
})
