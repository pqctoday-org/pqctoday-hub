// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LifecycleOutcomeExamples } from './LifecycleOutcomeExamples'
import { StandardizationLifecycle } from '../workshop/StandardizationLifecycle'
import { LIFECYCLE_OUTCOME_DIFFERENCE, LIFECYCLE_OUTCOME_EXAMPLES } from '../data/lifecycleOutcomes'

const byId = (id: string) => LIFECYCLE_OUTCOME_EXAMPLES.find((e) => e.id === id)!
const allText = (id: string) => {
  const ex = byId(id)
  return [ex.scheme, ex.outcome, ex.meaning, ...ex.steps.map((s) => s.text)].join(' ')
}

/** Latest dated library CSV (MMDDYYYY, then _rN). */
function latestLibraryCsv(): string {
  const dir = path.join(process.cwd(), 'src/data')
  const key = (f: string) => {
    const m = f.match(/^library_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
    return m ? `${m[3]}${m[1]}${m[2]}-${(m[4] ?? '0').padStart(3, '0')}` : ''
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => key(f) !== '')
    .sort((a, b) => key(a).localeCompare(key(b)))
  return fs.readFileSync(path.join(dir, files[files.length - 1]), 'utf-8')
}

describe('lifecycle outcome worked examples', () => {
  it('HAWK: advanced to Round 3 on 14 May 2026 and withdrawn by its team on 29 Jul 2026', () => {
    const hawk = byId('hawk')
    expect(hawk.outcome).toMatch(/withdrawn by its authors/i)
    expect(hawk.steps.map((s) => s.date)).toEqual(['14 May 2026', '28 Jul 2026', '29 Jul 2026'])
    expect(allText('hawk')).toMatch(/Hawk is insecure and should not be used/)
    // Attribution quotes the sources' own words, nothing more
    expect(allText('hawk')).toMatch(
      /“found by Claude, with minimal technical guidance from people\.”/
    )
    expect(allText('hawk')).toMatch(/Its site says Anthropic discovered the attack/)
    expect(allText('hawk')).not.toMatch(/Claude AI model/)
    expect(allText('hawk')).not.toMatch(/FIPS candidate|likely (future )?standard/i)
  })

  it('Classic McEliece: says "advises against new use" and never "withdrawn"', () => {
    const text = allText('classic-mceliece')
    expect(text).toMatch(/advises against new use/i)
    expect(text).not.toMatch(/withdr[ae]w/i)
    expect(text).toMatch(/2\^99–2\^102/)
    expect(text).toMatch(/early 2027/)
    expect(text).toMatch(/no practical attack/i)
  })

  it('the difference sentence never puts McEliece next to "withdrawn"', () => {
    expect(LIFECYCLE_OUTCOME_DIFFERENCE).not.toMatch(/mceliece/i)
    expect(LIFECYCLE_OUTCOME_DIFFERENCE).toMatch(/advisory against new use/i)
  })

  it('every Library source is a row in the latest library CSV', () => {
    const csv = latestLibraryCsv()
    const refs = LIFECYCLE_OUTCOME_EXAMPLES.flatMap((e) => e.sources)
      .map((s) => s.libraryRef)
      .filter((r): r is string => !!r)
    expect(refs.length).toBeGreaterThanOrEqual(3)
    for (const ref of refs) expect(csv, ref).toContain(`\n${ref},`)
  })

  it('renders both examples with Library and external source links', () => {
    render(
      <MemoryRouter>
        <LifecycleOutcomeExamples />
      </MemoryRouter>
    )
    expect(screen.getByText(/Two real outcomes, compared/)).toBeInTheDocument()
    const forum = screen.getByRole('link', { name: /pqc-forum announcement/ })
    expect(forum.getAttribute('href')).toBe(
      '/library?ref=HAWK-n-Key-Recovery-Reduces-to-SVP-in-Dimension-n-2-1'
    )
    const bsi = screen.getByRole('link', { name: /BSI notice on Classic McEliece/ })
    expect(bsi.getAttribute('href')).toBe(
      '/library?ref=BSI-Hinweise-zu-aktuellen-Entwicklungen-um-Classic-McEliece'
    )
    const nist = screen.getByRole('link', { name: /NIST Round 3 page/ })
    expect(nist.getAttribute('href')).toBe(
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-3-additional-signatures'
    )
  })

  it('appears in the Standardisation Lifecycle workshop step', () => {
    render(
      <MemoryRouter>
        <StandardizationLifecycle initialCandidateId="hawk" />
      </MemoryRouter>
    )
    expect(screen.getByTestId('lifecycle-outcome-examples')).toBeInTheDocument()
  })
})
