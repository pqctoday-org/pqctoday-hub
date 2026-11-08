// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { GovernmentDefenseIntroduction } from './GovernmentDefenseIntroduction'

function pageText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <GovernmentDefenseIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

describe('Government and defense introduction: Kyber and ML-KEM naming', () => {
  it('teaches lineage and versions, not that the two names are interchangeable', () => {
    const text = pageText()
    expect(text).toMatch(/related, not interchangeable labels/)
    expect(text).toMatch(/does not adhere to FIPS 203 or 204 is not CNSA 2\.0 compliant/)
    expect(text).not.toMatch(/name the same algorithms differently/)
    expect(text).not.toMatch(/for the same algorithms/)
  })

  it('keeps the both-name inventory search and requires the exact standardized identifier', () => {
    const text = pageText()
    expect(text).toMatch(/look for both the old and the new name/)
    expect(text).toMatch(/record the exact standardized identifier/)
    expect(text).toMatch(/ML-KEM-1024 per FIPS 203/)
    expect(text).toMatch(/test interoperability instead of assuming it/)
  })
})
