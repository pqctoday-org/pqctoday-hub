import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { DigitalIDModule as DigitalID } from './index'

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

// Remove ineffective useArtifactManagement mock since we are mocking the store it uses
// vi.mock(...) removed

describe('EUDI Digital ID Integration', () => {
  it('renders the Digital ID dashboard with all 5 modules', () => {
    render(<DigitalID />)

    // Verify Tab Headers
    expect(screen.getByText('EUDI Digital Identity Wallet')).toBeDefined()
    expect(screen.getAllByText('EUDI Wallet').length).toBeGreaterThan(0)
    expect(screen.getByText('PID Issuer')).toBeDefined()
    expect(screen.getByText('University')).toBeDefined()
    expect(screen.getByText('Bank (RP)')).toBeDefined()
    expect(screen.getByText('QTSP (QES)')).toBeDefined()
  })

  it('allows navigation between modules', async () => {
    render(<DigitalID />)

    // Initial state should be Wallet
    // The header in WalletComponent is "EUDI Wallet"
    // But there is also the main header "EUDI Digital Identity Wallet" in index.tsx
    // Let's look for "Managed by: María Elena García" which is unique to the Wallet view
    expect(screen.getByText(/Managed by:/i)).toBeDefined()

    // Navigate to PID Issuer
    const pidTab = screen.getByText('PID Issuer')
    fireEvent.click(pidTab)
    await waitFor(() => {
      expect(screen.getByText(/Motor Vehicle Authority/i)).toBeDefined()
    })

    // Navigate to Relying Party
    const rpTab = screen.getByText('Bank (RP)')
    fireEvent.click(rpTab)
    await waitFor(() => {
      // RelyingPartyComponent header
      expect(screen.getByText(/Bank \(Relying Party\)/i)).toBeDefined()
    })
  })

  it('completes the PID Issuance and Relying Party flow', async () => {
    render(<DigitalID />)

    // 1. Navigate to PID Issuer
    fireEvent.click(screen.getByText('PID Issuer'))
    await waitFor(() => {
      expect(screen.getByText(/Motor Vehicle Authority/i)).toBeDefined()
    })

    // 2. Start Flow
    const startBtn = screen.getByRole('button', { name: /Start Issuance Flow/i })
    fireEvent.click(startBtn)

    // 3. Authenticate and Run
    // It might take a moment to transition to AUTH step if there were async ops in handleStart (there aren't, but let's wait)
    const authBtn = await screen.findByRole('button', { name: /Proceed with Authentication/i })
    fireEvent.click(authBtn)

    // 4. Wait for Completion
    // The flow has delays (1000ms + 500ms + 1500ms approx 3-4s total)
    // We need a long timeout
    await waitFor(
      () => {
        expect(screen.getByText(/Success!/i)).toBeDefined()
        expect(screen.getByText(/PID has been securely stored/i)).toBeDefined()
      },
      { timeout: 6000 }
    )
    // 5. Navigate to Relying Party (Now that we have keys)
    const rpTab = screen.getByText('Bank (RP)')
    fireEvent.click(rpTab)
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
