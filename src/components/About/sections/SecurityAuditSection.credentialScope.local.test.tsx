// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SecurityAuditSection } from './SecurityAuditSection'
import { MobileAboutView } from '@/components/Mobile/screens/MobileAboutView'
import { useChatStore } from '@/store/useChatStore'
import { GoogleDriveService } from '@/services/storage/GoogleDriveService'

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
  useChatStore.getState().setApiKey(null)
  localStorage.removeItem(STORAGE_KEY)
  expect(noNetwork).not.toHaveBeenCalled()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

it('the actual store persists a user-supplied fixture in browser storage independently of a public build identifier', () => {
  localStorage.removeItem(STORAGE_KEY)
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'synthetic-public-client-id')
  expect(GoogleDriveService.isConfigured()).toBe(true)
  useChatStore.getState().setApiKey(FIXTURE_KEY)
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  expect(saved.state.apiKey).toBe(FIXTURE_KEY)
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
  expect(GoogleDriveService.isConfigured()).toBe(false)
  expect(useChatStore.getState().apiKey).toBe(FIXTURE_KEY)
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').state.apiKey).toBe(FIXTURE_KEY)
})

it('the real desktop security section discloses browser keys separately from public build identifiers and secret credentials', async () => {
  render(<SecurityAuditSection />)
  const disclosure = screen.getByText(/User-supplied cloud API keys are saved in browser storage/)
  await waitFor(() => expect(disclosure).toBeVisible())
  expect(disclosure).toHaveTextContent(
    'Public build-time identifiers are distinct from secret credentials'
  )
  expect(
    screen.queryByText(/all credentials.*environment|credentials.*exclusively.*environment/i)
  ).not.toBeInTheDocument()
  expect(screen.getByText(/does not establish OWASP Top 10 compliance/)).toBeInTheDocument()
  expect(screen.queryByText(FIXTURE_KEY)).not.toBeInTheDocument()
})

it('the real phone Trust accordion gives the same credential classification without showing a stored fixture', () => {
  useChatStore.getState().setApiKey(FIXTURE_KEY)
  render(
    <MemoryRouter>
      <MobileAboutView />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByRole('button', { name: /Trust & verification/ }))
  const disclosure = screen.getByText(/User-supplied cloud API keys are saved in browser storage/)
  expect(disclosure).toBeVisible()
  expect(disclosure).toHaveTextContent(
    'public build-time identifiers are distinct from secret credentials'
  )
  expect(
    screen.queryByText(/all credentials.*environment|credentials.*exclusively.*environment/i)
  ).not.toBeInTheDocument()
  expect(screen.queryByText(FIXTURE_KEY)).not.toBeInTheDocument()
})
