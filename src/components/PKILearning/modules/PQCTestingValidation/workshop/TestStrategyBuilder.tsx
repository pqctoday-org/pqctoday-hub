// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import {
  ClipboardList,
  CheckCircle,
  Clock,
  Wrench,
  Flag,
  Building2,
  Cloud,
  Factory,
  Smartphone,
} from 'lucide-react'
import {
  STRATEGY_MATRIX,
  type MigrationPhase,
  type EnvironmentType,
  type ComplianceDeadline,
} from '../data/testingConstants'

const PHASE_OPTIONS: { id: MigrationPhase; label: string; description: string }[] = [
  { id: 'inventory', label: 'Inventory', description: 'Discover and classify all crypto assets' },
  {
    id: 'lab-test',
    label: 'Lab Testing',
    description: 'Validate PQC performance and interop in isolated lab',
  },
  {
    id: 'pilot',
    label: 'Pilot Rollout',
    description: 'Limited production deployment with monitoring',
  },
  {
    id: 'production',
    label: 'Full Production',
    description: 'Enterprise-wide PQC enforcement and ongoing compliance',
  },
]

const ENV_OPTIONS: { id: EnvironmentType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'enterprise',
    label: 'Enterprise / On-Premises',
    icon: <Building2 size={20} className="text-primary" />,
  },
  {
    id: 'cloud-native',
    label: 'Cloud-Native / Kubernetes',
    icon: <Cloud size={20} className="text-primary" />,
  },
  { id: 'ot-ics', label: 'OT / ICS / SCADA', icon: <Factory size={20} className="text-primary" /> },
  {
    id: 'embedded',
    label: 'Embedded / IoT',
    icon: <Smartphone size={20} className="text-primary" />,
  },
]

const DEADLINE_OPTIONS: {
  id: ComplianceDeadline
  label: string
  urgency: 'high' | 'medium' | 'low'
}[] = [
  { id: 'eu-2026', label: 'EU 2026 Crypto Inventory (NIS2)', urgency: 'high' },
  { id: 'nist-2030', label: 'NIST 2030 Deprecation (RSA/ECDH)', urgency: 'medium' },
  { id: 'nist-2035', label: 'NIST 2035 Prohibition', urgency: 'low' },
]

const URGENCY_COLORS: Record<string, string> = {
  high: 'text-destructive bg-destructive/10 border-destructive/30',
  medium: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  low: 'text-status-success bg-status-success/10 border-status-success/30',
}

const TOOL_TYPE = (tool: string): 'open-source' | 'commercial' => {
  const openSource = [
    'pqc-flow',
    'pqcscan',
    'CBOMkit',
    'SSLyze',
    'PQC Network Scanner',
    'PQC-LEO',
    'OQS Test Server',
    'ChipWhisperer',
    'OQS-Envoy',
    'SCANOSS',
    'Syft',
    'Binwalk',
    'Ghidra crypto plugin',
    'crypto-detector',
    'Wireshark OQS',
    'cosign (ML-DSA)',
    'OPA/Kyverno PQC policy',
    'Argo Rollouts',
  ]
  return openSource.some((s) => tool.includes(s)) ? 'open-source' : 'commercial'
}

export const TestStrategyBuilder: React.FC = () => {
  const [phase, setPhase] = useState<MigrationPhase>('inventory')
  const [environment, setEnvironment] = useState<EnvironmentType>('enterprise')
  const [deadline, setDeadline] = useState<ComplianceDeadline>('nist-2030')

  const steps = useMemo(() => STRATEGY_MATRIX[phase][environment] ?? [], [phase, environment])

  const selectedDeadline = DEADLINE_OPTIONS.find((d) => d.id === deadline)!

  const allTools = useMemo(() => {
    const set = new Set<string>()
    steps.forEach((s) => s.tools.forEach((t) => set.add(t)))
    return [...set]
  }, [steps])

  const openSourceTools = allTools.filter((t) => TOOL_TYPE(t) === 'open-source')
  const commercialTools = allTools.filter((t) => TOOL_TYPE(t) === 'commercial')

  return (
    <div className="space-y-6">
      {/* Tool banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <ClipboardList size={16} className="text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Strategy Builder:</span> Configure your
          migration phase, environment type, and compliance deadline. The builder generates a
          prioritized test sequence with recommended tools and go/no-go gates.
        </p>
      </div>

      {/* Phase selector */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Migration Phase:</span>
        <div className="grid sm:grid-cols-4 gap-2">
          {PHASE_OPTIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPhase(p.id)}
              className={`text-left p-3 rounded-lg border transition-all ${
                phase === p.id
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-muted/30 border-border hover:border-border/80'
              }`}
            >
              <div className="font-semibold text-xs text-foreground mb-0.5">{p.label}</div>
              <div className="text-[10px] text-muted-foreground">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Environment selector */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Environment Type:</span>
        <div className="grid sm:grid-cols-2 gap-2">
          {ENV_OPTIONS.map((e) => (
            <button
              key={e.id}
              onClick={() => setEnvironment(e.id)}
              className={`text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
                environment === e.id
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-muted/30 border-border hover:border-border/80'
              }`}
            >
              <span className="shrink-0">{e.icon}</span>
              <span className="font-semibold text-xs text-foreground">{e.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Deadline selector */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Compliance Deadline:</span>
        <div className="flex flex-wrap gap-2">
          {DEADLINE_OPTIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDeadline(d.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                deadline === d.id
                  ? `${URGENCY_COLORS[d.urgency]} font-semibold`
                  : 'bg-background/60 text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div
          className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${URGENCY_COLORS[selectedDeadline.urgency]}`}
        >
          <Flag size={11} />
          {selectedDeadline.urgency.toUpperCase()} urgency — {selectedDeadline.label}
        </div>
      </div>

      {/* Generated test sequence */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CheckCircle size={14} className="text-primary" />
          Generated Test Sequence — {PHASE_OPTIONS.find((p) => p.id === phase)?.label} /{' '}
          {ENV_OPTIONS.find((e) => e.id === environment)?.label}
        </h3>

        {steps.length > 0 ? (
          steps.map((step) => (
            <div key={step.order} className="p-4 rounded-lg border border-border bg-card space-y-3">
              {/* Step header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary border border-primary/30 flex items-center justify-center text-xs font-bold">
                    {step.order}
                  </div>
                  <span className="font-semibold text-sm text-foreground">{step.method}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Clock size={11} />
                  {step.effort}
                </div>
              </div>

              {/* Tools */}
              <div className="flex flex-wrap gap-1.5 pl-10">
                {step.tools.map((tool) => (
                  <span
                    key={tool}
                    className={`text-xs px-2 py-0.5 rounded border font-medium ${
                      TOOL_TYPE(tool) === 'open-source'
                        ? 'bg-status-success/10 text-status-success border-status-success/30'
                        : 'bg-status-info/10 text-status-info border-status-info/30'
                    }`}
                  >
                    {tool}
                  </span>
                ))}
              </div>

              {/* Go/no-go gate */}
              <div className="flex items-start gap-2 pl-10 pt-1 border-t border-border/50">
                <Flag size={12} className="text-primary mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Go gate: </span>
                  <span className="text-muted-foreground">{step.gateCondition}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 rounded-lg border border-border bg-muted/30 text-center text-xs text-muted-foreground">
            No test sequence defined for this combination yet
          </div>
        )}
      </div>

      {/* Tool inventory */}
      {allTools.length > 0 && (
        <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Wrench size={13} className="text-primary" />
            Tool Inventory for this Strategy
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-status-success mb-1.5">
                Open Source ({openSourceTools.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {openSourceTools.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded border bg-status-success/10 text-status-success border-status-success/30"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-status-info mb-1.5">
                Commercial ({commercialTools.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {commercialTools.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded border bg-status-info/10 text-status-info border-status-info/30"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
