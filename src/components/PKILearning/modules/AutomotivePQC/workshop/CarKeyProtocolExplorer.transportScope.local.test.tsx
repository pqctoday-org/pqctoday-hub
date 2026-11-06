// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CarKeyProtocolExplorer } from './CarKeyProtocolExplorer'
it('keeps NFC/BLE controls and sample results without universal payload or measured-latency claims', () => {
  render(<CarKeyProtocolExplorer />)
  expect(screen.getByText(/It does not execute a CCC Digital Key/)).toHaveTextContent(
    'NFC or BLE exchange'
  )
  fireEvent.click(screen.getByRole('button', { name: /^NFC/ }))
  fireEvent.click(screen.getByRole('switch', { name: 'Toggle PQC mode' }))
  expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByText(/This calculation assumes short NFC commands/)).toHaveTextContent(
    'not a universal ISO 7816 APDU limit'
  )
  expect(screen.getByText(/This calculation assumes short NFC commands/)).toHaveTextContent(
    '200 ms round-trip figure is an illustrative latency assumption'
  )
  expect(screen.getByText(/BLE segmentation and reassembly/)).toHaveTextContent(
    '512-byte assumption is not a general L2CAP ceiling'
  )
  fireEvent.click(screen.getByRole('button', { name: /^BLE/ }))
  expect(screen.queryByText(/This calculation assumes short NFC commands/)).not.toBeInTheDocument()
  expect(screen.getByText(/not universal NFC\/BLE\/UWB limits/)).toBeInTheDocument()
})
