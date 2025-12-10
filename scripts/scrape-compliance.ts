import fs from 'fs'
import path from 'path'
import { ComplianceRecord } from './scrapers/types.js'
import { scrapeNIST } from './scrapers/nist.js'
import { scrapeACVP } from './scrapers/acvp.js'
import { scrapeCC } from './scrapers/cc.js'
import { scrapeANSSI } from './scrapers/anssi.js'
import { standardizeDate, normalizeAlgorithmList } from './scrapers/utils.js'

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
      !args.includes('--anssi'))
  const force = args.includes('--force')

  console.log(`[Master Scraper] Mode: ${runAll ? 'ALL' : 'ISOLATED'} (Force: ${force})`)

  const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000 // 7 Days

  // Load existing data to preserve other sources
  let currentData = loadExistingData()

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

  // Define Tasks
  const tasks: Promise<ComplianceRecord[]>[] = []
  const activeSources = new Set<string>()

  if (runAll || args.includes('--nist')) {
    console.log('[Master Scraper] Queueing NIST Scraper...')
    activeSources.add('NIST') // Source string in type is 'NIST'
    tasks.push(scrapeNIST())
  }
  if (runAll || args.includes('--acvp')) {
    console.log('[Master Scraper] Queueing ACVP Scraper...')
    activeSources.add('ACVP') // Note: ACVP scraper returns source='NIST' usually but let's check scraper implementation
    tasks.push(scrapeACVP())
  }
  if (runAll || args.includes('--cc')) {
    console.log('[Master Scraper] Queueing CC Scraper...')
    activeSources.add('Common Criteria')
    tasks.push(scrapeCC())
  }
  if (runAll || args.includes('--anssi')) {
    console.log('[Master Scraper] Queueing ANSSI Scraper...')
    activeSources.add('ANSSI')
    tasks.push(scrapeANSSI())
  }

  if (tasks.length === 0) {
    console.log('No scrapers selected.')
    return
  }

  // Execute
  const results = await Promise.all(tasks)
  const newRecords = results.flat()

  console.log(`[Master Scraper] Collected ${newRecords.length} new records.`)

  // Merge Strategy:
  // 1. Remove old records from the ACTIVE sources we just scraped.
  // 2. Keep records from INACTIVE sources (e.g. if we only ran --anssi, keep NIST).
  // 3. Add new records.

  // Identify sources provided by new records to be safe, or use activeSources logic
  // But 'ACVP' vs 'NIST' source string might vary.
  // The safest way is to filter out based on the 'source' or 'type' field that the scrapers return.

  // Check what scrapers return:
  // NIST -> source: 'NIST', type: 'FIPS 140-3'
  // ACVP -> source: 'NIST', type: 'ACVP' (Based on acvp.ts implementation)
  // CC -> source: 'Common Criteria'
  // ANSSI -> source: 'ANSSI'

  // So we filter based on what we INTENDED to update.
  let keptData = currentData

  if (activeSources.has('NIST')) {
    keptData = keptData.filter((r) => r.type !== 'FIPS 140-3')
  }
  if (activeSources.has('ACVP')) {
    keptData = keptData.filter((r) => r.type !== 'ACVP')
  }
  if (activeSources.has('Common Criteria')) {
    keptData = keptData.filter((r) => r.type !== 'Common Criteria' || r.source === 'ANSSI') // Don't remove ANSSI if it mimics CC type?
    // Wait, ANSSI scraper returns: source: 'ANSSI', type: 'Common Criteria'.
    // So if we run --cc (Global CC), we should remove source='Common Criteria'.
    // If we run --anssi, we remove source='ANSSI'.
    keptData = keptData.filter((r) => r.source !== 'Common Criteria')
  }
  if (activeSources.has('ANSSI')) {
    keptData = keptData.filter((r) => r.source !== 'ANSSI')
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

  // Save
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniqueData, null, 2))
  console.log(`[Master Scraper] Saved ${uniqueData.length} records to ${OUTPUT_FILE}`)
}

main()
