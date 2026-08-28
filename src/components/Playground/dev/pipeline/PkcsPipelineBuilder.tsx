// SPDX-License-Identifier: GPL-3.0-only
/**
 * PkcsPipelineBuilder — the PKCS#11 Developer tab's sequence builder
 * (dev-tabs-pkcs11-kmip plan, WS-D + WS-F).
 *
 * Ported from pqctoday-sandbox's ui/src/pages/sandbox/PipelinePage.tsx —
 * same interaction model (drag primitives onto a canvas, bind each step's
 * inputs to earlier steps' outputs, run), same underlying pipeline*
 * modules (pipelinePrimitives/Codegen/Bindings/Templates/Run, copied
 * verbatim into ./pipeline/) — re-skinned onto the hub's own Tailwind + UI
 * primitives instead of the sandbox's separate inline-style CSS system,
 * and with the run seam swapped from `/api/run` to the local Pyodide
 * runtime (P1).
 *
 * D1 (editor ↔ builder sync): one-way with detach. The builder is the
 * source of truth; the Monaco panel always shows freshly generated code
 * UNLESS the learner edits it, at which point the pipeline detaches into
 * "custom script" mode (builder greys out) until they explicitly revert.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Loader2, Download, Save, Upload, Trash2, X } from 'lucide-react'
import { Button } from '../../../ui/button'
import { Card } from '../../../ui/card'
import { useHsmContext } from '../../hsm/HsmContext'
import { ensureDevSlot, DEV_SLOT_LABEL } from './devSlot'
import { DevSandboxDiffNote } from './DevSandboxDiffNote'
import { installMonacoSelfHost } from '../monacoSelfHost'

installMonacoSelfHost()
import { PRIMITIVES, opsFor, defaultOpFor, type Op } from './pipelinePrimitives'
import {
  emitPipeline, DEFAULT_PIPELINE_INPUT,
  type ParamValue, type PipelineStep, type StepStatus,
} from './pipelineCodegen'
import { optionsFor, validate, type Finding } from './pipelineBindings'
import { TEMPLATES, TEMPLATE_NAMES, TEMPLATE_OUTCOMES } from './pipelineTemplates'
import { parseRun, loadStore, saveStore, exportPipelineJson, importPipelineJson, pipelineProvenanceHeader, type PipelineStore } from './pipelineRun'
import { PALETTE_ENTRIES, type PaletteEntry, type PrimitiveFamily } from './pipelineCatalogMeta'
import { bootPyRuntime, runPython } from '../../../../services/python/pyRuntime'
import { createP11Bridge } from '../../../../services/python/pyodide/p11Bridge'

const OP_LABEL: Record<Op, string> = {
  generate: 'gen key', encrypt: 'encrypt', decrypt: 'decrypt',
  encapsulate: 'encap', decapsulate: 'decap', derive: 'derive',
  digest: 'hash', sign: 'sign', verify: 'verify',
}

const STATUS_STYLE: Record<StepStatus, { cls: string; label: string } | null> = {
  idle: null,
  running: { cls: 'text-blue-500', label: '· running' },
  ok: { cls: 'text-emerald-500', label: '✓ ran' },
  error: { cls: 'text-red-500', label: '✗ failed' },
  skipped: { cls: 'text-muted-foreground', label: '— skipped' },
}

let seq = 0
const newId = () => `step-${++seq}-${Math.random().toString(36).slice(2, 7)}`

function instantiate(steps: PipelineStep[]): PipelineStep[] {
  const map = new Map<string, string>()
  for (const s of steps) map.set(s.id, newId())
  return steps.map((s) => ({
    ...s,
    id: map.get(s.id) as string,
    status: 'idle' as StepStatus,
    output: null,
    params: Object.fromEntries(
      Object.entries(s.params).map(([k, v]) => {
        if ((v.bind === 'ref' || v.bind === 'key') && map.has(v.step)) {
          return [k, { ...v, step: map.get(v.step) as string }]
        }
        return [k, v]
      }),
    ),
  }))
}

const FAMILIES: PrimitiveFamily[] = ['Signature', 'KEM', 'Symmetric', 'Hash']
const STORE_KEY = 'pqctoday-hub-pkcs11-pipelines-v1'
const EXPORT_SCHEMA = 'pqctoday-hub-pkcs11-pipeline-v1'

export const PkcsPipelineBuilder: React.FC = () => {
  const { moduleRef, isReady, autoInit } = useHsmContext()

  const [pipelineName, setPipelineName] = useState('Encrypt + sign (PQ)')
  const [pipeline, setPipeline] = useState<PipelineStep[]>(() => instantiate(TEMPLATES['Encrypt + sign (PQ)'] ?? []))
  const [pipelineInput, setPipelineInput] = useState(DEFAULT_PIPELINE_INPUT)
  const [store, setStore] = useState<PipelineStore>(() => loadStore(STORE_KEY))
  const [notice, setNotice] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // D1: detach state. `detached` holds the learner's hand-edited script;
  // while set, the builder's own regeneration is not shown or run.
  const [detached, setDetached] = useState<string | null>(null)

  // D6: the Developer tab's OWN token slot, labeled 'DevSequences' and kept
  // separate from whatever slot the rest of the HSM playground shares —
  // see devSlot.ts's header comment for why (generated scripts call
  // s.logout(), which is TOKEN-WIDE, so sharing a slot would let a pipeline
  // run log the other HSM tabs out from under them).
  const [devSlot, setDevSlot] = useState<number | null>(null)
  const [slotError, setSlotError] = useState<string | null>(null)

  const dragPrim = useRef<string | null>(null)
  const dragFrom = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generatedPy = useMemo(
    () => emitPipeline(pipeline, { input: pipelineInput, slot: devSlot ?? undefined }),
    [pipeline, pipelineInput, devSlot],
  )
  const activeCode = detached ?? generatedPy
  const findings = useMemo(() => validate(pipeline), [pipeline])
  const blocking = useMemo(() => findings.filter((f) => f.severity === 'error'), [findings])

  const flash = (msg: string) => { setNotice(msg); window.setTimeout(() => setNotice(null), 2600) }

  useEffect(() => {
    if (!isReady) void autoInit()
  }, [isReady, autoInit])

  useEffect(() => {
    if (!isReady || devSlot !== null || !moduleRef.current) return
    try {
      setDevSlot(ensureDevSlot(moduleRef.current))
    } catch (e) {
      setSlotError((e as Error).message)
    }
  }, [isReady, devSlot, moduleRef])

  /* ── palette + canvas drag/drop (unchanged from the sandbox port) ── */
  const onPaletteDragStart = (e: React.DragEvent, primId: string) => {
    dragPrim.current = primId
    dragFrom.current = null
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/x-pqc-primitive', primId)
    e.dataTransfer.setData('text/plain', primId)
  }
  const onStepDragStart = (e: React.DragEvent, i: number) => {
    dragPrim.current = null
    dragFrom.current = i
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-pqc-step', String(i))
    e.dataTransfer.setData('text/plain', String(i))
  }
  const onDragOver = useCallback((e: React.DragEvent, i: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = dragFrom.current !== null ? 'move' : 'copy'
    setDragOverIndex(i)
  }, [])

  const dropAt = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(null)
    const dtStep = e.dataTransfer.getData('application/x-pqc-step')
    const dtPrim = e.dataTransfer.getData('application/x-pqc-primitive')
    if (dragFrom.current === null && dtStep !== '') dragFrom.current = Number(dtStep)
    if (dragPrim.current === null && dtPrim !== '') dragPrim.current = dtPrim

    if (dragFrom.current !== null) {
      const from = dragFrom.current
      dragFrom.current = null
      if (from === index) return
      setPipeline((prev) => {
        const next = [...prev]
        const [moved] = next.splice(from, 1)
        next.splice(from < index ? index - 1 : index, 0, moved)
        return next
      })
      return
    }
    if (dragPrim.current) {
      const primId = dragPrim.current
      dragPrim.current = null
      const spec = PRIMITIVES[primId]
      if (!spec) return
      const op = defaultOpFor(primId)
      const step: PipelineStep = {
        id: newId(),
        primId,
        op,
        params: spec.ops[op]?.requires.keyLabel
          ? { keyLabel: { bind: 'literal', value: primId } }
          : {},
        status: 'idle',
        output: null,
      }
      setPipeline((prev) => {
        const next = [...prev]
        next.splice(index, 0, step)
        return next
      })
    }
  }, [])

  const deleteStep = (id: string) =>
    setPipeline((prev) => prev
      .filter((s) => s.id !== id)
      .map((s) => ({
        ...s,
        params: Object.fromEntries(
          Object.entries(s.params).filter(([, v]) =>
            !((v.bind === 'ref' || v.bind === 'key') && v.step === id)),
        ),
      })))

  const setOp = (id: string, op: Op) =>
    setPipeline((prev) => prev.map((s) =>
      (s.id === id ? { ...s, op, params: {}, status: 'idle' as StepStatus, output: null } : s)))

  const setParam = (id: string, name: string, value: ParamValue | undefined) =>
    setPipeline((prev) => prev.map((s) => {
      if (s.id !== id) return s
      const params = { ...s.params }
      if (value === undefined) delete params[name]
      else params[name] = value
      return { ...s, params }
    }))

  const applyTemplate = (name: string) => {
    setPipelineName(name === 'Empty' ? 'Custom pipeline' : name)
    setPipeline(instantiate(TEMPLATES[name] ?? []))
    setRunError(null); setElapsedMs(null)
    setDetached(null)
  }

  /* ── run — the P1-proven Pyodide seam replaces /api/run ── */
  const runAll = useCallback(async () => {
    if (!detached && blocking.length) { flash(`${blocking.length} problem(s) to fix before running`); return }
    if (!moduleRef.current) { setRunError('softhsmv3 engine not ready yet — try again in a moment.'); return }
    if (devSlot === null) { setRunError('Your Developer token is still initializing — try again in a moment.'); return }
    setRunning(true)
    setRunError(null)
    if (!detached) {
      setPipeline((prev) => prev.map((s) => ({ ...s, status: 'running' as StepStatus, output: null })))
    }
    const code = detached ?? emitPipeline(pipeline, { input: pipelineInput, slot: devSlot })
    const t0 = performance.now()
    try {
      const py = await bootPyRuntime()
      const bridge = createP11Bridge(moduleRef.current)
      py.registerJsModule('p11_bridge', bridge)
      const result = await runPython(code)
      const elapsed = performance.now() - t0
      if (!detached) {
        const outcome = parseRun(result.stdout + (result.error ? `\n${result.error}` : ''), pipeline, result.ok ? 0 : 1)
        setPipeline((prev) => prev.map((s) => ({
          ...s,
          status: outcome.status[s.id] ?? 'skipped',
          output: outcome.text[s.id]
            ? { text: outcome.text[s.id], status: outcome.status[s.id] === 'error' ? 'error' : 'ok' }
            : null,
        })))
        setRunError(outcome.error)
      } else {
        setRunError(result.ok ? null : (result.error ?? 'run failed'))
      }
      setElapsedMs(Math.round(elapsed))
    } catch (e) {
      if (!detached) {
        setPipeline((prev) => prev.map((s) => ({ ...s, status: 'idle' as StepStatus, output: null })))
      }
      setRunError(`Could not run: ${(e as Error).message}`)
      setElapsedMs(null)
    } finally {
      setRunning(false)
    }
  }, [pipeline, pipelineInput, blocking.length, detached, moduleRef, devSlot])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); void runAll() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [runAll])

  /* ── export / save / load (D2) ── */
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  const slug = pipelineName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'pipeline'
  const exportPy = () => downloadFile(pipelineProvenanceHeader('PKCS#11 v3.2') + activeCode, `${slug}.py`, 'text/x-python')
  const exportJson = () => downloadFile(
    exportPipelineJson(EXPORT_SCHEMA, pipelineName, { steps: pipeline, input: pipelineInput }),
    `${slug}.json`, 'application/json',
  )
  const importJson = async (file: File) => {
    const text = await file.text()
    const parsed = importPipelineJson<PipelineStep>(EXPORT_SCHEMA, text)
    if (!parsed) { flash('Not a valid pipeline export file'); return }
    setPipelineName(parsed.name)
    setPipeline(instantiate(parsed.pipeline.steps))
    setPipelineInput(parsed.pipeline.input)
    setDetached(null)
    setRunError(null); setElapsedMs(null)
    flash(`Imported "${parsed.name}"`)
  }

  const savePipeline = () => {
    const next = { ...store, [pipelineName]: { steps: pipeline, input: pipelineInput } }
    if (saveStore(STORE_KEY, next)) { setStore(next); flash(`Saved "${pipelineName}"`) }
    else flash('Could not save — browser storage is full')
  }
  const loadPipeline = (name: string) => {
    const saved = store[name]
    if (!saved) return
    setPipelineName(name)
    setPipeline(saved.steps)
    setPipelineInput(saved.input)
    setDetached(null)
    setRunError(null); setElapsedMs(null)
  }
  const deleteSaved = (name: string) => {
    const next = { ...store }
    delete next[name]
    if (saveStore(STORE_KEY, next)) setStore(next)
  }

  const palette: Record<PrimitiveFamily, PaletteEntry[]> = {
    Signature: PALETTE_ENTRIES.filter((p) => p.family === 'Signature'),
    KEM: PALETTE_ENTRIES.filter((p) => p.family === 'KEM'),
    Symmetric: PALETTE_ENTRIES.filter((p) => p.family === 'Symmetric'),
    Hash: PALETTE_ENTRIES.filter((p) => p.family === 'Hash'),
  }
  const inputBytes = new TextEncoder().encode(pipelineInput).length
  const lastStep = pipeline[pipeline.length - 1]
  const lastSpec = lastStep ? PRIMITIVES[lastStep.primId] : undefined

  return (
    <div className="grid grid-cols-[280px_1fr_320px] gap-0 min-h-[70vh] border rounded-lg overflow-hidden bg-background text-sm">
      {/* LEFT PALETTE */}
      <aside className="border-r p-3 overflow-auto flex flex-col gap-4" data-tour="pkcs-dev-palette">
        <div>
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Palette</div>
          <div className="text-xs text-muted-foreground">Drag primitives onto the canvas →</div>
        </div>
        {FAMILIES.map((fam) => (
          <div key={fam}>
            <div className="flex items-center justify-between px-1 pb-1.5">
              <span className="text-[10.5px] font-semibold uppercase text-muted-foreground">{fam}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{palette[fam].length}</span>
            </div>
            <div className="flex flex-col gap-1">
              {palette[fam].map((p) => (
                <PaletteRow key={p.id} p={p} onDragStart={(e) => onPaletteDragStart(e, p.id)} />
              ))}
            </div>
          </div>
        ))}
        <div className="mt-auto pt-3 border-t" data-tour="pkcs-dev-templates">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Start from</div>
          <div className="flex flex-col gap-1">
            {TEMPLATE_NAMES.map((t) => (
              <Button key={t} variant="outline" size="sm" onClick={() => applyTemplate(t)} className="justify-start font-normal">
                {t}
              </Button>
            ))}
          </div>
          {Object.keys(store).length > 0 && (
            <>
              <div className="text-xs font-semibold uppercase text-muted-foreground mt-3 mb-1.5">Saved</div>
              <div className="flex flex-col gap-1">
                {Object.keys(store).map((name) => (
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
            </>
          )}
        </div>
      </aside>

      {/* CENTER */}
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
            <Button data-tour="pkcs-dev-run" size="sm" disabled={running} onClick={() => { void runAll() }}
              title={!detached && blocking.length ? `${blocking.length} problem(s) to fix first` : 'Run (⌘/Ctrl+Enter)'}>
              {running ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />}
              {running ? 'Running…' : 'Run'}
            </Button>
          </div>
        </header>

        <DevSandboxDiffNote points={[
          'Module() resolves to the same softhsmv3 engine, compiled to WebAssembly and running in this browser tab — not the real libsofthsmv3.so shared library the dev sandbox loads.',
          `Your own token is used, on a dedicated slot labeled "${DEV_SLOT_LABEL}" — the rest of the HSM playground shares a different one, so scripts here never disturb it (and vice versa).`,
          'One accommodation: CKA_PARAMETER_SET values from real sandbox samples arrive 8-byte-packed (native Linux convention); the shim narrows them to the 4 bytes this WASM build needs, for that one attribute only.',
          "finalize() is a deliberate no-op here (a real C_Finalize would tear down every other open Developer-tab session) — the real package's finalize() does call it.",
        ]} />

        {notice && (
          <div className="px-4 py-2 text-xs font-mono text-blue-500 border-b">{notice}</div>
        )}
        {runError && (
          <div className="px-4 py-2.5 text-xs font-mono text-red-500 bg-red-500/5 border-b border-red-500/25">
            ✗ {runError}
          </div>
        )}
        {slotError && (
          <div className="px-4 py-2.5 text-xs font-mono text-red-500 bg-red-500/5 border-b border-red-500/25">
            ✗ Could not set up your Developer token: {slotError}
          </div>
        )}
        {detached && (
          <div className="px-4 py-2.5 text-xs bg-amber-500/5 border-b border-amber-500/25 flex items-center gap-3 flex-wrap">
            <span className="text-amber-600 dark:text-amber-400">
              ⚠ Custom script — you edited the generated code, so the builder is detached and greyed out.
            </span>
            <Button variant="outline" size="sm" onClick={() => setDetached(null)}>
              Revert to builder
            </Button>
          </div>
        )}

        <div className={`p-6 flex-1 overflow-auto ${detached ? 'opacity-40 pointer-events-none' : ''}`} data-tour="pkcs-dev-canvas">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <div className="px-4 py-3 bg-muted/40 border border-dashed rounded text-center min-w-[340px]">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Pipeline input</div>
              <input
                value={pipelineInput}
                onChange={(e) => setPipelineInput(e.target.value)}
                aria-label="Pipeline input bytes"
                className="mt-1.5 w-full font-mono text-xs bg-background border rounded px-2 py-1 outline-none"
              />
              <div className="font-mono text-[10.5px] text-muted-foreground mt-1">
                pipeline_input · {inputBytes} bytes
              </div>
            </div>

            <FlowArrow label="bytes" />

            {pipeline.length === 0 && (
              <DropZone active={dragOverIndex === 0} label="Drop a primitive here"
                onDragOver={(e) => onDragOver(e, 0)} onDrop={(e) => dropAt(e, 0)} />
            )}

            {pipeline.map((step, i) => (
              <React.Fragment key={step.id}>
                <div className="w-full flex flex-col items-center"
                  onDragOver={(e) => onDragOver(e, i)} onDrop={(e) => dropAt(e, i)}>
                  {dragOverIndex === i && <InsertBar />}
                  <StepCard
                    step={step} index={i} steps={pipeline}
                    findings={findings.filter((f) => f.stepIndex === i)}
                    onDelete={() => deleteStep(step.id)}
                    onDragStart={(e) => onStepDragStart(e, i)}
                    onOpChange={(op) => setOp(step.id, op)}
                    onParam={(name, v) => setParam(step.id, name, v)}
                  />
                </div>
                {i < pipeline.length - 1 && <FlowArrow label={bindingLabel(pipeline, i + 1)} />}
              </React.Fragment>
            ))}

            {pipeline.length > 0 && (
              <div className="w-full flex flex-col items-center"
                onDragOver={(e) => onDragOver(e, pipeline.length)} onDrop={(e) => dropAt(e, pipeline.length)}>
                {dragOverIndex === pipeline.length && <InsertBar />}
                <DropZone active={dragOverIndex === pipeline.length} label="Drop here to append" subtle />
              </div>
            )}

            <FlowArrow />
            <div className="px-4 py-3 bg-emerald-500/5 border border-dashed border-emerald-500/40 rounded text-center min-w-[280px]" data-tour="pkcs-dev-output">
              <div className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">Output bundle</div>
              <div className="font-mono text-xs mt-1">
                {pipeline.length ? `${lastSpec?.label ?? lastStep?.primId} · ${lastStep?.op}` : 'empty pipeline'}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                {pipeline.length} step{pipeline.length === 1 ? '' : 's'}
                {elapsedMs != null && ` · ran in ${(elapsedMs / 1000).toFixed(2)}s`}
              </div>
              {elapsedMs != null && TEMPLATE_OUTCOMES[pipelineName] && (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400">What this proved: </span>
                  {TEMPLATE_OUTCOMES[pipelineName]}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT RAIL */}
      <aside className="border-l p-4 flex flex-col gap-3 overflow-auto">
        <Card className="p-3.5">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Pipeline summary</div>
          <div className="flex flex-col gap-1.5 text-xs">
            <SummaryRow k="Steps" v={String(pipeline.length)} />
            <SummaryRow k="PQ ops" v={String(pipeline.filter((s) => PALETTE_ENTRIES.find((p) => p.id === s.primId)?.pq === true).length)} c="text-purple-500" />
            <SummaryRow k="Classical ops" v={String(pipeline.filter((s) => PALETTE_ENTRIES.find((p) => p.id === s.primId)?.pq === false).length)} c="text-amber-500" />
            <SummaryRow k="Language" v="Python · p11 v3.2" />
            <SummaryRow k="Last run" v={elapsedMs != null ? `${(elapsedMs / 1000).toFixed(2)}s` : 'not run yet'} />
            <SummaryRow k="Engine" v={isReady ? 'softhsmv3 (browser)' : 'initializing…'} />
            <SummaryRow
              k="Token slot"
              v={devSlot !== null ? `${DEV_SLOT_LABEL} · slot ${devSlot}` : slotError ? 'unavailable' : 'initializing…'}
            />
          </div>
        </Card>

        <Card className="p-3.5">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Validation</div>
          <div className="flex flex-col gap-1.5 text-xs">
            {!detached && findings.length === 0 && <ValRow ok text="Every step input is bound" />}
            {!detached && findings.map((f, i) => <ValRow key={i} ok={false} text={f.text} />)}
            {detached && <ValRow ok text="Custom script — builder validation skipped" />}
          </div>
        </Card>

        <Card className="p-3.5 min-h-0 flex-1 flex flex-col" data-tour="pkcs-dev-export">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
            {detached ? 'Your script' : 'Generated Python'}
          </div>
          <div className="flex-1 min-h-[240px] border rounded overflow-hidden">
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

/* ─── helpers ─── */

function bindingLabel(steps: PipelineStep[], nextIndex: number): string {
  const prev = steps[nextIndex - 1]
  const next = steps[nextIndex]
  if (!prev || !next) return 'data'
  const uses = Object.values(next.params).some(
    (v) => (v.bind === 'ref' || v.bind === 'key') && v.step === prev.id)
  return uses ? `↓ from step ${nextIndex}` : 'independent'
}

const InsertBar: React.FC = () => (
  <div className="w-full max-w-xl h-1 bg-blue-500 rounded-full mb-1" />
)

const DropZone: React.FC<{
  active?: boolean; label: string; subtle?: boolean
  onDragOver?: React.DragEventHandler; onDrop?: React.DragEventHandler
}> = ({ active, label, subtle, onDragOver, onDrop }) => (
  <div
    onDragOver={onDragOver} onDrop={onDrop}
    className={`w-full max-w-xl text-center rounded border border-dashed font-mono text-xs text-muted-foreground ${subtle ? 'py-2.5 mt-2' : 'py-6'} ${active ? 'border-blue-500 bg-blue-500/5' : 'border-input'}`}
  >{label}</div>
)

const PaletteRow: React.FC<{ p: PaletteEntry; onDragStart: React.DragEventHandler }> = ({ p, onDragStart }) => {
  const isPq = p.pq === true
  const dotColor = isPq ? 'bg-purple-500' : p.pq === false ? 'bg-amber-500' : 'bg-muted-foreground'
  const ops = opsFor(p.id)
  return (
    <div draggable onDragStart={onDragStart}
      title={ops.length ? `Supports: ${ops.join(', ')}` : 'Not available in the pipeline builder'}
      className="flex items-center gap-2 px-2.5 py-1.5 border rounded bg-card cursor-grab"
    >
      <span className="text-muted-foreground text-[11px]">⋮⋮</span>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="font-mono text-xs">{p.name}</span>
      <span className="font-mono text-[9.5px] text-muted-foreground ml-auto">{p.hex}</span>
    </div>
  )
}

interface StepCardProps {
  step: PipelineStep; index: number; steps: PipelineStep[]; findings: Finding[]
  onDelete: () => void; onDragStart: React.DragEventHandler
  onOpChange: (op: Op) => void; onParam: (name: string, v: ParamValue | undefined) => void
}

const StepCard: React.FC<StepCardProps> = ({ step, index, steps, findings, onDelete, onDragStart, onOpChange, onParam }) => {
  const spec = PRIMITIVES[step.primId]
  const meta = PALETTE_ENTRIES.find((x) => x.id === step.primId)
  const isPq = meta?.pq === true
  const required = Object.entries(spec?.ops[step.op]?.requires ?? {})
  const statusStyle = STATUS_STYLE[step.status ?? 'idle']
  const borderColor = findings.length ? 'border-red-500/45' : isPq ? 'border-purple-500/30' : meta?.pq === false ? 'border-amber-500/30' : 'border-border'

  return (
    <div draggable onDragStart={onDragStart} className={`w-full max-w-xl overflow-hidden rounded-lg border bg-card ${borderColor}`}
      data-tour={step.op === 'sign' ? 'pkcs-dev-step-sign' : undefined}>
      <div className={`h-0.5 ${isPq ? 'bg-purple-500' : meta?.pq === false ? 'bg-amber-500' : 'bg-blue-500'}`} />
      <div className="p-3.5 flex items-start gap-3">
        <div className="w-6.5 h-6.5 rounded bg-muted grid place-items-center text-xs font-semibold font-mono flex-shrink-0 cursor-grab">{index + 1}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="font-mono text-[13px] font-semibold">{spec?.label ?? step.primId}</span>
            {/* eslint-disable-next-line no-restricted-syntax -- FilterDropdown is a
                page-level filter control (portal-rendered menu); this is a dense,
                repeating inline chip inside a step card where a native select's
                compact footprint and inline caret are the point. */}
            <select value={step.op} onChange={(e) => onOpChange(e.target.value as Op)}
              aria-label={`Operation for step ${index + 1}`}
              className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide bg-muted border cursor-pointer"
            >
              {opsFor(step.primId).map((op) => <option key={op} value={op}>{OP_LABEL[op] ?? op}</option>)}
            </select>
            {isPq && <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-purple-500/15 text-purple-500 font-mono">PQ</span>}
            {spec?.stateful && (
              <span title="Stateful: every signature consumes one of a finite set of one-time keys" className="px-1.5 py-0.5 rounded text-[9.5px] text-amber-500 border border-amber-500/30 font-mono">
                stateful · {spec.maxSignatures} sigs
              </span>
            )}
            {statusStyle && <span className={`ml-auto text-[9.5px] font-mono ${statusStyle.cls}`}>{statusStyle.label}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            {required.length === 0 && <span className="font-mono text-xs text-muted-foreground">no inputs</span>}
            {required.map(([name, kind]) => {
              if (!kind) return null
              if (kind === 'label') {
                const v = step.params[name]
                return (
                  <ParamRow key={name} name={name}>
                    <input className="flex-1 min-w-0 bg-background border rounded px-1.5 py-0.5 text-xs font-mono"
                      aria-label={`${name} for step ${index + 1}`}
                      value={v?.bind === 'literal' ? v.value : ''} placeholder="key label"
                      onChange={(e) => onParam(name, { bind: 'literal', value: e.target.value })} />
                  </ParamRow>
                )
              }
              const opts = optionsFor(kind, steps, index)
              const current = step.params[name]
              const currentKey = current ? JSON.stringify(current) : ''
              const known = opts.some((o) => JSON.stringify(o.value) === currentKey)
              return (
                <ParamRow key={name} name={name}>
                  {/* eslint-disable-next-line no-restricted-syntax -- FilterDropdown's
                      onSelect(id: string) can't carry this option's value, a full
                      ParamValue object (a step reference/key-part pair, not a simple
                      string id) — the option's real identity IS that object, encoded
                      here as its JSON string only so the native select can compare it. */}
                  <select
                    className={`flex-1 min-w-0 bg-background border rounded px-1.5 py-0.5 text-xs font-mono ${known ? '' : 'text-red-500'}`}
                    aria-label={`${name} for step ${index + 1}`}
                    value={known ? currentKey : ''}
                    onChange={(e) => onParam(name, e.target.value ? JSON.parse(e.target.value) as ParamValue : undefined)}
                  >
                    <option value="">{opts.length ? '— choose a source —' : '— nothing compatible earlier —'}</option>
                    {opts.map((o) => <option key={o.label} value={JSON.stringify(o.value)}>{o.label}</option>)}
                  </select>
                </ParamRow>
              )
            })}
          </div>
          {findings.map((f, i) => <div key={i} className="font-mono text-[10.5px] text-red-500 mt-1.5">✗ {f.text}</div>)}
          {step.output && (
            <pre className="mt-2.5 p-2 bg-muted rounded text-[10.5px] font-mono whitespace-pre-wrap max-h-40 overflow-auto"
              style={{ color: step.output.status === 'error' ? undefined : undefined }}>
              <span className={step.output.status === 'error' ? 'text-red-500' : ''}>{step.output.text}</span>
            </pre>
          )}
        </div>
        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 flex-shrink-0 h-auto w-auto p-1" onClick={onDelete} aria-label={`Remove step ${index + 1}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

const ParamRow: React.FC<{ name: string; children: React.ReactNode }> = ({ name, children }) => (
  <div className="flex items-center gap-2">
    <span className="font-mono text-[10.5px] text-muted-foreground w-[78px] flex-shrink-0 text-right">{name}</span>
    {children}
  </div>
)

const FlowArrow: React.FC<{ label?: string | null }> = ({ label }) => (
  <div className="flex flex-col items-center py-1 text-muted-foreground">
    <div className="w-px h-3.5 bg-border" />
    {label && <span className="font-mono text-[10px] text-blue-500 px-2 py-0.5 bg-muted rounded-full border my-0.5 max-w-[320px] truncate">{label}</span>}
    <div className="w-px h-3.5 bg-border" />
    <span className="text-blue-500 text-[10px] -mt-1">▼</span>
  </div>
)

const SummaryRow: React.FC<{ k: string; v: string; c?: string }> = ({ k, v, c = '' }) => (
  <div className="flex justify-between gap-2.5">
    <span className="text-muted-foreground">{k}</span>
    <span className={`font-mono text-right ${c}`}>{v}</span>
  </div>
)

const ValRow: React.FC<{ ok?: boolean; text: string }> = ({ ok, text }) => (
  <div className="flex gap-2 items-start">
    <span className={`w-3.5 h-3.5 rounded-full grid place-items-center text-[9px] flex-shrink-0 mt-0.5 ${ok ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>
      {ok ? '✓' : '!'}
    </span>
    <span className={ok ? 'text-muted-foreground' : 'text-red-500'}>{text}</span>
  </div>
)
