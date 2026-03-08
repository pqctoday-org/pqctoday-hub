// SPDX-License-Identifier: GPL-3.0-only
/**
 * RAG × Q&A Accuracy Test Harness
 *
 * Loads public/data/rag-corpus.json, indexes it with the same MiniSearch
 * config used by RetrievalService, then runs representative questions from
 * the Q&A test suite (scripts/rag-test-cases.json) and checks:
 *
 *   Phase 1: Corpus deep link audit — validate every deepLink in the corpus.
 *   Phase 2: Retrieval accuracy — do the top-N results contain chunks with
 *            the expected key terms / entities?
 *   Phase 3: Summary
 *   Phase 4: Source coverage analysis
 *
 *   --phase2 flag: LLM Response Quality scoring (requires GEMINI_API_KEY env var)
 *            Generates an answer via Gemini Flash using the same RAG context
 *            as production, then scores it against a 10-point rubric:
 *              - Required key points covered (0–4)
 *              - Deep link to expected route (0–2)
 *              - No forbidden claims (0–2, programmatic heuristic)
 *              - Groundedness (0–2, programmatic heuristic)
 *
 * Usage:
 *   npx tsx scripts/test-rag-qanda.ts              # Phase 1–4 only (offline)
 *   npx tsx scripts/test-rag-qanda.ts --phase2     # + LLM quality scoring
 *   TEST_PHASE2=1 GEMINI_API_KEY=... npx tsx scripts/test-rag-qanda.ts
 */
import fs from 'fs'
import path from 'path'
import MiniSearch from 'minisearch'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RAGChunk {
  id: string
  source: string
  title: string
  content: string
  category: string
  metadata: Record<string, string>
  deepLink?: string
}

interface Corpus {
  generatedAt: string
  chunkCount: number
  chunks: RAGChunk[]
}

interface TestCase {
  id: string
  section: string
  sectionUrl: string
  question: string
  /** Key terms that MUST appear in at least one top-N chunk's title or content */
  expectedTerms: string[]
  /** Expected deep link pattern prefix (route path) */
  expectedDeepLinkRoute?: string
  tags: string[]
  /** Key points the LLM answer should cover (used in Phase 2 scoring) */
  expectedAnswerKeyPoints: string[]
}

interface TestCasesFile {
  version: string
  generatedFrom: string[]
  passThreshold: {
    phase1MinScore: number
    phase2MinScore: number
    phase2AggregateMin: number
  }
  testCases: TestCase[]
}

interface LLMScore {
  id: string
  question: string
  score: number // 0–10
  breakdown: {
    keyPoints: number // 0–4
    deepLink: number // 0–2
    noForbiddenClaims: number // 0–2
    groundedness: number // 0–2
  }
  issues: string[]
  passed: boolean
}

// ---------------------------------------------------------------------------
// Valid routes for deep-link validation
// ---------------------------------------------------------------------------
const VALID_ROUTES = [
  '/algorithms',
  '/timeline',
  '/library',
  '/threats',
  '/compliance',
  '/migrate',
  '/assess',
  '/playground',
  '/openssl',
  '/leaders',
  '/learn/',
  '/learn/quiz',
  '/report',
  '/about',
  '/',
]

const VALID_QUERY_PARAMS: Record<string, string[]> = {
  '/algorithms': ['highlight'],
  '/timeline': ['country'],
  '/library': ['ref', 'q'],
  '/threats': ['industry', 'id'],
  '/compliance': ['q', 'cert'],
  '/migrate': ['q', 'industry', 'layer'],
  '/assess': ['step'],
  '/playground': ['algo'],
  '/openssl': ['cmd'],
  '/leaders': ['leader', 'sector'],
  '/learn/': ['tab', 'step', 'category'],
  '/learn/quiz': ['category'],
}

function isValidDeepLink(link: string): { valid: boolean; reason?: string } {
  try {
    // Parse the link — it's a relative URL
    const url = new URL(link, 'http://localhost')
    const pathname = url.pathname

    // Check route
    const matchedRoute = VALID_ROUTES.find(
      (r) => pathname === r || (r.endsWith('/') && pathname.startsWith(r))
    )
    if (!matchedRoute) {
      return { valid: false, reason: `Unknown route: ${pathname}` }
    }

    // Check query params
    const params = url.searchParams
    if (params.toString()) {
      const routeKey =
        Object.keys(VALID_QUERY_PARAMS).find(
          (r) => pathname === r || (r.endsWith('/') && pathname.startsWith(r))
        ) ?? pathname
      // eslint-disable-next-line security/detect-object-injection
      const allowedParams = VALID_QUERY_PARAMS[routeKey] ?? []
      for (const [key] of params) {
        if (!allowedParams.includes(key)) {
          return { valid: false, reason: `Unknown param ?${key} for route ${pathname}` }
        }
      }
    }

    return { valid: true }
  } catch {
    return { valid: false, reason: `Malformed URL: ${link}` }
  }
}

// ---------------------------------------------------------------------------
// Load test cases from JSON (single source of truth)
// ---------------------------------------------------------------------------
function loadTestCases(): TestCase[] {
  const jsonPath = path.join(process.cwd(), 'scripts', 'rag-test-cases.json')
  if (!fs.existsSync(jsonPath)) {
    console.error('ERROR: scripts/rag-test-cases.json not found.')
    process.exit(1)
  }
  const data: TestCasesFile = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  console.log(
    `  Loaded ${data.testCases.length} test cases from rag-test-cases.json (v${data.version})\n`
  )
  return data.testCases
}

// ---------------------------------------------------------------------------
// Phase 2 (LLM): Gemini-based response quality scoring
// ---------------------------------------------------------------------------
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const EVAL_MODEL = 'gemini-2.5-flash'
const LLM_PASS_THRESHOLD = 7
const LLM_AGGREGATE_PASS = 0.8
const RATE_LIMIT_DELAY_MS = 300 // polite delay between API calls

function buildContextBlocks(chunks: RAGChunk[]): string {
  return chunks
    .slice(0, 15)
    .map((c) => {
      const header = `--- Source: ${c.source} | ${c.title} ---`
      const deepLinkLine = c.deepLink ? `Deep Link: ${c.deepLink}` : ''
      return [header, deepLinkLine, c.content, '---'].filter(Boolean).join('\n')
    })
    .join('\n\n')
}

function buildEvalSystemPrompt(contextBlocks: string): string {
  return `You are PQC Today Assistant, an expert in post-quantum cryptography (PQC). Answer questions based ONLY on the provided context from the PQC Today database. When referencing learning modules, algorithms, or standards, include their deep link URLs from the context (format: /learn/module-id?tab=learn or /algorithms?highlight=slug etc.).

CONTEXT FROM PQC TODAY DATABASE:
${contextBlocks}`
}

async function generateAnswer(
  question: string,
  contextBlocks: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(`${GEMINI_BASE}/${EVAL_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildEvalSystemPrompt(contextBlocks) }] },
      contents: [{ role: 'user', parts: [{ text: question }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    }),
  })

  if (!response.ok) {
    const status = response.status
    if (status === 429) throw new Error('Rate limit — back off')
    throw new Error(`Gemini API error: ${status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

function scoreAnswer(tc: TestCase, answer: string, chunks: RAGChunk[]): LLMScore {
  const answerLower = answer.toLowerCase()
  const issues: string[] = []

  // Criterion 1: Key points (0–4)
  const coveredPoints = tc.expectedAnswerKeyPoints.filter((kp) =>
    answerLower.includes(kp.toLowerCase())
  )
  const keyPoints = Math.min(4, coveredPoints.length)
  if (keyPoints < 4) {
    const missed = tc.expectedAnswerKeyPoints.filter(
      (kp) => !answerLower.includes(kp.toLowerCase())
    )
    issues.push(`Missing key points: ${missed.slice(0, 3).join(', ')}`)
  }

  // Criterion 2: Deep link to expected route (0–2)
  let deepLink = 0
  if (tc.expectedDeepLinkRoute) {
    if (answer.includes(tc.expectedDeepLinkRoute)) {
      deepLink = 2
    } else if (
      answer.includes('/learn/') ||
      answer.includes('/algorithms') ||
      answer.includes('/library')
    ) {
      deepLink = 1
      issues.push(`Expected deep link to ${tc.expectedDeepLinkRoute} — only generic link found`)
    } else {
      deepLink = 0
      issues.push(`No deep link to ${tc.expectedDeepLinkRoute}`)
    }
  } else {
    // No expected route — give credit if any link is present
    deepLink = answer.includes('](/') ? 2 : 1
  }

  // Criterion 3: No forbidden claims (0–2) — heuristic
  const isTooLong = answer.length > 3000 // overly verbose = more hallucination risk
  let noForbiddenClaims = 2
  if (isTooLong) {
    noForbiddenClaims = 1
    issues.push('Response is unusually long (>3000 chars) — potential padding/fabrication')
  }
  // Check for common hallucination red flags
  const redFlags = ['according to wikipedia', 'as of 2024', 'as of 2025', 'i should note that']
  if (redFlags.some((f) => answerLower.includes(f))) {
    noForbiddenClaims = 0
    issues.push('Potential hallucination red flags detected')
  }

  // Criterion 4: Groundedness (0–2) — check if answer references source material
  // Source titles from top chunks should appear or paraphrase in the answer
  const sourceTerms = chunks
    .slice(0, 5)
    .flatMap((c) =>
      c.title
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 5)
    )
    .slice(0, 20)
  const groundednessHits = sourceTerms.filter((t) => answerLower.includes(t)).length
  const groundedness = groundednessHits >= 5 ? 2 : groundednessHits >= 2 ? 1 : 0
  if (groundedness < 2) {
    issues.push(`Low groundedness — few source terms found in answer (${groundednessHits} hits)`)
  }

  const score = keyPoints + deepLink + noForbiddenClaims + groundedness

  return {
    id: tc.id,
    question: tc.question,
    score,
    breakdown: { keyPoints, deepLink, noForbiddenClaims, groundedness },
    issues,
    passed: score >= LLM_PASS_THRESHOLD,
  }
}

async function runLLMPhase(TEST_CASES: TestCase[], index: MiniSearch<RAGChunk>, apiKey: string) {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  LLM PHASE: Response Quality Scoring (Gemini Flash)')
  console.log(
    `  Model: ${EVAL_MODEL}  |  Pass threshold: ${LLM_PASS_THRESHOLD}/10  |  Aggregate: ≥${LLM_AGGREGATE_PASS * 100}%`
  )
  console.log('═══════════════════════════════════════════════════════════════\n')

  const scores: LLMScore[] = []
  let processed = 0

  for (const tc of TEST_CASES) {
    processed++
    process.stdout.write(`  [${String(processed).padStart(3)}/${TEST_CASES.length}] ${tc.id} ...`)

    try {
      const chunks = index.search(tc.question, { limit: 15 }) as unknown as RAGChunk[]
      const contextBlocks = buildContextBlocks(chunks)
      const answer = await generateAnswer(tc.question, contextBlocks, apiKey)
      const llmScore = scoreAnswer(tc, answer, chunks)
      scores.push(llmScore)

      const status = llmScore.passed ? '✅' : '❌'
      process.stdout.write(` ${status} ${llmScore.score}/10\n`)
      if (llmScore.issues.length > 0 && !llmScore.passed) {
        for (const issue of llmScore.issues.slice(0, 2)) {
          console.log(`         ↳ ${issue}`)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stdout.write(` ⚠️  ERROR: ${msg}\n`)
      scores.push({
        id: tc.id,
        question: tc.question,
        score: 0,
        breakdown: { keyPoints: 0, deepLink: 0, noForbiddenClaims: 0, groundedness: 0 },
        issues: [`API error: ${msg}`],
        passed: false,
      })
    }

    // Rate-limit delay
    if (processed < TEST_CASES.length) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS))
    }
  }

  // LLM Phase Summary
  const passed = scores.filter((s) => s.passed).length
  const aggRate = scores.length > 0 ? passed / scores.length : 0
  const avgScore =
    scores.length > 0
      ? (scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(1)
      : '0.0'
  const aggOk = aggRate >= LLM_AGGREGATE_PASS

  console.log(`\n  LLM Phase Results:`)
  console.log(
    `    Passed:     ${passed}/${scores.length} questions (${(aggRate * 100).toFixed(1)}%) ${aggOk ? '✅' : '❌'}`
  )
  console.log(`    Avg score:  ${avgScore}/10`)

  // Per-criterion breakdown
  const totalKeyPoints = scores.reduce((s, r) => s + r.breakdown.keyPoints, 0)
  const totalDeepLink = scores.reduce((s, r) => s + r.breakdown.deepLink, 0)
  const totalNoForbidden = scores.reduce((s, r) => s + r.breakdown.noForbiddenClaims, 0)
  const totalGrounded = scores.reduce((s, r) => s + r.breakdown.groundedness, 0)
  const n = scores.length

  console.log(`\n  Per-criterion averages (out of max):`)
  console.log(`    Key Points:           ${(totalKeyPoints / n).toFixed(1)}/4`)
  console.log(`    Deep Link:            ${(totalDeepLink / n).toFixed(1)}/2`)
  console.log(`    No Forbidden Claims:  ${(totalNoForbidden / n).toFixed(1)}/2`)
  console.log(`    Groundedness:         ${(totalGrounded / n).toFixed(1)}/2`)

  // Failures
  const failures = scores.filter((s) => !s.passed)
  if (failures.length > 0) {
    console.log(`\n  ❌ ${failures.length} questions below threshold (${LLM_PASS_THRESHOLD}/10):`)
    for (const f of failures.slice(0, 15)) {
      console.log(`    [${f.id}] ${f.score}/10 — "${f.question.substring(0, 60)}..."`)
      if (f.issues.length > 0) {
        console.log(`         ${f.issues[0]}`)
      }
    }
    if (failures.length > 15) {
      console.log(`    ... and ${failures.length - 15} more`)
    }
  }

  console.log()
  return { passed, total: scores.length, aggOk }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const PHASE2_ENABLED = process.argv.includes('--phase2') || process.env.TEST_PHASE2 === '1'
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''

  if (PHASE2_ENABLED && !GEMINI_API_KEY) {
    console.error('ERROR: --phase2 requires GEMINI_API_KEY environment variable.')
    console.error('Usage: GEMINI_API_KEY=<key> npx tsx scripts/test-rag-qanda.ts --phase2')
    process.exit(1)
  }

  const corpusPath = path.join(process.cwd(), 'public', 'data', 'rag-corpus.json')
  if (!fs.existsSync(corpusPath)) {
    console.error('ERROR: rag-corpus.json not found. Run: npx tsx scripts/generate-rag-corpus.ts')
    process.exit(1)
  }

  const corpus: Corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'))
  console.log(`\n📦 Loaded corpus: ${corpus.chunkCount} chunks (generated ${corpus.generatedAt})\n`)

  const TEST_CASES = loadTestCases()

  // ── Phase 1: Corpus-wide deep link audit ──────────────────────────────

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  PHASE 1: Corpus Deep Link Audit')
  console.log('═══════════════════════════════════════════════════════════════\n')

  const chunksWithLinks = corpus.chunks.filter((c) => c.deepLink)
  const chunksWithoutLinks = corpus.chunks.filter((c) => !c.deepLink)

  const invalidLinks: { id: string; deepLink: string; reason: string }[] = []
  const linksByRoute: Record<string, number> = {}

  for (const chunk of chunksWithLinks) {
    const result = isValidDeepLink(chunk.deepLink!)
    if (!result.valid) {
      invalidLinks.push({ id: chunk.id, deepLink: chunk.deepLink!, reason: result.reason! })
    }

    // Tally by route
    try {
      const route = new URL(chunk.deepLink!, 'http://localhost').pathname
      const key =
        VALID_ROUTES.find((r) => route === r || (r.endsWith('/') && route.startsWith(r))) ?? route
      // eslint-disable-next-line security/detect-object-injection
      linksByRoute[key] = (linksByRoute[key] ?? 0) + 1
    } catch {
      // already caught above
    }
  }

  console.log(`  Total chunks: ${corpus.chunkCount}`)
  console.log(
    `  Chunks with deepLink: ${chunksWithLinks.length} (${((chunksWithLinks.length / corpus.chunkCount) * 100).toFixed(1)}%)`
  )
  console.log(`  Chunks without deepLink: ${chunksWithoutLinks.length}`)
  console.log()

  console.log('  Deep links by route:')
  const sortedRoutes = Object.entries(linksByRoute).sort((a, b) => b[1] - a[1])
  for (const [route, count] of sortedRoutes) {
    console.log(`    ${route.padEnd(30)} ${count}`)
  }
  console.log()

  if (invalidLinks.length > 0) {
    console.log(`  ❌ INVALID DEEP LINKS: ${invalidLinks.length}`)
    for (const { id, deepLink, reason } of invalidLinks.slice(0, 20)) {
      console.log(`    ${id}: ${deepLink} — ${reason}`)
    }
    if (invalidLinks.length > 20) {
      console.log(`    ... and ${invalidLinks.length - 20} more`)
    }
  } else {
    console.log('  ✅ All deep links are valid!')
  }
  console.log()

  // Sources without deep links (by source category)
  const noLinkSources: Record<string, number> = {}
  for (const chunk of chunksWithoutLinks) {
    noLinkSources[chunk.source] = (noLinkSources[chunk.source] ?? 0) + 1
  }
  console.log('  Chunks WITHOUT deepLink by source:')
  const sortedNoLink = Object.entries(noLinkSources).sort((a, b) => b[1] - a[1])
  for (const [source, count] of sortedNoLink) {
    console.log(`    ${source.padEnd(30)} ${count}`)
  }
  console.log()

  // ── Phase 2: MiniSearch Retrieval Tests ───────────────────────────────

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  PHASE 2: Retrieval Accuracy (MiniSearch)')
  console.log('═══════════════════════════════════════════════════════════════\n')

  // Build index with same config as RetrievalService
  const index = new MiniSearch<RAGChunk>({
    fields: ['title', 'content', 'category'],
    storeFields: ['id', 'source', 'title', 'content', 'category', 'metadata', 'deepLink'],
    searchOptions: {
      boost: { title: 3, category: 1.5 },
      fuzzy: 0.2,
      prefix: true,
    },
  })

  // Deduplicate by id (MiniSearch requires unique IDs)
  const seen = new Set<string>()
  const deduped: RAGChunk[] = []
  for (const c of corpus.chunks) {
    if (!seen.has(c.id)) {
      seen.add(c.id)
      deduped.push(c)
    }
  }
  if (deduped.length < corpus.chunks.length) {
    console.log(
      `  ⚠️  Deduplicated: ${corpus.chunks.length - deduped.length} duplicate IDs removed\n`
    )
  }

  index.addAll(deduped)

  const TOP_N = 15
  let totalTests = 0
  let passedTests = 0
  let deepLinkHits = 0
  const failures: {
    id: string
    section: string
    question: string
    expectedTerms: string[]
    foundTerms: string[]
    missingTerms: string[]
    topTitles: string[]
  }[] = []

  for (const tc of TEST_CASES) {
    totalTests++
    const results = index.search(tc.question, { limit: TOP_N }) as unknown as RAGChunk[]

    // Check expected terms
    const foundTerms: string[] = []
    const missingTerms: string[] = []

    for (const term of tc.expectedTerms) {
      const termLower = term.toLowerCase()
      const found = results.some(
        (r) =>
          r.title?.toLowerCase().includes(termLower) ||
          r.content?.toLowerCase().includes(termLower) ||
          r.category?.toLowerCase().includes(termLower)
      )
      if (found) {
        foundTerms.push(term)
      } else {
        missingTerms.push(term)
      }
    }

    const allTermsFound = missingTerms.length === 0
    if (allTermsFound) passedTests++

    // Check deep link presence
    const hasDeepLink = results.some((r) => r.deepLink)
    if (hasDeepLink) deepLinkHits++

    // Check expected route
    let routeMatch = true
    if (tc.expectedDeepLinkRoute) {
      const matchingLink = results.find(
        (r) => r.deepLink && r.deepLink.startsWith(tc.expectedDeepLinkRoute!)
      )
      routeMatch = !!matchingLink
    }

    const status = allTermsFound && routeMatch ? '✅' : '❌'
    const linkStatus = hasDeepLink ? '🔗' : '⚠️'

    if (!allTermsFound || !routeMatch) {
      failures.push({
        id: tc.id,
        section: tc.section,
        question: tc.question,
        expectedTerms: tc.expectedTerms,
        foundTerms,
        missingTerms,
        topTitles: results.slice(0, 5).map((r) => r.title),
      })
    }

    console.log(
      `  ${status} ${linkStatus} [${tc.id.padEnd(10)}] [${tc.section.padEnd(16)}] ${tc.question.substring(0, 60)}${tc.question.length > 60 ? '...' : ''}`
    )
    if (missingTerms.length > 0) {
      console.log(`     Missing: ${missingTerms.join(', ')}`)
      console.log(
        `     Top results: ${results
          .slice(0, 3)
          .map((r) => r.title)
          .join(' | ')}`
      )
    }
    if (!routeMatch && tc.expectedDeepLinkRoute) {
      const actualLinks = results
        .filter((r) => r.deepLink)
        .slice(0, 3)
        .map((r) => r.deepLink)
      console.log(`     Expected route: ${tc.expectedDeepLinkRoute}`)
      console.log(`     Got links: ${actualLinks.join(' | ') || '(none)'}`)
    }
  }

  // ── Phase 3: Summary ──────────────────────────────────────────────────

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('  PHASE 3: Summary')
  console.log('═══════════════════════════════════════════════════════════════\n')

  const passRate = ((passedTests / totalTests) * 100).toFixed(1)
  const linkRate = ((deepLinkHits / totalTests) * 100).toFixed(1)

  console.log(`  Retrieval Accuracy: ${passedTests}/${totalTests} (${passRate}%)`)
  console.log(
    `  Deep Link Coverage: ${deepLinkHits}/${totalTests} (${linkRate}%) queries had deep-linked results`
  )
  console.log(
    `  Corpus Deep Links:  ${chunksWithLinks.length}/${corpus.chunkCount} chunks have deepLink`
  )
  console.log(`  Invalid Links:      ${invalidLinks.length}`)
  console.log()

  if (failures.length > 0) {
    console.log(`  ❌ ${failures.length} retrieval failures:`)
    for (const f of failures) {
      console.log(`    [${f.id}] [${f.section}] "${f.question.substring(0, 60)}..."`)
      console.log(`       Missing terms: ${f.missingTerms.join(', ')}`)
    }
  } else {
    console.log('  ✅ All retrieval tests passed!')
  }

  // ── Phase 4: Deep-link coverage gaps ──────────────────────────────────

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('  PHASE 4: Source Coverage Analysis')
  console.log('═══════════════════════════════════════════════════════════════\n')

  const sourceStats: Record<string, { total: number; withLink: number }> = {}
  for (const chunk of corpus.chunks) {
    if (!sourceStats[chunk.source]) {
      sourceStats[chunk.source] = { total: 0, withLink: 0 }
    }
    sourceStats[chunk.source].total++
    if (chunk.deepLink) sourceStats[chunk.source].withLink++
  }

  console.log('  Source'.padEnd(32) + 'Chunks'.padEnd(10) + 'Links'.padEnd(10) + 'Coverage')
  console.log('  ' + '─'.repeat(60))
  const sortedSources = Object.entries(sourceStats).sort((a, b) => b[1].total - a[1].total)
  for (const [source, stats] of sortedSources) {
    const pct = stats.total > 0 ? ((stats.withLink / stats.total) * 100).toFixed(0) : '0'
    const bar = stats.withLink === stats.total ? '█' : stats.withLink > 0 ? '▓' : '░'
    console.log(
      `  ${source.padEnd(30)} ${String(stats.total).padEnd(10)} ${String(stats.withLink).padEnd(10)} ${pct}% ${bar}`
    )
  }

  // ── LLM Phase (optional) ──────────────────────────────────────────────

  let llmOk = true
  if (PHASE2_ENABLED) {
    console.log()
    const result = await runLLMPhase(TEST_CASES, index, GEMINI_API_KEY)
    llmOk = result.aggOk
  } else {
    console.log('\n  ℹ️  LLM phase skipped — run with --phase2 flag to enable')
    console.log('     Requires: GEMINI_API_KEY=<key> npx tsx scripts/test-rag-qanda.ts --phase2\n')
  }

  // ── Exit code ─────────────────────────────────────────────────────────
  const hasErrors = invalidLinks.length > 0 || failures.length > 0 || !llmOk
  if (hasErrors) {
    console.log('\n⚠️  Issues found — review above for details.\n')
    process.exit(1)
  } else {
    console.log('\n✅ All checks passed!\n')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
