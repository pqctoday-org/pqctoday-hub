// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Lock, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import {
  CKM_SHA256_HMAC,
  CKM_SHA384_HMAC,
  CKM_SHA512_HMAC,
  CKM_SHA3_256_HMAC,
  CKM_SHA3_512_HMAC,
  hsm_generateAESKey,
  hsm_aesEncrypt,
  hsm_aesDecrypt,
  hsm_aesCtrEncrypt,
  hsm_aesCtrDecrypt,
  hsm_aesCmac,
  hsm_generateHMACKey,
  hsm_hmac,
  hsm_hmacVerify,
  hsm_generateRandom,
  hsm_seedRandom,
  hsm_aesWrapKey,
  hsm_unwrapKey,
  CKO_SECRET_KEY,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_EXTRACTABLE,
  CKA_VALUE_LEN,
  CKK_AES,
  type AttrDef,
} from '../../../wasm/softhsm'
import { useHsmContext } from './HsmContext'
import { HsmReadyGuard, HsmResultRow, toHex, hexSnippet } from './shared'

// ── Types ───────────────────────────────────────────────────────────────────────

type SymMode = 'aes-gcm' | 'aes-cbc' | 'aes-ctr' | 'aes-cmac' | 'hmac' | 'rng' | 'key-wrap'

const SYM_MODES: { id: SymMode; label: string; desc: string }[] = [
  { id: 'aes-gcm', label: 'AES-GCM', desc: 'Authenticated encryption (CKM_AES_GCM)' },
  { id: 'aes-cbc', label: 'AES-CBC', desc: 'Cipher Block Chaining + PKCS#7 (CKM_AES_CBC_PAD)' },
  {
    id: 'aes-ctr',
    label: 'AES-CTR',
    desc: 'Counter mode stream cipher (CKM_AES_CTR, PKCS#11 v3.2 §2.14.3)',
  },
  {
    id: 'aes-cmac',
    label: 'AES-CMAC',
    desc: 'Cipher-based MAC per NIST SP 800-38B (CKM_AES_CMAC)',
  },
  { id: 'hmac', label: 'HMAC', desc: 'Hash-based MAC via C_SignInit/C_VerifyInit' },
  { id: 'rng', label: 'RNG', desc: 'C_GenerateRandom / C_SeedRandom — hardware RNG' },
  { id: 'key-wrap', label: 'Key Wrap', desc: 'AES Key Wrap via C_WrapKey / C_UnwrapKey' },
]

const HMAC_ALGOS = [
  { label: 'HMAC-SHA-256', mech: CKM_SHA256_HMAC, outBytes: 32 },
  { label: 'HMAC-SHA-384', mech: CKM_SHA384_HMAC, outBytes: 48 },
  { label: 'HMAC-SHA-512', mech: CKM_SHA512_HMAC, outBytes: 64 },
  { label: 'HMAC-SHA3-256', mech: CKM_SHA3_256_HMAC, outBytes: 32 },
  { label: 'HMAC-SHA3-512', mech: CKM_SHA3_512_HMAC, outBytes: 64 },
] as const

// ── AES sub-panel ───────────────────────────────────────────────────────────────

const AesPanel = ({ mode }: { mode: 'aes-gcm' | 'aes-cbc' }) => {
  const { moduleRef, hSessionRef, addHsmKey } = useHsmContext()
  const [keyBits, setKeyBits] = useState<128 | 192 | 256>(256)
  const [keyHandle, setKeyHandle] = useState<number | null>(null)
  const [plaintext, setPlaintext] = useState('Hello, PQC World!')
  const [ciphertext, setCiphertext] = useState<Uint8Array | null>(null)
  const [iv, setIv] = useState<Uint8Array | null>(null)
  const [decrypted, setDecrypted] = useState<string | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const anyLoading = loadingOp !== null
  const mechLabel = mode === 'aes-gcm' ? 'AES-GCM' : 'AES-CBC-PAD'
  const mechHex = mode === 'aes-gcm' ? '0x1087' : '0x1085'

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
      const handle = hsm_generateAESKey(M, hSessionRef.current, keyBits)
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

      {/* PKCS#11 call trace */}
      <div className="glass-panel p-4 space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          PKCS#11 Call Sequence
        </p>
        <div className="space-y-1 text-xs font-mono">
          <div className="text-muted-foreground">
            <span className="text-foreground">C_EncryptInit</span>
            {`(hSession, ${mechHex} /* ${mechLabel} */, hKey) → `}
            <span className="text-status-success">CKR_OK</span>
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">C_Encrypt</span>
            {`(hSession, pPlain, plainLen, NULL, &ctLen) → `}
            <span className="text-status-success">CKR_OK</span> [size query]
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">C_Encrypt</span>
            {`(hSession, pPlain, plainLen, pCT, &ctLen) → `}
            <span className="text-status-success">CKR_OK</span>
            {mode === 'aes-gcm' ? ' [+16 B auth tag]' : ''}
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">C_DecryptInit</span>
            {`(hSession, ${mechHex}, hKey) → `}
            <span className="text-status-success">CKR_OK</span>
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">C_Decrypt</span>
            {`(hSession, pCT, ctLen, pPlain, &plainLen) → `}
            <span className="text-status-success">CKR_OK</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── HMAC sub-panel ──────────────────────────────────────────────────────────────

const HmacPanel = () => {
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

      {/* PKCS#11 call trace */}
      <div className="glass-panel p-4 space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          PKCS#11 Call Sequence
        </p>
        <div className="space-y-1 text-xs font-mono">
          <div className="text-muted-foreground">
            <span className="text-foreground">C_SignInit</span>
            {`(hSession, 0x${selectedMech.toString(16)} /* ${selectedAlgo.label} */, hKey) → `}
            <span className="text-status-success">CKR_OK</span>
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">C_Sign</span>
            {`(hSession, pData, dataLen, NULL, &macLen) → `}
            <span className="text-status-success">CKR_OK</span> [size query]
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">C_Sign</span>
            {`(hSession, pData, dataLen, pMAC, &macLen) → `}
            <span className="text-status-success">CKR_OK</span>
            {` → ${selectedAlgo.outBytes} bytes`}
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">C_VerifyInit</span>
            {`(hSession, 0x${selectedMech.toString(16)}, hKey) → `}
            <span className="text-status-success">CKR_OK</span>
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">C_Verify</span>
            {`(hSession, pData, dataLen, pMAC, macLen) → `}
            <span className="text-status-success">CKR_OK</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AES-CTR sub-panel ───────────────────────────────────────────────────────────

const AesCtrPanel = () => {
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

// ── AES-CMAC sub-panel ──────────────────────────────────────────────────────────

const AesCmacPanel = () => {
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

// ── RNG sub-panel ───────────────────────────────────────────────────────────────

const RngPanel = () => {
  const { moduleRef, hSessionRef } = useHsmContext()
  const [length, setLength] = useState(32)
  const [randomBytes, setRandomBytes] = useState<Uint8Array | null>(null)
  const [seedHex, setSeedHex] = useState('')
  const [seedResult, setSeedResult] = useState<string | null>(null)
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

  const doGenerate = () =>
    withLoading('gen', async () => {
      const M = moduleRef.current!
      const bytes = hsm_generateRandom(M, hSessionRef.current, length)
      setRandomBytes(bytes)
    })

  const doSeed = () =>
    withLoading('seed', async () => {
      const M = moduleRef.current!
      const bytes = new Uint8Array(seedHex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [])
      if (bytes.length === 0) throw new Error('Enter hex seed data')
      hsm_seedRandom(M, hSessionRef.current, bytes)
      setSeedResult(`Seeded ${bytes.length} bytes`)
      setTimeout(() => setSeedResult(null), 3000)
    })

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Generate Random Bytes
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {[16, 32, 48, 64, 128].map((n) => (
            <Button
              key={n}
              variant="ghost"
              size="sm"
              onClick={() => {
                setLength(n)
                setRandomBytes(null)
              }}
              disabled={anyLoading}
              className={
                length === n
                  ? 'bg-primary/20 text-primary text-xs h-7 px-3'
                  : 'text-muted-foreground text-xs h-7 px-3'
              }
            >
              {n} B
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={doGenerate}
            disabled={anyLoading}
            className="ml-auto h-7 text-xs"
          >
            {loadingOp === 'gen' && <Loader2 size={12} className="mr-1.5 animate-spin" />}
            Generate
          </Button>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          C_GenerateRandom(hSession, pRandom, {length}) → {length} bytes
        </p>
      </div>

      {randomBytes && (
        <div className="glass-panel p-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Result
          </p>
          <HsmResultRow label="Length" value={`${randomBytes.length} bytes`} mono={false} />
          <HsmResultRow label="Hex (snippet)" value={hexSnippet(randomBytes, 32)} />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Full hex output</p>
            <p className="text-xs font-mono bg-muted rounded px-3 py-2 break-all text-foreground/80 select-all">
              {toHex(randomBytes)}
            </p>
          </div>
        </div>
      )}

      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Seed RNG (optional)
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={seedHex}
            onChange={(e) => setSeedHex(e.target.value.replace(/[^0-9a-fA-F]/g, ''))}
            placeholder="Hex entropy (e.g. deadbeef01020304)"
            className="flex-1 text-xs rounded-lg px-3 py-1.5 bg-muted border border-input text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={doSeed}
            disabled={anyLoading || seedHex.length < 2}
            className="h-7 text-xs"
          >
            {loadingOp === 'seed' && <Loader2 size={12} className="mr-1.5 animate-spin" />}
            Seed
          </Button>
        </div>
        {seedResult && <p className="text-xs text-status-success animate-fade-in">{seedResult}</p>}
        <p className="text-xs text-muted-foreground font-mono">
          C_SeedRandom(hSession, pSeed, seedLen) → CKR_OK
        </p>
      </div>

      {error && <ErrorAlert message={error} />}
    </div>
  )
}

// ── Key Wrap sub-panel ──────────────────────────────────────────────────────────

const KeyWrapPanel = () => {
  const { moduleRef, hSessionRef, keysForFamily, addHsmKey } = useHsmContext()
  const [wrapKeyHandle, setWrapKeyHandle] = useState<number | null>(null)
  const [targetKeyHandle, setTargetKeyHandle] = useState<number | null>(null)
  const [wrappedHex, setWrappedHex] = useState<string | null>(null)
  const [unwrappedHandle, setUnwrappedHandle] = useState<number | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const aesKeys = keysForFamily('aes', 'secret')
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

  const doWrap = () =>
    withLoading('wrap', async () => {
      const M = moduleRef.current!
      const wrapped = hsm_aesWrapKey(M, hSessionRef.current, wrapKeyHandle!, targetKeyHandle!)
      setWrappedHex(toHex(wrapped))
      setUnwrappedHandle(null)
    })

  const doUnwrap = () =>
    withLoading('unwrap', async () => {
      if (!wrappedHex) throw new Error('No wrapped key data')
      const M = moduleRef.current!
      const wrappedBytes = new Uint8Array(wrappedHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
      const template: AttrDef[] = [
        { type: CKA_CLASS, value: CKO_SECRET_KEY },
        { type: CKA_KEY_TYPE, value: CKK_AES },
        { type: CKA_TOKEN, value: false },
        { type: CKA_EXTRACTABLE, value: true },
        { type: CKA_VALUE_LEN, value: 32 },
      ]
      const newHandle = hsm_unwrapKey(
        M,
        hSessionRef.current,
        wrapKeyHandle!,
        wrappedBytes,
        template
      )
      setUnwrappedHandle(newHandle)
      const ts = new Date().toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      addHsmKey({
        handle: newHandle,
        family: 'aes',
        role: 'secret',
        label: 'AES-256 (unwrapped)',
        variant: '256',
        generatedAt: ts,
      })
    })

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          AES Key Wrap (RFC 3394)
        </p>
        {aesKeys.length < 2 ? (
          <p className="text-xs text-muted-foreground">
            Generate at least 2 AES keys (one wrapping, one target) in AES-GCM/CBC/CTR mode first.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground w-24">Wrapping key:</span>
              <select
                value={wrapKeyHandle ?? ''}
                onChange={(e) => {
                  setWrapKeyHandle(Number(e.target.value) || null)
                  setWrappedHex(null)
                  setUnwrappedHandle(null)
                }}
                className="text-xs rounded-lg px-2 py-1.5 bg-muted border border-border text-foreground flex-1"
              >
                <option value="">Select…</option>
                {aesKeys.map((k) => (
                  <option key={k.handle} value={k.handle}>
                    h={k.handle} — {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground w-24">Key to wrap:</span>
              <select
                value={targetKeyHandle ?? ''}
                onChange={(e) => {
                  setTargetKeyHandle(Number(e.target.value) || null)
                  setWrappedHex(null)
                  setUnwrappedHandle(null)
                }}
                className="text-xs rounded-lg px-2 py-1.5 bg-muted border border-border text-foreground flex-1"
              >
                <option value="">Select…</option>
                {aesKeys
                  .filter((k) => k.handle !== wrapKeyHandle)
                  .map((k) => (
                    <option key={k.handle} value={k.handle}>
                      h={k.handle} — {k.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={doWrap}
          disabled={!wrapKeyHandle || !targetKeyHandle || anyLoading}
          className="flex-1"
        >
          {loadingOp === 'wrap' && <Loader2 size={14} className="mr-2 animate-spin" />}
          <Lock size={14} className="mr-2" /> Wrap Key
        </Button>
        <Button
          variant="outline"
          onClick={doUnwrap}
          disabled={!wrappedHex || !wrapKeyHandle || anyLoading}
          className="flex-1"
        >
          {loadingOp === 'unwrap' && <Loader2 size={14} className="mr-2 animate-spin" />}
          Unwrap Key
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {(wrappedHex || unwrappedHandle !== null) && (
        <div className="glass-panel p-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Result
          </p>
          {wrappedHex && (
            <>
              <HsmResultRow
                label="Wrapped key"
                value={hexSnippet(
                  new Uint8Array(wrappedHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))),
                  24
                )}
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Full wrapped key (hex)</p>
                <p className="text-xs font-mono bg-muted rounded px-3 py-2 break-all text-foreground/80 select-all">
                  {wrappedHex}
                </p>
              </div>
            </>
          )}
          {unwrappedHandle !== null && (
            <HsmResultRow label="Unwrapped handle" value={`h=${unwrappedHandle}`} mono={false} />
          )}
        </div>
      )}

      <div className="glass-panel p-4 space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          PKCS#11 Call Sequence
        </p>
        <div className="space-y-1 text-xs font-mono">
          <div className="text-muted-foreground">
            <span className="text-foreground">C_WrapKey</span>
            {`(hSession, CKM_AES_KEY_WRAP_KWP, hWrappingKey, hKey, pWrapped, &wrappedLen) → `}
            <span className="text-status-success">CKR_OK</span>
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground">C_UnwrapKey</span>
            {`(hSession, CKM_AES_KEY_WRAP_KWP, hUnwrapKey, pWrapped, wrappedLen, tpl, tplLen, &hNewKey) → `}
            <span className="text-status-success">CKR_OK</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main panel ──────────────────────────────────────────────────────────────────

export const HsmSymmetricPanel = () => {
  const { isReady } = useHsmContext()
  const [mode, setMode] = useState<SymMode>('aes-gcm')

  return (
    <HsmReadyGuard isReady={isReady}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-primary" />
          <h3 className="font-semibold text-base">HSM Symmetric Crypto — AES &amp; HMAC</h3>
        </div>

        {/* Mode selector */}
        <div className="flex flex-wrap gap-2">
          {SYM_MODES.map((m) => (
            <Button
              key={m.id}
              variant="ghost"
              size="sm"
              onClick={() => setMode(m.id)}
              className={
                mode === m.id
                  ? 'bg-primary/20 text-primary text-xs h-7 px-3'
                  : 'text-muted-foreground text-xs h-7 px-3'
              }
            >
              {m.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          {SYM_MODES.find((m) => m.id === mode)?.desc}
        </p>

        {/* Sub-panel */}
        {mode === 'aes-gcm' && <AesPanel mode="aes-gcm" />}
        {mode === 'aes-cbc' && <AesPanel mode="aes-cbc" />}
        {mode === 'aes-ctr' && <AesCtrPanel />}
        {mode === 'aes-cmac' && <AesCmacPanel />}
        {mode === 'hmac' && <HmacPanel />}
        {mode === 'rng' && <RngPanel />}
        {mode === 'key-wrap' && <KeyWrapPanel />}
      </div>
    </HsmReadyGuard>
  )
}
