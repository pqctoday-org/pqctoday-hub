// SPDX-License-Identifier: GPL-3.0-only
/**
 * Sandbox orchestrator client.
 *
 * In **local dev** the pqctoday-sandbox stack runs via docker-compose on a
 * single origin (VITE_SANDBOX_BASE_URL, default http://localhost:4000) and
 * every user hits the same shared instance.
 *
 * In **hosted mode** an orchestrator backend hands out per-user sessions:
 * it pulls the GHCR images (ghcr.io/pqctoday/pqctoday-sandbox/<service>),
 * starts a dedicated container (or namespace), and returns a session URL.
 * That backend is referenced via VITE_SANDBOX_ORCHESTRATOR_URL.
 *
 * This module abstracts both paths behind {@link resolveSandboxSession}. If
 * no orchestrator is configured it resolves to the static base URL, so the
 * SPA works in "local compose" and "hosted on-demand" with the same code.
 *
 * Backend contract (when VITE_SANDBOX_ORCHESTRATOR_URL is set):
 *   POST {orchestrator}/sessions  body: { scenarioId, userId? }
 *     → 200 { sessionId, baseUrl, expiresAt, vendorId?, vendorName?, userId? }
 *     → 4xx/5xx { error: string }
 *
 * See pqctoday-sandbox/docs/orchestrator-api.md for the full spec.
 */

export interface SandboxSession {
  /** Origin that hosts the sandbox UI + /api/* for this session. */
  baseUrl: string
  /** Opaque identifier — logged + embedded in postMessage config. */
  sessionId?: string
  /** Epoch millis; after this the orchestrator may reap the container. */
  expiresAt?: number
  /** For postMessage EmbedConfig — identifies the vendor namespace. */
  vendorId?: string
  vendorName?: string
  /** End-user identifier (anonymous or signed-in). */
  userId?: string
}

interface ResolveOpts {
  scenarioId: string
  fallbackBaseUrl: string
  userId?: string
}

interface OrchestratorResponse {
  sessionId?: string
  baseUrl?: string
  expiresAt?: number
  vendorId?: string
  vendorName?: string
  userId?: string
  error?: string
}

const REQUEST_TIMEOUT_MS = 5000

function getOrchestratorUrl(): string | null {
  const raw = import.meta.env.VITE_SANDBOX_ORCHESTRATOR_URL as string | undefined
  const trimmed = (raw ?? '').trim()
  return trimmed.length > 0 ? trimmed.replace(/\/$/, '') : null
}

export async function resolveSandboxSession(opts: ResolveOpts): Promise<SandboxSession> {
  const orchestrator = getOrchestratorUrl()
  if (!orchestrator) {
    return { baseUrl: opts.fallbackBaseUrl }
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(`${orchestrator}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: opts.scenarioId, userId: opts.userId }),
      signal: ctrl.signal,
    })
    if (!res.ok) {
      throw new Error(`orchestrator HTTP ${res.status}`)
    }
    const data = (await res.json()) as OrchestratorResponse
    if (!data.baseUrl) {
      throw new Error('orchestrator response missing baseUrl')
    }
    return {
      baseUrl: data.baseUrl.replace(/\/$/, ''),
      sessionId: data.sessionId,
      expiresAt: data.expiresAt,
      vendorId: data.vendorId,
      vendorName: data.vendorName,
      userId: data.userId,
    }
  } finally {
    clearTimeout(timer)
  }
}
