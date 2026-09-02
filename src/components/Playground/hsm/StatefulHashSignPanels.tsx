// SPDX-License-Identifier: GPL-3.0-only
//
// Stateful hash-based signature panels (XMSS, LMS/HSS) for the HSM playground.
// These are PQC algorithms (NIST SP 800-208), so they live under the PQC sign
// tab rather than the Classical tab. Backed by the real softhsmv3 PKCS#11 v3.2
// stateful-signature engine.
import { useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import {
  CKM_XMSS,
  CKM_LMS,
  hsm_generateXMSSKeyPair,
  hsm_generateLMSKeyPair,
  hsm_statefulSignBytes,
  hsm_statefulVerifyBytes,
} from '../../../wasm/softhsm'
import { useHsmContext } from './HsmContext'
import { HsmResultRow, toHex } from './shared'

// ── XMSS sub-panel ───────────────────────────────────────────────────────────

export const XmssPanel = () => {
  const { moduleRef, hSessionRef, addHsmKey, engineMode } = useHsmContext()
  const [handles, setHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [message, setMessage] = useState('Hello from XMSS!')
  const [sig, setSig] = useState<Uint8Array | null>(null)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (label: string, fn: () => void) => {
    setError(null)
    setLoadingOp(label)
    try {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          try {
            fn()
            resolve()
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
            resolve()
          }
        }, 0)
      })
    } finally {
      setLoadingOp(null)
    }
  }

  const handleGenKeys = () =>
    run('KeyGen', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      // Hardcoded paramSet for XMSS-SHA2_10_256 (0x00000001)
      const { pubHandle, privHandle } = hsm_generateXMSSKeyPair(M, hSession, 1)
      addHsmKey({
        handle: pubHandle,
        family: 'xmss',
        role: 'public',
        label: `XMSS Public Key`,
        engine: engineMode === 'rust' ? 'rust' : 'cpp',
        generatedAt: new Date().toISOString(),
      })
      addHsmKey({
        handle: privHandle,
        family: 'xmss',
        role: 'private',
        label: `XMSS Private Key`,
        engine: engineMode === 'rust' ? 'rust' : 'cpp',
        generatedAt: new Date().toISOString(),
      })
      setHandles({ pub: pubHandle, priv: privHandle })
      setSig(null)
      setVerifyResult(null)
    })

  const handleSign = () =>
    run('Sign', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const msgBytes = new TextEncoder().encode(message)
      const s = hsm_statefulSignBytes(M, hSession, CKM_XMSS, handles!.priv, msgBytes)
      setSig(s)
      setVerifyResult(null)
    })

  const handleVerify = () =>
    run('Verify', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const msgBytes = new TextEncoder().encode(message)
      const valid =
        hsm_statefulVerifyBytes(M, hSession, CKM_XMSS, handles!.pub, msgBytes, sig!) === 0
      setVerifyResult(valid)
    })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="gradient"
            size="sm"
            onClick={handleGenKeys}
            disabled={loadingOp !== null}
          >
            {loadingOp === 'KeyGen' && <Loader2 size={14} className="animate-spin mr-1" />}
            {handles ? `Regen XMSS` : 'Generate Key Pair'}
          </Button>
        </div>
        {handles && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <HsmResultRow label="pub handle" value={`h=${handles.pub}`} />
            <HsmResultRow label="priv handle" value={`h=${handles.priv}`} />
          </div>
        )}
      </div>

      {handles && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setSig(null)
              setVerifyResult(null)
            }}
            placeholder="Message to sign"
            className="w-full text-xs rounded-lg px-3 py-1.5 bg-muted border border-border text-foreground"
          />
          <div className="flex gap-2">
            <Button variant="gradient" size="sm" onClick={handleSign} disabled={loadingOp !== null}>
              {loadingOp === 'Sign' && <Loader2 size={14} className="animate-spin mr-1" />} C_Sign
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerify}
              disabled={loadingOp !== null || !sig}
            >
              {loadingOp === 'Verify' && <Loader2 size={14} className="animate-spin mr-1" />}{' '}
              C_Verify
            </Button>
          </div>
          {sig && <HsmResultRow label={`Sig (${sig.length}B)`} value={toHex(sig)} />}
          {verifyResult !== null && (
            <div
              className={`flex items-center gap-2 text-xs font-medium rounded px-2 py-1 ${verifyResult ? 'text-status-success bg-status-success/10' : 'text-status-error bg-status-error/10'}`}
            >
              {verifyResult ? (
                <>
                  <CheckCircle size={12} /> Valid
                </>
              ) : (
                <>
                  <XCircle size={12} /> Invalid
                </>
              )}
            </div>
          )}
        </div>
      )}

      {error && <ErrorAlert message={error} />}
    </div>
  )
}

// ── LMS sub-panel ───────────────────────────────────────────────────────────

export const LmsPanel = () => {
  const { moduleRef, hSessionRef, addHsmKey, engineMode } = useHsmContext()
  const [handles, setHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [message, setMessage] = useState('Hello from LMS!')
  const [sig, setSig] = useState<Uint8Array | null>(null)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (label: string, fn: () => void) => {
    setError(null)
    setLoadingOp(label)
    try {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          try {
            fn()
            resolve()
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
            resolve()
          }
        }, 0)
      })
    } finally {
      setLoadingOp(null)
    }
  }

  const handleGenKeys = () =>
    run('KeyGen', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      // Hardcoded types for LMS_SHA256_M32_H5 (0x05) and LMOTS_SHA256_N32_W1 (0x01)
      const { pubHandle, privHandle } = hsm_generateLMSKeyPair(M, hSession)
      addHsmKey({
        handle: pubHandle,
        family: 'lms',
        role: 'public',
        label: `LMS Public Key`,
        engine: engineMode === 'rust' ? 'rust' : 'cpp',
        generatedAt: new Date().toISOString(),
      })
      addHsmKey({
        handle: privHandle,
        family: 'lms',
        role: 'private',
        label: `LMS Private Key`,
        engine: engineMode === 'rust' ? 'rust' : 'cpp',
        generatedAt: new Date().toISOString(),
      })
      setHandles({ pub: pubHandle, priv: privHandle })
      setSig(null)
      setVerifyResult(null)
    })

  const handleSign = () =>
    run('Sign', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const msgBytes = new TextEncoder().encode(message)
      const s = hsm_statefulSignBytes(M, hSession, CKM_LMS, handles!.priv, msgBytes)
      setSig(s)
      setVerifyResult(null)
    })

  const handleVerify = () =>
    run('Verify', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const msgBytes = new TextEncoder().encode(message)
      const valid =
        hsm_statefulVerifyBytes(M, hSession, CKM_LMS, handles!.pub, msgBytes, sig!) === 0
      setVerifyResult(valid)
    })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="gradient"
            size="sm"
            onClick={handleGenKeys}
            disabled={loadingOp !== null}
          >
            {loadingOp === 'KeyGen' && <Loader2 size={14} className="animate-spin mr-1" />}
            {handles ? `Regen LMS` : 'Generate Key Pair'}
          </Button>
        </div>
        {handles && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <HsmResultRow label="pub handle" value={`h=${handles.pub}`} />
            <HsmResultRow label="priv handle" value={`h=${handles.priv}`} />
          </div>
        )}
      </div>

      {handles && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setSig(null)
              setVerifyResult(null)
            }}
            placeholder="Message to sign"
            className="w-full text-xs rounded-lg px-3 py-1.5 bg-muted border border-border text-foreground"
          />
          <div className="flex gap-2">
            <Button variant="gradient" size="sm" onClick={handleSign} disabled={loadingOp !== null}>
              {loadingOp === 'Sign' && <Loader2 size={14} className="animate-spin mr-1" />} C_Sign
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerify}
              disabled={loadingOp !== null || !sig}
            >
              {loadingOp === 'Verify' && <Loader2 size={14} className="animate-spin mr-1" />}{' '}
              C_Verify
            </Button>
          </div>
          {sig && <HsmResultRow label={`Sig (${sig.length}B)`} value={toHex(sig)} />}
          {verifyResult !== null && (
            <div
              className={`flex items-center gap-2 text-xs font-medium rounded px-2 py-1 ${verifyResult ? 'text-status-success bg-status-success/10' : 'text-status-error bg-status-error/10'}`}
            >
              {verifyResult ? (
                <>
                  <CheckCircle size={12} /> Valid
                </>
              ) : (
                <>
                  <XCircle size={12} /> Invalid
                </>
              )}
            </div>
          )}
        </div>
      )}

      {error && <ErrorAlert message={error} />}
    </div>
  )
}
