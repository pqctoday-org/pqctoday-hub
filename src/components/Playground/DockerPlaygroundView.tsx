// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { Server, Container } from 'lucide-react'
import { EmptyState } from '../ui/empty-state'
import { Card } from '../ui/card'

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
    if (!targetOrigin) return

    const configPayload: EmbedConfigPayload = {
      vendorId: 'pqc-timeline-app',
      vendorName: 'PQC Timeline App',
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
  }, [targetOrigin])

  if (!baseUrl) {
    return (
      <Card className="p-6 min-h-[60vh] flex items-center justify-center">
        <EmptyState
          icon={<Container className="w-6 h-6" />}
          title="Sandbox URL not configured"
          description="Set VITE_SANDBOX_BASE_URL in your .env file (default http://localhost:4000) and restart the dev server."
        />
      </Card>
    )
  }

  const embedUrl = `${baseUrl}/embed`

  return (
    <Card className="p-3 md:p-6 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
        <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Server className="text-primary" aria-hidden="true" />
          Enterprise Docker Simulation
        </h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          Sandbox
        </span>
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
    </Card>
  )
}
