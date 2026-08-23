#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/export-learn-manifest-snapshot.ts
 *
 * Learn-module snapshot exporter for the maintainer agent (Phase 0 of the
 * learn-modules maintenance plan). Emits ONE JSON snapshot (schemaVersion 1)
 * of all Learn modules for the Python-side maintenance validators.
 *
 * Loading strategy (NO regex-only parsing of TypeScript):
 *  - manifest.ts files carry only a type-only import (erased by tsx/esbuild)
 *    plus a lazy `load: () => import('./index')` that is NEVER invoked here,
 *    so each manifest is execute-imported directly — the same real-module
 *    source of truth the app compiles with.
 *  - content.ts files import the data spine (standardsRegistry et al.) which
 *    uses Vite-only `import.meta.glob` and cannot execute under plain tsx, so
 *    their facts are extracted via the TypeScript compiler AST.
 *  - algorithmProperties.ts / frameworkPhases.ts have no runtime imports and
 *    are execute-imported (with an AST fallback if that ever changes).
 *  - Component free text (components/, workshop/, index.tsx) is extracted via
 *    the TS AST: JSXText plus prose-looking string literals; class names,
 *    imports and identifiers are ignored.
 *
 * Usage:
 *   npx tsx scripts/export-learn-manifest-snapshot.ts --out <path>
 *   npx tsx scripts/export-learn-manifest-snapshot.ts --check-freshness [--age-days N]
 *
 * Exit codes:
 *   0 — snapshot written (and/or freshness report printed)
 *   1 — fewer than 50 modules found, snapshot failed self-validation, or bad CLI
 *       usage (a 0/0 pass is impossible by design)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'
import { decodeJsxEntities } from './lib/jsxEntities'
import { KNOWN_MISSING } from './audit-module-infographics'
// Runtime constant (the default tab set); the file's other imports are
// type-only and erased by tsx, so this execute-imports cleanly.
import { STANDARD_TABS } from '../src/components/PKILearning/manifest/types'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MODULES_DIR = path.join(REPO_ROOT, 'src/components/PKILearning/modules')
const INFOGRAPHIC_DIR = path.join(REPO_ROOT, 'public/images/infographics')
const MIN_MODULES = 50
const DEFAULT_AGE_DAYS = 180

// ── Snapshot types (schemaVersion 1 — the Python side is built against this) ─

interface DeadlineEntry {
  date: string | null
  label: string | null
  source: string | null
}

interface ComponentFileEntry {
  path: string
  chars: number
  text: string
}

/**
 * A hardcoded product reference: a `catalogName: '<string>'` property in a
 * module source file, naming a `software_name` row in the central migrate
 * catalog (resolved at runtime by src/data/catalogStatus.ts getCatalogStatus,
 * which silently returns null for stale names). Resolution against the
 * catalog CSV happens Python-side — this script only extracts.
 */
interface ProductRefEntry {
  file: string
  name: string
}

interface ModuleSnapshot {
  dir: string
  id: string
  lmId: string | null
  title: string
  description: string | null
  difficulty: string | null
  duration: string | null
  track: string | null
  trackOrder: number | null
  frameworkPhase: string[]
  embeddable: boolean
  playgroundTool: string | null
  practiceInSim: boolean
  whyThisMatters: string | null
  taxonomyAlgorithms: string[]
  taxonomyStandards: string[]
  learningObjectives: string[] | null
  prerequisites: string[] | null
  learnSectionCount: number
  workshopStepCount: number
  hasContentTs: boolean
  contentVersion: string | null
  lastReviewed: string | null
  standardIds: string[]
  algorithmIds: string[]
  deadlines: DeadlineEntry[]
  narratives: Record<string, string>
  componentFiles: ComponentFileEntry[]
  productRefs: ProductRefEntry[]
  tabs: string[]
  hasExercises: boolean
  infographicStatus: 'present' | 'known-missing' | 'missing'
}

interface Snapshot {
  schemaVersion: 1
  moduleCount: number
  algorithmRegistryIds: string[]
  frameworkPhaseIds: string[]
  modules: ModuleSnapshot[]
}

// The manifest shape as loaded at runtime (subset of ModuleManifest we read).
interface LoadedManifest {
  id: string
  lm_id?: string
  title: string
  description?: string
  duration?: string
  difficulty?: string
  frameworkPhase: string | string[]
  track?: string
  trackOrder?: number
  learnSections?: { id: string; label: string }[]
  workshopSteps?: { id: string; label: string }[]
  stepCountOverride?: number
  embeddable?: boolean
  playgroundTool?: string
  practiceInSim?: boolean
  whyThisMatters?: string
  taxonomy?: { algorithms?: string[]; standards?: string[] }
  tabs?: { value: string; label: string }[]
  custom?: boolean
  learningObjectives?: string[]
  prerequisites?: string[]
}

// ── AST helpers ─────────────────────────────────────────────────────────────

function parseFile(filePath: string): ts.SourceFile {
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf-8'),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
}

/** Best-effort plain text of a (possibly concatenated / template) expression. */
function textOfExpression(node: ts.Node): string {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isTemplateExpression(node)) {
    const parts = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)]
    return parts.filter(Boolean).join(' ').trim()
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return textOfExpression(node.left) + textOfExpression(node.right)
  }
  if (ts.isParenthesizedExpression(node)) return textOfExpression(node.expression)
  return ''
}

function propName(prop: ts.ObjectLiteralElementLike): string | null {
  if (!ts.isPropertyAssignment(prop)) return null
  const n = prop.name
  if (ts.isIdentifier(n) || ts.isStringLiteral(n)) return n.text
  return null
}

function findProperty(obj: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  for (const p of obj.properties) {
    if (propName(p) === name && ts.isPropertyAssignment(p)) return p.initializer
  }
  return undefined
}

// ── content.ts fact extraction ──────────────────────────────────────────────

interface ContentFacts {
  version: string | null
  lastReviewed: string | null
  standardIds: string[]
  algorithmIds: string[]
  deadlines: DeadlineEntry[]
  narratives: Record<string, string>
  /**
   * True when the file contains a ModuleContent-shaped object (a `moduleId`
   * property). MLSGroupMessaging's content.ts is a known deviation: it exports
   * module-local LEARN_CHAPTERS prose instead of a ModuleContent object.
   */
  conforms: boolean
}

const EMPTY_FACTS: Omit<ContentFacts, 'conforms'> = {
  version: null,
  lastReviewed: null,
  standardIds: [],
  algorithmIds: [],
  deadlines: [],
  narratives: {},
}

function extractContentFacts(contentPath: string): ContentFacts {
  const sf = parseFile(contentPath)
  const facts: ContentFacts = {
    version: null,
    lastReviewed: null,
    standardIds: [],
    algorithmIds: [],
    deadlines: [],
    narratives: {},
    conforms: false,
  }

  // Collect every getStandard('...') / getAlgorithm('...') call in the file.
  const seenStd = new Set<string>()
  const seenAlg = new Set<string>()
  const collectCalls = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const fn = node.expression.text
      const arg = node.arguments[0]
      if (arg && ts.isStringLiteral(arg)) {
        if (fn === 'getStandard' && !seenStd.has(arg.text)) {
          seenStd.add(arg.text)
          facts.standardIds.push(arg.text)
        } else if (fn === 'getAlgorithm' && !seenAlg.has(arg.text)) {
          seenAlg.add(arg.text)
          facts.algorithmIds.push(arg.text)
        }
      }
    }
    ts.forEachChild(node, collectCalls)
  }
  collectCalls(sf)

  // Find the main content object literal: prefer a top-level object with a
  // `moduleId` property (the `export const content: ModuleContent = {...}`).
  let contentObj: ts.ObjectLiteralExpression | undefined
  const findContentObj = (node: ts.Node): void => {
    if (contentObj) return
    if (ts.isObjectLiteralExpression(node) && findProperty(node, 'moduleId')) {
      contentObj = node
      return
    }
    ts.forEachChild(node, findContentObj)
  }
  findContentObj(sf)
  if (!contentObj) return facts
  facts.conforms = true

  const versionNode = findProperty(contentObj, 'version')
  if (versionNode) facts.version = textOfExpression(versionNode) || null
  const reviewedNode = findProperty(contentObj, 'lastReviewed')
  if (reviewedNode) facts.lastReviewed = textOfExpression(reviewedNode) || null

  // deadlines: [{ label, year|date, source }, ...] — best-effort per field;
  // computed values (e.g. parseInt(NIST_DEPRECATION...)) become null.
  const deadlinesNode = findProperty(contentObj, 'deadlines')
  if (deadlinesNode && ts.isArrayLiteralExpression(deadlinesNode)) {
    for (const el of deadlinesNode.elements) {
      if (!ts.isObjectLiteralExpression(el)) continue
      const entry: DeadlineEntry = { date: null, label: null, source: null }
      const labelNode = findProperty(el, 'label')
      if (labelNode) entry.label = textOfExpression(labelNode) || null
      const sourceNode = findProperty(el, 'source')
      if (sourceNode) entry.source = textOfExpression(sourceNode) || null
      const dateNode = findProperty(el, 'year') ?? findProperty(el, 'date')
      if (dateNode) {
        if (ts.isNumericLiteral(dateNode)) entry.date = dateNode.text
        else {
          const t = textOfExpression(dateNode)
          entry.date = t || null
        }
      }
      facts.deadlines.push(entry)
    }
  }

  // narratives: { key: 'text', ... } — key → concatenated string text.
  const narrativesNode = findProperty(contentObj, 'narratives')
  if (narrativesNode && ts.isObjectLiteralExpression(narrativesNode)) {
    for (const p of narrativesNode.properties) {
      const key = propName(p)
      if (!key || !ts.isPropertyAssignment(p)) continue
      const text = textOfExpression(p.initializer).trim()
      if (text) facts.narratives[key] = text
    }
  }

  return facts
}

// ── Component free-text extraction ──────────────────────────────────────────

// Attribute names that never carry learner-facing prose.
const ATTR_BLOCKLIST = new Set([
  'classname',
  'class',
  'id',
  'key',
  'src',
  'href',
  'to',
  'style',
  'rel',
  'target',
  'type',
  'name',
  'htmlfor',
  'viewbox',
  'd',
  'path',
  'fill',
  'stroke',
  'width',
  'height',
  'xmlns',
  'variant',
  'size',
  'color',
  'data-testid',
  'testid',
  'value',
])

// Attribute names that are learner/AT-facing text even when short.
const ATTR_ALLOWLIST = new Set([
  'alt',
  'title',
  'label',
  'aria-label',
  'aria-description',
  'placeholder',
  'description',
  'subtitle',
  'caption',
  'tooltip',
  'helpertext',
  'heading',
])

const CLASS_UTIL_FNS = new Set(['cn', 'clsx', 'cva', 'classnames', 'twmerge'])

/** Token that looks like a Tailwind/CSS utility rather than a word. */
const UTILITY_TOKEN = /^[a-z0-9\-:[\]/.%!&>_()#,']+$/

function isProse(s: string): boolean {
  const t = s.trim()
  if (t.length < 20) return false
  const tokens = t.split(/\s+/)
  if (tokens.length < 4) return false
  const utilityish = tokens.filter((tok) => UTILITY_TOKEN.test(tok) && /[-:[]/.test(tok)).length
  if (utilityish / tokens.length > 0.5) return false
  return /[.,;:!?]/.test(t) || /\b[A-Z][a-z]{2,}/.test(t) || tokens.length >= 8
}

function insideClassUtilityCall(node: ts.Node): boolean {
  let cur: ts.Node | undefined = node.parent
  for (let depth = 0; cur && depth < 6; depth++, cur = cur.parent) {
    if (
      ts.isCallExpression(cur) &&
      ts.isIdentifier(cur.expression) &&
      CLASS_UTIL_FNS.has(cur.expression.text.toLowerCase())
    ) {
      return true
    }
  }
  return false
}

function enclosingJsxAttributeName(node: ts.Node): string | null {
  let cur: ts.Node | undefined = node.parent
  for (let depth = 0; cur && depth < 4; depth++, cur = cur.parent) {
    if (ts.isJsxAttribute(cur)) return cur.name.getText().toLowerCase()
    if (ts.isJsxElement(cur) || ts.isJsxFragment(cur) || ts.isSourceFile(cur)) return null
  }
  return null
}

function insideImportOrExport(node: ts.Node): boolean {
  let cur: ts.Node | undefined = node.parent
  for (let depth = 0; cur && depth < 3; depth++, cur = cur.parent) {
    if (ts.isImportDeclaration(cur) || ts.isExportDeclaration(cur)) return true
  }
  return false
}

/** Extract human-readable text from one .tsx file. Recall over precision. */
function extractComponentText(filePath: string): string {
  const sf = parseFile(filePath)
  const parts: string[] = []
  const seen = new Set<string>()

  const push = (raw: string): void => {
    const text = decodeJsxEntities(raw.replace(/\s+/g, ' ').trim())
    if (text.length < 2) return
    if (/^[\W_]+$/.test(text)) return // pure punctuation / arrows / bullets
    if (seen.has(text)) return
    seen.add(text)
    parts.push(text)
  }

  /**
   * `<sup>`/`<sub>` content belongs to the run of text around it, not beside
   * it. Pushed separately it is almost always 1-2 characters and dies on the
   * length guard above, so `2<sup>N</sup>` extracted as bare `2` — the
   * meaningful half deleted. That is how "a superposition over all 2^N basis
   * states" reached the accuracy checker as "over all 2 basis states".
   *
   * Eight live values across 7 module files: N, 48, -20, n, n/2, m, H, 400.
   */
  const appendInline = (marker: string, raw: string): void => {
    const text = decodeJsxEntities(raw.replace(/\s+/g, ' ').trim())
    if (!text) return
    if (parts.length === 0) {
      push(marker + text)
      return
    }
    const merged = parts[parts.length - 1] + marker + text
    parts[parts.length - 1] = merged
    seen.add(merged)
  }

  const visit = (node: ts.Node): void => {
    if (ts.isJsxElement(node)) {
      const tag = node.openingElement.tagName.getText().toLowerCase()
      if (tag === 'sup' || tag === 'sub') {
        const inner = node.children.map((c) => (ts.isJsxText(c) ? c.text : c.getText())).join('')
        appendInline(tag === 'sup' ? '^' : '_', inner)
        return // children consumed — do not re-visit them as standalone text
      }
    }
    if (ts.isJsxText(node)) {
      push(node.text)
    } else if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateExpression(node)
    ) {
      const text = textOfExpression(node)
      if (text && !insideImportOrExport(node) && !insideClassUtilityCall(node)) {
        const attr = enclosingJsxAttributeName(node)
        if (attr !== null) {
          if (ATTR_ALLOWLIST.has(attr) && text.trim().length >= 5) push(text)
          else if (!ATTR_BLOCKLIST.has(attr) && text.length > 20 && isProse(text)) push(text)
        } else if (node.parent && ts.isJsxExpression(node.parent)) {
          if (text.length > 20 && isProse(text)) push(text)
        } else if (text.length >= 30 && isProse(text)) {
          // Prose in const data arrays/objects outside JSX — the bulk of many
          // modules' learner-facing text lives here.
          push(text)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  return parts.join('\n')
}

/**
 * .tsx sitting directly in a module's own directory, excluding index.tsx
 * (already collected by the caller) and tests. NOT recursive: subdirectories
 * are picked up deliberately by name, so a new `services/`-shaped folder of
 * implementation code cannot silently enter the fact-checker's input.
 */
function listModuleRootTsx(moduleDir: string): string[] {
  if (!fs.existsSync(moduleDir)) return []
  return fs
    .readdirSync(moduleDir, { withFileTypes: true })
    .filter(
      (e) =>
        e.isFile() &&
        e.name.endsWith('.tsx') &&
        e.name !== 'index.tsx' &&
        !e.name.endsWith('.test.tsx') &&
        !e.name.endsWith('.spec.tsx')
    )
    .map((e) => path.join(moduleDir, e.name))
    .sort()
}

function listTsxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listTsxFiles(full))
    else if (
      entry.isFile() &&
      entry.name.endsWith('.tsx') &&
      !entry.name.endsWith('.test.tsx') &&
      !entry.name.endsWith('.spec.tsx')
    ) {
      out.push(full)
    }
  }
  return out.sort()
}

// ── Product references (catalogName → migrate catalog software_name) ────────

/** All non-test .ts/.tsx files in a module directory (root, data/, components/, workshop/, …). */
function listModuleSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listModuleSourceFiles(full))
    else if (
      entry.isFile() &&
      /\.tsx?$/.test(entry.name) &&
      !/\.(test|spec)\.tsx?$/.test(entry.name)
    ) {
      out.push(full)
    }
  }
  return out.sort()
}

/**
 * `catalogName` property assignments whose value is NOT a plain string
 * literal — these would be invisible to the extraction, so they are collected
 * and reported (non-fatally) at the end of the run.
 */
const nonLiteralCatalogRefs: string[] = []

function extractProductRefs(moduleDir: string): ProductRefEntry[] {
  const refs: ProductRefEntry[] = []
  for (const filePath of listModuleSourceFiles(moduleDir)) {
    const src = fs.readFileSync(filePath, 'utf-8')
    if (!src.includes('catalogName')) continue // cheap pre-filter; AST decides
    const sf = parseFile(filePath)
    const relPath = path.relative(REPO_ROOT, filePath)
    const visit = (node: ts.Node): void => {
      if (
        (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) &&
        (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
        node.name.text === 'catalogName'
      ) {
        const init = ts.isPropertyAssignment(node) ? node.initializer : undefined
        if (init && (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init))) {
          refs.push({ file: relPath, name: init.text })
        } else {
          const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
          nonLiteralCatalogRefs.push(`${relPath}:${line + 1} — ${node.getText(sf).slice(0, 80)}`)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }
  return refs
}

// ── Exercises-slot detection ────────────────────────────────────────────────

/**
 * How hasExercises was decided per module (reported non-fatally at end of run
 * when the file-existence fallback had to be used):
 *  - 'ast': at least one <ModuleShell …> JSX element exists in the module's
 *    source; hasExercises = some such element carries an `exercises` attribute
 *    (covers inline arrows, elements, and variables — TLSBasics wires it in
 *    TLSBasicsModule.tsx, not index.tsx, so ALL module files are scanned).
 *  - 'file-fallback': no ModuleShell JSX anywhere (custom modules like Quiz);
 *    hasExercises = a non-test components/*Exercises*.tsx file exists.
 */
const exercisesFallbackModules: string[] = []

function detectExercises(dirName: string, moduleDir: string): boolean {
  let sawModuleShell = false
  let wired = false
  for (const filePath of listModuleSourceFiles(moduleDir)) {
    if (!filePath.endsWith('.tsx')) continue
    const src = fs.readFileSync(filePath, 'utf-8')
    if (!src.includes('ModuleShell')) continue // cheap pre-filter; AST decides
    const sf = parseFile(filePath)
    const visit = (node: ts.Node): void => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(sf)
        if (tag === 'ModuleShell' || tag.endsWith('.ModuleShell')) {
          sawModuleShell = true
          for (const attr of node.attributes.properties) {
            if (ts.isJsxAttribute(attr) && attr.name.getText(sf) === 'exercises') wired = true
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }
  if (sawModuleShell) return wired

  exercisesFallbackModules.push(dirName)
  return listTsxFiles(path.join(moduleDir, 'components')).some((f) =>
    /exercises/i.test(path.basename(f))
  )
}

// ── Registry loading (execute-import, AST fallback) ─────────────────────────

async function loadAlgorithmRegistryIds(): Promise<string[]> {
  const filePath = path.join(REPO_ROOT, 'src/data/algorithmProperties.ts')
  try {
    const mod = (await import(pathToFileURL(filePath).href)) as {
      ALGORITHM_REGISTRY?: Record<string, unknown>
    }
    if (mod.ALGORITHM_REGISTRY) return Object.keys(mod.ALGORITHM_REGISTRY)
  } catch {
    // fall through to AST extraction
  }
  const sf = parseFile(filePath)
  const ids: string[] = []
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'ALGORITHM_REGISTRY' &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const p of node.initializer.properties) {
        const key = propName(p)
        if (key) ids.push(key)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return ids
}

async function loadFrameworkPhaseIds(): Promise<string[]> {
  const filePath = path.join(REPO_ROOT, 'src/data/frameworkPhases.ts')
  try {
    const mod = (await import(pathToFileURL(filePath).href)) as {
      PHASE_ORDER?: string[]
      FRAMEWORK_PHASES?: Record<string, unknown>
    }
    if (mod.PHASE_ORDER && mod.PHASE_ORDER.length > 0) return [...mod.PHASE_ORDER]
    if (mod.FRAMEWORK_PHASES) return Object.keys(mod.FRAMEWORK_PHASES)
  } catch {
    // fall through to AST extraction
  }
  const sf = parseFile(filePath)
  const ids: string[] = []
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'FRAMEWORK_PHASES' &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const p of node.initializer.properties) {
        const key = propName(p)
        if (key) ids.push(key)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return ids
}

// ── Snapshot assembly ───────────────────────────────────────────────────────

async function buildModuleSnapshot(
  dirName: string
): Promise<{ snapshot: ModuleSnapshot; contentConforms: boolean }> {
  const moduleDir = path.join(MODULES_DIR, dirName)
  const manifestPath = path.join(moduleDir, 'manifest.ts')

  // Execute-import the manifest. The lazy `load` closure is never invoked.
  const mod = (await import(pathToFileURL(manifestPath).href)) as { default: LoadedManifest }
  const m = mod.default
  if (!m || typeof m.id !== 'string' || typeof m.title !== 'string') {
    throw new Error(`manifest for ${dirName} did not yield an object with id/title`)
  }

  const contentPath = path.join(moduleDir, 'content.ts')
  const hasContentTs = fs.existsSync(contentPath)
  const facts: ContentFacts = hasContentTs
    ? extractContentFacts(contentPath)
    : { ...EMPTY_FACTS, conforms: false }

  // Component free text: index.tsx + everything under components/ + workshop/.
  const componentPaths: string[] = []
  const indexPath = path.join(moduleDir, 'index.tsx')
  if (fs.existsSync(indexPath)) componentPaths.push(indexPath)
  componentPaths.push(...listTsxFiles(path.join(moduleDir, 'components')))
  componentPaths.push(...listTsxFiles(path.join(moduleDir, 'workshop')))
  // ADDED 2026-08-22. Some modules put their main interactive teaching surface
  // at the module ROOT or in a sibling directory rather than under
  // components/workshop, and everything there was invisible to the accuracy
  // spot-check — it fact-checks exactly this list. Measured across all 65
  // modules: 7,312 KB was in scope and 943 KB was not (11%), concentrated in
  // five modules. The worst was Module1-Introduction, where the checker read
  // 2,033 characters while 107 KB of module-root .tsx sat unexamined; FiveG
  // (SuciFlow/AuthFlow/ProvisioningFlow), DigitalAssets (flows/), PKIWorkshop
  // and TLSBasics are the others.
  //
  // APPENDED LAST, deliberately. accuracy_spotcheck assembles narratives first,
  // then these files in order, then truncates at 24,000 chars — and 20 of 65
  // modules already hit that cap. Appending here means a capped module keeps
  // exactly the text it had (the new paths simply do not fit) while the
  // under-cap modules this is for absorb the addition; every one of the five
  // has 10-22k chars of headroom. So the widening costs no extra LLM spend and
  // cannot displace prose that was already being checked.
  //
  // services/, utils/ and hooks/ are deliberately NOT included: they are
  // implementation, not learner-facing prose, and extractComponentText would
  // mostly return identifier noise from them.
  componentPaths.push(...listModuleRootTsx(moduleDir))
  componentPaths.push(...listTsxFiles(path.join(moduleDir, 'flows')))
  componentPaths.push(...listTsxFiles(path.join(moduleDir, 'simulate')))
  // A content.ts that is NOT ModuleContent-shaped (MLSGroupMessaging's
  // LEARN_CHAPTERS) still carries learner-facing prose — surface it to the
  // fact-checker as a component-text entry so it isn't invisible.
  if (hasContentTs && !facts.conforms) componentPaths.push(contentPath)
  const componentFiles: ComponentFileEntry[] = componentPaths.map((p) => {
    const text = extractComponentText(p)
    return { path: path.relative(REPO_ROOT, p), chars: text.length, text }
  })

  const infographicPath = path.join(INFOGRAPHIC_DIR, `pqcstd_${m.id}.png`)
  const infographicStatus: ModuleSnapshot['infographicStatus'] = fs.existsSync(infographicPath)
    ? 'present'
    : KNOWN_MISSING.has(m.id)
      ? 'known-missing'
      : 'missing'

  const snapshot: ModuleSnapshot = {
    dir: dirName,
    id: m.id,
    lmId: m.lm_id ?? null,
    title: m.title,
    description: m.description ?? null,
    difficulty: m.difficulty ?? null,
    duration: m.duration ?? null,
    track: m.track ?? null,
    trackOrder: m.trackOrder ?? null,
    frameworkPhase: Array.isArray(m.frameworkPhase) ? [...m.frameworkPhase] : [m.frameworkPhase],
    embeddable: m.embeddable === true,
    playgroundTool: m.playgroundTool ?? null,
    practiceInSim: m.practiceInSim === true,
    whyThisMatters: m.whyThisMatters ?? null,
    taxonomyAlgorithms: m.taxonomy?.algorithms ?? [],
    taxonomyStandards: m.taxonomy?.standards ?? [],
    learningObjectives: m.learningObjectives ?? null,
    prerequisites: m.prerequisites ?? null,
    learnSectionCount: m.learnSections?.length ?? 0,
    workshopStepCount: m.workshopSteps?.length ?? m.stepCountOverride ?? 0,
    hasContentTs,
    contentVersion: facts.version,
    lastReviewed: facts.lastReviewed,
    standardIds: facts.standardIds,
    algorithmIds: facts.algorithmIds,
    deadlines: facts.deadlines,
    narratives: facts.narratives,
    componentFiles,
    productRefs: extractProductRefs(moduleDir),
    // Effective tab values: manifest.tabs when declared, else the app's
    // default set. NOTE: the Quiz module is custom:true (owns its whole body,
    // no ModuleTabBar) yet declares no tabs — it reports the default set here;
    // Python-side checks should exempt it (it is already content-exempt).
    tabs: (m.tabs ?? STANDARD_TABS).map((t) => t.value),
    hasExercises: detectExercises(dirName, moduleDir),
    infographicStatus,
  }
  return { snapshot, contentConforms: facts.conforms }
}

async function buildSnapshot(): Promise<{ snapshot: Snapshot; conformingDirs: Set<string> }> {
  if (!fs.existsSync(MODULES_DIR)) {
    console.error(`export-learn-manifest-snapshot: modules directory not found: ${MODULES_DIR}`)
    process.exit(1)
  }
  const dirs = fs
    .readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => fs.existsSync(path.join(MODULES_DIR, name, 'manifest.ts')))
    .sort()

  const modules: ModuleSnapshot[] = []
  const conformingDirs = new Set<string>()
  for (const dir of dirs) {
    const { snapshot, contentConforms } = await buildModuleSnapshot(dir)
    modules.push(snapshot)
    if (contentConforms) conformingDirs.add(dir)
  }

  return {
    snapshot: {
      schemaVersion: 1,
      moduleCount: modules.length,
      algorithmRegistryIds: await loadAlgorithmRegistryIds(),
      frameworkPhaseIds: await loadFrameworkPhaseIds(),
      modules,
    },
    conformingDirs,
  }
}

// ── Self-validation (built-in guard — no separate test file) ────────────────

function validateSnapshot(snap: Snapshot, conformingDirs: Set<string>): string[] {
  const problems: string[] = []
  if (snap.moduleCount < MIN_MODULES) {
    problems.push(
      `only ${snap.moduleCount} modules found (< ${MIN_MODULES}) — enumeration is broken`
    )
  }
  if (snap.moduleCount !== snap.modules.length) {
    problems.push(`moduleCount ${snap.moduleCount} !== modules.length ${snap.modules.length}`)
  }
  if (snap.algorithmRegistryIds.length === 0) problems.push('algorithmRegistryIds is empty')
  if (snap.frameworkPhaseIds.length === 0) problems.push('frameworkPhaseIds is empty')

  const seenIds = new Set<string>()
  const validStatus = new Set(['present', 'known-missing', 'missing'])
  for (const m of snap.modules) {
    const where = `module ${m.dir || '?'}`
    if (!m.dir) problems.push(`${where}: missing dir`)
    if (!m.id) problems.push(`${where}: missing id`)
    if (!m.title) problems.push(`${where}: missing title`)
    if (seenIds.has(m.id)) problems.push(`${where}: duplicate id "${m.id}"`)
    seenIds.add(m.id)
    if (m.frameworkPhase.length === 0) problems.push(`${where}: empty frameworkPhase`)
    if (!validStatus.has(m.infographicStatus)) {
      problems.push(`${where}: bad infographicStatus "${m.infographicStatus}"`)
    }
    // A ModuleContent-shaped content.ts that yields NO facts at all means the
    // AST extraction rotted — the exact silent-no-op failure mode this guard
    // exists to prevent. Nonconforming files (no moduleId object, e.g.
    // MLSGroupMessaging) are reported as gaps by the Python side instead.
    if (
      conformingDirs.has(m.dir) &&
      m.contentVersion === null &&
      m.lastReviewed === null &&
      m.standardIds.length === 0 &&
      m.algorithmIds.length === 0 &&
      Object.keys(m.narratives).length === 0
    ) {
      problems.push(
        `${where}: content.ts is ModuleContent-shaped but extraction produced zero facts`
      )
    }
    for (const f of m.componentFiles) {
      if (path.isAbsolute(f.path)) problems.push(`${where}: absolute componentFiles path ${f.path}`)
      if (f.chars !== f.text.length) {
        problems.push(`${where}: chars mismatch for ${f.path} (${f.chars} vs ${f.text.length})`)
      }
    }
    for (const r of m.productRefs) {
      if (path.isAbsolute(r.file)) problems.push(`${where}: absolute productRefs file ${r.file}`)
      if (!r.name || typeof r.name !== 'string') {
        problems.push(`${where}: empty productRefs name in ${r.file}`)
      }
    }
    if (m.tabs.length === 0 || m.tabs.some((t) => typeof t !== 'string' || t.length === 0)) {
      problems.push(`${where}: tabs must be a non-empty array of non-empty strings`)
    }
    if (typeof m.hasExercises !== 'boolean') {
      problems.push(`${where}: hasExercises is not a boolean`)
    }
  }
  return problems
}

// ── Freshness report ────────────────────────────────────────────────────────

function reportFreshness(snap: Snapshot, ageDays: number): void {
  const now = Date.now()
  const msPerDay = 24 * 60 * 60 * 1000
  type Row = { module: ModuleSnapshot; age: number | null }
  const stale: Row[] = []
  for (const m of snap.modules) {
    if (!m.lastReviewed) {
      stale.push({ module: m, age: null })
      continue
    }
    const reviewed = Date.parse(m.lastReviewed)
    if (Number.isNaN(reviewed)) {
      stale.push({ module: m, age: null })
      continue
    }
    const age = Math.floor((now - reviewed) / msPerDay)
    if (age > ageDays) stale.push({ module: m, age })
  }
  // Oldest first; missing/unparseable lastReviewed first of all.
  stale.sort((a, b) => (b.age ?? Number.MAX_SAFE_INTEGER) - (a.age ?? Number.MAX_SAFE_INTEGER))

  console.log(
    `freshness: ${stale.length}/${snap.moduleCount} modules overdue ` +
      `(lastReviewed missing or older than ${ageDays} days)`
  )
  for (const { module: m, age } of stale) {
    const tag = m.lmId ?? m.id
    if (age === null) {
      console.log(
        `STALE ${m.id} (${tag}): lastReviewed missing` + (m.hasContentTs ? '' : ' — no content.ts')
      )
    } else {
      console.log(`STALE ${m.id} (${tag}): lastReviewed ${m.lastReviewed} (${age} days old)`)
    }
  }
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): {
  out: string | null
  checkFreshness: boolean
  ageDays: number
} {
  let out: string | null = null
  let checkFreshness = false
  let ageDays = DEFAULT_AGE_DAYS
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out') {
      out = argv[++i] ?? null
      if (!out) {
        console.error('--out requires a path argument')
        process.exit(1)
      }
    } else if (a === '--check-freshness') {
      checkFreshness = true
    } else if (a === '--age-days') {
      const n = parseInt(argv[++i] ?? '', 10)
      if (Number.isNaN(n) || n <= 0) {
        console.error('--age-days requires a positive integer')
        process.exit(1)
      }
      ageDays = n
    } else {
      console.error(`unknown argument: ${a}`)
      process.exit(1)
    }
  }
  if (!out && !checkFreshness) {
    console.error(
      'usage: npx tsx scripts/export-learn-manifest-snapshot.ts --out <path> ' +
        '[--check-freshness] [--age-days N]'
    )
    process.exit(1)
  }
  return { out, checkFreshness, ageDays }
}

async function main(): Promise<void> {
  const { out, checkFreshness, ageDays } = parseArgs(process.argv.slice(2))

  const { snapshot, conformingDirs } = await buildSnapshot()

  const problems = validateSnapshot(snapshot, conformingDirs)
  if (problems.length > 0) {
    console.error(
      `FAIL export-learn-manifest-snapshot: snapshot failed self-validation ` +
        `(${problems.length} problem${problems.length === 1 ? '' : 's'}):`
    )
    for (const p of problems) console.error(`  - ${p}`)
    process.exit(1)
  }

  if (out) {
    const outPath = path.resolve(out)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + '\n', 'utf-8')
    console.log(`PASS wrote learn-module snapshot: ${snapshot.moduleCount} modules → ${outPath}`)
  }

  if (checkFreshness) {
    reportFreshness(snapshot, ageDays)
  }

  // Non-fatal: modules where hasExercises came from the file-existence
  // fallback (no ModuleShell JSX found) rather than the AST attribute check.
  if (exercisesFallbackModules.length > 0) {
    console.error(
      `INFO hasExercises used file-existence fallback (no ModuleShell JSX) for: ` +
        exercisesFallbackModules.join(', ')
    )
  }

  // Non-fatal: catalogName properties the string-literal extraction can't see.
  if (nonLiteralCatalogRefs.length > 0) {
    console.error(
      `WARN ${nonLiteralCatalogRefs.length} catalogName assignment(s) with non-string-literal ` +
        'values are invisible to productRefs extraction:'
    )
    for (const r of nonLiteralCatalogRefs) console.error(`  - ${r}`)
  }
}

main().catch((err) => {
  console.error('export-learn-manifest-snapshot failed:', err)
  process.exit(1)
})
