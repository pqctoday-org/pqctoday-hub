// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TLSHandshakeDiagram } from './TLSHandshakeDiagram'
import { useTLSStore } from '@/store/tls-learning.store'

vi.mock('@/store/useHistoryStore', () => ({
  useHistoryStore: {
    getState: () => ({ addEvent: () => {} }),
  },
}))

function setGroups(groups: string[]) {
  const { clientConfig } = useTLSStore.getState()
  useTLSStore.setState({ clientConfig: { ...clientConfig, groups } })
}

describe('TLSHandshakeDiagram key-share sizes', () => {
  beforeEach(() => {
    localStorage.clear()
    useTLSStore.getState().reset()
  })

  it('shows combined hybrid sizes for X25519MLKEM768 (ML-KEM-768 + X25519)', () => {
    setGroups(['X25519MLKEM768'])
    render(<TLSHandshakeDiagram />)
    // 1,184 + 32 = 1216 client share; 1,088 + 32 = 1120 server response
    expect(screen.getAllByText(/client share 1216 B/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/1120 B/).length).toBeGreaterThan(0)
  })

  it('shows pure ML-KEM-768 sizes for the MLKEM768 group', () => {
    setGroups(['MLKEM768'])
    render(<TLSHandshakeDiagram />)
    expect(screen.getAllByText(/client share 1184 B/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/1088 B/).length).toBeGreaterThan(0)
  })

  it('resolves the store-canonical EC group name P-256', () => {
    setGroups(['P-256'])
    render(<TLSHandshakeDiagram />)
    // Previously keyed as 'P256', silently falling back to hybrid sizes
    expect(screen.getAllByText(/client share 65 B/).length).toBeGreaterThan(0)
  })

  it('shows the FIPS 204 final ML-DSA-65 signature size', () => {
    setGroups(['X25519MLKEM768'])
    render(<TLSHandshakeDiagram />)
    // Default first sigalg is mldsa44 (2,420 B); switch to mldsa65
    const { serverConfig } = useTLSStore.getState()
    useTLSStore.setState({
      serverConfig: { ...serverConfig, signatureAlgorithms: ['mldsa65'] },
    })
    render(<TLSHandshakeDiagram />)
    expect(screen.getAllByText(/3,309 B/).length).toBeGreaterThan(0)
  })
})
