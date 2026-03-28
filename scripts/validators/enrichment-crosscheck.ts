// SPDX-License-Identifier: GPL-3.0-only
/**
 * N20: Q&A answer content vs. enrichment cross-check (ref-linked + keyword scan)
 * N21: rag-summary vs. enrichment consistency check
 *
 * Cross-checks Q&A answers and rag-summary files against authoritative enrichment
 * data (library, timeline, product extractions, glossary).
 */
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import type { CheckResult, Finding, CsvRow } from './types.js'
import {
  loadCSV,
  splitSemicolon,
  buildModuleEnrichmentMap,
  loadEnrichmentFields,
  DATA_DIR,
  ROOT,
  type ModuleEnrichmentSet,
} from './data-loader.js'

// ── Entity extraction regexes ────────────────────────────────────────────────

const STANDARD_RE =
  /\b(FIPS\s+\d{3}(?:[.-]\d+)?|RFC\s+\d{4,5}|CIP-\d{3}|CNSA\s+\d\.\d|IEC\s+\d{4,5}(?:-\d+)*|NIST\s+(?:SP|IR)\s+[\d-]+(?:\s+Rev\.?\s*\d+)?)\b/gi

const ALGO_RE =
  /\b(ML-KEM(?:-(?:512|768|1024))?|ML-DSA(?:-(?:44|65|87))?|SLH-DSA(?:-(?:SHA2|SHAKE)-\d+[sf])?|FN-DSA(?:-\d+)?|XMSS|LMS(?:\/HSS)?|SPHINCS\+|FrodoKEM|HQC|(?:Classic\s+)?McEliece)\b/gi

const DATE_CLAIM_RE = /\b(?:by|before|until|after|from|in|through|starting)\s+(20\d{2})\b/gi

// ── Helpers ──────────────────────────────────────────────────────────────────

function finding(csv: string, row: number | null, field: string, value: string, message: string): Finding {
  return { csv, row, field, value, message }
}

function makeCheck(
  id: string,
  description: string,
  sourceA: string,
  sourceB: string | null,
  severity: 'ERROR' | 'WARNING' | 'INFO',
  findings: Finding[],
): CheckResult {
  return {
    id,
    category: 'cross-reference',
    description,
    sourceA,
    sourceB,
    severity: findings.length === 0 ? 'INFO' : severity,
    status: findings.length === 0 ? 'PASS' : 'FAIL',
    findings,
  }
}

function extractEntities(text: string, re: RegExp): string[] {
  const matches: string[] = []
  let m: RegExpExecArray | null
  const regex = new RegExp(re.source, re.flags)
  while ((m = regex.exec(text)) !== null) {
    matches.push(m[1].trim())
  }
  return [...new Set(matches)]
}

function normalizeStandard(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toUpperCase()
}

function normalizeAlgo(s: string): string {
  return s.replace(/\s+/g, '').trim().toUpperCase()
}

/** Check if a field value contains an entity (case-insensitive substring). */
function fieldContains(fieldValue: string | undefined, entity: string): boolean {
  if (!fieldValue) return false
  return fieldValue.toUpperCase().includes(entity.toUpperCase())
}

// ── N20: Q&A content vs. enrichment ──────────────────────────────────────────

function runN20Checks(
  moduleMap: Map<string, ModuleEnrichmentSet>,
  libraryFields: Map<string, Record<string, string>>,
): CheckResult[] {
  const results: CheckResult[] = []

  // Load Q&A combined CSV
  const qaDir = path.join(DATA_DIR, 'module-qa')
  if (!fs.existsSync(qaDir)) return results

  const qaFiles = fs.readdirSync(qaDir)
    .filter(f => f.startsWith('module_qa_combined_') && f.endsWith('.csv'))
    .sort()
  if (qaFiles.length === 0) return results

  const latestQA = qaFiles[qaFiles.length - 1]
  const qaPath = path.join(qaDir, latestQA)
  const qaContent = fs.readFileSync(qaPath, 'utf-8')
  const { data: qaRows } = Papa.parse<CsvRow>(qaContent.trim(), { header: true, skipEmptyLines: true })

  // N20-A: Algorithm mentions vs. library enrichment PQC Algorithms Covered
  {
    const f: Finding[] = []
    for (let i = 0; i < qaRows.length; i++) {
      const row = qaRows[i]
      const answer = row.answer || ''
      const moduleId = row.module_id || ''
      const libRefs = splitSemicolon(row.library_refs)
      const algosInAnswer = extractEntities(answer, ALGO_RE)

      if (algosInAnswer.length === 0 || libRefs.length === 0) continue

      // Check each algorithm against library enrichment entries for this row's refs
      for (const algo of algosInAnswer) {
        let foundInEnrichment = false
        for (const ref of libRefs) {
          const enrichment = libraryFields.get(ref)
          if (!enrichment) continue
          const algosField = enrichment['PQC Algorithms Covered'] || ''
          if (fieldContains(algosField, algo)) {
            foundInEnrichment = true
            break
          }
        }
        // Also check module-level library enrichments
        if (!foundInEnrichment) {
          const modSet = moduleMap.get(moduleId)
          if (modSet) {
            for (const entry of modSet.libraryEntries) {
              const algosField = entry.fields['PQC Algorithms Covered'] || ''
              if (fieldContains(algosField, algo)) {
                foundInEnrichment = true
                break
              }
            }
          }
        }
        // Only flag if the algorithm is NOT a commonly known PQC algorithm
        // (enrichments may not list every algorithm in every document)
        if (!foundInEnrichment && libRefs.length > 0) {
          // Only flag if a related enrichment exists but doesn't mention this algo
          const hasAnyEnrichment = libRefs.some(ref => libraryFields.has(ref))
          if (hasAnyEnrichment) {
            f.push(finding(latestQA, i + 2, 'answer', algo,
              `[${row.question_id}] Answer mentions algorithm "${algo}" but none of its library_refs (${libRefs.join(', ')}) enrichments list it in PQC Algorithms Covered`))
          }
        }
      }
    }
    results.push(makeCheck('N20-A', 'Q&A algorithm mentions vs. library enrichment PQC Algorithms Covered',
      latestQA, 'doc-enrichments', 'WARNING', f))
  }

  // N20-B: Compliance framework citations vs. library enrichment
  {
    const f: Finding[] = []
    for (let i = 0; i < qaRows.length; i++) {
      const row = qaRows[i]
      const answer = row.answer || ''
      const libRefs = splitSemicolon(row.library_refs)
      const standardsInAnswer = extractEntities(answer, STANDARD_RE)

      if (standardsInAnswer.length === 0 || libRefs.length === 0) continue

      for (const std of standardsInAnswer) {
        const normStd = normalizeStandard(std)
        // Check if standard appears in the referenced enrichments' compliance fields
        let foundInEnrichment = false
        for (const ref of libRefs) {
          const enrichment = libraryFields.get(ref)
          if (!enrichment) continue
          const compField = enrichment['Compliance Frameworks Referenced'] || ''
          const stdBodies = enrichment['Standardization Bodies'] || ''
          if (fieldContains(compField, std) || fieldContains(stdBodies, std)) {
            foundInEnrichment = true
            break
          }
          // Also check if the standard IS the referenced document itself
          if (normalizeStandard(ref).includes(normStd)) {
            foundInEnrichment = true
            break
          }
        }
        if (!foundInEnrichment) {
          // Check if this standard IS one of the library_refs (self-referencing)
          const isSelfRef = libRefs.some(ref => normalizeStandard(ref).includes(normStd))
          if (!isSelfRef) {
            f.push(finding(latestQA, i + 2, 'answer', std,
              `[${row.question_id}] Answer cites standard "${std}" not found in referenced enrichment compliance fields`))
          }
        }
      }
    }
    results.push(makeCheck('N20-B', 'Q&A compliance citations vs. library enrichment Compliance Frameworks',
      latestQA, 'doc-enrichments', 'WARNING', f))
  }

  // N20-E: Product mentions vs. product extraction
  {
    const f: Finding[] = []
    // Build product name set from all extractions
    const allProductNames = new Set<string>()
    for (const [, modSet] of moduleMap) {
      for (const prod of modSet.productEntries) {
        if (prod.name.length >= 5) allProductNames.add(prod.name)
      }
    }

    for (let i = 0; i < qaRows.length; i++) {
      const row = qaRows[i]
      const answer = row.answer || ''
      const moduleId = row.module_id || ''
      const migrateRefs = splitSemicolon(row.migrate_refs)

      if (migrateRefs.length === 0) continue

      const modSet = moduleMap.get(moduleId)
      if (!modSet || modSet.productEntries.length === 0) continue

      // Check if mentioned products have extraction data
      for (const ref of migrateRefs) {
        const hasExtraction = modSet.productEntries.some(p =>
          p.name.toLowerCase().includes(ref.toLowerCase()) ||
          ref.toLowerCase().includes(p.name.toLowerCase()))
        if (!hasExtraction && ref.length >= 5) {
          f.push(finding(latestQA, i + 2, 'migrate_refs', ref,
            `[${row.question_id}] migrate_ref "${ref}" has no matching product extraction for module ${moduleId}`))
        }
      }
    }
    results.push(makeCheck('N20-E', 'Q&A product mentions vs. product extractions',
      latestQA, 'product-extractions', 'INFO', f))
  }

  // N20-F: Glossary term consistency
  {
    const f: Finding[] = []
    for (let i = 0; i < qaRows.length; i++) {
      const row = qaRows[i]
      const moduleId = row.module_id || ''
      const modSet = moduleMap.get(moduleId)
      if (!modSet || modSet.glossaryEntries.length === 0) continue

      const answer = row.answer || ''
      for (const g of modSet.glossaryEntries) {
        // Check if the Q&A uses the term's acronym but the answer contradicts the definition
        if (g.acronym && answer.includes(g.acronym)) {
          // Look for explicit definitions in the answer that might conflict
          const defPattern = new RegExp(`${g.acronym}\\s*(?:is|stands for|means|refers to)\\s+([^.]+)`, 'i')
          const defMatch = answer.match(defPattern)
          if (defMatch && g.definition) {
            // Simple heuristic: if the expansion doesn't share key words with the glossary definition
            const expansion = defMatch[1].toLowerCase()
            const defWords = g.definition.toLowerCase().split(/\s+/).filter(w => w.length > 4)
            const matchCount = defWords.filter(w => expansion.includes(w)).length
            if (defWords.length > 3 && matchCount === 0) {
              f.push(finding(latestQA, i + 2, 'answer', g.acronym,
                `[${row.question_id}] Defines "${g.acronym}" as "${defMatch[1].trim().slice(0, 80)}" which may not match glossary: "${g.definition.slice(0, 80)}"`))
            }
          }
        }
      }
    }
    results.push(makeCheck('N20-F', 'Q&A term usage vs. glossary definitions',
      latestQA, 'glossaryData', 'INFO', f))
  }

  return results
}

// ── N21: rag-summary vs. enrichment ──────────────────────────────────────────

function runN21Checks(
  moduleMap: Map<string, ModuleEnrichmentSet>,
): CheckResult[] {
  const results: CheckResult[] = []
  const modulesDir = path.join(ROOT, 'src', 'components', 'PKILearning', 'modules')
  if (!fs.existsSync(modulesDir)) return results

  // Build module_id → directory name mapping
  const dirMap = new Map<string, string>()
  for (const dir of fs.readdirSync(modulesDir)) {
    const ragPath = path.join(modulesDir, dir, 'rag-summary.md')
    if (fs.existsSync(ragPath)) {
      // Derive module_id from directory name: PascalCase → kebab-case
      const kebab = dir
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
        .toLowerCase()
      dirMap.set(kebab, dir)
    }
  }

  // N21-A: rag-summary standard IDs vs. enrichment Compliance Frameworks Referenced
  {
    const f: Finding[] = []
    for (const [moduleId, dirName] of dirMap) {
      const ragPath = path.join(modulesDir, dirName, 'rag-summary.md')
      const ragContent = fs.readFileSync(ragPath, 'utf-8')
      const modSet = moduleMap.get(moduleId)
      if (!modSet || modSet.libraryEntries.length === 0) continue

      const standardsInRag = extractEntities(ragContent, STANDARD_RE)
      if (standardsInRag.length === 0) continue

      // Collect all compliance frameworks mentioned across module's library enrichments
      const enrichmentStandards = new Set<string>()
      for (const entry of modSet.libraryEntries) {
        const comp = entry.fields['Compliance Frameworks Referenced'] || ''
        const stdBodies = entry.fields['Standardization Bodies'] || ''
        const protocols = entry.fields['Protocols Covered'] || ''
        const combined = `${comp} ${stdBodies} ${protocols}`
        for (const std of extractEntities(combined, STANDARD_RE)) {
          enrichmentStandards.add(normalizeStandard(std))
        }
        // Also add the refId itself as a known standard
        enrichmentStandards.add(normalizeStandard(entry.refId))
      }

      for (const std of standardsInRag) {
        const norm = normalizeStandard(std)
        // Check if this standard is known in any enrichment
        const isKnown = [...enrichmentStandards].some(es =>
          es.includes(norm) || norm.includes(es))
        // Only flag CIP standards — these are the ones that caused real errors
        if (!isKnown && /^CIP-\d{3}$/i.test(std)) {
          f.push(finding(`${dirName}/rag-summary.md`, null, 'standards', std,
            `[${moduleId}] rag-summary references "${std}" but no library enrichment for this module mentions it`))
        }
      }
    }
    results.push(makeCheck('N21-A', 'rag-summary standard IDs vs. enrichment Compliance Frameworks',
      'rag-summary', 'doc-enrichments',
      f.some(fi => /^CIP-\d{3}$/i.test(fi.value)) ? 'ERROR' : 'WARNING', f))
  }

  // N21-B: rag-summary algorithm names vs. enrichment PQC Algorithms Covered
  {
    const f: Finding[] = []
    for (const [moduleId, dirName] of dirMap) {
      const ragPath = path.join(modulesDir, dirName, 'rag-summary.md')
      const ragContent = fs.readFileSync(ragPath, 'utf-8')
      const modSet = moduleMap.get(moduleId)
      if (!modSet || modSet.libraryEntries.length === 0) continue

      const algosInRag = extractEntities(ragContent, ALGO_RE)
      if (algosInRag.length === 0) continue

      // Collect all algorithms from module's library enrichments
      const enrichmentAlgos = new Set<string>()
      for (const entry of modSet.libraryEntries) {
        const algosField = entry.fields['PQC Algorithms Covered'] || ''
        for (const algo of extractEntities(algosField, ALGO_RE)) {
          enrichmentAlgos.add(normalizeAlgo(algo))
        }
      }

      // Only flag if the module has enrichments that cover algorithms but a specific
      // algo in the rag-summary isn't mentioned anywhere in enrichments
      if (enrichmentAlgos.size === 0) continue

      for (const algo of algosInRag) {
        const norm = normalizeAlgo(algo)
        // Check base algorithm (e.g., ML-KEM without parameter level)
        const baseAlgo = norm.replace(/-\d+$/, '')
        const isKnown = [...enrichmentAlgos].some(ea =>
          ea === norm || ea.startsWith(baseAlgo) || norm.startsWith(ea.replace(/-\d+$/, '')))
        if (!isKnown) {
          f.push(finding(`${dirName}/rag-summary.md`, null, 'algorithms', algo,
            `[${moduleId}] rag-summary references "${algo}" but no library enrichment mentions this algorithm family`))
        }
      }
    }
    results.push(makeCheck('N21-B', 'rag-summary algorithm names vs. enrichment PQC Algorithms Covered',
      'rag-summary', 'doc-enrichments', 'WARNING', f))
  }

  // N21-D: rag-summary product mentions vs. product extractions
  {
    const f: Finding[] = []
    for (const [moduleId, dirName] of dirMap) {
      const ragPath = path.join(modulesDir, dirName, 'rag-summary.md')
      const ragContent = fs.readFileSync(ragPath, 'utf-8')
      const modSet = moduleMap.get(moduleId)
      if (!modSet || modSet.productEntries.length === 0) continue

      // Extract product names mentioned in rag-summary by checking against known products
      const productNames = modSet.productEntries.map(p => p.name).filter(n => n.length >= 5)
      for (const prodName of productNames) {
        // Check if product is mentioned in rag-summary
        if (ragContent.toLowerCase().includes(prodName.toLowerCase())) {
          // Verify the extraction's pqc_support field
          const extraction = modSet.productEntries.find(p => p.name === prodName)
          if (extraction) {
            const pqcSupport = extraction.fields.pqc_support || ''
            const pqcDesc = extraction.fields.pqc_capability_description || ''
            // If rag-summary claims PQC support but extraction says No, flag it
            const ragMentionsPQC = ragContent.toLowerCase().includes(prodName.toLowerCase())
            if (ragMentionsPQC && /^No\b/i.test(pqcSupport)) {
              f.push(finding(`${dirName}/rag-summary.md`, null, 'product_pqc', prodName,
                `[${moduleId}] rag-summary mentions "${prodName}" — product extraction says pqc_support="${pqcSupport}"`))
            }
          }
        }
      }
    }
    results.push(makeCheck('N21-D', 'rag-summary product mentions vs. product extractions',
      'rag-summary', 'product-extractions', 'INFO', f))
  }

  // N21-E: rag-summary glossary term consistency
  {
    const f: Finding[] = []
    for (const [moduleId, dirName] of dirMap) {
      const ragPath = path.join(modulesDir, dirName, 'rag-summary.md')
      const ragContent = fs.readFileSync(ragPath, 'utf-8')
      const modSet = moduleMap.get(moduleId)
      if (!modSet || modSet.glossaryEntries.length === 0) continue

      for (const g of modSet.glossaryEntries) {
        if (!g.acronym || !g.definition) continue
        // Check for explicit expansions in rag-summary that might contradict glossary
        const expansionPattern = new RegExp(
          `${g.acronym}\\s*\\(([^)]+)\\)`, 'i')
        const expMatch = ragContent.match(expansionPattern)
        if (expMatch) {
          const ragExpansion = expMatch[1].toLowerCase().trim()
          const glossaryDef = g.definition.toLowerCase()
          // Check if the expansion shares at least some key words with the definition
          const expWords = ragExpansion.split(/\s+/).filter(w => w.length > 3)
          const defWords = glossaryDef.split(/\s+/).filter(w => w.length > 3)
          const overlap = expWords.filter(w => defWords.some(dw => dw.includes(w) || w.includes(dw)))
          if (expWords.length > 2 && overlap.length === 0) {
            f.push(finding(`${dirName}/rag-summary.md`, null, 'glossary', g.acronym,
              `[${moduleId}] Expands "${g.acronym}" as "${expMatch[1].trim()}" — glossary says: "${g.definition.slice(0, 80)}"`))
          }
        }
      }
    }
    results.push(makeCheck('N21-E', 'rag-summary glossary term usage consistency',
      'rag-summary', 'glossaryData', 'INFO', f))
  }

  return results
}

// ── Public entry point ───────────────────────────────────────────────────────

export function runEnrichmentCrossChecks(): { results: CheckResult[] } {
  const moduleMap = buildModuleEnrichmentMap()
  const libraryFields = loadEnrichmentFields('library')

  const results: CheckResult[] = [
    ...runN20Checks(moduleMap, libraryFields),
    ...runN21Checks(moduleMap),
  ]

  return { results }
}
