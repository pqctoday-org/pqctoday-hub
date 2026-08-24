// SPDX-License-Identifier: GPL-3.0-only
//
// ACCURACY-0705 drift guard: every literal `status:` value any in-app
// deep-link/CTA passes must be a real STATUS_ITEMS id. This is exactly the
// class of bug that shipped: 'Standardized' isn't a valid status, so the
// Developer persona's default entry CTA (and its matching persona-hint
// copy) silently produced a zero-result filter. A single structural
// assertion over the data — not a rendered click — catches this and any
// future recurrence, without needing to know which component fires it.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import { INTENTS, PERSONA_INTENTS, EU_EXECUTIVE_INTENTS } from '@/data/algorithmEntryIntents'
import { STATUS_ITEMS } from './AlgorithmFilters'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data')

/** Finds the CSV in src/data the loaders would actually pick — same
 *  (date desc, revision desc) precedence as `loadLatestCSV`/`loadLatestCSVAsync`
 *  in csvUtils.ts. Mirrors the helper in algorithmStatusTier.driftguard.test.ts
 *  and AlgorithmFilters.regionDriftGuard.test.ts. */
function findWiredCsv(pattern: RegExp): string {
  const matches = readdirSync(dataDir)
    .filter((f) => pattern.test(f))
    .map((f) => {
      const m = f.match(/_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      const date = m ? new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])) : new Date(0)
      const revision = m?.[4] ? parseInt(m[4], 10) : 0
      return { file: f, date, revision }
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime() || b.revision - a.revision)
  expect(
    matches.length,
    `expected at least one CSV matching ${pattern} in src/data`
  ).toBeGreaterThan(0)
  return join(dataDir, matches[0].file)
}

function parseRows(path: string): Record<string, string>[] {
  const content = readFileSync(path, 'utf-8')
  const { data } = Papa.parse<Record<string, string>>(content.trim(), {
    header: true,
    skipEmptyLines: true,
  })
  return data
}

describe('AlgorithmEntryStrip status params (ACCURACY-0705)', () => {
  const validStatusIds = new Set(STATUS_ITEMS.map((item) => item.id))

  it('every intent whose params include a status uses a real STATUS_ITEMS id', () => {
    const allIntents = [...INTENTS, ...Object.values(PERSONA_INTENTS), ...EU_EXECUTIVE_INTENTS]
    const offenders = allIntents
      .filter((intent) => intent.params.status != null)
      .filter((intent) => !validStatusIds.has(intent.params.status as string))
      .map((intent) => ({ label: intent.label, status: intent.params.status }))

    expect(offenders).toEqual([])
  })
})

// Same class of bug as ACCURACY-0705, caught 2026-07-11: the executive
// persona's default CTA set `section: 'security'` with `tab: 'detailed'` —
// `section` is only ever read by AlgorithmValidationView on the Validation
// tab, and only recognises 'attacks' | 'kat', so that key silently did
// nothing. This structural check makes the same mistake fail a test instead
// of shipping a dead param again.
describe('AlgorithmEntryStrip section params', () => {
  const validSectionIds = new Set(['attacks', 'kat'])

  it('every intent whose params include a section targets tab=validation with a real section id', () => {
    const allIntents = [...INTENTS, ...Object.values(PERSONA_INTENTS), ...EU_EXECUTIVE_INTENTS]
    const offenders = allIntents
      .filter((intent) => intent.params.section != null)
      .filter(
        (intent) =>
          intent.params.tab !== 'validation' ||
          !validSectionIds.has(intent.params.section as string)
      )
      .map((intent) => ({
        label: intent.label,
        tab: intent.params.tab,
        section: intent.params.section,
      }))

    expect(offenders).toEqual([])
  })
})

// bplus-programme WS4c (2026-08-02 execution plan §7): the executive
// persona's CTA hardcodes `highlight: 'ML-KEM-768,ML-DSA-65,SLH-DSA-SHA2-128s'`
// under the label "top compliance picks" / "the FIPS-required choices for US
// federal compliance". That claim was never checked against the catalog it
// describes — same unverified-literal shape as ACCURACY-0705 above, just in
// a string that never gets typechecked against real data. This guard makes
// the claim self-defending: if a name is renamed, deprecated, or its FIPS
// status regresses (e.g. NIST withdraws a parameter set), the test fails
// loudly instead of the page quietly telling an executive to standardize on
// something that no longer qualifies.
describe('AlgorithmEntryStrip highlight params — drift guard (bplus WS4c)', () => {
  const referenceRows = parseRows(
    findWiredCsv(/^pqc_complete_algorithm_reference_\d{8}(?:_r\d+)?\.csv$/)
  )
  const byName = new Map(referenceRows.map((r) => [(r.algorithm || '').trim(), r]))

  const allIntents = [...INTENTS, ...Object.values(PERSONA_INTENTS), ...EU_EXECUTIVE_INTENTS]
  const highlightNames = allIntents
    .filter((intent) => typeof intent.params.highlight === 'string')
    .flatMap((intent) => (intent.params.highlight as string).split(','))

  it('has at least one highlighted algorithm to check (the fixture is not silently empty)', () => {
    expect(highlightNames.length).toBeGreaterThan(0)
  })

  it('every highlighted algorithm name exists in the wired reference catalog', () => {
    const missing = highlightNames.filter((name) => !byName.has(name))
    expect(missing).toEqual([])
  })

  it('the default (US) executive pick carries a finalized FIPS status, matching its "FIPS-required" claim', () => {
    // Scoped to PERSONA_INTENTS.executive only — the ONE intent that actually
    // claims FIPS-required status. EU_EXECUTIVE_INTENTS below make different,
    // separately-verified claims (BSI/ANSSI recommendations, not FIPS), so
    // they are checked against their own allowlists, not this rule.
    const names = (PERSONA_INTENTS.executive?.params.highlight as string).split(',')
    const notFinalFips = names
      .map((name) => ({ name, status: byName.get(name)?.status }))
      .filter(({ status }) => !/^FIPS \d+$/.test((status || '').trim()))

    expect(notFinalFips).toEqual([])
  })
})

// bplus-programme WS4c EU split (2026-08-07): BSI and ANSSI recommend
// different, non-overlapping algorithm sets (see the comment above
// EU_EXECUTIVE_INTENTS in AlgorithmEntryStrip.tsx for the full picture). This
// guard checks each authority's entry against an allowlist HAND-TRANSCRIBED
// from that authority's own document — not derived from the app's `region`
// column, which groups BSI and ANSSI together and would hide exactly the
// disagreement this feature exists to show.
describe('AlgorithmEntryStrip EU entries — drift guard against primary sources', () => {
  const referenceRows2 = parseRows(
    findWiredCsv(/^pqc_complete_algorithm_reference_\d{8}(?:_r\d+)?\.csv$/)
  )
  const byName2 = new Map(referenceRows2.map((r) => [(r.algorithm || '').trim(), r]))

  const bsiEntry = EU_EXECUTIVE_INTENTS.find((i) => i.label.startsWith('BSI'))
  const anssiEntry = EU_EXECUTIVE_INTENTS.find((i) => i.label.startsWith('ANSSI'))

  // Transcribed 2026-08-07 from pqctoday-priv/local-evidence-cache/library/
  // BSI-TR-02102-1.pdf (2026-01 edition), Tables 2.5 (FrodoKEM), 2.6 (Classic
  // McEliece), 2.7 (ML-KEM), 5.6 (SLH-DSA — Category 3/5 ONLY, no Category
  // 1/128-bit entry exists in the table), 5.7 (ML-DSA — Category 3/5 only,
  // ML-DSA-44 is absent).
  const BSI_TR_02102_1_RECOMMENDED = new Set([
    'ML-KEM-768',
    'ML-KEM-1024',
    'ML-DSA-65',
    'ML-DSA-87',
    'SLH-DSA-SHA2-192s',
    'SLH-DSA-SHAKE-192s',
    'SLH-DSA-SHA2-192f',
    'SLH-DSA-SHAKE-192f',
    'SLH-DSA-SHA2-256s',
    'SLH-DSA-SHAKE-256s',
    'SLH-DSA-SHA2-256f',
    'SLH-DSA-SHAKE-256f',
    'FrodoKEM-976',
    'FrodoKEM-1344',
    'Classic-McEliece-460896',
    'Classic-McEliece-6688128',
    'Classic-McEliece-8192128',
  ])

  it('BSI entry exists and only highlights algorithms in the verified BSI-recommended set', () => {
    expect(bsiEntry).toBeDefined()
    const names = (bsiEntry!.params.highlight as string).split(',')
    const unverified = names.filter((n) => !BSI_TR_02102_1_RECOMMENDED.has(n))
    expect(unverified).toEqual([])
  })

  it("BSI entry does not highlight the Category-1 SLH-DSA pick (absent from BSI's own table)", () => {
    const names = (bsiEntry!.params.highlight as string).split(',')
    expect(names).not.toContain('SLH-DSA-SHA2-128s')
  })

  it("ANSSI entry exists and its FrodoKEM pick matches ANSSI PG-083's stated preference (976, not 640)", () => {
    expect(anssiEntry).toBeDefined()
    const names = (anssiEntry!.params.highlight as string).split(',')
    const frodo = names.filter((n) => n.startsWith('FrodoKEM'))
    expect(frodo).toEqual(['FrodoKEM-976'])
  })

  it('ANSSI entry does not attribute Classic McEliece to ANSSI (zero mentions in ANSSI-PG-083-v3-2026.pdf)', () => {
    const names = (anssiEntry!.params.highlight as string).split(',')
    expect(names.some((n) => n.includes('McEliece'))).toBe(false)
  })

  it('every BSI- and ANSSI-highlighted algorithm still exists in the wired reference catalog', () => {
    const names = [
      ...(bsiEntry!.params.highlight as string).split(','),
      ...(anssiEntry!.params.highlight as string).split(','),
    ]
    const missing = names.filter((n) => !byName2.has(n))
    expect(missing).toEqual([])
  })
})
