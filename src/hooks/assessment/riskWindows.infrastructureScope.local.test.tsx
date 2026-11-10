// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useAssessmentFormStore } from '../../store/useAssessmentFormStore'
import { Step11Infrastructure } from '../../components/Assess/steps/Step11Infrastructure'
import { AlgorithmMigrationSection } from '../../components/Report/sections/AlgorithmMigrationSection'
import { computeMigrationEffort } from './riskWindows'

const physicalHsm = 'Hardware Security Module (HSM) Software'
const cloudHsm = 'Cloud Hardware Security Module (HSM)'
const store = () => useAssessmentFormStore.getState()
const effort = () => computeMigrationEffort(store().getInput()!)[0]

beforeEach(() => {
  store().reset()
  useAssessmentFormStore.setState({
    industry: 'Finance & Banking',
    dataSensitivity: ['high'],
    migrationStatus: 'not-started',
    currentCrypto: ['RSA-2048'],
    cryptoAgility: 'fully-abstracted',
    systemCount: '1-10',
    importProductSelection: false,
  })
})

describe('migration effort from actual questionnaire inputs', () => {
  it.each([
    ['Hardware & Secure Elements', physicalHsm, 'Hardware'],
    ['Cloud', cloudHsm, 'Cloud'],
  ])(
    'uses the explicit %s HSM selection and removes it with its parent',
    (label, category, layer) => {
      render(
        <MemoryRouter>
          <Step11Infrastructure hideHints />
        </MemoryRouter>
      )
      fireEvent.click(screen.getByRole('button', { name: label }))
      expect(effort().estimatedScope).toBe('quick-win')
      expect(effort().rationale).toContain('Not assessed from these inputs: HSM dependency')
      fireEvent.click(screen.getByRole('button', { name: category }))
      expect(store().getInput()?.infrastructureSubCategories?.[layer]).toContain(category)
      expect(effort().estimatedScope).toBe('moderate')
      expect(effort().rationale).toContain('Complexity driven by: HSM dependency.')
      expect(effort().rationale).toContain('Not assessed from these inputs: legacy dependencies.')
      fireEvent.click(screen.getByRole('button', { name: label }))
      expect(store().getInput()?.infrastructureSubCategories?.[layer]).toBeUndefined()
      expect(effort().estimatedScope).toBe('quick-win')
    }
  )

  it.each([
    ['broad hardware', ['Hardware'], {}],
    ['broad cloud', ['Cloud'], {}],
    ['non-HSM category', ['Hardware'], { Hardware: ['Smart Cards'] }],
    ['orphaned category', ['Cloud'], { Hardware: [physicalHsm] }],
    ['noncanonical category', ['Cloud'], { Cloud: ['HSM-like hardware'] }],
  ])('does not invent an HSM dependency from %s', (_label, layers, categories) => {
    useAssessmentFormStore.setState({
      infrastructure: layers,
      infrastructureSubCategories: categories,
    })
    expect(effort().estimatedScope).toBe('quick-win')
    expect(effort().rationale).toContain('Not assessed from these inputs: HSM dependency')
  })

  it('applies one allowance even with multiple explicit physical and cloud matches', () => {
    useAssessmentFormStore.setState({
      cryptoAgility: 'partially-abstracted',
      infrastructure: ['Hardware', 'Cloud', 'HSM'],
      infrastructureSubCategories: { Hardware: [physicalHsm, cloudHsm], Cloud: [cloudHsm] },
    })
    // 0.5 * 40 + 20 + 1 * 5 = 45, inclusive moderate threshold.
    expect(effort().complexity).toBe('medium')
    expect(effort().estimatedScope).toBe('moderate')
  })

  it('unknown infrastructure overrides stale subcategories and older explicit labels', () => {
    useAssessmentFormStore.setState({
      infrastructureUnknown: true,
      infrastructure: ['Hardware', 'HSM', 'Legacy'],
      infrastructureSubCategories: { Hardware: [physicalHsm] },
    })
    expect(effort().estimatedScope).toBe('quick-win')
    expect(effort().rationale).toContain(
      'Not assessed from these inputs: HSM dependency, legacy dependencies.'
    )
  })

  it('the actual Unknown action clears previously selected categories', () => {
    store().toggleInfrastructure('Hardware')
    store().setInfrastructureSubCategory('Hardware', [physicalHsm])
    expect(effort().estimatedScope).toBe('moderate')
    store().setInfrastructureUnknown(true)
    expect(store().getInput()?.infrastructureSubCategories).toBeUndefined()
    expect(effort().estimatedScope).toBe('quick-win')
  })

  it('preserves explicit older HSM and Legacy inputs and the 65-point boundary', () => {
    useAssessmentFormStore.setState({
      cryptoAgility: 'partially-abstracted',
      systemCount: '200-plus',
      infrastructure: ['HSM', 'Legacy'],
    })
    // 20 + 20 + 15 + 10 = 65, inclusive major-project threshold.
    expect(effort().estimatedScope).toBe('major-project')
    expect(effort().rationale).not.toContain('Not assessed')
    expect(effort().rationale).toContain('legacy systems')
  })

  it('keeps existing 25-point and greater-than-65 scope boundaries', () => {
    useAssessmentFormStore.setState({ cryptoAgility: 'partially-abstracted' })
    expect(effort().estimatedScope).toBe('quick-win') // 20 + 5 = 25
    useAssessmentFormStore.setState({
      cryptoAgility: 'hardcoded',
      systemCount: '200-plus',
      infrastructure: ['Hardware'],
      infrastructureSubCategories: { Hardware: [physicalHsm] },
    })
    expect(effort().estimatedScope).toBe('multi-year') // 36 + 20 + 10 = 66
  })

  it('shows the actual effort attribution and missing inputs in the report', () => {
    store().toggleInfrastructure('Hardware')
    store().setInfrastructureSubCategory('Hardware', [physicalHsm])
    render(
      <MemoryRouter>
        <AlgorithmMigrationSection
          defaultOpen
          industry="Finance & Banking"
          migrationEffort={computeMigrationEffort(store().getInput()!)}
          algorithmMigrations={[
            {
              classical: 'RSA-2048',
              quantumVulnerable: true,
              replacement: 'ML-KEM',
              urgency: 'near-term',
              notes: 'Sample transition; select the applicable profile.',
            },
          ]}
        />
      </MemoryRouter>
    )
    expect(screen.getByText('Moderate')).toBeVisible()
    expect(screen.getByText(/Effort model: Complexity driven by: HSM dependency/)).toBeVisible()
    expect(screen.getByText(/Not assessed from these inputs: legacy dependencies/)).toBeVisible()
  })
})
