// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ArchitecturePanel } from './ArchitecturePanel'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
vi.mock('./MermaidDiagram', () => ({ MermaidDiagram: () => <div>Diagram fixture</div> }))

describe('Architecture monitor-only scenario scope', () => {
  beforeEach(() => {
    useSimulationStore.setState({ edgeDecisions: {} })
    useMigrateSelectionStore.setState({ myProducts: [], choice: {} })
  })
  it('keeps the eligibility gate while distinguishing the sample path assumption from a protocol limit', () => {
    render(<ArchitecturePanel size="small" country="US" p5Frac={0} />)
    expect(screen.getByRole('button', { name: /Migrate eligible/i })).toBeDisabled()
    expect(
      screen.getByText(/monitor-only links have no PQC path assumed in this scenario/)
    ).toHaveTextContent(/does not establish an inherent protocol limitation/)
    fireEvent.click(screen.getByRole('button', { name: 'Diagram' }))
    expect(screen.getByText(/dashed: monitor-only/)).toHaveTextContent(
      /no PQC path assumed in this scenario/
    )
    expect(screen.queryByText(/irreducible/i)).not.toBeInTheDocument()
  })
})
