// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PlatformExplorer } from './PlatformExplorer'
vi.mock('./CommonPlatformResults', () => ({ CommonPlatformResults: () => null }))
describe('Historical platform rate display preserves its measurement meaning', () => {
  it('labels reciprocal-rate values as completion intervals without replacing measured latency evidence', () => {
    render(<PlatformExplorer />)
    expect(screen.getAllByText(/completion interval ·/)).toHaveLength(3)
    expect(
      screen.getByText(/not a measured single-signature latency or a latency percentile/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/µs per signature/)).not.toBeInTheDocument()
  })
})
