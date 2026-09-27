// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS-0 (2026-09-24) — the in-module learn-path picker, path-scoped workshop
 * stepper, and LearnSection's optional/off-path rendering, through the real
 * ModuleShell. EMV cases prove the only shipped multi-path module keeps its
 * sections and steps; the fixture exercises tagging, optional references and
 * `offPathSections: 'hide'`.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { FlaskConical } from 'lucide-react'
import { EmbedProvider } from '@/embed/EmbedProvider'
import { useModuleStore } from '@/store/useModuleStore'
import { ModuleShell, type WorkshopPart } from './ModuleShell'
import { LearnSection } from './LearnSection'
import { PathScopedContent } from './LearnPathPicker'
import { useLearnPathFilter } from './useLearnPath'
import { PATH_FIXTURE } from '../manifest/__fixtures__/learnPathFixture'
import emv from '../modules/EMVPaymentPQC/manifest'
import hsm from '../modules/HsmPqc/manifest'

// LearnSection and the store resolve manifests by id; register the fixture
// (by id only — MANIFESTS and the derived legacy maps are untouched).
vi.mock('../manifest/registry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../manifest/registry')>()
  const { PATH_FIXTURE: fixture } = await import('../manifest/__fixtures__/learnPathFixture')
  return { ...actual, MANIFEST_BY_ID: { ...actual.MANIFEST_BY_ID, [fixture.id]: fixture } }
})

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: mockUseIsMobileShell }))

const Probe = () => <div data-testid="search">{useLocation().search}</div>

const renderAt = (url: string, ui: React.ReactNode) =>
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={[url]}>
        {ui}
        <Probe />
      </MemoryRouter>
    </EmbedProvider>
  )

const search = () => screen.getByTestId('search').textContent ?? ''
const picker = () => within(screen.getByTestId('learn-path-picker'))

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  useModuleStore.getState().resetProgress()
  mockUseIsMobileShell.mockReturnValue(false)
})

describe('LearnPathPicker', () => {
  it('is not rendered for a module without learnPaths', () => {
    renderAt('/learn/hsm-pqc', <ModuleShell manifest={hsm} learn={<div>L</div>} />)
    expect(screen.queryByTestId('learn-path-picker')).not.toBeInTheDocument()
  })

  it("lists EMV's three paths with their durations, plus All sections (pressed by default)", () => {
    renderAt('/learn/emv-payment-pqc', <ModuleShell manifest={emv} learn={<div>L</div>} />)
    const group = picker().getByRole('group', { name: 'Choose your learning path' })
    const buttons = within(group).getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual([
      'Cards & Acceptance· 55 min',
      'Banking & Settlement· 55 min',
      'Retail & E-Commerce· 25 min',
      'All sections',
    ])
    expect(picker().getByRole('button', { name: 'All sections' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('picking a path stores it, presses it, and writes ?path=; All sections clears both', () => {
    renderAt('/learn/emv-payment-pqc', <ModuleShell manifest={emv} learn={<div>L</div>} />)
    fireEvent.click(picker().getByRole('button', { name: /Banking & Settlement/ }))
    expect(useModuleStore.getState().modules[emv.id]?.activeLearnPath).toBe('banking')
    expect(picker().getByRole('button', { name: /Banking & Settlement/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(search()).toContain('path=banking')
    expect(picker().getByText(/Banks, central banks/)).toBeInTheDocument()

    fireEvent.click(picker().getByRole('button', { name: 'All sections' }))
    expect(useModuleStore.getState().modules[emv.id]?.activeLearnPath).toBe('')
    expect(search()).not.toContain('path=')
  })

  it('a valid ?path= deep link selects the path on arrival (Industry Landscape links)', () => {
    renderAt(
      '/learn/emv-payment-pqc?path=cards&section=emv-ecosystem',
      <ModuleShell manifest={emv} learn={<div>L</div>} />
    )
    expect(useModuleStore.getState().modules[emv.id]?.activeLearnPath).toBe('cards')
    expect(picker().getByRole('button', { name: /Cards & Acceptance/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('an unknown ?path= is ignored', () => {
    renderAt(
      '/learn/emv-payment-pqc?path=nope',
      <ModuleShell manifest={emv} learn={<div>L</div>} />
    )
    expect(useModuleStore.getState().modules[emv.id]?.activeLearnPath).toBeUndefined()
    expect(picker().getByRole('button', { name: 'All sections' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })
})

const emvParts: WorkshopPart[] = emv.workshopSteps!.map((s) => ({
  id: s.id,
  title: s.label,
  description: s.label,
  icon: FlaskConical,
}))
const fixtureParts: WorkshopPart[] = PATH_FIXTURE.workshopSteps!.map((s) => ({
  id: s.id,
  title: s.label,
  description: `about ${s.label}`,
  icon: FlaskConical,
}))
const body = (i: number) => <div>BODY-{i}</div>
const stepChips = () =>
  within(screen.getByRole('navigation', { name: 'Workshop steps' })).getAllByRole('button')

describe('path-scoped workshop stepper', () => {
  it('EMV: every one of the 8 steps stays on the banking path', () => {
    useModuleStore.getState().setActiveLearnPath(emv.id, 'banking')
    renderAt(
      '/learn/emv-payment-pqc',
      <ModuleShell manifest={emv} workshopParts={emvParts} renderWorkshopStep={body} />
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Workshop' }))
    expect(stepChips()).toHaveLength(8)
    expect(screen.getByText('BODY-0')).toBeInTheDocument()
  })

  it('fixture path A: shows shared + A + optional steps, skips B, and labels the reference step', () => {
    useModuleStore.getState().setActiveLearnPath(PATH_FIXTURE.id, 'a')
    renderAt(
      '/learn/ws0-path-fixture',
      <ModuleShell manifest={PATH_FIXTURE} workshopParts={fixtureParts} renderWorkshopStep={body} />
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Workshop' }))
    expect(stepChips().map((b) => b.getAttribute('aria-label'))).toEqual([
      'Core step (current)',
      'A step',
      'Reference step (optional reference)',
    ])
    fireEvent.click(screen.getByRole('button', { name: /Next Step/ }))
    expect(screen.getByText('BODY-1')).toBeInTheDocument() // w-a
    fireEvent.click(screen.getByRole('button', { name: /Next Step/ }))
    expect(screen.getByText('BODY-3')).toBeInTheDocument() // w-ref — w-b skipped
    expect(screen.getByText('Optional reference')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Complete Module' })).toBeInTheDocument()
    // Leaving steps marked them complete; the path's required steps are done.
    expect(useModuleStore.getState().modules[PATH_FIXTURE.id]?.status).toBe('completed')
  })

  it('switching to path B in the picker swaps the tagged step', () => {
    renderAt(
      '/learn/ws0-path-fixture',
      <ModuleShell manifest={PATH_FIXTURE} workshopParts={fixtureParts} renderWorkshopStep={body} />
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Workshop' }))
    expect(stepChips()).toHaveLength(4) // no path: everything
    fireEvent.click(picker().getByRole('button', { name: /Path B/ }))
    expect(stepChips().map((b) => b.getAttribute('aria-label'))).toEqual([
      'Core step (current)',
      'B step',
      'Reference step (optional reference)',
    ])
  })

  it('a ?step= deep link to a step off the active path lands on the next visible step', () => {
    useModuleStore.getState().setActiveLearnPath(PATH_FIXTURE.id, 'a')
    window.history.replaceState(null, '', '/learn/ws0-path-fixture?tab=workshop&step=2')
    renderAt(
      '/learn/ws0-path-fixture?tab=workshop&step=2',
      <ModuleShell manifest={PATH_FIXTURE} workshopParts={fixtureParts} renderWorkshopStep={body} />
    )
    expect(screen.getByText('BODY-3')).toBeInTheDocument()
    expect(screen.queryByText('BODY-2')).not.toBeInTheDocument()
  })
})

const fixtureLearn = (
  <>
    {PATH_FIXTURE.learnSections!.map((s) => (
      <LearnSection key={s.id} sectionId={s.id} title={s.label} icon={null}>
        <p>{s.id} body</p>
      </LearnSection>
    ))}
  </>
)

describe('LearnSection under a learn path', () => {
  it("EMV ('mark' mode): off-path sections still render, labelled; on-path ones are not", () => {
    useModuleStore.getState().setActiveLearnPath(emv.id, 'banking')
    renderAt(
      '/learn/emv-payment-pqc',
      <>
        <LearnSection sectionId="card-auth" title="Card Auth" icon={null}>
          <p>card body</p>
        </LearnSection>
        <LearnSection sectionId="interbank-rails" title="Interbank Rails" icon={null}>
          <p>rails body</p>
        </LearnSection>
      </>
    )
    const cardAuth = document.querySelector('[data-section-id="card-auth"]') as HTMLElement
    const rails = document.querySelector('[data-section-id="interbank-rails"]') as HTMLElement
    expect(within(cardAuth).getByText('Outside the Banking & Settlement path')).toBeInTheDocument()
    expect(within(rails).queryByText(/Outside the/)).not.toBeInTheDocument()
  })

  it("fixture ('hide' mode) on path A: hides B's lesson, shows both references labelled", () => {
    useModuleStore.getState().setActiveLearnPath(PATH_FIXTURE.id, 'a')
    renderAt('/learn/ws0-path-fixture', fixtureLearn)
    const ids = [...document.querySelectorAll('[data-section-id]')].map((e) =>
      e.getAttribute('data-section-id')
    )
    expect(ids).toEqual(['core-1', 'core-2', 'a-1', 'a-ref', 'shared-ref'])
    const aRef = document.querySelector('[data-section-id="a-ref"]') as HTMLElement
    expect(within(aRef).getByText('Optional reference')).toBeInTheDocument()
  })

  it("fixture ('hide' mode): a deep link to an off-path section still renders it", () => {
    useModuleStore.getState().setActiveLearnPath(PATH_FIXTURE.id, 'a')
    renderAt('/learn/ws0-path-fixture?section=b-1', fixtureLearn)
    expect(screen.getByText('b-1 body')).toBeInTheDocument()
  })

  it('re-renders when the path changes (no stale hidden set)', () => {
    useModuleStore.getState().setActiveLearnPath(PATH_FIXTURE.id, 'a')
    renderAt('/learn/ws0-path-fixture', fixtureLearn)
    expect(document.querySelector('[data-section-id="b-1"]')).toBeNull()
    act(() => useModuleStore.getState().setActiveLearnPath(PATH_FIXTURE.id, 'b'))
    expect(document.querySelector('[data-section-id="b-1"]')).not.toBeNull()
    expect(document.querySelector('[data-section-id="a-1"]')).toBeNull()
  })
})

const EXERCISES = [
  { id: 'shared-ex', title: 'Shared exercise' },
  { id: 'a-ex', title: 'A exercise', paths: ['a'] },
  { id: 'b-ex', title: 'B exercise', paths: ['b'] },
]
const ExerciseList = () => (
  <ul>
    {useLearnPathFilter(EXERCISES).map((e) => (
      <li key={e.id}>{e.title}</li>
    ))}
  </ul>
)

describe('exercise / content scoping inside ModuleShell', () => {
  it('useLearnPathFilter and PathScopedContent follow the picker', () => {
    renderAt(
      '/learn/ws0-path-fixture',
      <ModuleShell
        manifest={PATH_FIXTURE}
        learn={
          <PathScopedContent paths={['b']}>
            <p>B-only aside</p>
          </PathScopedContent>
        }
        exercises={<ExerciseList />}
      />
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Exercises' }))
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Shared exercise',
      'A exercise',
      'B exercise',
    ])
    fireEvent.click(picker().getByRole('button', { name: /Path A/ }))
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Shared exercise',
      'A exercise',
    ])
    fireEvent.click(screen.getByRole('tab', { name: 'Learn' }))
    expect(screen.queryByText('B-only aside')).not.toBeInTheDocument()
    fireEvent.click(picker().getByRole('button', { name: /Path B/ }))
    expect(screen.getByText('B-only aside')).toBeInTheDocument()
  })
})

describe('phone shell', () => {
  it('renders the picker and scopes the section checklist to the active path', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderAt('/learn/emv-payment-pqc', <ModuleShell manifest={emv} learn={<div>L</div>} />)
    expect(screen.getByText('0/12 sections read')).toBeInTheDocument()
    fireEvent.click(picker().getByRole('button', { name: /Retail & E-Commerce/ }))
    expect(screen.getByText('0/4 sections read')).toBeInTheDocument()
  })
})
