// SPDX-License-Identifier: AGPL-3.0-only
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { OpenSSLStudioView } from './OpenSSLStudioView'
import { useOpenSSLStore } from './store'
import { OPENSSL_READY_LOG } from './readyLog'
// Keep the actual parent, store, hook and TerminalOutput. The engine is a stub
// Worker that only reports READY, exactly as the real worker does when it has
// loaded: the hook then writes its own READY log line, which these cases must
// survive. No crypto operation is mocked as successful.
class StudioWorker {
  static instances: StudioWorker[] = []
  onmessage: ((event: MessageEvent) => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  constructor() {
    StudioWorker.instances.push(this)
  }
  send(data: object) {
    this.onmessage?.({ data } as MessageEvent)
  }
}
vi.mock('./Workbench', () => ({ Workbench: () => <div>Sample builder</div> }))
vi.mock('./learn/OpenSslLearnView', () => ({ OpenSslLearnView: () => null }))
vi.mock('./FileEditor', () => ({ FileEditor: () => null }))
const oldScroll = Element.prototype.scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
  StudioWorker.instances = []
  vi.stubGlobal('Worker', StudioWorker)
  useOpenSSLStore.setState({
    files: [],
    logs: [],
    structuredLogs: [],
    pkcs11Log: [],
    activeTab: 'terminal',
    editingFile: null,
    viewingFile: null,
    isReady: false,
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
  Element.prototype.scrollIntoView = oldScroll
  useOpenSSLStore.getState().resetStore()
})
function show(cmd: 'lms' | 'genpkey', ready = true) {
  const view = render(
    <MemoryRouter initialEntries={[`/openssl?cmd=${cmd}`]}>
      <OpenSSLStudioView />
    </MemoryRouter>
  )
  expect(StudioWorker.instances).toHaveLength(1)
  if (ready) act(() => StudioWorker.instances[0].send({ type: 'READY' }))
  return view
}
const messages = () => useOpenSSLStore.getState().logs.map((entry) => entry.message)

describe('Actual Studio output remains visible for LMS plain logs', () => {
  it.each(['lms', 'genpkey'] as const)(
    'keeps the starter commands after the engine reports READY (%s category)',
    (cmd) => {
      show(cmd)
      // The real hook has logged its READY line, so the log is not empty.
      expect(messages()).toEqual([OPENSSL_READY_LOG])
      expect(screen.getByText('OpenSSL Studio — ready')).toBeInTheDocument()
      expect(screen.getByText('openssl version')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
    }
  )
  it('shows actual plain success and failure logs without a CLI or upload prerequisite', () => {
    show('lms')
    act(() => useOpenSSLStore.getState().addLog('info', 'SUCCESS: Signature is VALID!'))
    expect(screen.getByText('SUCCESS: Signature is VALID!', { exact: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
    act(() => useOpenSSLStore.getState().addLog('error', 'FAILURE: Signature is INVALID.'))
    expect(screen.getByText('FAILURE: Signature is INVALID.', { exact: true })).toBeInTheDocument()
    expect(screen.queryByText('OpenSSL Studio — ready')).not.toBeInTheDocument()
  })
  it('shows the LMS output pane once the engine has written boot lines, and keeps other tools unchanged', () => {
    // The real worker sends LOG lines while it loads; the hook stores them as plain logs.
    show('lms')
    act(() =>
      StudioWorker.instances[0].send({ type: 'LOG', stream: 'stdout', message: 'boot line' })
    )
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
    expect(screen.queryByText('OpenSSL Studio — ready')).not.toBeInTheDocument()
  })
  it('keeps the starters in every other tool when the engine writes boot lines', () => {
    show('genpkey')
    act(() =>
      StudioWorker.instances[0].send({ type: 'LOG', stream: 'stdout', message: 'boot line' })
    )
    expect(screen.getByText('OpenSSL Studio — ready')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })
  it('leaves every other category exactly as before: plain logs alone keep the starters', () => {
    show('genpkey')
    act(() => useOpenSSLStore.getState().addLog('info', 'Plain line from another tool'))
    expect(screen.getByText('OpenSSL Studio — ready')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })
  it('preserves the structured-command output boundary', () => {
    useOpenSSLStore.getState().addStructuredLog({
      command: 'version',
      operationType: 'Other',
      details: 'sample',
      executionTime: 0,
    })
    show('genpkey')
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
    show('genpkey')
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
    expect(screen.queryByText('OpenSSL Studio — ready')).not.toBeInTheDocument()
  })
})
