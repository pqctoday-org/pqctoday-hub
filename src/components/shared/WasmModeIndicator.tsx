// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react'

interface WasmModeIndicatorProps {
  /** When true, WASM is live and real crypto is running. */
  isLive: boolean
  /** When WASM is in simulation mode, show this reason (optional). */
  simulationReason?: string
  className?: string
}

/**
 * Persistent banner shown at the top of any playground tool that can fall
 * back to mock/simulation mode. When isLive=true, shows a subtle "Live" pill.
 * When isLive=false (simulation), shows a prominent warning banner so users
 * never mistake simulated output for real cryptographic output.
 */
export const WasmModeIndicator: React.FC<WasmModeIndicatorProps> = ({
  isLive,
  simulationReason,
  className = '',
}) => {
  if (isLive) {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-status-success ${className}`}>
        <Wifi size={12} aria-hidden="true" />
        <span>Live WASM — real crypto</span>
      </div>
    )
  }

  return (
    <div
      className={`flex items-start gap-2 rounded-lg px-3 py-2 bg-status-warning/10 border border-status-warning/30 ${className}`}
      role="status"
      aria-live="polite"
    >
      <AlertTriangle size={14} className="text-status-warning mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-status-warning">
          Running in simulation mode — WASM unavailable
        </span>
        {simulationReason && (
          <span className="text-[11px] text-muted-foreground">{simulationReason}</span>
        )}
        <span className="text-[11px] text-muted-foreground">
          Output shown is randomly generated and does not represent real cryptographic material.
          Reload the page to attempt WASM reinitialisation.
        </span>
      </div>
      <WifiOff size={12} className="text-status-warning shrink-0 mt-0.5" aria-hidden="true" />
    </div>
  )
}
