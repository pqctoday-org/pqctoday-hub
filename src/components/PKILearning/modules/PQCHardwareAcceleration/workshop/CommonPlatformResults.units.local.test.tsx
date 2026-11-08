// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { CommonPlatformResults } from './CommonPlatformResults'
vi.mock('../data/scenario39', () => ({
  SCENARIO39_OPERATIONS: [
    {
      id: 'sample',
      category: 'pqc',
      label: 'Sample operation',
      explanation: 'Fictional throughput fixture',
    },
  ],
  SCENARIO39_SOURCE: {
    dataset: 'Sample dataset',
    note: 'Sample rates only',
    dashboard: 'sample',
    evidence: 'sample',
  },
  X1_ISA_RESULTS: [],
  getScenario39Ranked: (_operation: unknown, profile: string) => [
    {
      platform: {
        id: 'sample',
        label: 'Sample platform',
        cpu: 'Four assumed workers',
        note: 'Controlled fixture',
      },
      tps: profile === 'wholePlatform' ? 4000 : 1000,
    },
  ],
  getScenario39Scaling: () => 4,
}))
describe('Aggregate throughput reciprocal is a completion interval', () => {
  it('keeps aggregate/one-worker rates and reciprocal units distinct from measured latency', async () => {
    render(<CommonPlatformResults />)
    expect(
      screen.getByRole('columnheader', { name: 'Completion interval (1/TPS)' })
    ).toBeInTheDocument()
    expect(screen.getByText('250 µs')).toBeInTheDocument()
    expect(screen.getByText(/not a measured single-operation latency/)).toBeInTheDocument()
    // 4,000 aggregate completions/s => .00025s between completions; not operation p50.
    await userEvent.click(screen.getByRole('button', { name: 'One active worker' }))
    expect(screen.getByText('1.00 ms')).toBeInTheDocument()
    expect(screen.getByText('1,000')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Time / operation' })).not.toBeInTheDocument()
  })
})
