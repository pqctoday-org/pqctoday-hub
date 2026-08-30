// SPDX-License-Identifier: GPL-3.0-only
/**
 * KmipPipelineBuilder — the KMIP/CACP Developer tab (dev-tabs-pkcs11-kmip
 * plan, WS-E + WS-G, extended by G9/W2), embedded as a new plane in the
 * existing KMIP/CACP playground, executing for real against the P3-proven
 * Pyodide + pqctoday_kmip shim seam.
 *
 * Drag/drop canvas (W2), ported from the PKCS#11 side's
 * PkcsPipelineBuilder.tsx: same DropZone/InsertBar/StepCard interaction
 * model, adapted to KMIP's four structurally different step KINDS
 * (lifecycle op / load-policy / dry-run / expect-deny) instead of one —
 * see kmipPipelineBindings.ts's header for why binding rules are a
 * separate module rather than a re-skin of the PKCS#11 one. Templates
 * remain first-class starting points (Start-from list unchanged); the
 * codegen (kmipPipelineCodegen.ts) was already order-agnostic before this
 * landed, so no codegen change was needed to support freeform assembly.
 *
 * D1 (editor ↔ builder sync) and D2 (save/export) reuse the exact same
 * model and pipelineRun.ts persistence helpers the PKCS#11 tab uses.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Play,
  Loader2,
  Download,
  Save,
  Upload,
  Trash2,
  X,
  Pencil,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Button } from '../../../ui/button'
import { Card } from '../../../ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../ui/tabs'
import { installMonacoSelfHost } from '../monacoSelfHost'
import type { KmipEngine, AuditEvent } from '../../../../wasm/kmip/kmipEngine'
import { AuditTrailPanel } from '../../kmip/AuditTrailPanel'
import { POLICY_PRESETS } from '../../../../wasm/kmip/kmipMeta'
import { createKmipBridge } from '../../../../services/python/pyodide/kmipBridge'
import { bootPyRuntime, runPython, getInterruptMode } from '../../../../services/python/pyRuntime'
import { KMIP_PRIMITIVES, opsFor, defaultOpFor, type KmipOp } from './kmipPipelinePrimitives'
import { optionsFor, validate, type Finding } from './kmipPipelineBindings'
import { DevSandboxDiffNote } from '../pipeline/DevSandboxDiffNote'
import {
  emitKmipPipeline,
  tryParsePipelineFromEditedCode,
  DEFAULT_KMIP_MESSAGE,
  type KmipMessageMode,
  type KmipParamValue,
  type KmipStep,
  type KmipStepStatus,
} from './kmipPipelineCodegen'
import {
  KMIP_TEMPLATES,
  KMIP_TEMPLATE_NAMES,
  KMIP_TEMPLATE_OUTCOMES,
} from './kmipPipelineTemplates'
import {
  parseRun,
  loadStore,
  saveStore,
  exportPipelineJson,
  importPipelineJson,
  pipelineProvenanceHeader,
  type PipelineStore,
} from '../pipeline/pipelineRun'

const STORE_KEY = 'pqctoday-hub-kmip-pipelines-v1'
const EXPORT_SCHEMA = 'pqctoday-hub-kmip-pipeline-v1'

const STATUS_STYLE: Record<KmipStepStatus, { cls: string; label: string } | null> = {
  idle: null,
  running: { cls: 'text-status-info', label: '· running' },
  ok: { cls: 'text-status-success', label: '✓ ran' },
  error: { cls: 'text-status-error', label: '✗ failed' },
  skipped: { cls: 'text-muted-foreground', label: '— skipped' },
}

/** Wire operation names the shim's dry_run(op, algorithm=...) accepts —
 *  the real KMIP verb spellings (PascalCase), same convention the shipped
 *  templates already use (e.g. 'CreateKeyPair' in "Policy dry-run compare"). */
const KMIP_DRY_RUN_OPS = [
  'CreateKeyPair',
  'Create',
  'Activate',
  'Sign',
  'Encapsulate',
  'Decapsulate',
  'GetAttributes',
  'Locate',
  'Revoke',
  'Destroy',
]
const KMIP_DRY_RUN_ALGORITHMS = Object.values(KMIP_PRIMITIVES).map((p) => p.algorithm)

// G9/W4: static for the session — see PkcsPipelineBuilder.tsx's identical row.
const TIMEOUT_LABEL: Record<ReturnType<typeof getInterruptMode>, string> = {
  preemptive: 'preemptive kill (15s)',
  'best-effort': 'best-effort only (15s)',
}
const KMIP_PRIM_IDS = Object.keys(KMIP_PRIMITIVES)
const SPECIAL_STEP_KINDS: { kind: 'load-policy' | 'dry-run' | 'expect-deny'; label: string }[] = [
  { kind: 'load-policy', label: 'Load policy' },
  { kind: 'dry-run', label: 'Dry-run' },
  { kind: 'expect-deny', label: 'Expect deny' },
]

let seq = 0
const newId = () => `kstep-${++seq}-${Math.random().toString(36).slice(2, 7)}`

function newOpStep(primId: string): KmipStep {
  return { kind: 'op', id: newId(), primId, op: defaultOpFor(primId), params: {} }
}
function newSpecialStep(kind: 'load-policy' | 'dry-run' | 'expect-deny'): KmipStep {
  if (kind === 'load-policy') {
    return { kind, id: newId(), policyFile: POLICY_PRESETS[0]?.file ?? 'training-permissive.yaml' }
  }
  if (kind === 'dry-run') return { kind, id: newId(), op: 'CreateKeyPair' }
  return { kind: 'expect-deny', id: newId(), targetStepId: '' }
}

function stepLabel(step: KmipStep): string {
  if (step.kind === 'op')
    return `${KMIP_PRIMITIVES[step.primId]?.label ?? step.primId} · ${step.op}`
  if (step.kind === 'load-policy') return `Load policy: ${step.policyFile}`
  if (step.kind === 'dry-run')
    return `Dry-run: ${step.op}${step.algorithm ? ` (${step.algorithm})` : ''}`
  return `Expect deny: ${step.targetStepId}`
}

export interface KmipPipelineBuilderProps {
  engine: KmipEngine | null
}

export const KmipPipelineBuilder: React.FC<KmipPipelineBuilderProps> = ({ engine }) => {
  // G7: see monacoSelfHost.ts's header — called from a `useEffect`, and
  // <Editor> below is gated on `monacoReady` (shares the same promise as
  // PkcsPipelineBuilder.tsx's identical gate; only the first mount actually
  // waits).
  const [monacoReady, setMonacoReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    void installMonacoSelfHost().then(() => {
      if (!cancelled) setMonacoReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const [pipelineName, setPipelineName] = useState('Governed lifecycle')
  const [steps, setSteps] = useState<KmipStep[]>(() => KMIP_TEMPLATES['Governed lifecycle'] ?? [])
  const [message, setMessage] = useState(DEFAULT_KMIP_MESSAGE)
  // W3b: 'hex' lets the message field carry a genuinely binary (non-UTF-8)
  // payload — see kmipPipelineCodegen.ts's KmipMessageMode doc and the
  // pqctoday_kmip shim's _bytes_to_spec_field for why the engine already
  // accepts this on Sign. Switching mode does NOT convert the current
  // text — it changes what the SAME characters mean (literal bytes vs
  // hex digits), so the field is cleared to avoid emitting whichever
  // reading of the old value the learner didn't intend.
  const [messageMode, setMessageMode] = useState<KmipMessageMode>('text')
  const isValidHex = /^[0-9a-fA-F]*$/.test(message) && message.length % 2 === 0
  const messageError =
    messageMode === 'hex' && message !== '' && !isValidHex
      ? 'Hex mode needs an even number of hex digits (0-9, a-f)'
      : null
  const [store, setStore] = useState<PipelineStore<KmipStep>>(() => loadStore<KmipStep>(STORE_KEY))
  const [notice, setNotice] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const [stepState, setStepState] = useState<
    Record<string, { status: KmipStepStatus; output: string | null }>
  >({})
  const [detached, setDetached] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Cross-plane audit trail (CACP policy decisions + KMIP request/response +
  // the underlying PKCS#11 call) — `engine` is the same per-tab singleton
  // KmipPlaygroundView's own manual workbench reads, so every runOp/dryRun/
  // loadPolicy call this tab's script makes already lands in the engine's
  // own audit ring; this just also asks for it. Collapsed by default so the
  // palette/canvas layout isn't disrupted for someone not looking for it.
  const [audit, setAudit] = useState<AuditEvent[]>([])
  const [showActivity, setShowActivity] = useState(false)

  // Change 1: which pane of the Builder/Code switch is showing.
  const [activeView, setActiveView] = useState<'builder' | 'code'>('builder')
  // Change 2: the Code tab's editor opens read-only whenever it's showing
  // generated (synced) code — independent of `detached`, which only becomes
  // true once real edited text diverges.
  const [editUnlocked, setEditUnlocked] = useState(false)
  // Change 3: last "Try to apply to Builder" outcome, shown inline near its
  // button until the next edit or another apply attempt replaces it.
  const [applyMsg, setApplyMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── palette + canvas drag/drop (W2, ported from PkcsPipelineBuilder) ── */
  const dragPrim = useRef<string | null>(null)
  const dragSpecial = useRef<'load-policy' | 'dry-run' | 'expect-deny' | null>(null)
  const dragFrom = useRef<number | null>(null)

  const onPalettePrimDragStart = (e: React.DragEvent, primId: string) => {
    dragPrim.current = primId
    dragSpecial.current = null
    dragFrom.current = null
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/x-kmip-primitive', primId)
    e.dataTransfer.setData('text/plain', primId)
  }
  const onPaletteSpecialDragStart = (
    e: React.DragEvent,
    kind: 'load-policy' | 'dry-run' | 'expect-deny'
  ) => {
    dragSpecial.current = kind
    dragPrim.current = null
    dragFrom.current = null
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/x-kmip-special', kind)
    e.dataTransfer.setData('text/plain', kind)
  }
  const onStepDragStart = (e: React.DragEvent, i: number) => {
    dragFrom.current = i
    dragPrim.current = null
    dragSpecial.current = null
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-kmip-step', String(i))
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
    const dtStep = e.dataTransfer.getData('application/x-kmip-step')
    const dtPrim = e.dataTransfer.getData('application/x-kmip-primitive')
    const dtSpecial = e.dataTransfer.getData('application/x-kmip-special')
    if (dragFrom.current === null && dtStep !== '') dragFrom.current = Number(dtStep)
    if (dragPrim.current === null && dtPrim !== '') dragPrim.current = dtPrim
    if (dragSpecial.current === null && dtSpecial !== '')
      dragSpecial.current = dtSpecial as 'load-policy' | 'dry-run' | 'expect-deny'

    if (dragFrom.current !== null) {
      const from = dragFrom.current
      dragFrom.current = null
      if (from === index) return
      setSteps((prev) => {
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
      setSteps((prev) => {
        const next = [...prev]
        next.splice(index, 0, newOpStep(primId))
        return next
      })
      return
    }
    if (dragSpecial.current) {
      const kind = dragSpecial.current
      dragSpecial.current = null
      setSteps((prev) => {
        const next = [...prev]
        next.splice(index, 0, newSpecialStep(kind))
        return next
      })
    }
  }, [])

  const deleteStep = (id: string) =>
    setSteps((prev) =>
      prev
        .filter((s) => s.id !== id)
        .map((s) => {
          if (s.kind === 'op') {
            return {
              ...s,
              params: Object.fromEntries(
                Object.entries(s.params).filter(([, v]) => !(v.bind === 'ref' && v.step === id))
              ),
            }
          }
          if (s.kind === 'expect-deny' && s.targetStepId === id) return { ...s, targetStepId: '' }
          return s
        })
    )

  const setStepOp = (id: string, op: KmipOp) =>
    setSteps((prev) =>
      prev.map((s) => (s.kind === 'op' && s.id === id ? { ...s, op, params: {} } : s))
    )
  const setParam = (id: string, name: string, value: KmipParamValue | undefined) =>
    setSteps((prev) =>
      prev.map((s) => {
        if (s.kind !== 'op' || s.id !== id) return s
        const params = { ...s.params }
        if (value === undefined) delete params[name]
        else params[name] = value
        return { ...s, params }
      })
    )
  const setPolicyFile = (id: string, file: string) =>
    setSteps((prev) =>
      prev.map((s) => (s.kind === 'load-policy' && s.id === id ? { ...s, policyFile: file } : s))
    )
  const setDryRunOp = (id: string, op: string) =>
    setSteps((prev) => prev.map((s) => (s.kind === 'dry-run' && s.id === id ? { ...s, op } : s)))
  const setDryRunAlgorithm = (id: string, algorithm: string | undefined) =>
    setSteps((prev) =>
      prev.map((s) => (s.kind === 'dry-run' && s.id === id ? { ...s, algorithm } : s))
    )
  const setDenyTarget = (id: string, targetStepId: string) =>
    setSteps((prev) =>
      prev.map((s) => (s.kind === 'expect-deny' && s.id === id ? { ...s, targetStepId } : s))
    )

  const generatedPy = useMemo(
    () => emitKmipPipeline(steps, { message, messageMode }),
    [steps, message, messageMode]
  )
  const activeCode = detached ?? generatedPy
  const findings = useMemo(() => validate(steps), [steps])
  const blocking = useMemo(() => findings.filter((f) => f.severity === 'error'), [findings])

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(null), 2600)
  }

  // Change 2: the one place that both clears a custom script AND re-locks the
  // editor back to read-only-synced — see PkcsPipelineBuilder.tsx's identical
  // helper for why the Monaco onChange handler's own exact-match auto-resync
  // below deliberately does NOT go through this (it fires mid-typing).
  const resyncToGenerated = useCallback(() => {
    setDetached(null)
    setEditUnlocked(false)
    setApplyMsg(null)
  }, [])

  // Change 3: the honest "Try to apply to Builder" action.
  const handleTryApply = useCallback(() => {
    if (detached == null) return
    const result = tryParsePipelineFromEditedCode(detached, steps, { message, messageMode })
    if (result.ok) {
      setSteps(result.steps)
      setDetached(null)
      setEditUnlocked(false)
      setActiveView('builder')
      setApplyMsg({
        kind: 'ok',
        text: `Recognized ${result.steps.length} step${result.steps.length === 1 ? '' : 's'} — synced back to the Builder.`,
      })
      window.setTimeout(() => setApplyMsg(null), 3200)
    } else {
      setApplyMsg({ kind: 'error', text: result.reason })
    }
  }, [detached, steps, message, messageMode])

  const applyTemplate = (name: string) => {
    setPipelineName(name)
    setSteps(KMIP_TEMPLATES[name] ?? [])
    setStepState({})
    setRunError(null)
    setElapsedMs(null)
    resyncToGenerated()
  }

  const runAll = useCallback(async () => {
    if (!detached && blocking.length) {
      flash(`${blocking.length} problem(s) to fix before running`)
      return
    }
    if (!engine) {
      setRunError('KMIP engine not ready yet — try again in a moment.')
      return
    }
    if (!detached && messageError) {
      setRunError(messageError)
      return
    }
    setRunning(true)
    setRunError(null)
    if (!detached) {
      setStepState(
        Object.fromEntries(
          steps.map((s) => [s.id, { status: 'running' as KmipStepStatus, output: null }])
        )
      )
    }
    const code = detached ?? emitKmipPipeline(steps, { message, messageMode })
    const t0 = performance.now()
    try {
      const py = await bootPyRuntime()
      const bridge = createKmipBridge(engine)
      py.registerJsModule('kmip_bridge', bridge)
      const result = await runPython(code)
      const elapsed = performance.now() - t0
      if (!detached) {
        const outcome = parseRun(
          result.stdout + (result.error ? `\n${result.error}` : ''),
          steps,
          result.ok ? 0 : 1
        )
        setStepState(
          Object.fromEntries(
            steps.map((s) => [
              s.id,
              {
                status: outcome.status[s.id] ?? 'skipped',
                output: outcome.text[s.id] || null,
              },
            ])
          )
        )
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
      // Best-effort audit-trail refresh — never lets a snapshot failure
      // affect the run's own success/error reporting above.
      try {
        if (engine) setAudit(engine.auditSnapshot())
      } catch {
        // best-effort
      }
      setRunning(false)
    }
  }, [steps, message, messageMode, messageError, detached, engine, blocking.length])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        void runAll()
      }
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
  const exportPy = () =>
    downloadFile(
      pipelineProvenanceHeader('KMIP 3.0 + CACP') + activeCode,
      `${slug}.py`,
      'text/x-python'
    )
  const exportJson = () =>
    downloadFile(
      exportPipelineJson<KmipStep>(EXPORT_SCHEMA, pipelineName, { steps, input: message }),
      `${slug}.json`,
      'application/json'
    )
  const importJson = async (file: File) => {
    const text = await file.text()
    const parsed = importPipelineJson<KmipStep>(EXPORT_SCHEMA, text)
    if (!parsed) {
      flash('Not a valid KMIP pipeline export file')
      return
    }
    setPipelineName(parsed.name)
    setSteps(parsed.pipeline.steps)
    setMessage(parsed.pipeline.input)
    resyncToGenerated()
    setStepState({})
    flash(`Imported "${parsed.name}"`)
  }
  const savePipeline = () => {
    const next = { ...store, [pipelineName]: { steps, input: message } }
    if (saveStore(STORE_KEY, next)) {
      setStore(next)
      flash(`Saved "${pipelineName}"`)
    } else flash('Could not save — browser storage is full')
  }
  const loadPipeline = (name: string) => {
    const saved = store[name]
    if (!saved) return
    setPipelineName(name)
    setSteps(saved.steps)
    setMessage(saved.input)
    resyncToGenerated()
    setStepState({})
  }
  const deleteSaved = (name: string) => {
    const next = { ...store }
    delete next[name]
    if (saveStore(STORE_KEY, next)) setStore(next)
  }
  const savedKmipNames = Object.keys(store)
  const readOnly = !detached && !editUnlocked
  // See PkcsPipelineBuilder.tsx's identical readOnlyRef for the full
  // explanation: @monaco-editor/react's value-sync effect takes an unguarded
  // `setValue()` path while readOnly, and effect ordering can invoke a STALE
  // onChange closure comparing against an old `generatedPy` on any
  // programmatic value change made while read-only (import, discard,
  // successful "Try to apply") — wrongly flipping into detached state with
  // zero real keystrokes. A ref assigned synchronously during render is
  // always current regardless of which render's closure fires.
  const readOnlyRef = useRef(readOnly)
  readOnlyRef.current = readOnly

  return (
    <Tabs
      value={activeView}
      onValueChange={(v) => setActiveView(v as 'builder' | 'code')}
      className="flex flex-col h-[70vh] border rounded-lg overflow-hidden bg-background text-sm"
    >
      <div className="p-4 border-b flex justify-between items-center gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <input
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            aria-label="Pipeline name"
            className="text-lg font-semibold bg-transparent border border-transparent focus:border-input rounded px-1.5 py-0.5 w-full max-w-md outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importJson(f)
              e.target.value = ''
            }}
          />
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
          <Button
            data-tour="kmip-dev-run"
            size="sm"
            disabled={running}
            onClick={() => {
              void runAll()
            }}
            title={
              !detached && blocking.length
                ? `${blocking.length} problem(s) to fix first`
                : 'Run (⌘/Ctrl+Enter)'
            }
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1" />
            )}
            {running ? 'Running…' : 'Run'}
          </Button>
          <KmipSyncStatusChip detached={!!detached} />
          {/* data-tour scopes a guided-lesson `clickByText` to THIS tablist,
              distinct from any other `role="tab"` bar on the page. */}
          <TabsList data-tour="kmip-dev-view-tabs">
            <TabsTrigger value="builder">
              Builder · {steps.length} step{steps.length === 1 ? '' : 's'}
            </TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/* Save/Import/Export feedback and Run errors: rendered here, outside
          either TabsContent, so they're visible from both the Builder and
          Code tabs — same fix as Change 1 intended for the buttons that
          produce them (see that comment below). Previously lived inside the
          Code tab only, so a Builder-tab user (the default view) never saw
          a save confirmation or a run failure unless they happened to
          switch tabs. */}
      {notice && (
        <div className="px-4 py-2 text-xs font-mono text-status-info border-b">{notice}</div>
      )}
      {runError && (
        <div className="px-4 py-2.5 text-xs font-mono text-status-error bg-status-error/5 border-b border-destructive/25">
          ✗ {runError}
        </div>
      )}

      {/* Cross-plane audit trail for this tab's own activity — reuses
          AuditTrailPanel exactly as the manual workbench (plane=agility)
          renders it, one row per request with CACP (Plane 1 · Agility),
          KMIP (Plane 2), and PKCS#11 (Plane 3) side by side, since
          `engine` is the same per-tab singleton either plane uses. Visible
          from both Builder and Code tabs. */}
      <div className="border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowActivity((v) => !v)}
          className="w-full justify-start gap-1.5 px-4 py-2 h-auto rounded-none text-xs font-mono text-muted-foreground hover:text-foreground"
        >
          {showActivity ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          Session activity — CACP &amp; KMIP audit trail
          {audit.length > 0 && !showActivity && (
            <span className="ml-1 text-[10.5px]">({audit.length})</span>
          )}
        </Button>
        {showActivity && (
          <div className="px-4 pb-3 flex flex-col gap-2">
            {audit.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[10.5px]"
                  onClick={() => {
                    engine?.clearAudit()
                    setAudit([])
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
            <AuditTrailPanel events={audit} />
          </div>
        )}
      </div>

      {/* ── BUILDER TAB: palette | canvas | run panel — unchanged from before Change 1 ── */}
      <TabsContent value="builder" className="mt-0 flex-1 min-h-0">
        <div className="grid grid-cols-[280px_1fr_340px] gap-0 h-full overflow-hidden">
          {/* LEFT: palette + templates + saved */}
          <aside
            className="border-r p-3 overflow-auto flex flex-col gap-4"
            data-tour="kmip-dev-palette"
          >
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                Palette
              </div>
              <div className="text-xs text-muted-foreground">Drag onto the canvas →</div>
            </div>
            <div>
              <div className="text-[10.5px] font-semibold uppercase text-muted-foreground mb-1.5 px-1">
                Lifecycle primitives
              </div>
              <div className="flex flex-col gap-1">
                {KMIP_PRIM_IDS.map((id) => (
                  <KmipPaletteRow
                    key={id}
                    primId={id}
                    onDragStart={(e) => onPalettePrimDragStart(e, id)}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] font-semibold uppercase text-muted-foreground mb-1.5 px-1">
                Policy &amp; governance
              </div>
              <div className="flex flex-col gap-1">
                {SPECIAL_STEP_KINDS.map(({ kind, label }) => (
                  <KmipSpecialPaletteRow
                    key={kind}
                    label={label}
                    onDragStart={(e) => onPaletteSpecialDragStart(e, kind)}
                  />
                ))}
              </div>
            </div>
            <div className="mt-auto pt-3 border-t" data-tour="kmip-dev-templates">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                Start from
              </div>
              <div className="flex flex-col gap-1">
                {KMIP_TEMPLATE_NAMES.map((t) => (
                  <Button
                    key={t}
                    variant={t === pipelineName ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => applyTemplate(t)}
                    className="justify-start font-normal"
                  >
                    {t}
                  </Button>
                ))}
              </div>
              {savedKmipNames.length > 0 && (
                <>
                  <div className="text-xs font-semibold uppercase text-muted-foreground mt-3 mb-1.5">
                    Saved
                  </div>
                  <div className="flex flex-col gap-1">
                    {savedKmipNames.map((name) => (
                      <div key={name} className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadPipeline(name)}
                          className="flex-1 min-w-0 truncate justify-start font-normal"
                        >
                          {name}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSaved(name)}
                          className="px-1.5 text-status-error hover:opacity-80"
                          aria-label={`Delete saved pipeline ${name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </aside>

          {/* CENTER: canvas */}
          <main className="flex flex-col overflow-auto">
            <DevSandboxDiffNote
              points={[
                'KmipClient calls run in-page against the same wasm engine the rest of this KMIP/CACP playground uses — not a real TLS connection to a pqc-kmip server. Every operation still crosses the real crypto-agility policy plane; there is no network hop.',
                'load_policy()/dry_run()/policy_status() are hub-only convenience methods, not part of the real KmipClient. On the real system, policy load/dry-run is a separate REST/mTLS AdminClient, a different connection entirely.',
                "get_attributes() reads the engine's metadata view (algorithm/length/state/name/usageMask) rather than the real distinct GetAttributes wire operation — deliberately, after Get itself was found to correctly refuse a non-extractable private key's material.",
                "The Sign step's message can be text or hex (toggle below the input) — hex mode emits a genuinely binary Python bytes literal, not text encoded as hex. Encrypt/Decrypt steps aren't in this builder's vocabulary yet, so that half of the same capability isn't reachable here.",
              ]}
            />

            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Message to sign
                </div>
                <div className="flex gap-1">
                  {(['text', 'hex'] as const).map((m) => (
                    <Button
                      key={m}
                      variant={messageMode === m ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-6 px-2 text-[10px] uppercase"
                      onClick={() => {
                        setMessageMode(m)
                        setMessage('')
                      }}
                    >
                      {m}
                    </Button>
                  ))}
                </div>
              </div>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                aria-label="Message to sign"
                placeholder={messageMode === 'hex' ? 'hex bytes, e.g. deadbeef00' : undefined}
                className={`w-full font-mono text-xs bg-muted/40 border rounded px-2 py-1 outline-none ${messageError ? 'border-destructive/60' : ''}`}
              />
              {messageError && (
                <p className="mt-1 text-[10.5px] text-status-error font-mono">{messageError}</p>
              )}
              {messageMode === 'hex' && !messageError && (
                <p className="mt-1 text-[10.5px] text-muted-foreground">
                  Sign steps below emit <code>bytes.fromhex(...)</code> — a genuinely binary
                  payload, not text encoded as hex.
                </p>
              )}
            </div>

            <div
              className={`p-4 flex-1 overflow-auto ${detached ? 'opacity-40 pointer-events-none' : ''}`}
              data-tour="kmip-dev-steps"
            >
              <div className="max-w-2xl mx-auto flex flex-col items-center gap-0">
                {steps.length === 0 && (
                  <KmipDropZone
                    active={dragOverIndex === 0}
                    label="Drop a primitive or step here"
                    onDragOver={(e) => onDragOver(e, 0)}
                    onDrop={(e) => dropAt(e, 0)}
                  />
                )}
                {steps.map((step, i) => (
                  <div
                    key={step.id}
                    className="w-full flex flex-col items-center"
                    onDragOver={(e) => onDragOver(e, i)}
                    onDrop={(e) => dropAt(e, i)}
                  >
                    {dragOverIndex === i && <KmipInsertBar />}
                    <KmipStepCard
                      step={step}
                      index={i}
                      steps={steps}
                      stepState={stepState[step.id]}
                      findings={findings.filter((f) => f.stepIndex === i)}
                      onDelete={() => deleteStep(step.id)}
                      onDragStart={(e) => onStepDragStart(e, i)}
                      onOpChange={(op) => setStepOp(step.id, op)}
                      onParam={(name, v) => setParam(step.id, name, v)}
                      onPolicyFile={(f) => setPolicyFile(step.id, f)}
                      onDryRunOp={(op) => setDryRunOp(step.id, op)}
                      onDryRunAlgorithm={(a) => setDryRunAlgorithm(step.id, a)}
                      onDenyTarget={(t) => setDenyTarget(step.id, t)}
                    />
                  </div>
                ))}
                {steps.length > 0 && (
                  <div
                    className="w-full flex flex-col items-center"
                    onDragOver={(e) => onDragOver(e, steps.length)}
                    onDrop={(e) => dropAt(e, steps.length)}
                  >
                    {dragOverIndex === steps.length && <KmipInsertBar />}
                    <KmipDropZone
                      active={dragOverIndex === steps.length}
                      label="Drop here to append"
                      subtle
                    />
                  </div>
                )}
              </div>
              {elapsedMs != null && KMIP_TEMPLATE_OUTCOMES[pipelineName] && (
                <p className="max-w-2xl mx-auto mt-4 text-xs leading-relaxed text-muted-foreground">
                  <span className="text-status-success">What this proved: </span>
                  {KMIP_TEMPLATE_OUTCOMES[pipelineName]}
                </p>
              )}
            </div>
          </main>

          {/* RIGHT: run panel — summary + validation only, the editor lives in Code now */}
          <aside className="border-l p-4 flex flex-col gap-3 overflow-auto">
            <Card className="p-3.5">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Pipeline summary
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Steps</span>
                  <span className="font-mono">{steps.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <span className="font-mono">Python · pqctoday_kmip</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last run</span>
                  <span className="font-mono">
                    {elapsedMs != null ? `${(elapsedMs / 1000).toFixed(2)}s` : 'not run yet'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engine</span>
                  <span className="font-mono">
                    {engine ? 'KMIP/CACP (browser)' : 'initializing…'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeout</span>
                  <span className="font-mono">{TIMEOUT_LABEL[getInterruptMode()]}</span>
                </div>
              </div>
            </Card>

            <Card className="p-3.5">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Validation
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                {!detached && findings.length === 0 && (
                  <KmipValRow ok text="Every step input is bound" />
                )}
                {!detached &&
                  findings.map((f, i) => <KmipValRow key={i} ok={false} text={f.text} />)}
                {detached && <KmipValRow ok text="Custom script — builder validation skipped" />}
              </div>
            </Card>
          </aside>
        </div>
      </TabsContent>

      {/* ── CODE TAB: the editor at full width/height. Import/Export/Save/Run and
          the sync-status chip live in the persistent header above (visible from
          both tabs) since Change 1 — see the file-scope note there. ── */}
      <TabsContent value="code" className="mt-0 flex-1 min-h-0 flex flex-col">
        {/* Change 2: explicit "edit as custom script" gate — shown only while the
            editor is read-only-and-synced. */}
        {readOnly && (
          <div className="px-4 py-2 text-xs border-b flex items-center justify-between gap-3 flex-wrap">
            <span className="text-muted-foreground">
              Read-only — this is the code generated from the Builder.
            </span>
            <Button variant="outline" size="sm" onClick={() => setEditUnlocked(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit as custom script
            </Button>
          </div>
        )}

        {/* Change 2 (banner) + Change 3 (the "Try to apply" action) */}
        {detached && (
          <div className="px-4 py-2.5 text-xs bg-status-warning/5 border-b border-warning/25 flex flex-col gap-2">
            <span className="text-status-warning">
              ⚠ Custom script — edits won't appear in the Builder until resolved.
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={resyncToGenerated}>
                Discard edits, resync
              </Button>
              <Button variant="outline" size="sm" onClick={handleTryApply}>
                Try to apply to Builder
              </Button>
            </div>
            {applyMsg && (
              <div
                className={`font-mono text-[11px] ${applyMsg.kind === 'ok' ? 'text-status-success' : 'text-status-error'}`}
              >
                {applyMsg.kind === 'ok' ? '✓ ' : '✗ '}
                {applyMsg.text}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 p-4">
          <div className="h-full border rounded overflow-hidden">
            {monacoReady ? (
              <Editor
                height="100%"
                language="python"
                value={activeCode}
                theme="vs-dark"
                onChange={(val) => {
                  // Never trust a change reported while read-only — see
                  // readOnlyRef's comment above for why this must be a ref.
                  if (readOnlyRef.current) return
                  setApplyMsg(null)
                  if (val !== generatedPy) setDetached(val ?? '')
                  else setDetached(null)
                }}
                options={{
                  fontSize: 12,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  readOnly,
                }}
              />
            ) : (
              <div className="h-full grid place-items-center text-xs text-muted-foreground font-mono">
                Loading editor…
              </div>
            )}
          </div>
        </div>
        <div className="p-3 border-t">
          <Button variant="outline" size="sm" className="w-full" onClick={exportPy}>
            <Download className="h-3.5 w-3.5 mr-1" /> Download as .py
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}

/* ─── helpers ─── */

/** Change 2: see PkcsPipelineBuilder.tsx's identical SyncStatusChip — a small
 *  always-visible chip naming whether the Code tab is showing generated (synced)
 *  code or a hand-edited custom script, placed next to the Builder/Code switch. */
const KmipSyncStatusChip: React.FC<{ detached: boolean }> = ({ detached }) =>
  detached ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-status-warning/5 px-2 py-0.5 font-mono text-[10.5px] text-status-warning">
      ● custom script
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10.5px] text-muted-foreground">
      ✓ synced
    </span>
  )

const KmipInsertBar: React.FC = () => (
  <div className="w-full max-w-xl h-1 bg-status-info rounded-full mb-1" />
)

const KmipDropZone: React.FC<{
  active?: boolean
  label: string
  subtle?: boolean
  onDragOver?: React.DragEventHandler
  onDrop?: React.DragEventHandler
}> = ({ active, label, subtle, onDragOver, onDrop }) => (
  <div
    onDragOver={onDragOver}
    onDrop={onDrop}
    className={`w-full max-w-xl text-center rounded border border-dashed font-mono text-xs text-muted-foreground ${subtle ? 'py-2.5 mt-2' : 'py-6'} ${active ? 'border-info bg-status-info/5' : 'border-input'}`}
  >
    {label}
  </div>
)

const KmipPaletteRow: React.FC<{ primId: string; onDragStart: React.DragEventHandler }> = ({
  primId,
  onDragStart,
}) => {
  const spec = KMIP_PRIMITIVES[primId]
  const ops = opsFor(primId)
  return (
    <div
      draggable
      onDragStart={onDragStart}
      title={ops.length ? `Supports: ${ops.join(', ')}` : 'Not available in the pipeline builder'}
      className="flex items-center gap-2 px-2.5 py-1.5 border rounded bg-card cursor-grab"
    >
      <span className="text-muted-foreground text-[11px]">⋮⋮</span>
      <span className="font-mono text-xs">{spec?.label ?? primId}</span>
      <span className="font-mono text-[9.5px] text-muted-foreground ml-auto">
        {spec?.algorithm}
      </span>
    </div>
  )
}

const KmipSpecialPaletteRow: React.FC<{ label: string; onDragStart: React.DragEventHandler }> = ({
  label,
  onDragStart,
}) => (
  <div
    draggable
    onDragStart={onDragStart}
    className="flex items-center gap-2 px-2.5 py-1.5 border border-dashed rounded bg-card cursor-grab"
  >
    <span className="text-muted-foreground text-[11px]">⋮⋮</span>
    <span className="font-mono text-xs">{label}</span>
  </div>
)

interface KmipStepCardProps {
  step: KmipStep
  index: number
  steps: KmipStep[]
  stepState?: { status: KmipStepStatus; output: string | null }
  findings: Finding[]
  onDelete: () => void
  onDragStart: React.DragEventHandler
  onOpChange: (op: KmipOp) => void
  onParam: (name: string, v: KmipParamValue | undefined) => void
  onPolicyFile: (file: string) => void
  onDryRunOp: (op: string) => void
  onDryRunAlgorithm: (algorithm: string | undefined) => void
  onDenyTarget: (targetStepId: string) => void
}

const KmipStepCard: React.FC<KmipStepCardProps> = ({
  step,
  index,
  steps,
  stepState,
  findings,
  onDelete,
  onDragStart,
  onOpChange,
  onParam,
  onPolicyFile,
  onDryRunOp,
  onDryRunAlgorithm,
  onDenyTarget,
}) => {
  const statusStyle = stepState ? STATUS_STYLE[stepState.status] : null
  const borderColor = findings.length ? 'border-destructive/45' : 'border-border'
  const opSpec = step.kind === 'op' ? KMIP_PRIMITIVES[step.primId] : undefined
  const required =
    step.kind === 'op'
      ? Object.entries(opSpec?.ops[step.op]?.requires ?? {}).filter(([, kind]) => kind !== 'text')
      : []

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`w-full max-w-xl overflow-hidden rounded-lg border bg-card ${borderColor}`}
      data-tour={step.kind === 'expect-deny' ? 'kmip-dev-step-deny' : undefined}
    >
      <div className="p-3.5 flex items-start gap-3">
        <div className="w-6.5 h-6.5 rounded bg-muted grid place-items-center text-xs font-semibold font-mono flex-shrink-0 cursor-grab">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="font-mono text-[13px] font-semibold">{stepLabel(step)}</span>
            {step.kind === 'op' && (
              /* eslint-disable-next-line no-restricted-syntax -- FilterDropdown is a
                  page-level filter control (portal-rendered menu); this is a dense,
                  repeating inline chip inside a step card where a native select's
                  compact footprint and inline caret are the point. */
              <select
                value={step.op}
                onChange={(e) => onOpChange(e.target.value as KmipOp)}
                aria-label={`Operation for step ${index + 1}`}
                className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide bg-muted border cursor-pointer"
              >
                {opsFor(step.primId).map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            )}
            {statusStyle && (
              <span className={`ml-auto text-[9.5px] font-mono ${statusStyle.cls}`}>
                {statusStyle.label}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {step.kind === 'op' && required.length === 0 && (
              <span className="font-mono text-xs text-muted-foreground">no inputs</span>
            )}
            {step.kind === 'op' &&
              required.map(([name, kind]) => {
                if (!kind) return null
                const opts = optionsFor(kind, steps, index)
                const current = step.params[name]
                const currentKey = current ? JSON.stringify(current) : ''
                const known = opts.some((o) => JSON.stringify(o.value) === currentKey)
                return (
                  <KmipParamRow key={name} name={name}>
                    {/* eslint-disable-next-line no-restricted-syntax -- FilterDropdown's
                        onSelect(id: string) can't carry this option's value, a full
                        KmipParamValue object (a step reference/part pair, not a simple
                        string id) — the option's real identity IS that object, encoded
                        here as its JSON string only so the native select can compare it. */}
                    <select
                      className={`flex-1 min-w-0 bg-background border rounded px-1.5 py-0.5 text-xs font-mono ${known ? '' : 'text-status-error'}`}
                      aria-label={`${name} for step ${index + 1}`}
                      value={known ? currentKey : ''}
                      onChange={(e) =>
                        onParam(
                          name,
                          e.target.value
                            ? (JSON.parse(e.target.value) as KmipParamValue)
                            : undefined
                        )
                      }
                    >
                      <option value="">
                        {opts.length ? '— choose a source —' : '— nothing compatible earlier —'}
                      </option>
                      {opts.map((o) => (
                        <option key={o.label} value={JSON.stringify(o.value)}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </KmipParamRow>
                )
              })}

            {step.kind === 'load-policy' && (
              <KmipParamRow name="policy">
                {/* eslint-disable-next-line no-restricted-syntax -- dense, repeating
                    inline chip inside a step card; see the op selector above. */}
                <select
                  className="flex-1 min-w-0 bg-background border rounded px-1.5 py-0.5 text-xs font-mono"
                  aria-label={`Policy file for step ${index + 1}`}
                  value={step.policyFile}
                  onChange={(e) => onPolicyFile(e.target.value)}
                >
                  {POLICY_PRESETS.map((p) => (
                    <option key={p.file} value={p.file}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </KmipParamRow>
            )}

            {step.kind === 'dry-run' && (
              <>
                <KmipParamRow name="op">
                  {/* eslint-disable-next-line no-restricted-syntax -- dense, repeating
                      inline chip inside a step card; see the op selector above. */}
                  <select
                    className="flex-1 min-w-0 bg-background border rounded px-1.5 py-0.5 text-xs font-mono"
                    aria-label={`Dry-run operation for step ${index + 1}`}
                    value={step.op}
                    onChange={(e) => onDryRunOp(e.target.value)}
                  >
                    {KMIP_DRY_RUN_OPS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </KmipParamRow>
                <KmipParamRow name="algorithm">
                  {/* eslint-disable-next-line no-restricted-syntax -- dense, repeating
                      inline chip inside a step card; see the op selector above. */}
                  <select
                    className="flex-1 min-w-0 bg-background border rounded px-1.5 py-0.5 text-xs font-mono"
                    aria-label={`Dry-run algorithm for step ${index + 1}`}
                    value={step.algorithm ?? ''}
                    onChange={(e) => onDryRunAlgorithm(e.target.value || undefined)}
                  >
                    <option value="">— any —</option>
                    {KMIP_DRY_RUN_ALGORITHMS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </KmipParamRow>
              </>
            )}

            {step.kind === 'expect-deny' && (
              <KmipParamRow name="target">
                {/* eslint-disable-next-line no-restricted-syntax -- dense, repeating
                    inline chip inside a step card; see the op selector above. */}
                <select
                  className="flex-1 min-w-0 bg-background border rounded px-1.5 py-0.5 text-xs font-mono"
                  aria-label={`Target step for step ${index + 1}`}
                  value={step.targetStepId}
                  onChange={(e) => onDenyTarget(e.target.value)}
                >
                  <option value="">— choose an earlier operation —</option>
                  {steps
                    .slice(0, index)
                    .map((s, si) =>
                      s.kind === 'op' ? (
                        <option key={s.id} value={s.id}>{`${si + 1}. ${stepLabel(s)}`}</option>
                      ) : null
                    )}
                </select>
              </KmipParamRow>
            )}
          </div>

          {findings.map((f, i) => (
            <div key={i} className="font-mono text-[10.5px] text-status-error mt-1.5">
              ✗ {f.text}
            </div>
          ))}
          {stepState?.output && (
            <pre className="mt-2.5 p-2 bg-muted rounded text-[10.5px] font-mono whitespace-pre-wrap max-h-40 overflow-auto">
              <span className={stepState.status === 'error' ? 'text-status-error' : ''}>
                {stepState.output}
              </span>
            </pre>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-status-error hover:opacity-80 flex-shrink-0 h-auto w-auto p-1"
          onClick={onDelete}
          aria-label={`Remove step ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

const KmipParamRow: React.FC<{ name: string; children: React.ReactNode }> = ({
  name,
  children,
}) => (
  <div className="flex items-center gap-2">
    <span className="font-mono text-[10.5px] text-muted-foreground w-[78px] flex-shrink-0 text-right">
      {name}
    </span>
    {children}
  </div>
)

const KmipValRow: React.FC<{ ok?: boolean; text: string }> = ({ ok, text }) => (
  <div className="flex gap-2 items-start">
    <span
      className={`w-3.5 h-3.5 rounded-full grid place-items-center text-[9px] flex-shrink-0 mt-0.5 ${ok ? 'bg-status-success/15 text-status-success' : 'bg-status-error/15 text-status-error'}`}
    >
      {ok ? '✓' : '!'}
    </span>
    <span className={ok ? 'text-muted-foreground' : 'text-status-error'}>{text}</span>
  </div>
)
