import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { DigitalIDModule as DigitalID } from './index'

// Mock OpenSSL Service to avoid Web Worker initialization in tests
vi.mock('src/services/crypto/OpenSSLService', () => ({
  openSSLService: {
    execute: vi.fn().mockResolvedValue({
      stdout: 'mock output',
      stderr: '',
      files: [{ name: 'mock_key.pem', data: new Uint8Array(32) }],
      error: null,
    }),
    isReady: () => true,
  },
}))

vi.mock('src/utils/cryptoUtils', () => ({
  extractKeyFromOpenSSLOutput: vi.fn().mockResolvedValue(new Uint8Array(32)),
}))

// Mock useOpenSSLStore to provide keys for useFileRetrieval hook and support other hooks
// This mocks the underlying data store used by useFileRetrieval and useArtifactManagement
vi.mock('../../../OpenSSLStudio/store', () => {
  const mockState = {
    // State and actions
    files: [],
    addFile: vi.fn(),
    getFile: (name: string) => ({ name, content: new Uint8Array(32) }),
    getFiles: () => [{ name: 'mock_key.pem', content: new Uint8Array(32) }],
    removeFile: vi.fn(),
    refreshFiles: vi.fn(),
  }
  // The mock must be a function (hook) that also has getState() (static)
  const useOpenSSLStore = () => mockState
  useOpenSSLStore.getState = () => mockState
  return { useOpenSSLStore }
})

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
    // Let's look for "Managed by: Garcia Rossi" which is unique to the Wallet view
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
      expect(screen.getByText(/EuroBank/i)).toBeDefined()
    })
  })

  it('completes the PID Issuance flow', async () => {
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
  })

  it.skip('completes the Relying Party flow', async () => {
    render(<DigitalID />)

    // 1. Navigate to Relying Party
    fireEvent.click(screen.getByText('Bank (RP)'))
    await waitFor(() => {
      expect(screen.getByText(/EuroBank/i)).toBeDefined()
    })

    // Helper to click action and then next
    const executeAndNext = async (actionName: RegExp) => {
      // Find and click action button
      // Use findByRole to wait for button to appear (async transition)
      const actionBtn = await screen.findByRole('button', { name: actionName })
      fireEvent.click(actionBtn)

      // Wait for execution to complete and "Next Step" to appear
      // Note: The button might change from "Execute" to "Next Step"
      // We need to wait for the button WITH the name "Next Step" to appear.
      const nextBtn = await screen.findByRole('button', { name: /Next Step|Completed/i })
      if (nextBtn.textContent?.includes('Next Step')) {
        fireEvent.click(nextBtn)
      }
    }

    // Step 1: Request Presentation
    await executeAndNext(/Request Presentation/i)

    // Step 2: Select Credentials
    await executeAndNext(/Select Credentials/i)

    // Step 3: Create Proofs
    await executeAndNext(/Create Proofs/i)

    // Step 4: Apply Disclosure
    await executeAndNext(/Apply Disclosure/i)

    // Step 5: Submit Presentation
    await executeAndNext(/Submit Presentation/i)

    // Step 6: Verify Presentation (Final Step - completes flow)
    console.log('Verifying Presentation...')
    const verifyBtn = await screen.findByRole('button', { name: /Verify Presentation/i })
    fireEvent.click(verifyBtn)

    // Check for Completion message
    console.log('Waiting for completion...')
    await waitFor(
      () => {
        expect(screen.getByText(/Verification Complete!/i)).toBeDefined()
        expect(screen.getByText(/Account opening approved/i)).toBeDefined()
      },
      { timeout: 3000 }
    )
  })
})
