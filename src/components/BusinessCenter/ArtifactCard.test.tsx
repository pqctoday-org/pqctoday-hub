// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ArtifactPlaceholder } from './ArtifactCard'
import { usePersonaStore } from '@/store/usePersonaStore'

describe('ArtifactPlaceholder', () => {
  it('invokes onCreate with the artifact type when clicked', () => {
    const onCreate = vi.fn()
    render(<ArtifactPlaceholder type="risk-register" pillar="risk" onCreate={onCreate} />)

    fireEvent.click(screen.getByText('Risk Register'))

    expect(onCreate).toHaveBeenCalledExactlyOnceWith('risk-register')
  })

  it('renders the tool description from the shared registry instead of a module name', () => {
    render(<ArtifactPlaceholder type="crqc-scenario" pillar="risk" onCreate={() => undefined} />)

    expect(screen.getByText(/quantum computer threat scenarios/i)).toBeInTheDocument()
    // Legacy "Build in the pqc-risk-management module" copy must be gone.
    expect(screen.queryByText(/Build in the/i)).not.toBeInTheDocument()
  })

  it('surfaces the Not created status chip', () => {
    render(
      <ArtifactPlaceholder type="deployment-playbook" pillar="vendor" onCreate={() => undefined} />
    )

    expect(screen.getByText('Not created')).toBeInTheDocument()
    expect(screen.getByText('Deployment Playbook')).toBeInTheDocument()
  })
})

describe('ArtifactPlaceholder — types made on another page', () => {
  beforeEach(() => {
    usePersonaStore.setState({ selectedPersona: 'executive' })
  })

  function renderAt(ui: React.ReactElement) {
    return render(
      <MemoryRouter initialEntries={['/business']}>
        <Routes>
          <Route path="/business" element={ui} />
          <Route path="/playground/hsm-capacity" element={<p>HSM capacity page</p>} />
          <Route path="*" element={<p>other page</p>} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('links an uncreated card to the page that makes it, instead of opening the drawer', () => {
    const onCreate = vi.fn()
    renderAt(
      <ArtifactPlaceholder type="hsm-capacity-plan" pillar="architecture" onCreate={onCreate} />
    )

    const link = screen.getByRole('link', { name: /Made in the HSM capacity calculator/ })
    expect(link).toHaveAttribute('href', '/playground/hsm-capacity')
    fireEvent.click(link)
    expect(onCreate).not.toHaveBeenCalled()
    expect(screen.getByText('HSM capacity page')).toBeInTheDocument()
  })

  it('keeps the builder card as a button that opens the drawer', () => {
    const onCreate = vi.fn()
    renderAt(<ArtifactPlaceholder type="risk-register" pillar="risk" onCreate={onCreate} />)

    expect(screen.queryByRole('link')).toBeNull()
    fireEvent.click(screen.getByText('Risk Register'))
    expect(onCreate).toHaveBeenCalledExactlyOnceWith('risk-register')
  })

  it('a pack card shows its note and does not link for a visitor with another persona', () => {
    const onCreate = vi.fn()
    renderAt(
      <ArtifactPlaceholder type="architecture-scope" pillar="governance" onCreate={onCreate} />
    )

    expect(screen.queryByRole('link')).toBeNull()
    expect(
      screen.getByText('Made in the Architecture pack, shown on this page for the Architect role')
    ).toBeInTheDocument()
    fireEvent.click(screen.getByText('Architecture Scope'))
    expect(onCreate).toHaveBeenCalledExactlyOnceWith('architecture-scope')
  })

  it('a pack card links to the panel anchor for the matching persona', () => {
    usePersonaStore.setState({ selectedPersona: 'architect' })
    renderAt(
      <ArtifactPlaceholder type="architecture-scope" pillar="governance" onCreate={vi.fn()} />
    )

    expect(screen.getByRole('link')).toHaveAttribute('href', '/business#architecture-pack')
  })
})
