// SPDX-License-Identifier: AGPL-3.0-only
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { OpenSSLStudioView } from './OpenSSLStudioView'
import { useOpenSSLStore } from './store'
// Keep the actual parent/store/TerminalOutput. No crypto operation is mocked
// as successful here: these cases exercise only the output visibility boundary.
vi.mock('./hooks/useOpenSSL', () => ({
  useOpenSSL: () => ({
    executeCommand: vi.fn(),
    executeSkey: vi.fn(),
    runCommand: vi.fn(),
    retryLoad: vi.fn(),
    hsmKeygen: vi.fn(),
    hsmListObjects: vi.fn(),
  }),
}))
vi.mock('./Workbench', () => ({ Workbench: () => <div>Sample builder</div> }))
vi.mock('./learn/OpenSslLearnView', () => ({ OpenSslLearnView: () => null }))
vi.mock('./FileEditor', () => ({ FileEditor: () => null }))
const oldScroll = Element.prototype.scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
  useOpenSSLStore.setState({
    files: [],
    logs: [],
    structuredLogs: [],
    pkcs11Log: [],
    activeTab: 'terminal',
    editingFile: null,
    viewingFile: null,
    isReady: true,
  })
})
afterEach(() => {
  Element.prototype.scrollIntoView = oldScroll
  useOpenSSLStore.getState().resetStore()
})
function show() {
  return render(
    <MemoryRouter initialEntries={['/openssl?cmd=lms']}>
      <OpenSSLStudioView />
    </MemoryRouter>
  )
}
describe('Actual Studio output remains visible for LMS plain logs', () => {
  it('keeps starters for an empty session', () => {
    show()
    expect(screen.getByText('OpenSSL Studio — ready')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })
  it('shows actual plain success and failure logs without a CLI or upload prerequisite', () => {
    show()
    act(() => useOpenSSLStore.getState().addLog('info', 'SUCCESS: Signature is VALID!'))
    expect(screen.getByText('SUCCESS: Signature is VALID!', { exact: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
    act(() => useOpenSSLStore.getState().addLog('error', 'FAILURE: Signature is INVALID.'))
    expect(screen.getByText('FAILURE: Signature is INVALID.', { exact: true })).toBeInTheDocument()
    expect(screen.queryByText('OpenSSL Studio — ready')).not.toBeInTheDocument()
  })
  it('preserves the structured-command output boundary', () => {
    useOpenSSLStore.getState().addStructuredLog({
      command: 'version',
      operationType: 'Other',
      details: 'sample',
      executionTime: 0,
    })
    show()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
    expect(screen.queryByText('OpenSSL Studio — ready')).not.toBeInTheDocument()
  })
  it('preserves PKCS11-only output visibility', () => {
    useOpenSSLStore.getState().addPkcs11LogEntry({
      fn: 'C_Initialize',
      args: '',
      rvHex: '0x0',
      rvName: 'CKR_OK',
      ms: 1,
      ok: true,
    })
    show()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
    expect(screen.queryByText('OpenSSL Studio — ready')).not.toBeInTheDocument()
  })
})
