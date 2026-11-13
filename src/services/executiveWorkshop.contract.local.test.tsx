// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable testing-library/no-node-access -- Replay the published CSS-selector contract against real components. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router'
import flowJson from '../../public/workshop/executive-basics-finance-and-banking-amer-apac_05022026.json'
import manifest from '../../public/workshop/index.json'
import packageMeta from '../../package.json'
import { Button } from '@/components/ui/button'
import { buildStepUrl } from '@/utils/workshopDeepLink'
import { flattenFlow } from '@/data/workshopRegistry'
import { resolveFromManifest, type WorkshopFlowManifest } from './workshopFlowLoader'
import type { WorkshopFlow } from '@/types/Workshop'
import { AssessViewRedesign } from '@/components/Assess/redesign/AssessViewRedesign'
import { BusinessCenterView } from '@/components/BusinessCenter/BusinessCenterView'
import { useModuleStore } from '@/store/useModuleStore'
import { ReportView } from '@/components/Report/ReportView'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { RENDER_ORDER_QUICK } from '@/components/Assess/redesign/assessFlowModel'
import { MobileAssessView } from '@/components/Mobile/screens/MobileAssessView'
import { MobileWorkshopDock } from '@/components/Mobile/shell/MobileWorkshopDock'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { _resetCachesForTest } from './workshopFlowLoader'
import { ANALYTICS_DISCLOSURE } from '@/components/About/analyticsStatement'

const flow = flowJson as unknown as WorkshopFlow
const steps = flattenFlow(flow, 'US', 'Finance & Banking', 'executive', 'basics')
const assessment = steps.find((step) => step.id === 'p-assess')!

beforeEach(() => {
  // jsdom has no layout scrolling; retain every real state/model/component path.
  HTMLElement.prototype.scrollIntoView = vi.fn()
  localStorage.clear()
  usePersonaStore.getState().setPersona('executive')
  usePersonaStore.getState().setIndustry('Finance & Banking')
  usePersonaStore.getState().setRegion('americas')
  useAssessmentStore.getState().reset()
  useAssessmentStore.getState().setIndustry('Finance & Banking')
  useAssessmentStore.getState().setCountry('United States')
  useAssessmentStore.setState({ lastWizardUpdate: null })
})

it('the actual manifest selects this corrected source for all three declared regional contexts', () => {
  for (const region of ['US', 'CA', 'AU'] as const) {
    const picked = resolveFromManifest(manifest as WorkshopFlowManifest, {
      role: 'executive',
      proficiency: 'basics',
      industry: 'Finance & Banking',
      region,
    })
    expect(picked?.file).toBe('executive-basics-finance-and-banking-amer-apac_05022026.json')
    const current = flattenFlow(flow, region, 'Finance & Banking', 'executive', 'basics')
    expect(current.some((step) => step.id === 'p-report')).toBe(true)
    const about = current.find((step) => step.id === 'close-01-about')!
    expect(
      about.cues?.find((cue) => cue.kind === 'caption' && cue.text.includes('Open Source'))
    ).toMatchObject({ text: expect.stringContaining('AGPL-3.0-only') })
    expect(JSON.stringify(about)).not.toMatch(/Apache 2\.0|no tracking/)
    expect(JSON.stringify(about)).toContain('Google Analytics 4 runs on every visit')
  }
  expect(ANALYTICS_DISCLOSURE).toContain('It starts when a page loads')
  expect(packageMeta.license).toBe('AGPL-3.0-only')
})

it('uses the actual quick questions and keeps unknown inputs distinct from observed exposure', () => {
  expect(RENDER_ORDER_QUICK).toEqual([
    'industry',
    'country',
    'crypto',
    'sensitivity',
    'compliance',
    'migration',
  ])
  const unknowns = assessment.cues?.filter(
    (cue) => cue.kind === 'click' && cue.selector === '[data-workshop-target="assess-not-sure"]'
  )
  expect(unknowns).toHaveLength(3)
  expect(assessment.narration).toContain('it has not observed an estate')
  expect(steps.find((step) => step.id === 'p-report')?.narration).toContain(
    'name the missing inventory fact'
  )
  expect(
    steps.find((step) => step.id === 'a1b-gov-standards-and-regulations')?.narration
  ).toContain('A completed template is planning work, not an audit conclusion')
})

it('executes the published reset URL from previous answers through the real report and fifteen saved drafts', async () => {
  useAssessmentStore.setState({
    assessmentMode: 'comprehensive',
    assessmentStatus: 'in-progress',
    currentStep: 5,
    currentCrypto: ['RSA-2048'],
    cryptoUnknown: false,
    dataSensitivity: ['critical'],
    sensitivityUnknown: false,
    complianceRequirements: ['PCI DSS'],
    complianceUnknown: false,
    migrationStatus: 'started',
    migrationUnknown: false,
    infrastructure: ['HSM / Hardware security modules'],
    timelinePressure: 'within-1y',
    dataRetention: ['25-plus'],
  })
  render(
    <MemoryRouter initialEntries={[buildStepUrl(assessment)]}>
      <Routes>
        <Route path="/assess" element={<AssessViewRedesign />} />
        <Route path="/report" element={<ReportView />} />
        <Route path="/business" element={<BusinessCenterView />} />
      </Routes>
    </MemoryRouter>
  )
  await waitFor(() => expect(useAssessmentStore.getState().currentStep).toBe(0))
  expect(useAssessmentStore.getState().industry).toBe('Finance & Banking')
  expect(useAssessmentStore.getState().country).toBe('United States')
  expect(useAssessmentStore.getState().infrastructure).toEqual([])
  expect(useAssessmentStore.getState().timelinePressure).toBe('')
  expect(useAssessmentStore.getState().dataRetention).toEqual([])
  expect(screen.queryByText('Resume saved assessment?')).not.toBeInTheDocument()
  for (const cue of assessment.cues ?? []) {
    if (cue.kind !== 'click') continue
    // The same selectors the shipped cue applier uses; no assessment hook mocks.
    const selector = cue.selector
    await waitFor(() => expect(document.querySelector(selector), selector).not.toBeNull())
    fireEvent.click(document.querySelector(selector) as HTMLElement)
    expect(useAssessmentStore.getState().country).toBe('United States')
    expect(useAssessmentStore.getState().industry).toBe('Finance & Banking')
  }
  await waitFor(() => expect(useAssessmentStore.getState().assessmentStatus).toBe('complete'))
  const state = useAssessmentStore.getState()
  expect([
    state.cryptoUnknown,
    state.sensitivityUnknown,
    state.complianceUnknown,
    state.migrationUnknown,
  ]).toEqual([true, true, true, true])
  expect(state.infrastructureUnknown).toBe(false)
  expect(state.timelineUnknown).toBe(false)
  expect(state.assessmentMode).toBe('quick')
  fireEvent.click(await screen.findByRole('button', { name: 'View my risk report' }))
  await waitFor(() =>
    expect(screen.getByRole('heading', { name: 'PQC Assessment Report' })).toBeVisible()
  )
  // Report computation renders before its persistence effect; require the real
  // stored result and its input binding rather than treating the heading as completion.
  await waitFor(() => {
    expect(Number.isFinite(useAssessmentStore.getState().lastResult?.riskScore)).toBe(true)
    expect(useAssessmentResultStore.getState().sourceInputKey).toBe(
      JSON.stringify(useAssessmentStore.getState().getInput())
    )
  })
  const result = useAssessmentStore.getState().lastResult
  expect(Number.isFinite(result?.riskScore)).toBe(true)
  expect(
    screen.getByRole('img', { name: new RegExp(`^Risk score: ${result?.riskScore} out of 100,`) })
  ).toBeVisible()
  expect(result?.assessmentProfile?.mode).toBe('quick')
  expect(screen.getByText('HNDL Window Not Modelled')).toBeVisible()
  expect(screen.getByText('Signature Window Not Modelled')).toBeVisible()
  fireEvent.click(screen.getByRole('link', { name: /Open the executive tools/ }))
  const before = useModuleStore.getState().artifacts.executiveDocuments?.length ?? 0
  const governanceSteps = steps.filter((step) => step.id.startsWith('a1'))
  for (const cue of governanceSteps.flatMap((step) => step.cues ?? [])) {
    if (cue.kind !== 'click') continue
    const selector = cue.selector
    await waitFor(() => expect(document.querySelector(selector), selector).not.toBeNull(), {
      timeout: 10000,
    })
    const control = document.querySelector(selector) as HTMLElement
    expect(control).toBeVisible()
    fireEvent.click(control)
  }
  await waitFor(() =>
    expect(useModuleStore.getState().artifacts.executiveDocuments?.length).toBe(before + 15)
  )
  expect(
    useModuleStore
      .getState()
      .artifacts.executiveDocuments?.slice(-15)
      .map((doc) => doc.type)
  ).toEqual([
    'roi-model',
    'board-deck',
    'crqc-scenario',
    'audit-checklist',
    'compliance-timeline',
    'compliance-checklist',
    'policy-draft',
    'raci-matrix',
    'stakeholder-comms',
    'vendor-scorecard',
    'contract-clause',
    'supply-chain-matrix',
    'crypto-architecture',
    'kpi-dashboard',
    'management-tools-audit',
  ])
})

afterEach(() => {
  vi.unstubAllGlobals()
  _resetCachesForTest()
  useWorkshopStore.getState().exit()
})

it('preserves the native manual assessment and corrected dock without inventing automated phone cue parity', async () => {
  _resetCachesForTest()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === '/workshop/index.json') return { ok: true, json: async () => manifest }
      if (url === '/workshop/executive-basics-finance-and-banking-amer-apac_05022026.json')
        return { ok: true, json: async () => flowJson }
      throw new Error(`Unexpected request in manual workshop test: ${url}`)
    })
  )
  useAssessmentStore.getState().setAssessmentMode('quick')
  useWorkshopStore.getState().start(flow.id, 'close-01-about', 'US')
  render(
    <MemoryRouter initialEntries={['/assess']}>
      <Routes>
        <Route
          path="/assess"
          element={
            <>
              <section aria-label="Native assessment test host">
                <MobileAssessView />
              </section>
              <MobileWorkshopDock />
            </>
          }
        />
        <Route path="/report" element={<p>Native report destination</p>} />
      </Routes>
    </MemoryRouter>
  )
  fireEvent.click(await screen.findByRole('button', { name: /Workshop.*Trust and transparency/ }))
  expect(
    screen.getByText('Inspect the AGPL-3.0-only licence and third-party notices before reuse')
  ).toBeVisible()
  expect(
    screen.getByText(
      'Read About → Data Privacy: analytics, cookies and what can leave your browser'
    )
  ).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: /close/i }))
  act(() => useWorkshopStore.getState().setStep('p-assess'))
  fireEvent.click(
    await screen.findByRole('button', { name: /Workshop.*Run the executive risk assessment/ })
  )
  expect(screen.getByText(/In this fictional example four answers remain unknown/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: /close/i }))
  for (let index = 0; index < 6; index++) {
    if (index === 2)
      await waitFor(() => expect(useAssessmentStore.getState().cryptoUnknown).toBe(true))
    if (index >= 3) fireEvent.click(screen.getByRole('button', { name: /not sure/i }))
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Native assessment test host' })).getByRole(
        'button',
        { name: index === 5 ? 'Finish' : 'Next' }
      )
    )
  }
  expect(screen.getByRole('heading', { name: 'Review your answers' })).toBeVisible()
  expect(useAssessmentStore.getState().assessmentStatus).not.toBe('complete')
  fireEvent.click(screen.getByRole('button', { name: /Generate my report/ }))
  expect(useAssessmentStore.getState().assessmentStatus).toBe('complete')
  const current = useAssessmentStore.getState()
  expect([
    current.cryptoUnknown,
    current.sensitivityUnknown,
    current.complianceUnknown,
    current.migrationUnknown,
  ]).toEqual([true, true, true, true])
  fireEvent.click(screen.getByRole('link', { name: 'View report' }))
  expect(screen.getByText('Native report destination')).toBeVisible()
})

function ResetQueryProbe({ revision }: { revision: number }) {
  const [params, setParams] = useSearchParams()
  return (
    <>
      <output data-testid="reset-query">
        {params.toString()} · {revision}
      </output>
      <Button
        onClick={() =>
          setParams((previous) => {
            const next = new URLSearchParams(previous)
            next.set('context', 'sample')
            return next
          })
        }
      >
        Change unrelated query
      </Button>
      <Button
        onClick={() =>
          setParams((previous) => {
            const next = new URLSearchParams(previous)
            next.set('reset', '1')
            return next
          })
        }
      >
        Request another reset
      </Button>
    </>
  )
}

it('consumes each explicit reset once and keeps later query changes and rerenders from clearing answers', async () => {
  useAssessmentStore.setState({
    currentCrypto: ['RSA-2048'],
    infrastructure: ['HSM / Hardware security modules'],
    timelinePressure: 'within-1y',
  })
  const tree = (revision: number) => (
    <MemoryRouter initialEntries={[buildStepUrl(assessment)]}>
      <ResetQueryProbe revision={revision} />
      <AssessViewRedesign />
    </MemoryRouter>
  )
  const view = render(tree(0))
  await waitFor(() => expect(screen.getByTestId('reset-query')).not.toHaveTextContent('reset=1'))
  expect(useAssessmentStore.getState().currentCrypto).toEqual([])
  expect(useAssessmentStore.getState().infrastructure).toEqual([])
  expect(useAssessmentStore.getState().country).toBe('United States')
  fireEvent.click(document.querySelector('[data-workshop-target="assess-next"]') as HTMLElement)
  fireEvent.click(document.querySelector('[data-workshop-target="assess-next"]') as HTMLElement)
  await waitFor(() => expect(useAssessmentStore.getState().cryptoUnknown).toBe(true))
  expect(useAssessmentStore.getState().currentStep).toBe(2)
  fireEvent.click(screen.getByRole('button', { name: 'Change unrelated query' }))
  view.rerender(tree(1))
  expect(useAssessmentStore.getState().currentStep).toBe(2)
  expect(useAssessmentStore.getState().cryptoUnknown).toBe(true)
  expect(useAssessmentStore.getState().country).toBe('United States')
  fireEvent.click(screen.getByRole('button', { name: 'Request another reset' }))
  await waitFor(() => expect(useAssessmentStore.getState().currentStep).toBe(0))
  expect(useAssessmentStore.getState().cryptoUnknown).toBe(false)
  expect(useAssessmentStore.getState().industry).toBe('Finance & Banking')
  expect(useAssessmentStore.getState().country).toBe('United States')
  expect(screen.getByTestId('reset-query')).not.toHaveTextContent('reset=1')
})
