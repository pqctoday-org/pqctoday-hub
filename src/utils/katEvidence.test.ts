// SPDX-License-Identifier: GPL-3.0-only
/**
 * Static evidence-label guard (ACVP remediation plan 2026-09-24, WS-A A-2):
 * a button, label, spec or result string may say "NIST"/"ACVP" only when the
 * test behind it reads a vector file whose `_provenance.producer` starts with
 * "NIST ACVP-Server" — the same rule as useAcvpSuite.ts's deriveEvidenceTier.
 *
 * Every check below reads real source or real config; none of them re-derives
 * the rule from the labels it is checking.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { KatKind, KatTestSpec } from './katRunner'
import {
  classifyProducer,
  evidenceForKind,
  isAcvpBacked,
  katActionLabel,
  vectorFileForKind,
} from './katEvidence'
import { ALL_KAT_TILES } from '@/components/Algorithms/katTileConfig'

const ROOT = join(__dirname, '..', '..')
const SRC = join(ROOT, 'src')
const ACVP_DIR = join(SRC, 'data', 'acvp')

/** "NIST ACVP", "ACVP KAT", "(NIST ACVP …)", "ACVP vector" … — an ACVP claim. */
const ACVP_CLAIM = /\bACVP\b|\bNIST KAT\b/

function producerOf(file: string): string | undefined {
  const json = JSON.parse(readFileSync(join(ACVP_DIR, file), 'utf8')) as {
    _provenance?: { producer?: string }
  }
  return json._provenance?.producer
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules' || name === '__golden__') continue
      walk(p, out)
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p)
  }
  return out
}

describe('katEvidence classification', () => {
  it('derives the class from the vector file provenance, matching deriveEvidenceTier', () => {
    expect(
      classifyProducer('NIST ACVP-Server (reference/generator-validated sample vectors)')
    ).toBe('nist-acvp-reference-sample')
    expect(classifyProducer('self-generated, oracle=OpenSSL')).toBe('independent-oracle')
    expect(classifyProducer('RFC 3394 Section 4.6 (published KAT sample, not from ACVP)')).toBe(
      'published-standard-kat'
    )
    expect(classifyProducer(undefined)).toBe('unverified-provenance')
  })

  it('reads the same producer string as the vector file on disk', () => {
    const kinds: KatKind[] = [
      { type: 'mlkem-decap', variant: 768 },
      { type: 'aesgcm-decrypt' },
      { type: 'aeskw-wrap' },
      { type: 'ecdsa-sigver', curve: 'P-256' },
      { type: 'pbkdf2-derive', prf: 'SHA-256' },
      { type: 'hmac-verify', hashAlg: 'SHA-512' },
    ]
    for (const kind of kinds) {
      const ref = vectorFileForKind(kind)!
      expect(ref.producer).toBe(producerOf(ref.file.replace(/^acvp\//, '')))
    }
  })

  it('classifies known cases correctly (regression pins for the 2026-09-24 audit)', () => {
    expect(evidenceForKind({ type: 'mlkem-decap', variant: 512 })).toBe(
      'nist-acvp-reference-sample'
    )
    expect(evidenceForKind({ type: 'aesgcm-decrypt' })).toBe('published-standard-kat')
    expect(evidenceForKind({ type: 'aeskw-wrap' })).toBe('published-standard-kat')
    expect(evidenceForKind({ type: 'rsapss-sigver' })).toBe('independent-oracle')
    expect(evidenceForKind({ type: 'hkdf-derive' })).toBe('unverified-provenance')
    expect(evidenceForKind({ type: 'slhdsa-functional', variant: 'SHA2-128s' })).toBe(
      'functional-round-trip'
    )
  })

  it('names a single-class button by that class and a mixed one neutrally', () => {
    const decap: Pick<KatTestSpec, 'kind'> = { kind: { type: 'mlkem-decap', variant: 768 } }
    const rt: Pick<KatTestSpec, 'kind'> = { kind: { type: 'mlkem-encap-roundtrip', variant: 768 } }
    expect(katActionLabel([decap])).toBe('Run reference sample')
    expect(katActionLabel([decap, decap])).toBe('Run reference samples')
    expect(katActionLabel([rt])).toBe('Run functional test')
    expect(katActionLabel([decap, rt])).toBe('Run validation tests')
    expect(katActionLabel([{ kind: { type: 'aeskw-wrap' } }])).toBe('Run standard KAT')
  })
})

describe('evidence-label static guard', () => {
  it('no button anywhere in src still reads "Run NIST KAT"', () => {
    const offenders = walk(SRC)
      .filter((f) => /Run NIST KAT/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(ROOT, f))
    expect(offenders).toEqual([])
  })

  it('Algorithms KAT tiles: operation labels align with specs and never claim NIST/ACVP', () => {
    for (const tile of ALL_KAT_TILES) {
      expect(tile.operations.length, tile.id).toBe(tile.specs.length)
      for (const op of tile.operations) expect(op, tile.id).not.toMatch(ACVP_CLAIM)
      expect(tile.name, tile.id).not.toMatch(ACVP_CLAIM)
      const label = katActionLabel(tile.specs)
      if (/reference sample/i.test(label)) {
        expect(
          tile.specs.every((s) => isAcvpBacked(s.kind)),
          tile.id
        ).toBe(true)
      }
    }
  })

  it('every KatTestSpec literal in src that says ACVP reads an ACVP-backed vector', () => {
    // A spec literal is `{ id: …, useCase: '…', standard: '…', …, kind: { type: '…', … } }`.
    // Walk each `kind: { type: … }` and read its own object's useCase/standard.
    const kindRe = /kind:\s*\{\s*type:\s*'([a-z0-9-]+)'([^}]*)\}/g
    const offenders: string[] = []
    let checked = 0
    for (const file of walk(SRC)) {
      const text = readFileSync(file, 'utf8')
      if (!text.includes('kind: {')) continue
      for (const m of text.matchAll(kindRe)) {
        const objStart = text.lastIndexOf('{', text.lastIndexOf('id:', m.index))
        const obj = text.slice(objStart, m.index)
        const claimText = [...obj.matchAll(/(useCase|standard):\s*(['`"])(.*?)\2/g)]
          .map((x) => x[3])
          .join(' | ')
        if (!claimText) continue
        const kind = { type: m[1] } as Record<string, unknown>
        for (const p of m[2].matchAll(/(\w+):\s*'([^']+)'/g)) kind[p[1]] = p[2]
        for (const p of m[2].matchAll(/(\w+):\s*(\d+)/g)) kind[p[1]] = Number(p[2])
        let backed: boolean
        try {
          backed = isAcvpBacked(kind as unknown as KatKind)
        } catch {
          continue // not a katRunner KatKind (e.g. an unrelated `kind: { type }`)
        }
        checked++
        if (ACVP_CLAIM.test(claimText) && !backed) {
          offenders.push(`${relative(ROOT, file)}: ${m[1]} — "${claimText}"`)
        }
      }
    }
    expect(checked).toBeGreaterThan(50)
    expect(offenders).toEqual([])
  })

  it('KatValidationPanel label/authorityNote props never claim ACVP (the panel derives that)', () => {
    const offenders: string[] = []
    for (const file of walk(SRC)) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(/<KatValidationPanel([\s\S]*?)\/>/g)) {
        for (const p of m[1].matchAll(/(label|authorityNote)=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
          const value = p[2] ?? p[3] ?? ''
          if (/\bACVP\b/.test(value)) offenders.push(`${relative(ROOT, file)}: ${p[1]}="${value}"`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('katRunner result strings mention ACVP/NIST vectors only in functions that read ACVP-backed files', () => {
    const src = readFileSync(join(SRC, 'utils', 'katRunner.ts'), 'utf8')
    const importMap = new Map<string, string>()
    for (const m of src.matchAll(/^import (\w+) from '\.\.\/data\/acvp\/([\w-]+\.json)'/gm)) {
      importMap.set(m[1], m[2])
    }
    // Helpers that read a vector file on a run function's behalf.
    const helperMap: Record<string, string> = {
      getMlkemGroup: 'mlkemTestVectors',
      getMldsaGroup: 'mldsaTestVectors',
    }
    const fnRe = /\nasync function (run\w+)\([\s\S]*?\n\}\n/g
    const offenders: string[] = []
    for (const m of src.matchAll(fnRe)) {
      let body = m[0]
      for (const [helper, id] of Object.entries(helperMap)) {
        if (body.includes(`${helper}(`)) body += ` ${id}`
      }
      const literals = [
        ...[...body.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map((x) => x[1]),
        ...[...body.matchAll(/`((?:[^`\\]|\\.)*)`/g)].map((x) => x[1]),
      ]
      const claims = literals.filter((l) =>
        /\bACVP\b|NIST (?:key|public key|private key|vector)/.test(l)
      )
      if (claims.length === 0) continue
      const used = [...importMap.keys()].filter((id) => new RegExp(`\\b${id}\\b`).test(body))
      const allBacked =
        used.length > 0 &&
        used.every((id) => producerOf(importMap.get(id)!)?.startsWith('NIST ACVP-Server'))
      if (!allBacked) offenders.push(`${m[1]}: ${claims.join(' / ')}`)
    }
    expect(offenders).toEqual([])
  })

  it('validation-workbench result rows say ACVP only when their evidence tier is ACVP-backed', () => {
    const path = join(SRC, 'components', 'Playground', 'hsm', 'acvp', 'useAcvpSuite.ts')
    const src = readFileSync(path, 'utf8')
    const importMap = new Map<string, string>()
    for (const m of src.matchAll(/^import (\w+) from '@\/data\/acvp\/([\w-]+\.json)'/gm)) {
      importMap.set(m[1], m[2])
    }
    const offenders: string[] = []
    let rows = 0
    for (const m of src.matchAll(/pushResult\(\{([\s\S]*?)\n\s*\}\)/g)) {
      const block = m[1]
      rows++
      const text = [...block.matchAll(/(testCase|details):\s*([\s\S]*?),\n/g)]
        .map((x) => x[2])
        .join(' ')
      if (!ACVP_CLAIM.test(text)) continue
      const tier = /evidenceTier:\s*deriveEvidenceTier\((\w+)\._provenance\)/.exec(block)
      const file = tier ? importMap.get(tier[1]) : undefined
      if (!file || !producerOf(file)?.startsWith('NIST ACVP-Server')) {
        offenders.push(`${tier?.[1] ?? '(no tier)'}: ${text.slice(0, 120)}`)
      }
    }
    expect(rows).toBeGreaterThan(40)
    expect(offenders).toEqual([])
  })
})
