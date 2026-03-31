#!/usr/bin/env node

// CSV freshness audit — staleness detection + URL liveness checks.
// Read-only — outputs JSON findings to stdout.
// Usage: node scripts/audit-csv-freshness.cjs [--skip-urls]

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')
const Papa = require('papaparse')

const DATA_DIR = path.join(__dirname, '..', 'src', 'data')
const COMPLIANCE_JSON = path.join(__dirname, '..', 'public', 'data', 'compliance-data.json')
const SKIP_URLS = process.argv.includes('--skip-urls')
const STALE_THRESHOLD_DAYS = 14

// ── Utilities ────────────────────────────────────────────────────────────────

function findLatestCSV(prefix) {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))
  if (files.length === 0) return null

  const parsed = files
    .map((f) => {
      const m = f.match(/(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (!m) return null
      return {
        file: f,
        date: new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2])),
        rev: m[4] ? parseInt(m[4]) : 0,
      }
    })
    .filter(Boolean)

  parsed.sort((a, b) => {
    const td = b.date.getTime() - a.date.getTime()
    if (td !== 0) return td
    return b.rev - a.rev
  })

  return { file: parsed[0].file, date: parsed[0].date }
}

function readCSV(filename) {
  if (!filename) return []
  const content = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8')
  const { data } = Papa.parse(content.trim(), { header: true, skipEmptyLines: true })
  return data
}

function daysBetween(d1, d2) {
  return Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24))
}

function checkUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) {
      resolve({ url, status: 'INVALID_URL', code: null, time: 0, redirect: null })
      return
    }

    const proto = url.startsWith('https') ? https : http
    const start = Date.now()

    const req = proto.request(
      url,
      { method: 'HEAD', timeout, headers: { 'User-Agent': 'PQC-Audit/1.0' } },
      (res) => {
        const elapsed = Date.now() - start
        const redirect = res.statusCode >= 300 && res.statusCode < 400 ? res.headers.location : null
        resolve({ url, status: 'OK', code: res.statusCode, time: elapsed, redirect })
      }
    )

    req.on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        code: null,
        time: Date.now() - start,
        redirect: null,
        error: err.message,
      })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({ url, status: 'TIMEOUT', code: null, time: timeout, redirect: null })
    })

    req.end()
  })
}

async function checkUrlBatch(urls, concurrency = 5) {
  const results = []
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map((u) => checkUrl(u)))
    results.push(...batchResults)
    if (i + concurrency < urls.length) {
      await new Promise((r) => setTimeout(r, 1000)) // rate limit
    }
  }
  return results
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const findings = []
  const now = new Date()

  function addFinding(check, severity, source, message, details = {}) {
    findings.push({ check, severity, source, message, ...details })
  }

  // ── Phase A: Staleness detection ─────────────────────────────────────────

  const CSV_TYPES = {
    library: 'library_',
    migrate: 'quantum_safe_cryptographic_software_reference_',
    leaders: 'leaders_',
    quiz: 'pqcquiz_',
    timeline: 'timeline_',
    threats: 'quantum_threats_hsm_industries_',
    compliance: 'compliance_',
    algorithms_transitions: 'algorithms_transitions_',
    pqc_algorithm_reference: 'pqc_complete_algorithm_reference_',
    cert_xref: 'migrate_certification_xref_',
    assessment: 'pqcassessment_',
    auth_sources: 'pqc_authoritative_sources_reference_',
  }

  const csvAge = {}
  for (const [type, prefix] of Object.entries(CSV_TYPES)) {
    const latest = findLatestCSV(prefix)
    if (!latest) {
      addFinding('FA-csv-age', 'ERROR', type, `No CSV found for prefix "${prefix}"`)
      continue
    }
    const age = daysBetween(latest.date, now)
    csvAge[type] = {
      file: latest.file,
      date: latest.date.toISOString().split('T')[0],
      ageDays: age,
    }

    if (age > STALE_THRESHOLD_DAYS) {
      addFinding(
        'FA-csv-age',
        'WARNING',
        type,
        `CSV is ${age} days old (threshold: ${STALE_THRESHOLD_DAYS})`,
        { file: latest.file, ageDays: age }
      )
    } else if (age > 7) {
      addFinding('FA-csv-age', 'INFO', type, `CSV is ${age} days old`, {
        file: latest.file,
        ageDays: age,
      })
    }
  }

  // Check auth_sources Last_Verified_Date per source
  const authSourcesFile = findLatestCSV('pqc_authoritative_sources_reference_')
  if (authSourcesFile) {
    const authSources = readCSV(authSourcesFile.file)
    authSources.forEach((row) => {
      if (!row.Last_Verified_Date) {
        addFinding(
          'FA-source-verified',
          'WARNING',
          row.Source_Name || 'unknown',
          'No Last_Verified_Date set'
        )
        return
      }
      const vDate = new Date(row.Last_Verified_Date)
      if (isNaN(vDate.getTime())) {
        addFinding(
          'FA-source-verified',
          'WARNING',
          row.Source_Name,
          `Invalid Last_Verified_Date: "${row.Last_Verified_Date}"`
        )
        return
      }
      const age = daysBetween(vDate, now)
      if (age > STALE_THRESHOLD_DAYS) {
        // Identify which CSVs this source feeds
        const feeds = []
        if (row.Library_CSV === 'TRUE' || row.Library_CSV === 'Yes') feeds.push('library')
        if (row.Timeline_CSV === 'TRUE' || row.Timeline_CSV === 'Yes') feeds.push('timeline')
        if (row.Threats_CSV === 'TRUE' || row.Threats_CSV === 'Yes') feeds.push('threats')
        if (row.Compliance_CSV === 'TRUE' || row.Compliance_CSV === 'Yes') feeds.push('compliance')
        if (row.Migrate_CSV === 'TRUE' || row.Migrate_CSV === 'Yes') feeds.push('migrate')
        if (row.Leaders_CSV === 'TRUE' || row.Leaders_CSV === 'Yes') feeds.push('leaders')
        if (row.Algorithm_CSV === 'TRUE' || row.Algorithm_CSV === 'Yes') feeds.push('algorithms')

        addFinding(
          'FA-source-verified',
          'WARNING',
          row.Source_Name,
          `Last verified ${age} days ago (${row.Last_Verified_Date})`,
          { feedsCSVs: feeds, url: row.Primary_URL }
        )
      }
    })
  }

  // Check compliance-data.json age
  try {
    const stat = fs.statSync(COMPLIANCE_JSON)
    const age = daysBetween(stat.mtime, now)
    if (age > 3) {
      addFinding(
        'FA-compliance-json',
        'WARNING',
        'compliance-data.json',
        `Last modified ${age} days ago (${stat.mtime.toISOString().split('T')[0]}) — consider re-scraping`
      )
    }
  } catch (e) {
    addFinding(
      'FA-compliance-json',
      'ERROR',
      'compliance-data.json',
      `Could not stat file: ${e.message}`
    )
  }

  // ── Phase B: URL liveness checks ─────────────────────────────────────────

  const urlResults = { authSources: [], library: [], threats: [], migrate: [] }

  if (!SKIP_URLS) {
    process.stderr.write('Starting URL liveness checks...\n')

    // Auth sources — all URLs
    if (authSourcesFile) {
      const authSources = readCSV(authSourcesFile.file)
      const urls = authSources.map((r) => r.Primary_URL).filter((u) => u && u.startsWith('http'))
      process.stderr.write(`  Checking ${urls.length} auth source URLs...\n`)
      urlResults.authSources = await checkUrlBatch(urls)
    }

    // Library — 10% sample of download_url
    const libraryFile = findLatestCSV('library_')
    if (libraryFile) {
      const library = readCSV(libraryFile.file)
      const allUrls = library.map((r) => r.download_url).filter((u) => u && u.startsWith('http'))
      const sampleSize = Math.max(1, Math.ceil(allUrls.length * 0.1))
      const sample = allUrls.sort(() => 0.5 - Math.random()).slice(0, sampleSize)
      process.stderr.write(`  Checking ${sample.length}/${allUrls.length} library URLs...\n`)
      urlResults.library = await checkUrlBatch(sample)
    }

    // Threats — all source_url
    const threatsFile = findLatestCSV('quantum_threats_hsm_industries_')
    if (threatsFile) {
      const threats = readCSV(threatsFile.file)
      const urls = threats.map((r) => r.source_url).filter((u) => u && u.startsWith('http'))
      process.stderr.write(`  Checking ${urls.length} threat URLs...\n`)
      urlResults.threats = await checkUrlBatch(urls)
    }

    // Migrate — 10% sample of repository_url
    const migrateFile = findLatestCSV('quantum_safe_cryptographic_software_reference_')
    if (migrateFile) {
      const migrate = readCSV(migrateFile.file)
      const allUrls = migrate.map((r) => r.repository_url).filter((u) => u && u.startsWith('http'))
      const sampleSize = Math.max(1, Math.ceil(allUrls.length * 0.1))
      const sample = allUrls.sort(() => 0.5 - Math.random()).slice(0, sampleSize)
      process.stderr.write(`  Checking ${sample.length}/${allUrls.length} migrate URLs...\n`)
      urlResults.migrate = await checkUrlBatch(sample)
    }

    // Report URL issues
    for (const [source, results] of Object.entries(urlResults)) {
      results.forEach((r) => {
        if (r.status === 'TIMEOUT') {
          addFinding('FB-url-liveness', 'WARNING', source, `URL timeout: ${r.url}`, { url: r.url })
        } else if (r.status === 'ERROR') {
          addFinding('FB-url-liveness', 'ERROR', source, `URL error: ${r.url} — ${r.error}`, {
            url: r.url,
          })
        } else if (r.code === 404) {
          addFinding('FB-url-liveness', 'ERROR', source, `URL 404: ${r.url}`, { url: r.url })
        } else if (r.code >= 500) {
          addFinding('FB-url-liveness', 'WARNING', source, `URL ${r.code}: ${r.url}`, {
            url: r.url,
          })
        } else if (r.code === 403) {
          addFinding('FB-url-liveness', 'INFO', source, `URL 403 (auth required): ${r.url}`, {
            url: r.url,
          })
        }
      })
    }

    process.stderr.write('URL checks complete.\n')
  }

  // ── Report ───────────────────────────────────────────────────────────────

  const errors = findings.filter((f) => f.severity === 'ERROR').length
  const warnings = findings.filter((f) => f.severity === 'WARNING').length
  const info = findings.filter((f) => f.severity === 'INFO').length

  const urlSummary = {}
  for (const [source, results] of Object.entries(urlResults)) {
    urlSummary[source] = {
      total: results.length,
      ok: results.filter((r) => r.status === 'OK' && r.code >= 200 && r.code < 400).length,
      errors: results.filter((r) => r.status === 'ERROR' || r.code === 404 || r.code >= 500).length,
      timeouts: results.filter((r) => r.status === 'TIMEOUT').length,
      redirects: results.filter((r) => r.redirect).length,
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    staleThresholdDays: STALE_THRESHOLD_DAYS,
    csvAge,
    urlSummary: SKIP_URLS ? 'skipped' : urlSummary,
    summary: { errors, warnings, info },
    findings,
  }

  console.log(JSON.stringify(report, null, 2))
  process.exit(errors > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(2)
})
