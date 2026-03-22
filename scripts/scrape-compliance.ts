// SPDX-License-Identifier: GPL-3.0-only
import fs from 'fs'
import path from 'path'
import { ComplianceRecord } from './scrapers/types.js'
import { scrapeNIST } from './scrapers/nist.js'
import { scrapeACVP } from './scrapers/acvp.js'
import { scrapeCC } from './scrapers/cc.js'
import { scrapeANSSI } from './scrapers/anssi.js'
import { scrapeENISA } from './scrapers/enisa.js'
import { standardizeDate, normalizeAlgorithmList } from './scrapers/utils.js'
import { validateRecordCounts, logHealthChecks } from './scrapers/health.js'

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'compliance-data.json')

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const loadExistingData = (): ComplianceRecord[] => {
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'))
    } catch (e) {
      console.warn('Failed to load existing data, starting fresh.', e)
    }
  }
  return []
}

const main = async () => {
  // CLI Arguments
  const args = process.argv.slice(2)
  // Determine run mode: default to ALL if no specific flags
  const runAll =
    args.includes('--all') ||
    (!args.includes('--nist') &&
      !args.includes('--acvp') &&
      !args.includes('--cc') &&
      !args.includes('--anssi') &&
      !args.includes('--enisa'))
  const force = args.includes('--force')

  console.log(`[Master Scraper] Mode: ${runAll ? 'ALL' : 'ISOLATED'} (Force: ${force})`)

  const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000 // 7 Days

  // Load existing data to preserve other sources
  const currentData = loadExistingData()

  // Check staleness if not forcing and we have data
  if (currentData.length > 0 && !force) {
    // Check file modification time
    const stats = fs.statSync(OUTPUT_FILE)
    const age = Date.now() - stats.mtimeMs

    if (age < STALE_THRESHOLD_MS) {
      console.log(
        `[Master Scraper] Data is fresh (${(age / 1000 / 60 / 60).toFixed(1)} hours old). Skipping scrape.`
      )
      console.log('Use --force to override.')
      return
    } else {
      console.log(
        `[Master Scraper] Data is stale (${(age / 1000 / 60 / 60 / 24).toFixed(1)} days old). Refreshing.`
      )
    }
  }

  console.log(`[Master Scraper] Loaded ${currentData.length} existing records.`)

  // Define Tasks — each entry tracks the source key and its scraper promise
  // Scrapers may return null to signal "no change, preserve existing data"
  interface ScraperTask {
    sourceKey: string
    promise: Promise<ComplianceRecord[] | null>
  }
  const scraperTasks: ScraperTask[] = []
  const activeSources = new Set<string>()

  if (runAll || args.includes('--nist')) {
    console.log('[Master Scraper] Queueing NIST Scraper...')
    activeSources.add('NIST')
    scraperTasks.push({ sourceKey: 'NIST', promise: scrapeNIST() })
  }
  if (runAll || args.includes('--acvp')) {
    console.log('[Master Scraper] Queueing ACVP Scraper...')
    activeSources.add('ACVP')
    scraperTasks.push({ sourceKey: 'ACVP', promise: scrapeACVP() })
  }
  if (runAll || args.includes('--cc')) {
    console.log('[Master Scraper] Queueing CC Scraper...')
    activeSources.add('Common Criteria')
    scraperTasks.push({ sourceKey: 'Common Criteria', promise: scrapeCC() })
  }
  if (runAll || args.includes('--anssi')) {
    console.log('[Master Scraper] Queueing ANSSI Scraper...')
    activeSources.add('ANSSI')
    scraperTasks.push({ sourceKey: 'ANSSI', promise: scrapeANSSI() })
  }
  if (runAll || args.includes('--enisa')) {
    console.log('[Master Scraper] Queueing ENISA Scraper...')
    activeSources.add('ENISA')
    scraperTasks.push({ sourceKey: 'ENISA', promise: scrapeENISA() })
  }

  if (scraperTasks.length === 0) {
    console.log('No scrapers selected.')
    return
  }

  // Execute all scrapers in parallel
  const results = await Promise.all(scraperTasks.map((t) => t.promise))

  // Process results: null = "unchanged, preserve existing"; [] = "genuine empty"
  const newRecords: ComplianceRecord[] = []
  const skippedSources = new Set<string>()

  for (let i = 0; i < scraperTasks.length; i++) {
    const task = scraperTasks[i]
    const result = results[i]

    if (result === null) {
      // Scraper returned null — data unchanged, preserve existing records for this source
      console.log(`[Master Scraper] ${task.sourceKey}: unchanged — preserving existing records`)
      skippedSources.add(task.sourceKey)
      activeSources.delete(task.sourceKey)
    } else {
      console.log(`[Master Scraper] ${task.sourceKey}: collected ${result.length} records`)
      newRecords.push(...result)
    }
  }

  console.log(`[Master Scraper] Collected ${newRecords.length} new records (${skippedSources.size} source(s) unchanged).`)

  // Merge Strategy:
  // 1. Remove old records from ACTIVE sources that returned fresh data.
  // 2. Keep records from INACTIVE sources AND sources that returned null (unchanged).
  // 3. Add new records.

  // Scrapers return:
  // NIST -> source: 'NIST', type: 'FIPS 140-3'
  // ACVP -> source: 'NIST', type: 'ACVP'
  // CC -> source: 'Common Criteria'
  // ANSSI -> source: 'ANSSI', type: 'Common Criteria'
  // ENISA -> source: 'ENISA'
  let keptData = currentData

  if (activeSources.has('NIST')) {
    keptData = keptData.filter((r) => r.type !== 'FIPS 140-3')
  }
  if (activeSources.has('ACVP')) {
    keptData = keptData.filter((r) => r.type !== 'ACVP')
  }
  if (activeSources.has('Common Criteria')) {
    keptData = keptData.filter((r) => r.type !== 'Common Criteria' || r.source === 'ANSSI')
    keptData = keptData.filter((r) => r.source !== 'Common Criteria')
  }
  if (activeSources.has('ANSSI')) {
    keptData = keptData.filter((r) => r.source !== 'ANSSI')
  }
  if (activeSources.has('ENISA')) {
    keptData = keptData.filter((r) => r.source !== 'ENISA')
  }

  // Normalize Data (Dates & Algos)
  const normalizedData = [...keptData, ...newRecords].map((record) => ({
    ...record,
    date: standardizeDate(record.date),
    pqcCoverage: normalizeAlgorithmList(record.pqcCoverage),
    classicalAlgorithms:
      typeof record.classicalAlgorithms === 'string'
        ? (normalizeAlgorithmList(record.classicalAlgorithms) as string)
        : undefined,
  }))

  // Deduplicate by ID just in case
  const uniqueData = Array.from(new Map(normalizedData.map((item) => [item.id, item])).values())

  // Health Check Validation
  console.log('\n[Master Scraper] Running health checks...')
  const healthResults = validateRecordCounts(uniqueData, currentData, skippedSources)
  const hasFailures = logHealthChecks(healthResults)

  if (hasFailures && !force) {
    console.error('\n[Master Scraper] CRITICAL: Health check failed!')
    console.error('[Master Scraper] Use --force to override and save anyway.')
    process.exit(1)
  }

  // Save
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniqueData, null, 2))
  console.log(`\n[Master Scraper] Saved ${uniqueData.length} records to ${OUTPUT_FILE}`)
}

main()
