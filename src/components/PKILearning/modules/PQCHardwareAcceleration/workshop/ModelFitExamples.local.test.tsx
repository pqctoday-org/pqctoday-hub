// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AccelerationModelExplainer } from './AccelerationModelExplainer'
import { OffloadLab } from './OffloadLab'
import { AccelerationExercises } from '../components/AccelerationExercises'

describe('Useful model-fit comparison consumers', () => {
  it('keeps the separate batching lab scoped to its measured implementation', () => {
    render(<OffloadLab />)
    expect(screen.getByText(/Neither the lane illustration/)).toHaveTextContent(
      'proves single-operation latency'
    )
    expect(screen.getByText(/In the retained Metal ML-DSA-65 signing study/)).toHaveTextContent(
      'first kernel'
    )
    expect(
      screen.queryByText(/the CPU, built for low latency, finishes first/)
    ).not.toBeInTheDocument()
  })

  it('changes actual measured GPU workload inputs from a CPU win to GPU wins', async () => {
    render(<AccelerationModelExplainer initialModel="gpu" />)
    const result = screen.getByTestId('gpu-fit-result')
    expect(result).toHaveTextContent('0.54× CPU throughput')
    expect(result).toHaveTextContent('The all-core CPU wins this measured batch')
    await userEvent.click(screen.getByRole('button', { name: /Measured key-generation batch/ }))
    await userEvent.click(screen.getByRole('option', { name: '4,096' }))
    expect(result).toHaveTextContent('5.87× CPU throughput')
    expect(result).toHaveTextContent('The GPU wins this measured batch')
    await userEvent.click(screen.getByRole('button', { name: /Measured key-generation batch/ }))
    await userEvent.click(screen.getByRole('option', { name: '65,536' }))
    expect(result).toHaveTextContent('9.27× CPU throughput')
    expect(screen.getByText(/Batch 1 was not measured here/)).toBeVisible()
  })

  it('executes exact representation beside distinct unsupported-path and inefficient-partition cases', async () => {
    render(<AccelerationModelExplainer initialModel="npu" />)
    expect(screen.getByRole('heading', { name: '1. Unsupported software path' })).toBeVisible()
    expect(screen.getByText(/3,242 µs offloaded versus 359 µs/)).toBeVisible()
    expect(screen.queryByTestId('limb-fit-result')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Recompose the 23-bit example' }))
    const result = screen.getByTestId('limb-fit-result')
    expect(result).toHaveTextContent('little-endian base-256 limbs: [0, 224, 127]')
    expect(result).toHaveTextContent('Exact reconstruction: PASS')
    expect(result).toHaveTextContent('Keeping only the low byte gives 0 and loses the value')
    expect(result).toHaveTextContent('9 byte-pair products')
    expect(result).toHaveTextContent('modulo q gives 1')
    expect(screen.getByText(/This executed integer example/)).toHaveTextContent(
      'does not establish an implemented or fast NPU kernel'
    )
    expect(screen.getByRole('link', { name: /NXP eIQ FAQ/ })).toHaveAttribute(
      'href',
      'https://community.nxp.com/t5/eIQ-Machine-Learning-Software/eIQ-FAQ/ta-p/1099741'
    )
  })

  it('keeps paired exercise navigation and worked expected outcomes aligned with actual model controls', async () => {
    const navigate = vi.fn(),
      config = vi.fn()
    render(
      <MemoryRouter>
        <AccelerationExercises onNavigateToSimulate={navigate} onSetSimulationConfig={config} />
      </MemoryRouter>
    )
    expect(
      screen.queryByText(/single lane works|rounded 8-bit|Cannot Help/)
    ).not.toBeInTheDocument()
    expect(screen.getByText(/0.54× at 256, 5.87× at 4,096 and 9.27× at 65,536/)).toBeVisible()
    expect(screen.getByText(/nine byte-pair products give/)).toBeVisible()
    await userEvent.click(screen.getAllByRole('button', { name: 'Load & Run' })[0])
    expect(config).toHaveBeenLastCalledWith({ step: 0, model: 'gpu' })
    await userEvent.click(screen.getAllByRole('button', { name: 'Load & Run' })[1])
    expect(config).toHaveBeenLastCalledWith({ step: 0, model: 'npu' })
    expect(navigate).toHaveBeenCalledTimes(2)
  })
})
