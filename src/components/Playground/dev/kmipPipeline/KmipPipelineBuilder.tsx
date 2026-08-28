// SPDX-License-Identifier: GPL-3.0-only
/**
 * KmipPipelineBuilder — the KMIP/CACP Developer tab (dev-tabs-pkcs11-kmip
 * plan, WS-E + WS-G), embedded as a new plane in the existing KMIP/CACP
 * playground, executing for real against the P3-proven Pyodide +
 * pqctoday_kmip shim seam.
 *
 * DELIBERATELY SMALLER than the PKCS#11 side's drag-and-drop
 * PkcsPipelineBuilder: KMIP steps come in four structurally different
 * kinds (lifecycle op / load-policy / dry-run / expect-deny), each with
 * different fields, so this ships as a TEMPLATE-based ordered step list
 * (pick a template, see its real steps, edit the underlying Python) rather
 * than a from-scratch drag/drop palette assembling arbitrary sequences.
 * Still a real graphical builder — steps are visible, individually
 * annotated, run live, and show real per-step pass/fail — just not
 * freeform assembly. A drag/drop KMIP canvas is a real follow-on, not
 * attempted here.
 *
 * D1 (editor ↔ builder sync) and D2 (save/export) reuse the exact same
 * model and pipelineRun.ts persistence helpers the PKCS#11 tab uses.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Loader2, Download, Save, Upload, X } from 'lucide-react'
import { Button } from '../../../ui/button'
import { Card } from '../../../ui/card'
import type { KmipEngine } from '../../../../wasm/kmip/kmipEngine'
import { createKmipBridge } from '../../../../wasm/pyodide/kmipBridge'
import { bootPyRuntime, runPython } from '../../../../services/python/pyRuntime'
import { KMIP_PRIMITIVES } from './kmipPipelinePrimitives'
import { emitKmipPipeline, DEFAULT_KMIP_MESSAGE, type KmipStep, type KmipStepStatus } from './kmipPipelineCodegen'
import { KMIP_TEMPLATES, KMIP_TEMPLATE_NAMES, KMIP_TEMPLATE_OUTCOMES } from './kmipPipelineTemplates'
import { parseRun, loadStore, saveStore, exportPipelineJson, importPipelineJson, type PipelineStore } from '../pipeline/pipelineRun'

const STORE_KEY = 'pqctoday-hub-kmip-pipelines-v1'
const EXPORT_SCHEMA = 'pqctoday-hub-kmip-pipeline-v1'

const STATUS_STYLE: Record<KmipStepStatus, { cls: string; label: string } | null> = {
  idle: null,
  running: { cls: 'text-blue-500', label: '· running' },
  ok: { cls: 'text-emerald-500', label: '✓ ran' },
  error: { cls: 'text-red-500', label: '✗ failed' },
  skipped: { cls: 'text-muted-foreground', label: '— skipped' },
}

function stepLabel(step: KmipStep): string {
  if (step.kind === 'op') return `${KMIP_PRIMITIVES[step.primId]?.label ?? step.primId} · ${step.op}`
  if (step.kind === 'load-policy') return `Load policy: ${step.policyFile}`
  if (step.kind === 'dry-run') return `Dry-run: ${step.op}${step.algorithm ? ` (${step.algorithm})` : ''}`
  return `Expect deny: ${step.targetStepId}`
}

export interface KmipPipelineBuilderProps {
  engine: KmipEngine | null
}

export const KmipPipelineBuilder: React.FC<KmipPipelineBuilderProps> = ({ engine }) => {
  const [pipelineName, setPipelineName] = useState('Governed lifecycle')
  const [steps, setSteps] = useState<KmipStep[]>(() => KMIP_TEMPLATES['Governed lifecycle'] ?? [])
  const [message, setMessage] = useState(DEFAULT_KMIP_MESSAGE)
  const [store, setStore] = useState<PipelineStore<KmipStep>>(() => loadStore<KmipStep>(STORE_KEY))
  const [notice, setNotice] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const [stepState, setStepState] = useState<Record<string, { status: KmipStepStatus; output: string | null }>>({})
  const [detached, setDetached] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generatedPy = useMemo(() => emitKmipPipeline(steps, { message }), [steps, message])
  const activeCode = detached ?? generatedPy

  const flash = (msg: string) => { setNotice(msg); window.setTimeout(() => setNotice(null), 2600) }

  const applyTemplate = (name: string) => {
    setPipelineName(name)
    setSteps(KMIP_TEMPLATES[name] ?? [])
    setStepState({})
    setRunError(null); setElapsedMs(null)
    setDetached(null)
  }

  const runAll = useCallback(async () => {
    if (!engine) { setRunError('KMIP engine not ready yet — try again in a moment.'); return }
    setRunning(true)
    setRunError(null)
    if (!detached) {
      setStepState(Object.fromEntries(steps.map((s) => [s.id, { status: 'running' as KmipStepStatus, output: null }])))
    }
    const code = detached ?? emitKmipPipeline(steps, { message })
    const t0 = performance.now()
    try {
      const py = await bootPyRuntime()
      const bridge = createKmipBridge(engine)
      py.registerJsModule('kmip_bridge', bridge)
      const result = await runPython(code)
      const elapsed = performance.now() - t0
      if (!detached) {
        const outcome = parseRun(result.stdout + (result.error ? `\n${result.error}` : ''), steps, result.ok ? 0 : 1)
        setStepState(Object.fromEntries(steps.map((s) => [
          s.id,
          {
            status: outcome.status[s.id] ?? 'skipped',
            output: outcome.text[s.id] || null,
          },
        ])))
        setRunError(outcome.error)
      } else {
        setRunError(result.ok ? null : (result.error ?? 'run failed'))
      }
      setElapsedMs(Math.round(elapsed))
    } catch (e) {
      if (!detached) setStepState({})
      setRunError(`Could not run: ${(e as Error).message}`)
      setElapsedMs(null)
    } finally {
      setRunning(false)
    }
  }, [steps, message, detached, engine])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); void runAll() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [runAll])

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  const slug = pipelineName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'kmip-pipeline'
  const exportPy = () => downloadFile(activeCode, `${slug}.py`, 'text/x-python')
  const exportJson = () => downloadFile(
    exportPipelineJson<KmipStep>(EXPORT_SCHEMA, pipelineName, { steps, input: message }),
    `${slug}.json`, 'application/json',
  )
  const importJson = async (file: File) => {
    const text = await file.text()
    const parsed = importPipelineJson<KmipStep>(EXPORT_SCHEMA, text)
    if (!parsed) { flash('Not a valid KMIP pipeline export file'); return }
    setPipelineName(parsed.name)
    setSteps(parsed.pipeline.steps)
    setMessage(parsed.pipeline.input)
    setDetached(null)
    setStepState({})
    flash(`Imported "${parsed.name}"`)
  }
  const savePipeline = () => {
    const next = { ...store, [pipelineName]: { steps, input: message } }
    if (saveStore(STORE_KEY, next)) { setStore(next); flash(`Saved "${pipelineName}"`) }
    else flash('Could not save — browser storage is full')
  }
  const loadPipeline = (name: string) => {
    const saved = store[name]
    if (!saved) return
    setPipelineName(name)
    setSteps(saved.steps)
    setMessage(saved.input)
    setDetached(null)
    setStepState({})
  }
  const deleteSaved = (name: string) => {
    const next = { ...store }
    delete next[name]
    if (saveStore(STORE_KEY, next)) setStore(next)
  }
  const savedKmipNames = Object.keys(store)

  return (
    <div className="grid grid-cols-[240px_1fr_340px] gap-0 min-h-[70vh] border rounded-lg overflow-hidden bg-background text-sm">
      {/* LEFT: templates + saved */}
      <aside className="border-r p-3 overflow-auto flex flex-col gap-4">
        <div>
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Start from</div>
          <div className="flex flex-col gap-1">
            {KMIP_TEMPLATE_NAMES.map((t) => (
              <Button key={t} variant={t === pipelineName ? 'secondary' : 'outline'} size="sm"
                onClick={() => applyTemplate(t)} className="justify-start font-normal">
                {t}
              </Button>
            ))}
          </div>
        </div>
        {savedKmipNames.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Saved</div>
            <div className="flex flex-col gap-1">
              {savedKmipNames.map((name) => (
                <div key={name} className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => loadPipeline(name)} className="flex-1 min-w-0 truncate justify-start font-normal">
                    {name}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteSaved(name)} className="px-1.5 text-red-500 hover:text-red-400" aria-label={`Delete saved pipeline ${name}`}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* CENTER: step list */}
      <main className="flex flex-col overflow-auto">
        <header className="p-4 border-b flex justify-between items-center gap-4">
          <div className="min-w-0 flex-1">
            <input
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              aria-label="Pipeline name"
              className="text-lg font-semibold bg-transparent border border-transparent focus:border-input rounded px-1.5 py-0.5 w-full max-w-md outline-none"
            />
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void importJson(f); e.target.value = '' }} />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-1" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={exportJson}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={exportPy}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export .py
            </Button>
            <Button variant="outline" size="sm" onClick={savePipeline}>
              <Save className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
            <Button size="sm" disabled={running} onClick={() => { void runAll() }} title="Run (⌘/Ctrl+Enter)">
              {running ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />}
              {running ? 'Running…' : 'Run'}
            </Button>
          </div>
        </header>

        {notice && <div className="px-4 py-2 text-xs font-mono text-blue-500 border-b">{notice}</div>}
        {runError && (
          <div className="px-4 py-2.5 text-xs font-mono text-red-500 bg-red-500/5 border-b border-red-500/25">✗ {runError}</div>
        )}
        {detached && (
          <div className="px-4 py-2.5 text-xs bg-amber-500/5 border-b border-amber-500/25 flex items-center gap-3 flex-wrap">
            <span className="text-amber-600 dark:text-amber-400">
              ⚠ Custom script — you edited the generated code, so the step list below is just a reference; the edited script is what actually runs.
            </span>
            <Button variant="outline" size="sm" onClick={() => setDetached(null)}>Revert to template</Button>
          </div>
        )}

        <div className="p-4 border-b">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Message to sign</div>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-label="Message to sign"
            className="w-full font-mono text-xs bg-muted/40 border rounded px-2 py-1 outline-none"
          />
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto flex flex-col gap-2">
            {steps.length === 0 && <div className="text-xs text-muted-foreground text-center py-8">Empty pipeline — pick a template.</div>}
            {steps.map((step, i) => {
              const st = stepState[step.id]
              const statusStyle = st ? STATUS_STYLE[st.status] : null
              return (
                <div key={step.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-muted grid place-items-center text-xs font-semibold font-mono flex-shrink-0">{i + 1}</div>
                    <span className="font-mono text-xs">{stepLabel(step)}</span>
                    {statusStyle && <span className={`ml-auto text-[10px] font-mono ${statusStyle.cls}`}>{statusStyle.label}</span>}
                  </div>
                  {st?.output && (
                    <pre className="mt-2 p-2 bg-muted rounded text-[10.5px] font-mono whitespace-pre-wrap max-h-32 overflow-auto">
                      <span className={st.status === 'error' ? 'text-red-500' : ''}>{st.output}</span>
                    </pre>
                  )}
                </div>
              )
            })}
          </div>
          {elapsedMs != null && KMIP_TEMPLATE_OUTCOMES[pipelineName] && (
            <p className="max-w-2xl mx-auto mt-4 text-xs leading-relaxed text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400">What this proved: </span>
              {KMIP_TEMPLATE_OUTCOMES[pipelineName]}
            </p>
          )}
        </div>
      </main>

      {/* RIGHT: summary + editor */}
      <aside className="border-l p-4 flex flex-col gap-3 overflow-auto">
        <Card className="p-3.5">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Pipeline summary</div>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Steps</span><span className="font-mono">{steps.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Language</span><span className="font-mono">Python · pqctoday_kmip</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Last run</span><span className="font-mono">{elapsedMs != null ? `${(elapsedMs / 1000).toFixed(2)}s` : 'not run yet'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Engine</span><span className="font-mono">{engine ? 'KMIP/CACP (browser)' : 'initializing…'}</span></div>
          </div>
        </Card>

        <Card className="p-3.5 min-h-0 flex-1 flex flex-col">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
            {detached ? 'Your script' : 'Generated Python'}
          </div>
          <div className="flex-1 min-h-[280px] border rounded overflow-hidden">
            <Editor
              height="100%"
              language="python"
              value={activeCode}
              theme="vs-dark"
              onChange={(val) => {
                if (val !== generatedPy) setDetached(val ?? '')
                else setDetached(null)
              }}
              options={{ fontSize: 11, minimap: { enabled: false }, scrollBeyondLastLine: false }}
            />
          </div>
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={exportPy}>
            <Download className="h-3.5 w-3.5 mr-1" /> Download as .py
          </Button>
        </Card>
      </aside>
    </div>
  )
}
