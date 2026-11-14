// SPDX-License-Identifier: AGPL-3.0-only
//
// The contents list and the page must agree: every entry the list shows has an
// anchor on the page with exactly that id, and every anchor the list could name
// but omits is genuinely absent from the page.
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReportContent } from './ReportContent'
import { buildReportToc } from './reportTocModel'
import { REPORT_SECTION_ORDER } from '@/data/reportSectionToCswp39'
import { PHASE_ORDER, type PhaseId } from '@/data/frameworkPhases'
import type { PersonaId } from '@/data/learningPersonas'
import {
  EXAMPLE_REPORT_RESULT,
  EXAMPLE_REPORT_GRC_RESULT,
  EXAMPLE_REPORT_SHARE_PAYLOAD,
} from '@/data/exampleReport'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

const CANDIDATE_IDS = [
  ...REPORT_SECTION_ORDER.map((id) => `report-section-${id}`),
  'report-section-qra',
  'report-section-roiCalculator',
  'report-section-kpiTrending',
  'report-section-niceGap',
]

const quick = EXAMPLE_REPORT_RESULT
const full = EXAMPLE_REPORT_GRC_RESULT
// A result with nothing optional to say: the conditional sections must drop out.
const sparse = {
  ...quick,
  keyFindings: [],
  executiveSummary: undefined,
  algorithmMigrations: [],
  complianceImpacts: [],
  omittedCompliance: undefined,
  hndlRiskWindow: undefined,
  tnflRiskWindow: undefined,
}

beforeEach(() => {
  usePersonaStore.getState().setPersona(null)
  // The reader's own answers: QRA and the NICE gap report read them.
  useAssessmentFormStore.setState({
    assessmentStatus: 'complete',
    ...EXAMPLE_REPORT_SHARE_PAYLOAD,
  } as never)
})

function check(opts: {
  result: typeof quick
  persona: PersonaId | null
  shared: boolean
  showFullReport: boolean
  phase?: PhaseId
}) {
  const { result, persona, shared, showFullReport, phase } = opts
  const hasOwnInput = !shared
  if (!shared) usePersonaStore.getState().setPersona(persona)
  const { container, unmount } = render(
    <MemoryRouter initialEntries={[phase ? `/report?phase=${phase}` : '/report']}>
      <ReportContent
        result={result}
        showFullReport={showFullReport}
        onShowFullReportChange={() => undefined}
        sharedView={shared ? { persona } : undefined}
      />
    </MemoryRouter>
  )
  const toc = buildReportToc({
    result,
    persona,
    showFullReport,
    activePhase: phase ?? null,
    shared,
    hasOwnInput,
  })
  const listed = new Set(toc.map((t) => t.id))
  for (const id of CANDIDATE_IDS) {
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- anchors are matched by id, as the contents list links them
    const onPage = container.querySelector(`#${id}`) !== null
    expect({ id, listed: listed.has(id) }).toEqual({ id, listed: onPage })
  }
  unmount()
}

describe('contents list follows the page', () => {
  const PERSONAS: (PersonaId | null)[] = [null, 'executive', 'developer', 'researcher', 'grc']

  it.each(PERSONAS)('quick, own report, persona %s', (persona) => {
    usePersonaStore.getState().setPersona(persona)
    check({ result: quick, persona, shared: false, showFullReport: false })
    check({ result: quick, persona, shared: false, showFullReport: true })
  })

  it.each(PERSONAS)('comprehensive, own report, persona %s', (persona) => {
    usePersonaStore.getState().setPersona(persona)
    check({ result: full, persona, shared: false, showFullReport: true })
  })

  it('shared view drops the sections that read the recipient’s own answers', () => {
    check({ result: full, persona: 'executive', shared: true, showFullReport: false })
    const ids = buildReportToc({
      result: full,
      persona: 'executive',
      showFullReport: true,
      activePhase: null,
      shared: true,
      hasOwnInput: false,
    }).map((t) => t.id)
    expect(ids).not.toContain('report-section-qra')
    expect(ids).not.toContain('report-section-niceGap')
  })

  it('drops conditional sections the result has nothing for', () => {
    usePersonaStore.getState().setPersona(null)
    check({ result: sparse, persona: null, shared: false, showFullReport: false })
    const ids = buildReportToc({
      result: sparse,
      persona: null,
      showFullReport: false,
      activePhase: null,
      shared: false,
      hasOwnInput: true,
    }).map((t) => t.id)
    for (const gone of [
      'keyFindings',
      'executiveSummary',
      'hndlHnfl',
      'algorithmMigration',
      'complianceImpact',
    ]) {
      expect(ids).not.toContain(`report-section-${gone}`)
    }
  })

  it.each(PHASE_ORDER)('phase filter %s', (phase) => {
    usePersonaStore.getState().setPersona(null)
    check({ result: full, persona: null, shared: false, showFullReport: false, phase })
  })

  it('the simulation outcomes anchor is the one the contents list links to', () => {
    usePersonaStore.getState().setPersona(null)
    const { container } = render(
      <MemoryRouter>
        <ReportContent result={quick} />
      </MemoryRouter>
    )
    /* eslint-disable testing-library/no-container, testing-library/no-node-access -- anchors are matched by id */
    expect(container.querySelector('#report-section-simulationOutcomes')).not.toBeNull()
    expect(container.querySelector('#report-section-simulation-outcomes')).toBeNull()
    /* eslint-enable testing-library/no-container, testing-library/no-node-access */
  })
})
