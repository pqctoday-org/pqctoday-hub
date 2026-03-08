import { useState, MutableRefObject } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { Button } from '../../../ui/button'
import { ErrorAlert } from '../../../ui/error-alert'
import {
  hsm_generateMLKEMKeyPair,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_extractKeyValue,
} from '../../../../wasm/softhsm'
import { VariantSelector, ResultRow, KEM_SIZES, arraysEqual } from './SoftHsmUI'

interface MLKemDemoProps {
  moduleRef: MutableRefObject<SoftHSMModule | null>
  hSessionRef: MutableRefObject<number>
  sessionOpen: boolean
}

export const MLKemDemo = ({ moduleRef, hSessionRef, sessionOpen }: MLKemDemoProps) => {
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [kemError, setKemError] = useState<string | null>(null)
  const [kemVariant, setKemVariant] = useState<512 | 768 | 1024>(768)
  const [kemHandles, setKemHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [ciphertext, setCiphertext] = useState<Uint8Array | null>(null)
  const [secret1, setSecret1] = useState<Uint8Array | null>(null)
  const [secret2, setSecret2] = useState<Uint8Array | null>(null)

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

  const changeKemVariant = (v: 512 | 768 | 1024) => {
    setKemVariant(v)
    setKemHandles(null)
    setCiphertext(null)
    setSecret1(null)
    setSecret2(null)
    setKemError(null)
  }

  const doKemGenKeyPair = () =>
    withLoading('kem_gen', async () => {
      setKemError(null)
      setCiphertext(null)
      setSecret1(null)
      setSecret2(null)
      try {
        const M = getM()
        const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(
          M,
          hSessionRef.current,
          kemVariant
        )
        setKemHandles({ pub: pubHandle, priv: privHandle })
      } catch (e) {
        setKemError(String(e))
      }
    })

  const doEncapsulate = () =>
    withLoading('encapsulate', async () => {
      setKemError(null)
      setSecret1(null)
      setSecret2(null)
      try {
        const M = getM()
        const { ciphertextBytes, secretHandle } = hsm_encapsulate(
          M,
          hSessionRef.current,
          kemHandles!.pub,
          kemVariant
        )
        const ss1 = hsm_extractKeyValue(M, hSessionRef.current, secretHandle)
        setCiphertext(ciphertextBytes)
        setSecret1(ss1)
      } catch (e) {
        setKemError(String(e))
      }
    })

  const doDecapsulate = () =>
    withLoading('decapsulate', async () => {
      setKemError(null)
      setSecret2(null)
      try {
        const M = getM()
        const secretHandle2 = hsm_decapsulate(
          M,
          hSessionRef.current,
          kemHandles!.priv,
          ciphertext!,
          kemVariant
        )
        const ss2 = hsm_extractKeyValue(M, hSessionRef.current, secretHandle2)
        setSecret2(ss2)
      } catch (e) {
        setKemError(String(e))
      }
    })

  return (
    <div className={`glass-panel p-4 space-y-4 ${!sessionOpen ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-sm">ML-KEM Key Encapsulation (FIPS 203)</h3>
        <VariantSelector
          options={[512, 768, 1024]}
          value={kemVariant}
          onChange={changeKemVariant}
          prefix="ML-KEM"
          disabled={!sessionOpen || anyLoading}
        />
      </div>

      <div className="text-xs text-muted-foreground font-mono">
        pub: {KEM_SIZES[kemVariant].pub.toLocaleString()} B &nbsp;·&nbsp; ct:{' '}
        {KEM_SIZES[kemVariant].ct.toLocaleString()} B &nbsp;·&nbsp; ss: {KEM_SIZES[kemVariant].ss} B
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!sessionOpen || anyLoading}
          onClick={doKemGenKeyPair}
        >
          {isLoading('kem_gen') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          {kemHandles ? '✓ Key Pair' : 'Generate Key Pair'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!sessionOpen || !kemHandles || anyLoading}
          onClick={doEncapsulate}
        >
          {isLoading('encapsulate') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          Encapsulate
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!sessionOpen || !ciphertext || anyLoading}
          onClick={doDecapsulate}
        >
          {isLoading('decapsulate') && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          Decapsulate
        </Button>
      </div>

      <div className="space-y-1.5">
        <ResultRow label="Ciphertext" bytes={ciphertext} />
        <ResultRow label="Shared Secret 1" bytes={secret1} />
        <ResultRow label="Shared Secret 2" bytes={secret2} />
      </div>

      {secret1 && secret2 && (
        <div className="flex items-center gap-2 text-sm font-medium">
          {arraysEqual(secret1, secret2) ? (
            <>
              <CheckCircle size={16} className="text-status-success" />
              <span className="text-status-success">
                Secrets match — {secret1.length} bytes identical
              </span>
            </>
          ) : (
            <>
              <XCircle size={16} className="text-status-error" />
              <span className="text-status-error">Mismatch</span>
            </>
          )}
        </div>
      )}

      {kemError && <ErrorAlert message={kemError} />}
    </div>
  )
}
