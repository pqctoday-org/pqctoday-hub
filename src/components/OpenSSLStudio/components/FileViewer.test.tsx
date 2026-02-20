import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { FileViewer } from './FileViewer'
import { useOpenSSLStore } from '../store'
import { openSSLService } from '../../../services/crypto/OpenSSLService'

vi.mock('../store', () => ({
  useOpenSSLStore: vi.fn(),
}))

vi.mock('../../../services/crypto/OpenSSLService', () => ({
  openSSLService: {
    execute: vi.fn(),
  },
}))

describe('FileViewer', () => {
  const mockSetViewingFile = vi.fn()

  // Helper to mock store state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
  const mockStoreWithFile = (file: any) => {
    vi.mocked(useOpenSSLStore).mockReturnValue({
      viewingFile: file,
      setViewingFile: mockSetViewingFile,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    } as any)
  }

  // Element mock for scrollIntoView
  beforeEach(() => {
    vi.clearAllMocks()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('renders nothing when no file is selected', () => {
    mockStoreWithFile(null)
    const { container } = render(<FileViewer />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders generic text file in text mode', () => {
    mockStoreWithFile({
      name: 'hello.txt',
      type: 'text',
      content: 'hello world',
      size: 11,
    })

    render(<FileViewer />)
    // Mode should default to TEXT
    expect(screen.getByText('hello.txt')).toBeInTheDocument()
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })

  it('renders binary file in hex mode', () => {
    mockStoreWithFile({
      name: 'data.bin',
      type: 'binary',
      content: new Uint8Array([72, 101, 108, 108, 111]), // "Hello"
      size: 5,
    })

    render(<FileViewer />)
    expect(screen.getByText('data.bin')).toBeInTheDocument()
    // Hex map should show something like 48 65 6c 6c 6f
    expect(screen.getByText(/48 65 6c 6c 6f/i)).toBeInTheDocument()
    expect(screen.getByText(/Hello/i)).toBeInTheDocument()
  })

  it('toggles modes for non-cert files', () => {
    mockStoreWithFile({
      name: 'data.txt',
      type: 'text',
      content: 'text_data',
      size: 9,
    })

    render(<FileViewer />)
    expect(screen.getByText('text_data')).toBeInTheDocument()

    const toggleBtn = screen.getByTitle('Switch View Mode')

    // Default -> Text
    // Click -> Hex
    fireEvent.click(toggleBtn)
    expect(screen.getByText(/74 65 78 74 5f/i)).toBeInTheDocument()

    // Click -> back to Text
    fireEvent.click(toggleBtn)
    expect(screen.getByText('text_data')).toBeInTheDocument()
  })

  it('parses certificates using tree layout', async () => {
    mockStoreWithFile({
      name: 'cert.crt',
      type: 'text',
      content: 'cert_data',
      size: 9,
    })

    const mockCertOutput = `Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: 1234
    Signature Algorithm: sha256`

    vi.mocked(openSSLService.execute).mockResolvedValueOnce({
      stdout: mockCertOutput,
      files: [],
    })

    render(<FileViewer />)

    // Wait for tree parsing to finish
    await waitFor(() => {
      expect(screen.getByText('Certificate:')).toBeInTheDocument()
    })

    // Tree interactions
    expect(screen.getByText('Data:')).toBeInTheDocument()
    // It should recursively parse the nested indents
    expect(screen.getByText('Version:')).toBeInTheDocument()
    expect(screen.getByText('3 (0x2)')).toBeInTheDocument()

    // Test expanding/collapsing tree nodes
    const dataNode = screen.getByText('Data:').closest('div')
    if (dataNode) fireEvent.click(dataNode) // Collapse (since depth 1 defaultOpen=true)
    // Testing specific UI reactions of the tree node
  })

  it('handles parsing errors', async () => {
    mockStoreWithFile({
      name: 'cert.crt',
      type: 'binary',
      content: new Uint8Array([1, 2, 3]),
      size: 3,
    })

    vi.mocked(openSSLService.execute).mockResolvedValueOnce({
      error: 'Simulated OpenSSL failure',
      stdout: '',
      files: [],
    })

    render(<FileViewer />)

    await waitFor(() => {
      expect(screen.getByText(/Simulated OpenSSL failure/i)).toBeInTheDocument()
    })
  })

  it('re-attempts with pkey if x509 fails for pem/key files', async () => {
    mockStoreWithFile({
      name: 'my-private.pem',
      type: 'text',
      content: 'pem data',
      size: 8,
    })

    vi.mocked(openSSLService.execute)
      .mockResolvedValueOnce({ error: 'x509 failed', stdout: '', files: [] })
      .mockResolvedValueOnce({ stdout: 'PrivateKeyData', files: [] })

    render(<FileViewer />)
    await waitFor(() => {
      expect(screen.getByText('PrivateKeyData', { exact: false })).toBeInTheDocument()
    })
  })

  it('can cycle views for certs (tree -> hex -> text -> tree)', async () => {
    mockStoreWithFile({
      name: 'cert.crt',
      type: 'text',
      content: 'cert_text',
      size: 9,
    })

    vi.mocked(openSSLService.execute).mockResolvedValueOnce({
      stdout: 'some_tree_data',
      files: [],
    })

    render(<FileViewer />)
    await waitFor(() => {
      expect(screen.getByText('some_tree_data', { exact: false })).toBeInTheDocument()
    })

    const toggleBtn = screen.getByTitle('Switch View Mode')

    // Switch to Hex
    fireEvent.click(toggleBtn)
    expect(screen.getByText(/63 65 72 74 5f/i)).toBeInTheDocument()

    // Switch to Text
    fireEvent.click(toggleBtn)
    expect(screen.getByText('cert_text')).toBeInTheDocument()

    // Switch to Tree
    fireEvent.click(toggleBtn)
    expect(screen.getByText('some_tree_data', { exact: false })).toBeInTheDocument()
  })

  it('closes viewer on Close click', () => {
    mockStoreWithFile({ name: 'cert.crt', type: 'text', content: 'hello', size: 5 })

    render(<FileViewer />)
    const closeBtn = screen.getByTitle('Close Viewer')
    fireEvent.click(closeBtn)
    expect(mockSetViewingFile).toHaveBeenCalledWith(null)
  })

  it('handles CSR execution cmd differently', async () => {
    mockStoreWithFile({
      name: 'req.csr',
      type: 'text',
      content: 'csr data',
      size: 8,
    })

    vi.mocked(openSSLService.execute).mockResolvedValueOnce({
      stdout: 'csr_parsed',
      files: [],
    })

    render(<FileViewer />)
    await waitFor(() => {
      expect(openSSLService.execute).toHaveBeenCalledWith(
        'openssl req -in req.csr -text -noout',
        expect.any(Array)
      )
    })
  })

  it('handles exception in parsing safely', async () => {
    mockStoreWithFile({
      name: 'cert.crt',
      type: 'text',
      content: 'cert data',
      size: 9,
    })

    vi.mocked(openSSLService.execute).mockRejectedValueOnce(new Error('Syntax Boom'))

    render(<FileViewer />)
    await waitFor(() => {
      expect(screen.getByText('Syntax Boom')).toBeInTheDocument()
    })
  })
})
