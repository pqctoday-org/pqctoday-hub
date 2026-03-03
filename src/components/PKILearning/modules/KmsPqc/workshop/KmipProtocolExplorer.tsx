// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
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

const OperationSimulator: React.FC = () => {
  const [selectedOp, setSelectedOp] = useState<KmipOperation>(KMIP_OPERATIONS[0])
  const [selectedProvider, setSelectedProvider] = useState('aws-kms')
  const [showResponse, setShowResponse] = useState(false)

  const providerApi = selectedOp.providerApis[selectedProvider]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Globe size={18} className="text-primary" />
        <h3 className="text-lg font-bold text-foreground">KMIP Operation Simulator</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Compare the same key operation expressed as KMIP v2.1 XML vs. provider-specific API calls.
        KMIP provides a single vendor-neutral interface — each provider translates it into their
        native API.
      </p>

      {/* Operation selector */}
      <div className="flex flex-wrap gap-2">
        {KMIP_OPERATIONS.map((op) => (
          <button
            key={op.id}
            onClick={() => {
              setSelectedOp(op)
              setShowResponse(false)
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              selectedOp.id === op.id
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
            }`}
          >
            {op.name}
          </button>
        ))}
      </div>

      <p className="text-sm text-foreground/80">{selectedOp.description}</p>

      {/* Side-by-side: KMIP XML vs Provider API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* KMIP XML */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              KMIP v2.1 XML
            </span>
            <button
              onClick={() => setShowResponse(!showResponse)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              {showResponse ? 'Show Request' : 'Show Response'}
              {showResponse ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          <pre className="bg-muted/30 rounded-lg p-4 text-xs overflow-x-auto border border-border font-mono leading-relaxed max-h-[400px] overflow-y-auto">
            <code>{showResponse ? selectedOp.kmipResponse : selectedOp.kmipXml}</code>
          </pre>
        </div>

        {/* Provider API */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Provider API
            </span>
            <div className="flex gap-1 ml-auto">
              {Object.keys(PROVIDER_LABELS).map((id) => (
                <button
                  key={id}
                  onClick={() => setSelectedProvider(id)}
                  className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                    selectedProvider === id
                      ? 'bg-accent/10 text-accent border-accent/30'
                      : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                  }`}
                >
                  {PROVIDER_LABELS[id].short}
                </button>
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
        KMIP 2.1 extends the <code className="text-primary">CryptographicAlgorithm</code>{' '}
        enumeration with PQC key types. This table shows how each algorithm maps to KMIP enums and
        which providers support them.
      </p>

      <div className="flex gap-2">
        {(['all', 'KEM', 'Signature'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFamilyFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              familyFilter === f
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
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
            <strong>Buffer sizing alert:</strong> ML-KEM-1024 secret keys (3,168 B) are 99x larger
            than ECDH P-256 (32 B). KMIP message buffers, TLS record sizes, and database columns
            must be pre-configured for PQC payloads before migration.
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
        Walk through a real-world scenario: a KMIP orchestrator managing an ML-KEM-768 key lifecycle
        across an on-prem HSM, AWS KMS, and Google Cloud KMS simultaneously.
      </p>

      {/* Step timeline */}
      <div className="flex gap-1 overflow-x-auto">
        {KMIP_SYNC_SCENARIO.map((step) => (
          <button
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
          </button>
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
            <button
              onClick={() => {
                const next = KMIP_SYNC_SCENARIO.find((s) => s.id === activeStep.id + 1)
                if (next) setActiveStep(next)
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors text-sm font-medium mt-2"
            >
              Next Step <ArrowRight size={14} />
            </button>
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
              <button
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
                      <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[10px] font-medium border border-destructive/20">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </button>
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
            <button
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
            </button>
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
