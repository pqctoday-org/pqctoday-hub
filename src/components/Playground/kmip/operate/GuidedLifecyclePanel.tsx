// SPDX-License-Identifier: GPL-3.0-only
//
// The numbered Create → Activate → Use → Revoke button flow, extracted from
// KmipPlaygroundView's "Plane 2 · KMIP Lifecycle" section (K4b, gaps-closeout
// WP-4.2). Renders as a flat sequence of siblings (no wrapper element) so it
// slots into the parent's existing <section>, right after KeyConfigPanel —
// see KmipPlaygroundView.tsx's own comment at the call site.
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OperateContext } from './types'

export function GuidedLifecyclePanel({ operate }: { operate: OperateContext }) {
  const {
    busy,
    isSpecOnly,
    isSymmetric,
    isKem,
    priv,
    pub,
    sigHex,
    ctHex,
    encIvHex,
    message,
    setMessage,
    expert,
    onCreate,
    onActivate,
    onSign,
    onVerify,
    onEncapsulate,
    onDecapsulate,
    onEncrypt,
    onDecrypt,
    onGet,
    onRevoke,
    onRevokeThenRetrySign,
    run,
  } = operate

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Button
          disabled={busy}
          onClick={onCreate}
          data-tour="create-btn"
          className="col-span-2 gap-1.5"
        >
          <Play size={14} />{' '}
          {isSpecOnly
            ? '1 · Try to create (not runnable)'
            : isSymmetric
              ? '1 · Create symmetric key'
              : `1 · Create ${isKem ? 'KEM' : 'signing'} key pair`}
        </Button>
        <Button
          variant="secondary"
          disabled={busy || !priv}
          onClick={onActivate}
          data-tour="activate-btn"
          className="col-span-2"
        >
          2 · Activate
        </Button>
        {isKem ? (
          <>
            <Button variant="secondary" disabled={busy || !pub} onClick={onEncapsulate}>
              3 · Encapsulate
            </Button>
            <Button variant="secondary" disabled={busy || !ctHex} onClick={onDecapsulate}>
              4 · Decapsulate
            </Button>
          </>
        ) : isSymmetric ? (
          <>
            <Button variant="secondary" disabled={busy || !priv} onClick={onEncrypt}>
              3 · Encrypt
            </Button>
            <Button variant="secondary" disabled={busy || !ctHex || !encIvHex} onClick={onDecrypt}>
              4 · Decrypt
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              disabled={busy || !priv}
              onClick={onSign}
              data-tour="sign-btn"
            >
              3 · Sign
            </Button>
            <Button variant="secondary" disabled={busy || !sigHex} onClick={onVerify}>
              4 · Verify
            </Button>
            <Button
              variant="secondary"
              disabled={busy || !priv}
              onClick={onRevokeThenRetrySign}
              className="col-span-2"
            >
              5 · Revoke, then try to Sign again
            </Button>
          </>
        )}
      </div>

      {!isKem && (
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="message to sign"
          className="w-full mt-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
        />
      )}

      {expert && (
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => run({ op: 'Query' })}
            className="text-xs"
          >
            Query
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => run({ op: 'Locate' })}
            className="text-xs"
          >
            Locate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || !priv}
            onClick={onGet}
            className="text-xs"
          >
            Get
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || !priv}
            onClick={onRevoke}
            className="text-xs"
          >
            Revoke
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || !priv}
            onClick={() => priv && run({ op: 'Destroy', uid: priv })}
            className="text-xs"
          >
            Destroy
          </Button>
        </div>
      )}
    </>
  )
}
