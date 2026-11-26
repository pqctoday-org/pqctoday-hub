// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateDeepLink } from '@/services/search/deepLinkGrammar'
import { KnowledgeReader, normName } from './knowledgeReader'
import type { KnowledgeCore } from './knowledgeTypes'

/**
 * The two knowledge files the Hub serves (`public/data/knowledge-core.json`, `knowledge-text.json`), checked as the
 * site uses them: every tag resolves to its record, every address is one the Hub's link grammar accepts (bar the listed
 * forms whose pages do not read them yet), and no Hub file they were built from has changed since.
 */
const ROOT = process.cwd()
const core = JSON.parse(
  readFileSync(join(ROOT, 'public/data/knowledge-core.json'), 'utf8')
) as KnowledgeCore
const text = JSON.parse(readFileSync(join(ROOT, 'public/data/knowledge-text.json'), 'utf8')) as {
  entries: Record<string, unknown>
}
const reader = new KnowledgeReader(core)

/** Kinds whose address the Hub's pages do not read yet (plan step 3.3, forms still to build): kind -> records. */
const FORMS_NOT_READ_YET: Record<string, number> = {
  // (A glossary term's address, `?glossary=<term>`, is read on every page: it opens the drawer's Glossary.)
  'playground lesson': 54,
  assessment: 130,
}

describe('the knowledge core file', () => {
  it('is the schema this reader reads, with one record per tag', () => {
    expect(core.schema).toBe('knowledge-core/1')
    expect(new Set(core.records.map((r) => r.id)).size).toBe(core.records.length)
    expect(core.meta.counts.records).toBe(core.records.length)
  })

  it('opens every tag, and every tag kind approved on 24 and 25 Nov 2026 has records', () => {
    for (const r of core.records) {
      const got = reader.lookup(r.id)
      expect(got.found && got.record.id, r.id).toBe(r.id)
      expect(r.link.startsWith('/'), r.id).toBe(true)
    }
    const prefix = (id: string) => id.split('/')[0].split(':')[0].replace(/-.*$/, '')
    const have = new Set(core.records.map((r) => prefix(r.id)))
    for (const kind of [
      'QZ',
      'CERT',
      'CHG',
      'KAT',
      'CHK',
      'PATH',
      'PAGE',
      'TOOL',
      'STG',
      'NICE',
      'THR',
      'ALG',
      'LM',
      'LIB',
      'GL',
    ]) {
      expect(have.has(kind), kind).toBe(true)
    }
  })

  it('names every old id and alias it holds, to a record that exists', () => {
    for (const [name, entries] of Object.entries(core.aliases)) {
      for (const [id] of entries) expect(reader.get(id), `${name} -> ${id}`).toBeDefined()
      expect(normName(name)).toBe(name)
    }
    for (const r of core.records)
      for (const id of [r.parent, r.place, ...(r.parts ?? []), ...(r.more ?? [])]) {
        if (id) expect(reader.get(id), `${r.id} names ${id}`).toBeDefined()
      }
  })

  it('opens the stage and NICE-area tags on the Learn page, on real parameters', () => {
    for (const n of [1, 2, 3, 4, 5]) expect(reader.linkOf(`STG:${n}`)).toBe(`/learn?stage=${n}`)
    const areas = core.records.filter((r) => r.id.startsWith('NICE:'))
    expect(areas).toHaveLength(8)
    for (const a of areas) expect(a.link).toBe(`/learn?area=${a.id.slice(5)}`)
    // every lesson that has a stage is a part of that stage
    const lessons = core.records.filter((r) => r.kind === 'module' && r.id !== 'LM:quiz')
    for (const l of lessons) expect(l.parent, l.id).toMatch(/^STG:[1-5]$/)
  })

  it('has one record for an algorithm family, with its parameter sets as parts and the threat in its one form', () => {
    const fam = reader.lookup('ML-KEM')
    expect(fam.found && fam.record.id).toBe('ALG:ML-KEM')
    expect(reader.partsOf('ALG:ML-KEM').map((p) => p.id)).toEqual([
      'ALG:ml-kem-512',
      'ALG:ml-kem-768',
      'ALG:ml-kem-1024',
    ])
    const threat = core.records.find((r) => r.kind === 'threat')!
    expect(threat.id.startsWith('THR:')).toBe(true)
    const former = reader.lookup('TH:' + threat.id.slice(4))
    expect(former.found && former.record.id).toBe(threat.id)
    expect(core.records.some((r) => r.id.startsWith('TH:'))).toBe(false)
  })

  it('has addresses the Hub link grammar accepts, except the listed forms its pages do not read yet', () => {
    const bad: Record<string, string[]> = {}
    for (const r of core.records) {
      const f = validateDeepLink(r.link)
      if (f) (bad[r.kind] ??= []).push(`${r.link} :: ${f.reason}`)
    }
    const counts = Object.fromEntries(Object.entries(bad).map(([k, v]) => [k, v.length]))
    expect(
      counts,
      JSON.stringify(Object.fromEntries(Object.entries(bad).map(([k, v]) => [k, v.slice(0, 2)])))
    ).toEqual(FORMS_NOT_READ_YET)
  })
})

describe('the knowledge text file', () => {
  it('holds text only for tags the core has', () => {
    for (const tag of Object.keys(text.entries)) expect(reader.get(tag), tag).toBeDefined()
  })
})

describe('the Hub files the knowledge files were built from', () => {
  it('have not changed since the files were built', () => {
    const changed: string[] = []
    for (const [path, sha] of core.meta.inputs) {
      const abs = join(ROOT, path)
      if (!existsSync(abs)) changed.push(`${path} (missing)`)
      else if (createHash('sha256').update(readFileSync(abs)).digest('hex') !== sha)
        changed.push(path)
    }
    expect(changed, 'rebuild the knowledge files').toEqual([])
  })

  it('are still the newest of each dated family and the whole set of lesson sources', () => {
    const listed = new Set(core.meta.inputs.map(([p]) => p))
    const dated = new Map<string, string[]>()
    for (const p of listed) {
      const m = /^(.*\/)([a-z0-9_-]+?)_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/.exec(p)
      if (m) dated.set(m[1] + m[2], [...(dated.get(m[1] + m[2]) ?? []), p])
    }
    const key = (name: string) => {
      const m = /_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/.exec(name)!
      return Number(m[3] + m[1] + m[2]) * 1000 + Number(m[4] ?? 0)
    }
    const newer: string[] = []
    for (const [stem, files] of dated) {
      const dir = stem.slice(0, stem.lastIndexOf('/') + 1)
      const prefix = stem.slice(dir.length)
      const here = readdirSync(join(ROOT, dir)).filter((f) =>
        new RegExp(`^${prefix}_\\d{8}(?:_r\\d+)?\\.csv$`).test(f)
      )
      const newest = here.sort((a, b) => key(a) - key(b)).at(-1)
      if (newest && !files.includes(dir + newest)) newer.push(dir + newest)
    }
    expect(newer, 'a newer data file exists: rebuild the knowledge files').toEqual([])

    const lessonDir = 'src/components/PKILearning/modules'
    const walk = (dir: string): string[] =>
      readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]
      )
    const sources = walk(lessonDir).filter(
      (p) => /\.(ts|tsx|md)$/.test(p) && !/\.(test|spec)\.tsx?$/.test(p)
    )
    expect(
      sources.filter((p) => !listed.has(p)),
      'a lesson source was added'
    ).toEqual([])
  })
})
