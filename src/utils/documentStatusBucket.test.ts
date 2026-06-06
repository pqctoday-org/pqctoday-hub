// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getDocumentStatusBucket, getGroupStatusBucket } from './documentStatusBucket'

describe('getGroupStatusBucket', () => {
  it('returns the most-advanced bucket across primary + priors', () => {
    expect(getGroupStatusBucket('Draft', ['Published'])).toBe('Published')
    expect(getGroupStatusBucket('Published', ['Draft', 'Expired'])).toBe('Published')
    expect(getGroupStatusBucket('Draft', ['Proposed'])).toBe('Proposed')
    expect(getGroupStatusBucket('Expired', ['Superseded'])).toBe('Expired')
  })

  it('returns the primary when it is already the most advanced or priors is empty', () => {
    expect(getGroupStatusBucket('Published', [])).toBe('Published')
    expect(getGroupStatusBucket('Draft', ['Expired', 'Superseded'])).toBe('Draft')
  })

  it('reflects a near-RFC draft revision surfacing on a bare-id survivor', () => {
    // survivor row is a generic "Internet Draft" (Draft), but a -07 AUTH48 revision
    // still maps to Draft; a published successor would win.
    expect(getGroupStatusBucket('Draft', ['Draft'])).toBe('Draft')
    expect(getDocumentStatusBucket('Proposed Standard')).toBe('Proposed')
  })
})
