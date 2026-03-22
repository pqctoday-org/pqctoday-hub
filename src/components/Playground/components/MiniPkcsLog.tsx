// SPDX-License-Identifier: GPL-3.0-only
/**
 * MiniPkcsLog — compact inline PKCS#11 call log showing the last N entries.
 *
 * Reads from HsmContext (no props). Returns null when the log is empty so it
 * takes no space before any operation has run. Displays entries oldest→newest
 * (same order as PkcsLogPanel) with a footer directing users to the full log tab.
 */
import { useHsmContext } from '../hsm/HsmContext'

const MAX_ENTRIES = 10

export const MiniPkcsLog = () => {
  const { hsmLog } = useHsmContext()

  if (hsmLog.length === 0) return null

  // hsmLog is newest-first; take the N most recent then reverse for oldest→newest display
  const recent = [...hsmLog.slice(0, MAX_ENTRIES)].reverse()

  return (
    <div className="glass-panel p-3 space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        PKCS#11 Calls (last {hsmLog.length > MAX_ENTRIES ? MAX_ENTRIES : hsmLog.length})
      </p>

      <div className="space-y-0.5">
        {recent.map((entry) => (
          <div key={entry.id} className="flex items-baseline gap-1.5 text-[11px] font-mono">
            <span className="text-muted-foreground shrink-0 w-16">{entry.timestamp}</span>

            {entry.engineName === 'rust' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 shrink-0">
                Rust
              </span>
            )}
            {entry.engineName === 'cpp' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 shrink-0">
                C++
              </span>
            )}
            {entry.engineName === 'dual' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 shrink-0">
                Dual
              </span>
            )}

            <span className="text-foreground shrink-0">{entry.fn}</span>
            <span className="text-muted-foreground truncate">
              {entry.args && `(${entry.args})`}
            </span>
            <span className="ml-auto shrink-0">→</span>
            <span
              className={entry.ok ? 'text-status-success shrink-0' : 'text-status-error shrink-0'}
            >
              {entry.rvName}
            </span>
            <span className="text-muted-foreground shrink-0">[{entry.ms}ms]</span>
          </div>
        ))}
      </div>

      {hsmLog.length > MAX_ENTRIES && (
        <p className="text-[10px] text-muted-foreground pt-0.5">
          + {hsmLog.length - MAX_ENTRIES} earlier — view all in the{' '}
          <span className="text-primary">PKCS#11 Log</span> tab
        </p>
      )}
    </div>
  )
}
