// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { HybridKeyWrapping } from './HybridKeyWrapping'
import { HYBRID_COMBINER_MODES } from '../data/kmsConstants'

it('keeps authored counts and formula strings while distinguishing incompatible byte boundaries', async () => {
  const user = userEvent.setup()
  const view = render(<HybridKeyWrapping />)
  const table = screen.getByRole('table')
  expect(
    within(table).getByRole('columnheader', { name: 'Illustrated Byte Count (Scope Varies)' })
  ).toBeInTheDocument()
  const pqc = within(table).getByRole('row', { name: /^PQC Only/ })
  expect(pqc).toHaveTextContent('1,128 B')
  expect(pqc).toHaveTextContent('KEM ciphertext plus 40-byte wrapped DEK')
  expect(within(table).getByRole('row', { name: /^Classical Only/ })).toHaveTextContent('256 B')
  expect(within(table).getByText('RSA ciphertext only')).toBeInTheDocument()
  for (const mode of HYBRID_COMBINER_MODES) {
    const row = within(table).getByRole('row', { name: (name) => name.startsWith(mode.name) })
    expect(row).toHaveTextContent(mode.totalOverhead)
    expect(row).toHaveTextContent('Listed hybrid components only; excludes wrapped DEK')
    await user.click(screen.getByRole('button', { name: (name) => name.startsWith(mode.name) }))
    expect(screen.getByText(mode.combiner)).toBeInTheDocument()
    expect(screen.getByText('Listed Hybrid Component Bytes')).toBeInTheDocument()
  }
  expect(screen.getByText(/These authored byte counts/)).toHaveTextContent(
    'do not rank these values as complete-message savings'
  )
  expect(screen.getByText(/These authored byte counts/)).toHaveTextContent(
    'does not demonstrate TLS negotiation or named-group interoperability'
  )
  await user.click(screen.getByRole('button', { name: 'PQC Only' }))
  expect(screen.getByRole('heading', { name: 'PQC-Only Wrapping' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Classical Only' }))
  expect(screen.getByRole('heading', { name: 'Classical-Only Wrapping' })).toBeInTheDocument()
  expect(within(table).getByRole('row', { name: /^PQC Only/ })).toHaveTextContent('1,128 B')
  expect(screen.queryByText('Total Wire Overhead')).not.toBeInTheDocument()
  view.unmount()
})
