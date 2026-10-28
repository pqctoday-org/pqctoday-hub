// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { Pkcs11LogEntry } from '@/wasm/softhsm'
import { Pkcs11LogPanel } from './Pkcs11LogPanel'

let nextId = 0
const call = (fn: string, rvHex = '0x00000000'): Pkcs11LogEntry => ({
  id: ++nextId,
  timestamp: '12:00:00',
  fn,
  args: '',
  rvHex,
  rvName: rvHex,
  ms: 0,
  ok: rvHex === '0x00000000',
})

// The panel takes the log newest-first, as HsmContext produces it.
const newestFirst = (...entries: Pkcs11LogEntry[]) => entries.reverse()

// Function cells carry the bare fn name as their title (a group's summary
// title is a ' · '-joined list, so it doesn't match).
const fnCells = () => screen.queryAllByTitle(/^C_\w+$/).map((el) => el.getAttribute('title'))

describe('Pkcs11LogPanel supporting-call folding', () => {
  const log = () =>
    newestFirst(
      call('C_OpenSession'),
      call('C_Login'),
      call('C_GenerateKeyPair'),
      call('C_GetAttributeValue'),
      call('C_GetAttributeValue'),
      call('C_FindObjectsInit'),
      call('C_SignInit'),
      call('C_Sign'),
      call('C_GetAttributeValue', '0x00000082') // CKR_OBJECT_HANDLE_INVALID
    )

  it('folds runs of non-mechanism calls by default and keeps crypto + failures visible', () => {
    render(<Pkcs11LogPanel log={log()} defaultOpen />)
    expect(fnCells()).toEqual([
      'C_GenerateKeyPair',
      'C_SignInit',
      'C_Sign',
      'C_GetAttributeValue', // failed call — never folded
    ])
    const groups = screen.getAllByTestId('pkcs11-log-support-group')
    expect(groups).toHaveLength(2)
    expect(screen.getByText('C_GetAttributeValue ×2 · C_FindObjectsInit')).toBeInTheDocument()
  })

  it('expands one group on click and all groups via the toolbar toggle', () => {
    render(<Pkcs11LogPanel log={log()} defaultOpen />)
    fireEvent.click(screen.getAllByRole('button', { name: /2 supporting calls/ })[0])
    expect(fnCells()).toContain('C_OpenSession')
    expect(fnCells()).not.toContain('C_FindObjectsInit')

    fireEvent.click(screen.getByRole('button', { name: /Expand all/ }))
    expect(fnCells()).toHaveLength(9)

    fireEvent.click(screen.getByRole('button', { name: /Collapse support/ }))
    expect(fnCells()).toHaveLength(4)
  })

  it('folds attribute-probe misses but counts them on the group row', () => {
    render(
      <Pkcs11LogPanel
        log={newestFirst(
          call('C_GenerateKey'),
          call('C_GetAttributeValue'),
          call('C_GetAttributeValue', '0x00000012'), // CKR_ATTRIBUTE_TYPE_INVALID
          call('C_GetAttributeValue', '0x00000011') // CKR_ATTRIBUTE_SENSITIVE
        )}
        defaultOpen
      />
    )
    expect(fnCells()).toEqual(['C_GenerateKey'])
    expect(screen.getByText('2 attributes not available')).toBeInTheDocument()
  })

  it('starts expanded in lesson mode', () => {
    render(<Pkcs11LogPanel log={log()} defaultOpen lessonMode />)
    expect(fnCells()).toHaveLength(9)
  })

  it('never folds a function the caller pinned via filterFns', () => {
    render(
      <Pkcs11LogPanel
        log={newestFirst(call('C_CreateObject'), call('C_CreateObject'), call('C_DeriveKey'))}
        defaultOpen
        filterFns={['C_CreateObject', 'C_DeriveKey']}
      />
    )
    expect(fnCells()).toEqual(['C_CreateObject', 'C_CreateObject', 'C_DeriveKey'])
    expect(screen.queryByTestId('pkcs11-log-support-group')).toBeNull()
  })
})
