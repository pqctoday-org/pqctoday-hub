import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { DigitalIDModule as DigitalID } from './index'

const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <DigitalID />
    </MemoryRouter>
  )

// Mock OpenSSL Service to avoid Web Worker initialization in tests
vi.mock('../../../../services/crypto/OpenSSLService', () => ({
  openSSLService: {
    execute: vi.fn().mockImplementation(async (command: string) => {
      // Mock responses based on command
      if (command.includes('genpkey')) {
        return {
          stdout: '-----BEGIN PRIVATE KEY-----\nMOCKPRIVATEKEYDATA\n-----END PRIVATE KEY-----',
          stderr: '',
          files: [],
        }
      }
      if (command.includes('pkey -in') && command.includes('-pubout')) {
        return {
          stdout: '-----BEGIN PUBLIC KEY-----\nMOCKPUBLICKEYDATA\n-----END PUBLIC KEY-----',
          stderr: '',
          files: [],
        }
      }
      if (command.includes('dgst')) {
        const outMatch = command.match(/-out\s+([^\s]+)/)
        if (outMatch) {
          const outFile = outMatch[1]
          return {
            stdout: '',
            stderr: '',
            files: [{ name: outFile, data: new Uint8Array([1, 2, 3, 4]) }],
          }
        }
        if (command.includes('-verify')) {
          return {
            stdout: 'Verified OK',
            stderr: '',
            files: [],
          }
        }
        // Fallback for stdout output if needed (old hash style) or error
        return {
          stdout: 'SHA2-256(file)= abcd1234',
          stderr: '',
          files: [],
        }
      }
      return { stdout: 'Mock Output', stderr: '', files: [] }
    }),
    deleteFile: vi.fn(),
  },
}))

// vi.mock('src/utils/cryptoUtils', ...) removed as it referenced wrong path/file

// Stateful mock for OpenSSL Store
const mockFiles = [
  { name: 'mock_key.pem', content: new Uint8Array(32) },
  { name: 'pid_private.pem', content: new Uint8Array(32) },
  { name: 'pid_public.pem', content: new Uint8Array(32) },
  { name: 'diploma_private.pem', content: new Uint8Array(32) },
  { name: 'diploma_public.pem', content: new Uint8Array(32) },
]

vi.mock('../../../OpenSSLStudio/store', () => ({
  useOpenSSLStore: () => ({
    files: mockFiles,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addFile: (file: any) => mockFiles.push(file),
    getFile: (name: string) =>
      mockFiles.find((f) => f.name === name) || { name, content: new Uint8Array(32) },
    getFiles: () => mockFiles,
    removeFile: vi.fn(),
    refreshFiles: vi.fn(),
  }),
}))

describe('EUDI Digital ID Integration', () => {
  it('renders the Digital ID module with 4-tab navigation', () => {
    renderWithRouter()

    expect(screen.getByText('EUDI Digital Identity Wallet')).toBeDefined()
    // 4-tab nav triggers
    expect(screen.getByText('Learn')).toBeDefined()
    expect(screen.getByText('Workshop')).toBeDefined()
    expect(screen.getByText('Exercises')).toBeDefined()
    expect(screen.getByText('References')).toBeDefined()
    // Learn tab is active by default — shows eIDAS 2.0 overview content
    expect(screen.getByText(/What is eIDAS 2\.0/i)).toBeDefined()
  })

  it('allows navigation between workshop steps', async () => {
    renderWithRouter()

    // Switch to Workshop tab
    fireEvent.click(screen.getByText('Workshop'))

    await waitFor(() => {
      // Workshop step pills should be visible
      expect(screen.getAllByText(/EUDI Wallet/i).length).toBeGreaterThan(0)
    })

    // Navigate to PID Issuer step (step 2 pill)
    fireEvent.click(screen.getByText('PID Issuer'))
    await waitFor(() => {
      expect(screen.getByText(/National Identity Authority/i)).toBeDefined()
    })

    // Navigate to Bank (RP) step
    fireEvent.click(screen.getByText('Bank (RP)'))
    await waitFor(() => {
      expect(screen.getByText(/Bank \(Relying Party\)/i)).toBeDefined()
    })
  })

  it('completes the PID Issuance and Relying Party flow', async () => {
    renderWithRouter()

    // Switch to Workshop tab first
    fireEvent.click(screen.getByText('Workshop'))

    // 1. Navigate to PID Issuer step
    await waitFor(() => {
      expect(screen.getByText('PID Issuer')).toBeDefined()
    })
    fireEvent.click(screen.getByText('PID Issuer'))
    await waitFor(() => {
      expect(screen.getByText(/National Identity Authority/i)).toBeDefined()
    })

    // 2. Start Flow
    const startBtn = screen.getByRole('button', { name: /Start Issuance Flow/i })
    fireEvent.click(startBtn)

    // 3. Authenticate and Run
    const authBtn = await screen.findByRole('button', { name: /Proceed with Authentication/i })
    fireEvent.click(authBtn)

    // 4. Wait for Completion
    await waitFor(
      () => {
        expect(screen.getByText(/Success!/i)).toBeDefined()
        expect(screen.getByText(/PID has been securely stored/i)).toBeDefined()
      },
      { timeout: 6000 }
    )

    // 5. Navigate to Bank (RP) step
    fireEvent.click(screen.getByText('Bank (RP)'))
    await waitFor(() => {
      expect(screen.getByText(/Bank \(Relying Party\)/i)).toBeDefined()
    })

    // Step 1: Login
    const loginBtn = await screen.findByRole('button', { name: /Login with Wallet/i })
    fireEvent.click(loginBtn)

    // Step 2: Consent (Disclosure)
    const consentBtn = await screen.findByRole('button', { name: /Consent & Share/i })
    fireEvent.click(consentBtn)

    // Step 3: Wait for Presentation/Verification (Automated step with spinner)
    const checkBtn = await screen.findByRole(
      'button',
      { name: /Check Verification Result/i },
      { timeout: 10000 }
    )
    fireEvent.click(checkBtn)

    // Step 4: Complete
    await waitFor(
      () => {
        expect(screen.getByText(/Account Opened!/i)).toBeDefined()
        expect(screen.getByText(/identity has been verified/i)).toBeDefined()
      },
      { timeout: 5000 }
    )
  }, 30000)
})
