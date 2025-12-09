import React from 'react'
import { FileText, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import clsx from 'clsx'
import { useSettingsContext } from '../contexts/SettingsContext'

export const LogsTab: React.FC = () => {
  const {
    clearLogs,
    columnWidths,
    sortColumn,
    sortDirection,
    handleSort,
    startResize,
    sortedLogs,
  } = useSettingsContext()

  const getPerformanceColor = (ms: number): string => {
    if (ms < 100) return 'text-success'
    if (ms < 500) return 'text-warning'
    return 'text-destructive'
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileText size={18} className="text-muted-foreground" /> Operation Log
        </h4>
        <button
          onClick={clearLogs}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear Log
        </button>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card flex flex-col">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm table-fixed">
            <thead className="bg-muted text-muted-foreground uppercase text-xs sticky top-0 backdrop-blur-md select-none">
              <tr>
                <th
                  className="p-4 font-bold cursor-pointer hover:bg-accent transition-colors relative group"
                  style={{ width: columnWidths.timestamp }}
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    Timestamp
                    {sortColumn === 'timestamp' &&
                      (sortDirection === 'asc' ? (
                        <ArrowUp size={14} className="text-primary shrink-0" />
                      ) : (
                        <ArrowDown size={14} className="text-primary shrink-0" />
                      ))}
                    {sortColumn !== 'timestamp' && (
                      <ArrowUpDown size={14} className="opacity-30 shrink-0" />
                    )}
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Resize timestamp column"
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => startResize(e, 'timestamp')}
                    onKeyDown={() => {
                      /* Add keyboard resize logic if needed */
                    }}
                  />
                </th>
                <th
                  className="p-4 font-bold cursor-pointer hover:bg-accent transition-colors relative group"
                  style={{ width: columnWidths.keyLabel }}
                  onClick={() => handleSort('keyLabel')}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    Key Label
                    {sortColumn === 'keyLabel' &&
                      (sortDirection === 'asc' ? (
                        <ArrowUp size={14} className="text-primary shrink-0" />
                      ) : (
                        <ArrowDown size={14} className="text-primary shrink-0" />
                      ))}
                    {sortColumn !== 'keyLabel' && (
                      <ArrowUpDown size={14} className="opacity-30 shrink-0" />
                    )}
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Resize keyLabel column"
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => startResize(e, 'keyLabel')}
                    onKeyDown={() => {
                      /* Add keyboard resize logic if needed */
                    }}
                  />
                </th>
                <th
                  className="p-4 font-bold cursor-pointer hover:bg-accent transition-colors relative group"
                  style={{ width: columnWidths.operation }}
                  onClick={() => handleSort('operation')}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    Operation
                    {sortColumn === 'operation' &&
                      (sortDirection === 'asc' ? (
                        <ArrowUp size={14} className="text-primary shrink-0" />
                      ) : (
                        <ArrowDown size={14} className="text-primary shrink-0" />
                      ))}
                    {sortColumn !== 'operation' && (
                      <ArrowUpDown size={14} className="opacity-30 shrink-0" />
                    )}
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Resize operation column"
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => startResize(e, 'operation')}
                    onKeyDown={() => {
                      /* Add keyboard resize logic if needed */
                    }}
                  />
                </th>
                <th
                  className="p-4 font-bold cursor-pointer hover:bg-accent transition-colors relative group"
                  style={{ width: columnWidths.result }}
                  onClick={() => handleSort('result')}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    Results
                    {sortColumn === 'result' &&
                      (sortDirection === 'asc' ? (
                        <ArrowUp size={14} className="text-primary shrink-0" />
                      ) : (
                        <ArrowDown size={14} className="text-primary shrink-0" />
                      ))}
                    {sortColumn !== 'result' && (
                      <ArrowUpDown size={14} className="opacity-30 shrink-0" />
                    )}
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Resize result column"
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => startResize(e, 'result')}
                    onKeyDown={() => {
                      /* Add keyboard resize logic if needed */
                    }}
                  />
                </th>
                <th
                  className="p-4 font-bold cursor-pointer hover:bg-accent transition-colors text-right relative group"
                  style={{ width: columnWidths.executionTime }}
                  onClick={() => handleSort('executionTime')}
                >
                  <div className="flex items-center justify-end gap-2 overflow-hidden">
                    Execution Time
                    {sortColumn === 'executionTime' &&
                      (sortDirection === 'asc' ? (
                        <ArrowUp size={14} className="text-primary shrink-0" />
                      ) : (
                        <ArrowDown size={14} className="text-primary shrink-0" />
                      ))}
                    {sortColumn !== 'executionTime' && (
                      <ArrowUpDown size={14} className="opacity-30 shrink-0" />
                    )}
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Resize executionTime column"
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => startResize(e, 'executionTime')}
                    onKeyDown={() => {
                      /* Add keyboard resize logic if needed */
                    }}
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-foreground/30 italic">
                    No operations performed yet.
                  </td>
                </tr>
              ) : (
                sortedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-accent transition-colors">
                    <td className="p-4 font-mono text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                      {log.timestamp}
                    </td>
                    <td className="p-4 font-medium text-foreground overflow-hidden text-ellipsis">
                      {log.keyLabel}
                    </td>
                    <td className="p-4 text-accent overflow-hidden text-ellipsis">
                      {log.operation}
                    </td>
                    <td
                      className="p-4 text-sm text-muted-foreground overflow-hidden text-ellipsis"
                      title={log.result}
                    >
                      {log.result}
                    </td>
                    <td
                      className={clsx(
                        'p-4 text-right font-mono text-xs font-bold overflow-hidden text-ellipsis',
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
    </div>
  )
}
