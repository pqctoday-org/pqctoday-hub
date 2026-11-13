// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { PharmaIPCalculator } from './PharmaIPCalculator'
import { HealthcarePQCExercises } from '../components/HealthcarePQCExercises'
import { computePharmaExerciseFigures } from '../data/pharmaIpModel'

function summaryValue(label: string): string {
  const el = screen.getByText(label, { selector: 'div' })
  return el.nextElementSibling?.textContent ?? ''
}

async function chooseProtection(user: ReturnType<typeof userEvent.setup>, optionName: string) {
  await user.click(screen.getAllByRole('button', { name: 'Key protection:' })[0])
  await user.click(screen.getByRole('option', { name: optionName }))
}

describe('Pharma IP calculator key-protection model', () => {
  it('labels itself fictional and says no probability or loss is predicted', () => {
    render(<PharmaIPCalculator />)
    expect(screen.getByText(/fictional project sample, not a standard/)).toHaveTextContent(
      'assigns no probability and predicts no financial loss'
    )
  })

  it('shows total value and vulnerable-path value separately, and only the path changes', async () => {
    const user = userEvent.setup()
    render(<PharmaIPCalculator />)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '2033' } })
    expect(summaryValue('Total Value')).toBe('$9,500M')
    expect(summaryValue('Tied to Vulnerable Path')).toBe('$800M')
    await chooseProtection(user, 'Pre-shared AES-256 key protects the record key')
    expect(summaryValue('Total Value')).toBe('$9,500M')
    expect(summaryValue('Tied to Vulnerable Path')).toBe('$0M')
    await chooseProtection(user, 'X25519 + ML-KEM-768 protects the record key')
    expect(summaryValue('Tied to Vulnerable Path')).toBe('$0M')
    await chooseProtection(user, 'RSA-2048 wraps the record key')
    expect(summaryValue('Tied to Vulnerable Path')).toBe('$800M')
  })

  it('shows an unspecified protection as not determined rather than zero', async () => {
    const user = userEvent.setup()
    render(<PharmaIPCalculator />)
    await chooseProtection(user, 'Key protection not specified')
    expect(screen.getByText('not determined')).toBeInTheDocument()
    expect(screen.getByText(/1 compound\(s\) have no key protection specified/)).toBeInTheDocument()
  })

  it('sums the visible fictional steps and follows an edited omittable step', () => {
    render(<PharmaIPCalculator />)
    expect(
      screen.getByText('12 years of steps in total, 2 years omittable, 10 years retained', {
        exact: false,
      })
    ).toBeInTheDocument()
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Step 1 years for PQC-7291' }), {
      target: { value: '4' },
    })
    expect(
      screen.getByText('14 years of steps in total, 4 years omittable, 10 years retained', {
        exact: false,
      })
    ).toBeInTheDocument()
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Step 3 years for PQC-7291' }), {
      target: { value: '9' },
    })
    expect(
      screen.getByText('16 years of steps in total, 4 years omittable, 12 years retained', {
        exact: false,
      })
    ).toBeInTheDocument()
  })

  it('keeps the confidentiality result when only the patent date changes', () => {
    render(<PharmaIPCalculator />)
    const before = summaryValue('Tied to Vulnerable Path')
    const patent = screen.getAllByRole('spinbutton', { name: /Patent expiry year/ })[0]
    fireEvent.change(patent, { target: { value: '2030' } })
    expect(summaryValue('Tied to Vulnerable Path')).toBe(before)
    expect(screen.getAllByText(/Patent expiry 2030/).length).toBeGreaterThan(0)
  })

  it('has a visible editable base year that moves the confidentiality end year', () => {
    render(<PharmaIPCalculator />)
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Fictional base year' }), {
      target: { value: '2010' },
    })
    expect(screen.getAllByText('2030').length).toBeGreaterThan(0)
  })

  it('agrees with the guided exercise, which uses the same calculation', () => {
    const f = computePharmaExerciseFigures()
    render(
      <MemoryRouter>
        <HealthcarePQCExercises onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    const text = screen.getByText(/the time saved is/).textContent ?? ''
    expect(text).toContain(`$${f.rsa.valueOnVulnerablePathM}M of its $${f.rsa.totalValueM}M`)
    expect(text).toContain(`the time saved is ${f.rsa.rdYearsSaved} years`)
    expect(text).not.toContain('15+')
    expect(screen.queryByText(/15\+/)).not.toBeInTheDocument()
  })
})
