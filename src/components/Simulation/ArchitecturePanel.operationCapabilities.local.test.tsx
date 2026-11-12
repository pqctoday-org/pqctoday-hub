// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ArchitecturePanel } from './ArchitecturePanel'
import { SCENARIO_OPERATION_CASES } from '@/data/simOperationCapabilities'
import { ARCHITECTURES } from '@/data/simArchitecture'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { planningForArchitecture } from '@/simulation/edgePlanningProgress'
vi.mock('./MermaidDiagram', () => ({
  MermaidDiagram: ({ source }: { source: string }) => (
    <pre data-testid="operation-diagram">{source}</pre>
  ),
}))
const key = 'user-cdn-TLS 1.3',
  original = SCENARIO_OPERATION_CASES.small['user-cdn-TLS 1.3']
function signingOnly() {
  // Change one fictional input; progress/store/capacity/eligibility remain real.
  Object.assign(SCENARIO_OPERATION_CASES.small, {
    [key]: {
      ...original,
      to: {
        ...original.to,
        capabilities: { 'produce-signature-through-provider-api': 'available' },
      },
    },
  })
}
beforeEach(() => {
  useSimulationStore.setState({ edgeDecisions: {} })
  useMigrateSelectionStore.setState({ myProducts: [], choice: {} })
})
afterEach(() => Object.assign(SCENARIO_OPERATION_CASES.small, { [key]: original }))
describe('Actual desktop operation-specific decisions', () => {
  it('a saved signing-only TLS choice receives no credit, stays removable and cannot consume a KEM slot', () => {
    signingOnly()
    useSimulationStore.setState({
      edgeDecisions: { [key]: 'hybrid', 'cdn-app-TLS': 'pure', 'outside-case': 'hybrid' },
    })
    render(<ArchitecturePanel size="small" country="US" p5Frac={1} />)
    expect(
      screen.getByText(/1\/6 links planned · 1 eligible choices · 2\/2 unlocked/)
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Migrate$/ })).toHaveLength(1)
    expect(screen.getByText(/cdn: key establishment unknown/)).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Undo migration of User to Caddy Web/LB' })
    ).toBeEnabled()
    expect(
      planningForArchitecture(ARCHITECTURES.small, 1, useSimulationStore.getState().edgeDecisions)
        .unavailableKeys
    ).toEqual([key])
    fireEvent.click(screen.getByRole('button', { name: 'Undo migration of User to Caddy Web/LB' }))
    expect(useSimulationStore.getState().edgeDecisions).toEqual({
      'cdn-app-TLS': 'pure',
      'outside-case': 'hybrid',
    })
    expect(screen.getByText(/not vendor claims/)).toBeVisible()
  })
  it('restoring operations rechecks the same effort budget; targeted Undo restores exact credited keys and preserves history', () => {
    useSimulationStore.setState({
      edgeDecisions: { [key]: 'hybrid', 'cdn-app-TLS': 'pure', 'outside-case': 'hybrid' },
    })
    signingOnly()
    const { rerender } = render(<ArchitecturePanel size="small" country="US" p5Frac={0.5} />)
    expect(
      screen.getByText(/1\/6 links planned · 1 eligible choices · 1\/2 unlocked/)
    ).toBeInTheDocument()
    Object.assign(SCENARIO_OPERATION_CASES.small, { [key]: original })
    rerender(<ArchitecturePanel size="small" country="US" p5Frac={0.5} />)
    expect(screen.getByTestId('arch-overcapacity')).toBeInTheDocument()
    expect(
      screen.getByText(/0\/6 links planned · 2 eligible choices · 1\/3 unlocked/)
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Diagram' }))
    expect(screen.getByTestId('operation-diagram')).not.toHaveTextContent('✓ migrated')
    fireEvent.click(screen.getByRole('button', { name: 'List' }))
    fireEvent.click(screen.getByRole('button', { name: 'Undo migration of User to Caddy Web/LB' }))
    expect(screen.queryByTestId('arch-overcapacity')).not.toBeInTheDocument()
    expect(
      planningForArchitecture(ARCHITECTURES.small, 0.5, useSimulationStore.getState().edgeDecisions)
        .creditedKeys
    ).toEqual(['cdn-app-TLS'])
    expect(useSimulationStore.getState().edgeDecisions).toEqual({
      'cdn-app-TLS': 'pure',
      'outside-case': 'hybrid',
    })
  })
  it('offers actual supported signing and key-establishment positives while keeping conditional APAC planning blocked', () => {
    const { rerender } = render(<ArchitecturePanel size="mid" country="US" p5Frac={1} />)
    expect(screen.getByText(/hsm: produce signature through provider API available/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /Migrate eligible/ }))
    expect(
      planningForArchitecture(ARCHITECTURES.mid, 1, useSimulationStore.getState().edgeDecisions)
        .creditedKeys
    ).toContain('app1-hsm-PKCS#11')
    rerender(<ArchitecturePanel size="global" country="US" p5Frac={1} />)
    expect(screen.getByText(/apac: verify issued certificate conditional/)).toBeVisible()
    expect(screen.getByText(/apac: key establishment conditional/)).toBeVisible()
    expect(screen.getAllByRole('button', { name: /^Migrate$/ })).toHaveLength(3)
  })
})
