// SPDX-License-Identifier: GPL-3.0-only
/**
 * Standards-drift guard for the hybrid-certificate surfaces.
 *
 * The 2026-09-30 refresh found the same Composite KEM draft cited at three
 * different revisions (-17 in a code comment, -19 in the protocol matrix, -20
 * in the Learn module) while the datatracker was at -21, and Chameleon — an
 * expired individual draft — described as a live format. These tests make the
 * protocol matrix's X.509 row the single place a draft revision is recorded,
 * and fail when any reader-facing surface disagrees with it.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import Papa from 'papaparse'
import { PROTOCOL_MATRIX } from '@/data/pqcProtocolMatrix'
import { HYBRID_CERT_FORMATS, CURRENT_HYBRID_CERT_FORMATS } from './constants'

const ROOT = process.cwd()
const MODULES = join(ROOT, 'src/components/PKILearning/modules')

/** Reader-facing files that describe hybrid certificate formats. */
const SURFACES = [
  join(MODULES, 'HybridCrypto'),
  join(MODULES, 'PKIWorkshop/CertParser.tsx'),
  join(MODULES, 'PKIWorkshop/rag-summary.md'),
  join(MODULES, 'ArchQuantumImpact/rag-summary.md'),
]

function collectFiles(path: string): string[] {
  if (statSync(path).isFile()) return [path]
  return readdirSync(path, { recursive: true, encoding: 'utf8' })
    .map((p) => join(path, p))
    .filter((p) => statSync(p).isFile())
    .filter((p) => /\.(ts|tsx|md)$/.test(p) && !/\.test\.tsx?$/.test(p))
}

const files = SURFACES.flatMap(collectFiles).map((p) => ({
  path: relative(ROOT, p),
  text: readFileSync(p, 'utf8'),
}))

const x509 = PROTOCOL_MATRIX.find((r) => r.id === 'x509')
if (!x509) throw new Error('protocol matrix has no x509 row')

/** Revision the matrix records for a draft family, e.g. 'pq-composite-kem' → '21'. */
function matrixRevision(family: string): string {
  const doc = x509!.latestDraft.find((d) => d.id.startsWith(`draft-ietf-lamps-${family}-`))
  if (!doc) throw new Error(`matrix X.509 row has no draft-ietf-lamps-${family}`)
  return doc.id.slice(`draft-ietf-lamps-${family}-`.length)
}

describe('hybrid certificate standards drift', () => {
  for (const family of ['pq-composite-kem', 'pq-composite-sigs']) {
    it(`every revision-qualified ${family} citation matches the protocol matrix`, () => {
      const current = matrixRevision(family)
      const re = new RegExp(`draft-ietf-lamps-${family}-(\\d{2})\\b`, 'g')
      const stale: string[] = []
      for (const f of files) {
        for (const m of f.text.matchAll(re)) {
          if (m[1] !== current) stale.push(`${f.path}: ${m[0]}`)
        }
      }
      expect(stale, `matrix says -${current}`).toEqual([])
    })
  }

  it('each format card cites a document the latest library CSV holds, at the matrix revision', () => {
    const libFiles = readdirSync(join(ROOT, 'src/data'))
      .filter((f) => /^library_\d{8}(_r\d+)?\.csv$/.test(f))
      .sort((a, b) => {
        const key = (f: string) => {
          const [, d, r] = f.match(/^library_(\d{8})(?:_r(\d+))?\.csv$/)!
          return [d.slice(4) + d.slice(0, 4), Number(r ?? 0)] as const
        }
        const [da, ra] = key(a)
        const [db, rb] = key(b)
        return da === db ? ra - rb : da.localeCompare(db)
      })
    const latest = libFiles[libFiles.length - 1]
    const rows = Papa.parse<Record<string, string>>(
      readFileSync(join(ROOT, 'src/data', latest), 'utf8'),
      { header: true, skipEmptyLines: true }
    ).data
    const ids = new Set(rows.map((r) => r.reference_id))
    for (const fmt of HYBRID_CERT_FORMATS) {
      const draft = fmt.standard.match(/^draft-ietf-lamps-([a-z-]+?)-(\d{2})$/)
      if (draft) {
        expect(fmt.standard, `${fmt.id} card revision`).toBe(
          `draft-ietf-lamps-${draft[1]}-${matrixRevision(draft[1])}`
        )
        expect(ids.has(fmt.standard), `${fmt.standard} in ${latest}`).toBe(true)
      }
    }
  })

  it('Chameleon is historical and never claims legacy compatibility', () => {
    const chameleon = HYBRID_CERT_FORMATS.find((f) => f.id === 'chameleon')
    expect(chameleon?.group).toBe('historical')
    expect(chameleon?.legacyCompat).toBe(false)
    expect(CURRENT_HYBRID_CERT_FORMATS.some((f) => f.id === 'chameleon')).toBe(false)
  })

  it('no surface calls Chameleon certificates something that works with legacy verifiers', () => {
    const bad = files.filter((f) =>
      /chameleon[^.]{0,80}(work|compatible)[^.]{0,20}legacy/i.test(f.text)
    )
    expect(bad.map((f) => f.path)).toEqual([])
  })

  it('no surface describes FIPS 206 as published or final', () => {
    // A sentence that names FIPS 206 and calls it published/final/approved
    // without a negation ("not", "no", "unpublished", "planned", "until").
    const hits: string[] = []
    for (const f of files) {
      for (const sentence of f.text.split(/(?<=[.!?])\s+/)) {
        if (!/FIPS[\s-]?206/.test(sentence)) continue
        if (!/\b(published|final|approved|standardi[sz]ed)\b/i.test(sentence)) continue
        if (/\b(not|no|unpublished|planned|until|before|once|pending|draft)\b/i.test(sentence))
          continue
        hits.push(`${f.path}: ${sentence.trim().slice(0, 160)}`)
      }
    }
    expect(hits).toEqual([])
  })

  it('no surface says harvest-now-decrypt-later breaks signatures retroactively', () => {
    const bad = files.filter((f) =>
      /harvest[^.]{0,120}(break|forge)[^.]{0,40}signatures?[^.]{0,20}retroactive/i.test(f.text)
    )
    expect(bad.map((f) => f.path)).toEqual([])
  })
})
