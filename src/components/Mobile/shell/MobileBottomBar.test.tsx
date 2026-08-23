// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { MobileBottomBar } from './MobileBottomBar'

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
})
