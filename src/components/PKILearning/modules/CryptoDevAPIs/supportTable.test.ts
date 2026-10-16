// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Guard for the module's single source of truth on PQC platform support
 * (data/pqcSupportData.ts) and for platform claims that have gone stale
 * before. Dates are compared with the exported TABLE_REVIEW_DATE, never the
 * clock, so CI does not start failing on its own: re-check the rows, bump the
 * row dates and TABLE_REVIEW_DATE together.
 */
/* eslint-disable security/detect-non-literal-fs-filename -- walks this module's own directory */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import {
  RUNTIME_SUPPORT,
  TABLE_REVIEW_DATE,
  PQC_SUPPORT_MATRIX,
  getRuntimeSupport,
} from './data/pqcSupportData'

const MAX_AGE_DAYS = 180
const DAY_MS = 24 * 60 * 60 * 1000
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const MODULE_DIR = __dirname
const THIS_FILE = 'supportTable.test.ts'

const BANNED_PHRASES: RegExp[] = [
  /stdlib still classical-only/i,
  /\bSIDH\b/,
  // There is no MLKem768 class (.NET 9 or later); the real API is the
  // MLKemAlgorithm.MLKem768 property (C# or PowerShell syntax), which stays allowed.
  /(?<!MLKemAlgorithm(?:\.|\]::))\bMLKem768\b/,
  /cryptography 4[0-6]/i,
  /JDK 21\+ does not include/i,
  /zero (application )?code changes?/i,
  /PQC not yet available in CNG/i,
]

function listTextFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return listTextFiles(full)
    return /\.(tsx?|md)$/.test(name) ? [full] : []
  })
}

describe('PQC support table (pqcSupportData)', () => {
  it('TABLE_REVIEW_DATE is a valid ISO date and not in the future', () => {
    expect(TABLE_REVIEW_DATE).toMatch(ISO_DATE)
    const review = Date.parse(TABLE_REVIEW_DATE)
    expect(Number.isNaN(review)).toBe(false)
    expect(review).toBeLessThanOrEqual(Date.now())
  })

  it('every row has an https evidenceUrl and a checkedDate within 180 days of TABLE_REVIEW_DATE', () => {
    const oldest = Date.parse(TABLE_REVIEW_DATE) - MAX_AGE_DAYS * DAY_MS
    const problems = RUNTIME_SUPPORT.flatMap((row) => {
      const id = `${row.runtimeId} × ${row.algorithm}`
      const issues: string[] = []
      if (!row.evidenceUrl || !/^https:\/\//.test(row.evidenceUrl)) {
        issues.push(`${id}: missing or non-https evidenceUrl`)
      }
      if (!ISO_DATE.test(row.checkedDate)) {
        issues.push(`${id}: checkedDate "${row.checkedDate}" is not YYYY-MM-DD`)
      } else {
        const checked = Date.parse(row.checkedDate)
        if (checked < oldest) issues.push(`${id}: checkedDate ${row.checkedDate} is stale`)
        if (checked > Date.parse(TABLE_REVIEW_DATE)) {
          issues.push(`${id}: checkedDate ${row.checkedDate} is after TABLE_REVIEW_DATE`)
        }
      }
      return issues
    })
    expect(problems).toEqual([])
  })

  it('has exactly one row per runtime and algorithm', () => {
    const keys = RUNTIME_SUPPORT.map((r) => `${r.runtimeId}|${r.algorithm}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('sample ids only sit on rows the runtime itself implements', () => {
    const misplaced = RUNTIME_SUPPORT.filter(
      (r) => r.sampleId && r.status !== 'stable' && r.status !== 'experimental'
    ).map((r) => `${r.runtimeId} × ${r.algorithm}`)
    expect(misplaced).toEqual([])
  })

  it('the API matrix reads the derived rows from the table', () => {
    const cng = PQC_SUPPORT_MATRIX.find((c) => c.apiId === 'ksp-cng' && c.algorithmId === 'slh-dsa')
    expect(cng?.status).toBe(getRuntimeSupport('windows-cng', 'SLH-DSA').status)
    const jdk = PQC_SUPPORT_MATRIX.find((c) => c.apiId === 'jca-jce' && c.algorithmId === 'ml-kem')
    expect(jdk?.version).toBe(getRuntimeSupport('java', 'ML-KEM').minVersion)
  })
})

describe('CryptoDevAPIs module text', () => {
  it('contains none of the known-stale platform claims', () => {
    const hits = listTextFiles(MODULE_DIR)
      .filter((file) => !file.endsWith(THIS_FILE))
      .flatMap((file) => {
        const text = readFileSync(file, 'utf8')
        return BANNED_PHRASES.filter((re) => re.test(text)).map(
          (re) => `${relative(MODULE_DIR, file)}: ${re}`
        )
      })
    expect(hits).toEqual([])
  })
})
