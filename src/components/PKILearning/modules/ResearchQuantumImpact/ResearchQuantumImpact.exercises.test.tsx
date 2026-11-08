// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The researcher exercises must be workable with what the Hub really has:
 * every linked page exists, the worked reasoning matches the real HNDL
 * calculator it points to, and no exercise sends the learner to a tool the
 * module does not contain.
 */
import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { MANIFEST_BY_ID } from '../../manifest/registry'
import { HNDLTimeline } from '../QuantumThreats/workshop/HNDLTimeline'
import { ResearchQuantumImpactModule } from './index'
import { RESEARCH_QUANTUM_EXERCISES } from './exercises'
import manifest from './manifest'

const renderExercises = () => {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/research-quantum-impact']}>
        <ResearchQuantumImpactModule />
      </MemoryRouter>
    </EmbedProvider>
  )
  fireEvent.click(screen.getByRole('tab', { name: 'Exercises' }))
}

describe('Researcher exercises: linked pages exist', () => {
  it('every resource points at a real module, Learn section or workshop step', () => {
    for (const exercise of RESEARCH_QUANTUM_EXERCISES) {
      expect(exercise.resources.length).toBeGreaterThan(0)
      for (const resource of exercise.resources) {
        const url = new URL(resource.to, 'https://hub.invalid')
        const moduleId = url.pathname.replace(/^\/learn\//, '')
        const target = MANIFEST_BY_ID[moduleId]
        expect(target, `${resource.to}: module ${moduleId}`).toBeDefined()
        const tab = url.searchParams.get('tab')
        const section = url.searchParams.get('section')
        const step = url.searchParams.get('step')
        if (section !== null) {
          expect(tab).toBe('learn')
          expect(target.learnSections?.map((s) => s.id)).toContain(section)
        }
        if (step !== null) {
          expect(tab).toBe('workshop')
          expect(Number(step)).toBeLessThan(target.workshopSteps?.length ?? 0)
        }
      }
    }
  })

  it('the HNDL calculator link opens the HNDL Timeline workshop step', () => {
    const genomic = RESEARCH_QUANTUM_EXERCISES[0]
    const link = genomic.resources.find((r) =>
      r.to.startsWith('/learn/quantum-threats?tab=workshop')
    )
    expect(link).toBeDefined()
    const step = Number(new URL(link!.to, 'https://hub.invalid').searchParams.get('step'))
    expect(MANIFEST_BY_ID['quantum-threats'].workshopSteps?.[step].label).toBe('HNDL Timeline')
  })

  it('the links to this module point at the steps they are named after', () => {
    const own = RESEARCH_QUANTUM_EXERCISES.flatMap((e) => e.resources).filter((r) =>
      r.to.startsWith('/learn/research-quantum-impact')
    )
    expect(own.length).toBeGreaterThan(0)
    for (const resource of own) {
      const step = Number(new URL(resource.to, 'https://hub.invalid').searchParams.get('step'))
      const label = manifest.workshopSteps?.[step].label
      expect(label).toBeDefined()
      if (/Learning Self-Check/.test(resource.label)) expect(label).toBe('What to Learn')
      if (/phased action plan/.test(resource.label)) expect(label).toBe('How to Act')
    }
  })
})

describe('Genomic data exercise: worked reasoning matches the real calculator', () => {
  const [genomic] = RESEARCH_QUANTUM_EXERCISES
  // The fictional inputs the exercise states.
  const encryptedIn = 2026
  const confidentialYears = 50
  const crqcYear = 2035
  const migrationYears = 5

  it('states inputs that the arithmetic uses', () => {
    const inputs = genomic.inputs.join(' ')
    expect(inputs).toContain(String(encryptedIn))
    expect(inputs).toContain(`${confidentialYears} years`)
    expect(inputs).toContain(String(crqcYear))
    expect(inputs).toContain(`${migrationYears} years`)
  })

  it('quotes the exposure window, the Mosca result and the deadline that follow from them', () => {
    const exposureYears = encryptedIn + confidentialYears - crqcYear
    const moscaYears = crqcYear - encryptedIn - confidentialYears - migrationYears
    const deadlineYear = crqcYear - confidentialYears - migrationYears
    expect(exposureYears).toBe(41)
    expect(moscaYears).toBe(-46)
    expect(deadlineYear).toBe(1980)
    expect(genomic.workedCheck).toContain(`${exposureYears} years`)
    expect(genomic.workedCheck).toContain(`−${Math.abs(moscaYears)}`)
    expect(genomic.workedCheck).toContain(String(deadlineYear))
  })

  it('the real HNDL calculator shows that deadline as overdue for these inputs', () => {
    render(<HNDLTimeline />)
    fireEvent.change(document.getElementById('data-lifetime-slider')!, {
      target: { value: '50' },
    })
    fireEvent.change(document.getElementById('crqc-year-slider')!, { target: { value: '2035' } })
    fireEvent.change(document.getElementById('migration-time-slider')!, { target: { value: '5' } })
    expect(screen.getByText('OVERDUE')).toBeInTheDocument()
    expect(screen.getByText(/2035 − 50 − 5 = 1980/)).toBeInTheDocument()
  })
})

describe('Researcher exercises tab', () => {
  it('shows fictional inputs, working links and a check for every exercise', () => {
    renderExercises()
    for (const exercise of RESEARCH_QUANTUM_EXERCISES) {
      const card = screen.getByRole('heading', { name: exercise.title }).parentElement!
      expect(within(card).getByText(exercise.audience)).toBeInTheDocument()
      for (const input of exercise.inputs) expect(within(card).getByText(input)).toBeInTheDocument()
      for (const resource of exercise.resources) {
        expect(within(card).getByRole('link', { name: resource.label })).toHaveAttribute(
          'href',
          resource.to
        )
      }
      expect(within(card).getByText('Check your answer')).toBeInTheDocument()
      for (const check of exercise.checks) expect(within(card).getByText(check)).toBeInTheDocument()
      expect(within(card).getByText(exercise.workedCheck)).toBeInTheDocument()
    }
  })

  it('does not send the learner to tools the module does not contain', () => {
    renderExercises()
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/action plan builder/i)
    expect(text).not.toMatch(/self-assessment tool/i)
    expect(text).not.toMatch(/Why It Matters \(Step 1\).*tools/i)
  })

  it('distinguishes the researchers each scenario is written for', () => {
    const audiences = RESEARCH_QUANTUM_EXERCISES.map((e) => e.audience)
    expect(new Set(audiences).size).toBe(RESEARCH_QUANTUM_EXERCISES.length)
  })
})
