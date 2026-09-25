// SPDX-License-Identifier: GPL-3.0-only
/**
 * Fixtures for the banned-claims gate (WS-A A-6). Every sabotage case writes
 * a prohibited phrase into a TEMP copy, never into a real source file.
 */
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  scanText,
  scanCountDrift,
  countNistReferenceFiles,
  listFiles,
  runAudit,
} from './audit-validation-claims'

const tmpDirs: string[] = []
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true })
})

const rules = (text: string, file = 'src/x.tsx') => scanText(text, file).map((f) => f.rule)

describe('context-free banned phrases', () => {
  it.each([
    ['This engine is ACVP validated.', 'acvp-validated'],
    ['Our results are ACVP-certified.', 'acvp-validated'],
    ['Complete ACVP coverage for ML-KEM.', 'complete-acvp'],
    ['Full ACVP support across engines.', 'complete-acvp'],
    ['All mechanisms covered by the suite.', 'all-mechanisms-covered'],
    ['Every advertised mechanism is tested.', 'all-mechanisms-covered'],
    ['Results are NIST validated.', 'nist-validated'],
    ['<h3>NIST ACVP Known Answer Tests</h3>', 'acvp-suite-heading'],
    ['<h3>ACVP Known-Answer Tests</h3>', 'acvp-suite-heading'],
    ["label: 'Run NIST KAT'", 'nist-kat-button'],
    ['The response was accepted by ACVTS.', 'acvts-verdict'],
  ])('flags %j', (text, rule) => {
    expect(rules(text)).toContain(rule)
  })

  it('matches a phrase split across JSX lines and {" "} artefacts', () => {
    const jsx = `<p>\n  The WASM engine is ACVP\n  validated{' '}\n  today.</p>`
    expect(rules(jsx)).toContain('acvp-validated')
    expect(scanText(jsx, 'a.tsx')[0].line).toBe(2)
  })
})

describe('legitimate uses are not flagged', () => {
  it.each([
    'A passing result is not ACVP validated and not a CAVP/CMVP certificate.',
    "This isn't a complete ACVP matrix.",
    'It is never NIST validated by running this page.',
    'Rather than claiming all mechanisms covered, the matrix shows gaps.',
    'Only NIST-approved algorithms may be used.',
    'The vendor ships a FIPS 140-3 certified HSM.',
    'Thales Luna is CMVP validated (certificate #4962).',
    '// an ACVP known-answer test: import the vector key material',
    'Selected public NIST ACVP-Server reference samples.',
  ])('passes %j', (text) => {
    expect(rules(text)).toEqual([])
  })

  it('flags certification words only when the sentence is about PQC Today itself', () => {
    expect(rules('The softhsmv3 WASM engine is FIPS 140-3 certified.')).toContain('self-certified')
    expect(rules('PQC Today is CMVP validated.')).toContain('self-certified')
    expect(rules('Pick a FIPS 140-3 certified module from the catalog.')).toEqual([])
  })

  it('does not treat a question as a claim', () => {
    expect(rules('| Is SoftHSMv3 FIPS validated? | No, and the site never says it is. |')).toEqual(
      []
    )
  })

  it('honours an inline claims-lint-allow comment on the same or previous line', () => {
    expect(rules('// claims-lint-allow: quoting a vendor\nOur engine is ACVP validated.')).toEqual(
      []
    )
    expect(rules('Our engine is ACVP validated. // claims-lint-allow: test fixture')).toEqual([])
  })

  it('honours an allowlist entry scoped to its file', () => {
    const allow = [{ file: 'src/a.tsx', match: 'is NIST validated', reason: 'fixture' }]
    expect(scanText('The vendor module is NIST validated.', 'src/a.tsx', allow)).toEqual([])
    expect(scanText('The vendor module is NIST validated.', 'src/b.tsx', allow)).toHaveLength(1)
  })
})

describe('presentation count drift (A-5)', () => {
  it('counts the NIST ACVP-Server-backed vector files from their provenance', () => {
    const n = countNistReferenceFiles()
    expect(n).toBeGreaterThanOrEqual(15)
  })

  it('flags a stale count and accepts the live one', () => {
    const n = countNistReferenceFiles()
    expect(
      scanCountDrift(`${n} selected public NIST ACVP-Server reference samples`, 'd', n)
    ).toEqual([])
    const stale = scanCountDrift('13 selected public NIST ACVP-Server reference samples', 'd', n)
    expect(stale).toHaveLength(n === 13 ? 0 : 1)
    expect(scanCountDrift('thirteen NIST ACVP-Server files', 'd', 15)).toHaveLength(1)
    // The three shapes the 22-Sep deck actually used for its stale "13":
    expect(
      scanCountDrift('<span class="c">13</span><span><b>NIST ACVP reference vector</b>', 'd', 15)
    ).toHaveLength(1)
    expect(scanCountDrift('| 13 NIST / 7 standard KAT |', 'd', 15)).toHaveLength(1)
    expect(
      scanCountDrift(
        'Thirteen of the thirty vector files come from the NIST ACVP-Server repo',
        'd',
        15
      )
    ).toHaveLength(1)
    // …and numbers that are not counts do not trip it.
    expect(
      scanCountDrift('checks ML-DSA-65 SigVer against a NIST ACVP-Server sample', 'd', 15)
    ).toEqual([])
    expect(
      scanCountDrift('The Demo 2 vectors are selected public NIST ACVP-Server samples', 'd', 15)
    ).toEqual([])
  })
})

describe('sabotage: the gate fails on an inserted phrase (temp copy only)', () => {
  it('a temp tree with one prohibited phrase fails; the same tree without it passes', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claims-sabotage-'))
    tmpDirs.push(dir)
    const file = path.join(dir, 'Workbench.tsx')
    fs.writeFileSync(file, '<h3>Cryptographic Validation Workbench</h3>\n')
    const clean = listFiles(dir, dir).flatMap((f) => scanText(fs.readFileSync(f, 'utf8'), f))
    expect(clean).toEqual([])

    fs.writeFileSync(
      file,
      '<h3>Cryptographic Validation Workbench</h3>\n<p>Complete ACVP coverage.</p>\n'
    )
    const dirty = listFiles(dir, dir).flatMap((f) => scanText(fs.readFileSync(f, 'utf8'), f))
    expect(dirty.map((f) => f.rule)).toEqual(['complete-acvp'])
  })

  it('runAudit picks up an extra (presentation) path and its count drift', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claims-deck-'))
    tmpDirs.push(dir)
    fs.writeFileSync(
      path.join(dir, 'script.md'),
      'We ran 3 selected public NIST ACVP-Server reference samples. The Hub is ACVP validated.\n'
    )
    const { findings } = runAudit([dir])
    const mine = findings.filter((f) => f.file.endsWith('script.md')).map((f) => f.rule)
    expect(mine).toContain('acvp-validated')
    expect(mine).toContain('reference-sample-count-drift')
  })

  it('the real tree is clean (the gate the CI step runs)', () => {
    const { findings } = runAudit()
    expect(findings).toEqual([])
  })
})
