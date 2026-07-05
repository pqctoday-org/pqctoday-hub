// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MermaidDiagram } from './MermaidDiagram'

const renderMock = vi.fn()
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: (...args: unknown[]) => renderMock(...args),
  },
}))

describe('MermaidDiagram', () => {
  it('shows a loading message, then the rendered SVG once mermaid resolves', async () => {
    renderMock.mockResolvedValueOnce({ svg: '<svg data-testid="fake-svg"></svg>' })
    render(<MermaidDiagram source="flowchart TB" id="test" />)
    expect(screen.getByText(/Rendering diagram/i)).toBeInTheDocument()
    expect(await screen.findByRole('img')).toBeInTheDocument()
    expect(screen.queryByText(/Rendering diagram/i)).not.toBeInTheDocument()
  })

  it('falls back to a friendly message when mermaid.render rejects', async () => {
    renderMock.mockRejectedValueOnce(new Error('bad syntax'))
    render(<MermaidDiagram source="flowchart TB" id="test-fail" />)
    expect(await screen.findByText(/couldn.t render/i)).toBeInTheDocument()
  })

  it("uses the provided summary as the diagram's accessible label", async () => {
    renderMock.mockResolvedValueOnce({ svg: '<svg></svg>' })
    render(
      <MermaidDiagram
        source="flowchart TB"
        id="test-a11y"
        summary="small architecture: 2 of 6 migrated"
      />
    )
    expect(
      await screen.findByRole('img', { name: /small architecture: 2 of 6 migrated/ })
    ).toBeInTheDocument()
  })

  it('does not show the scroll hint when the diagram fits its container', async () => {
    renderMock.mockResolvedValueOnce({ svg: '<svg></svg>' })
    render(<MermaidDiagram source="flowchart TB" id="test-fit" />)
    expect(await screen.findByRole('img')).toBeInTheDocument()
    expect(screen.queryByText(/scroll to see the full diagram/i)).not.toBeInTheDocument()
  })

  it('shows the scroll hint when the rendered diagram overflows its container', async () => {
    // jsdom never lays out real content, so scrollWidth/clientWidth are stubbed
    // at the prototype level to simulate an overflowing diagram.
    const scrollWidth = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(900)
    const clientWidth = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
    try {
      renderMock.mockResolvedValueOnce({ svg: '<svg></svg>' })
      render(<MermaidDiagram source="flowchart TB" id="test-overflow" />)
      expect(await screen.findByText(/scroll to see the full diagram/i)).toBeInTheDocument()
    } finally {
      scrollWidth.mockRestore()
      clientWidth.mockRestore()
    }
  })
})
