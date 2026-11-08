// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Agent2AgentProtocol } from './Agent2AgentProtocol'
describe('unrun protocol configuration educational scope', () => {
  it('labels default outputs as estimates rather than a tested protocol', () => {
    render(<Agent2AgentProtocol />)
    expect(
      screen.getByText(/No handshake, authentication, signature or interoperability check/)
    ).toBeInTheDocument()
    expect(screen.getByText('Selected PQC KEM category only')).toBeInTheDocument()
    expect(screen.getByText('Category 3')).toBeInTheDocument()
    expect(screen.getByText('Illustrative transport rubric (not tested)')).toBeInTheDocument()
    expect(screen.queryByText('Security Level')).not.toBeInTheDocument()
  })
  it('does not turn category 5 KEM plus weaker signing or PSK selection into overall security', () => {
    render(<Agent2AgentProtocol />)
    fireEvent.click(screen.getByRole('button', { name: 'KEM:' }))
    fireEvent.click(screen.getByRole('option', { name: 'ML-KEM-1024' }))
    fireEvent.click(screen.getByRole('button', { name: 'Auth:' }))
    fireEvent.click(screen.getByRole('option', { name: 'Pre-Shared Key' }))
    expect(screen.getByText('Category 5')).toBeInTheDocument()
    expect(
      screen.getByText(/PSK strength and channel authentication are not evaluated/)
    ).toBeInTheDocument()
    expect(screen.queryByText('Partial')).not.toBeInTheDocument()
    expect(screen.queryByText('NIST 5')).not.toBeInTheDocument()
  })
})
