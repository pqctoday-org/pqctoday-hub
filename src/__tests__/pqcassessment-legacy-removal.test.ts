// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The assessment CSV carried 83 extra rows that were a column-shifted copy: the category column
 * held ids such as TLS instead of a category. They were removed on 8 Nov 2026. The site never
 * read them, because industryAssessConfig.ts keeps only rows whose category is compliance,
 * use_case, retention or sensitivity, so none of the 83 rows reached the site.
 *
 * This test checks that every removed id keeps a live row in the latest file, that the latest
 * file holds no uncategorised rows, and that none of the removed rows (read from the archived
 * copy) has a category the site reads. It checks ids and categories only; it does not compare
 * the other column values of the removed rows.
 *
 * Run locally: `npx vitest run src/__tests__/pqcassessment-legacy-removal.test.ts`
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

const DATA_DIR = path.join(process.cwd(), 'src/data')
const LIVE_CATEGORIES = new Set(['use_case', 'retention', 'sensitivity'])
// The categories industryAssessConfig.ts reads; every other row is dropped by the loader.
const READ_CATEGORIES = new Set(['compliance', 'use_case', 'retention', 'sensitivity'])
// The archived copy that still holds the removed rows.
const ARCHIVED_FILE = path.join(DATA_DIR, 'archive', 'pqcassessment_11082026.csv')

/** Latest dated file for a prefix, by the MMDDYYYY date and then the _rN suffix. */
function latestDated(dir: string, prefix: string): string {
  const key = (f: string) => {
    const m = f.match(/_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
    return m ? `${m[3]}${m[1]}${m[2]}-${(m[4] ?? '0').padStart(3, '0')}` : ''
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && key(f) !== '')
    .sort((a, b) => key(a).localeCompare(key(b)))
  if (files.length === 0) throw new Error(`no ${prefix}* file in ${dir}`)
  return path.join(dir, files[files.length - 1])
}

// The 83 ids of the removed legacy block (the first column of each removed row).
const REMOVED_LEGACY_IDS: readonly string[] = [
  'TLS',
  'DATA-REST',
  'SIGNING',
  'KEY-EXCHANGE',
  'AUTH',
  'BLOCKCHAIN',
  'EMAIL-ENC',
  'VPN',
  'IOT',
  'DB-ENC',
  'SIM-ESIM',
  '5G-SLICING',
  'SS7',
  'SWIFT-MSG',
  'TRADING',
  'CARD-ENC',
  'MEDICAL-DEVICE',
  'EHR',
  'V2X',
  'OTA',
  'ECU-BOOT',
  'SCADA',
  'SMART-METER',
  'AVIONICS',
  'SATELLITE',
  'PKI-HSPD12',
  'CLASSIFIED',
  'DNS-DNSSEC',
  'TIMESTAMPING',
  'BACKUP-ENC',
  'API-GATEWAY',
  'SECURE-BOOT',
  'under-1y',
  '1-5y',
  '5-10y',
  '10-25y',
  '25-plus',
  'indefinite',
  'auto-1-3y',
  'auto-vehicle-lifetime',
  '2y',
  '6y',
  '7y',
  '75y-plus',
  '3y-soc2',
  '3y-nerc',
  '7y-ferc',
  'aircraft-lifetime',
  '1y-pci-logs',
  '2y-pci',
  '6y-ferpa',
  'permanent-transcripts',
  'permanent',
  'phi',
  'genomic-data',
  'admin-health',
  'customer-financial',
  'trading-algos',
  'transaction-logs',
  'classified-info',
  'cui',
  'fouo',
  'network-topology',
  'cdr',
  'subscriber-meta',
  'crypto-keys',
  'source-code',
  'user-analytics',
  'scada-ot',
  'grid-topology',
  'meter-readings',
  'ad-algorithms',
  'v2x-data',
  'vehicle-telemetry',
  'flight-control',
  'passenger-pii',
  'maintenance-logs',
  'pci-data',
  'customer-purchase',
  'product-catalog',
  'student-records',
  'research-ip',
  'course-catalog',
]

describe('pqcassessment legacy block removal', () => {
  const file = latestDated(DATA_DIR, 'pqcassessment_')
  const parsed = Papa.parse<string[]>(fs.readFileSync(file, 'utf-8'), { skipEmptyLines: true })
  const rows = parsed.data.slice(1)
  const live = rows.filter((r) => LIVE_CATEGORIES.has(r[0]))
  const liveIds = new Set(live.map((r) => r[1]))

  it('holds no rows outside the live categories', () => {
    const stray = rows.filter((r) => !LIVE_CATEGORIES.has(r[0]))
    expect(stray.map((r) => r[0])).toEqual([])
  })

  it('pins 83 removed legacy ids', () => {
    expect(REMOVED_LEGACY_IDS).toHaveLength(83)
    expect(new Set(REMOVED_LEGACY_IDS).size).toBe(83)
  })

  it('keeps a live row for every removed legacy id', () => {
    const missing = REMOVED_LEGACY_IDS.filter((id) => !liveIds.has(id))
    expect(missing).toEqual([])
  })

  it('removed rows never had a category the site reads', () => {
    const archived = Papa.parse<string[]>(fs.readFileSync(ARCHIVED_FILE, 'utf-8'), {
      skipEmptyLines: true,
    })
    // The removed rows are the archived rows that the latest file no longer holds.
    const latestKeys = new Set(rows.map((r) => `${r[0]}|${r[1]}`))
    const removedRows = archived.data.slice(1).filter((r) => !latestKeys.has(`${r[0]}|${r[1]}`))
    expect(removedRows.map((r) => r[0]).sort()).toEqual([...REMOVED_LEGACY_IDS].sort())
    // The loader keys on the first column; none of the removed rows has a category it reads.
    const readByTheSite = removedRows.filter((r) => READ_CATEGORIES.has(r[0]))
    expect(readByTheSite.map((r) => r[0])).toEqual([])
  })
})
