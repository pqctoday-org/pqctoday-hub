#!/usr/bin/env node
/**
 * scripts/download-products.js
 *
 * Downloads product source documents for the Migrate catalog to public/products/.
 * Supports adaptive URL handling:
 *  - GitHub repos → fetch README via API + repo metadata
 *  - Direct document URLs (.pdf, .html, .md) → fetch as-is
 *  - Landing/product pages → fetch HTML + scan for doc/whitepaper links
 *  - Package registries (npm, PyPI, crates.io) → fetch page + API metadata
 *  - Fallback: try repository_url if authoritative_source fails (and vice versa)
 *
 * Usage:
 *   node scripts/download-products.js                       # download all
 *   node scripts/download-products.js --dry-run             # plan only
 *   node scripts/download-products.js --layer Hardware       # filter by infra layer
 *   node scripts/download-products.js --category CSC-002     # filter by category_id
 *   node scripts/download-products.js --limit 10            # first N products
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'src/data')
const OUTPUT_DIR = join(ROOT, 'public/products')
const SKIP_LIST_PATH = join(OUTPUT_DIR, 'skip-list.json')
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json')
const DELAY_MS = 600
const GITHUB_DELAY_MS = 800 // slightly longer for API rate limits

// ─── CLI arg parsing ─────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run')

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag)
  if (idx === -1 || idx + 1 >= process.argv.length) return null
  return process.argv[idx + 1]
}

const FILTER_LAYER = getArgValue('--layer')
const FILTER_CATEGORY = getArgValue('--category')
const LIMIT = getArgValue('--limit') ? parseInt(getArgValue('--limit'), 10) : 0

// ─── Generic portal domains (no downloadable content at root) ────────────────
const GENERIC_PORTAL_DOMAINS = new Set([
  'www.gsma.com',
  'cabforum.org',
  'standards.ieee.org',
  'www.3gpp.org',
  'www.itu.int',
])

// ─── Keywords for doc link extraction from landing pages ──────────────────────
const DOC_LINK_KEYWORDS = [
  'whitepaper',
  'white-paper',
  'documentation',
  'technical',
  'architecture',
  'datasheet',
  'data-sheet',
  'specification',
  'developer guide',
  'developer-guide',
  'readme',
  '.pdf',
]

// ─── CSV parser (quote-aware) — reused from download-library.js ──────────────
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function parseCSV(content) {
  const lines = content.split('\n')
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = parseCSVLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const line = lines[i].trim()
    if (!line) continue
    const fields = parseCSVLine(line)
    if (fields.length < headers.length) continue
    const obj = {}
    headers.forEach((h, idx) => {
      // eslint-disable-next-line security/detect-object-injection
      obj[h.trim()] = (fields[idx] ?? '').trim()
    })
    rows.push(obj)
  }
  return { headers: headers.map((h) => h.trim()), rows }
}

// ─── Find the latest migrate CSV ────────────────────────────────────────────
function findLatestMigrateCSV() {
  // Support both old and new naming conventions
  const patterns = [
    {
      prefix: 'pqc_product_catalog_',
      re: /^pqc_product_catalog_(\d{2})(\d{2})(\d{4})(_r(\d+))?\.csv$/,
    },
    {
      prefix: 'quantum_safe_cryptographic_software_reference_',
      re: /^quantum_safe_cryptographic_software_reference_(\d{2})(\d{2})(\d{4})(_r(\d+))?\.csv$/,
    },
  ]
  const allFiles = readdirSync(DATA_DIR)
  let files = []
  for (const { re } of patterns) {
    const matched = allFiles.filter((f) => re.test(f))
    if (matched.length > 0) {
      files = matched
      break
    }
  }
  if (files.length === 0) throw new Error(`No pqc_product_catalog_*.csv found in src/data/`)
  files.sort((a, b) => {
    const parse = (name) => {
      const m = name.match(/(\d{2})(\d{2})(\d{4})(_r(\d+))?\.csv$/)
      return { date: new Date(`${m[3]}-${m[1]}-${m[2]}`), rev: m[5] ? parseInt(m[5], 10) : 0 }
    }
    const pa = parse(a)
    const pb = parse(b)
    return pb.date - pa.date || pb.rev - pa.rev
  })
  return join(DATA_DIR, files[0])
}

// ─── Safe filename from software name ────────────────────────────────────────
function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_\-.]/g, '_')
}

// ─── URL type classification ─────────────────────────────────────────────────
function classifyURL(url) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return { type: 'invalid', skip: true, reason: 'invalid-url' }
  }

  const host = parsed.hostname
  const path = parsed.pathname.toLowerCase()

  // GitHub repos (exclude non-repo paths like /orgs/, /settings/, /explore/)
  if (host === 'github.com' || host === 'www.github.com') {
    const GH_NON_REPO = new Set([
      'orgs',
      'settings',
      'marketplace',
      'explore',
      'topics',
      'collections',
      'sponsors',
      'login',
      'signup',
      'features',
      'about',
      'pricing',
    ])
    const ghMatch = parsed.pathname.match(/^\/([^/]+)\/([^/]+)/)
    if (ghMatch && !GH_NON_REPO.has(ghMatch[1])) {
      const owner = ghMatch[1]
      const repo = ghMatch[2].replace(/\.git$/, '')
      return { type: 'github', skip: false, owner, repo }
    }
  }

  // Package registries
  if (host === 'www.npmjs.com' || host === 'npmjs.com') {
    const pkgMatch = parsed.pathname.match(/^\/package\/(.+)/)
    if (pkgMatch) {
      // Strip version suffix (/v/0.15.1) and query params
      const packageName = pkgMatch[1].replace(/\/v\/.*$/, '').replace(/\?.*$/, '')
      return { type: 'npm', skip: false, packageName }
    }
  }
  if (host === 'pypi.org') {
    const pkgMatch = parsed.pathname.match(/^\/project\/([^/]+)/)
    if (pkgMatch) return { type: 'pypi', skip: false, packageName: pkgMatch[1] }
  }
  if (host === 'crates.io') {
    const pkgMatch = parsed.pathname.match(/^\/crates\/([^/]+)/)
    if (pkgMatch) return { type: 'crates', skip: false, packageName: pkgMatch[1] }
  }

  // Direct document URLs
  if (path.endsWith('.pdf') || path.endsWith('.md') || path.endsWith('.txt')) {
    return { type: 'direct-doc', skip: false }
  }

  // Generic portal check
  const pathParts = parsed.pathname.split('/').filter(Boolean)
  if (GENERIC_PORTAL_DOMAINS.has(host) && pathParts.length <= 1) {
    return { type: 'portal', skip: true, reason: 'generic-portal' }
  }
  if (pathParts.length === 0) {
    return { type: 'homepage', skip: true, reason: 'root-homepage' }
  }

  // Default: landing/product page
  return { type: 'landing-page', skip: false }
}

// ─── Determine file extension from response ──────────────────────────────────
function resolveExtension(contentType = '', url = '') {
  if (contentType.includes('application/pdf') || url.toLowerCase().endsWith('.pdf')) return '.pdf'
  if (contentType.includes('text/plain') || url.toLowerCase().endsWith('.txt')) return '.txt'
  if (contentType.includes('text/markdown') || url.toLowerCase().endsWith('.md')) return '.md'
  if (contentType.includes('text/html')) return '.html'
  return '.html'
}

// ─── Download a single URL ───────────────────────────────────────────────────
async function downloadURL(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'PQCProductBot/1.0 (research; contact: pqctoday@antigravity.dev)',
      Accept: 'application/pdf,text/html,text/plain,*/*;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
  })

  const contentType = response.headers.get('content-type') ?? ''
  const ext = resolveExtension(contentType, url)

  if (response.status === 401) return { ok: false, reason: 'auth-required', status: 401 }
  if (response.status === 403) return { ok: false, reason: 'forbidden', status: 403 }
  if (response.status === 402) return { ok: false, reason: 'paywall', status: 402 }
  if (!response.ok) return { ok: false, reason: `http-${response.status}`, status: response.status }

  const buffer = Buffer.from(await response.arrayBuffer())

  // Heuristic: small HTML might be a login/paywall redirect
  if (ext === '.html' && buffer.length < 3_000) {
    const text = buffer.toString('utf-8').toLowerCase()
    if (
      text.includes('login') ||
      text.includes('sign in') ||
      text.includes('access denied') ||
      text.includes('subscription') ||
      text.includes('paywall')
    ) {
      return { ok: false, reason: 'paywall-redirect', status: response.status }
    }
  }

  return { ok: true, buffer, ext, contentType, size: buffer.length }
}

// ─── GitHub: fetch README + repo metadata ────────────────────────────────────
async function fetchGitHub(owner, repo) {
  const headers = {
    'User-Agent': 'PQCProductBot/1.0 (research; contact: pqctoday@antigravity.dev)',
  }
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const results = { readme: '', metadata: null, error: null }

  // Fetch repo metadata
  try {
    const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { ...headers, Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(15_000),
    })
    if (metaRes.ok) {
      const meta = await metaRes.json()
      results.metadata = {
        description: meta.description ?? '',
        topics: meta.topics ?? [],
        license: meta.license?.spdx_id ?? 'Unknown',
        language: meta.language ?? '',
        stars: meta.stargazers_count ?? 0,
        forks: meta.forks_count ?? 0,
        updated_at: meta.updated_at ?? '',
      }
    } else if (metaRes.status === 403) {
      const remaining = metaRes.headers.get('x-ratelimit-remaining')
      results.error =
        remaining === '0' || remaining === null ? 'github-rate-limited' : 'github-forbidden'
      return results
    } else if (metaRes.status === 404) {
      results.error = 'github-not-found'
      return results
    }
  } catch (err) {
    results.error = `github-meta-error: ${err.message}`
    return results
  }

  await sleep(300)

  // Fetch README
  try {
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: { ...headers, Accept: 'application/vnd.github.raw+json' },
      signal: AbortSignal.timeout(15_000),
    })
    if (readmeRes.ok) {
      results.readme = await readmeRes.text()
    }
  } catch {
    // README missing is not fatal
  }

  return results
}

// ─── Format GitHub data as markdown document ─────────────────────────────────
function formatGitHubDoc(owner, repo, ghData) {
  const lines = [`# ${owner}/${repo}\n`]
  const m = ghData.metadata
  if (m) {
    lines.push(`**Repository:** https://github.com/${owner}/${repo}`)
    if (m.description) lines.push(`**Description:** ${m.description}`)
    if (m.topics.length) lines.push(`**Topics:** ${m.topics.join(', ')}`)
    if (m.license && m.license !== 'Unknown') lines.push(`**License:** ${m.license}`)
    if (m.language) lines.push(`**Language:** ${m.language}`)
    lines.push(`**Stars:** ${m.stars} | **Forks:** ${m.forks}`)
    if (m.updated_at) lines.push(`**Last Updated:** ${m.updated_at}`)
    lines.push('')
  }
  if (ghData.readme) {
    lines.push('---\n')
    lines.push(ghData.readme)
  }
  return lines.join('\n')
}

// ─── Extract doc links from HTML landing page ────────────────────────────────
function extractDocLinks(html, baseUrl) {
  const links = []
  // Match <a> tags with single or double quoted href
  const linkRe = /<a\s[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match
  while ((match = linkRe.exec(html)) !== null) {
    const href = match[1]

    // Skip non-HTTP links and self-referential anchors
    if (href.startsWith('mailto:') || href.startsWith('javascript:') || href.startsWith('#'))
      continue

    const text = match[2]
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .trim()
    const hrefLower = href.toLowerCase()

    let score = 0
    for (const kw of DOC_LINK_KEYWORDS) {
      if (text.includes(kw) || hrefLower.includes(kw)) score++
    }
    if (score > 0) {
      try {
        const resolved = new URL(href, baseUrl).toString()
        // Skip if it resolves to the same page (with or without fragment)
        if (resolved === baseUrl || resolved.startsWith(baseUrl + '#')) continue
        links.push({ url: resolved, score, text: text.substring(0, 80) })
      } catch {
        // malformed href — skip
      }
    }
  }

  // Sort by relevance score (descending), take top 2
  links.sort((a, b) => b.score - a.score)
  return links.slice(0, 2)
}

// ─── npm registry metadata ──────────────────────────────────────────────────
async function fetchNpmMeta(packageName) {
  try {
    // npm scoped packages: @scope/pkg → encode only the slash, not the @
    const npmPath = packageName.startsWith('@')
      ? packageName.replace('/', '%2F')
      : encodeURIComponent(packageName)
    const res = await fetch(`https://registry.npmjs.org/${npmPath}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      description: data.description ?? '',
      readme: data.readme ?? '',
      license: data.license ?? '',
      keywords: data.keywords ?? [],
      homepage: data.homepage ?? '',
    }
  } catch {
    return null
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── Process a single product ────────────────────────────────────────────────
async function processProduct(product, skipList) {
  const name = product.software_name
  const safeName = safeFilename(name)
  const primaryUrl = (product.authoritative_source ?? '').trim()
  const repoUrl = (product.repository_url ?? '').trim()
  const results = []

  // Try both URLs — primary first, then repo
  const urls = []
  if (primaryUrl) urls.push({ url: primaryUrl, label: 'primary' })
  if (repoUrl && repoUrl !== primaryUrl) urls.push({ url: repoUrl, label: 'repo' })

  if (urls.length === 0) {
    return [{ status: 'skipped', reason: 'no-urls', filename: '' }]
  }

  for (const { url, label } of urls) {
    // eslint-disable-next-line security/detect-object-injection
    if (skipList[url]) {
      // eslint-disable-next-line security/detect-object-injection
      results.push({ status: 'skipped', reason: `persisted: ${skipList[url].reason}`, url, label })
      continue
    }

    const classification = classifyURL(url)

    if (classification.skip) {
      results.push({ status: 'skipped', reason: classification.reason, url, label })
      continue
    }

    if (DRY_RUN) {
      results.push({ status: 'would-fetch', type: classification.type, url, label })
      continue
    }

    // ─── GitHub repo ───────────────────────────────────────────────────
    if (classification.type === 'github') {
      const ghData = await fetchGitHub(classification.owner, classification.repo)
      if (ghData.error) {
        // Rate-limited is transient (resets hourly) — only persist not-found and forbidden
        const isPersistent =
          ghData.error.includes('not-found') || ghData.error.includes('forbidden')
        if (isPersistent) {
          // eslint-disable-next-line security/detect-object-injection
          skipList[url] = { name, reason: ghData.error, date: new Date().toISOString() }
        }
        results.push({
          status: 'failed',
          reason: ghData.error,
          url,
          label,
          persistent: isPersistent,
        })
        await sleep(GITHUB_DELAY_MS)
        continue
      }

      const content = formatGitHubDoc(classification.owner, classification.repo, ghData)
      const suffix = label === 'repo' ? '_repo' : ''
      const filename = `${safeName}${suffix}.md`
      const outputPath = join(OUTPUT_DIR, filename)
      writeFileSync(outputPath, content)
      const sizeKB = (Buffer.byteLength(content) / 1024).toFixed(1)
      console.log(`✅  GITHUB       ${name}  →  ${filename}  (${sizeKB} KB)`)
      results.push({
        status: 'downloaded',
        filename,
        url,
        label,
        type: 'github',
        size: Buffer.byteLength(content),
      })
      await sleep(GITHUB_DELAY_MS)
      continue
    }

    // ─── npm registry ──────────────────────────────────────────────────
    if (classification.type === 'npm') {
      // Fetch the npm page HTML
      let pageResult
      try {
        pageResult = await downloadURL(url)
      } catch (err) {
        pageResult = { ok: false, reason: `network-error: ${err.message}` }
      }

      if (pageResult.ok) {
        const filename = `${safeName}.html`
        writeFileSync(join(OUTPUT_DIR, filename), pageResult.buffer)
        results.push({
          status: 'downloaded',
          filename,
          url,
          label,
          type: 'npm',
          size: pageResult.size,
        })
        console.log(
          `✅  NPM          ${name}  →  ${filename}  (${(pageResult.size / 1024).toFixed(1)} KB)`
        )
      }

      // Also fetch npm API metadata
      const npmMeta = await fetchNpmMeta(classification.packageName)
      if (npmMeta && (npmMeta.readme || npmMeta.description)) {
        const metaLines = [`# ${classification.packageName} (npm)\n`]
        if (npmMeta.description) metaLines.push(`**Description:** ${npmMeta.description}`)
        if (npmMeta.license) metaLines.push(`**License:** ${npmMeta.license}`)
        if (npmMeta.keywords.length) metaLines.push(`**Keywords:** ${npmMeta.keywords.join(', ')}`)
        if (npmMeta.homepage) metaLines.push(`**Homepage:** ${npmMeta.homepage}`)
        if (npmMeta.readme) {
          metaLines.push('\n---\n')
          metaLines.push(npmMeta.readme)
        }
        const metaContent = metaLines.join('\n')
        const metaFilename = `${safeName}_npm.md`
        writeFileSync(join(OUTPUT_DIR, metaFilename), metaContent)
        results.push({
          status: 'downloaded',
          filename: metaFilename,
          url,
          label: 'npm-api',
          type: 'npm-api',
          size: Buffer.byteLength(metaContent),
        })
      }

      await sleep(DELAY_MS)
      continue
    }

    // ─── Direct doc / landing page / PyPI / crates.io ──────────────────
    let result
    try {
      result = await downloadURL(url)
    } catch (err) {
      result = { ok: false, reason: `network-error: ${err.message}` }
    }

    if (!result.ok) {
      const isPersistent = ['auth-required', 'forbidden', 'paywall', 'paywall-redirect'].includes(
        result.reason
      )
      if (isPersistent) {
        // eslint-disable-next-line security/detect-object-injection
        skipList[url] = { name, reason: result.reason, date: new Date().toISOString() }
      }
      const icon = isPersistent ? '🔒' : '❌'
      console.log(`${icon}  FAIL         ${name}  —  ${result.reason}  (${url.substring(0, 60)})`)
      results.push({
        status: 'failed',
        reason: result.reason,
        url,
        label,
        persistent: isPersistent,
      })
      await sleep(DELAY_MS)
      continue
    }

    // Save primary document
    const suffix = label === 'repo' ? '_repo' : ''
    const filename = `${safeName}${suffix}${result.ext}`
    writeFileSync(join(OUTPUT_DIR, filename), result.buffer)
    const sizeKB = (result.size / 1024).toFixed(1)
    console.log(`✅  OK           ${name}  →  ${filename}  (${sizeKB} KB)`)
    results.push({
      status: 'downloaded',
      filename,
      url,
      label,
      type: classification.type,
      size: result.size,
    })

    // ─── Landing page: scan for doc links and follow top 2 ───────────
    if (classification.type === 'landing-page' && result.ext === '.html') {
      const html = result.buffer.toString('utf-8')
      const docLinks = extractDocLinks(html, url)

      for (let i = 0; i < docLinks.length; i++) {
        const docLink = docLinks[i] // eslint-disable-line security/detect-object-injection
        await sleep(DELAY_MS)
        let docResult
        try {
          docResult = await downloadURL(docLink.url)
        } catch {
          continue
        }
        if (!docResult.ok) continue

        const docFilename = `${safeName}_doc${i + 1}${docResult.ext}`
        writeFileSync(join(OUTPUT_DIR, docFilename), docResult.buffer)
        const docSizeKB = (docResult.size / 1024).toFixed(1)
        console.log(
          `  📄  DOC-LINK   ${name}  →  ${docFilename}  (${docSizeKB} KB)  [${docLink.text.substring(0, 40)}]`
        )
        results.push({
          status: 'downloaded',
          filename: docFilename,
          url: docLink.url,
          label: `doc-link-${i + 1}`,
          type: 'doc-link',
          size: docResult.size,
        })
      }
    }

    await sleep(DELAY_MS)
  }

  return results
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📦  PQC Migrate Product Document Downloader')
  if (DRY_RUN) console.log('    (DRY RUN — no files will be written)\n')
  else console.log()

  if (FILTER_LAYER) console.log(`Filter: layer = "${FILTER_LAYER}"`)
  if (FILTER_CATEGORY) console.log(`Filter: category = "${FILTER_CATEGORY}"`)
  if (LIMIT) console.log(`Limit: ${LIMIT} products`)
  if (FILTER_LAYER || FILTER_CATEGORY || LIMIT) console.log()

  if (!DRY_RUN) mkdirSync(OUTPUT_DIR, { recursive: true })

  // Load persistent skip list
  const skipList = existsSync(SKIP_LIST_PATH)
    ? JSON.parse(readFileSync(SKIP_LIST_PATH, 'utf-8'))
    : {}
  if (Object.keys(skipList).length) {
    console.log(`Loaded skip list: ${Object.keys(skipList).length} persisted entries\n`)
  }

  // Load CSV
  const csvPath = findLatestMigrateCSV()
  console.log(`Source CSV: ${csvPath.replace(ROOT + '/', '')}`)
  const content = readFileSync(csvPath, 'utf-8')
  const { rows } = parseCSV(content)
  console.log(`Total products in CSV: ${rows.length}\n`)

  // Apply filters
  let products = rows
  if (FILTER_LAYER) {
    products = products.filter(
      (r) => (r.infrastructure_layer ?? '').toLowerCase() === FILTER_LAYER.toLowerCase()
    )
    console.log(`After layer filter: ${products.length} products\n`)
  }
  if (FILTER_CATEGORY) {
    products = products.filter(
      (r) => (r.category_id ?? '').toUpperCase() === FILTER_CATEGORY.toUpperCase()
    )
    console.log(`After category filter: ${products.length} products\n`)
  }
  if (LIMIT && LIMIT > 0) {
    products = products.slice(0, LIMIT)
    console.log(`After limit: ${products.length} products\n`)
  }

  // Warn about GitHub rate limits
  if (!process.env.GITHUB_TOKEN) {
    console.log(
      '⚠  No GITHUB_TOKEN set — GitHub API rate limit is 60 req/hour\n   Set GITHUB_TOKEN env var for 5000 req/hour\n'
    )
  }

  // Check for already-downloaded products (exact stem match to avoid prefix collisions)
  const KNOWN_SUFFIXES = ['', '_repo', '_npm', '_doc1', '_doc2']
  const KNOWN_EXTS = ['.html', '.md', '.pdf', '.txt']
  let skippedExisting = 0
  const toDownload = []
  for (const product of products) {
    const safeName = safeFilename(product.software_name ?? '')
    if (!safeName) continue
    // Check for exact filename matches (safeName.ext or safeName_suffix.ext)
    let hasExisting = false
    if (existsSync(OUTPUT_DIR)) {
      for (const sfx of KNOWN_SUFFIXES) {
        for (const ext of KNOWN_EXTS) {
          if (existsSync(join(OUTPUT_DIR, `${safeName}${sfx}${ext}`))) {
            hasExisting = true
            break
          }
        }
        if (hasExisting) break
      }
    }
    if (hasExisting) {
      skippedExisting++
      continue
    }
    toDownload.push(product)
  }
  if (skippedExisting > 0) {
    console.log(`⏭  Skipping ${skippedExisting} products with existing downloads\n`)
  }

  const manifest = {
    generated: new Date().toISOString(),
    source: csvPath.replace(ROOT + '/', ''),
    filters: { layer: FILTER_LAYER, category: FILTER_CATEGORY, limit: LIMIT || null },
    summary: { total: toDownload.length, downloaded: 0, skipped: 0, failed: 0 },
    entries: [],
  }

  // Process each product
  for (let i = 0; i < toDownload.length; i++) {
    const product = toDownload[i] // eslint-disable-line security/detect-object-injection
    const progress = `[${i + 1}/${toDownload.length}]`
    const name = product.software_name ?? ''
    const layer = product.infrastructure_layer ?? ''
    const catId = product.category_id ?? ''
    console.log(`\n${progress} ${name}  (${layer} / ${catId})`)

    let results
    try {
      results = await processProduct(product, skipList)
    } catch (err) {
      console.error(`  ⚠  CRASH: ${err.message}`)
      results = [{ status: 'failed', reason: `exception: ${err.message}`, url: '', label: '' }]
    }

    for (const r of results) {
      manifest.entries.push({ softwareName: name, categoryId: catId, layer, ...r })
      if (r.status === 'downloaded') manifest.summary.downloaded++
      else if (r.status === 'failed') manifest.summary.failed++
      else if (r.status === 'skipped') manifest.summary.skipped++
    }
  }

  if (!DRY_RUN) {
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
    writeFileSync(SKIP_LIST_PATH, JSON.stringify(skipList, null, 2))
    console.log(`\nManifest: public/products/manifest.json`)
    console.log(`Skip list: public/products/skip-list.json`)
  }

  console.log('\n──────────────────────────────────────────────────')
  console.log(`Total to process : ${manifest.summary.total}`)
  console.log(`✅  Downloaded   : ${manifest.summary.downloaded}`)
  console.log(`⏭   Skipped      : ${manifest.summary.skipped}`)
  console.log(`❌  Failed        : ${manifest.summary.failed}`)
  if (skippedExisting > 0) {
    console.log(`📁  Already exist : ${skippedExisting}`)
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
