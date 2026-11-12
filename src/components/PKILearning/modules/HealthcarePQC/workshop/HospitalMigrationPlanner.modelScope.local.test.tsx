// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { HospitalMigrationPlanner } from './HospitalMigrationPlanner'

function patientBudgetRow() {
  return within(screen.getAllByRole('table')[0]).getByRole('row', {
    name: /Patient Portal & Telehealth/,
  })
}

function matrixSnapshot() {
  return screen.getAllByRole('table')[1].textContent
}

describe('Hospital planning sample model scope', () => {
  it('changes illustrative costs without changing baseline priority or phase, then resets', async () => {
    const user = userEvent.setup()
    const view = render(<HospitalMigrationPlanner />)
    expect(
      screen.getByText(/Priority and phase use each layer’s fixed sensitivity/)
    ).toHaveTextContent(
      'they do not recalculate priority or phase, demonstrate reduced risk, or confirm vendor support.'
    )
    const initialMatrix = matrixSnapshot()
    const endpoint = screen.getAllByRole('spinbutton', { name: 'Endpoints' })[0]
    expect(endpoint).toHaveValue(50)
    expect(within(patientBudgetRow()).getAllByRole('cell').at(-1)).toHaveTextContent('$0')

    await user.click(screen.getAllByRole('button', { name: 'Crypto Posture:' })[0])
    await user.click(screen.getByRole('option', { name: 'Full PQC (ML-KEM + ML-DSA)' }))
    expect(within(patientBudgetRow()).getAllByRole('cell').at(-1)).toHaveTextContent('$250,000')
    expect(matrixSnapshot()).toBe(initialMatrix)

    fireEvent.change(endpoint, { target: { value: '100' } })
    expect(endpoint).toHaveValue(100)
    expect(within(patientBudgetRow()).getAllByRole('cell').at(-1)).toHaveTextContent('$500,000')
    expect(matrixSnapshot()).toBe(initialMatrix)

    await user.click(screen.getByRole('button', { name: 'Reset All' }))
    expect(endpoint).toHaveValue(50)
    expect(within(patientBudgetRow()).getByText('No Change')).toBeInTheDocument()
    expect(within(patientBudgetRow()).getAllByRole('cell').at(-1)).toHaveTextContent('$0')
    expect(matrixSnapshot()).toBe(initialMatrix)
    view.unmount()
  })

  it('includes only selected work in the roadmap, retaining all baseline matrix priorities', async () => {
    const user = userEvent.setup()
    const view = render(<HospitalMigrationPlanner />)
    const matrix = matrixSnapshot()
    expect(
      screen.getByText(
        'No migration work selected. Choose an action above to build the sample roadmap.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('Phase 1: Critical Priority (2023–2027)')).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Crypto Posture:' })[0])
    await user.click(screen.getByRole('option', { name: 'Planning Only' }))
    expect(
      screen.queryByText(
        'No migration work selected. Choose an action above to build the sample roadmap.'
      )
    ).not.toBeInTheDocument()
    expect(matrixSnapshot()).toBe(matrix)
    const roadmap = screen.getByText('Selected Migration Work').closest('.glass-panel')!
    expect(
      within(roadmap as HTMLElement).getByText('Patient Portal & Telehealth')
    ).toBeInTheDocument()
    expect(
      within(roadmap as HTMLElement).queryByText('Medical Devices (IoMT)')
    ).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Crypto Posture:' })[0])
    await user.click(screen.getByRole('option', { name: 'No Change' }))
    expect(
      screen.getByText(
        'No migration work selected. Choose an action above to build the sample roadmap.'
      )
    ).toBeInTheDocument()
    expect(matrixSnapshot()).toBe(matrix)
    view.unmount()
  })

  it('keeps zero cost for changed endpoint counts when No Change is selected', async () => {
    const view = render(<HospitalMigrationPlanner />)
    const initialMatrix = matrixSnapshot()
    const endpoint = screen.getAllByRole('spinbutton', { name: 'Endpoints' })[0]
    fireEvent.change(endpoint, { target: { value: '100' } })
    expect(endpoint).toHaveValue(100)
    expect(within(patientBudgetRow()).getAllByRole('cell').at(-1)).toHaveTextContent('$0')
    expect(matrixSnapshot()).toBe(initialMatrix)
    expect(screen.getByText(/All layers are set to/)).toBeInTheDocument()
    view.unmount()
  })
})

it('agrees on mixed-action phase and estate costs without upgrading fixed vendor readiness', async () => {
  const user = userEvent.setup()
  render(<HospitalMigrationPlanner />)
  const matrix = matrixSnapshot()
  const readiness = () =>
    screen.getAllByText(/^(Available|Preview|Planned|None)$/).map((el) => el.textContent)
  const readinessBefore = readiness()
  await user.click(screen.getAllByRole('button', { name: 'Crypto Posture:' })[0])
  await user.click(screen.getByRole('option', { name: 'Hybrid (Classical + PQC)' }))
  await user.click(screen.getAllByRole('button', { name: 'Crypto Posture:' })[1])
  await user.click(screen.getByRole('option', { name: 'Planning Only' }))
  // Declared inputs: 50 × $5,000 × 0.7 plus 500 × $2,000 × 0.1 = $275,000.
  expect(within(patientBudgetRow()).getAllByRole('cell').at(-1)).toHaveTextContent('$175,000')
  expect(screen.getByRole('row', { name: 'Total Estimated Budget $275,000' })).toBeVisible()
  // The phase header and estate total each show the same mixed-action sum.
  expect(screen.getAllByText('$275,000')).toHaveLength(2)
  expect(matrixSnapshot()).toBe(matrix)
  expect(readiness()).toEqual(readinessBefore)
  await user.click(screen.getByRole('button', { name: 'Reset All' }))
  expect(screen.getByRole('row', { name: 'Total Estimated Budget $0' })).toBeVisible()
  expect(screen.queryByText('Phase 1: Critical Priority (2023–2027)')).not.toBeInTheDocument()
})
