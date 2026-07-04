// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { DiscoverySection } from './DiscoverySection'

const renderSection = (props: Partial<React.ComponentProps<typeof DiscoverySection>> = {}) =>
  render(
    <MemoryRouter>
      <DiscoverySection
        algorithmsSelected={[]}
        algorithmCategories={[]}
        algorithmUnknown={false}
        defaultOpen
        {...props}
      />
    </MemoryRouter>
  )

describe('DiscoverySection', () => {
  it('lists specific self-reported algorithms as the starting inventory', () => {
    renderSection({ algorithmsSelected: ['RSA-2048', 'ECDSA P-256'] })
    expect(screen.getByText('RSA-2048')).toBeInTheDocument()
    expect(screen.getByText('ECDSA P-256')).toBeInTheDocument()
    expect(screen.getByText(/self-reported starting point/)).toBeInTheDocument()
  })

  it('falls back to coarse categories when no specific algorithms were selected', () => {
    renderSection({ algorithmsSelected: [], algorithmCategories: ['Key Exchange', 'Signatures'] })
    expect(screen.getByText('Key Exchange')).toBeInTheDocument()
    expect(screen.getByText('Signatures')).toBeInTheDocument()
  })

  it('shows the "not inventoried yet" message when the user said they don\'t know', () => {
    renderSection({ algorithmUnknown: true, algorithmsSelected: [] })
    expect(
      screen.getByText(/your cryptography isn.t inventoried yet/i)
    ).toBeInTheDocument()
  })

  it('never references the fictional sample estate dataset', () => {
    const { container } = renderSection({ algorithmsSelected: ['RSA-2048'] })
    expect(container.textContent).not.toMatch(/sample enterprise|canonical estate/i)
  })

  it('links to the CBOM Learn module and the Migrate inventory tooling', () => {
    renderSection()
    expect(screen.getByRole('link', { name: /Learn how to run a real crypto discovery/i })).toHaveAttribute(
      'href',
      '/learn/cbom'
    )
    expect(
      screen.getByRole('link', { name: /Explore discovery & inventory tooling/i })
    ).toHaveAttribute('href', '/migrate')
  })
})
