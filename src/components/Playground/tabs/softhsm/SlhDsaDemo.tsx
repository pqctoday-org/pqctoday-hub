import { useState, MutableRefObject } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { Button } from '../../../ui/button'
import { Input } from '../../../ui/input'
import { ErrorAlert } from '../../../ui/error-alert'
import { FilterDropdown } from '../../../common/FilterDropdown'
import {
  hsm_generateSLHDSAKeyPair,
  hsm_slhdsaSign,
  hsm_slhdsaVerify,
  type SLHDSAPreHash,
  CKP_SLH_DSA_SHA2_128S,
} from '../../../../wasm/softhsm'
import { ResultRow, SLH_DSA_PARAM_SET_OPTIONS, PREHASH_OPTIONS } from './SoftHsmUI'

interface SlhDsaDemoProps {
  moduleRef: MutableRefObject<SoftHSMModule | null>
  hSessionRef: MutableRefObject<number>
  sessionOpen: boolean
}

export const SlhDsaDemo = ({ moduleRef, hSessionRef, sessionOpen }: SlhDsaDemoProps) => {
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [slhdsaError, setSlhdsaError] = useState<string | null>(null)

  const [slhdsaParamSetId, setSlhdsaParamSetId] = useState('sha2-128s')
  const [slhdsaHandles, setSlhdsaHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [slhdsaMessage, setSlhdsaMessage] = useState('Hello, PQC World!')
  const [slhdsaSignature, setSlhdsaSignature] = useState<Uint8Array | null>(null)
  const [slhdsaVerifyResult, setSlhdsaVerifyResult] = useState<boolean | null>(null)
  const [slhdsaPreHash, setSlhdsaPreHash] = useState<'' | SLHDSAPreHash>('')

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

  const getSlhdsaParamSetCkp = () =>
    SLH_DSA_PARAM_SET_OPTIONS.find((o) => o.id === slhdsaParamSetId)?.ckp ?? CKP_SLH_DSA_SHA2_128S

  const changeSlhdsaParamSet = (id: string) => {
    setSlhdsaParamSetId(id)
    setSlhdsaHandles(null)
    setSlhdsaSignature(null)
    setSlhdsaVerifyResult(null)
    setSlhdsaError(null)
  }

  const doSlhdsaGenKeyPair = () =>
    withLoading('slhdsa_gen', async () => {
      setSlhdsaError(null)
      setSlhdsaSignature(null)
      setSlhdsaVerifyResult(null)
      try {
        const M = getM()
        const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(
          M,
          hSessionRef.current,
          getSlhdsaParamSetCkp()
        )
        setSlhdsaHandles({ pub: pubHandle, priv: privHandle })
      } catch (e) {
        setSlhdsaError(String(e))
      }
    })

  const doSlhdsaSign = () =>
    withLoading('slhdsa_sign', async () => {
      setSlhdsaError(null)
      setSlhdsaVerifyResult(null)
      try {
        const M = getM()
        const opts = slhdsaPreHash ? { preHash: slhdsaPreHash } : undefined
        const sig = hsm_slhdsaSign(M, hSessionRef.current, slhdsaHandles!.priv, slhdsaMessage, opts)
        setSlhdsaSignature(sig)
      } catch (e) {
        setSlhdsaError(String(e))
      }
    })

  const doSlhdsaVerify = () =>
    withLoading('slhdsa_verify', async () => {
      setSlhdsaError(null)
      try {
        const M = getM()
        const opts = slhdsaPreHash ? { preHash: slhdsaPreHash } : undefined
        const ok = hsm_slhdsaVerify(
          M,
          hSessionRef.current,
          slhdsaHandles!.pub,
          slhdsaMessage,
          slhdsaSignature!,
          opts
        )
        setSlhdsaVerifyResult(ok)
      } catch (e) {
        setSlhdsaError(String(e))
      }
    })

  return (
    <div className={`glass-panel p-4 space-y-4 ${!sessionOpen ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-sm">SLH-DSA Sign & Verify (FIPS 205)</h3>
        <FilterDropdown
          noContainer
          items={SLH_DSA_PARAM_SET_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
          selectedId={slhdsaParamSetId}
          onSelect={(id) => {
            if (id !== 'All') changeSlhdsaParamSet(id)
          }}
          defaultLabel="SHA2-128s"
          defaultIcon={undefined}
        />
      </div>

      {(() => {
        const ps = SLH_DSA_PARAM_SET_OPTIONS.find((o) => o.id === slhdsaParamSetId)
        return ps ? (
          <div className="text-xs text-muted-foreground font-mono">
            pub: {ps.pub} B &nbsp;·&nbsp; sig: {ps.sig.toLocaleString()} B
          </div>
        ) : null
      })()}

      <div>
        <label
          htmlFor="softhsm-slhdsa-message"
          className="text-xs text-muted-foreground mb-1 block"
        >
          Message
        </label>
        <Input
          id="softhsm-slhdsa-message"
          value={slhdsaMessage}
          onChange={(e) => {
            setSlhdsaMessage(e.target.value)
            setSlhdsaSignature(null)
            setSlhdsaVerifyResult(null)
          }}
          disabled={!sessionOpen || anyLoading}
          className="font-mono text-xs"
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Pre-hash</span>
          <FilterDropdown
            noContainer
            items={PREHASH_OPTIONS}
            selectedId={slhdsaPreHash || 'All'}
            onSelect={(id) => {
              setSlhdsaPreHash(id === 'All' ? '' : (id as SLHDSAPreHash))
              setSlhdsaSignature(null)
              setSlhdsaVerifyResult(null)
            }}
            defaultLabel="Pure"
            defaultIcon={undefined}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!sessionOpen || anyLoading}
          onClick={doSlhdsaGenKeyPair}
        >
          {isLoading('slhdsa_gen') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          {slhdsaHandles ? '✓ Key Pair' : 'Generate Key Pair'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!sessionOpen || !slhdsaHandles || anyLoading}
          onClick={doSlhdsaSign}
        >
          {isLoading('slhdsa_sign') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          Sign
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!sessionOpen || !slhdsaSignature || anyLoading}
          onClick={doSlhdsaVerify}
        >
          {isLoading('slhdsa_verify') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          Verify
        </Button>
      </div>

      <div className="space-y-1.5">
        <ResultRow label="Signature" bytes={slhdsaSignature} />
      </div>

      {slhdsaVerifyResult !== null && (
        <div className="flex items-center gap-2 text-sm font-medium">
          {slhdsaVerifyResult ? (
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

      {slhdsaError && <ErrorAlert message={slhdsaError} />}
    </div>
  )
}
