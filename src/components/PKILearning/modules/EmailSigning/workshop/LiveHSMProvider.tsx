// SPDX-License-Identifier: GPL-3.0-only
/**
 * Step 4 — Live HSM Provider (Phase 1 foundation).
 *
 * Lazy-loads the CMS worker, asks it to bring up the OpenSSL WASM module
 * with pkcs11-provider statically linked, and reports the registration
 * status. This step proves the end-to-end bundle wiring works BEFORE the
 * Phase 2 service layer (sign / verify / encrypt / decrypt) is added.
 *
 * Worker contract:
 *   Outbound  LOAD_AND_INIT
 *   Inbound   READY / INIT_DONE / ERROR / LOG / PONG
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, AlertTriangle, RefreshCw, FlaskConical, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  WorkshopOperationLog,
  type LogEntry,
} from '@/components/PKILearning/common/WorkshopOperationLog'
import { MLDSASignDemo } from './MLDSASignDemo'
import { MLKEMEncryptDemo } from './MLKEMEncryptDemo'
import { DualSignDemo } from './DualSignDemo'

type InitStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; detail?: string }
  | { kind: 'already'; detail?: string }
  | { kind: 'provider_missing'; detail: string }
  | { kind: 'provider_error'; code: number; detail: string }
  | { kind: 'error'; detail: string }

const REQUEST_ID = 'cms-init'

export function LiveHSMProvider() {
  const workerRef = useRef<Worker | null>(null)
  const [status, setStatus] = useState<InitStatus>({ kind: 'loading' })
  const [logs, setLogs] = useState<LogEntry[]>([])

  const spawnWorker = useCallback((): Worker => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    const worker = new Worker(new URL('../worker/cms.worker.ts', import.meta.url), {
      type: 'classic',
    })
    workerRef.current = worker
    worker.addEventListener('message', (e: MessageEvent) => {
      const msg = e.data as
        | { type: 'READY' }
        | {
            type: 'INIT_DONE'
            status: 'ok' | 'already' | 'provider_missing' | 'provider_error'
            code: number
            detail?: string
          }
        | { type: 'LOG'; stream: 'stdout' | 'stderr'; message: string }
        | { type: 'ERROR'; error: string }
        | { type: 'PONG' }
      if (msg.type === 'READY') {
        worker.postMessage({ type: 'LOAD_AND_INIT', requestId: REQUEST_ID })
      } else if (msg.type === 'INIT_DONE') {
        setStatus(
          msg.status === 'ok'
            ? { kind: 'ok' }
            : msg.status === 'already'
              ? { kind: 'already' }
              : msg.status === 'provider_missing'
                ? { kind: 'provider_missing', detail: msg.detail ?? 'symbol missing' }
                : { kind: 'provider_error', code: msg.code, detail: msg.detail ?? 'unknown' }
        )
      } else if (msg.type === 'LOG') {
        setLogs((prev) =>
          [
            ...prev,
            {
              status: msg.stream === 'stderr' ? 'error' : 'success',
              message: msg.message,
            } satisfies LogEntry,
          ].slice(-50)
        )
      } else if (msg.type === 'ERROR') {
        setStatus({ kind: 'error', detail: msg.error })
      }
    })
    return worker
  }, [])

  const startInit = useCallback(() => {
    setStatus({ kind: 'loading' })
    setLogs([])
    spawnWorker()
  }, [spawnWorker])

  // Auto-init on mount — initial status is 'loading' from useState below so we
  // don't need to setState from inside the effect, satisfying
  // react-hooks/set-state-in-effect.
  useEffect(() => {
    spawnWorker()
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [spawnWorker])

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <FlaskConical size={18} className="text-primary" />
          Live HSM Provider — bundle smoke test
        </h3>
        <p className="text-sm text-muted-foreground">
          Loads the OpenSSL WASM bundle with{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">pkcs11-provider</code> +{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">softhsmv3</code> statically linked,
          registers the provider via <code className="text-xs">pqctoday_cms_init()</code>, and
          confirms the round-trip works. Real CMS sign/verify/encrypt/decrypt operations land in
          Phase 2 once this foundation is green.
        </p>
      </header>

      <div className="glass-panel space-y-3 p-4">
        <StatusBanner status={status} />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={startInit}
            disabled={status.kind === 'loading'}
            className="gap-1.5"
          >
            <RefreshCw size={14} className={status.kind === 'loading' ? 'animate-spin' : ''} />
            Re-run init
          </Button>
          {status.kind === 'provider_missing' && (
            <span className="text-xs text-muted-foreground">
              Rebuild with{' '}
              <code className="rounded bg-muted px-1 py-0.5">npm run build:openssl-wasm</code> (or
              run <code className="rounded bg-muted px-1 py-0.5">bash build-wasm.sh</code>) so the
              new symbol lands in <code className="text-xs">public/wasm/openssl.wasm</code>.
            </span>
          )}
        </div>
      </div>

      {logs.length > 0 && (
        <details className="glass-panel p-4">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Worker logs ({logs.length})
          </summary>
          <div className="mt-2">
            <WorkshopOperationLog entries={logs} className="max-h-64" />
          </div>
        </details>
      )}

      <div className="glass-panel space-y-2 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">What this proves</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <code>openssl.wasm</code> in <code>public/wasm/</code> includes both pkcs11-provider and
            softhsmv3 as statically-linked archives.
          </li>
          <li>
            The exported <code className="rounded bg-muted px-1 py-0.5">_pqctoday_cms_init</code>{' '}
            entry point registers the provider and loads its OPENSSL_CONF stanza.
          </li>
          <li>
            From here, an <code>openssl cms -sign -signer pkcs11:object=alice -keyform engine</code>
            invocation can route signing to softhsmv3 in-process (Phase 3).
          </li>
        </ul>
        <p className="pt-2">
          Source:{' '}
          <a
            href="https://github.com/latchset/pkcs11-provider"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-primary hover:underline"
          >
            pkcs11-provider <ExternalLink size={10} />
          </a>{' '}
          vendored at{' '}
          <code className="rounded bg-muted px-1 py-0.5">
            pqctoday-hsm/src/vendor/pkcs11-provider/
          </code>
          .
        </p>
      </div>

      {/* Phase 2 + 4 — CMS sign+verify and encrypt+decrypt. Both work with
          software keys today, independent of provider symbol landing. The
          HSM toggle inside each demo is only enabled when the provider
          registration succeeded. */}
      {(status.kind === 'ok' ||
        status.kind === 'already' ||
        status.kind === 'provider_missing') && (
        <>
          <MLDSASignDemo providerReady={status.kind === 'ok' || status.kind === 'already'} />
          <MLKEMEncryptDemo providerReady={status.kind === 'ok' || status.kind === 'already'} />
          <DualSignDemo providerReady={status.kind === 'ok' || status.kind === 'already'} />
        </>
      )}
    </div>
  )
}

function StatusBanner({ status }: { status: InitStatus }) {
  if (status.kind === 'idle' || status.kind === 'loading') {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        <RefreshCw size={16} className="animate-spin" />
        Loading openssl.wasm and registering pkcs11-provider…
      </div>
    )
  }
  if (status.kind === 'ok' || status.kind === 'already') {
    return (
      <div className="flex items-center gap-2 rounded-md border border-status-success/30 bg-status-success/10 p-3 text-sm text-status-success">
        <CheckCircle2 size={16} />
        {status.kind === 'ok'
          ? 'Provider registered (pkcs11-provider 1.1, softhsmv3 backend).'
          : 'Provider already registered (idempotent — no-op on subsequent calls).'}
      </div>
    )
  }
  if (status.kind === 'provider_missing') {
    return (
      <div className="flex items-start gap-2 rounded-md border border-status-warning/30 bg-status-warning/10 p-3 text-sm text-status-warning">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">openssl.wasm does not export pqctoday_cms_init</p>
          <p className="mt-1 text-xs">{status.detail}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-2 rounded-md border border-status-error/30 bg-status-error/10 p-3 text-sm text-status-error">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">Provider init failed</p>
        <p className="mt-1 text-xs">{status.detail}</p>
      </div>
    </div>
  )
}
