import { useOpenSSLStore } from './store'
import { Trash2 } from 'lucide-react'
import clsx from 'clsx'

export const LogsTab = () => {
  const { structuredLogs, clearStructuredLogs } = useOpenSSLStore()

  const getPerformanceColor = (ms: number): string => {
    if (ms < 100) return 'text-green-400'
    if (ms < 500) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    // eslint-disable-next-line security/detect-object-injection
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border border-border overflow-hidden font-mono text-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-end px-4 py-2 bg-muted/30 border-b border-border shrink-0">
        <button
          onClick={clearStructuredLogs}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <Trash2 size={12} /> Clear
        </button>
      </div>

      {/* Logs Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/50 min-w-0">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] sticky top-0 backdrop-blur-md z-10">
            <tr>
              <th className="p-3 font-bold w-20">Time</th>
              <th className="p-3 font-bold w-24">Type</th>
              <th className="p-3 font-bold">Command</th>
              <th className="p-3 font-bold">File</th>
              <th className="p-3 font-bold w-20 text-right">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {structuredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-foreground/20 italic">
                  No operations recorded yet.
                </td>
              </tr>
            ) : (
              structuredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/50 transition-colors group">
                  <td className="p-3 text-foreground/30 text-[10px] whitespace-nowrap align-top">
                    {log.timestamp}
                  </td>
                  <td className="p-3 text-xs font-medium text-foreground align-top">
                    {log.operationType}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground break-all align-top font-mono">
                    <div className="text-foreground/80">{log.command}</div>
                    {log.details && (
                      <div className="text-[10px] text-foreground/40 mt-1">{log.details}</div>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground align-top">
                    {log.fileName ? (
                      <div>
                        <div className="text-secondary font-medium">{log.fileName}</div>
                        {log.fileSize !== undefined && (
                          <div className="text-[10px] text-foreground/40">
                            {formatSize(log.fileSize)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-foreground/20">-</span>
                    )}
                  </td>
                  <td
                    className={clsx(
                      'p-3 text-right text-xs font-bold whitespace-nowrap align-top',
                      getPerformanceColor(log.executionTime)
                    )}
                  >
                    {log.executionTime.toFixed(2)} ms
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
