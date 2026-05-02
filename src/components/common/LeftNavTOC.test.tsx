// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeftNavTOC } from './LeftNavTOC'

describe('LeftNavTOC', () => {
  const groups = [
    {
      id: 'fin',
      label: 'Finance',
      items: [
        { id: 'FIN-001', label: 'BIS Project Leap' },
        { id: 'FIN-002', label: 'HNDL on settlement records', hint: 'Severity 90' },
      ],
    },
    {
      id: 'cloud',
      label: 'Cloud',
      items: [{ id: 'CLOUD-004', label: 'Cloud HSM and KMS gap' }],
    },
  ]

  it('renders group labels when there are multiple groups', () => {
    render(
      <LeftNavTOC
        groups={groups}
        activeItemId={null}
        onSelect={vi.fn()}
        targetPrefix="threats-toc"
      />
    )
    expect(screen.getByText('Finance')).toBeInTheDocument()
    expect(screen.getByText('Cloud')).toBeInTheDocument()
  })

  it('hides group label when there is only one group', () => {
    render(
      <LeftNavTOC
        groups={[groups[0]]}
        activeItemId={null}
        onSelect={vi.fn()}
        targetPrefix="threats-toc"
      />
    )
    // Item labels visible
    expect(screen.getByText('BIS Project Leap')).toBeInTheDocument()
    // Group label not rendered as a heading chip
    expect(screen.queryByText('Finance')).not.toBeInTheDocument()
  })

  it('emits the data-workshop-target attribute on each item', () => {
    render(
      <LeftNavTOC
        groups={groups}
        activeItemId={null}
        onSelect={vi.fn()}
        targetPrefix="threats-toc"
      />
    )
    expect(
      document.querySelector('[data-workshop-target="threats-toc-FIN-001"]')
    ).toBeInTheDocument()
    expect(
      document.querySelector('[data-workshop-target="threats-toc-CLOUD-004"]')
    ).toBeInTheDocument()
  })

  it('marks the active item with aria-current=true', () => {
    render(
      <LeftNavTOC
        groups={groups}
        activeItemId="FIN-002"
        onSelect={vi.fn()}
        targetPrefix="threats-toc"
      />
    )
    const active = document.querySelector('[aria-current="true"]')
    expect(active?.textContent).toContain('HNDL on settlement records')
  })

  it('calls onSelect with the item id when clicked', async () => {
    const onSelect = vi.fn()
    render(
      <LeftNavTOC
        groups={groups}
        activeItemId={null}
        onSelect={onSelect}
        targetPrefix="threats-toc"
      />
    )
    await userEvent.click(screen.getByText('BIS Project Leap'))
    expect(onSelect).toHaveBeenCalledWith('FIN-001')
  })

  it('shows the empty message when no groups have items', () => {
    render(
      <LeftNavTOC
        groups={[]}
        activeItemId={null}
        onSelect={vi.fn()}
        targetPrefix="threats-toc"
        emptyMessage="Nothing matches"
      />
    )
    expect(screen.getByText('Nothing matches')).toBeInTheDocument()
  })
})
