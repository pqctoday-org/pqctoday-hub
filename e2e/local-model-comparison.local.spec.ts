// SPDX-License-Identifier: AGPL-3.0-only
import type { Page } from '@playwright/test'
import { test, expect } from './fixtures/blockAnalytics'
import {
  enableModelAssistantFallback,
  openModelAssistant,
  runModelAssistantQuestion,
} from './fixtures/modelAssistantFallback'
import { writeFile } from 'node:fs/promises'
import {
  CURRENT_CORPUS_GOLDEN_QUESTIONS,
  CURRENT_CORPUS_BASELINE,
  type CurrentCorpusGoldenQuestion,
} from '../src/services/chat/evaluation/currentCorpusGoldenQuestions'

const ENABLED = process.env.RUN_LOCAL_MODEL_COMPARISON === '1'
const MODELS = ['Qwen3-8B-q4f16_1-MLC', 'Qwen3.5-9B-q4f16_1-MLC'] as const
const MODEL_FILTER = process.env.LOCAL_MODEL_FILTER
const SELECTED_MODELS = MODEL_FILTER ? MODELS.filter((model) => model === MODEL_FILTER) : MODELS
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

function seededChatState(model: string) {
  return JSON.stringify({
    state: {
      provider: 'local',
      apiKey: null,
      localModel: model,
      localContextWindow: 4096,
      conversations: [
        {
          id: `eval-${model}`,
          title: 'Local model evaluation',
          messages: [],
          createdAt: 0,
          updatedAt: 0,
        },
      ],
      model: 'gemini-3.8-flash',
      activeConversationId: `eval-${model}`,
      messages: [],
    },
    version: 13,
  })
}

async function runQuestion(page: Page, question: CurrentCorpusGoldenQuestion) {
  const startedAt = Date.now()
  const { answer, error } = await runModelAssistantQuestion(page, question.query, 10 * 60_000)
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
    error,
  }
}

test.describe('Qwen 3 vs Qwen 3.5 grounded local-model comparison', () => {
  test.describe.configure({ mode: 'serial', retries: 0 })
  test.skip(!ENABLED, 'Set RUN_LOCAL_MODEL_COMPARISON=1 to download and benchmark both models.')
  test.skip(
    SELECTED_MODELS.length === 0,
    `LOCAL_MODEL_FILTER must be one of: ${MODELS.join(', ')}.`
  )
  test.setTimeout(45 * 60_000)

  for (const model of SELECTED_MODELS) {
    test(`${model} on the current-corpus golden subset`, async ({ page }, testInfo) => {
      await enableModelAssistantFallback(page)
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
        { storage: seededChatState(model) }
      )

      await page.goto('/timeline')
      await openModelAssistant(page)

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

      // This is a measurement suite, but a model that never passes the shared
      // corpus-evidence gate is not a viable option.
      expect(report.verifiedAnswerRate).toBeGreaterThan(0)
    })
  }
})
