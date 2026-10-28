// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('./InteractivePlayground', () => ({
  InteractivePlayground: () => <h1>Interactive Playground (desktop)</h1>,
}))
vi.mock('./MobilePlaygroundOps', () => ({
  MobilePlaygroundOps: () => <p>Phone version</p>,
}))
vi.mock('@/components/shared/EducationNotice', () => ({ EducationNotice: () => null }))

import { PlaygroundView } from './PlaygroundView'

function atWidth(phone: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: phone,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  )
}

describe('PlaygroundView: exactly one of the two versions is in the page', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('on a phone: the phone version and one hidden-from-sight heading naming the page', () => {
    atWidth(true)
    render(
      <MemoryRouter>
        <PlaygroundView />
      </MemoryRouter>
    )
    expect(screen.getByText('Phone version')).toBeInTheDocument()
    expect(screen.queryByText('Interactive Playground (desktop)')).toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Interactive Playground')
  })

  it('on a desktop: the desktop version and its own heading, nothing of the phone version', () => {
    atWidth(false)
    render(
      <MemoryRouter>
        <PlaygroundView />
      </MemoryRouter>
    )
    expect(screen.queryByText('Phone version')).toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Interactive Playground (desktop)'
    )
  })

  it('on a phone, an unknown launch gets the page-level reason once, and the phone version is not shown', () => {
    atWidth(true)
    render(
      <MemoryRouter initialEntries={['/playground/interactive?launchAlgo=Not-An-Algorithm']}>
        <PlaygroundView />
      </MemoryRouter>
    )
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No exact Not-An-Algorithm launch is available in this tool.'
    )
    expect(screen.queryByText('Phone version')).toBeNull()
  })
})
