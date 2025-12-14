import { test, expect } from '@playwright/test'

test.describe('EUDI Digital Identity Wallet Module', () => {
  test.describe.configure({ mode: 'serial' }) // Steps depend on previous state (Wallet persistence)

  test.beforeEach(async ({ page }) => {
    // Increase timeout for WebCrypto/WASM availability (3 mins max)
    test.setTimeout(180000)

    // Capture console logs for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.text().includes('[RP Flow]')) {
        console.log(`Browser ${msg.type()}: ${msg.text()}`)
      }
    })
  })

  test('Completes PID Issuance and Relying Party Flows', async ({ page }) => {
    // Helper for logging with timestamp
    const logStep = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`)

    // 1. Navigation to Digital ID Module
    logStep('Starting Navigation')
    await page.goto('/')
    await page.getByRole('button', { name: 'Learn' }).click()

    // Wait for modules to load - avoiding networkidle as it causes hangs in CI
    logStep('Waiting for Digital ID Card')
    const digitalIdCard = page.getByRole('heading', { name: 'Digital ID', exact: true })
    await expect(digitalIdCard).toBeVisible({ timeout: 30000 })
    await digitalIdCard.click()

    logStep('Verifying Dashboard')
    // Verify Dashboard
    await expect(page.getByRole('heading', { name: 'EUDI Digital Identity Wallet' })).toBeVisible()
    await expect(page.getByText('Explore the European Digital Identity ecosystem')).toBeVisible()

    // -------------------------------------------------------------
    // Flow 1: PID Issuance
    // -------------------------------------------------------------
    await test.step('PID Issuance Flow', async () => {
      logStep('Start: PID Issuance')
      // Select PID Issuer
      const pidIssuerBtn = page.getByRole('button', { name: 'PID Issuer' })
      await expect(pidIssuerBtn).toBeVisible()
      await pidIssuerBtn.click()

      await expect(page.getByText('Motor Vehicle Authority')).toBeVisible()

      // Step 1: Start Flow
      const startBtn = page.getByRole('button', { name: 'Start Issuance Flow' })
      await expect(startBtn).toBeVisible()
      await startBtn.click()

      // Step 2: Authenticate
      const authBtn = page.getByRole('button', { name: 'Proceed with Authentication' })
      await expect(authBtn).toBeVisible({ timeout: 10000 })
      await authBtn.click()

      // Step 3: Wait for Completion
      logStep('Waiting for PID Issuance Creation (WASM)')
      // Verify Split View Log Tabs exist
      await expect(page.getByRole('button', { name: 'PROTOCOL LOG' })).toBeVisible()
      const opensslTab = page.getByRole('button', { name: 'OPENSSL LOG' })
      await expect(opensslTab).toBeVisible()

      // Click OpenSSL Log tab and verify content
      await opensslTab.click()
      // Wait for at least one OpenSSL log entry to appear (from Key Gen)
      await expect(page.getByText('[OpenSSL:').first()).toBeVisible({ timeout: 60000 })

      await expect(page.getByText('Success!')).toBeVisible({ timeout: 120000 }) // increased for CI
      await expect(page.getByText('PID has been securely stored')).toBeVisible()

      // Return to Wallet
      await page.getByRole('button', { name: 'Return to Wallet' }).click()
      await expect(page.getByText('Managed by:')).toBeVisible()
      logStep('End: PID Issuance')
    })

    // -------------------------------------------------------------
    // Flow 2: Attestation Issuer (University)
    // -------------------------------------------------------------
    await test.step('Attestation Issuer Flow', async () => {
      logStep('Start: Attestation Issuer')
      // Navigate to University
      await page.getByRole('button', { name: 'University' }).click()
      await expect(page.getByText('Technical University')).toBeVisible()

      // Start Issuance
      await page.getByRole('button', { name: 'Login to Student Portal' }).click()

      // Authenticate & Share PID
      await expect(page.getByText('Share PID Data')).toBeVisible()
      await page.getByRole('button', { name: 'Share PID Data' }).click()

      logStep('Waiting for Diploma Issuance (WASM)')
      // Wait for "Issue Diploma" button after presentation
      await expect(page.getByRole('button', { name: 'Issue Diploma' })).toBeVisible({
        timeout: 120000,
      })
      await page.getByRole('button', { name: 'Issue Diploma' }).click()

      await expect(page.getByText('Diploma Added!')).toBeVisible({ timeout: 60000 })
      await expect(page.getByText('You can now use your degree')).toBeVisible()

      // Return to Wallet
      await page.getByRole('button', { name: 'Return to Wallet' }).click()
      logStep('End: Attestation Issuer')
    })

    // -------------------------------------------------------------
    // Flow 3: Remote QES Provider
    // -------------------------------------------------------------
    await test.step('QES Provider Flow', async () => {
      logStep('Start: QES Provider')
      await page.getByRole('button', { name: 'QTSP (QES)' }).click()
      await expect(page.getByText('Qualified Trust Service Provider')).toBeVisible()

      // Start UPLOAD Flow (simulated)
      await page.getByRole('button', { name: 'Proceed to Sign' }).click()

      // Verify Identity (Presentation / Authorize)
      await page.getByRole('button', { name: 'Authorize Access' }).click()

      // Wait for Sign button
      logStep('Waiting for QES Signing')
      await expect(page.getByRole('button', { name: 'Sign Document' })).toBeVisible()
      await page.getByRole('button', { name: 'Sign Document' }).click()

      // Wait for completion
      await expect(page.getByText('Signed Successfully!')).toBeVisible({ timeout: 120000 })
      await expect(
        page.getByText('The document has been signed with a Qualified Electronic Signature')
      ).toBeVisible()

      // Return
      await page.getByRole('button', { name: 'Done' }).click()
      logStep('End: QES Provider')
    })

    // -------------------------------------------------------------
    // Flow 4: Relying Party (Bank)
    // -------------------------------------------------------------
    await test.step('Relying Party Flow', async () => {
      logStep('Start: Relying Party')
      await page.getByRole('button', { name: 'Bank (RP)' }).click()
      await expect(page.getByRole('heading', { name: 'Bank (Relying Party)' })).toBeVisible()

      // Step 1: Login
      await page.getByRole('button', { name: 'Login with Wallet' }).click()
      await expect(page.getByText('Consent & Share')).toBeVisible()

      // Step 2: Disclosure & Presentation
      await page.getByRole('button', { name: 'Consent & Share' }).click()

      logStep('Waiting for ZK Proof Generation')
      // Wait for automated presentation/proof generation
      await expect(page.getByText('Generating Zero-Knowledge Proof...')).toBeVisible({
        timeout: 5000,
      })
      await expect(page.getByRole('button', { name: 'Check Verification Result' })).toBeVisible({
        timeout: 120000,
      })

      // Step 3: Verification
      await page.getByRole('button', { name: 'Check Verification Result' }).click()
      await expect(page.getByText('Account Opened!')).toBeVisible()

      // Check logs
      await expect(page.getByText('Trust Chain Valid')).toBeVisible()

      // Finish
      await page.getByRole('button', { name: 'Return to Wallet' }).click()
      await expect(
        page.getByRole('heading', { name: 'EUDI Digital Identity Wallet' })
      ).toBeVisible()
      logStep('End: Relying Party')
    })
  })
})
