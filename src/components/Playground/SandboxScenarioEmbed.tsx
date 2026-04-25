// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ExternalLink, ServerCrash, Container } from 'lucide-react'
import { buttonVariants } from '../ui/button-variants'
import { Skeleton } from '../ui/skeleton'
import { EmptyState } from '../ui/empty-state'
import { SANDBOX_SCENARIOS, SANDBOX_TRACKS } from '@/data/sandboxScenarios'
import { resolveSandboxSession } from '@/services/sandboxOrchestrator'
import type { SandboxSession } from '@/services/sandboxOrchestrator'

const DEFAULT_BASE_URL = 'http://localhost:4000'
const HEALTH_PATH = '/api/status'
const REACHABILITY_TIMEOUT_MS = 3000
const MIN_HEIGHT = 480
const MAX_HEIGHT = 1600
const TOOL_ID_PREFIX = 'sbx-'

type Reachability = 'checking' | 'reachable' | 'unreachable' | 'unset'

function useSandboxStaticBaseUrl(): string | null {
  const raw = import.meta.env.VITE_SANDBOX_BASE_URL as string | undefined
  const trimmed = (raw ?? DEFAULT_BASE_URL).trim()
  return trimmed.length > 0 ? trimmed.replace(/\/$/, '') : null
}

function useOrchestratorConfigured(): boolean {
  const raw = import.meta.env.VITE_SANDBOX_ORCHESTRATOR_URL as string | undefined
  return (raw ?? '').trim().length > 0
}

interface EmbedConfigPayload {
  vendorId: string
  vendorName: string
  userId: string
  scenarioId: string
  allowedRoutes: string[]
  allowedOrigins: string[]
  theme: 'dark' | 'light'
  persona?: string
  sessionId?: string
  expiresAt?: number
}

export function SandboxScenarioEmbed() {
  const { toolId } = useParams<{ toolId: string }>()
  const scenarioId = toolId?.startsWith(TOOL_ID_PREFIX)
    ? toolId.slice(TOOL_ID_PREFIX.length)
    : toolId
  const scenario = useMemo(() => SANDBOX_SCENARIOS.find((s) => s.id === scenarioId), [scenarioId])
  const track = useMemo(() => SANDBOX_TRACKS.find((t) => t.id === scenario?.trackId), [scenario])

  const staticBaseUrl = useSandboxStaticBaseUrl()
  const orchestratorConfigured = useOrchestratorConfigured()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [height, setHeight] = useState<number>(720)
  const [session, setSession] = useState<SandboxSession | null>(null)
  const [reach, setReach] = useState<Reachability>(staticBaseUrl ? 'checking' : 'unset')
  const [ready, setReady] = useState(false)

  // Resolve the base URL: either a per-user session from the orchestrator backend
  // or the static VITE_SANDBOX_BASE_URL for local dev.
  useEffect(() => {
    if (!scenario || !staticBaseUrl) return
    let cancelled = false
    resolveSandboxSession({ scenarioId: scenario.id, fallbackBaseUrl: staticBaseUrl })
      .then((s) => {
        if (!cancelled) setSession(s)
      })
      .catch(() => {
        if (!cancelled) setReach('unreachable')
      })
    return () => {
      cancelled = true
    }
  }, [scenario, staticBaseUrl])

  const baseUrl = session?.baseUrl ?? null

  const targetOrigin = useMemo(() => {
    if (!baseUrl) return null
    try {
      return new URL(baseUrl).origin
    } catch {
      return null
    }
  }, [baseUrl])

  useEffect(() => {
    if (!baseUrl) return
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), REACHABILITY_TIMEOUT_MS)
    fetch(`${baseUrl}${HEALTH_PATH}`, { mode: 'no-cors', signal: ctrl.signal })
      .then(() => setReach('reachable'))
      .catch(() => setReach('unreachable'))
      .finally(() => clearTimeout(timer))
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [baseUrl])

  useEffect(() => {
    if (!targetOrigin || !scenario || !session) return

    const configPayload: EmbedConfigPayload = {
      vendorId: session.vendorId ?? 'pqctoday-hub',
      vendorName: session.vendorName ?? 'PQC Timeline App',
      userId: session.userId ?? 'anonymous',
      scenarioId: scenario.id,
      allowedRoutes: [`/embed/scenario/${scenario.id}`, '/embed'],
      allowedOrigins: [window.location.origin],
      theme: document.documentElement.classList.contains('light') ? 'light' : 'dark',
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
    }

    const handler = (event: MessageEvent) => {
      if (event.origin !== targetOrigin) return
      const data = event.data as { type?: string; height?: number } | null
      if (!data || typeof data.type !== 'string') return
      if (data.type === 'pqc:ready') {
        setReady(true)
        const source = event.source as Window | null
        // pqc:challenge — host-authorisation ack (kept for future auth mode).
        source?.postMessage({ type: 'pqc:challenge' }, targetOrigin)
        // pqc:config — carries per-session embed config (no JWT; cleartext for now).
        source?.postMessage({ type: 'pqc:config', config: configPayload }, targetOrigin)
        return
      }
      if (data.type === 'pqc:resize' && typeof data.height === 'number') {
        const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(data.height)))
        setHeight(next)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [targetOrigin, scenario, session])

  if (!scenarioId || !scenario) {
    return (
      <EmptyState
        icon={<ServerCrash className="w-6 h-6" />}
        title="Unknown sandbox scenario"
        description={`No scenario matches id "${scenarioId ?? ''}". Regenerate the manifest via npm run sync:sandbox.`}
      />
    )
  }

  if (reach === 'unset') {
    return (
      <EmptyState
        icon={<Container className="w-6 h-6" />}
        title="Sandbox URL not configured"
        description="Set VITE_SANDBOX_BASE_URL in your .env file (default http://localhost:4000) and restart the dev server."
      />
    )
  }

  if (reach === 'unreachable') {
    const description = orchestratorConfigured
      ? 'The sandbox orchestrator did not respond. Check that pqctoday-orchestrator is running (npm run dev) and VITE_SANDBOX_ORCHESTRATOR_URL is correct.'
      : 'Start the Docker stack: cd ~/antigravity/pqctoday-sandbox && docker compose up -d. Then reload this page.'
    return (
      <EmptyState
        icon={<ServerCrash className="w-6 h-6" />}
        title="pqctoday-sandbox is not reachable"
        description={description}
      />
    )
  }

  if (!baseUrl) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg border border-border bg-background">
        <div className="absolute inset-0 space-y-3 p-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  const embedUrl = `${baseUrl}/embed/scenario/${encodeURIComponent(scenario.id)}`
  const openUrl = `${baseUrl}/scenario/${encodeURIComponent(scenario.id)}`

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-lg p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">
              <span className="mr-2" aria-hidden="true">
                {scenario.emoji}
              </span>
              {scenario.title}
            </h2>
            {track && (
              <p className="mt-1 text-sm text-muted-foreground">
                {track.label} · {track.subtitle}
              </p>
            )}
            <p className="mt-2 text-sm text-foreground/80">{scenario.useCase}</p>
            {scenario.algorithms.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {scenario.algorithms.map((alg) => (
                  <span
                    key={alg}
                    className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {alg}
                  </span>
                ))}
              </div>
            )}
          </div>
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Open in sandbox
          </a>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg border border-border bg-background">
        {!ready && (
          <div className="absolute inset-0 space-y-3 p-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          title={`pqctoday-sandbox scenario: ${scenario.title}`}
          src={embedUrl}
          data-scenario-id={scenario.id}
          className="block w-full"
          style={{ height }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"
          allow="clipboard-write"
          loading="lazy"
        />
      </div>
    </div>
  )
}

export default SandboxScenarioEmbed
