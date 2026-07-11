// SPDX-License-Identifier: GPL-3.0-only
/**
 * Trust-spine registry consistency guard (2026-07-09 rebuild).
 *
 * The tiered registry (trusted_sources_*.csv) is the single source of truth
 * for trust; the authoritative-sources catalog
 * (pqc_authoritative_sources_reference_*.csv) is the per-view source
 * directory and must not contradict it. These tests read the LATEST dated
 * snapshot of each file directly from disk so drift fails loudly.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'

const DATA_DIR = path.join(process.cwd(), 'src', 'data')

const CANONICAL_SOURCE_TYPES = new Set([
  'Government',
  'Standards_Body',
  'Industry_Workgroup',
  'Academic',
  'Industry_Analyst',
  'Vendor',
  'Open_Source_Project',
])

const KNOWN_TIERS = new Set(['1_Authoritative', '2_Core', '3_Supporting', '4_Contextual'])

/** Resolve the latest dated CSV (MMDDYYYY, optional _rN) for a prefix. */
function latestCsvPath(prefix: string): string {
  const re = new RegExp(`^${prefix}_(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.csv$`)
  const candidates = fs
    .readdirSync(DATA_DIR)
    .map((f) => {
      const m = f.match(re)
      if (!m) return null
      const [, mm, dd, yyyy, rev] = m
      return { f, date: Number(yyyy + mm + dd), rev: rev ? Number(rev) : 0 }
    })
    .filter((c): c is { f: string; date: number; rev: number } => c !== null)
    .sort((a, b) => b.date - a.date || b.rev - a.rev)
  if (candidates.length === 0) throw new Error(`No ${prefix}_*.csv found in ${DATA_DIR}`)
  return path.join(DATA_DIR, candidates[0].f)
}

function parseCsv(csvPath: string): Record<string, string>[] {
  const raw = fs.readFileSync(csvPath, 'utf-8')
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  })
  expect(parsed.errors.filter((e) => e.code !== 'TooFewFields')).toEqual([])
  return parsed.data
}

/**
 * Hostname of a URL, lowercased, with any leading `www.` stripped.
 * Returns '' for empty/unparseable input.
 */
function hostOf(url: string): string {
  const trimmed = (url ?? '').trim()
  if (!trimmed) return ''
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const host = new URL(withScheme).hostname.toLowerCase()
    return host.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** Two-part public suffixes that appear in the registries. */
const TWO_PART_SUFFIXES = new Set([
  'co.uk',
  'org.uk',
  'gov.uk',
  'ac.uk',
  'gov.au',
  'com.au',
  'org.au',
  'go.kr',
  'go.jp',
  'go.ke',
  'gov.ng',
  'gov.sa',
  'gov.jo',
  'gov.cn',
  'org.cn',
  'org.il',
  'cni.es',
])

/** Registrable domain: last two labels, or three when the suffix is two-part. */
function registrableDomain(host: string): string {
  const labels = host.split('.')
  if (labels.length <= 2) return host
  const lastTwo = labels.slice(-2).join('.')
  const n = TWO_PART_SUFFIXES.has(lastTwo) ? 3 : 2
  return labels.slice(-n).join('.')
}

/** Same host (www./trailing-slash-insensitive) or same registrable domain. */
function domainsMatch(urlA: string, urlB: string): boolean {
  const a = hostOf(urlA)
  const b = hostOf(urlB)
  if (!a || !b) return true // nothing to compare — emptiness is checked elsewhere
  return a === b || registrableDomain(a) === registrableDomain(b)
}

const trustedRows = parseCsv(latestCsvPath('trusted_sources'))
const catalogRows = parseCsv(latestCsvPath('pqc_authoritative_sources_reference'))

describe('tiered registry (trusted_sources) completeness', () => {
  it('has zero rows missing source_name, source_type, or trust_tier', () => {
    const incomplete = trustedRows
      .filter((r) => !r.source_name?.trim() || !r.source_type?.trim() || !r.trust_tier?.trim())
      .map((r) => r.source_id)
    expect(incomplete, `Skeleton/incomplete registry rows: ${JSON.stringify(incomplete)}`).toEqual(
      []
    )
  })

  it('uses only the canonical source_type vocabulary', () => {
    const offenders = [
      ...new Set(
        trustedRows
          .map((r) => r.source_type?.trim() ?? '')
          .filter((t) => !CANONICAL_SOURCE_TYPES.has(t))
      ),
    ]
    expect(
      offenders,
      `Non-canonical source_type value(s): ${JSON.stringify(offenders)} — ` +
        `allowed: ${[...CANONICAL_SOURCE_TYPES].join(' | ')}`
    ).toEqual([])
  })

  it('uses only the four known trust tiers', () => {
    const offenders = [
      ...new Set(
        trustedRows.map((r) => r.trust_tier?.trim() ?? '').filter((t) => !KNOWN_TIERS.has(t))
      ),
    ]
    expect(offenders, `Unknown trust_tier value(s): ${JSON.stringify(offenders)}`).toEqual([])
  })

  it('has unique source_id values', () => {
    const ids = trustedRows.map((r) => r.source_id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('tiered registry ↔ authoritative catalog agreement', () => {
  it('for every id present in both files, the primary URL domain matches', () => {
    const trustedById = new Map(trustedRows.map((r) => [r.source_id, r]))
    const conflicts: string[] = []
    for (const cat of catalogRows) {
      const reg = trustedById.get(cat.id)
      if (!reg) continue
      if (!domainsMatch(reg.primary_url, cat.Primary_URL)) {
        conflicts.push(
          `${cat.id}: registry=${hostOf(reg.primary_url)} catalog=${hostOf(cat.Primary_URL)}`
        )
      }
    }
    expect(
      conflicts,
      `Catalog contradicts the tiered registry (source of truth) for:\n${conflicts.join('\n')}`
    ).toEqual([])
  })
})
