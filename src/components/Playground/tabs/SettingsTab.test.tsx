import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsTab } from './SettingsTab'
import { SettingsContext } from '../contexts/SettingsContext'
import type { SettingsContextType } from '../contexts/types'
import '@testing-library/jest-dom'

const createMockContext = (overrides: Partial<SettingsContextType> = {}): SettingsContextType =>
  ({
    executionMode: 'wasm',
    setExecutionMode: vi.fn(),
    wasmLoaded: true,
    enabledAlgorithms: {
      kem: {
        'ML-KEM-512': true,
        'ML-KEM-768': true,
        'ML-KEM-1024': false,
        X25519: true,
        'P-256': false,
      },
      signature: {
        'ML-DSA-44': true,
        'ML-DSA-65': false,
        'ML-DSA-87': false,
        'SLH-DSA-SHA2-128f': false,
        'SLH-DSA-SHA2-128s': false,
        'SLH-DSA-SHAKE-128f': false,
        'FN-DSA-512': false,
        'FN-DSA-1024': false,
        'RSA-2048': false,
        'RSA-3072': false,
        'RSA-4096': false,
        'ECDSA-P256': false,
        Ed25519: false,
      },
      symmetric: { 'AES-128-GCM': true, 'AES-256-GCM': true },
      hash: { 'SHA-256': true, 'SHA-384': false, 'SHA3-256': false },
    },
    toggleAlgorithm: vi.fn(),
    // Minimal stubs for remaining fields
    algorithm: 'ML-KEM-768',
    setAlgorithm: vi.fn(),
    keySize: '768',
    setKeySize: vi.fn(),
    classicalAlgorithm: 'X25519',
    setClassicalAlgorithm: vi.fn(),
    handleAlgorithmChange: vi.fn(),
    activeTab: 'settings',
    setActiveTab: vi.fn(),
    loading: false,
    setLoading: vi.fn(),
    error: null,
    setError: vi.fn(),
    logs: [],
    lastLogEntry: null,
    addLog: vi.fn(),
    clearLogs: vi.fn(),
    sortColumn: 'timestamp',
    setSortColumn: vi.fn(),
    sortDirection: 'desc' as const,
    setSortDirection: vi.fn(),
    columnWidths: {},
    setColumnWidths: vi.fn(),
    resizingColumn: null,
    setResizingColumn: vi.fn(),
    startResize: vi.fn(),
    handleSort: vi.fn(),
    sortedLogs: [],
    ...overrides,
  }) as SettingsContextType

const renderWithContext = (ctx: SettingsContextType) =>
  render(
    <SettingsContext.Provider value={ctx}>
      <SettingsTab />
    </SettingsContext.Provider>
  )

describe('SettingsTab', () => {
  it('renders algorithm configuration heading', () => {
    renderWithContext(createMockContext())
    expect(screen.getByText('Algorithm Configuration')).toBeInTheDocument()
  })

  it('renders KEM algorithm section with ML-KEM variants', () => {
    renderWithContext(createMockContext())
    expect(screen.getByText('KEM Algorithms')).toBeInTheDocument()
    expect(screen.getByText('ML-KEM-512')).toBeInTheDocument()
    expect(screen.getByText('ML-KEM-768')).toBeInTheDocument()
    expect(screen.getByText('ML-KEM-1024')).toBeInTheDocument()
  })

  it('renders signature algorithm section', () => {
    renderWithContext(createMockContext())
    expect(screen.getByText('Signature Algorithms')).toBeInTheDocument()
    expect(screen.getByText('ML-DSA-44')).toBeInTheDocument()
    expect(screen.getByText('ML-DSA-65')).toBeInTheDocument()
    expect(screen.getByText('ML-DSA-87')).toBeInTheDocument()
  })

  it('renders symmetric encryption section', () => {
    renderWithContext(createMockContext())
    expect(screen.getByText('Symmetric Encryption')).toBeInTheDocument()
    expect(screen.getByText('AES-128-GCM')).toBeInTheDocument()
    expect(screen.getByText('AES-256-GCM')).toBeInTheDocument()
  })

  it('renders hash algorithm section', () => {
    renderWithContext(createMockContext())
    expect(screen.getByText('Hash Algorithms')).toBeInTheDocument()
    expect(screen.getByText('SHA-256')).toBeInTheDocument()
    expect(screen.getByText('SHA-384')).toBeInTheDocument()
    expect(screen.getByText('SHA3-256')).toBeInTheDocument()
  })

  it('calls toggleAlgorithm when a KEM algorithm is clicked', () => {
    const ctx = createMockContext()
    renderWithContext(ctx)

    fireEvent.click(screen.getByText('ML-KEM-1024'))
    expect(ctx.toggleAlgorithm).toHaveBeenCalledWith('kem', 'ML-KEM-1024')
  })

  it('calls toggleAlgorithm when a signature algorithm is clicked', () => {
    const ctx = createMockContext()
    renderWithContext(ctx)

    fireEvent.click(screen.getByText('ML-DSA-65'))
    expect(ctx.toggleAlgorithm).toHaveBeenCalledWith('signature', 'ML-DSA-65')
  })

  it('calls toggleAlgorithm when a symmetric algorithm is clicked', () => {
    const ctx = createMockContext()
    renderWithContext(ctx)

    fireEvent.click(screen.getByText('AES-128-GCM'))
    expect(ctx.toggleAlgorithm).toHaveBeenCalledWith('symmetric', 'AES-128-GCM')
  })

  it('calls toggleAlgorithm when a hash algorithm is clicked', () => {
    const ctx = createMockContext()
    renderWithContext(ctx)

    fireEvent.click(screen.getByText('SHA3-256'))
    expect(ctx.toggleAlgorithm).toHaveBeenCalledWith('hash', 'SHA3-256')
  })

  it('renders NIST level descriptions for algorithms', () => {
    renderWithContext(createMockContext())
    expect(screen.getAllByText('NIST Level 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NIST Level 3').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NIST Level 5').length).toBeGreaterThan(0)
  })

  it('renders classical KEM algorithms', () => {
    renderWithContext(createMockContext())
    expect(screen.getByText('X25519')).toBeInTheDocument()
    expect(screen.getByText('P-256')).toBeInTheDocument()
  })

  it('renders SLH-DSA and FN-DSA signature families', () => {
    renderWithContext(createMockContext())
    expect(screen.getByText('SLH-DSA-SHA2-128f')).toBeInTheDocument()
    expect(screen.getByText('FN-DSA-512')).toBeInTheDocument()
    expect(screen.getByText('FN-DSA-1024')).toBeInTheDocument()
  })
})
