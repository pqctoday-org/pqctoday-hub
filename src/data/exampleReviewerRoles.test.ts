// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  EXAMPLE_REVIEWER_FALLBACK,
  EXAMPLE_REVIEWER_ROLES,
  exampleReviewerRole,
} from './exampleReviewerRoles'

describe('exampleReviewerRole', () => {
  it('returns a role from the list as written there', () => {
    expect(exampleReviewerRole('CISO')).toBe('CISO')
    expect(exampleReviewerRole('security architect')).toBe('Security architect')
  })

  it('returns the generic phrase for a person name or any value off the list', () => {
    expect(exampleReviewerRole('R. Reviewer')).toBe(EXAMPLE_REVIEWER_FALLBACK)
    expect(exampleReviewerRole('Jane Doe, CISO')).toBe(EXAMPLE_REVIEWER_FALLBACK)
  })

  it('returns null when nothing is stored', () => {
    expect(exampleReviewerRole(undefined)).toBeNull()
    expect(exampleReviewerRole('')).toBeNull()
    expect(exampleReviewerRole('   ')).toBeNull()
  })

  it('keeps the list to roles, not people', () => {
    for (const role of EXAMPLE_REVIEWER_ROLES) {
      expect(role).not.toMatch(/\b[A-Z]\.\s/)
    }
    expect(EXAMPLE_REVIEWER_ROLES).toEqual([
      'CISO',
      'Security architect',
      'Compliance lead',
      'IT operations lead',
      'Product owner',
    ])
  })
})
