// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The References tab lists every document the Learn text cites by name: SP 800-140F and
 * FIPS 140-3 IG 12.A (side-channel and FIPS 140-3 sections), RFC 9954 (interoperability
 * section) and RFC 10024 (performance section).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ModuleReferencesTab } from '@/components/PKILearning/common/ModuleReferencesTab'
import { content } from './content'
import { getStandard } from '@/data/standardsRegistry'

const CITED_IN_LESSON_TEXT = [
  'NIST-SP-800-140F',
  'NIST-FIPS140-3-IG-PQC',
  'RFC-9954-Hybrid-Key-Exchange-in-TLS-1-3',
  'RFC-10024',
]

describe('PQCTestingValidation references', () => {
  it('declares each document the Learn text cites', () => {
    const declared = new Set(content.standards.map((s) => s.id))
    for (const id of CITED_IN_LESSON_TEXT) expect(declared.has(id), `${id} is declared`).toBe(true)
  })

  it('lists each of them on the References tab, linked into the Library', () => {
    render(
      <MemoryRouter>
        <ModuleReferencesTab moduleId="pqc-testing-validation" />
      </MemoryRouter>
    )
    for (const id of CITED_IN_LESSON_TEXT) {
      const std = getStandard(id)
      const link = screen.getAllByRole('link', { name: std.title || std.id })[0]
      expect(link).toHaveAttribute('href', `/library?ref=${encodeURIComponent(id)}`)
    }
  })
})
