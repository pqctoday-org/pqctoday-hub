// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TopologyBuilder } from './TopologyBuilder'

const text = () => (document.body.textContent ?? '').replace(/\s+/g, ' ')

describe('Topology Builder: TLS passthrough segment', () => {
  it('shows a passthrough segment as unresolved, not quantum-vulnerable, and reports it in the analysis', () => {
    render(<TopologyBuilder />)
    fireEvent.click(screen.getByRole('button', { name: /Reverse Proxy/ }))
    // open the connection-mode dropdown (default Classical TLS 1.3) and pick passthrough
    fireEvent.click(screen.getByRole('button', { name: /Classical TLS 1\.3/ }))
    fireEvent.click(screen.getByText('TLS Passthrough'))
    expect(text()).toMatch(/Depends on the endpoints \(unresolved\)/)
    expect(text()).not.toMatch(/Quantum-vulnerable/)
    fireEvent.click(screen.getByRole('button', { name: /Analyze Topology/ }))
    expect(text()).toMatch(/1 segment is not counted as vulnerable or safe/)
    expect(text()).toMatch(/Unresolved/)
  })

  it('marks the passthrough advice with a warning icon, not the success check', () => {
    render(<TopologyBuilder />)
    fireEvent.click(screen.getByRole('button', { name: /Reverse Proxy/ }))
    fireEvent.click(screen.getByRole('button', { name: /Classical TLS 1\.3/ }))
    fireEvent.click(screen.getByText('TLS Passthrough'))
    fireEvent.click(screen.getByRole('button', { name: /Analyze Topology/ }))
    const advice = screen.getByText(/TLS passthrough segments prevent WAF\/IDS inspection/)
    const icon = advice.parentElement?.querySelector('svg')
    expect(icon?.getAttribute('class')).toContain('text-status-warning')
    expect(icon?.getAttribute('class')).not.toContain('text-status-success')
  })
})
