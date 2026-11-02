// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { MovedContentGate } from './MovedContentGate'

const Where = ({ label }: { label: string }) => {
  const { pathname, search, hash } = useLocation()
  return <div data-testid={label}>{`${pathname}${search}${hash}`}</div>
}

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/learn/confidential-computing"
          element={
            <MovedContentGate from="confidential-computing">
              <Where label="tee" />
            </MovedContentGate>
          }
        />
        <Route path="/learn/homomorphic-encryption" element={<Where label="fhe" />} />
        <Route
          path="/learn/hybrid-crypto"
          element={
            <MovedContentGate from="hybrid-crypto">
              <Where label="hybrid" />
            </MovedContentGate>
          }
        />
      </Routes>
    </MemoryRouter>
  )

describe('MovedContentGate (confidential-computing → homomorphic-encryption)', () => {
  it('replaces an old FHE workshop link with the new module’s URL', () => {
    renderAt('/learn/confidential-computing?tab=workshop&step=5')
    expect(screen.getByTestId('fhe')).toHaveTextContent(
      '/learn/homomorphic-encryption?tab=workshop&step=0'
    )
    expect(screen.queryByTestId('tee')).toBeNull()
  })

  it('replaces an old FHE section link', () => {
    renderAt('/learn/confidential-computing#homomorphic-encryption')
    expect(screen.getByTestId('fhe')).toHaveTextContent(
      '/learn/homomorphic-encryption#fhe-fundamentals'
    )
  })

  it('renders the TEE module for every other URL', () => {
    renderAt('/learn/confidential-computing?tab=workshop&step=4#attestation')
    expect(screen.getByTestId('tee')).toHaveTextContent(
      '/learn/confidential-computing?tab=workshop&step=4#attestation'
    )
    expect(screen.queryByTestId('fhe')).toBeNull()
  })
})

describe('MovedContentGate (hybrid-crypto workshop steps were reordered)', () => {
  it('sends an old-order link to the same workshop step in the new order, once', () => {
    renderAt('/learn/hybrid-crypto?tab=workshop&step=5')
    expect(screen.getByTestId('hybrid')).toHaveTextContent(
      '/learn/hybrid-crypto?tab=workshop&step=3&sv=2'
    )
  })

  it('renders a current link as it is', () => {
    renderAt('/learn/hybrid-crypto?tab=workshop&step=3&sv=2')
    expect(screen.getByTestId('hybrid')).toHaveTextContent(
      '/learn/hybrid-crypto?tab=workshop&step=3&sv=2'
    )
  })
})
