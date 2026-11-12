// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { AccelerationModelExplainer } from './AccelerationModelExplainer'
import { MODELS } from '../data/models'

describe('Model fit remains authored workload guidance', () => {
  it('keeps unmeasured cases distinct from measured positive and contrary workloads', async () => {
    render(<AccelerationModelExplainer initialModel="gpu" />)
    expect(MODELS.find((model) => model.id === 'gpu')?.fit).toEqual({
      mldsa: 'strong',
      slhdsa: 'partial',
      singleOp: 'none',
      batch: 'strong',
    })
    expect(screen.getByText('Not demonstrated')).toBeInTheDocument()
    expect(screen.getByText(/Authored fit guidance/)).toHaveTextContent(
      /not a universal hardware-capability verdict or a benchmark of every implementation/
    )
    expect(screen.getByText(/Authored fit guidance/)).toHaveTextContent(
      /not mathematical impossibility/
    )
    await userEvent.click(screen.getByRole('button', { name: 'NPU (AI accelerator)' }))
    expect(screen.getAllByText('Not demonstrated')).toHaveLength(4)
    expect(screen.getByText('Our desk assessment (not prototyped)')).toBeInTheDocument()
    expect(screen.getByText(/this ML-DSA example needs exact 23-bit/)).toBeInTheDocument()
    expect(screen.getByText(/Authored fit guidance/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Recompose the 23-bit example' }))
    expect(screen.getByTestId('limb-fit-result')).toHaveTextContent('Exact reconstruction: PASS')
    expect(screen.getByTestId('limb-fit-result')).toHaveTextContent('modulo q gives 1')
  })

  it('keeps other model selection and diagrams available with the same scope notice', async () => {
    render(<AccelerationModelExplainer initialModel="scalar" />)
    expect(screen.getByRole('img', { name: 'Scalar processing' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'FPGA' }))
    expect(screen.getByText(/Authored fit guidance/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'FPGA' })).toBeInTheDocument()
  })
})
