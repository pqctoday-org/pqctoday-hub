// SPDX-License-Identifier: GPL-3.0-only
/**
 * Proves audit-validation-manifest can FAIL: every sabotage runs against a
 * throw-away copy of src/data/acvp + src/data/validation in os.tmpdir(),
 * never against the real files.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  MANIFEST_REL,
  SCHEMA_REL,
  auditManifest,
  enumerateCases,
  inFileClass,
  scaffoldEntry,
  sha256,
} from './audit-validation-manifest'
import type { ValidationCaseManifest } from '../src/data/validation/validationCaseManifest'
import { canonical } from './generate-release-evidence'

const REPO = process.cwd()
let tmp: string

function copyTree(rel: string) {
  fs.cpSync(path.join(REPO, rel), path.join(tmp, rel), { recursive: true })
}
function readManifest(): ValidationCaseManifest {
  return JSON.parse(fs.readFileSync(path.join(tmp, MANIFEST_REL), 'utf8'))
}
function writeManifest(m: ValidationCaseManifest) {
  fs.writeFileSync(path.join(tmp, MANIFEST_REL), JSON.stringify(m, null, 2))
}
function codes(scanRoots: string[] = ['src']) {
  return auditManifest({ root: tmp, scanRoots }).findings.map((f) => f.code)
}
/** Rewrite a copied vector file and re-record its hash, so only the targeted check fires. */
function rewriteVector(file: string, mutate: (doc: Record<string, unknown>) => void) {
  const abs = path.join(tmp, 'src/data/acvp', file)
  const doc = JSON.parse(fs.readFileSync(abs, 'utf8'))
  mutate(doc)
  const bytes = JSON.stringify(doc, null, 2)
  fs.writeFileSync(abs, bytes)
  const m = readManifest()
  m.files.find((f) => f.path.endsWith(`/${file}`))!.sha256 = sha256(bytes)
  writeManifest(m)
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'validation-manifest-'))
  copyTree('src/data/acvp')
  copyTree('src/data/validation')
  // Declared copies live all over the repo: carry each copy target into the
  // fixture rather than dropping the declarations. Dropping them would change
  // every such entry, and review / source-check records are bound to the exact
  // entry, so the fixture would report CONTRIB_REVIEW for files the real tree
  // has reviewed.
  for (const f of readManifest().files)
    for (const c of f.copies ?? []) if (fs.existsSync(path.join(REPO, c.path))) copyTree(c.path)
})
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

describe('audit-validation-manifest — baseline', () => {
  it('the committed manifest passes against the real repository', () => {
    // Undeclared-copy scanning of the whole tree is left to `npm run
    // audit:validation-manifest` (gate:data); declared copies are still verified here.
    const { findings } = auditManifest({ root: REPO, scanRoots: [] })
    expect(findings.filter((f) => f.level === 'error')).toEqual([])
  })

  it('the fixture copy passes before any sabotage', () => {
    expect(codes()).toEqual([])
  })
})

describe('audit-validation-manifest — sabotage (temp copy only)', () => {
  it('fails when one byte of a vector file changes', () => {
    const abs = path.join(tmp, 'src/data/acvp/mldsa_test.json')
    const buf = fs.readFileSync(abs)
    const i = buf.indexOf(Buffer.from('"sig": "')) + 10
    buf[i] = buf[i] === 0x41 ? 0x42 : 0x41
    fs.writeFileSync(abs, buf)
    expect(codes()).toContain('HASH_MISMATCH')
  })

  it('fails on a vector file that is not registered', () => {
    fs.copyFileSync(
      path.join(tmp, 'src/data/acvp/sha256_test.json'),
      path.join(tmp, 'src/data/acvp/new_vector_test.json')
    )
    expect(codes()).toContain('UNREGISTERED_FILE')
  })

  it('fails on an unknown evidence class', () => {
    const m = readManifest()
    ;(m.files[0] as { evidenceClass: string }).evidenceClass = 'nist-validated'
    writeManifest(m)
    expect(codes()).toEqual(expect.arrayContaining(['SCHEMA', 'UNKNOWN_CLASS']))
  })

  it('fails when a file is relabelled to a class its source evidence does not support', () => {
    const m = readManifest()
    // pbkdf2_test is the one remaining Node/OpenSSL-oracle file (aesgcm_test,
    // the original example, now comes from NIST CAVP).
    m.files.find((f) => f.id === 'pbkdf2_test')!.evidenceClass = 'published-standard-kat'
    m.files.find((f) => f.id === 'hkdf_test')!.source.verification = undefined
    writeManifest(m)
    const found = auditManifest({ root: tmp, scanRoots: [] }).findings.filter(
      (f) => f.code === 'CLASS_SOURCE_MISMATCH'
    )
    expect(found.map((f) => f.file).sort()).toEqual([
      'src/data/acvp/hkdf_test.json',
      'src/data/acvp/pbkdf2_test.json',
    ])
  })

  it('fails when a NIST record loses its upstream SHA-256', () => {
    const m = readManifest()
    const f = m.files.find((x) => x.evidenceClass === 'nist-acvp-reference-sample')!
    delete (f.source.nist as Partial<NonNullable<typeof f.source.nist>>).upstreamSha256
    writeManifest(m)
    expect(codes()).toContain('NIST_PROVENANCE_INCOMPLETE')
  })

  it('fails when the manifest and the in-file _provenance disagree on the upstream hash', () => {
    rewriteVector('sha256_test.json', (d) => {
      ;(d._provenance as Record<string, string>).source_sha256 = '0'.repeat(64)
    })
    expect(codes()).toContain('NIST_INFILE_DRIFT')
  })

  it('fails when an unverified case is left active', () => {
    const m = readManifest()
    const c = m.files.find((f) => f.id === 'kmac_test')!.cases[0]
    c.status = 'active'
    writeManifest(m)
    expect(codes()).toContain('UNVERIFIED_ACTIVE')
  })

  it('fails when a new test case is added without registering it', () => {
    rewriteVector('sha256_test.json', (d) => {
      const tests = (d.testGroups as { tests: unknown[] }[])[0].tests
      tests.push({ ...(tests[0] as object) })
    })
    expect(codes()).toContain('UNREGISTERED_CASE')
  })

  it('fails on a dangling lineage reference', () => {
    const m = readManifest()
    m.files.find((f) => f.id === 'mlkem_test')!.cases[0].lineage = ['no-such-lineage']
    writeManifest(m)
    expect(codes()).toContain('LINEAGE_REF')
  })

  it('fails when an in-file producer conflict is not declared', () => {
    // No committed file declares a conflict any more, so plant one: an oracle
    // file whose own _provenance claims a NIST producer.
    expect(codes()).not.toContain('IN_FILE_CLASS_CONFLICT')
    rewriteVector('pbkdf2_test.json', (d) => {
      ;(d._provenance as Record<string, string>).producer = 'NIST ACVP-Server (planted)'
    })
    expect(codes()).toContain('IN_FILE_CLASS_CONFLICT')
  })

  it('fails when the schema class enum drifts from evidenceClasses.ts', () => {
    const abs = path.join(tmp, SCHEMA_REL)
    const s = JSON.parse(fs.readFileSync(abs, 'utf8'))
    s.definitions.evidenceClass.enum.push('vendor-self-attested')
    fs.writeFileSync(abs, JSON.stringify(s))
    expect(codes()).toContain('CLASS_ENUM_DRIFT')
  })

  it('fails on an undeclared byte-equal copy and on an undeclared embedded value', () => {
    fs.mkdirSync(path.join(tmp, 'src/elsewhere'), { recursive: true })
    fs.copyFileSync(
      path.join(tmp, 'src/data/acvp/hmac_test.json'),
      path.join(tmp, 'src/elsewhere/hmac_copy.json')
    )
    const mlkem = JSON.parse(
      fs.readFileSync(path.join(tmp, 'src/data/acvp/mlkem_test.json'), 'utf8')
    )
    fs.writeFileSync(
      path.join(tmp, 'src/elsewhere/template.ts'),
      `export const SS = '${mlkem.testGroups[1].tests[0].ss}'\n`
    )
    const found = auditManifest({ root: tmp, scanRoots: ['src'] }).findings.filter(
      (f) => f.code === 'UNDECLARED_COPY'
    )
    expect(found.map((f) => f.file).sort()).toEqual([
      'src/data/acvp/hmac_test.json',
      'src/data/acvp/mlkem_test.json',
    ])
  })

  it('passes a declared copy, then fails once the copy diverges from the vector', () => {
    const mlkem = JSON.parse(
      fs.readFileSync(path.join(tmp, 'src/data/acvp/mlkem_test.json'), 'utf8')
    )
    const ss: string = mlkem.testGroups[1].tests[0].ss
    fs.mkdirSync(path.join(tmp, 'src/elsewhere'), { recursive: true })
    const copy = path.join(tmp, 'src/elsewhere/template.ts')
    fs.writeFileSync(copy, `export const SS = '${ss}'\n`)
    const m = readManifest()
    m.files
      .find((f) => f.id === 'mlkem_test')!
      .copies.push({
        path: 'src/elsewhere/template.ts',
        kind: 'embedded-values',
        cases: ['mlkem_test#/testGroups/1/tests/0'],
        fields: ['ss'],
      })
    writeManifest(m)
    expect(codes()).toEqual([])
    fs.writeFileSync(copy, `export const SS = '${ss.slice(0, -2)}00'\n`)
    expect(codes()).toContain('COPY_DIVERGED')
  })
})

describe('audit-validation-manifest — contributor flow (WS-I, temp copy only)', () => {
  /** Register a new active vector file cloned from sha256_test (new id, one changed byte). */
  function plantContribution(mutate?: (e: ValidationCaseManifest['files'][number]) => void) {
    const src = path.join(tmp, 'src/data/acvp/sha256_test.json')
    const doc = JSON.parse(fs.readFileSync(src, 'utf8'))
    doc._contribution = 'synthetic'
    const bytes = JSON.stringify(doc, null, 2)
    fs.writeFileSync(path.join(tmp, 'src/data/acvp/contrib_test.json'), bytes)
    const m = readManifest()
    const base = m.files.find((f) => f.id === 'sha256_test')!
    const e = structuredClone(base)
    e.id = 'contrib_test'
    e.path = 'src/data/acvp/contrib_test.json'
    e.sha256 = sha256(bytes)
    e.cases = e.cases.map((c) => ({
      ...c,
      caseId: c.caseId.replace('sha256_test', 'contrib_test'),
    }))
    e.lineage = e.lineage.map((l) => ({
      ...l,
      appliesTo: l.appliesTo.map((a) => a.replace('sha256_test', 'contrib_test')),
    }))
    mutate?.(e)
    m.files.push(e)
    writeManifest(m)
    return e
  }
  const contribCodes = () => codes().filter((c) => c.startsWith('CONTRIB_'))

  it('the 40 pre-flow files are exempt; a new file without a two-person review fails', () => {
    expect(contribCodes()).toEqual([])
    plantContribution()
    expect(contribCodes()).toEqual(['CONTRIB_REVIEW'])
  })

  it('fails a contribution without a reviewed license note, source identity or expectations', () => {
    plantContribution((e) => {
      e.license = { note: 'TODO', reviewed: false }
      delete (e.source as { nist?: unknown }).nist
      delete (e.cases[0] as { expectation?: string }).expectation
    })
    expect(contribCodes()).toEqual(
      expect.arrayContaining(['CONTRIB_LICENSE', 'CONTRIB_PROVENANCE', 'CONTRIB_EXPECTATION'])
    )
  })

  it('an approved two-person review of the exact record passes; one reviewer, or a stale record, does not', () => {
    // A published-document source (hkdf_test's RFC 5869), so the two-person
    // rule applies: the 2026-09-26 single-reviewer relaxation covers
    // nist-acvp-server sources only.
    const rfc = readManifest().files.find((f) => f.id === 'hkdf_test')!
    const e = plantContribution((x) => {
      x.evidenceClass = rfc.evidenceClass
      x.source = structuredClone(rfc.source)
    })
    const dir = path.join(tmp, 'src/data/validation/reviews')
    const record = (over: Record<string, unknown> = {}) => ({
      schema: 'pqctoday.validation-review/v1',
      item: 'vector-source:contrib_test',
      subjectSha256: sha256(canonical(e)),
      author: 'Ada Contributor',
      sourceVerification: { reviewer: 'Grace Verifier', date: '2026-09-24', decision: 'approved' },
      claimReview: { reviewer: 'Alan Reviewer', date: '2026-09-24', decision: 'approved' },
      decision: 'approved',
      ...over,
    })
    const write = (r: unknown) =>
      fs.writeFileSync(path.join(dir, 'contrib_test.review.json'), JSON.stringify(r))
    write(record())
    expect(contribCodes()).toEqual([])
    write(
      record({
        claimReview: { reviewer: 'Grace Verifier', date: '2026-09-24', decision: 'approved' },
      })
    )
    expect(contribCodes()).toEqual(['CONTRIB_REVIEW'])
    write(record({ subjectSha256: 'a'.repeat(64) }))
    expect(contribCodes()).toEqual(['CONTRIB_REVIEW'])
  })

  it('a NIST-sourced contribution may name one reviewer in both roles (2026-09-26)', () => {
    const e = plantContribution()
    const same = { reviewer: 'Grace Verifier', date: '2026-09-24', decision: 'approved' }
    fs.writeFileSync(
      path.join(tmp, 'src/data/validation/reviews/contrib_test.review.json'),
      JSON.stringify({
        schema: 'pqctoday.validation-review/v1',
        item: 'vector-source:contrib_test',
        subjectSha256: sha256(canonical(e)),
        author: 'Ada Contributor',
        sourceVerification: same,
        claimReview: same,
        decision: 'approved',
      })
    )
    expect(contribCodes()).toEqual([])
  })
})

describe('helpers', () => {
  it('enumerates array, map and self containers', () => {
    const doc = { a: [{}, {}], m: { x: {}, 'y/z': {} }, s: { k: 1 } }
    expect(
      enumerateCases(doc, [
        { pointer: '/a', kind: 'array' },
        { pointer: '/m', kind: 'map' },
        { pointer: '/s', kind: 'self' },
      ])
    ).toEqual(['/a/0', '/a/1', '/m/x', '/m/y~1z', '/s'])
  })

  it('derives the in-file class from _provenance.producer', () => {
    expect(inFileClass({ _provenance: { producer: 'NIST ACVP-Server (x)' } })).toBe(
      'nist-acvp-reference-sample'
    )
    expect(inFileClass({ _provenance: { producer: 'self-generated, oracle=OpenSSL' } })).toBe(
      'independent-oracle'
    )
    expect(inFileClass({ _provenance: { producer: 'RFC 3394 Section 4.6' } })).toBe(
      'published-standard-kat'
    )
    expect(inFileClass({})).toBeUndefined()
  })

  it('scaffolds a quarantined, unverified entry with one record per case', () => {
    const e = scaffoldEntry(REPO, 'src/data/acvp/sha256_test.json')
    expect(e.status).toBe('quarantined')
    expect(e.evidenceClass).toBe('unverified')
    expect(e.cases.map((c) => c.pointer)).toEqual([
      '/testGroups/0/tests/0',
      '/testGroups/0/tests/1',
      '/testGroups/0/tests/2',
    ])
  })
})
