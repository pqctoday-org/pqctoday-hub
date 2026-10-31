// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: Scaffold
/**
 * Render parity + scaffold contract (build spec §4) for Common Criteria, EUCC & eIDAS Certification. Four authors fill owner files in parallel;
 * these assertions keep their parts wired to the fixed manifest ids.
 */
import { afterEach, describe, it, expect } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { STEP_EXERCISES } from '@/data/stepExercises'
import { useModuleStore } from '@/store/useModuleStore'
import { CcEuccCertificationModule } from './index'
import { STEP_COMPONENTS } from './workshop/stepRegistry'
import manifest from './manifest'
import { NOT_LAB_REVIEWED } from '@/components/PKILearning/common/moduleReviewStatus'
import { PRACTITIONER_DISCLAIMER } from '@/components/PKILearning/modules/CryptoProductCertification/components/sectionRegistry'
import { SECTION_COMPONENTS } from './components/sectionRegistry'
import { ALL_EXERCISES } from './data/allExercises'
import * as CcEuSections from './components/sections/CcEuSections'
import * as ccEuData from './data/ccEuData'

const pascal = (id: string) =>
  id
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')

const sectionIds = (manifest.learnSections ?? []).map((s) => s.id)
const stepIds = (manifest.workshopSteps ?? []).map((s) => s.id)
const pathIds = (manifest.learnPaths ?? []).map((p) => p.id)

const renderModule = async (search = '') => {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={[`/learn/cc-eucc-certification${search}`]}>
        <CcEuccCertificationModule />
      </MemoryRouter>
    </EmbedProvider>
  )
  await act(async () => {
    await Promise.resolve()
  })
}

describe('CcEuccCertification render parity', () => {
  afterEach(() => {
    act(() => useModuleStore.getState().setActiveLearnPath(manifest.id, ''))
  })

  it('renders the gradient header, the in-page description, and all six tabs', async () => {
    await renderModule()
    expect(
      screen.getByRole('heading', { name: 'Common Criteria, EUCC & eIDAS Certification' })
    ).toBeInTheDocument()
    expect(screen.getByText(/Common Criteria, EUCC and eIDAS in depth/)).toBeInTheDocument()
    for (const name of [
      'Learn',
      'Visual',
      'Workshop',
      'Exercises',
      'References',
      'Tools & Products',
    ]) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })

  it('shows the practitioner-orientation disclaimer exactly once, at the top of the Learn tab', async () => {
    await renderModule()
    const notes = screen.getAllByTestId('cert-practitioner-disclaimer')
    expect(notes).toHaveLength(1)
    expect(notes[0]).toHaveTextContent(PRACTITIONER_DISCLAIMER)
    // The owner's sign-off and the absence of a laboratory or certification-body review are both
    // stated, in the words every certification module uses (common/moduleReviewStatus.ts).
    expect(notes[0]).toHaveTextContent(
      "Corrected since the PQC Today owner's last sign-off; awaiting re-sign-off."
    )
    expect(notes[0]).toHaveTextContent(NOT_LAB_REVIEWED)
  })

  it('keeps the criteria/scheme distinction visible on the EUCC path', async () => {
    await renderModule('?path=eucc')
    expect(
      screen.getByRole('region', { name: 'Separate certification contexts' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Common Criteria — evaluation criteria' })
    ).toHaveAttribute('href', '/learn/cc-eucc-certification?path=cc')
    expect(
      screen.getByText(/EUCC rules are not automatically requirements for every CC evaluation/)
    ).toBeInTheDocument()
  })

  it('ships no draft placeholder — every owner file has real content', async () => {
    await renderModule()
    expect(screen.queryByTestId('draft-pending')).not.toBeInTheDocument()
    expect(screen.queryByText(/content pending/i)).not.toBeInTheDocument()
  })

  it('hides the other path’s sections on a chosen path (offPathSections: hide)', async () => {
    await renderModule('?path=eucc')
    const heading = (name: string) => screen.queryByRole('heading', { level: 2, name })
    expect(heading('EUCC is a scheme, not a PP')).toBeInTheDocument()
    expect(heading('PP case: Security IC Platform')).toBeInTheDocument()
    expect(heading('The Common Criteria model')).not.toBeInTheDocument()
    expect(heading('From eIDAS to a certified device')).not.toBeInTheDocument()
  })

  it('preserves the legacy eIDAS link without including the EUCC-only lessons', async () => {
    await renderModule('?path=eucc-eidas')
    expect(
      screen.getByRole('heading', { level: 2, name: 'From eIDAS to a certified device' })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { level: 2, name: 'EUCC is a scheme, not a PP' })
    ).not.toBeInTheDocument()
  })
})

describe('CcEuccCertification scaffold contract (build spec §4)', () => {
  it('keeps PP history optional and distinguishes it from a PQC product change', () => {
    render(
      <MemoryRouter>
        <CcEuSections.CcContinuity />
      </MemoryRouter>
    )
    const history = screen
      .getByText('Optional history: why EN 419221-5 appears as both v0.15 and v1.0')
      .closest('details')
    expect(history).not.toHaveAttribute('open')
    expect(history).toHaveTextContent('16 December 2016')
    expect(history).toHaveTextContent('18 May 2020')
    expect(history).toHaveTextContent('not a particular HSM product')
    expect(history).toHaveTextContent(
      'does not establish that adding PQC to an HSM is a minor change'
    )
  })
  it('presents ACM alignment as guidance rather than a certification verdict', () => {
    render(
      <MemoryRouter>
        <CcEuSections.EuccPqcToday />
      </MemoryRouter>
    )
    expect(screen.getByText(/they are not certification verdicts/)).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Alignment with cited ACM v2 guidance' })
    ).toBeInTheDocument()
    expect(screen.queryByText('Fits ACM v2?')).not.toBeInTheDocument()
  })
  it('every Learn section id has exactly one owner component, and nothing else does', () => {
    expect([...SECTION_COMPONENTS.keys()].sort()).toEqual([...sectionIds].sort())
  })

  it('section files export one component per section id, named in PascalCase from the id', () => {
    const exported = new Map<string, unknown>([CcEuSections].flatMap((m) => Object.entries(m)))
    for (const id of sectionIds) {
      expect(exported.has(pascal(id)), `${id} → ${pascal(id)}`).toBe(true)
      expect(SECTION_COMPONENTS.get(id)?.Component, id).toBe(exported.get(pascal(id)))
    }
  })

  it('every workshop step id has a component, and nothing else does', () => {
    expect([...STEP_COMPONENTS.keys()].sort()).toEqual([...stepIds].sort())
  })

  it('every learn path lists only real sections, and path-tagged steps name real paths', () => {
    for (const p of manifest.learnPaths ?? []) {
      expect(
        p.sections.filter((s) => !sectionIds.includes(s)),
        p.id
      ).toEqual([])
      expect(sectionIds, p.id).toContain(p.entrySection)
    }
    for (const s of manifest.workshopSteps ?? []) {
      expect(
        (s.paths ?? []).filter((p) => !pathIds.includes(p)),
        s.id
      ).toEqual([])
    }
  })

  it('exercises have unique ids, open a real step, and are tagged only with real paths', () => {
    const ids = ALL_EXERCISES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const e of ALL_EXERCISES) {
      expect(stepIds, e.id).toContain(e.stepId)
      expect(
        (e.paths ?? []).filter((p) => !pathIds.includes(p)),
        e.id
      ).toEqual([])
    }
  })

  it('owner stepExercises are keyed to this module’s steps and match src/data/stepExercises.ts', () => {
    const owned = {
      ...ccEuData.stepExercises,
    }
    const shared = new Map(Object.entries(STEP_EXERCISES))
    for (const [key, exercise] of Object.entries(owned)) {
      const [moduleId, stepId] = key.split('/')
      expect(moduleId, key).toBe(manifest.id)
      expect(stepIds, key).toContain(stepId)
      expect(shared.get(key), `${key} must also be appended to stepExercises.ts`).toEqual(exercise)
    }
  })
})

describe('CcEuccCertification CC/EUCC separation (2026-10-21)', () => {
  const wrapSection = (node: React.ReactNode) =>
    render(
      <EmbedProvider>
        <MemoryRouter>{node}</MemoryRouter>
      </EmbedProvider>
    )

  it('keeps EUCC facts on the CC path as labelled pointers', () => {
    wrapSection(
      <>
        <CcEuSections.CcModel />
        <CcEuSections.CcLifecycle />
      </>
    )
    expect(screen.getAllByText('Under EUCC:').length).toBeGreaterThanOrEqual(4)
    expect(screen.queryByText(/commercial CBs such as TrustCB/)).not.toBeInTheDocument()
    expect(screen.queryByText('The European picture changed in 2025–2026')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Expect the certification body to classify it as major/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/keeps older protection profiles \(CC 3\.1 revisions 1–4\) usable/)
    ).toHaveTextContent('with no end date')
  })

  it('opens the EUCC path with what EUCC takes from Common Criteria and what it adds', () => {
    wrapSection(<CcEuSections.EuccScheme />)
    expect(
      screen.getByRole('heading', {
        name: 'What EUCC takes from Common Criteria, and what it adds',
      })
    ).toBeInTheDocument()
    expect(screen.getByText('What changed in Europe in 2025–2026')).toBeInTheDocument()
    expect(screen.getByText(/SOG-IS, the older European recognition agreement/)).toBeInTheDocument()
  })
})
