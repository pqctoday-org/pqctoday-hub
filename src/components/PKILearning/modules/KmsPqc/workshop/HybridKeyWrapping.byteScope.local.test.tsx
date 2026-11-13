// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { HybridKeyWrapping } from './HybridKeyWrapping'
import { HYBRID_COMBINER_MODES } from '../data/kmsConstants'

it('counts the three HKE1 envelopes on one boundary and keeps other rows as listed components', async () => {
  const user = userEvent.setup()
  const view = render(<HybridKeyWrapping />)
  const table = screen.getByRole('table', { name: 'Mode comparison' })
  expect(
    within(table).getByRole('columnheader', { name: 'Illustrated Byte Count (Scope Varies)' })
  ).toBeInTheDocument()
  const classical = within(table).getByRole('row', { name: /^Classical Only/ })
  expect(classical).toHaveTextContent('284 B')
  expect(classical).toHaveTextContent('Complete HKE1 envelope (RSA-2048)')
  const pqc = within(table).getByRole('row', { name: /^PQC Only/ })
  expect(pqc).toHaveTextContent('1,191 B')
  expect(pqc).toHaveTextContent('Complete HKE1 envelope (ML-KEM-768)')
  expect(pqc).not.toHaveTextContent('1,128 B')
  const x25519 = within(table).getByRole('row', { name: /^X25519 \+ ML-KEM-768/ })
  expect(x25519).toHaveTextContent('1,218 B')
  expect(x25519).toHaveTextContent('Complete HKE1 envelope')
  for (const mode of HYBRID_COMBINER_MODES.filter((m) => !m.completeEnvelopeBytes)) {
    const row = within(table).getByRole('row', { name: (name) => name.startsWith(mode.name) })
    expect(row).toHaveTextContent(mode.totalOverhead)
    expect(row).toHaveTextContent('Listed hybrid components only')
  }
  for (const mode of HYBRID_COMBINER_MODES) {
    await user.click(screen.getByRole('button', { name: (name) => name.startsWith(mode.name) }))
    expect(screen.getByText(mode.combiner)).toBeInTheDocument()
    expect(screen.getByText('Listed Hybrid Component Bytes')).toBeInTheDocument()
  }
  expect(screen.getByText(/The classical, PQC-only and X25519/)).toHaveTextContent(
    'complete HKE1 envelopes (project sample format, not a standard)'
  )
  expect(screen.getByText(/The classical, PQC-only and X25519/)).toHaveTextContent(
    'does not demonstrate TLS negotiation or named-group interoperability'
  )
  await user.click(screen.getByRole('button', { name: 'PQC Only' }))
  expect(screen.getByRole('heading', { name: 'PQC-Only Wrapping' })).toBeInTheDocument()
  expect(screen.getByText('ML-KEM-768 complete HKE1 envelope')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Classical Only' }))
  expect(screen.getByRole('heading', { name: 'Classical-Only Wrapping' })).toBeInTheDocument()
  expect(screen.queryByText('Total Wire Overhead')).not.toBeInTheDocument()
  view.unmount()
})

it('shows the layout table with the byte arithmetic and the project-sample label', () => {
  const view = render(<HybridKeyWrapping />)
  expect(screen.getAllByText('Project sample format, not a standard').length).toBeGreaterThan(0)
  const layout = screen.getByRole('table', { name: 'HKE1 envelope layout' })
  const rows = within(layout).getAllByRole('row')
  // header row + three modes
  expect(rows).toHaveLength(4)
  const cells = (row: HTMLElement) =>
    within(row)
      .getAllByRole('cell')
      .map((c) => c.textContent)
  expect(cells(rows[1])).toEqual([
    'RSA-2048 OAEP-SHA256',
    '18',
    '10',
    '0',
    '0',
    '0',
    '0',
    '256',
    '284 B',
  ])
  expect(cells(rows[2]).slice(1)).toEqual(['18', '10', '20', '15', '0', '1,088', '40', '1,191 B'])
  expect(cells(rows[3]).slice(1)).toEqual(['18', '10', '20', '10', '32', '1,088', '40', '1,218 B'])
  view.unmount()
})
