// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PerformanceBenchmarkDesigner } from './PerformanceBenchmarkDesigner'

describe('Performance arithmetic versus observed evidence', () => {
  it('retains the actual transforms while disclosing unverified references and non-measured load adjustments', () => {
    render(<PerformanceBenchmarkDesigner />)
    expect(screen.getByText(/Stored reference values are attributed/)).toHaveTextContent(
      'not independently verified here'
    )
    expect(screen.getByText(/TLS latency is multiplied/)).toHaveTextContent(
      'traffic control does not change VPN values'
    )
    expect(screen.getAllByText('51.5K', { exact: true }).length).toBeGreaterThan(0) // 51520
    expect(screen.getByText('17.8K', { exact: true })).toBeInTheDocument() // VPN17768
    fireEvent.click(screen.getByRole('button', { name: /Burst \(Login Storm\)/ }))
    expect(screen.getAllByText('10.3K', { exact: true }).length).toBeGreaterThan(0) // 51520/5
    expect(screen.getByText('17.8K', { exact: true })).toBeInTheDocument() // unchanged VPN
    expect(screen.getAllByText('2.7ms', { exact: true }).length).toBeGreaterThan(0) // unchanged TLS2.72
    fireEvent.click(screen.getByRole('button', { name: /NGFW TLS Inspection/ }))
    expect(screen.getAllByText('5.15K', { exact: true }).length).toBeGreaterThan(0) // 51520/2/5
    expect(screen.getByText('8.88K', { exact: true })).toBeInTheDocument() // VPN17768/2
    expect(screen.getAllByText('5.4ms', { exact: true }).length).toBeGreaterThan(0) // TLS2.72*2
    expect(screen.getByText(/These authored adjustments do not measure/)).toBeInTheDocument()
  })
})
