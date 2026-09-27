// SPDX-License-Identifier: GPL-3.0-only
/**
 * Golden comparison (F-4): a generated response vs. a NIST ACVP-Server
 * `expectedResults.json` for the same prompt. Only possible for PUBLIC sample
 * vector sets — an ACVTS-issued prompt has no local expected results, which is
 * the whole point of a server verdict. This is a local sanity check of the
 * adapter, never an ACVTS verdict.
 */
import type { JsonObject } from './ir'

export interface GoldenMismatch {
  tgId: number
  tcId: number
  field: string
  expected: string | boolean | null
  actual: string | boolean | null
}

export interface GoldenComparison {
  /** Expected test cases whose every responded field matches. */
  matched: number
  mismatched: GoldenMismatch[]
  /** Expected test cases the response does not answer (unsupported/error). */
  unanswered: number
  /** Response tests with no counterpart in expectedResults (always a defect). */
  unexpected: Array<{ tgId: number; tcId: number }>
  expectedTotal: number
}

const unwrap = (doc: unknown): JsonObject => {
  if (Array.isArray(doc) && doc.length === 2) return doc[1] as JsonObject
  return doc as JsonObject
}

const norm = (v: unknown): string | boolean | null =>
  typeof v === 'string' ? v.toUpperCase() : typeof v === 'boolean' ? v : null

export const compareToExpected = (responseDoc: unknown, expectedDoc: unknown): GoldenComparison => {
  const resp = unwrap(responseDoc)
  const exp = unwrap(expectedDoc)
  if (resp.vsId !== exp.vsId) {
    throw new Error(`vsId mismatch: response ${String(resp.vsId)} vs expected ${String(exp.vsId)}`)
  }
  const respTests = new Map<string, JsonObject>()
  for (const g of resp.testGroups as JsonObject[]) {
    for (const t of g.tests as JsonObject[]) respTests.set(`${g.tgId}/${t.tcId}`, t)
  }
  const seen = new Set<string>()
  const out: GoldenComparison = {
    matched: 0,
    mismatched: [],
    unanswered: 0,
    unexpected: [],
    expectedTotal: 0,
  }
  for (const g of exp.testGroups as JsonObject[]) {
    for (const t of g.tests as JsonObject[]) {
      out.expectedTotal++
      const key = `${g.tgId}/${t.tcId}`
      const r = respTests.get(key)
      if (!r) {
        out.unanswered++
        continue
      }
      seen.add(key)
      let ok = true
      for (const field of Object.keys(r)) {
        if (field === 'tcId') continue
        const expected = norm(t[field])
        const actual = norm(r[field])
        if (expected === null || expected !== actual) {
          ok = false
          out.mismatched.push({
            tgId: g.tgId as number,
            tcId: t.tcId as number,
            field,
            expected,
            actual,
          })
        }
      }
      if (ok) out.matched++
    }
  }
  for (const key of respTests.keys()) {
    if (!seen.has(key)) {
      const [tgId, tcId] = key.split('/').map(Number)
      out.unexpected.push({ tgId, tcId })
    }
  }
  return out
}
