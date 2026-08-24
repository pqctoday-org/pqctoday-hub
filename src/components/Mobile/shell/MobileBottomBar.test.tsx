// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { MobileBottomBar } from './MobileBottomBar'
import { mobileGroupIdForPath } from './mobileNavGroups'
import { FOR_YOU_GROUP_LABELS } from '@/components/Layout/railNav'

function renderBar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <MobileBottomBar persona={null} />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('MobileBottomBar', () => {
  it('renders exactly five tabs: Home, Learn, Workflow, Practice, Reference', () => {
    renderBar()
    for (const label of ['Home', 'Learn', 'Workflow', 'Practice', 'Reference']) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument()
    }
  })

  it('marks Home as the current page at "/"', () => {
    renderBar('/')
    expect(screen.getByRole('button', { name: /Home/ })).toHaveAttribute('aria-current', 'page')
  })

  it('marks Learn as the current page under /learn/*', () => {
    renderBar('/learn/pqc-101')
    expect(screen.getByRole('button', { name: /Learn/ })).toHaveAttribute('aria-current', 'page')
  })

  it('opens the Reference group panel on tap, closed by default', () => {
    renderBar()
    expect(screen.queryByTestId('mobile-group-panel-reference')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Reference/ }))
    expect(screen.getByTestId('mobile-group-panel-reference')).toBeInTheDocument()
  })

  it('only one group panel is open at a time', () => {
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Workflow/ }))
    expect(screen.getByTestId('mobile-group-panel-workflow')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Practice/ }))
    expect(screen.queryByTestId('mobile-group-panel-workflow')).not.toBeInTheDocument()
    expect(screen.getByTestId('mobile-group-panel-practice')).toBeInTheDocument()
  })

  // 2026-08-24 audit R5: a group tab used to light up only while its OWN
  // sheet was open — landing on a route that belongs to a group any other
  // way (deep link, a card tap) left every tab dark. Real path: '/timeline'
  // is a documented Reference-group addition (mobileNavGroups.ts).
  it('lights up the real owning group tab when the current route belongs to one, with no sheet open', () => {
    const groupId = mobileGroupIdForPath('/timeline')!
    expect(groupId).toBeDefined()
    renderBar('/timeline')
    const label = FOR_YOU_GROUP_LABELS[groupId]
    const tab = screen.getByRole('button', { name: new RegExp(label) })
    expect(tab).toHaveClass('text-primary')
    expect(screen.queryByTestId(`mobile-group-panel-${groupId}`)).not.toBeInTheDocument()
  })

  it('does not light up a group tab on a route that belongs to none of the three groups', () => {
    renderBar('/')
    for (const label of ['Workflow', 'Practice', 'Reference']) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).not.toHaveClass(
        'text-primary'
      )
    }
  })
})
