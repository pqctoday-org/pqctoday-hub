// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { SecurityLevelDegradation } from './SecurityLevelDegradation'

vi.mock('../data/quantumConstants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/quantumConstants')>()
  return {
    ...actual,
    ALGORITHM_SECURITY_DATA: actual.ALGORITHM_SECURITY_DATA.slice(0, 2).map((algorithm, index) => ({
      ...algorithm,
      estimatedQubits: index === 0 ? 100 : 200,
    })),
    CURRENT_QUANTUM_COMPUTERS: actual.CURRENT_QUANTUM_COMPUTERS.slice(0, 2).map(
      (machine, index) => ({
        ...machine,
        name: index === 0 ? 'Fictional encoded sample' : 'Fictional NISQ sample',
        physicalQubits: 200,
        estimatedLogicalQubits: index === 0 ? 10 : 0,
      })
    ),
  }
})

it('keeps the ratio product and NISQ empty case while withdrawing the attack-hardware inference', async () => {
  const user = userEvent.setup()
  const view = render(<SecurityLevelDegradation />)
  expect(screen.getByText(/Experimental encoding ratios do not/)).toHaveTextContent(
    'not an attack-capacity estimate'
  )
  const table = screen.getByRole('table')
  expect(
    within(table).getByRole('columnheader', { name: 'Illustrative Product' })
  ).toBeInTheDocument()
  const encoded = within(table).getByRole('row', { name: /Fictional encoded sample/ })
  expect(within(encoded).getAllByRole('cell').at(-1)).toHaveTextContent('~2,000')
  const nisq = within(table).getByRole('row', { name: /Fictional NISQ sample/ })
  expect(within(nisq).getAllByRole('cell').at(-1)).toHaveTextContent('—')
  await user.click(screen.getByRole('button', { name: 'Select Algorithm:' }))
  await user.click(screen.getByRole('option', { name: 'RSA-3072' }))
  expect(within(encoded).getAllByRole('cell').at(-1)).toHaveTextContent('~4,000')
  expect(screen.queryByRole('columnheader', { name: 'Physical needed' })).not.toBeInTheDocument()
  view.unmount()
})
