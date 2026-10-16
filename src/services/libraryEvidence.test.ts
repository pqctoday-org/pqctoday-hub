// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { LibraryItem } from '@/data/libraryData'
import { buildEvidenceResolver } from './libraryEvidence'

const item = (referenceId: string, over: Partial<LibraryItem> = {}) =>
  ({
    referenceId,
    documentTitle: `Title of ${referenceId}`,
    documentStatus: 'Proposed Standard',
    lastUpdateDate: '2025-06-01',
    ...over,
  }) as LibraryItem

describe('library evidence resolver', () => {
  it('matches ids ignoring case, spaces and hyphens, including child records', () => {
    const resolve = buildEvidenceResolver([
      item('RFC-9763'),
      item('FIPS 203', { children: [item('FIPS 203 ipd', { documentStatus: 'Draft' })] }),
    ])
    expect(resolve('rfc 9763')?.title).toBe('Title of RFC-9763')
    expect(resolve('rfc 9763')?.referenceId).toBe('RFC-9763')
    expect(resolve('FIPS-203-IPD')?.status).toBe('Draft')
    expect(resolve('RFC 0000')).toBeNull()
  })
})
