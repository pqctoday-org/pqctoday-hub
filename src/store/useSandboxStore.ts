// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'

export type SandboxStatus = 'idle' | 'checking' | 'online' | 'offline'

interface SandboxState {
  status: SandboxStatus
  lastChecked: number | null
  error: string | null
  baseUrl: string
  probe: () => Promise<SandboxStatus>
}

const HEALTH_PATH = '/api/status'
const PROBE_TIMEOUT_MS = 3000
const DEFAULT_BASE_URL = 'http://localhost:4000'

function readBaseUrl(): string {
  const raw = import.meta.env.VITE_SANDBOX_BASE_URL as string | undefined
  const trimmed = (raw ?? '').trim()
  const url = trimmed.length > 0 ? trimmed : DEFAULT_BASE_URL
  return url.replace(/\/$/, '')
}

export const useSandboxStore = create<SandboxState>((set, get) => ({
  status: 'idle',
  lastChecked: null,
  error: null,
  baseUrl: readBaseUrl(),
  probe: async () => {
    const baseUrl = get().baseUrl
    set({ status: 'checking', error: null })
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS)
    try {
      await fetch(`${baseUrl}${HEALTH_PATH}`, { mode: 'cors', signal: ctrl.signal })
      set({ status: 'online', error: null, lastChecked: Date.now() })
      return 'online'
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unreachable'
      set({ status: 'offline', error: msg, lastChecked: Date.now() })
      return 'offline'
    } finally {
      clearTimeout(timer)
    }
  },
}))

export function isSandboxAvailable(status: SandboxStatus): boolean {
  return status === 'online'
}
