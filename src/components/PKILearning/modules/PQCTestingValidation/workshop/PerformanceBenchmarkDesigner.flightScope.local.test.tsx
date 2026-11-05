// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PerformanceBenchmarkDesigner } from './PerformanceBenchmarkDesigner'

describe('benchmark metric flight interpretation', () => {
  it('distinguishes the certificate flight from the independently selectable ClientHello metric', () => {
    render(<PerformanceBenchmarkDesigner />)
    fireEvent.click(screen.getByRole('button', { name: 'Certificate Size' }))
    expect(
      screen.getByText(
        'Leaf certificate size (affects the Certificate message flight, not ClientHello)'
      )
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'ClientHello Size' }))
    expect(screen.queryByText(/Leaf certificate size/)).not.toBeInTheDocument()
    expect(screen.getByText(/TLS ClientHello byte count/)).toBeVisible()
  })
})
