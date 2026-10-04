// SPDX-License-Identifier: GPL-3.0-only
/**
 * Literal in-app deep links must name items that exist.
 *
 * Learn intros, report sections and tool footers hand-write links such as
 * `/library?ref=FIPS%20203` or `/compliance?framework=CNSA-2`. A typo or a
 * retired id doesn't fail any build — the page just opens a "not found"
 * notice. This scans non-test source for FULLY LITERAL links (no `${…}`) and
 * checks each item-naming param against the same data the pages load. The
 * search-index generator has the equivalent check for corpus links
 * (scripts/lib/corpusLinkTargets.ts); this is its in-app counterpart
 * (deep-link follow-ups, 2026-10-03).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'
import { findLibraryItemByRef, LIBRARY_CATEGORIES } from '@/data/libraryData'
import { complianceFrameworks } from '@/data/complianceData'
import { threatsData } from '@/data/threatsData'
import { timelineData } from '@/data/timelineData'
import {
  resolveDomainRef,
  resolveProductRef,
} from '@/components/Migrate/Workbench/workbenchCatalog'

const ROOT = path.resolve(__dirname, '../..')
const SRC = path.join(ROOT, 'src')

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'archive') continue
      out.push(...sourceFiles(p))
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(p)
    }
  }
  return out
}

/** Latest dated CSV for a prefix (same "<prefix><MMDDYYYY>[_rN].csv" rule as the loaders). */
function latestCsvRows(prefix: string): Record<string, string>[] {
  const dir = path.join(SRC, 'data')
  const re = new RegExp(`^${prefix}(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.csv$`)
  const files = fs
    .readdirSync(dir)
    .map((f) => ({ f, m: re.exec(f) }))
    .filter((x): x is { f: string; m: RegExpExecArray } => !!x.m)
    .sort((a, b) => {
      const ka = `${a.m[3]}${a.m[1]}${a.m[2]}${(a.m[4] ?? '0').padStart(3, '0')}`
      const kb = `${b.m[3]}${b.m[1]}${b.m[2]}${(b.m[4] ?? '0').padStart(3, '0')}`
      return ka.localeCompare(kb)
    })
  const latest = files.at(-1)
  if (!latest) return []
  return Papa.parse<Record<string, string>>(fs.readFileSync(path.join(dir, latest.f), 'utf-8'), {
    header: true,
    skipEmptyLines: true,
  }).data
}

const algoKeys = new Set(
  latestCsvRows('pqc_complete_algorithm_reference_').flatMap((r) =>
    [r.algorithm_id, r.algorithm].filter(Boolean).map((v) => v.toLowerCase())
  )
)
const frameworkIds = new Set(complianceFrameworks.map((f) => f.id))
const threatIndustries = new Set(threatsData.map((t) => t.industry))
const threatIds = new Set(threatsData.map((t) => t.threatId))
const countries = new Set(timelineData.map((c) => c.countryName))
// ?event= takes an event_id (titles are still accepted) of an active row.
const timelineEvents = new Set(
  latestCsvRows('timeline_')
    .filter((r) => (r.status ?? '').trim().toLowerCase() !== 'deprecated')
    .flatMap((r) => [r.event_id, r.Title].filter(Boolean))
)

/** route → param → does this literal value name something the page has? */
const CHECKS: Record<string, Record<string, (v: string) => boolean>> = {
  '/library': {
    ref: (v) => !!findLibraryItemByRef(v),
    cat: (v) => (LIBRARY_CATEGORIES as readonly string[]).includes(v),
  },
  '/compliance': { framework: (v) => frameworkIds.has(v) },
  '/threats': {
    id: (v) => threatIds.has(v),
    industry: (v) => v.split(',').every((i) => threatIndustries.has(i.trim())),
  },
  '/timeline': { country: (v) => countries.has(v), event: (v) => timelineEvents.has(v) },
  '/migrate': { product: (v) => !!resolveProductRef(v), domain: (v) => !!resolveDomainRef(v) },
  '/algorithms': { algo: (v) => algoKeys.has(v.toLowerCase()) },
}

const LINK =
  /['"`](\/(?:library|compliance|threats|timeline|migrate|algorithms)\?[^'"`\s${}]+)['"`]/g

describe('literal in-app deep links name items that exist', () => {
  const found: { file: string; url: string }[] = []
  for (const file of sourceFiles(SRC)) {
    // Comments document link SHAPES ("/threats?id=<id>"); only code counts.
    const text = fs
      .readFileSync(file, 'utf-8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|\s)\/\/.*$/gm, '$1')
    for (const m of text.matchAll(LINK))
      found.push({ file: path.relative(ROOT, file), url: m[1].replace(/&amp;/g, '&') })
  }

  it('finds literal links to check (the scan itself works)', () => {
    expect(found.length).toBeGreaterThan(20)
  })

  it('every item-naming param resolves', () => {
    const misses: string[] = []
    for (const { file, url } of found) {
      const [route, query] = url.split('?')
      const checks = CHECKS[route]
      if (!checks) continue
      const params = new URLSearchParams(query.split('#')[0])
      for (const [param, ok] of Object.entries(checks)) {
        const v = params.get(param)
        // Empty = a prefix the code appends an id to; <…>/…/X = a placeholder
        // in prompt or help text. Neither names an item.
        if (v === null || v === '' || /[<>…\\]|\.\.\.|^[A-Z]$/.test(v)) continue
        if (!ok(v)) misses.push(`${file}: ${url} (${param}=${v})`)
      }
    }
    expect(misses).toEqual([])
  })
})
