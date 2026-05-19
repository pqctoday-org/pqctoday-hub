// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PQCCandidatesModule } from './index'
import { CANDIDATES, getCandidate } from './data/candidates'
import { FAMILIES, FAMILY_LIST } from './data/families'

vi.mock('../../../../store/useModuleStore', () => ({
  useModuleStore: Object.assign(
    () => ({
      updateModuleProgress: vi.fn(),
      markStepComplete: vi.fn(),
      modules: {},
    }),
    {
      getState: () => ({ modules: {} }),
    }
  ),
}))

const renderModule = () =>
  render(
    <MemoryRouter>
      <PQCCandidatesModule />
    </MemoryRouter>
  )

describe('PQCCandidatesModule', () => {
  it('renders the module title', () => {
    renderModule()
    expect(
      screen.getByRole('heading', { name: /PQC Candidates & Standardisation Lifecycle/i })
    ).toBeInTheDocument()
  })

  it('renders all five tab triggers', () => {
    renderModule()
    expect(screen.getByRole('button', { name: 'Learn' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Visual' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Workshop' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exercises' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'References' })).toBeInTheDocument()
  })

  it('renders Learn-tab section headings', () => {
    renderModule()
    expect(
      screen.getByRole('heading', { name: /Standardisation is a rolling process/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /How candidates are validated/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Four math families on the table/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Worldwide parallel processes/i })
    ).toBeInTheDocument()
  })
})

describe('candidates.ts data integrity', () => {
  it('contains exactly nine candidates', () => {
    expect(CANDIDATES).toHaveLength(9)
  })

  it('every candidate has positive sizes and a known family', () => {
    for (const c of CANDIDATES) {
      expect(c.publicKeyBytes).toBeGreaterThan(0)
      expect(c.privateKeyBytes).toBeGreaterThan(0)
      expect(c.signatureBytes).toBeGreaterThan(0)
      expect(FAMILIES[c.family]).toBeDefined()
    }
  })

  it('getCandidate resolves every known id', () => {
    for (const c of CANDIDATES) {
      expect(getCandidate(c.id)?.name).toBe(c.name)
    }
    expect(getCandidate('not-a-candidate')).toBeUndefined()
  })

  it('SQIsign sizes match Round-2 v2.0 spec Table 1 (NIST-I)', () => {
    const sqi = getCandidate('sqisign')
    expect(sqi).toBeDefined()
    expect(sqi!.publicKeyBytes).toBe(65)
    expect(sqi!.privateKeyBytes).toBe(353)
    expect(sqi!.signatureBytes).toBe(148)
  })

  it('UOV uses NIST-Ip sizes (raw pk ~66KB, sk ~237KB, sig 96B)', () => {
    const uov = getCandidate('uov')
    expect(uov!.publicKeyBytes).toBe(66000)
    expect(uov!.privateKeyBytes).toBe(237000)
    expect(uov!.signatureBytes).toBe(96)
  })
})

describe('families.ts data integrity', () => {
  it('contains exactly four families', () => {
    expect(FAMILY_LIST).toHaveLength(4)
  })

  it('every family has a non-empty layman explainer', () => {
    for (const fam of FAMILY_LIST) {
      expect(fam.layman.analogy.length).toBeGreaterThan(50)
      expect(fam.layman.whatsDifferent.length).toBeGreaterThan(50)
      expect(fam.layman.catch.length).toBeGreaterThan(50)
    }
  })

  it('every family references at least one candidate that exists', () => {
    for (const fam of FAMILY_LIST) {
      expect(fam.candidateIds.length).toBeGreaterThan(0)
      for (const candId of fam.candidateIds) {
        expect(getCandidate(candId)).toBeDefined()
      }
    }
  })
})
