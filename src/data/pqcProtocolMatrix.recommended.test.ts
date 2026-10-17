// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PROTOCOL_MATRIX } from './pqcProtocolMatrix'

// The protocol rows flagged for the "Reviewed deployment evidence" panel must
// rest on published specifications and independent deployments, not on
// PQC Today's own software, and must not read as deployment advice.
describe('deployment-evidence rows', () => {
  it('do not cite PQC Today software or recommend production use', () => {
    const flagged = PROTOCOL_MATRIX.filter((row) => row.recommended)
    expect(flagged.length).toBeGreaterThan(0)
    for (const row of flagged) {
      const reason = row.recommendedReason ?? ''
      expect(reason, row.id).not.toMatch(/\bour\b|\bwe ship\b|pqctoday-/i)
      expect(reason, row.id).not.toMatch(/recommended for production/i)
    }
  })
})
