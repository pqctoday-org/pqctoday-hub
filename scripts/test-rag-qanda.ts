// SPDX-License-Identifier: GPL-3.0-only
/**
 * RAG × Q&A Accuracy Test Harness
 *
 * Loads public/data/rag-corpus.json, indexes it with the same MiniSearch
 * config used by RetrievalService, then runs representative questions from
 * QandA_pqctoday.md and checks:
 *
 *   1. Retrieval accuracy — do the top-N results contain chunks with the
 *      expected key terms / entities?
 *   2. Deep link presence — do the retrieved chunks carry deepLink fields?
 *   3. Deep link validity — do the deep links match known route patterns?
 *   4. Corpus-wide deep link audit — validate every deepLink in the corpus.
 *
 * Usage: npx tsx scripts/test-rag-qanda.ts
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
  section: string
  question: string
  /** Key terms that MUST appear in at least one top-N chunk's title or content */
  expectedTerms: string[]
  /** Expected deep link pattern prefix (route path) */
  expectedDeepLinkRoute?: string
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
// Test cases — 2-3 representative questions per QandA section
// ---------------------------------------------------------------------------
const TEST_CASES: TestCase[] = [
  // §1 Landing
  {
    section: 'Landing',
    question: 'What five persona types does PQC Today support?',
    expectedTerms: ['persona', 'executive', 'developer'],
    expectedDeepLinkRoute: '/',
  },
  {
    section: 'Landing',
    question: 'How many learning modules does PQC Today offer?',
    expectedTerms: ['27', 'module'],
  },

  // §2 Timeline
  {
    section: 'Timeline',
    question: 'Which country has the most aggressive PQC migration deadline?',
    expectedTerms: ['Australia', '2030'],
    expectedDeepLinkRoute: '/timeline',
  },
  {
    section: 'Timeline',
    question: "What is Germany's QUANTITY initiative?",
    expectedTerms: ['Germany', 'QUANTITY'],
    expectedDeepLinkRoute: '/timeline',
  },
  {
    section: 'Timeline',
    question: "How does China's PQC program differ from NIST-aligned countries?",
    expectedTerms: ['China'],
    expectedDeepLinkRoute: '/timeline',
  },

  // §3 Algorithms
  {
    section: 'Algorithms',
    question: 'What FIPS standard covers ML-KEM?',
    expectedTerms: ['FIPS 203', 'ML-KEM'],
    expectedDeepLinkRoute: '/algorithms',
  },
  {
    section: 'Algorithms',
    question: 'What is SLH-DSA and how many variants does it have?',
    expectedTerms: ['SLH-DSA', 'FIPS 205'],
    expectedDeepLinkRoute: '/algorithms',
  },
  {
    section: 'Algorithms',
    question: 'When does NIST IR 8547 plan to deprecate classical algorithms?',
    expectedTerms: ['IR 8547', '2030'],
  },

  // §4 Library
  {
    section: 'Library',
    question: 'What are the four FIPS standards published for PQC?',
    expectedTerms: ['FIPS 203', 'FIPS 204'],
    expectedDeepLinkRoute: '/library',
  },
  {
    section: 'Library',
    question: 'What is RFC 9629 about?',
    expectedTerms: ['RFC 9629', 'CMS'],
    expectedDeepLinkRoute: '/library',
  },
  {
    section: 'Library',
    question: 'What is NIST CSWP 39?',
    expectedTerms: ['CSWP 39', 'agility'],
    expectedDeepLinkRoute: '/library',
  },

  // §5 Threats
  {
    section: 'Threats',
    question: 'What is a Harvest Now Decrypt Later attack?',
    expectedTerms: ['HNDL', 'harvest'],
    expectedDeepLinkRoute: '/threats',
  },
  {
    section: 'Threats',
    question: 'How much Bitcoin value is at risk from quantum attacks?',
    expectedTerms: ['Bitcoin', 'P2PK'],
    expectedDeepLinkRoute: '/threats',
  },
  {
    section: 'Threats',
    question: 'What is the quantum threat to power grid SCADA systems?',
    expectedTerms: ['SCADA', 'energy'],
    expectedDeepLinkRoute: '/threats',
  },

  // §6 Compliance
  {
    section: 'Compliance',
    question: 'What is CNSA 2.0 and what are its key deadlines?',
    expectedTerms: ['CNSA 2.0', '2035'],
    expectedDeepLinkRoute: '/compliance',
  },
  {
    section: 'Compliance',
    question: 'What is eIDAS 2.0 and its PQC requirement?',
    expectedTerms: ['eIDAS', 'wallet'],
  },
  {
    section: 'Compliance',
    question: 'What PQC-related certification does ACVP provide?',
    expectedTerms: ['ACVP', 'validation'],
  },

  // §7 Migrate
  {
    section: 'Migrate',
    question: 'What are the seven phases of the PQC migration framework?',
    expectedTerms: ['Assess', 'Prepare', 'Test'],
    expectedDeepLinkRoute: '/migrate',
  },
  {
    section: 'Migrate',
    question: 'What do the three FIPS badge tiers mean?',
    expectedTerms: ['Validated', 'Partial'],
    expectedDeepLinkRoute: '/migrate',
  },

  // §8 Assess
  {
    section: 'Assess',
    question: 'What are the 14 steps of the comprehensive assessment wizard?',
    expectedTerms: ['Industry', 'Country', 'Data Sensitivity'],
    expectedDeepLinkRoute: '/assess',
  },
  {
    section: 'Assess',
    question: 'How does the HNDL window calculation work?',
    expectedTerms: ['HNDL', 'retention'],
  },

  // §9 Playground
  {
    section: 'Playground',
    question: 'What cryptographic operations can you perform in the Playground?',
    expectedTerms: ['KEM', 'Sign'],
    expectedDeepLinkRoute: '/playground',
  },

  // §10 OpenSSL Studio
  {
    section: 'OpenSSL',
    question: 'What version of OpenSSL runs in the browser via OpenSSL Studio?',
    expectedTerms: ['OpenSSL', '3.6.0'],
    expectedDeepLinkRoute: '/openssl',
  },

  // §11 Leaders
  {
    section: 'Leaders',
    question: 'Who led the NIST PQC standardization effort?',
    expectedTerms: ['Dustin Moody', 'NIST'],
    expectedDeepLinkRoute: '/leaders',
  },
  {
    section: 'Leaders',
    question: "What is SandboxAQ's role in PQC?",
    expectedTerms: ['SandboxAQ', 'AQtive Guard'],
    expectedDeepLinkRoute: '/leaders',
  },

  // §12 Learn
  {
    section: 'Learn',
    question: 'How are the 27 learning modules organized?',
    expectedTerms: ['module', 'track'],
    expectedDeepLinkRoute: '/learn',
  },
  {
    section: 'Learn',
    question: 'How many quiz questions are available?',
    expectedTerms: ['quiz', '530'],
  },

  // §13 About
  {
    section: 'About',
    question: "What cryptographic libraries does PQC Today's SBOM list?",
    expectedTerms: ['OpenSSL', 'liboqs'],
    expectedDeepLinkRoute: '/about',
  },

  // §14 KMS
  {
    section: 'KMS-PQC',
    question: 'What is the envelope encryption pipeline when using ML-KEM?',
    expectedTerms: ['ML-KEM', 'envelope'],
    expectedDeepLinkRoute: '/learn/',
  },
  {
    section: 'KMS-PQC',
    question: 'What is the hybrid KEM combiner formula?',
    expectedTerms: ['hybrid', 'KDF'],
    expectedDeepLinkRoute: '/learn/',
  },

  // §15 HSM
  {
    section: 'HSM-PQC',
    question: 'What is the PQC Maturity Score and what does a score above 80 indicate?',
    expectedTerms: ['Maturity', 'HSM'],
    expectedDeepLinkRoute: '/learn/',
  },

  // §16 Data Asset Sensitivity
  {
    section: 'Data-Asset',
    question: 'What is the composite scoring formula in the Sensitivity Scoring Engine?',
    expectedTerms: ['Sensitivity', 'Retention'],
    expectedDeepLinkRoute: '/learn/',
  },

  // §17 Hybrid Crypto
  {
    section: 'Hybrid-Crypto',
    question: 'What four IETF Hackathon reference certificates are embedded in the inspector?',
    expectedTerms: ['Composite', 'Chameleon'],
    expectedDeepLinkRoute: '/learn/',
  },

  // §18 5G Security
  {
    section: '5G-Security',
    question: 'What are the three SUCI protection profiles and which is quantum-resistant?',
    expectedTerms: ['SUCI', 'Profile C'],
    expectedDeepLinkRoute: '/learn/',
  },
  {
    section: '5G-Security',
    question: 'Why is MILENAGE quantum-resistant while SUCI Profile A/B is not?',
    expectedTerms: ['MILENAGE', 'AES'],
    expectedDeepLinkRoute: '/learn/',
  },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const corpusPath = path.join(process.cwd(), 'public', 'data', 'rag-corpus.json')
  if (!fs.existsSync(corpusPath)) {
    console.error('ERROR: rag-corpus.json not found. Run: npx tsx scripts/generate-rag-corpus.ts')
    process.exit(1)
  }

  const corpus: Corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'))
  console.log(`\n📦 Loaded corpus: ${corpus.chunkCount} chunks (generated ${corpus.generatedAt})\n`)

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
        section: tc.section,
        question: tc.question,
        expectedTerms: tc.expectedTerms,
        foundTerms,
        missingTerms,
        topTitles: results.slice(0, 5).map((r) => r.title),
      })
    }

    console.log(
      `  ${status} ${linkStatus} [${tc.section.padEnd(14)}] ${tc.question.substring(0, 70)}${tc.question.length > 70 ? '...' : ''}`
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
      console.log(`    [${f.section}] "${f.question.substring(0, 60)}..."`)
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

  // ── Exit code ─────────────────────────────────────────────────────────
  const hasErrors = invalidLinks.length > 0 || failures.length > 0
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
