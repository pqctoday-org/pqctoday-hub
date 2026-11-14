// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { RouteRelated } from './RouteRelated'
import { RouteNextStep } from './RouteNextStep'
import { usePersonaStore } from '@/store/usePersonaStore'
import { ROUTE_SHARE } from '@/data/routePageMeta'

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <RouteRelated mobile={false} />
      <RouteNextStep mobile={false} />
    </MemoryRouter>
  )
}

describe('Home first-run role picker shows no related / next-step blocks', () => {
  beforeEach(() => {
    usePersonaStore.setState({ selectedPersona: null, hasSkippedPersonalization: false })
  })

  it('renders nothing under the role picker', () => {
    const { container } = renderHome()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders them once a role is picked', () => {
    usePersonaStore.setState({ selectedPersona: 'developer' })
    const { container } = renderHome()
    expect(container).not.toBeEmptyDOMElement()
  })

  it('renders them after "Show me everything"', () => {
    usePersonaStore.setState({ hasSkippedPersonalization: true })
    const { container } = renderHome()
    expect(container).not.toBeEmptyDOMElement()
    expect(screen.queryAllByRole('link').length).toBeGreaterThan(0)
  })

  it('Home has its own share title and text', () => {
    expect(ROUTE_SHARE['/']?.title).toBeTruthy()
    expect(ROUTE_SHARE['/']?.text).toBeTruthy()
  })
})
