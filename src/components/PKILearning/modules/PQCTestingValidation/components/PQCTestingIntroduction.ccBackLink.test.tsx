// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The side-channel section points readers to how a Common Criteria or EUCC evaluation looks at
 * side-channel attacks on post-quantum code (AVA_VAN.5). The link target is the section of the
 * Common Criteria lesson that holds the AVA_VAN.5 box.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { PQCTestingIntroduction } from './PQCTestingIntroduction'

describe('PQC Network Testing & Validation: Common Criteria pointer', () => {
  it('links the side-channel section to the Common Criteria lesson section on PQC under EUCC', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <PQCTestingIntroduction onNavigateToWorkshop={vi.fn()} />
        </MemoryRouter>
      </EmbedProvider>
    )
    const heading = screen.getByText('Side-Channel Testing & TVLA for Lattice Crypto')
    if (!screen.queryByText(/AVA_VAN\.5/)) fireEvent.click(heading)

    const link = screen.getByRole('link', { name: 'Common Criteria, EUCC & eIDAS Certification' })
    expect(link).toHaveAttribute(
      'href',
      '/learn/cc-eucc-certification?tab=learn&section=eucc-pqc-today'
    )
    const sentence = link.closest('p')
    expect(sentence).toHaveTextContent(
      'For how a Common Criteria or EUCC evaluation looks at side-channel attacks on post-quantum code (AVA_VAN.5), see Common Criteria, EUCC & eIDAS Certification.'
    )
  })
})
