// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Loader2, AlertCircle, Shield } from 'lucide-react'
import { Button } from '../ui/button'
import type { WebLLMStatus, WebLLMProgress } from '@/services/chat/WebLLMService'

interface ModelDownloadBannerProps {
  status: WebLLMStatus
  progress: WebLLMProgress | null
  error: string | null
  modelName?: string
  onRetry?: () => void
  onChangeModel?: () => void
}

export const ModelDownloadBanner: React.FC<ModelDownloadBannerProps> = ({
  status,
  progress,
  error,
  modelName,
  onRetry,
  onChangeModel,
}) => {
  // Don't render when ready or idle
  if (status === 'ready' || status === 'idle') return null

  return (
    <div className="mx-4 md:mx-12 mt-3 mb-1" role="status" aria-live="polite">
      <div className="max-w-4xl mx-auto glass-panel rounded-lg p-3 space-y-2 border border-border">
        {status === 'error' ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-status-error">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error ?? 'Failed to load model.'}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              )}
              {onChangeModel && (
                <Button variant="ghost" size="sm" onClick={onChangeModel}>
                  Change Model
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                Open browser console (F12) for full error details.
              </span>
            </div>
          </div>
        ) : status === 'unsupported' ? (
          <div className="flex items-center gap-2 text-sm text-status-warning">
            <AlertCircle size={14} />
            WebGPU is not available. Please use Chrome 113+, Edge 113+, or Safari 18+.
          </div>
        ) : (
          <>
            {modelName && (
              <div className="text-xs font-medium text-foreground">Downloading {modelName}</div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin text-primary shrink-0" />
              <span className="truncate">{progress?.text ?? 'Loading model...'}</span>
            </div>

            {/* Progress bar */}
            {progress && progress.progress > 0 && (
              <div className="w-full h-1.5 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.round(progress.progress * 100)}%` }}
                />
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield size={10} />
              Runs entirely in your browser. No data is sent to any server.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
