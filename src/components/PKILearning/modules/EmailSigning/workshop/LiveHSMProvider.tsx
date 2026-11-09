// SPDX-License-Identifier: AGPL-3.0-only
/**
 * CMS worker / provider initialization status, separate from operation outcomes.
 * Worker contract: LOAD_AND_INIT; READY / INIT_DONE / ERROR / LOG / PONG.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, AlertTriangle, RefreshCw, FlaskConical, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { CopyButton } from '@/components/ui/CopyButton'
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

const HSM_CMS_RECIPE = [
  {
    title: 'Issue the sample certificate',
    command:
      "openssl req -new -x509 -key 'pkcs11:object=alice;type=private?pin-value=1234' -out alice.crt -subj '/CN=Alice/O=PQC Workshop/C=US' -days 365",
  },
  {
    title: 'Sign the entered payload',
    command:
      "openssl cms -sign -signer alice.crt -inkey 'pkcs11:object=alice;type=private?pin-value=1234' -in payload-alice.bin -binary -nodetach -outform DER -out signed-alice.p7m -md sha256",
  },
  {
    title: 'Verify and recover the payload',
    command:
      'openssl cms -verify -in signed-alice.p7m -inform DER -certfile alice.crt -CAfile alice.crt -binary -out out-alice.bin',
  },
] as const

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
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <FlaskConical size={18} className="text-primary" />
          Live HSM Provider — bundle smoke test
        </h2>
        <p className="text-sm text-muted-foreground">
          This panel checks whether the bundled CMS worker and PKCS#11 provider initialize.
          Registration alone does not establish that a particular key-generation, signing,
          verification, encryption or decryption operation succeeded. The separate sample controls
          below report their own executed operations and results.
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
              The HSM signing path requires a WASM bundle that includes the PKCS#11 provider. This
              feature is not available in the current environment — use Software mode instead.
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
        <p className="font-medium text-foreground">What initialization checks</p>
        <p>
          The worker reports the outcome of its provider-initialization request. Use each sample
          operation's output to inspect what that operation actually executed; initialization is not
          a substitute for an operation result. Evaluate provider setup and supported mechanisms for
          the exact version and configuration used by your own tools.
        </p>
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

      <section
        aria-label="ML-DSA-65 HSM command recipe"
        className="glass-panel min-w-0 space-y-3 p-4 text-sm"
      >
        <h3 className="font-semibold">Worked ML-DSA-65 HSM recipe</h3>
        <p>
          When the signing sample below is available (it needs the provider check above to finish
          without an error), select <strong>ML-DSA-65</strong>, keep <strong>Use HSM key</strong>{' '}
          selected, enter a fictional payload, then choose <strong>Sign + Verify</strong>. These are
          the provider-routed commands after token and key preparation, for the bundled OpenSSL
          3.6.3 and pkcs11-provider 1.1 sample. This named recipe stays ML-DSA-65 if you select a
          different algorithm below.
        </p>
        <p>
          The sample first initializes its own token and creates the <code>alice</code> key through
          PKCS#11 <code>C_GenerateKeyPair</code>. The commands below use workspace filenames. To
          copy them into a separately prepared workspace, create its own ML-DSA-65 token key named{' '}
          <code>alice</code> and supply the entered UTF-8 payload as <code>payload-alice.bin</code>.
          Another worker or a native terminal needs its own setup and key; matching labels do not
          share token objects. <code>genpkey -out pkcs11:…</code> is not this preparation: that
          output path writes a file rather than creating the required token object.
        </p>
        <p>
          In a session where pkcs11-provider is already registered, as in this sample and in OpenSSL
          Studio, the URI selects the sample key through that builtin provider; no ENGINE option or
          native module path is needed there. A native terminal must have the provider registered
          and configured first. <code>1234</code> is this fictional sample&apos;s public PIN, not a
          production credential-handling example.
        </p>
        {HSM_CMS_RECIPE.map(({ title, command }) => (
          <div key={title} className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-medium">{title}</h4>
              <CopyButton
                text={command}
                label={`Copy: ${title}`}
                className="h-auto max-w-full whitespace-normal text-left"
              />
            </div>
            <CodeBlock code={command} aria-label={title} className="mt-2 max-w-full" />
          </div>
        ))}
        <p>
          The copied commands use the explicit private-key URI returned by OpenSSL Studio. The CMS
          lesson retains its existing compatibility spelling,{' '}
          <code className="break-all">pkcs11:object=alice;pin-value=1234</code>, inside its separate
          worker. Both select that worker&apos;s own prepared sample key; this is not a transfer of
          token objects between workers.
        </p>
        <p>
          These workspace files are separate from the signing sample&apos;s internal{' '}
          <code>/ssl/</code> files. The sample runs the same certificate/signing operations with
          those internal paths, then copies its returned signed DER to{' '}
          <code>/ssl/in-alice.p7m</code> for verification. The copyable sequence instead verifies
          its own preceding <code>signed-alice.p7m</code> directly. <code>-binary</code> preserves
          payload bytes; <code>-nodetach</code> embeds them. The local self-signed certificate is
          the sample trust anchor. Inspect the certificate and downloaded CMS, and compare the
          recovered bytes with the input; initialization alone is not that result.
        </p>
        <p>
          With your production tools, evaluate provider and key selection, token key generation,
          actual artifact verification and failure reporting. Retain the configuration, public
          artifacts and input-byte comparison. A successful browser software-token sample does not
          establish physical-HSM protection, deployed trust or every mechanism&apos;s support.
        </p>
      </section>

      {/* Existing CMS sign+verify and encrypt+decrypt demonstrations work with
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
