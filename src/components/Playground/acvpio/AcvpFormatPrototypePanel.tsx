// SPDX-License-Identifier: GPL-3.0-only
/**
 * ACVP-format import / response export — bounded conference prototype (WS-F,
 * F-5). Local file in → PKCS#11 run on the chosen WASM engine → response.json
 * (pure ACVP) + optional evidence.json out. Uses the exact pipeline the CLI
 * uses (src/services/acvp/run.ts).
 *
 * Privacy (F-5/F-9, plan Q9): the prompt lives only in this component's React
 * state. Nothing is uploaded, persisted (no localStorage / IndexedDB) or
 * logged; no ACVTS credential, session, submission or verdict retrieval
 * exists here. AcvpFormatPrototypePanel.test.tsx asserts that an import → run
 * → download makes no fetch/XHR/beacon/WebSocket call and no storage write.
 */
import { useRef, useState } from 'react'
import { AlertTriangle, Download, FileJson, Loader2, Play, Trash2, Upload } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { getSoftHSMCppModule, getSoftHSMRustModule, SOFTHSM_PRODUCT_VERSION } from '@/wasm/softhsm'
import { createPkcs11Engine } from '@/services/acvp/engine'
import {
  executePrepared,
  preparePrompt,
  type PrepareResult,
  type RunOutput,
} from '@/services/acvp/run'
import type { AcvpEngine, EngineIdentity } from '@/services/acvp/dispatch'
import { DISCLAIMER_GENERAL, DISCLAIMER_IMPORT, PROTOTYPE_LABEL } from '@/services/acvp/evidence'
import { PINNED_SCHEMAS } from '@/services/acvp/schemas/registry'
import type { JsonObject } from '@/services/acvp/ir'

export type PrototypeEngineId = 'cpp' | 'rust'

const BROWSER_ENGINES: Record<PrototypeEngineId, { label: string; bundle: string; impl: string }> =
  {
    cpp: {
      label: 'softhsmv3 C++ engine',
      bundle: 'softhsm-cpp-engine',
      impl: 'pqctoday-hsm softhsmv3 C++ (OpenSSL 3.6 backend), Emscripten WASM',
    },
    rust: {
      label: 'softhsmv3 Rust engine',
      bundle: 'softhsmrustv3-engine',
      impl: 'pqctoday-hsm softhsmrustv3 (Rust), wasm-bindgen WASM',
    },
  }

const browserIdentity = (id: PrototypeEngineId): EngineIdentity => ({
  id,
  label: BROWSER_ENGINES[id].label,
  implementation: BROWSER_ENGINES[id].impl,
  softhsmProductVersion: SOFTHSM_PRODUCT_VERSION,
  provenanceBundle: BROWSER_ENGINES[id].bundle,
  hsmCommit: null,
  builtAt: null,
  artifactPath: null,
  artifactSha256: null,
  artifactSha256Note: `Not computed in the browser: hashing the engine would need a second network fetch of its .wasm, and this panel makes none. Its source commit is recorded in public/wasm/wasm-provenance.json (bundle "${BROWSER_ENGINES[id].bundle}"); scripts/acvp-respond.ts records the artifact SHA-256.`,
})

/** Default engine loader: the same singletons the rest of the Playground uses. */
const defaultLoadEngine = async (id: PrototypeEngineId): Promise<AcvpEngine> => {
  const M = id === 'cpp' ? await getSoftHSMCppModule() : await getSoftHSMRustModule()
  return createPkcs11Engine(M, browserIdentity(id))
}

const defaultSaveFile = (fileName: string, text: string): void => {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const readFileText = (file: File): Promise<string> =>
  typeof file.text === 'function'
    ? file.text()
    : new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = () => reject(r.error)
        r.readAsText(file)
      })

const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null

export interface AcvpFormatPrototypePanelProps {
  /** Injection seam for tests; production uses the Playground's WASM singletons. */
  loadEngine?: (id: PrototypeEngineId) => Promise<AcvpEngine>
  /** Injection seam for tests; production triggers a Blob download. */
  saveFile?: (fileName: string, text: string) => void
}

export const AcvpFormatPrototypePanel = ({
  loadEngine = defaultLoadEngine,
  saveFile = defaultSaveFile,
}: AcvpFormatPrototypePanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [prepared, setPrepared] = useState<PrepareResult | null>(null)
  const [engineId, setEngineId] = useState<PrototypeEngineId>('rust')
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState<RunOutput | null>(null)
  const [runError, setRunError] = useState<string | null>(null)

  const clear = () => {
    setFileName(null)
    setPrepared(null)
    setOutput(null)
    setRunError(null)
  }

  const onFile = async (file: File) => {
    clear()
    setFileName(file.name)
    setPrepared(await preparePrompt(await readFileText(file)))
  }

  const run = async () => {
    if (!prepared?.ok) return
    setRunning(true)
    setOutput(null)
    setRunError(null)
    // Let the "running" state paint before the synchronous WASM work.
    await new Promise((r) => setTimeout(r, 0))
    let engine: AcvpEngine | null = null
    try {
      engine = await loadEngine(engineId)
      setOutput(await executePrepared(prepared, { engine, codePath: 'browser', appVersion }))
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e))
    } finally {
      engine?.close()
      setRunning(false)
    }
  }

  const summary = output?.evidence.summary as
    { testCases: number; answered: number; unsupported: number; error: number } | undefined
  const unsupportedRows = (output?.evidence.unsupported ?? []) as Array<{
    tgId: number
    scope: string
    reason: string
    tcIds: number[]
  }>
  const errorCases = ((output?.evidence.cases ?? []) as JsonObject[]).filter(
    (c) => c.disposition === 'error'
  )

  return (
    <section
      aria-labelledby="acvp-io-heading"
      data-testid="acvp-io-panel"
      className="glass-panel mt-4 space-y-3 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="acvp-io-heading" className="flex items-center gap-2 text-base font-bold">
          <FileJson size={16} className="text-primary" aria-hidden="true" />
          ACVP-format prompt import &amp; response export
        </h3>
        <span className="rounded border border-border bg-muted px-2 py-0.5 text-[10.5px] font-semibold uppercase text-muted-foreground">
          {PROTOTYPE_LABEL}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Supports exactly two pinned vector-set types:{' '}
        {PINNED_SCHEMAS.map((s) => `${s.algorithm} / ${s.mode} / ${s.revision}`).join(' and ')}.
        Only ML-KEM decapsulation groups and ML-DSA external-interface (pure and pre-hash) groups
        are executed; every other group or test is listed as unsupported and left out of the
        response, never guessed or defaulted.
      </p>

      <div
        role="note"
        className="flex gap-2 rounded-md border bg-status-warning p-3 text-xs text-foreground"
      >
        <AlertTriangle
          size={16}
          className="mt-0.5 shrink-0 text-status-warning"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="font-semibold">
            Issued ACVTS vector sets may be controlled laboratory data.
          </p>
          <p>
            The file you choose is read and processed only in this browser tab. It is not uploaded,
            not stored, and no network request carries its contents. Only load vector sets you are
            permitted to handle on this device.
          </p>
          <p data-testid="acvp-io-disclaimer-import">{DISCLAIMER_IMPORT}</p>
          <p className="text-muted-foreground">{DISCLAIMER_GENERAL}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          aria-label="ACVP prompt file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
            e.target.value = ''
          }}
        />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Import prompt.json
        </Button>
        <div role="group" aria-label="Engine" className="flex items-center gap-1">
          {(['cpp', 'rust'] as const).map((id) => (
            <Button
              key={id}
              size="sm"
              variant={engineId === id ? 'secondary' : 'ghost'}
              aria-pressed={engineId === id}
              onClick={() => setEngineId(id)}
              disabled={running}
            >
              {id === 'cpp' ? 'C++ engine' : 'Rust engine'}
            </Button>
          ))}
        </div>
        <Button
          variant="gradient"
          size="sm"
          onClick={() => void run()}
          disabled={!prepared?.ok || running}
        >
          {running ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          )}
          Run locally
        </Button>
        {fileName && (
          <Button variant="ghost" size="sm" onClick={clear} disabled={running}>
            <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Clear
          </Button>
        )}
      </div>

      <div aria-live="polite" className="space-y-2 text-xs">
        {fileName && prepared && !prepared.ok && (
          <div className="rounded-md border bg-status-error p-3">
            <p className="font-semibold text-status-error">
              {fileName} was rejected — {prepared.diagnostics.length} problem
              {prepared.diagnostics.length === 1 ? '' : 's'}:
            </p>
            <ul className="mt-1 max-h-48 list-disc space-y-0.5 overflow-y-auto pl-5 font-mono text-[11px]">
              {prepared.diagnostics.slice(0, 50).map((d, i) => (
                <li key={i}>
                  {d.path}: {d.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {fileName && prepared?.ok && (
          <p className="text-muted-foreground" data-testid="acvp-io-loaded">
            Loaded <span className="font-mono text-foreground">{fileName}</span>:{' '}
            {prepared.schema.algorithm} / {prepared.schema.mode} / {prepared.schema.revision}, vsId{' '}
            {prepared.ir.vsId}, {prepared.ir.testGroups.length} groups, {prepared.plan.items.length}{' '}
            test cases ({prepared.plan.items.filter((i) => i.kind === 'execute').length} executable
            here).
          </p>
        )}

        {runError && (
          <p className="text-status-error" role="alert">
            Run failed: {runError}
          </p>
        )}

        {output && summary && (
          <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
            <p className="font-medium text-foreground" data-testid="acvp-io-summary">
              {summary.testCases} test cases on the {BROWSER_ENGINES[engineId].label}:{' '}
              <span className="text-status-success">{summary.answered} answered</span> ·{' '}
              <span className="text-status-warning">{summary.unsupported} unsupported</span> ·{' '}
              <span className={clsx(summary.error > 0 ? 'text-status-error' : 'text-foreground')}>
                {summary.error} error
              </span>
            </p>
            <p className="text-muted-foreground">
              {output.evidence.evidenceClass === 'nist-acvp-reference-sample'
                ? 'This prompt is byte-identical to a pinned public NIST ACVP-Server sample; answered values can be compared with its published expectedResults.json.'
                : 'This prompt is not one of the pinned public samples; there is no local expected answer — only an ACVTS session can issue a verdict.'}
            </p>
            {unsupportedRows.length > 0 && (
              <details>
                <summary className="cursor-pointer text-foreground">
                  Unsupported ({summary.unsupported}) — why each was left out
                </summary>
                <ul className="mt-1 space-y-1 pl-4">
                  {unsupportedRows.map((u, i) => (
                    <li key={i}>
                      <span className="font-mono">
                        tgId {u.tgId} ({u.tcIds.length} test{u.tcIds.length === 1 ? '' : 's'},{' '}
                        {u.scope})
                      </span>
                      : {u.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {errorCases.length > 0 && (
              <ul className="space-y-0.5 pl-4 text-status-error">
                {errorCases.slice(0, 20).map((c, i) => (
                  <li key={i}>
                    tgId {String(c.tgId)} / tcId {String(c.tcId)}: {String(c.reason)}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => saveFile('response.json', output.response.text)}
              >
                <Download className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Download response.json
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => saveFile('evidence.json', output.evidenceText)}
              >
                <Download className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Download evidence.json
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
