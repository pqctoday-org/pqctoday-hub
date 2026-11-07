// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { LiveHSMProvider } from './LiveHSMProvider'

vi.mock('./MLDSASignDemo', () => ({
  MLDSASignDemo: ({ providerReady }: { providerReady: boolean }) => (
    <div>Signing sample ready: {String(providerReady)}</div>
  ),
}))
vi.mock('./MLKEMEncryptDemo', () => ({
  MLKEMEncryptDemo: ({ providerReady }: { providerReady: boolean }) => (
    <div>Encryption sample ready: {String(providerReady)}</div>
  ),
}))
vi.mock('./DualSignDemo', () => ({
  DualSignDemo: ({ providerReady }: { providerReady: boolean }) => (
    <div>Dual signing sample ready: {String(providerReady)}</div>
  ),
}))
class SampleWorker {
  static instances: SampleWorker[] = []
  listener?: (e: MessageEvent) => void
  postMessage = vi.fn()
  terminate = vi.fn()
  constructor() {
    SampleWorker.instances.push(this)
  }
  addEventListener(_type: string, fn: (e: MessageEvent) => void) {
    this.listener = fn
  }
  emit(data: unknown) {
    this.listener?.({ data } as MessageEvent)
  }
}
beforeEach(() => {
  SampleWorker.instances = []
  vi.stubGlobal('Worker', SampleWorker)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('provider initialization scope', () => {
  it.each(['ok', 'provider_missing'] as const)(
    'retains init and child controls for %s without claiming operation success',
    (status) => {
      render(<LiveHSMProvider />)
      const worker = SampleWorker.instances[0]
      act(() => worker.emit({ type: 'READY' }))
      expect(worker.postMessage).toHaveBeenCalledWith({
        type: 'LOAD_AND_INIT',
        requestId: 'cms-init',
      })
      act(() => worker.emit({ type: 'INIT_DONE', status, code: 0 }))
      expect(screen.getByText(/Registration alone does not establish/)).toBeInTheDocument()
      expect(screen.getByText(`Signing sample ready: ${status === 'ok'}`)).toBeInTheDocument()
      expect(screen.getByText(`Encryption sample ready: ${status === 'ok'}`)).toBeInTheDocument()
      expect(screen.getByText(`Dual signing sample ready: ${status === 'ok'}`)).toBeInTheDocument()
      expect(
        screen.queryByText(/Phase 2|Phase 3|-keyform engine|What this proves/)
      ).not.toBeInTheDocument()
    }
  )
  it('keeps initialization failure and retry lifecycle unchanged', () => {
    const view = render(<LiveHSMProvider />)
    const worker = SampleWorker.instances[0]
    act(() => worker.emit({ type: 'ERROR', error: 'sample init failure' }))
    expect(screen.getByText('sample init failure')).toBeInTheDocument()
    expect(screen.queryByText(/Signing sample ready/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Re-run init' }))
    expect(worker.terminate).toHaveBeenCalledOnce()
    expect(SampleWorker.instances).toHaveLength(2)
    view.unmount()
    expect(SampleWorker.instances[1].terminate).toHaveBeenCalledOnce()
  })
})
