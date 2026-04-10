#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
/**
 * generate-embed-manifest.mjs
 *
 * Scans pqc-timeline-app source files and emits public/embed/manifest.json
 * describing all embeddable resources (presets, modules, tools, personas).
 *
 * Consumed by pqc-admin at startup to populate the certificate issuance wizard
 * with the current resource inventory — no manual sync required.
 *
 * Run: node scripts/generate-embed-manifest.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readSrc(relPath) {
  return fs.readFileSync(path.join(ROOT, 'src', relPath), 'utf-8')
}

/**
 * Extract route preset entries: key name → paths array
 * Matches the ROUTE_PRESETS object literal in routePresets.ts
 */
function extractRoutePresets(src) {
  // Match: key: ['/path1', '/path2']
  const re = /^\s+(\w+):\s*\[([^\]]+)\]/gm
  const presets = []
  for (const m of src.matchAll(re)) {
    const key = m[1]
    if (key === 'ROUTE_PRESETS') continue // skip the outer const line
    const pathsRaw = m[2]
    const paths = [...pathsRaw.matchAll(/['"]([^'"]+)['"]/g)].map((p) => p[1])
    presets.push({ id: key, paths })
  }
  return presets
}

// ---------------------------------------------------------------------------
// Extract modules from moduleData.ts
// ---------------------------------------------------------------------------

function extractModules(src) {
  const modules = []
  // Find each MODULE_CATALOG entry by matching the outer object key + inner fields
  // Pattern: '  some-id': {\n    id: 'some-id',\n    title: '...',\n    ...
  // We iterate through id: '...' occurrences, then look ahead for title/difficulty/duration
  const idRe = /^\s+id:\s*'([^']+)'/gm
  let m
  while ((m = idRe.exec(src)) !== null) {
    const id = m[1]
    if (id === 'quiz' || id === 'assess') continue // special modules, skip
    const snippet = src.slice(m.index, m.index + 800)
    const titleMatch = snippet.match(/title:\s*'([^']+)'/)
    const difficultyMatch = snippet.match(/difficulty:\s*'([^']+)'/)
    const durationMatch = snippet.match(/duration:\s*'([^']+)'/)
    if (!titleMatch) continue // not a MODULE_CATALOG entry (step sub-object etc.)
    modules.push({
      id,
      title: titleMatch[1],
      difficulty: difficultyMatch ? difficultyMatch[1] : 'intermediate',
      duration: durationMatch ? durationMatch[1] : '',
    })
  }
  return modules
}

// ---------------------------------------------------------------------------
// Extract workshop tools from workshopRegistry.tsx
// ---------------------------------------------------------------------------

function extractWorkshopTools(src) {
  const tools = []
  const idRe = /^\s+id:\s*'([^']+)'/gm
  let m
  while ((m = idRe.exec(src)) !== null) {
    const id = m[1]
    const snippet = src.slice(m.index, m.index + 300)
    const nameMatch = snippet.match(/name:\s*'([^']+)'/)
    const categoryMatch = snippet.match(/category:\s*'([^']+)'/)
    const difficultyMatch = snippet.match(/difficulty:\s*'([^']+)'/)
    if (!nameMatch) continue
    tools.push({
      id,
      name: nameMatch[1],
      category: categoryMatch ? categoryMatch[1] : '',
      difficulty: difficultyMatch ? difficultyMatch[1] : 'intermediate',
    })
  }
  return tools
}

// ---------------------------------------------------------------------------
// Extract business tools from businessToolsRegistry.tsx
// ---------------------------------------------------------------------------

function extractBusinessTools(src) {
  const tools = []
  const idRe = /^\s+id:\s*'([^']+)'/gm
  let m
  while ((m = idRe.exec(src)) !== null) {
    const id = m[1]
    const snippet = src.slice(m.index, m.index + 300)
    const nameMatch = snippet.match(/name:\s*'([^']+)'/)
    const categoryMatch = snippet.match(/category:\s*'([^']+)'/)
    if (!nameMatch) continue
    tools.push({
      id,
      name: nameMatch[1],
      category: categoryMatch ? categoryMatch[1] : '',
    })
  }
  return tools
}

// ---------------------------------------------------------------------------
// Extract persona IDs from learningPersonas.ts
// ---------------------------------------------------------------------------

function extractPersonas(src) {
  // PersonaId = 'executive' | 'developer' | ... | 'curious'
  // Match the union type on a single line to avoid greedy cross-line matching
  const typeMatch = src.match(/PersonaId\s*=\s*([^\n]+)/)
  if (!typeMatch) return ['executive', 'developer', 'architect', 'researcher', 'ops', 'curious']
  return [...typeMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
}

// ---------------------------------------------------------------------------
// Read version from package.json
// ---------------------------------------------------------------------------

function getVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'))
  return pkg.version ?? '0.0.0'
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const routePresetsSrc = readSrc('embed/routePresets.ts')
const moduleDataSrc = readSrc('components/PKILearning/moduleData.ts')
const workshopSrc = readSrc('components/Playground/workshopRegistry.tsx')
const businessSrc = readSrc('components/BusinessCenter/businessToolsRegistry.tsx')
const personasSrc = readSrc('data/learningPersonas.ts')

const routePresets = extractRoutePresets(routePresetsSrc)
const modules = extractModules(moduleDataSrc)
const playgroundTools = extractWorkshopTools(workshopSrc)
const businessTools = extractBusinessTools(businessSrc)
const personas = extractPersonas(personasSrc)

const manifest = {
  version: getVersion(),
  generatedAt: new Date().toISOString(),
  resources: {
    routePresets,
    modules,
    playgroundTools,
    businessTools,
    personas,
  },
  policy: {
    regions: ['global', 'us', 'eu', 'apac', 'latam', 'mena'],
    industries: [
      'finance',
      'healthcare',
      'government',
      'telecom',
      'energy',
      'defense',
      'technology',
      'education',
    ],
    roles: ['curious', 'basics', 'expert'],
    persistModes: ['api', 'postMessage', 'none'],
    difficulties: ['beginner', 'intermediate', 'advanced'],
  },
}

// Ensure output directory exists
const outDir = path.join(ROOT, 'public', 'embed')
fs.mkdirSync(outDir, { recursive: true })

const outPath = path.join(outDir, 'manifest.json')
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8')

console.log(
  `[generate-embed-manifest] ✓ ${modules.length} modules, ${playgroundTools.length} playground tools, ${businessTools.length} business tools, ${routePresets.length} presets`
)
console.log(`[generate-embed-manifest] → ${path.relative(ROOT, outPath)}`)
