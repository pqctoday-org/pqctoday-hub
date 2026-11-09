// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Introduction } from './Introduction'

describe('Confidential Computing: link to the trust-hardware comparison', () => {
  it('has one "Compare with the other trust hardware" link to Step 6 of Architect Quantum Impact', () => {
    render(
      <MemoryRouter>
        <Introduction onNavigateToWorkshop={() => undefined} />
      </MemoryRouter>
    )
    const links = screen.getAllByRole('link', { name: /Compare with the other trust hardware/ })
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/learn/arch-quantum-impact?tab=workshop&step=5',
    ])
  })
})
