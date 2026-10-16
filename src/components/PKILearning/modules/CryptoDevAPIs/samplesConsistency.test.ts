// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
//
// Keeps samples/pqc-runtimes/expected.json honest: every sample it lists has a
// source file on disk, and every expected size is the FIPS 203 / FIPS 204 value
// for the algorithm. The samples themselves are compiled and run by the
// "PQC runtime samples" workflow, not here.
/* eslint-disable security/detect-non-literal-fs-filename -- reads a fixed repo dir */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// process.cwd() is the repo root under vitest; import.meta.url is not a file:// URL here.
const SAMPLES_DIR = join(process.cwd(), 'samples', 'pqc-runtimes')

interface ExpectedSample {
  language: string
  algorithm: 'ML-KEM-768' | 'ML-DSA-65'
  source: string
  api: string
  minToolchain: { name: string; version: string; note?: string }
  sizes: Record<string, number>
}

const expected = JSON.parse(readFileSync(join(SAMPLES_DIR, 'expected.json'), 'utf8')) as {
  samples: Record<string, ExpectedSample>
}

// FIPS 203 (ML-KEM-768) and FIPS 204 (ML-DSA-65) byte lengths.
const FIPS_SIZES: Record<ExpectedSample['algorithm'], Record<string, number>> = {
  'ML-KEM-768': { encapsulation_key: 1184, ciphertext: 1088, shared_secret: 32 },
  'ML-DSA-65': { public_key: 1952, signature: 3309 },
}

const entries = Object.entries(expected.samples)

describe('samples/pqc-runtimes/expected.json', () => {
  it('lists at least one ML-KEM and one ML-DSA sample', () => {
    const algorithms = new Set(entries.map(([, s]) => s.algorithm))
    expect(algorithms).toEqual(new Set(['ML-KEM-768', 'ML-DSA-65']))
  })

  it.each(entries)('%s has its source file in its own folder', (id, sample) => {
    expect(sample.source.startsWith(`${id}/`)).toBe(true)
    expect(existsSync(join(SAMPLES_DIR, sample.source))).toBe(true)
  })

  it.each(entries)('%s prints the OK line for its own id', (id, sample) => {
    const source = readFileSync(join(SAMPLES_DIR, sample.source), 'utf8')
    expect(source).toContain('SPDX-License-Identifier: GPL-3.0-only')
    // Each sample builds "OK <id>" from a literal containing its id.
    expect(source).toContain(id)
  })

  it.each(entries)('%s expects exactly the FIPS sizes for its algorithm', (_id, sample) => {
    expect(sample.sizes).toEqual(FIPS_SIZES[sample.algorithm])
  })

  it.each(entries)('%s names a minimum toolchain version', (_id, sample) => {
    expect(sample.minToolchain.name).toMatch(/\S/)
    expect(sample.minToolchain.version.split('.').every((part) => /^\d+$/.test(part))).toBe(true)
  })

  it('has no sample folder missing from expected.json', () => {
    const folders = readdirSync(SAMPLES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !['bin', 'obj'].includes(d.name))
      .map((d) => d.name)
      .sort()
    expect(folders).toEqual(entries.map(([id]) => id).sort())
  })
})
