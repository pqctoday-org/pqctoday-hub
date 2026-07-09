// SPDX-License-Identifier: GPL-3.0-only
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { WorkbenchPresets } from './WorkbenchPresets'
import { useOpenSSLStore } from '../store'

vi.mock('../store', () => ({
  useOpenSSLStore: vi.fn(),
}))

describe('WorkbenchPresets', () => {
  const mockSetCommand = vi.fn()
  const mockSetCategory = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useOpenSSLStore).mockReturnValue({ setCommand: mockSetCommand })
  })

  const openList = () => {
    render(<WorkbenchPresets setCategory={mockSetCategory} />)
    fireEvent.click(screen.getByText('Quick Start'))
  }

  it('ML-KEM-768 decapsulate preset uses -out, not -secret (regression guard)', () => {
    openList()
    fireEvent.click(screen.getByText('ML-KEM-768 decapsulate'))
    const cmd = mockSetCommand.mock.calls.at(-1)?.[0] as string
    expect(cmd).toContain('pkeyutl -decap')
    expect(cmd).toMatch(/-out\s+\S+/)
    expect(cmd).not.toContain('-secret')
  })

  it('marks the two shell-pipe presets as reference-only so users know not to click Run', () => {
    openList()
    expect(screen.getByText(/SHA-256 digest \(reference only/)).toBeInTheDocument()
    expect(screen.getByText(/List PQC algorithms \(reference only/)).toBeInTheDocument()
  })

  it('runnable presets are not labeled reference-only', () => {
    openList()
    expect(screen.getByText('Generate ML-DSA-65 key')).toBeInTheDocument()
    expect(screen.queryByText(/Generate ML-DSA-65 key \(reference only/)).not.toBeInTheDocument()
  })
})
