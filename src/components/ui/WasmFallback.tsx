// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Card, CardContent } from './Card'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { useLocation } from 'react-router-dom'

export function WasmFallback({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isIsolated =
    typeof window !== 'undefined' && typeof window.crossOriginIsolated !== 'undefined'
      ? window.crossOriginIsolated
      : false

  if (isIsolated) {
    return <>{children}</>
  }

  // Generate public URL matching current path (assuming the embed strips /embed/)
  const publicUrl = `https://pqctoday.com${location.pathname}`

  return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center p-6 bg-background/50">
      <Card className="max-w-md w-full shadow-lg border-primary/20">
        <CardContent className="pt-8 pb-8 px-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-status-warning/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-status-warning" />
          </div>

          <h2 className="text-xl font-bold mb-3 tracking-tight">Advanced Cryptographic Tool</h2>

          <p className="text-muted-foreground mb-8 text-sm">
            This module requires direct access to hardware resources using WebAssembly threads. Due
            to strict browser security policies, it cannot be run embedded in a third-party website.
          </p>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 py-2"
          >
            Open on PQC Today
            <ExternalLink className="ml-2 w-4 h-4" />
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
