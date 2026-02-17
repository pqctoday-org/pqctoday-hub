import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { LogsTab } from './LogsTab'
import { SettingsContext } from '../contexts/SettingsContext'
import type { SettingsContextType } from '../contexts/types'
import '@testing-library/jest-dom'

const createMockContext = (overrides: Partial<SettingsContextType> = {}): SettingsContextType =>
  ({
    clearLogs: vi.fn(),
    columnWidths: {
      timestamp: 180,
      keyLabel: 150,
      operation: 140,
      result: 200,
      executionTime: 120,
    },
    sortColumn: 'timestamp',
    sortDirection: 'desc' as const,
    handleSort: vi.fn(),
    startResize: vi.fn(),
    sortedLogs: [],
    // Minimal stubs for remaining required fields
    algorithm: 'ML-KEM-768',
    setAlgorithm: vi.fn(),
    keySize: '768',
    setKeySize: vi.fn(),
    executionMode: 'wasm',
    setExecutionMode: vi.fn(),
    wasmLoaded: true,
    classicalAlgorithm: 'X25519',
    setClassicalAlgorithm: vi.fn(),
    enabledAlgorithms: { kem: {}, signature: {}, symmetric: {}, hash: {} },
    toggleAlgorithm: vi.fn(),
    handleAlgorithmChange: vi.fn(),
    activeTab: 'logs',
    setActiveTab: vi.fn(),
    loading: false,
    setLoading: vi.fn(),
    error: null,
    setError: vi.fn(),
    logs: [],
    lastLogEntry: null,
    addLog: vi.fn(),
    setSortColumn: vi.fn(),
    setSortDirection: vi.fn(),
    setColumnWidths: vi.fn(),
    resizingColumn: null,
    setResizingColumn: vi.fn(),
    ...overrides,
  }) as SettingsContextType

const renderWithContext = (ctx: SettingsContextType) =>
  render(
    <SettingsContext.Provider value={ctx}>
      <LogsTab />
    </SettingsContext.Provider>
  )

describe('LogsTab', () => {
  it('renders the header and clear button', () => {
    const ctx = createMockContext()
    renderWithContext(ctx)

    expect(screen.getByText('Operation Log')).toBeInTheDocument()
    expect(screen.getByText('Clear Log')).toBeInTheDocument()
  })

  it('renders empty state when no logs', () => {
    const ctx = createMockContext({ sortedLogs: [] })
    renderWithContext(ctx)

    expect(screen.getByText('No operations performed yet.')).toBeInTheDocument()
  })

  it('renders column headers', () => {
    const ctx = createMockContext()
    renderWithContext(ctx)

    expect(screen.getByText('Timestamp')).toBeInTheDocument()
    expect(screen.getByText('Key Label')).toBeInTheDocument()
    expect(screen.getByText('Operation')).toBeInTheDocument()
    expect(screen.getByText('Results')).toBeInTheDocument()
    expect(screen.getByText('Execution Time')).toBeInTheDocument()
  })

  it('renders log entries', () => {
    const ctx = createMockContext({
      sortedLogs: [
        {
          id: 'log-1',
          timestamp: '2026-02-17 10:00:00',
          keyLabel: 'Test Key',
          operation: 'Encapsulate',
          result: 'Success',
          executionTime: 42.5,
        },
        {
          id: 'log-2',
          timestamp: '2026-02-17 10:01:00',
          keyLabel: 'Another Key',
          operation: 'Sign',
          result: 'Verified',
          executionTime: 250,
        },
      ],
    })
    renderWithContext(ctx)

    expect(screen.getByText('Test Key')).toBeInTheDocument()
    expect(screen.getByText('Encapsulate')).toBeInTheDocument()
    expect(screen.getByText('42.50 ms')).toBeInTheDocument()

    expect(screen.getByText('Another Key')).toBeInTheDocument()
    expect(screen.getByText('Sign')).toBeInTheDocument()
    expect(screen.getByText('250.00 ms')).toBeInTheDocument()
  })

  it('calls clearLogs when Clear Log is clicked', () => {
    const ctx = createMockContext()
    renderWithContext(ctx)

    fireEvent.click(screen.getByText('Clear Log'))
    expect(ctx.clearLogs).toHaveBeenCalledOnce()
  })

  it('calls handleSort when a column header is clicked', () => {
    const ctx = createMockContext()
    renderWithContext(ctx)

    fireEvent.click(screen.getByText('Operation'))
    expect(ctx.handleSort).toHaveBeenCalledWith('operation')

    fireEvent.click(screen.getByText('Execution Time'))
    expect(ctx.handleSort).toHaveBeenCalledWith('executionTime')
  })

  it('applies performance color classes based on execution time', () => {
    const ctx = createMockContext({
      sortedLogs: [
        {
          id: 'fast',
          timestamp: '10:00',
          keyLabel: 'Fast',
          operation: 'Op',
          result: 'OK',
          executionTime: 50,
        },
        {
          id: 'medium',
          timestamp: '10:01',
          keyLabel: 'Medium',
          operation: 'Op',
          result: 'OK',
          executionTime: 300,
        },
        {
          id: 'slow',
          timestamp: '10:02',
          keyLabel: 'Slow',
          operation: 'Op',
          result: 'OK',
          executionTime: 600,
        },
      ],
    })
    renderWithContext(ctx)

    const rows = screen.getAllByRole('row').slice(1) // skip header

    // Fast (< 100ms) should have text-success
    const fastCell = within(rows[0]).getByText('50.00 ms')
    expect(fastCell.className).toContain('text-success')

    // Medium (100-500ms) should have text-warning
    const mediumCell = within(rows[1]).getByText('300.00 ms')
    expect(mediumCell.className).toContain('text-warning')

    // Slow (> 500ms) should have text-destructive
    const slowCell = within(rows[2]).getByText('600.00 ms')
    expect(slowCell.className).toContain('text-destructive')
  })
})
