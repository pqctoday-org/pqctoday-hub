// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Example reviewer roles for the Draft / In review / Approved practice states.
 *
 * These states teach how a document moves through review. They are not a
 * record of review, so the reviewer field holds a role from this fixed list,
 * never a person's name. A stored value that is not on the list (a name saved
 * before this list existed) is never printed; readers see the generic phrase.
 * The stored record is not edited: this is a display rule only.
 */
export const EXAMPLE_REVIEWER_ROLES: readonly string[] = [
  'CISO',
  'Security architect',
  'Compliance lead',
  'IT operations lead',
  'Product owner',
]

/** What a stored reviewer value shows as when it is not one of the example roles. */
export const EXAMPLE_REVIEWER_FALLBACK = 'example reviewer role'

/**
 * The reviewer role to print for a stored value: the role itself when it is on
 * the list (matched ignoring case, shown in the list's spelling), otherwise
 * "example reviewer role". Empty or absent values return null.
 */
export function exampleReviewerRole(stored: string | undefined | null): string | null {
  const value = (stored ?? '').trim()
  if (!value) return null
  const match = EXAMPLE_REVIEWER_ROLES.find((role) => role.toLowerCase() === value.toLowerCase())
  return match ?? EXAMPLE_REVIEWER_FALLBACK
}
