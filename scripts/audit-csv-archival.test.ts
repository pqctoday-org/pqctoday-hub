// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { csvPrefix, findExcess } from './audit-csv-archival'

function makeDataDir(files: string[]): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'csv-archival-test-'))
  for (const f of files) fs.writeFileSync(path.join(dir, f), 'header\n')
  return dir
}

const tmpDirs: string[] = []
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true })
})

describe('csvPrefix', () => {
  it('strips a plain dated suffix', () => {
    expect(csvPrefix('library_07262026.csv')).toBe('library_')
  })

  it('strips a revisioned suffix', () => {
    expect(csvPrefix('library_07262026_r25.csv')).toBe('library_')
  })

  it('leaves multi-word prefixes with underscores intact', () => {
    expect(csvPrefix('pqc_product_catalog_07242026_r6.csv')).toBe('pqc_product_catalog_')
  })
})

describe('findExcess', () => {
  it('is silent when every prefix has exactly the max', () => {
    const dir = makeDataDir(['library_07242026.csv', 'library_07262026.csv'])
    tmpDirs.push(dir)
    expect(findExcess(dir)).toEqual([])
  })

  it('is silent when a prefix has fewer than the max', () => {
    const dir = makeDataDir(['library_07262026.csv'])
    tmpDirs.push(dir)
    expect(findExcess(dir)).toEqual([])
  })

  it('flags a prefix over the max and lists the correct files to archive', () => {
    // 3 files, max 2 -> the OLDEST 1 should be flagged as excess.
    const dir = makeDataDir([
      'library_07242026.csv',
      'library_07252026.csv',
      'library_07262026.csv',
    ])
    tmpDirs.push(dir)
    const findings = findExcess(dir)
    expect(findings).toHaveLength(1)
    expect(findings[0].prefix).toBe('library_')
    expect(findings[0].count).toBe(3)
    expect(findings[0].excess).toEqual(['library_07242026.csv'])
  })

  it('sorts by revision within the same date, not lexicographically', () => {
    // The real bug this guards against: plain string sort puts _r9 after
    // _r24 (export_assurance_json.py:71's documented defect class).
    const dir = makeDataDir([
      'library_07262026.csv',
      'library_07262026_r9.csv',
      'library_07262026_r24.csv',
      'library_07262026_r25.csv',
    ])
    tmpDirs.push(dir)
    const findings = findExcess(dir)
    expect(findings).toHaveLength(1)
    // Keep the 2 newest by (date, revision): _r25 and _r24. Archive the rest.
    expect(findings[0].excess.sort()).toEqual(
      ['library_07262026.csv', 'library_07262026_r9.csv'].sort()
    )
  })

  it('reports multiple independent prefixes separately', () => {
    const dir = makeDataDir([
      'library_07242026.csv',
      'library_07252026.csv',
      'library_07262026.csv',
      'timeline_07202026.csv',
      'timeline_07212026.csv',
      'timeline_07242026.csv',
    ])
    tmpDirs.push(dir)
    const findings = findExcess(dir)
    expect(findings.map((f) => f.prefix)).toEqual(['library_', 'timeline_'])
  })

  it('never descends into an archive/ subdirectory', () => {
    const dir = makeDataDir(['library_07252026.csv', 'library_07262026.csv'])
    tmpDirs.push(dir)
    const archiveDir = path.join(dir, 'archive')
    fs.mkdirSync(archiveDir)
    for (let i = 1; i <= 10; i++) {
      fs.writeFileSync(path.join(archiveDir, `library_0716202${i}.csv`), 'header\n')
    }
    expect(findExcess(dir)).toEqual([])
  })

  it('respects a custom maxVersions', () => {
    const dir = makeDataDir([
      'library_07242026.csv',
      'library_07252026.csv',
      'library_07262026.csv',
    ])
    tmpDirs.push(dir)
    expect(findExcess(dir, 3)).toEqual([])
    expect(findExcess(dir, 1)).toHaveLength(1)
  })
})
