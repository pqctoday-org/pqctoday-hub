import { useEffect, useRef, useState } from 'react'
import { useOpenSSLStore } from './store'
import { Trash2 } from 'lucide-react'
import clsx from 'clsx'

export const TerminalOutput = () => {
  const { logs, clearTerminalLogs } = useOpenSSLStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showStdout, setShowStdout] = useState(true)
  const [showStderr, setShowStderr] = useState(true)
  const [showDebug, setShowDebug] = useState(false)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, showStdout, showStderr, showDebug])

  const filteredLogs = logs.filter((log) => {
    const isDebug = log.message.startsWith('[Debug]')
    if (isDebug) return showDebug

    if (log.type === 'stdout' || log.type === 'info') return showStdout
    if (log.type === 'stderr' || log.type === 'error') return showStderr

    return true
  })

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border border-border overflow-hidden font-mono text-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border shrink-0">
        {/* Toggles */}
        <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-lg">
          <label
            className={clsx(
              'flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors select-none',
              showStdout
                ? 'bg-muted text-status-success'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <input
              type="checkbox"
              checked={showStdout}
              onChange={(e) => setShowStdout(e.target.checked)}
              className="w-3 h-3 rounded border-border bg-muted/50 text-status-success focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider">Stdout</span>
          </label>

          <label
            className={clsx(
              'flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors select-none',
              showStderr
                ? 'bg-muted text-status-error'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <input
              type="checkbox"
              checked={showStderr}
              onChange={(e) => setShowStderr(e.target.checked)}
              className="w-3 h-3 rounded border-border bg-muted/50 text-status-error focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider">Stderr</span>
          </label>

          <label
            className={clsx(
              'flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors select-none',
              showDebug
                ? 'bg-muted text-status-info'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
              className="w-3 h-3 rounded border-border bg-muted/50 text-status-info focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider">Debug</span>
          </label>
        </div>

        <button
          onClick={clearTerminalLogs}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <Trash2 size={12} /> Clear
        </button>
      </div>

      {/* Logs Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar bg-background/50 min-w-0"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-foreground/20 italic text-center mt-10">
            {logs.length === 0 ? 'Ready to execute commands...' : 'No output in this stream.'}
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-fixed">
            <colgroup>
              <col className="w-40" />
              <col className="w-auto" />
            </colgroup>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-1 text-foreground/30 align-top whitespace-nowrap font-mono text-[10px] select-none border-r border-border">
                    [{log.timestamp}]
                  </td>
                  <td
                    className={clsx(
                      'px-3 py-1 align-top font-mono leading-tight break-all whitespace-pre-wrap text-[11px]',
                      log.type === 'error'
                        ? 'text-status-error'
                        : log.type === 'info'
                          ? 'text-status-info'
                          : 'text-foreground/80'
                    )}
                  >
                    {log.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
