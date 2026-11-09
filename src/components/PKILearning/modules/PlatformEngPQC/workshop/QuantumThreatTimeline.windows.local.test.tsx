// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { QuantumThreatTimeline } from './QuantumThreatTimeline'
import { PlatformEngExercises } from '../components/PlatformEngExercises'
import type { ProtectionWindow } from '../data/platformEngConstants'
import { PIPELINE_STAGES } from '../data/pipelineStagesData'

vi.mock('../data/pipelineStagesData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/pipelineStagesData')>()
  return { ...actual, PIPELINE_STAGES: structuredClone(actual.PIPELINE_STAGES) }
})
const originalStages = structuredClone(PIPELINE_STAGES)
afterEach(() => {
  PIPELINE_STAGES.splice(0, PIPELINE_STAGES.length, ...structuredClone(originalStages))
})

function choose(label: string, option: string) {
  fireEvent.click(screen.getByRole('button', { name: `${label}:` }))
  fireEvent.click(screen.getByRole('option', { name: option }))
}

describe('fictional protection windows', () => {
  it('separates confidentiality from authenticity and recalculates both horizons', () => {
    render(<QuantumThreatTimeline />)
    choose('CRQC Year', 'Illustrative scenario: 2030')
    expect(screen.getByText('15 vulnerable assets in this cohort')).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Confidentiality windows' })).getByText(
        '3 extend beyond horizon'
      )
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Authenticity windows' })).getByText(
        '7 extend beyond horizon'
      )
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Authenticity windows' })).getByText(
        '1 indeterminate'
      )
    ).toBeInTheDocument()
    choose('CRQC Year', 'Illustrative scenario: 2035')
    expect(
      within(screen.getByRole('region', { name: 'Confidentiality windows' })).getByText(
        '2 extend beyond horizon'
      )
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Authenticity windows' })).getByText(
        '6 end by horizon'
      )
    ).toBeInTheDocument()
  })

  it('filters the actual runtime record with both purposes without replacing payload retention with cert TTL', () => {
    render(<QuantumThreatTimeline />)
    choose('Pipeline Stage', 'Runtime & Service Mesh')
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(3)
    const mesh = screen.getByRole('row', { name: /Service Mesh mTLS/ })
    expect(within(mesh).getByText('1 hour')).toBeInTheDocument()
    expect(within(mesh).getByText('10+ years')).toBeInTheDocument()
    expect(within(mesh).getByText('Protection extends beyond horizon')).toBeInTheDocument()
    expect(within(mesh).getByText('Window ends by horizon')).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Recorded algorithm / key context' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/TLS payload confidentiality concerns key exchange, not certificate signing/)
    ).toBeInTheDocument()
    choose('CRQC Year', 'Illustrative scenario: 2040')
    expect(
      within(screen.getByRole('region', { name: 'Confidentiality windows' })).getByText(
        '1 indeterminate'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('NIST mandate: 2030', { exact: false })).not.toBeInTheDocument()
    expect(
      screen.getByText(/Newly issued classical credentials require reassessment/)
    ).toBeInTheDocument()
    choose('Pipeline Stage', 'All Stages')
    expect(screen.getByText('15 vulnerable assets in this cohort')).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Authenticity windows' })).getByText(
        '5 indeterminate'
      )
    ).toBeInTheDocument()
  })

  it('provides calculated exercise findings and preserves its actual workshop action', () => {
    const navigate = vi.fn()
    const configure = vi.fn()
    render(<PlatformEngExercises onNavigateToWorkshop={navigate} onSetWorkshopConfig={configure} />)
    expect(screen.getByText(/2030: confidentiality — 3 extend beyond horizon/)).toHaveTextContent(
      'authenticity — 7 extend beyond horizon, 5 end by horizon, 1 indeterminate'
    )
    expect(screen.getByText(/2030: confidentiality — 3 extend beyond horizon/)).toHaveTextContent(
      '2035: confidentiality — 2 extend beyond horizon, 0 end by horizon, 1 indeterminate'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open Step 2' }))
    expect(configure).toHaveBeenCalledWith({ step: 1 })
    expect(navigate).toHaveBeenCalledOnce()
  })
  it('withdraws an unmodeled asset and updates actual exercise/workshop findings after controlled inventory edits', () => {
    const edited = originalStages.map((stage) => ({
      ...stage,
      cryptoAssets: stage.cryptoAssets.map((asset) =>
        asset.id === 'build-vault-mtls'
          ? {
              ...asset,
              protectionWindows: {
                confidentiality: {
                  min: { value: 1, unit: 'years' as const },
                  max: { value: 1, unit: 'years' as const },
                },
              },
            }
          : asset.id === 'src-commit-sign'
            ? { ...asset, protectionWindows: undefined }
            : asset
      ),
    }))
    PIPELINE_STAGES.splice(0, PIPELINE_STAGES.length, ...edited)
    render(
      <>
        <QuantumThreatTimeline />
        <PlatformEngExercises onNavigateToWorkshop={vi.fn()} />
      </>
    )
    choose('CRQC Year', 'Illustrative scenario: 2030')
    expect(
      screen.getByText(/1 assets unassessed — no protection window modeled/)
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Confidentiality windows' })).getByText(
        '2 extend beyond horizon'
      )
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Authenticity windows' })).getByText(
        '6 extend beyond horizon'
      )
    ).toBeInTheDocument()
    const commitRow = screen.getByRole('row', { name: /Git Commit Signing Keys/ })
    expect(within(commitRow).getAllByText('Not modeled in this record')).toHaveLength(2)
    expect(within(commitRow).queryByText('Window ends by horizon')).not.toBeInTheDocument()
    expect(screen.getByText(/2030: confidentiality — 2 extend beyond horizon/)).toHaveTextContent(
      'authenticity — 6 extend beyond horizon'
    )
    expect(screen.getByText(/2030: confidentiality — 2 extend beyond horizon/)).toHaveTextContent(
      '1 have no modeled window'
    )
  })
  it.each([{ max: { value: 1, unit: 'years' } }, { min: { value: 1, unit: 'years' }, max: null }])(
    'renders malformed authored metadata as unassessed instead of crashing: %j',
    (malformed) => {
      const edited = originalStages.map((stage) => ({
        ...stage,
        cryptoAssets: stage.cryptoAssets.map((asset) =>
          asset.id === 'build-vault-mtls'
            ? {
                ...asset,
                protectionWindows: { confidentiality: malformed as unknown as ProtectionWindow },
              }
            : asset
        ),
      }))
      PIPELINE_STAGES.splice(0, PIPELINE_STAGES.length, ...edited)
      render(<QuantumThreatTimeline />)
      const row = screen.getByRole('row', { name: /Vault mTLS/ })
      expect(within(row).getByText('Invalid bounds')).toBeInTheDocument()
      expect(
        within(row).getByText('Unassessed — window not modeled or invalid')
      ).toBeInTheDocument()
      expect(within(row).queryByText('Window ends by horizon')).not.toBeInTheDocument()
      expect(
        within(screen.getByRole('region', { name: 'Confidentiality windows' })).getByText(
          '1 unassessed'
        )
      ).toBeInTheDocument()
    }
  )
})
