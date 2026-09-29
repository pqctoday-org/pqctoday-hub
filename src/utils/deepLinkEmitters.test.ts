// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import { algorithmHref, algorithmSlug } from './algorithmLinks'
import {
  migrateDomainForLayer,
  migrateDomainHref,
  migrateLayerHref,
  migrateProductHref,
} from './migrateLinks'
import { DOMAINS } from '@/data/migrationAssets'
import { algoMatchesHighlight, parseHighlight } from '@/components/Algorithms/highlightMatch'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')

/** The CSV the loaders pick: newest MMDDYYYY date, then highest _rN. */
function wiredCsv(prefix: string): Record<string, string>[] {
  const files = readdirSync(dataDir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))
    .map((f) => {
      const m = f.match(/_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      const date = m ? Number(`${m[3]}${m[1]}${m[2]}`) : 0
      return { f, date, rev: m?.[4] ? Number(m[4]) : 0 }
    })
    .sort((a, b) => b.date - a.date || b.rev - a.rev)
  expect(files.length, `no ${prefix}*.csv in src/data`).toBeGreaterThan(0)
  const { data } = Papa.parse<Record<string, string>>(
    readFileSync(join(dataDir, files[0].f), 'utf-8').trim(),
    { header: true, skipEmptyLines: true }
  )
  return data
}

function glossaryLinks(file: string): { term: string; url: URL }[] {
  const terms = JSON.parse(readFileSync(join(dataDir, 'glossary', file), 'utf-8')) as {
    term: string
    relatedModule?: string
  }[]
  return terms
    .filter((t) => t.relatedModule)
    .map((t) => ({ term: t.term, url: new URL(t.relatedModule!, 'https://x.test') }))
}

const GLOSSARY_FILES = [
  'algorithms.json',
  'concepts.json',
  'protocols.json',
  'standards.json',
  'organizations.json',
]
const allGlossaryLinks = GLOSSARY_FILES.flatMap(glossaryLinks)

describe('algorithmLinks', () => {
  it('slugs reference-CSV names to kebab-case ids', () => {
    expect(algorithmSlug('ML-KEM-768')).toBe('ml-kem-768')
    expect(algorithmSlug('ECDH P-256')).toBe('ecdh-p-256')
    expect(algorithmSlug('LMS-SHA256 (H20/W8)')).toBe('lms-sha256-h20-w8')
    expect(algorithmSlug('DH (Diffie-Hellman)')).toBe('dh-diffie-hellman')
    expect(algorithmHref('X25519')).toBe('/algorithms?algo=x25519')
  })

  it('gives every algorithm in the wired reference CSV a unique id', () => {
    const names = wiredCsv('pqc_complete_algorithm_reference_').map((r) => r.algorithm)
    const slugs = names.map(algorithmSlug)
    expect(slugs.every(Boolean)).toBe(true)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every glossary ?algo= / ?highlight= link names a real algorithm', () => {
    const names = wiredCsv('pqc_complete_algorithm_reference_').map((r) => r.algorithm)
    const ids = new Set(names.map(algorithmSlug))
    const algoLinks = allGlossaryLinks.filter((l) => l.url.pathname === '/algorithms')
    for (const { term, url } of algoLinks) {
      const algo = url.searchParams.get('algo')
      if (algo) expect(ids.has(algo), `${term}: ?algo=${algo}`).toBe(true)
      for (const h of parseHighlight(url.searchParams.get('highlight'))) {
        expect(
          names.some((n) => algoMatchesHighlight(n, h)),
          `${term}: ?highlight=${h}`
        ).toBe(true)
      }
    }
  })
})

describe('migrateLinks', () => {
  it('maps catalog layers to workbench domains', () => {
    expect(migrateDomainForLayer('Network')).toBe('network')
    expect(migrateDomainForLayer('Database')).toBe('atrest')
    expect(migrateDomainForLayer('Libraries')).toBe('foundations')
    expect(migrateDomainForLayer('OS')).toBe('platform')
    expect(migrateLayerHref('Security Stack')).toBe('/migrate?domain=network')
    expect(migrateDomainHref(null)).toBe('/migrate')
    expect(migrateProductHref('softhsm2')).toBe('/migrate?product=softhsm2')
  })

  it('glossary /migrate links use only canonical params with real values', () => {
    const productIds = new Set(wiredCsv('pqc_product_catalog_').map((r) => r.product_id))
    for (const { term, url } of allGlossaryLinks.filter((l) => l.url.pathname === '/migrate')) {
      for (const key of url.searchParams.keys())
        expect(['tab', 'product', 'productIds', 'domain', 'vendor'], `${term}: ${key}`).toContain(
          key
        )
      const domain = url.searchParams.get('domain')
      if (domain) expect(Object.keys(DOMAINS), `${term}: domain=${domain}`).toContain(domain)
      const product = url.searchParams.get('product')
      if (product) expect(productIds.has(product), `${term}: product=${product}`).toBe(true)
    }
  })
})

describe('glossary /threats links', () => {
  it('filter on a real Threats industry label', () => {
    const labels = new Set(wiredCsv('quantum_threats_hsm_industries_').map((r) => r.industry))
    for (const { term, url } of allGlossaryLinks.filter((l) => l.url.pathname === '/threats')) {
      const industry = url.searchParams.get('industry')
      if (industry)
        for (const part of industry.split(','))
          expect(labels.has(part), `${term}: industry=${part}`).toBe(true)
    }
  })
})
