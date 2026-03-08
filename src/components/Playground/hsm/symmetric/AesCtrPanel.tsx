import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { Button } from '../../../../ui/button'
import { ErrorAlert } from '../../../../ui/error-alert'
import {
  hsm_generateAESKey,
  hsm_aesCtrEncrypt,
  hsm_aesCtrDecrypt,
} from '../../../../../wasm/softhsm'
import { useHsmContext } from '../HsmContext'
import { HsmResultRow, toHex, hexSnippet } from '../shared'

export const AesCtrPanel = () => {
  const { moduleRef, hSessionRef, addHsmKey } = useHsmContext()
  const [keyBits, setKeyBits] = useState<128 | 192 | 256>(128)
  const [keyHandle, setKeyHandle] = useState<number | null>(null)
  const [plaintext, setPlaintext] = useState('Hello, PQC World!')
  const [ciphertext, setCiphertext] = useState<Uint8Array | null>(null)
  const [decrypted, setDecrypted] = useState<string | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const anyLoading = loadingOp !== null
  const zeroIv = new Uint8Array(16) // all-zero counter block

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
      setCiphertext(null)
      setDecrypted(null)
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
        label: `AES-${keyBits} Key`,
        variant: String(keyBits),
        generatedAt: ts,
      })
    })

  const doEncrypt = () =>
    withLoading('enc', async () => {
      const M = moduleRef.current!
      const data = new TextEncoder().encode(plaintext)
      const ct = hsm_aesCtrEncrypt(M, hSessionRef.current, keyHandle!, zeroIv, 128, data)
      setCiphertext(ct)
      setDecrypted(null)
    })

  const doDecrypt = () =>
    withLoading('dec', async () => {
      const M = moduleRef.current!
      const plain = hsm_aesCtrDecrypt(M, hSessionRef.current, keyHandle!, zeroIv, 128, ciphertext!)
      setDecrypted(new TextDecoder().decode(plain))
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
                setCiphertext(null)
                setDecrypted(null)
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
          C_GenerateKey(CKM_AES_KEY_GEN, {keyBits}) → handle · IV: 16×0x00, counterBits=128
        </p>
      </div>

      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Plaintext
        </p>
        <textarea
          className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          rows={2}
          value={plaintext}
          onChange={(e) => {
            setPlaintext(e.target.value)
            setCiphertext(null)
            setDecrypted(null)
          }}
          placeholder="Enter plaintext…"
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={doEncrypt}
          disabled={keyHandle === null || anyLoading || !plaintext.length}
          className="flex-1"
        >
          {loadingOp === 'enc' && <Loader2 size={14} className="mr-2 animate-spin" />}
          <Lock size={14} className="mr-2" /> Encrypt
        </Button>
        <Button
          variant="outline"
          onClick={doDecrypt}
          disabled={ciphertext === null || anyLoading}
          className="flex-1"
        >
          {loadingOp === 'dec' && <Loader2 size={14} className="mr-2 animate-spin" />}
          Decrypt
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {(ciphertext || decrypted) && (
        <div className="glass-panel p-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Result
          </p>
          {ciphertext && (
            <HsmResultRow
              label="Ciphertext"
              value={`${hexSnippet(ciphertext, 24)} (${ciphertext.length} B)`}
            />
          )}
          {decrypted !== null && <HsmResultRow label="Decrypted" value={decrypted} mono={false} />}
          {ciphertext && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Full ciphertext (hex)</p>
              <p className="text-xs font-mono bg-muted rounded px-3 py-2 break-all text-foreground/80 select-all">
                {toHex(ciphertext)}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="glass-panel p-4 space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          PKCS#11 Call Sequence
        </p>
        <div className="space-y-1 text-xs font-mono">
          <div className="text-muted-foreground">
            <span className="text-foreground">C_EncryptInit</span>(hSession, 0x1086 /* CKM_AES_CTR
            */, hKey, &params) → <span className="text-status-success">CKR_OK</span>
          </div>
          <div className="text-muted-foreground text-[10px] pl-2">
            params: CK_AES_CTR_PARAMS{' { ulCounterBits=128, cb[16]=0x00…00 }'}
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">C_Encrypt</span>(hSession, pPlain, plainLen, pCT,
            &ctLen) → <span className="text-status-success">CKR_OK</span>
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">C_DecryptInit</span>(hSession, 0x1086, hKey, &params)
            → <span className="text-status-success">CKR_OK</span>
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">C_Decrypt</span>(hSession, pCT, ctLen, pPlain,
            &plainLen) → <span className="text-status-success">CKR_OK</span>
          </div>
        </div>
      </div>
    </div>
  )
}
