/**
 * RAG Corpus Generator — build-time script
 *
 * Reads all CSV data sources + glossary + module metadata and produces
 * a single JSON file (public/data/rag-corpus.json) for client-side
 * MiniSearch retrieval in the PQC Assistant chatbot.
 *
 * Usage: npx tsx scripts/generate-rag-corpus.ts
 */
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

interface RAGChunk {
  id: string
  source: string
  title: string
  content: string
  category: string
  metadata: Record<string, string>
  deepLink?: string
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data')
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'rag-corpus.json')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find the latest versioned CSV file matching a prefix pattern */
function findLatestCSV(prefix: string): string | null {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))

  if (files.length === 0) return null

  // Extract date from filename: prefix_MMDDYYYY.csv
  const withDates = files.map((f) => {
    const match = f.match(/(\d{2})(\d{2})(\d{4})\.csv$/)
    if (!match) return { file: f, date: 0 }
    const [, mm, dd, yyyy] = match
    return { file: f, date: parseInt(yyyy + mm + dd) }
  })

  withDates.sort((a, b) => b.date - a.date)
  return path.join(DATA_DIR, withDates[0].file)
}

/** Read and parse a CSV file. Returns array of string arrays (rows). */
function readCSV(filePath: string): string[][] {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const result = Papa.parse<string[]>(raw, { header: false, skipEmptyLines: true })
  return result.data
}

/** Read and parse a CSV file with headers. Returns array of objects. */
function readCSVWithHeaders(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const result = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })
  return result.data
}

function sanitize(s: string | undefined | null): string {
  return (s ?? '').trim()
}

/** URL-encode a parameter value for deep links */
function encodeParam(s: string): string {
  return encodeURIComponent(s.trim())
}

/** Slugify an algorithm name for ?highlight= parameter */
function algoSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Map module directory names to route IDs */
const MODULE_DIR_TO_ID: Record<string, string> = {
  'Module1-Introduction': 'pqc-101',
  QuantumThreats: 'quantum-threats',
  HybridCrypto: 'hybrid-crypto',
  CryptoAgility: 'crypto-agility',
  TLSBasics: 'tls-basics',
  VPNSSHModule: 'vpn-ssh-pqc',
  EmailSigning: 'email-signing',
  PKIWorkshop: 'pki-workshop',
  KeyManagement: 'key-management',
  StatefulSignatures: 'stateful-signatures',
  DigitalAssets: 'digital-assets',
  FiveG: '5g-security',
  DigitalID: 'digital-id',
  Entropy: 'entropy-randomness',
  MerkleTreeCerts: 'merkle-tree-certs',
  QKD: 'qkd',
  APISecurityJWT: 'api-security-jwt',
  CodeSigning: 'code-signing',
  IoTOT: 'iot-ot-pqc',
}

// ---------------------------------------------------------------------------
// Source processors
// ---------------------------------------------------------------------------

function processGlossary(): RAGChunk[] {
  // glossaryData.ts exports a TS array — import it dynamically via tsx
  // Since tsx supports TS imports, we can use dynamic import
  const filePath = path.join(process.cwd(), 'src', 'data', 'glossaryData.ts')
  const raw = fs.readFileSync(filePath, 'utf-8')

  // Extract terms from the TS source using a simple regex approach
  // Each term is an object literal in the glossaryTerms array
  const chunks: RAGChunk[] = []

  // Use a line-by-line state machine (regex approach is fragile with complex strings)
  let currentTerm: Record<string, string> = {}
  let inObject = false
  let termIndex = 0

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()

    if (trimmed === '{' || (trimmed.startsWith('{') && !trimmed.includes('export'))) {
      inObject = true
      currentTerm = {}
      continue
    }

    if (trimmed === '},' || trimmed === '}') {
      if (inObject && currentTerm.term) {
        const content = [
          `Term: ${currentTerm.term}${currentTerm.acronym ? ` (${currentTerm.acronym})` : ''}`,
          `Definition: ${currentTerm.definition}`,
          currentTerm.technicalNote ? `Technical Note: ${currentTerm.technicalNote}` : '',
          `Category: ${currentTerm.category || 'concept'} | Complexity: ${currentTerm.complexity || 'beginner'}`,
        ]
          .filter(Boolean)
          .join('\n')

        chunks.push({
          id: `glossary-${termIndex++}`,
          source: 'glossary',
          title: currentTerm.term,
          content,
          category: currentTerm.category || 'concept',
          metadata: {
            acronym: currentTerm.acronym || '',
            complexity: currentTerm.complexity || 'beginner',
            relatedModule: currentTerm.relatedModule || '',
          },
          ...(currentTerm.relatedModule ? { deepLink: currentTerm.relatedModule } : {}),
        })
      }
      inObject = false
      continue
    }

    if (inObject) {
      // Parse key-value pairs from TS object literals
      const kvMatch = trimmed.match(/^(\w+):\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/)
      if (kvMatch) {
        const key = kvMatch[1]
        const value = (kvMatch[2] ?? kvMatch[3] ?? '').replace(/\\'/g, "'")
        currentTerm[key] = value
      }
    }
  }

  return chunks
}

function processTimeline(): RAGChunk[] {
  const file = findLatestCSV('timeline_')
  if (!file) return []

  const rows = readCSV(file)
  const chunks: RAGChunk[] = []

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 12) continue

    const [
      country,
      ,
      orgName,
      orgFullName,
      ,
      type,
      category,
      startYear,
      endYear,
      title,
      description,
      sourceUrl,
    ] = row

    const content = [
      `Country: ${sanitize(country)}`,
      `Organization: ${sanitize(orgFullName || orgName)}`,
      `Type: ${sanitize(type)} | Phase: ${sanitize(category)}`,
      `Period: ${sanitize(startYear)}–${sanitize(endYear)}`,
      `Title: ${sanitize(title)}`,
      `Description: ${sanitize(description)}`,
    ].join('\n')

    chunks.push({
      id: `timeline-${i}`,
      source: 'timeline',
      title: `${sanitize(country)} — ${sanitize(title)}`,
      content,
      category: sanitize(category),
      metadata: {
        country: sanitize(country),
        org: sanitize(orgName),
        sourceUrl: sanitize(sourceUrl),
      },
      deepLink: `/timeline?country=${encodeParam(country)}`,
    })
  }

  return chunks
}

function processLibrary(): RAGChunk[] {
  const file = findLatestCSV('library_')
  if (!file) return []

  const rows = readCSV(file)
  const chunks: RAGChunk[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 17) continue

    const [
      refId,
      title,
      url,
      pubDate,
      updateDate,
      docStatus,
      description,
      docType,
      industries,
      authors,
      ,
      regionScope,
      algorithmFamily,
      securityLevels,
      ,
      ,
      migrationUrgency,
    ] = row

    const content = [
      `Title: ${sanitize(title)}`,
      `Description: ${sanitize(description)}`,
      `Type: ${sanitize(docType)} | Status: ${sanitize(docStatus)}`,
      `Authors: ${sanitize(authors)}`,
      `Algorithm Family: ${sanitize(algorithmFamily)}`,
      `Security Levels: ${sanitize(securityLevels)}`,
      `Migration Urgency: ${sanitize(migrationUrgency)}`,
      `Industries: ${sanitize(industries)}`,
      `Region: ${sanitize(regionScope)}`,
      `Published: ${sanitize(pubDate)} | Updated: ${sanitize(updateDate)}`,
    ].join('\n')

    chunks.push({
      id: `library-${sanitize(refId) || i}`,
      source: 'library',
      title: sanitize(title),
      content,
      category: sanitize(docType),
      metadata: {
        referenceId: sanitize(refId),
        url: sanitize(url),
        algorithmFamily: sanitize(algorithmFamily),
      },
      ...(sanitize(refId) ? { deepLink: `/library?ref=${encodeParam(refId)}` } : {}),
    })
  }

  return chunks
}

function processAlgorithms(): RAGChunk[] {
  const file = findLatestCSV('pqc_complete_algorithm_reference_')
  if (!file) return []

  const rows = readCSV(file)
  const chunks: RAGChunk[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 15) continue

    const [
      family,
      name,
      securityLevel,
      aesEquiv,
      pubKeySize,
      privKeySize,
      sigCipherSize,
      sharedSecretSize,
      keyGenCycles,
      signEncapsCycles,
      verifyDecapsCycles,
      stackRam,
      optTarget,
      fipsStandard,
      useCaseNotes,
    ] = row

    const content = [
      `Algorithm: ${sanitize(name)}`,
      `Family: ${sanitize(family)}`,
      `Security Level: ${sanitize(securityLevel)} (AES equivalent: ${sanitize(aesEquiv)})`,
      `Public Key Size: ${sanitize(pubKeySize)} bytes | Private Key Size: ${sanitize(privKeySize)} bytes`,
      sanitize(sigCipherSize) ? `Signature/Ciphertext Size: ${sanitize(sigCipherSize)} bytes` : '',
      sanitize(sharedSecretSize) ? `Shared Secret Size: ${sanitize(sharedSecretSize)} bytes` : '',
      `Performance: KeyGen ${sanitize(keyGenCycles)}, Sign/Encaps ${sanitize(signEncapsCycles)}, Verify/Decaps ${sanitize(verifyDecapsCycles)} cycles`,
      sanitize(stackRam) ? `Stack RAM: ${sanitize(stackRam)} bytes` : '',
      `Optimization: ${sanitize(optTarget)}`,
      sanitize(fipsStandard) ? `FIPS Standard: ${sanitize(fipsStandard)}` : '',
      `Use Cases: ${sanitize(useCaseNotes)}`,
    ]
      .filter(Boolean)
      .join('\n')

    chunks.push({
      id: `algo-${
        sanitize(name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-') || i
      }`,
      source: 'algorithms',
      title: sanitize(name),
      content,
      category: sanitize(family),
      metadata: {
        family: sanitize(family),
        fipsStandard: sanitize(fipsStandard),
        securityLevel: sanitize(securityLevel),
      },
      deepLink: `/algorithms?highlight=${algoSlug(name)}`,
    })
  }

  return chunks
}

function processAlgorithmTransitions(): RAGChunk[] {
  const file = findLatestCSV('algorithms_transitions_')
  if (!file) return []

  const rows = readCSV(file)
  const chunks: RAGChunk[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 6) continue

    const [classical, keySize, pqc, func, deprecation, standardization] = row

    const content = [
      `Classical Algorithm: ${sanitize(classical)}${sanitize(keySize) ? ` (${sanitize(keySize)})` : ''}`,
      `PQC Replacement: ${sanitize(pqc)}`,
      `Function: ${sanitize(func)}`,
      `Deprecation Date: ${sanitize(deprecation)}`,
      `Standardization Date: ${sanitize(standardization)}`,
    ].join('\n')

    chunks.push({
      id: `transition-${i}`,
      source: 'transitions',
      title: `${sanitize(classical)} → ${sanitize(pqc)}`,
      content,
      category: sanitize(func),
      metadata: {
        classical: sanitize(classical),
        pqc: sanitize(pqc),
      },
      deepLink: `/algorithms?highlight=${algoSlug(classical)}`,
    })
  }

  return chunks
}

function processThreats(): RAGChunk[] {
  const file = findLatestCSV('quantum_threats_hsm_industries_')
  if (!file) return []

  const rows = readCSV(file)
  const chunks: RAGChunk[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 7) continue

    const [
      industry,
      threatId,
      description,
      criticality,
      cryptoAtRisk,
      pqcReplacement,
      mainSource,
      sourceUrl,
    ] = row

    const content = [
      `Industry: ${sanitize(industry)}`,
      `Threat: ${sanitize(description)}`,
      `Criticality: ${sanitize(criticality)}`,
      `Cryptography at Risk: ${sanitize(cryptoAtRisk)}`,
      `PQC Replacement: ${sanitize(pqcReplacement)}`,
      `Source: ${sanitize(mainSource)}`,
    ].join('\n')

    chunks.push({
      id: `threat-${sanitize(threatId) || i}`,
      source: 'threats',
      title: `${sanitize(industry)} — ${sanitize(description).slice(0, 80)}`,
      content,
      category: sanitize(criticality),
      metadata: {
        industry: sanitize(industry),
        threatId: sanitize(threatId),
        sourceUrl: sanitize(sourceUrl),
      },
      ...(sanitize(threatId)
        ? { deepLink: `/threats?id=${encodeParam(threatId)}&industry=${encodeParam(industry)}` }
        : {}),
    })
  }

  return chunks
}

function processCompliance(): RAGChunk[] {
  const file = findLatestCSV('compliance_')
  if (!file) return []

  const rows = readCSV(file)
  const chunks: RAGChunk[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 9) continue

    const [
      id,
      label,
      description,
      industries,
      countries,
      requiresPQC,
      deadline,
      notes,
      enforcementBody,
    ] = row

    const content = [
      `Framework: ${sanitize(label)}`,
      `Description: ${sanitize(description)}`,
      `Industries: ${sanitize(industries)}`,
      `Countries: ${sanitize(countries)}`,
      `Requires PQC: ${sanitize(requiresPQC)}`,
      `Deadline: ${sanitize(deadline)}`,
      `Enforcement Body: ${sanitize(enforcementBody)}`,
      sanitize(notes) ? `Notes: ${sanitize(notes)}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    chunks.push({
      id: `compliance-${sanitize(id) || i}`,
      source: 'compliance',
      title: sanitize(label),
      content,
      category: 'framework',
      metadata: {
        id: sanitize(id),
        deadline: sanitize(deadline),
        requiresPQC: sanitize(requiresPQC),
      },
      deepLink: `/compliance?q=${encodeParam(label)}`,
    })
  }

  return chunks
}

function processMigrateSoftware(): RAGChunk[] {
  const file = findLatestCSV('quantum_safe_cryptographic_software_reference_')
  if (!file) return []

  const records = readCSVWithHeaders(file)
  const chunks: RAGChunk[] = []

  for (let i = 0; i < records.length; i++) {
    const r = records[i]
    const name = sanitize(r.software_name)
    if (!name) continue

    const content = [
      `Software: ${name}`,
      `Category: ${sanitize(r.category_name)} (${sanitize(r.infrastructure_layer)})`,
      `PQC Support: ${sanitize(r.pqc_support)}`,
      `PQC Capabilities: ${sanitize(r.pqc_capability_description)}`,
      `FIPS Validated: ${sanitize(r.fips_validated)}`,
      `Migration Priority: ${sanitize(r.pqc_migration_priority)}`,
      `License: ${sanitize(r.license_type)} — ${sanitize(r.license)}`,
      `Version: ${sanitize(r.latest_version)} (${sanitize(r.release_date)})`,
      `Platforms: ${sanitize(r.primary_platforms)}`,
      `Industries: ${sanitize(r.target_industries)}`,
      sanitize(r.product_brief) ? `Brief: ${sanitize(r.product_brief)}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    chunks.push({
      id: `software-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      source: 'migrate',
      title: name,
      content,
      category: sanitize(r.infrastructure_layer),
      metadata: {
        categoryName: sanitize(r.category_name),
        fipsValidated: sanitize(r.fips_validated),
        repositoryUrl: sanitize(r.repository_url),
      },
      deepLink: `/migrate?q=${encodeParam(name)}`,
    })
  }

  return chunks
}

function processLeaders(): RAGChunk[] {
  const file = findLatestCSV('leaders_')
  if (!file) return []

  const rows = readCSV(file)
  const chunks: RAGChunk[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 7) continue

    const [name, country, role, organizations, type, category, contribution] = row

    const content = [
      `Name: ${sanitize(name)}`,
      `Country: ${sanitize(country)}`,
      `Role: ${sanitize(role)}`,
      `Organizations: ${sanitize(organizations)}`,
      `Type: ${sanitize(type)} | Category: ${sanitize(category)}`,
      `Contribution: ${sanitize(contribution)}`,
    ].join('\n')

    chunks.push({
      id: `leader-${i}`,
      source: 'leaders',
      title: sanitize(name),
      content,
      category: sanitize(category),
      metadata: {
        country: sanitize(country),
        type: sanitize(type),
      },
      deepLink: `/leaders?leader=${encodeParam(name)}`,
    })
  }

  return chunks
}

function processModules(): RAGChunk[] {
  // Read moduleData.ts directly — parse the MODULE_CATALOG entries
  const filePath = path.join(process.cwd(), 'src', 'components', 'PKILearning', 'moduleData.ts')
  const raw = fs.readFileSync(filePath, 'utf-8')

  const chunks: RAGChunk[] = []
  // Match module entries: 'module-id': { id: '...', title: '...', description: '...', duration: '...' }
  const moduleRegex =
    /['"]([^'"]+)['"]\s*:\s*\{\s*id:\s*['"]([^'"]+)['"]\s*,\s*title:\s*['"]([^'"]+)['"]\s*,\s*description:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*,\s*duration:\s*['"]([^'"]+)['"]/g

  let match
  while ((match = moduleRegex.exec(raw)) !== null) {
    const [, , id, title, desc1, desc2, duration] = match
    const description = (desc1 ?? desc2 ?? '').replace(/\\'/g, "'")

    if (id === 'quiz' || id === 'assess') continue // skip non-learning modules

    const content = [
      `Learning Module: ${title}`,
      `Description: ${description}`,
      `Duration: ${duration}`,
      `URL: /learn/${id}`,
    ].join('\n')

    chunks.push({
      id: `module-${id}`,
      source: 'modules',
      title,
      content,
      category: 'learning',
      metadata: { moduleId: id, duration },
      deepLink: `/learn/${id}`,
    })
  }

  return chunks
}

function processAuthoritativeSources(): RAGChunk[] {
  const file = findLatestCSV('pqc_authoritative_sources_reference_')
  if (!file) return []

  const rows = readCSV(file)
  const chunks: RAGChunk[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 5) continue

    const [sourceName, sourceType, region, primaryUrl, description] = row

    const content = [
      `Source: ${sanitize(sourceName)}`,
      `Type: ${sanitize(sourceType)}`,
      `Region: ${sanitize(region)}`,
      `Description: ${sanitize(description)}`,
      `URL: ${sanitize(primaryUrl)}`,
    ].join('\n')

    chunks.push({
      id: `source-${i}`,
      source: 'authoritative-sources',
      title: sanitize(sourceName),
      content,
      category: sanitize(sourceType),
      metadata: {
        region: sanitize(region),
        url: sanitize(primaryUrl),
      },
      ...(sanitize(primaryUrl) ? { deepLink: sanitize(primaryUrl) } : {}),
    })
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Module content extraction (TSX + TS data files)
// ---------------------------------------------------------------------------

const MODULES_DIR = path.join(process.cwd(), 'src', 'components', 'PKILearning', 'modules')

/** Strip JSX/HTML tags, React entities, and noise from TSX source to extract readable text */
function extractTextFromTSX(source: string): string[] {
  const texts: string[] = []

  // Strategy 1: Extract text content between JSX tags: >text content<
  const jsxTextRegex = />\s*\n?\s*((?:[^<{]|\{' '\}|&[a-z]+;)+)\s*</g
  let match
  while ((match = jsxTextRegex.exec(source)) !== null) {
    const text = match[1]
      .replace(/&apos;/g, "'")
      .replace(/&mdash;/g, '\u2014')
      .replace(/&ldquo;/g, '\u201C')
      .replace(/&rdquo;/g, '\u201D')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&ndash;/g, '\u2013')
      .replace(/&lsquo;/g, '\u2018')
      .replace(/&rsquo;/g, '\u2019')
      .replace(/\{' '\}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    // Skip code-like strings (React/TS fragments that leaked through)
    if (
      text.length >= 30 &&
      !/^(?:void|const|export|import|return|function|interface|type)\s/.test(text) &&
      !/React\.FC/.test(text) &&
      !/className[=]/.test(text)
    ) {
      texts.push(text)
    }
  }

  // Strategy 2: Extract string literals from TS object properties
  // Matches: description: 'long text...', title: "long text...", content: `long text...`
  const propStringRegex =
    /(?:description|title|content|observe|explanation|detail|note|summary|label|text|brief|tooltip|info)\s*:\s*(?:'((?:[^'\\]|\\.){30,})'|"((?:[^"\\]|\\.){30,})"|`((?:[^`\\]|\\.){30,})`)/g
  while ((match = propStringRegex.exec(source)) !== null) {
    const text = (match[1] ?? match[2] ?? match[3] ?? '')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text.length >= 30) texts.push(text)
  }

  // Deduplicate
  return [...new Set(texts)]
}

/** Extract string values from TS data/constants files */
function extractTextFromDataFile(source: string): string[] {
  const texts: string[] = []
  // Match any string property value >= 40 chars
  const stringPropRegex =
    /:\s*(?:'((?:[^'\\]|\\.){40,})'|"((?:[^"\\]|\\.){40,})"|`((?:[^`\\]|\\.){40,})`)/g
  let match
  while ((match = stringPropRegex.exec(source)) !== null) {
    const text = (match[1] ?? match[2] ?? match[3] ?? '')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\n/g, ' ')
      .replace(/\$\{[^}]+\}/g, '…')
      .replace(/\s+/g, ' ')
      .trim()
    if (text.length >= 40) texts.push(text)
  }
  return [...new Set(texts)]
}

/** Recursively find files matching a pattern in a directory */
function findFiles(dir: string, ext: string, exclude?: RegExp): string[] {
  if (!fs.existsSync(dir)) return []
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findFiles(full, ext, exclude))
    } else if (entry.name.endsWith(ext) && (!exclude || !exclude.test(entry.name))) {
      results.push(full)
    }
  }
  return results
}

/** Map directory names to human-readable module names */
const MODULE_NAME_MAP: Record<string, string> = {
  'Module1-Introduction': 'PQC 101',
  QuantumThreats: 'Quantum Threats',
  HybridCrypto: 'Hybrid Cryptography',
  CryptoAgility: 'Crypto Agility',
  TLSBasics: 'TLS Basics',
  VPNSSHModule: 'VPN & SSH PQC',
  EmailSigning: 'Email Signing',
  PKIWorkshop: 'PKI Workshop',
  KeyManagement: 'Key Management',
  StatefulSignatures: 'Stateful Signatures',
  DigitalAssets: 'Digital Assets',
  FiveG: '5G Security',
  DigitalID: 'Digital Identity',
  Entropy: 'Entropy & Randomness',
  MerkleTreeCerts: 'Merkle Tree Certificates',
  QKD: 'Quantum Key Distribution',
  APISecurityJWT: 'API Security & JWT',
  CodeSigning: 'Code Signing',
  IoTOT: 'IoT & OT Security',
}

function processModuleContent(): RAGChunk[] {
  if (!fs.existsSync(MODULES_DIR)) return []

  const chunks: RAGChunk[] = []
  const MAX_CHUNK_CHARS = 1500

  // Process each module directory
  const moduleDirs = fs
    .readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'Quiz')

  for (const moduleDir of moduleDirs) {
    const modulePath = path.join(MODULES_DIR, moduleDir.name)
    const moduleName = MODULE_NAME_MAP[moduleDir.name] ?? moduleDir.name

    // Process TSX files (excluding tests)
    const tsxFiles = findFiles(modulePath, '.tsx', /\.test\.tsx$/)
    for (const file of tsxFiles) {
      const source = fs.readFileSync(file, 'utf-8')
      const texts = extractTextFromTSX(source)
      if (texts.length === 0) continue

      const componentName = path.basename(file, '.tsx')
      const relativePath = path.relative(MODULES_DIR, file)

      // Chunk the extracted texts into groups of ~MAX_CHUNK_CHARS
      let currentChunk: string[] = []
      let currentLen = 0
      let chunkIdx = 0

      const flushChunk = () => {
        if (currentChunk.length === 0) return
        const content = currentChunk.join('\n')
        chunks.push({
          id: `mc-${moduleDir.name}-${componentName}-${chunkIdx}`.toLowerCase(),
          source: 'module-content',
          title: `${moduleName} — ${componentName}`,
          content: `Module: ${moduleName}\nComponent: ${componentName}\n\n${content}`,
          category: 'learning',
          metadata: {
            module: moduleDir.name,
            component: componentName,
            filePath: relativePath,
          },

          ...(MODULE_DIR_TO_ID[moduleDir.name]
            ? { deepLink: `/learn/${MODULE_DIR_TO_ID[moduleDir.name]}` }
            : {}),
        })
        chunkIdx++
        currentChunk = []
        currentLen = 0
      }

      for (const text of texts) {
        if (currentLen + text.length > MAX_CHUNK_CHARS && currentChunk.length > 0) {
          flushChunk()
        }
        currentChunk.push(text)
        currentLen += text.length
      }
      flushChunk()
    }

    // Process TS data/constants files (not service/util/hook files)
    const dataPatterns = [
      /constants?\.ts$/,
      /data\/.*\.ts$/,
      /algorithmConfig\.ts$/,
      /Vulnerabilities\.ts$/,
      /Deployments\.ts$/,
      /architecturePatterns\.ts$/,
      /cbomTemplates\.ts$/,
      /hsmVendorData\.ts$/,
      /protocolSizeComparisons\.ts$/,
      /entropyConstants\.ts$/,
      /quantumConstants\.ts$/,
      /mtcConstants\.ts$/,
    ]
    const tsFiles = findFiles(modulePath, '.ts', /\.test\.ts$/)
    for (const file of tsFiles) {
      const basename = path.basename(file)
      const relativeTsPath = path.relative(modulePath, file)
      const isDataFile = dataPatterns.some((p) => p.test(relativeTsPath) || p.test(basename))
      if (!isDataFile) continue

      const source = fs.readFileSync(file, 'utf-8')
      const texts = extractTextFromDataFile(source)
      if (texts.length === 0) continue

      const dataName = path.basename(file, '.ts')
      const content = texts.join('\n')

      chunks.push({
        id: `mc-data-${moduleDir.name}-${dataName}`.toLowerCase(),
        source: 'module-content',
        title: `${moduleName} — ${dataName} (data)`,
        content: `Module: ${moduleName}\nData: ${dataName}\n\n${content}`,
        category: 'learning',
        metadata: {
          module: moduleDir.name,
          component: dataName,
          filePath: path.relative(MODULES_DIR, file),
        },

        ...(MODULE_DIR_TO_ID[moduleDir.name]
          ? { deepLink: `/learn/${MODULE_DIR_TO_ID[moduleDir.name]}` }
          : {}),
      })
    }
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Markdown documents
// ---------------------------------------------------------------------------

function processMarkdownDocs(): RAGChunk[] {
  const chunks: RAGChunk[] = []

  // Markdown files in src/data/
  const mdFiles = [
    path.join(DATA_DIR, 'PQC_Software_Category_Strategic_Analysis.md'),
    path.join(DATA_DIR, 'quantum_safe_software_comprehensive_guide.md'),
    path.join(DATA_DIR, 'security_audit_report_12022025.md'),
  ]

  // X.509 profile docs
  const x509Dir = path.join(DATA_DIR, 'x509_profiles')
  if (fs.existsSync(x509Dir)) {
    const x509Files = fs
      .readdirSync(x509Dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => path.join(x509Dir, f))
    mdFiles.push(...x509Files)
  }

  for (const filePath of mdFiles) {
    if (!fs.existsSync(filePath)) continue

    const raw = fs.readFileSync(filePath, 'utf-8')
    const fileName = path.basename(filePath, '.md')

    // Split by ## headings into sections
    const sections = raw.split(/^##\s+/m)

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim()
      if (!section || section.length < 50) continue

      // First section may have # title
      const lines = section.split('\n')
      let sectionTitle = lines[0].replace(/^#+\s*/, '').trim()
      const body = lines.slice(1).join('\n').trim()

      // For first section without ## heading, use filename
      if (i === 0 && !sectionTitle) {
        sectionTitle = fileName.replace(/[_-]/g, ' ')
      }

      const content = body || section

      chunks.push({
        id: `doc-${fileName}-${i}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        source: 'documentation',
        title: sectionTitle,
        content: `Document: ${fileName}\nSection: ${sectionTitle}\n\n${content.slice(0, 2000)}`,
        category: 'documentation',
        metadata: {
          fileName,
          filePath: path.relative(process.cwd(), filePath),
        },
      })
    }
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Quiz questions
// ---------------------------------------------------------------------------

function processQuizQuestions(): RAGChunk[] {
  const file = findLatestCSV('pqcquiz_')
  if (!file) return []

  const records = readCSVWithHeaders(file)
  const chunks: RAGChunk[] = []

  // Group questions by category
  const byCategory = new Map<string, typeof records>()
  for (const r of records) {
    const cat = sanitize(r.category) || 'general'
    const existing = byCategory.get(cat) ?? []
    existing.push(r)
    byCategory.set(cat, existing)
  }

  const CATEGORY_LABELS: Record<string, string> = {
    'pqc-fundamentals': 'PQC Fundamentals',
    'algorithm-families': 'Algorithm Families',
    'ml-kem': 'ML-KEM',
    'ml-dsa': 'ML-DSA',
    'slh-dsa': 'SLH-DSA',
    'fn-dsa': 'FN-DSA',
    'hybrid-cryptography': 'Hybrid Cryptography',
    'crypto-agility': 'Crypto Agility',
    'tls-pqc': 'TLS & PQC',
    'vpn-ssh': 'VPN & SSH',
    'email-signing': 'Email Signing',
    'pki-certificates': 'PKI & Certificates',
    'key-management': 'Key Management',
    'stateful-signatures': 'Stateful Signatures',
    'digital-assets': 'Digital Assets',
    '5g-security': '5G Security',
    'digital-identity': 'Digital Identity',
    'entropy-randomness': 'Entropy & Randomness',
    'merkle-tree-certs': 'Merkle Tree Certificates',
    qkd: 'Quantum Key Distribution',
    'api-security-jwt': 'API Security & JWT',
    'code-signing': 'Code Signing',
    'iot-ot': 'IoT & OT Security',
    'migration-strategy': 'Migration Strategy',
  }

  for (const [category, questions] of byCategory) {
    const label = CATEGORY_LABELS[category] ?? category
    const MAX_PER_CHUNK = 1800

    let currentContent: string[] = []
    let currentLen = 0
    let chunkIdx = 0

    const flushChunk = () => {
      if (currentContent.length === 0) return
      chunks.push({
        id: `quiz-${category}-${chunkIdx}`,
        source: 'quiz',
        title: `Quiz: ${label}`,
        content: `Quiz Category: ${label}\n\n${currentContent.join('\n\n')}`,
        category: 'quiz',
        metadata: {
          quizCategory: category,
          questionCount: String(currentContent.length),
        },
        deepLink: '/learn/quiz',
      })
      chunkIdx++
      currentContent = []
      currentLen = 0
    }

    for (const q of questions) {
      const parts: string[] = [`Q: ${sanitize(q.question)}`]

      // Add options for multiple-choice
      if (sanitize(q.type) !== 'true-false') {
        if (sanitize(q.option_a)) parts.push(`  A) ${sanitize(q.option_a)}`)
        if (sanitize(q.option_b)) parts.push(`  B) ${sanitize(q.option_b)}`)
        if (sanitize(q.option_c)) parts.push(`  C) ${sanitize(q.option_c)}`)
        if (sanitize(q.option_d)) parts.push(`  D) ${sanitize(q.option_d)}`)
      }

      const answer = sanitize(q.correct_answer).toUpperCase()
      parts.push(`Answer: ${answer}`)
      if (sanitize(q.explanation)) {
        parts.push(`Explanation: ${sanitize(q.explanation)}`)
      }

      const entry = parts.join('\n')

      if (currentLen + entry.length > MAX_PER_CHUNK && currentContent.length > 0) {
        flushChunk()
      }
      currentContent.push(entry)
      currentLen += entry.length
    }
    flushChunk()
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Assessment configuration
// ---------------------------------------------------------------------------

function processAssessmentConfig(): RAGChunk[] {
  const file = findLatestCSV('pqcassessment_')
  if (!file) return []

  const records = readCSVWithHeaders(file)
  const chunks: RAGChunk[] = []

  // Group by category
  const byCategory = new Map<string, typeof records>()
  for (const r of records) {
    const cat = sanitize(r.category) || 'general'
    const existing = byCategory.get(cat) ?? []
    existing.push(r)
    byCategory.set(cat, existing)
  }

  for (const [category, items] of byCategory) {
    const rows = items.map((r) => {
      const parts = [`- ${sanitize(r.label)}: ${sanitize(r.description)}`]
      if (sanitize(r.industries)) parts.push(`  Industries: ${sanitize(r.industries)}`)
      if (sanitize(r.hndl_relevance)) parts.push(`  HNDL Relevance: ${sanitize(r.hndl_relevance)}`)
      if (sanitize(r.migration_priority))
        parts.push(`  Migration Priority: ${sanitize(r.migration_priority)}`)
      if (sanitize(r.retention_years))
        parts.push(`  Retention: ${sanitize(r.retention_years)} years`)
      if (sanitize(r.compliance_deadline))
        parts.push(`  Deadline: ${sanitize(r.compliance_deadline)}`)
      if (sanitize(r.compliance_notes)) parts.push(`  Notes: ${sanitize(r.compliance_notes)}`)
      return parts.join('\n')
    })

    chunks.push({
      id: `assess-${category}`,
      source: 'assessment',
      title: `Assessment: ${category.replace(/_/g, ' ')}`,
      content: `Assessment Category: ${category.replace(/_/g, ' ')}\n\n${rows.join('\n\n')}`,
      category: 'assessment',
      metadata: {
        assessCategory: category,
        itemCount: String(items.length),
      },
      deepLink: '/assess',
    })
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Priority matrix (migration gap analysis)
// ---------------------------------------------------------------------------

function processPriorityMatrix(): RAGChunk[] {
  const filePath = path.join(DATA_DIR, 'pqc_software_category_priority_matrix.csv')
  if (!fs.existsSync(filePath)) return []

  const records = readCSVWithHeaders(filePath)
  const chunks: RAGChunk[] = []

  // Group by priority level
  const byPriority = new Map<string, typeof records>()
  for (const r of records) {
    const priority = sanitize(r.pqc_priority) || 'Unknown'
    const existing = byPriority.get(priority) ?? []
    existing.push(r)
    byPriority.set(priority, existing)
  }

  for (const [priority, items] of byPriority) {
    const rows = items.map((r) =>
      [
        `- ${sanitize(r.category_name)} (${sanitize(r.category_id)})`,
        `  Readiness: ${sanitize(r.readiness_percentage)}% (${sanitize(r.pqc_ready_products)}/${sanitize(r.total_software_products)} products)`,
        `  Urgency Score: ${sanitize(r.urgency_score)}/100 | Timeline Pressure: ${sanitize(r.timeline_pressure)}`,
        `  Recommended Action: ${sanitize(r.recommended_action_timeline)}`,
        `  Industries: ${sanitize(r.industries_affected)}`,
      ].join('\n')
    )

    chunks.push({
      id: `priority-${priority.toLowerCase()}`,
      source: 'priority-matrix',
      title: `Migration Priority: ${priority}`,
      content: `PQC Migration Priority: ${priority}\n\n${rows.join('\n\n')}`,
      category: 'migration',
      metadata: {
        priorityLevel: priority,
        categoryCount: String(items.length),
      },
      deepLink: '/migrate',
    })
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Certification cross-references
// ---------------------------------------------------------------------------

function processCertificationXref(): RAGChunk[] {
  const file = findLatestCSV('migrate_certification_xref_')
  if (!file) return []

  const records = readCSVWithHeaders(file)
  const chunks: RAGChunk[] = []

  // Group by cert_type
  const byType = new Map<string, typeof records>()
  for (const r of records) {
    const certType = sanitize(r.cert_type) || 'Other'
    const existing = byType.get(certType) ?? []
    existing.push(r)
    byType.set(certType, existing)
  }

  for (const [certType, certs] of byType) {
    const rows = certs.map((r) =>
      [
        `- ${sanitize(r.software_name)}`,
        `  Cert ID: ${sanitize(r.cert_id)} | Vendor: ${sanitize(r.cert_vendor)}`,
        `  Product: ${sanitize(r.cert_product)}`,
        `  PQC Algorithms: ${sanitize(r.pqc_algorithms)}`,
        sanitize(r.certification_level) ? `  Level: ${sanitize(r.certification_level)}` : '',
        `  Status: ${sanitize(r.status)} | Date: ${sanitize(r.cert_date)}`,
      ]
        .filter(Boolean)
        .join('\n')
    )

    // Use first cert_id for deep link (certifications are grouped by type)
    const firstCertId = sanitize(certs[0]?.cert_id)
    chunks.push({
      id: `cert-${certType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      source: 'certifications',
      title: `PQC Certifications: ${certType}`,
      content: `Certification Type: ${certType}\n\n${rows.join('\n\n')}`,
      category: 'certification',
      metadata: {
        certType,
        certCount: String(certs.length),
      },
      ...(firstCertId ? { deepLink: `/compliance?cert=${encodeParam(firstCertId)}` } : {}),
    })
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('🔍 Generating RAG corpus...\n')

  const processors = [
    { name: 'Glossary', fn: processGlossary },
    { name: 'Timeline', fn: processTimeline },
    { name: 'Library', fn: processLibrary },
    { name: 'Algorithms', fn: processAlgorithms },
    { name: 'Algorithm Transitions', fn: processAlgorithmTransitions },
    { name: 'Threats', fn: processThreats },
    { name: 'Compliance', fn: processCompliance },
    { name: 'Migrate Software', fn: processMigrateSoftware },
    { name: 'Leaders', fn: processLeaders },
    { name: 'Learning Modules', fn: processModules },
    { name: 'Module Content', fn: processModuleContent },
    { name: 'Authoritative Sources', fn: processAuthoritativeSources },
    { name: 'Documentation', fn: processMarkdownDocs },
    { name: 'Quiz Questions', fn: processQuizQuestions },
    { name: 'Assessment Config', fn: processAssessmentConfig },
    { name: 'Priority Matrix', fn: processPriorityMatrix },
    { name: 'Certification Xref', fn: processCertificationXref },
  ]

  const corpus: RAGChunk[] = []

  for (const { name, fn } of processors) {
    try {
      const chunks = fn()
      console.log(`  ✓ ${name}: ${chunks.length} chunks`)
      corpus.push(...chunks)
    } catch (err) {
      console.error(`  ✗ ${name}: failed —`, err)
    }
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(corpus), 'utf-8')

  const sizeKB = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)
  console.log(`\n✅ Corpus generated: ${corpus.length} chunks (${sizeKB} KB)`)
  console.log(`   Output: ${OUTPUT_FILE}`)
}

main()
