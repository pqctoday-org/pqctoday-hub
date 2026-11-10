// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PerformanceBenchmarkDesigner } from './PerformanceBenchmarkDesigner'
import { PRODUCTION_TLS_KPIS, PRODUCTION_VPN_KPIS } from '../data/testingConstants'

const originalTls = PRODUCTION_TLS_KPIS.map((row) => ({ ...row }))
const originalVpn = PRODUCTION_VPN_KPIS.map((row) => ({ ...row }))

afterEach(() => {
  PRODUCTION_TLS_KPIS.forEach((row, i) => Object.assign(row, originalTls[i]))
  PRODUCTION_VPN_KPIS.forEach((row, i) => Object.assign(row, originalVpn[i]))
})

describe('KPI relative change from the actual numerical pair', () => {
  it('corrects the original VPN latency and rate percentages with a classical denominator', () => {
    render(<PerformanceBenchmarkDesigner />)
    expect(screen.getByText('25.07% increase vs classical')).toBeInTheDocument()
    expect(screen.getByText('74.84% decrease vs classical')).toBeInTheDocument()
    expect(screen.getByText('Classical 3.422 ms → Hybrid 4.28 ms')).toBeInTheDocument()
    expect(screen.getByText(/Relative change =/)).toHaveTextContent(
      '(Hybrid − Classical) / Classical × 100'
    )
    expect(screen.queryByText(/20% increase/)).not.toBeInTheDocument()
    expect(screen.queryByText(/297% slower/)).not.toBeInTheDocument()
  })

  it('uses changed latency and rate values rather than authored percentage strings', () => {
    Object.assign(PRODUCTION_VPN_KPIS[1], { classical: 8, hybrid: 2 })
    Object.assign(PRODUCTION_TLS_KPIS[0], { classical: 100, hybrid: 150 })
    render(<PerformanceBenchmarkDesigner />)
    expect(screen.getByText('75.00% decrease vs classical')).toBeInTheDocument()
    expect(screen.getByText('50.00% increase vs classical')).toBeInTheDocument()
    expect(screen.getByText('Classical 8 ms → Hybrid 2 ms')).toBeInTheDocument()
  })

  it('leaves a zero classical denominator undefined, including a zero-to-zero pair', () => {
    Object.assign(PRODUCTION_VPN_KPIS[1], { classical: 0, hybrid: 4 })
    Object.assign(PRODUCTION_VPN_KPIS[0], { classical: 0, hybrid: 0 })
    render(<PerformanceBenchmarkDesigner />)
    expect(screen.getAllByText('Relative change undefined: classical value is zero')).toHaveLength(
      2
    )
    expect(screen.getByText('Classical 0 ms → Hybrid 4 ms')).toBeInTheDocument()
  })

  it('reports a zero hybrid value as a 100 percent decrease', () => {
    Object.assign(PRODUCTION_VPN_KPIS[1], { classical: 8, hybrid: 0 })
    render(<PerformanceBenchmarkDesigner />)
    expect(screen.getByText('100.00% decrease vs classical')).toBeInTheDocument()
    expect(screen.getByText('Classical 8 ms → Hybrid 0 ms')).toBeInTheDocument()
  })

  it('reports equal nonzero values as no change', () => {
    Object.assign(PRODUCTION_VPN_KPIS[1], { classical: 8, hybrid: 8 })
    render(<PerformanceBenchmarkDesigner />)
    expect(screen.getByText('0.00% change vs classical')).toBeInTheDocument()
  })

  it('shows the current adjusted pair after environment and traffic selections', () => {
    render(<PerformanceBenchmarkDesigner />)
    fireEvent.click(screen.getByRole('button', { name: /Burst \(Login Storm\)/ }))
    fireEvent.click(screen.getByRole('button', { name: /NGFW TLS Inspection/ }))
    expect(screen.getByText('Classical 6.844 ms → Hybrid 8.56 ms')).toBeInTheDocument()
    expect(screen.getByText('25.07% increase vs classical')).toBeInTheDocument()
    expect(
      screen.getByText('Classical 8,884 tunnels/s → Hybrid 2,235.5 tunnels/s')
    ).toBeInTheDocument()
    expect(screen.getByText(/Stored reference values are attributed/)).toHaveTextContent(
      'not independently verified here'
    )
    expect(screen.getByText(/These authored adjustments do not measure/)).toBeInTheDocument()
  })
})
