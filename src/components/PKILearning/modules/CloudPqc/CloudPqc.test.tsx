// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { useModuleStore } from '@/store/useModuleStore'
import { CloudPqcModule } from './index'
import { content } from './content'
import rawManifest from './manifest'
import { CloudEstateMapper } from './workshop/CloudEstateMapper'
import { ProviderCapabilityMatrix } from './workshop/ProviderCapabilityMatrix'
import { EdgeTlsKmsPlanner } from './workshop/EdgeTlsKmsPlanner'
import { SaasBoundaryChecklist } from './workshop/SaasBoundaryChecklist'
import { CloudPqcExercises } from './components/CloudPqcExercises'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest = resolveManifest(rawManifest)

describe('CloudPqc module (LM-080)', () => {
  beforeEach(() => {
    useModuleStore.getState().resetProgress()
  })

  it('manifest and content metadata resolve all standards/algorithms without setting lastReviewed', () => {
    expect(manifest.id).toBe('cloud-pqc')
    expect(manifest.lm_id).toBe('LM-080')
    expect(manifest.track).toBe('Software Infrastructure')
    expect(manifest.trackOrder).toBe(9)
    expect(content.moduleId).toBe('cloud-pqc')
    expect(content.lastReviewed).toBeUndefined()
    expect(content.lastEdited).toBe('2026-11-18')
    expect(content.standards.length).toBeGreaterThanOrEqual(8)
    expect(content.algorithms.length).toBe(6)
  })

  it('renders the gradient header, description, all 6 tabs, and all 4 Learn sections', () => {
    render(
      <EmbedProvider>
        <MemoryRouter initialEntries={['/learn/cloud-pqc']}>
          <CloudPqcModule />
        </MemoryRouter>
      </EmbedProvider>
    )

    expect(
      screen.getByRole('heading', { name: 'Cloud-Native & SaaS PQC Migration' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Plan and verify post-quantum migration across AWS, Azure, GCP, and SaaS/)
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
      /1\. Shared Responsibility & Protected Assets/,
      /2\. Edge, CDN & Origin TLS/,
      /3\. Cloud KMS, BYOK & Storage Boundaries/,
      /4\. SaaS, Federation & Verifiable Evidence/,
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
  })

  it('Step 1 (CloudEstateMapper) filters by control owner and distinguishes services from protected assets', () => {
    render(<CloudEstateMapper />)

    expect(screen.getByText(/Cloud Service vs\. Protected Asset/i)).toBeInTheDocument()
    expect(screen.getByText(/Long-lived encrypted records/i)).toBeInTheDocument()

    const providerFilterBtn = screen.getByRole('button', { name: 'Provider-Controlled' })
    fireEvent.click(providerFilterBtn)
    expect(providerFilterBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Third-Party SaaS Applications')).toBeInTheDocument()
    expect(screen.queryByText('API Gateway & Service Mesh')).not.toBeInTheDocument()
  })

  it('Step 2 (ProviderCapabilityMatrix) filters by AWS/GCP/Azure and displays verification commands', () => {
    render(<ProviderCapabilityMatrix />)

    expect(screen.getByText(/Showing 11 of 11 capabilities/i)).toBeInTheDocument()

    const gcpBtn = screen.getByRole('button', { name: 'GCP' })
    fireEvent.click(gcpBtn)
    expect(gcpBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Showing 4 of 11 capabilities/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Google Cloud KMS Quantum-Safe Key Import/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/gcloud kms import-jobs describe/i)).toBeInTheDocument()
  })

  it('Step 3 (EdgeTlsKmsPlanner) switches failure modes and toggles cutover sequencer gates', () => {
    render(<EdgeTlsKmsPlanner />)

    expect(screen.getByText(/ClientHello \(1,682 bytes/i)).toBeInTheDocument()

    const byokBtn = screen.getByRole('button', { name: /RSA-Only BYOK Import Boundary/i })
    fireEvent.click(byokBtn)
    expect(byokBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/RSA_AES_KEY_WRAP_SHA_256/i)).toBeInTheDocument()

    const markButtons = screen.getAllByRole('button', { name: 'Mark Reviewed' })
    fireEvent.click(markButtons[0])
    expect(screen.getByText(/2 \/ 4 sample gates reviewed/i)).toBeInTheDocument()
  })

  it('Step 4 (SaasBoundaryChecklist) enforces Unknown-never-means-low-exposure invariant and marks step complete', () => {
    const spy = vi.spyOn(useModuleStore.getState(), 'markStepComplete')
    render(<SaasBoundaryChecklist />)

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
    fireEvent.click(screen.getByRole('button', { name: /Complete SaaS Boundary Review/i }))
    expect(
      screen.getByText(/Step 4 marked complete in your learning progress/i)
    ).toBeInTheDocument()
    expect(spy).toHaveBeenCalledWith('cloud-pqc', 'saas-boundary-check', 3)
    spy.mockRestore()
  })

  it('Exercises render 4 role scenarios with expandable Decision & Production Evidence Checklists and workshop jumps', () => {
    let jumpedStep: number | null = null
    render(
      <CloudPqcExercises
        onNavigateToWorkshop={() => {}}
        onSetWorkshopConfig={(cfg) => {
          jumpedStep = cfg.step
        }}
      />
    )

    expect(
      screen.getByText(/1\. Separate Cloud Services from Protected Assets/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/4\. Scope SaaS & Multi-Account PQC Evidence/i)).toBeInTheDocument()

    const rubricButtons = screen.getAllByRole('button', {
      name: /Decision & Production Evidence Checklist/i,
    })
    expect(rubricButtons).toHaveLength(4)
    fireEvent.click(rubricButtons[0])
    expect(rubricButtons[0]).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText(/Identify the archiving\/storage platform as the business service/i)
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /Open Step 3: Edge TLS & KMS Cutover Lab/i })
    )
    expect(jumpedStep).toBe(2)
  })
})
