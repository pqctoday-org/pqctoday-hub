// SPDX-License-Identifier: GPL-3.0-only
import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useOpenSSL } from './useOpenSSL'
import { useOpenSSLStore } from '../store'

vi.mock('../store', () => ({
  useOpenSSLStore: vi.fn(),
}))

/** Minimal Worker stub — just enough for the mount effect + postMessage calls. */
class FakeWorker {
  onmessage: ((ev: MessageEvent) => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
}

describe('useOpenSSL — shell pipe guard', () => {
  const mockAddLog = vi.fn()
  const mockSetIsProcessing = vi.fn()
  const mockSetLoadError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-expect-error — jsdom doesn't implement Worker; stub it for this test.
    global.Worker = FakeWorker
    vi.mocked(useOpenSSLStore).mockReturnValue({
      addLog: mockAddLog,
      clearTerminalLogs: vi.fn(),
      setIsProcessing: mockSetIsProcessing,
      isProcessing: false,
      addFile: vi.fn(),
      files: [],
      command: '',
      setLastExecutionTime: vi.fn(),
      addStructuredLog: vi.fn(),
      setIsReady: vi.fn(),
      setLoadError: mockSetLoadError,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    } as any)
  })

  it('refuses a command containing a shell pipe instead of silently mis-parsing it', async () => {
    const { result } = renderHook(() => useOpenSSL())

    await act(async () => {
      await result.current.executeCommand('openssl list -signature-algorithms | grep -i "ml\\|slh"')
    })

    expect(mockAddLog).toHaveBeenCalledWith('error', expect.stringContaining('shell pipe'))
    // Never got as far as flipping isProcessing — the guard returns before that.
    expect(mockSetIsProcessing).not.toHaveBeenCalledWith(true)
  })

  it('runs a normal (pipe-free) command without tripping the guard', async () => {
    const { result } = renderHook(() => useOpenSSL())

    await act(async () => {
      await result.current.executeCommand('openssl version -a')
    })

    expect(mockAddLog).not.toHaveBeenCalledWith('error', expect.stringContaining('shell pipe'))
    expect(mockSetIsProcessing).toHaveBeenCalledWith(true)
  })
})
