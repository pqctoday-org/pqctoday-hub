// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { WorkshopFlowManifest } from '@/services/workshopFlowLoader'
import { pickFlowEntry, type FlowProfile } from './onboardingFlow'
import manifestJson from '../../../public/workshop/index.json'

// The real manifest, so the test fails if a role loses its tour or the ids move.
const manifest = manifestJson as WorkshopFlowManifest

const profile = (p: Partial<FlowProfile>): FlowProfile => ({
  persona: null,
  proficiency: null,
  industry: null,
  region: null,
  ...p,
})

describe('pickFlowEntry — Home offers the role its own guided tour', () => {
  it.each([
    ['developer', 'developer-basics-all-all-v1'],
    ['ops', 'devops-basics-all-all-v1'],
    ['researcher', 'researcher-basics-all-all-v1'],
    ['architect', 'architect-basics-all-all-v1'],
    ['curious', 'curious-curious-all-all-v1'],
  ] as const)('%s gets %s', (persona, id) => {
    expect(pickFlowEntry(manifest, profile({ persona }))?.id).toBe(id)
  })

  it('an executive with no industry or region set gets the executive tour', () => {
    expect(pickFlowEntry(manifest, profile({ persona: 'executive' }))?.id).toBe(
      'executive-basics-finance-and-banking-amer-apac-v1'
    )
  })

  it('an executive outside the tour’s industry or region falls back to the overview', () => {
    expect(
      pickFlowEntry(manifest, profile({ persona: 'executive', industry: 'Healthcare' }))?.id
    ).toBe('generic-overview')
    expect(pickFlowEntry(manifest, profile({ persona: 'executive', region: 'eu' }))?.id).toBe(
      'generic-overview'
    )
    for (const region of ['mena', 'global'] as const)
      expect(pickFlowEntry(manifest, profile({ persona: 'executive', region }))?.id).toBe(
        'generic-overview'
      )
  })

  it.each(['grc', 'cert-engineer'] as const)(
    '%s has no tour of its own yet, so gets the overview',
    (persona) => {
      expect(pickFlowEntry(manifest, profile({ persona }))?.id).toBe('generic-overview')
    }
  )

  it('no role selected gets the overview', () => {
    expect(pickFlowEntry(manifest, profile({}))?.id).toBe('generic-overview')
  })
})
