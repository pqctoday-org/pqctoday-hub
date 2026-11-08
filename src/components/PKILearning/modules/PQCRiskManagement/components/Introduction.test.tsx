// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { Introduction } from './Introduction'

function pageText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <Introduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

describe('Risk management introduction: regulatory pressure', () => {
  it('separates CNSA 2.0 acquisition, phase-out and algorithm-mandate dates and limits them to NSS', () => {
    const text = pageText()
    expect(text).toMatch(/National Security Systems only/)
    expect(text).toMatch(/new acquisitions from 1 January 2027/)
    expect(text).toMatch(/phased out by 31 December 2030 absent an exception/)
    expect(text).toMatch(/algorithms mandated by 31 December 2031 unless otherwise noted/)
    expect(text).toMatch(/NSM-10.s 2035 goal is separate/)
    // the old compressed range is gone
    expect(text).not.toMatch(/PQC required for NSS by 2030.2035/)
  })

  it('does not limit the NIST deprecation dates to signatures', () => {
    const text = pageText()
    expect(text).toMatch(
      /quantum-vulnerable public-key algorithms deprecated after 2030, disallowed under NIST standards and guidelines after 2035/
    )
  })
})
