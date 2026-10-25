// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The Library note for the Certification Engineer describes what the page does: with "All
 * categories" chosen and nothing typed in the search box, the document list is narrowed to the
 * role's focus categories (PERSONA_LIBRARY_CATEGORIES), and those rows are tinted ("Emphasized for
 * your role") in the category list. The category list itself keeps its fixed order, so the note
 * must not say the categories "lead" with Compliance & Certification.
 */
import { describe, it, expect } from 'vitest'
import { PAGE_PERSONA_NOTES } from './pagePersonaNotes'
import { PERSONA_LIBRARY_CATEGORIES } from './personaConfig'

describe('PAGE_PERSONA_NOTES: /library, cert-engineer', () => {
  const note = PAGE_PERSONA_NOTES['/library']['cert-engineer']

  it('does not say the role\'s categories "lead" the category list', () => {
    expect(note).not.toMatch(/categories lead with/)
    expect(note).not.toContain('lead with Compliance & Certification')
  })

  it('says the list narrows to the five focus categories, tinted in the category list', () => {
    expect(note).toContain(
      'the list narrows to your five focus categories, tinted in the category list.'
    )
    // "five" has to stay true
    expect(PERSONA_LIBRARY_CATEGORIES['cert-engineer']).toHaveLength(5)
    expect(PERSONA_LIBRARY_CATEGORIES['cert-engineer']).toContain('Compliance & Certification')
  })
})
