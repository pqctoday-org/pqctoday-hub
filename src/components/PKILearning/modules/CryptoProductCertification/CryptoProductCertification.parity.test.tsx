// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/**
 * Render parity + scaffold contract (build spec §4) for the Cryptographic
 * Product Certification module. Four authors fill owner files in parallel;
 * these assertions keep their parts wired to the fixed manifest ids.
 */
import { afterEach, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { STEP_EXERCISES } from '@/data/stepExercises'
import { useModuleStore } from '@/store/useModuleStore'
import { CryptoProductCertificationModule } from './index'
import { STEP_COMPONENTS } from './workshop/stepRegistry'
import manifest from './manifest'
import { SECTION_COMPONENTS, PRACTITIONER_DISCLAIMER } from './components/sectionRegistry'
import { ALL_EXERCISES } from './data/allExercises'
import * as CoreSections from './components/sections/CoreSections'
import * as FipsSections from './components/sections/FipsSections'
import * as CcEuSections from './components/sections/CcEuSections'
import * as PciSections from './components/sections/PciSections'
import * as SharedSections from './components/sections/SharedSections'
import * as coreData from './data/coreData'
import * as fipsData from './data/fipsData'
import * as ccEuData from './data/ccEuData'
import * as pciData from './data/pciData'
import * as sharedData from './data/sharedData'

const pascal = (id: string) =>
  id
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')

const sectionIds = (manifest.learnSections ?? []).map((s) => s.id)
const stepIds = (manifest.workshopSteps ?? []).map((s) => s.id)
const pathIds = (manifest.learnPaths ?? []).map((p) => p.id)

const renderModule = (search = '') =>
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={[`/learn/crypto-product-certification${search}`]}>
        <CryptoProductCertificationModule />
      </MemoryRouter>
    </EmbedProvider>
  )

describe('CryptoProductCertification render parity', () => {
  afterEach(() => useModuleStore.getState().setActiveLearnPath(manifest.id, ''))

  it('renders the gradient header, the in-page description, and all six tabs', () => {
    renderModule()
    expect(
      screen.getByRole('heading', { name: 'Cryptographic Product Certification' })
    ).toBeInTheDocument()
    expect(screen.getByText(/What a FIPS 140-3, Common Criteria, EUCC or PCI/)).toBeInTheDocument()
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

  it('shows the practitioner-orientation disclaimer exactly once, at the top of the Learn tab', () => {
    renderModule()
    const notes = screen.getAllByTestId('cert-practitioner-disclaimer')
    expect(notes).toHaveLength(1)
    expect(notes[0]).toHaveTextContent(PRACTITIONER_DISCLAIMER)
  })

  it('ships no draft placeholder — every owner file has real content', () => {
    renderModule()
    expect(screen.queryByTestId('draft-pending')).not.toBeInTheDocument()
    expect(screen.queryByText(/content pending/i)).not.toBeInTheDocument()
  })

  it('hides the other paths’ sections on a chosen path (offPathSections: hide)', () => {
    renderModule('?path=pci')
    const heading = (name: string) => screen.queryByRole('heading', { level: 2, name })
    expect(heading('Four schemes, four questions')).toBeInTheDocument()
    expect(heading('PTS HSM device approval')).toBeInTheDocument()
    expect(heading('PCI KMO v1.0')).toBeInTheDocument()
    expect(heading('What PQC changes in certification')).toBeInTheDocument()
    expect(heading('FIPS 140-3 and the CMVP')).not.toBeInTheDocument()
    expect(heading('The Common Criteria model')).not.toBeInTheDocument()
    expect(heading('EUCC is a scheme, not a PP')).not.toBeInTheDocument()
  })
})

describe('CryptoProductCertification scaffold contract (build spec §4)', () => {
  it('every Learn section id has exactly one owner component, and nothing else does', () => {
    expect([...SECTION_COMPONENTS.keys()].sort()).toEqual([...sectionIds].sort())
  })

  it('section files export one component per section id, named in PascalCase from the id', () => {
    const exported = new Map<string, unknown>(
      [CoreSections, FipsSections, CcEuSections, PciSections, SharedSections].flatMap((m) =>
        Object.entries(m)
      )
    )
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
      ...coreData.stepExercises,
      ...fipsData.stepExercises,
      ...ccEuData.stepExercises,
      ...pciData.stepExercises,
      ...sharedData.stepExercises,
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
