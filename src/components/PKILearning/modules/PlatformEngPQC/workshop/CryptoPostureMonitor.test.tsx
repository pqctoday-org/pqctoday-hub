// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CryptoPostureMonitor } from './CryptoPostureMonitor'

describe('Crypto posture monitor: conceptual example severity', () => {
  it('labels the severity pill on a conceptual example as illustrative', () => {
    render(<CryptoPostureMonitor />)
    fireEvent.click(
      screen.getByRole('button', { name: /Istio \/ Envoy TLS Observability Requirements/ })
    )
    expect(screen.getAllByText('Illustrative severity: WARNING').length).toBeGreaterThan(0)
    expect(screen.queryByText('WARNING', { exact: true })).not.toBeInTheDocument()
  })
})
