// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { REPLACE_ASSETS } from '@/data/migrationAssets'
import { computePosture } from './useMigrationPlan'
import { WAVES_FALLBACK } from './waves'
import { PlanTab } from './PlanTab'

vi.mock('./waves', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./waves')>()
  return {
    ...actual,
    WAVES_FALLBACK: {
      ...actual.WAVES_FALLBACK,
      1: {
        ...actual.WAVES_FALLBACK[1],
        subtitle: 'Fixture: assess actual exposure before sequencing',
      },
    },
  }
})

describe('Plan wave metadata reader', () => {
  it('renders supplied wave-one metadata instead of retaining a separate hard-coded rationale', () => {
    const assets = [1, 2].map((wave) => REPLACE_ASSETS.find((asset) => asset.wave === wave)!)
    const posture = computePosture(
      assets.map((asset) => asset.id),
      {}
    )
    render(
      <MemoryRouter>
        <PlanTab posture={posture} onGoToReplace={() => {}} />
      </MemoryRouter>
    )
    expect(
      screen.getByText('Fixture: assess actual exposure before sequencing')
    ).toBeInTheDocument()
    expect(screen.getByText(WAVES_FALLBACK[2].subtitle)).toBeInTheDocument()
    expect(screen.getByText(WAVES_FALLBACK[1].title)).toBeInTheDocument()
    expect(screen.queryByText(/Public TLS & VPN — highest exposure/)).not.toBeInTheDocument()
    expect(posture.waves.map((wave) => wave.wave)).toEqual([1, 2])
  })
})
