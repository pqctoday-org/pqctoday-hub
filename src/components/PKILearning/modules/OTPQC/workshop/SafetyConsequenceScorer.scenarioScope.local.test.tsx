// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SafetyConsequenceScorer } from './SafetyConsequenceScorer'
import {
  CONSEQUENCE_SCENARIOS,
  defaultInputs,
  scoreScenario,
  type ConsequenceResult,
} from '../data/consequenceData'

const transmission = CONSEQUENCE_SCENARIOS[0]
const choose = (current: string, next: string) => {
  fireEvent.click(screen.getByRole('button', { name: current }))
  fireEvent.click(screen.getByRole('option', { name: next }))
}

describe('authored safety scenario scope', () => {
  it('keeps the default result while explaining the scope of its authored factors', () => {
    const changed = vi.fn()
    render(<SafetyConsequenceScorer results={[]} onResultsChange={changed} onComplete={vi.fn()} />)
    expect(
      screen.getByRole('heading', { name: 'Illustrative safety scenario score' })
    ).toBeVisible()
    expect(screen.getByText('Scenario exposure factor')).toBeVisible()
    expect(screen.getByText('Illustrative compound score')).toBeVisible()
    expect(screen.queryByText('Quantum exposure')).toBeNull()
    expect(
      screen.getByText(/not a separate measure of extra risk caused by a quantum computer/)
    ).toBeVisible()
    expect(
      screen.getByText(/symmetric factor is a teaching assumption, not a measured security margin/)
    ).toBeVisible()
    expect(changed).toHaveBeenLastCalledWith([scoreScenario(transmission)])
    // 100×(0.6+0.4×log10(5,000,000)/7)×1×0.5×0.9 rounds to44.
    expect(changed.mock.lastCall?.[0][0].compound).toBe(44)
  })

  it('preserves positive unauthenticated scores and the present-day warning, then the symmetric/PQC alternatives', () => {
    const changed = vi.fn()
    render(<SafetyConsequenceScorer results={[]} onResultsChange={changed} onComplete={vi.fn()} />)
    choose('RSA / ECDSA certificates (TLS, OPC UA, CIP Security)', 'None (unauthenticated)')
    choose('RSA / ECDSA signed', 'Unsigned')
    const none = scoreScenario(transmission, {
      ...defaultInputs(transmission),
      commandAuth: 'none',
      firmwareSigning: 'none',
    })
    expect(changed).toHaveBeenLastCalledWith([none])
    expect(none.compound).toBe(44)
    expect(none.exposure).toBe(1)
    expect(screen.getByText(/exploitable today, with no quantum computer/)).toBeVisible()
    expect(screen.getByText(/not a separate measure of extra risk/)).toBeVisible()
    expect(screen.queryByText('Quantum exposure')).toBeNull()

    choose('None (unauthenticated)', 'Symmetric MAC (e.g. DNP3 SAv5)')
    choose('Unsigned', 'LMS / ML-DSA signed')
    const symmetric = scoreScenario(transmission, {
      ...defaultInputs(transmission),
      commandAuth: 'symmetric',
      firmwareSigning: 'pqc',
    })
    expect(changed).toHaveBeenLastCalledWith([symmetric])
    expect(symmetric.exposure).toBe(0.2)
    expect(symmetric.compound).toBe(9)
    expect(screen.queryByText(/exploitable today, with no quantum computer/)).toBeNull()
    choose('Symmetric MAC (e.g. DNP3 SAv5)', 'PQC / hybrid')
    const pqc = scoreScenario(transmission, {
      ...defaultInputs(transmission),
      commandAuth: 'pqc',
      firmwareSigning: 'pqc',
    })
    expect(changed).toHaveBeenLastCalledWith([pqc])
    expect(pqc.compound).toBe(0)
    expect(screen.getByText(/not a measured security margin/)).toBeVisible()
  })

  it('retains other scenario results and the existing completion callback', () => {
    const changed = vi.fn()
    const complete = vi.fn()
    const retained = scoreScenario(CONSEQUENCE_SCENARIOS[2])
    function Harness() {
      const [results, setResults] = useState<ConsequenceResult[]>([retained])
      return (
        <SafetyConsequenceScorer
          results={results}
          onComplete={complete}
          onResultsChange={(next) => {
            changed(next)
            setResults(next)
          }}
        />
      )
    }
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /Gas pipeline compressor station/ }))
    expect(changed.mock.lastCall?.[0]).toEqual([
      retained,
      scoreScenario(transmission),
      scoreScenario(CONSEQUENCE_SCENARIOS[1]),
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }))
    expect(complete).toHaveBeenCalledOnce()
  })
})

describe('Actual scorer controls distinguish present-day and additional paths', () => {
  it('retains serious current gaps without counting them as cryptanalytic targets', () => {
    render(<SafetyConsequenceScorer results={[]} onResultsChange={vi.fn()} onComplete={vi.fn()} />)
    expect(screen.getByText('Present-day unauthenticated paths: 0')).toBeVisible()
    expect(screen.getByText('Additional classical-key forgery paths: 2')).toBeVisible()
    choose('RSA / ECDSA certificates (TLS, OPC UA, CIP Security)', 'None (unauthenticated)')
    expect(screen.getByText('Present-day unauthenticated paths: 1')).toBeVisible()
    expect(screen.getByText('Additional classical-key forgery paths: 1')).toBeVisible()
    choose('RSA / ECDSA signed', 'Unsigned')
    expect(screen.getByText('Present-day unauthenticated paths: 2')).toBeVisible()
    expect(screen.getByText('Additional classical-key forgery paths: 0')).toBeVisible()
    expect(screen.getByText(/exploitable today, with no quantum computer/)).toBeVisible()
    choose('None (unauthenticated)', 'Symmetric MAC (e.g. DNP3 SAv5)')
    choose('Unsigned', 'LMS / ML-DSA signed')
    expect(screen.getByText('Present-day unauthenticated paths: 0')).toBeVisible()
    expect(screen.getByText('Additional classical-key forgery paths: 0')).toBeVisible()
    expect(screen.getByText('Symmetric residual paths: 1')).toBeVisible()
    expect(screen.getByText(/command; authored index 9/)).toBeVisible()
    choose('Symmetric MAC (e.g. DNP3 SAv5)', 'PQC / hybrid')
    expect(screen.getByText('Symmetric residual paths: 0')).toBeVisible()
    expect(
      screen.queryByText(/exploitable today, with no quantum computer/)
    ).not.toBeInTheDocument()
    expect(screen.getByText(/not additive or a causal estimate/)).toBeVisible()
  })
})
