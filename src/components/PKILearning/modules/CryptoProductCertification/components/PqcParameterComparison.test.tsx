// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import '@testing-library/jest-dom'
import { PqcImpact } from './sections/SharedSections'

describe('PQC parameter coverage in the certification lesson', () => {
  it('renders distinct algorithm choices, sources and evidence limits in the lesson', () => {
    render(
      <MemoryRouter>
        <PqcImpact />
      </MemoryRouter>
    )
    const section = within(screen.getByRole('region', { name: 'PQC parameter coverage' }))
    expect(section.getAllByRole('row')).toHaveLength(4)
    expect(section.getByText(/there is no pure\/pre-hash signing choice/)).toBeInTheDocument()
    expect(section.getByText(/below 192-bit strength reduces the claim/)).toBeInTheDocument()
    expect(section.getByText(/does not identify the message pre-hash/)).toBeInTheDocument()
    expect(
      section.getByText(/not CC assurance levels or EUCC assurance levels/)
    ).toBeInTheDocument()
    expect(section.getByText(/not product certification evidence/)).toBeInTheDocument()
    for (const number of ['203', '204', '205']) {
      expect(section.getByRole('link', { name: new RegExp(`FIPS ${number}`) })).toHaveAttribute(
        'href',
        `https://doi.org/10.6028/NIST.FIPS.${number}`
      )
    }
    expect(
      section.getByRole('link', { name: 'state-management exercise and review guide' })
    ).toHaveAttribute('href', '/learn/stateful-signatures')
    expect(
      section.getByRole('link', { name: 'SLH-DSA parameter and signing exercises' })
    ).toHaveAttribute('href', '/learn/slh-dsa')
  })
})
