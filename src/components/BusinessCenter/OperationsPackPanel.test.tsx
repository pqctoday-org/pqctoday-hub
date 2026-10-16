// SPDX-License-Identifier: GPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { useModuleStore } from '@/store/useModuleStore'
import { OPERATIONS_PACK_SECTIONS } from '@/services/operationsPack'
import { checklistFor } from '@/data/migrationTestChecklist'
import { OperationsPackPanel } from './OperationsPackPanel'

const renderPanel = () =>
  render(
    <MemoryRouter>
      <OperationsPackPanel />
    </MemoryRouter>
  )

const opsDocs = () =>
  (useModuleStore.getState().artifacts.executiveDocuments ?? []).filter(
    (d) => d.moduleId === 'operations-pack'
  )

describe('OperationsPackPanel', () => {
  beforeEach(() => {
    const s = useModuleStore.getState()
    useModuleStore.setState({ artifacts: { ...s.artifacts, executiveDocuments: [] } })
  })

  it('shows every section as missing when nothing is saved', () => {
    renderPanel()
    expect(screen.getByTestId('operations-pack-count')).toHaveTextContent(
      `0 of ${OPERATIONS_PACK_SECTIONS.length} sections saved`
    )
    expect(screen.getByRole('link', { name: 'HSM Capacity Plan' })).toHaveAttribute(
      'href',
      '/playground/hsm-capacity'
    )
    expect(screen.getByRole('button', { name: 'Operations Scope' })).toBeInTheDocument()
  })

  it('saves the scope and counts it as present', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('operations-pack-open-scope'))
    fireEvent.change(screen.getByLabelText('Systems and protocols in scope'), {
      target: { value: 'Edge TLS on nginx 1.27' },
    })
    fireEvent.click(screen.getByTestId('ops-scope-save'))
    const [scope] = opsDocs()
    expect(scope.type).toBe('ops-scope')
    expect(scope.data).toContain('Edge TLS on nginx 1.27')
    expect(screen.getByTestId('operations-pack-count')).toHaveTextContent(
      `1 of ${OPERATIONS_PACK_SECTIONS.length} sections saved`
    )
  })

  it('seeds the test plan from the shared checklist lines tagged for operations', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('operations-pack-open-tests'))
    fireEvent.click(screen.getByTestId('ops-test-plan-save'))
    const [plan] = opsDocs()
    expect(plan.type).toBe('ops-test-plan')
    expect(plan.title).toBe('Operations test plan')
    expect(plan.data.startsWith('# Operations test plan')).toBe(true)
    expect((plan.inputs as { lines: unknown[] }).lines).toHaveLength(checklistFor('ops').length)
  })
})
