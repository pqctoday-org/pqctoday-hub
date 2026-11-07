// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CryptoPostureMonitor } from './CryptoPostureMonitor'
import { SIZE_COMPARISONS, CAPACITY_METRICS } from '../data/monitoringToolsData'

vi.mock('../data/monitoringToolsData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/monitoringToolsData')>()
  return {
    ...actual,
    SIZE_COMPARISONS: structuredClone(actual.SIZE_COMPARISONS),
    CAPACITY_METRICS: structuredClone(actual.CAPACITY_METRICS),
  }
})
const originalSizes = structuredClone(SIZE_COMPARISONS)
const originalMetrics = structuredClone(CAPACITY_METRICS)
const openCapacity = () => {
  render(<CryptoPostureMonitor />)
  fireEvent.click(screen.getByRole('button', { name: 'Capacity Planner' }))
}
beforeEach(() => {
  SIZE_COMPARISONS.splice(0, SIZE_COMPARISONS.length, ...structuredClone(originalSizes))
  CAPACITY_METRICS.splice(0, CAPACITY_METRICS.length, ...structuredClone(originalMetrics))
})
describe('capacity sample dimensions', () => {
  it('multiplies bytes per handshake by the daily count independently of latency', () => {
    const timing = CAPACITY_METRICS.find((m) => m.id === 'tls-handshake-latency')!
    timing.baselinePerUnit = 999
    timing.pqcPerUnit = 1500
    openCapacity()
    // 500 ×4096/1024 and500 ×18432/1024; changing milliseconds cannot change these volumes.
    expect(screen.getByText('2000.0 KiB/day')).toBeInTheDocument()
    expect(screen.getByText('9000.0 KiB/day')).toBeInTheDocument()
    expect(screen.getByText('0.29 MiB')).toBeInTheDocument()
    expect(screen.getByText('1.37 MiB')).toBeInTheDocument()
    expect(screen.getByText(/not measured performance or a guarantee of total/)).toBeInTheDocument()
    const count = screen.getAllByRole('slider')[1]
    fireEvent.change(count, { target: { value: '100' } })
    expect(screen.getByText('400.0 KiB/day')).toBeInTheDocument()
    expect(screen.getByText('1800.0 KiB/day')).toBeInTheDocument()
    fireEvent.change(count, { target: { value: '100000' } })
    expect(screen.getByText('400000.0 KiB/day')).toBeInTheDocument()
    expect(screen.getByText('1800000.0 KiB/day')).toBeInTheDocument()
  })
  it('keeps a zero sample volume distinct from an absent size row', () => {
    const size = SIZE_COMPARISONS.find((s) => s.id === 'tls-handshake')!
    size.classicalSize = 0
    size.pqcSize = 0
    openCapacity()
    expect(screen.getAllByText('0.0 KiB/day')).toHaveLength(2)
    expect(screen.queryByText('Not assessed')).not.toBeInTheDocument()
  })
  it('does not manufacture a zero volume when the byte-size sample is missing', () => {
    SIZE_COMPARISONS.splice(
      SIZE_COMPARISONS.findIndex((s) => s.id === 'tls-handshake'),
      1
    )
    openCapacity()
    expect(screen.getAllByText('Not assessed')).toHaveLength(2)
    expect(screen.queryByText(/KiB\/day/)).not.toBeInTheDocument()
  })
  it('uses the same scale within each timing or size pair instead of reversing their magnitude', () => {
    openCapacity()
    const timingClassical = screen.getByRole('img', {
      name: 'TLS Handshake Latency (P99): Classical 12 ms',
    })
    const timingPqc = screen.getByRole('img', { name: 'TLS Handshake Latency (P99): PQC 28 ms' })
    expect(timingClassical).toHaveStyle({ width: `${(12 / 28) * 100}%` })
    expect(timingPqc).toHaveStyle({ width: '100%' })
    expect(
      screen.getByRole('img', { name: 'TLS Certificate Chain Size: Classical 2400 bytes' })
    ).toHaveStyle({ width: `${(2400 / 17400) * 100}%` })
    expect(
      screen.getByRole('img', { name: 'TLS Certificate Chain Size: PQC 17400 bytes' })
    ).toHaveStyle({ width: '100%' })
    expect(screen.getByText('Sample Timing and Size Impact')).toBeInTheDocument()
  })
  it('does not show an infinite percentage for a zero reference', () => {
    CAPACITY_METRICS[0].baselinePerUnit = 0
    openCapacity()
    expect(screen.getByText('Percentage not assessed')).toBeInTheDocument()
    expect(screen.queryByText(/Infinity|NaN/)).not.toBeInTheDocument()
  })
})
