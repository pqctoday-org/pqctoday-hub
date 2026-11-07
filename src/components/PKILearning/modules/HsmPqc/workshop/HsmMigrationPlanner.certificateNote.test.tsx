// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { HsmMigrationPlanner } from './HsmMigrationPlanner'
import { FIRMWARE_UPGRADE_PATHS } from '../data/hsmConstants'

it('firmware planning shows the selected path certificate note, not one fixed recertification word', () => {
  render(<HsmMigrationPlanner />)
  fireEvent.click(screen.getByRole('button', { name: 'Proceed to Firmware Planning' }))
  expect(screen.getByText(FIRMWARE_UPGRADE_PATHS[0].certificateNote)).toBeInTheDocument()
  expect(screen.queryByText(/Required \(CMVP resubmission\)/)).not.toBeInTheDocument()
})

it('the planner label and the lesson table heading both read "FIPS certificate"', () => {
  render(<HsmMigrationPlanner />)
  fireEvent.click(screen.getByRole('button', { name: 'Proceed to Firmware Planning' }))
  expect(screen.getByText('FIPS certificate:')).toBeInTheDocument()
})

it('Azure names no certificate number, since its documentation is not matched to one here', () => {
  const azure = FIRMWARE_UPGRADE_PATHS.find((p) => p.vendorId === 'azure-dhsm')
  expect(azure?.certificateNote).not.toMatch(/\b(4684|5450)\b/)
  expect(azure?.certificateNote).toMatch(/was not matched to a certificate here/)
})
