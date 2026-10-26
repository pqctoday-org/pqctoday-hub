// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The OpenSSL Studio lesson list (playground content table) describes lesson 5, "An honest LMS",
 * with the lesson's own blurb, and its learning objective says what the lesson shows: this
 * openssl build has no LMS (OpenSSL 3.6 builds it only with enable-lms), not that OpenSSL
 * refuses to generate keys on principle.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import Papa from 'papaparse'
import { OPENSSL_LESSONS } from '@/components/OpenSSLStudio/learn/opensslLessons'

const DATA_DIR = join(process.cwd(), 'src', 'data')

/** The newest playground content table, by date then revision, both compared as numbers. */
function latestPlaygroundContent(): string {
  const dated = readdirSync(DATA_DIR)
    .map((name) => ({
      name,
      m: /^playground_content_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/.exec(name),
    }))
    .filter(({ m }) => m !== null)
    .map(({ name, m }) => ({
      name,
      key: [Number(m?.[3]), Number(m?.[1]), Number(m?.[2]), Number(m?.[4] ?? 0)],
    }))
    .sort((a, b) => {
      for (let i = 0; i < 4; i++) if (a.key[i] !== b.key[i]) return b.key[i] - a.key[i]
      return 0
    })
  return join(DATA_DIR, dated[0].name)
}

const { data } = Papa.parse<Record<string, string>>(
  readFileSync(latestPlaygroundContent(), 'utf8'),
  { header: true, skipEmptyLines: true }
)
const row = data.find((r) => r.lesson_id === 'openssl-studio:honest-lms')
const lesson = OPENSSL_LESSONS.find((l) => l.id === 'honest-lms')

describe('OpenSSL Studio lesson 5 in the playground content table', () => {
  it('uses the lesson blurb as its summary', () => {
    expect(row?.summary).toBe(lesson?.blurb)
  })

  it('says this build has no LMS, not that OpenSSL refuses LMS keys', () => {
    expect(row?.summary).toContain('this openssl build has no LMS at all')
    expect(row?.learning_objective).toContain('enable-lms')
    expect(row?.learning_objective).not.toMatch(/refusal to generate/i)
    expect(row?.summary).not.toMatch(/genuinely does not support/i)
  })
})
