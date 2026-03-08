import { useState, MutableRefObject } from 'react'
import { Shield, Loader2 } from 'lucide-react'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { Button } from '../../../ui/button'
import { ErrorAlert } from '../../../ui/error-alert'
import {
  getSoftHSMModule,
  createLoggingProxy,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  type Pkcs11LogEntry,
} from '../../../../wasm/softhsm'
import { Phase, StepBadge } from './SoftHsmUI'

interface TokenSetupDemoProps {
  moduleRef: MutableRefObject<SoftHSMModule | null>
  slotRef: MutableRefObject<number>
  hSessionRef: MutableRefObject<number>
  phase: Phase
  setPhase: (p: Phase) => void
  tokenCreated: boolean
  setTokenCreated: (tc: boolean) => void
  addLog: (e: Pkcs11LogEntry) => void
}

export const TokenSetupDemo = ({
  moduleRef,
  slotRef,
  hSessionRef,
  phase,
  setPhase,
  tokenCreated,
  setTokenCreated,
  addLog,
}: TokenSetupDemoProps) => {
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)

  const isLoading = (op: string) => loadingOp === op
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

  const getM = (): SoftHSMModule => {
    if (!moduleRef.current) throw new Error('Module not loaded')
    return moduleRef.current
  }

  const doInitialize = () =>
    withLoading('initialize', async () => {
      setTokenError(null)
      try {
        const M = await getSoftHSMModule()
        const proxy = createLoggingProxy(M, addLog)
        moduleRef.current = proxy
        hsm_initialize(proxy)
        setPhase('initialized')
      } catch (e) {
        setTokenError(String(e))
        moduleRef.current = null
      }
    })

  const doInitToken = () =>
    withLoading('init_token', async () => {
      setTokenError(null)
      try {
        const M = getM()
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
        const M = getM()
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
      </h3>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={phase !== 'idle' || anyLoading}
          onClick={doInitialize}
        >
          {isLoading('initialize') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          {phase === 'idle' ? '1. Initialize HSM' : '✓ Initialized'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={phase !== 'initialized' || anyLoading}
          onClick={doInitToken}
        >
          {isLoading('init_token') && <Loader2 size={13} className="mr-1.5 animate-spin" />}2.
          Create Token
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={phase !== 'initialized' || !tokenCreated || anyLoading}
          onClick={doOpenSession}
        >
          {isLoading('open_session') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          3. Open Session & Login
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
