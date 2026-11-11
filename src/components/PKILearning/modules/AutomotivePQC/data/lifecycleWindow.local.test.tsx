// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { computeVulnerabilityWindow } from './lifecycleComplianceData'
import { TimingBudgetExample } from '../components/TimingBudgetExample'
import { LifecycleMigrationRoadmap } from '../workshop/LifecycleMigrationRoadmap'

describe('Vehicle service interval and useful pre-exposure upgrade opportunities', () => {
  it.each([
    [2032, 12, 2030, 12, [], true],
    [2032, 12, 2032, 12, [], true],
    [2026, 12, 2030, 8, [], true],
    [2026, 12, 2031, 7, [2030], false],
    [2027, 20, 2035, 12, [2031], false],
    [2026, 12, 2038, 0, [2030, 2034], false],
    [2026, 12, 2045, 0, [2030, 2034], false],
  ] as const)(
    'intersects service %i+%i with arrival%i',
    (model, life, arrival, exposure, upgrades, factory) => {
      const result = computeVulnerabilityWindow(model, life, arrival)
      expect(result.vulnerableYears).toBe(exposure)
      expect(result.vulnerableYears).toBeLessThanOrEqual(life)
      expect(result.otaUpgradeYears).toEqual(upgrades)
      expect(result.otaUpgradeWindows).toBe(upgrades.length)
      expect(result.needsPqcFromFactory).toBe(factory)
      for (const year of result.otaUpgradeYears) {
        expect(year).toBeLessThan(arrival)
        expect(year).toBeLessThan(model + life)
      }
      for (const phase of result.phases)
        expect(phase.endYear).toBeGreaterThanOrEqual(phase.startYear)
    }
  )
  it('updates the actual roadmap from an arrival before production to a usable upgrade window', () => {
    render(<LifecycleMigrationRoadmap />)
    const set = (label: string, value: string) =>
      fireEvent.change(screen.getByRole('slider', { name: label }), { target: { value } })
    set('Model year', '2032')
    set('Road life, years', '12')
    set('CRQC arrival year', '2030')
    expect(screen.getByLabelText('Lifecycle calculation basis')).toHaveTextContent(
      'readiness before entering service'
    )
    expect(screen.getByText(/A 2032 model year vehicle/)).toHaveTextContent('12 years')
    expect(screen.getByText(/scheduled opportunities strictly before/)).toHaveTextContent('none')
    set('Model year', '2026')
    set('CRQC arrival year', '2031')
    expect(screen.getByLabelText('Lifecycle calculation basis')).toHaveTextContent(
      'scheduled pre-exposure upgrade exists'
    )
    expect(screen.getByText(/scheduled opportunities strictly before/)).toHaveTextContent('2030')
  })
})

describe('One authored primitive dataset versus a declared whole-pipeline budget', () => {
  it('exposes the useful remaining allowance, then distinguishes complete positive and contrary inputs', () => {
    render(<TimingBudgetExample />)
    expect(screen.getByRole('region', { name: 'Worked verification budget' })).toHaveTextContent(
      '10 − 0.3 = 9.7 ms'
    )
    expect(screen.getByRole('region', { name: 'Worked verification budget' })).toHaveTextContent(
      'no measured hardware, compiler/build or workload'
    )
    const result = screen.getByRole('status', { name: 'Pipeline budget comparison' })
    const other = screen.getByRole('spinbutton', {
      name: 'Other pipeline time (ms, your declared input)',
    })
    fireEvent.change(other, { target: { value: '2' } })
    expect(result).toHaveTextContent('0.3 + 2 = 2.3 ms; within the 10 ms example budget')
    fireEvent.change(other, { target: { value: '12' } })
    expect(result).toHaveTextContent('0.3 + 12 = 12.3 ms; exceeds the 10 ms example budget')
    fireEvent.change(other, { target: { value: '' } })
    expect(result).toHaveTextContent('Enter a finite non-negative')
    expect(screen.getByRole('region', { name: 'Worked verification budget' })).toHaveTextContent(
      'not a measured WCET or a safety conclusion'
    )
  })
})
