// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PolicyTemplateGenerator } from './PolicyTemplateGenerator'

describe('PolicyTemplateGenerator', () => {
  it('renders all four policy type tiles', () => {
    render(<PolicyTemplateGenerator />)
    expect(
      screen.getByRole('button', { name: /Cryptographic Algorithm Policy/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Key Management Policy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Vendor Crypto Requirements/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Migration Timeline Policy/i })).toBeInTheDocument()
  })

  it('shows crypto-algorithm sections by default', () => {
    render(<PolicyTemplateGenerator />)
    const banner = screen.getByTestId('active-policy-banner')
    expect(banner).toHaveTextContent(/Editing: Cryptographic Algorithm Policy/i)
    expect(screen.getByRole('heading', { name: 'Approved Algorithms' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Prohibited Algorithms' })).toBeInTheDocument()
  })

  it('switches banner and sections when Key Management tile is clicked', () => {
    render(<PolicyTemplateGenerator />)
    fireEvent.click(screen.getByRole('button', { name: /Key Management Policy/i }))
    expect(screen.getByTestId('active-policy-banner')).toHaveTextContent(
      /Editing: Key Management Policy/i
    )
    expect(screen.getByRole('heading', { name: 'Key Lifecycle Requirements' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'HSM Requirements' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Approved Algorithms' })).not.toBeInTheDocument()
  })

  it('switches banner and sections when Vendor Requirements tile is clicked', () => {
    render(<PolicyTemplateGenerator />)
    fireEvent.click(screen.getByRole('button', { name: /Vendor Crypto Requirements/i }))
    expect(screen.getByTestId('active-policy-banner')).toHaveTextContent(
      /Editing: Vendor Crypto Requirements/i
    )
    expect(
      screen.getByRole('heading', { name: 'Vendor Cryptographic Requirements' })
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Approved Algorithms' })).not.toBeInTheDocument()
  })

  it('switches banner and sections when Migration Timeline tile is clicked', () => {
    render(<PolicyTemplateGenerator />)
    fireEvent.click(screen.getByRole('button', { name: /Migration Timeline Policy/i }))
    expect(screen.getByTestId('active-policy-banner')).toHaveTextContent(
      /Editing: Migration Timeline Policy/i
    )
    expect(screen.getByRole('heading', { name: 'Migration Deadlines' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'System Prioritization' })).toBeInTheDocument()
  })

  it('marks the selected tile via aria-pressed', () => {
    render(<PolicyTemplateGenerator />)
    const cryptoTile = screen.getByRole('button', { name: /Cryptographic Algorithm Policy/i })
    const keyMgmtTile = screen.getByRole('button', { name: /Key Management Policy/i })
    expect(cryptoTile).toHaveAttribute('aria-pressed', 'true')
    expect(keyMgmtTile).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(keyMgmtTile)
    expect(cryptoTile).toHaveAttribute('aria-pressed', 'false')
    expect(keyMgmtTile).toHaveAttribute('aria-pressed', 'true')
  })
})
