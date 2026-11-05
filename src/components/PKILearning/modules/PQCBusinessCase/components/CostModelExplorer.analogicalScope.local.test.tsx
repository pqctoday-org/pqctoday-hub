// SPDX-License-Identifier: AGPL-3.0-only
import { Button } from '@/components/ui/button'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CostModelExplorer } from './CostModelExplorer'

const { save } = vi.hoisted(() => ({ save: vi.fn() }))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => null }))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector: (state: unknown) => unknown) =>
    selector({ addExecutiveDocument: save }),
}))
vi.mock('@/components/PKILearning/common/executive/ExportableArtifact', () => ({
  ExportableArtifact: ({ onExport }: { onExport: () => void }) => (
    <Button onClick={onExport}>Save comparison fixture</Button>
  ),
}))

describe('Analogical illustrative calculation attribution', () => {
  beforeEach(() => save.mockClear())
  it('keeps the displayed and exported complexity factor consistent with independent hand arithmetic', () => {
    render(<CostModelExplorer />)
    expect(
      screen.getByText(/\$30K\/system illustrative anchor × 1.0× complexity × 250 systems/)
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save comparison fixture' }))
    // The existing sample carry is $2M / 3 nominal years × 5 years.
    // 250 × $30K × 1 + $3.333M = $10.833M; ×2 = $18.333M.
    const initial = save.mock.calls[0][0]
    expect(initial.data).toContain('| Analogical (illustrative anchor) | $10.8M |')
    expect(initial.data).toContain('× 1.0× complexity × 250 systems + $3.3M')
    fireEvent.change(screen.getByLabelText(/Complexity \/ legacy factor/), {
      target: { value: '2' },
    })
    expect(
      screen.getByText(/\$30K\/system illustrative anchor × 2.0× complexity × 250 systems/)
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save comparison fixture' }))
    const changed = save.mock.calls[1][0]
    expect(changed.data).toContain('| Analogical (illustrative anchor) | $18.3M |')
    expect(changed.data).toContain('× 2.0× complexity × 250 systems + $3.3M')
    expect(changed.inputs.complexity).toBe(2)
    expect(changed.data).not.toContain('from past crypto migrations')
  })
})
