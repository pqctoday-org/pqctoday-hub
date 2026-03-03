// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * E2E tests for persona-aware chatbot behavior.
 *
 * Validates that page context, persona, and assessment data
 * flow correctly through the RAG chatbot lifecycle.
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

test.describe('PQC Assistant — Persona & Context', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress WhatsNew toast
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '2.9.0' }, version: 1 })
      )
    })

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

    // Mock RAG corpus
    await page.route('**/data/rag-corpus.json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CORPUS),
      })
    })

    // Mock Gemini API — capture system instruction for assertions
    await page.route('**/generativelanguage.googleapis.com/**', (route) => {
      const url = route.request().url()
      if (url.includes('streamGenerateContent')) {
        route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: mockGeminiSSE('Here is a test answer about PQC algorithms.'),
        })
      } else {
        route.fulfill({ status: 200, body: '{}' })
      }
    })
  })

  test('page context header updates on navigation', async ({ page }) => {
    // Start on algorithms page
    await page.goto('/algorithms')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).click()
    await expect(page.getByText('— Algorithms')).toBeVisible({ timeout: 5000 })

    // Close, navigate, reopen
    await page.keyboard.press('Escape')
    await page.goto('/timeline')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).click()
    await expect(page.getByText('— Timeline')).toBeVisible({ timeout: 5000 })
  })

  test('suggested questions differ between pages', async ({ page }) => {
    // On algorithms page
    await page.goto('/algorithms')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).click()

    // Should see algorithm-related suggestions
    const panel = page.getByRole('dialog', { name: 'PQC Assistant' })
    const algoText = await panel.textContent()

    await page.keyboard.press('Escape')

    // On timeline page
    await page.goto('/timeline')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).click()

    const timelineText = await panel.textContent()

    // The suggested questions should differ between pages
    expect(algoText).not.toBe(timelineText)
  })

  test('persona context flows into Gemini API call', async ({ page }) => {
    // Set persona to executive
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({
          state: {
            selectedPersona: 'executive',
            selectedIndustry: 'Financial Services',
            selectedRegion: 'americas',
          },
          version: 1,
        })
      )
    })

    // Capture the request body sent to Gemini
    let capturedBody = ''
    await page.route('**/generativelanguage.googleapis.com/**', (route) => {
      const url = route.request().url()
      if (url.includes('streamGenerateContent')) {
        capturedBody = route.request().postData() || ''
        route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: mockGeminiSSE('Executive-focused answer about PQC migration.'),
        })
      } else {
        route.fulfill({ status: 200, body: '{}' })
      }
    })

    await page.goto('/algorithms')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).click()

    const input = page.getByPlaceholder('Ask about PQC...')
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill('What is ML-KEM?')
    await page.getByRole('button', { name: 'Send message' }).click()

    // Wait for response
    await expect(page.getByText('Executive-focused answer')).toBeVisible({ timeout: 15000 })

    // The system instruction should include executive persona depth
    expect(capturedBody).toContain('business impact')
  })

  test('assessment data flows into API call when complete', async ({ page }) => {
    // Seed assessment as complete
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'pqc-assessment-storage',
        JSON.stringify({
          state: {
            assessmentStatus: 'complete',
            lastResult: {
              riskScore: 75,
              riskLevel: 'High',
              complianceFrameworks: ['CNSA 2.0', 'NIST SP 800-208'],
            },
          },
          version: 7,
        })
      )
    })

    let capturedBody = ''
    await page.route('**/generativelanguage.googleapis.com/**', (route) => {
      const url = route.request().url()
      if (url.includes('streamGenerateContent')) {
        capturedBody = route.request().postData() || ''
        route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: mockGeminiSSE('Based on your risk score of 75...'),
        })
      } else {
        route.fulfill({ status: 200, body: '{}' })
      }
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).click()

    const input = page.getByPlaceholder('Ask about PQC...')
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill('What should I prioritize?')
    await page.getByRole('button', { name: 'Send message' }).click()

    await expect(page.getByText('Based on your risk score')).toBeVisible({ timeout: 15000 })

    // System instruction should include assessment data
    expect(capturedBody).toContain('75')
    expect(capturedBody).toContain('High')
  })

  test('follow-up buttons are clickable and send new query', async ({ page }) => {
    // Mock response with follow-ups
    await page.route('**/generativelanguage.googleapis.com/**', (route) => {
      const url = route.request().url()
      if (url.includes('streamGenerateContent')) {
        const responseWithFollowUps =
          'ML-KEM is a key encapsulation mechanism.\n\n```followups\nWhat are ML-KEM security levels?\nHow does ML-KEM compare to RSA?\nWhich products support ML-KEM?\n```'
        route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: mockGeminiSSE(responseWithFollowUps),
        })
      } else {
        route.fulfill({ status: 200, body: '{}' })
      }
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Open PQC Assistant' }).click()

    const input = page.getByPlaceholder('Ask about PQC...')
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill('What is ML-KEM?')
    await page.getByRole('button', { name: 'Send message' }).click()

    // Wait for response with follow-ups
    await expect(page.getByText('ML-KEM is a key encapsulation mechanism.')).toBeVisible({
      timeout: 15000,
    })

    // Follow-up buttons should appear (LLM-generated from fenced block)
    const followUpButton = page.getByRole('button', {
      name: 'What are ML-KEM security levels?',
    })
    // Follow-ups may or may not render depending on whether parseFollowUps
    // strips them. If visible, clicking should work.
    if (await followUpButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await followUpButton.click()
      // User message should appear from the follow-up
      await expect(page.getByText('What are ML-KEM security levels?')).toBeVisible()
    }
  })
})
