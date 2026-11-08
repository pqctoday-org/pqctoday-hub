// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { Button } from '@/components/ui/button'
import { OpenSSLStudioView } from './OpenSSLStudioView'
import { useOpenSSLStore } from './store'
import type { WorkerMessage } from './worker/types'

// Keep the real Studio parent, file manager, store and hook. No engine operation
// is executed: this checks ownership and unchanged command/file dispatch only.
vi.mock('./Workbench', () => ({ Workbench: () => <div>Sample command builder</div> }))
vi.mock('./TerminalOutput', () => ({ TerminalOutput: () => <div>Sample terminal</div> }))
vi.mock('./LogsTab', () => ({ LogsTab: () => <div>Sample logs</div> }))
vi.mock('./FileEditor', () => ({ FileEditor: () => null }))
vi.mock('./learn/OpenSslLearnView', () => ({
  OpenSslLearnView: ({
    isReady,
    onTryInWorkbench,
  }: {
    isReady: boolean
    onTryInWorkbench: (category: 'genpkey') => void
  }) => (
    <div>
      <p>{isReady ? 'Sample Learn ready' : 'Sample Learn waiting'}</p>
      <Button onClick={() => onTryInWorkbench('genpkey')}>Sample Try in Workbench</Button>
    </div>
  ),
}))
class StudioWorker {
  static instances: StudioWorker[] = []
  onmessage: ((event: MessageEvent) => void) | null = null
  postMessage = vi.fn<(message: WorkerMessage) => void>()
  terminate = vi.fn()
  constructor() {
    StudioWorker.instances.push(this)
  }
  send(data: object) {
    this.onmessage?.({ data } as MessageEvent)
  }
}
const originalScrollIntoView = Element.prototype.scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
  StudioWorker.instances = []
  vi.stubGlobal('Worker', StudioWorker)
  useOpenSSLStore.setState({
    files: [],
    logs: [],
    structuredLogs: [],
    pkcs11Log: [],
    isReady: false,
    isProcessing: false,
    viewingFile: null,
    editingFile: null,
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
  Element.prototype.scrollIntoView = originalScrollIntoView
})
function show() {
  const view = render(
    <MemoryRouter>
      <OpenSSLStudioView embedded />
    </MemoryRouter>
  )
  expect(StudioWorker.instances).toHaveLength(1)
  const worker = StudioWorker.instances[0]
  act(() => worker.send({ type: 'READY' }))
  return { ...view, worker }
}
describe('Studio owns one worker across its live file manager and Learn', () => {
  it('keeps the same ready worker through ordinary tabs and the existing Try callback', () => {
    const { worker, unmount } = show()
    expect(screen.getByText('Sample Learn ready')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Workbench' }))
    expect(screen.getByText('File Manager', { exact: false })).toBeInTheDocument()
    expect(StudioWorker.instances).toHaveLength(1)
    fireEvent.click(screen.getByRole('tab', { name: 'Learn' }))
    expect(screen.getByText('Sample Learn ready')).toBeInTheDocument()
    expect(worker.terminate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Sample Try in Workbench' }))
    expect(screen.getByRole('tab', { name: 'Workbench' })).toHaveAttribute('aria-selected', 'true')
    expect(StudioWorker.instances).toHaveLength(1)
    expect(
      worker.postMessage.mock.calls.filter(([message]) => message.type === 'LOAD')
    ).toHaveLength(1)
    expect(useOpenSSLStore.getState().isReady).toBe(true)
    unmount()
    expect(worker.terminate).toHaveBeenCalledTimes(1)
  })
  it('dispatches unchanged extraction on the parent worker with current exact stored bytes and preserves file view', () => {
    const { worker } = show()
    // Add after the parent's callback was created, as a native import would.
    const content = new Uint8Array([0, 65, 255, 10])
    act(() =>
      useOpenSSLStore
        .getState()
        .addFile({ name: 'sample.key', type: 'key', content, size: content.length, timestamp: 1 })
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Workbench' }))
    fireEvent.click(screen.getByTitle('Extract Public Key'))
    expect(StudioWorker.instances).toHaveLength(1)
    const command = worker.postMessage.mock.calls
      .map(([message]) => message)
      .find((message) => message.type === 'COMMAND')
    expect(command).toMatchObject({
      type: 'COMMAND',
      command: 'pkey',
      args: ['-in', 'sample.key', '-pubout', '-out', 'sample.pub'],
      replaceVfs: true,
      files: [{ name: 'sample.key', data: content }],
    })
    act(() =>
      useOpenSSLStore
        .getState()
        .addFile({ name: 'sample.txt', type: 'text', content, size: content.length, timestamp: 2 })
    )
    fireEvent.click(within(screen.getByRole('row', { name: /sample\.txt/ })).getByTitle('View'))
    expect(useOpenSSLStore.getState().viewingFile?.content).toEqual(content)
    // A controlled DONE event closes the dispatch; it does not attest a real key.
    if (command?.type === 'COMMAND')
      act(() => worker.send({ type: 'DONE', requestId: command.requestId }))
    fireEvent.click(screen.getByRole('tab', { name: 'Learn' }))
    expect(screen.getByText('Sample Learn ready')).toBeInTheDocument()
    expect(useOpenSSLStore.getState().getFile('sample.key')?.content).toEqual(content)
  })
})
