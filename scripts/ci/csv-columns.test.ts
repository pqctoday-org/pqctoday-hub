// SPDX-License-Identifier: AGPL-3.0-only
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { checkCsvText, checkCsvTree, formatProblem, listCsvFiles } from './csv-columns'

const HEADER = 'id,question,answer'

describe('csv-columns: one file', () => {
  it('passes a file where every row has the header column count', () => {
    const text = [HEADER, '1,What is ML-KEM?,A KEM', '2,What is ML-DSA?,A signature', ''].join('\n')
    expect(checkCsvText(text, 'good.csv')).toEqual([])
  })

  it('fails a row with an unquoted comma (one column too many), with file, line, expected and actual', () => {
    const text = [HEADER, '1,fine,ok', '2,Hybrid, or composite?,ok', '3,fine,ok'].join('\n')
    const problems = checkCsvText(text, 'src/data/quiz.csv')
    expect(problems).toEqual([
      { file: 'src/data/quiz.csv', line: 3, kind: 'columns', expected: 3, actual: 4 },
    ])
    expect(formatProblem(problems[0])).toBe('src/data/quiz.csv:3: expected 3 columns, found 4')
  })

  it('fails a row with too few columns', () => {
    const problems = checkCsvText([HEADER, '1,only two'].join('\n'), 'short.csv')
    expect(problems).toEqual([
      { file: 'short.csv', line: 2, kind: 'columns', expected: 3, actual: 2 },
    ])
  })

  it('counts a quoted comma as part of one cell', () => {
    const text = [HEADER, '1,"Hybrid, or composite?",ok'].join('\n')
    expect(checkCsvText(text, 'quoted.csv')).toEqual([])
  })

  it('counts a quoted line break as part of one cell and reports later rows on the right line', () => {
    const text = [HEADER, '1,"two\nlines",ok', '2,bad,row,here'].join('\n')
    const problems = checkCsvText(text, 'multiline.csv')
    expect(problems).toEqual([
      { file: 'multiline.csv', line: 4, kind: 'columns', expected: 3, actual: 4 },
    ])
  })

  it('handles Windows line endings, a leading byte-order mark and blank lines', () => {
    const text = '﻿' + [HEADER, '1,a,b', '', '2,c,d', ''].join('\r\n')
    expect(checkCsvText(text, 'crlf.csv')).toEqual([])
    const bad = '﻿' + [HEADER, '1,a,b', '', '2,c,d,e'].join('\r\n')
    expect(checkCsvText(bad, 'crlf.csv')).toEqual([
      { file: 'crlf.csv', line: 4, kind: 'columns', expected: 3, actual: 4 },
    ])
  })

  it('reports a quote that is never closed as a parse problem', () => {
    const problems = checkCsvText([HEADER, '1,"never closed,ok'].join('\n'), 'quote.csv')
    expect(problems.some((p) => p.kind === 'parse' && p.line === 2)).toBe(true)
  })

  it('never prints the cell text', () => {
    const problems = checkCsvText([HEADER, '1,secret-cell,a,b'].join('\n'), 'x.csv')
    expect(problems.map(formatProblem).join('\n')).not.toContain('secret-cell')
  })
})

describe('csv-columns: a folder', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
  })

  function makeTree(files: Record<string, string>): string {
    const root = mkdtempSync(join(tmpdir(), 'csv-columns-'))
    dirs.push(root)
    for (const [name, body] of Object.entries(files)) {
      const path = join(root, name)
      mkdirSync(join(path, '..'), { recursive: true })
      writeFileSync(path, body)
    }
    return root
  }

  it('scans nested folders, skips archive folders and non-CSV files', () => {
    const root = makeTree({
      'good.csv': `${HEADER}\n1,a,b\n`,
      'nested/bad.csv': `${HEADER}\n1,a,b,c\n`,
      'archive/old.csv': `${HEADER}\n1,a,b,c\n`,
      'nested/archive/old2.csv': `${HEADER}\n1,a,b,c\n`,
      'notes.txt': 'a,b,c\n1,2\n',
    })
    expect(listCsvFiles(root).map((p) => p.slice(root.length + 1))).toEqual([
      'good.csv',
      'nested/bad.csv',
    ])
    expect(checkCsvTree(root, root)).toEqual([
      { file: 'nested/bad.csv', line: 2, kind: 'columns', expected: 3, actual: 4 },
    ])
  })

  it('passes a folder where every file is well formed', () => {
    const root = makeTree({ 'a.csv': `${HEADER}\n1,a,b\n`, 'b/c.csv': `${HEADER}\n2,c,d\n` })
    expect(checkCsvTree(root, root)).toEqual([])
  })
})

describe('csv-columns: the repository data', () => {
  it('every CSV under src/data (except the archive) has the header column count on every row', () => {
    // Vitest runs from the repository root, as the other scripts/ci tests assume.
    const root = process.cwd()
    const problems = checkCsvTree(join(root, 'src/data'), root)
    expect(problems.map(formatProblem)).toEqual([])
  })
})
