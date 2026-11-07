// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CryptoPostureMonitor } from './CryptoPostureMonitor'
import { MONITORING_TOOLS } from '../data/monitoringToolsData'

describe('monitoring capability requirements', () => {
  it('separates conceptual requirements from runnable-looking alert examples', () => {
    render(<CryptoPostureMonitor />)
    const standard = MONITORING_TOOLS.find((tool) => tool.id === 'certmanager-metrics')!
    expect(screen.getByText(standard.alertExamples[0].expression).tagName).toBe('PRE')
    fireEvent.click(
      screen.getByRole('button', { name: /Istio \/ Envoy TLS Observability Requirements/ })
    )
    expect(screen.getByText('Capability requirements — not runnable alert rules')).toBeVisible()
    expect(screen.getByText('Required observations')).toBeVisible()
    expect(screen.getByText('Non-executable decision examples')).toBeVisible()
    expect(screen.getByText(/If required group data is missing, report Unknown/)).toBeVisible()
    const conceptual = MONITORING_TOOLS.find((tool) => tool.id === 'istio-metrics')!
    for (const example of conceptual.alertExamples) {
      expect(screen.getByText(example.expression).tagName).toBe('P')
    }
    expect(screen.queryByText('PQC Alert Rules')).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: /Istio \/ Envoy TLS Observability Requirements/ })
    )
    expect(screen.queryByText('Required observations')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /cert-manager Prometheus Exporter/ }))
    expect(screen.getByText('Key Metrics')).toBeVisible()
    expect(screen.getByText('PQC Alert Rules')).toBeVisible()
    expect(screen.getByText(standard.alertExamples[0].expression).tagName).toBe('PRE')
  })
  it('keeps other monitor panels reachable after using the checklist', () => {
    render(<CryptoPostureMonitor />)
    fireEvent.click(
      screen.getByRole('button', { name: /Istio \/ Envoy TLS Observability Requirements/ })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Capacity Planner' }))
    expect(screen.getByText('Sample Timing and Size Impact')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Metrics & Alerts' }))
    expect(screen.getByText('Key Metrics')).toBeVisible()
  })
})
