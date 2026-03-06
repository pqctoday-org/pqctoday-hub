// SPDX-License-Identifier: GPL-3.0-only
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

/** Find the latest versioned CSV file matching a prefix pattern.
 *  Handles revision suffixes: prefix_MMDDYYYY.csv, prefix_MMDDYYYY_r1.csv, etc.
 *  Sorts by date first, then revision (higher revision wins within same date). */
function findLatestCSV(prefix: string): string | null {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))

  if (files.length === 0) return null

  const withDates = files.map((f) => {
    const match = f.match(/(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
    if (!match) return { file: f, date: 0, rev: 0 }
    const [, mm, dd, yyyy, rev] = match
    return { file: f, date: parseInt(yyyy + mm + dd), rev: rev ? parseInt(rev) : 0 }
  })

  withDates.sort((a, b) => b.date - a.date || b.rev - a.rev)
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

export function sanitize(s: string | undefined | null): string {
  return (s ?? '').trim()
}

/** URL-encode a parameter value for deep links */
export function encodeParam(s: string): string {
  return encodeURIComponent(s.trim())
}

/** Slugify an algorithm name for ?highlight= parameter */
export function algoSlug(name: string): string {
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
  PQCRiskManagement: 'pqc-risk-management',
  PQCBusinessCase: 'pqc-business-case',
  PQCGovernance: 'pqc-governance',
  ComplianceStrategy: 'compliance-strategy',
  MigrationProgram: 'migration-program',
  VendorRisk: 'vendor-risk',
  DataAssetSensitivity: 'data-asset-sensitivity',
  KmsPqc: 'kms-pqc',
  HsmPqc: 'hsm-pqc',
}

// ---------------------------------------------------------------------------
// Source processors
// ---------------------------------------------------------------------------

async function processGlossary(): Promise<RAGChunk[]> {
  // Dynamic import via tsx — avoids fragile regex parsing of multi-line TS values
  const { glossaryTerms } = await import('../src/data/glossaryData')

  return glossaryTerms.map(
    (
      term: {
        term: string
        acronym?: string
        definition: string
        technicalNote?: string
        relatedModule?: string
        complexity: string
        category: string
      },
      i: number
    ) => {
      const content = [
        `Term: ${term.term}${term.acronym ? ` (${term.acronym})` : ''}`,
        `Definition: ${term.definition}`,
        term.technicalNote ? `Technical Note: ${term.technicalNote}` : '',
        `Category: ${term.category} | Complexity: ${term.complexity}`,
      ]
        .filter(Boolean)
        .join('\n')

      return {
        id: `glossary-${i}`,
        source: 'glossary',
        title: term.term,
        content,
        category: term.category || 'concept',
        metadata: {
          acronym: term.acronym || '',
          complexity: term.complexity || 'beginner',
          relatedModule: term.relatedModule || '',
        },
        ...(term.relatedModule ? { deepLink: term.relatedModule } : {}),
      } as RAGChunk
    }
  )
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

  // Load merged enrichment fields once for all library documents
  const enrichLookup = loadEnrichmentFields('library')

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

    const contentLines = [
      `Reference: ${sanitize(refId)}`,
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
    ]

    // Augment with LLM-extracted enrichment dimensions when available
    const enrich = enrichLookup.get(refId) ?? enrichLookup.get(sanitize(refId))
    if (enrich) {
      const skip = new Set(['None detected', 'Not specified', 'See document for details.'])
      const enrichLines: string[] = []
      const enrichFieldOrder: [string, string][] = [
        ['Main Topic', 'Main Topic'],
        ['PQC Algorithms Covered', 'PQC Algorithms'],
        ['Quantum Threats Addressed', 'Quantum Threats'],
        ['Protocols Covered', 'Protocols'],
        ['Infrastructure Layers', 'Infrastructure Layers'],
        ['Standardization Bodies', 'Standardization Bodies'],
        ['Compliance Frameworks Referenced', 'Compliance Frameworks'],
        ['Migration Timeline Info', 'Migration Timeline'],
        ['Applicable Regions / Bodies', 'Regions / Bodies'],
        ['PQC Products Mentioned', 'PQC Products'],
        ['Leaders Contributions Mentioned', 'Leaders'],
      ]
      for (const [mdKey, label] of enrichFieldOrder) {
        const val = enrich[mdKey]
        if (val && !skip.has(val)) enrichLines.push(`${label}: ${val}`)
      }
      if (enrichLines.length > 0) {
        contentLines.push('', ...enrichLines)
      }
    }

    chunks.push({
      id: `library-${sanitize(refId) || i}`,
      source: 'library',
      title: sanitize(title),
      content: contentLines.join('\n'),
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
  // Match module entries: 'module-id': { ... } or module-id: { ... } (unquoted keys are valid JS)
  const moduleRegex =
    /(?:['"]([^'"]+)['"]|([\w-]+))\s*:\s*\{\s*id:\s*['"]([^'"]+)['"]\s*,\s*title:\s*['"]([^'"]+)['"]\s*,\s*description:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*,\s*duration:\s*['"]([^'"]+)['"]/g

  let match
  while ((match = moduleRegex.exec(raw)) !== null) {
    const [, , , id, title, desc1, desc2, duration] = match
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
export function extractTextFromTSX(source: string): string[] {
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
      text.length >= 60 &&
      !/^(?:void|const|export|import|return|function|interface|type)\s/.test(text) &&
      !/React\.FC/.test(text) &&
      !/className[=]/.test(text) &&
      !/useRef|useState|useEffect|useCallback|useMemo/.test(text) &&
      !/^\)/.test(text) &&
      !/\?\s*[('"]/.test(text) &&
      !/===\s*\w+\.length/.test(text) &&
      !/border-\w+\s+bg-/.test(text)
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

  // Deduplicate and filter short fragments with insufficient real words
  return [...new Set(texts)].filter((t) => {
    if (t.length >= 120) return true
    // For shorter texts, require at least 3 real words (4+ chars each)
    const realWords = t.split(/\s+/).filter((w) => w.replace(/[^a-zA-Z]/g, '').length >= 4)
    return realWords.length >= 3
  })
}

/** Extract string values from TS data/constants files */
export function extractTextFromDataFile(source: string): string[] {
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
  PQCRiskManagement: 'PQC Risk Management',
  PQCBusinessCase: 'PQC Business Case',
  PQCGovernance: 'PQC Governance & Policy',
  ComplianceStrategy: 'Compliance & Regulatory Strategy',
  MigrationProgram: 'Migration Program Management',
  VendorRisk: 'Vendor & Supply Chain Risk',
  DataAssetSensitivity: 'Data & Asset Sensitivity',
  KmsPqc: 'KMS & PQC Key Management',
  HsmPqc: 'HSM & PQC Operations',
}

/**
 * Process rag-summary.md files from each module directory.
 * These are purpose-built educational summaries optimized for RAG retrieval,
 * providing cleaner context than TSX extraction.
 */
function processModuleRAGSummaries(): RAGChunk[] {
  if (!fs.existsSync(MODULES_DIR)) return []

  const chunks: RAGChunk[] = []
  const moduleDirs = fs
    .readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'Quiz')

  for (const moduleDir of moduleDirs) {
    const summaryPath = path.join(MODULES_DIR, moduleDir.name, 'rag-summary.md')
    if (!fs.existsSync(summaryPath)) continue

    const content = fs.readFileSync(summaryPath, 'utf-8').trim()
    if (!content) continue

    const moduleId = MODULE_DIR_TO_ID[moduleDir.name]
    const moduleName = MODULE_NAME_MAP[moduleDir.name] ?? moduleDir.name

    // Extract title from first heading or use module name
    const titleMatch = content.match(/^#\s+(.+)/m)
    const title = titleMatch ? titleMatch[1].trim() : `${moduleName} — Overview`

    chunks.push({
      id: `module-summary-${moduleId ?? moduleDir.name.toLowerCase()}`,
      source: 'module-summaries',
      title,
      content,
      category: 'learning-module',
      metadata: {
        moduleId: moduleId ?? '',
        moduleName,
      },
      ...(moduleId ? { deepLink: `/learn/${moduleId}` } : {}),
    } as RAGChunk)
  }

  return chunks
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

      // Detect workshop-related components for deep-link targeting
      const isWorkshop =
        relativePath.includes('/workshop/') ||
        /Workshop|Simulator|Generator|Analyzer|Calculator|Flow|Handshake|Negotiation/i.test(
          componentName
        )
      const moduleId = MODULE_DIR_TO_ID[moduleDir.name]
      const workshopDeepLink = moduleId
        ? isWorkshop
          ? `/learn/${moduleId}?tab=workshop`
          : `/learn/${moduleId}`
        : undefined

      // Chunk the extracted texts into groups of ~MAX_CHUNK_CHARS
      let currentChunk: string[] = []
      let currentLen = 0
      let chunkIdx = 0

      const flushChunk = () => {
        if (currentChunk.length === 0) return
        const content = currentChunk.join('\n')
        // Skip undersized chunks — they're typically caption fragments or template vars
        if (content.length < 200) return
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

          ...(workshopDeepLink ? { deepLink: workshopDeepLink } : {}),
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
      const MAX_DATA_CHUNK_CHARS = 3000
      let content = texts.join('\n')
      if (content.length > MAX_DATA_CHUNK_CHARS) {
        content = content.slice(0, MAX_DATA_CHUNK_CHARS) + '\n...(truncated)'
      }

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
  // Note: quantum_safe_software_comprehensive_guide.md is intentionally excluded —
  // its product data is already in the migrate catalog CSV (better structured) and its
  // generic PQC education sections duplicate modules/algorithms corpus sources. Including
  // it caused the model to reference "Conclusion section" as if /migrate is a doc viewer.
  const mdFiles = [
    path.join(DATA_DIR, 'PQC_Software_Category_Strategic_Analysis.md'),
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

  const deepLinkByFile: Record<string, string> = {
    PQC_Software_Category_Strategic_Analysis: '/migrate',
    security_audit_report_12022025: '/library',
    '3GPP_TS_33.310_NDS_AF_Certificate_Overview': '/library',
    CAB_Forum_TLS_Baseline_Requirements_Overview: '/library',
    'ETSI_EN_319_412-2_Certificate_Overview': '/library',
    X509_Profile_Review_Report: '/library',
  }

  for (const filePath of mdFiles) {
    if (!fs.existsSync(filePath)) continue

    const raw = fs.readFileSync(filePath, 'utf-8')
    const fileName = path.basename(filePath, '.md')
    const deepLink = deepLinkByFile[fileName]

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
        ...(deepLink ? { deepLink } : {}),
      })
    }
  }

  return chunks
}

// ---------------------------------------------------------------------------
// NotebookLM app-guide docs — unique content not covered by other processors
// ---------------------------------------------------------------------------

function processNotebookLM(): RAGChunk[] {
  const chunks: RAGChunk[] = []
  const notebookDir = path.join(process.cwd(), 'notebooklm')
  if (!fs.existsSync(notebookDir)) return []

  // Only files with genuinely unique content not already indexed by other processors.
  // Mirror files (03-11) are excluded — their data is covered by CSV processors.
  // File 12 is excluded — processChangelog() reads CHANGELOG.md directly.
  // File 01 is excluded — processPageGuides() covers it sufficiently.
  const FILES: Array<{ file: string; deepLink: string; slug: string }> = [
    { file: '02-app-architecture.md', deepLink: '/about', slug: 'arch' },
    { file: '13-chatbot-assistant.md', deepLink: '/', slug: 'assistant' },
    { file: '14-personalization.md', deepLink: '/', slug: 'personalization' },
    { file: '15-community.md', deepLink: '/about', slug: 'community' },
  ]

  for (const { file, deepLink, slug } of FILES) {
    const filePath = path.join(notebookDir, file)
    if (!fs.existsSync(filePath)) continue

    const raw = fs.readFileSync(filePath, 'utf-8')
    const sections = raw.split(/^##\s+/m)

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim()
      if (!section || section.length < 50) continue

      const lines = section.split('\n')
      let sectionTitle = lines[0].replace(/^#+\s*/, '').trim()
      const body = lines.slice(1).join('\n').trim()
      if (!sectionTitle) sectionTitle = file.replace(/[_-]/g, ' ').replace('.md', '')

      const content = (body || section).slice(0, 2000)

      chunks.push({
        id: `notebooklm-${slug}-${i}`,
        source: 'app-guide',
        title: sectionTitle,
        content: `${sectionTitle}\n\n${content}`,
        category: 'app-guide',
        metadata: { fileName: file, slug },
        deepLink,
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
    'data-asset-sensitivity': 'Data & Asset Sensitivity',
    'kms-pqc': 'KMS & PQC Key Management',
    'hsm-pqc': 'HSM & PQC Operations',
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
        deepLink: `/learn/quiz?category=${category}`,
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
// Assessment guide (step-by-step wizard explanation)
// ---------------------------------------------------------------------------

function processAssessmentGuide(): RAGChunk[] {
  const steps: Array<{ id: string; title: string; content: string; step: number }> = [
    {
      id: 'industry',
      title: 'Industry Selection',
      step: 0,
      content:
        'The Industry Selection step determines which compliance frameworks, threat scenarios, and migration priorities are relevant to your organization. Different industries face varying levels of quantum risk — for example, Financial Services and Government/Defense face the highest urgency due to long-lived data and regulatory mandates.',
    },
    {
      id: 'country',
      title: 'Country Selection',
      step: 1,
      content:
        'The Country Selection step identifies which national PQC mandates and deadlines apply. Countries like the United States (CNSA 2.0), France (ANSSI), and Germany (BSI) have specific PQC migration timelines. This selection also filters compliance frameworks to show only relevant regulations.',
    },
    {
      id: 'crypto',
      title: 'Current Cryptographic Usage',
      step: 2,
      content:
        'The Current Cryptographic Usage step identifies which classical algorithms your organization uses (RSA, ECDSA, ECDH, AES, SHA-2, etc.). This determines which PQC replacements are needed — RSA/ECDSA require ML-DSA or SLH-DSA for signatures, while ECDH requires ML-KEM for key exchange.',
    },
    {
      id: 'sensitivity',
      title: 'Data Sensitivity',
      step: 3,
      content:
        'Data Sensitivity drives urgency assessment. Organizations handling Top Secret, classified, financial, or health data face higher HNDL (Harvest Now, Decrypt Later) risk because adversaries may already be collecting encrypted data for future quantum decryption. Multiple sensitivity levels can be selected — the highest level determines the risk score.',
    },
    {
      id: 'compliance',
      title: 'Compliance Frameworks',
      step: 4,
      content:
        'The Compliance step identifies which regulatory frameworks apply to your organization (CNSA 2.0, NIST guidelines, ANSSI requirements, BSI recommendations, etc.). Frameworks are filtered by your selected industry and country. Each framework has different PQC adoption deadlines and requirements.',
    },
    {
      id: 'migration',
      title: 'Migration Status',
      step: 5,
      content:
        'The Migration Status step assesses how far along your organization is in the PQC transition: Not Started, Planning, Pilot/Testing, Partial Deployment, or Fully Migrated. Organizations in earlier stages receive higher urgency scores to encourage action.',
    },
    {
      id: 'use-cases',
      title: 'Use Cases',
      step: 6,
      content:
        'The Use Cases step identifies specific cryptographic applications in your organization: TLS/HTTPS, VPN/IPsec, email signing, code signing, PKI/certificates, IoT device authentication, database encryption, etc. Each use case maps to specific PQC algorithms and migration complexity.',
    },
    {
      id: 'retention',
      title: 'Data Retention',
      step: 7,
      content:
        'Data Retention periods directly impact HNDL risk exposure. Data that must remain confidential for 10+ years (e.g., health records, state secrets, financial archives) faces the highest quantum threat since quantum computers could decrypt it within its retention window. Multiple retention levels can be selected.',
    },
    {
      id: 'credential-lifetime',
      title: 'Credential Lifetime',
      step: 8,
      content:
        'The Credential Lifetime step assesses how long cryptographic credentials (certificates, keys, tokens) must remain valid in your organization. Long-lived credentials (5+ years) face elevated HNDL/HNFL risk — a certificate valid through 2030 may need to remain trustworthy even after a CRQC arrives. This step drives urgency for PKI migration, code signing transitions, and certificate authority upgrades.',
    },
    {
      id: 'scale',
      title: 'Organization Scale',
      step: 9,
      content:
        'Organization Scale affects migration complexity and timeline. Large enterprises with thousands of endpoints, multiple data centers, and complex supply chains require longer migration timelines and more comprehensive crypto-agility frameworks than smaller organizations.',
    },
    {
      id: 'agility',
      title: 'Crypto Agility',
      step: 10,
      content:
        "Crypto Agility measures your organization's ability to quickly swap cryptographic algorithms. Organizations with centralized key management, automated certificate rotation, and modular crypto libraries can migrate faster. Low agility increases migration risk and timeline.",
    },
    {
      id: 'infrastructure',
      title: 'Infrastructure Assessment',
      step: 11,
      content:
        'The Infrastructure step evaluates which systems need PQC upgrades: HSMs, load balancers, firewalls, certificate authorities, databases, cloud services, IoT devices. Hardware-bound systems (HSMs, embedded devices) require longer migration timelines due to firmware/hardware replacement cycles.',
    },
    {
      id: 'vendors',
      title: 'Vendor Dependencies',
      step: 12,
      content:
        'Vendor Dependencies identifies third-party products and services in your cryptographic supply chain. Organizations dependent on vendor timelines for PQC support face additional risk. The Migrate Catalog can help identify PQC-ready alternatives.',
    },
    {
      id: 'timeline',
      title: 'Target Timeline',
      step: 13,
      content:
        "The Target Timeline step sets your organization's PQC migration deadline based on regulatory requirements, risk tolerance, and industry benchmarks. Country-aligned options show relevant national deadlines (e.g., CNSA 2.0 2030/2033 milestones, ANSSI 2025 hybrid requirement).",
    },
  ]

  return steps.map((s) => ({
    id: `assess-guide-${s.id}`,
    source: 'assessment',
    title: `Assessment: ${s.title}`,
    content: `PQC Assessment Wizard — Step ${s.step + 1}: ${s.title}\n\n${s.content}`,
    category: 'assessment-guide',
    metadata: { step: String(s.step), stepName: s.id },
    deepLink: `/assess?step=${s.step}`,
  }))
}

// ---------------------------------------------------------------------------
// Getting started guides
// ---------------------------------------------------------------------------

function processGettingStarted(): RAGChunk[] {
  return [
    {
      id: 'getting-started-developers',
      source: 'documentation',
      title: 'Getting Started for Developers',
      content:
        'Getting Started with PQC for Developers\n\nStart with the PQC 101 module to understand the quantum threat and why migration matters. Then explore ML-KEM key generation in the Playground — you can generate real PQC keypairs in your browser. The TLS Basics module shows how ML-KEM integrates with TLS 1.3 handshakes. For hands-on practice, OpenSSL Studio provides a full WASM-based OpenSSL 3.6 terminal for generating PQC keys and certificates. The Algorithm Reference page compares all NIST-standardized algorithms with performance benchmarks.',
      category: 'getting-started',
      metadata: { audience: 'developers' },
      deepLink: '/learn/pqc-101',
    },
    {
      id: 'getting-started-organizations',
      source: 'documentation',
      title: 'Getting Started for Organizations',
      content:
        "Getting Started with PQC for Organizations\n\nBegin with the Assessment wizard to evaluate your organization's quantum risk posture — it analyzes industry, data sensitivity, compliance requirements, and infrastructure to generate a prioritized migration plan. Review the Compliance page for regulatory frameworks (CNSA 2.0, ANSSI, BSI guidelines) and their deadlines. The Migrate Catalog lists PQC-ready products across 7 infrastructure layers, including HSMs, TLS libraries, and certificate authorities. The Threat Landscape page shows industry-specific quantum risks to help build the business case.",
      category: 'getting-started',
      metadata: { audience: 'organizations' },
      deepLink: '/assess',
    },
    {
      id: 'getting-started-learners',
      source: 'documentation',
      title: 'Getting Started for Learners',
      content:
        "Getting Started with PQC for Learners\n\nThe Learn section has 27 modules covering PQC fundamentals to advanced topics. Start with PQC 101 for an overview, then Quantum Threats to understand Shor's and Grover's algorithms. Key modules include: Hybrid Cryptography (transition strategy), Crypto Agility (algorithm flexibility), TLS Basics (web security), KMS & PQC, HSM & PQC Operations, Data & Asset Sensitivity, 5G Security, and an executive track (Governance, Business Case, Risk Management, Compliance Strategy, Migration Program). Each module includes interactive demonstrations and a Workshop tab for hands-on exercises. Test your knowledge with the Quiz covering 530 questions across 33 categories. The Glossary provides definitions for 100+ PQC terms.",
      category: 'getting-started',
      metadata: { audience: 'learners' },
      deepLink: '/learn',
    },
  ]
}

// ---------------------------------------------------------------------------
// Playground guide
// ---------------------------------------------------------------------------

function processPlaygroundGuide(): RAGChunk[] {
  return [
    {
      id: 'playground-overview',
      source: 'documentation',
      title: 'PQC Playground — Interactive Crypto Demos',
      content:
        'PQC Playground Overview\n\nThe PQC Playground is an interactive browser-based tool for generating real post-quantum cryptographic keys, encrypting data, and signing messages. All operations run locally in the browser using WebAssembly (WASM) — no data leaves your machine. Available operations: Key Generation, Encryption/Decryption (KEM), and Digital Signatures.\n\nSupported algorithms: ML-KEM-512/768/1024 (key encapsulation), ML-DSA-44/65/87 (digital signatures), SLH-DSA-SHA2-128s/192s/256s (hash-based signatures), X25519 (classical ECDH), P-256 (classical ECDSA), RSA-2048/4096 (classical). All generated keys are for educational purposes only — not for production use.',
      category: 'playground',
      metadata: { feature: 'overview' },
      deepLink: '/playground',
    },
    {
      id: 'playground-keygen',
      source: 'documentation',
      title: 'Playground — Key Generation',
      content:
        'Key Generation in the PQC Playground\n\nSelect any algorithm to generate a keypair instantly in your browser. The playground shows public key size, private key size, and generation time for each algorithm. Compare PQC key sizes with classical equivalents — ML-KEM-768 public keys are 1,184 bytes vs RSA-2048 at 256 bytes, while ML-DSA-65 public keys are 1,952 bytes vs ECDSA P-256 at 64 bytes. Use the algorithm selector dropdown to switch between algorithms, or use the URL parameter: /playground?algo=ML-KEM.',
      category: 'playground',
      metadata: { feature: 'keygen' },
      deepLink: '/playground',
    },
    {
      id: 'playground-kem',
      source: 'documentation',
      title: 'Playground — Key Encapsulation (KEM)',
      content:
        'Key Encapsulation in the PQC Playground\n\nML-KEM (FIPS 203) key encapsulation generates a shared secret between two parties. The playground demonstrates: 1) Generate a keypair, 2) Encapsulate — create a ciphertext + shared secret using the public key, 3) Decapsulate — recover the shared secret using the private key. Compare ciphertext sizes: ML-KEM-768 produces 1,088-byte ciphertexts vs X25519 at 32 bytes. The shared secret is always 32 bytes regardless of parameter set.',
      category: 'playground',
      metadata: { feature: 'kem' },
      deepLink: '/playground?algo=ML-KEM',
    },
    {
      id: 'playground-signatures',
      source: 'documentation',
      title: 'Playground — Digital Signatures',
      content:
        'Digital Signatures in the PQC Playground\n\nML-DSA (FIPS 204) and SLH-DSA (FIPS 205) digital signatures can be generated and verified in the playground. Enter a message, sign it with a private key, then verify the signature with the public key. Compare signature sizes: ML-DSA-65 signatures are 3,309 bytes, SLH-DSA-SHA2-128s signatures are 7,856 bytes, vs ECDSA P-256 at 64 bytes. ML-DSA is faster but SLH-DSA is based on hash functions only (conservative security assumption).',
      category: 'playground',
      metadata: { feature: 'signatures' },
      deepLink: '/playground?algo=ML-DSA',
    },
    {
      id: 'playground-softhsm',
      source: 'documentation',
      title: 'Playground — SoftHSM (PKCS#11 v3.2 Emulation)',
      content:
        'SoftHSM Tab in the PQC Playground\n\nThe SoftHSM tab emulates a PKCS#11 v3.2 hardware security module in the browser using softhsmv3 (a fork of SoftHSM2 compiled to WebAssembly). It demonstrates real HSM-style key operations with PQC algorithms — all running client-side with no real hardware required.\n\nML-DSA Operations: Generate ML-DSA-44/65/87 keypairs in a PKCS#11 token slot, sign messages, and verify signatures. Pre-hash signing is supported via a dropdown with 10 hash variants (SHA-256, SHA-384, SHA-512, SHA3-256, SHA3-384, SHA3-512, SHAKE-128, SHAKE-256) plus Pure (no pre-hash).\n\nSLH-DSA Operations: Generate SLH-DSA keypairs with all 12 FIPS 205 parameter sets (CKP_SLH_DSA_SHA2_128S, CKP_SLH_DSA_SHA2_192S, CKP_SLH_DSA_SHA2_256S, CKP_SLH_DSA_SHAKE_128S, CKP_SLH_DSA_SHAKE_192S, CKP_SLH_DSA_SHAKE_256S, and their -F fast variants). Pre-hash dropdown shared with ML-DSA.\n\nAdditional tabs: Key Agreement (ECDH, ML-KEM), KDF (HKDF, PBKDF2/BIP39), Classical (AES, RSA, ECDSA). All operations use the PKCS#11 C_Sign, C_Verify, C_GenerateKeyPair, C_EncapsulateKey, C_DecapsulateKey interfaces — mirroring what a real PKCS#11 application would do against a hardware HSM.',
      category: 'playground',
      metadata: { feature: 'softhsm' },
      deepLink: '/playground',
    },
  ]
}

// ---------------------------------------------------------------------------
// OpenSSL Studio guide
// ---------------------------------------------------------------------------

function processOpenSSLStudioGuide(): RAGChunk[] {
  return [
    {
      id: 'openssl-studio-overview',
      source: 'documentation',
      title: 'OpenSSL Studio — Browser-Based WASM Terminal',
      content:
        'OpenSSL Studio Overview\n\nOpenSSL Studio provides a full OpenSSL 3.6.0 terminal running in the browser via WebAssembly (WASM). It supports PQC algorithms through the OQS provider, enabling hands-on practice with post-quantum key generation, certificate creation, and cryptographic operations without installing anything. All operations execute locally in the browser with SharedArrayBuffer support.',
      category: 'openssl-studio',
      metadata: { feature: 'overview' },
      deepLink: '/openssl',
    },
    {
      id: 'openssl-studio-keygen',
      source: 'documentation',
      title: 'OpenSSL Studio — PQC Key Generation Commands',
      content:
        'PQC Key Generation with OpenSSL Studio\n\nGenerate PQC keys using modern OpenSSL 3.x commands:\n- ML-KEM: openssl genpkey -algorithm mlkem768 -out mlkem768_key.pem\n- ML-DSA: openssl genpkey -algorithm mldsa65 -out mldsa65_key.pem\n- SLH-DSA: openssl genpkey -algorithm slhdsa-sha2-128s -out slhdsa_key.pem\n- Extract public key: openssl pkey -in key.pem -pubout -out pub.pem\n\nUse genpkey (not genrsa/ecparam) — modern OpenSSL commands support all PQC algorithms through the OQS provider.',
      category: 'openssl-studio',
      metadata: { feature: 'keygen' },
      deepLink: '/openssl?cmd=genpkey',
    },
    {
      id: 'openssl-studio-certs',
      source: 'documentation',
      title: 'OpenSSL Studio — PQC Certificate Operations',
      content:
        'PQC Certificate Operations with OpenSSL Studio\n\nCreate PQC certificates and CSRs:\n- Self-signed cert: openssl req -x509 -new -key mldsa65_key.pem -out cert.pem -days 365 -subj "/CN=PQC Test"\n- CSR: openssl req -new -key mldsa65_key.pem -out csr.pem -subj "/CN=PQC Test"\n- Verify cert: openssl x509 -in cert.pem -text -noout\n- Sign data: openssl pkeyutl -sign -inkey mldsa65_key.pem -in data.txt -out sig.bin\n- Verify signature: openssl pkeyutl -verify -pubin -inkey pub.pem -in data.txt -sigfile sig.bin\n\nAll certificates use ML-DSA-65 or other PQC algorithms for signing, demonstrating post-quantum PKI workflows.',
      category: 'openssl-studio',
      metadata: { feature: 'certificates' },
      deepLink: '/openssl?cmd=x509',
    },
  ]
}

// ---------------------------------------------------------------------------
// Priority matrix (migration gap analysis)
// ---------------------------------------------------------------------------

function processPriorityMatrix(): RAGChunk[] {
  const filePath = path.join(DATA_DIR, 'pqc_software_category_priority_matrix.csv')
  if (!fs.existsSync(filePath)) return []

  const records = readCSVWithHeaders(filePath)
  const chunks: RAGChunk[] = []

  // Per-category chunks (one per CSV row) for precise RAG retrieval
  for (const r of records) {
    chunks.push({
      id: `priority-cat-${sanitize(r.category_id)}`,
      source: 'priority-matrix',
      title: `${sanitize(r.category_name)} — PQC Migration Priority`,
      content: [
        `Category: ${sanitize(r.category_name)} (${sanitize(r.category_id)})`,
        `Priority: ${sanitize(r.pqc_priority)}`,
        `PQC Readiness: ${sanitize(r.readiness_percentage)}% (${sanitize(r.pqc_ready_products)}/${sanitize(r.total_software_products)} products)`,
        `Urgency Score: ${sanitize(r.urgency_score)}/100`,
        `Timeline Pressure: ${sanitize(r.timeline_pressure)}`,
        `Recommended Action: ${sanitize(r.recommended_action_timeline)}`,
        `Industries Affected: ${sanitize(r.industries_affected)}`,
      ].join('\n'),
      category: 'migration',
      metadata: {
        categoryId: sanitize(r.category_id),
        categoryName: sanitize(r.category_name),
        priorityLevel: sanitize(r.pqc_priority),
        readinessPercentage: sanitize(r.readiness_percentage),
      },
      deepLink: '/migrate',
    })
  }

  // Group by priority level (summary chunks)
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

  // --- Group by cert_type (original 3 chunks) ---
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

  // --- Group by vendor (additional chunks for better retrieval) ---
  const byVendor = new Map<string, typeof records>()
  for (const r of records) {
    const vendor = sanitize(r.cert_vendor) || sanitize(r.software_name) || 'Unknown'
    const existing = byVendor.get(vendor) ?? []
    existing.push(r)
    byVendor.set(vendor, existing)
  }

  for (const [vendor, certs] of byVendor) {
    const rows = certs.map((r) =>
      [
        `- ${sanitize(r.cert_type)}: ${sanitize(r.cert_product)}`,
        `  Cert ID: ${sanitize(r.cert_id)}`,
        `  PQC Algorithms: ${sanitize(r.pqc_algorithms)}`,
        sanitize(r.certification_level) ? `  Level: ${sanitize(r.certification_level)}` : '',
        `  Status: ${sanitize(r.status)} | Date: ${sanitize(r.cert_date)}`,
      ]
        .filter(Boolean)
        .join('\n')
    )

    const firstCertId = sanitize(certs[0]?.cert_id)
    const softwareName = sanitize(certs[0]?.software_name)
    chunks.push({
      id: `cert-vendor-${vendor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      source: 'certifications',
      title: `${vendor} — PQC Certifications`,
      content: `Vendor: ${vendor}\nProduct: ${softwareName}\nCertifications:\n\n${rows.join('\n\n')}`,
      category: 'certification',
      metadata: {
        vendor,
        softwareName,
        certCount: String(certs.length),
      },
      ...(firstCertId
        ? { deepLink: `/compliance?cert=${encodeParam(firstCertId)}` }
        : softwareName
          ? { deepLink: `/migrate?q=${encodeParam(softwareName)}` }
          : {}),
    })
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Document enrichments — extracted dimensions from public/ HTML/PDF files
// ---------------------------------------------------------------------------

/**
 * Load and merge all enrichment markdown files for a given collection
 * (library / timeline / threats). Returns a Map<refId, parsed fields>.
 * Files are sorted oldest → newest so later dates overwrite duplicates.
 */
function loadEnrichmentFields(collection: string): Map<string, Record<string, string>> {
  const enrichmentsDir = path.join(DATA_DIR, 'doc-enrichments')
  if (!fs.existsSync(enrichmentsDir)) return new Map()

  const prefix = `${collection}_doc_enrichments_`
  const files = fs
    .readdirSync(enrichmentsDir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.md'))
  if (files.length === 0) return new Map()

  const withDates = files.map((f) => {
    const match = f.match(/(\d{2})(\d{2})(\d{4})(_r(\d+))?\.md$/)
    if (!match) return { file: f, date: 0, rev: 0 }
    const [, mm, dd, yyyy, , rev] = match
    return { file: f, date: parseInt(yyyy + mm + dd), rev: rev ? parseInt(rev) : 0 }
  })
  withDates.sort((a, b) => a.date - b.date || a.rev - b.rev)

  const mergedSections = new Map<string, string>()
  for (const { file } of withDates) {
    const raw = fs.readFileSync(path.join(enrichmentsDir, file), 'utf-8')
    for (const section of raw.split(/\n(?=## )/).filter((s) => s.trimStart().startsWith('## '))) {
      const refId = section
        .split('\n')[0]
        .replace(/^##\s*/, '')
        .trim()
      if (refId && refId !== '---') mergedSections.set(refId, section)
    }
  }

  const result = new Map<string, Record<string, string>>()
  for (const [refId, section] of mergedSections) {
    const fields: Record<string, string> = {}
    for (const line of section.split('\n').slice(1)) {
      const m = line.match(/^-\s+\*\*([^*]+)\*\*:\s*(.+)$/)
      if (m) fields[m[1].trim()] = m[2].trim()
    }
    result.set(refId, fields)
  }
  return result
}

function processDocumentEnrichments(): RAGChunk[] {
  const enrichmentsDir = path.join(DATA_DIR, 'doc-enrichments')
  if (!fs.existsSync(enrichmentsDir)) return []

  const chunks: RAGChunk[] = []
  const collections = ['library', 'timeline', 'threats'] as const

  for (const collection of collections) {
    const enrichLookup = loadEnrichmentFields(collection)
    if (enrichLookup.size === 0) continue

    for (const [refId, fields] of enrichLookup) {
      const title = fields['Title'] || refId
      if (title === '---') continue

      const contentParts: string[] = [`Title: ${title}`]
      const fieldOrder = [
        'Authors',
        'Publication Date',
        'Last Updated',
        'Document Status',
        'Main Topic',
        'PQC Algorithms Covered',
        'Quantum Threats Addressed',
        'Migration Timeline Info',
        'Applicable Regions / Bodies',
        'Leaders Contributions Mentioned',
        'PQC Products Mentioned',
        'Protocols Covered',
        'Infrastructure Layers',
        'Standardization Bodies',
        'Compliance Frameworks Referenced',
      ]
      for (const key of fieldOrder) {
        const val = fields[key]
        if (val && val !== 'None detected' && val !== 'Not specified')
          contentParts.push(`${key}: ${val}`)
      }

      chunks.push({
        id: `doc-enrichment-${sanitize(refId)}`,
        source: 'document-enrichment',
        title: `${title} — Document Analysis`,
        content: contentParts.join('\n'),
        category: 'document-enrichment',
        metadata: { refId: sanitize(refId), collection },
        ...(collection === 'library' && refId
          ? { deepLink: `/library?ref=${encodeParam(refId)}` }
          : collection === 'threats' && refId
            ? { deepLink: `/threats?id=${encodeParam(refId)}` }
            : collection === 'timeline' && refId
              ? (() => {
                  const country = refId.split(':')[0]?.trim() ?? ''
                  return country && country !== 'Global'
                    ? { deepLink: `/timeline?country=${encodeParam(country)}` }
                    : { deepLink: '/timeline' }
                })()
              : {}),
      })
    }
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Changelog
// ---------------------------------------------------------------------------

function processChangelog(): RAGChunk[] {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
  if (!fs.existsSync(changelogPath)) return []

  const raw = fs.readFileSync(changelogPath, 'utf-8')
  const chunks: RAGChunk[] = []

  // Split by version headings: ## [X.Y.Z] - YYYY-MM-DD
  const versionPattern = /^## \[([^\]]+)\]\s*-\s*(\S+)/gm
  const matches = [...raw.matchAll(versionPattern)]

  for (let i = 0; i < matches.length; i++) {
    const version = matches[i][1]
    const date = matches[i][2]
    const startIdx = matches[i].index! + matches[i][0].length
    const endIdx = i + 1 < matches.length ? matches[i + 1].index! : raw.length
    let body = raw.slice(startIdx, endIdx).trim()

    // Strip implementation noise: file references in parens, [view:...]/[persona:...] tags
    body = body.replace(/\s*\([^)]*\.[a-z]{2,4}[^)]*\)/g, '')
    body = body.replace(/\s*\[(?:view|persona):[^\]]*\]/g, '')

    // Truncate to avoid oversized chunks
    if (body.length > 2000) body = body.slice(0, 2000) + '\u2026'

    chunks.push({
      id: `changelog-${version}`,
      source: 'changelog',
      title: `PQC Today v${version} \u2014 Release Notes (${date})`,
      content: `Version ${version} released ${date}.\n\n${body}`,
      category: 'changelog',
      metadata: { version, date },
      deepLink: '/changelog',
    })
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Page-level guides (non-learn pages)
// ---------------------------------------------------------------------------

function processPageGuides(): RAGChunk[] {
  return [
    // --- Landing Page ---
    {
      id: 'page-guide-landing',
      source: 'documentation',
      title: 'Landing Page — Platform Overview & Persona Selection',
      content:
        'PQC Today Landing Page\n\nThe landing page introduces the PQC adoption lifecycle through a 7-step journey: Learn → Assess → Explore → Test → Deploy → Ramp Up → Stay Agile. Users select a persona (Executive, Developer, Architect, Researcher, or IT Ops/DevOps) to personalize their experience — each persona sees "For you" badges on recommended journey steps and receives tailored recommendations throughout the platform.\n\nKey statistics displayed: 27 interactive learning modules (covering PQC 101, Quantum Threats, Hybrid Crypto, TLS, VPN/SSH, PKI, KMS & PQC Key Management, HSM & PQC Operations, Data & Asset Sensitivity, Stateful Signatures, QKD, Digital Assets, 5G Security, Code Signing, API Security, IoT/OT, and more), 530 quiz questions, 40+ algorithms catalogued, 230+ PQC-ready tools tracked, 14-step quantum risk assessment wizard, and compliance deadlines spanning 2024–2036.\n\nThe ScoreCard tracks learning progress using a judo belt grading system (White through Black belt) based on module completions and quiz performance. Three paths are always visible regardless of persona: Learn, Timeline, and Threats.\n\nPQC Today is open source (GPL-3.0) and runs entirely in the browser — all cryptographic operations use WebAssembly (OpenSSL v3.6.0 + liboqs-js v0.15.1), with no backend or data collection.',
      category: 'page-guide',
      metadata: { page: 'landing' },
      deepLink: '/',
    },
    // --- Timeline Page ---
    {
      id: 'page-guide-timeline',
      source: 'documentation',
      title: 'Timeline Page — Global PQC Migration Milestones',
      content:
        "Timeline Page Overview\n\nThe Timeline page displays a Gantt chart of global PQC migration milestones for 50+ countries from 2024 to 2035. Events are categorized into 10 phase types: Discovery (cryptographic inventory), Testing (pilot deployments), POC (proof of concept), Migration (live deployment), Standardization (new PQC standards), Guidance (advisories), Policy (regulations enacted), Regulation (compliance enforcement), Research (ongoing development), and Deadline (hard cutoff dates).\n\nEvent categories: Milestones (singular achievements like a standard publication) and Phases (multi-year transitions like a country's migration period).\n\nFilter by: text search, country selection, phase type, event type, and region (Americas, EMEA, Asia-Pacific, Global/International). When a specific country is selected, a DocumentTable appears below the Gantt chart showing detailed entries with organization, phase badge, type, title, period, description, and source link.\n\nKey deadlines: Australia 2030 (most aggressive), Canada 2026/2031/2035, UK 2028 (3-phase), Czech Republic 2027 (first EU-specific), EU 2030/2035, Israel 2025, Taiwan 2027, Germany 2030 (QUANTITY initiative), G7 2034 (financial sector), CNSA 2.0 2030 exclusive/2035 full.",
      category: 'page-guide',
      metadata: { page: 'timeline' },
      deepLink: '/timeline',
    },
    // --- Algorithms Page ---
    {
      id: 'page-guide-algorithms',
      source: 'documentation',
      title: 'Algorithms Page — Transition Guide & Detailed Comparison',
      content:
        "Algorithms Page Overview\n\nThe Algorithms page has two tabs: Transition Guide (default) shows classical → PQC migration paths (e.g., RSA-2048 → ML-KEM-768 + ML-DSA-65), and Detailed Comparison provides full specs for 45+ algorithms side by side.\n\nPQC algorithm families: ML-KEM (FIPS 203, lattice-based KEM — 512/768/1024 parameter sets), ML-DSA (FIPS 204, lattice-based signatures — 44/65/87), SLH-DSA (FIPS 205, stateless hash-based signatures — 12 variants), FN-DSA (FIPS 206, compact lattice signatures — 512/1024), HQC (code-based KEM, NIST Round 4 backup), FrodoKEM (conservative LWE, not standardized), Classic McEliece (large keys, impractical), LMS/XMSS (SP 800-208, stateful hash-based, firmware signing).\n\nClassical algorithms shown as deprecated: RSA (all sizes), ECDSA (P-256/384/521), ECDH (X25519/X448), EdDSA — all vulnerable to Shor's algorithm.\n\nNIST Security Levels: L1 (AES-128), L2 (SHA-256 collision), L3 (AES-192), L4 (SHA-384 collision), L5 (AES-256). Data per algorithm: security level, AES equivalent, public/private key sizes, signature/ciphertext size, performance benchmarks, stack RAM, FIPS status, use case notes.\n\nUse ?highlight= to deep-link to specific algorithms (e.g., /algorithms?highlight=ML-KEM-768).",
      category: 'page-guide',
      metadata: { page: 'algorithms' },
      deepLink: '/algorithms',
    },
    // --- Library Page ---
    {
      id: 'page-guide-library',
      source: 'documentation',
      title: 'Library Page — Standards, RFCs & Reference Documents',
      content:
        'Library Page Overview\n\nThe Library catalogs 100+ technical standards, RFCs, and reference documents for PQC. Documents are organized across 16 categories (Standards, RFCs, Compliance, Protocols, PKI/Certificates, Firmware & Code Signing, etc.) and filterable by organization (NIST, IETF, ETSI, NSA, ANSSI, BSI, ASD, CCCS) and industry (Government, Finance, Telecom, Healthcare, Technology).\n\nKey standards: FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), FIPS 206 (FN-DSA), NIST IR 8547 (transition guidance, deprecate 2030/disallow 2035), SP 800-208 (LMS/XMSS).\n\nRecent RFCs: RFC 9629 (KEM in CMS), RFC 9708 (HSS/LMS in CMS), RFC 9802 (HSS/XMSS in X.509), RFC 9814 (SLH-DSA in CMS), RFC 9881/9882 (ML-DSA in X.509 and CMS), RFC 8784 (PQC PSK for IKEv2).\n\nRegional standards: ETSI TS 103 744 (EU hybrid KEM), BSI TR-02102 (Germany), ANSSI Position Paper (France hybrid mandate), CCCS ITSM.40.001 (Canada), ASD ISM-1917 (Australia).\n\nCross-reference system: Library documents link to compliance frameworks (via libraryRefs), timeline events (via timelineRefs), and inter-document dependencies. Use ?ref= to deep-link (e.g., /library?ref=FIPS-203).',
      category: 'page-guide',
      metadata: { page: 'library' },
      deepLink: '/library',
    },
    // --- Threats Page ---
    {
      id: 'page-guide-threats',
      source: 'documentation',
      title: 'Threats Page — Industry-Specific Quantum Risk Dashboard',
      content:
        'Threats Page Overview\n\nThe Threats dashboard shows 80+ quantum threat scenarios across 20 industries: Aerospace, Automotive, Cloud Computing, Cryptocurrency/Blockchain, Cross-Industry, Energy/Critical Infrastructure, Financial Services, Government/Defense, Healthcare, Insurance, IoT, IT/Software, Legal/eSignature, Media/DRM, Payment Card, Rail/Transit, Retail, Supply Chain, Telecommunications, and Water/Wastewater.\n\nThreat severity levels: Critical (immediate action required), High (1–3 year timeline), Medium-High, Medium, and Low.\n\nKey concepts:\n- HNDL (Harvest Now, Decrypt Later): Adversaries intercept and store encrypted data today to decrypt when quantum computers arrive. Primary near-term threat.\n- HNFL (Harvest Now, Forge Later): Adversaries plan to forge digital signatures (code signing, certificates, legal documents) once quantum computers break ECDSA/RSA.\n- CRQC (Cryptographically Relevant Quantum Computer): Global Risk Institute 2024 estimates 19–34% probability within 10 years.\n\nEach threat entry includes: threat ID, industry, detailed description, criticality level, crypto at risk, PQC replacement recommendation, regulation/source, confidence percentage, and related learning modules.\n\nFilter by industry using ?industry= (e.g., /threats?industry=finance) or open specific threats with ?id= (e.g., /threats?id=FIN-001).',
      category: 'page-guide',
      metadata: { page: 'threats' },
      deepLink: '/threats',
    },
    // --- Compliance Page ---
    {
      id: 'page-guide-compliance',
      source: 'documentation',
      title: 'Compliance Page — Regulatory Frameworks & Deadline Tracking',
      content:
        'Compliance Page Overview\n\nThe Compliance page tracks 48+ regulatory frameworks, certifications, and mandates affecting PQC migration.\n\nFramework types:\n- Cryptographic Module Validation: FIPS 140-3 (US/CMVP), KCMVP (Korea)\n- Algorithm Validation: ACVP (NIST test vectors)\n- International Evaluation: Common Criteria (ISO/IEC 15408), EUCC v2.0\n- Government Mandates: CNSA 2.0 (NSA), ASD ISM (Australia), CCCS (Canada), NCSC (UK), NZISM (NZ)\n- EU Regulations: EU Recommendation 2024/1101, eIDAS 2.0 (digital identity wallets 2027+), DORA (financial resilience, enforced Jan 2025), NIS2 (transposition Oct 2024)\n- Regional Standards: ANSSI (France, phased 2025–2030), BSI TR-02102 (Germany), CRYPTREC (Japan), KpqC (Korea, 2029/2035), OSCCA NGCC (China)\n- Industry-Specific: PCI-DSS (payments), HIPAA (healthcare), GSMA NG.116 (mobile 2026–2028), NERC-CIP (power grid), IEC 62443 (industrial), DO-326A (aviation), ISO/SAE 21434 (automotive)\n\nCNSA 2.0 key deadlines: software/firmware signing preferred 2025, exclusive 2030; networking equipment preferred 2026; NSS acquisitions exclusive 2027; web/cloud exclusive 2033; full transition 2035.\n\nEach framework entry shows: ID, description, industries affected, countries/regions, PQC required status, deadline, enforcement body, and cross-references to Library standards and Timeline events.',
      category: 'page-guide',
      metadata: { page: 'compliance' },
      deepLink: '/compliance',
    },
    // --- Migrate Page ---
    {
      id: 'page-guide-migrate',
      source: 'documentation',
      title: 'Migrate Page — 7-Phase Framework & Software Catalog',
      content:
        'Migrate Page Overview\n\nThe Migrate page provides a 7-phase PQC migration framework aligned with NIST, NSA CNSA 2.0, CISA, and ETSI guidance:\n1. Assess — Build Cryptographic Bill of Materials (CBOM), identify quantum-vulnerable algorithms\n2. Plan — Classify data by confidentiality lifetime, map regulatory deadlines, create migration priority matrix\n3. Prepare — Select PQC libraries (OpenSSL 3.5+, AWS-LC, BoringSSL), upgrade HSM firmware, engage vendor roadmaps\n4. Test — Pilot hybrid TLS/SSH with ML-KEM + X25519, test VPN PQC tunnels, measure performance impact\n5. Migrate — Deploy hybrid certificates, migrate code signing to ML-DSA/SLH-DSA, update key management\n6. Launch — Complete disk/database encryption migration, update secure boot chains, re-encrypt archived data (HNDL counter-measures)\n7. Ramp Up — Deploy continuous crypto monitoring, deprecate legacy algorithms, optimize performance\n\nSoftware catalog: 230+ PQC-ready products organized across 7 infrastructure layers (Operating Systems, Databases, VPN/Network, Code Signing, Cryptographic Libraries, Devices/IoT, Other) plus Web Browsers (Chrome, Edge, Firefox, Safari with ML-KEM TLS 1.3).\n\nThree-tier FIPS badge system: Validated (green, FIPS 140-3), Partial (amber, FedRAMP/WebTrust/FIPS-mode claims), No (gray). Certification cross-reference links products to FIPS/ACVP/Common Criteria certifications.\n\nFilter by: industry (?industry=), infrastructure layer (?layer=), text search (?q=), and migration phase.',
      category: 'page-guide',
      metadata: { page: 'migrate' },
      deepLink: '/migrate',
    },
    // --- Assess Page ---
    {
      id: 'page-guide-assess',
      source: 'documentation',
      title: 'Assess Page — 14-Step Quantum Risk Assessment Wizard',
      content:
        'Assess Page Overview\n\nThe Assess page provides a personalized PQC risk assessment with two modes: Quick (6 steps, ~2 min) for rapid baseline, and Comprehensive (14 steps, ~5 min) for detailed migration planning.\n\n14 comprehensive steps: Industry → Country → Crypto Stack → Data Sensitivity → Compliance → Migration Status → Use Cases → Data Retention → Credential Lifetime → Organization Scale → Crypto Agility → Infrastructure → Vendor Dependencies → Timeline Pressure.\n\nKey features:\n- Country selection drives compliance deadline alignment and framework filtering\n- Data Sensitivity and Data Retention are multi-select with worst-case (max) scoring for HNDL risk\n- HNDL window = data retention period minus estimated time to CRQC\n- Industry selection filters compliance frameworks to show only relevant regulations\n- Persona-aware report recommendations (Executive/Developer/Architect/Researcher/IT Ops)\n\nFour risk categories scored: Strategic Risk (long-term quantum exposure), Operational Risk (system complexity), Compliance Risk (regulatory deadline pressure), Vendor Risk (third-party dependency control).\n\nReport includes deep links to Migrate products, Timeline events, Compliance frameworks, and Learn modules tailored to your results. Supports Print/PDF output. Progress auto-saves to localStorage with resume capability.\n\nUse ?step= to deep-link to specific steps (e.g., /assess?step=3 for Data Sensitivity).',
      category: 'page-guide',
      metadata: { page: 'assess' },
      deepLink: '/assess',
    },
    // --- Leaders Page ---
    {
      id: 'page-guide-leaders',
      source: 'documentation',
      title: 'Leaders Page — Global PQC Visionaries & Organizations',
      content:
        'Leaders Page Overview\n\nThe Leaders page profiles 100+ global PQC leaders — visionaries, algorithm inventors, government officials, and organizations driving post-quantum cryptography adoption and standardization.\n\nLeader categories:\n- Government Leaders: NIST (Dustin Moody, Lily Chen), NCSC UK (Ollie Whitehouse), ANSSI France (Vincent Strubel), BSI Germany (Claudia Plattner), ENISA, CISA\n- Algorithm Inventors: Vadim Lyubashevsky (ML-KEM/ML-DSA at IBM), Léo Ducas (Kyber/Dilithium at CWI/Leiden)\n- Industry Vendors: SandboxAQ (Jack Hidary), PQShield, CryptoNext, QuSecure; HSM vendors (Thales, Entrust, Utimaco); PKI vendors (DigiCert, ISARA)\n- Standards Bodies: IETF (PQUIP, LAMPS), ETSI QSC, PQC Alliance\n- Industry Adopters: Google, AWS (Panos Kampanakis), Cloudflare (Bas Westerbaan — 38%+ HTTPS PQC-protected), Signal, Vodafone, IBM, JPMorgan Chase\n- Academic Researchers: Universities conducting PQC cryptanalysis and lattice cryptography research\n\nFilter by: country (15+ countries), sector (Public/Private/Academic), and text search across name, organization, and bio. Use ?leader= to highlight a specific person, ?country= for country filter, ?sector= for sector filter.',
      category: 'page-guide',
      metadata: { page: 'leaders' },
      deepLink: '/leaders',
    },
    // --- About Page ---
    {
      id: 'page-guide-about',
      source: 'documentation',
      title: 'About Page — Platform Details, SBOM, Privacy & Licensing',
      content:
        "About Page Overview\n\nThe About page provides comprehensive platform information:\n\nSoftware Bill of Materials (SBOM): React v19, Tailwind CSS v4, Framer Motion (animations), Lucide React (icons), React Router v7. Crypto stack: OpenSSL WASM v3.6.0 (primary), @oqs/liboqs-js v0.15.1 (PQC algorithms), @noble/curves and @scure/* (blockchain crypto), Web Crypto API (X25519, P-256). State management: Zustand with localStorage persistence. Data: PapaParse (CSV), Recharts (visualization). Testing: Vitest + Playwright + axe-playwright (accessibility). Build: Vite + TypeScript strict mode.\n\nSecurity Audit: 0 production vulnerabilities. Dev-only findings are ESLint toolchain ReDoS (minimatch, ajv) — don't affect deployed app.\n\nData Privacy: Static site with no backend or database. No data collection, no cookies, no tracking, no third-party services. All persistence is localStorage only. All cryptography runs client-side via WASM.\n\nPQC Assistant: RAG (Retrieval-Augmented Generation) with 2,800+ corpus chunks from 22 data sources, powered by Gemini 2.5 Flash. Requires user-provided Google API key (BYOK). Three capabilities: Grounded Answers, Deep Linking, PQC Domain Expertise.\n\nLicense: GPL-3.0 (GNU General Public License v3.0).\n\nCreator & Maintainer: Eric Amador. Eric Amador is the sole developer and maintainer of PQC Today (pqctoday.com). LinkedIn profile: https://www.linkedin.com/in/eric-amador-971850a/. To connect with Eric or learn more about his background, visit the About page (/about) or his LinkedIn profile. AI tools acknowledged: Google Antigravity, ChatGPT, Claude AI, Perplexity, Gemini Pro.",
      category: 'page-guide',
      metadata: { page: 'about' },
      deepLink: '/about',
    },
    // --- Creator / Maintainer (dedicated chunk for strong RAG grounding) ---
    {
      id: 'page-guide-creator',
      source: 'documentation',
      title: 'PQC Today — Creator, Author & Maintainer',
      content:
        'PQC Today Creator & Maintainer\n\nPQC Today (pqctoday.com) was created, built, and is maintained by Eric Amador.\n\nEric Amador is the sole developer, author, and maintainer of the PQC Today platform. He designed and built every part of the site: the interactive Gantt timeline, the compliance catalog, the library, the 27 learning modules, the Playground (OpenSSL WASM + liboqs), the PQC Assistant (RAG chatbot), the Assess wizard, the Migrate catalog, and the softhsmv3 WASM HSM emulator.\n\nOpen-Source Projects maintained by Eric Amador:\n- PQC Today (pqctoday.com) — GitHub: https://github.com/pqctoday/pqc-timeline-app\n- softhsmv3 — PQC-enabled HSM emulation fork (SoftHSM2 v2.7.0 with ML-DSA + ML-KEM, PKCS#11 v3.2, Emscripten WASM) — GitHub: https://github.com/pqctoday/softhsmv3\n\nBackground: Eric Amador is a cybersecurity professional specialising in post-quantum cryptography migration strategy, PKI, and cryptographic engineering. He built PQC Today as an open-source educational resource to help practitioners, architects, and executives understand and plan their PQC transitions.\n\nContact & Profile: LinkedIn — https://www.linkedin.com/in/eric-amador-971850a/\nAbout page: /about\n\nIf someone asks "who made this?", "who built pqctoday?", "who is the author?", "who maintains this site?", "who maintains softhsmv3?", or "who is Eric Amador?" — the answer is: Eric Amador created and maintains PQC Today and softhsmv3.',
      category: 'page-guide',
      metadata: { page: 'about' },
      deepLink: '/about',
    },
  ]
}

// ---------------------------------------------------------------------------
// Cross-domain linking — enriches chunks with related items from other sources
// ---------------------------------------------------------------------------

const MAX_CROSS_REFS = 3

/**
 * Enriches corpus chunks with cross-domain references.
 * Mutates chunk `content` strings in-place — no new fields or schema changes.
 */
function enrichWithCrossReferences(corpus: RAGChunk[]): number {
  // Build lookup indexes by source
  const bySource = new Map<string, RAGChunk[]>()
  for (const c of corpus) {
    const group = bySource.get(c.source) ?? []
    group.push(c)
    bySource.set(c.source, group)
  }

  let linkCount = 0

  // 1. Threats → Compliance: match threat industry against compliance chunk content
  const complianceChunks = bySource.get('compliance') ?? []
  for (const threat of bySource.get('threats') ?? []) {
    const industry = threat.metadata?.industry?.toLowerCase()
    if (!industry) continue
    const matches = complianceChunks
      .filter((c) => c.content.toLowerCase().includes(industry))
      .slice(0, MAX_CROSS_REFS)
    if (matches.length > 0) {
      const links = matches.map((c) => `[${c.title}](${c.deepLink ?? '/compliance'})`).join(', ')
      threat.content += `\nRelated Compliance: ${links}`
      linkCount += matches.length
    }
  }

  // 2. Leaders → Algorithms: match leader content against algorithm titles
  const algorithmChunks = bySource.get('algorithms') ?? []
  for (const leader of bySource.get('leaders') ?? []) {
    const contentLower = leader.content.toLowerCase()
    const matches = algorithmChunks
      .filter((a) => {
        const name = a.title.toLowerCase()
        return contentLower.includes(name)
      })
      .slice(0, MAX_CROSS_REFS)
    if (matches.length > 0) {
      const links = matches.map((a) => `[${a.title}](${a.deepLink ?? '/algorithms'})`).join(', ')
      leader.content += `\nRelated Algorithms: ${links}`
      linkCount += matches.length
    }
  }

  // 3. Library → Algorithms: match FIPS/standard references against algorithm fipsStandard
  for (const lib of bySource.get('library') ?? []) {
    const contentLower = lib.content.toLowerCase()
    const matches = algorithmChunks
      .filter((a) => {
        const fips = a.metadata?.fipsStandard
        return fips && contentLower.includes(fips.toLowerCase())
      })
      .slice(0, MAX_CROSS_REFS)
    if (matches.length > 0) {
      const links = matches.map((a) => `[${a.title}](${a.deepLink ?? '/algorithms'})`).join(', ')
      lib.content += `\nRelated Algorithms: ${links}`
      linkCount += matches.length
    }
  }

  // 4. Compliance → Timeline: match compliance content countries against timeline countries
  const timelineChunks = bySource.get('timeline') ?? []
  const timelineByCountry = new Map<string, RAGChunk>()
  for (const t of timelineChunks) {
    const country = t.metadata?.country
    if (country && !timelineByCountry.has(country)) {
      timelineByCountry.set(country, t)
    }
  }
  for (const comp of complianceChunks) {
    const contentLower = comp.content.toLowerCase()
    const matches: RAGChunk[] = []
    for (const [country, chunk] of timelineByCountry) {
      if (matches.length >= MAX_CROSS_REFS) break
      if (contentLower.includes(country.toLowerCase())) {
        matches.push(chunk)
      }
    }
    if (matches.length > 0) {
      const links = matches
        .map((t) => {
          const country = t.metadata?.country ?? 'Unknown'
          return `[${country} Timeline](${t.deepLink ?? `/timeline?country=${country}`})`
        })
        .join(', ')
      comp.content += `\nRelated Timeline: ${links}`
      linkCount += matches.length
    }
  }

  return linkCount
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔍 Generating RAG corpus...\n')

  const processors: Array<{ name: string; fn: () => RAGChunk[] | Promise<RAGChunk[]> }> = [
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
    { name: 'Module RAG Summaries', fn: processModuleRAGSummaries },
    { name: 'Module Content', fn: processModuleContent },
    { name: 'Authoritative Sources', fn: processAuthoritativeSources },
    { name: 'Documentation', fn: processMarkdownDocs },
    { name: 'Quiz Questions', fn: processQuizQuestions },
    { name: 'Assessment Config', fn: processAssessmentConfig },
    { name: 'Assessment Guide', fn: processAssessmentGuide },
    { name: 'Getting Started', fn: processGettingStarted },
    { name: 'Playground Guide', fn: processPlaygroundGuide },
    { name: 'OpenSSL Studio Guide', fn: processOpenSSLStudioGuide },
    { name: 'Priority Matrix', fn: processPriorityMatrix },
    { name: 'Certification Xref', fn: processCertificationXref },
    { name: 'Document Enrichments', fn: processDocumentEnrichments },
    { name: 'Page Guides', fn: processPageGuides },
    { name: 'NotebookLM App Guides', fn: processNotebookLM },
    { name: 'Changelog', fn: processChangelog },
  ]

  const corpus: RAGChunk[] = []

  for (const { name, fn } of processors) {
    try {
      const chunks = await fn()
      console.log(`  ✓ ${name}: ${chunks.length} chunks`)
      corpus.push(...chunks)
    } catch (err) {
      console.error(`  ✗ ${name}: failed —`, err)
    }
  }

  // Cross-domain linking
  const crossRefCount = enrichWithCrossReferences(corpus)
  console.log(`\n  🔗 Cross-references added: ${crossRefCount} links`)

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const output = {
    generatedAt: new Date().toISOString(),
    chunkCount: corpus.length,
    chunks: corpus,
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output), 'utf-8')

  const sizeKB = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)
  console.log(`\n✅ Corpus generated: ${corpus.length} chunks (${sizeKB} KB)`)
  console.log(`   Output: ${OUTPUT_FILE}`)
}

main()
