// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Agent2AgentProtocol } from './Agent2AgentProtocol'

function select(control: string, option: string) {
  fireEvent.click(screen.getByRole('button', { name: control }))
  fireEvent.click(screen.getByRole('option', { name: option }))
}

describe('selected agent security properties', () => {
  it('reports different KEM and signature categories without combining them', () => {
    render(<Agent2AgentProtocol />)
    select('KEM:', 'ML-KEM-1024')
    expect(screen.getByText('Category 5')).toBeInTheDocument()
    expect(screen.getByText('ML-DSA-44: claimed NIST category 2')).toBeInTheDocument()
    expect(screen.getByText(/not an overall protocol category/)).toBeInTheDocument()
    select('Signing:', 'ML-DSA-65')
    expect(screen.getByText('ML-DSA-65: claimed NIST category 3')).toBeInTheDocument()
    expect(screen.getByText('Category 5')).toBeInTheDocument()
    select('Signing:', 'ML-DSA-44')
    expect(screen.getByText('ML-DSA-44: claimed NIST category 2')).toBeInTheDocument()
  })

  it('does not classify an unspecified PSK as quantum-unsafe', () => {
    render(<Agent2AgentProtocol />)
    select('Auth:', 'Pre-Shared Key')
    const statement = screen.getByText(/The sample selects PSK authentication/)
    expect(statement).toHaveTextContent('Quantum resistance is not assessed')
    expect(statement).toHaveTextContent('key entropy, provisioning, key establishment')
    expect(statement).toHaveTextContent('a PSK is not inherently quantum-unsafe')
    select('KEM:', 'ML-KEM-1024')
    expect(statement).toHaveTextContent('Quantum resistance is not assessed')
  })

  it('preserves channel authentication when message signatures are deselected', () => {
    render(<Agent2AgentProtocol />)
    select('Signing:', 'None')
    expect(screen.getByText(/No per-message signature selected/)).toHaveTextContent(
      'does not remove separately selected channel authentication'
    )
    expect(screen.getByText(/The sample selects mutually authenticated TLS/)).toHaveTextContent(
      'Channel authentication is assumed, not executed'
    )
    select('Auth:', 'DPoP Token')
    expect(screen.getByText(/The sample selects a proof-of-possession token/)).toHaveTextContent(
      'signing algorithm, token validation, replay protection and channel binding'
    )
    expect(
      screen.queryByText(/The sample selects mutually authenticated TLS/)
    ).not.toBeInTheDocument()
  })

  it('does not invent a category for an unspecified SLH-DSA parameter set', () => {
    render(<Agent2AgentProtocol />)
    select('Signing:', 'SLH-DSA')
    expect(
      screen.getByText('SLH-DSA: category not assessed without a parameter set')
    ).toBeInTheDocument()
    expect(screen.getByText(/Use your production tools to inspect/)).toHaveTextContent(
      'test valid and rejected cases'
    )
    expect(
      screen.getByText(/No handshake, authentication, signature or interoperability check/)
    ).toBeInTheDocument()
  })
})
