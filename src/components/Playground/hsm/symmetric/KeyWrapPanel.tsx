import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { Button } from '../../../../ui/button'
import { ErrorAlert } from '../../../../ui/error-alert'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
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
} from '../../../../../wasm/softhsm'
import { useHsmContext } from '../HsmContext'
import { HsmResultRow, toHex, hexSnippet } from '../shared'

export const KeyWrapPanel = () => {
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
              <FilterDropdown
                items={aesKeys.map((k) => ({
                  id: String(k.handle),
                  label: `h=${k.handle} — ${k.label}`,
                }))}
                selectedId={wrapKeyHandle !== null ? String(wrapKeyHandle) : 'All'}
                onSelect={(id) => {
                  setWrapKeyHandle(id === 'All' ? null : parseInt(id, 10) || null)
                  setWrappedHex(null)
                  setUnwrappedHandle(null)
                }}
                defaultLabel="Select…"
                noContainer
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground w-24">Key to wrap:</span>
              <FilterDropdown
                items={aesKeys
                  .filter((k) => k.handle !== wrapKeyHandle)
                  .map((k) => ({ id: String(k.handle), label: `h=${k.handle} — ${k.label}` }))}
                selectedId={targetKeyHandle !== null ? String(targetKeyHandle) : 'All'}
                onSelect={(id) => {
                  setTargetKeyHandle(id === 'All' ? null : parseInt(id, 10) || null)
                  setWrappedHex(null)
                  setUnwrappedHandle(null)
                }}
                defaultLabel="Select…"
                noContainer
              />
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
