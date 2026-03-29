// SPDX-License-Identifier: GPL-3.0-only
/**
 * enrich-content-ts.ts
 *
 * Populates empty narrative objects in content.ts skeleton files by extracting
 * structured text from each module's rag-summary.md.
 *
 * Skeleton pattern detected:
 *   narratives: {
 *     // TODO: Extract narrative text from JSX components
 *   },
 *
 * Enriched output:
 *   narratives: {
 *     overview: '...',
 *     keyConcepts: '...',
 *     workshopSummary: '...',
 *     relatedStandards: '...',
 *   },
 *
 * Usage:
 *   npx tsx scripts/enrich-content-ts.ts [--dry-run] [--verbose] [--module <id>]
 */

import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(process.cwd())
const MODULES_DIR = path.join(ROOT, 'src', 'components', 'PKILearning', 'modules')

const DRY_RUN = process.argv.includes('--dry-run')
const VERBOSE = process.argv.includes('--verbose')

function getArgValue(flag: string): string | null {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null
}
const SINGLE_MODULE = getArgValue('--module')

// ── Skeleton detection ───────────────────────────────────────────────────────

const SKELETON_MARKER = 'AUTO-GENERATED SKELETON'
const TODO_MARKER = '// TODO: Extract narrative text from JSX components'

function isSkeleton(contentTs: string): boolean {
  return contentTs.includes(SKELETON_MARKER) || contentTs.includes(TODO_MARKER)
}

// ── rag-summary.md parser ────────────────────────────────────────────────────

interface ParsedSummary {
  overview: string
  keyConcepts: string
  workshopSummary: string
  relatedStandards: string
}

function parseRagSummary(mdContent: string): ParsedSummary {
  const sections = new Map<string, string>()
  let currentSection = ''
  let currentLines: string[] = []

  // Strip YAML frontmatter if present
  let content = mdContent
  if (content.startsWith('---')) {
    const endIdx = content.indexOf('---', 3)
    if (endIdx !== -1) content = content.slice(endIdx + 3)
  }

  for (const line of content.split('\n')) {
    const h2Match = line.match(/^## (.+)/)
    if (h2Match) {
      if (currentSection && currentLines.length > 0) {
        sections.set(currentSection.toLowerCase(), currentLines.join('\n').trim())
      }
      currentSection = h2Match[1].trim()
      currentLines = []
    } else if (currentSection) {
      currentLines.push(line)
    }
  }
  // Flush last section
  if (currentSection && currentLines.length > 0) {
    sections.set(currentSection.toLowerCase(), currentLines.join('\n').trim())
  }

  // Helper: find first match among multiple section name variants
  const pick = (...names: string[]): string => {
    for (const n of names) {
      const val = sections.get(n)
      if (val) return val
    }
    return ''
  }

  return {
    overview: collapseToNarrative(
      pick(
        'overview',
        'module overview',
        'topics covered',
        'core concepts',
        'core learning objectives'
      )
    ),
    keyConcepts: collapseToNarrative(
      pick(
        'key concepts',
        'key topics',
        'key technical facts',
        'key data points',
        'key terms',
        'key distinctions to memorize'
      )
    ),
    workshopSummary: collapseToNarrative(
      pick('workshop / interactive activities', 'workshop activities', 'workshop steps', 'workshop')
    ),
    relatedStandards: collapseToNarrative(
      pick(
        'related standards',
        'standards referenced',
        'key standards',
        'referenced standards',
        'standards references',
        'standards'
      )
    ),
  }
}

/**
 * Collapse markdown into a single-paragraph narrative string suitable for TS.
 * - Strip leading bullet markers (-, *, numbered)
 * - Strip bold markers
 * - Collapse multiple lines into sentences separated by spaces
 * - Escape single quotes for TS string literals
 */
function collapseToNarrative(md: string): string {
  if (!md) return ''
  const lines = md
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => {
      // Strip list markers
      let s = l.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '')
      // Strip bold markers
      s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
      // Strip inline code
      s = s.replace(/`([^`]+)`/g, '$1')
      // Escape single quotes for TS string
      s = s.replace(/'/g, "\\'")
      // Strip em-dashes that are markdown artifacts
      s = s.replace(/\s*—\s*/g, ' \u2014 ')
      return s
    })
    .filter((l) => l.length > 0)

  // Join with '. ' if lines don't already end with punctuation, otherwise just space
  const result = lines
    .map((l, i) => {
      if (i < lines.length - 1 && !l.match(/[.!?;:]$/)) return l + '.'
      return l
    })
    .join(' ')

  // Cap at ~500 chars for readability
  if (result.length > 500) {
    const truncated = result.slice(0, 497)
    const lastSentence = truncated.lastIndexOf('. ')
    if (lastSentence > 200) return truncated.slice(0, lastSentence + 1)
    return truncated + '...'
  }

  return result
}

// ── content.ts rewriter ──────────────────────────────────────────────────────

function buildNarrativesBlock(summary: ParsedSummary): string {
  const entries: string[] = []
  if (summary.overview) entries.push(`    overview: '${summary.overview}'`)
  if (summary.keyConcepts) entries.push(`    keyConcepts: '${summary.keyConcepts}'`)
  if (summary.workshopSummary) entries.push(`    workshopSummary: '${summary.workshopSummary}'`)
  if (summary.relatedStandards) entries.push(`    relatedStandards: '${summary.relatedStandards}'`)

  if (entries.length === 0) return '  narratives: {},\n'
  return `  narratives: {\n${entries.join(',\n')},\n  },\n`
}

function rewriteContentTs(original: string, summary: ParsedSummary): string {
  // Replace the skeleton narratives block
  // Pattern: "narratives: {\n    // TODO: ...\n  },"
  const skeletonPattern =
    /narratives:\s*\{\s*\n\s*\/\/ TODO: Extract narrative text from JSX components\s*\n\s*\},?/
  if (skeletonPattern.test(original)) {
    const narrativesBlock = buildNarrativesBlock(summary)
    const result = original.replace(skeletonPattern, narrativesBlock.trim())
    // Remove AUTO-GENERATED SKELETON comment
    return result.replace(/\s*\*\s*AUTO-GENERATED SKELETON[^\n]*\n/, '\n')
  }

  return original
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const moduleDirs = fs.readdirSync(MODULES_DIR).filter((d) => {
    const p = path.join(MODULES_DIR, d)
    return fs.statSync(p).isDirectory() && d !== 'Quiz' && d !== 'Assess'
  })

  let enriched = 0
  let skipped = 0
  let noRagSummary = 0
  let alreadyEnriched = 0

  for (const dir of moduleDirs) {
    if (SINGLE_MODULE) {
      // Match by directory name or module ID
      const moduleId = dirToModuleId(dir)
      if (moduleId !== SINGLE_MODULE && dir !== SINGLE_MODULE) continue
    }

    const contentPath = path.join(MODULES_DIR, dir, 'content.ts')
    const ragPath = path.join(MODULES_DIR, dir, 'rag-summary.md')

    if (!fs.existsSync(contentPath)) {
      if (VERBOSE) console.log(`  SKIP ${dir}: no content.ts`)
      skipped++
      continue
    }

    const contentTs = fs.readFileSync(contentPath, 'utf-8')

    if (!isSkeleton(contentTs)) {
      if (VERBOSE) console.log(`  SKIP ${dir}: already enriched`)
      alreadyEnriched++
      continue
    }

    if (!fs.existsSync(ragPath)) {
      if (VERBOSE) console.log(`  SKIP ${dir}: no rag-summary.md`)
      noRagSummary++
      continue
    }

    const ragContent = fs.readFileSync(ragPath, 'utf-8')
    const summary = parseRagSummary(ragContent)

    // Check if we got meaningful content
    const hasContent =
      summary.overview.length > 20 ||
      summary.keyConcepts.length > 20 ||
      summary.workshopSummary.length > 20

    if (!hasContent) {
      if (VERBOSE) console.log(`  SKIP ${dir}: rag-summary.md has insufficient content`)
      skipped++
      continue
    }

    const rewritten = rewriteContentTs(contentTs, summary)

    if (rewritten === contentTs) {
      if (VERBOSE) console.log(`  SKIP ${dir}: no changes after rewrite`)
      skipped++
      continue
    }

    if (DRY_RUN) {
      console.log(`  DRY-RUN ${dir}: would enrich narratives`)
      if (VERBOSE) {
        console.log(`    overview:    ${summary.overview.slice(0, 80)}...`)
        console.log(`    keyConcepts: ${summary.keyConcepts.slice(0, 80)}...`)
        console.log(`    workshop:    ${summary.workshopSummary.slice(0, 80)}...`)
      }
      enriched++
      continue
    }

    fs.writeFileSync(contentPath, rewritten)
    console.log(`  ENRICHED ${dir}`)
    enriched++
  }

  console.log(`\n  Summary:`)
  console.log(`    Enriched:         ${enriched}`)
  console.log(`    Already enriched: ${alreadyEnriched}`)
  console.log(`    No rag-summary:   ${noRagSummary}`)
  console.log(`    Skipped:          ${skipped}`)
  console.log(`    Total dirs:       ${moduleDirs.length}`)
  if (DRY_RUN) console.log(`    (dry run — no files modified)`)
  console.log('')
}

/** Convert PascalCase directory name to kebab-case module ID */
function dirToModuleId(dir: string): string {
  // Handle known special cases
  const special: Record<string, string> = {
    'Module1-Introduction': 'pqc-101',
    FiveG: '5g-security',
    IoTOT: 'iot-ot-pqc',
    IAMPQC: 'iam-pqc',
    OSPQC: 'os-pqc',
  }
  if (special[dir]) return special[dir]

  return dir
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

main()
