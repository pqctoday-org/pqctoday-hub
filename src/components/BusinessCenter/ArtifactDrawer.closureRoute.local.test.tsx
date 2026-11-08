// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { ArtifactDrawer, type DrawerMode } from './ArtifactDrawer'
import type { ExecutiveDocument } from '@/services/storage/types'
const { builder } = vi.hoisted(() => ({ builder: vi.fn() }))
vi.mock('./businessToolComponents', () => ({
  BUSINESS_TOOL_COMPONENTS: {
    'migration-verification': () => {
      builder()
      return <p>Generic migration builder</p>
    },
    'roi-calculator': () => {
      builder()
      return <p>Generic ROI builder</p>
    },
  },
}))
const doc: ExecutiveDocument = {
  id: 'closure',
  moduleId: 'verification-closure',
  type: 'migration-verification',
  title: 'Fictional closure record',
  data: '# Saved original closure draft',
  createdAt: 1,
  inputs: { __artifactScope: 'verification-closure/handover', owner: { cbom: 'Architecture' } },
}
function Location() {
  const l = useLocation()
  return <output aria-label="Current route">{l.pathname + l.search}</output>
}
function show(
  document: ExecutiveDocument | null = doc,
  mode: DrawerMode = 'view',
  onClose = vi.fn(),
  readOnly = false
) {
  return render(
    <MemoryRouter>
      <ArtifactDrawer
        document={document}
        createType={mode === 'create' ? 'migration-verification' : undefined}
        mode={mode}
        onClose={onClose}
        onModeChange={vi.fn()}
        readOnly={readOnly}
      />
      <Location />
    </MemoryRouter>
  )
}
beforeEach(() => builder.mockClear())
describe('Scoped closure artifact reopens its actual workshop', () => {
  it('uses the exact workshop link and omits unrelated editor/reviewer workflow', async () => {
    const close = vi.fn()
    show(doc, 'view', close)
    const link = screen.getByRole('link', { name: 'Reopen handover workshop' })
    expect(link).toHaveAttribute('href', '/learn/verification-closure?tab=workshop&step=2')
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /In review/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Markdown' })).toBeInTheDocument()
    await userEvent.click(link)
    expect(close).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Current route')).toHaveTextContent(
      '/learn/verification-closure?tab=workshop&step=2'
    )
  })
  it('guards forced edit mode with the saved preview instead of mounting another builder', () => {
    show(doc, 'edit')
    expect(
      screen.getByRole('heading', { name: 'Saved original closure draft' })
    ).toBeInTheDocument()
    expect(builder).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /In review/ })).not.toBeInTheDocument()
  })
  it.each([
    { label: 'other module', document: { ...doc, moduleId: 'other-module' } },
    { label: 'other type', document: { ...doc, type: 'roi-model' as const } },
    { label: 'other scope', document: { ...doc, inputs: { __artifactScope: 'different-scope' } } },
  ])('preserves normal editor and approval controls for $label', ({ document }) => {
    show(document)
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /In review/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Reopen handover workshop' })).not.toBeInTheDocument()
  })
  it('preserves ordinary create and edit paths', () => {
    const view = show(null, 'create')
    expect(screen.getByText('Generic migration builder')).toBeInTheDocument()
    expect(builder).toHaveBeenCalledOnce()
    view.unmount()
    show({ ...doc, moduleId: 'other-module' }, 'edit')
    expect(screen.getByText('Generic migration builder')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /In review/ })).toBeInTheDocument()
  })
  it('retains read-only affordance restrictions', () => {
    show(doc, 'view', vi.fn(), true)
    expect(screen.queryByRole('link', { name: 'Reopen handover workshop' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })
})
