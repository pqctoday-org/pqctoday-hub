// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import {
  CKM_SHA256_HMAC,
  CKM_SHA384_HMAC,
  CKM_SHA512_HMAC,
  CKM_SHA3_256_HMAC,
  CKM_SHA3_512_HMAC,
  hsm_generateHMACKey,
  hsm_hmac,
  hsm_hmacVerify,
} from '../../../wasm/softhsm'
import { useHsmContext } from './HsmContext'
import { HsmResultRow, toHex, hexSnippet } from './shared'
import { MiniPkcsLog } from '../components/MiniPkcsLog'

const HMAC_ALGOS = [
  { label: 'HMAC-SHA-256', mech: CKM_SHA256_HMAC, outBytes: 32 },
  { label: 'HMAC-SHA-384', mech: CKM_SHA384_HMAC, outBytes: 48 },
  { label: 'HMAC-SHA-512', mech: CKM_SHA512_HMAC, outBytes: 64 },
  { label: 'HMAC-SHA3-256', mech: CKM_SHA3_256_HMAC, outBytes: 32 },
  { label: 'HMAC-SHA3-512', mech: CKM_SHA3_512_HMAC, outBytes: 64 },
] as const

// ── AES sub-panel ───────────────────────────────────────────────────────────────
export const HmacPanel = () => {
  const { moduleRef, hSessionRef, addHsmKey } = useHsmContext()
  const [selectedMech, setSelectedMech] = useState(CKM_SHA256_HMAC)
  const [keyHandle, setKeyHandle] = useState<number | null>(null)
  const [input, setInput] = useState('Hello, PQC World!')
  const [mac, setMac] = useState<Uint8Array | null>(null)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const anyLoading = loadingOp !== null
  const selectedAlgo = HMAC_ALGOS.find((a) => a.mech === selectedMech) ?? HMAC_ALGOS[0]

  const withLoading = async (op: string, fn: () => Promise<void>) => {
    setLoadingOp(op)
    setError(null)
    try {
      await fn()
    } finally {
      setLoadingOp(null)
    }
  }

  const doGenKey = () =>
    withLoading('gen', async () => {
      const M = moduleRef.current!
      const handle = hsm_generateHMACKey(M, hSessionRef.current, 32)
      setKeyHandle(handle)
      setMac(null)
      setVerifyResult(null)
      const ts = new Date().toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      addHsmKey({ handle, family: 'hmac', role: 'secret', label: 'HMAC-256 Key', generatedAt: ts })
    })

  const doComputeHmac = () =>
    withLoading('mac', async () => {
      const M = moduleRef.current!
      const data = new TextEncoder().encode(input)
      const result = hsm_hmac(M, hSessionRef.current, keyHandle!, data, selectedMech)
      setMac(result)
      setVerifyResult(null)
    })

  const doVerifyHmac = () =>
    withLoading('verify', async () => {
      const M = moduleRef.current!
      const data = new TextEncoder().encode(input)
      const ok = hsm_hmacVerify(M, hSessionRef.current, keyHandle!, data, mac!, selectedMech)
      setVerifyResult(ok)
    })

  return (
    <div className="space-y-4">
      {/* Key + algo */}
      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Algorithm & Key
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          {HMAC_ALGOS.map((a) => (
            <Button
              key={a.mech}
              variant="ghost"
              size="sm"
              disabled={anyLoading}
              onClick={() => {
                setSelectedMech(a.mech)
                setMac(null)
                setVerifyResult(null)
              }}
              className={
                selectedMech === a.mech
                  ? 'bg-primary/20 text-primary text-xs h-7 px-3'
                  : 'text-muted-foreground text-xs h-7 px-3'
              }
            >
              {a.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={anyLoading}
            onClick={doGenKey}
            className="ml-auto h-7 text-xs"
          >
            {loadingOp === 'gen' && <Loader2 size={12} className="mr-1.5 animate-spin" />}
            {keyHandle !== null ? `✓ h=${keyHandle}` : 'Generate Key'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Output: {selectedAlgo.outBytes} bytes · mechanism:{' '}
          <span className="font-mono">0x{selectedMech.toString(16).padStart(4, '0')}</span>
        </p>
      </div>

      {/* Input */}
      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Input Data
        </p>
        <textarea
          className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          rows={2}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setMac(null)
            setVerifyResult(null)
          }}
          placeholder="Enter data to authenticate…"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={doComputeHmac}
          disabled={keyHandle === null || anyLoading || !input.length}
          className="flex-1"
        >
          {loadingOp === 'mac' && <Loader2 size={14} className="mr-2 animate-spin" />}
          Compute HMAC
        </Button>
        <Button
          variant="outline"
          onClick={doVerifyHmac}
          disabled={mac === null || anyLoading}
          className="flex-1"
        >
          {loadingOp === 'verify' && <Loader2 size={14} className="mr-2 animate-spin" />}
          Verify
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Result */}
      {mac && (
        <div className="glass-panel p-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            MAC Result
          </p>
          <HsmResultRow label="Algorithm" value={selectedAlgo.label} mono={false} />
          <HsmResultRow label="MAC (snippet)" value={hexSnippet(mac, 24)} />
          <HsmResultRow label="Length" value={`${mac.length} bytes`} mono={false} />
          {verifyResult !== null && (
            <div
              className={`flex items-center gap-2 rounded px-3 py-2 text-xs font-mono ${
                verifyResult
                  ? 'bg-status-success/10 text-status-success'
                  : 'bg-status-error/10 text-status-error'
              }`}
            >
              {verifyResult ? <CheckCircle size={13} /> : <XCircle size={13} />}
              {verifyResult
                ? 'MAC verified — C_Verify returned CKR_OK'
                : 'MAC invalid — verification failed'}
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Full MAC (hex)</p>
            <p className="text-xs font-mono bg-muted rounded px-3 py-2 break-all text-foreground/80 select-all">
              {toHex(mac)}
            </p>
          </div>
        </div>
      )}

      <MiniPkcsLog />
    </div>
  )
}

// ── AES-CTR sub-panel ───────────────────────────────────────────────────────────
