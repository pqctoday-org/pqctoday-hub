// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * E2E tests for the PQC Assistant chatbot.
 *
 * Mocks both the RAG corpus fetch and the Gemini API to test
 * the full chatbot UI lifecycle without external dependencies.
 */

const MOCK_CORPUS = [
  {
    id: 'algo-ml-kem-768',
    source: 'algorithms',
    title: 'ML-KEM-768',
    content: 'Algorithm: ML-KEM-768\nFamily: Lattice-based\nSecurity Level: 3',
    category: 'Lattice-based',
    metadata: { family: 'Lattice-based' },
    deepLink: '/algorithms?highlight=ml-kem-768',
  },
  {
    id: 'glossary-0',
    source: 'glossary',
    title: 'Post-Quantum Cryptography',
    content:
      'Term: PQC\nDefinition: Cryptographic algorithms designed to be secure against quantum computers.',
    category: 'concept',
    metadata: { acronym: 'PQC' },
  },
]

function mockGeminiSSE(text: string): string {
  const json = JSON.stringify({
    candidates: [{ content: { parts: [{ text }] } }],
  })
  return `data: ${json}\ndata: [DONE]\n`
}

test.describe('PQC Assistant Chatbot', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress WhatsNew toast
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 1 })
      )
    })

    // Mock RAG corpus fetch
    await page.route('**/data/rag-corpus.json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CORPUS),
      })
    })
  })

  test('FAB opens chat panel', async ({ page }) => {
    await page.goto('/')
    const fab = page.getByRole('button', { name: 'Open PQC Assistant' }).last()
    await expect(fab).toBeVisible({ timeout: 5000 })
    await fab.click()

    // Panel should appear
    const panel = page.getByRole('dialog', { name: 'PQC Assistant' })
    await expect(panel).toBeVisible()
    await expect(page.getByText('PQC Assistant')).toBeVisible()

    // FAB should disappear when panel is open
    await expect(fab).not.toBeVisible()
  })

  test('Escape closes chat panel', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).last().click()
    await expect(page.getByRole('dialog', { name: 'PQC Assistant' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'PQC Assistant' })).not.toBeVisible()

    // FAB should reappear
    await expect(page.getByRole('button', { name: 'Open PQC Assistant' }).last()).toBeVisible()
  })

  test('close button closes chat panel', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      window.localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 1 })
      )
    })
    const fab = page.getByRole('button', { name: 'Open PQC Assistant' }).last()
    await expect(fab).toBeVisible({ timeout: 5000 })
    await fab.click()
    await expect(page.getByRole('dialog', { name: 'PQC Assistant' })).toBeVisible()

    await page.getByRole('button', { name: 'Close assistant' }).click()
    await expect(page.getByRole('dialog', { name: 'PQC Assistant' })).not.toBeVisible()
  })

  test('shows provider setup when no provider', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).last().click()

    // Should show provider setup with two cards
    await expect(page.getByRole('heading', { name: 'Choose Your AI Assistant' })).toBeVisible()
    await expect(page.getByText('Local (Private)')).toBeVisible()
    await expect(page.getByText('Gemini (Cloud)')).toBeVisible()
    await expect(page.getByPlaceholder('Paste your API key here')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save & Connect' })).toBeVisible()
  })

  test('API key validation — success flow', async ({ page }) => {
    // Mock Gemini validation endpoint
    await page.route('**/generativelanguage.googleapis.com/**', (route) => {
      route.fulfill({ status: 200, body: '{}' })
    })

    await page.goto('/')
    await page.evaluate(() => {
      window.localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '2.9.0' }, version: 1 })
      )
    })
    const fab = page.getByRole('button', { name: 'Open PQC Assistant' }).last()
    await expect(fab).toBeVisible({ timeout: 5000 })
    await fab.click()

    // Enter a key and submit
    await page.getByPlaceholder('Paste your API key here').fill('test-key-12345')
    await page.getByRole('button', { name: 'Save & Connect' }).click()

    // Success message appears
    await expect(page.getByText('Connected successfully!')).toBeVisible({ timeout: 5000 })

    // After connection, chat input should appear
    await expect(page.getByPlaceholder('Ask about PQC...')).toBeVisible({ timeout: 5000 })
  })

  test('API key validation — invalid key', async ({ page }) => {
    // Mock Gemini validation to reject
    await page.route('**/generativelanguage.googleapis.com/**', (route) => {
      route.fulfill({ status: 401, body: '{}' })
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).last().click()

    await page.getByPlaceholder('Paste your API key here').fill('bad-key')
    await page.getByRole('button', { name: 'Save & Connect' }).click()

    // Error message appears
    await expect(page.getByText('This API key is not valid')).toBeVisible({ timeout: 5000 })

    // Should still show the setup form (not the chat interface)
    await expect(page.getByPlaceholder('Paste your API key here')).toBeVisible()
  })

  test('shows suggested questions in empty state', async ({ page }) => {
    // Pre-seed API key so we skip setup
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'pqc-chat-storage',
        JSON.stringify({
          state: { apiKey: 'test-key', messages: [], model: 'gemini-2.5-flash' },
          version: 2,
        })
      )
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).last().click()

    // Suggested questions should be visible in empty state
    await expect(page.getByText('What is post-quantum cryptography?')).toBeVisible({
      timeout: 5000,
    })
  })

  test('send message and receive streaming response', async ({ page }) => {
    // Pre-seed API key
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'pqc-chat-storage',
        JSON.stringify({
          state: { apiKey: 'test-key', messages: [], model: 'gemini-2.5-flash' },
          version: 2,
        })
      )
    })

    // Mock Gemini streaming response
    await page.route('**/generativelanguage.googleapis.com/**', (route) => {
      const url = route.request().url()
      // Differentiate model listing (validation) vs stream
      if (url.includes('streamGenerateContent')) {
        route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: mockGeminiSSE(
            'ML-KEM is a lattice-based key encapsulation mechanism standardized in FIPS 203.'
          ),
        })
      } else {
        route.fulfill({ status: 200, body: '{}' })
      }
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).last().click()

    // Type and send a message
    const input = page.getByPlaceholder('Ask about PQC...')
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill('What is ML-KEM?')
    await page.getByRole('button', { name: 'Send message' }).click()

    // User message appears
    await expect(page.getByText('What is ML-KEM?')).toBeVisible()

    // Assistant response appears
    await expect(
      page.getByText('ML-KEM is a lattice-based key encapsulation mechanism')
    ).toBeVisible({
      timeout: 15000,
    })
  })

  test('clear conversation', async ({ page }) => {
    // Pre-seed with messages
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'pqc-chat-storage',
        JSON.stringify({
          state: {
            apiKey: 'test-key',
            messages: [
              { id: 'u1', role: 'user', content: 'Test message', timestamp: 1 },
              { id: 'a1', role: 'assistant', content: 'Test response', timestamp: 2 },
            ],
            model: 'gemini-2.5-flash',
          },
          version: 2,
        })
      )
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).last().click()

    // Verify messages are visible
    await expect(page.getByText('Test message').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Test response').first()).toBeVisible()

    // Clear messages — inline confirm requires two clicks
    await page.getByRole('button', { name: 'Clear conversation' }).click()
    await page.getByRole('button', { name: 'Confirm clear conversation' }).click()

    // Messages should be gone
    await expect(page.getByText('Test message')).not.toBeVisible()
    await expect(page.getByText('Test response')).not.toBeVisible()

    // Empty state should show suggested questions
    await expect(page.getByText('Ask me anything about post-quantum cryptography')).toBeVisible()
  })

  test('switch provider', async ({ page }) => {
    // Pre-seed API key (v2 store will be auto-migrated to v5 with provider: 'gemini')
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'pqc-chat-storage',
        JSON.stringify({
          state: { apiKey: 'test-key', messages: [], model: 'gemini-2.5-flash' },
          version: 2,
        })
      )
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).last().click()

    // Wait for chat input to appear (confirming provider is active)
    await expect(page.getByPlaceholder('Ask about PQC...')).toBeVisible({ timeout: 5000 })

    // Click switch provider button
    await page.getByRole('button', { name: 'Switch provider' }).click()

    // Should return to provider setup
    await expect(page.getByRole('heading', { name: 'Choose Your AI Assistant' })).toBeVisible()
  })

  test('Enter key sends message', async ({ page }) => {
    // Pre-seed API key
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'pqc-chat-storage',
        JSON.stringify({
          state: { apiKey: 'test-key', messages: [], model: 'gemini-2.5-flash' },
          version: 2,
        })
      )
    })

    // Mock streaming endpoint
    await page.route('**/generativelanguage.googleapis.com/**', (route) => {
      const url = route.request().url()
      if (url.includes('streamGenerateContent')) {
        route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: mockGeminiSSE('Response to enter key test.'),
        })
      } else {
        route.fulfill({ status: 200, body: '{}' })
      }
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).last().click()

    const input = page.getByPlaceholder('Ask about PQC...')
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill('Testing enter key')
    await input.press('Enter')

    // User message should appear
    await expect(page.getByText('Testing enter key').first()).toBeVisible()
  })

  test('page context shows in header', async ({ page }) => {
    // Pre-seed API key
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'pqc-chat-storage',
        JSON.stringify({
          state: { apiKey: 'test-key', messages: [], model: 'gemini-2.5-flash' },
          version: 2,
        })
      )
    })

    await page.goto('/algorithms')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).last().click()

    // Page context should appear in header
    await expect(page.getByText('— Algorithms')).toBeVisible({ timeout: 5000 })
  })
})
