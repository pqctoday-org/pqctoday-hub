// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { Cpu } from 'lucide-react'
import { WorkshopShell } from './WorkshopShell'

type TabId = 'learn' | 'operate'

function renderShell(props: { headingLevel?: 'h1' | 'h2'; title?: string } = {}) {
  return render(
    <WorkshopShell<TabId>
      icon={Cpu}
      title={props.title ?? 'A workshop with a rather long title that must not push its neighbours'}
      headingLevel={props.headingLevel}
      tabs={[
        { id: 'learn', label: 'Learn', content: <p>Learn content</p> },
        { id: 'operate', label: 'Operate', content: <p>Operate content</p> },
      ]}
      value="learn"
      onValueChange={() => {}}
      tabListLabel="Workshop tabs"
    />
  )
}

describe('WorkshopShell heading', () => {
  it('is an h1 by default, because the shell is the page header for the workbenches', () => {
    renderShell()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('is an h2 when the containing page already has its own h1', () => {
    renderShell({ headingLevel: 'h2' })
    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
  })

  it('truncates a long title instead of letting it overflow the header', () => {
    renderShell()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(within(heading).getByText(/A workshop with a rather long title/)).toHaveClass('truncate')
  })
})
