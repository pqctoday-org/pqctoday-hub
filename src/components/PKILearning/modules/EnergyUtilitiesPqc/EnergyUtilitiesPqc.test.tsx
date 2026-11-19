// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { useModuleStore } from '@/store/useModuleStore'
import { EnergyUtilitiesPqcModule } from './index'
import { content } from './content'
import manifest from './manifest'
import { GridProtocolMapper } from './workshop/GridProtocolMapper'
import { SubstationMtuBudget } from './workshop/SubstationMtuBudget'
import { SmartMeterLifecyclePlanner } from './workshop/SmartMeterLifecyclePlanner'
import { GridEvidenceScope } from './workshop/GridEvidenceScope'
import { EnergyUtilitiesExercises } from './components/EnergyUtilitiesExercises'

describe('EnergyUtilitiesPqc module (LM-082)', () => {
  beforeEach(() => {
    useModuleStore.getState().resetProgress()
  })

  it('manifest and content metadata resolve all standards/algorithms without setting lastReviewed', () => {
    expect(manifest.id).toBe('energy-utilities-pqc')
    expect(manifest.lm_id).toBe('LM-082')
    expect(manifest.track).toBe('Industries')
    expect(manifest.trackOrder).toBe(10)
    expect(content.moduleId).toBe('energy-utilities-pqc')
    expect(content.lastReviewed).toBeUndefined()
    expect(content.lastEdited).toBe('2026-11-18')
    expect(content.standards.length).toBeGreaterThanOrEqual(20)
    expect(content.algorithms.length).toBe(6)
  })

  it('renders the gradient header, description, all 6 tabs, and all 4 Learn sections', () => {
    render(
      <EmbedProvider>
        <MemoryRouter initialEntries={['/learn/energy-utilities-pqc']}>
          <EnergyUtilitiesPqcModule />
        </MemoryRouter>
      </EmbedProvider>
    )

    expect(
      screen.getByRole('heading', { name: 'Energy, Utilities & Grid PQC' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Plan and verify post-quantum migration across power generation/)
    ).toBeInTheDocument()

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

    for (const heading of [
      /1\. Grid Threat Model: Services vs\. Protected Assets/,
      /2\. Substation & SCADA Protocols: Real-Time Loops vs\. Control Planes/,
      /3\. AMI Smart Meters, DER Edge & 15–25 Year Field Lifecycles/,
      /4\. Regulatory Scope & Verifiable Vendor Evidence/,
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
  })

  it('Step 1 (GridProtocolMapper) filters by HNDL risk and distinguishes operational services from protected assets', () => {
    render(<GridProtocolMapper />)

    expect(screen.getByText(/Operational Service vs\. Protected Asset/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Substation Protection, Relaying & Firmware-Update Service/i)
    ).toBeInTheDocument()

    const highFilterBtn = screen.getByRole('button', { name: 'High HNDL Risk' })
    fireEvent.click(highFilterBtn)
    expect(highFilterBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Showing 2 of 4 utility zones/i)).toBeInTheDocument()
    expect(screen.getByText('SCADA / EMS Control Center & WAN Gateways')).toBeInTheDocument()
  })

  it('Step 2 (SubstationMtuBudget) fails ML-DSA-44 on L2 GOOSE and passes HMAC-SHA-256 with exact FIPS byte sizes', () => {
    render(<SubstationMtuBudget />)

    // Default: GOOSE L2 (1,500 B MTU, <4 ms) + ML-DSA-44 (2,420 B signature) -> FAIL
    expect(
      screen.getByText(/FAIL — Exceeds Hard Real-Time \/ Layer 2 Constraint/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/2,420 bytes/i)).toBeInTheDocument()

    // Switch to HMAC-SHA-256 (32 B) -> PASS
    const hmacBtn = screen.getByRole('button', { name: /HMAC-SHA-256/i })
    fireEvent.click(hmacBtn)
    expect(hmacBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/PASS — Quantum-Safe & Within Link Budget/i)).toBeInTheDocument()
  })

  it('Step 3 (SmartMeterLifecyclePlanner) switches field asset profiles and evaluates Mosca gap', () => {
    render(<SmartMeterLifecyclePlanner />)

    expect(
      screen.getByText(/Interim Gateway \/ Symmetric-Key Mitigations Required/i)
    ).toBeInTheDocument()

    const iedBtn = screen.getByRole('button', { name: /Substation Protection Relay \(IED\)/i })
    fireEvent.click(iedBtn)
    expect(iedBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/stays energized until/i)).toBeInTheDocument()
    expect(screen.getAllByText(/2044/).length).toBeGreaterThanOrEqual(1)
  })

  it('Step 4 (GridEvidenceScope) enforces Unknown-never-means-low-exposure invariant and marks step complete', () => {
    const spy = vi.spyOn(useModuleStore.getState(), 'markStepComplete')
    render(<GridEvidenceScope />)

    // Default: all 6 items Unknown -> Unverified / Evidence Gap
    expect(
      screen.getByText(/Unverified \/ Evidence Gap — Unknown Never Means Low Exposure/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Yes: 0 · No: 0 · Unknown: 6/i)).toBeInTheDocument()

    // Mark 5 Yes, leave 1 Unknown -> STILL Unverified / Evidence Gap
    const yesButtons = screen.getAllByRole('button', { name: 'Yes' })
    for (const btn of yesButtons.slice(0, 5)) {
      fireEvent.click(btn)
    }
    expect(
      screen.getByText(/Unverified \/ Evidence Gap — Unknown Never Means Low Exposure/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Yes: 5 · No: 0 · Unknown: 1/i)).toBeInTheDocument()

    // Mark final item Yes -> Sample Utility Evidence Scope Complete
    fireEvent.click(yesButtons[5])
    expect(screen.getByText(/Sample Utility Evidence Scope Complete/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Complete Grid Evidence Review/i }))
    expect(
      screen.getByText(/Step 4 marked complete in your learning progress/i)
    ).toBeInTheDocument()
    expect(spy).toHaveBeenCalledWith('energy-utilities-pqc', 'grid-evidence-scope', 3)
    spy.mockRestore()
  })

  it('Exercises render 4 utility scenarios with expandable Decision & Production Evidence Checklists and workshop jumps', () => {
    let jumpedStep: number | null = null
    render(
      <EnergyUtilitiesExercises
        onNavigateToWorkshop={() => {}}
        onSetWorkshopConfig={(cfg) => {
          jumpedStep = cfg.step
        }}
      />
    )

    expect(
      screen.getByText(/1\. Separate Real-Time Substation Loops from PQC Key Distribution/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/4\. Scope Utility Regulatory Duties & OEM Evidence Without Overclaiming/i)
    ).toBeInTheDocument()

    const rubricButtons = screen.getAllByRole('button', {
      name: /Decision & Production Evidence Checklist/i,
    })
    expect(rubricButtons).toHaveLength(4)
    fireEvent.click(rubricButtons[0])
    expect(rubricButtons[0]).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText(/2,420-byte ML-DSA-44 signature exceeds a 1,500-byte Layer 2 Ethernet MTU/i)
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /Open Step 3: Field Asset Lifecycle Planner/i })
    )
    expect(jumpedStep).toBe(2)
  })
})
