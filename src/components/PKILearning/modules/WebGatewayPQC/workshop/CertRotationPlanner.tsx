// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useMemo } from 'react'
import { CalendarDays, AlertTriangle } from 'lucide-react'
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
  { id: 'hybrid-ecdsa-ml-dsa-44', label: 'RFC 10073 ML-DSA-44 + ECDSA P-256' },
]

const ILLUSTRATIVE_LEAF_BYTES: Record<string, number> = {
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
  const [stagingRecord, setStagingRecord] = useState(false)
  const [publicLogRequired, setPublicLogRequired] = useState(false)
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

    const currentLeafSize = ILLUSTRATIVE_LEAF_BYTES[currentAlgo] || 400
    const targetLeafSize = ILLUSTRATIVE_LEAF_BYTES[targetAlgo] || 5700
    const leafSizeMultiplier = targetLeafSize / currentLeafSize

    // Discrete batches conserve the selected node count, including small estates.
    const pilotNodes = Math.min(nodes, Math.max(1, Math.ceil(nodes * 0.05)))
    const nextNodes = Math.min(nodes - pilotNodes, Math.ceil(nodes * 0.5))
    const finalNodes = nodes - pilotNodes - nextNodes

    // Existing teaching durations define one sequential sample schedule.
    const phaseTemplates = [
      {
        label: 'Preparation',
        days: Math.min(14, paceDays),
        description: 'Verify CA PQC support, test in staging',
      },
      {
        label: 'Pilot',
        days: Math.ceil(paceDays * 0.1),
        description: `Planned batch: ${pilotNodes} ${pilotNodes === 1 ? 'node' : 'nodes'}; monitor sample rollout outcomes.`,
      },
      {
        label: 'Next batch',
        days: Math.ceil(paceDays * 0.4),
        description:
          nextNodes > 0
            ? `Planned batch: ${nextNodes} ${nextNodes === 1 ? 'node' : 'nodes'}.`
            : 'No nodes assigned to this batch; adapt its template duration.',
      },
      {
        label: 'Final batch',
        days: Math.ceil(paceDays * 0.5),
        description:
          finalNodes > 0
            ? `Planned batch: ${finalNodes} remaining ${finalNodes === 1 ? 'node' : 'nodes'}.`
            : 'No nodes assigned to this batch; adapt its template duration.',
      },
    ]
    let elapsedDays = 0
    const phases = phaseTemplates.map((phase) => {
      const startDay = elapsedDays
      elapsedDays += phase.days
      return { ...phase, startDay, endDay: elapsedDays }
    })
    const preparationDays = phases[0].days
    const rolloutDays = phases.slice(1).reduce((sum, phase) => sum + phase.days, 0)

    return {
      nodeCount: nodes,
      pilotNodes,
      nextNodes,
      finalNodes,
      preparationDays,
      rolloutDays,
      totalPlanDays: elapsedDays,
      totalCerts,
      dailyRenewalRate,
      peakDailyRenewals,
      leafSizeMultiplier,
      phases,
    }
  }, [edgeNodes, certsPerNode, validity, currentAlgo, targetAlgo, rolloutPace])

  const enrollmentMatches = stagingRecord && targetAlgo === 'ml-dsa-65' && renewal === 'acme'

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        This sequential sample schedule is a teaching template, not a measurement of security
        exposure or proof of completed deployment. Preparation is additional to the selected rollout
        duration. Empty batches retain template time and must be adapted for an actual plan.
      </p>
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
            ariaLabel="Renewal method"
            hideDefaultOption
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
            ariaLabel="Target certificate profile"
            hideDefaultOption
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
          <div className="text-2xl font-bold text-status-warning">{plan.rolloutDays}d</div>
          <div className="text-xs text-muted-foreground">Sample Rollout Duration</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-foreground">
            {plan.leafSizeMultiplier.toFixed(1)}&times;
          </div>
          <div className="text-xs text-muted-foreground">Assumed leaf size ratio</div>
        </div>
      </div>

      {/* Migration Timeline (Gantt-like) */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Illustrative Rollout Schedule</h3>
        </div>

        <p className="text-xs text-muted-foreground">
          {plan.preparationDays} preparation days + {plan.rolloutDays} rollout days ={' '}
          {plan.totalPlanDays} total planned days. The final planned milestone is day{' '}
          {plan.totalPlanDays}; this does not establish when a deployed estate is protected.
        </p>
        <p className="text-xs text-muted-foreground">
          Node allocation: {plan.pilotNodes} pilot + {plan.nextNodes} next + {plan.finalNodes} final
          = {plan.nodeCount} {plan.nodeCount === 1 ? 'node' : 'nodes'}.
        </p>
        <div className="space-y-2">
          {plan.phases.map((phase, idx) => {
            const widthPercent = (phase.days / plan.totalPlanDays) * 100
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
                  <span className="text-muted-foreground">
                    {phase.days} days · planned day {phase.startDay}–{phase.endDay}
                  </span>
                </div>
                <div className="relative h-6 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${colors[idx]} rounded-full flex items-center px-2`}
                    style={{ width: `${widthPercent}%` }}
                  >
                    <span className="text-[10px] text-primary-foreground font-medium truncate">
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
        <section className="glass-panel space-y-2 p-4" aria-labelledby="gateway-renewal-evidence">
          <h3 id="gateway-renewal-evidence" className="text-sm font-bold">
            Check the renewal evidence
          </h3>
          <p className="text-sm">
            The fictional Northstar staging CA record covers an ACME renewal for an ML-DSA-65 leaf
            and a successful verification by an internal staging client. The record covers an
            internal trust anchor and includes no public log acceptance result.
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={stagingRecord}
              onChange={(event) => setStagingRecord(event.target.checked)}
            />
            Use the Northstar staging ACME record
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={publicLogRequired}
              onChange={(event) => setPublicLogRequired(event.target.checked)}
            />
            The deployment requires evidence from a public CT log
          </label>
          <p role="status" aria-label="Renewal evidence decision" className="text-sm font-semibold">
            {enrollmentMatches
              ? publicLogRequired
                ? 'Staging renewal matches. Public CT log acceptance still needs evidence.'
                : 'The record supports this internal staging renewal.'
              : 'The selected record does not establish renewal for this profile and method.'}
          </p>
          {targetAlgo === 'hybrid-ecdsa-ml-dsa-44' && (
            <p className="text-xs text-muted-foreground">
              RFC 10073 specifies a 1,377-byte composite public-key payload and a variable composite
              signature up to 2,492 bytes for this profile. These payload sizes exclude the
              surrounding X.509 encoding and chain.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            The ratio above uses illustrative leaf file sizes. For a real rollout, exercise the
            exact CA profile, enrollment client and relying party. Check the intended log separately
            when policy requires public logging.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <a
              className="text-primary underline"
              href="https://www.rfc-editor.org/rfc/rfc8555.html#section-7.4"
            >
              ACME order finalization
            </a>
            <a
              className="text-primary underline"
              href="https://www.rfc-editor.org/rfc/rfc9162.html#section-4.2"
            >
              CT log acceptance criteria
            </a>
            <a
              className="text-primary underline"
              href="https://www.rfc-editor.org/rfc/rfc10073.html#appendix-A"
            >
              Composite encoding sizes
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
