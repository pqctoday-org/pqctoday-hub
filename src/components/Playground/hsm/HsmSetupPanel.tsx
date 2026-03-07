// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Shield, CheckCircle, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import {
  getSoftHSMModule,
  createLoggingProxy,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  hsm_finalize,
  hsm_getSessionInfo,
  hsm_getTokenInfo,
  type SessionInfo,
  type TokenInfo,
} from '../../../wasm/softhsm'
import { useHsmContext } from './HsmContext'
import { useSettingsContext } from '../contexts/SettingsContext'

// ── Step badge ────────────────────────────────────────────────────────────────

const StepBadge = ({ done, label }: { done: boolean; label: string }) => (
  <span className="flex items-center gap-1.5 text-xs">
    {done ? (
      <CheckCircle size={13} className="text-status-success shrink-0" />
    ) : (
      <span className="w-3 h-3 rounded-full border border-border inline-block shrink-0" />
    )}
    <span className={done ? 'text-status-success' : 'text-muted-foreground'}>{label}</span>
  </span>
)

// ── Main panel ────────────────────────────────────────────────────────────────

export const HsmSetupPanel = () => {
  const {
    moduleRef,
    hSessionRef,
    slotRef,
    phase,
    setPhase,
    tokenCreated,
    setTokenCreated,
    isReady,
    addHsmLog,
    clearHsmKeys,
    clearHsmLog,
  } = useHsmContext()
  const { setActiveTab } = useSettingsContext()
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)

  const withLoading = async (op: string, fn: () => Promise<void>) => {
    setLoadingOp(op)
    setError(null)
    try {
      await fn()
    } finally {
      setLoadingOp(null)
    }
  }

  const doInitialize = () =>
    withLoading('initialize', async () => {
      try {
        const M = await getSoftHSMModule()
        const proxy = createLoggingProxy(M, addHsmLog)
        moduleRef.current = proxy
        hsm_initialize(proxy)
        setPhase('initialized')
      } catch (e) {
        setError(String(e))
        moduleRef.current = null
      }
    })

  const doInitToken = () =>
    withLoading('init_token', async () => {
      try {
        const M = moduleRef.current!
        const slot0 = hsm_getFirstSlot(M)
        const newSlot = hsm_initToken(M, slot0, '12345678', 'SoftHSM3')
        slotRef.current = newSlot
        setTokenCreated(true)
      } catch (e) {
        setError(String(e))
      }
    })

  const doOpenSession = () =>
    withLoading('open_session', async () => {
      try {
        const M = moduleRef.current!
        const hSession = hsm_openUserSession(M, slotRef.current, '12345678', 'user1234')
        hSessionRef.current = hSession
        setPhase('session_open')
        // Fetch session & token info for the info cards
        try {
          setSessionInfo(hsm_getSessionInfo(M, hSession))
          setTokenInfo(hsm_getTokenInfo(M, slotRef.current))
        } catch {
          // non-critical — info cards simply won't render
        }
      } catch (e) {
        setError(String(e))
      }
    })

  const doFinalize = () => {
    if (moduleRef.current) {
      try {
        hsm_finalize(moduleRef.current, hSessionRef.current)
      } catch {
        // ignore errors on cleanup
      }
      moduleRef.current = null
    }
    hSessionRef.current = 0
    slotRef.current = 0
    setPhase('idle')
    setTokenCreated(false)
    clearHsmKeys()
    clearHsmLog()
    setError(null)
    setSessionInfo(null)
    setTokenInfo(null)
  }

  const isLoading = (op: string) => loadingOp === op
  const anyLoading = loadingOp !== null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-panel p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm flex items-center gap-2">
            {isReady ? (
              <span className="w-2 h-2 rounded-full bg-status-success inline-block animate-pulse" />
            ) : (
              <Shield size={14} className="text-primary" />
            )}
            {isReady ? 'HSM Session Active' : 'HSM Setup — Token Lifecycle'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            SoftHSM3 WASM · OpenSSL 3.6 · PKCS#11 v3.2
          </p>
        </div>
        {(phase !== 'idle' || tokenCreated) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={doFinalize}
            disabled={anyLoading}
          >
            <RotateCcw size={12} className="mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-3 px-1">
        <StepBadge done={phase !== 'idle'} label="Initialized" />
        <span className="text-border">›</span>
        <StepBadge done={tokenCreated} label="Token Created" />
        <span className="text-border">›</span>
        <StepBadge done={isReady} label="Session Open" />
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Step 1 — Initialize */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">Step 1 — Initialize Library</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Load SoftHSM WASM and call C_Initialize(NULL_PTR).
            </p>
          </div>
          <Button
            size="sm"
            variant={phase !== 'idle' ? 'ghost' : 'outline'}
            disabled={phase !== 'idle' || anyLoading}
            onClick={doInitialize}
            className="shrink-0"
          >
            {isLoading('initialize') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            {phase !== 'idle' ? (
              <CheckCircle size={13} className="mr-1.5 text-status-success" />
            ) : null}
            Initialize
          </Button>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          <span className="text-foreground">C_Initialize</span>(NULL_PTR) →{' '}
          <span className="text-status-success">CKR_OK</span>
        </div>
      </div>

      {/* Step 2 — Create Token */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">Step 2 — Create Token</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              C_GetSlotList → C_InitToken("SoftHSM3", soPin="12345678").
            </p>
          </div>
          <Button
            size="sm"
            variant={tokenCreated ? 'ghost' : 'outline'}
            disabled={phase !== 'initialized' || tokenCreated || anyLoading}
            onClick={doInitToken}
            className="shrink-0"
          >
            {isLoading('init_token') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            {tokenCreated ? <CheckCircle size={13} className="mr-1.5 text-status-success" /> : null}
            Create Token
          </Button>
        </div>
        <div className="text-xs font-mono text-muted-foreground space-y-0.5">
          <div>
            <span className="text-foreground">C_GetSlotList</span>(CK_FALSE, …) →{' '}
            <span className="text-status-success">slot=0</span>
          </div>
          <div>
            <span className="text-foreground">C_InitToken</span>(slot=0, "12345678", "SoftHSM3") →{' '}
            <span className="text-status-success">newSlot</span>
          </div>
        </div>
      </div>

      {/* Step 3 — Open Session */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">Step 3 — Open User Session</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              C_OpenSession(RW) → C_Login(SO) → C_InitPIN → C_Login(USER).
            </p>
          </div>
          <Button
            size="sm"
            variant={isReady ? 'ghost' : 'outline'}
            disabled={!tokenCreated || isReady || anyLoading}
            onClick={doOpenSession}
            className="shrink-0"
          >
            {isLoading('open_session') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            {isReady ? <CheckCircle size={13} className="mr-1.5 text-status-success" /> : null}
            Open Session
          </Button>
        </div>
        <div className="text-xs font-mono text-muted-foreground space-y-0.5">
          <div>
            <span className="text-foreground">C_OpenSession</span>(RW|SERIAL) →{' '}
            <span className="text-status-success">hSession</span>
          </div>
          <div>
            <span className="text-foreground">C_Login</span>(SO) →{' '}
            <span className="text-foreground">C_InitPIN</span>("user1234") →{' '}
            <span className="text-foreground">C_Login</span>(USER) →{' '}
            <span className="text-status-success">CKR_OK × 3</span>
          </div>
        </div>
      </div>

      {/* Ready banner → navigate to an operation tab */}
      {isReady && (
        <div className="glass-panel p-4 border border-status-success/30 bg-status-success/5">
          <p className="text-sm font-semibold text-status-success flex items-center gap-2">
            <CheckCircle size={16} />
            HSM session ready — switch to any tab to run PKCS#11 operations.
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {(
              [
                { tab: 'kem_ops', label: 'KEM & Encrypt' },
                { tab: 'sign_verify', label: 'Sign & Verify' },
                { tab: 'symmetric', label: 'Sym Encrypt' },
                { tab: 'hashing', label: 'Hashing' },
                { tab: 'keystore', label: 'Key Store' },
              ] as const
            ).map(({ tab, label }) => (
              <Button
                key={tab}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => setActiveTab(tab)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Token & Session info cards */}
      {isReady && (tokenInfo || sessionInfo) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tokenInfo && (
            <div className="glass-panel p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Token Info (C_GetTokenInfo)
              </p>
              <table className="w-full text-xs font-mono border-collapse">
                <tbody>
                  <InfoRow label="Label" value={tokenInfo.label} />
                  <InfoRow label="Manufacturer" value={tokenInfo.manufacturerID} />
                  <InfoRow label="Model" value={tokenInfo.model} />
                  <InfoRow label="Serial" value={tokenInfo.serialNumber} />
                  <InfoRow
                    label="FW Version"
                    value={`${tokenInfo.firmwareVersion.major}.${tokenInfo.firmwareVersion.minor}`}
                  />
                  <InfoRow
                    label="HW Version"
                    value={`${tokenInfo.hardwareVersion.major}.${tokenInfo.hardwareVersion.minor}`}
                  />
                  <InfoRow
                    label="Flags"
                    value={`0x${tokenInfo.flags.toString(16).padStart(8, '0')}`}
                  />
                  <InfoRow
                    label="PIN length"
                    value={`${tokenInfo.ulMinPinLen}–${tokenInfo.ulMaxPinLen}`}
                  />
                </tbody>
              </table>
            </div>
          )}
          {sessionInfo && (
            <div className="glass-panel p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Session Info (C_GetSessionInfo)
              </p>
              <table className="w-full text-xs font-mono border-collapse">
                <tbody>
                  <InfoRow label="Slot ID" value={String(sessionInfo.slotID)} />
                  <InfoRow
                    label="State"
                    value={SESSION_STATE_NAMES[sessionInfo.state] ?? String(sessionInfo.state)}
                  />
                  <InfoRow
                    label="Flags"
                    value={`0x${sessionInfo.flags.toString(16).padStart(8, '0')}`}
                  />
                  <InfoRow label="Device Error" value={String(sessionInfo.ulDeviceError)} />
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <tr className="border-b border-border/40">
    <td className="py-1 pr-3 text-muted-foreground whitespace-nowrap">{label}</td>
    <td className="py-1 text-foreground">{value}</td>
  </tr>
)

const SESSION_STATE_NAMES: Record<number, string> = {
  0: 'RO_PUBLIC_SESSION',
  1: 'RO_USER_FUNCTIONS',
  2: 'RW_PUBLIC_SESSION',
  3: 'RW_USER_FUNCTIONS',
  4: 'RW_SO_FUNCTIONS',
}
