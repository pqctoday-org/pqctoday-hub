import { useEffect, useRef, useState } from 'react'
import { useOpenSSLStore } from './store'
import { Trash2 } from 'lucide-react'
import clsx from 'clsx'

export const TerminalOutput = () => {
  const { logs, clearTerminalLogs } = useOpenSSLStore()
  const logsEndRef = useRef<HTMLDivElement>(null)
  const [showStdout, setShowStdout] = useState(true)
  const [showStderr, setShowStderr] = useState(true)
  const [showDebug, setShowDebug] = useState(false)

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, showStdout, showStderr, showDebug])

  const filteredLogs = logs.filter((log) => {
    const isDebug = log.message.startsWith('[Debug]')
    if (isDebug) return showDebug

    if (log.type === 'stdout' || log.type === 'info') return showStdout
    if (log.type === 'stderr' || log.type === 'error') return showStderr

    return true
  })

  return (
    <div className="h-full flex flex-col bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden font-mono text-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 shrink-0">
        {/* Toggles */}
        <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg">
          <label
            className={clsx(
              'flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors select-none',
              showStdout
                ? 'bg-white/10 text-green-400'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <input
              type="checkbox"
              checked={showStdout}
              onChange={(e) => setShowStdout(e.target.checked)}
              className="w-3 h-3 rounded border-white/20 bg-black/40 text-green-500 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider">Stdout</span>
          </label>

          <label
            className={clsx(
              'flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors select-none',
              showStderr
                ? 'bg-white/10 text-red-400'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <input
              type="checkbox"
              checked={showStderr}
              onChange={(e) => setShowStderr(e.target.checked)}
              className="w-3 h-3 rounded border-white/20 bg-black/40 text-red-500 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider">Stderr</span>
          </label>

          <label
            className={clsx(
              'flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors select-none',
              showDebug
                ? 'bg-white/10 text-blue-400'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
              className="w-3 h-3 rounded border-white/20 bg-black/40 text-blue-500 focus:ring-0 focus:ring-offset-0"
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
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 min-w-0">
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
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td
                    className="px-3 py-1 text-foreground/30 align-top whitespace-nowrap font-mono text-[10px] select-none border-r border-white/5"
                    style={{ fontSize: '10px', whiteSpace: 'nowrap' }}
                  >
                    [{log.timestamp}]
                  </td>
                  <td
                    className={clsx(
                      'px-3 py-1 align-top font-mono leading-tight',
                      log.type === 'error'
                        ? 'text-red-400'
                        : log.type === 'info'
                          ? 'text-blue-300'
                          : 'text-foreground/80'
                    )}
                    style={{
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      whiteSpace: 'pre-wrap',
                      fontSize: '11px',
                    }}
                  >
                    {log.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  )
}
