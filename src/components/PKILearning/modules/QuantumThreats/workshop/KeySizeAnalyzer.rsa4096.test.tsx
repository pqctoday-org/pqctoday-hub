// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, expect, it } from 'vitest'
import { KeySizeAnalyzer } from './KeySizeAnalyzer'

describe('RSA-4096 resource comparison', () => {
  it('shows the 2025 logical-qubit estimate and retains the historical comparison', () => {
    render(<KeySizeAnalyzer initialAlgorithmA="RSA-4096" initialAlgorithmB="ML-KEM-768" />)
    expect(screen.getByText('~2,692')).toBeInTheDocument()
    expect(screen.getByText(/older 2016-era 2n\+2 figure of 8,194/)).toBeInTheDocument()
    expect(screen.getByText('Est. Logical Qubits')).toBeInTheDocument()
  })
})
