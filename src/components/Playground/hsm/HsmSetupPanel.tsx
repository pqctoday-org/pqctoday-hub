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
    </div>
  )
}
