// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { CalendarDays, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'

const EDGE_NODE_OPTIONS = [
  { id: '1', label: '1 node' },
  { id: '10', label: '10 nodes' },
  { id: '50', label: '50 nodes' },
  { id: '200', label: '200 nodes' },
  { id: '500', label: '500 nodes' },
]

const CERTS_PER_NODE_OPTIONS = [
  { id: '1', label: '1 cert' },
  { id: '10', label: '10 certs' },
  { id: '100', label: '100 certs' },
  { id: '1000', label: '1,000 certs' },
]

const VALIDITY_OPTIONS = [
  { id: '90', label: '90 days' },
  { id: '365', label: '1 year' },
  { id: '730', label: '2 years' },
]

const RENEWAL_METHODS = [
  { id: 'acme', label: 'ACME (Automated)' },
  { id: 'manual', label: 'Manual' },
  { id: 'vendor', label: 'Vendor-Managed' },
]

const ALGORITHM_OPTIONS = [
  { id: 'rsa-2048', label: 'RSA-2048' },
  { id: 'ecdsa-p256', label: 'ECDSA P-256' },
  { id: 'ml-dsa-44', label: 'ML-DSA-44' },
  { id: 'ml-dsa-65', label: 'ML-DSA-65' },
  { id: 'hybrid-ecdsa-ml-dsa-44', label: 'ECDSA + ML-DSA-44 (Hybrid)' },
]

const CT_LOG_ENTRY_SIZES: Record<string, number> = {
  'rsa-2048': 900,
  'ecdsa-p256': 400,
  'ml-dsa-44': 4100,
  'ml-dsa-65': 5700,
  'hybrid-ecdsa-ml-dsa-44': 4500,
}

const ROLLOUT_PACE_OPTIONS = [
  { id: '30', label: 'Aggressive (30 days)' },
  { id: '90', label: 'Moderate (90 days)' },
  { id: '180', label: 'Conservative (180 days)' },
]

export const CertRotationPlanner: React.FC = () => {
  const [edgeNodes, setEdgeNodes] = useState('10')
  const [certsPerNode, setCertsPerNode] = useState('10')
  const [validity, setValidity] = useState('90')
  const [renewal, setRenewal] = useState('acme')
  const [currentAlgo, setCurrentAlgo] = useState('ecdsa-p256')
  const [targetAlgo, setTargetAlgo] = useState('ml-dsa-65')
  const [rolloutPace, setRolloutPace] = useState('90')

  const plan = useMemo(() => {
    const nodes = parseInt(edgeNodes)
    const certs = parseInt(certsPerNode)
    const validDays = parseInt(validity)
    const paceDays = parseInt(rolloutPace)

    const totalCerts = nodes * certs
    const dailyRenewalRate = Math.ceil(totalCerts / validDays)
    const peakDailyRenewals = Math.ceil(dailyRenewalRate * 1.5)

    // CT log impact
    const currentCtSize = CT_LOG_ENTRY_SIZES[currentAlgo] || 400
    const targetCtSize = CT_LOG_ENTRY_SIZES[targetAlgo] || 5700
    const ctImpactMultiplier = targetCtSize / currentCtSize

    // Migration timeline
    const nodesPerDay = Math.max(1, Math.ceil(nodes / paceDays))
    const migrationDays = Math.ceil(nodes / nodesPerDay)

    // Risk window: during migration, some certs are still classical
    const riskWindowDays = migrationDays

    // ACME compatibility
    const acmeSupported =
      targetAlgo === 'ecdsa-p256' ||
      targetAlgo === 'rsa-2048' ||
      targetAlgo === 'hybrid-ecdsa-ml-dsa-44'
    const pqcAcmeExperimental = targetAlgo === 'ml-dsa-44' || targetAlgo === 'ml-dsa-65'

    // Gantt-like phases
    const phases = [
      {
        label: 'Preparation',
        days: Math.min(14, paceDays),
        description: 'Verify CA PQC support, test in staging',
      },
      {
        label: 'Pilot (5% of nodes)',
        days: Math.ceil(paceDays * 0.1),
        description: `Migrate ${Math.max(1, Math.ceil(nodes * 0.05))} nodes, monitor errors`,
      },
      {
        label: 'Ramp-up (50%)',
        days: Math.ceil(paceDays * 0.4),
        description: `Migrate ${Math.ceil(nodes * 0.5)} nodes at ${nodesPerDay} nodes/day`,
      },
      {
        label: 'Full rollout (100%)',
        days: Math.ceil(paceDays * 0.5),
        description: `Complete remaining ${Math.ceil(nodes * 0.45)} nodes`,
      },
    ]

    return {
      totalCerts,
      dailyRenewalRate,
      peakDailyRenewals,
      ctImpactMultiplier,
      migrationDays,
      riskWindowDays,
      acmeSupported,
      pqcAcmeExperimental,
      nodesPerDay,
      phases,
    }
  }, [edgeNodes, certsPerNode, validity, currentAlgo, targetAlgo, rolloutPace])

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <div className="text-xs font-bold text-foreground mb-1">Edge Nodes / PoPs</div>
          <FilterDropdown
            items={EDGE_NODE_OPTIONS}
            selectedId={edgeNodes}
            onSelect={setEdgeNodes}
            noContainer
          />
        </div>
        <div>
          <div className="text-xs font-bold text-foreground mb-1">Certs per Node</div>
          <FilterDropdown
            items={CERTS_PER_NODE_OPTIONS}
            selectedId={certsPerNode}
            onSelect={setCertsPerNode}
            noContainer
          />
        </div>
        <div>
          <div className="text-xs font-bold text-foreground mb-1">Validity Period</div>
          <FilterDropdown
            items={VALIDITY_OPTIONS}
            selectedId={validity}
            onSelect={setValidity}
            noContainer
          />
        </div>
        <div>
          <div className="text-xs font-bold text-foreground mb-1">Renewal Method</div>
          <FilterDropdown
            items={RENEWAL_METHODS}
            selectedId={renewal}
            onSelect={setRenewal}
            noContainer
          />
        </div>
        <div>
          <div className="text-xs font-bold text-foreground mb-1">Current Algorithm</div>
          <FilterDropdown
            items={ALGORITHM_OPTIONS.filter((a) => a.id === 'rsa-2048' || a.id === 'ecdsa-p256')}
            selectedId={currentAlgo}
            onSelect={setCurrentAlgo}
            noContainer
          />
        </div>
        <div>
          <div className="text-xs font-bold text-foreground mb-1">Target Algorithm</div>
          <FilterDropdown
            items={ALGORITHM_OPTIONS.filter((a) => a.id !== 'rsa-2048' && a.id !== 'ecdsa-p256')}
            selectedId={targetAlgo}
            onSelect={setTargetAlgo}
            noContainer
          />
        </div>
      </div>

      {/* Rollout Pace */}
      <div>
        <div className="text-xs font-bold text-foreground mb-1">Rollout Pace</div>
        <FilterDropdown
          items={ROLLOUT_PACE_OPTIONS}
          selectedId={rolloutPace}
          onSelect={setRolloutPace}
          noContainer
        />
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-foreground">
            {plan.totalCerts.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">Total Certs</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{plan.dailyRenewalRate}</div>
          <div className="text-xs text-muted-foreground">Daily Renewals</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-status-warning">{plan.riskWindowDays}d</div>
          <div className="text-xs text-muted-foreground">Risk Window</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-foreground">
            {plan.ctImpactMultiplier.toFixed(1)}&times;
          </div>
          <div className="text-xs text-muted-foreground">CT Log Impact</div>
        </div>
      </div>

      {/* Migration Timeline (Gantt-like) */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Migration Timeline</h3>
        </div>

        <div className="space-y-2">
          {plan.phases.map((phase, idx) => {
            const totalDays = plan.phases.reduce((sum, p) => sum + p.days, 0)
            const widthPercent = totalDays > 0 ? (phase.days / totalDays) * 100 : 25
            const colors = [
              'bg-status-info',
              'bg-status-warning',
              'bg-primary',
              'bg-status-success',
            ]
            return (
              <div key={phase.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{phase.label}</span>
                  <span className="text-muted-foreground">{phase.days} days</span>
                </div>
                <div className="relative h-6 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${colors[idx]} rounded-full flex items-center px-2`}
                    style={{ width: `${Math.max(widthPercent, 10)}%` }}
                  >
                    <span className="text-[10px] text-black font-medium truncate">
                      {phase.days}d
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{phase.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Warnings & Compatibility */}
      <div className="space-y-2">
        {renewal === 'manual' && plan.totalCerts > 100 && (
          <div className="flex items-start gap-2 bg-status-warning/10 rounded-lg p-3 border border-status-warning/20">
            <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
            <span className="text-sm text-foreground">
              Manual renewal of {plan.totalCerts.toLocaleString()} certificates is operationally
              risky. Consider switching to ACME automation.
            </span>
          </div>
        )}
        {plan.pqcAcmeExperimental && (
          <div className="flex items-start gap-2 bg-status-warning/10 rounded-lg p-3 border border-status-warning/20">
            <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
            <span className="text-sm text-foreground">
              Pure PQC ACME issuance ({targetAlgo}) is experimental. Verify your CA supports PQC
              certificate issuance before migrating.
            </span>
          </div>
        )}
        {plan.acmeSupported && (
          <div className="flex items-start gap-2 bg-status-success/10 rounded-lg p-3 border border-status-success/20">
            <CheckCircle2 size={14} className="text-status-success shrink-0 mt-0.5" />
            <span className="text-sm text-foreground">
              {targetAlgo} is supported by major CAs for ACME-based issuance.
            </span>
          </div>
        )}
        {plan.ctImpactMultiplier > 5 && (
          <div className="flex items-start gap-2 bg-status-info/10 rounded-lg p-3 border border-status-info/20">
            <AlertTriangle size={14} className="text-status-info shrink-0 mt-0.5" />
            <span className="text-sm text-foreground">
              CT log entries will be {plan.ctImpactMultiplier.toFixed(1)}&times; larger with{' '}
              {targetAlgo}. This increases CT log bandwidth and monitoring costs.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
