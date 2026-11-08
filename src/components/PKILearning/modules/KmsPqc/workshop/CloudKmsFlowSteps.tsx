// SPDX-License-Identifier: AGPL-3.0-only
import { Lock, Network, ShieldAlert, ShieldCheck, Shield } from 'lucide-react'
import {
  ACTOR_LABEL,
  KEY_LOCATION_LABEL,
  QUANTUM_SAFE_LABEL,
  type ExchangeFlow,
  type KeyLocation,
  type QuantumSafe,
} from '../data/cloudKmsExchangeData'
import type { StepObservations } from '../services/cloudKmsExchange'
import { cn } from '@/lib/utils'

const LOCATION_ICON: Record<KeyLocation, typeof Lock> = {
  'inside-hsm': Lock,
  'in-transit': Network,
  'caller-memory': ShieldAlert,
}

const SAFE_ICON: Record<QuantumSafe, typeof Lock> = {
  yes: ShieldCheck,
  no: ShieldAlert,
  'not-applicable': Shield,
}

const SAFE_CLASS: Record<QuantumSafe, string> = {
  yes: 'text-status-success',
  no: 'text-status-error',
  'not-applicable': 'text-muted-foreground',
}

interface FlowStepsProps {
  flow: ExchangeFlow
  /** Lines measured by the last run of this flow, keyed by step id. */
  observations?: StepObservations
}

export function CloudKmsFlowSteps({ flow, observations }: FlowStepsProps) {
  return (
    <ol className="space-y-3" aria-label={`${flow.title}: steps`}>
      {flow.steps.map((step, i) => {
        const LocIcon = LOCATION_ICON[step.keyLocation]
        const SafeIcon = SAFE_ICON[step.quantumSafe]
        const measured = observations?.[step.id]
        return (
          <li key={step.id} className="rounded-lg border border-border/60 p-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="font-semibold">
                Step {i + 1} of {flow.steps.length}
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5">{ACTOR_LABEL[step.actor]}</span>
            </div>
            <h5 className="mt-1.5 text-sm font-semibold">{step.title}</h5>
            <p className="mt-0.5 break-all font-mono text-xs text-primary">{step.apiName}</p>
            {step.params.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                {step.params.map((p) => (
                  <li key={p} className="break-words font-mono">
                    {p}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-sm text-muted-foreground">{step.detail}</p>
            <div className="mt-2 flex flex-col gap-1 text-xs sm:flex-row sm:flex-wrap sm:gap-x-4">
              <span className="flex items-center gap-1.5">
                <LocIcon size={14} aria-hidden="true" className="shrink-0" />
                <span>
                  <span className="sr-only">Where the key sits: </span>
                  {KEY_LOCATION_LABEL[step.keyLocation]}
                </span>
              </span>
              <span className={cn('flex items-center gap-1.5', SAFE_CLASS[step.quantumSafe])}>
                <SafeIcon size={14} aria-hidden="true" className="shrink-0" />
                <span>{QUANTUM_SAFE_LABEL[step.quantumSafe]}</span>
              </span>
            </div>
            {measured && measured.length > 0 && (
              <div className="mt-2 rounded-md bg-muted/30 p-2">
                <p className="text-xs font-semibold">Measured in this run</p>
                <ul className="mt-1 space-y-1 text-xs">
                  {measured.map((line) => (
                    <li key={line} className="break-words">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
