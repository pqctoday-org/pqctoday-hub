// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Shared author
/**
 * Capstone + shared-data contract: the minimum pass conditions are enforced,
 * the learner's artifact is inspectable and exportable, and market deadlines
 * come from the Hub timeline facts rather than module prose.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import {
  TIMELINE_COUNTRY_DEADLINE_BY_NAME,
  TIMELINE_COUNTRY_DEADLINE_MANDATE_BY_NAME,
} from '@/data/timelineFacts.generated'
import { Capstone } from './Capstone'
import { BoundaryDrawer } from './BoundaryDrawer'
import { SchemeSelector } from './SchemeSelector'
import { ChangeAnalyzer } from './ChangeAnalyzer'
import { EvidenceExchange } from './EvidenceExchange'
import { FourQuestions, ScopeBeforeLevel } from '../components/sections/CoreSections'
import {
  AgilityLatency,
  ChangeRoutesDetail,
  ElectronicExchange,
  PqcImpact,
  TransitionDeadlines,
} from '../components/sections/SharedSections'
import {
  capstoneJson,
  capstoneMarkdown,
  checkCapstone,
  emptyCapstone,
  landingVersusDeadline,
  lintClaims,
  marketDeadlineRows,
} from '../data/sharedData'
import { evaluateBoundary } from '../data/coreData'

const renderStep = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('claim lint (minimum pass conditions)', () => {
  it.each([
    ['Our EAL4+ certificate is equivalent to FIPS 140-3 Level 4.', 'fips-l4-vs-eal4'],
    ['eIDAS 2.0 is the Protection Profile we certify against.', 'eidas-not-pp'],
    ['ML-KEM passed ACVP, so the module is FIPS validated.', 'acvp-not-certificate'],
    ['The Orrin N7 is in the MIP list, so it is FIPS 140-3 Level 3 validated.', 'mip-not-evidence'],
    ['The PCI listing PQC flag shows ML-KEM is approved.', 'pci-flag-not-approval'],
    ['The 2030 federal deadline qualifies the change for TRNS.', 'deadline-not-evidence'],
    [
      'Its PCI PTS approval is a cryptographic validation of every algorithm.',
      'pci-listing-not-crypto-validation',
    ],
  ])('flags “%s”', (sentence, condition) => {
    expect(lintClaims(sentence).map((f) => f.condition)).toContain(condition)
  })

  it('does not flag the correct, negated statements', () => {
    const safe = [
      'EAL4+ is not equivalent to FIPS 140-3 Level 4.',
      'A MIP entry is not evidence that the module is validated.',
      'Orrin N7 firmware 4.2.1 is validated under FIPS 140-3 certificate #1234 (Level 3); firmware 5.0.0 is not yet covered.',
    ].join('\n')
    expect(lintClaims(safe)).toEqual([])
  })
})

describe('checkCapstone', () => {
  it('fails the deadline condition when TRNS is chosen for a PQC addition', () => {
    const s = emptyCapstone('fips')
    s.fips.route = 'TRNS'
    const c = checkCapstone(s).find((x) => x.id === 'deadline-not-evidence')
    expect(c?.status).toBe('fail')
  })

  it('fails when the PQC candidate is marked as covered', () => {
    const s = emptyCapstone('pci')
    s.release.fips.candidate = 'covered'
    expect(checkCapstone(s).find((x) => x.id === 'deadline-not-evidence')?.status).toBe('fail')
  })

  it('fails the eIDAS condition when the trace names eIDAS as the PP', () => {
    const s = emptyCapstone('eucc-eidas')
    s.eidas.links.pp = 'eidas-pp'
    expect(checkCapstone(s).find((x) => x.id === 'eidas-not-pp')?.status).toBe('fail')
  })

  it('passes every condition on an empty draft (nothing false asserted yet)', () => {
    const pass = checkCapstone(emptyCapstone('cc')).filter((c) => c.kind === 'pass-condition')
    expect(pass.every((c) => c.status === 'pass')).toBe(true)
  })

  it('exports markdown and JSON that carry every timed artifact and the checks', () => {
    const s = emptyCapstone('cc')
    s.claims = 'EAL4+ equals FIPS Level 4.'
    const md = capstoneMarkdown(s, '2026-09-24')
    for (const h of [
      'Artifact 1',
      'Artifact 2',
      'Artifact 4',
      'Artifact 10',
      'Artifact 12',
      'Rubric',
    ])
      expect(md).toContain(h)
    const json = JSON.parse(capstoneJson(s, '2026-09-24')) as {
      chosenPath: string
      product: { fictional: boolean }
      checks: { id: string; status: string }[]
    }
    expect(json.chosenPath).toBe('cc')
    expect(json.product.fictional).toBe(true)
    expect(json.checks.find((c) => c.id === 'fips-l4-vs-eal4')?.status).toBe('fail')
  })
})

describe('market deadlines are read from the Hub timeline facts', () => {
  it('mirrors TIMELINE_COUNTRY_DEADLINE_BY_NAME and its mandate labels', () => {
    const rows = marketDeadlineRows()
    expect(rows).toHaveLength(Object.keys(TIMELINE_COUNTRY_DEADLINE_BY_NAME).length)
    for (const r of rows) {
      expect(r.year).toBe(TIMELINE_COUNTRY_DEADLINE_BY_NAME[r.market])
      expect(r.mandate).toBe(TIMELINE_COUNTRY_DEADLINE_MANDATE_BY_NAME[r.market] ?? 'UNLABELLED')
    }
    // anchor-customer markets come first
    expect(rows[0]?.customers.length).toBeGreaterThan(0)
  })

  it('compares a learner estimate with a deadline year without inventing durations', () => {
    const now = new Date(Date.UTC(2026, 8, 24))
    expect(landingVersusDeadline(now, 12, 2030).verdict).toBe('before')
    expect(landingVersusDeadline(now, 12, 2027).verdict).toBe('same-year')
    expect(landingVersusDeadline(now, 60, 2030).verdict).toBe('after')
  })
})

describe('evaluateBoundary', () => {
  it('rejects a FIPS hardware-module boundary that stretches to the cloud front end', () => {
    const f = evaluateBoundary(
      'fips',
      'cloud',
      new Set([
        'appliance-hardware',
        'firmware',
        'crypto-library',
        'tenant-partition',
        'network-service',
      ])
    )
    expect(f.some((x) => x.component === 'network-service' && x.severity === 'error')).toBe(true)
  })
})

describe('Capstone step (RTL)', () => {
  const createObjectURL = vi.fn(() => 'blob:capstone')
  const revokeObjectURL = vi.fn()
  beforeEach(() => {
    Object.assign(URL, { createObjectURL, revokeObjectURL })
  })
  afterEach(() => vi.clearAllMocks())

  it('renders the timed artifacts and flags a prohibited claim live', () => {
    renderStep(<Capstone config={{ path: 'fips' }} />)
    expect(
      screen.getByRole('heading', { name: /Artifact 3 — Proposed FIPS target/ })
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Safe claims, one per line'), {
      target: { value: 'ML-KEM passed ACVP, so the module is FIPS validated.' },
    })
    expect(screen.getByTestId('capstone-verdict')).toHaveTextContent(/Does not pass/)
    expect(screen.getByTestId('capstone-preview')).toHaveTextContent(/passed ACVP/)
  })

  it('downloads the structured JSON artifact', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderStep(<Capstone config={{ path: 'pci' }} />)
    fireEvent.click(screen.getByRole('button', { name: /\.json/ }))
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    click.mockRestore()
  })

  it('reads the chosen path from exercise config and shows the market deadlines', () => {
    renderStep(<Capstone config={{ path: 'eucc-eidas', focus: 'release' }} />)
    expect(
      screen.getByRole('heading', { name: /Artifact 5 — eIDAS legal-to-PP trace/ })
    ).toBeInTheDocument()
    const a12 = document.getElementById('capstone-a12')
    expect(a12).not.toBeNull()
    expect(within(a12 as HTMLElement).getByText(/United States/)).toBeInTheDocument()
  })
})

describe('BoundaryDrawer step (RTL)', () => {
  it('previews what the record says nothing about', () => {
    renderStep(
      <BoundaryDrawer
        config={{
          lens: 'fips',
          deployment: 'appliance',
          inside: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
        }}
      />
    )
    expect(screen.getByText(/Says nothing about:/).parentElement).toHaveTextContent(/Client SDK/)
  })
})

describe('Shared author sections and steps render', () => {
  it.each([
    ['FourQuestions', FourQuestions],
    ['ScopeBeforeLevel', ScopeBeforeLevel],
    ['PqcImpact', PqcImpact],
    ['AgilityLatency', AgilityLatency],
    ['TransitionDeadlines', TransitionDeadlines],
    ['ChangeRoutesDetail', ChangeRoutesDetail],
    ['ElectronicExchange', ElectronicExchange],
  ])('%s renders without a draft marker', (_name, Section) => {
    renderStep(<Section />)
    expect(screen.queryByTestId('draft-pending')).not.toBeInTheDocument()
  })

  it('TransitionDeadlines lists the timeline markets, not typed dates', () => {
    renderStep(<TransitionDeadlines />)
    const table = screen.getByRole('table', { name: 'Market deadlines' })
    for (const [market, year] of Object.entries(TIMELINE_COUNTRY_DEADLINE_BY_NAME)) {
      const row = within(table).getByText(market).closest('tr')
      expect(row).toHaveTextContent(String(year))
    }
  })

  it.each([
    ['SchemeSelector', SchemeSelector],
    ['ChangeAnalyzer', ChangeAnalyzer],
    ['EvidenceExchange', EvidenceExchange],
  ])('%s renders', (_name, Step) => {
    renderStep(<Step />)
    expect(screen.queryByTestId('draft-pending')).not.toBeInTheDocument()
  })

  it('EvidenceExchange is labelled as a teaching model', () => {
    renderStep(<EvidenceExchange />)
    expect(screen.getByTestId('exchange-disclaimer')).toHaveTextContent(
      /not accepted by NIST, CC\/EUCC bodies or PCI SSC/
    )
  })
})
