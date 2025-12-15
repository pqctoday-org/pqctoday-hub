import { test, expect } from '@playwright/test'

test.describe('TLS Raw Config Debug', () => {
  test('verify raw config is used', async ({ page }) => {
    // Enable console logging
    page.on('console', (msg) => console.log(`[Browser] ${msg.type()}: ${msg.text()}`))

    await page.goto('/learn/tls-basics')
    await expect(page.getByRole('heading', { name: 'TLS 1.3 Basics' })).toBeVisible()

    // Switch client to raw mode
    await page.locator('button:has-text("Config File")').first().click()

    // Fill with a distinctive config
    const clientEditor = page.locator('#client-raw-config')
    await clientEditor.fill(`openssl_conf = default_conf
[ default_conf ]
ssl_conf = ssl_sect
[ ssl_sect ]
system_default = system_default_sect
[ system_default_sect ]
MinProtocol = TLSv1.3
MaxProtocol = TLSv1.3
Ciphersuites = TLS_AES_256_GCM_SHA384
`)

    // Run simulation
    await page.getByRole('button', { name: 'Start Full Interaction' }).click()

    // Wait for completion
    await page.waitForTimeout(3000)

    // Check if AES_256 is in the logs (should be the ONLY cipher if raw config worked)
    const logs = page.locator('text=/Set Ciphers.*TLS_AES_256/')
    await expect(logs.first()).toBeVisible({ timeout: 5000 })

    // Verify it's ONLY AES_256 (not the default list)
    const logText = await logs.first().textContent()
    console.log('Cipher log:', logText)
    expect(logText).not.toContain('TLS_AES_128')
    expect(logText).not.toContain('CHACHA20')
  })
})
