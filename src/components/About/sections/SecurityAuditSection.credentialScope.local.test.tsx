// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SecurityAuditSection } from './SecurityAuditSection'
import { MobileAboutView } from '@/components/Mobile/screens/MobileAboutView'

vi.mock('@/hooks/useTheme', () => ({ useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }) }))
vi.mock('@/embed/EmbedProvider', () => ({ useIsEmbedded: () => false }))

const noNetwork = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('Network is outside these synthetic credential tests')
  })
)
beforeEach(() => {
  noNetwork.mockClear()
  vi.stubGlobal('fetch', noNetwork)
})

const FIXTURE_KEY = 'synthetic-browser-key-for-local-test-only'
const STORAGE_KEY = 'pqc-chat-storage'
afterEach(() => {
  localStorage.removeItem(STORAGE_KEY)
  expect(noNetwork).not.toHaveBeenCalled()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

it('the real desktop security section says it holds no secret credentials and separates public build identifiers from them', async () => {
  render(<SecurityAuditSection />)
  const disclosure = screen.getByText(/The site asks for no passwords and saves no secrets/)
  await waitFor(() => expect(disclosure).toBeVisible())
  expect(disclosure).toHaveTextContent('Public build identifiers are not secrets')
  expect(document.body.textContent ?? '').not.toMatch(/user-supplied cloud api keys/i)
  expect(
    screen.queryByText(/all credentials.*environment|credentials.*exclusively.*environment/i)
  ).not.toBeInTheDocument()
  expect(screen.getByText(/does not establish OWASP Top 10 compliance/)).toBeInTheDocument()
  expect(screen.queryByText(FIXTURE_KEY)).not.toBeInTheDocument()
})

it('the real phone Trust accordion gives the same credential classification without showing a stored fixture', () => {
  render(
    <MemoryRouter>
      <MobileAboutView />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByRole('button', { name: /Trust & verification/ }))
  const disclosure = screen.getByText(/The site never asks for passwords or saves secrets/)
  expect(disclosure).toBeVisible()
  expect(disclosure).toHaveTextContent('public build IDs are not secrets')
  expect(
    screen.queryByText(/all credentials.*environment|credentials.*exclusively.*environment/i)
  ).not.toBeInTheDocument()
  expect(screen.queryByText(FIXTURE_KEY)).not.toBeInTheDocument()
})
