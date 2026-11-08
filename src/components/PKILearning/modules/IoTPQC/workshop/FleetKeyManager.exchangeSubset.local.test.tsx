// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FleetKeyManager } from './FleetKeyManager'

describe('Fleet exchange subset reader scope', () => {
  it('keeps existing arithmetic while excluding the signing bytes from network and full-rotation claims', () => {
    render(<FleetKeyManager />)
    const results = within(screen.getByTestId('rotation-results'))
    expect(results.getByText('2,472 B')).toBeInTheDocument() // 1184 + 1088 + 200
    expect(results.getByText(/Annual modeled KEM \+ framing volume/)).toHaveTextContent('4.9 GB') // 2M * 2472 / 1e9
    expect(results.getByText('KEM + framing per device (signature excluded)')).toBeInTheDocument()
    expect(
      results.getByText('Partial network time per cell (signature excluded)')
    ).toBeInTheDocument()
    expect(
      results.getByText(/Signature bytes are not included in network time or annual volume/)
    ).toBeInTheDocument()
    expect(results.getByText(/The larger time in this incomplete model/)).toHaveTextContent('1.1 h')
    expect(screen.getByText(/This incomplete comparison does not establish/)).toHaveTextContent(
      'the full rotation time or actual bottleneck'
    )
    expect(screen.getByText(/Illustrative ratings, 2 operations per device/)).toHaveTextContent(
      'one signature'
    )
    expect(screen.queryByText(/Fleet rotation takes about/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'ML-KEM-768 (category 3)' }))
    fireEvent.click(screen.getByRole('option', { name: 'ML-KEM-512 (category 1)' }))
    expect(results.getByText('1,768 B')).toBeInTheDocument() // 800 + 768 + 200
    expect(results.getByText(/Annual modeled KEM \+ framing volume/)).toHaveTextContent('3.5 GB')
    expect(results.getByText(/The larger time in this incomplete model/)).toHaveTextContent('1.1 h')
    expect(results.getByText(/Signature bytes are not included/)).toBeInTheDocument()
  })
})
