// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import { hsm_generateAESKey, hsm_aesEncrypt, hsm_aesDecrypt } from '../../../wasm/softhsm'
import { useHsmContext } from './HsmContext'
import { HsmResultRow, toHex, hexSnippet } from './shared'
import { MiniPkcsLog } from '../components/MiniPkcsLog'

// ── AES sub-panel ───────────────────────────────────────────────────────────────
export const AesPanel = ({ mode }: { mode: 'aes-gcm' | 'aes-cbc' }) => {
  const { moduleRef, hSessionRef, addHsmKey } = useHsmContext()
  const [keyBits, setKeyBits] = useState<128 | 192 | 256>(256)
  const [keyHandle, setKeyHandle] = useState<number | null>(null)
  const [plaintext, setPlaintext] = useState('Hello, PQC World!')
  const [ciphertext, setCiphertext] = useState<Uint8Array | null>(null)
  const [iv, setIv] = useState<Uint8Array | null>(null)
  const [decrypted, setDecrypted] = useState<string | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // CKA_* key attributes (PKCS#11 v3.2 Table 14)
  const [ckaEncrypt, setCkaEncrypt] = useState(true)
  const [ckaDecrypt, setCkaDecrypt] = useState(true)
  const [ckaWrap, setCkaWrap] = useState(true)
  const [ckaUnwrap, setCkaUnwrap] = useState(true)
  const [ckaDerive, setCkaDerive] = useState(true)
  const [ckaExtractable, setCkaExtractable] = useState(true)

  const anyLoading = loadingOp !== null

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
      const handle = hsm_generateAESKey(
        M,
        hSessionRef.current,
        keyBits,
        ckaEncrypt,
        ckaDecrypt,
        ckaWrap,
        ckaUnwrap,
        ckaDerive,
        ckaExtractable
      )
      setKeyHandle(handle)
      setCiphertext(null)
      setIv(null)
      setDecrypted(null)
      const ts = new Date().toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      const attrs: string[] = []
      if (ckaExtractable) attrs.push('extractable')
      if (!ckaEncrypt) attrs.push('no-enc')
      if (!ckaDecrypt) attrs.push('no-dec')
      if (!ckaWrap) attrs.push('no-wrap')
      if (!ckaUnwrap) attrs.push('no-unwrap')
      addHsmKey({
        handle,
        family: 'aes',
        role: 'secret',
        label: `AES-${keyBits} Key${attrs.length ? ` (${attrs.join(', ')})` : ''}`,
        variant: String(keyBits),
        generatedAt: ts,
      })
    })

  const doEncrypt = () =>
    withLoading('enc', async () => {
      const M = moduleRef.current!
      const data = new TextEncoder().encode(plaintext)
      const result = hsm_aesEncrypt(
        M,
        hSessionRef.current,
        keyHandle!,
        data,
        mode === 'aes-gcm' ? 'gcm' : 'cbc'
      )
      setCiphertext(result.ciphertext)
      setIv(result.iv)
      setDecrypted(null)
    })

  const doDecrypt = () =>
    withLoading('dec', async () => {
      const M = moduleRef.current!
      const plain = hsm_aesDecrypt(
        M,
        hSessionRef.current,
        keyHandle!,
        ciphertext!,
        iv!,
        mode === 'aes-gcm' ? 'gcm' : 'cbc'
      )
      setDecrypted(new TextDecoder().decode(plain))
    })

  return (
    <div className="space-y-4">
      {/* Key generation */}
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
                setIv(null)
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
        <div className="flex flex-wrap gap-3">
          {(
            [
              ['CKA_ENCRYPT', ckaEncrypt, setCkaEncrypt],
              ['CKA_DECRYPT', ckaDecrypt, setCkaDecrypt],
              ['CKA_WRAP', ckaWrap, setCkaWrap],
              ['CKA_UNWRAP', ckaUnwrap, setCkaUnwrap],
              ['CKA_DERIVE', ckaDerive, setCkaDerive],
              ['CKA_EXTRACTABLE', ckaExtractable, setCkaExtractable],
            ] as [string, boolean, (v: boolean) => void][]
          ).map(([name, val, setter]) => (
            <label
              key={name}
              className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => setter(e.target.checked)}
                className="accent-primary w-3 h-3"
              />
              {name}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          C_GenerateKey(CKM_AES_KEY_GEN, keyBits={keyBits}) → handle
        </p>
      </div>

      {/* Plaintext */}
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
            setIv(null)
            setDecrypted(null)
          }}
          placeholder="Enter plaintext…"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={doEncrypt}
          disabled={keyHandle === null || anyLoading || !plaintext.length}
          className="flex-1"
        >
          {loadingOp === 'enc' && <Loader2 size={14} className="mr-2 animate-spin" />}
          <Lock size={14} className="mr-2" />
          Encrypt
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

      {/* Results */}
      {(ciphertext || decrypted) && (
        <div className="glass-panel p-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Result
          </p>
          {iv && <HsmResultRow label="IV (nonce)" value={toHex(iv)} />}
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

      <MiniPkcsLog />
    </div>
  )
}

// ── HMAC sub-panel ──────────────────────────────────────────────────────────────
