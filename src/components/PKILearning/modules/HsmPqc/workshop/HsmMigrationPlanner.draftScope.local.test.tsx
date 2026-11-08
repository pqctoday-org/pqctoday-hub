// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { HsmMigrationPlanner } from './HsmMigrationPlanner'
import { FIRMWARE_UPGRADE_PATHS } from '../data/hsmConstants'

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
function chooseVendor(index: number) {
  const path = FIRMWARE_UPGRADE_PATHS.at(index)!
  const current = screen.getByRole('button', { name: 'Current vendor and firmware' })
  fireEvent.click(current)
  fireEvent.click(
    screen.getByRole('option', { name: `${path.vendorName} (${path.currentFirmware})` })
  )
}

it('restores only the selected vendor firmware draft, including partial checks, case and fleet count', () => {
  const view = render(<HsmMigrationPlanner />)
  chooseCase('signing')
  fireEvent.change(screen.getByLabelText('Number of HSMs in Fleet'), { target: { value: '3' } })
  review()
  const firstTopic = screen.getAllByRole('button', { name: /^Review topic:/ })[0]
  const firstName = firstTopic.textContent
  fireEvent.click(firstTopic)
  expect(firstTopic).toHaveAttribute('aria-pressed', 'true')
  assessment()
  chooseVendor(1)
  expect(screen.getByLabelText('Number of HSMs in Fleet')).toHaveValue(10)
  expect(screen.getByRole('button', { name: 'Fictional migration case:' })).toHaveTextContent(
    'Choose a fictional case'
  )
  chooseCase('kem')
  fireEvent.change(screen.getByLabelText('Number of HSMs in Fleet'), { target: { value: '6' } })
  review()
  for (const topic of screen.getAllByRole('button', { name: /^Review topic:/ }))
    fireEvent.click(topic)
  expect(screen.getByText('Planning review complete')).toBeVisible()
  assessment()
  chooseVendor(0)
  expect(screen.getByLabelText('Number of HSMs in Fleet')).toHaveValue(3)
  expect(screen.getByRole('button', { name: 'Fictional migration case:' })).toHaveTextContent(
    'ML-DSA signing'
  )
  review()
  expect(screen.getByText('Planning review in progress')).toBeVisible()
  const restored = screen.getAllByRole('button', { name: /^Review topic:/ })
  expect(restored[0].textContent).toBe(firstName)
  expect(restored.filter((topic) => topic.getAttribute('aria-pressed') === 'true')).toHaveLength(1)
  for (const topic of restored.slice(1)) fireEvent.click(topic)
  expect(screen.getByText('Planning review complete')).toBeVisible()
  assessment()
  chooseVendor(1)
  expect(screen.getByLabelText('Number of HSMs in Fleet')).toHaveValue(6)
  review()
  expect(screen.getByText('Planning review complete')).toBeVisible()
  view.unmount()
  render(<HsmMigrationPlanner />)
  expect(screen.getByLabelText('Number of HSMs in Fleet')).toHaveValue(10)
  expect(screen.getByRole('button', { name: 'Fictional migration case:' })).toHaveTextContent(
    'Choose a fictional case'
  )
  review()
  expect(screen.getByText('Planning review not started')).toBeVisible()
})

it('does not lend a completed vendor review to a newly selected vendor', () => {
  render(<HsmMigrationPlanner />)
  chooseCase('signing')
  review()
  for (const topic of screen.getAllByRole('button', { name: /^Review topic:/ }))
    fireEvent.click(topic)
  assessment()
  chooseVendor(1)
  chooseCase('signing')
  review()
  expect(screen.getByText('Planning review in progress')).toBeVisible()
  expect(
    screen
      .getAllByRole('button', { name: /^Review topic:/ })
      .every((topic) => topic.getAttribute('aria-pressed') === 'false')
  ).toBe(true)
})
