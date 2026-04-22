// SPDX-License-Identifier: GPL-3.0-only
/**
 * Minimal client for the pqctoday-sandbox orchestrator VPN scenario.
 *
 * Contract: POST {orchestratorUrl}/sessions {scenarioId: 'vpn', userId}
 *           → { sessionId, baseUrl, expiresAt, ... }
 *
 * The user opens `baseUrl` in a new tab to exercise the full-fidelity
 * Docker-based VPN scenario (real strongSwan 6.0.5 + softhsmv3 + netns).
 * See pqctoday-sandbox/docs/orchestrator-api.md for the full contract.
 */

export interface SandboxSession {
  sessionId: string
  baseUrl: string
  expiresAt: number
  vendorId?: string
  vendorName?: string
  userId?: string
}

const SCENARIO_ID = 'vpn'

export function getOrchestratorUrl(): string | null {
  const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env
  const url = env?.VITE_SANDBOX_ORCHESTRATOR_URL
  return url && url.trim().length > 0 ? url.replace(/\/+$/, '') : null
}

export function isSandboxAvailable(): boolean {
  return getOrchestratorUrl() !== null
}

export async function requestVpnSandboxSession(userId = 'anonymous'): Promise<SandboxSession> {
  const base = getOrchestratorUrl()
  if (!base) {
    throw new Error(
      'Sandbox orchestrator URL is not configured. Set VITE_SANDBOX_ORCHESTRATOR_URL in the build environment.'
    )
  }
  const res = await fetch(`${base}/sessions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scenarioId: SCENARIO_ID, userId }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Sandbox orchestrator returned ${res.status}: ${body || res.statusText}`)
  }
  return (await res.json()) as SandboxSession
}

export async function launchFullFidelityVpn(): Promise<void> {
  const session = await requestVpnSandboxSession()
  window.open(session.baseUrl, '_blank', 'noopener,noreferrer')
}
