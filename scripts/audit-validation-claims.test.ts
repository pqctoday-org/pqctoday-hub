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
  countWorkbenchGroups,
  scanWorkbenchCountDrift,
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

describe('ACVP / CAVP / CMVP role confusions (WS-I Learn sweep)', () => {
  it.each([
    ['ACVP (Automated Cryptographic Validation Program) grants IDs.', 'acvp-as-program'],
    [
      'ACVP (Cryptographic Algorithm Validation Program) handles algorithm testing.',
      'acvp-as-program',
    ],
    ['The NIST CAVP/ACVP program validates algorithms.', 'acvp-as-program'],
    ['Modules await ACVP re-certification after the IG update.', 'acvp-as-certificate'],
    ['A separate ACVP certificate is pending.', 'acvp-as-certificate'],
    ['Use modules with CAVP/ACVP certification.', 'acvp-as-certificate'],
    ['ACVP grants per-algorithm validation IDs that CMVP references.', 'acvp-as-certificate'],
    [
      'The implementation must pass ACVP. NIST provides JSON files (<code>.req</code>) of inputs.',
      'req-rsp-as-acvp',
    ],
    ['ACVP results are written back to a response file (<em>.rsp</em>).', 'req-rsp-as-acvp'],
    [
      'Functional correctness is legally enforced via the <InlineTooltip term="ACVP">Automated Cryptographic Validation Protocol</InlineTooltip>.',
      'legally-enforced-validation',
    ],
    ['Passing the NIST KATs means the module is FIPS validated.', 'kat-equals-validation'],
    ['An engine that passes the ACVP sample vectors is CAVP certified.', 'kat-equals-validation'],
  ])('flags %j', (text, rule) => {
    expect(rules(text)).toContain(rule)
  })

  it.each([
    // correct statements of the same facts
    'ACVP is the Automated Cryptographic Validation Protocol spoken by NIST’s ACVTS.',
    'The CAVP (Cryptographic Algorithm Validation Program) issues algorithm certificates.',
    'Modules await CAVP algorithm re-validation after the IG update.',
    'CAVP A5631 covers ML-KEM, ML-DSA, SLH-DSA and LMS.',
    // the legacy CAVS file format, named as such
    'The .req/.rsp files belong to ACVP’s predecessor, the CAVS tool.',
    'Those are not the <code>.req</code>/<code>.rsp</code> files of the older CAVS tool.',
    // .req/.rsp with no ACVP or JSON context at all
    'SHAVS writes a REQUEST file (SHA256ShortMsg.req) for the lab.',
    // negated and historical uses
    'ACVP is not a program and does not issue certificates.',
    'A passing KAT is not FIPS validated evidence.',
    // identifiers are not copy
    "id: 'acvp-cert',",
    // a question asserts nothing
    'What PQC-related certification does ACVP provide?',
  ])('passes %j', (text) => {
    expect(rules(text)).toEqual([])
  })

  it('sabotage: a temp copy of a real Learn file fails once the pre-fix wording is put back', () => {
    const real = path.join(
      __dirname,
      '..',
      'src/components/PKILearning/modules/PQCTestingValidation/components/PQCTestingIntroduction.tsx'
    )
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claims-acvp-sabotage-'))
    tmpDirs.push(dir)
    const copy = path.join(dir, 'PQCTestingIntroduction.tsx')
    fs.copyFileSync(real, copy)
    const scan = () =>
      listFiles(dir, dir).flatMap((f) => scanText(fs.readFileSync(f, 'utf8'), f).map((x) => x.rule))
    expect(scan()).toEqual([])

    // The exact sentences this module shipped before the WS-I fix.
    const original = fs.readFileSync(copy, 'utf8')
    fs.writeFileSync(
      copy,
      original.replace(
        '<ReadingCompleteButton />',
        `<p>In regulated environments (Federal, Financial, Healthcare), functional correctness is legally enforced via the{' '}
          <InlineTooltip term="ACVP">Automated Cryptographic Validation Protocol</InlineTooltip> to
          achieve a FIPS 140-3 certificate.</p>
        <p className="text-xs">NIST provides JSON files (<em>.req</em>) containing thousands of inputs, keys, and seeds
          for specific algorithms, writing them back to a response file (<em>.rsp</em>).</p>
        <ReadingCompleteButton />`
      )
    )
    expect(scan()).toEqual(
      expect.arrayContaining(['legally-enforced-validation', 'req-rsp-as-acvp'])
    )
    // The real file is untouched.
    expect(fs.readFileSync(real, 'utf8')).not.toContain('legally enforced')
  })
})

describe('presentation count drift (A-5)', () => {
  it('takes the NIST ACVP-Server file count from the generated manifest counts', () => {
    const n = countNistReferenceFiles()
    const generated = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'src', 'data', 'validation', 'validation-counts.generated.json'),
        'utf8'
      )
    ) as { nistReferenceSampleFileCount: number }
    expect(n).toBe(generated.nistReferenceSampleFileCount)
    // …and the provenance fallback agrees with it on this tree.
    expect(countNistReferenceFiles(undefined, '/nonexistent/counts.json')).toBe(n)
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

describe('workbench test-group count drift (A-5 / J-6)', () => {
  it('derives groups and families from the CATEGORIES table', () => {
    const w = countWorkbenchGroups()
    expect(w.families).toBe(w.categories.length)
    expect(w.groups).toBe(w.categories.reduce((n, c) => n + c.groups, 0))
    expect(w.families).toBeGreaterThan(0)
  })

  it('accepts the live figures in the deck/script/README shapes, flags stale ones', () => {
    const w = countWorkbenchGroups()
    const live = `runs every check on both. ${w.groups} test groups, ${w.families} families.`
    expect(scanWorkbenchCountDrift(live, 'deck.html', w)).toEqual([])
    const stale = [
      '"36 test sections in seven families. The badge tells you what kind of evidence it is."',
      'runs ~36 test sections of mixed evidence',
      `There are ${w.groups} test groups in six algorithm families.`,
    ].join('\n')
    const f = scanWorkbenchCountDrift(stale, 'script.md', {
      ...w,
      groups: w.groups === 36 ? 37 : w.groups,
      families: w.families === 6 ? 7 : w.families,
    })
    expect(f.map((x) => `${x.line}:${x.rule}`)).toEqual(
      expect.arrayContaining([
        '1:workbench-group-count-drift',
        '2:workbench-group-count-drift',
        '3:workbench-family-count-drift',
      ])
    )
  })

  it('SABOTAGE: an unreadable CATEGORIES table is an error, never a silent pass', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claims-wb-'))
    tmpDirs.push(dir)
    const f = path.join(dir, 'useAcvpSuite.ts')
    fs.writeFileSync(
      f,
      "export const CATEGORIES = [\n  { id: 'a', label: 'A', groups: 2 },\n  { id: 'b', groups: 3 },\n]\n"
    )
    expect(() => countWorkbenchGroups(f)).toThrow(/read 1 of 2/)
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
