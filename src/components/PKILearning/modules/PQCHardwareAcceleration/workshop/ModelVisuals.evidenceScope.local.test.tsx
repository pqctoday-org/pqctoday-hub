// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ModelVisual } from './ModelVisuals'

describe('Authored acceleration diagrams preserve their evidence limits', () => {
  it('keeps the GPU one-operation and batch examples without treating lane fill as a hardware limit', () => {
    render(<ModelVisual id="gpu" />)
    expect(screen.getByRole('img', { name: 'GPU batching' })).toBeInTheDocument()
    expect(screen.getByText('1 signature')).toBeInTheDocument()
    expect(screen.getByText('4,096 signatures')).toBeInTheDocument()
    expect(screen.getByText(/internal parallel work not shown/)).toBeInTheDocument()
    expect(screen.getByText(/not measurements or a limit on parallelism/)).toBeInTheDocument()
    expect(screen.queryByText(/the CPU finishes first/)).not.toBeInTheDocument()
    expect(screen.queryByText(/only a full batch pays it back/)).not.toBeInTheDocument()
  })

  it('scopes the 23-bit requirement to the ML-DSA example without claiming an NPU cannot implement it', () => {
    render(<ModelVisual id="npu" />)
    expect(screen.getByRole('img', { name: 'Illustrative NPU kernel mapping' })).toBeInTheDocument()
    expect(screen.getByText(/this ML-DSA example needs exact 23-bit/)).toBeInTheDocument()
    expect(screen.getByText(/8,380,417/)).toBeInTheDocument()
    expect(screen.getByText(/single 8-bit lane/)).toBeInTheDocument()
    expect(screen.getByText(/different from mathematical impossibility/)).toHaveTextContent(
      /does not establish a platform’s capability or the absence of a CPU in a complete SoC/
    )
    expect(screen.queryByText(/NPU quantisation rounds by design/)).not.toBeInTheDocument()
    expect(screen.queryByText(/fixed-function NPU has no such neighbour/)).not.toBeInTheDocument()
  })

  it('labels the hard-wired engine by circuits, with parameters fixed only unless microcode or firmware is writable', () => {
    render(<ModelVisual id="asic" />)
    expect(screen.getByRole('img', { name: 'ASIC engine' })).toBeInTheDocument()
    expect(screen.getByText('fixed circuits')).toBeInTheDocument()
    const label = screen.getByTestId('asic-parameters-label')
    expect((label.textContent ?? '').replace(/\s+/g, ' ').trim()).toBe(
      'parameters fixed unless microcode/firmware is writable'
    )
    expect(screen.queryByText('fixed algorithms')).not.toBeInTheDocument()
    expect(screen.queryByText('fixed parameter sets')).not.toBeInTheDocument()
  })
})
