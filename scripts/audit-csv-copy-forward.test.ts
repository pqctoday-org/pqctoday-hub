// SPDX-License-Identifier: GPL-3.0-only
//
// Tests for the copy-forward guard's EXCUSAL logic — the part that decides a
// vanished row is fine. That decision is the dangerous one: the guard's whole
// value is failing when data disappears, so a bug that excuses too much turns
// it into a rubber stamp that reports PASS while rows go missing. It is also
// the part with real logic in it (the rest is CSV diffing).
//
// Every fixture here is synthetic and written to a temp directory, so these
// assertions do not move when src/data/ does.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { checkFamily, buildDerivedFamilyRules, type Generation } from './audit-csv-copy-forward'

let root: string
let dataDir: string
let archiveDir: string

const write = (dir: string, name: string, csv: string): string => {
  const p = path.join(dir, name)
  fs.writeFileSync(p, csv.trim() + '\n')
  return p
}

const gen = (dir: string, file: string, archived = false): Generation => ({
  file,
  fullPath: path.join(dir, file),
  archived,
})

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'copyfwd-'))
  dataDir = path.join(root, 'data')
  archiveDir = path.join(dataDir, 'archive')
  fs.mkdirSync(archiveDir, { recursive: true })
})
afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

/** Library with one active row and one deprecated row. */
const seedLibrary = () =>
  write(
    dataDir,
    'library_08142026.csv',
    `reference_id,status
STILL-ACTIVE,active
MULTI-SOURCED,active
SHARES-A-SOURCE,active
NOW-DEPRECATED,deprecated`
  )

// Key derivation picks the SHORTEST column run that is unique in the previous
// generation, so a fixture where resource_id alone happens to be unique gets
// keyed on resource_id and never exercises the composite key real data has.
// This anchor row shares its resource_id with a differently-sourced row,
// forcing the real resource_type + resource_id + source_id key.
// Each of the three key columns must ALSO be non-unique on its own, or the
// guard keys on that single column instead: resource_id repeats across the
// first two rows, source_id (`ietf`) across the first and third.
const ANCHOR = `library,MULTI-SOURCED,ietf
library,MULTI-SOURCED,nist
library,SHARES-A-SOURCE,ietf`

const runXref = (previousCsv: string, newestCsv: string) => {
  write(archiveDir, 'trusted_source_xref_08012026.csv', `${previousCsv}\n${ANCHOR}`)
  write(dataDir, 'trusted_source_xref_08142026.csv', `${newestCsv}\n${ANCHOR}`)
  return checkFamily(
    'trusted_source_xref_',
    gen(dataDir, 'trusted_source_xref_08142026.csv'),
    gen(archiveDir, 'trusted_source_xref_08012026.csv', true),
    [],
    buildDerivedFamilyRules(dataDir, archiveDir)
  )
}

describe('copy-forward guard: trusted_source_xref_ excusal rules', () => {
  beforeEach(seedLibrary)

  it('FAILS when an active resource loses its only attribution', () => {
    const r = runXref(
      `resource_type,resource_id,source_id
library,STILL-ACTIVE,ietf`,
      `resource_type,resource_id,source_id
library,NOW-DEPRECATED,ietf`
    )
    expect(r.missingKeys).toEqual(['library | STILL-ACTIVE | ietf'])
  })

  it('excuses a dropped edge when the target row is now deprecated', () => {
    const r = runXref(
      `resource_type,resource_id,source_id
library,NOW-DEPRECATED,ietf`,
      `resource_type,resource_id,source_id
library,STILL-ACTIVE,ietf`
    )
    expect(r.missingKeys).toEqual([])
    expect(r.excusedKeys.join()).toContain('deprecated')
  })

  it('excuses a re-attribution — same resource, better source', () => {
    const r = runXref(
      `resource_type,resource_id,source_id
library,STILL-ACTIVE,ncsc-uk`,
      `resource_type,resource_id,source_id
library,STILL-ACTIVE,ccn-spain`
    )
    expect(r.missingKeys).toEqual([])
    expect(r.excusedKeys.join()).toContain('re-attributed')
  })

  it('excuses a dropped edge when the target row no longer exists at all', () => {
    const r = runXref(
      `resource_type,resource_id,source_id
library,DELETED-ROW,ietf`,
      `resource_type,resource_id,source_id
library,STILL-ACTIVE,ietf`
    )
    expect(r.missingKeys).toEqual([])
    expect(r.excusedKeys.join()).toContain('no longer exists')
  })

  it('does NOT excuse an unknown resource_type — an untaught type must fail loudly', () => {
    // If the generator grows a resource type this rule has never heard of,
    // passing it would hide every loss in that whole type.
    const r = runXref(
      `resource_type,resource_id,source_id
sbom,SOME-ID,ietf`,
      `resource_type,resource_id,source_id
library,STILL-ACTIVE,ietf`
    )
    expect(r.missingKeys).toEqual(['sbom | SOME-ID | ietf'])
  })

  it('applies the rules ONLY to the family they name', () => {
    // The same key shape under a different family must not inherit the xref
    // excusals — otherwise one derived family's leniency leaks into every other.
    write(archiveDir, 'library_08012026.csv', `reference_id,status\nGONE-ROW,active`)
    const r = checkFamily(
      'library_',
      gen(dataDir, 'library_08142026.csv'),
      gen(archiveDir, 'library_08012026.csv', true),
      [],
      buildDerivedFamilyRules(dataDir, archiveDir)
    )
    expect(r.missingKeys).toEqual(['GONE-ROW'])
  })
})
