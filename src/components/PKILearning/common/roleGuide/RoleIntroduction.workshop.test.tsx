// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The workshop overview on a Role Guide's Learn tab must describe the
 * workshop the module really has: the step count and the extra steps come from
 * the module's manifest, and the three shared steps are described as what they
 * do.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { RoleIntroduction } from './RoleIntroduction'
import { MANIFEST_BY_ID } from '../../manifest/registry'
import { RESEARCH_GUIDE_DATA } from '../../modules/ResearchQuantumImpact/data'
import { DEV_GUIDE_DATA } from '../../modules/DevQuantumImpact/data'
import { ARCH_GUIDE_DATA } from '../../modules/ArchQuantumImpact/data'
import { OPS_GUIDE_DATA } from '../../modules/OpsQuantumImpact/data'
import { SOC_GUIDE_DATA } from '../../modules/SocImplementationPqc/data'
import type { RoleGuideData } from './types'

const GUIDES: [string, RoleGuideData][] = [
  ['research-quantum-impact', RESEARCH_GUIDE_DATA],
  ['dev-quantum-impact', DEV_GUIDE_DATA],
  ['arch-quantum-impact', ARCH_GUIDE_DATA],
  ['ops-quantum-impact', OPS_GUIDE_DATA],
  ['soc-implementation-pqc', SOC_GUIDE_DATA],
]

const SHARED = ['why-it-matters', 'what-to-learn', 'how-to-act']

const renderIntro = (moduleId: string, data: RoleGuideData) =>
  render(
    <MemoryRouter initialEntries={[`/learn/${moduleId}`]}>
      <RoleIntroduction data={data} onNavigateToWorkshop={() => undefined} />
    </MemoryRouter>
  )

describe('Role Guide introduction describes the real workshop', () => {
  it.each(GUIDES)('%s: step count matches its manifest', (moduleId, data) => {
    const steps = MANIFEST_BY_ID[moduleId]?.workshopSteps
    expect(steps, `${moduleId} manifest`).toBeDefined()
    renderIntro(moduleId, data)
    expect(
      screen.getByRole('heading', { name: `Workshop: ${steps!.length} Steps` })
    ).toBeInTheDocument()
    expect(screen.queryByText(/3-Step Action Plan/)).not.toBeInTheDocument()
  })

  it.each(GUIDES)('%s: names the steps beyond the three shared ones', (moduleId, data) => {
    const steps = MANIFEST_BY_ID[moduleId].workshopSteps!
    const extras = steps.filter((s) => !SHARED.includes(s.id)).map((s) => s.label)
    renderIntro(moduleId, data)
    if (extras.length === 0) {
      expect(screen.queryByText(/This workshop also includes/)).not.toBeInTheDocument()
      return
    }
    expect(
      screen.getByText(`This workshop also includes: ${extras.join(', ')}.`)
    ).toBeInTheDocument()
  })

  it('does not call Step 1 a self-assessment: the self-assessment is its own later step', () => {
    renderIntro('research-quantum-impact', RESEARCH_GUIDE_DATA)
    const step1 = screen.getByText('Step 1: Why It Matters').parentElement!.parentElement!
    expect(step1).not.toHaveTextContent(/self-assessment/i)
    const steps = MANIFEST_BY_ID['research-quantum-impact'].workshopSteps!
    expect(steps.findIndex((s) => /Self-Assessment/.test(s.label))).toBeGreaterThan(2)
  })
})
