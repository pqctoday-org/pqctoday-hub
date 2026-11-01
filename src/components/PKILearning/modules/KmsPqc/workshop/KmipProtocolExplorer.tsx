// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useEffect, useMemo, useState } from 'react'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import {
  Globe,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
  Shield,
  Server,
  Cloud,
  AlertTriangle,
} from 'lucide-react'
import {
  KMIP_OPERATIONS,
  KMIP_PQC_KEY_TYPES,
  KMIP_SYNC_SCENARIO,
  KMIP_READINESS_CHECKLIST,
  type KmipOperation,
  type KmipSyncStep,
} from '../data/kmsConstants'
import { Button } from '@/components/ui/button'
import { AuditTrailPanel } from '@/components/Playground/kmip/AuditTrailPanel'
import type { AuditEvent, KmipEngine, OpResult } from '@/wasm/kmip/kmipEngine'

const PROVIDER_LABELS: Record<string, { name: string; short: string }> = {
  'aws-kms': { name: 'AWS KMS', short: 'AWS' },
  'hashicorp-vault': { name: 'HashiCorp Vault', short: 'Vault' },
  'thales-ciphertrust': { name: 'Thales CipherTrust', short: 'Thales' },
}

const STATUS_STYLES: Record<string, string> = {
  GA: 'bg-success/10 text-success border-success/20',
  Preview: 'bg-primary/10 text-primary border-primary/20',
  Experimental: 'bg-warning/10 text-warning border-warning/20',
  Planned: 'bg-muted/50 text-muted-foreground border-border',
  'N/A': 'bg-muted/30 text-muted-foreground border-border',
  'Via Luna HSM': 'bg-primary/10 text-primary border-primary/20',
  'Hybrid TLS only': 'bg-primary/10 text-primary border-primary/20',
  'Hybrid TLS (GA)': 'bg-success/10 text-success border-success/20',
  'TLS Preview': 'bg-primary/10 text-primary border-primary/20',
  Available: 'bg-success/10 text-success border-success/20',
}

function getStatusStyle(status: string): string {
  return STATUS_STYLES[status] ?? 'bg-muted/30 text-muted-foreground border-border'
}

// ── Section 1: KMIP Operation Simulator ──────────────────────────────────────

const LIVE_EXERCISE_LABELS: Record<string, string> = {
  create: 'CreateKeyPair (ML-KEM-768)',
  get: 'CreateKeyPair → Get',
  activate: 'CreateKeyPair → Activate',
  wrap: 'CreateKeyPair → Activate → Encapsulate',
  rotate: 'CreateKeyPair → create replacement key pair',
  destroy: 'CreateKeyPair → Destroy',
}

const OperationSimulator: React.FC = () => {
  const [selectedOp, setSelectedOp] = useState<KmipOperation>(KMIP_OPERATIONS[0])
  const [selectedProvider, setSelectedProvider] = useState('aws-kms')
  const [showResponse, setShowResponse] = useState(false)
  const [engine, setEngine] = useState<KmipEngine | null>(null)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [liveResult, setLiveResult] = useState<OpResult | null>(null)
  const [liveAudit, setLiveAudit] = useState<AuditEvent[]>([])

  const providerApi = selectedOp.providerApis[selectedProvider]

  useEffect(() => {
    let mounted = true
    // Keep the top-level-await WASM engine out of this learning module's
    // static dependency graph. A static import changes Vite's shared-chunk
    // ordering and can expose the CACP route before its KMIP tables are ready.
    void import('@/wasm/kmip/kmipEngine')
      .then(({ getKmipEngine }) => getKmipEngine())
      .then((loaded) => {
        if (mounted) setEngine(loaded)
      })
      .catch((error: unknown) => {
        if (mounted)
          setEngineError(
            error instanceof Error ? error.message : 'The local KMIP engine failed to load.'
          )
      })
    return () => {
      mounted = false
    }
  }, [])

  const runLiveExercise = () => {
    if (!engine) return
    setRunning(true)
    setEngineError(null)
    setLiveResult(null)
    setLiveAudit([])
    try {
      const results: OpResult[] = []
      const run = (spec: Parameters<KmipEngine['runOp']>[0]) => {
        const result = engine.runOp(spec)
        results.push(result)
        if (!result.ok) throw new Error(result.message || `${spec.op} failed`)
        return result
      }
      const createPair = () => {
        const result = run({
          op: 'CreateKeyPair',
          algorithm: 'ML-KEM-768',
          name: `learn-${selectedOp.id}`,
        })
        const privateKeyUid = String(result.summary.privateKeyUid || '')
        const publicKeyUid = String(result.summary.publicKeyUid || '')
        if (!privateKeyUid || !publicKeyUid)
          throw new Error('The engine did not return both key identifiers.')
        return { privateKeyUid, publicKeyUid, result }
      }

      let finalResult: OpResult
      const pair = createPair()
      switch (selectedOp.id) {
        case 'get':
          finalResult = run({ op: 'Get', uid: pair.privateKeyUid })
          break
        case 'activate':
          finalResult = run({ op: 'Activate', uid: pair.privateKeyUid })
          break
        case 'wrap':
          run({ op: 'Activate', uid: pair.publicKeyUid })
          finalResult = run({ op: 'Encapsulate', uid: pair.publicKeyUid })
          break
        case 'rotate':
          finalResult = createPair().result
          break
        case 'destroy':
          finalResult = run({ op: 'Destroy', uid: pair.privateKeyUid })
          break
        default:
          finalResult = pair.result
      }
      setLiveResult(finalResult)
      setLiveAudit(results.flatMap((result) => result.audit))
    } catch (error: unknown) {
      setEngineError(error instanceof Error ? error.message : 'The local KMIP exercise failed.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Globe size={18} className="text-primary" />
        <h3 className="text-lg font-bold text-foreground">KMIP Operation Lab</h3>
      </div>
      <VendorCoverageNotice migrateLayer="Security Stack" migrateDomain="kms" className="mb-2" />
      <p className="text-sm text-muted-foreground">
        Compare illustrative KMIP v3.0 XML with provider-specific API examples, then execute the
        lifecycle concept in the browser-local KMIP/PKCS#11 engine. No cloud account or provider API
        is contacted.
      </p>

      {/* Operation selector */}
      <div className="flex flex-wrap gap-2">
        {KMIP_OPERATIONS.map((op) => (
          <Button
            variant="ghost"
            key={op.id}
            onClick={() => {
              setSelectedOp(op)
              setShowResponse(false)
              setLiveResult(null)
              setLiveAudit([])
              setEngineError(null)
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              selectedOp.id === op.id
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
            }`}
          >
            {op.name}
          </Button>
        ))}
      </div>

      <p className="text-sm text-foreground/80">{selectedOp.description}</p>

      {/* Side-by-side: KMIP XML vs Provider API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* KMIP XML */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Illustrative KMIP v3.0 XML
            </span>
            <Button
              variant="ghost"
              onClick={() => setShowResponse(!showResponse)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              {showResponse ? 'Show Request' : 'Show Response'}
              {showResponse ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </Button>
          </div>
          <pre className="bg-muted/30 rounded-lg p-4 text-xs overflow-x-auto border border-border font-mono leading-relaxed max-h-[400px] overflow-y-auto">
            <code>{showResponse ? selectedOp.kmipResponse : selectedOp.kmipXml}</code>
          </pre>
        </div>

        {/* Provider API */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Illustrative provider API
            </span>
            <div className="flex gap-1 ml-auto">
              {Object.keys(PROVIDER_LABELS).map((id) => (
                <Button
                  variant="ghost"
                  key={id}
                  onClick={() => setSelectedProvider(id)}
                  className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                    selectedProvider === id
                      ? 'bg-accent/10 text-accent border-accent/30'
                      : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                  }`}
                >
                  {PROVIDER_LABELS[id].short}
                </Button>
              ))}
            </div>
          </div>
          {providerApi ? (
            <pre className="bg-muted/30 rounded-lg p-4 text-xs overflow-x-auto border border-border font-mono leading-relaxed max-h-[400px] overflow-y-auto">
              <code>{providerApi.code}</code>
            </pre>
          ) : (
            <div className="bg-muted/30 rounded-lg p-4 border border-border flex items-center justify-center min-h-[100px]">
              <p className="text-sm text-muted-foreground">
                No equivalent API available for this provider
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Live browser-local exercise
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {LIVE_EXERCISE_LABELS[selectedOp.id] ?? 'CreateKeyPair (ML-KEM-768)'}
            </p>
            <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
              This path builds and dispatches real KMIP requests through the local policy plane and
              PKCS#11-backed WebAssembly engine. It does not execute the provider examples above.
            </p>
            {(selectedOp.id === 'wrap' || selectedOp.id === 'rotate') && (
              <p className="mt-1 text-xs text-warning">
                {selectedOp.id === 'wrap'
                  ? 'The runnable analogue demonstrates ML-KEM encapsulation, not KMIP Get-with-KeyWrappingSpecification.'
                  : 'The runnable analogue creates a replacement pair; it does not claim to implement KMIP ReKey semantics.'}
              </p>
            )}
          </div>
          <Button onClick={runLiveExercise} disabled={!engine || running}>
            {running && <Loader2 size={14} className="mr-2 animate-spin" />}
            {engine ? `Run ${selectedOp.name}` : 'Loading engine…'}
          </Button>
        </div>

        {engineError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-status-error">
            {engineError}
          </div>
        )}
        {liveResult && (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="min-w-0 rounded-lg border border-border bg-background/70 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <CheckCircle2 size={14} className="text-success" />
                <span className="text-sm font-semibold text-foreground">
                  {liveResult.operation} · {liveResult.status}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {liveResult.responseWireLen} response bytes
                </span>
              </div>
              <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/40 p-2 text-[10px] text-muted-foreground">
                {JSON.stringify(liveResult.summary, null, 2)}
              </pre>
            </div>
            <div className="min-w-0 rounded-lg border border-border bg-background/70 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Causal trace · policy → KMIP → PKCS#11
              </p>
              <AuditTrailPanel events={liveAudit} detailed />
            </div>
          </div>
        )}
      </div>

      {/* Insight callout */}
      <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80">
            <strong>Key insight:</strong> KMIP normalizes the <em>what</em> (create a PQC key) while
            each provider controls the <em>how</em> (API format, authentication, HSM backing). This
            is why KMIP orchestrators like CipherTrust or Vault can centralize policy across
            heterogeneous backends.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Section 2: PQC Key Type Mapping ──────────────────────────────────────────

const PqcKeyTypeMapping: React.FC = () => {
  const [familyFilter, setFamilyFilter] = useState<'all' | 'KEM' | 'Signature'>('all')

  const filtered = useMemo(
    () =>
      familyFilter === 'all'
        ? KMIP_PQC_KEY_TYPES
        : KMIP_PQC_KEY_TYPES.filter((k) => k.family === familyFilter),
    [familyFilter]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={18} className="text-primary" />
        <h3 className="text-lg font-bold text-foreground">PQC Key Type Mapping</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        KMIP 3.0 extends the <code className="text-primary">CryptographicAlgorithm</code>{' '}
        enumeration with PQC key types. This table shows how each algorithm maps to KMIP enums and
        which providers support them.
      </p>

      <div className="flex gap-2">
        {(['all', 'KEM', 'Signature'] as const).map((f) => (
          <Button
            variant="ghost"
            key={f}
            onClick={() => setFamilyFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              familyFilter === f
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-muted-foreground font-medium">KMIP Enum</th>
              <th className="text-left py-2 px-2 text-muted-foreground font-medium">Standard</th>
              <th className="text-left py-2 px-2 text-muted-foreground font-medium">Level</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Public Key</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Secret Key</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium whitespace-nowrap">
                {familyFilter === 'KEM' ? 'CT' : familyFilter === 'Signature' ? 'Sig' : 'CT/Sig'}
              </th>
              {Object.keys(PROVIDER_LABELS).map((id) => (
                <th
                  key={id}
                  className="text-center py-2 px-2 text-muted-foreground font-medium whitespace-nowrap"
                >
                  {PROVIDER_LABELS[id].short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((kt) => (
              <tr key={kt.kmipEnum} className="border-b border-border/50 hover:bg-muted/20">
                <td className="py-2 px-2 font-mono font-bold text-foreground">{kt.kmipEnum}</td>
                <td className="py-2 px-2 text-muted-foreground">{kt.nistStandard}</td>
                <td className="py-2 px-2">
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
                    L{kt.securityLevel}
                  </span>
                </td>
                <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                  {kt.publicKeyBytes.toLocaleString()} B
                </td>
                <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                  {kt.secretKeyBytes.toLocaleString()} B
                </td>
                <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                  {kt.artifactBytes.toLocaleString()} B
                </td>
                {Object.keys(PROVIDER_LABELS).map((id) => {
                  const status = kt.providerSupport[id] ?? 'N/A'
                  return (
                    <td key={id} className="py-2 px-2 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded border text-[10px] font-medium whitespace-nowrap ${getStatusStyle(status)}`}
                      >
                        {status}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-warning/5 rounded-lg p-3 border border-warning/10">
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80">
            <strong>Buffer sizing alert:</strong> ML-KEM-1024 secret keys (3,168 B, FIPS 203) are
            99x larger than ECDH P-256 secret keys (32 B). This module&apos;s advice: KMIP message
            buffers, TLS record sizes, and database columns should be sized for PQC payloads before
            migration.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Section 3: Cross-Provider Key Sync ───────────────────────────────────────

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'success') return <CheckCircle2 size={14} className="text-success" />
  if (status === 'in-progress') return <Loader2 size={14} className="text-primary animate-spin" />
  return <Clock size={14} className="text-muted-foreground" />
}

const ProviderIcon: React.FC<{ name: string }> = ({ name }) => {
  if (name.includes('HSM')) return <Server size={14} className="text-muted-foreground" />
  return <Cloud size={14} className="text-muted-foreground" />
}

const CrossProviderSync: React.FC = () => {
  const [activeStep, setActiveStep] = useState<KmipSyncStep>(KMIP_SYNC_SCENARIO[0])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Server size={18} className="text-primary" />
        <h3 className="text-lg font-bold text-foreground">Cross-Provider Key Sync</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Walk through an illustrative deployment scenario: a KMIP orchestrator managing an ML-KEM-768
        key lifecycle across an on-prem HSM, AWS KMS, and Google Cloud KMS. These backend statuses
        are teaching examples, not live provider telemetry.
      </p>

      {/* Step timeline */}
      <div className="flex gap-1 overflow-x-auto">
        {KMIP_SYNC_SCENARIO.map((step) => (
          <Button
            variant="ghost"
            key={step.id}
            onClick={() => setActiveStep(step)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors ${
              activeStep.id === step.id
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-background border border-current flex items-center justify-center text-[10px] font-bold">
              {step.id}
            </span>
            {step.title.split(' ').slice(0, 2).join(' ')}
          </Button>
        ))}
      </div>

      {/* Active step detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: description + KMIP snippet */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Step {activeStep.id}: {activeStep.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">{activeStep.description}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              KMIP Request (abbreviated)
            </span>
            <pre className="bg-muted/30 rounded-lg p-3 text-xs font-mono border border-border mt-1">
              <code>{activeStep.kmipSnippet}</code>
            </pre>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <span className="text-[10px] font-medium text-muted-foreground">Orchestrator</span>
            <p className="text-sm font-bold text-foreground">{activeStep.orchestrator}</p>
          </div>
        </div>

        {/* Right: provider status cards */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
            Backend Status
          </span>
          {activeStep.targets.map((target) => {
            const status = activeStep.statuses[target] ?? 'pending'
            return (
              <div
                key={target}
                className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 border border-border"
              >
                <ProviderIcon name={target} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{target}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{status}</p>
                </div>
                <StatusIcon status={status} />
              </div>
            )
          })}

          {activeStep.id < KMIP_SYNC_SCENARIO.length && (
            <Button
              variant="ghost"
              onClick={() => {
                const next = KMIP_SYNC_SCENARIO.find((s) => s.id === activeStep.id + 1)
                if (next) setActiveStep(next)
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors text-sm font-medium mt-2"
            >
              Next Step <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Section 4: Migration Readiness Checklist ─────────────────────────────────

const ReadinessChecklist: React.FC = () => {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const total = KMIP_READINESS_CHECKLIST.length
  const completed = checked.size
  const criticalTotal = KMIP_READINESS_CHECKLIST.filter((i) => i.critical).length
  const criticalDone = KMIP_READINESS_CHECKLIST.filter(
    (i) => i.critical && checked.has(i.id)
  ).length

  const categories = useMemo(() => {
    const map = new Map<string, typeof KMIP_READINESS_CHECKLIST>()
    for (const item of KMIP_READINESS_CHECKLIST) {
      const arr = map.get(item.category) ?? []
      arr.push(item)
      map.set(item.category, arr)
    }
    return map
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 size={18} className="text-primary" />
        <h3 className="text-lg font-bold text-foreground">KMIP PQC Migration Readiness</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Use this checklist to evaluate your organization&apos;s readiness for KMIP-based PQC key
        management. Critical items must be resolved before deployment.
      </p>

      {/* Progress bar */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>
            Overall: {completed}/{total} complete
          </span>
          <span className={criticalDone === criticalTotal ? 'text-success' : 'text-warning'}>
            Critical: {criticalDone}/{criticalTotal}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Checklist by category */}
      {Array.from(categories.entries()).map(([category, items]) => (
        <div key={category}>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {category}
          </h4>
          <div className="space-y-2">
            {items.map((item) => (
              <Button
                variant="ghost"
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  checked.has(item.id)
                    ? 'bg-success/5 border-success/20'
                    : 'bg-muted/20 border-border hover:bg-muted/30'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    checked.has(item.id) ? 'bg-success border-success text-black' : 'border-border'
                  }`}
                >
                  {checked.has(item.id) && <CheckCircle2 size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${checked.has(item.id) ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                    >
                      {item.title}
                    </span>
                    {item.critical && (
                      <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-status-error text-[10px] font-medium border border-destructive/20">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      ))}

      {completed === total && (
        <div className="bg-success/10 rounded-lg p-4 border border-success/20 text-center">
          <CheckCircle2 size={24} className="text-success mx-auto mb-2" />
          <p className="text-sm font-bold text-success">
            All readiness checks complete! Your environment is ready for KMIP-based PQC key
            management.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export const KmipProtocolExplorer: React.FC = () => {
  const [activeSection, setActiveSection] = useState(0)

  const sections = [
    { label: 'Operations', icon: Globe },
    { label: 'Key Types', icon: Shield },
    { label: 'Sync', icon: Server },
    { label: 'Readiness', icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6">
      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {sections.map((s, idx) => {
          const Icon = s.icon
          return (
            <Button
              variant="ghost"
              key={s.label}
              onClick={() => setActiveSection(idx)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                activeSection === idx
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
              }`}
            >
              <Icon size={14} />
              {s.label}
            </Button>
          )
        })}
      </div>

      {/* Section content */}
      {activeSection === 0 && <OperationSimulator />}
      {activeSection === 1 && <PqcKeyTypeMapping />}
      {activeSection === 2 && <CrossProviderSync />}
      {activeSection === 3 && <ReadinessChecklist />}
    </div>
  )
}
