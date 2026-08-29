// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { Server, Container, ServerCrash, ExternalLink } from 'lucide-react'
import { EmptyState } from '../ui/empty-state'
import { Card } from '../ui/card'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { useSandboxAvailable } from './useSandboxAvailable'
import { SANDBOX_ACCESS_URL } from './cryptoLabMeta'

const DEFAULT_BASE_URL = 'http://localhost:4000'
const MIN_HEIGHT = 600
const MAX_HEIGHT = 1600

interface EmbedConfigPayload {
  vendorId: string
  vendorName: string
  userId: string
  allowedRoutes: string[]
  allowedOrigins: string[]
  theme: 'dark' | 'light'
}

export const DockerPlaygroundView = () => {
  const raw = import.meta.env.VITE_SANDBOX_BASE_URL as string | undefined
  const baseUrl = (raw ?? DEFAULT_BASE_URL).trim().replace(/\/$/, '') || null
  const availability = useSandboxAvailable()

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [height, setHeight] = useState<number>(720)

  const targetOrigin = baseUrl
    ? (() => {
        try {
          return new URL(baseUrl).origin
        } catch {
          return null
        }
      })()
    : null

  useEffect(() => {
    if (!targetOrigin || availability !== 'available') return

    const configPayload: EmbedConfigPayload = {
      vendorId: 'pqctoday-hub',
      vendorName: 'PQC Today Hub',
      userId: 'anonymous',
      allowedRoutes: ['/*'],
      allowedOrigins: ['*'],
      theme: document.documentElement.classList.contains('light') ? 'light' : 'dark',
    }

    const handler = (event: MessageEvent) => {
      if (event.origin !== targetOrigin) return
      const data = event.data as { type?: string; height?: number } | null
      if (!data || typeof data.type !== 'string') return
      if (data.type === 'pqc:ready') {
        const source = event.source as Window | null
        source?.postMessage({ type: 'pqc:challenge' }, targetOrigin)
        source?.postMessage({ type: 'pqc:config', config: configPayload }, targetOrigin)
        return
      }
      if (data.type === 'pqc:resize' && typeof data.height === 'number') {
        setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(data.height))))
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [targetOrigin, availability])

  // Share lives ONLY in the top bar (2026-08-27 remediation) — register this
  // page's title/text so the global ShareButton (MainLayout.tsx) shows the
  // right copy instead of the generic route fallback.
  useEffect(() => {
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      shareTitle: 'Enterprise Docker Simulation — PQC Today',
      shareText: 'Explore the PQC enterprise sandbox simulation',
    })
    return () => clearPageActions()
  }, [])

  if (availability !== 'available' || !baseUrl) {
    return (
      <Card className="p-6 min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <EmptyState
          icon={
            availability === 'checking' ? (
              <Container className="w-6 h-6" />
            ) : (
              <ServerCrash className="w-6 h-6" />
            )
          }
          title={
            availability === 'checking'
              ? 'Checking sandbox…'
              : 'Sandbox scenarios run in a container'
          }
          description={
            availability === 'checking'
              ? 'Checking whether a sandbox container is reachable…'
              : // Visitor-facing copy: the sandbox is unreachable by default for
                // everyone who has not been granted a container, so this string is
                // what most people read. It previously printed a maintainer-only
                // shell command against a local checkout path no visitor has.
                'These scenarios need a Docker container rather than the browser, so they are not available here. Request access below to run them on a hosted container.'
          }
        />
        {availability === 'unavailable' && (
          <a
            href={SANDBOX_ACCESS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/20"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            Request sandbox access
          </a>
        )}
      </Card>
    )
  }

  // Land straight on the Developers catalog — this view's only entry point today
  // is the "Developer Sandbox" card, so opening on Tracks first would just make
  // people click "Developers" again to get where the card already said they'd land.
  const embedUrl = `${baseUrl}/embed/dev`

  return (
    <Card className="p-3 md:p-6 flex flex-col gap-4">
      {/* Hard block below lg — Docker terminal requires a keyboard and mouse */}
      <div className="flex lg:hidden flex-col items-center justify-center gap-4 py-12 text-center">
        <Server className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-foreground">Desktop required</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-[260px]">
            The Docker sandbox requires a full keyboard and mouse. Open this page on a laptop or
            desktop.
          </p>
        </div>
      </div>
      <div className="hidden lg:contents">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
          <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Server className="text-primary" aria-hidden="true" />
            Enterprise Docker Simulation
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Sandbox
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Powered by pqctoday-sandbox — requires the local UI server on port 4000.
        </p>

        <div className="relative w-full overflow-hidden rounded-lg border border-border bg-background">
          <iframe
            ref={iframeRef}
            title="pqctoday-sandbox"
            src={embedUrl}
            className="block w-full"
            style={{ height }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"
            allow="clipboard-write"
          />
        </div>
      </div>
      {/* end hidden lg:contents */}
    </Card>
  )
}
