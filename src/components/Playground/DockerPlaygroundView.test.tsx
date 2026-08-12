// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DockerPlaygroundView } from './DockerPlaygroundView'

const BASE_URL = 'http://localhost:4000'

describe('DockerPlaygroundView (playground.md item 2 — reuses useSandboxAvailable)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SANDBOX_BASE_URL', BASE_URL)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows a locked state — not a live iframe — when the sandbox is unreachable (the production condition)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))
    render(<DockerPlaygroundView />)

    await waitFor(() => {
      expect(screen.getByText('Sandbox scenarios run in a container')).toBeInTheDocument()
    })
    expect(document.querySelector('iframe')).toBeNull()
    expect(screen.getByText('Request sandbox access')).toBeInTheDocument()
  })

  it('does not print maintainer-only shell instructions to visitors', async () => {
    // Unreachable is the DEFAULT state for every visitor without a container,
    // so this copy is what most people actually read. It used to tell them to
    // run `docker compose up -d` in `~/antigravity/pqctoday-sandbox` — a local
    // checkout path no visitor has.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))
    render(<DockerPlaygroundView />)

    await waitFor(() => {
      expect(screen.getByText('Request sandbox access')).toBeInTheDocument()
    })
    const text = document.body.textContent ?? ''
    expect(text).not.toContain('docker compose')
    expect(text).not.toContain('~/antigravity')
    expect(text).not.toContain('VITE_SANDBOX_BASE_URL')
  })

  it('renders the live iframe once the sandbox health check succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })))
    render(<DockerPlaygroundView />)

    await waitFor(() => {
      const iframe = document.querySelector('iframe')
      expect(iframe).not.toBeNull()
      expect(iframe?.getAttribute('src')).toBe(`${BASE_URL}/embed/dev`)
    })
  })
})
