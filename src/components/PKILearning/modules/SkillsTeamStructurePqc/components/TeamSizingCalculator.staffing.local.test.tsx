// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { REAL_DOC_GENERATORS } from '@/components/Simulation/autorun/realToolDocs'
import { TeamSizingCalculator } from './TeamSizingCalculator'
import { SkillsTeamPlan } from '@/components/BusinessCenter/tools/SkillsTeamPlan'
import { ROLE_CROSSWALK } from '@/data/roleCrosswalk'
import { ALLOCATION_ROLE_ORDER, seedTeamAllocation } from '@/utils/teamSizingModel'
import type { ExecutiveDocument } from '@/services/storage/types'
const addExecutiveDocument = vi.fn()
let documents: ExecutiveDocument[] = []
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (state: unknown) => unknown) => {
    const state = { addExecutiveDocument, artifacts: { executiveDocuments: documents } }
    return selector ? selector(state) : state
  },
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({ myProducts: [], industry: '' }),
}))

const cases = [
  [600, false, false, '2.2'],
  [600, true, false, '1.6'],
  [2000, false, false, '6.5'],
  [2000, true, false, '4.5'],
  [10500, false, false, '23.5'],
  [10500, true, false, '13'],
  [2000, false, true, '6.5'],
] as const
for (const surface of ['learn', 'business'] as const)
  describe(`${surface} staffing allocation`, () => {
    beforeEach(() => {
      documents = []
      addExecutiveDocument.mockClear()
    })
    const mount = () => render(surface === 'learn' ? <TeamSizingCalculator /> : <SkillsTeamPlan />)
    const estate = () =>
      screen.getByRole('spinbutton', {
        name: surface === 'learn' ? 'Cryptographic instances (CBOM)' : 'Estate-size estimate',
      })
    const row = (id: (typeof ALLOCATION_ROLE_ORDER)[number]) =>
      screen.getByRole('spinbutton', { name: `${ROLE_CROSSWALK[id].label} allocated FTE` })
    const copiedText = () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
      return writeText
    }
    it.each(cases)(
      'reconciles %s / production=%s / OT=%s on screen, export and saved inputs',
      async (n, production, ot, expected) => {
        const writeText = copiedText()
        mount()
        fireEvent.change(estate(), { target: { value: String(n) } })
        if (production) fireEvent.click(screen.getByRole('radio', { name: /Production rollout/ }))
        if (ot) fireEvent.click(screen.getByRole('switch', { name: 'OT in scope' }))
        const allocation = screen.getByRole('region', { name: 'Staffing allocation' })
        expect(within(allocation).getByText('Allocated programme FTE:')).toHaveTextContent(
          `Allocated programme FTE: ${expected}`
        )
        const sum = ALLOCATION_ROLE_ORDER.filter((id) => id !== 'exec-sponsor').reduce(
          (total, id) => total + Math.round(Number((row(id) as HTMLInputElement).value) * 100),
          0
        )
        expect(sum).toBe(Math.round(Number(expected) * 100))
        expect(screen.getByText('Not counted in incremental FTE')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
        await waitFor(() => expect(writeText).toHaveBeenCalled())
        const markdown = writeText.mock.calls[0][0]
        expect(markdown).toContain(`Allocated programme total: ${expected} FTE`)
        for (const id of ALLOCATION_ROLE_ORDER.filter((id) => id !== 'exec-sponsor'))
          expect(markdown).toContain(
            `| ${ROLE_CROSSWALK[id].label} | ${(row(id) as HTMLInputElement).value} |`
          )
        expect(addExecutiveDocument).toHaveBeenCalled()
        const saved = addExecutiveDocument.mock.calls.at(-1)![0]
        expect(saved.data).toContain(`Allocated programme total: ${expected} FTE`)
        expect(saved.inputs.allocationDraft.context).toContain(String(n))
        expect(saved.type).toBe(surface === 'learn' ? 'team-sizing-plan' : 'skills-team-plan')
      }
    )
    it('lets a learner edit fractional work and deliberately choose a ten-FTE large-estate sensitivity', async () => {
      const writeText = copiedText()
      mount()
      fireEvent.change(estate(), { target: { value: '10500' } })
      for (const [id, value] of [
        ['security-eng', '5'],
        ['appsec-lead', '1.67'],
        ['vendor-lead', '0.83'],
      ] as const)
        fireEvent.change(row(id), { target: { value } })
      expect(screen.getByText('Allocated programme FTE:')).toHaveTextContent(
        'Allocated programme FTE: 10'
      )
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
      await waitFor(() => expect(writeText).toHaveBeenCalled())
      expect(writeText.mock.calls[0][0]).toContain(
        'Delivery difference from ratio reference: -13.5 FTE'
      )
      fireEvent.change(estate(), { target: { value: '600' } })
      expect(row('security-eng')).toHaveValue(0.8)
      expect(screen.getByText('Sample allocations reset for changed inputs.')).toBeInTheDocument()
      expect(screen.getByText('Allocated programme FTE:')).toHaveTextContent(
        'Allocated programme FTE: 2.2'
      )
    })
    it('does not export or flush stale valid data after a required allocation becomes empty', async () => {
      copiedText()
      mount()
      fireEvent.change(estate(), { target: { value: '600' } })
      fireEvent.change(row('qrpm'), { target: { value: '0.75' } })
      addExecutiveDocument.mockClear()
      fireEvent.change(row('qrpm'), { target: { value: '' } })
      expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
      await new Promise((resolve) => setTimeout(resolve, 900))
      expect(addExecutiveDocument).not.toHaveBeenCalled()
      fireEvent.change(row('qrpm'), { target: { value: '0' } })
      expect(screen.getByText('Allocated programme FTE:')).toHaveTextContent(
        'Allocated programme FTE: 1.7'
      )
    })
    it('restores an edited saved allocation, and preserves legacy input without allocation rows', () => {
      const context = { estateInstances: '600', sizingPhase: 'early', otInScope: false } as const
      const draft = seedTeamAllocation(context)!
      draft.rows.qrpm = '0.75'
      documents = [
        {
          id: 'saved',
          type: surface === 'learn' ? 'team-sizing-plan' : 'skills-team-plan',
          moduleId: surface === 'learn' ? 'skills-team-structure' : 'pqc-governance',
          title: 'Saved draft',
          data: '',
          createdAt: 1,
          inputs:
            surface === 'learn'
              ? { instances: 600, phase: 'firstTwoYears', otInScope: false, allocationDraft: draft }
              : { estateInstances: '600', sizingPhase: 'early', allocationDraft: draft },
        },
      ]
      const view = mount()
      expect(row('qrpm')).toHaveValue(0.75)
      expect(screen.getByText('Allocated programme FTE:')).toHaveTextContent(
        'Allocated programme FTE: 2.45'
      )
      view.unmount()
      const legacyInputs = { ...(documents[0].inputs as Record<string, unknown>) }
      delete legacyInputs.allocationDraft
      documents[0] = { ...documents[0], inputs: legacyInputs }
      mount()
      expect(row('qrpm')).toHaveValue(0.5)
      expect(screen.getByText('Allocated programme FTE:')).toHaveTextContent(
        'Allocated programme FTE: 2.2'
      )
    })
    it('does not turn a malformed saved allocation into a fabricated zero plan', () => {
      documents = [
        {
          id: 'broken',
          type: surface === 'learn' ? 'team-sizing-plan' : 'skills-team-plan',
          moduleId: surface === 'learn' ? 'skills-team-structure' : 'pqc-governance',
          title: 'Broken draft',
          data: '',
          createdAt: 1,
          inputs:
            surface === 'learn'
              ? { instances: 600, phase: 'firstTwoYears', allocationDraft: null }
              : { estateInstances: '600', sizingPhase: 'early', allocationDraft: null },
        },
      ]
      mount()
      expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Reset sample allocations' }))
      expect(screen.getByText('Allocated programme FTE:')).toHaveTextContent(
        'Allocated programme FTE: 2.2'
      )
    })
  })

it('keeps the existing Simulation sample document consistent with the same model', () => {
  const document = REAL_DOC_GENERATORS['skills-team-plan']?.('financial')
  expect(document?.data).toContain('Allocated delivery: 4.8 FTE')
  expect(document?.data).toContain('Allocated coordination: 2.5 FTE')
  expect(document?.data).toContain('Allocated programme total: 7.3 FTE')
})
