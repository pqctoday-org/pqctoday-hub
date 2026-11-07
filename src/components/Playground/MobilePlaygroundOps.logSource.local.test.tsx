// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { SettingsContext } from './contexts/SettingsContext'
import type { ExecutionMode, SettingsContextType } from './contexts/types'
import type { LogEntry } from '@/types'

const spies = vi.hoisted(() => ({ clearSoftware: vi.fn(), clearPkcs11: vi.fn() }))
vi.mock('@/hooks/useDeviceCapabilities', () => ({
  useDeviceCapabilities: () => ({ sab: true, lowMemory: false }),
}))
vi.mock('./PlaygroundProvider', () => ({
  PlaygroundProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('./hsm/HsmContext', async () => {
  const { useState } = await import('react')
  return {
    useHsmContext: function useSampleHsmContext() {
      const [pkcs, setPkcs] = useState([
        {
          id: 1,
          timestamp: '12:01:00.000',
          fn: 'C_SampleCall',
          args: 'fictional context',
          rvName: 'CKR_OK',
          rvHex: '0x00000000',
          ok: true,
          ms: 1,
        },
      ])
      return {
        hsmLog: pkcs,
        clearHsmLog: () => {
          spies.clearPkcs11()
          setPkcs([])
        },
      }
    },
  }
})
vi.mock('./tabs/KemOpsTab', () => ({ KemOpsTab: () => <p>Software KEM surface</p> }))
vi.mock('./tabs/SignVerifyTab', () => ({ SignVerifyTab: () => <p>Software signature surface</p> }))
vi.mock('./tabs/WorkshopToolsTab', () => ({
  WorkshopToolsTab: () => <p>Mixed workshop selector</p>,
}))
import { MobilePlaygroundOps } from './MobilePlaygroundOps'

const softwareRecord: LogEntry = {
  id: 'sample-software',
  timestamp: '12:00:00.000',
  keyLabel: 'System',
  operation: 'Load sample software library',
  result: 'Earlier sample initialization record',
  executionTime: 0,
}
function Harness({
  mode = 'mock',
  emptySoftware = false,
}: {
  mode?: ExecutionMode
  emptySoftware?: boolean
}) {
  const [software, setSoftware] = useState(emptySoftware ? [] : [softwareRecord])
  const settings = {
    executionMode: mode,
    wasmLoaded: mode === 'wasm',
    logs: software,
    sortedLogs: software,
    lastLogEntry: software[0] ?? null,
    clearLogs: () => {
      spies.clearSoftware()
      setSoftware([])
    },
    columnWidths: {
      timestamp: 180,
      keyLabel: 150,
      operation: 140,
      result: 200,
      executionTime: 120,
    },
    sortColumn: 'timestamp',
    sortDirection: 'desc',
    handleSort: vi.fn(),
    startResize: vi.fn(),
  } as unknown as SettingsContextType
  return (
    <MemoryRouter>
      <SettingsContext.Provider value={settings}>
        <MobilePlaygroundOps />
      </SettingsContext.Provider>
    </MemoryRouter>
  )
}
const openSoftware = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Show software playground log' }))

describe('phone log-source attribution and independent clears', () => {
  it('shows software records by default and clearing them preserves the shared PKCS#11 trace', () => {
    spies.clearSoftware.mockClear()
    spies.clearPkcs11.mockClear()
    render(<Harness />)
    openSoftware()
    expect(screen.getByRole('region', { name: 'Software playground log' })).toHaveTextContent(
      softwareRecord.result
    )
    expect(screen.queryByText('C_SampleCall')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear Log' }))
    expect(spies.clearSoftware).toHaveBeenCalledOnce()
    expect(spies.clearPkcs11).not.toHaveBeenCalled()
    expect(screen.queryByText(softwareRecord.result)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Shared PKCS#11' }))
    expect(screen.getByRole('region', { name: 'Shared PKCS#11 log' })).toHaveTextContent(
      'C_SampleCall'
    )
    expect(
      screen.getByText(/Clearing it leaves the software log and keys unchanged/)
    ).toBeInTheDocument()
  })

  it('clears only the explicitly selected shared HSM store and retains software records across disclosure/source changes', () => {
    spies.clearSoftware.mockClear()
    spies.clearPkcs11.mockClear()
    render(<Harness />)
    openSoftware()
    fireEvent.click(screen.getByRole('button', { name: 'Shared PKCS#11' }))
    fireEvent.click(screen.getByTitle('Clear log'))
    expect(spies.clearPkcs11).toHaveBeenCalledOnce()
    expect(spies.clearSoftware).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Hide shared pkcs#11 log' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show shared pkcs#11 log' }))
    expect(screen.queryByText('C_SampleCall')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Software' }))
    expect(screen.getByRole('region', { name: 'Software playground log' })).toHaveTextContent(
      softwareRecord.result
    )
  })

  it('does not relabel retained records or clear either source when software mode changes', () => {
    spies.clearSoftware.mockClear()
    spies.clearPkcs11.mockClear()
    const { rerender } = render(<Harness mode="mock" />)
    openSoftware()
    expect(screen.getByRole('status', { name: 'Selected execution mode' })).toHaveTextContent(
      'Mock'
    )
    rerender(<Harness mode="wasm" />)
    const log = screen.getByRole('region', { name: 'Software playground log' })
    expect(log).toHaveTextContent(softwareRecord.result)
    expect(log).toHaveTextContent('Changing the selected mode does not reclassify earlier entries')
    expect(screen.getByRole('status', { name: 'Selected execution mode' })).toHaveTextContent(
      'loaded'
    )
    expect(spies.clearSoftware).not.toHaveBeenCalled()
    expect(spies.clearPkcs11).not.toHaveBeenCalled()
    expect(
      within(screen.getByRole('group', { name: 'Log source' })).getByRole('button', {
        name: 'Software',
      })
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps the explicit source and both traces when carousel tabs change', () => {
    spies.clearSoftware.mockClear()
    spies.clearPkcs11.mockClear()
    render(<Harness />)
    const scroll = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scroll })
    openSoftware()
    fireEvent.click(screen.getByRole('button', { name: 'Shared PKCS#11' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign & Verify' }))
    fireEvent.click(screen.getByRole('button', { name: 'Crypto Lab' }))
    expect(screen.getByRole('region', { name: 'Shared PKCS#11 log' })).toHaveTextContent(
      'C_SampleCall'
    )
    fireEvent.click(screen.getByRole('button', { name: 'KEM' }))
    fireEvent.click(screen.getByRole('button', { name: 'Software' }))
    expect(screen.getByRole('region', { name: 'Software playground log' })).toHaveTextContent(
      softwareRecord.result
    )
    expect(spies.clearSoftware).not.toHaveBeenCalled()
    expect(spies.clearPkcs11).not.toHaveBeenCalled()
    expect(scroll).toHaveBeenCalledTimes(3)
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
  })

  it('does not substitute HSM entries when the software source is empty', () => {
    render(<Harness emptySoftware />)
    openSoftware()
    expect(screen.getByText('No log entries')).toBeInTheDocument()
    expect(screen.queryByText('C_SampleCall')).not.toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: 'Hide software playground log' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: 'Software playground log' })).toHaveAttribute(
      'id',
      toggle.getAttribute('aria-controls')
    )
  })
})
