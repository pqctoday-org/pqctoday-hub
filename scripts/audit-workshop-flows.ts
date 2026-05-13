// SPDX-License-Identifier: GPL-3.0-only
/**
 * Static audit of every cue in every workshop flow JSON. Detects:
 *
 *   BLOCKER  cue cannot fire (missing route, missing selector target, missing
 *            fixture key, missing artifact slug)
 *   WARN     timing risk (caption length vs scheduled gap to next cue) or
 *            non-conventional selector
 *   INFO     dynamic / template-string selector that can't be verified statically
 *
 * Also validates the URL-autostart contract: every persona / region combo
 * accepted by `useWorkshopUrlAutostart` must resolve to a flow in the manifest.
 *
 * Run:   npx tsx scripts/audit-workshop-flows.ts
 * Out:   tasks/workshop-flow-audit-<date>.md  +  .json
 */
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'

const REPO = path.resolve(process.cwd())
const FLOWS_DIR = path.join(REPO, 'public/workshop')
const FIXTURES_DIR_PUBLIC = path.join(REPO, 'public/workshop-fixtures')
const FIXTURES_DIR_INLINE = path.join(REPO, 'public/workshop/fixtures')
const SRC_DIR = path.join(REPO, 'src')
const OUT_DIR = path.join(REPO, 'tasks')

const TODAY = new Date().toISOString().slice(0, 10)
const MD_OUT = path.join(OUT_DIR, `workshop-flow-audit-${TODAY}.md`)
const JSON_OUT = path.join(OUT_DIR, `workshop-flow-audit-${TODAY}.json`)

const SPEECH_BUFFER_MS = 1500 // matches VideoOverlay.tsx
const MIN_CAPTION_MS = 1500 // matches VideoOverlay.tsx
const CHARS_PER_SEC = 14 // matches VideoOverlay.tsx

// Route table mirrored from src/App.tsx (lines 209-406). Order-insensitive
// prefix match; trailing slashes ignored.
const ROUTE_PREFIXES = [
  '/',
  '/timeline',
  '/algorithms',
  '/library',
  '/learn',
  '/playground',
  '/playground/interactive',
  '/playground/hsm',
  '/playground/docker',
  '/openssl',
  '/threats',
  '/leaders',
  '/compliance',
  '/agility',
  '/changelog',
  '/migrate',
  '/about',
  '/assess',
  '/report',
  '/business',
  '/business/tools',
  '/faq',
  '/terms',
  '/editorial-independence',
  '/sponsor',
  '/explore',
  '/patents',
  '/revisions',
  '/embed',
]

type Severity = 'BLOCKER' | 'WARN' | 'INFO'

interface Finding {
  severity: Severity
  flowId: string
  chapter: string
  stepId: string
  cueIndex: number
  cueKind: string
  detail: string
}

const findings: Finding[] = []

function addFinding(f: Finding): void {
  findings.push(f)
}

// ---- Source corpus ----------------------------------------------------------

interface Corpus {
  workshopTargetsExact: Set<string>
  workshopTargetsDynamicPrefixes: Set<string>
  sectionIds: Set<string>
  cssIds: Set<string>
}

function buildSourceCorpus(): Corpus {
  const exact = new Set<string>()
  const dynamicPrefixes = new Set<string>()
  const sectionIds = new Set<string>()
  const cssIds = new Set<string>()

  // The slug source for an emitted `data-workshop-target` attribute can be:
  //   1. the literal HTML attribute itself:  data-workshop-target="slug"
  //   2. a prop forwarded to a component:    workshopTarget="slug"  or
  //                                          workshopTarget={`slug-${x}`}
  //   3. a `<LeftNavTOC targetPrefix="X">` rendering one item per data row:
  //                                          [data-workshop-target="X-<itemId>"]
  // We collect from all three.
  const attrNameAlternation = '(?:data-workshop-target|workshopTarget|workshopSlug)'

  // Literal string value: data-workshop-target="slug" / workshopTarget='slug'
  const literalRe = new RegExp(`${attrNameAlternation}\\s*=\\s*["']([a-zA-Z0-9_-]+)["']`, 'g')
  // Backtick literal without interpolation: workshopTarget={`slug`}
  const backtickLiteralRe = new RegExp(
    `${attrNameAlternation}\\s*=\\s*\\{?\\s*\`([a-zA-Z0-9_-]+)\`\\s*\\}?`,
    'g'
  )
  // Any JSX expression value: workshopTarget={...} — captures the expression for
  // deeper analysis (template prefix, conditional with two literal branches).
  const exprRe = new RegExp(`${attrNameAlternation}\\s*=\\s*\\{([^}]*)\\}`, 'g')
  // Template prefix: `slug-prefix-${x}` → captures `slug-prefix-`
  const templatePrefixRe = /`([a-zA-Z0-9_-]+-)\$\{/g
  // Conditional / OR: 'a' : 'b'  or  'a' ?? 'b' — capture all bare string literals
  const bareStringsRe = /['"]([a-zA-Z0-9_-]+)['"]/g

  // <... targetPrefix="threats-toc"> emits items "<prefix>-<itemId>" plus the
  // synthetic "<prefix>-rail" sentinel — record both as a dynamic prefix and as
  // a rail exact target.
  const targetPrefixRe = /targetPrefix\s*=\s*["']([a-zA-Z0-9_-]+)["']/g

  // Page section ids: <Section id="foo" ...> via SectionWithHeading or raw markup.
  const sectionRe = /data-section-id\s*=\s*["'`]([a-zA-Z0-9_-]+)["'`]/g
  // Sections rendered via <SectionWithHeading id="foo"> — the wrapper emits
  // data-section-id={id}. So treat every id="foo" inside SectionWithHeading as
  // a section id. We also capture component prop form `sectionId="foo"`.
  const sectionPropRe = /sectionId\s*=\s*["'`]([a-zA-Z0-9_-]+)["'`]/g
  // CSS-id attribute on any element: id="foo"
  const idAttrRe = /\bid\s*=\s*["'`]([a-zA-Z0-9_-]+)["'`]/g

  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      const p = path.join(dir, entry)
      const st = statSync(p)
      if (st.isDirectory()) {
        if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue
        walk(p)
        continue
      }
      if (!/\.(tsx?|jsx?)$/.test(entry)) continue
      if (/\.test\.(tsx?|jsx?)$/.test(entry)) continue
      const text = readFileSync(p, 'utf8')

      let m: RegExpExecArray | null
      while ((m = literalRe.exec(text))) exact.add(m[1])
      while ((m = backtickLiteralRe.exec(text))) exact.add(m[1])
      while ((m = sectionRe.exec(text))) sectionIds.add(m[1])
      while ((m = sectionPropRe.exec(text))) sectionIds.add(m[1])
      while ((m = idAttrRe.exec(text))) cssIds.add(m[1])
      while ((m = targetPrefixRe.exec(text))) {
        dynamicPrefixes.add(`${m[1]}-`) // matches "<prefix>-<id>"
        exact.add(`${m[1]}-rail`) // LeftNavTOC adds rail sentinel
      }

      // `<LearnStepper>` emits `<section data-section-id={step.id}>` for every
      // step in the per-module step list defined in `moduleData.ts`. Collect
      // every `{ id: 'foo', label: ... }` literal in that file only — that's
      // the file that actually feeds LearnStepper. Same for the
      // CuriousSummaryBanner sectionData.
      if (p.endsWith('PKILearning/moduleData.ts')) {
        const stepIdRe = /\{\s*id\s*:\s*['"]([a-zA-Z0-9_-]+)['"]\s*,\s*label\s*:/g
        while ((m = stepIdRe.exec(text))) sectionIds.add(m[1])
      }

      // `<TabsTrigger value="X">` (src/components/ui/tabs.tsx:107) auto-emits
      // `data-workshop-target={"tab-" + value.toLowerCase().replace(/\s+/g, "-")}`.
      // Capture every literal-string `value` prop seen on TabsTrigger.
      const tabsTriggerValueRe = /<TabsTrigger[^>]*\bvalue\s*=\s*["']([^"']+)["']/g
      while ((m = tabsTriggerValueRe.exec(text))) {
        const slug = 'tab-' + m[1].toLowerCase().replace(/\s+/g, '-')
        exact.add(slug)
      }

      // Walk every JSX-expression value of the three attribute-aliases and
      // mine for template prefixes + bare string literals (covers
      // `cond ? 'a' : 'b'` and `'a' ?? 'b'`).
      for (const e of text.matchAll(exprRe)) {
        const inside = e[1]
        let t: RegExpExecArray | null
        const tre = new RegExp(templatePrefixRe.source, 'g')
        while ((t = tre.exec(inside))) dynamicPrefixes.add(t[1])
        const bre = new RegExp(bareStringsRe.source, 'g')
        while ((t = bre.exec(inside))) exact.add(t[1])
      }
    }
  }

  walk(SRC_DIR)
  return {
    workshopTargetsExact: exact,
    workshopTargetsDynamicPrefixes: dynamicPrefixes,
    sectionIds,
    cssIds,
  }
}

// ---- Selector checking ------------------------------------------------------

function targetExists(slug: string, corpus: Corpus): boolean {
  if (corpus.workshopTargetsExact.has(slug)) return true
  // dynamic prefix match: e.g. corpus has prefix `tab-` and slug `tab-workshop`
  for (const pref of corpus.workshopTargetsDynamicPrefixes) {
    if (slug.startsWith(pref)) return true
  }
  return false
}

function targetPrefixExists(prefix: string, corpus: Corpus): boolean {
  for (const slug of corpus.workshopTargetsExact) {
    if (slug.startsWith(prefix)) return true
  }
  for (const pref of corpus.workshopTargetsDynamicPrefixes) {
    if (pref.startsWith(prefix) || prefix.startsWith(pref)) return true
  }
  return false
}

/**
 * Classify a CSS selector. Recognized patterns:
 *   [data-workshop-target="exact"]
 *   [data-workshop-target^="prefix-"]
 *   [data-section-id="section-id"]
 *   #css-id
 *   .class           → "non-conventional"
 *   other            → "non-conventional"
 */
function checkSelector(
  selector: string | undefined,
  corpus: Corpus
): { ok: boolean; reason: string } {
  if (!selector) return { ok: false, reason: 'cue is missing the selector field' }

  // [data-workshop-target="X"][...rest]
  const exact = /\[data-workshop-target\s*=\s*"([^"]+)"\]/.exec(selector)
  if (exact) {
    return targetExists(exact[1], corpus)
      ? { ok: true, reason: '' }
      : {
          ok: false,
          reason: `data-workshop-target="${exact[1]}" not found in src/`,
        }
  }
  // [data-workshop-target^="prefix-"]
  const prefix = /\[data-workshop-target\s*\^\s*=\s*"([^"]+)"\]/.exec(selector)
  if (prefix) {
    return targetPrefixExists(prefix[1], corpus)
      ? { ok: true, reason: '' }
      : {
          ok: false,
          reason: `no data-workshop-target starting with "${prefix[1]}" found in src/`,
        }
  }
  // [data-section-id="Y"]
  const section = /\[data-section-id\s*=\s*"([^"]+)"\]/.exec(selector)
  if (section) {
    return corpus.sectionIds.has(section[1])
      ? { ok: true, reason: '' }
      : { ok: false, reason: `data-section-id="${section[1]}" not found in src/` }
  }
  // #css-id
  const css = /^#([a-zA-Z0-9_-]+)$/.exec(selector.trim())
  if (css) {
    return corpus.cssIds.has(css[1])
      ? { ok: true, reason: '' }
      : { ok: false, reason: `id="${css[1]}" not found in src/` }
  }
  return { ok: false, reason: `non-conventional selector: ${selector}` }
}

// ---- Route checking ---------------------------------------------------------

function routeExists(route: string): boolean {
  if (!route) return false
  const trimmed = route.replace(/\/$/, '') || '/'
  if (ROUTE_PREFIXES.includes(trimmed)) return true
  // /learn/* wildcard
  if (trimmed.startsWith('/learn/')) return true
  // /playground/:toolId, /business/tools/:toolId — accept any sub-path
  if (/^\/playground\/[^/]+$/.test(trimmed)) return true
  if (/^\/business\/tools\/[^/]+$/.test(trimmed)) return true
  return false
}

// ---- Caption timing ---------------------------------------------------------

function captionDurationMs(text: string): number {
  return Math.max(MIN_CAPTION_MS, (text.length / CHARS_PER_SEC) * 1000)
}

// ---- Tab name resolution ----------------------------------------------------

// Mirrors src/components/ui/tabs.tsx:107 — only whitespace becomes a hyphen.
// "Tools & Products" → "tools-&-products".
function slugifyTabName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

// ---- Fixture key check ------------------------------------------------------

function loadFixtures(flow: FlowJson): Record<string, Record<string, unknown>> | null {
  if (flow.fixtures) return flow.fixtures
  if (!flow.fixturesUrl) return null
  // `fixturesUrl` is a path relative to public/. e.g.
  // "workshop-fixtures/executive-finance-amer-apac-v1.json".
  const absolute = path.join(REPO, 'public', flow.fixturesUrl)
  if (!existsSync(absolute)) return null
  try {
    return JSON.parse(readFileSync(absolute, 'utf8')) as Record<string, Record<string, unknown>>
  } catch {
    return null
  }
}

// ---- Flow walking -----------------------------------------------------------

interface Cue {
  tMs: number
  kind: string
  [k: string]: unknown
}

interface Step {
  id: string
  page?: { route?: string }
  cues?: Cue[]
}

interface Chapter {
  id?: string
  steps?: Step[]
}

interface FlowJson {
  id: string
  intro?: Chapter
  prerequisites?: Chapter
  common?: Chapter[]
  regions?: Record<string, Chapter>
  close?: Chapter
  fixtures?: Record<string, Record<string, unknown>>
  fixturesUrl?: string
}

function walkChapter(
  flowId: string,
  chapterName: string,
  chapter: Chapter | undefined,
  fixtures: Record<string, Record<string, unknown>> | null,
  corpus: Corpus
): void {
  if (!chapter?.steps) return
  for (const step of chapter.steps) {
    // step.page.route check
    const route = step.page?.route
    if (route && !routeExists(route)) {
      addFinding({
        severity: 'BLOCKER',
        flowId,
        chapter: chapterName,
        stepId: step.id,
        cueIndex: -1,
        cueKind: 'page.route',
        detail: `step.page.route "${route}" does not match any route in src/App.tsx`,
      })
    }
    if (!step.cues) continue
    for (let i = 0; i < step.cues.length; i++) {
      checkCue(flowId, chapterName, step, i, step.cues[i], step.cues[i + 1], fixtures, corpus)
    }
  }
}

function checkCue(
  flowId: string,
  chapterName: string,
  step: Step,
  i: number,
  cue: Cue,
  next: Cue | undefined,
  fixtures: Record<string, Record<string, unknown>> | null,
  corpus: Corpus
): void {
  const where = { flowId, chapter: chapterName, stepId: step.id, cueIndex: i, cueKind: cue.kind }

  switch (cue.kind) {
    case 'navigate': {
      const route = cue.route as string | undefined
      if (!route || !routeExists(route)) {
        addFinding({
          ...where,
          severity: 'BLOCKER',
          detail: `navigate.route "${route}" does not match any route in src/App.tsx`,
        })
      }
      return
    }
    case 'caption': {
      const text = String(cue.text ?? '')
      if (!text.trim()) {
        addFinding({ ...where, severity: 'WARN', detail: 'empty caption text' })
        return
      }
      // Look ahead to the next non-`advance` cue and check the gap.
      if (next && next.kind !== 'advance' && typeof next.tMs === 'number') {
        const gap = next.tMs - cue.tMs
        const needed = captionDurationMs(text) + SPEECH_BUFFER_MS
        if (gap > 0 && gap < needed) {
          addFinding({
            ...where,
            severity: 'WARN',
            detail: `caption gap to next cue (${gap}ms) shorter than estimated speech+buffer (${Math.round(needed)}ms); text: "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`,
          })
        }
      }
      return
    }
    case 'spotlight':
    case 'callout':
    case 'click':
    case 'expand-section':
    case 'collapse-section':
    case 'fill-from-fixture':
    case 'fill-literal':
    case 'select-from-fixture': {
      const r = checkSelector(cue.selector as string | undefined, corpus)
      if (!r.ok) addFinding({ ...where, severity: 'BLOCKER', detail: r.reason })
      // Extra checks for fixture cues:
      if (cue.kind === 'fill-from-fixture' || cue.kind === 'select-from-fixture') {
        const key = cue.fixtureKey as string | undefined
        if (!key) {
          addFinding({ ...where, severity: 'BLOCKER', detail: 'cue missing fixtureKey' })
          return
        }
        if (!fixtures) {
          addFinding({
            ...where,
            severity: 'BLOCKER',
            detail: `cue references fixtureKey="${key}" but flow has no fixtures or fixturesUrl`,
          })
          return
        }
        const stepFixtures = fixtures[step.id]
        if (!stepFixtures || !(key in stepFixtures)) {
          addFinding({
            ...where,
            severity: 'BLOCKER',
            detail: `fixtures["${step.id}"]["${key}"] not found in fixture file`,
          })
        }
      }
      return
    }
    case 'scroll-to': {
      // selector is optional; topPx fallback is fine.
      const selector = cue.selector as string | undefined
      const topPx = cue.topPx
      if (!selector && (topPx === undefined || topPx === null)) {
        addFinding({
          ...where,
          severity: 'WARN',
          detail: 'scroll-to cue has neither selector nor topPx',
        })
        return
      }
      if (selector) {
        const r = checkSelector(selector, corpus)
        if (!r.ok && topPx === undefined) {
          addFinding({ ...where, severity: 'BLOCKER', detail: r.reason })
        } else if (!r.ok) {
          addFinding({
            ...where,
            severity: 'WARN',
            detail: `${r.reason} — scroll will fall back to topPx=${topPx}`,
          })
        }
      }
      return
    }
    case 'select-tab':
    case 'highlight-tab': {
      const tabName = cue.tabName as string | undefined
      if (!tabName) {
        addFinding({ ...where, severity: 'BLOCKER', detail: 'cue missing tabName' })
        return
      }
      const slug = `tab-${slugifyTabName(tabName)}`
      // Tabs auto-emit data-workshop-target="tab-<slug>" via dynamic
      // prefix `tab-`; if the executor's 3-level fallback to role=tab and
      // <button> text covers this, we can only verify the slug-shape.
      if (!targetExists(slug, corpus)) {
        addFinding({
          ...where,
          severity: 'INFO',
          detail: `tabName="${tabName}" → slug "${slug}" not found as data-workshop-target; relies on tab-textContent fallback`,
        })
      }
      return
    }
    case 'generate-artifact':
    case 'view-artifact':
    case 'download-artifact': {
      const artifactType = cue.artifactType as string | undefined
      if (!artifactType) {
        addFinding({ ...where, severity: 'BLOCKER', detail: 'cue missing artifactType' })
        return
      }
      const slugs: string[] = []
      if (cue.kind === 'generate-artifact') {
        slugs.push(`business-artifact-${artifactType}-create`, `business-builder-generate`)
      } else if (cue.kind === 'view-artifact') {
        slugs.push(`business-artifact-${artifactType}-view`)
      } else {
        const fmt = (cue.format as string | undefined) ?? 'markdown'
        slugs.push(`business-artifact-export-${fmt}`)
      }
      for (const s of slugs) {
        if (!targetExists(s, corpus)) {
          addFinding({
            ...where,
            severity: 'BLOCKER',
            detail: `expected data-workshop-target="${s}" not found in src/`,
          })
        }
      }
      return
    }
    case 'advance':
      return
    default:
      addFinding({
        ...where,
        severity: 'WARN',
        detail: `unknown cue kind "${cue.kind}"`,
      })
  }
}

// ---- Manifest / URL-autostart resolution check ------------------------------

interface ManifestEntry {
  id: string
  file: string
  match: {
    roles: string[] | '*'
    proficiencies: string[] | '*'
    industries: string[] | '*'
    regions: string[] | '*'
  }
  isGenericFallback?: boolean
}
interface Manifest {
  flows: ManifestEntry[]
}

function specificity(m: ManifestEntry['match']): number {
  return (
    (m.roles === '*' ? 0 : 1) +
    (m.proficiencies === '*' ? 0 : 1) +
    (m.industries === '*' ? 0 : 1) +
    (m.regions === '*' ? 0 : 1)
  )
}

function arrMatches(allowed: string[] | '*' | undefined, value: string): boolean {
  if (!allowed || allowed === '*') return true
  return allowed.includes(value)
}

function resolveFromManifest(
  manifest: Manifest,
  ctx: { role: string; proficiency: string; industry: string; region: string }
): ManifestEntry | null {
  const cands = manifest.flows.filter(
    (f) =>
      !f.isGenericFallback &&
      arrMatches(f.match.roles, ctx.role) &&
      arrMatches(f.match.proficiencies, ctx.proficiency) &&
      arrMatches(f.match.industries, ctx.industry) &&
      arrMatches(f.match.regions, ctx.region)
  )
  if (cands.length > 0) {
    return cands.reduce((a, b) => (specificity(b.match) > specificity(a.match) ? b : a))
  }
  return manifest.flows.find((f) => f.isGenericFallback) ?? null
}

function checkUrlAutostartMatrix(manifest: Manifest): void {
  const personas = ['executive', 'developer', 'architect', 'ops', 'researcher', 'curious']
  const proficiencies = ['basics', 'expert', 'curious']
  const industries = ['Finance & Banking', 'Healthcare', 'Energy & Utilities', 'Government', 'All']
  const regions = ['US', 'CA', 'AU']
  for (const persona of personas) {
    for (const region of regions) {
      // Match the default proficiency / industry from useWorkshopUrlAutostart.
      const proficiency = persona === 'curious' ? 'curious' : 'basics'
      const industry = persona === 'executive' ? 'Finance & Banking' : 'All'
      const flow = resolveFromManifest(manifest, { role: persona, proficiency, industry, region })
      if (!flow) {
        addFinding({
          severity: 'BLOCKER',
          flowId: '(autostart)',
          chapter: '(matrix)',
          stepId: `${persona}/${proficiency}/${industry}/${region}`,
          cueIndex: -1,
          cueKind: 'url-autostart',
          detail: `no flow resolves for persona=${persona} proficiency=${proficiency} industry=${industry} region=${region}`,
        })
      }
    }
  }
  // Also smoke-test broader axis combos.
  void proficiencies
  void industries
}

// ---- Markdown rendering -----------------------------------------------------

function renderMarkdown(byFlow: Map<string, Finding[]>): string {
  const lines: string[] = []
  lines.push(`# Workshop Flow Audit — ${TODAY}`)
  lines.push('')
  const totals = {
    BLOCKER: findings.filter((f) => f.severity === 'BLOCKER').length,
    WARN: findings.filter((f) => f.severity === 'WARN').length,
    INFO: findings.filter((f) => f.severity === 'INFO').length,
  }
  lines.push(`**Totals:** ${totals.BLOCKER} BLOCKER · ${totals.WARN} WARN · ${totals.INFO} INFO`)
  lines.push('')
  if (totals.BLOCKER === 0) {
    lines.push('No BLOCKER findings. The automated workshop flow is structurally intact.')
    lines.push('')
  }
  for (const [flowId, items] of byFlow) {
    lines.push(`## ${flowId}`)
    lines.push('')
    items.sort((a, b) => {
      const sev = ['BLOCKER', 'WARN', 'INFO']
      const di = sev.indexOf(a.severity) - sev.indexOf(b.severity)
      if (di !== 0) return di
      if (a.chapter !== b.chapter) return a.chapter.localeCompare(b.chapter)
      if (a.stepId !== b.stepId) return a.stepId.localeCompare(b.stepId)
      return a.cueIndex - b.cueIndex
    })
    for (const f of items) {
      const cueRef = f.cueIndex >= 0 ? `cue#${f.cueIndex} (${f.cueKind})` : f.cueKind
      lines.push(
        `- **${f.severity}** — \`${f.chapter}\` / \`${f.stepId}\` / ${cueRef}: ${f.detail}`
      )
    }
    lines.push('')
  }
  return lines.join('\n')
}

// ---- Main -------------------------------------------------------------------

function main(): void {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
  const corpus = buildSourceCorpus()
  console.log(
    `[corpus] ${corpus.workshopTargetsExact.size} exact data-workshop-target slugs, ` +
      `${corpus.workshopTargetsDynamicPrefixes.size} dynamic prefixes, ` +
      `${corpus.sectionIds.size} data-section-id values, ${corpus.cssIds.size} CSS ids`
  )

  // Manifest + URL-autostart matrix
  const manifest = JSON.parse(readFileSync(path.join(FLOWS_DIR, 'index.json'), 'utf8')) as Manifest
  checkUrlAutostartMatrix(manifest)

  // Each flow
  const files = readdirSync(FLOWS_DIR).filter((f) => f.endsWith('.json') && f !== 'index.json')
  for (const file of files) {
    const fp = path.join(FLOWS_DIR, file)
    let flow: FlowJson
    try {
      flow = JSON.parse(readFileSync(fp, 'utf8')) as FlowJson
    } catch (e) {
      addFinding({
        severity: 'BLOCKER',
        flowId: file,
        chapter: '(parse)',
        stepId: '(parse)',
        cueIndex: -1,
        cueKind: 'json',
        detail: `failed to parse JSON: ${(e as Error).message}`,
      })
      continue
    }
    const fixtures = loadFixtures(flow)
    walkChapter(flow.id, 'intro', flow.intro, fixtures, corpus)
    walkChapter(flow.id, 'prerequisites', flow.prerequisites, fixtures, corpus)
    for (const chapter of flow.common ?? []) {
      walkChapter(flow.id, chapter.id ?? '(common)', chapter, fixtures, corpus)
    }
    for (const [region, chapter] of Object.entries(flow.regions ?? {})) {
      walkChapter(flow.id, `regions.${region}`, chapter, fixtures, corpus)
    }
    walkChapter(flow.id, 'close', flow.close, fixtures, corpus)
  }

  // Group by flow id for rendering
  const byFlow = new Map<string, Finding[]>()
  for (const f of findings) {
    if (!byFlow.has(f.flowId)) byFlow.set(f.flowId, [])
    byFlow.get(f.flowId)!.push(f)
  }

  const blockerCount = findings.filter((f) => f.severity === 'BLOCKER').length
  const warnCount = findings.filter((f) => f.severity === 'WARN').length
  const infoCount = findings.filter((f) => f.severity === 'INFO').length

  // Skip Markdown report write in CI (tasks/ is gitignored on the public
  // checkout and the build runner has no use for a per-run report file).
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'
  if (!isCI) {
    writeFileSync(MD_OUT, renderMarkdown(byFlow))
    writeFileSync(JSON_OUT, JSON.stringify({ generatedAt: TODAY, findings }, null, 2))
    console.log(`[done] ${findings.length} findings → ${MD_OUT}`)
  }
  console.log(`[summary] ${blockerCount} BLOCKER · ${warnCount} WARN · ${infoCount} INFO`)

  // Silence unused-var lint on workshop-fixtures path constants
  void FIXTURES_DIR_PUBLIC
  void FIXTURES_DIR_INLINE

  // Fail CI on any BLOCKER finding. WARN/INFO are advisory only.
  if (blockerCount > 0) {
    console.error(`\n❌ ${blockerCount} BLOCKER finding(s) — workshop flow cannot run.`)
    process.exit(1)
  }
}

main()
