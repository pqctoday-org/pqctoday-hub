// SPDX-License-Identifier: GPL-3.0-only

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Shield } from 'lucide-react'

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Controls: () => <div data-testid="controls" />,
  Background: () => <div data-testid="background" />,
  BackgroundVariant: { Dots: 'dots' },
  useReactFlow: () => ({ fitView: vi.fn() }),
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom' },
}))

// Mock right panel store
vi.mock('@/store/useRightPanelStore', () => ({
  useRightPanelStore: (selector: (s: { close: () => void }) => unknown) =>
    selector({ close: vi.fn() }),
}))

// Mock FilterDropdown
vi.mock('@/components/common/FilterDropdown', () => ({
  FilterDropdown: ({ label }: { label: string }) => <div data-testid="root-picker">{label}</div>,
}))

// Mock the data hook with a minimal tree
vi.mock('./useMindmapData', () => ({
  useMindmapData: () => ({
    tree: {
      id: 'root',
      label: 'PQC Migration',
      route: '/',
      icon: Shield,
      children: [{ id: 'learn', label: 'Learn', route: '/learn', icon: Shield, children: [] }],
    },
    rootPickerItems: [{ id: 'root', label: 'PQC Migration' }],
    findItem: () => undefined,
  }),
}))

describe('MindmapView', () => {
  it('renders the header, root picker, and canvas', async () => {
    const { MindmapView } = await import('./MindmapView')
    render(
      <MemoryRouter>
        <MindmapView />
      </MemoryRouter>
    )
    expect(screen.getByText('Mindmap')).toBeInTheDocument()
    expect(screen.getByTestId('root-picker')).toBeInTheDocument()
    expect(screen.getByText(/Click to unfold/)).toBeInTheDocument()
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
  })
})
