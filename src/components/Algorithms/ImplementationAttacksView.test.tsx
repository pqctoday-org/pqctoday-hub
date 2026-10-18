// SPDX-License-Identifier: AGPL-3.0-only
/** Implementation Attacks: mitigation wording, severity basis and tap targets. */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ImplementationAttacksView } from './ImplementationAttacksView'
import { ATTACK_PROFILES } from '@/data/implementationAttackProfiles'

describe('ImplementationAttacksView', () => {
  it('heads mitigations as considerations, never as countermeasures that make it safe', () => {
    render(<ImplementationAttacksView />)
    const withMitigations = ATTACK_PROFILES.filter((p) => p.countermeasures?.length).length
    expect(screen.getAllByText('Mitigation considerations')).toHaveLength(withMitigations)
    expect(screen.queryByText('Countermeasures')).not.toBeInTheDocument()
  })

  it('states that severity is a qualitative reading, not CVSS', () => {
    render(<ImplementationAttacksView />)
    expect(screen.getByText(/qualitative reading, not CVSS/)).toBeInTheDocument()
  })

  it('reference links are at least 24px tall to tap', () => {
    render(<ImplementationAttacksView />)
    const link = screen.getAllByRole('link')[0]
    expect(link).toHaveClass('min-h-6', 'py-1')
  })
})

describe('attack profile mitigations', () => {
  const all = ATTACK_PROFILES.flatMap((p) => p.countermeasures ?? [])

  it('never present module validation as a side-channel mitigation', () => {
    expect(all.filter((m) => /^Use FIPS 140-3 validated/i.test(m))).toEqual([])
  })

  it('every mention of module validation says it does not establish resistance on its own', () => {
    const mentions = all.filter((m) => /FIPS 140-3|CAVP/.test(m))
    expect(mentions.length).toBeGreaterThan(0)
    for (const m of mentions) expect(m).toMatch(/does not (establish|rule out)/)
  })
})
