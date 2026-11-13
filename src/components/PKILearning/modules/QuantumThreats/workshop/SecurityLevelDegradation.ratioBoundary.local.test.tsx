// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SecurityLevelDegradation } from './SecurityLevelDegradation'
import { ALGORITHM_SECURITY_DATA, CURRENT_QUANTUM_COMPUTERS } from '../data/quantumConstants'
import { useModuleStore } from '@/store/useModuleStore'
const section = () => screen.getByRole('region', { name: 'Qubit quantities worked comparison' })
const chooseHardware = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('button', { name: 'Select Hardware Record:' }))
  const q = CURRENT_QUANTUM_COMPUTERS.find((q) => q.name === name)!
  await user.click(screen.getByRole('option', { name: `${q.vendor} ${q.name} (${q.year})` }))
}
const chooseAlgorithm = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('button', { name: 'Select Algorithm:' }))
  await user.click(screen.getByRole('option', { name }))
}
const check = async (user: ReturnType<typeof userEvent.setup>, choice: RegExp) => {
  await user.click(within(section()).getByRole('radio', { name: choice }))
  await user.click(within(section()).getByRole('button', { name: 'Check comparison' }))
}
it('renders retained RSA4096 and Willow values in separate units and evaluates the bounded correct answer without progress credit', async () => {
  const user = userEvent.setup(),
    before = useModuleStore.getState()
  render(<SecurityLevelDegradation initialAlgorithm="RSA-4096" />)
  expect(ALGORITHM_SECURITY_DATA.find((a) => a.name === 'RSA-4096')!.estimatedQubits).toBe(2692)
  expect(
    within(section()).getByRole('group', { name: 'Recorded physical qubits' })
  ).toHaveTextContent('105 physical qubits')
  expect(
    within(section()).getByRole('group', { name: 'Recorded experimental logical qubits' })
  ).toHaveTextContent('~1 experimental logical qubit')
  expect(
    within(section()).getByRole('group', { name: 'Algorithm model logical qubits' })
  ).toHaveTextContent('~2,692 model logical qubits')
  expect(within(section()).getByRole('link', { name: 'Hardware source 1' })).toHaveAttribute(
    'href',
    'https://research.google/blog/making-quantum-error-correction-work/'
  )
  expect(within(section()).getByRole('link', { name: 'Algorithm source 1' })).toHaveAttribute(
    'href',
    'https://arxiv.org/abs/2505.15917'
  )
  await check(user, /Keep physical and logical units separate/)
  expect(within(section()).getByRole('status')).toHaveTextContent(
    'Correct: compare units and source conditions'
  )
  expect(within(section()).getByRole('status')).toHaveTextContent(
    'share a unit, but not necessarily'
  )
  expect(within(section()).getByRole('status')).toHaveTextContent(
    'checks your interpretation of these records'
  )
  expect(useModuleStore.getState()).toBe(before)
  expect(screen.queryByText(/Qubit Gap: Required/)).not.toBeInTheDocument()
  expect(screen.queryByText('Illustrative Ratio Arithmetic')).not.toBeInTheDocument()
  expect(
    screen.queryByRole('columnheader', { name: 'Illustrative Product' })
  ).not.toBeInTheDocument()
})
it('rejects both original physical/logical inferences with reasons tied to the selected counts and model', async () => {
  const user = userEvent.setup()
  render(<SecurityLevelDegradation initialAlgorithm="RSA-4096" />)
  await check(user, /Divide the physical count/)
  expect(within(section()).getByRole('status')).toHaveTextContent(
    '105 physical qubits and 2,692 model logical qubits use different units'
  )
  expect(within(section()).getByRole('status')).toHaveTextContent(
    'not an attack-progress percentage'
  )
  await check(user, /Multiply the algorithm/)
  expect(within(section()).getByRole('status')).toHaveTextContent(
    'An encoding ratio from this experiment is not a circuit-, error- and architecture-specific attack model'
  )
  expect(within(section()).getByRole('status')).toHaveTextContent(
    'would invent a machine-specific requirement'
  )
})
it('changes algorithm and hardware independently and never reuses feedback for a different comparison', async () => {
  const user = userEvent.setup()
  render(<SecurityLevelDegradation initialAlgorithm="RSA-4096" />)
  await check(user, /Keep physical and logical units separate/)
  await chooseAlgorithm(user, 'RSA-2048')
  expect(
    within(section()).getByRole('group', { name: 'Algorithm model logical qubits' })
  ).toHaveTextContent('~1,537 model logical qubits')
  expect(
    within(section()).getByRole('group', { name: 'Recorded physical qubits' })
  ).toHaveTextContent('105 physical qubits')
  expect(within(section()).queryByRole('status')).not.toBeInTheDocument()
  expect(within(section()).getByRole('button', { name: 'Check comparison' })).toBeDisabled()
  await check(user, /Keep physical and logical units separate/)
  await chooseHardware(user, 'Condor')
  expect(
    within(section()).getByRole('group', { name: 'Recorded physical qubits' })
  ).toHaveTextContent('1,121 physical qubits')
  expect(
    within(section()).getByRole('group', { name: 'Recorded experimental logical qubits' })
  ).toHaveTextContent('No fault-tolerant logical count reported (NISQ)')
  expect(within(section()).queryByRole('status')).not.toBeInTheDocument()
  await check(user, /Keep physical and logical units separate/)
  expect(within(section()).getByRole('status')).toHaveTextContent(
    'missing quantity distinct from zero overhead'
  )
  expect(
    within(section()).getByRole('group', { name: 'Algorithm model logical qubits' })
  ).toHaveTextContent('~1,537 model logical qubits')
})
it('keeps an absent algorithm resource estimate distinct from zero and requires an actual answer before feedback', async () => {
  const user = userEvent.setup()
  render(<SecurityLevelDegradation initialAlgorithm="RSA-4096" />)
  expect(within(section()).queryByRole('status')).not.toBeInTheDocument()
  expect(within(section()).getByRole('button', { name: 'Check comparison' })).toBeDisabled()
  await chooseAlgorithm(user, 'SHA-256')
  expect(
    within(section()).getByRole('group', { name: 'Algorithm model logical qubits' })
  ).toHaveTextContent('No logical-qubit attack estimate supplied')
  expect(
    within(section()).queryByRole('button', { name: 'Check comparison' })
  ).not.toBeInTheDocument()
  expect(within(section()).getByText(/An absent estimate is not zero/)).toBeInTheDocument()
})
