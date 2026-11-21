// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, ShieldAlert, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  evaluateControlCombination,
  type AccountProfileId,
  type CombinationSelection,
} from './frostPolicyHelpers'

interface CombinationBuilderProps {
  initialPreset?: string
}

const ACCOUNT_PROFILES: { id: AccountProfileId; label: string; description: string }[] = [
  {
    id: 'treasury',
    label: 'Institutional Treasury Vault',
    description: 'High-value multi-approver treasury with governance & proxy-upgrade risks.',
  },
  {
    id: 'exchange-hot',
    label: 'Exchange Hot Withdrawal Service',
    description: 'Automated withdrawal service facing compromised API/deployment threats.',
  },
  {
    id: 'cold-vault',
    label: 'Long-Term Cold Reserve',
    description: 'Infrequent moves requiring durable recovery quorum & physical duress defense.',
  },
]

export const CombinationBuilderWorkshop: React.FC<CombinationBuilderProps> = ({
  initialPreset,
}) => {
  const [selection, setSelection] = useState<CombinationSelection>({
    accountProfile:
      initialPreset === 'treasury' ||
      initialPreset === 'exchange-hot' ||
      initialPreset === 'cold-vault'
        ? initialPreset
        : 'treasury',
    hasInBoundaryPolicyHsm: true,
    hasMpcSeparateDomains: false,
    hasEnclaveCosigner: false,
    hasAttestedApproverDisplay: false,
    hasTimelockAndExpiry: false,
  })

  const evaluation = evaluateControlCombination(selection)

  const toggle = (key: keyof Omit<CombinationSelection, 'accountProfile'>) => {
    setSelection((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers size={16} className="text-primary" aria-hidden="true" />
            1. Select Account Type &amp; Control Stack
          </h3>
          <span className="text-xs font-semibold text-primary">
            {evaluation.blockedCount} / {evaluation.incidentStatuses.length} Incident Patterns
            Mitigated
          </span>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
          role="group"
          aria-label="Account profile"
        >
          {ACCOUNT_PROFILES.map((prof) => (
            <Button
              key={prof.id}
              variant={selection.accountProfile === prof.id ? 'default' : 'outline'}
              onClick={() => setSelection((prev) => ({ ...prev, accountProfile: prof.id }))}
              className="h-auto p-3 flex flex-col items-start text-left whitespace-normal"
            >
              <span className="text-xs font-bold">{prof.label}</span>
              <span className="text-[11px] opacity-80 mt-1">{prof.description}</span>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {(
            [
              {
                key: 'hasInBoundaryPolicyHsm',
                label: 'HSM with In-Boundary Policy Code (e.g., SKA / FM)',
              },
              {
                key: 'hasMpcSeparateDomains',
                label: 'MPC Shares in Separate Trust Domains (DKG, t > 1)',
              },
              {
                key: 'hasEnclaveCosigner',
                label: 'Mandatory Attested Enclave Policy Co-Signer',
              },
              {
                key: 'hasAttestedApproverDisplay',
                label: 'Attested Approver Devices (Trusted Clear-Signing Display)',
              },
              {
                key: 'hasTimelockAndExpiry',
                label: 'Time Locks + Short Approval Expiry + Nonce Binding',
              },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/20 cursor-pointer text-xs text-foreground"
            >
              <input
                type="checkbox"
                checked={selection[item.key]}
                onChange={() => toggle(item.key)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Incident Pattern Evaluation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {evaluation.incidentStatuses.map((status) => (
          <div
            key={status.id}
            className={`p-4 rounded-xl border space-y-1.5 ${
              status.blocked
                ? 'bg-status-success/10 border-status-success/30'
                : 'bg-status-warning/10 border-status-warning/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {status.blocked ? (
                <CheckCircle2
                  size={16}
                  className="text-status-success shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <ShieldAlert
                  size={16}
                  className="text-status-warning shrink-0"
                  aria-hidden="true"
                />
              )}
              <h4 className="text-xs font-bold text-foreground">{status.pattern}</h4>
            </div>
            <p className="text-xs text-muted-foreground">{status.explanation}</p>
          </div>
        ))}
      </div>

      {/* Rule G1 + Residual Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="glass-panel p-4 space-y-2">
          <h4 className="font-bold text-foreground">Rule G1 Authority Assumptions Required</h4>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            {evaluation.g1Assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
        <div className="glass-panel p-4 space-y-2">
          <h4 className="font-bold text-foreground">Residual Risks Still Remaining</h4>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            {evaluation.residualRisks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
