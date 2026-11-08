// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HsmMigrationPlanner } from './HsmMigrationPlanner'
it('one HSM keeps authored planning numbers without promising partition continuity or rollback', () => {
  render(<HsmMigrationPlanner />)
  fireEvent.change(screen.getByLabelText(/Number of HSMs/), { target: { value: '1' } })
  fireEvent.click(screen.getByRole('button', { name: /Key Migration/ }))
  expect(screen.getByText('~250 MB (sample keys + config + state assumption)')).toHaveTextContent(
    'assumption'
  )
  expect(screen.getByText('~15 min per HSM')).toBeVisible()
  expect(screen.getByText(/two logical partitions alone/)).toHaveTextContent(
    'does not test uninterrupted service during an upgrade, including with one HSM'
  )
  expect(screen.getByText(/Check which keys, configuration/)).toHaveTextContent(
    'neither tests nor guarantees recovery, rollback or continued service'
  )
  expect(screen.getByText(/The timings, backup sizes and fixed/)).toHaveTextContent(
    'not measurements of a selected product or verified vendor guarantees'
  )
  expect(screen.queryByText(/continues during migration/)).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Proceed to Validation' }))
  expect(screen.getByRole('heading', { name: 'Phase 4: Validation Planning' })).toBeInTheDocument()
})
