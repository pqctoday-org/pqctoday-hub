// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CryptoPostureMonitor } from './CryptoPostureMonitor'
import { MONITORING_TOOLS, SIEM_QUERIES } from '../data/monitoringToolsData'

describe('monitoring capability requirements', () => {
  it('renders all monitoring sources as non-executable requirements', () => {
    render(<CryptoPostureMonitor />)
    const standard = MONITORING_TOOLS.find((tool) => tool.id === 'certmanager-metrics')!
    expect(screen.getByText(standard.alertExamples[0].expression).tagName).toBe('P')
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
    expect(screen.getByText('Required observations')).toBeVisible()
    expect(screen.queryByText('PQC Alert Rules')).not.toBeInTheDocument()
    expect(screen.getByText(standard.alertExamples[0].expression).tagName).toBe('P')
  })
  it('keeps other monitor panels reachable after using the checklist', () => {
    render(<CryptoPostureMonitor />)
    fireEvent.click(
      screen.getByRole('button', { name: /Istio \/ Envoy TLS Observability Requirements/ })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Capacity Planner' }))
    expect(screen.getByText('Sample Timing and Size Impact')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Metrics & Alerts' }))
    expect(screen.getByText('Required observations')).toBeVisible()
  })
  it('keeps every SIEM checklist non-executable and supports source navigation', () => {
    render(<CryptoPostureMonitor />)
    fireEvent.click(screen.getByRole('button', { name: 'SIEM Integration' }))
    for (const item of SIEM_QUERIES) {
      if (item.id !== 'splunk-ecdsa-signing') {
        fireEvent.click(screen.getByRole('button', { name: new RegExp(item.name) }))
      }
      expect(screen.getByText('Capability checklist — not a runnable query')).toBeVisible()
      expect(screen.getByText(item.query.replace(/\s+/g, ' ')).tagName).toBe('P')
      expect(screen.getByText(item.query.replace(/\s+/g, ' '))).toHaveTextContent('Unknown')
    }
    fireEvent.click(screen.getByRole('button', { name: 'Capacity Planner' }))
    expect(screen.getByText('Sample Timing and Size Impact')).toBeVisible()
  })
  it('presents lifecycle topics without claiming verified support or executing drift detection', () => {
    render(<CryptoPostureMonitor />)
    fireEvent.click(screen.getByRole('button', { name: 'ACME Lifecycle' }))
    expect(screen.getByText(/Educational ACME lifecycle walkthrough/)).toBeVisible()
    expect(screen.queryByText('PQC ready', { exact: true })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Algorithm Drift Detection/ }))
    expect(
      screen.getByText(/Capability requirement — not an alert rule: obtain certificate/)
    ).toHaveTextContent('Unknown')
    expect(
      screen.getByText(/Capability requirement — not an alert rule: obtain certificate/).tagName
    ).toBe('P')
  })
})
