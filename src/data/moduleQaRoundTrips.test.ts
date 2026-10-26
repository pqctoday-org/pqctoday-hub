// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The Testing & Validation Q&A answer about TCP-to-TLS overhead must match the lesson:
 * a TCP connection costs one round trip before application data can flow (RFC 9293
 * section 3.5, Figure 6) and a TLS 1.3 handshake one more (RFC 8446 section 2), so it
 * may not claim the TCP handshake takes six round trips (300 ms at a 50 ms round trip).
 * Checks the newest combined Q&A table, the one the app and search read, and the newest
 * table for the module.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import Papa from 'papaparse'

const QA_DIR = join(process.cwd(), 'src', 'data', 'module-qa')
const ANSWER_ID = 'pqc-testing-validation-learn-008'

/** The newest dated file matching `pattern`, by date then revision, both compared as numbers. */
function newestFile(pattern: RegExp): string {
  const dated = readdirSync(QA_DIR)
    .map((name) => ({ name, m: /_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/.exec(name) }))
    .filter(({ name, m }) => pattern.test(name) && m !== null)
    .map(({ name, m }) => ({
      name,
      key: [Number(m?.[3]), Number(m?.[1]), Number(m?.[2]), Number(m?.[4] ?? 0)],
    }))
    .sort((a, b) => {
      for (let i = 0; i < 4; i++) if (a.key[i] !== b.key[i]) return b.key[i] - a.key[i]
      return 0
    })
  expect(dated.length).toBeGreaterThan(0)
  return join(QA_DIR, dated[0].name)
}

function answerIn(file: string): string {
  const { data } = Papa.parse<Record<string, string>>(readFileSync(file, 'utf8').trim(), {
    header: true,
    skipEmptyLines: true,
  })
  const row = data.find((r) => r.question_id === ANSWER_ID)
  expect(row, `${ANSWER_ID} in ${file}`).toBeDefined()
  return (row as Record<string, string>).answer
}

describe('TCP-to-TLS overhead answer', () => {
  const files = {
    combined: newestFile(/^module_qa_combined_\d{8}(?:_r\d+)?\.csv$/),
    module: newestFile(/^module_qa_pqc-testing-validation_\d{8}(?:_r\d+)?\.csv$/),
  }

  for (const [name, file] of Object.entries(files)) {
    it(`${name} table: one TCP round trip plus one for TLS 1.3, with the RFC sections`, () => {
      const answer = answerIn(file)
      expect(answer).toContain(
        'the TCP handshake costs one round trip (50ms) and the TLS 1.3 handshake one more (RFC 9293 section 3.5; RFC 8446 section 2) before application data flows'
      )
    })

    it(`${name} table: does not claim six round trips or 300 ms for the TCP handshake`, () => {
      const answer = answerIn(file)
      expect(answer).not.toMatch(/6 RTT|six round|300\s?ms/i)
    })
  }
})
