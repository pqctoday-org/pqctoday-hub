// SPDX-License-Identifier: GPL-3.0-only
/**
 * NotebookLM Package Generator
 *
 * Reads public/data/rag-corpus.json (pre-built at build time) and raw
 * documentation files to produce focused Markdown documents suitable for
 * upload to Google NotebookLM.
 *
 * Usage: npm run notebooklm
 * Output: notebooklm/ directory (12 .md files, ~5-15MB total)
 *
 * Source groupings:
 *   01 — README.md (project overview)
 *   02 — docs/maintenance-guide.md (architecture & data sources)
 *   03 — glossary chunks
 *   04 — algorithms + transitions chunks
 *   05 — compliance + authoritative-sources + certifications chunks
 *   06 — timeline chunks
 *   07 — library chunks
 *   07b — document-enrichment chunks
 *   08 — threats chunks
 *   09 — migrate + priority-matrix + documentation chunks
 *   10 — leaders chunks
 *   11 — modules + module-summaries + module-content + assessment chunks
 *   12 — CHANGELOG.md (first 600 lines)
 */
import fs from 'fs'
import path from 'path'

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

interface RAGCorpus {
  generatedAt: string
  chunkCount: number
  chunks: RAGChunk[]
}

interface DocumentSpec {
  filename: string
  title: string
  description: string
  sources: string[]
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = process.cwd()
const CORPUS_PATH = path.join(ROOT, 'public', 'data', 'rag-corpus.json')
const OUTPUT_DIR = path.join(ROOT, 'notebooklm')
const README_PATH = path.join(ROOT, 'README.md')
const CHANGELOG_PATH = path.join(ROOT, 'CHANGELOG.md')
const MAINTENANCE_PATH = path.join(ROOT, 'docs', 'maintenance-guide.md')

const SIZE_WARN_BYTES = 1.5 * 1024 * 1024 // 1.5MB warning threshold

// ---------------------------------------------------------------------------
// Document definitions (corpus-sourced)
// ---------------------------------------------------------------------------

const CORPUS_DOCUMENTS: DocumentSpec[] = [
  {
    filename: '04-algorithms-reference.md',
    title: 'PQC Algorithms Reference',
    description:
      'Complete reference for post-quantum cryptographic algorithms, parameter sets, security levels, and migration timelines.',
    sources: ['algorithms', 'transitions'],
  },
  {
    filename: '05-compliance-and-certifications.md',
    title: 'PQC Compliance Frameworks & Certifications',
    description:
      'NIST, ANSSI, Common Criteria, ACVP, and FIPS 140-3 compliance frameworks, authoritative sources, and certification data.',
    sources: ['compliance', 'authoritative-sources', 'certifications'],
  },
  {
    filename: '06-government-timeline.md',
    title: 'Government PQC Migration Timeline',
    description:
      'Global government and regulatory body PQC migration milestones by country, including NSA CNSA 2.0, NIST, ANSSI, BSI, NCSC, and others.',
    sources: ['timeline'],
  },
  {
    filename: '07-library-catalog.md',
    title: 'PQC Standards & Library Catalog',
    description:
      'Technical standards, RFCs, academic papers, NIST SPs, and official documents related to post-quantum cryptography.',
    sources: ['library'],
  },
  {
    filename: '07b-document-enrichments.md',
    title: 'PQC Document Analysis & Enrichments',
    description:
      'AI-extracted summaries, author details, publication dates, and analysis of 195 downloaded PQC source documents.',
    sources: ['document-enrichment'],
  },
  {
    filename: '08-industry-threats.md',
    title: 'Industry Quantum Threat Analysis',
    description:
      'Quantum computing threat analysis by industry sector — threat vectors, attack timelines, HSM/PKI exposure, and HNDL risk.',
    sources: ['threats'],
  },
  {
    filename: '09-software-catalog.md',
    title: 'PQC Software & Tools Catalog',
    description:
      'Comprehensive catalog of 800+ PQC-enabled software products, libraries, HSMs, and infrastructure tools with migration readiness data.',
    sources: ['migrate', 'priority-matrix', 'documentation'],
  },
  {
    filename: '10-leaders-and-orgs.md',
    title: 'PQC Leaders, Researchers & Organizations',
    description:
      'Key people and organizations driving post-quantum cryptography standardization, research, and industry adoption.',
    sources: ['leaders'],
  },
  {
    filename: '11-learning-modules.md',
    title: 'PQC Learning Modules & Educational Content',
    description:
      '25 interactive learning modules covering PQC fundamentals, protocols, compliance strategy, and hands-on cryptographic operations.',
    sources: ['modules', 'module-summaries', 'module-content', 'assessment'],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderChunks(chunks: RAGChunk[]): string {
  return chunks.map((c) => `## ${c.title}\n\n${c.content}\n\n---\n`).join('\n')
}

function writeDocument(
  filename: string,
  title: string,
  description: string,
  content: string,
  sourceLine: string
): void {
  const outputPath = path.join(OUTPUT_DIR, filename)
  const header = `# ${title}\n\n> ${description}\n\n_${sourceLine}_\n\n---\n\n`
  const full = header + content
  fs.writeFileSync(outputPath, full, 'utf-8')

  const sizeBytes = Buffer.byteLength(full, 'utf-8')
  const sizeKB = Math.round(sizeBytes / 1024)
  const warn = sizeBytes > SIZE_WARN_BYTES ? '  ⚠ LARGE (>1.5MB)' : ''
  console.log(`  ✓ ${filename.padEnd(36)} ${String(sizeKB).padStart(6)}KB${warn}`)
}

function readFirstLines(filePath: string, maxLines: number): string {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return raw.split('\n').slice(0, maxLines).join('\n')
}

function extractLineRange(filePath: string, start: number, end: number): string {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return raw
    .split('\n')
    .slice(start - 1, end)
    .join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

if (!fs.existsSync(CORPUS_PATH)) {
  console.error(`ERROR: RAG corpus not found at ${CORPUS_PATH}`)
  console.error('Run "npm run generate-corpus" first to build the corpus.')
  process.exit(1)
}

const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf-8')) as RAGCorpus
const generatedAt = corpus.generatedAt
const meta = `Generated from RAG corpus · ${corpus.chunkCount} chunks · corpus date: ${generatedAt}`

console.log('\n📦 NotebookLM Package Generator')
console.log(`   Corpus:  ${corpus.chunkCount} chunks (${generatedAt})`)
console.log(`   Output:  ${OUTPUT_DIR}`)
console.log()

// Ensure output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Group chunks by source
const bySource = new Map<string, RAGChunk[]>()
for (const chunk of corpus.chunks) {
  const arr = bySource.get(chunk.source)
  if (arr) {
    arr.push(chunk)
  } else {
    bySource.set(chunk.source, [chunk])
  }
}

// Print source inventory
console.log('   Source inventory:')
for (const [src, chunks] of [...bySource.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`     ${src.padEnd(24)} ${chunks.length} chunks`)
}
console.log()

// ---------------------------------------------------------------------------
// 01 — Project Overview (README verbatim)
// ---------------------------------------------------------------------------
{
  const readme = fs.readFileSync(README_PATH, 'utf-8')
  writeDocument(
    '01-project-overview.md',
    'PQC Today — Project Overview',
    'Full feature overview, architecture, algorithms supported, testing setup, and CI/CD pipeline for the PQC Today application.',
    readme,
    `Source: README.md · ${meta}`
  )
}

// ---------------------------------------------------------------------------
// 02 — App Architecture (maintenance guide, first 500 lines)
// ---------------------------------------------------------------------------
{
  const guide = readFirstLines(MAINTENANCE_PATH, 500)
  writeDocument(
    '02-app-architecture.md',
    'PQC Today — App Architecture & Maintenance Guide',
    'Data sources, update workflows, cross-page data connections, RAG pipeline, Zustand stores, and maintenance procedures.',
    guide,
    `Source: docs/maintenance-guide.md (first 500 lines) · ${meta}`
  )
}

// ---------------------------------------------------------------------------
// 03 — PQC Glossary
// ---------------------------------------------------------------------------
{
  const chunks = bySource.get('glossary') ?? []
  writeDocument(
    '03-pqc-glossary.md',
    'PQC Glossary',
    `${chunks.length} post-quantum cryptography terms with definitions, technical notes, acronyms, and complexity levels.`,
    renderChunks(chunks),
    `Source: glossary (${chunks.length} terms) · ${meta}`
  )
}

// ---------------------------------------------------------------------------
// 04-11 — Corpus-driven documents
// ---------------------------------------------------------------------------
for (const doc of CORPUS_DOCUMENTS) {
  const chunks: RAGChunk[] = []
  for (const src of doc.sources) {
    const srcChunks = bySource.get(src) ?? []
    chunks.push(...srcChunks)
  }
  if (chunks.length === 0) {
    console.log(`  ⚠ ${doc.filename} — no chunks found for sources: ${doc.sources.join(', ')}`)
    continue
  }
  writeDocument(
    doc.filename,
    doc.title,
    doc.description,
    renderChunks(chunks),
    `Sources: ${doc.sources.join(', ')} (${chunks.length} entries) · ${meta}`
  )
}

// ---------------------------------------------------------------------------
// 12 — Changelog (first 600 lines ≈ last 5-6 major versions)
// ---------------------------------------------------------------------------
{
  const recent = readFirstLines(CHANGELOG_PATH, 600)
  writeDocument(
    '12-changelog.md',
    'PQC Today — Changelog',
    'Version history covering recent releases, new features, bug fixes, and data updates.',
    recent,
    `Source: CHANGELOG.md (first 600 lines) · ${meta}`
  )
}

// ---------------------------------------------------------------------------
// 13 — PQC Assistant & Chatbot
// ---------------------------------------------------------------------------
{
  const preamble = `## Key Differentiator: Privacy-First, No-Backend AI

The PQC Assistant is the only RAG-powered chatbot for post-quantum cryptography that runs
entirely in the browser with zero backend infrastructure. The user provides their own Google
Gemini API key (BYOK — Bring Your Own Key), stored exclusively in browser localStorage.
All retrieval happens client-side via MiniSearch over 2,350+ corpus chunks from 22 data
sources bundled at build time. No queries, API keys, or user data ever touch a server.

## All Features Interconnected

Every section of PQC Today feeds the assistant and links back to it. The assistant is
context-aware of which page the user is on, their persona (executive / developer / architect /
researcher), their industry, region, and risk score from the Assessment wizard.

Detail-view AI buttons are embedded in all 7 major detail panels (Algorithms, Compliance,
Leaders, Library, Migrate, Threats, Timeline) — each pre-fills a relevant question using
the current item's context. Responses include precision deep-links using URL parameters
accepted by all 10 views, so clicking a link in the assistant's response navigates directly
to the relevant item in the SPA, closing the chat panel automatically.

Cross-domain post-processing adds links between threats↔compliance, leaders↔algorithms,
library↔algorithms, and compliance↔timeline, making the assistant a connective tissue
across the entire knowledge base.

---

## PQC Assistant Feature Overview (from README)

`

  const readmeSection = extractLineRange(README_PATH, 233, 265)
  const crossPageMap = extractLineRange(MAINTENANCE_PATH, 145, 174)
  const ragSection = extractLineRange(MAINTENANCE_PATH, 214, 420)

  const content =
    preamble +
    readmeSection +
    '\n\n---\n\n## Cross-Page Connection Map\n\n' +
    crossPageMap +
    '\n\n---\n\n' +
    ragSection

  writeDocument(
    '13-chatbot-assistant.md',
    'PQC Assistant — AI Chatbot & RAG Architecture',
    'Key differentiator: privacy-first BYOK chatbot with no backend. Client-side RAG over 2,350+ chunks from 22 data sources. Three-phase retrieval pipeline, entity inventory hallucination guard, and deep-links connecting all 10 app views.',
    content,
    `Sources: README.md (PQC Assistant section) + docs/maintenance-guide.md (§1.5, §2) · ${meta}`
  )
}

// ---------------------------------------------------------------------------
// 14 — Personalization System
// ---------------------------------------------------------------------------
{
  const preamble = `## Key Differentiator: Four-Dimension Personalization

PQC Today adapts the entire experience across four independent dimensions — role, experience
level, industry, and region — all stored locally in the browser with no server involvement.
A 4-step onboarding wizard on the home page captures preferences once; every subsequent
visit reflects them automatically. Preferences can be cleared at any time with a single click.

### The Four Dimensions

| Dimension | Options | What adapts |
|---|---|---|
| **Role** | Executive/CISO · Developer/Engineer · Security Architect · Researcher | Navigation visibility, hero CTAs, journey step badges, chatbot response style, assessment report sections |
| **Experience Level** | New · Basics · Expert | Guided tour length (Phase 2 knowledge gate), learning path sequencing, quiz difficulty |
| **Industry** | Finance · Government · Healthcare · Telecom · Technology · Energy · Automotive · Aerospace · Retail | Compliance frameworks shown, threat data filtered, Learn module badges, Assessment step options, Migrate product list |
| **Region** | Americas · EU · APAC · Global | Timeline region pre-filter, Assessment country pre-seed, Compliance jurisdiction focus |

### Persona-Specific Navigation

Each role unlocks a curated subset of the full nav (plus always-visible pages: Home, Learn,
Timeline, Threats, About):

- **Executive**: Assess, Report, Leaders, Library, Compliance, Migrate
- **Developer**: Assess, Report, Algorithms, Library, Migrate, Playground, OpenSSL
- **Architect**: Assess, Report, Algorithms, Library, Migrate, Compliance, Leaders, Playground
- **Researcher**: All pages (unrestricted)

Pages outside a persona's nav are hidden — not removed — so switching persona reveals them.

### Persona-Driven Learning Paths

Each persona has a curated module sequence with quiz checkpoints:

- **Executive** (~570 min): pqc-101 → quantum-threats → pqc-risk-management → pqc-business-case → pqc-governance → compliance-strategy → crypto-agility → migration-program → vendor-risk → key-management
- **Developer** (~855 min): pqc-101 → quantum-threats → entropy-randomness → tls-basics → vpn-ssh-pqc → hybrid-crypto → crypto-agility → pki-workshop → merkle-tree-certs …
- **Architect** (~1,095 min): deep infrastructure and integration-pattern coverage
- **Researcher** (~1,500 min): full breadth — all 25 modules, all quiz categories

### Assessment Report Personalization

The assessment report adapts its layout and CTAs per persona:
- **Executive**: HNDL/HNFL and algorithm migration sections hidden (too technical); top 5 actions only; CTAs → "Share with your board", "View compliance deadlines"
- **Developer**: all sections shown; CTAs → "Try algorithms in Playground", "Browse PQC libraries"
- **Architect**: deep-dive sections (assessment profile, threat landscape) open by default; CTAs → "View migration catalog", "Explore infrastructure layers"
- **Researcher**: same deep-dive as Architect; CTAs → "Compare algorithms", "Explore in OpenSSL"

### Persona Inference from Assessment

After completing the 14-step assessment, the system automatically infers the best-matching
persona based on answers (crypto breadth, compliance depth, infrastructure complexity,
migration status). The inferred persona appears as a "For you" badge on the role picker.
The user can accept or override it.

### Learning Progress — Judo Belt Grading

The Learning Journey ScoreCard on the home page tracks cross-page progress using a 7-belt
system (White → Yellow → Orange → Green → Blue → Brown → Black) based on a composite
awareness score: quiz performance, module step completion, artifact generation (keys, certs,
CSRs), time spent, and streak (consecutive daily visits). The belt and score persist via
localStorage and are visible from any page.

### Chatbot Integration

The PQC Assistant always receives persona, industry, region, and (when the assessment is
complete) the full risk profile in its system prompt. This means chatbot responses are
automatically calibrated: an Executive gets business-impact framing; a Developer gets
code examples and implementation specifics; an Architect gets integration patterns; a
Researcher gets mathematical foundations and academic references.

---

## Personalization Feature Overview (from README)

`

  const readmeSection = extractLineRange(README_PATH, 197, 230)
  const personaStoreSection = extractLineRange(MAINTENANCE_PATH, 603, 678)

  const content = preamble + readmeSection + '\n\n---\n\n' + personaStoreSection

  writeDocument(
    '14-personalization.md',
    'PQC Today — Personalization System',
    'Four-dimension personalization: role (Executive/Developer/Architect/Researcher), experience level, industry, and region. Adapts navigation, CTAs, learning paths, chatbot responses, compliance filters, threat data, and assessment reports. All local, zero-server.',
    content,
    `Sources: README.md (Personalization section) + docs/maintenance-guide.md (§3.7, §4) · ${meta}`
  )
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.md'))
const totalBytes = files.reduce((acc, f) => acc + fs.statSync(path.join(OUTPUT_DIR, f)).size, 0)
const totalKB = Math.round(totalBytes / 1024)
const totalMB = (totalBytes / (1024 * 1024)).toFixed(1)

console.log()
console.log(`✅ Generated ${files.length} documents · ${totalKB}KB (${totalMB}MB) total`)
console.log()
console.log('   Next steps:')
console.log('   1. Go to notebooklm.google.com → New Notebook')
console.log('   2. Upload all files from the notebooklm/ directory as sources')
console.log('   3. Suggested notebooks:')
console.log('      • "PQC Standards & Compliance"  → files 04, 05, 06, 07, 07b')
console.log('      • "PQC Software & Migration"    → files 09, 10, 08')
console.log('      • "PQC Education & App"         → files 01, 02, 03, 11, 12, 13, 14')
console.log()
