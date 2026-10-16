// SPDX-License-Identifier: GPL-3.0-only
/**
 * The hybrid TLS key-exchange specification is RFC 10024 (X25519MLKEM768,
 * SecP256r1MLKEM768, SecP384r1MLKEM1024). Lesson text, sample data and
 * dialogue copy must cite the RFC, not the draft it replaced
 * (`draft-ietf-tls-ecdhe-mlkem`).
 *
 * Three data files keep the draft's name on purpose: the protocol matrix and
 * the label aliases name the document they track (a library reference id, and
 * "was draft-…" history), and the algorithm tag map is keyed by the draft id
 * in the catalogue.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const REPO_ROOT = process.cwd()
const DRAFT = 'draft-ietf-tls-ecdhe-mlkem'

/** Files that name the draft because they identify the tracked document. */
const IDENTIFIES_THE_DRAFT = new Set([
  'src/data/pqcProtocolMatrix.ts',
  'src/data/timelineLabelAliases.generated.ts',
  'src/data/pqcAlgorithmsData.ts',
])

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...sourceFiles(full))
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

describe('hybrid TLS key exchange is cited as RFC 10024', () => {
  it('no component or data source cites the superseded draft', () => {
    const files = [
      ...sourceFiles(path.join(REPO_ROOT, 'src', 'components')),
      ...sourceFiles(path.join(REPO_ROOT, 'src', 'data')),
    ]
    const offenders = files
      .map((f) => path.relative(REPO_ROOT, f).split(path.sep).join('/'))
      .filter((rel) => !IDENTIFIES_THE_DRAFT.has(rel))
      .filter((rel) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8').includes(DRAFT))
    expect(offenders).toEqual([])
  })
})
