// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom/vitest'
import { Capstone } from './Capstone'
import {
  CAPSTONE_BOUNDARY_DECISIONS,
  CAPSTONE_REFERENCE,
  CAPSTONE_WORKED_FIELDS,
  capstoneWorkedFields,
  capstoneWorkedState,
} from '../data/capstoneWorkedReference'
import { capstoneJson, capstoneMarkdown, checkCapstone, type CertPathId } from '../data/sharedData'
import { evaluateBoundary } from '../data/coreData'
import { useModuleStore } from '@/store/useModuleStore'

const paths: CertPathId[] = ['fips', 'cc', 'eucc-eidas', 'pci']

function readCell(state: unknown, path: string): unknown {
  return path.split('.').reduce((value, key) => (value as Record<string, unknown>)[key], state)
}

describe('complete fictional capstone references', () => {
  it.each(paths)(
    'supplies inspectable answers and reasoning for every required %s field',
    (path) => {
      const state = capstoneWorkedState(path)
      const fields = capstoneWorkedFields(path)
      expect(fields.filter((field) => field.required)).toHaveLength(
        CAPSTONE_REFERENCE.selectedPathRequiredCounts[path]
      )
      for (const field of fields) {
        expect(field.answer).toEqual(readCell(state, field.cell))
        expect(field.why.length).toBeGreaterThan(30)
        expect(field.sourceSymbols.length).toBeGreaterThan(0)
      }
      expect(fields.filter((field) => field.cell.startsWith('matrix.'))).toHaveLength(16)
      expect(state.extended).toEqual({})
      expect(
        checkCapstone(state).filter((check) => check.status === 'fail' || check.status === 'todo')
      ).toEqual([])
    }
  )

  it('keeps all 43 required fields, 7 context fields and 18 scoped boundary decisions', () => {
    expect(CAPSTONE_WORKED_FIELDS.filter((field) => field.required)).toHaveLength(43)
    expect(CAPSTONE_WORKED_FIELDS.filter((field) => !field.required)).toHaveLength(7)
    expect(new Set(CAPSTONE_WORKED_FIELDS.map((field) => field.cell)).size).toBe(50)
    expect(CAPSTONE_BOUNDARY_DECISIONS).toHaveLength(18)
    const state = capstoneWorkedState('fips')
    for (const decision of CAPSTONE_BOUNDARY_DECISIONS) {
      expect(state.boundaries[decision.lens].includes(decision.component)).toBe(decision.selected)
      expect(decision.why.length).toBeGreaterThan(30)
      expect(decision.contrary.length).toBeGreaterThan(60)
    }
    expect(capstoneWorkedState('pci').pci.scope).toMatch(/EX-A.*declared worked-example assumption/)
    expect(CAPSTONE_REFERENCE.assumptions.join(' ')).toMatch(
      /5.0.0 is planned and not yet submitted/
    )
    expect(capstoneWorkedState('cc').cc.notes).toMatch(/no issuing national scheme is specified/)
  })

  it('explains the actual consequence of extending a hardware module into the service fleet', () => {
    const state = capstoneWorkedState('fips')
    expect(
      evaluateBoundary('fips', 'cloud', new Set(state.boundaries.fips)).filter(
        (finding) => finding.severity === 'error'
      )
    ).toEqual([])
    state.boundaries.fips.push('network-service')
    expect(
      evaluateBoundary('fips', 'cloud', new Set(state.boundaries.fips)).some(
        (finding) => finding.severity === 'error'
      )
    ).toBe(true)
    expect(
      CAPSTONE_BOUNDARY_DECISIONS.find(
        (decision) => decision.cell === 'boundaries.fips[network-service]'
      )?.contrary
    ).toMatch(/front-end\/service fleet/)
    state.boundaries.fips = state.boundaries.fips.filter(
      (component) => component !== 'appliance-hardware'
    )
    expect(
      CAPSTONE_BOUNDARY_DECISIONS.find(
        (decision) => decision.cell === 'boundaries.fips[appliance-hardware]'
      )?.contrary
    ).toMatch(/physical protection boundary/)
    expect(checkCapstone(state).find((check) => check.id === 'a1-boundaries')?.status).toBe('fail')
  })

  it('retains genuine failure cases without grading arbitrary prose as justified or safe', () => {
    const state = capstoneWorkedState('fips')
    state.claims = 'Repeated arbitrary text. Repeated arbitrary text. Repeated arbitrary text.'
    state.fips.justification = 'x'.repeat(45)
    const checks = checkCapstone(state)
    expect(checks.find((check) => check.id === 'a10-claims')?.label).toMatch(/sentences entered/)
    expect(checks.find((check) => check.id === 'a3-path')?.detail).toMatch(
      /does not establish a justified level/
    )
    state.matrix['secure-element-manufacturer'].fips = 'applies'
    expect(checkCapstone(state).find((check) => check.id === 'a2-matrix')?.detail).toMatch(
      /Only.*selections were compared/
    )
    for (const output of [
      capstoneMarkdown(state, '2026-11-11'),
      capstoneJson(state, '2026-11-11'),
    ]) {
      expect(output).not.toContain('at least three safe claims')
      expect(output).not.toContain('Level 3 justified')
    }
    state.release.fips.candidate = 'covered'
    expect(checkCapstone(state).find((check) => check.id === 'deadline-not-evidence')?.status).toBe(
      'fail'
    )
    state.claims = 'ML-KEM passed ACVP, so the module is FIPS validated.'
    expect(checkCapstone(state).find((check) => check.id === 'acvp-not-certificate')?.status).toBe(
      'fail'
    )
  })

  it('keeps teaching prose readable while preserving technical identifiers', () => {
    const prose = [
      ...CAPSTONE_REFERENCE.assumptions,
      ...CAPSTONE_WORKED_FIELDS.flatMap((field) => [field.why, ...[field.answer].flat()]),
      ...CAPSTONE_BOUNDARY_DECISIONS.flatMap((decision) => [decision.why, decision.contrary]),
    ].join(' ')
    expect(prose).not.toMatch(
      /assume5|Level[34]|augmentedAVA|firmware4|fictional5|than40characters|ACMv[23]|eIDAS2/
    )
    expect(prose).not.toMatch(/\\u[0-9a-f]{4}/i)
    expect(prose).toContain('AVA_VAN.5')
    expect(prose).toContain('EX-A')
    expect(prose).toContain('5.0.0 is planned and not yet submitted')
  })

  it('returns independent reference copies without changing the canonical fixture', () => {
    const first = capstoneWorkedState('pci')
    first.pci.scope = 'changed'
    first.boundaries.fips.length = 0
    expect(capstoneWorkedState('pci').pci.scope).toContain('EX-A')
    expect(capstoneWorkedState('pci').boundaries.fips).toHaveLength(4)
  })
})

describe('read-only worked reference disclosures', () => {
  it.each(paths)(
    'shows only the selected %s path, with every matrix and boundary rationale',
    (path) => {
      const view = render(
        <MemoryRouter>
          <Capstone config={{ path }} />
        </MemoryRouter>
      )
      const pathArtifact = { fips: 3, cc: 4, 'eucc-eidas': 5, pci: 6 }[path]
      expect(screen.getByTestId(`capstone-reference-${pathArtifact}`)).toBeInTheDocument()
      const matrix = screen.getByTestId('capstone-reference-2')
      expect(matrix.querySelectorAll('[data-reference-cell]')).toHaveLength(16)
      expect(
        screen.getByTestId('capstone-reference-1').querySelectorAll('[data-boundary-reference]')
      ).toHaveLength(18)
      expect(screen.getByRole('columnheader', { name: 'Limited checks' })).toBeInTheDocument()
      expect(
        screen.queryByRole('columnheader', { name: 'Evidence present' })
      ).not.toBeInTheDocument()
      expect(screen.getAllByTestId(/^capstone-reference-\d+$/)).toHaveLength(5)
      view.unmount()
    }
  )

  it('changes the displayed path reference without clearing the learner draft', () => {
    render(
      <MemoryRouter>
        <Capstone config={{ path: 'fips' }} />
      </MemoryRouter>
    )
    const claims = screen.getByLabelText('Safe claims, one per line')
    fireEvent.change(claims, { target: { value: 'My chosen-path draft.' } })
    const moduleState = JSON.stringify(useModuleStore.getState())
    fireEvent.click(screen.getByRole('button', { name: 'Common Criteria' }))
    expect(screen.getByTestId('capstone-reference-4')).toBeInTheDocument()
    expect(screen.queryByTestId('capstone-reference-3')).not.toBeInTheDocument()
    expect(claims).toHaveValue('My chosen-path draft.')
    expect(JSON.stringify(useModuleStore.getState())).toBe(moduleState)
  })

  it('opening and closing references leaves learner answers, preview and progress untouched', () => {
    render(
      <MemoryRouter>
        <Capstone config={{ path: 'fips' }} />
      </MemoryRouter>
    )
    const claims = screen.getByLabelText('Safe claims, one per line')
    fireEvent.change(claims, { target: { value: 'My own draft stays here.' } })
    const preview = screen.getByTestId('capstone-preview').textContent
    const moduleState = JSON.stringify(useModuleStore.getState())
    const stored = JSON.stringify({ ...localStorage })
    const reference = screen.getByTestId('capstone-reference-10')
    const summary = reference.querySelector('summary') as HTMLElement
    fireEvent.click(summary)
    expect(
      within(reference).getByText(/Hub-authored fictional Orrin N7 example/)
    ).toBeInTheDocument()
    fireEvent.click(summary)
    expect(claims).toHaveValue('My own draft stays here.')
    expect(screen.getByTestId('capstone-preview').textContent).toBe(preview)
    expect(JSON.stringify(useModuleStore.getState())).toBe(moduleState)
    expect(JSON.stringify({ ...localStorage })).toBe(stored)
  })
})
