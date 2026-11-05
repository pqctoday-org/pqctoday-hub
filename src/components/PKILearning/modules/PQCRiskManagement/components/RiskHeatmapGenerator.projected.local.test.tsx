// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/button'
import { RiskHeatmapGenerator } from './RiskHeatmapGenerator'
type DraftInputs = {
  treatmentDecisions?: Record<
    string,
    { strategy: 'transfer' | 'avoid' | 'mitigate' | 'accept'; justification: string }
  >
  residualOverrides?: Record<string, { likelihood?: number; impact?: number }>
  viewMode?: 'inherent' | 'residual'
}
const fixture = vi.hoisted(() => ({ saved: undefined as DraftInputs | undefined, save: vi.fn() }))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => fixture.saved }))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: () => ({ addExecutiveDocument: fixture.save }),
}))
vi.mock('@/components/PKILearning/common/executive/ExportableArtifact', () => ({
  ExportableArtifact: ({ exportData, onExport }: { exportData: string; onExport: () => void }) => (
    <>
      <pre data-testid="markdown">{exportData}</pre>
      <Button onClick={onExport}>Save draft projection</Button>
    </>
  ),
}))
const baseline = [
  {
    id: 'portal',
    assetName: 'Fictional Portal',
    currentAlgorithm: 'RSA-2048',
    threatVector: 'sample',
    likelihood: 4,
    impact: 5,
    mitigation: 'Fictional proposed control',
  },
]
const openCell = (score: number) =>
  fireEvent.click(
    screen.getByRole('button', {
      name: (name) => name.includes(`score ${score} (`) && name.endsWith('Fictional Portal'),
    })
  )
const save = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Save draft projection' }))
  return fixture.save.mock.calls.at(-1)![0]
}
beforeEach(() => {
  fixture.saved = undefined
  fixture.save.mockClear()
})
describe('strategy choices do not implement risk reduction', () => {
  it('keeps Transfer and planned Avoid at baseline20 without creating untouched estimates', () => {
    render(<RiskHeatmapGenerator riskEntries={baseline} />)
    openCell(20)
    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }))
    expect(screen.getByRole('button', { name: /score 20 .*Fictional Portal/ })).toBeInTheDocument()
    expect(save().inputs.residualOverrides).toEqual({})
    expect(screen.getByTestId('markdown')).toHaveTextContent(
      'Not assessed; baseline 20 (Critical) shown'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Avoid' }))
    expect(screen.getByRole('button', { name: /score 20 .*Fictional Portal/ })).toBeInTheDocument()
    expect(screen.getByText('(1 risk plotted)')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(
      'Planned avoidance — reduction not assessed; baseline 20 shown'
    )
    expect(screen.getByTestId('markdown')).not.toHaveTextContent('Removed')
    expect(screen.getByText(/100% strategy choices recorded/)).toBeInTheDocument()
  })
  it.each(['Transfer', 'Mitigate'])(
    'requires both edited ratings for %s, computes4×3=12 as hypothetical and preserves it on reload',
    (strategy) => {
      const before = structuredClone(baseline)
      const view = render(<RiskHeatmapGenerator riskEntries={baseline} />)
      openCell(20)
      fireEvent.click(screen.getByRole('button', { name: strategy }))
      fireEvent.click(screen.getByRole('button', { name: 'Choose likelihood 1–5' }))
      fireEvent.click(screen.getByRole('option', { name: /^4/ }))
      expect(save().inputs.residualOverrides).toEqual({ portal: { likelihood: 4 } })
      expect(
        screen.getByRole('button', { name: /score 20 .*Fictional Portal/ })
      ).toBeInTheDocument()
      expect(screen.getByText(/Hypothetical impact — draft: not entered/)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Choose impact 1–5' }))
      fireEvent.click(screen.getByRole('option', { name: /^3/ }))
      expect(
        screen.getByRole('button', { name: /score 12 .*Fictional Portal/ })
      ).toBeInTheDocument()
      const document = save()
      expect(document.inputs.residualOverrides).toEqual({ portal: { likelihood: 4, impact: 3 } })
      expect(document.data).toContain('12 (High) — hypothetical draft, not measured or implemented')
      expect(document.data).toContain('20 (Critical)')
      expect(baseline).toEqual(before)
      view.unmount()
      fixture.saved = document.inputs
      render(<RiskHeatmapGenerator riskEntries={baseline} />)
      openCell(12)
      expect(screen.getByText(/Baseline: likelihood 4 × impact 5/)).toBeInTheDocument()
      expect(screen.getByText(/Stored draft values may include older defaults/)).toBeInTheDocument()
    }
  )
  it.each([{ likelihood: 0, impact: 3 }, { impact: 3 }, { likelihood: 6, impact: 2 }])(
    'preserves incomplete or invalid legacy drafts as unassessed: %j',
    (raw) => {
      fixture.saved = {
        treatmentDecisions: {
          portal: { strategy: 'transfer', justification: 'Sample historical draft' },
        },
        residualOverrides: { portal: raw },
        viewMode: 'residual',
      }
      render(<RiskHeatmapGenerator riskEntries={baseline} />)
      openCell(20)
      expect(screen.getByText(/Projection not assessed — no complete valid/)).toBeInTheDocument()
      expect(save().inputs.residualOverrides.portal).toEqual(raw)
      expect(screen.getByTestId('markdown')).toHaveTextContent('Not assessed; baseline 20')
      if (raw.likelihood === 0)
        expect(screen.getByText('Hypothetical likelihood — draft: 0')).toBeInTheDocument()
    }
  )
})
