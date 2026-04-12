// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Lock, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import { useHsmContext } from './HsmContext'
import { HsmResultRow, toHex, hexSnippet } from './shared'
import { MiniPkcsLog } from '../components/MiniPkcsLog'
import {
  hsm_generateMLKEMKeyPair,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_extractKeyValue,
} from '../../../wasm/softhsm'

export const HsmKemPanel = () => {
  const { moduleRef, hSessionRef, addHsmKey, engineMode } = useHsmContext()
  const [variant, setVariant] = useState<512 | 768 | 1024>(768)
  const [pubHandle, setPubHandle] = useState<number | null>(null)
  const [privHandle, setPrivHandle] = useState<number | null>(null)
  const [ciphertext, setCiphertext] = useState<Uint8Array | null>(null)
  const [encapSecret, setEncapSecret] = useState<Uint8Array | null>(null)
  const [decapSecret, setDecapSecret] = useState<Uint8Array | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkLoading = loadingOp !== null

  const withLoading = async (op: string, fn: () => Promise<void> | void) => {
    setLoadingOp(op)
    setError(null)
    try {
      await fn()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadingOp(null)
    }
  }

  const doGenKey = () =>
    withLoading('gen', () => {
      const M = moduleRef.current!
      const hSession = hSessionRef.current
      const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(M, hSession, variant)

      setPubHandle(pubHandle)
      setPrivHandle(privHandle)
      setCiphertext(null)
      setEncapSecret(null)
      setDecapSecret(null)

      const ts = new Date().toLocaleTimeString([], { hour12: false })
      const engineLabel = engineMode === 'rust' ? 'rust' : 'cpp'
      addHsmKey({
        handle: pubHandle,
        family: 'ml-kem',
        role: 'public',
        label: `ML-KEM-${variant} Public`,
        variant: String(variant),
        engine: engineLabel,
        generatedAt: ts,
      })
      addHsmKey({
        handle: privHandle,
        family: 'ml-kem',
        role: 'private',
        label: `ML-KEM-${variant} Private`,
        variant: String(variant),
        engine: engineLabel,
        generatedAt: ts,
      })
    })

  const doEncap = () =>
    withLoading('encap', () => {
      const M = moduleRef.current!
      const result = hsm_encapsulate(M, hSessionRef.current, pubHandle!, variant)
      const rawSecret = hsm_extractKeyValue(M, hSessionRef.current, result.secretHandle)
      setCiphertext(result.ciphertextBytes)
      setEncapSecret(rawSecret)
      setDecapSecret(null)
    })

  const doDecap = () =>
    withLoading('decap', () => {
      const M = moduleRef.current!
      const secHandle = hsm_decapsulate(M, hSessionRef.current, privHandle!, ciphertext!, variant)
      const rawSecret = hsm_extractKeyValue(M, hSessionRef.current, secHandle)
      setDecapSecret(rawSecret)
    })

  const isMatch =
    encapSecret &&
    decapSecret &&
    encapSecret.length === decapSecret.length &&
    encapSecret.every((val, i) => val === decapSecret[i])

  return (
    <div className="space-y-4">
      {/* Parameter Set */}
      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          ML-KEM Parameters
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          {([512, 768, 1024] as const).map((v) => (
            <Button
              key={v}
              variant="ghost"
              size="sm"
              disabled={checkLoading}
              onClick={() => {
                setVariant(v)
                setPubHandle(null)
                setPrivHandle(null)
                setCiphertext(null)
                setEncapSecret(null)
                setDecapSecret(null)
              }}
              className={
                variant === v
                  ? 'bg-primary/20 text-primary text-xs h-7 px-3'
                  : 'text-muted-foreground text-xs h-7 px-3'
              }
            >
              ML-KEM-{v}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={checkLoading}
            onClick={doGenKey}
            className="ml-auto h-7 text-xs"
          >
            {loadingOp === 'gen' && <Loader2 size={12} className="mr-1.5 animate-spin" />}
            {pubHandle !== null ? `✓ pub=${pubHandle}, prv=${privHandle}` : 'Generate Key Pair'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          {`C_GenerateKeyPair(CKM_ML_KEM, ML-KEM-${variant}) → { pub: ${pubHandle ?? '?'}, prv: ${privHandle ?? '?'} }`}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={doEncap}
          disabled={pubHandle === null || checkLoading}
          className="flex-1"
        >
          {loadingOp === 'encap' && <Loader2 size={14} className="mr-2 animate-spin" />}
          <ArrowRight size={14} className="mr-2" /> Encapsulate
        </Button>
        <Button
          variant="outline"
          onClick={doDecap}
          disabled={ciphertext === null || privHandle === null || checkLoading}
          className="flex-1"
        >
          {loadingOp === 'decap' && <Loader2 size={14} className="mr-2 animate-spin" />}
          <Lock size={14} className="mr-2" /> Decapsulate
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {(encapSecret || decapSecret) && (
        <div className="glass-panel p-4 space-y-3 mt-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Result
          </p>
          {encapSecret && (
            <>
              <HsmResultRow label="Original Secret" value={toHex(encapSecret)} />
              <HsmResultRow
                label="Ciphertext snippet"
                value={`${hexSnippet(ciphertext!, 24)} (${ciphertext!.length} bytes)`}
              />
            </>
          )}

          {decapSecret && (
            <>
              <HsmResultRow label="Recovered Secret" value={toHex(decapSecret)} />
              <div
                className={`text-xs font-mono px-3 py-2 rounded flex items-center gap-2 ${
                  isMatch
                    ? 'bg-status-success/20 text-status-success'
                    : 'bg-status-error/20 text-status-error'
                }`}
              >
                {isMatch ? '✓ Secret Match' : '✗ Secret Mismatch'}
              </div>
            </>
          )}
        </div>
      )}

      <MiniPkcsLog />
    </div>
  )
}
