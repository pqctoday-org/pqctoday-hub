import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LogsTab } from './LogsTab'

// Mock the store
const mockStructuredLogs = [
  {
    id: '1',
    timestamp: '10:00:00 AM',
    command: 'openssl genpkey -algorithm RSA -out key.pem',
    operationType: 'Key Gen',
    details: 'Algorithm: RSA',
    fileName: 'key.pem',
    fileSize: 1024,
    executionTime: 100,
  },
]

vi.mock('./store', () => ({
  useOpenSSLStore: () => ({
    structuredLogs: mockStructuredLogs,
    clearStructuredLogs: vi.fn(),
  }),
}))

describe('LogsTab', () => {
  it('renders the correct columns', () => {
    render(<LogsTab />)

    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Command')).toBeInTheDocument()
    expect(screen.getByText('File')).toBeInTheDocument()
    expect(screen.getByText('Duration')).toBeInTheDocument()
  })

  it('renders log data correctly', () => {
    render(<LogsTab />)

    expect(screen.getByText('openssl genpkey -algorithm RSA -out key.pem')).toBeInTheDocument()
    expect(screen.getByText('key.pem')).toBeInTheDocument()
    expect(screen.getByText('1 KB')).toBeInTheDocument() // 1024 bytes = 1 KB
    expect(screen.getByText('100.00 ms')).toBeInTheDocument()
  })
})
