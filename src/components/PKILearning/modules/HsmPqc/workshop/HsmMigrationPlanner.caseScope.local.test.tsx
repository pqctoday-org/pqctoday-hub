// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { HsmPqcExercises } from '../components/HsmPqcExercises'
import { HsmMigrationPlanner } from './HsmMigrationPlanner'

const assessment = () => fireEvent.click(screen.getByRole('button', { name: 'Assessment' }))
const review = () => fireEvent.click(screen.getByRole('button', { name: 'Validation Planning' }))
const chooseCase = (value: string) => {
  const labels = {
    signing: 'ML-DSA signing / PKCS#11 sample',
    kem: 'ML-KEM key establishment / vendor API sample',
    'both-records': 'Independent signing + key establishment / records requested',
  }
  const label = Object.entries(labels).find(([id]) => id === value)?.[1]
  if (!label) throw new Error('Unknown fictional test case')
  fireEvent.click(screen.getByRole('button', { name: 'Fictional migration case:' }))
  fireEvent.click(screen.getByRole('option', { name: label }))
}
const topic = (name: RegExp) => screen.queryByRole('button', { name })

it('requires an explicit case and renders its requested operations/interface rather than every capability', () => {
  render(<HsmMigrationPlanner />)
  review()
  expect(screen.getByText('Planning review not started')).toBeVisible()
  expect(screen.queryByRole('button', { name: /^Review topic:/ })).not.toBeInTheDocument()
  expect(screen.queryByText(/0 \/ 0/)).not.toBeInTheDocument()
  assessment()
  chooseCase('signing')
  review()
  expect(topic(/Review topic: Plan ML-DSA-65 sign\/verify/)).toBeVisible()
  expect(topic(/Review topic: Plan ML-KEM/)).not.toBeInTheDocument()
  expect(topic(/Review topic: Evaluate.*C_EncapsulateKey/)).not.toBeInTheDocument()
  expect(topic(/Review topic:.*validation record/)).not.toBeInTheDocument()
  expect(topic(/Review topic: Identify RNG and entropy/)).toBeVisible()
  expect(topic(/Review topic: Define relevant physical and threat scope/)).toBeVisible()
  assessment()
  chooseCase('kem')
  review()
  expect(topic(/Review topic: Plan ML-KEM-768/)).toBeVisible()
  expect(topic(/Review topic: Evaluate the documented vendor API/)).toBeVisible()
  expect(topic(/Review topic: Plan ML-DSA/)).not.toBeInTheDocument()
  expect(topic(/Review topic: Evaluate the requested PKCS/)).not.toBeInTheDocument()
  assessment()
  chooseCase('both-records')
  review()
  expect(topic(/Review topic: Evaluate.*C_EncapsulateKey/)).toBeVisible()
  expect(topic(/Review topic:.*match the module certificate/)).toBeVisible()
  expect(topic(/Review topic:.*ML-DSA-65 validation record/)).toBeVisible()
  expect(topic(/Review topic:.*ML-KEM-768 validation record/)).toBeVisible()
  expect(topic(/Review topic:.*explicit EM request/)).not.toBeInTheDocument()
})

it('isolates review credit by case and explicit EM requirement and restores exactly that context', () => {
  render(<HsmMigrationPlanner />)
  chooseCase('signing')
  review()
  for (const button of screen.getAllByRole('button', { name: /^Review topic:/ }))
    fireEvent.click(button)
  expect(screen.getByText('Planning review complete')).toBeVisible()
  assessment()
  fireEvent.click(screen.getByRole('checkbox', { name: /EM-assessment/ }))
  review()
  expect(topic(/Review topic:.*explicit EM request/)).toBeVisible()
  expect(screen.getByText('Planning review in progress')).toBeVisible()
  expect(
    screen
      .getAllByRole('button', { name: /^Review topic:/ })
      .every((button) => button.getAttribute('aria-pressed') === 'false')
  ).toBe(true)
  assessment()
  fireEvent.click(screen.getByRole('checkbox', { name: /EM-assessment/ }))
  chooseCase('kem')
  review()
  expect(screen.getByText('Planning review in progress')).toBeVisible()
  assessment()
  chooseCase('signing')
  review()
  expect(screen.getByText('Planning review complete')).toBeVisible()
})

it('the rendered migration exercise names the explicit records-request case and opens its existing workshop step', () => {
  const configure = vi.fn()
  const navigate = vi.fn()
  render(
    <MemoryRouter>
      <HsmPqcExercises onNavigateToWorkshop={navigate} onSetWorkshopConfig={configure} />
    </MemoryRouter>
  )
  expect(screen.getByText(/Open the Migration Planner workshop/)).toHaveTextContent(
    'fictional independent signing + key establishment case that explicitly requests validation records'
  )
  expect(screen.getByText(/With Thales Luna 7 selected/)).toHaveTextContent(
    'Whether CMVP work is needed depends on the actual change and certificate scope'
  )
  expect(
    screen.getByRole('heading', { name: /Estimate upgrade duration and review service continuity/ })
  ).toBeVisible()
  expect(screen.getByText(/With Thales Luna 7 selected/)).toHaveTextContent(
    '10 HSMs therefore give an illustrative 5-10 hour maintenance range'
  )
  expect(screen.getByText(/With Thales Luna 7 selected/)).toHaveTextContent(
    'Logical partitions alone do not establish uninterrupted service'
  )
  expect(screen.queryByText(/with zero downtime/)).not.toBeInTheDocument()
  expect(
    screen.queryByText(/adding PQC algorithms in new firmware needs CAVP/)
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getAllByRole('button', { name: 'Load & Run' }).at(4)!)
  expect(configure).toHaveBeenCalledExactlyOnceWith({ step: 2 })
  expect(navigate).toHaveBeenCalledExactlyOnceWith()
})
