// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { SOURCE_ORGANIZATIONS, sourceOrganizationFor } from './sourceOrganizations'

describe('source organization registry', () => {
  it.each([
    ['NIST NCCoE', 'us-nist-nccoe'],
    ['CISA', 'us-cisa'],
    ['Cybersecurity and Infrastructure Security Agency (CISA)', 'us-cisa'],
    ['National Information Assurance Partnership (NIAP), NSA', 'us-niap'],
    ['AICPA', 'us-aicpa'],
    ['NIST; SRI International', 'us-qed-c'],
  ])('resolves %s to %s', (alias, id) => {
    expect(sourceOrganizationFor(alias)?.id).toBe(id)
  })

  it('normalizes accents and apostrophes used by catalogue variants', () => {
    expect(
      sourceOrganizationFor('Agence nationale de la securite des systemes d’information (ANSSI)')
        ?.id
    ).toBe('fr-anssi')
  })

  it('keeps an unknown name unresolved rather than guessing its jurisdiction', () => {
    expect(sourceOrganizationFor('Unreviewed Example Body')).toBeNull()
  })

  it('has unique canonical IDs', () => {
    const ids = SOURCE_ORGANIZATIONS.map((organization) => organization.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
