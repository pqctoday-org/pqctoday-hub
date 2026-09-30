// @vitest-environment node
// SPDX-License-Identifier: GPL-3.0-only
/**
 * Exercise the production retrieval, prompt, citation, grounding, and deep-link
 * pipeline against a native MLX OpenAI-compatible server. No browser/WebGPU.
 *
 * Usage:
 *   MLX_MODEL=Qwen3-8B MLX_BASE_URL=http://127.0.0.1:8081 npm run evaluate:mlx-harness
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { performance } from 'node:perf_hooks'
import { expect, test } from 'vitest'
import type { RAGChunk } from '../../../types/ChatTypes'
import { RetrievalService } from '../RetrievalService'
import { buildLocalSystemPrompt } from '../promptBuilder'
import { parseCitations } from '../parseCitations'
import { parseFollowUps } from '../parseFollowUps'
import { finalizeGroundedResponse } from '../responseFinalization'
import { selectLocalPromptChunks } from '../WebLLMService'
import {
  CURRENT_CORPUS_BASELINE,
  CURRENT_CORPUS_GOLDEN_QUESTIONS,
} from './currentCorpusGoldenQuestions'

interface CorpusFile {
  generatedAt?: string
  chunks: RAGChunk[]
}

interface MlxResponse {
  choices?: Array<{
    message?: { content?: string }
    finish_reason?: string
  }>
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
}

interface HarnessResult {
  questionId: string
  query: string
  retrievalMs: number
  generationMs: number
  totalMs: number
  finishReason: string | null
  usage: MlxResponse['usage'] | null
  sourceCount: number
  sourceIds: string[]
  sourceDeepLinks: Array<string | undefined>
  raw: string
  final: string
  groundingMode: ReturnType<typeof finalizeGroundedResponse>['mode']
  groundingReasons: ReturnType<typeof finalizeGroundedResponse>['decision']['reasons']
  citationCount: number
  thinkingLeak: boolean
  refused: boolean
  termRecall: number
  matchedTerms: string[]
  lexicalRetrievalRecall: number
  lexicalRetrievalHits: string[]
  semanticRetrievalRecall: number
  semanticRetrievalHits: string[]
}

function arg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? fallback : process.argv[index + 1]
}

function stripThinking(value: string): string {
  return value
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/i, '')
    .trim()
}

function isRefusal(value: string): boolean {
  const normalized = value.toLowerCase()
  return [
    "couldn't produce a fully source-verified answer",
    "don't have enough information",
    "don't have a sufficiently authoritative source",
    'no scored source resolved',
  ].some((marker) => normalized.includes(marker))
}

const model = process.env.MLX_MODEL ?? arg('model')
if (!model) throw new Error('Missing required --model label')
const apiModel = process.env.MLX_API_MODEL ?? model
const baseUrl = (
  process.env.MLX_BASE_URL ??
  arg('base-url', 'http://127.0.0.1:8081') ??
  ''
).replace(/\/$/, '')
const output =
  process.env.MLX_OUTPUT ??
  arg('output', `test-results/mlx-${model.replace(/[^a-z0-9.-]+/gi, '-')}.json`)!
const maxTokens = Number(process.env.MLX_MAX_TOKENS ?? arg('max-tokens', '512'))
const contextWindow = Number(process.env.MLX_CONTEXT_WINDOW ?? arg('context-window', '4096'))
const questionFilter = new Set(
  (process.env.MLX_QUESTIONS ?? arg('questions', '') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
)
const questions =
  questionFilter.size === 0
    ? CURRENT_CORPUS_GOLDEN_QUESTIONS
    : CURRENT_CORPUS_GOLDEN_QUESTIONS.filter((question) => questionFilter.has(question.id))
if (questions.length === 0) throw new Error('No golden questions matched --questions')

const corpusPath = path.resolve('public/data/rag-corpus.json')
const corpus = JSON.parse(await readFile(corpusPath, 'utf8')) as CorpusFile
const retrieval = new RetrievalService()
retrieval.initializeWithCorpus(corpus.chunks)

// Make the browser-oriented embedding runtime read the committed artifacts
// from disk while preserving normal HTTP fetches for its encoder model and MLX.
const nativeFetch = globalThis.fetch.bind(globalThis)
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (url.startsWith('/data/')) {
    // Local-only evaluator; the prefix is fixed and the remaining filename is
    // produced by the app's embedding runtime, not arbitrary web input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const bytes = await readFile(path.resolve('public', url.slice(1)))
    return new Response(bytes, { status: 200 })
  }
  return nativeFetch(input, init)
}

const results: HarnessResult[] = []
for (const question of questions) {
  const retrievalStart = performance.now()
  const chunks = await retrieval.searchWithEmbeddingFallback(question.query)
  const retrievalMs = performance.now() - retrievalStart

  const totalChars = contextWindow * 4
  const ragCharBudget = Math.round(totalChars * 0.45)
  const maxInventory = Math.min(25, Math.max(8, Math.floor(contextWindow / 400)))
  const promptChunks = selectLocalPromptChunks(chunks, question.query)
  const systemPrompt = `/no_think\n${buildLocalSystemPrompt(
    promptChunks,
    undefined,
    ragCharBudget,
    maxInventory
  )}`

  const generationStart = performance.now()
  const response = await nativeFetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: apiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `/no_think\n${question.query}` },
      ],
      temperature: 0,
      max_tokens: maxTokens,
      stream: false,
    }),
  })
  if (!response.ok) {
    throw new Error(`MLX request failed (${response.status}): ${await response.text()}`)
  }
  const payload = (await response.json()) as MlxResponse
  const generationMs = performance.now() - generationStart
  const raw = payload.choices?.[0]?.message?.content ?? ''
  const visibleRaw = stripThinking(raw)
  const { cleanContent: afterCitations, citations } = parseCitations(visibleRaw)
  const { cleanContent } = parseFollowUps(afterCitations)
  const finalized = finalizeGroundedResponse(cleanContent, citations, chunks)
  const normalizedFinal = finalized.content.toLowerCase()
  const matchedTerms = question.answerTerms.filter((term) =>
    normalizedFinal.includes(term.toLowerCase())
  )
  const lexicalRetrievalHits = question.mustInclude.filter((prefix) =>
    chunks.some((chunk) => chunk.id.startsWith(prefix))
  )
  const semanticRetrievalHits = question.semanticMustInclude.filter((prefix) =>
    chunks.some((chunk) => chunk.id.startsWith(prefix))
  )
  const refused = isRefusal(finalized.content)

  const result = {
    questionId: question.id,
    query: question.query,
    retrievalMs: Math.round(retrievalMs),
    generationMs: Math.round(generationMs),
    totalMs: Math.round(retrievalMs + generationMs),
    finishReason: payload.choices?.[0]?.finish_reason ?? null,
    usage: payload.usage ?? null,
    sourceCount: chunks.length,
    sourceIds: chunks.map((chunk) => chunk.id),
    sourceDeepLinks: chunks.map((chunk) => chunk.deepLink).filter(Boolean),
    raw,
    final: finalized.content,
    groundingMode: finalized.mode,
    groundingReasons: finalized.decision.reasons,
    citationCount: citations.length,
    thinkingLeak: /<\/?think>/i.test(raw),
    refused,
    termRecall: refused ? 0 : matchedTerms.length / question.answerTerms.length,
    matchedTerms: refused ? [] : matchedTerms,
    lexicalRetrievalRecall: lexicalRetrievalHits.length / question.mustInclude.length,
    lexicalRetrievalHits,
    semanticRetrievalRecall: semanticRetrievalHits.length / question.semanticMustInclude.length,
    semanticRetrievalHits,
  }
  results.push(result)
  process.stdout.write(
    `${question.id}: ${result.groundingMode}, recall=${result.termRecall.toFixed(2)}, ` +
      `${result.totalMs}ms, ${result.citationCount} citations\n`
  )
}

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
const report = {
  model,
  apiModel,
  endpoint: baseUrl,
  generatedAt: new Date().toISOString(),
  corpusGeneratedAt: corpus.generatedAt ?? null,
  corpusChunkCount: corpus.chunks.length,
  expectedCorpusBaseline: CURRENT_CORPUS_BASELINE,
  contextWindow,
  maxTokens,
  questionCount: results.length,
  verifiedRate:
    results.filter((result) => result.groundingMode === 'verified').length / results.length,
  evidenceBackedAnswerRate:
    results.filter(
      (result) => result.groundingMode === 'verified' || result.groundingMode === 'salvaged'
    ).length / results.length,
  usefulAnswerRate:
    results.filter((result) => result.groundingMode !== 'extractive' && !result.refused).length /
    results.length,
  thinkingLeakRate: results.filter((result) => result.thinkingLeak).length / results.length,
  meanTermRecall: mean(results.map((result) => result.termRecall)),
  meanLexicalRetrievalRecall: mean(results.map((result) => result.lexicalRetrievalRecall)),
  meanSemanticRetrievalRecall: mean(results.map((result) => result.semanticRetrievalRecall)),
  meanRetrievalMs: Math.round(mean(results.map((result) => result.retrievalMs))),
  meanGenerationMs: Math.round(mean(results.map((result) => result.generationMs))),
  meanTotalMs: Math.round(mean(results.map((result) => result.totalMs))),
  results,
}

// Local operator-selected report path; never exposed to application input.
// eslint-disable-next-line security/detect-non-literal-fs-filename
await mkdir(path.dirname(path.resolve(output)), { recursive: true })
// eslint-disable-next-line security/detect-non-literal-fs-filename
await writeFile(path.resolve(output), `${JSON.stringify(report, null, 2)}\n`)
process.stdout.write(`\nReport: ${path.resolve(output)}\n`)
process.stdout.write(`${JSON.stringify({ ...report, results: undefined }, null, 2)}\n`)

test(
  `native MLX harness completed for ${model}`,
  () => {
    expect(results).toHaveLength(questions.length)
  },
  30 * 60_000
)
