// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { SandboxScenarioEmbed } from './SandboxScenarioEmbed'
import { SANDBOX_SCENARIOS } from '@/data/sandboxScenarios'

const firstScenario = SANDBOX_SCENARIOS[0]
const BASE_URL = 'http://localhost:4000'
const BASE_ORIGIN = new URL(BASE_URL).origin

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/playground/:toolId" element={<SandboxScenarioEmbed />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('SandboxScenarioEmbed', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SANDBOX_BASE_URL', BASE_URL)
    // Default: reachability probe succeeds (no-cors fetch always resolves opaquely)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders the iframe with the embed URL derived from the tool id', async () => {
    renderAt(`/playground/sbx-${firstScenario.id}`)
    await waitFor(() => {
      const iframe = document.querySelector('iframe')
      expect(iframe).not.toBeNull()
      expect(iframe?.getAttribute('src')).toContain(
        `/embed/scenario/${encodeURIComponent(firstScenario.id)}`
      )
      expect(iframe?.getAttribute('data-scenario-id')).toBe(firstScenario.id)
    })
  })

  it('sends pqc:challenge and pqc:config in response to pqc:ready from the sandbox origin', async () => {
    renderAt(`/playground/sbx-${firstScenario.id}`)
    const iframe = await waitFor(() => {
      const el = document.querySelector('iframe') as HTMLIFrameElement | null
      expect(el).not.toBeNull()
      return el!
    })

    // resolveSandboxSession is async (even when it short-circuits), so the message
    // handler effect registers one render cycle after the iframe appears. Dispatch
    // the message inside waitFor so it retries until the handler is registered.
    const source = { postMessage: vi.fn() }
    await waitFor(() => {
      source.postMessage.mockClear()
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'pqc:ready' },
          origin: BASE_ORIGIN,
          source: source as unknown as Window,
        })
      )
      expect(source.postMessage).toHaveBeenCalledWith({ type: 'pqc:challenge' }, BASE_ORIGIN)
    })
    const configCall = source.postMessage.mock.calls.find(
      (c) => (c[0] as { type?: string })?.type === 'pqc:config'
    )
    expect(configCall).toBeDefined()
    expect(configCall?.[0]).toMatchObject({
      type: 'pqc:config',
      config: expect.objectContaining({
        scenarioId: firstScenario.id,
        allowedRoutes: expect.arrayContaining([`/embed/scenario/${firstScenario.id}`]),
      }),
    })
    expect(configCall?.[1]).toBe(BASE_ORIGIN)
    expect(iframe).toBeInTheDocument()
  })

  it('ignores messages from a non-sandbox origin', async () => {
    renderAt(`/playground/sbx-${firstScenario.id}`)
    await waitFor(() => expect(document.querySelector('iframe')).not.toBeNull())

    const source = { postMessage: vi.fn() }
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'pqc:ready' },
          origin: 'https://evil.example.com',
          source: source as unknown as Window,
        })
      )
    })

    expect(source.postMessage).not.toHaveBeenCalled()
  })

  it('resizes the iframe in response to pqc:resize messages', async () => {
    renderAt(`/playground/sbx-${firstScenario.id}`)
    const iframe = (await waitFor(() => {
      const el = document.querySelector('iframe')
      expect(el).not.toBeNull()
      return el
    })) as HTMLIFrameElement

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'pqc:resize', height: 950 },
          origin: BASE_ORIGIN,
        })
      )
    })

    await waitFor(() => {
      expect(iframe.style.height).toBe('950px')
    })
  })

  it('clamps the iframe height to the allowed range', async () => {
    renderAt(`/playground/sbx-${firstScenario.id}`)
    const iframe = (await waitFor(() => {
      const el = document.querySelector('iframe')
      expect(el).not.toBeNull()
      return el
    })) as HTMLIFrameElement

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'pqc:resize', height: 10 },
          origin: BASE_ORIGIN,
        })
      )
    })
    await waitFor(() => expect(iframe.style.height).toBe('480px'))

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'pqc:resize', height: 5000 },
          origin: BASE_ORIGIN,
        })
      )
    })
    await waitFor(() => expect(iframe.style.height).toBe('1600px'))
  })

  it('shows a configuration hint when VITE_SANDBOX_BASE_URL is empty', async () => {
    vi.stubEnv('VITE_SANDBOX_BASE_URL', '')
    renderAt(`/playground/sbx-${firstScenario.id}`)
    expect(await screen.findByText(/Sandbox URL not configured/i)).toBeInTheDocument()
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('shows an unreachable message when the status probe fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))
    renderAt(`/playground/sbx-${firstScenario.id}`)
    expect(await screen.findByText(/pqctoday-sandbox is not reachable/i)).toBeInTheDocument()
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('renders an EmptyState for an unknown scenario id', async () => {
    renderAt('/playground/sbx-does-not-exist')
    expect(await screen.findByText(/Unknown sandbox scenario/i)).toBeInTheDocument()
  })
})
