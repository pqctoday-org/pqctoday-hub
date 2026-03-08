// SPDX-License-Identifier: GPL-3.0-only
/**
 * TokenSetupPanel — 3-step PKCS#11 token initialization UI.
 * Reads/writes via useHsmContext(); calls hsm_* helpers directly.
 */
import { useState } from 'react'
import { Shield, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import {
  getSoftHSMCppModule,
  getSoftHSMRustModule,
  createLoggingProxy,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
} from '../../../wasm/softhsm'
import { useHsmContext } from '../hsm/HsmContext'

// ── Step badge ─────────────────────────────────────────────────────────────────

const StepBadge = ({ done, label }: { done: boolean; label: string }) => (
  <span className="flex items-center gap-1 text-xs">
    {done ? (
      <CheckCircle size={13} className="text-status-success" />
    ) : (
      <span className="w-3 h-3 rounded-full border border-border inline-block" />
    )}
    <span className={done ? 'text-status-success' : 'text-muted-foreground'}>{label}</span>
  </span>
)

// ── Main component ─────────────────────────────────────────────────────────────

export const TokenSetupPanel = () => {
  const {
    moduleRef,
    crossCheckModuleRef,
    hSessionRef,
    slotRef,
    engineMode,
    phase,
    setPhase,
    tokenCreated,
    setTokenCreated,
    addHsmLog,
  } = useHsmContext()

  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)

  const anyLoading = loadingOp !== null
  const sessionOpen = phase === 'session_open'

  const withLoading = async (op: string, fn: () => Promise<void>) => {
    setLoadingOp(op)
    try {
      await fn()
    } finally {
      setLoadingOp(null)
    }
  }

  const doInitialize = () =>
    withLoading('initialize', async () => {
      setTokenError(null)
      try {
        let M = null
        let checkM = null

        if (engineMode === 'cpp') {
          M = await getSoftHSMCppModule()
        } else if (engineMode === 'rust') {
          M = await getSoftHSMRustModule()
        } else if (engineMode === 'dual') {
          M = await getSoftHSMCppModule()
          checkM = await getSoftHSMRustModule()
        } else {
          throw new Error('No cryptographic execution engine selected.')
        }

        const engineLabel = engineMode === 'rust' ? 'rust' : 'cpp'
        const proxy = createLoggingProxy(M, addHsmLog, engineLabel)
        moduleRef.current = proxy
        hsm_initialize(proxy)

        if (checkM) {
          const checkProxy = createLoggingProxy(checkM, addHsmLog, 'rust')
          crossCheckModuleRef.current = checkProxy
          hsm_initialize(checkProxy)
        }

        setPhase('initialized')
      } catch (e) {
        setTokenError(String(e))
        moduleRef.current = null
        crossCheckModuleRef.current = null
      }
    })

  const doInitToken = () =>
    withLoading('init_token', async () => {
      setTokenError(null)
      try {
        if (!moduleRef.current) throw new Error('Module not loaded')
        const M = moduleRef.current
        const slot0 = hsm_getFirstSlot(M)
        const newSlot = hsm_initToken(M, slot0, '12345678', 'SoftHSM3')
        slotRef.current = newSlot
        setTokenCreated(true)
      } catch (e) {
        setTokenError(String(e))
      }
    })

  const doOpenSession = () =>
    withLoading('open_session', async () => {
      setTokenError(null)
      try {
        if (!moduleRef.current) throw new Error('Module not loaded')
        const M = moduleRef.current
        const hSession = hsm_openUserSession(M, slotRef.current, '12345678', 'user1234')
        hSessionRef.current = hSession
        setPhase('session_open')
      } catch (e) {
        setTokenError(String(e))
      }
    })

  return (
    <div className="glass-panel p-4 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Shield size={14} className="text-primary" /> Token Setup
        {sessionOpen && (
          <span className="ml-1 text-xs font-normal text-status-success flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success inline-block animate-pulse" />
            Live WASM — PKCS#11 v3.2
          </span>
        )}
      </h3>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={phase !== 'idle' || anyLoading}
          onClick={doInitialize}
        >
          {loadingOp === 'initialize' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          {phase === 'idle' ? '1. Initialize HSM' : '✓ Initialized'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={phase !== 'initialized' || anyLoading}
          onClick={doInitToken}
        >
          {loadingOp === 'init_token' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          2. Create Token
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={phase !== 'initialized' || !tokenCreated || anyLoading}
          onClick={doOpenSession}
        >
          {loadingOp === 'open_session' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          3. Open Session &amp; Login
        </Button>
      </div>

      <div className="flex gap-4">
        <StepBadge done={phase !== 'idle'} label="Initialized" />
        <StepBadge done={tokenCreated} label="Token created" />
        <StepBadge done={sessionOpen} label="Session open" />
      </div>

      {tokenError && <ErrorAlert message={tokenError} />}
    </div>
  )
}
