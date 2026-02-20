import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LmsConfig } from './LmsConfig'
import { useOpenSSLStore } from '../../store'

vi.mock('../../store', () => ({
  useOpenSSLStore: vi.fn(),
}))

import { lmsService } from '../../../../wasm/LmsService'

vi.mock('../../../../wasm/LmsService', () => ({
  lmsService: {
    generateKeypair: vi.fn().mockResolvedValue({
      publicKey: new Uint8Array([1, 2, 3]),
      privateKey: new Uint8Array([4, 5, 6]),
    }),
    sign: vi.fn().mockResolvedValue({
      signature: new Uint8Array([7, 8, 9]),
      updatedPrivateKey: new Uint8Array([10, 11, 12]),
    }),
    verify: vi.fn().mockResolvedValue(true),
  },
}))

describe('LmsConfig', () => {
  const defaultProps = {
    mode: 'generate' as const,
    setMode: vi.fn(),
    lmsKeyFile: '',
    setLmsKeyFile: vi.fn(),
    lmsSigFile: '',
    setLmsSigFile: vi.fn(),
    lmsDataFile: '',
    setLmsDataFile: vi.fn(),
  }

  const mockStore = {
    files: [],
    addFile: vi.fn(),
    addLog: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    vi.mocked(useOpenSSLStore).mockReturnValue(mockStore as any)
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      console.warn('TEST CONSOLE ERROR:', ...args)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders mode tabs', () => {
    render(<LmsConfig {...defaultProps} />)
    expect(screen.getByTestId('lms-mode-generate')).toBeInTheDocument()
    expect(screen.getByTestId('lms-mode-sign')).toBeInTheDocument()
    expect(screen.getByTestId('lms-mode-verify')).toBeInTheDocument()
  })

  it('switches modes when tabs are clicked', () => {
    render(<LmsConfig {...defaultProps} />)
    fireEvent.click(screen.getByTestId('lms-mode-sign'))
    expect(defaultProps.setMode).toHaveBeenCalledWith('sign')
  })

  it('generates a new keypair in generate mode', async () => {
    render(<LmsConfig {...defaultProps} />)
    const generateBtn = screen.getByText(/Generate New LMS Keypair/i)
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(mockStore.addLog).toHaveBeenCalledWith('info', 'Generating LMS Keypair...')
      expect(mockStore.addFile).toHaveBeenCalledTimes(2) // pub and priv keys
      expect(defaultProps.setLmsKeyFile).toHaveBeenCalled()
    })
  })

  it('signs data in sign mode', async () => {
    mockStore.files = [
      { name: 'test.key', content: new Uint8Array([1, 2, 3]) },
      { name: 'data.txt', content: 'hello world' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    ] as any

    render(<LmsConfig {...defaultProps} mode="sign" lmsKeyFile="test.key" lmsDataFile="data.txt" />)
    const signBtn = screen.getByText(/Sign Selected Data File/i)
    fireEvent.click(signBtn)

    await waitFor(() => {
      expect(mockStore.addLog).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('Message signed!')
      )
      expect(mockStore.addFile).toHaveBeenCalledTimes(2) // sig and updated privately
      expect(defaultProps.setLmsSigFile).toHaveBeenCalled()
    })
  })

  it('verifies data in verify mode', async () => {
    mockStore.files = [
      { name: 'test.pub', content: new Uint8Array([1, 2, 3]) },
      { name: 'sig.bin', content: new Uint8Array([1, 2]) },
      { name: 'data.txt', content: 'hello world' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    ] as any

    render(
      <LmsConfig
        {...defaultProps}
        mode="verify"
        lmsKeyFile="test.pub"
        lmsSigFile="sig.bin"
        lmsDataFile="data.txt"
      />
    )
    const verifyBtn = screen.getByText(/Verify \(WASM\)/i)
    fireEvent.click(verifyBtn)

    await waitFor(() => {
      expect(mockStore.addLog).toHaveBeenCalledWith('info', 'SUCCESS: Signature is VALID!')
    })
  })

  it('fails verify if invalid signature', async () => {
    // Override the mock for verify just for this test
    vi.mocked(lmsService.verify).mockResolvedValueOnce(false)

    mockStore.files = [
      { name: 'test.pub', content: new Uint8Array([1, 2, 3]) },
      { name: 'sig.bin', content: new Uint8Array([1, 2]) },
      { name: 'data.txt', content: 'hello world' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    ] as any

    render(
      <LmsConfig
        {...defaultProps}
        mode="verify"
        lmsKeyFile="test.pub"
        lmsSigFile="sig.bin"
        lmsDataFile="data.txt"
      />
    )
    const verifyBtn = screen.getByText(/Verify \(WASM\)/i)
    fireEvent.click(verifyBtn)

    await waitFor(() => {
      expect(mockStore.addLog).toHaveBeenCalledWith('error', 'FAILURE: Signature is INVALID.')
    })
  })

  it('loads sample data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () =>
        Promise.resolve({
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    }) as any

    render(<LmsConfig {...defaultProps} />)
    const loadBtn = screen.getByText(/Load Sample Data/i)
    fireEvent.click(loadBtn)

    await waitFor(() => {
      expect(mockStore.addFile).toHaveBeenCalledTimes(3)
    })
  })
})
