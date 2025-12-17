import React from 'react'
import { Play, Settings, Copy, Terminal, BookOpen } from 'lucide-react'
import { useOpenSSLStore } from '../store'
import { useOpenSSL } from '../hooks/useOpenSSL'
import { logEvent } from '../../../utils/analytics'
import { getOpenSSLDocUrl } from '../../../utils/opensslDocsData'

interface WorkbenchPreviewProps {
  category: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  skeyParams?: Record<string, any>
}

export const WorkbenchPreview: React.FC<WorkbenchPreviewProps> = ({ category, skeyParams }) => {
  const { isProcessing, command, isReady } = useOpenSSLStore()
  const { executeCommand, executeSkey } = useOpenSSL()

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
      <div className="glass-panel overflow-hidden shrink-0 flex flex-col">
        <div className="p-2 pl-3 border-b border-border bg-muted/20 flex items-center justify-between gap-4">
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

            {category === 'lms' ? (
              <span className="text-xs text-amber-500 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded">
                Use WASM buttons in config panel ↑
              </span>
            ) : (
              <button
                onClick={handleRun}
                disabled={isProcessing || !isReady}
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
              </button>
            )}
          </div>
        </div>

        <div className="p-4 bg-muted/40 flex gap-3 group min-h-[160px] relative">
          <code className="text-primary flex-1 break-all font-mono text-sm leading-relaxed whitespace-pre-wrap">
            $ {command}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(command)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground absolute top-3 right-3 p-1.5 hover:bg-muted rounded"
            title="Copy to clipboard"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
