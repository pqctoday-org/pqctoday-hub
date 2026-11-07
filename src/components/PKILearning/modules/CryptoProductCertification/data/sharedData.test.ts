// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  MANDATE_LABEL,
  MANDATE_SCOPE_NOTE,
  PQC_SCHEME_TABLE,
  capstoneMarkdown,
  emptyCapstone,
} from './sharedData'

describe('eIDAS / QSCD row of the scheme table', () => {
  const row = PQC_SCHEME_TABLE.find((r) => r.scheme === 'eIDAS / QSCD')

  it('does not derive the algorithm basis from ACM alone', () => {
    expect(row).toBeDefined()
    expect(row?.current).not.toMatch(/algorithms come through ACM/)
    // the assessment-route qualification is kept: listed standard, or a comparable process
    expect(row?.current).toMatch(/Art 30\(3\)/)
    expect(row?.current).toMatch(/listed assessment standard/)
    expect(row?.current).toMatch(/comparable security levels/)
    expect(row?.current).toMatch(/follows the assessment route used, not ACM alone/)
    expect(row?.current).toMatch(/ACM v2 is guidance/)
  })

  it('says the text read sets no algorithm or PQC deadline', () => {
    expect(row?.current).toMatch(/names no algorithm/)
    expect(row?.planning).toMatch(
      /No algorithm or PQC deadline is set by the regulation text read here/
    )
  })
})

describe('PCI row of the scheme table', () => {
  it('limits its absence statement to the documents read', () => {
    const row = PQC_SCHEME_TABLE.find((r) => r.scheme === 'PCI')
    expect(row?.current).toMatch(
      /v5\.0 announcement and the listing definitions name no PQC algorithm/
    )
    expect(row?.current).toMatch(/makes no claim about every PCI standard/)
  })
})

describe('market deadline labels', () => {
  it('keeps the binding label tied to the instrument scope and states what it omits', () => {
    expect(MANDATE_LABEL.HARD).toMatch(/within its own scope/)
    expect(MANDATE_SCOPE_NOTE).toMatch(/applies only to the organisations, systems and functions/)
    expect(MANDATE_SCOPE_NOTE).toMatch(/assumption of this scenario/)
  })
})

describe('capstone export', () => {
  it('prints the scope of the market deadlines next to them', () => {
    const md = capstoneMarkdown(emptyCapstone('fips'), '2026-11-05')
    expect(md).toContain('Market deadlines (from the Hub timeline, read at export time):')
    expect(md).toContain(`Scope: ${MANDATE_SCOPE_NOTE}`)
    expect(md).toContain(MANDATE_LABEL.HARD)
  })
})
