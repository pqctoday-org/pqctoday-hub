// SPDX-License-Identifier: GPL-3.0-only
/**
 * LiveHSMToggle — opt-in Live HSM Mode toggle for learning module steps.
 *
 * Renders a compact status panel showing:
 *  - Which standard PKCS#11 v3.2 functions this step will call
 *  - Current HSM phase (idle / loading / ready / error)
 *  - Enable / Disable button (persisted via useHSMMode store)
 *
 * Usage:
 *   const hsm = useHSM()
 *   ...
 *   <LiveHSMToggle hsm={hsm} operations={['C_GenerateKeyPair', 'C_EncapsulateKey']} />
 *   {hsm.isReady && <Pkcs11LogPanel log={hsm.log} onClear={hsm.clearLog} />}
 */
import { useEffect } from 'react'
import { Shield, Loader2, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '../ui/button'
import { useHSMMode } from '../../store/useHSMMode'
import type { UseHSMResult } from '../../hooks/useHSM'

interface LiveHSMToggleProps {
  hsm: UseHSMResult
  /** Standard PKCS#11 v3.2 C_* function names this step calls (shown to user) */
  operations: string[]
  /** If true (default), automatically starts the HSM without requiring user click. */
  autoInit?: boolean
  className?: string
}

export const LiveHSMToggle = ({
  hsm,
  operations,
  autoInit = true,
  className = '',
}: LiveHSMToggleProps) => {
  const { liveHsmEnabled, setLiveHsm } = useHSMMode()

  // Auto-initialize when mounting
  useEffect(() => {
    if (autoInit && hsm.phase === 'idle') {
      void hsm.initialize()
      if (!liveHsmEnabled) {
        setLiveHsm(true)
      }
    }
  }, [autoInit, hsm, liveHsmEnabled, setLiveHsm])

  const handleEnable = () => {
    setLiveHsm(true)
    void hsm.initialize()
  }

  const handleDisable = () => {
    setLiveHsm(false)
    hsm.finalize()
  }

  const handleRetry = () => {
    void hsm.initialize()
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (hsm.phase === 'loading') {
    return (
      <div className={`glass-panel p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <Loader2 size={14} className="text-primary animate-spin shrink-0" />
          <div>
            <p className="text-sm font-semibold">Initializing SoftHSM…</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              C_Initialize → C_InitToken → C_OpenSession → C_Login
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (hsm.phase === 'error') {
    return (
      <div
        className={`glass-panel p-3 border border-status-error/30 bg-status-error/5 ${className}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <AlertCircle size={14} className="text-status-error shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-status-error">HSM initialization failed</p>
              <p className="text-xs text-muted-foreground mt-0.5 break-all line-clamp-2">
                {hsm.error}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs shrink-0"
            onClick={handleRetry}
          >
            <RotateCcw size={11} className="mr-1" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  // ── Session open (active) ────────────────────────────────────────────────────

  if (hsm.phase === 'session_open') {
    return (
      <div
        className={`glass-panel p-3 border border-status-success/20 bg-status-success/5 ${className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-status-success shrink-0 animate-pulse" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Live HSM Mode Active</p>
              <p className="text-xs text-muted-foreground">
                SoftHSM3 · PKCS#11 v3.2 · {hsm.engine === 'rust' ? 'Rust' : 'C++'} · session open
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs shrink-0 text-muted-foreground"
            onClick={handleDisable}
          >
            Disable
          </Button>
        </div>
      </div>
    )
  }

  // ── Idle — show engine selector + enable prompt ──────────────────────────────

  return (
    <div className={`glass-panel p-3 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Shield size={14} className="text-primary shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Live HSM Mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Run real PKCS#11 v3.2 operations in SoftHSM3 WASM.
            </p>
            {/* Engine selector — shown in idle so user can switch before (re-)enabling */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-muted-foreground">Engine:</span>
              {(['rust', 'cpp'] as const).map((mode) => (
                <label key={mode} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name={`hsm-engine-toggle-${operations[0] ?? 'default'}`}
                    value={mode}
                    checked={hsm.engine === mode}
                    onChange={() => hsm.setEngine(mode)}
                    className="accent-primary w-3 h-3"
                  />
                  <span
                    className={`text-xs ${hsm.engine === mode ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
                  >
                    {mode === 'rust' ? 'Rust' : 'C++'}
                  </span>
                </label>
              ))}
            </div>
            {operations.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {operations.map((op) => (
                  <span
                    key={op}
                    className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-foreground/70"
                  >
                    {op}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {!autoInit && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-xs shrink-0"
            onClick={handleEnable}
          >
            Enable
          </Button>
        )}
      </div>
    </div>
  )
}
