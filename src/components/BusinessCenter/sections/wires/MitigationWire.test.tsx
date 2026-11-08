// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MitigationWire } from './MitigationWire'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import type { BusinessMetrics } from '../../hooks/useBusinessMetrics'

const renderWire = () =>
  render(
    <MemoryRouter>
      <MitigationWire metrics={{} as BusinessMetrics} />
    </MemoryRouter>
  )

describe('MitigationWire', () => {
  beforeEach(() => {
    useBookmarkStore.setState({ myPlaygroundTools: [] })
  })

  it('does not promise that bookmarked tools become gateway candidates when nothing is bookmarked', () => {
    renderWire()
    expect(screen.queryByText(/mitigation candidates/i)).not.toBeInTheDocument()
    expect(screen.getByText(/No bookmarked playground tools yet/i)).toBeInTheDocument()
  })

  it('lists a random-generator demo and a gateway-style demo alike as prototypes, not mitigation products', () => {
    useBookmarkStore.setState({ myPlaygroundTools: ['entropy', 'tls-simulator'] })
    renderWire()
    // Both bookmarks appear, with the same neutral label.
    expect(screen.getByRole('button', { name: 'entropy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'tls-simulator' })).toBeInTheDocument()
    expect(screen.getByText(/Bookmarked playground tools \(2\) — prototypes/)).toBeInTheDocument()
    expect(screen.getByText(/not a list of mitigation products/i)).toBeInTheDocument()
    expect(screen.getByText(/a bookmark does not make a tool a gateway/i)).toBeInTheDocument()
  })

  it('states the service and protocol limits and attributes only what NIST CSWP 39 says', () => {
    useBookmarkStore.setState({ myPlaygroundTools: ['entropy'] })
    renderWire()
    expect(
      screen.getByText(/support the specific protocols and services it sits in front of/i)
    ).toBeInTheDocument()
    // §4.6 does not say gateways are temporary or require a sunset date.
    expect(screen.queryByText(/mitigation gateways are temporary/i)).not.toBeInTheDocument()
    expect(screen.getByText(/a planning suggestion, not a NIST requirement/i)).toBeInTheDocument()
  })
})
