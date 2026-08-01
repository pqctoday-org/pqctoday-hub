// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, Settings, Copy, Terminal, BookOpen, AlertTriangle, RotateCcw } from 'lucide-react'
import { useOpenSSLStore } from '../store'
import { logEvent } from '../../../utils/analytics'
import { getOpenSSLDocUrl, tokenizeCommand } from '../../../utils/opensslDocsData'
import { Button } from '@/components/ui/button'

interface WorkbenchPreviewProps {
  category: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  skeyParams?: Record<string, any>
  // Sourced once from useOpenSSL() at the OpenSSLStudioView level (not
  // called here) so the Learn tab can share the exact same worker/WASM
  // instance instead of each tab mounting its own and reloading on switch.
  executeCommand: (cmdOverride?: string) => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeSkey: (opType: 'create' | 'derive', params: Record<string, any>) => Promise<void>
  retryLoad: () => void
}

export const WorkbenchPreview: React.FC<WorkbenchPreviewProps> = ({
  category,
  skeyParams,
  executeCommand,
  executeSkey,
  retryLoad,
}) => {
  const { isProcessing, command, isReady, loadError } = useOpenSSLStore()

  const handleRun = () => {
    if (category === 'skey' && skeyParams) {
      executeSkey(skeyParams.opType, skeyParams)
    } else {
      executeCommand(command)
    }
    logEvent('OpenSSL Studio', 'Run Command', category)
  }

  if (category === 'files') return null

  return (
    <div className="my-auto flex flex-col gap-4">
      {/* Command Preview */}
      <div className="glass-panel overflow-hidden max-md:overflow-x-auto shrink-0 flex flex-col">
        <div className="p-2 pl-3 border-b border-border bg-muted/20 flex items-center max-md:flex-wrap justify-between gap-4">
          <h4 className="font-bold text-foreground flex items-center gap-2 text-sm whitespace-nowrap">
            <Terminal size={14} />
            Command Preview
          </h4>

          <div className="flex items-center gap-2">
            <a
              href={getOpenSSLDocUrl(command)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors hover:bg-muted rounded border border-transparent hover:border-border"
              title="View OpenSSL Documentation"
            >
              <BookOpen size={14} />
              <span className="hidden sm:inline">Docs</span>
            </a>

            {loadError ? (
              <Button
                variant="ghost"
                onClick={retryLoad}
                title={loadError}
                className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 shrink-0"
              >
                <AlertTriangle size={13} />
                WASM failed to load
                <RotateCcw size={12} />
              </Button>
            ) : category === 'lms' ? (
              <span className="text-xs text-status-warning px-4 py-1.5 bg-status-warning/10 border border-status-warning/20 rounded">
                Use WASM buttons in config panel ↑
              </span>
            ) : (
              <Button
                variant="ghost"
                onClick={handleRun}
                disabled={isProcessing || !isReady || !command.trim()}
                className="btn-primary flex items-center gap-2 px-4 py-1.5 text-xs font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isProcessing ? (
                  <Settings className="animate-spin w-3 h-3" />
                ) : !isReady ? (
                  <Settings className="animate-spin w-3 h-3" />
                ) : (
                  <Play fill="currentColor" className="w-3 h-3" />
                )}
                {!isReady ? 'Initializing...' : 'Run Command'}
              </Button>
            )}
          </div>
        </div>

        {category === 'pkcs11' && !command && !loadError && (
          <div className="px-3 py-2 bg-muted/40 border-b border-border text-xs text-muted-foreground">
            Generate a key in the token first (config panel above), then pick an operation.
          </div>
        )}

        {loadError && (
          <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20 text-xs text-destructive flex items-start gap-2">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              The OpenSSL WASM engine failed to load, so commands can&apos;t run in this session.
              {loadError && <span className="block text-destructive/70 mt-0.5">{loadError}</span>}
              Click &ldquo;WASM failed to load&rdquo; above to retry, or reload the page.
            </span>
          </div>
        )}

        <div className="p-4 bg-muted/40 flex gap-3 group min-h-[80px] sm:min-h-[160px] relative">
          <code className="text-primary flex-1 break-all font-mono text-sm leading-relaxed whitespace-pre-wrap">
            ${' '}
            {tokenizeCommand(command).map((tok, i) =>
              tok.hint ? (
                <span
                  key={i}
                  title={tok.hint}
                  className="underline decoration-dotted decoration-primary/40 cursor-help"
                >
                  {tok.text}
                </span>
              ) : (
                <React.Fragment key={i}>{tok.text}</React.Fragment>
              )
            )}
          </code>
          <Button
            variant="ghost"
            onClick={() => navigator.clipboard.writeText(command)}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground absolute top-3 right-3 p-1.5 hover:bg-muted rounded"
            title="Copy to clipboard"
          >
            <Copy size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
