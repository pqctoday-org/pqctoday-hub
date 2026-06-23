// SPDX-License-Identifier: GPL-3.0-only
/**
 * useSandboxAvailable — is a live Docker sandbox actually reachable right now?
 *
 * The sandbox labs (SandboxScenarioEmbed) only work when a sandbox backend is
 * started and enabled. On the static live site there is none, so the simulation
 * must surface its scenario steps as LOCKED (and never auto-complete them) rather
 * than show a broken "set VITE_SANDBOX_BASE_URL" panel. This hook gives a single
 * cheap, reachability-based signal for that gate.
 *
 * "Available" = the resolved base URL answers its health check. Env presence alone
 * is not enough (VITE_SANDBOX_BASE_URL defaults to localhost), so we probe; on the
 * live site the probe fails fast (connection refused) → 'unavailable'.
 */
import { useEffect, useState } from 'react'

export type SandboxAvailability = 'checking' | 'available' | 'unavailable'

const DEFAULT_BASE_URL = 'http://localhost:4000'
const HEALTH_PATH = '/api/status'
const TIMEOUT_MS = 3000

function resolveBaseUrl(): string | null {
  const raw = (import.meta.env.VITE_SANDBOX_BASE_URL as string | undefined) ?? DEFAULT_BASE_URL
  const trimmed = raw.trim().replace(/\/$/, '')
  return trimmed.length > 0 ? trimmed : null
}

export function useSandboxAvailable(): SandboxAvailability {
  // Decide the starting state in a lazy initializer (not a synchronous setState in
  // the effect): no base URL configured → 'unavailable' up front; else 'checking'
  // until the health probe answers.
  const [state, setState] = useState<SandboxAvailability>(() =>
    resolveBaseUrl() ? 'checking' : 'unavailable'
  )

  useEffect(() => {
    const baseUrl = resolveBaseUrl()
    if (!baseUrl) return // stays 'unavailable'
    let cancelled = false
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    fetch(`${baseUrl}${HEALTH_PATH}`, { mode: 'cors', signal: ctrl.signal })
      .then(() => {
        if (!cancelled) setState('available')
      })
      .catch(() => {
        if (!cancelled) setState('unavailable')
      })
      .finally(() => clearTimeout(timer))
    return () => {
      cancelled = true
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [])

  return state
}
