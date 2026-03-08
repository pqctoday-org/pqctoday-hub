import { useState, MutableRefObject } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { Button } from '../../../ui/button'
import { Input } from '../../../ui/input'
import { ErrorAlert } from '../../../ui/error-alert'
import { FilterDropdown } from '../../../common/FilterDropdown'
import {
  hsm_generateMLDSAKeyPair,
  hsm_sign,
  hsm_verify,
  type MLDSASignOptions,
  type MLDSAPreHash,
} from '../../../../wasm/softhsm'
import { VariantSelector, ResultRow, DSA_SIZES, PREHASH_OPTIONS } from './SoftHsmUI'

interface MLDsaDemoProps {
  moduleRef: MutableRefObject<SoftHSMModule | null>
  hSessionRef: MutableRefObject<number>
  sessionOpen: boolean
}

export const MLDsaDemo = ({ moduleRef, hSessionRef, sessionOpen }: MLDsaDemoProps) => {
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [dsaError, setDsaError] = useState<string | null>(null)

  const [dsaVariant, setDsaVariant] = useState<44 | 65 | 87>(65)
  const [dsaHandles, setDsaHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [message, setMessage] = useState('Hello, PQC World!')
  const [signature, setSignature] = useState<Uint8Array | null>(null)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [dsaHedging, setDsaHedging] = useState<'preferred' | 'required' | 'deterministic'>(
    'preferred'
  )
  const [dsaContext, setDsaContext] = useState('')
  const [dsaPreHash, setDsaPreHash] = useState<'' | MLDSAPreHash>('')

  const isLoading = (op: string) => loadingOp === op
  const anyLoading = loadingOp !== null

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

  const changeDsaVariant = (v: 44 | 65 | 87) => {
    setDsaVariant(v)
    setDsaHandles(null)
    setSignature(null)
    setVerifyResult(null)
    setDsaError(null)
  }

  const doDsaGenKeyPair = () =>
    withLoading('dsa_gen', async () => {
      setDsaError(null)
      setSignature(null)
      setVerifyResult(null)
      try {
        const M = getM()
        const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(
          M,
          hSessionRef.current,
          dsaVariant
        )
        setDsaHandles({ pub: pubHandle, priv: privHandle })
      } catch (e) {
        setDsaError(String(e))
      }
    })

  const buildDsaOpts = (): MLDSASignOptions | undefined => {
    const opts: MLDSASignOptions = {}
    if (dsaHedging !== 'preferred') opts.hedging = dsaHedging
    if (dsaContext) opts.context = new TextEncoder().encode(dsaContext)
    if (dsaPreHash) opts.preHash = dsaPreHash
    return Object.keys(opts).length > 0 ? opts : undefined
  }

  const doSign = () =>
    withLoading('sign', async () => {
      setDsaError(null)
      setVerifyResult(null)
      try {
        const M = getM()
        const sig = hsm_sign(M, hSessionRef.current, dsaHandles!.priv, message, buildDsaOpts())
        setSignature(sig)
      } catch (e) {
        setDsaError(String(e))
      }
    })

  const doVerify = () =>
    withLoading('verify', async () => {
      setDsaError(null)
      try {
        const M = getM()
        const ok = hsm_verify(
          M,
          hSessionRef.current,
          dsaHandles!.pub,
          message,
          signature!,
          buildDsaOpts()
        )
        setVerifyResult(ok)
      } catch (e) {
        setDsaError(String(e))
      }
    })

  return (
    <div className={`glass-panel p-4 space-y-4 ${!sessionOpen ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-sm">ML-DSA Sign & Verify (FIPS 204)</h3>
        <VariantSelector
          options={[44, 65, 87]}
          value={dsaVariant}
          onChange={changeDsaVariant}
          prefix="ML-DSA"
          disabled={!sessionOpen || anyLoading}
        />
      </div>

      <div className="text-xs text-muted-foreground font-mono">
        pub: {DSA_SIZES[dsaVariant].pub.toLocaleString()} B &nbsp;·&nbsp; sig:{' '}
        {DSA_SIZES[dsaVariant].sig.toLocaleString()} B
      </div>

      <div>
        <label htmlFor="softhsm-dsa-message" className="text-xs text-muted-foreground mb-1 block">
          Message
        </label>
        <Input
          id="softhsm-dsa-message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            setSignature(null)
            setVerifyResult(null)
          }}
          disabled={!sessionOpen || anyLoading}
          className="font-mono text-xs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Hedging</span>
          <div className="flex gap-1">
            {(['preferred', 'required', 'deterministic'] as const).map((h) => (
              <Button
                key={h}
                variant="ghost"
                size="sm"
                disabled={!sessionOpen || anyLoading}
                onClick={() => {
                  setDsaHedging(h)
                  setSignature(null)
                  setVerifyResult(null)
                }}
                className={
                  dsaHedging === h
                    ? 'bg-primary/20 text-primary text-xs px-2 py-1 h-auto capitalize'
                    : 'text-muted-foreground text-xs px-2 py-1 h-auto capitalize'
                }
              >
                {h === 'deterministic' ? 'Determ.' : h.charAt(0).toUpperCase() + h.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs text-muted-foreground block mb-1">Pre-hash</span>
          <FilterDropdown
            noContainer
            items={PREHASH_OPTIONS}
            selectedId={dsaPreHash || 'All'}
            onSelect={(id) => {
              setDsaPreHash(id === 'All' ? '' : (id as MLDSAPreHash))
              setSignature(null)
              setVerifyResult(null)
            }}
            defaultLabel="Pure"
            defaultIcon={undefined}
          />
        </div>

        <div>
          <label htmlFor="softhsm-dsa-context" className="text-xs text-muted-foreground mb-1 block">
            Context (0-255 B)
          </label>
          <Input
            id="softhsm-dsa-context"
            value={dsaContext}
            onChange={(e) => {
              const v = e.target.value
              if (new TextEncoder().encode(v).length <= 255) {
                setDsaContext(v)
                setSignature(null)
                setVerifyResult(null)
              }
            }}
            placeholder="optional domain separator"
            disabled={!sessionOpen || anyLoading}
            className="font-mono text-xs"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!sessionOpen || anyLoading}
          onClick={doDsaGenKeyPair}
        >
          {isLoading('dsa_gen') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          {dsaHandles ? '✓ Key Pair' : 'Generate Key Pair'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!sessionOpen || !dsaHandles || anyLoading}
          onClick={doSign}
        >
          {isLoading('sign') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          Sign
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!sessionOpen || !signature || anyLoading}
          onClick={doVerify}
        >
          {isLoading('verify') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          Verify
        </Button>
      </div>

      <div className="space-y-1.5">
        <ResultRow label="Signature" bytes={signature} />
      </div>

      {verifyResult !== null && (
        <div className="flex items-center gap-2 text-sm font-medium">
          {verifyResult ? (
            <>
              <CheckCircle size={16} className="text-status-success" />
              <span className="text-status-success">Signature valid</span>
            </>
          ) : (
            <>
              <XCircle size={16} className="text-status-error" />
              <span className="text-status-error">Signature invalid</span>
            </>
          )}
        </div>
      )}

      {dsaError && <ErrorAlert message={dsaError} />}
    </div>
  )
}
