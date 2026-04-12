import { useState } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '../../../ui/button'
import { ErrorAlert } from '../../../ui/error-alert'
import { hsm_generateAESKey, hsm_aesCmac } from '../../../../wasm/softhsm'
import { useHsmContext } from '../HsmContext'
import { HsmResultRow, toHex, hexSnippet } from '../shared'

export const AesCmacPanel = () => {
  const { moduleRef, hSessionRef, addHsmKey } = useHsmContext()
  const [keyBits, setKeyBits] = useState<128 | 192 | 256>(128)
  const [keyHandle, setKeyHandle] = useState<number | null>(null)
  const [input, setInput] = useState('Hello, PQC World!')
  const [mac, setMac] = useState<Uint8Array | null>(null)
  const [verified, setVerified] = useState<boolean | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const anyLoading = loadingOp !== null

  const withLoading = async (op: string, fn: () => Promise<void>) => {
    setLoadingOp(op)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(String(e))
    } finally {
      setLoadingOp(null)
    }
  }

  const doGenKey = () =>
    withLoading('gen', async () => {
      const M = moduleRef.current!
      const handle = hsm_generateAESKey(M, hSessionRef.current, keyBits)
      setKeyHandle(handle)
      setMac(null)
      setVerified(null)
      const ts = new Date().toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      addHsmKey({
        handle,
        family: 'aes',
        role: 'secret',
        label: `AES-${keyBits} CMAC Key`,
        variant: String(keyBits),
        generatedAt: ts,
      })
    })

  const doComputeMac = () =>
    withLoading('mac', async () => {
      const M = moduleRef.current!
      const data = new TextEncoder().encode(input)
      const result = hsm_aesCmac(M, hSessionRef.current, keyHandle!, data)
      setMac(result)
      setVerified(null)
    })

  const doVerify = () =>
    withLoading('verify', async () => {
      const M = moduleRef.current!
      const data = new TextEncoder().encode(input)
      const result = hsm_aesCmac(M, hSessionRef.current, keyHandle!, data)
      setVerified(toHex(result) === toHex(mac!))
    })

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Key</p>
        <div className="flex items-center gap-2 flex-wrap">
          {([128, 192, 256] as const).map((b) => (
            <Button
              key={b}
              variant="ghost"
              size="sm"
              disabled={anyLoading}
              onClick={() => {
                setKeyBits(b)
                setKeyHandle(null)
                setMac(null)
                setVerified(null)
              }}
              className={
                keyBits === b
                  ? 'bg-primary/20 text-primary text-xs h-7 px-3'
                  : 'text-muted-foreground text-xs h-7 px-3'
              }
            >
              {b}-bit
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
        <p className="text-xs text-muted-foreground font-mono">
          Output: 16 bytes (128 bits) · mechanism: 0x108a
        </p>
      </div>

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
            setVerified(null)
          }}
          placeholder="Enter data to authenticate…"
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={doComputeMac}
          disabled={keyHandle === null || anyLoading || !input.length}
          className="flex-1"
        >
          {loadingOp === 'mac' && <Loader2 size={14} className="mr-2 animate-spin" />}
          Compute CMAC
        </Button>
        <Button
          variant="outline"
          onClick={doVerify}
          disabled={mac === null || anyLoading}
          className="flex-1"
        >
          {loadingOp === 'verify' && <Loader2 size={14} className="mr-2 animate-spin" />}
          Verify
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {mac && (
        <div className="glass-panel p-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            MAC Result
          </p>
          <HsmResultRow label="CMAC (snippet)" value={hexSnippet(mac, 24)} />
          <HsmResultRow label="Length" value="16 bytes (128 bits)" mono={false} />
          {verified !== null && (
            <div
              className={`flex items-center gap-2 rounded px-3 py-2 text-xs font-mono ${verified ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'}`}
            >
              {verified ? <CheckCircle size={13} /> : <XCircle size={13} />}
              {verified
                ? 'MAC verified — C_Verify returned CKR_OK'
                : 'MAC invalid — verification failed'}
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Full CMAC (hex)</p>
            <p className="text-xs font-mono bg-muted rounded px-3 py-2 break-all text-foreground/80 select-all">
              {toHex(mac)}
            </p>
          </div>
        </div>
      )}

      <div className="glass-panel p-4 space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          PKCS#11 Call Sequence
        </p>
        <div className="space-y-1 text-xs font-mono">
          <div className="text-muted-foreground">
            <span className="text-foreground">C_SignInit</span>(hSession, 0x108a /* CKM_AES_CMAC */,
            hKey) → <span className="text-status-success">CKR_OK</span>
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">C_Sign</span>(hSession, pData, dataLen, pMAC, &macLen)
            → <span className="text-status-success">CKR_OK</span> → 16 bytes
          </div>
        </div>
      </div>
    </div>
  )
}
