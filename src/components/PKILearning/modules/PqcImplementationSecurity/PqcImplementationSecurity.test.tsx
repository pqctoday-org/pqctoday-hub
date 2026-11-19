// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { useModuleStore } from '@/store/useModuleStore'
import { PqcImplementationSecurityModule } from './index'
import { content } from './content'
import manifest from './manifest'
import { TimingLeakInspector } from './workshop/TimingLeakInspector'
import { FoRejectionLab } from './workshop/FoRejectionLab'
import { MaskingCostExplorer } from './workshop/MaskingCostExplorer'
import { TvlaEvidenceScope } from './workshop/TvlaEvidenceScope'
import { ImplSecurityExercises } from './components/ImplSecurityExercises'

describe('PqcImplementationSecurity module (LM-081)', () => {
  beforeEach(() => {
    useModuleStore.getState().resetProgress()
  })

  it('manifest and content metadata resolve all standards/algorithms without setting lastReviewed', () => {
    expect(manifest.id).toBe('pqc-implementation-security')
    expect(manifest.lm_id).toBe('LM-081')
    expect(manifest.track).toBe('Hardware Infrastructure')
    expect(manifest.trackOrder).toBe(12)
    expect(manifest.difficulty).toBe('advanced')
    expect(manifest.duration).toBe('60 min')
    expect(content.moduleId).toBe('pqc-implementation-security')
    expect(content.lastReviewed).toBeUndefined()
    expect(content.lastEdited).toBe('2026-11-18')
    expect(content.standards.length).toBeGreaterThanOrEqual(8)
    expect(content.algorithms.length).toBe(3)
  })

  it('renders the header, description, all 6 tabs, and all 4 Learn sections', () => {
    render(
      <EmbedProvider>
        <MemoryRouter initialEntries={['/learn/pqc-implementation-security']}>
          <PqcImplementationSecurityModule />
        </MemoryRouter>
      </EmbedProvider>
    )

    expect(
      screen.getByRole('heading', { name: 'PQC Implementation Security & Side-Channel Resistance' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Identify and mitigate timing, cache, power\/EM, and fault-injection/i)
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
      /1\. Constant-Time Pitfalls in ML-KEM & ML-DSA/,
      /2\. Fujisaki-Okamoto \(FO\) Transform & Implicit Rejection/,
      /3\. Hardware Masking & Fault-Injection Countermeasures/,
      /4\. Evaluation Evidence: TVLA, FIPS 140-3 & EUCC/,
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
  })

  it('Step 1 (TimingLeakInspector) switches patterns, toggles view modes, and tracks reviewed count', () => {
    render(<TimingLeakInspector />)

    expect(
      screen.getByText(/Select Side-Channel Defect Pattern \(0 \/ 4 reviewed\)/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/compress_1_vuln/)).toBeInTheDocument()
    expect(screen.getByText(/compress_1_ct/)).toBeInTheDocument()

    // Switch to ML-DSA rejection pattern
    const rejectionBtn = screen.getByRole('button', {
      name: /ML-DSA Rejection-Sampling Early-Exit Branching/i,
    })
    fireEvent.click(rejectionBtn)
    expect(rejectionBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/check_norm_ct/)).toBeInTheDocument()

    // Switch view mode to Constant-Time Fix only
    const fixedOnlyBtn = screen.getByRole('button', { name: 'Constant-Time Fix' })
    fireEvent.click(fixedOnlyBtn)
    expect(fixedOnlyBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText(/check_norm_vuln/)).not.toBeInTheDocument()

    // Mark reviewed
    fireEvent.click(screen.getByRole('button', { name: 'Mark Reviewed' }))
    expect(
      screen.getByText(/Select Side-Channel Defect Pattern \(1 \/ 4 reviewed\)/i)
    ).toBeInTheDocument()
  })

  it('Step 2 (FoRejectionLab) compares valid, implicit-rejection tampered, and broken oracle traces', () => {
    render(<FoRejectionLab />)

    expect(screen.getByText(/IND-CCA2 Compliant/i)).toBeInTheDocument()

    const tamperedBtn = screen.getByRole('button', {
      name: /Tampered Ciphertext \(Implicit Reject\)/i,
    })
    fireEvent.click(tamperedBtn)
    expect(tamperedBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Implicit Rejection Active/i)).toBeInTheDocument()
    expect(screen.getByText(/OK \(0x00 — no mismatch error returned\)/i)).toBeInTheDocument()

    const brokenBtn = screen.getByRole('button', {
      name: /Broken Explicit-Error \/ memcmp/i,
    })
    fireEvent.click(brokenBtn)
    expect(brokenBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Vulnerable CCA Oracle/i)).toBeInTheDocument()

    const stage5Btn = screen.getByRole('button', { name: 'Stage 5' })
    fireEvent.click(stage5Btn)
    expect(stage5Btn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Stage 5: Constant-Time Selection & Zeroization/i)).toBeInTheDocument()
  })

  it('Step 3 (MaskingCostExplorer) updates masking order, fault defense, and target primitive with educational caveat', () => {
    render(<MaskingCostExplorer />)

    expect(
      screen.getByText(/Illustrative Educational Profiles — Not Vendor Benchmarks/i)
    ).toBeInTheDocument()

    const secondOrderBtn = screen.getByRole('button', { name: /2nd-Order \(3 Shares\)/i })
    fireEvent.click(secondOrderBtn)
    expect(secondOrderBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('d + 1 = 3 shares')).toBeInTheDocument()

    const keccakBtn = screen.getByRole('button', { name: /Keccak \/ SHAKE-128 & SHAKE-256/i })
    fireEvent.click(keccakBtn)
    expect(keccakBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('~8x – 15x')).toBeInTheDocument()

    const shuffleBtn = screen.getByRole('button', { name: 'Shuffling + Redundancy' })
    fireEvent.click(shuffleBtn)
    expect(shuffleBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/\+25% – 60%/i)).toBeInTheDocument()
  })

  it('Step 4 (TvlaEvidenceScope) enforces Unknown-never-means-low-exposure invariant and marks step complete', () => {
    const spy = vi.spyOn(useModuleStore.getState(), 'markStepComplete')
    render(<TvlaEvidenceScope />)

    // Default state: all 6 items are Unknown -> must report Unverified / Evidence Gap
    expect(
      screen.getByText(/Unverified \/ Evidence Gap — Unknown Never Means Low Exposure/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Yes: 0 · No: 0 · Unknown: 6/i)).toBeInTheDocument()

    // Mark 5 items Yes, leave 1 Unknown -> STILL Unverified / Evidence Gap
    const yesButtons = screen.getAllByRole('button', { name: 'Yes' })
    for (const btn of yesButtons.slice(0, 5)) {
      fireEvent.click(btn)
    }
    expect(
      screen.getByText(/Unverified \/ Evidence Gap — Unknown Never Means Low Exposure/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Yes: 5 · No: 0 · Unknown: 1/i)).toBeInTheDocument()

    // Mark final item Yes -> resolves to Sample Evidence Scope Complete
    fireEvent.click(yesButtons[5])
    expect(screen.getByText(/Sample Evidence Scope Complete/i)).toBeInTheDocument()

    // Complete review calls markStepComplete
    fireEvent.click(screen.getByRole('button', { name: /Complete TVLA Evidence Review/i }))
    expect(
      screen.getByText(/Step 4 marked complete in your learning progress/i)
    ).toBeInTheDocument()
    expect(spy).toHaveBeenCalledWith('pqc-implementation-security', 'tvla-evidence-scope', 3)
    spy.mockRestore()
  })

  it('Exercises render 4 role scenarios with expandable Decision & Production Evidence Checklists and workshop jumps', () => {
    let jumpedStep: number | null = null
    render(
      <ImplSecurityExercises
        onNavigateToWorkshop={() => {
          jumpedStep = 0
        }}
        onSetWorkshopConfig={(cfg) => {
          jumpedStep = cfg.step
        }}
      />
    )

    expect(
      screen.getByRole('heading', {
        name: /1\. Eliminate Compiler-Introduced Division & Branch Leaks/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /4\. Scope TVLA, FIPS 140-3 & EUCC AVA_VAN Evidence/i })
    ).toBeInTheDocument()

    const checklistToggles = screen.getAllByRole('button', {
      name: /Decision & Production Evidence Checklist/i,
    })
    expect(checklistToggles).toHaveLength(4)
    fireEvent.click(checklistToggles[0])
    expect(checklistToggles[0]).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Per-ISA disassembly gate report/i)).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /Open Step 4: TVLA & Certification Evidence Scope/i })
    )
    expect(jumpedStep).toBe(3)
  })
})
