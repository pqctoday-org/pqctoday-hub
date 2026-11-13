// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { HsmMigrationPlanner } from './HsmMigrationPlanner'

it('scales the declared one-at-a-time fleet arithmetic without inferring continuous service', () => {
  render(<HsmMigrationPlanner />)
  const count = screen.getByLabelText('Number of HSMs in Fleet')
  fireEvent.change(count, { target: { value: '1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Firmware Planning' }))
  // Existing default authored range: 30–60 minutes per device, not measured downtime.
  expect(screen.getByText('30 - 60 minutes')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Assessment' }))
  fireEvent.change(screen.getByLabelText('Number of HSMs in Fleet'), { target: { value: '10' } })
  fireEvent.click(screen.getByRole('button', { name: 'Firmware Planning' }))
  expect(screen.getByText('5.0 - 10.0 hours')).toBeVisible()
  expect(screen.getByText(/This arithmetic assumes one-at-a-time upgrades/)).toHaveTextContent(
    'one-device fleet remains available'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Key Migration' }))
  // Existing authored backup model: (50 + 2 × 100) MB/device × 10 / 1024 = 2.4 GB displayed.
  expect(screen.getByText('2.4 GB')).toBeVisible()
  expect(screen.getByText(/two logical partitions alone/)).toHaveTextContent(
    'does not test uninterrupted service'
  )
  expect(screen.getByText(/Check which keys, configuration/)).toHaveTextContent(
    'neither tests nor guarantees recovery, rollback or continued service'
  )
})
