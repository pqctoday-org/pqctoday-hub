// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import { COUNTS_REL, computeCounts, renderCounts } from './generate-validation-counts'
import type { ValidationCaseManifest } from '../src/data/validation/validationCaseManifest'

const REPO = process.cwd()
const manifest = JSON.parse(
  fs.readFileSync(path.join(REPO, 'src/data/validation/vector-manifest.json'), 'utf8')
) as ValidationCaseManifest

describe('generate-validation-counts', () => {
  it('the committed counts file is exactly what the manifest generates (the --check contract)', () => {
    expect(fs.readFileSync(path.join(REPO, COUNTS_REL), 'utf8')).toBe(renderCounts(manifest))
  })

  it('file counts partition the registered files and match the vector directory', () => {
    const c = computeCounts(manifest)
    const onDisk = fs
      .readdirSync(path.join(REPO, 'src/data/acvp'))
      .filter((f) => f.endsWith('.json'))
    expect(c.vectorFiles.total).toBe(onDisk.length)
    expect(Object.values(c.filesByClass).reduce((a, b) => a + b, 0)).toBe(c.vectorFiles.total)
    expect(c.nistReferenceSampleFileCount).toBe(c.filesByClass['nist-acvp-reference-sample'])
  })

  it('a quarantined case is excluded from every active per-class and per-algorithm count', () => {
    const c = computeCounts(manifest)
    const active = Object.values(c.activeCasesByClass).reduce((a, b) => a + b, 0)
    expect(active).toBe(c.cases.active)
    expect(c.cases.active + c.cases.quarantined).toBe(c.cases.total)
    expect(c.activeCasesByClass.unverified).toBe(0)
    const perAlg = Object.values(c.byAlgorithm).reduce((a, b) => a + b.cases, 0)
    expect(perAlg).toBe(c.cases.active)
  })

  it('moving a file to another class changes the generated output (drift is detectable)', () => {
    const edited = structuredClone(manifest)
    const f = edited.files.find((x) => x.evidenceClass === 'nist-acvp-reference-sample')!
    f.evidenceClass = 'published-standard-kat'
    expect(computeCounts(edited).nistReferenceSampleFileCount).toBe(
      computeCounts(manifest).nistReferenceSampleFileCount - 1
    )
    expect(renderCounts(edited)).not.toBe(renderCounts(manifest))
  })
})
