// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ScaleEncryptionPlanner } from './ScaleEncryptionPlanner'
const set = (name: string, value: string) =>
  fireEvent.change(screen.getByRole('spinbutton', { name }), { target: { value } })
const metric = (name: string, value: string) =>
  expect(within(screen.getByRole('group', { name })).getByText(value)).toBeInTheDocument()
describe('Scale planner units and explicit preset inputs', () => {
  it('keeps the existing100TB default consistent with decimalGB and exact modeled counts', () => {
    render(<ScaleEncryptionPlanner />)
    expect(screen.getByRole('spinbutton', { name: 'Dataset Size (TB)' })).toHaveValue(100)
    metric('Estimated DEKs', '100,120')
    metric('Estimated KEKs', '39')
    metric('Modeled KMS operations per day', '10,001,502')
    metric('Modeled storage delta', '0.077615 GiB')
  })
  it('loads only explicit startup counts and matches a hand calculation after the missing agent input is supplied', () => {
    render(<ScaleEncryptionPlanner />)
    set('Model Count', '88')
    set('Regions', '9')
    set('Agent Count', '500')
    set('Retention (years)', '20')
    fireEvent.click(screen.getByRole('button', { name: 'AI Startup' }))
    expect(screen.getByRole('spinbutton', { name: 'Dataset Size (TB)' })).toHaveValue(1)
    expect(screen.getByRole('spinbutton', { name: 'Model Count' })).toHaveValue(1)
    expect(screen.getByRole('spinbutton', { name: 'Regions' })).toHaveValue(1)
    expect(screen.getByRole('spinbutton', { name: 'Inference/Day' })).toHaveValue(100000)
    expect(screen.getByRole('spinbutton', { name: 'Agent Count' })).toHaveValue(null)
    expect(screen.getByRole('spinbutton', { name: 'Retention (years)' })).toHaveValue(null)
    expect(screen.getByText('1–7B')).toBeInTheDocument()
    metric('Estimated DEKs', '1,010')
    metric('Estimated KEKs', '2')
    metric('Modeled KMS operations per day', 'Unknown')
    metric('Illustrative retention window', 'Not assessed')
    set('Agent Count', '50')
    metric('Modeled KMS operations per day', '100,511')
    metric('Modeled storage delta', '0.000786 GiB')
  })
  it('never turns parameter billions into a model count or carries missing fields between larger presets', () => {
    render(<ScaleEncryptionPlanner />)
    fireEvent.click(screen.getByRole('button', { name: 'Enterprise AI Platform' }))
    expect(screen.getByText('7–70B')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Model Count' })).toHaveValue(null)
    expect(screen.getByRole('spinbutton', { name: 'Regions' })).toHaveValue(3)
    metric('Estimated DEKs', 'Unknown')
    metric('Estimated KEKs', 'Unknown')
    set('Model Count', '12')
    set('Agent Count', '50')
    set('Retention (years)', '7')
    metric('Estimated DEKs', '100,120')
    fireEvent.click(screen.getByRole('button', { name: 'Hyperscaler AI Service' }))
    expect(screen.getByText('70–405B')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Dataset Size (TB)' })).toHaveValue(10000)
    expect(screen.getByRole('spinbutton', { name: 'Inference/Day' })).toHaveValue(1000000000)
    for (const name of ['Model Count', 'Regions', 'Agent Count', 'Retention (years)'])
      expect(screen.getByRole('spinbutton', { name })).toHaveValue(null)
    for (const name of [
      'Estimated DEKs',
      'Estimated KEKs',
      'Modeled KMS operations per day',
      'Modeled storage delta',
    ])
      metric(name, 'Unknown')
  })
  it('distinguishes explicitly entered zero from unknown and withholds only dependent totals', () => {
    render(<ScaleEncryptionPlanner />)
    for (const name of [
      'Dataset Size (TB)',
      'Model Count',
      'Regions',
      'Agent Count',
      'Inference/Day',
    ])
      set(name, '0')
    metric('Estimated DEKs', '0')
    metric('Estimated KEKs', '0')
    metric('Modeled KMS operations per day', '0')
    metric('Modeled storage delta', '0.000000 GiB')
    metric('Illustrative bandwidth overhead', '0.00%')
    set('Model Count', '')
    metric('Estimated DEKs', 'Unknown')
    metric('Estimated KEKs', 'Unknown')
    metric('Modeled KMS operations per day', 'Unknown')
    metric('Illustrative bandwidth overhead', '0.00%')
  })
  it('states the illustrative inclusive retention boundaries without presenting a forecast', () => {
    render(<ScaleEncryptionPlanner />)
    set('Retention (years)', '4')
    metric('Illustrative retention window', 'Low')
    expect(screen.getByText(/Sample expiry year: 2030/)).toBeInTheDocument()
    set('Retention (years)', '5')
    metric('Illustrative retention window', 'Medium')
    set('Retention (years)', '10')
    metric('Illustrative retention window', 'High')
    expect(
      screen.getByText(
        /not a quantum-arrival forecast or an organization-specific HNDL risk assessment/
      )
    ).toBeInTheDocument()
  })
})
