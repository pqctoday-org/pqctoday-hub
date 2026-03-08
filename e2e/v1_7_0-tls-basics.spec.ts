// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('TLS 1.3 Basics Module', () => {
  test.setTimeout(90000)

  test.beforeEach(async ({ page }) => {
    // Suppress "What's New" toast (main.tsx always sets pqc-tour-completed=true on load)
    await page.addInitScript(() => {
      const _orig = Storage.prototype.setItem
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'pqc-tour-completed') return
        _orig.call(this, key, value)
      }
    })
    // Debug: Log browser console to terminal
    page.on('console', (msg) => console.log(`[Browser] ${msg.type()}: ${msg.text()}`))
    // Navigate directly to the module
    await page.goto('/learn/tls-basics')
    // TLSBasicsModule is a single-page component (no Learn/Workshop tabs) —
    // the simulation UI renders directly. Wait for the page heading and the action button.
    await expect(page.getByRole('heading', { name: 'TLS 1.3 Basics' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Full Interaction' })).toBeVisible()
  })

  test('perform successful handshake and messaging flow', async ({ page }) => {
    // Default configuration should work out of the box
    // Button is now "Start Full Interaction"
    await page.getByRole('button', { name: 'Start Full Interaction' }).click()

    // Wait for simulation to complete - check for success banner
    await expect(page.getByText('Negotiation Successful')).toBeVisible({ timeout: 30000 })

    // The "Full Interaction" button automatically runs:
    // 1. Handshake
    // 2. Client sends message
    // 3. Server sends response
    // 4. Client disconnects
    // 5. Server disconnects

    // Verify the negotiated cipher is displayed (in banner) - look for the AES-256 cipher
    await expect(page.getByText('TLS_AES_256_GCM_SHA384').first()).toBeVisible()

    // Verify protocol log shows init events
    await expect(page.getByText('init').first()).toBeVisible()

    // Verify message_sent event is logged (new feature)
    await expect(page.getByText('message_sent').first()).toBeVisible({ timeout: 15000 })

    // Verify message_received event is logged (in Protocol Log by default)
    await expect(page.getByText('Received:').first()).toBeVisible()

    // Verify close_notify termination is logged
    await expect(page.getByText('close_notify').first()).toBeVisible()

    // 6. Verify Wire Data Tab (New Feature)
    await page.getByRole('button', { name: 'Wire Data' }).first().click()
    // Should see Raw Packets
    await expect(page.getByText('RAW PACKET').first()).toBeVisible()
    await expect(page.getByText('Handshake Record').first()).toBeVisible()
    // Should see Encrypted Data
    await expect(page.getByText('ENCRYPTED').first()).toBeVisible()

    // 7. Verify Crypto Ops Tab
    await page.getByRole('button', { name: 'Crypto Ops' }).first().click()
    // Crypto Ops tab shows internal crypto operations - look for STATE badge or any crypto trace
    await expect(page.getByText('STATE').first()).toBeVisible({ timeout: 10000 })
  })

  test('fails handshake on cipher suite mismatch', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Client Side
    // Toggle off AES-128
    const aes128Btn = page.getByRole('button', { name: 'TLS_AES_128_GCM_SHA256' }).first()
    await aes128Btn.click()
    // Verify it is toggled off (should not have check icon or active style)
    // The active style has 'bg-primary/10' class. Inactive has 'bg-muted'.
    await expect(aes128Btn).toHaveClass(/bg-muted/)

    // Toggle off ChaCha20
    const chachaBtn = page.getByRole('button', { name: 'TLS_CHACHA20_POLY1305_SHA256' }).first()
    await chachaBtn.click()
    await expect(chachaBtn).toHaveClass(/bg-muted/)

    // Check AES-256 is still active
    // const aes256Btn = page.getByRole('button', { name: 'TLS_AES_256_GCM_SHA384' }).first()
    // await expect(aes256Btn).toHaveClass(/bg-primary\/10/)

    // Server Side
    // Keep only ChaCha20
    const serverAes256 = page.getByRole('button', { name: 'TLS_AES_256_GCM_SHA384' }).nth(1)
    await serverAes256.click()
    // await expect(serverAes256).toHaveClass(/bg-muted/)

    const serverAes128 = page.getByRole('button', { name: 'TLS_AES_128_GCM_SHA256' }).nth(1)
    await serverAes128.click()
    // await expect(serverAes128).toHaveClass(/bg-muted/)

    const serverChaCha = page.getByRole('button', { name: 'TLS_CHACHA20_POLY1305_SHA256' }).nth(1)
    await expect(serverChaCha).toBeVisible()
    // await expect(serverChaCha).toHaveClass(/bg-primary\/10/)

    // Ensure button is enabled before running — confirms React state propagated
    await expect(page.getByRole('button', { name: 'Start Full Interaction' })).toBeEnabled()

    // Run Handshake
    await page.getByRole('button', { name: 'Start Full Interaction' }).click()

    // Expect Failure - no common cipher suites
    await expect(page.getByText('Negotiation Failed')).toBeVisible({ timeout: 20000 })
  })

  test('fails mTLS when no client cert is provided', async ({ page }) => {
    // 1. Enable mTLS on Server
    await page.getByLabel('Require Client Certificate (mTLS)').check()

    // 2. Set Client Identity to "None"
    // Cert selection uses FilterDropdown (not native <select>). Scroll trigger first to
    // avoid window.scroll closing the portal; use evaluate() to click option without scroll.
    await page.locator('[data-testid="filter-dropdown"]').nth(0).scrollIntoViewIfNeeded()
    await page.locator('[data-testid="filter-dropdown"]').nth(0).click()
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    await page
      .getByRole('option', { name: 'None', exact: true })
      .evaluate((el: HTMLElement) => el.click())

    // 3. Run Handshake -> Should Fail
    await page.getByRole('button', { name: 'Start Full Interaction' }).click()
    await expect(page.getByText('Negotiation Failed')).toBeVisible({ timeout: 10000 })
  })

  test('performs successful RSA mTLS handshake', async ({ page }) => {
    // 1. Enable mTLS on Server
    await page.getByLabel('Require Client Certificate (mTLS)').check()

    // 2. Set Client Identity to "Default" (RSA 2048)
    await page.locator('[data-testid="filter-dropdown"]').nth(0).scrollIntoViewIfNeeded()
    await page.locator('[data-testid="filter-dropdown"]').nth(0).click()
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    await page
      .getByRole('option', { name: 'Default (RSA 2048)', exact: true })
      .evaluate((el: HTMLElement) => el.click())

    // 3. Run Handshake -> Should Succeed
    await page.getByRole('button', { name: 'Start Full Interaction' }).click()
    await expect(page.getByText('Negotiation Successful')).toBeVisible({ timeout: 30000 })

    // 4. Verify RSA CA in Comparison Table
    await expect(page.getByRole('cell', { name: 'RSA' }).first()).toBeVisible()
  })

  test('fails handshake on group mismatch', async ({ page }) => {
    // Client: Keep only X25519 (disable P-256 and P-384)
    await page.getByRole('button', { name: 'P-256', exact: true }).first().click()
    await page.getByRole('button', { name: 'P-384', exact: true }).first().click()

    // Server: Keep only P-384 (disable X25519 and P-256)
    await page.getByRole('button', { name: 'X25519', exact: true }).nth(1).click()
    await page.getByRole('button', { name: 'P-256', exact: true }).nth(1).click()

    // Run Handshake
    await page.getByRole('button', { name: 'Start Full Interaction' }).click()

    // Expect Failure - no common key exchange groups
    await expect(page.getByText('Negotiation Failed')).toBeVisible({ timeout: 5000 })
  })

  test('performs successful handshake with ML-DSA identity', async ({ page }) => {
    // Cert selection uses FilterDropdown (not native <select>).
    // nth(0) = Client Identity, nth(1) = Server Identity (only 2 cert dropdowns on page).
    // Scroll trigger first; use evaluate() to click option without triggering scroll-close.
    // 1. Select ML-DSA for Client
    await page.locator('[data-testid="filter-dropdown"]').nth(0).scrollIntoViewIfNeeded()
    await page.locator('[data-testid="filter-dropdown"]').nth(0).click()
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    await page
      .getByRole('option', { name: 'Default (ML-DSA-44)', exact: true })
      .evaluate((el: HTMLElement) => el.click())

    // 2. Select ML-DSA for Server
    await page.locator('[data-testid="filter-dropdown"]').nth(1).scrollIntoViewIfNeeded()
    await page.locator('[data-testid="filter-dropdown"]').nth(1).click()
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    await page
      .getByRole('option', { name: 'Default (ML-DSA-44)', exact: true })
      .evaluate((el: HTMLElement) => el.click())

    // 3. Run Handshake
    await page.getByRole('button', { name: 'Start Full Interaction' }).click()

    // 4. Verify Success
    await expect(page.getByText('Negotiation Successful')).toBeVisible({ timeout: 30000 })
  })

  test('performs successful ML-DSA mTLS handshake', async ({ page }) => {
    // 1. Enable mTLS on Server
    await page.getByLabel('Require Client Certificate (mTLS)').check()

    // 2. Select ML-DSA for Client and Server via FilterDropdown
    await page.locator('[data-testid="filter-dropdown"]').nth(0).scrollIntoViewIfNeeded()
    await page.locator('[data-testid="filter-dropdown"]').nth(0).click()
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    await page
      .getByRole('option', { name: 'Default (ML-DSA-44)', exact: true })
      .evaluate((el: HTMLElement) => el.click())

    await page.locator('[data-testid="filter-dropdown"]').nth(1).scrollIntoViewIfNeeded()
    await page.locator('[data-testid="filter-dropdown"]').nth(1).click()
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    await page
      .getByRole('option', { name: 'Default (ML-DSA-44)', exact: true })
      .evaluate((el: HTMLElement) => el.click())

    // 3. Run Handshake
    await page.getByRole('button', { name: 'Start Full Interaction' }).click()

    // 4. Verify Success
    await expect(page.getByText('Negotiation Successful')).toBeVisible({ timeout: 30000 })

    // 5. Verify ML-DSA CA in Comparison Table
    await expect(page.getByRole('cell', { name: 'ML-DSA-44' }).first()).toBeVisible()
  })
  test('verifies certificate inspection', async ({ page }) => {
    // 1. Click Inspect for Client Identity (Default RSA)
    // The button is inside the "Client Identity (mTLS)" section.
    // We can find it by the title "Inspect Identity Certificate" or the eye icon.
    await page.getByTitle('Inspect Identity Certificate').first().click()

    // 2. Expect Modal to Open
    await expect(page.getByText('Client Identity Certificate')).toBeVisible()

    // 3. Expect Certificate Content to be visible (not error)
    // We check for "rsaEncryption" which confirms the certificate was parsed and displayed.
    // The label "Public Key Algorithm" might vary in formatting or parsing structure, so we rely on the value.
    await expect(page.getByText('rsaEncryption').first()).toBeVisible({ timeout: 10000 })

    // 4. Ensure no error
    await expect(page.getByText('Parsing Failed')).not.toBeVisible()

    // Close modal
    await page.getByRole('button').filter({ hasText: '' }).first().click() // Close button might be tricky, try locating by X icon or just escape
    await page.keyboard.press('Escape')
  })

  test('syncs UI changes to raw config file', async ({ page }) => {
    // 1. Toggle off a cipher suite in UI mode
    const chachaBtn = page.getByRole('button', { name: 'TLS_CHACHA20_POLY1305_SHA256' }).first()
    await chachaBtn.click()

    // 2. Switch to Config File tab (uses role="tab" not role="button")
    await page.getByRole('tab', { name: 'Config File' }).first().click()

    // 3. Verify the raw config does NOT contain the disabled cipher
    const textarea = page.locator('#client-raw-config')
    const configText = await textarea.inputValue()
    expect(configText).not.toContain('TLS_CHACHA20_POLY1305_SHA256')

    // 4. Verify it still contains enabled ciphers
    expect(configText).toContain('TLS_AES_256_GCM_SHA384')
  })

  test('syncs raw config edits back to UI', async ({ page }) => {
    // 1. Switch to Config File tab (uses role="tab" not role="button")
    await page.getByRole('tab', { name: 'Config File' }).first().click()

    // 2. Edit the raw config to remove P-384 from Groups
    const textarea = page.locator('#client-raw-config')
    const currentValue = await textarea.inputValue()
    const newValue = currentValue.replace(':P-384', '')
    await textarea.fill(newValue)

    // 3. Switch back to UI mode
    await page.getByRole('tab', { name: 'UI' }).first().click()

    // 4. Verify P-384 is now unchecked (has bg-muted class, not active)
    const p384Btn = page.getByRole('button', { name: 'P-384', exact: true }).first()
    await expect(p384Btn).toHaveClass(/bg-muted/)
  })

  // Note: Clipboard test only runs on Chromium (Firefox/WebKit don't support grantPermissions for clipboard)
  test('copy config button copies to clipboard', async ({ page, context, browserName }) => {
    // Skip on browsers that don't support clipboard permissions
    test.skip(browserName !== 'chromium', 'Clipboard permissions only supported in Chromium')

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    // 1. Switch to Config File tab (uses role="tab" not role="button")
    await page.getByRole('tab', { name: 'Config File' }).first().click()

    // 2. Click Copy button
    await page.getByRole('button', { name: 'Copy' }).first().click()

    // 3. Verify clipboard contains config text
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain('Ciphersuites')
    expect(clipboardText).toContain('TLS_AES_256_GCM_SHA384')
  })
})
