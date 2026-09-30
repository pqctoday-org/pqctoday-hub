// SPDX-License-Identifier: GPL-3.0-only
import { test, expect, type Page } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { loadEnv } from 'vite'
import {
  CURRENT_CORPUS_GOLDEN_QUESTIONS,
  CURRENT_CORPUS_BASELINE,
  type CurrentCorpusGoldenQuestion,
} from '../src/services/chat/evaluation/currentCorpusGoldenQuestions'

// Playwright does not load Vite environment files by itself. Read the
// git-ignored .env.local for this local-only benchmark without exposing the
// credential to browser code or test output.
const LOCAL_ENV = loadEnv('development', process.cwd(), '')
const API_KEY = process.env.GEMINI_API_KEY ?? LOCAL_ENV.GEMINI_API_KEY ?? ''
const MODELS = ['gemini-2.5-flash', 'gemini-3.8-flash'] as const
const QUESTION_IDS = new Set([
  'rfc-9881-ml-dsa-x509',
  'fips-206-status',
  'anssi-cnsa-hybrid-disagreement',
  'uae-pqc-index',
  'ml-kem-implementation-attacks',
])
const QUESTIONS = CURRENT_CORPUS_GOLDEN_QUESTIONS.filter((q) => QUESTION_IDS.has(q.id))

function isGroundingRefusal(normalizedAnswer: string): boolean {
  return [
    "couldn't produce a fully source-verified answer",
    "don't have enough information",
    "don't have a sufficiently authoritative source",
    'no scored source resolved',
  ].some((marker) => normalizedAnswer.includes(marker))
}

interface E2eMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

interface E2eChatState {
  messages: E2eMessage[]
  isLoading: boolean
  isStreaming: boolean
  error: string | null
}

type E2eWindow = Window & {
  // eslint-disable-next-line no-unused-vars
  __e2e_toggle_panel?: (_panel?: string) => void
  // eslint-disable-next-line no-unused-vars
  __e2e_chat_send?: (_query: string) => void
  __e2e_chat_store?: { getState: () => E2eChatState }
}

function seededChatState(model: string, apiKey: string) {
  return JSON.stringify({
    state: {
      provider: 'gemini',
      apiKey,
      localModel: 'Qwen3.5-9B-q4f16_1-MLC',
      localContextWindow: 4096,
      conversations: [
        {
          id: `eval-${model}`,
          title: 'Cloud model evaluation',
          messages: [],
          createdAt: 0,
          updatedAt: 0,
        },
      ],
      model,
      activeConversationId: `eval-${model}`,
      messages: [],
    },
    version: 13,
  })
}

async function runQuestion(page: Page, question: CurrentCorpusGoldenQuestion) {
  const before = await page.evaluate(
    () => (window as unknown as E2eWindow).__e2e_chat_store?.getState().messages.length ?? 0
  )
  const startedAt = Date.now()
  await page.evaluate((query: string) => {
    ;(window as unknown as E2eWindow).__e2e_chat_send?.(query)
  }, question.query)
  await page.waitForFunction(
    ({ previousCount }) => {
      const state = (window as unknown as E2eWindow).__e2e_chat_store?.getState()
      return Boolean(
        state &&
        !state.isLoading &&
        !state.isStreaming &&
        (state.messages.length >= previousCount + 2 || state.error)
      )
    },
    { previousCount: before },
    { timeout: 3 * 60_000 }
  )
  const state = await page.evaluate(() =>
    (window as unknown as E2eWindow).__e2e_chat_store!.getState()
  )
  const answer = [...state.messages].reverse().find((message) => message.role === 'assistant')
  const text = answer?.content ?? ''
  const normalized = text.toLowerCase()
  const matchedTerms = question.answerTerms.filter((term) =>
    normalized.includes(term.toLowerCase())
  )
  const refused = isGroundingRefusal(normalized)
  return {
    questionId: question.id,
    query: question.query,
    latencyMs: Date.now() - startedAt,
    answer: text,
    sourceCount: answer?.sources?.length ?? 0,
    termRecall: refused ? 0 : matchedTerms.length / question.answerTerms.length,
    matchedTerms: refused ? [] : matchedTerms,
    verifiedAnswer: text.length > 0 && !refused,
    refused,
    error: state.error,
  }
}

test.describe('Gemini 2.5 Flash vs 3.8 Flash grounded comparison', () => {
  test.skip(!API_KEY, 'Set GEMINI_API_KEY to benchmark both cloud models.')
  test.use({ serviceWorkers: 'block' })
  test.setTimeout(20 * 60_000)

  for (const model of MODELS) {
    test(`${model} on the current-corpus golden subset`, async ({ page }, testInfo) => {
      await page.addInitScript(
        ({ storage }) => {
          localStorage.setItem('pqc-chat-storage', storage)
          localStorage.setItem(
            'pqc-right-panel',
            JSON.stringify({ state: { activeTab: 'chat' }, version: 5 })
          )
          localStorage.setItem(
            'pqc-version-storage',
            JSON.stringify({ state: { lastSeenVersion: '99.99.99' }, version: 0 })
          )
        },
        { storage: seededChatState(model, API_KEY) }
      )

      await page.goto('/timeline')
      await page.waitForFunction(
        () => typeof (window as unknown as E2eWindow).__e2e_toggle_panel === 'function'
      )
      await page.evaluate(() => (window as unknown as E2eWindow).__e2e_toggle_panel?.('chat'))
      await page.waitForFunction(
        () => typeof (window as unknown as E2eWindow).__e2e_chat_send === 'function'
      )

      const results = []
      for (const question of QUESTIONS) results.push(await runQuestion(page, question))

      const report = {
        model,
        corpusBaseline: `${CURRENT_CORPUS_BASELINE.generatedDate} / ${CURRENT_CORPUS_BASELINE.minimumChunkCount}+ chunks`,
        generatedAt: new Date().toISOString(),
        verifiedAnswerRate:
          results.filter((result) => result.verifiedAnswer).length / results.length,
        meanTermRecall:
          results.reduce((sum, result) => sum + result.termRecall, 0) / results.length,
        meanLatencyMs: results.reduce((sum, result) => sum + result.latencyMs, 0) / results.length,
        results,
      }
      await writeFile(testInfo.outputPath(`${model}-report.json`), JSON.stringify(report, null, 2))
      await testInfo.attach('comparison-report', {
        body: JSON.stringify(report, null, 2),
        contentType: 'application/json',
      })

      expect(results.every((result) => result.error === null)).toBe(true)
      expect(report.verifiedAnswerRate).toBeGreaterThan(0)
    })
  }
})
